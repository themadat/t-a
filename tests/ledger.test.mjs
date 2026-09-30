import assert from 'node:assert/strict';
import { test } from 'node:test';
import { domain, moneyFields, roundFields } from './domain-harness.mjs';
test('integer cents, repayments, edits, deletion and Undo recalculate the ledger', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  assert.equal(l.cents('12.50'), 1250); assert.throws(() => l.cents('1.001')); assert.throws(() => l.cents('Infinity'));
  const debt = l.saveMoney(w, moneyFields, 'Adam');
  assert.equal(l.totals(w.moneyEntries).balance, -1250);
  l.saveMoney(w, { ...moneyFields, kind: 'repayment', amountCents: 500 }, 'Adam');
  assert.equal(l.totals(w.moneyEntries).balance, -750);
  const undo = l.remove(w, 'moneyEntries', debt.id, 'Adam');
  assert.equal(l.totals(w.moneyEntries).balance, 500);
  l.undo(w, undo, 'Adam'); assert.equal(l.totals(w.moneyEntries).balance, -750);
});
test('dates determine display order and running balances, with stable same-date ties', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const first = l.saveMoney(w, { ...moneyFields, date:'2026-01-05' }, 'Adam');
  const second = l.saveMoney(w, { ...moneyFields, date:'2025-06-01', amountCents:500, from:'Tristen', to:'Adam' }, 'Tristen');
  const third = l.saveMoney(w, { ...moneyFields, date:'2026-01-05', amountCents:250, from:'Tristen', to:'Adam' }, 'Adam');
  assert.deepEqual(Array.from(l.newest(w.moneyEntries), row => row.id), [third.id, first.id, second.id]);
  assert.equal(w.moneyEntries[0].id, first.id);
  assert.equal(l.totals(w.moneyEntries).running[second.id], 500);
  assert.equal(l.totals(w.moneyEntries).running[first.id], -750);
  assert.equal(l.totals(w.moneyEntries).balance, -500);
  l.saveMoney(w, { ...moneyFields, date:'2025-05-01', description:'Corrected' }, 'Adam', first.id);
  assert.deepEqual(Array.from(l.newest(w.moneyEntries), row => row.id), [third.id, second.id, first.id]);
  assert.equal(l.totals(w.moneyEntries).running[first.id], -1250);
  assert.equal(l.totals(w.moneyEntries).running[second.id], -750);
  assert.equal(l.totals(w.moneyEntries).balance, -500);
});
test('round winnings stay linked without duplication through edit, Even, payment and Undo', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const r = l.saveRound(w, roundFields, 'Adam', '', true);
  assert.equal(l.totals(w.moneyEntries).balance, 400);
  assert.equal(w.moneyEntries[0].category, 'Wins');
  assert.equal(w.moneyEntries[0].details, '');
  l.saveRound(w, { ...roundFields, winningsCents: 600 }, 'Tristen', r.id, true);
  assert.equal(l.active(w.moneyEntries).length, 1); assert.equal(l.totals(w.moneyEntries).balance, 600);
  l.saveRound(w, { ...roundFields, winningsCents: 0, winner: '', paymentCents: 2000, payer: 'Tristen' }, 'Adam', r.id, true);
  assert.equal(l.active(w.moneyEntries).length, 1); assert.equal(l.totals(w.moneyEntries).balance, -2000);
  const op = l.remove(w, 'golfRounds', r.id, 'Adam'); assert.equal(l.active(w.moneyEntries).length, 0);
  l.undo(w, op, 'Adam'); assert.equal(l.totals(w.moneyEntries).balance, -2000); l.validateLinks(w);
});
test('tied scores allow a separate betting winner and year-only rounds remain valid', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace;
  a.ledger.saveRound(w, { ...roundFields, date: '2025', adam: 90, tristan: 90, winner: 'Tristen' }, 'Adam', '', false);
  const summary = a.ledger.golfSummary(w.golfRounds, '2025');
  assert.equal(summary.ties, 1); assert.equal(summary.winnings, -400); assert.equal(summary.margin, 0);
});
test('three-way merge preserves distinct additions and one-sided edit/delete changes', () => {
  const a = domain(), m = a.stateModel, base = m.createDefaultState();
  const initial = a.ledger.saveMoney(base.workspace, moneyFields, 'Adam');
  const local = structuredClone(base), remote = structuredClone(base);
  a.ledger.saveMoney(local.workspace, { ...moneyFields, description: 'Local addition' }, 'Adam');
  a.ledger.remove(remote.workspace, 'moneyEntries', initial.id, 'Tristen');
  a.ledger.saveMoney(remote.workspace, { ...moneyFields, description: 'Remote addition' }, 'Tristen');
  const merged = m.merge(local, remote, {}, m.syncPayload(base).data);
  assert.equal(a.ledger.active(merged.workspace.moneyEntries).length, 2);
  assert.equal(merged.workspace.moneyEntries.find(x => x.id === initial.id).deleted, true);
});
test('competing edits and edit/delete need a targeted decision; linked rounds stay atomic', () => {
  const a = domain(), m = a.stateModel, base = m.createDefaultState();
  const r = a.ledger.saveRound(base.workspace, roundFields, 'Adam', '', true);
  const local = structuredClone(base), remote = structuredClone(base);
  a.ledger.saveRound(local.workspace, { ...roundFields, winningsCents: 800 }, 'Adam', r.id, true);
  a.ledger.remove(remote.workspace, 'golfRounds', r.id, 'Tristen');
  const b = m.syncPayload(base).data;
  assert.equal(m.mergeResult(local, remote, {}, b).conflicts.length, 1);
  assert.throws(() => m.merge(local, remote, {}, b), /Entries differ/);
  const resolved = m.merge(local, remote, { ['golf:' + r.id]: 'local' }, b);
  assert.equal(a.ledger.totals(resolved.workspace.moneyEntries).balance, 800); a.ledger.validateLinks(resolved.workspace);
});
test('migration retains Notes/preferences and old Notes snapshots cannot erase new collections', () => {
  const a = domain(), m = a.stateModel, old = m.createDefaultState(); old.schemaVersion = 4;
  old.workspace.documents[0].html = 'Keep me'; old.preferences.appearance.mode = 'dark'; delete old.workspace.moneyEntries; delete old.workspace.golfRounds;
  const current = m.prepare(old).state; a.ledger.saveMoney(current.workspace, moneyFields, 'Adam');
  const oldCloud = m.prepareSync({ syncFormat: 'local-first-app-data', syncVersion: 1, schemaVersion: 5, data: { notes: 'Old Notes' } }).state;
  const result = m.applySync(current, oldCloud);
  assert.equal(result.workspace.moneyEntries.length, 1); assert.equal(result.preferences.appearance.mode, 'dark');
  assert.equal(result.workspace.documents[0].html, 'Old Notes');
});
test('malformed IDs, dates, cents, scores and broken links reject before import', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace;
  a.ledger.saveRound(w, roundFields, 'Adam', '', true);
  for (const change of [x => x.moneyEntries[0].amountCents = 1.2, x => x.moneyEntries[0].id = '', x => x.golfRounds[0].adam = NaN, x => x.golfRounds[0].date = '2025-02-31', x => x.moneyEntries[0].amountCents = 500]) {
    const bad = structuredClone(w); change(bad); assert.throws(() => a.ledger.collections(bad));
  }
});

