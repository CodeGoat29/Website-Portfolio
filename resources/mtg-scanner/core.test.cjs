const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('./core.js');

const counterspell = { n: 'Counterspell', o: 'oracle-counterspell', p: [['dmr', '45', 1.25, 2.5, null, '2023-01-13']] };
const solRing = { n: 'Sol Ring', o: 'oracle-sol-ring', p: [['cmm', '396', 1.5, 2.8, null, '2023-08-04']] };
const lookup = new Map([['counterspell', counterspell], ['sol ring', solRing]]);

test('Moxfield export lines accept basic and printing-specific forms', () => {
  assert.deepEqual(C.parseCardLine('1 Counterspell'), { quantity: 1, name: 'Counterspell', set: null, collector: null });
  assert.deepEqual(C.parseCardLine('1 Counterspell (DMR) 45'), { quantity: 1, name: 'Counterspell', set: 'dmr', collector: '45' });
});

test('deck import includes commander/mainboard by default and optionally other boards', () => {
  const text = 'Commander\n1 Sol Ring\nDeck\n2 Counterspell (DMR) 45\nSideboard\n1 Sol Ring\nMaybeboard\n1 Counterspell';
  const base = C.parseDeckExport(text, {}, lookup, [counterspell, solRing]);
  assert.equal(base.recognizedCount, 3); assert.equal(base.cards.length, 2);
  const all = C.parseDeckExport(text, { sideboard: true, maybeboard: true }, lookup, [counterspell, solRing]);
  assert.equal(all.recognizedCount, 5);
});

test('unrecognized lines are reported without replacing prior counts', () => {
  const result = C.parseDeckExport('Deck\n1 Definitely Not A Card', {}, lookup, [counterspell, solRing]);
  assert.equal(result.recognizedCount, 0); assert.equal(result.unrecognized.length, 1);
  const merged = C.mergeDeckCards([{ ...counterspell, name: counterspell.n, oracleId: counterspell.o, quantity: 1, owned: 2, shopping: 1 }], [{ name: counterspell.n, oracleId: counterspell.o, quantity: 4 }]);
  assert.equal(merged[0].owned, 2); assert.equal(merged[0].shopping, 1); assert.equal(merged[0].quantity, 4);
});

test('alternate printings match deck needs by oracle identity across two decks', () => {
  const decks = [
    { id: 'p', name: 'Phenax', cards: [{ name: 'Counterspell', oracleId: counterspell.o, quantity: 2, owned: 1 }] },
    { id: 'c', name: 'Clavileño', cards: [{ name: 'Counterspell', oracleId: counterspell.o, quantity: 1, owned: 0 }] }
  ];
  const matches = C.deckNeeds({ n: 'Counterspell', o: counterspell.o, p: [['7ed', '67', 4, 12]] }, decks);
  assert.deepEqual(matches.map(match => [match.deckName, match.needed]), [['Phenax', 1], ['Clavileño', 1]]);
});

test('held cards alert once and the same name can register after leaving', () => {
  const latch = C.createScanLatch(1500);
  assert.equal(latch.observe('Counterspell', 0), true);
  assert.equal(latch.observe('Counterspell', 500), false);
  assert.equal(latch.observe(null, 2100), false); assert.equal(latch.current(), null);
  assert.equal(latch.observe('Counterspell', 2200), true);
});

test('recognition accepts an exceptionally clear read or two agreeing normal reads', () => {
  const gate = C.createRecognitionGate();
  assert.equal(gate.observe({ key: 'counterspell', score: .99, confidence: 90, margin: .24 }), true);
  const normal = { key: 'sol-ring', score: .84, confidence: 61, margin: .14 };
  assert.equal(gate.observe(normal), false);
  assert.equal(gate.observe(normal), true);
  assert.equal(gate.observe({ key: 'island', score: .82, confidence: 58, margin: .12 }), false);
  assert.equal(gate.count(), 1);
  assert.equal(gate.observe(null), false);
  assert.equal(gate.count(), 0);
});

test('price ranges respect foil mode and unavailable values', () => {
  const card = { p: [['a', '1', 1, 9], ['b', '2', 3, 7], ['c', '3', null, null]] };
  assert.deepEqual(C.priceSummary(card, false), { available: true, min: 1, max: 3 });
  assert.deepEqual(C.priceSummary(card, true), { available: true, min: 7, max: 9 });
  assert.equal(C.priceSummary({ p: [] }, false).available, false);
});
