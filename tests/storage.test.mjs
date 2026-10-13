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


test('explicit GitHub overwrite clears a conflicting tab draft and persists without recovery', () => {
  const disk = memory(), a = client(disk); add(a, 'Original'); a.App.storage.saveNow();
  const b = client(disk), id = a.state.workspace.moneyEntries[0].id;
  edit(a, id, 'Other tab'); edit(b, id, 'Discard this draft'); a.App.storage.saveNow();
  assert.equal(b.App.storage.saveNow(), false); assert.ok(b.App.storage.getTabConflict());
  const next = b.App.stateModel.createDefaultState();
  b.App.ledger.saveMoney(next.workspace, { ...moneyFields, description: 'GitHub only' }, 'Adam');
  assert.equal(b.App.storage.overwriteFromSync(next), true);
  assert.equal(b.App.storage.getTabConflict(), null);
  assert.equal(b.App.storage.saveNow(), true);
  const reloaded = client(disk, b.sessionStorage);
  assert.deepEqual(Array.from(reloaded.state.workspace.moneyEntries, e => e.description), ['GitHub only']);
  assert.equal(reloaded.App.storage.recoveryInfo(), null);
});

test('overwrite frees app recovery space, retains credentials and other data, and survives offline reload', () => {
  const data = new Map(); let limit = Infinity;
  const disk = {
    getItem: key => data.get(key) ?? null,
    removeItem: key => data.delete(key),
    setItem(key, value) {
      const size = Array.from(data, ([k, v]) => k === key ? 0 : v.length).reduce((a, b) => a + b, 0) + value.length;
      if (size > limit) throw Object.assign(new Error('Storage full'), { name: 'QuotaExceededError' });
      data.set(key, value);
    }
  };
  const h = client(disk), store = h.App.storage, config = h.App.config.storage;
  store.mutate(s => { s.workspace.documents[0].html = 'Old'.repeat(1000); }); store.saveNow();
  assert.equal(store.saveRecovery('Old backup'), true);
  store.setSecret('synthetic-secret', true); disk.setItem('another-app', 'preserve');
  const next = structuredClone(h.state); next.workspace.documents[0].html = 'Latest'.repeat(900);
  limit = JSON.stringify(h.App.stateModel.prepare(next).state).length + 100;
  assert.equal(store.saveRecovery('Cannot fit another backup', next), false);
  assert.equal(store.overwriteFromSync(next), true);
  assert.equal(disk.getItem(config.recoveryKey), null);
  assert.equal(store.getSecret(), 'synthetic-secret'); assert.equal(disk.getItem('another-app'), 'preserve');
  assert.equal(store.isPersistent(), true);
  assert.equal(client(disk, h.sessionStorage).state.workspace.documents[0].html, next.workspace.documents[0].html);
});

test('unavailable disk still opens the pulled copy and replaces the stale session draft', () => {
  const disk = memory(), h = client(disk); add(h, 'Discard'); h.App.storage.saveNow();
  const next = h.App.stateModel.createDefaultState();
  h.App.ledger.saveMoney(next.workspace, { ...moneyFields, description: 'Latest cloud' }, 'Adam');
  disk.setItem = () => { throw new Error('Storage denied'); };
  assert.equal(h.App.storage.overwriteFromSync(next), false);
  assert.equal(h.state.workspace.moneyEntries[0].description, 'Latest cloud');
  assert.equal(h.App.storage.isPersistent(), false);
  assert.equal(h.App.storage.saveNow(), false);
  assert.equal(client(disk, h.sessionStorage).state.workspace.moneyEntries[0].description, 'Latest cloud');
});