test('legacy person spelling and numeric holes normalize without losing links', () => {
  const App = domain();
  const state = App.stateModel.createDefaultState();
  App.ledger.saveRound(state.workspace, {...roundFields, holes: '12'}, 'Adam', undefined, true);
  state.workspace.moneyEntries[0].from = 'Tristan';
  state.workspace.tokenLabels = {Adam: 'a'.repeat(64), Tristan: 'b'.repeat(64)};
  const result = App.stateModel.prepare(state).state;
  assert.equal(result.workspace.moneyEntries[0].from, 'Tristen');
  assert.equal(result.workspace.golfRounds[0].holes, '12');
  assert.equal(result.workspace.tokenLabels.Tristen, 'b'.repeat(64));
  App.ledger.validateLinks(result.workspace);
});

test('category totals separate golf wins from bets and reverse by viewer', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace;
  for (const [description, category, amountCents] of [['Golf Bets','Wins',400],['Dollar Bet','Bets',100],['Golf Round','Golf',2000],['Lunch','Food',700]]) {
    a.ledger.saveMoney(w, {...moneyFields, description, category, amountCents}, 'Adam');
  }
  const adam = a.ledger.categoryTotals(w.moneyEntries, 'Adam');
  const tristen = a.ledger.categoryTotals(w.moneyEntries, 'Tristen');
  assert.equal(adam.Bets, -100); assert.equal(adam.Wins, -400);
  for (const name of ['Wins','Bets']) assert.equal(tristen[name] || 0, -adam[name] || 0);
});

