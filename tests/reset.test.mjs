import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('reset shell resolves every retained static symbol without catalog scripts', () => {
  const context = vm.createContext({ window: {} });
  for (const file of ['config.js', 'icons.js']) vm.runInContext(read('assets/js/' + file), context);
  const source = ['index.html', 'assets/js/app.js', 'assets/js/core/components.js', 'assets/js/core/pwa.js', 'assets/js/core/sync.js'].map(read).join('\n');
  const symbols = new Set([...source.matchAll(/data-symbol="([\w.-]+)"|symbol:\s*["']([\w.-]+)["']/g)].map(m => m[1] || m[2]));
  for (const name of [...symbols, 'computer', 'developer', 'help', 'hintsOff', 'hintsOn', 'keyboard', 'moon', 'sun', 'saveConnection', 'testConnection', 'forgetConnection']) {
    assert.match(context.window.LocalApp.icons.markup(name), /<svg/, name);
  }
  const html = read('index.html'), worker = read('sw.js');
  assert.doesNotMatch(html + worker + read('assets/js/icons.js'), /icon-library|iconLibrary/);
  for (const match of (html + worker).matchAll(/(?:assets\/[\w/.-]+\.(?:js|css|svg|png))/g)) {
    assert.ok(existsSync(new URL('../' + match[0], import.meta.url)), match[0]);
  }
  const config = context.window.LocalApp.config;
  assert.equal(config.identity.name, 'T&A');
  assert.ok(config.releases[0].title.trim().length > 0);
  assert.equal(config.releases[0].version, config.identity.version);
  assert.equal(config.roadmap.length, 0);
  assert.match(config.storage.stateKey, /^t-a\./);
  for (const file of ['manifest.webmanifest', 'manifest-dark.webmanifest']) {
    const manifest = JSON.parse(read(file));
    assert.equal(manifest.name, config.identity.name);
    assert.equal(manifest.description, config.identity.description);
  }
});
