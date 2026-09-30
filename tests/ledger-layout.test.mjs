import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { domain, moneyFields, roundFields } from './domain-harness.mjs';

function client(person) {
  const App = domain(); let state = App.stateModel.createDefaultState();
  App.icons = { markup: () => "" }; App.components = {}; App.identity = { person: () => person }; App.storage = { getState: () => state };
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8').replace('App.ledgerUI = { init,', 'App.ledgerUI = { quickRound, layout, compactMoneyEntries, moneyRow, golfRow, combinedEntries, withLedgerStart, filterCategory, matchesFilters, roundBalances, expandedRow, detailContent, init,');
  vm.runInNewContext(source, { window: { LocalApp: App, matchMedia: () => ({ matches: false }) }, document: {}, Date });
  return { App, get state() { return state; }, normalize() { state = App.stateModel.normalize(state); } };
}
test('Round Paid waits for confirmation and cancellation leaves the ledger unchanged', async () => {
  for (const payer of ['Adam', 'Tristen']) {
    for (const accepted of [false, true]) {
      const { App, state } = client('Adam'); let resolve, prompt, saves = 0;
      App.components.confirm = options => { prompt = options; return new Promise(done => { resolve = done; }); };
      App.components.toast = () => {};
      App.storage.mutate = change => change(state);
      App.storage.saveNow = () => { saves++; return true; };
      const pending = App.ledgerUI.quickRound(payer);
      assert.match(prompt.message, new RegExp((payer === 'Adam' ? 'Tristen' : 'Adam') + ' owes ' + payer + ' \\$20'));
      assert.equal(state.workspace.moneyEntries.length, 0);
      resolve(accepted); await pending;
      assert.equal(state.workspace.moneyEntries.length, accepted ? 1 : 0);
      assert.equal(saves, accepted ? 1 : 0);
      if (accepted) {
        const entry = state.workspace.moneyEntries[0];
        assert.equal(entry.to, payer); assert.equal(entry.amountCents, 2000); assert.equal(entry.category, 'Golf');
      }
    }
  }
});
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

test('Compact and Expanded show zero-winnings rounds without persisting zero Money entries', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  for (let i = 0; i < 35; i++) l.saveMoney(w, moneyFields, 'Adam');
  for (let i = 0; i < 17; i++) l.saveRound(w, roundFields, 'Adam', '', true);
  const before = l.totals(w.moneyEntries).balance;
  const zero = l.saveRound(w, { ...roundFields, winningsCents: 0, winner: '' }, 'Adam', '', true);
  assert.equal(l.active(w.moneyEntries).length, 52);
  assert.equal(l.active(w.golfRounds).length, 18);
  const rows = App.ledgerUI.combinedEntries(w);
  assert.equal(rows.length, 53);
  assert.equal(rows.filter(row => row.id === zero.id).length, 1);
  assert.equal(w.moneyEntries.some(row => row.sourceRoundId === zero.id), false);
  assert.equal(l.totals(w.moneyEntries).balance, before);
  const compact = App.ledgerUI.compactMoneyEntries(w);
  assert.equal(compact.length, rows.length);
  const zeroMoney = compact.find(row => row.zeroRound?.id === zero.id);
  assert.ok(zeroMoney && zeroMoney.amountCents === 0);
  const html = App.ledgerUI.moneyRow(zeroMoney, App.ledgerUI.roundBalances(w)[zero.id]);
  assert.match(html, /entry-amount[^]*?\$0/);
  assert.ok(html.includes('data-edit-golf="' + zero.id + '"'));
  assert.ok(!html.includes('data-edit-money="' + zeroMoney.id + '"'));
  assert.match(App.ledgerUI.golfRow(zero), /golf-winnings">\$0</);
  l.saveRound(w, { ...zero, winningsCents:400, winner:'Adam' }, 'Adam', zero.id, true);
  assert.equal(App.ledgerUI.compactMoneyEntries(w).filter(row => row.zeroRound?.id === zero.id).length, 0);
  assert.equal(App.ledgerUI.compactMoneyEntries(w).length, App.ledgerUI.combinedEntries(w).length);

});
test('category chips combine with year and search while preserving ledger totals', () => {
  const h = client('Tristen'), { App, state } = h, l = App.ledger, w = state.workspace;
  const food = l.saveMoney(w, { ...moneyFields, category:'Food', description:'Lunch' }, 'Adam');
  const bet = l.saveMoney(w, { ...moneyFields, date:'2025', category:'Bets', description:'Historical wager' }, 'Adam');
  const round = l.saveRound(w, { ...roundFields, course:'Willow course' }, 'Adam', '', true);
  const before = l.totals(w.moneyEntries).balance;
  const rows = App.ledgerUI.combinedEntries(w), filtered = () => rows.filter(row => App.ledgerUI.matchesFilters(row, row.entryType === 'golf'));
  state.ui.ledgerCategories = ['Wins'];
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
  assert.deepEqual(Array.from(h.state.ui.ledgerCategories), ['Golf']);
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
  assert.match(html, /expanded-amount[^]*?\$4[^]*?to Adam/);
  assert.match(html, /expanded-balance[^]*?\$9[^]*?to Adam/);
  assert.match(html, />Wins<\/span>/);
  assert.ok(!html.includes('expanded-result'));
  assert.equal((html.split('</tr>')[0].match(/<td /g) || []).length, 6);
  const zeroHtml = App.ledgerUI.expandedRow(rows.find(row => row.id === zero.id), total, balances);
  assert.match(zeroHtml, /Adam: UNK • Tristen: 94/); assert.match(zeroHtml, /expanded-amount[^]*?\$0/);
  assert.equal(w.moneyEntries.some(row => row.amountCents === 0), false);
});

test('inline details render both winnings safely, including unknown scores and user text', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  const round = l.saveRound(w, { ...roundFields, adam:null, betWinningsCents:200, betWinner:'Tristen', details:'<script>keep as text</script>' }, 'Adam', '', true);
  const html = App.ledgerUI.detailContent('golf', round);
  assert.match(html, /Adam Score<\/dt><dd>UNK/);
  assert.match(html, /Golf Winnings<\/dt><dd>Adam \+\$4/);
  assert.match(html, /Bet Winnings<\/dt><dd>Tristen \+\$2/);
  assert.match(html, /&lt;script&gt;keep as text&lt;\/script&gt;/);
  assert.match(html, />Edit<\/button>/); assert.ok(!html.includes('Close Details'));
  const bet = w.moneyEntries.find(x => x.id === round.betEntryId);
  const betHtml = App.ledgerUI.detailContent('money', bet);
  assert.match(betHtml, />Edit<\/button>/);
  for (const name of ['Date','What','Type','Payer','Payee','Amount','Balance']) assert.ok(!betHtml.includes('<dt>'+name+'</dt>'));
  assert.ok(!betHtml.includes('<dt>Tags</dt>'));
  for (const name of ['Course','Holes','Tags']) assert.ok(!html.includes('<dt>'+name+'</dt>'));
  assert.equal((html.match(/>Edit<\/button>/g) || []).length, 1);
  assert.match(html, new RegExp('data-edit-golf="' + round.id + '"'));
  assert.ok(!html.includes('data-edit-money=') && !html.includes('linked-entry-detail'));
});

test('Golf, Wins, and Bets filters stay distinct and linked tag edits remain authoritative', () => {
  const {App,state} = client('Tristen'), l = App.ledger, w = state.workspace;
  const round = l.saveRound(w, {...roundFields,paymentCents:2000,payer:'Adam',betWinningsCents:100,betWinner:'Tristen'}, 'Adam', '', true);
  const rows = () => App.ledgerUI.combinedEntries(w).filter(row => App.ledgerUI.matchesFilters(row,row.entryType === 'golf'));
  state.ui.ledgerCategories=['Golf']; assert.deepEqual(Array.from(rows(),row=>row.id),[round.paymentEntryId]);
  state.ui.ledgerCategories=['Wins']; assert.deepEqual(Array.from(rows(),row=>row.id),[round.id]);
  state.ui.ledgerCategories=['Bets']; assert.deepEqual(Array.from(rows(),row=>row.id),[round.betEntryId]);
  const winnings = w.moneyEntries.find(row=>row.id===round.winningsEntryId), balance = l.totals(w.moneyEntries).balance;
  l.saveMoney(w,{...winnings,category:'Other'},'Adam',winnings.id);
  state.ui.ledgerCategories=['Wins']; assert.equal(rows().length,0);
  state.ui.ledgerCategories=['Other']; assert.deepEqual(Array.from(rows(),row=>row.id),[round.id]);
  assert.equal(l.totals(w.moneyEntries).balance,balance);
  state.ui.ledgerCategories=['Rounds','Golf','Wins','Bets','Food','Other'];
  const normalized = App.stateModel.normalize(state);
  assert.deepEqual(Array.from(normalized.ui.ledgerCategories),['Wins','Golf','Bets','Food','Other']);
});
