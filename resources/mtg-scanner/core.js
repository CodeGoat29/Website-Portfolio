(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MTGScannerCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SECTION_NAMES = new Map([
    ['commander', 'commander'], ['commanders', 'commander'],
    ['deck', 'mainboard'], ['mainboard', 'mainboard'], ['main deck', 'mainboard'],
    ['sideboard', 'sideboard'], ['maybeboard', 'maybeboard'], ['considering', 'maybeboard']
  ]);

  function normalizeName(value) {
    return String(value || '').normalize('NFKD').replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
  }

  function bigrams(value) {
    const normalized = ` ${normalizeName(value)} `;
    const grams = [];
    for (let index = 0; index < normalized.length - 1; index += 1) grams.push(normalized.slice(index, index + 2));
    return grams;
  }

  function similarity(left, right) {
    const a = bigrams(left); const b = bigrams(right);
    if (!a.length || !b.length) return 0;
    const counts = new Map();
    a.forEach(gram => counts.set(gram, (counts.get(gram) || 0) + 1));
    let overlap = 0;
    b.forEach(gram => { const count = counts.get(gram) || 0; if (count) { overlap += 1; counts.set(gram, count - 1); } });
    return (2 * overlap) / (a.length + b.length);
  }

  function findCandidates(query, entries, limit = 4) {
    const needle = normalizeName(query);
    if (needle.length < 2) return [];
    return entries.map(entry => ({ entry, score: similarity(needle, entry.n) }))
      .filter(item => item.score >= 0.42)
      .sort((a, b) => b.score - a.score || a.entry.n.localeCompare(b.entry.n))
      .slice(0, limit);
  }

  function parseCardLine(line) {
    const match = line.trim().match(/^(\d+)x?\s+(.+)$/i);
    if (!match) return null;
    const quantity = Number(match[1]);
    let remainder = match[2].replace(/\s+\*(?:F|E)\*\s*$/i, '').trim();
    let set = null; let collector = null;
    const printing = remainder.match(/\s+\(([A-Za-z0-9]+)\)\s+([^\s]+)\s*$/);
    if (printing) {
      set = printing[1].toLowerCase(); collector = printing[2];
      remainder = remainder.slice(0, printing.index).trim();
    }
    return { quantity, name: remainder, set, collector };
  }

  function parseDeckExport(text, options = {}, lookup = new Map(), entries = []) {
    const include = { commander: true, mainboard: true, sideboard: Boolean(options.sideboard), maybeboard: Boolean(options.maybeboard) };
    const cards = new Map(); const unrecognized = [];
    let section = 'mainboard';
    String(text || '').split(/\r?\n/).forEach((raw, index) => {
      const line = raw.trim();
      if (!line || line.startsWith('//')) return;
      const header = SECTION_NAMES.get(normalizeName(line.replace(/:$/, '')));
      if (header) { section = header; return; }
      const parsed = parseCardLine(line);
      if (!parsed) { unrecognized.push({ line: index + 1, text: raw, reason: 'Could not read quantity and card name' }); return; }
      if (!include[section]) return;
      const normalized = normalizeName(parsed.name);
      let identity = lookup.get(normalized);
      if (!identity && entries.length) {
        const candidate = findCandidates(parsed.name, entries, 1)[0];
        if (candidate?.score >= 0.94) identity = candidate.entry;
      }
      if (!identity) { unrecognized.push({ line: index + 1, text: raw, reason: 'Card name not found in catalog' }); return; }
      const key = identity.o || normalizeName(identity.n);
      const previous = cards.get(key) || { key, oracleId: identity.o || null, name: identity.n, quantity: 0, sections: [], owned: 0, shopping: 0 };
      previous.quantity += parsed.quantity;
      if (!previous.sections.includes(section)) previous.sections.push(section);
      cards.set(key, previous);
    });
    return { cards: [...cards.values()], unrecognized, recognizedCount: [...cards.values()].reduce((total, card) => total + card.quantity, 0) };
  }

  function mergeDeckCards(previousCards = [], importedCards = []) {
    const previous = new Map(previousCards.map(card => [card.oracleId || normalizeName(card.name), card]));
    return importedCards.map(card => {
      const prior = previous.get(card.oracleId || normalizeName(card.name));
      return { ...card, owned: Number(prior?.owned || 0), shopping: Number(prior?.shopping || 0) };
    });
  }

  function deckNeeds(card, decks = []) {
    return decks.flatMap(deck => deck.cards.filter(item =>
      (card.o && item.oracleId === card.o) || normalizeName(item.name) === normalizeName(card.n)
    ).map(item => ({ deckId: deck.id, deckName: deck.name, quantity: item.quantity, owned: item.owned || 0, needed: Math.max(0, item.quantity - (item.owned || 0)), shopping: item.shopping || 0 })));
  }

  function priceSummary(card, foil = false) {
    const index = foil ? 3 : 2;
    const values = (card?.p || []).map(printing => printing[index]).filter(value => Number.isFinite(value) && value > 0);
    if (!values.length) return { available: false, min: null, max: null };
    return { available: true, min: Math.min(...values), max: Math.max(...values) };
  }

  function createScanLatch(leaveMs = 1500) {
    let active = null; let lastSeen = 0;
    return {
      observe(name, now) {
        if (!name) {
          if (active && now - lastSeen >= leaveMs) active = null;
          return false;
        }
        lastSeen = now;
        if (active === name) return false;
        active = name;
        return true;
      },
      current() { return active; }
    };
  }

  function createRecognitionGate() {
    let activeKey = ''; let reads = 0;
    return {
      observe(candidate) {
        if (!candidate?.key) { activeKey = ''; reads = 0; return false; }
        if (candidate.key === activeKey) reads += 1;
        else { activeKey = candidate.key; reads = 1; }
        const quickMatch = candidate.score >= 0.94 && candidate.confidence >= 72 && candidate.margin >= 0.1;
        const repeatedMatch = candidate.score >= 0.74 && candidate.confidence >= 42 && candidate.margin >= 0.08;
        return (quickMatch && reads >= 2) || (repeatedMatch && reads >= 3);
      },
      count() { return reads; },
      key() { return activeKey; },
      reset() { activeKey = ''; reads = 0; }
    };
  }

  return { normalizeName, similarity, findCandidates, parseCardLine, parseDeckExport, mergeDeckCards, deckNeeds, priceSummary, createScanLatch, createRecognitionGate };
});
