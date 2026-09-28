import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { domain } from './domain-harness.mjs';

test('private Notes sections become rules and contact actions', () => {
  const App = domain();
  const data = App.info.parse(`Other private notes

Bad (drunk) golf rules
1. Finish the current drink after the agreed score
2. A quoted “mulligan” has its own consequence

Example Contacts:
Sample Person :: Friend :: (202) 555-0147 :: sample.person@example.test`);
  assert.deepEqual(Array.from(data.rules), [
    'Finish the current drink after the agreed score',
    'A quoted “mulligan” has its own consequence'
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(data.contacts)), [{
    name: 'Sample Person', relationship: 'Friend', phone: '(202) 555-0147', email: 'sample.person@example.test'
  }]);
  assert.equal(App.info.phoneHref(data.contacts[0].phone), 'tel:+12025550147');
});

test('invalid contacts and unrelated Notes are not exposed as Info', () => {
  const App = domain();
  assert.deepEqual(JSON.parse(JSON.stringify(App.info.parse('Notes only'))), { rules: [], contacts: [] });
  assert.equal(App.info.parse('Contacts:\nBroken :: line').contacts.length, 0);
  assert.equal(App.info.phoneHref('not a phone'), '');
});

test('private contact values are absent from public runtime source', () => {
  const files = ['index.html', 'assets/js/app.js', 'assets/js/config.js', 'assets/js/core/info.js'];
  const source = files.map(file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')).join('\n');
  for (const privateValue of ['seth.j.lauer', 'mml927', '301) 606']) assert.equal(source.includes(privateValue), false);
});
