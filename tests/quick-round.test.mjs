import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { domain } from './domain-harness.mjs';

function quickClient(person = 'Adam', persistent = true) {
  const App = domain(), state = App.stateModel.createDefaultState(), notices = [];
  App.identity = { person: () => person };
  App.storage = { getState: () => state, mutate: fn => fn(state), saveNow: () => persistent };
  App.components = { confirm: async () => true, toast: (message, options) => notices.push({ message, ...options }) };
  // Expose the real UI action in this isolated harness; no browser data is touched.
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8')
    .replace('App.ledgerUI = { init,', 'App.ledgerUI = { quickRound, init,');
  vm.runInNewContext(source, { window: { LocalApp: App, matchMedia: () => ({ matches: true }) }, document: {}, Date });
  return { App, state, notices };
}
test('confirmed quick round buttons record $20 owed to the buyer and clear filters', async () => {
  const { App, state } = quickClient();
  state.ui.ledgerSearch = 'hidden'; state.ui.ledgerYear = '2025'; state.ui.ledgerCategories = ['Food'];
  await App.ledgerUI.quickRound('Tristen');
  const first = state.workspace.moneyEntries[0];
  assert.equal(first.from, 'Adam'); assert.equal(first.to, 'Tristen');
  assert.equal(first.amountCents, 2000); assert.equal(first.category, 'Golf');
  assert.equal(first.description, 'Golf Round'); assert.equal(first.createdBy, 'Adam');
  assert.equal(App.ledger.totals(state.workspace.moneyEntries).balance, -2000);
  await App.ledgerUI.quickRound('Adam');
  assert.equal(state.workspace.moneyEntries.length, 2);
  assert.equal(App.ledger.totals(state.workspace.moneyEntries).balance, 0);
  assert.equal(state.ui.ledgerSearch, ''); assert.equal(state.ui.ledgerYear, '');
  assert.equal(state.ui.ledgerCategories.length, 0);
});
test('quick entries require identity and report failed persistence honestly', async () => {
  const unknown = quickClient(''); await unknown.App.ledgerUI.quickRound('Adam');
  assert.equal(unknown.state.workspace.moneyEntries.length, 0);
  assert.equal(unknown.notices[0].kind, 'warning');
  const blocked = quickClient('Tristen', false); await blocked.App.ledgerUI.quickRound('Adam');
  assert.equal(blocked.state.workspace.moneyEntries.length, 1);
  assert.equal(blocked.notices[0].title, 'Storage Needs Attention');
});

test('Dollar Bet credits the selected winner and saves with or without editable notes', () => {
  const App = domain(), state = App.stateModel.createDefaultState(), nodes = new Map(), notices = [];
  const form = { reset() {}, elements:{ description:{value:'Dollar Bet'}, details:{value:''} } };
  for (const id of ['#dollarBetForm','#dollarBetError','#dollarBetWithNotes','#dollarBetTitle','#dollarBetDialog']) nodes.set(id, id === '#dollarBetForm' ? form : {hidden:false,disabled:false,textContent:''});
  App.identity = {person:()=>'Tristen'};
  App.storage = {getState:()=>state, mutate:fn=>fn(state), saveNow:()=>true};
  App.components = {toast:(message, options)=>notices.push({...options,message}), openDialog(){}, closeDialog(){}};
  const source = readFileSync(new URL('../assets/js/ledger-ui.js', import.meta.url), 'utf8').replace('App.ledgerUI = { init,', 'App.ledgerUI = { openDollarBet, saveDollarBet, init,');
  vm.runInNewContext(source,{window:{LocalApp:App,matchMedia:()=>({matches:true})},document:{querySelector:key=>nodes.get(key),activeElement:null},Date});
  App.ledgerUI.openDollarBet('Adam');
  assert.equal(nodes.get('#dollarBetTitle').textContent,'Adam Won $1');
  state.ui.activeModule='golf'; state.ui.ledgerCategories=['Rounds'];
  form.elements.description.value='Closest To The Pin'; form.elements.details.value='Synthetic Notes';
  App.ledgerUI.saveDollarBet({preventDefault(){},currentTarget:form,submitter:{value:'with'}});
  const first = state.workspace.moneyEntries[0];
  assert.equal(first.to,'Adam'); assert.equal(first.from,'Tristen'); assert.equal(first.createdBy,'Tristen');
  assert.equal(first.amountCents,100); assert.equal(first.category,'Bets');
  assert.equal(first.description,'Closest To The Pin'); assert.equal(first.details,'Synthetic Notes');
  assert.equal(state.ui.activeModule,'money'); assert.equal(state.ui.ledgerCategories.length,0);
  App.ledgerUI.openDollarBet('Tristen');
  App.ledgerUI.saveDollarBet({preventDefault(){},currentTarget:form,submitter:{value:'without'}});
  assert.equal(state.workspace.moneyEntries[1].to,'Tristen'); assert.equal(state.workspace.moneyEntries[1].details,'');
  assert.equal(App.ledger.totals(state.workspace.moneyEntries).balance,0);
});
