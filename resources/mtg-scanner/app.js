(async function () {
  'use strict';
  const C = window.MTGScannerCore;
  const profile = window.MTGProfileDecks;
  const SETTINGS_KEY = 'dipiazza-mtg-scanner-settings-v2';
  const DEFAULT_SETTINGS = { threshold: 2, needSound: true, valueSound: true };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const money = value => Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Price unavailable';
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const boardLabels = { mainboard: 'Main deck', sideboard: 'Sideboard', considering: 'Considering' };
  const colorOrder = ['White', 'Blue', 'Black', 'Red', 'Green', 'Multicolor', 'Colorless', 'Land', 'Other'];
  const rarityOrder = ['mythic', 'rare', 'uncommon', 'common', 'special', 'bonus', 'unknown'];

  let settings = loadSettings();
  let catalog = null; let catalogEntries = []; let catalogLookup = new Map();
  let deckIdentityIndex = new Map(); let cardMeta = new Map(); let metadataPromise = null;
  let stream = null; let worker = null; let workerPromise = null; let scanActive = false; let scanTask = null;
  let resultCard = null; let exactPrinting = null; let resultAlerted = { need: false, value: false };
  let audioContext = null; let alertTimer = null; let ambiguityShownAt = 0; let ambiguityDismissedUntil = 0;
  const latch = C.createScanLatch(1500); const gate = C.createRecognitionGate();

  const refs = {
    status: $('#app-status'), scanState: $('#scan-state'), camera: $('#camera'), cameraStage: $('#camera-stage'), cameraMessage: $('#camera-message'), canvas: $('#ocr-canvas'),
    start: $('#start-scan'), pause: $('#pause-scan'), stop: $('#stop-scan'), speed: $('#scan-speed'), result: $('#scan-result'), ambiguous: $('#ambiguous'), candidates: $('#candidate-list'),
    cameraRecognition: $('#camera-recognition'), cameraName: $('#camera-card-name'), cameraMeta: $('#camera-card-meta'),
    alert: $('#scan-alert'), alertLabel: $('#scan-alert-label'), alertName: $('#scan-alert-name'), alertDetail: $('#scan-alert-detail'),
    searchForm: $('#manual-search'), searchInput: $('#card-search'), searchResults: $('#search-results'), deckList: $('#deck-list')
  };

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'), threshold: Number(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').threshold ?? 2) }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  function setStatus(message, tone = '') { refs.status.textContent = message; refs.status.dataset.tone = tone; }
  function setScanState(message, tone = '') { refs.scanState.textContent = message; refs.scanState.className = `status-pill ${tone}`.trim(); }

  async function loadCatalog() {
    setStatus('Loading the Scryfall catalog…');
    const response = await fetch('/resources/mtg-scanner/catalog.json');
    if (!response.ok) throw new Error('Card catalog download failed.');
    catalog = await response.json(); catalogEntries = catalog.cards; catalogLookup = new Map();
    catalogEntries.forEach(card => { catalogLookup.set(C.normalizeName(card.n), card); (card.a || []).forEach(alias => catalogLookup.set(C.normalizeName(alias), card)); });
    resolveDeckIdentities();
    const date = new Date(catalog.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    setStatus(`${catalog.cards.length.toLocaleString()} card identities ready · 7 Moxfield decks matched · prices dated ${date}`);
    $('#catalog-details').textContent = `${catalog.source}. ${catalog.cards.length.toLocaleString()} card identities; price snapshot ${date}. The bundled catalog loads automatically with the page.`;
  }

  function resolveDeckIdentities() {
    deckIdentityIndex = new Map();
    const profileCards = profile.decks.flatMap(deck => Object.values(deck.boards).flat());
    profileCards.forEach(item => {
      let entry = catalogLookup.get(C.normalizeName(item.n));
      if (!entry) { const candidate = C.findCandidates(item.n, catalogEntries, 1)[0]; if (candidate?.score >= .94) entry = candidate.entry; }
      if (!entry) {
        const normalized = C.normalizeName(item.n); entry = { n: item.n, o: `profile:${normalized}`, a: [], p: [] };
        catalogEntries.push(entry); catalogLookup.set(normalized, entry);
      }
      item.entry = entry;
    });
    profile.decks.forEach(deck => Object.entries(deck.boards).forEach(([board, cards]) => cards.forEach(item => {
      const entry = item.entry;
      const key = entry?.o || C.normalizeName(item.n);
      if (!deckIdentityIndex.has(key)) deckIdentityIndex.set(key, []);
      deckIdentityIndex.get(key).push({ deck, board, quantity: item.q, name: item.n });
    })));
  }

  function deckMatches(card) {
    return deckIdentityIndex.get(card.o || C.normalizeName(card.n)) || deckIdentityIndex.get(C.normalizeName(card.n)) || [];
  }

  function showTab(name) {
    $$('.scanner-tabs button').forEach(button => { const active = button.dataset.tab === name; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    $$('.tab-panel').forEach(panel => { const active = panel.dataset.panel === name; panel.hidden = !active; panel.classList.toggle('active', active); });
  }

  function renderDecks() {
    const date = new Date(`${profile.updatedAt}T12:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    refs.deckList.innerHTML = profile.decks.map(deck => {
      const main = deck.boards.mainboard.reduce((sum, card) => sum + card.q, 0);
      const side = deck.boards.sideboard.reduce((sum, card) => sum + card.q, 0);
      const considering = deck.boards.considering.reduce((sum, card) => sum + card.q, 0);
      return `<article class="deck-card profile-deck" data-deck="${escapeHtml(deck.id)}"><h3>${escapeHtml(deck.name)}</h3><p class="deck-meta">${main} main · ${side} sideboard · ${considering} considering · synced ${date}</p><div class="deck-actions deck-primary-actions"><a href="${escapeHtml(deck.url)}" target="_blank" rel="noopener">View on Moxfield</a><button type="button" data-action="view-cards" aria-expanded="false">View cards</button></div><div class="deck-browser" hidden></div></article>`;
    }).join('');
  }

  function metaFor(item) {
    return cardMeta.get(C.normalizeName(item.entry?.n)) || cardMeta.get(C.normalizeName(item.n)) || { color: inferBasicColor(item.n), rarity: 'unknown', type: '' };
  }
  function inferBasicColor(name) {
    if (/^(Plains|Island|Swamp|Mountain|Forest)$/.test(name)) return 'Land';
    return 'Other';
  }
  function colorLabel(card) {
    if (/Land/i.test(card.type_line || '')) return 'Land';
    const colors = card.colors || card.card_faces?.flatMap(face => face.colors || []) || [];
    const unique = [...new Set(colors)];
    if (unique.length > 1) return 'Multicolor';
    return ({ W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' })[unique[0]] || 'Colorless';
  }
  function boardHtml(cards, label) {
    if (!cards.length) return `<section class="board-section"><h4>${label}</h4><p class="empty-board">No cards in this section.</p></section>`;
    const colorGroups = new Map();
    cards.forEach(item => {
      const meta = metaFor(item); const color = meta.color || 'Other';
      if (!colorGroups.has(color)) colorGroups.set(color, []); colorGroups.get(color).push({ ...item, meta });
    });
    const groups = [...colorGroups].sort((a, b) => colorOrder.indexOf(a[0]) - colorOrder.indexOf(b[0])).map(([color, items]) => {
      const rarityGroups = new Map();
      items.forEach(item => { const rarity = item.meta.rarity || 'unknown'; if (!rarityGroups.has(rarity)) rarityGroups.set(rarity, []); rarityGroups.get(rarity).push(item); });
      const rarityHtml = [...rarityGroups].sort((a, b) => rarityOrder.indexOf(a[0]) - rarityOrder.indexOf(b[0])).map(([rarity, rarityCards]) => `<div class="rarity-group"><h6>${escapeHtml(rarity[0].toUpperCase() + rarity.slice(1))} <span>${rarityCards.reduce((sum, item) => sum + item.q, 0)}</span></h6><ul>${rarityCards.sort((a, b) => a.n.localeCompare(b.n)).map(item => `<li><span>${escapeHtml(item.n)}</span><strong>${item.q}</strong></li>`).join('')}</ul></div>`).join('');
      return `<details class="color-group" open><summary><span class="color-dot color-${color.toLowerCase()}"></span>${escapeHtml(color)} <small>${items.reduce((sum, item) => sum + item.q, 0)}</small></summary>${rarityHtml}</details>`;
    }).join('');
    return `<section class="board-section"><h4>${label}</h4>${groups}</section>`;
  }

  async function renderDeckBrowser(deck, container) {
    container.hidden = false; container.innerHTML = '<p class="deck-loading">Organizing cards by color and rarity…</p>';
    try { await ensureDeckMetadata(); } catch { /* The fallback grouping remains usable. */ }
    container.innerHTML = boardHtml(deck.boards.mainboard, 'Main deck') + boardHtml(deck.boards.sideboard, 'Sideboard') + boardHtml(deck.boards.considering, 'Considering');
  }

  async function ensureDeckMetadata() {
    if (cardMeta.size) return cardMeta;
    if (metadataPromise) return metadataPromise;
    metadataPromise = (async () => {
      const unique = [...new Set(profile.decks.flatMap(deck => Object.values(deck.boards).flat().map(card => card.entry?.n || card.n)))];
      for (let index = 0; index < unique.length; index += 75) {
        const names = unique.slice(index, index + 75);
        const response = await fetch('https://api.scryfall.com/cards/collection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifiers: names.map(name => ({ name })) }) });
        if (!response.ok) throw new Error('Color and rarity lookup failed.');
        const data = await response.json();
        data.data.forEach(card => cardMeta.set(C.normalizeName(card.name), { color: colorLabel(card), rarity: card.rarity || 'unknown', type: card.type_line || '' }));
        await wait(100);
      }
      return cardMeta;
    })();
    try { return await metadataPromise; } finally { metadataPromise = null; }
  }

  function printingPrice(printing, foil) { return printing ? printing[foil ? 3 : 2] : null; }
  function renderResult(card, selectedPrinting = null) {
    resultCard = card; exactPrinting = selectedPrinting;
    const matches = deckMatches(card); const foil = Boolean($('#foil-toggle')?.checked); const summary = C.priceSummary(card, foil); const exactPrice = printingPrice(selectedPrinting, foil);
    const cameraPrice = selectedPrinting ? money(exactPrice) : summary.available ? (summary.min === summary.max ? money(summary.min) : `${money(summary.min)}–${money(summary.max)}`) : 'Price unavailable';
    refs.cameraRecognition.hidden = false; refs.cameraName.textContent = card.n;
    refs.cameraMeta.textContent = `${matches.length ? `In ${new Set(matches.map(match => match.deck.id)).size} deck${new Set(matches.map(match => match.deck.id)).size === 1 ? '' : 's'}` : 'Not in a bundled deck'} · ${cameraPrice}`;
    let priceHtml;
    if (selectedPrinting) priceHtml = `<span class="price-value">${money(exactPrice)}</span><small>Exact printing · ${escapeHtml(selectedPrinting[0].toUpperCase())} #${escapeHtml(selectedPrinting[1])}</small>`;
    else if (!summary.available) priceHtml = '<span class="price-value">Price unavailable</span><small>No USD price from Scryfall.</small>';
    else priceHtml = `<span class="price-value">${summary.min === summary.max ? money(summary.min) : `${money(summary.min)}–${money(summary.max)}`}</span><small>Range across available ${foil ? 'foil ' : ''}printings</small>${summary.max >= settings.threshold && summary.min < settings.threshold ? '<span class="check-printing">Check printing</span>' : ''}`;
    const printings = [...card.p].sort((a, b) => String(b[5]).localeCompare(String(a[5]))).slice(0, 500);
    refs.result.className = 'scan-result';
    refs.result.innerHTML = `<div class="result-top"><div><p class="eyebrow">RECOGNIZED</p><h3 class="result-name">${escapeHtml(card.n)}</h3><span class="confidence">Matched by card identity across printings</span></div></div><div class="need-banner ${matches.length ? '' : 'none'}">${matches.length ? `Found in ${new Set(matches.map(match => match.deck.id)).size} bundled deck${new Set(matches.map(match => match.deck.id)).size === 1 ? '' : 's'}` : 'Not in a bundled deck'}</div><div class="deck-matches">${matches.map(match => `<div class="deck-match"><p><strong>${escapeHtml(match.deck.name)}</strong><br><small>${escapeHtml(boardLabels[match.board])} · ${match.quantity} cop${match.quantity === 1 ? 'y' : 'ies'}</small></p><a href="${escapeHtml(match.deck.url)}" target="_blank" rel="noopener">View on Moxfield</a></div>`).join('')}</div><div class="price-box"><div class="price-row"><div>${priceHtml}</div><label class="foil-label"><input id="foil-toggle" type="checkbox" ${foil ? 'checked' : ''}> Foil</label></div><div class="printing-controls"><select id="printing-select" aria-label="Choose exact printing"><option value="">Printing uncertain — choose one</option>${printings.map((printing, index) => `<option value="${index}" ${selectedPrinting === printing ? 'selected' : ''}>${escapeHtml(printing[0].toUpperCase())} #${escapeHtml(printing[1])} · ${money(printingPrice(printing, foil))}</option>`).join('')}</select></div></div>`;
    const select = $('#printing-select');
    select.addEventListener('change', () => { const printing = select.value === '' ? null : printings[Number(select.value)]; renderResult(card, printing); if (printing) maybeValueAlert(printing); });
    $('#foil-toggle').addEventListener('change', () => renderResult(card, selectedPrinting));
    const guaranteedValue = selectedPrinting ? exactPrice : (summary.available && summary.min >= settings.threshold ? summary.min : null);
    const newNeed = !resultAlerted.need && matches.length > 0; const newValue = !resultAlerted.value && Number.isFinite(guaranteedValue) && guaranteedValue >= settings.threshold;
    if (newNeed || newValue) {
      const kind = newNeed && newValue ? 'both' : newNeed ? 'need' : 'value';
      const deckNames = [...new Set(matches.map(match => match.deck.name))];
      const detail = newNeed && newValue ? `${deckNames.join(' + ')} · ${money(guaranteedValue)}` : newNeed ? deckNames.join(' + ') : `${money(guaranteedValue)} clears your ${money(settings.threshold)} alert`;
      flashCamera(kind, card.n, detail);
      if (newNeed && settings.needSound) beep(740, .16);
      if (newValue && settings.valueSound) { beep(980, .12, newNeed ? .17 : 0); beep(1180, .16, newNeed ? .31 : .14); }
      resultAlerted.need ||= newNeed; resultAlerted.value ||= newValue;
    }
  }
  function maybeValueAlert(printing) {
    const value = printingPrice(printing, Boolean($('#foil-toggle')?.checked));
    if (!resultAlerted.value && Number.isFinite(value) && value >= settings.threshold) { flashCamera('value', resultCard?.n || 'Card found', `${money(value)} clears your ${money(settings.threshold)} alert`); if (settings.valueSound) { beep(980, .12); beep(1180, .16, .14); } resultAlerted.value = true; }
  }
  function registerCard(card, printing = null) { resultAlerted = { need: false, value: false }; renderResult(card, printing); hideCandidates(); }

  function flashCamera(kind, name, detail) {
    clearTimeout(alertTimer); refs.cameraStage.classList.remove('alert-need', 'alert-value', 'alert-both');
    refs.alert.className = `scan-alert ${kind}`; refs.alert.hidden = false;
    refs.alertLabel.textContent = kind === 'both' ? 'DECK MATCH + VALUE' : kind === 'need' ? 'DECK MATCH' : 'VALUE ALERT'; refs.alertName.textContent = name; refs.alertDetail.textContent = detail;
    requestAnimationFrame(() => refs.cameraStage.classList.add(`alert-${kind}`));
    alertTimer = setTimeout(() => { refs.alert.hidden = true; refs.cameraStage.classList.remove('alert-need', 'alert-value', 'alert-both'); }, 2400);
  }
  function beep(frequency, duration, delay = 0) {
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const start = audioContext.currentTime + delay; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.16, start + .015); gain.gain.exponentialRampToValueAtTime(.0001, start + duration); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration + .03); } catch { /* Visual alert remains. */ }
  }

  async function ensureWorker(silent = false) {
    if (worker) return worker; if (workerPromise) return workerPromise;
    if (!window.Tesseract) throw new Error('OCR could not load. Manual search is still available.');
    workerPromise = (async () => { const next = await Tesseract.createWorker('eng', 1, { logger: message => { if (!silent && message.status?.startsWith('loading')) setStatus(`Preparing on-device OCR · ${Math.round((message.progress || 0) * 100)}%`); } }); await next.setParameters({ tessedit_pageseg_mode: '7', preserve_interword_spaces: '1' }); worker = next; return next; })();
    try { return await workerPromise; } finally { workerPromise = null; }
  }

  async function startCamera() {
    if (!catalog) { setStatus('Wait for the card catalog to finish loading.'); return; }
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); await audioContext.resume();
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
        refs.camera.srcObject = stream; await refs.camera.play(); refs.cameraStage.classList.add('streaming');
        stream.getVideoTracks()[0].addEventListener('ended', () => stopCamera('Camera stopped by Safari. Tap Start scanning to resume.'));
      }
      await ensureWorker(); scanActive = true; refs.start.disabled = true; refs.pause.disabled = false; refs.stop.disabled = false; refs.pause.textContent = 'Pause';
      setScanState('Scanning', 'live'); setStatus('Continuous scanning is active. Hold one card at a time inside the guide.');
      if (!scanTask) scanTask = scanLoop().finally(() => { scanTask = null; });
    } catch (error) {
      setScanState('Camera unavailable'); refs.cameraMessage.textContent = error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in Safari settings, or use manual search.' : `${error.message} Use manual search below.`; refs.start.disabled = false;
    }
  }
  function pauseScanning() {
    if (!stream) return;
    scanActive = !scanActive; refs.pause.textContent = scanActive ? 'Pause' : 'Resume'; setScanState(scanActive ? 'Scanning' : 'Paused', scanActive ? 'live' : '');
    if (scanActive && !scanTask) scanTask = scanLoop().finally(() => { scanTask = null; });
  }
  function stopCamera(message = 'Camera stopped.') {
    scanActive = false; stream?.getTracks().forEach(track => track.stop()); stream = null; refs.camera.srcObject = null; refs.cameraStage.classList.remove('streaming'); refs.cameraMessage.textContent = message;
    refs.start.disabled = false; refs.pause.disabled = true; refs.stop.disabled = true; refs.pause.textContent = 'Pause'; setScanState('Camera off'); hideCandidates(); gate.reset();
  }

  function cropFrame() {
    const video = refs.camera; const stageRect = refs.cameraStage.getBoundingClientRect(); const guideRect = $('.card-guide').getBoundingClientRect(); if (!video.videoWidth) return null;
    const scale = Math.max(stageRect.width / video.videoWidth, stageRect.height / video.videoHeight); const visibleWidth = stageRect.width / scale; const visibleHeight = stageRect.height / scale;
    const offsetX = (video.videoWidth - visibleWidth) / 2; const offsetY = (video.videoHeight - visibleHeight) / 2;
    const cardX = offsetX + (guideRect.left - stageRect.left) / scale; const cardY = offsetY + (guideRect.top - stageRect.top) / scale; const cardWidth = guideRect.width / scale; const cardHeight = guideRect.height / scale;
    const source = { x: cardX + cardWidth * .055, y: cardY + cardHeight * .035, w: cardWidth * .89, h: cardHeight * .105 };
    const canvas = refs.canvas; canvas.width = 480; canvas.height = Math.max(72, Math.round(canvas.width * source.h / source.w));
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(video, source.x, source.y, source.w, source.h, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height); const pixels = image.data;
    for (let index = 0; index < pixels.length; index += 4) { const gray = pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114; const value = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 128)); pixels[index] = pixels[index + 1] = pixels[index + 2] = value; }
    context.putImageData(image, 0, 0); return canvas;
  }
  function cleanOcr(text) { return String(text || '').split(/\r?\n/).map(line => line.replace(/[|_[\]{}]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).sort((a, b) => b.length - a.length)[0] || ''; }
  async function recognizeName() { const canvas = cropFrame(); if (!canvas) return { text: '', confidence: 0 }; const result = await worker.recognize(canvas); return { text: cleanOcr(result.data.text), confidence: result.data.confidence || 0 }; }

  async function scanLoop() {
    while (scanActive && stream) {
      try {
        const started = performance.now(); const read = await recognizeName(); const seconds = (performance.now() - started) / 1000; refs.speed.textContent = `Last read: ${seconds.toFixed(1)}s.`;
        const candidates = C.findCandidates(read.text, catalogEntries, 4); const best = candidates[0]; const margin = best && candidates[1] ? best.score - candidates[1].score : 1;
        const candidate = best ? { key: best.entry.o || C.normalizeName(best.entry.n), score: best.score, confidence: read.confidence, margin } : null;
        if (best && gate.observe(candidate)) {
          if (latch.observe(candidate.key, Date.now())) { registerCard(best.entry); setStatus(`${best.entry.n} recognized in ${seconds.toFixed(1)}s.`); }
        } else if (!best || best.score < .6 || read.confidence < 25) { gate.observe(null); latch.observe(null, Date.now()); }
        if (candidates.length && best.score >= .58 && best.score < .78) showCandidates(candidates, read.text);
      } catch (error) { setStatus(`OCR paused: ${error.message}. Manual search remains available.`); await wait(500); }
      await wait(60);
    }
  }

  function hideCandidates(suppress = false) { refs.ambiguous.hidden = true; refs.candidates.innerHTML = ''; refs.candidates.dataset.cards = '[]'; ambiguityShownAt = 0; if (suppress) ambiguityDismissedUntil = Date.now() + 3000; }
  function showCandidates(candidates, raw) {
    const now = Date.now(); if (now < ambiguityDismissedUntil || !candidates.length) return; const ids = candidates.slice(0, 3).map(candidate => candidate.entry.o); const shown = JSON.parse(refs.candidates.dataset.cards || '[]');
    if (!refs.ambiguous.hidden && shown.includes(ids[0])) return; if (!refs.ambiguous.hidden && now - ambiguityShownAt < 2500) return;
    refs.ambiguous.hidden = false; ambiguityShownAt = now; refs.candidates.innerHTML = candidates.slice(0, 3).map((candidate, index) => `<button type="button" data-candidate="${index}"><strong>${escapeHtml(candidate.entry.n)}</strong><small>Match ${Math.round(candidate.score * 100)}%</small></button>`).join(''); refs.candidates.dataset.cards = JSON.stringify(ids);
  }
  function searchCards(query) { const exact = catalogLookup.get(C.normalizeName(query)); return exact ? [{ entry: exact, score: 1 }] : C.findCandidates(query, catalogEntries, 8); }
  function renderSearchResults(query) { const candidates = searchCards(query); refs.searchResults.innerHTML = candidates.map((candidate, index) => `<button type="button" data-search-result="${index}">${escapeHtml(candidate.entry.n)} <small>${Math.round(candidate.score * 100)}%</small></button>`).join(''); refs.searchResults.dataset.cards = JSON.stringify(candidates.map(candidate => candidate.entry.o)); }

  $$('.scanner-tabs button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  refs.start.addEventListener('click', startCamera); refs.pause.addEventListener('click', pauseScanning); refs.stop.addEventListener('click', () => stopCamera());
  refs.deckList.addEventListener('click', event => { const button = event.target.closest('[data-action="view-cards"]'); if (!button) return; const article = button.closest('[data-deck]'); const container = article.querySelector('.deck-browser'); const opening = container.hidden; button.setAttribute('aria-expanded', String(opening)); button.textContent = opening ? 'Hide cards' : 'View cards'; if (opening) renderDeckBrowser(profile.decks.find(deck => deck.id === article.dataset.deck), container); else container.hidden = true; });
  refs.candidates.addEventListener('click', event => { const index = event.target.closest('[data-candidate]')?.dataset.candidate; if (index === undefined) return; const ids = JSON.parse(refs.candidates.dataset.cards); const card = catalogEntries.find(item => item.o === ids[Number(index)]); if (card) registerCard(card); });
  $('#dismiss-candidates').addEventListener('click', () => hideCandidates(true));
  refs.searchForm.addEventListener('submit', event => { event.preventDefault(); renderSearchResults(refs.searchInput.value); });
  refs.searchInput.addEventListener('input', () => { if (refs.searchInput.value.trim().length >= 3) renderSearchResults(refs.searchInput.value); else refs.searchResults.innerHTML = ''; });
  refs.searchResults.addEventListener('click', event => { const index = event.target.closest('[data-search-result]')?.dataset.searchResult; if (index === undefined) return; const ids = JSON.parse(refs.searchResults.dataset.cards); const card = catalogEntries.find(item => item.o === ids[Number(index)]); if (card) { registerCard(card); refs.searchResults.innerHTML = ''; refs.searchInput.value = card.n; } });
  $('#value-threshold').value = settings.threshold; $('#need-sound').checked = settings.needSound; $('#value-sound').checked = settings.valueSound;
  $('#value-threshold').addEventListener('change', event => { settings.threshold = Math.max(0, Number(event.target.value) || 0); saveSettings(); });
  [['#need-sound', 'needSound'], ['#value-sound', 'valueSound']].forEach(([selector, key]) => $(selector).addEventListener('change', event => { settings[key] = event.target.checked; saveSettings(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCamera('Camera paused by Safari. Tap Start scanning to resume.'); });
  window.addEventListener('pagehide', () => { stream?.getTracks().forEach(track => track.stop()); worker?.terminate(); });

  renderDecks();
  try {
    await loadCatalog(); renderDecks();
    const warmOcr = () => ensureWorker(true).catch(() => {}); if ('requestIdleCallback' in window) requestIdleCallback(warmOcr, { timeout: 1500 }); else setTimeout(warmOcr, 400);
  } catch (error) { setStatus(`${error.message} Manual search and deck matching need the catalog.`); }
  window.MTGBulkScanner = { search: searchCards, deckMatches, getProfile: () => profile };
})();
