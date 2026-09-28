import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { moneyFields } from './domain-harness.mjs';
function memory() { const data = new Map(); return { getItem:k=>data.get(k) ?? null, setItem:(k,v)=>data.set(k,String(v)), removeItem:k=>data.delete(k) }; }
function client(localStorage, sessionStorage = memory()) {
  const events = [], window = { setTimeout:()=>1, clearTimeout() {}, addEventListener() {}, dispatchEvent:e=>events.push(e) };
  const context = vm.createContext({ window, localStorage, sessionStorage, navigator: {}, console, structuredClone, Blob,
    CustomEvent: class { constructor(type, opts) { this.type=type; this.detail=opts?.detail; } }, setTimeout:()=>1, clearTimeout() {} });
  for (const file of ['config','core/utils','core/ledger','core/state','core/storage']) {
    vm.runInContext(readFileSync(new URL('../assets/js/'+file+'.js', import.meta.url),'utf8'),context);
    if (file === 'core/utils') window.LocalApp.utils = { ...window.LocalApp.utils, sanitizeRichHtml:String, richTextToPlainText:String };
  }
  const App = window.LocalApp; App.storage.load(); return { App, sessionStorage, events, get state() { return App.storage.getState(); } };
}
function add(c, description) { c.App.storage.mutate(s=>c.App.ledger.saveMoney(s.workspace,{...moneyFields,description},'Adam')); }
function edit(c, id, description) { c.App.storage.mutate(s=>c.App.ledger.saveMoney(s.workspace,{...moneyFields,description},'Adam',id)); }
test('simultaneous tab saves merge additions and failed mutation is transactional',()=>{
  const disk=memory(), a=client(disk), b=client(disk);
  add(a,'A'); add(b,'B'); a.App.storage.saveNow(); b.App.storage.saveNow(); a.App.storage.saveNow();
  assert.equal(a.state.workspace.moneyEntries.length,2); assert.equal(b.state.workspace.moneyEntries.length,2);
  const before=JSON.stringify(a.state);
  assert.throws(()=>a.App.storage.mutate(s=>{s.workspace.moneyEntries.length=0;throw new Error('abort');}));
  assert.equal(JSON.stringify(a.state),before);
});
test('conflicting tab draft survives reload and can be resolved without losing the other version',()=>{
  const disk=memory(), a=client(disk); add(a,'Original'); a.App.storage.saveNow();
  const b=client(disk), id=a.state.workspace.moneyEntries[0].id;
  edit(a,id,'A edit'); edit(b,id,'B edit'); a.App.storage.saveNow();
  assert.equal(b.App.storage.saveNow(),false); assert.ok(b.App.storage.getTabConflict());
  const reloaded=client(disk,b.sessionStorage);
  assert.equal(reloaded.state.workspace.moneyEntries[0].description,'B edit');
  const conflict=reloaded.App.storage.getTabConflict(); assert.ok(conflict);
  reloaded.App.storage.resolveTabs({[conflict.conflicts[0].key]:'local'});
  assert.equal(client(disk).state.workspace.moneyEntries[0].description,'B edit');
  assert.ok(reloaded.App.storage.recoveryInfo());
});
test('failed disk writes retain a reloadable session draft',()=>{
  const disk=memory(), a=client(disk), original=disk.setItem;
  disk.setItem=()=>{throw new Error('full');}; add(a,'Unsaved'); assert.equal(a.App.storage.saveNow(),false);
  disk.setItem=original; const reloaded=client(disk,a.sessionStorage);
  assert.equal(reloaded.state.workspace.moneyEntries[0].description,'Unsaved');
});
