import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { domain } from './domain-harness.mjs';

function quickClient(person = 'Adam', persistent = true) {
  const App = domain(), state = App.stateModel.createDefaultState(), notices = [];
  App.identity = { person: () => person };
  App.storage = { getState: () => state, mutate: fn => fn(state), saveNow: () => persistent };
  App.components = { toast: (message, options) => notices.push({ message, ...options }) };
  // Expose the real UI action in this isolated harness; no browser data is touched.
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8')
    .replace('App.ledgerUI = { init,', 'App.ledgerUI = { quickRound, init,');
  vm.runInNewContext(source, { window: { LocalApp: App, matchMedia: () => ({ matches: true }) }, document: {}, Date });
  return { App, state, notices };
}
test('quick round buttons record $20 owed to the buyer and clear filters', () => {
  const { App, state } = quickClient();
  state.ui.ledgerSearch = 'hidden'; state.ui.ledgerYear = '2025';
  App.ledgerUI.quickRound('Tristan');
  const first = state.workspace.moneyEntries[0];
  assert.equal(first.from, 'Adam'); assert.equal(first.to, 'Tristan');
  assert.equal(first.amountCents, 2000); assert.equal(first.category, 'Golf');
  assert.equal(first.description, 'Golf Round'); assert.equal(first.createdBy, 'Adam');
  assert.equal(App.ledger.totals(state.workspace.moneyEntries).balance, -2000);
  App.ledgerUI.quickRound('Adam');
  assert.equal(state.workspace.moneyEntries.length, 2);
  assert.equal(App.ledger.totals(state.workspace.moneyEntries).balance, 0);
  assert.equal(state.ui.ledgerSearch, ''); assert.equal(state.ui.ledgerYear, '');
});
test('quick entries require identity and report failed persistence honestly', () => {
  const unknown = quickClient(''); unknown.App.ledgerUI.quickRound('Adam');
  assert.equal(unknown.state.workspace.moneyEntries.length, 0);
  assert.equal(unknown.notices[0].kind, 'warning');
  const blocked = quickClient('Tristan', false); blocked.App.ledgerUI.quickRound('Adam');
  assert.equal(blocked.state.workspace.moneyEntries.length, 1);
  assert.equal(blocked.notices[0].title, 'Storage needs attention');
});
