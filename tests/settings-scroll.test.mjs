import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

function client(tab = 'settings') {
  const state = { ui: { supportTab: tab }, preferences: { controls: { developerMode: false } } };
  const nodes = new Map(), calls = { saves: 0, resets: 0, renders: 0 };
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { scrollTop: 400, scrollTo({ top }) { this.scrollTop = top; calls.resets++; } });
    return nodes.get(selector);
  };
  const source = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
  const functions = ['switchSupportTab', 'renderSupport'].map(name => source.match(new RegExp('  function ' + name + '\\([^]*?(?=\\n  function )'))[0]).join('\n');
  const context = vm.createContext({ $, $$: () => [], state: () => state, config: { features: { developerTools: true } },
    storage: { mutate(fn) { calls.saves++; fn(state); } },
    ...Object.fromEntries(['renderSettings','renderSyncSettings','renderInfo','renderHelp','renderReleases','renderShortcuts','renderSupportRoadmap','renderDeveloper'].map(name => [name, () => calls.renders++])) });
  vm.runInContext(functions, context);
  return { context, state, calls, $ };
}

test('background refresh of the current support section preserves scroll without saving a tab change', () => {
  for (const tab of ['settings', 'dataSync', 'help', 'releases']) {
    const h = client(tab);
    for (let i = 0; i < 3; i++) vm.runInContext('renderSupport()', h.context);
    assert.equal(h.calls.resets, 0, tab);
    assert.equal(h.calls.saves, 0, tab);
    assert.equal(h.calls.renders, 3, tab);
  }
});

test('explicit section navigation resets scroll, including reopening the same section', () => {
  const h = client();
  vm.runInContext("switchSupportTab('dataSync')", h.context);
  assert.equal(h.state.ui.supportTab, 'dataSync');
  assert.equal(h.calls.saves, 1);
  assert.equal(h.calls.resets, 3);
  vm.runInContext("switchSupportTab('dataSync')", h.context);
  assert.equal(h.calls.resets, 6);
  assert.equal(h.calls.saves, 1);
});

test('a revoked developer section returns to Settings and resets scroll during refresh', () => {
  const h = client('developer');
  vm.runInContext('renderSupport()', h.context);
  assert.equal(h.state.ui.supportTab, 'settings');
  assert.equal(h.calls.saves, 1);
  assert.equal(h.calls.resets, 3);
});
