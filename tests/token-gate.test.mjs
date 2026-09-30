import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { domain, moneyFields } from './domain-harness.mjs';

async function client(initialToken = '') {
  const App = domain(), state = App.stateModel.createDefaultState(), remote = App.stateModel.createDefaultState();
  let token = initialToken, synced = true, finishSync, signalSync;
  const syncStarted = new Promise(resolve => { signalSync = resolve; });
  const eventListeners = new Map(), classes = new Set(), nodes = new Map();
  for (const id of ['tokenForm', 'tokenDialog', 'startupToken', 'startupTokenSave', 'startupTokenStatus', 'startupRememberToken', 'saveTokenLabels']) {
    nodes.set('#' + id, { value: '', checked: true, open: false, handlers: {}, attrs: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, setAttribute(name, value) { this.attrs[name] = value; }, removeAttribute(name) { delete this.attrs[name]; } });
  }
  const window = { LocalApp: App, addEventListener(name, fn) { if (!eventListeners.has(name)) eventListeners.set(name, []); eventListeners.get(name).push(fn); }, dispatchEvent(event) { for (const fn of eventListeners.get(event.type) || []) fn(event); } };
  const document = { querySelector: selector => nodes.get(selector) || null, body: { classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } } } };
  App.components = { openDialog(dialog) { dialog.open = true; }, closeDialog(dialog) { dialog.open = false; } };
  App.storage = { getSecret: () => token, getState: () => state, saveNow: () => true, mutate(fn) { fn(state); } };
  App.sync = { getInfo: () => ({ busy: false }), inspectToken: async () => remote, saveConfiguration(input) { token = input.token; }, async syncNow() { await new Promise(resolve => { finishSync = resolve; signalSync(); }); if (synced) state.workspace = structuredClone(remote.workspace); return synced; } };
  vm.runInNewContext(readFileSync(new URL('../assets/js/core/identity.js', import.meta.url), 'utf8'), { window, document, crypto: webcrypto, TextEncoder, CustomEvent: class { constructor(type) { this.type = type; } } });
  remote.workspace.tokenLabels = { Tristen: await App.identity.fingerprint('synthetic-token') };
  App.ledger.saveMoney(remote.workspace, moneyFields, 'Adam');
  App.identity.init();
  return { App, state, nodes, classes, get token() { return token; }, failSync() { synced = false; }, finishSync() { finishSync(); }, waitForSync: () => syncStarted, async submit() { nodes.get('#startupToken').value = 'synthetic-token'; return nodes.get('#tokenForm').handlers.submit({ preventDefault() {} }); } };
}
test('startup stays gated until token verification and latest data sync both succeed', async () => {
  const h = await client(), dialog = h.nodes.get('#tokenDialog');
  assert.equal(dialog.open, true); assert.ok(h.classes.has('token-required'));
  let cancelled = false; dialog.handlers.cancel({ preventDefault() { cancelled = true; } }); assert.ok(cancelled);
  const pending = h.submit();
  await h.waitForSync();
  assert.equal(h.token, 'synthetic-token'); assert.equal(dialog.open, true);
  assert.ok(h.nodes.get('#startupTokenSave').disabled);
  h.finishSync(); await pending;
  assert.equal(dialog.open, false); assert.ok(!h.classes.has('token-required'));
  assert.equal(h.state.workspace.moneyEntries.length, 1); assert.equal(h.App.identity.person(), 'Tristen');
  assert.equal(h.nodes.get('#startupToken').value, '');
});
test('failed initial sync retains the token screen and permits retry', async () => {
  const h = await client(); h.failSync(); const pending = h.submit();
  await h.waitForSync(); h.finishSync(); await pending;
  assert.equal(h.nodes.get('#tokenDialog').open, true); assert.ok(h.classes.has('token-required'));
  assert.match(h.nodes.get('#startupTokenStatus').textContent, /successful Sync Now/);
  assert.equal(h.nodes.get('#startupTokenSave').disabled, false);
  assert.equal(h.state.workspace.moneyEntries.length, 0);
});
test('a stored token opens the app directly', async () => {
  const h = await client('synthetic-token');
  assert.equal(h.nodes.get('#tokenDialog').open, false);
  assert.ok(!h.classes.has('token-required'));
});
