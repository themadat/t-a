(function () {
  "use strict";
  const App = window.LocalApp, u = App.utils, l = App.ledger, storage = App.storage, c = App.components;
  const $ = selector => document.querySelector(selector), esc = u.escapeHtml;
  let ready = false, editing = null, pendingImport = null, simulatedPerson = "";
  const expandedEntries = new Set();
  const viewer = () => state().preferences.controls.developerMode && simulatedPerson ? simulatedPerson : App.identity.person();
  const portrait = window.matchMedia('(max-width:600px)');
  const desktop = window.matchMedia('(min-width:1100px)');
  const state = () => storage.getState();
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dateLabel = value => value.length === 4 ? value + ' · date unknown' : new Date(value + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const amountValue = value => value ? String(value / 100) : '';
  const actor = () => { const name = App.identity.person(); if (!l.people.includes(name)) throw new Error('Connect your assigned token in Settings before saving.'); return name; };
  const notifyError = error => c.toast(error.message, { title: 'Please review', kind: 'warning', duration: 6000 });
  const layoutPerson = () => viewer() || 'default';
  const layout = () => state().preferences.ledgerLayouts[layoutPerson()] || (layoutPerson() === 'Adam' ? 'compact' : 'expanded');
  const categoryName = row => ['Golf', 'Bets', 'Wins', 'Food', 'Other'].includes(row.category) ? row.category : 'Other';
  const balanceText = balance => balance === null || balance === undefined ? '—' : l.money(Math.abs(balance)) + (balance ? ' to ' + (balance > 0 ? 'Adam' : 'Tristen') : ' · even');
  const linkedMoney = round => l.active(state().workspace.moneyEntries).filter(row => row.sourceRoundId === round.id);
  function combinedEntries(workspace) {
    return l.newest([...workspace.moneyEntries.map(row => ({ ...row, entryType: 'money' })), ...workspace.golfRounds.map(row => ({ ...row, entryType: 'golf' }))]);
  }
  function withLedgerStart(rows, renderRow, table) {
    let boundary = rows.findIndex(row => row.date < l.LEDGER_START);
    const hasStartYear = rows.some(row => row.date.startsWith('2025'));
    if (!hasStartYear) boundary = -1;
    else if (boundary < 0) boundary = rows.map(row => row.date.slice(0, 4)).lastIndexOf('2025') + 1;
    const marker = table ? '<tr class="ledger-start-row"><td colspan="6"><div class="ledger-start"><strong>Ledger Begins</strong><span>May 2025</span></div></td></tr>' : '<li class="ledger-start"><strong>Ledger Begins</strong><span>May 2025</span></li>';
    return rows.map((row, index) => (index === boundary ? marker : '') + renderRow(row)).join('') + (boundary === rows.length ? marker : '');
  }
  function shell() {
    return `<section class="ledger-workspace" aria-label="Money and Golf">
      <div class="ledger-overview"><section class="balance-card"><button class="overview-select" type="button" id="moneyTab" data-ledger-view="money" aria-controls="ledgerPanel"><span class="eyebrow">In the Books</span><strong id="balanceAmount"></strong><span id="balanceWords" role="status"></span></button></section><section class="golf-overview"><button class="overview-select" type="button" id="golfTab" data-ledger-view="golf" aria-controls="ledgerPanel"><span class="eyebrow">On the Course</span><strong id="golfCount"></strong><span id="golfOverview"></span></button></section></div>
      <section id="ledgerPanel"><div class="ledger-filters"><div class="ledger-search-wrap" data-shortcut="."><label for="ledgerSearch" class="visually-hidden">Search this list</label><input id="ledgerSearch" type="search" aria-keyshortcuts="." placeholder="Search entries…"><span id="ledgerCount" class="muted" aria-live="polite"></span><kbd aria-hidden="true">.</kbd></div><label class="visually-hidden" for="ledgerYear">Filter year</label><select id="ledgerYear"><option value="">All years</option></select><button type="button" id="addEntry" class="button primary ledger-add" aria-haspopup="dialog"><span data-symbol="add" aria-hidden="true"></span><span>Add</span></button></div>
      <div id="ledgerQuickActions" class="ledger-quick-actions" aria-label="Quick actions"><div class="quick-round" role="group" aria-label="Round paid by, twenty dollars"><span>Round Paid By ($20)</span><button type="button" class="button" data-round-payer="Tristen" aria-label="Tristen bought a golf round: Adam owes Tristen $20">Tristen</button><button type="button" class="button" data-round-payer="Adam" aria-label="Adam bought a golf round: Tristen owes Adam $20">Adam</button></div><div class="ledger-category-filters" role="group" aria-label="Filter categories">${['Golf','Bets','Food','Other'].map(category => `<button type="button" class="filter-chip" data-filter-category="${category}" aria-pressed="false">${category}</button>`).join('')}</div></div>
      <div id="ledgerEntries" class="ledger-columns"><section id="moneyColumn" aria-label="Money"><div id="moneyEntries"></div></section><section id="golfColumn" aria-label="Golf"><div id="golfEntries"></div></section><section id="combinedColumn" aria-label="Money and Golf" hidden><div id="combinedEntries"></div></section></div></section>
      <p class="ledger-footer" id="ledgerSyncStatus" role="status"></p>
    </section>`;
  }
  function dialogs() {
    return `<dialog id="moneyDialog" class="app-dialog entry-dialog" aria-labelledby="moneyTitle"><form id="moneyForm" class="dialog-shell"><header class="dialog-header"><h2 id="moneyTitle">Add money entry</h2><button type="button" class="icon-button" data-close-dialog="moneyDialog" aria-label="Close money entry"><span data-symbol="close"></span></button></header><div class="dialog-body entry-fields">
      <p class="form-error wide" id="moneyError" role="alert" hidden></p><p id="moneyLinkedNotice" class="inline-status wide" hidden>Linked to a round. Category, description and notes can be changed here; edit the round to change its date, amount or direction.</p><input type="hidden" name="kind" value="owed"><label>Date<input name="date" required placeholder="YYYY-MM-DD or YYYY" maxlength="10"></label><label>Amount ($)<input name="amount" inputmode="decimal" required placeholder="0"></label><div class="wide money-choice-row"><fieldset class="choice-toggle"><legend>Category</legend>${['Bets','Wins','Golf','Food','Other'].map(name => `<label><input type="radio" name="category" value="${name}" ${name === 'Bets' ? 'checked' : ''}><span>${name}</span></label>`).join('')}</fieldset><div class="payment-direction"><input type="hidden" name="from" value="Adam"><input type="hidden" name="to" value="Tristen"><div class="payment-person"><span>Payer</span><strong id="moneyFromName">Adam</strong></div><button type="button" id="swapMoneyDirection" class="button" aria-label="Swap who owes whom"><span data-symbol="swapPayment"></span></button><div class="payment-person"><span>Payee</span><strong id="moneyToName">Tristen</strong></div></div></div><label class="wide">What<input name="description" maxlength="200" required></label><label class="wide">Notes<textarea name="details" rows="3" maxlength="2000"></textarea></label><p class="entry-impact wide" id="moneyImpact" aria-live="polite"></p></div><footer class="dialog-footer"><button id="deleteMoney" type="button" class="button danger" hidden>Delete entry</button><button type="button" class="button" data-close-dialog="moneyDialog">Cancel</button><button type="submit" class="button primary">Save entry</button></footer></form></dialog>
      <dialog id="golfDialog" class="app-dialog entry-dialog" aria-labelledby="golfTitle"><form id="golfForm" class="dialog-shell"><header class="dialog-header"><h2 id="golfTitle">Add golf round</h2><button type="button" class="icon-button" data-close-dialog="golfDialog" aria-label="Close golf round"><span data-symbol="close"></span></button></header><div class="dialog-body entry-fields golf-form-fields"><p class="form-error wide" id="golfError" role="alert" hidden></p><div class="wide golf-date-row"><label>Date<input name="date" required placeholder="YYYY-MM-DD or YYYY" maxlength="10"></label><label>Course<input name="course" maxlength="200"></label><label>Holes<input type="number" name="holes" min="1" max="99" step="1" value="18" placeholder="??"></label></div><fieldset class="choice-toggle"><legend>Bet Winnings</legend><label><input type="radio" name="winner" value="Adam" checked><span>Adam</span></label><label><input type="radio" name="winner" value="Tristen"><span>Tristen</span></label></fieldset><label>Winnings ($)<input name="winnings" inputmode="decimal" placeholder="0"></label><label>Adam Score<input type="number" name="adam" min="1" max="500" required></label><label>Tristen Score<input type="number" name="tristan" min="1" max="500" required></label><label class="wide">Notes<textarea name="details" rows="3" maxlength="2000"></textarea></label><p class="entry-impact wide">New winnings appear in Money automatically. Enter 0 for an even bet.</p><div id="historicalRoundOptions" class="wide review-box" hidden><p id="roundReview"></p><label><input type="checkbox" name="postWinnings"> Post these historical winnings to Money</label><label>Or link an existing money entry<select name="existingMoney"><option value="">Keep separate</option></select></label><label><input type="checkbox" name="reviewed"> Mark reviewed and keep original values</label></div><details class="wide"><summary>Track round payment</summary><div class="entry-fields"><label>Who paid?<select name="payer"><option value="">No reimbursement</option><option>Adam</option><option>Tristen</option></select></label><label>Other person’s share owed ($)<input name="payment" inputmode="decimal" placeholder="0"></label></div></details></div><footer class="dialog-footer"><button id="deleteGolf" type="button" class="button danger" hidden>Delete round</button><button type="button" class="button" data-close-dialog="golfDialog">Cancel</button><button type="submit" class="button primary">Save round</button></footer></form></dialog>
      <dialog id="noteImportDialog" class="app-dialog entry-dialog" aria-labelledby="noteImportTitle"><div class="dialog-shell"><header class="dialog-header"><h2 id="noteImportTitle">Review running-note import</h2><button class="icon-button" type="button" data-close-dialog="noteImportDialog" aria-label="Close import"><span data-symbol="close"></span></button></header><div class="dialog-body"><div id="noteImportPreview"></div><label class="import-option"><input type="checkbox" id="importLinkMatches" checked> Link exact historical matches without adding any money</label><label class="import-option"><input type="checkbox" id="importAcceptOverlap"> I reviewed this edited note for possible duplicates; allow additional rows</label><p class="form-error" id="noteImportError" hidden role="alert"></p><p>The current data will be saved as a recovery copy. Personal content stays on this device until you sync.</p></div><footer class="dialog-footer"><button class="button" type="button" data-close-dialog="noteImportDialog">Cancel</button><button class="button primary" id="confirmNoteImport" type="button">Import reviewed entries</button></footer></div></dialog>`;
  }
  function setView(view) { storage.mutate(next => { next.ui.activeModule = view; next.ui.ledgerYear = ''; next.ui.ledgerSearch = ''; next.ui.ledgerCategories = []; }, { reason: 'ledger-view', touch: false }); render(); }
  function entryText(row) { return [row.description, row.details, row.course, row.date, row.from, row.to, row.createdBy, row.category, row.winner, row.adam, row.tristan, row.amountCents ? l.money(row.amountCents) : '', row.winningsCents ? l.money(row.winningsCents) : ''].filter(Boolean).join(' ').toLowerCase(); }
  function render() {
    if (!ready) return;
    const s = state(), view = s.ui.activeModule === 'golf' ? 'golf' : 'money', w = s.workspace;
    const total = l.totals(w.moneyEntries), golf = l.golfSummary(w.golfRounds, s.ui.ledgerYear);
    const person = viewer();
    const expanded = layout() === 'expanded';
    document.documentElement.dataset.ledgerLayout = expanded ? 'expanded' : 'compact';
    document.querySelectorAll('button[data-ledger-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.ledgerLayout === layout())));
    document.querySelectorAll('[data-filter-category]').forEach(button => button.setAttribute('aria-pressed', String(s.ui.ledgerCategories.includes(button.dataset.filterCategory))));
    if (!s.preferences.controls.developerMode) simulatedPerson = '';
    $('#balanceAmount').textContent = l.balanceLabel(total.balance);
    const categories = l.categoryTotals(w.moneyEntries, person);
    $('#balanceWords').textContent = Object.entries(categories).map(([name, value]) => (value > 0 ? '+' : value < 0 ? '−' : '±') + l.money(Math.abs(value)) + ' ' + name).join(' • ');
    $('#balanceWords').title = 'All-time category totals from ' + (person || 'Adam') + '’s perspective, including year-only history. Money balance begins May 2025 and includes only exact dates.';
    $('.balance-card').dataset.outcome = !person || !total.balance ? 'neutral' : total.balance * (person === 'Adam' ? 1 : -1) > 0 ? 'positive' : 'negative';
    $('#golfCount').textContent = ((golf.margin ? (golf.margin > 0 ? 'Adam' : 'Tristen') + ' -' + Math.abs(golf.margin) + ' strokes' : 'Even -0 strokes') + ' • ' + (golf.winnings ? (golf.winnings > 0 ? 'Adam' : 'Tristen') + ' +$' + Math.round(Math.abs(golf.winnings) / 100) : 'Even +$0'));
    $('#golfOverview').textContent = (golf.count + ' Rounds: ' + golf.adamWins + ' Adam • ' + golf.tristanWins + ' Tristen • ' + golf.ties + ' Ties');
    $('#ledgerPerson').textContent = person ? person + (simulatedPerson ? ' (Preview)' : '') : 'Unassigned';
    $('#ledgerIdentity').hidden = !expanded;
    $('#ledgerIdentity').setAttribute('aria-label', (simulatedPerson ? 'Previewing ' : 'Connected as ') + (person || 'unassigned'));
    $('#ledgerIdentity').dataset.person = person || '';
    $('#ledgerIdentity').disabled = !s.preferences.controls.developerMode;
    $('#ledgerIdentity').title = s.preferences.controls.developerMode ? 'Click to preview Adam, Tristen, or your signed-in view. Entries keep your real token identity.' : 'Connected as ' + (person || 'unassigned');
    document.querySelectorAll('[data-ledger-view]').forEach(button => { const selected = button.dataset.ledgerView === view; button.setAttribute('aria-pressed', String(selected)); button.closest('section').classList.toggle('is-selected', selected); });
    $('#ledgerPanel').setAttribute('aria-label', expanded || desktop.matches ? 'Money and Golf' : view === 'money' ? 'Money' : 'Golf');
    $('#ledgerPanel').removeAttribute('aria-labelledby');
    $('#moneyColumn').hidden = expanded || (!desktop.matches && view !== 'money');
    $('#golfColumn').hidden = expanded || (!desktop.matches && view !== 'golf');
    $('#combinedColumn').hidden = !expanded;
    const rows = l.newest(w[view === 'money' ? 'moneyEntries' : 'golfRounds']);
    const years = [...new Set((expanded || desktop.matches ? [...l.active(w.moneyEntries), ...l.active(w.golfRounds)] : rows).map(x => x.date.slice(0, 4)))].sort().reverse();
    $('#ledgerYear').innerHTML = '<option value="">All years</option>' + years.map(year => `<option value="${year}">${year}</option>`).join(''); $('#ledgerYear').value = s.ui.ledgerYear;
    if (document.activeElement !== $('#ledgerSearch')) $('#ledgerSearch').value = s.ui.ledgerSearch;
    if (expanded) {
      $('#moneyEntries').innerHTML = ''; $('#golfEntries').innerHTML = '';
      renderCombined(total);
      renderStatus(); return;
    }
    $('#combinedEntries').innerHTML = '';
    let counts = {};
    for (const view of ['money', 'golf']) {
    const rows = l.newest(w[view === 'money' ? 'moneyEntries' : 'golfRounds']);
    const filtered = rows.filter(row => matchesFilters(row));
    counts[view] = filtered.length;
    if (!filtered.length) $('#' + view + 'Entries').innerHTML = `<div class="ledger-empty"><span aria-hidden="true">${view === 'money' ? '↔' : '⚑'}</span><h3>${rows.length ? 'No matching entries' : view === 'money' ? 'Start your running tally' : 'Your next round starts here'}</h3><p>${rows.length ? 'Try another search or year.' : 'Add your first entry above, or import your existing note in Settings.'}</p>${rows.length ? '<button class="button" data-clear-ledger type="button">Clear filters</button>' : '<button class="button" data-import-shortcut type="button">Import existing note</button>'}</div>`;
    else $('#' + view + 'Entries').innerHTML = `<div class="entry-column-head ${view}" aria-hidden="true">${view === 'money' ? '<span>Date</span><span>What</span><span>Category</span><span>Direction</span><span>Amount</span><span>Balance</span><span></span>' : '<span>Date</span><span>Course</span><span>Results</span><span>Wins</span><span></span>'}</div><ol class="entry-list">` + (view === 'money' ? withLedgerStart(filtered, row => moneyRow(row, total.running[row.id]), false) : filtered.map(golfRow).join('')) + '</ol>';
    }
    $('#ledgerCount').textContent = desktop.matches ? counts.money + ' entries · ' + counts.golf + ' rounds' : counts[view] + (view === 'money' ? ' entries' : ' rounds');
    renderStatus();
  }
  function renderCombined(total) {
    const s = state(), rows = combinedEntries(s.workspace);
    const filtered = rows.filter(row => matchesFilters(row, row.entryType === 'golf'));
    $('#ledgerCount').textContent = filtered.length + ' entries';
    $('#combinedEntries').innerHTML = filtered.length ? '<table class="expanded-table"><caption class="visually-hidden">Money and Golf, newest first. Open an entry for details.</caption><thead><tr><th scope="col">Date</th><th scope="col">Entry</th><th scope="col">Result</th><th scope="col">Amount</th><th scope="col">Balance</th><th scope="col"><span class="visually-hidden">Details</span></th></tr></thead><tbody>' + withLedgerStart(filtered, row => expandedRow(row, total), true) + '</tbody></table>' : '<div class="ledger-empty"><h3>' + (rows.length ? 'No matching entries' : 'Your ledger starts here') + '</h3><p>' + (rows.length ? 'Try another search or year.' : 'Use Add above to record money or a round.') + '</p>' + (rows.length ? '<button class="button" data-clear-ledger type="button">Clear filters</button>' : '') + '</div>';
  }
  function expandedRow(row, total) {
    const round = row.entryType === 'golf', amount = round ? 0 : l.delta(row), difference = round ? row.tristan - row.adam : 0;
    const title = round ? row.course || 'Golf round' : moneyTitle(row);
    const result = round ? difference ? (difference > 0 ? 'Adam' : 'Tristen') + ' won by ' + Math.abs(difference) + ' strokes' : 'Tied round' : row.kind === 'repayment' ? row.from + ' repaid ' + row.to : row.from + ' owes ' + row.to;
    const value = round ? difference : amount, outcome = !viewer() || !value ? 'neutral' : value * (viewer() === 'Tristen' ? -1 : 1) > 0 ? 'positive' : 'negative';
    const open = expandedEntries.has(row.entryType + ':' + row.id);
    return `<tr id="row-${esc(row.id)}" class="expanded-row" data-entry-id="${esc(row.id)}" data-entry-type="${row.entryType}" data-inline-open="${open}" data-outcome="${outcome}"><td class="expanded-date"><time>${esc(row.date.length === 4 ? row.date + ' · date unknown' : dateLabel(row.date))}</time></td><td class="expanded-entry"><strong>${esc(title)}</strong><span class="entry-tags"><span class="category-pill ${round ? 'round-pill' : 'money-pill'}">${round ? 'Round' : 'Money'}</span>${round ? '' : `<span class="category-pill category-${categoryName(row).toLowerCase()}">${esc(categoryName(row))}</span>`}</span></td><td class="expanded-result">${esc(result)}</td><td class="expanded-amount"><strong>${round ? '—' : l.money(row.amountCents)}</strong>${amount ? '<small>to ' + (amount > 0 ? 'Adam' : 'Tristen') + '</small>' : ''}</td><td class="expanded-balance"><span class="mobile-column-label">Balance </span>${esc(balanceText(round ? null : total.running[row.id]))}</td><td class="expanded-open"><button type="button" class="button" data-inline-toggle="${esc(row.id)}" data-entry-type="${row.entryType}" aria-expanded="${open}" aria-controls="inline-${row.entryType}-${esc(row.id)}" aria-label="Details for ${esc(title)} on ${esc(row.date)}">${App.icons.markup(open ? 'chevronDown' : 'chevronRight')}</button></td></tr><tr id="inline-${row.entryType}-${esc(row.id)}" class="inline-detail-row" ${open ? '' : 'hidden'}><td colspan="6"><section class="inline-entry-details" aria-label="${esc(title)} details">${open ? detailContent(row.entryType, row) : ''}</section></td></tr>`;
  }
  function moneyTitle(row) {
    const linked = state().workspace.golfRounds.find(round => round.id === row.sourceRoundId);
    return linked && row.linkRole === 'winnings' ? row.description + ' [' + (linked.course || 'Golf round') + ' (' + (linked.holes === 'unknown' ? '??' : linked.holes) + ')]' : row.description;
  }
  function detailContent(type, row) {
    const round = type === 'golf', detail = (label, value) => '<div><dt>' + esc(label) + '</dt><dd>' + esc(String(value)) + '</dd></div>';
    let facts = detail('Date', dateLabel(row.date));
    if (round) facts += detail('Course', row.course || 'Golf round') + detail('Holes', row.holes === 'unknown' ? 'Unknown' : row.holes) + detail('Adam score', row.adam) + detail('Tristen score', row.tristan) + detail('Winnings', row.winningsCents ? row.winner + ' +' + l.money(row.winningsCents) : 'Even');
    else facts += detail('What', moneyTitle(row)) + detail('Category', row.category) + detail('Type', row.kind === 'repayment' ? 'Repayment' : 'Owed') + detail('Payer', row.from) + detail('Payee', row.to) + detail('Amount', l.money(row.amountCents)) + detail('Balance', balanceText(l.totals(state().workspace.moneyEntries).running[row.id]));
    facts += detail('Added by', row.createdBy || 'Unknown') + detail('Last edited by', row.updatedBy || 'Unknown');
    return '<dl class="entry-facts">' + facts + '</dl>' + (!round && !l.inLedger(row) ? '<p class="inline-status">Historical entry · excluded from the money balance. Category breakdowns still include it.</p>' : '') + (row.details ? '<h3>Notes</h3><p class="entry-detail-notes">' + esc(row.details) + '</p>' : '') + (round && row.review ? '<p class="inline-status">' + esc(row.review) + '</p>' : '') + (round ? linkedMoney(row).map(entry => '<section class="linked-entry-detail"><h3>' + esc(entry.description) + '</h3><p>' + esc(entry.category + ' · ' + entry.from + ' → ' + entry.to + ' · ' + l.money(entry.amountCents)) + '</p>' + (entry.details ? '<p class="entry-detail-notes">' + esc(entry.details) + '</p>' : '') + '<button type="button" class="button" data-edit-money="' + esc(entry.id) + '">Edit category and notes</button></section>').join('') : '') + '<div class="inline-entry-actions"><button type="button" class="button" data-inline-toggle="' + esc(row.id) + '" data-entry-type="' + type + '" aria-expanded="true">Close details</button><button type="button" class="button" data-edit-' + type + '="' + esc(row.id) + '">' + (round ? 'Edit round' : 'Edit money entry') + '</button></div>';
  }
  function compactDetails(type, row) {
    const open = expandedEntries.has(type + ':' + row.id);
    return `<div id="inline-${type}-${esc(row.id)}" class="inline-entry-details" aria-label="Entry details" ${open ? '' : 'hidden'}>${open ? detailContent(type, row) : ''}</div>`;
  }
  function toggleInline(type, id, focusToggle) {
    const key = type + ':' + id;
    if (expandedEntries.has(key)) expandedEntries.delete(key); else expandedEntries.add(key);
    render();
    if (focusToggle) document.getElementById('row-' + id)?.querySelector('[data-inline-toggle]')?.focus({ preventScroll: true });
  }
  function filterCategory(row) { return row.entryType === 'golf' || row.adam !== undefined || ['Golf', 'Wins'].includes(row.category) ? 'Golf' : ['Bets','Food','Other'].includes(row.category) ? row.category : 'Other'; }
  function matchesFilters(row, includeLinks) {
    const ui = state().ui;
    return (!ui.ledgerYear || row.date.startsWith(ui.ledgerYear)) && (!ui.ledgerCategories.length || ui.ledgerCategories.includes(filterCategory(row))) && (!ui.ledgerSearch || [entryText(row), row.sourceRoundId ? moneyTitle(row) : '', ...(includeLinks ? linkedMoney(row).map(entryText) : [])].join(' ').toLowerCase().includes(ui.ledgerSearch.toLowerCase()));
  }
  function setLayout(value) {
    if (!['compact','expanded'].includes(value)) return;
    storage.mutate(next => { next.preferences.ledgerLayouts[layoutPerson()] = value; }, { reason: 'ledger-layout', touch: false }); render();
  }
  async function addEntry() {
    const choice = await c.choose({ title: 'Add an entry', message: 'Choose what to record.', trigger: $('#addEntry'), choices: [{ value: 'money', label: 'Money Entry', description: 'Record money owed or paid.' }, { value: 'golf', label: 'Golf Round', description: 'Record scores, winnings and round payments.' }], cancelLabel: 'Cancel' });
    if (choice === 'money') openMoney(); else if (choice === 'golf') openGolf();
  }
  function moneyRow(row, balance) {
    const what = moneyTitle(row), open = expandedEntries.has('money:' + row.id);
    const category = ['Golf', 'Bets', 'Wins', 'Food', 'Other'].includes(row.category) ? row.category : 'Other';
    return `<li id="row-${esc(row.id)}" class="entry-row money" data-entry-id="${esc(row.id)}" data-entry-type="money" data-inline-open="${open}" data-outcome="${!viewer() ? 'neutral' : l.delta(row) * (viewer() === 'Tristen' ? -1 : 1) > 0 ? 'positive' : 'negative'}"><time title="${esc(dateLabel(row.date))}">${esc(row.date.length === 4 ? row.date : dateLabel(row.date))}</time><strong class="entry-what"><button type="button" class="entry-title-toggle" data-inline-toggle="${esc(row.id)}" data-entry-type="money" aria-expanded="${open}" aria-controls="inline-money-${esc(row.id)}" title="${esc(what)}">${esc(what)}</button></strong><span class="category-pill category-${category.toLowerCase()}">${esc(category)}</span><span class="entry-direction" title="${row.kind === 'repayment' ? 'Repayment' : 'Owed'}">${esc(row.from)} → ${esc(row.to)}</span><strong class="entry-amount">${l.money(row.amountCents)}</strong><span class="entry-running">${esc(balanceText(balance))}</span><div class="entry-actions">${row.sourceRoundId ? `<button type="button" class="button row-link" data-linked-round="${esc(row.sourceRoundId)}" aria-label="Open linked golf round on ${esc(row.date)}" title="Open linked golf round">${App.icons.markup('roundLink')}</button>` : ''}<button type="button" class="button small row-edit" title="Edit · hover this row and press E" aria-keyshortcuts="E" data-edit-money="${esc(row.id)}" aria-label="Edit ${esc(row.description)} on ${esc(row.date)}">${App.icons.markup('entryEdit')}</button></div>${compactDetails('money', row)}</li>`;
  }

  function golfRow(row) {
    const difference = row.tristan - row.adam, open = expandedEntries.has('golf:' + row.id);
    const links = [[row.winningsEntryId, 'winnings'], [row.paymentEntryId, 'payment']].filter(([id]) => id && state().workspace.moneyEntries.some(entry => entry.id === id && !entry.deleted));
    return `<li id="row-${esc(row.id)}" class="entry-row golf" data-entry-id="${esc(row.id)}" data-entry-type="golf" data-inline-open="${open}" data-outcome="${!difference ? 'tied' : !viewer() ? 'neutral' : (difference > 0 ? 'Adam' : 'Tristen') === viewer() ? 'positive' : 'negative'}"><time title="${esc(dateLabel(row.date))}">${esc(row.date.length === 4 ? row.date : dateLabel(row.date))}</time><strong class="entry-course"><button type="button" class="entry-title-toggle" data-inline-toggle="${esc(row.id)}" data-entry-type="golf" aria-expanded="${open}" aria-controls="inline-golf-${esc(row.id)}" title="${esc(row.course || 'Golf round')}${row.review ? ' · Needs review: ' + esc(row.review) : ''}">${esc(row.course || 'Golf round')} (${row.holes === 'unknown' ? '??' : esc(row.holes)})${row.review ? '<span class="review-dot" aria-label="Needs review">*</span>' : ''}</button></strong><div class="golf-results"><span aria-label="Adam score">Adam: ${row.adam}</span><span aria-label="Tristen score">Tristen: ${row.tristan}</span><span aria-label="Score result">${difference === 0 ? 'Tie' : (difference > 0 ? 'Adam' : 'Tristen') + ' -' + Math.abs(difference) + ' strokes'}</span></div><span class="golf-winnings">${row.winningsCents ? esc(row.winner) + ' +' + l.money(row.winningsCents) : 'Even'}</span><div class="entry-actions">${links.map(([id, role]) => `<button type="button" class="button row-link" data-linked-money="${esc(id)}" aria-label="View linked ${role} in Money" title="View linked ${role} in Money">${App.icons.markup('roundLink')}</button>`).join('')}<button type="button" class="button small row-edit" title="Edit · hover this row and press E" aria-keyshortcuts="E" data-edit-golf="${esc(row.id)}" aria-label="Edit golf round on ${esc(row.date)}">${App.icons.markup('entryEdit')}</button></div>${compactDetails('golf', row)}</li>`;
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

    editing = row ? { id: row.id, rev: row.rev } : null;
    const form = $('#moneyForm'); form.reset(); $('#moneyError').hidden = true;
    const balance = l.totals(state().workspace.moneyEntries).balance;
    fields(form, row ? { ...row, amount: amountValue(row.amountCents) } : { date: today(), kind: repayment ? 'repayment' : 'owed', description: repayment ? 'Repayment' : '', amount: repayment ? amountValue(Math.abs(balance)) : '', from: repayment ? balance > 0 ? 'Tristen' : 'Adam' : App.identity.person() || 'Adam', to: repayment ? balance > 0 ? 'Adam' : 'Tristen' : App.identity.person() === 'Tristen' ? 'Adam' : 'Tristen' });
    $('#moneyTitle').textContent = row ? 'Edit money entry' : repayment ? 'Record repayment' : 'Add money entry'; $('#deleteMoney').hidden = !row || Boolean(row.sourceRoundId);
    $('#moneyLinkedNotice').hidden = !row?.sourceRoundId;
    for (const key of ['date', 'amount']) form.elements[key].readOnly = Boolean(row?.sourceRoundId);
    $('#swapMoneyDirection').disabled = Boolean(row?.sourceRoundId);
    c.openDialog($('#moneyDialog'), { trigger: document.activeElement, focus: '[name=description]' }); moneyImpact();
  }
  function quickRound(payer) {
    try {
      const name = actor();
      storage.mutate(next => {
        l.saveMoney(next.workspace, { date: today(), kind: 'owed', description: 'Golf Round', category: 'Golf', amountCents: 2000, from: payer === 'Adam' ? 'Tristen' : 'Adam', to: payer, details: payer + ' bought the round', sourceRoundId: '', linkRole: '' }, name);
        next.ui.ledgerYear = ''; next.ui.ledgerSearch = ''; next.ui.ledgerCategories = [];
      }, { reason: 'ledger-edit' });
      const persistent = storage.saveNow();
      c.toast(persistent ? '$20 owed to ' + payer + ' added to Money.' : 'Entry is visible but could not be saved. Export a backup.', { title: persistent ? 'Golf round recorded' : 'Storage needs attention', kind: persistent ? 'success' : 'warning' });
    } catch (error) { notifyError(error); }
  }
  function moneyImpact() {
    const f = $('#moneyForm').elements;
    $('#moneyFromName').textContent = f.from.value;
    $('#moneyToName').textContent = f.to.value;
    try {
      if (f.from.value === f.to.value) throw new Error('Choose two different people.');
      const amount = l.cents(f.amount.value), old = state().workspace.moneyEntries.find(x => x.id === editing?.id);
      const balance = l.totals(state().workspace.moneyEntries).balance - (old ? l.ledgerDelta(old) : 0) + l.ledgerDelta({ date: f.date.value, kind: f.kind.value, to: f.to.value, amountCents: amount });
      $('#moneyImpact').textContent = 'After saving: ' + l.balanceLabel(balance) + (l.inLedger({date: f.date.value}) ? '' : ' · Historical entry, excluded from the money balance.');
    } catch (error) { $('#moneyImpact').textContent = f.amount.value ? error.message : 'Enter an amount to preview the new balance.'; }
  }
  function openGolf(roundId) {
    const row = state().workspace.golfRounds.find(x => x.id === roundId), form = $('#golfForm'); form.reset(); $('#golfError').hidden = true;
    editing = row ? { id: row.id, rev: row.rev } : null;
    fields(form, row ? { ...row, holes: ['unknown', 'other'].includes(row.holes) ? '' : row.holes, winner: row.winner || 'Adam', winnings: amountValue(row.winningsCents), payment: amountValue(row.paymentCents) } : { date: today(), holes: '18' });
    $('#golfTitle').textContent = row ? 'Edit golf round' : 'Add golf round'; $('#deleteGolf').hidden = !row;
    const historical = Boolean(row?.source && !row.winningsEntryId); $('#historicalRoundOptions').hidden = !historical;
    $('#roundReview').textContent = row?.review || 'Original winnings are separate from Money. Posting them will change the balance.';
    form.elements.postWinnings.checked = !historical;
    form.elements.existingMoney.innerHTML = '<option value="">Keep separate</option>' + l.active(state().workspace.moneyEntries).filter(x => !x.sourceRoundId && x.kind === 'owed' && x.date === row?.date).map(x => `<option value="${esc(x.id)}">${esc(x.description)} · ${esc(x.to)} ${l.money(x.amountCents)}</option>`).join('');
    c.openDialog($('#golfDialog'), { trigger: document.activeElement, focus: '[name=adam]' });
  }
  function saved(dialog, label) {
    const persistent = storage.saveNow(); c.closeDialog($(dialog));
    const hadFilters = Boolean(state().ui.ledgerYear || state().ui.ledgerSearch || state().ui.ledgerCategories.length);
    storage.mutate(next => { next.ui.ledgerYear = ''; next.ui.ledgerSearch = ''; next.ui.ledgerCategories = []; }, { reason: 'ledger-view', touch: false }); render();
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
      const winningsCents = f.winnings.value.trim() === '' || Number(f.winnings.value) === 0 ? 0 : l.cents(f.winnings.value);
      if (selected && (selected.amountCents !== winningsCents || selected.to !== f.winner.value)) throw new Error('To link this entry, set the round winnings to the selected Money amount and recipient. Otherwise keep them separate.');
      storage.mutate(next => l.saveRound(next.workspace, { date: f.date.value.trim(), adam: Number(f.adam.value), tristan: Number(f.tristan.value), holes: f.holes.value || 'unknown', course: f.course.value, winner: f.winner.value, winningsCents,
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
      $('#noteImportPreview').innerHTML = `<p><strong>${p.moneyEntries.length} money entries · ${p.golfRounds.length} golf rounds</strong></p><p>Source balance: ${esc(l.balanceLabel(p.balance))}</p><p>${p.golfRounds.filter(x => x.date.length === 4).length} year-only dates · ${p.matches.length} exact winnings matches · ${duplicates} existing rows will be skipped.</p><p>${p.appendix ? 'The appendix will be appended to private shared Notes.' : 'No appendix found.'}</p><h3>Review notes</h3>${p.warnings.length ? '<ul>' + p.warnings.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>Source totals and recognized entries reconcile.</p>'}<details><summary>Preview money and round rows</summary><ol>${p.moneyEntries.map(x => `<li>${esc(x.date)} · ${esc(x.description)} · ${esc(x.from)} → ${esc(x.to)} ${l.money(x.amountCents)}${x.details ? ' · ' + esc(x.details) : ''}</li>`).join('')}${p.golfRounds.map(x => `<li>${esc(x.date)} · Adam ${x.adam}, Tristen ${x.tristan} · ${x.winningsCents ? esc(x.winner) + ' ' + l.money(x.winningsCents) : 'Even'}</li>`).join('')}</ol></details>`;
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
    $('#mainContent').innerHTML = shell(); $('.app-header').insertBefore($('.ledger-overview'), $('.top-toolbar'));  $('#mainContent').setAttribute('aria-label', 'Money and Golf'); document.body.insertAdjacentHTML('beforeend', dialogs());
    const file = document.createElement('input'); file.type = 'file'; file.accept = '.txt,text/plain'; file.id = 'runningNoteFile'; file.hidden = true; document.body.appendChild(file);
    file.addEventListener('change', () => { previewNote(file.files[0]); file.value = ''; });
    $('#ledgerSearch').addEventListener('input', event => { storage.mutate(next => { next.ui.ledgerSearch = event.target.value; }, { reason: 'ledger-view', touch: false }); render(); });
    $('#ledgerYear').addEventListener('change', event => { storage.mutate(next => { next.ui.ledgerYear = event.target.value; }, { reason: 'ledger-view', touch: false }); render(); });
    $('#swapMoneyDirection').addEventListener('click', () => { const f = $('#moneyForm').elements; [f.from.value, f.to.value] = [f.to.value, f.from.value]; moneyImpact(); });
    $('#ledgerIdentity').addEventListener('click', () => {
      if (!state().preferences.controls.developerMode) return;
      simulatedPerson = simulatedPerson === '' ? 'Adam' : simulatedPerson === 'Adam' ? 'Tristen' : '';
      render();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey) || event.repeat || event.isComposing) return;
      const dialog = document.querySelector('#moneyDialog[open], #golfDialog[open]');
      if (!dialog) return;
      event.preventDefault(); dialog.querySelector('form').requestSubmit();
    });
    $('#addEntry').addEventListener('click', addEntry);
    document.addEventListener('keydown', event => {
      if (event.key !== '.' || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]')) return;
      const target = event.target;
      if (target !== $('#ledgerSearch') && (target.closest('input, textarea, select') || target.isContentEditable)) return;
      event.preventDefault(); $('#ledgerSearch').focus(); $('#ledgerSearch').select();
    });
    document.querySelectorAll('[data-ledger-view]').forEach(button => { button.addEventListener('click', () => setView(button.dataset.ledgerView)); button.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const next = button.dataset.ledgerView === 'money' ? 'golf' : 'money'; setView(next); $('#' + next + 'Tab').focus(); } }); });
    desktop.addEventListener('change', render);
    portrait.addEventListener('change', () => { render(); moneyImpact(); });
    document.addEventListener('keydown', event => {
      if (event.key.toLowerCase() !== 'e' || event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]') || u.isEditableTarget(event.target)) return;
      const row = document.querySelector('.entry-row:hover');
      if (!row) return;
      event.preventDefault(); row.querySelector('[data-edit-money], [data-edit-golf]')?.click();
    });
    $('.quick-round').addEventListener('click', event => { const button = event.target.closest('[data-round-payer]'); if (button) quickRound(button.dataset.roundPayer); });
    $('#ledgerQuickActions').addEventListener('click', event => {
      const chip = event.target.closest('[data-filter-category]'); if (!chip) return;
      storage.mutate(next => { const categories = next.ui.ledgerCategories, category = chip.dataset.filterCategory; next.ui.ledgerCategories = categories.includes(category) ? categories.filter(value => value !== category) : [...categories, category]; }, { reason: 'ledger-view', touch: false });
      render();
    });
    $('#ledgerEntries').addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button?.dataset.inlineToggle) toggleInline(button.dataset.entryType, button.dataset.inlineToggle, document.activeElement === button);
      else if (button?.dataset.editMoney) openMoney(button.dataset.editMoney);
      else if (button?.dataset.editGolf) openGolf(button.dataset.editGolf);
      else if (button?.dataset.linkedRound) openGolf(button.dataset.linkedRound);
      else if (button?.dataset.linkedMoney) { const row = state().workspace.moneyEntries.find(entry => entry.id === button.dataset.linkedMoney && !entry.deleted); if (row) c.message('Linked Money entry', [dateLabel(row.date), row.description, row.category, row.from + ' → ' + row.to + ': ' + l.money(row.amountCents), row.details].filter(Boolean).join(' · '), { trigger: button }); }
      else if (button?.hasAttribute('data-clear-ledger')) setView(state().ui.activeModule);
      else if (button?.hasAttribute('data-import-shortcut')) file.click();
      else if (!event.target.closest('button, a, input, select, textarea, .inline-entry-details')) { const row = event.target.closest('[data-entry-id]'); if (row) toggleInline(row.dataset.entryType, row.dataset.entryId); }
    });
    const updateStickyOffset = () => document.documentElement.style.setProperty('--app-header-height', $('.app-header').getBoundingClientRect().height + 'px');
    new ResizeObserver(updateStickyOffset).observe($('.app-header')); updateStickyOffset();
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
  App.ledgerUI = { init, render, search, setLayout, openEntry: (type, entryId) => { setView(type); if (type === 'money') openMoney(entryId); else openGolf(entryId); } };
})();
