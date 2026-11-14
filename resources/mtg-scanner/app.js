(async function () {
  'use strict';
  const C = window.MTGScannerCore;
  const STORAGE_KEY = 'dipiazza-mtg-scanner-v1';
  const DEFAULT_STATE = { decks: [], settings: { threshold: 2, needSound: true, valueSound: true, printingOcr: false, performanceVersion: 3 } };
  const PROFILE_URL = 'https://moxfield.com/users/codegoat29';
  const PROFILE_DECKS = [
    ['Heaven\'s Gate: All Members Must Ascend - Clavileño, First of the Blessed', 'https://moxfield.com/decks/u3c9DNw2hUKUeywURgZe8Q'],
    ['My Counters are Saved to the Cloud - Skullbriar, the Walking Grave', 'https://moxfield.com/decks/v4XpqhWtHkeoDX6Gv9wfoA'],
    ['Prospect commanders', 'https://moxfield.com/decks/Hm_yD1yLCkCiHffyIfDCqg'],
    ['The Undead Avengers - Zombie Scarlet Witch', 'https://moxfield.com/decks/9iBgtt4OAkip0DL0gyegoQ'],
    ['OnlyMoths: 18+ Rads Only - The Wise Mothman', 'https://moxfield.com/decks/L6HvOVoq1k6d9QeXd8Ct_w'],
    ['You are Overencumbered With 1/1s - Casar Legion\'s Emperor', 'https://moxfield.com/decks/fSOhAW212X6-MJDN1Teecg'],
    ['PRECON - Peace Offering - Ms. Bumbleflower', 'https://moxfield.com/decks/GSbizXqL7Eixmx5E82jA6A']
  ];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const money = value => Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Price unavailable';
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  let state = loadState();
  let catalog = null; let catalogEntries = []; let catalogLookup = new Map();
  let stream = null; let worker = null; let workerPromise = null; let scanning = false;
  let editingDeckId = null; let resultCard = null; let exactPrinting = null; let resultAlerted = { need: false, value: false };
  let ambiguityShownAt = 0; let ambiguityDismissedUntil = 0;
  let audioContext = null; let alertTimer = null;

  const refs = {
    status: $('#app-status'), scanState: $('#scan-state'), camera: $('#camera'), cameraStage: $('#camera-stage'), cameraMessage: $('#camera-message'), canvas: $('#ocr-canvas'),
    start: $('#start-scan'), scan: $('#scan-card'), stop: $('#stop-scan'), speed: $('#scan-speed'), result: $('#scan-result'), ambiguous: $('#ambiguous'), candidates: $('#candidate-list'),
    cameraRecognition: $('#camera-recognition'), cameraName: $('#camera-card-name'), cameraMeta: $('#camera-card-meta'),
    alert: $('#scan-alert'), alertLabel: $('#scan-alert-label'), alertName: $('#scan-alert-name'), alertDetail: $('#scan-alert-detail'),
    searchForm: $('#manual-search'), searchInput: $('#card-search'), searchResults: $('#search-results'), deckList: $('#deck-list'), wantedList: $('#wanted-list'),
    deckForm: $('#deck-form'), deckName: $('#deck-name'), deckUrl: $('#deck-url'), deckExport: $('#deck-export'), importReport: $('#import-report')
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.decks)) return structuredClone(DEFAULT_STATE);
      const loaded = { ...DEFAULT_STATE, ...saved, settings: { ...DEFAULT_STATE.settings, ...(saved.settings || {}) } };
      if (loaded.settings.performanceVersion !== 3) {
        loaded.settings.printingOcr = false;
        if (Number(loaded.settings.threshold) === 5) loaded.settings.threshold = 2;
        loaded.settings.performanceVersion = 3;
      }
      return loaded;
    } catch { return structuredClone(DEFAULT_STATE); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderCounts(); }
  function seedProfileDecks() {
    let changed = false;
    PROFILE_DECKS.forEach(([name, url]) => {
      if (state.decks.some(deck => deck.url === url)) return;
      state.decks.push({ id: crypto.randomUUID(), name, url, profileUrl: PROFILE_URL, sourceText: '', includeSideboard: false, includeMaybeboard: false, lastSuccessfulImport: null, cards: [], profileSeed: true });
      changed = true;
    });
    if (changed) saveState();
  }
  function setStatus(message, tone = '') { refs.status.textContent = message; refs.status.dataset.tone = tone; }
  function setScanState(message, tone = '') { refs.scanState.textContent = message; refs.scanState.className = `status-pill ${tone}`.trim(); }

  function openCatalogDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('dipiazza-mtg-scanner', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('catalog');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
  }
  async function readCatalogCache() {
    try { const db = await openCatalogDb(); return await new Promise((resolve, reject) => { const request = db.transaction('catalog').objectStore('catalog').get('current'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    catch { return null; }
  }
  async function writeCatalogCache(value) {
    try { const db = await openCatalogDb(); await new Promise((resolve, reject) => { const request = db.transaction('catalog', 'readwrite').objectStore('catalog').put(value, 'current'); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
    catch { /* HTTP cache still provides a fallback. */ }
  }
  async function loadCatalog(force = false) {
    setStatus('Loading the local Scryfall catalog…');
    let data = force ? null : await readCatalogCache();
    if (!data) {
      const response = await fetch(`/resources/mtg-scanner/catalog.json${force ? `?refresh=${Date.now()}` : ''}`);
      if (!response.ok) throw new Error('Card catalog download failed.');
      data = await response.json(); await writeCatalogCache(data);
    }
    catalog = data; catalogEntries = data.cards;
    catalogLookup = new Map();
    data.cards.forEach(card => { catalogLookup.set(C.normalizeName(card.n), card); (card.a || []).forEach(alias => catalogLookup.set(C.normalizeName(alias), card)); });
    const date = new Date(data.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    setStatus(`${data.cards.length.toLocaleString()} card identities ready · prices dated ${date}`);
    $('#catalog-details').textContent = `${data.source}. ${data.cards.length.toLocaleString()} card identities; price snapshot ${date}. Stored in this browser for fast matching.`;
    renderAll();
  }

  function showTab(name) {
    $$('.scanner-tabs button').forEach(button => { const active = button.dataset.tab === name; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    $$('.tab-panel').forEach(panel => { const active = panel.dataset.panel === name; panel.hidden = !active; panel.classList.toggle('active', active); });
    if (name === 'wanted') renderWanted(); if (name === 'decks') renderDecks();
  }

  function renderCounts() {
    $('#deck-count').textContent = state.decks.length;
    $('#wanted-count').textContent = state.decks.reduce((total, deck) => total + deck.cards.filter(card => card.quantity > (card.owned || 0)).length, 0);
  }
  function deckTotals(deck) {
    return deck.cards.reduce((totals, card) => { totals.deck += card.quantity; totals.owned += Math.min(card.quantity, card.owned || 0); totals.need += Math.max(0, card.quantity - (card.owned || 0)); return totals; }, { deck: 0, owned: 0, need: 0 });
  }
  function renderDecks() {
    if (!state.decks.length) { refs.deckList.innerHTML = '<div class="deck-card"><h3>No decks yet</h3><p class="deck-meta">Add Phenax, Clavileño, or any Moxfield deck export.</p></div>'; return; }
    refs.deckList.innerHTML = state.decks.map(deck => {
      const totals = deckTotals(deck); const imported = deck.lastSuccessfulImport ? `Last successful import ${new Date(deck.lastSuccessfulImport).toLocaleString()}` : 'Public Moxfield deck';
      const totalsHtml = deck.lastSuccessfulImport ? `<div class="deck-totals"><span><strong>${totals.deck}</strong>deck qty</span><span><strong>${totals.owned}</strong>owned</span><span><strong>${totals.need}</strong>needed</span></div>` : '';
      return `<article class="deck-card ${deck.lastSuccessfulImport ? '' : 'profile-deck'}" data-deck="${escapeHtml(deck.id)}"><h3>${escapeHtml(deck.name)}</h3><p class="deck-meta">${escapeHtml(imported)}</p>${totalsHtml}${deck.url ? `<a class="deck-view" href="${escapeHtml(deck.url)}" target="_blank" rel="noopener">View deck on Moxfield <span aria-hidden="true">→</span></a>` : ''}<div class="deck-actions"><button data-action="reimport">${deck.lastSuccessfulImport ? 'Refresh card list' : 'Enable card matching'}</button>${deck.profileUrl ? '' : '<button data-action="delete">Delete</button>'}</div></article>`;
    }).join('');
  }
  function renderWanted() {
    const wanted = state.decks.flatMap(deck => deck.cards.filter(card => card.quantity > (card.owned || 0)).map(card => ({ deck, card })));
    if (!wanted.length) { refs.wantedList.innerHTML = '<div class="wanted-card"><div><h3>Nothing needed yet</h3><p>Import a deck or adjust owned counts.</p></div></div>'; return; }
    refs.wantedList.innerHTML = wanted.sort((a, b) => a.card.name.localeCompare(b.card.name)).map(({ deck, card }) => `<article class="wanted-card" data-deck="${escapeHtml(deck.id)}" data-card="${escapeHtml(card.oracleId || C.normalizeName(card.name))}"><div><h3>${escapeHtml(card.name)}</h3><p>${escapeHtml(deck.name)} · deck ${card.quantity} · owned ${card.owned || 0} · need ${Math.max(0, card.quantity - (card.owned || 0))}</p><p>Shopping list: ${card.shopping || 0}</p></div><div class="quantity-control"><button data-adjust="owned" data-delta="-1" aria-label="Remove owned copy">−</button><strong>${card.owned || 0}</strong><button data-adjust="owned" data-delta="1" aria-label="Add owned copy">+</button></div></article>`).join('');
  }
  function renderAll() { renderCounts(); renderDecks(); renderWanted(); if (resultCard) renderResult(resultCard, exactPrinting); }

  function openDeckForm(deck = null) {
    editingDeckId = deck?.id || null; refs.deckForm.hidden = false;
    $('#deck-form-title').textContent = deck ? `Refresh ${deck.name}` : 'Import a deck';
    refs.deckName.value = deck?.name || ''; refs.deckUrl.value = deck?.url || ''; refs.deckExport.value = deck?.sourceText || '';
    $('#include-sideboard').checked = Boolean(deck?.includeSideboard); $('#include-maybeboard').checked = Boolean(deck?.includeMaybeboard);
    refs.importReport.textContent = ''; refs.importReport.className = 'import-report'; refs.deckUrl.focus();
  }
  function closeDeckForm() { refs.deckForm.hidden = true; editingDeckId = null; }
  function reportImport(result, error = false) {
    refs.importReport.className = `import-report${error ? ' error' : ''}`;
    if (!result.unrecognized?.length) { refs.importReport.textContent = result.message || ''; return; }
    refs.importReport.innerHTML = `${escapeHtml(result.message || '')}<strong>${result.unrecognized.length} unrecognized line(s):</strong><ul class="unrecognized">${result.unrecognized.map(item => `<li>Line ${item.line}: ${escapeHtml(item.text)} — ${escapeHtml(item.reason)}</li>`).join('')}</ul>`;
  }
  function importDeck(event) {
    event.preventDefault();
    if (!catalog) { reportImport({ message: 'Wait for the card catalog to finish loading.', unrecognized: [] }, true); return; }
    const name = refs.deckName.value.trim(); const url = refs.deckUrl.value.trim(); const sourceText = refs.deckExport.value.trim();
    if (!name || !sourceText) { reportImport({ message: 'Deck name and text export are required.', unrecognized: [] }, true); return; }
    if (url && !/^https:\/\/(?:www\.)?moxfield\.com\/decks\//i.test(url)) { reportImport({ message: 'That does not look like a Moxfield deck URL. Your existing deck was not changed.', unrecognized: [] }, true); return; }
    const options = { sideboard: $('#include-sideboard').checked, maybeboard: $('#include-maybeboard').checked };
    const parsed = C.parseDeckExport(sourceText, options, catalogLookup, catalogEntries);
    if (!parsed.recognizedCount) { reportImport({ message: 'No cards were imported. The last good deck, counts, and timestamp were preserved.', unrecognized: parsed.unrecognized }, true); return; }
    const existing = state.decks.find(deck => deck.id === editingDeckId);
    const deck = { id: existing?.id || crypto.randomUUID(), name, url, profileUrl: existing?.profileUrl || null, profileSeed: Boolean(existing?.profileSeed), sourceText, includeSideboard: options.sideboard, includeMaybeboard: options.maybeboard, lastSuccessfulImport: new Date().toISOString(), cards: C.mergeDeckCards(existing?.cards || [], parsed.cards) };
    if (existing) state.decks[state.decks.indexOf(existing)] = deck; else state.decks.push(deck);
    saveState(); renderAll(); reportImport({ message: `Imported ${parsed.recognizedCount} card copies. `, unrecognized: parsed.unrecognized });
    if (!parsed.unrecognized.length) setTimeout(closeDeckForm, 500);
  }

  function findDeckCard(deckId, key) {
    const deck = state.decks.find(item => item.id === deckId); if (!deck) return {};
    return { deck, card: deck.cards.find(item => (item.oracleId || C.normalizeName(item.name)) === key) };
  }
  function adjustDeckCard(deckId, key, field, delta) {
    const { card } = findDeckCard(deckId, key); if (!card) return;
    card[field] = Math.max(0, Number(card[field] || 0) + delta); saveState(); renderAll();
  }

  function printingPrice(printing, foil) { return printing ? printing[foil ? 3 : 2] : null; }
  function renderResult(card, selectedPrinting = null) {
    resultCard = card; exactPrinting = selectedPrinting;
    const needs = C.deckNeeds(card, state.decks); const needed = needs.filter(match => match.needed > 0);
    const foil = Boolean($('#foil-toggle')?.checked); const summary = C.priceSummary(card, foil); const exactPrice = printingPrice(selectedPrinting, foil);
    const cameraPrice = selectedPrinting ? money(exactPrice) : summary.available ? (summary.min === summary.max ? money(summary.min) : `${money(summary.min)}–${money(summary.max)}`) : 'Price unavailable';
    refs.cameraRecognition.hidden = false; refs.cameraName.textContent = card.n;
    refs.cameraMeta.textContent = `${needed.length ? `Needed for ${needed.map(match => match.deckName).join(' + ')}` : 'Not currently needed'} · ${cameraPrice}`;
    let priceHtml;
    if (selectedPrinting) priceHtml = `<span class="price-value">${money(exactPrice)}</span><small>Exact printing · ${escapeHtml(selectedPrinting[0].toUpperCase())} #${escapeHtml(selectedPrinting[1])}</small>`;
    else if (!summary.available) priceHtml = '<span class="price-value">Price unavailable</span><small>No USD price from Scryfall.</small>';
    else priceHtml = `<span class="price-value">${summary.min === summary.max ? money(summary.min) : `${money(summary.min)}–${money(summary.max)}`}</span><small>Range across available ${foil ? 'foil ' : ''}printings</small>${summary.max >= state.settings.threshold ? '<span class="check-printing">Check printing</span>' : ''}`;
    const printings = [...card.p].sort((a, b) => String(b[5]).localeCompare(String(a[5]))).slice(0, 500);
    refs.result.className = 'scan-result';
    refs.result.innerHTML = `<div class="result-top"><div><p class="eyebrow">RECOGNIZED</p><h3 class="result-name">${escapeHtml(card.n)}</h3><span class="confidence">Matched by card identity across printings</span></div></div><div class="need-banner ${needed.length ? '' : 'none'}">${needed.length ? `Needed for ${needed.map(match => escapeHtml(match.deckName)).join(' + ')}` : 'Not currently needed by an imported deck'}</div><div class="deck-matches">${needs.map(match => `<div class="deck-match"><p><strong>${escapeHtml(match.deckName)}</strong><br><small>deck ${match.quantity} · owned ${match.owned} · still need ${match.needed}</small></p><div class="inline-actions"><button data-result-action="owned" data-deck="${escapeHtml(match.deckId)}">Owned +1</button><button data-result-action="shopping" data-deck="${escapeHtml(match.deckId)}">Shop +1</button></div></div>`).join('') || '<p class="scan-tip">Import a deck to see matching needs.</p>'}</div><div class="price-box"><div class="price-row"><div>${priceHtml}</div><label class="foil-label"><input id="foil-toggle" type="checkbox" ${foil ? 'checked' : ''}> Foil</label></div><div class="printing-controls"><select id="printing-select" aria-label="Choose exact printing"><option value="">Printing uncertain — choose one</option>${printings.map((printing, index) => `<option value="${index}" ${selectedPrinting === printing ? 'selected' : ''}>${escapeHtml(printing[0].toUpperCase())} #${escapeHtml(printing[1])} · ${money(printingPrice(printing, foil))}</option>`).join('')}</select></div></div>`;
    const select = $('#printing-select');
    select.addEventListener('change', () => { const printing = select.value === '' ? null : printings[Number(select.value)]; renderResult(card, printing); if (printing) maybeValueAlert(printing); });
    $('#foil-toggle').addEventListener('change', () => renderResult(card, selectedPrinting));
    const guaranteedValue = selectedPrinting ? exactPrice : (summary.available && summary.min >= state.settings.threshold ? summary.min : null);
    const newNeed = !resultAlerted.need && needed.length > 0;
    const newValue = !resultAlerted.value && Number.isFinite(guaranteedValue) && guaranteedValue >= state.settings.threshold;
    if (newNeed || newValue) {
      const kind = newNeed && newValue ? 'both' : newNeed ? 'need' : 'value';
      const detail = newNeed && newValue ? `Needed for ${needed.map(match => match.deckName).join(' + ')} · ${money(guaranteedValue)}` : newNeed ? `Needed for ${needed.map(match => match.deckName).join(' + ')}` : `${money(guaranteedValue)} clears your ${money(state.settings.threshold)} alert`;
      flashCamera(kind, card.n, detail);
      if (newNeed && state.settings.needSound) beep(740, .16);
      if (newValue && state.settings.valueSound) { beep(980, .12, newNeed ? .17 : 0); beep(1180, .16, newNeed ? .31 : .14); }
      resultAlerted.need ||= newNeed; resultAlerted.value ||= newValue;
    }
  }
  function maybeValueAlert(printing) {
    const foil = Boolean($('#foil-toggle')?.checked); const value = printingPrice(printing, foil);
    if (!resultAlerted.value && Number.isFinite(value) && value >= state.settings.threshold) { flashCamera('value', resultCard?.n || 'Card found', `${money(value)} clears your ${money(state.settings.threshold)} alert`); if (state.settings.valueSound) { beep(980, .12, 0); beep(1180, .16, .14); } resultAlerted.value = true; }
  }
  function registerCard(card, printing = null) {
    resultAlerted = { need: false, value: false }; renderResult(card, printing); hideCandidates();
  }

  function flashCamera(kind, name, detail) {
    clearTimeout(alertTimer);
    refs.cameraStage.classList.remove('alert-need', 'alert-value', 'alert-both');
    refs.alert.className = `scan-alert ${kind}`; refs.alert.hidden = false;
    refs.alertLabel.textContent = kind === 'both' ? 'NEEDED + VALUE ALERT' : kind === 'need' ? 'DECK NEED' : 'VALUE ALERT';
    refs.alertName.textContent = name; refs.alertDetail.textContent = detail;
    requestAnimationFrame(() => refs.cameraStage.classList.add(`alert-${kind}`));
    alertTimer = setTimeout(() => { refs.alert.hidden = true; refs.cameraStage.classList.remove('alert-need', 'alert-value', 'alert-both'); }, 2400);
  }

  function beep(frequency, duration, delay = 0) {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const start = audioContext.currentTime + delay;
      oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.16, start + .015); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
    } catch { /* Sound is optional. */ }
  }

  async function ensureWorker(silent = false) {
    if (worker) return worker;
    if (workerPromise) return workerPromise;
    if (!window.Tesseract) throw new Error('OCR could not load. Manual search is still available.');
    if (!silent) setScanState('Starting…', 'busy');
    workerPromise = (async () => {
      const nextWorker = await Tesseract.createWorker('eng', 1, { logger: message => { if (!silent && (message.status === 'loading tesseract core' || message.status === 'loading language traineddata')) setStatus(`Preparing on-device OCR · ${Math.round((message.progress || 0) * 100)}%`); } });
      await nextWorker.setParameters({ tessedit_pageseg_mode: '7', preserve_interword_spaces: '1' });
      worker = nextWorker; return worker;
    })();
    try { return await workerPromise; } finally { workerPromise = null; }
  }
  async function startCamera() {
    if (!catalog) { setStatus('Wait for the card catalog to finish loading.'); return; }
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); await audioContext.resume();
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
        refs.camera.srcObject = stream; await refs.camera.play(); refs.cameraStage.classList.add('streaming');
        stream.getVideoTracks()[0].addEventListener('ended', () => stopCamera('Camera stopped by Safari. Tap Open camera to resume.'));
      }
      await ensureWorker(); refs.start.disabled = true; refs.scan.disabled = false; refs.stop.disabled = false;
      setScanState('Ready', 'live'); setStatus('Camera ready. Align one card and tap Scan card.');
    } catch (error) {
      setScanState('Camera unavailable'); refs.cameraMessage.textContent = error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in Safari settings, or use manual search.' : `${error.message} Use manual search below.`;
      refs.start.disabled = false;
    }
  }
  function stopCamera(message = 'Camera stopped.') {
    scanning = false; stream?.getTracks().forEach(track => track.stop()); stream = null; refs.camera.srcObject = null; refs.cameraStage.classList.remove('streaming'); refs.cameraMessage.textContent = message;
    refs.start.disabled = false; refs.scan.disabled = true; refs.stop.disabled = true; setScanState('Camera off'); hideCandidates();
  }

  function cropFrame(kind) {
    const video = refs.camera; const stage = refs.cameraStage; const guide = $('.card-guide');
    if (!video.videoWidth) return null;
    const stageRect = stage.getBoundingClientRect(); const guideRect = guide.getBoundingClientRect();
    const scale = Math.max(stageRect.width / video.videoWidth, stageRect.height / video.videoHeight);
    const visibleWidth = stageRect.width / scale; const visibleHeight = stageRect.height / scale;
    const offsetX = (video.videoWidth - visibleWidth) / 2; const offsetY = (video.videoHeight - visibleHeight) / 2;
    const cardX = offsetX + (guideRect.left - stageRect.left) / scale; const cardY = offsetY + (guideRect.top - stageRect.top) / scale;
    const cardWidth = guideRect.width / scale; const cardHeight = guideRect.height / scale;
    const region = kind === 'footer' ? { x: .05, y: .86, w: .9, h: .11 } : { x: .055, y: .035, w: .89, h: .105 };
    const source = { x: cardX + cardWidth * region.x, y: cardY + cardHeight * region.y, w: cardWidth * region.w, h: cardHeight * region.h };
    const canvas = refs.canvas; canvas.width = 480; canvas.height = Math.max(72, Math.round(canvas.width * source.h / source.w));
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(video, source.x, source.y, source.w, source.h, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height); const pixels = image.data;
    for (let index = 0; index < pixels.length; index += 4) { const gray = pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114; const value = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 128)); pixels[index] = pixels[index + 1] = pixels[index + 2] = value; }
    context.putImageData(image, 0, 0); return canvas;
  }
  function cleanOcr(text) { return String(text || '').split(/\r?\n/).map(line => line.replace(/[|_[\]{}]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).sort((a, b) => b.length - a.length)[0] || ''; }
  async function recognizeRegion(kind) {
    const canvas = cropFrame(kind); if (!canvas) return { text: '', confidence: 0 };
    const result = await worker.recognize(canvas); return { text: cleanOcr(result.data.text), confidence: result.data.confidence || 0 };
  }
  async function scanCard() {
    if (!stream || scanning) return;
    scanning = true; refs.scan.disabled = true; setScanState('Scanning card…', 'busy'); hideCandidates();
    try {
      const readStarted = performance.now(); const read = await recognizeRegion('name');
      const readSeconds = (performance.now() - readStarted) / 1000;
      refs.speed.textContent = `Last scan: ${readSeconds.toFixed(1)}s on this device.`;
      const candidates = C.findCandidates(read.text, catalogEntries, 4); const best = candidates[0]; const margin = best && candidates[1] ? best.score - candidates[1].score : 1;
      const decisive = best && read.confidence >= 48 && best.score >= .78 && margin >= .1;
      if (decisive) {
        registerCard(best.entry); setStatus(`${best.entry.n} · ${readSeconds.toFixed(1)}s · OCR ${Math.round(read.confidence)}% · match ${Math.round(best.score * 100)}%`);
        if (state.settings.printingOcr) {
          const footer = await recognizeRegion('footer'); const printing = resolvePrinting(best.entry, footer.text);
          if (printing) renderResult(best.entry, printing);
        }
      } else if (candidates.length) {
        showCandidates(candidates, read.text); setStatus(`Name was uncertain after ${readSeconds.toFixed(1)}s. Tap the correct match in the camera.`);
      } else {
        setStatus(`No confident name found after ${readSeconds.toFixed(1)}s. Re-align the title strip and tap Scan card again.`);
      }
    } catch (error) { setStatus(`Scan failed: ${error.message}. Try again or use manual search.`); }
    finally { scanning = false; if (stream) { refs.scan.disabled = false; setScanState('Ready', 'live'); } }
  }
  function resolvePrinting(card, text) {
    const compact = C.normalizeName(text); if (!compact) return null;
    const matches = card.p.filter(printing => compact.includes(C.normalizeName(printing[0])) && compact.includes(C.normalizeName(printing[1])));
    if (matches.length === 1) return matches[0];
    const collectorMatches = card.p.filter(printing => String(printing[1]).length >= 2 && compact.split(' ').includes(C.normalizeName(printing[1])));
    return collectorMatches.length === 1 ? collectorMatches[0] : null;
  }
  function hideCandidates(suppress = false) {
    refs.ambiguous.hidden = true; refs.candidates.innerHTML = ''; refs.candidates.dataset.cards = '[]'; ambiguityShownAt = 0;
    if (suppress) ambiguityDismissedUntil = Date.now() + 3000;
  }
  function showCandidates(candidates, raw) {
    const now = Date.now(); if (now < ambiguityDismissedUntil || !candidates.length) return;
    const ids = candidates.slice(0, 3).map(candidate => candidate.entry.o);
    const shown = JSON.parse(refs.candidates.dataset.cards || '[]');
    if (!refs.ambiguous.hidden && shown.includes(ids[0])) return;
    if (!refs.ambiguous.hidden && now - ambiguityShownAt < 2500) return;
    refs.ambiguous.hidden = false; ambiguityShownAt = now;
    refs.candidates.innerHTML = candidates.slice(0, 3).map((candidate, index) => `<button type="button" data-candidate="${index}"><strong>${escapeHtml(candidate.entry.n)}</strong><small>Match ${Math.round(candidate.score * 100)}%</small></button>`).join('');
    refs.candidates.dataset.cards = JSON.stringify(ids); setStatus(`Possible match from “${raw || 'unclear text'}”. Hold still or tap the correct card.`);
  }

  function searchCards(query) {
    const exact = catalogLookup.get(C.normalizeName(query)); if (exact) return [{ entry: exact, score: 1 }];
    return C.findCandidates(query, catalogEntries, 8);
  }
  function renderSearchResults(query) {
    const candidates = searchCards(query); refs.searchResults.innerHTML = candidates.map((candidate, index) => `<button type="button" data-search-result="${index}">${escapeHtml(candidate.entry.n)} <small>${Math.round(candidate.score * 100)}%</small></button>`).join(''); refs.searchResults.dataset.cards = JSON.stringify(candidates.map(candidate => candidate.entry.o));
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2)], { type: 'application/json' }); const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `mtg-scanner-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  $$('.scanner-tabs button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  refs.start.addEventListener('click', startCamera); refs.scan.addEventListener('click', scanCard); refs.stop.addEventListener('click', () => stopCamera());
  $('#new-deck').addEventListener('click', () => openDeckForm()); $('#close-deck-form').addEventListener('click', closeDeckForm); $('#cancel-deck').addEventListener('click', closeDeckForm); refs.deckForm.addEventListener('submit', importDeck);
  $('#deck-file').addEventListener('change', async event => { const file = event.target.files[0]; if (file) refs.deckExport.value = await file.text(); });
  refs.deckList.addEventListener('click', event => { const action = event.target.dataset.action; if (!action) return; const deck = state.decks.find(item => item.id === event.target.closest('[data-deck]').dataset.deck); if (action === 'reimport') openDeckForm(deck); if (action === 'delete' && confirm(`Delete ${deck.name} from this browser?`)) { state.decks = state.decks.filter(item => item !== deck); saveState(); renderAll(); } });
  refs.wantedList.addEventListener('click', event => { if (!event.target.dataset.adjust) return; const article = event.target.closest('[data-deck]'); adjustDeckCard(article.dataset.deck, article.dataset.card, event.target.dataset.adjust, Number(event.target.dataset.delta)); });
  refs.result.addEventListener('click', event => { const action = event.target.dataset.resultAction; if (!action || !resultCard) return; const key = resultCard.o || C.normalizeName(resultCard.n); adjustDeckCard(event.target.dataset.deck, key, action, 1); });
  refs.candidates.addEventListener('click', event => { const index = event.target.closest('[data-candidate]')?.dataset.candidate; if (index === undefined) return; const ids = JSON.parse(refs.candidates.dataset.cards); const card = catalogEntries.find(item => item.o === ids[Number(index)]); if (card) registerCard(card); });
  $('#dismiss-candidates').addEventListener('click', () => hideCandidates(true));
  refs.searchForm.addEventListener('submit', event => { event.preventDefault(); renderSearchResults(refs.searchInput.value); }); refs.searchInput.addEventListener('input', () => { if (refs.searchInput.value.trim().length >= 3) renderSearchResults(refs.searchInput.value); else refs.searchResults.innerHTML = ''; });
  refs.searchResults.addEventListener('click', event => { const index = event.target.closest('[data-search-result]')?.dataset.searchResult; if (index === undefined) return; const ids = JSON.parse(refs.searchResults.dataset.cards); const card = catalogEntries.find(item => item.o === ids[Number(index)]); if (card) { registerCard(card); refs.searchResults.innerHTML = ''; refs.searchInput.value = card.n; } });
  $('#value-threshold').value = state.settings.threshold; $('#need-sound').checked = state.settings.needSound; $('#value-sound').checked = state.settings.valueSound; $('#printing-ocr').checked = state.settings.printingOcr;
  $('#value-threshold').addEventListener('change', event => { state.settings.threshold = Math.max(0, Number(event.target.value) || 0); saveState(); });
  [['#need-sound', 'needSound'], ['#value-sound', 'valueSound'], ['#printing-ocr', 'printingOcr']].forEach(([selector, key]) => $(selector).addEventListener('change', event => { state.settings[key] = event.target.checked; saveState(); }));
  $('#refresh-catalog').addEventListener('click', async () => { try { await loadCatalog(true); } catch (error) { setStatus(`Catalog refresh failed; the last cached catalog is still active. ${error.message}`); } });
  $('#export-data').addEventListener('click', downloadBackup);
  $('#restore-data').addEventListener('change', async event => { try { const backup = JSON.parse(await event.target.files[0].text()); if (!backup.state?.decks) throw new Error('Not a scanner backup.'); state = { ...DEFAULT_STATE, ...backup.state, settings: { ...DEFAULT_STATE.settings, ...(backup.state.settings || {}) } }; saveState(); renderAll(); setStatus('Backup restored.'); } catch (error) { setStatus(`Restore failed: ${error.message}`); } });
  $('#clear-data').addEventListener('click', () => { if (!confirm('Clear all decks, counts, and scanner settings from this browser?')) return; state = structuredClone(DEFAULT_STATE); saveState(); renderAll(); setStatus('Scanner data cleared.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCamera('Camera paused by Safari. Tap Open camera to resume.'); });
  window.addEventListener('pagehide', () => { stream?.getTracks().forEach(track => track.stop()); worker?.terminate(); });

  seedProfileDecks(); renderAll();
  try {
    await loadCatalog(); renderAll();
    const warmOcr = () => ensureWorker(true).catch(() => { /* Manual search remains available if OCR cannot preload. */ });
    if ('requestIdleCallback' in window) requestIdleCallback(warmOcr, { timeout: 1500 }); else setTimeout(warmOcr, 400);
  } catch (error) { setStatus(`${error.message} Manual scanning and deck matching need the catalog; retry in Settings.`); }
  window.MTGBulkScanner = { parseDeck: C.parseDeckExport, getState: () => structuredClone(state), search: searchCards };
})();
