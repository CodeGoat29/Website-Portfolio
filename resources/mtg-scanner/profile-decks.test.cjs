const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadProfile() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(`${__dirname}/profile-decks.js`, 'utf8'), context);
  return context.window.MTGProfileDecks;
}

test('the deployed profile contains all seven Moxfield decks and board snapshots', () => {
  const profile = loadProfile();
  assert.equal(profile.decks.length, 7);
  assert.deepEqual(
    JSON.parse(JSON.stringify(profile.decks.map(deck => Object.fromEntries(Object.entries(deck.boards).map(([board, cards]) => [board, cards.reduce((sum, card) => sum + card.q, 0)]))))),
    [
      { mainboard: 100, sideboard: 6, considering: 22 },
      { mainboard: 100, sideboard: 21, considering: 10 },
      { mainboard: 8, sideboard: 0, considering: 0 },
      { mainboard: 100, sideboard: 26, considering: 102 },
      { mainboard: 100, sideboard: 18, considering: 4 },
      { mainboard: 100, sideboard: 7, considering: 0 },
      { mainboard: 100, sideboard: 0, considering: 0 }
    ]
  );
  profile.decks.forEach(deck => assert.match(deck.url, /^https:\/\/moxfield\.com\/decks\//));
});

test('shared cards remain visible in every matching deck', () => {
  const profile = loadProfile();
  const matches = profile.decks.filter(deck => Object.values(deck.boards).flat().some(card => card.n === 'Arcane Signet'));
  assert.equal(matches.length, 6);
  assert.ok(profile.decks[0].boards.sideboard.some(card => card.n === 'Strionic Resonator'));
  assert.ok(profile.decks[0].boards.considering.some(card => card.n === 'Anointed Procession'));
});