test('chosen categories survive editing, normalization and cloud roundtrips', () => {
  const a = domain(), s = a.stateModel.createDefaultState(), l = a.ledger;
  const entry = l.saveMoney(s.workspace, { ...moneyFields, description: 'Golf Bets', category: 'Wins' }, 'Adam');
  l.saveMoney(s.workspace, { ...entry, category: 'Bets' }, 'Tristen', entry.id);
  let result = a.stateModel.prepareSync(a.stateModel.syncPayload(s)).state;
  assert.equal(result.workspace.moneyEntries[0].category, 'Bets');
  assert.equal(l.categoryTotals(result.workspace.moneyEntries, 'Adam').Bets, -1250);
  assert.equal(l.categoryTotals(result.workspace.moneyEntries, 'Adam').Wins, 0);
  l.saveMoney(result.workspace, { ...result.workspace.moneyEntries[0], category: 'Wins' }, 'Adam', entry.id);
  result = a.stateModel.normalize(result);
  assert.equal(result.workspace.moneyEntries[0].category, 'Wins');
  assert.equal(l.categoryTotals(result.workspace.moneyEntries, 'Adam').Wins, -1250);
});

test('linked entry category edits retain their financial link through round edits', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const round = l.saveRound(w, roundFields, 'Adam', '', true), entry = w.moneyEntries[0];
  l.saveMoney(w, { ...entry, category: 'Bets', details: 'Reviewed bet', sourceRoundId: '', linkRole: '' }, 'Tristen', entry.id);
  assert.equal(w.moneyEntries[0].sourceRoundId, round.id);
  assert.throws(() => l.saveMoney(w, { ...w.moneyEntries[0], amountCents: 900 }, 'Adam', entry.id), /linked golf round/);
  l.saveRound(w, { ...roundFields, winningsCents: 600 }, 'Adam', round.id, true);
  const normalized = l.collections(w);
  l.validateLinks(normalized);
  assert.equal(normalized.moneyEntries[0].category, 'Bets');
  assert.equal(normalized.moneyEntries[0].details, 'Reviewed bet');
  assert.equal(l.totals(normalized.moneyEntries).balance, 600);
});

test('May 2025 starts the money ledger; unknown dates only affect category breakdowns', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const before = l.saveMoney(w, { ...moneyFields, date: '2025-04-30', category: 'Wins', amountCents: 900 }, 'Adam');
  const first = l.saveMoney(w, { ...moneyFields, date: '2025-05-01', category: 'Bets', amountCents: 100 }, 'Adam');
  const history = l.saveMoney(w, { ...moneyFields, date: '2025', category: 'Wins', amountCents: 300 }, 'Adam');
  const second = l.saveMoney(w, { ...moneyFields, date: '2026-01-01', category: 'Bets', amountCents: 200, to: 'Adam', from: 'Tristen' }, 'Tristen');
  const total = l.totals(w.moneyEntries);
  assert.equal(total.balance, 100);
  assert.equal(total.running[before.id], null); assert.equal(total.running[history.id], null);
  assert.equal(total.running[first.id], -100); assert.equal(total.running[second.id], 100);
  assert.equal(l.categoryTotals(w.moneyEntries, 'Adam').Wins, -1200);
  assert.equal(l.categoryTotals(w.moneyEntries, 'Adam').Bets, 100);
  const round = l.saveRound(w, { ...roundFields, date: '2025' }, 'Adam', '', true);
  assert.equal(l.totals(w.moneyEntries).balance, 100);
  assert.equal(l.categoryTotals(w.moneyEntries, 'Adam').Wins, -800);
  assert.equal(l.golfSummary(w.golfRounds, '2025').count, 1);
  l.saveRound(w, { ...roundFields, date: '2025-05-02' }, 'Adam', round.id, true);
  assert.equal(l.totals(w.moneyEntries).balance, 500);
});


test('year-only imported winnings link once, sort below dated entries and preserve totals', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace;
  a.ledger.saveMoney(w, {...moneyFields, date:'2025-05-01'}, 'Adam');
  const r = a.ledger.saveRound(w, {...roundFields, date:'2025'}, 'Adam', '', false);
  r.source = {batch:'test', line:'synthetic year-only round', occurrence:0};
  r.review = 'Exact date unknown; winnings are not linked to Money.';
  const migrated = a.ledger.collections(w);
  assert.equal(migrated.moneyEntries.length, 2);
  assert.equal(a.ledger.newest(migrated.moneyEntries).at(-1).date, '2025');
  assert.equal(a.ledger.collections(migrated).moneyEntries.length, 2);
  a.ledger.validateLinks(migrated);
  assert.equal(a.ledger.money(400), '$4');
});
