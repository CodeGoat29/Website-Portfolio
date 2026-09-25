(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  // Rejection sampling avoids modulo bias when choosing a random character.
  function randomBelow(limit) {
    const buffer = new Uint32Array(1);
    const ceiling = Math.floor(4294967296 / limit) * limit;
    do { crypto.getRandomValues(buffer); } while (buffer[0] >= ceiling);
    return buffer[0] % limit;
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
  byId('password-form').addEventListener('submit', event => {
    event.preventDefault();
    const length = Number(byId('password-length').value);
    if (!Number.isInteger(length) || length < 4 || length > 128) {
      byId('password-status').textContent = 'Enter a whole-number length from 4 to 128.';
      return;
    }
    byId('password-result').value = Array.from({length}, () => alphabet[randomBelow(alphabet.length)]).join('');
    byId('copy-password').disabled = false;
    byId('password-status').textContent = `Generated ${length} characters.`;
  });
  byId('copy-password').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(byId('password-result').value);
      byId('password-status').textContent = 'Copied to clipboard.';
    } catch {
      byId('password-result').focus();
      byId('password-result').select();
      byId('password-status').textContent = 'Password selected. Use your keyboard or device menu to copy.';
    }
  });
  let secret, remaining, finished;
  function reset() {
    secret = randomBelow(100) + 1;
    remaining = 10;
    finished = false;
    byId('attempts-left').textContent = remaining;
    byId('guess-input').value = '';
    byId('guess-input').disabled = false;
    byId('guess-button').disabled = false;
    byId('guess-history').replaceChildren();
    byId('game-status').textContent = 'A number is ready. Make your first guess!';
  }
  byId('guess-form').addEventListener('submit', event => {
    event.preventDefault();
    if (finished) return;
    const guess = Number(byId('guess-input').value);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      byId('game-status').textContent = 'Enter a whole number from 1 to 100. No guess used.';
      return;
    }
    remaining--;
    const hint = guess === secret ? 'Correct!' : guess < secret ? 'Go higher.' : 'Go lower.';
    const entry = document.createElement('li');
    entry.textContent = `${guess} — ${hint}`;
    byId('guess-history').append(entry);
    byId('attempts-left').textContent = remaining;
    finished = guess === secret || remaining === 0;
    byId('game-status').textContent = guess === secret ? `You won in ${10 - remaining} ${remaining === 9 ? 'guess' : 'guesses'}!` : remaining === 0 ? `Out of guesses! The number was ${secret}. Start a new game to try again.` : hint;
    byId('guess-input').disabled = finished;
    byId('guess-button').disabled = finished;
    if (!finished) { byId('guess-input').value = ''; byId('guess-input').focus(); }
  });
  byId('new-game').addEventListener('click', () => { reset(); byId('guess-input').focus(); });
  reset();
})();
