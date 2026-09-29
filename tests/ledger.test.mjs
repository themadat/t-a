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
test('backdated additions sort first and editing preserves their position', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const first = l.saveMoney(w, moneyFields, 'Adam');
  const second = l.saveMoney(w, { ...moneyFields, date: '2025-01-01' }, 'Tristen');
  l.saveMoney(w, { ...moneyFields, description: 'Corrected' }, 'Adam', first.id);
  assert.equal(l.newest(w.moneyEntries)[0].id, second.id);
});
test('round winnings stay linked without duplication through edit, Even, payment and Undo', () => {
  const a = domain(), w = a.stateModel.createDefaultState().workspace, l = a.ledger;
  const r = l.saveRound(w, roundFields, 'Adam', '', true);
  assert.equal(l.totals(w.moneyEntries).balance, 400);
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
