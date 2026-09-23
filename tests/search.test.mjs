import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const context = vm.createContext({ state: () => ({ ui: { searchNameOnly: true } }), u: { escapeHtml: s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') } });
vm.runInContext(source.slice(source.indexOf('  function searchTerms('), source.indexOf('  function selectedIconCategory(')) + source.slice(source.indexOf('  function highlightedSearchText('), source.indexOf('  function iconCard(')), context);
test('quoted words reject partial names while unquoted terms remain partial', () => {
  assert(context.iconMatches({label:'G Circle Fill'}, '"g" fill'));
  assert(context.iconMatches({label:'G Square Fill'}, '"G" fill'));
  assert(!context.iconMatches({label:'Gear Fill'}, '"g" fill'));
  assert(!context.iconMatches({label:'G Circle'}, '"g" fill'));
  assert(!context.iconMatches({label:'G2 Fill'}, '"g" fill'));
  assert(context.iconMatches({label:'Gear Fill'}, 'g fill'));
  assert(context.iconMatches({label:'G Circle Fill'}, '"g circle" fill'));
  assert(!context.iconMatches({label:'G Filled Circle'}, '"g circle"'));
});
test('highlights follow quoted boundaries and escape markup', () => {
  const output=context.highlightedSearchText('G Gear Fill <x>', '"g" fill');
  assert(output.includes('>G</mark> Gear'));
  assert(output.includes('>Fill</mark>'));
  assert(output.includes('&lt;x&gt;'));
});
