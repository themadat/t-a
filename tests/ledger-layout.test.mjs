import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { domain, moneyFields, roundFields } from './domain-harness.mjs';

function client(person) {
  const App = domain(); let state = App.stateModel.createDefaultState();
  App.identity = { person: () => person }; App.storage = { getState: () => state };
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8').replace('App.ledgerUI = { init,', 'App.ledgerUI = { layout, combinedEntries, withLedgerStart, init,');
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
test('combined entries show each round once while retaining standalone money and history', () => {
  const { App, state } = client('Tristen'), l = App.ledger, w = state.workspace;
  const money = l.saveMoney(w, moneyFields, 'Adam');
  const round = l.saveRound(w, { ...roundFields, paymentCents: 2000, payer: 'Tristen' }, 'Tristen', '', true);
  const historical = l.saveRound(w, { ...roundFields, date: '2025' }, 'Adam', '', true);
  const deleted = l.saveMoney(w, moneyFields, 'Adam'); l.remove(w, 'moneyEntries', deleted.id, 'Adam');
  const rows = App.ledgerUI.combinedEntries(w);
  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => row.id === money.id).entryType, 'money');
  assert.equal(rows.find(row => row.id === round.id).entryType, 'golf');
  assert.equal(rows.at(-1).id, historical.id);
  const marked = App.ledgerUI.withLedgerStart(rows, row => row.id + '\n', true);
  assert.equal(marked.match(/Ledger Begins/g).length, 1);
  assert.ok(marked.indexOf('Ledger Begins') < marked.indexOf(historical.id));
  assert.ok(marked.indexOf(round.id) < marked.indexOf('Ledger Begins'));
});
