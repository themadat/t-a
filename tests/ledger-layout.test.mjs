import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { domain, moneyFields, roundFields } from './domain-harness.mjs';

function client(person) {
  const App = domain(); let state = App.stateModel.createDefaultState();
  App.icons = { markup: () => "" }; App.identity = { person: () => person }; App.storage = { getState: () => state };
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8').replace('App.ledgerUI = { init,', 'App.ledgerUI = { layout, combinedEntries, withLedgerStart, filterCategory, matchesFilters, roundBalances, expandedRow, detailContent, init,');
  vm.runInNewContext(source, { window: { LocalApp: App, matchMedia: () => ({ matches: false }) }, document: {}, Date });
  return { App, get state() { return state; }, normalize() { state = App.stateModel.normalize(state); } };
}
test('layout defaults are personal and overrides remain local through sync', () => {
  for (const [person, expected] of [['Adam', 'compact'], ['Tristen', 'expanded'], ['', 'expanded']]) {
    const h = client(person); assert.equal(h.App.ledgerUI.layout(), expected);
    h.state.preferences.ledgerLayouts[person || 'default'] = expected === 'compact' ? 'expanded' : 'compact';
    h.normalize(); assert.notEqual(h.App.ledgerUI.layout(), expected);
    const remote = h.App.stateModel.createDefaultState();
    const applied = h.App.stateModel.applySync(h.state, remote);
    assert.deepEqual(applied.preferences.ledgerLayouts, h.state.preferences.ledgerLayouts);
    assert.ok(!JSON.stringify(h.App.stateModel.syncPayload(h.state)).includes('ledgerLayouts'));
  }
});
test('combined entries combine Golf Winnings with rounds while retaining payments and historical money', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  const money = l.saveMoney(w, moneyFields, 'Adam');
  const round = l.saveRound(w, { ...roundFields, paymentCents: 2000, payer: 'Tristen' }, 'Tristen', '', true);
  const historical = l.saveRound(w, { ...roundFields, date: '2025' }, 'Adam', '', true);
  const deleted = l.saveMoney(w, moneyFields, 'Adam'); l.remove(w, 'moneyEntries', deleted.id, 'Adam');
  const rows = App.ledgerUI.combinedEntries(w);
  assert.equal(rows.length, 4);
  assert.equal(rows.find(row => row.id === money.id).entryType, 'money');
  assert.equal(rows.find(row => row.id === round.id).entryType, 'golf');
  assert.equal(rows.filter(row => row.entryType === 'golf').length, 2);
  assert.equal(rows.filter(row => row.sourceRoundId === round.id).length, 1);
  assert.equal(rows.filter(row => row.sourceRoundId === historical.id).length, 0);
  assert.ok(!rows.some(row => row.id === deleted.id));
  const marked = App.ledgerUI.withLedgerStart(rows, row => row.id + '\n', true);
  assert.equal(marked.match(/Ledger Begins/g).length, 1);
  assert.ok(marked.indexOf('Ledger Begins') < marked.indexOf(historical.id));
  assert.ok(marked.indexOf(round.id) < marked.indexOf('Ledger Begins'));
});
test('category chips combine with year and search while preserving ledger totals', () => {
  const h = client('Tristen'), { App, state } = h, l = App.ledger, w = state.workspace;
  const food = l.saveMoney(w, { ...moneyFields, category:'Food', description:'Lunch' }, 'Adam');
  const bet = l.saveMoney(w, { ...moneyFields, date:'2025', category:'Bets', description:'Historical wager' }, 'Adam');
  const round = l.saveRound(w, { ...roundFields, course:'Willow course' }, 'Adam', '', true);
  const before = l.totals(w.moneyEntries).balance;
  const rows = App.ledgerUI.combinedEntries(w), filtered = () => rows.filter(row => App.ledgerUI.matchesFilters(row, row.entryType === 'golf'));
  state.ui.ledgerCategories = ['Rounds'];
  assert.equal(filtered().length, 1);
  assert.ok(filtered().some(row => row.id === round.id));
  assert.ok(!filtered().some(row => row.sourceRoundId === round.id && row.linkRole === 'winnings'));
  state.ui.ledgerSearch = 'willow';
  assert.equal(filtered().length, 1);
  state.ui.ledgerSearch = '';
  state.ui.ledgerCategories = ['Food', 'Bets'];
  assert.deepEqual(Array.from(filtered(), row => row.id).sort(), [food.id, bet.id].sort());
  state.ui.ledgerYear = '2025';
  state.ui.ledgerSearch = 'historical';
  assert.deepEqual(Array.from(filtered(), row => row.id), [bet.id]);
  assert.equal(l.totals(w.moneyEntries).balance, before);
  state.ui.ledgerCategories = ['Golf','Golf','invalid']; h.normalize();
  assert.deepEqual(Array.from(h.state.ui.ledgerCategories), ['Rounds']);
  assert.ok(!JSON.stringify(App.stateModel.syncPayload(h.state)).includes('ledgerCategories'));
});

test('Expanded round balances include Golf Winnings once and keep a zero round at its chronological balance', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  l.saveMoney(w, { ...moneyFields, date:'2026-01-01', amountCents:500, to:'Adam', from:'Tristen' }, 'Adam');
  const zero = l.saveRound(w, { ...roundFields, winningsCents:0, winner:'', date:'2026-01-02', adam:null }, 'Tristen', '', true);
  const round = l.saveRound(w, { ...roundFields, date:'2026-01-03', betWinningsCents:100, betWinner:'Tristen' }, 'Adam', '', true);
  const rows = App.ledgerUI.combinedEntries(w), balances = App.ledgerUI.roundBalances(w), total = l.totals(w.moneyEntries);
  assert.equal(balances[zero.id], 500);
  assert.ok(rows.indexOf(rows.find(row => row.id === round.betEntryId)) < rows.indexOf(rows.find(row => row.id === round.id)));
  assert.equal(total.running[round.winningsEntryId], 900);
  const html = App.ledgerUI.expandedRow(rows.find(row => row.id === round.id), total, balances);
  assert.match(html, /expanded-amount[^]*?\$4[^]*?To Adam/);
  assert.match(html, /expanded-balance[^]*?\$9[^]*?To Adam/);
  assert.match(html, />Rounds<\/span>/);
  const zeroHtml = App.ledgerUI.expandedRow(rows.find(row => row.id === zero.id), total, balances);
  assert.match(zeroHtml, /Scores Unknown/); assert.match(zeroHtml, /expanded-amount[^]*?\$0/);
  assert.equal(w.moneyEntries.some(row => row.amountCents === 0), false);
});

test('inline details render both winnings safely, including unknown scores and user text', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  const round = l.saveRound(w, { ...roundFields, adam:null, betWinningsCents:200, betWinner:'Tristen', details:'<script>keep as text</script>' }, 'Adam', '', true);
  const html = App.ledgerUI.detailContent('golf', round);
  assert.match(html, /Adam Score<\/dt><dd>Unknown/);
  assert.match(html, /Golf Winnings<\/dt><dd>Adam \+\$4/);
  assert.match(html, /Bet Winnings<\/dt><dd>Tristen \+\$2/);
  assert.match(html, /&lt;script&gt;keep as text&lt;\/script&gt;/);
  assert.match(html, /Edit Round/); assert.match(html, /Edit Category And Notes/);
  const bet = w.moneyEntries.find(x => x.id === round.betEntryId);
  assert.match(App.ledgerUI.detailContent('money', bet), /Edit Money Entry/);
});
