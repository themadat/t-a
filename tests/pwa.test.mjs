import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

function harness({ online = true, saved = true, layout = 'compact' } = {}) {
  const events = [], timers = [], listeners = {};
  const label = { textContent:'Update' };
  const button = { dataset: {}, setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; }, querySelector(selector) { return selector === '.button-label' ? label : {}; }, addEventListener() {} };
  const worker = { postMessage(message) { events.push(message.type); } };
  const registration = { waiting: worker, async update() { events.push('check'); }, addEventListener() {} };
  const App = {
    config: { identity: { buildId: 'test', assets: {} } },
    storage: { saveNow() { events.push('save'); return saved; }, getState() { return { preferences: { appearance: { mode: 'light' } } }; } },
    icons: { set(_element, name) { events.push(name); } },
    components: { toast(message) { events.push(message); } }
  };
  const context = vm.createContext({
    window: { LocalApp: App, setTimeout(fn) { timers.push(fn); }, clearTimeout() {}, addEventListener() {}, matchMedia() { return { matches: false, addEventListener() {} }; } },
    document: { querySelector(selector) { return selector === '#updateAppButton' ? button : null; }, documentElement: { dataset: { ledgerLayout:layout } } },
    navigator: { onLine: online, serviceWorker: { controller: {}, async register() { return registration; }, async getRegistration() { return registration; }, addEventListener(name, fn) { listeners[name] = fn; } } },
    location: { protocol: 'https:', href: 'https://example.com/app/', replace(url) { events.push(url); } },
    URL, console
  });
  vm.runInContext(readFileSync(new URL('../assets/js/core/pwa.js', import.meta.url), 'utf8'), context);
  return { App, events, timers, button, label, listeners };
}

test('available update changes the toolbar indicator without a pop-up', async () => {
  const h = harness();
  h.App.pwa.init();
  await new Promise(setImmediate);
  assert.equal(h.button.dataset.updateAvailable, 'true');
  assert.match(h.button['aria-label'], /new version available/);
  assert.ok(h.events.includes('updateReady'));
  assert.equal(h.events.length, 2);
});

test('update saves before checking and activates the waiting worker before refresh', async () => {
  const h = harness();
  await h.App.pwa.checkForUpdates(h.button);
  assert.deepEqual(h.events.slice(0, 3), ['save', 'check', 'SKIP_WAITING']);
  h.timers.at(-1)();
  assert.match(h.events.at(-1), /force-refresh=/);
  assert.equal(h.button.disabled, false);
  assert.equal(h.button['aria-busy'], undefined);
});
test('Expanded labels its Settings action Force Update and retains update availability', async () => {
  const h = harness({layout:'expanded'}); h.App.pwa.init();
  await new Promise(setImmediate);
  h.App.pwa.renderUpdateControl();
  assert.equal(h.label.textContent, 'Force Update');
  assert.match(h.button['aria-label'], /^Force Update.*new version available/);
  assert.equal(h.button.dataset.updateAvailable, 'true');
});

for (const options of [{ online: false }, { saved: false }]) {
  test('update pauses safely for ' + JSON.stringify(options), async () => {
    const h = harness(options);
    await h.App.pwa.checkForUpdates(h.button);
    assert.equal(h.timers.length, 0);
    assert.ok(!h.events.includes('check'));
    assert.match(h.events.at(-1), /internet|could not be saved/);
  });
}
