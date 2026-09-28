import assert from 'node:assert/strict';
import { test } from 'node:test';
import { domain } from './domain-harness.mjs';
const note = `Sample\nMoney\nDate What Amount Running Total\n2025-01-01 Lunch Adam => Tristen: $10 -$10\n2025-01-02 Golf Bets Tristan => Adam: $2 -$8\n2025-01-03 Dollar Bet Tristan => Adam: $1 -$7\n2025-01-03 Dollar Bet Tristan => Adam: $1 -$6\nRounds\n2025: Adam-2 | Adam +$2\n2025-01-02: Adam 90 | Tristan 92 | A-2 | Adam +$2\n2025-??-??: Adam 50 | Tristan 50 | EVEN | EVEN +$0\nReference notes\nKeep this appendix.`;
test('reviewed import preserves repeats, unknown dates, appendix, totals and exact links', async () => {
  const a = domain(), parsed = await a.noteImport.parse(note), w = a.stateModel.createDefaultState().workspace;
  assert.equal(parsed.moneyEntries.length, 4); assert.equal(parsed.golfRounds.length, 2); assert.equal(parsed.balance, -600);
  assert.equal(parsed.golfRounds[1].date, '2025'); assert.match(parsed.appendix, /Keep this appendix/); assert.equal(parsed.warnings.length, 0);
  const result = a.noteImport.apply(w, parsed, true, false); assert.equal(result.added, 6);
  assert.equal(w.golfRounds[0].winningsEntryId, w.moneyEntries[1].id); assert.equal(a.ledger.totals(w.moneyEntries).balance, -600);
  assert.equal(a.noteImport.apply(w, parsed, true, false).added, 0); assert.equal(w.moneyEntries.length, 4);
});
test('missing or differing historical winnings do not silently post extra money', async () => {
  const a = domain(), parsed = await a.noteImport.parse(note.replace('Adam +$2\n2025-??', 'Adam +$4\n2025-??'));
  assert.ok(parsed.warnings.length); assert.equal(parsed.matches.length, 0);
  const w = a.stateModel.createDefaultState().workspace; a.noteImport.apply(w, parsed, true, false);
  assert.equal(a.ledger.totals(w.moneyEntries).balance, -600); assert.match(w.golfRounds[0].review, /differ/);
});
test('unrecognized money lines reject rather than disappear; edited imports require duplicate review', async () => {
  const a = domain(); await assert.rejects(a.noteImport.parse(note.replace('Lunch Adam =>', 'Lunch ???')));
  const w = a.stateModel.createDefaultState().workspace; a.noteImport.apply(w, await a.noteImport.parse(note), true, false);
  const edited = await a.noteImport.parse(note.replace('Lunch', 'Dinner'));
  assert.throws(() => a.noteImport.apply(w, edited, true, false), /Review possible duplicates/);
});
