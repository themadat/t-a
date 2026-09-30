import assert from 'node:assert/strict';
import { test } from 'node:test';
import { domain, moneyFields, roundFields } from './domain-harness.mjs';

test('fresh and pre-skin states default to Masters while retaining theme, colors, and content', () => {
  const App = domain(), model = App.stateModel;
  const state = model.createDefaultState();
  assert.equal(state.preferences.appearance.skin, 'masters');
  state.preferences.appearance.mode = 'dark';
  state.preferences.appearance.accent = '#123456';
  delete state.preferences.appearance.skin;
  App.ledger.saveMoney(state.workspace, moneyFields, 'Adam');
  App.ledger.saveRound(state.workspace, roundFields, 'Adam', '', true);
  const result = model.normalize(state);
  assert.equal(result.preferences.appearance.skin, 'masters');
  assert.equal(result.preferences.appearance.mode, 'dark');
  assert.equal(result.preferences.appearance.accent, '#123456');
  assert.deepEqual(result.workspace, state.workspace);
  state.preferences.appearance.skin = 'invalid';
  assert.equal(model.normalize(state).preferences.appearance.skin, 'masters');
});

test('Basic persists in backups and stays local through sync; preference reset restores Masters', () => {
  const App = domain(), model = App.stateModel;
  const local = model.createDefaultState(), remote = model.createDefaultState();
  local.preferences.appearance.skin = 'basic';
  local.preferences.appearance.mode = 'dark';
  App.ledger.saveMoney(local.workspace, moneyFields, 'Adam');
  const restored = model.normalize(JSON.parse(JSON.stringify(local)));
  assert.equal(restored.preferences.appearance.skin, 'basic');
  const applied = model.applySync(local, remote);
  assert.equal(applied.preferences.appearance.skin, 'basic');
  assert.equal(applied.preferences.appearance.mode, 'dark');
  assert.ok(!JSON.stringify(model.syncPayload(local)).includes('"skin"'));
  const reset = model.resetPreferences(local);
  assert.equal(reset.preferences.appearance.skin, 'masters');
  assert.deepEqual(reset.workspace, local.workspace);
});
