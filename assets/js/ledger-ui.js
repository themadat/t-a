(function () {
  "use strict";
  const App = window.LocalApp, u = App.utils, l = App.ledger, storage = App.storage, c = App.components;
  const $ = selector => document.querySelector(selector), esc = u.escapeHtml;
  let ready = false, editing = null, pendingImport = null;
  const state = () => storage.getState();
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dateLabel = value => value.length === 4 ? value + ' · date unknown' : new Date(value + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const amountValue = value => value ? (value / 100).toFixed(2) : '';
  const actor = () => { const name = App.identity.person(); if (!l.people.includes(name)) throw new Error('Connect your assigned token in Settings before saving.'); return name; };
  const notifyError = error => c.toast(error.message, { title: 'Please review', kind: 'warning', duration: 6000 });
  function shell() {
    return `<section class="ledger-workspace" aria-label="Money and Golf">
      <div class="ledger-overview"><section class="balance-card"><button class="overview-select" type="button" id="moneyTab" data-ledger-view="money" aria-controls="ledgerPanel"><span class="eyebrow">In the Books</span><strong id="balanceAmount"></strong><span id="balanceWords" role="status"></span></button><button type="button" id="addMoney" class="button overview-add" aria-label="Add money entry"><span data-symbol="add"></span><span>Add</span></button></section><section class="golf-overview"><button class="overview-select" type="button" id="golfTab" data-ledger-view="golf" aria-controls="ledgerPanel"><span class="eyebrow">On the Course</span><strong id="golfCount"></strong><span id="golfOverview"></span></button><button type="button" id="addGolf" class="button overview-add" aria-label="Add golf round"><span data-symbol="add"></span><span>Add</span></button></section></div>
      <section id="ledgerPanel" aria-labelledby="moneyTab"><div class="ledger-filters"><div class="ledger-search-wrap" data-shortcut="."><label for="ledgerSearch" class="visually-hidden">Search this list</label><input id="ledgerSearch" type="search" aria-keyshortcuts="." placeholder="Find an entry (Newest additions first · Event dates may be earlier)…"><span id="ledgerCount" class="muted" aria-live="polite"></span><kbd aria-hidden="true">.</kbd></div><label class="visually-hidden" for="ledgerYear">Filter year</label><select id="ledgerYear"><option value="">All years</option></select></div><div id="golfAnnual" class="annual-summary" hidden></div><div id="ledgerEntries"></div></section>
      <p class="ledger-footer" id="ledgerSyncStatus" role="status"></p>
    </section>`;
  }
  function dialogs() {
    return `<dialog id="moneyDialog" class="app-dialog entry-dialog" aria-labelledby="moneyTitle"><form id="moneyForm" class="dialog-shell"><header class="dialog-header"><h2 id="moneyTitle">Add money entry</h2><button type="button" class="icon-button" data-close-dialog="moneyDialog" aria-label="Close money entry"><span data-symbol="close"></span></button></header><div class="dialog-body entry-fields">
      <p class="form-error" id="moneyError" role="alert" hidden></p><label>Entry type<select name="kind"><option value="owed">Add amount owed</option><option value="repayment">Record repayment</option></select></label><label>Date<input type="date" name="date" required></label><label class="wide">What was it for?<input name="description" maxlength="200" required placeholder="Lunch, golf, a friendly bet…"></label><label>Amount ($)<input name="amount" inputmode="decimal" autocomplete="off" required placeholder="0.00"></label><label>Category<select name="category"><option>Other</option><option>Golf</option><option>Bets</option><option>Food</option></select></label><label id="moneyFromLabel">Person who owes<select name="from"><option>Adam</option><option>Tristan</option></select></label><label id="moneyToLabel">Person receiving<select name="to"><option>Tristan</option><option>Adam</option></select></label><label class="wide">Details <span class="muted">(optional)</span><textarea name="details" rows="3" maxlength="2000"></textarea></label><p class="entry-impact wide" id="moneyImpact" aria-live="polite"></p></div><footer class="dialog-footer"><button id="deleteMoney" type="button" class="button danger" hidden>Delete entry</button><button type="button" class="button" data-close-dialog="moneyDialog">Cancel</button><button type="submit" class="button primary">Save entry</button></footer></form></dialog>
      <dialog id="golfDialog" class="app-dialog entry-dialog" aria-labelledby="golfTitle"><form id="golfForm" class="dialog-shell"><header class="dialog-header"><h2 id="golfTitle">Add golf round</h2><button type="button" class="icon-button" data-close-dialog="golfDialog" aria-label="Close golf round"><span data-symbol="close"></span></button></header><div class="dialog-body entry-fields"><p class="form-error" id="golfError" role="alert" hidden></p><label>Date or known year<input name="date" required placeholder="YYYY-MM-DD or YYYY" maxlength="10"></label><label>Holes<select name="holes"><option value="unknown">Unknown</option><option value="9">9 holes</option><option value="18">18 holes</option><option value="other">Other</option></select></label><label>Adam’s score<input type="number" name="adam" min="1" max="500" step="1" inputmode="numeric" required></label><label>Tristan’s score<input type="number" name="tristan" min="1" max="500" step="1" inputmode="numeric" required></label><label class="wide">Course <span class="muted">(optional)</span><input name="course" maxlength="200"></label><label>Bet winnings go to<select name="winner"><option value="">Even — no winnings</option><option>Adam</option><option>Tristan</option></select></label><label>Winnings ($)<input name="winnings" inputmode="decimal" placeholder="0.00"></label><p class="entry-impact wide">New winnings appear in Money automatically. Scores and betting results are independent.</p><div id="historicalRoundOptions" class="wide review-box" hidden><p id="roundReview"></p><label><input type="checkbox" name="postWinnings"> Post these historical winnings to Money</label><label>Or link an existing money entry<select name="existingMoney"><option value="">Keep separate</option></select></label><label><input type="checkbox" name="reviewed"> Mark reviewed and keep original values</label></div><details class="wide"><summary>Track round payment <span class="muted">(optional)</span></summary><div class="entry-fields"><label>Who paid?<select name="payer"><option value="">No reimbursement</option><option>Adam</option><option>Tristan</option></select></label><label>Other person’s share owed ($)<input name="payment" inputmode="decimal" placeholder="0.00"></label></div></details><label class="wide">Notes <span class="muted">(optional)</span><textarea name="details" rows="3" maxlength="2000"></textarea></label></div><footer class="dialog-footer"><button id="deleteGolf" type="button" class="button danger" hidden>Delete round</button><button type="button" class="button" data-close-dialog="golfDialog">Cancel</button><button type="submit" class="button primary">Save round</button></footer></form></dialog>
      <dialog id="noteImportDialog" class="app-dialog entry-dialog" aria-labelledby="noteImportTitle"><div class="dialog-shell"><header class="dialog-header"><h2 id="noteImportTitle">Review running-note import</h2><button class="icon-button" type="button" data-close-dialog="noteImportDialog" aria-label="Close import"><span data-symbol="close"></span></button></header><div class="dialog-body"><div id="noteImportPreview"></div><label class="import-option"><input type="checkbox" id="importLinkMatches" checked> Link exact historical matches without adding any money</label><label class="import-option"><input type="checkbox" id="importAcceptOverlap"> I reviewed this edited note for possible duplicates; allow additional rows</label><p class="form-error" id="noteImportError" hidden role="alert"></p><p>The current data will be saved as a recovery copy. Personal content stays on this device until you sync.</p></div><footer class="dialog-footer"><button class="button" type="button" data-close-dialog="noteImportDialog">Cancel</button><button class="button primary" id="confirmNoteImport" type="button">Import reviewed entries</button></footer></div></dialog>`;
  }
  function setView(view) { storage.mutate(next => { next.ui.activeModule = view; next.ui.ledgerYear = ''; next.ui.ledgerSearch = ''; }, { reason: 'ledger-view', touch: false }); render(); }
  function entryText(row) { return [row.description, row.details, row.course, row.date, row.from, row.to, row.createdBy, row.category, row.winner, row.adam, row.tristan, row.amountCents ? l.money(row.amountCents) : '', row.winningsCents ? l.money(row.winningsCents) : ''].filter(Boolean).join(' ').toLowerCase(); }
  function render() {
    if (!ready) return;
    const s = state(), view = s.ui.activeModule === 'golf' ? 'golf' : 'money', w = s.workspace;
    const total = l.totals(w.moneyEntries), golf = l.golfSummary(w.golfRounds);
    $('#balanceAmount').textContent = l.money(Math.abs(total.balance)); $('#balanceWords').textContent = l.balanceLabel(total.balance);
    $('#golfCount').textContent = golf.count + (golf.count === 1 ? ' round' : ' rounds');
    $('#golfOverview').textContent = golf.count ? 'Adam ' + golf.adamWins + ' wins · Tristan ' + golf.tristanWins + ' wins · ' + golf.ties + ' ties' : 'Keep the scores. Remember the good ones.';
    $('#ledgerPerson').textContent = App.identity.person() || 'Connect your token';
    $('#ledgerIdentity').dataset.person = App.identity.person() || '';
    document.querySelectorAll('[data-ledger-view]').forEach(button => { const selected = button.dataset.ledgerView === view; button.setAttribute('aria-pressed', String(selected)); button.closest('section').classList.toggle('is-selected', selected); });
    $('#ledgerPanel').setAttribute('aria-labelledby', view + 'Tab');
    const rows = l.newest(w[view === 'money' ? 'moneyEntries' : 'golfRounds']);
    const years = [...new Set(rows.map(x => x.date.slice(0, 4)))].sort().reverse();
    $('#ledgerYear').innerHTML = '<option value="">All years</option>' + years.map(year => `<option value="${year}">${year}</option>`).join(''); $('#ledgerYear').value = s.ui.ledgerYear;
    if (document.activeElement !== $('#ledgerSearch')) $('#ledgerSearch').value = s.ui.ledgerSearch;
    const filtered = rows.filter(row => (!s.ui.ledgerYear || row.date.startsWith(s.ui.ledgerYear)) && (!s.ui.ledgerSearch || entryText(row).includes(s.ui.ledgerSearch.toLowerCase())));
    $('#ledgerCount').textContent = filtered.length + (view === 'money' ? (filtered.length === 1 ? ' entry' : ' entries') : (filtered.length === 1 ? ' round' : ' rounds'));
    $('#golfAnnual').hidden = view !== 'golf';
    if (view === 'golf') {
      const summary = l.golfSummary(w.golfRounds, s.ui.ledgerYear);
      $('#golfAnnual').innerHTML = `<span><small>${s.ui.ledgerYear || 'ALL YEARS'}</small><strong>${summary.count} ${summary.count === 1 ? 'round' : 'rounds'}</strong></span><span><small>STROKE ADVANTAGE</small><strong>${summary.margin ? (summary.margin > 0 ? 'Adam · ' : 'Tristan · ') + Math.abs(summary.margin) : 'Even'}</strong></span><span><small>NET GOLF WINNINGS</small><strong>${summary.winnings ? (summary.winnings > 0 ? 'Adam · ' : 'Tristan · ') + l.money(Math.abs(summary.winnings)) : 'Even'}</strong></span><p>Adam ${summary.adamWins} wins · Tristan ${summary.tristanWins} wins · ${summary.ties} ties<br>Includes partial rounds and unknown hole counts. Summary follows the selected year, not search.</p>`;
    }
    if (!filtered.length) $('#ledgerEntries').innerHTML = `<div class="ledger-empty"><span aria-hidden="true">${view === 'money' ? '↔' : '⚑'}</span><h3>${rows.length ? 'No matching entries' : view === 'money' ? 'Start your running tally' : 'Your next round starts here'}</h3><p>${rows.length ? 'Try another search or year.' : 'Add your first entry above, or import your existing note in Settings.'}</p>${rows.length ? '<button class="button" data-clear-ledger type="button">Clear filters</button>' : '<button class="button" data-import-shortcut type="button">Import existing note</button>'}</div>`;
    else $('#ledgerEntries').innerHTML = `<div class="entry-column-head ${view}" aria-hidden="true">${view === 'money' ? '<span>Date / what</span><span>Direction</span><span>Amount</span><span>Balance after entry</span><span></span>' : '<span>Date / course</span><span>Adam / Tristan</span><span>Score result</span><span>Bet winnings</span><span></span>'}</div><ol class="entry-list">` + filtered.map(row => view === 'money' ? moneyRow(row, total.running[row.id]) : golfRow(row)).join('') + '</ol>';
    renderStatus();
  }
  function moneyRow(row, balance) {
    return `<li id="row-${esc(row.id)}" class="entry-row money"><div><time>${esc(dateLabel(row.date))}</time><strong>${esc(row.description)}</strong><small>${esc(row.category)}${row.kind === 'repayment' ? ' · Repayment' : ''}${row.sourceRoundId ? ' · Linked to Golf' : ''}</small>${row.details ? '<p>' + esc(row.details) + '</p>' : ''}</div><div class="entry-direction"><span class="mobile-label">${row.kind === 'repayment' ? 'Paid' : 'Owed'}</span>${esc(row.from)} → ${esc(row.to)}</div><strong class="entry-amount">${l.money(row.amountCents)}</strong><div class="entry-running"><span class="mobile-label">Balance after entry</span>${esc(l.balanceLabel(balance))}</div><button type="button" class="button small" data-edit-money="${esc(row.id)}" aria-label="Edit ${esc(row.description)} on ${esc(row.date)}">${App.icons.markup('entryEdit')}</button></li>`;
  }
  function golfRow(row) {
    const difference = row.tristan - row.adam;
    return `<li id="row-${esc(row.id)}" class="entry-row golf"><div><time>${esc(dateLabel(row.date))}</time><strong>${esc(row.course || 'Golf round')}</strong><small>${row.holes === 'unknown' ? 'Hole count unknown' : row.holes + ' holes'}</small>${row.review ? '<span class="review-badge">Needs review</span>' : ''}${row.details ? '<p>' + esc(row.details) + '</p>' : ''}</div><div class="score-pair"><span><small>Adam</small><strong>${row.adam}</strong></span><span><small>Tristan</small><strong>${row.tristan}</strong></span></div><div>${difference === 0 ? 'Tied round' : (difference > 0 ? 'Adam' : 'Tristan') + ' by ' + Math.abs(difference)}</div><div>${row.winningsCents ? esc(row.winner) + ' +' + l.money(row.winningsCents) : 'Even'}<small>${row.winningsEntryId ? 'Linked to Money' : row.winningsCents ? 'Separate from Money' : 'No money exchanged'}</small></div><button type="button" class="button small" data-edit-golf="${esc(row.id)}" aria-label="Edit golf round on ${esc(row.date)}">${App.icons.markup('entryEdit')}</button></li>`;
  }
  function renderStatus() {
    if (!ready) return;
    const info = App.sync.getInfo();
    $('#ledgerSyncStatus').textContent = info.state === 'upToDate' ? 'Synced with your shared GitHub file.' : info.state === 'pending' ? 'Saved on this device · waiting to sync.' : info.state === 'offline' ? 'Offline · changes stay on this device until you reconnect.' : info.title + ' · ' + info.message;
  }
  function fields(form, values) { Object.entries(values).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ''; }); }
  function unchanged(type) {
    if (!editing?.id) return;
    const latest = state().workspace[type].find(row => row.id === editing.id);
    if (!latest || latest.deleted || latest.rev !== editing.rev) throw new Error('This entry changed elsewhere while you were editing. Close and reopen it to review the latest copy.');
  }
  function openMoney(entryId, repayment) {
    const row = state().workspace.moneyEntries.find(x => x.id === entryId);
    if (row?.sourceRoundId) return openGolf(row.sourceRoundId);
    editing = row ? { id: row.id, rev: row.rev } : null;
    const form = $('#moneyForm'); form.reset(); $('#moneyError').hidden = true;
    const balance = l.totals(state().workspace.moneyEntries).balance;
    fields(form, row ? { ...row, amount: amountValue(row.amountCents) } : { date: today(), kind: repayment ? 'repayment' : 'owed', description: repayment ? 'Repayment' : '', amount: repayment ? amountValue(Math.abs(balance)) : '', from: repayment ? balance > 0 ? 'Tristan' : 'Adam' : App.identity.person() || 'Adam', to: repayment ? balance > 0 ? 'Adam' : 'Tristan' : App.identity.person() === 'Tristan' ? 'Adam' : 'Tristan' });
    $('#moneyTitle').textContent = row ? 'Edit money entry' : repayment ? 'Record repayment' : 'Add money entry'; $('#deleteMoney').hidden = !row;
    c.openDialog($('#moneyDialog'), { trigger: document.activeElement, focus: '[name=description]' }); moneyImpact();
  }
  function moneyImpact() {
    const f = $('#moneyForm').elements;
    const isRepayment = f.kind.value === 'repayment';
    $('#moneyFromLabel').firstChild.textContent = isRepayment ? 'Person who paid' : 'Person who owes';
    $('#moneyToLabel').firstChild.textContent = isRepayment ? 'Person paid back' : 'Person receiving';
    try {
      if (f.from.value === f.to.value) throw new Error('Choose two different people.');
      const amount = l.cents(f.amount.value), old = state().workspace.moneyEntries.find(x => x.id === editing?.id);
      const balance = l.totals(state().workspace.moneyEntries).balance - (old ? l.delta(old) : 0) + l.delta({ kind: f.kind.value, to: f.to.value, amountCents: amount });
      $('#moneyImpact').textContent = 'After saving: ' + l.balanceLabel(balance);
    } catch (error) { $('#moneyImpact').textContent = f.amount.value ? error.message : 'Enter an amount to preview the new balance.'; }
  }
  function openGolf(roundId) {
    const row = state().workspace.golfRounds.find(x => x.id === roundId), form = $('#golfForm'); form.reset(); $('#golfError').hidden = true;
    editing = row ? { id: row.id, rev: row.rev } : null;
    fields(form, row ? { ...row, winnings: amountValue(row.winningsCents), payment: amountValue(row.paymentCents) } : { date: today(), holes: '18' });
    $('#golfTitle').textContent = row ? 'Edit golf round' : 'Add golf round'; $('#deleteGolf').hidden = !row;
    const historical = Boolean(row?.source && !row.winningsEntryId); $('#historicalRoundOptions').hidden = !historical;
    $('#roundReview').textContent = row?.review || 'Original winnings are separate from Money. Posting them will change the balance.';
    form.elements.postWinnings.checked = !historical;
    form.elements.existingMoney.innerHTML = '<option value="">Keep separate</option>' + l.active(state().workspace.moneyEntries).filter(x => !x.sourceRoundId && x.kind === 'owed' && x.date === row?.date).map(x => `<option value="${esc(x.id)}">${esc(x.description)} · ${esc(x.to)} ${l.money(x.amountCents)}</option>`).join('');
    c.openDialog($('#golfDialog'), { trigger: document.activeElement, focus: '[name=adam]' });
  }
  function saved(dialog, label) {
    const persistent = storage.saveNow(); c.closeDialog($(dialog));
    const hadFilters = Boolean(state().ui.ledgerYear || state().ui.ledgerSearch);
    storage.mutate(next => { next.ui.ledgerYear = ''; next.ui.ledgerSearch = ''; }, { reason: 'ledger-view', touch: false }); render();
    c.toast(persistent ? label + (hadFilters ? ' Filters cleared to show your entry.' : '') : 'Your edit is visible but browser storage could not save it. Export a backup.', { title: persistent ? 'Saved on this device' : 'Storage needs attention', kind: persistent ? 'success' : 'warning' });
  }
  function saveMoney(event) {
    event.preventDefault(); const f = event.currentTarget.elements;
    try {
      const name = actor(); unchanged('moneyEntries');
      storage.mutate(next => l.saveMoney(next.workspace, { date: f.date.value, kind: f.kind.value, description: f.description.value.trim(), category: f.category.value, amountCents: l.cents(f.amount.value), from: f.from.value, to: f.to.value, details: f.details.value, sourceRoundId: '', linkRole: '' }, name, editing?.id), { reason: 'ledger-edit' });
      saved('#moneyDialog', 'Money entry saved.');
    } catch (error) { $('#moneyError').textContent = error.message; $('#moneyError').hidden = false; }
  }
  function saveGolf(event) {
    event.preventDefault(); const f = event.currentTarget.elements;
    try {
      const name = actor(); unchanged('golfRounds');
      const old = state().workspace.golfRounds.find(x => x.id === editing?.id), selected = state().workspace.moneyEntries.find(x => x.id === f.existingMoney.value);
      const winningsCents = f.winner.value ? l.cents(f.winnings.value) : 0;
      if (selected && (selected.amountCents !== winningsCents || selected.to !== f.winner.value)) throw new Error('To link this entry, set the round winnings to the selected Money amount and recipient. Otherwise keep them separate.');
      storage.mutate(next => l.saveRound(next.workspace, { date: f.date.value.trim(), adam: Number(f.adam.value), tristan: Number(f.tristan.value), holes: f.holes.value, course: f.course.value, winner: f.winner.value, winningsCents,
        paymentCents: f.payer.value ? l.cents(f.payment.value) : 0, payer: f.payer.value, details: f.details.value, review: f.reviewed.checked ? '' : old?.review || '', winningsEntryId: selected?.id || old?.winningsEntryId || '' }, name, editing?.id, Boolean(selected || f.postWinnings.checked)), { reason: 'ledger-edit' });
      saved('#golfDialog', 'Round and linked money saved.');
    } catch (error) { $('#golfError').textContent = error.message; $('#golfError').hidden = false; }
  }
  async function deleteEntry(type) {
    try {
      const name = actor(); unchanged(type); const entryId = editing.id;
      const accepted = await c.confirm({ title: type === 'golfRounds' ? 'Delete this round?' : 'Delete this money entry?', message: type === 'golfRounds' ? 'The round and its linked money entries will be removed. You can Undo this change.' : 'The balance will be recalculated. You can Undo this change.', confirmLabel: 'Delete', danger: true });
      if (!accepted) return; unchanged(type);
      let operation; storage.mutate(next => { operation = l.remove(next.workspace, type, entryId, name); }, { reason: 'ledger-edit' }); storage.saveNow();
      c.closeDialog($(type === 'golfRounds' ? '#golfDialog' : '#moneyDialog')); render();
      c.toast('The entry was removed.', { title: 'Deleted', actionLabel: 'Undo', duration: 10000, onAction: () => { try { storage.mutate(next => l.undo(next.workspace, operation, name), { reason: 'ledger-edit' }); storage.saveNow(); render(); } catch (error) { notifyError(error); } } });
    } catch (error) { notifyError(error); }
  }
  async function previewNote(file) {
    if (!file) return;
    try {
      if (file.size > 500000) throw new Error('Choose a note smaller than 500 KB.');
      pendingImport = await App.noteImport.parse(await file.text()); const p = pendingImport;
      const existing = state().workspace; const duplicates = ['moneyEntries', 'golfRounds'].reduce((count, key) => count + p[key].filter(row => existing[key].some(x => x.id === row.id)).length, 0);
      $('#noteImportPreview').innerHTML = `<p><strong>${p.moneyEntries.length} money entries · ${p.golfRounds.length} golf rounds</strong></p><p>Source balance: ${esc(l.balanceLabel(p.balance))}</p><p>${p.golfRounds.filter(x => x.date.length === 4).length} year-only dates · ${p.matches.length} exact winnings matches · ${duplicates} existing rows will be skipped.</p><p>${p.appendix ? 'The appendix will be appended to private shared Notes.' : 'No appendix found.'}</p><h3>Review notes</h3>${p.warnings.length ? '<ul>' + p.warnings.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>Source totals and recognized entries reconcile.</p>'}<details><summary>Preview money and round rows</summary><ol>${p.moneyEntries.map(x => `<li>${esc(x.date)} · ${esc(x.description)} · ${esc(x.from)} → ${esc(x.to)} ${l.money(x.amountCents)}${x.details ? ' · ' + esc(x.details) : ''}</li>`).join('')}${p.golfRounds.map(x => `<li>${esc(x.date)} · Adam ${x.adam}, Tristan ${x.tristan} · ${x.winningsCents ? esc(x.winner) + ' ' + l.money(x.winningsCents) : 'Even'}</li>`).join('')}</ol></details>`;
      $('#importAcceptOverlap').checked = false; $('#noteImportError').hidden = true; c.openDialog($('#noteImportDialog'), { trigger: document.activeElement });
    } catch (error) { notifyError(error); }
  }
  function confirmImport() {
    try {
      if (!pendingImport) return;
      if (!storage.saveRecovery('Before running-note import')) throw new Error('A recovery copy could not be saved. Export a backup before importing.');
      let result;
      storage.mutate(next => {
        result = App.noteImport.apply(next.workspace, pendingImport, $('#importLinkMatches').checked, $('#importAcceptOverlap').checked);
        if (result.appendix) {
          const note = next.workspace.documents[0], current = u.richTextToPlainText(note.html, App.config.controls.maxDocumentHtmlLength);
          const combined = [current, result.appendix].filter(Boolean).join('\n\n— Imported reference notes —\n\n');
          if (combined.length > App.config.controls.maxDocumentHtmlLength) throw new Error('Combined Notes exceed the size limit. Shorten them before importing.');
          note.html = esc(combined).replace(/\n/g, '<br>'); note.updatedAt = u.isoNow();
        }
        next.ui.activeModule = 'money';
      }, { reason: 'ledger-import' });
      pendingImport = null; saved('#noteImportDialog', result.added + ' entries imported.');
    } catch (error) { $('#noteImportError').textContent = error.message; $('#noteImportError').hidden = false; }
  }
  function search(query) {
    const needle = query.trim().toLowerCase(); if (!needle) return [];
    return [['money', state().workspace.moneyEntries], ['golf', state().workspace.golfRounds]].flatMap(([type, rows]) => l.newest(rows).filter(row => entryText(row).includes(needle)).slice(0, 4).map(row => ({ type, id: row.id, title: row.description || row.course || 'Golf round', meta: (type === 'money' ? 'Money · ' : 'Golf · ') + dateLabel(row.date) })));
  }
  function init() {
    $('#mainContent').innerHTML = shell(); $('#mainContent').setAttribute('aria-label', 'Money and Golf'); document.body.insertAdjacentHTML('beforeend', dialogs());
    const file = document.createElement('input'); file.type = 'file'; file.accept = '.txt,text/plain'; file.id = 'runningNoteFile'; file.hidden = true; document.body.appendChild(file);
    file.addEventListener('change', () => { previewNote(file.files[0]); file.value = ''; });
    $('#ledgerSearch').addEventListener('input', event => { storage.mutate(next => { next.ui.ledgerSearch = event.target.value; }, { reason: 'ledger-view', touch: false }); render(); });
    $('#ledgerYear').addEventListener('change', event => { storage.mutate(next => { next.ui.ledgerYear = event.target.value; }, { reason: 'ledger-view', touch: false }); render(); });
    $('#addMoney').addEventListener('click', () => openMoney());
    $('#addGolf').addEventListener('click', () => openGolf());
    document.addEventListener('keydown', event => {
      if (event.key !== '.' || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]')) return;
      const target = event.target;
      if (target !== $('#ledgerSearch') && (target.closest('input, textarea, select') || target.isContentEditable)) return;
      event.preventDefault(); $('#ledgerSearch').focus(); $('#ledgerSearch').select();
    });
    document.querySelectorAll('[data-ledger-view]').forEach(button => { button.addEventListener('click', () => setView(button.dataset.ledgerView)); button.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const next = button.dataset.ledgerView === 'money' ? 'golf' : 'money'; setView(next); $('#' + next + 'Tab').focus(); } }); });
    $('#ledgerEntries').addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; if (button.dataset.editMoney) openMoney(button.dataset.editMoney); else if (button.dataset.editGolf) openGolf(button.dataset.editGolf); else if (button.hasAttribute('data-clear-ledger')) setView(state().ui.activeModule); else if (button.hasAttribute('data-import-shortcut')) file.click(); });
    $('#moneyForm').addEventListener('submit', saveMoney); $('#moneyForm').addEventListener('input', moneyImpact); $('#golfForm').addEventListener('submit', saveGolf);
    $('#deleteMoney').addEventListener('click', () => deleteEntry('moneyEntries')); $('#deleteGolf').addEventListener('click', () => deleteEntry('golfRounds')); $('#confirmNoteImport').addEventListener('click', confirmImport);
    document.addEventListener('click', event => { if (event.target.closest('[data-import-running-note]')) file.click(); });
    function tabConflictNotice() {
      c.toast('Two tabs changed the same entry. Both versions are saved for review.', { title: 'Review browser-tab changes', duration: 0, actionLabel: 'Review', onAction: async () => {
        const conflict = storage.getTabConflict(); if (!conflict) return;
        const choices = await App.sync.resolveConflicts(conflict.conflicts);
        if (choices) { try { storage.resolveTabs(choices); } catch (error) { notifyError(error); } }
      } });
    }
    window.addEventListener('app:tabconflict', tabConflictNotice);
    if (storage.getTabConflict()) window.setTimeout(tabConflictNotice, 100);
    window.addEventListener('app:identitychange', render); window.addEventListener('app:statechange', render); window.addEventListener('app:syncchange', renderStatus);
    App.icons.mount(document); ready = true; render();
  }
  App.ledgerUI = { init, render, search, openEntry: (type, entryId) => { setView(type); if (type === 'money') openMoney(entryId); else openGolf(entryId); } };
})();
