(function () {
  "use strict";
  const App = window.LocalApp, u = App.utils;
  const people = ["Adam", "Tristen"];
  const MAX_CENTS = 100000000;
  function fail(message) { throw new Error(message); }
  function id() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : u.uid("entry"); }
  function text(value, max) { return u.cleanText(value || "", max || 2000); }
  function cents(value) {
    const raw = String(value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) fail("Enter a positive amount with at most two decimal places.");
    const [whole, fraction = ""] = raw.split(".");
    const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_CENTS) fail("Amount must be between $0.01 and $1,000,000.");
    return amount;
  }
  function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(value / 100); }
  function balanceLabel(value) { return value === 0 ? "All square" : (value > 0 ? "Tristen owes Adam " : "Adam owes Tristen ") + money(Math.abs(value)); }
  function person(value) { if (value === "Tristan") value = "Tristen"; if (!people.includes(value)) fail("Choose Adam or Tristen."); return value; }
  function date(value) {
    if (typeof value !== "string" || !/^\d{4}(?:-\d{2}-\d{2})?$/.test(value)) fail("Enter a date or a known four-digit year.");
    const year = Number(value.slice(0, 4));
    if (year < 1900 || year > 2200 || (value.length === 10 && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) !== value)) fail("Enter a valid date.");
    return value;
  }
  function integer(value, minimum, maximum, label) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(label + " is invalid.");
    return value;
  }
  function common(raw) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !/^[\w:.-]{1,160}$/.test(raw.id)) fail("An entry has an invalid ID.");
    return { id: raw.id, date: date(raw.date), order: integer(raw.order, 0, Number.MAX_SAFE_INTEGER - 1, "Entry order"),
      createdAt: text(raw.createdAt, 40), updatedAt: text(raw.updatedAt, 40), createdBy: text(raw.createdBy, 30).replace(/^Tristan$/, "Tristen"), updatedBy: text(raw.updatedBy, 30).replace(/^Tristan$/, "Tristen"),
      rev: text(raw.rev, 160), deleted: raw.deleted === true,
      source: raw.source ? { batch: text(raw.source.batch, 100), line: text(raw.source.line, 3000), occurrence: integer(raw.source.occurrence, 0, 100000, "Source row") } : null };
  }
  function normalizeMoney(raw) {
    const item = common(raw);
    if (!["owed", "repayment"].includes(raw.kind)) fail("Money entry type is invalid.");
    return Object.assign(item, { kind: raw.kind, amountCents: integer(raw.amountCents, 1, MAX_CENTS, "Amount"),
      from: person(raw.from), to: person(raw.to), description: text(raw.description, 200), category: raw.linkRole === "winnings" || /golf winnings|golf bets/i.test(raw.description) ? "Wins" : text(raw.category, 40), details: text(raw.details),
      sourceRoundId: text(raw.sourceRoundId, 160), linkRole: text(raw.linkRole, 30) });
  }
  function normalizeRound(raw) {
    const item = common(raw);
    if (!["unknown", "other"].includes(raw.holes) && !(/^[1-9][0-9]?$/.test(String(raw.holes)))) fail("Choose the number of holes, or Unknown.");
    const win = integer(raw.winningsCents, 0, MAX_CENTS, "Winnings");
    const payment = integer(raw.paymentCents || 0, 0, MAX_CENTS, "Round payment");
    return Object.assign(item, { adam: integer(raw.adam, 1, 500, "Adam's score"), tristan: integer(raw.tristan, 1, 500, "Tristen's score"),
      holes: String(raw.holes), course: text(raw.course, 200), details: text(raw.details), winningsCents: win,
      winner: win ? person(raw.winner) : "", winningsEntryId: text(raw.winningsEntryId, 160),
      paymentCents: payment, payer: payment ? person(raw.payer) : "", paymentEntryId: text(raw.paymentEntryId, 160),
      review: text(raw.review, 1000) });
  }
  function collections(workspace) {
    const result = {};
    for (const [key, normalize] of [["moneyEntries", normalizeMoney], ["golfRounds", normalizeRound]]) {
      const rows = workspace[key] === undefined ? [] : workspace[key];
      if (!Array.isArray(rows) || rows.length > 10000) fail("The " + key + " collection is invalid or too large.");
      const ids = new Set();
      result[key] = rows.map(raw => {
        const item = normalize(raw);
        if (ids.has(item.id)) fail("Duplicate entry ID: " + item.id);
        ids.add(item.id);
        if (key === "moneyEntries" && item.from === item.to) fail("The sender and recipient must differ.");
        return item;
      });
    }
    // Imported year-only winnings now participate in Money without inventing an event date.
    for (const round of result.golfRounds) {
      if (round.deleted || round.date.length !== 4 || !round.winningsCents || round.winningsEntryId || !round.source || !round.review.includes("Exact date unknown")) continue;
      const entryId = "golf:" + round.id + ":winnings";
      if (result.moneyEntries.some(entry => entry.id === entryId)) continue;
      result.moneyEntries.push(normalizeMoney({ ...round, id: entryId, kind: "owed", amountCents: round.winningsCents,
        from: round.winner === "Adam" ? "Tristen" : "Adam", to: round.winner, description: "Golf Winnings", category: "Wins", details: "",
        sourceRoundId: round.id, linkRole: "winnings" }));
      round.winningsEntryId = entryId;
      round.review = "Exact date unknown; shown at January 1 for ordering.";
    }
    validateLinks(result);
    return result;
  }
  function validateLinks(data) {
    const entries = new Map(data.moneyEntries.map(x => [x.id, x]));
    const rounds = new Map(data.golfRounds.map(x => [x.id, x]));
    data.golfRounds.forEach(round => {
      if (round.deleted) return;
      for (const [role, entryId, amount, recipient] of [["winnings", round.winningsEntryId, round.winningsCents, round.winner], ["payment", round.paymentEntryId, round.paymentCents, round.payer]]) {
        if (!entryId) continue;
        const entry = entries.get(entryId);
        if (!entry || entry.deleted || entry.sourceRoundId !== round.id || entry.linkRole !== role || entry.amountCents !== amount || entry.to !== recipient || entry.kind !== "owed") fail("A round and its linked money entry disagree. Review them together.");
      }
    });
    data.moneyEntries.forEach(entry => {
      if (entry.deleted || !entry.sourceRoundId) return;
      const round = rounds.get(entry.sourceRoundId);
      if (!round || round.deleted || !["winnings", "payment"].includes(entry.linkRole) || round[entry.linkRole === "winnings" ? "winningsEntryId" : "paymentEntryId"] !== entry.id) fail("A linked money entry has no matching round.");
    });
  }
  function active(rows) { return rows.filter(x => !x.deleted); }
  function ascending(a, b) { return a.order - b.order || a.id.localeCompare(b.id); }
  function ordered(rows) {
    const entries = active(rows), dated = entries.filter(entry => entry.date.length !== 4);
    const rank = entry => entry.date.length !== 4 ? entry.order : Math.min(entry.order, ...dated.filter(other => other.date >= entry.date + "-01-01").map(other => other.order)) - 0.5;
    return entries.slice().sort((a, b) => rank(a) - rank(b) || a.date.localeCompare(b.date) || ascending(a, b));
  }
  function newest(rows) { return ordered(rows).reverse(); }
  function delta(entry) { return (entry.to === "Adam" ? 1 : -1) * entry.amountCents * (entry.kind === "repayment" ? -1 : 1); }
  function totals(rows) {
    let balance = 0; const running = Object.create(null);
    ordered(rows).forEach(entry => { balance += delta(entry); if (!Number.isSafeInteger(balance)) fail("Balance is too large."); running[entry.id] = balance; });
    return { balance, running };
  }
  function golfSummary(rows, year) {
    const items = active(rows).filter(x => !year || x.date.slice(0, 4) === year);
    return items.reduce((summary, round) => {
      summary.count++; summary.margin += round.tristan - round.adam;
      summary[round.adam < round.tristan ? "adamWins" : round.adam > round.tristan ? "tristanWins" : "ties"]++;
      summary.winnings += round.winningsCents * (round.winner === "Adam" ? 1 : -1);
      return summary;
    }, { count: 0, margin: 0, winnings: 0, adamWins: 0, tristanWins: 0, ties: 0 });
  }
  function nextOrder(workspace) { return Math.max(0, ...workspace.moneyEntries.map(x => x.order), ...workspace.golfRounds.map(x => x.order)) + 1; }
  function stamp(workspace, old, actor) {
    const now = u.isoNow();
    return Object.assign({}, old || { id: id(), order: nextOrder(workspace), createdAt: now, createdBy: actor, source: null }, { rev: id(), updatedAt: now, updatedBy: actor, deleted: false });
  }
  function put(rows, item) { const index = rows.findIndex(x => x.id === item.id); if (index < 0) rows.push(item); else rows[index] = item; }
  function saveMoney(workspace, fields, actor, entryId) {
    const old = workspace.moneyEntries.find(x => x.id === entryId);
    if (old?.sourceRoundId) fail("Edit the linked golf round to change this entry.");
    const entry = normalizeMoney(Object.assign(stamp(workspace, old, actor), fields));
    if (entry.from === entry.to) fail("Choose two different people.");
    put(workspace.moneyEntries, entry); return entry;
  }
  function saveRound(workspace, fields, actor, roundId, postWinnings) {
    const old = workspace.golfRounds.find(x => x.id === roundId);
    const round = normalizeRound(Object.assign(stamp(workspace, old, actor), { winningsEntryId: "", paymentEntryId: "" }, old || {}, fields, { rev: id(), updatedAt: u.isoNow(), updatedBy: actor }));
    for (const role of ["winnings", "payment"]) {
      const key = role === "winnings" ? "winningsEntryId" : "paymentEntryId";
      const amount = role === "winnings" ? round.winningsCents : round.paymentCents;
      const recipient = role === "winnings" ? round.winner : round.payer;
      const enabled = role === "payment" || postWinnings;
      const oldEntry = workspace.moneyEntries.find(x => x.id === (fields[key] || old?.[key]));
      if (oldEntry?.sourceRoundId && oldEntry.sourceRoundId !== round.id) fail("That money entry is already linked to another round.");
      if (amount && enabled) {
        const entry = normalizeMoney(Object.assign(stamp(workspace, oldEntry, actor), {
          id: oldEntry?.id || "golf:" + round.id + ":" + role, date: round.date, kind: "owed", amountCents: amount,
          from: recipient === "Adam" ? "Tristen" : "Adam", to: recipient,
          description: role === "winnings" ? "Golf Winnings" : "Golf round payment", category: role === "winnings" ? "Wins" : "Golf", details: oldEntry?.details && oldEntry.details !== old?.course ? oldEntry.details : "",
          sourceRoundId: round.id, linkRole: role, rev: round.rev
        }));
        put(workspace.moneyEntries, entry); round[key] = entry.id;
      } else {
        if (oldEntry) put(workspace.moneyEntries, Object.assign({}, oldEntry, { deleted: true, rev: round.rev, updatedAt: round.updatedAt, updatedBy: actor }));
        round[key] = "";
      }
    }
    if (postWinnings) round.review = "";
    put(workspace.golfRounds, round); validateLinks(workspace); return round;
  }
  function remove(workspace, type, entryId, actor) {
    const rows = workspace[type], item = rows.find(x => x.id === entryId);
    if (!item) fail("Entry no longer exists.");
    if (type === "moneyEntries" && item.sourceRoundId) fail("Delete the linked golf round or set its winnings to Even.");
    const saved = { moneyEntries: [], golfRounds: [] }, rev = id(), now = u.isoNow();
    for (const key of ["moneyEntries", "golfRounds"]) workspace[key].forEach(row => {
      if ((key === type && row.id === entryId) || (type === "golfRounds" && key === "moneyEntries" && row.sourceRoundId === entryId)) {
        saved[key].push(u.clone(row)); row.deleted = true; row.rev = rev; row.updatedAt = now; row.updatedBy = actor;
      }
    });
    return { saved, rev };
  }
  function undo(workspace, operation, actor) {
    for (const key of ["moneyEntries", "golfRounds"]) for (const row of operation.saved[key]) {
      const current = workspace[key].find(x => x.id === row.id);
      if (!current || current.rev !== operation.rev) fail("This entry changed since deletion. Review it before restoring.");
    }
    for (const key of ["moneyEntries", "golfRounds"]) operation.saved[key].forEach(row => put(workspace[key], Object.assign({}, row, { rev: id(), updatedAt: u.isoNow(), updatedBy: actor })));
    validateLinks(workspace);
  }
  function groupData(data) {
    const groups = {};
    (data.golfRounds || []).forEach(row => { groups["golf:" + row.id] = { golfRounds: [row], moneyEntries: [] }; });
    (data.moneyEntries || []).forEach(row => {
      const key = row.sourceRoundId ? "golf:" + row.sourceRoundId : "money:" + row.id;
      (groups[key] ||= { golfRounds: [], moneyEntries: [] }).moneyEntries.push(row);
    });
    Object.values(groups).forEach(group => { group.moneyEntries.sort((a, b) => a.id.localeCompare(b.id)); });
    return groups;
  }
  function semantic(value) { return JSON.stringify(value, (key, item) => ["rev", "updatedAt", "updatedBy"].includes(key) ? undefined : item); }
  function mergeData(local, remote, base, resolutions) {
    const maps = [groupData(local), groupData(remote), groupData(base || {})];
    const result = { moneyEntries: [], golfRounds: [] }, conflicts = [];
    const pick = (key, l, r, b) => {
      if (semantic(l) === semantic(r)) return r;
      if (semantic(l) === semantic(b)) return r;
      if (semantic(r) === semantic(b)) return l;
      if (!base && l === undefined) return r;
      if (!base && r === undefined) return l;
      if (resolutions?.[key] === "local") return l;
      if (resolutions?.[key] === "remote") return r;
      conflicts.push({ key, local: l, remote: r, base: b }); return l;
    };
    new Set([...Object.keys(maps[0]), ...Object.keys(maps[1]), ...Object.keys(maps[2])]).forEach(key => {
      const group = pick(key, maps[0][key], maps[1][key], maps[2][key]);
      if (group) { result.moneyEntries.push(...group.moneyEntries); result.golfRounds.push(...group.golfRounds); }
    });
    const labels = pick("tokenLabels", local.tokenLabels, remote.tokenLabels, base?.tokenLabels);
    if (labels) result.tokenLabels = labels;
    const notes = pick("notes", local.notes || "", remote.notes || "", base ? base.notes || "" : undefined);
    if (notes) result.notes = notes;
    // An absent initial Notes document is not a concurrent edit.
    if (!base && (!local.notes || !remote.notes)) {
      result.notes = local.notes || remote.notes || "";
      const index = conflicts.findIndex(x => x.key === "notes"); if (index >= 0) conflicts.splice(index, 1);
    }
    result.moneyEntries.sort((a, b) => a.id.localeCompare(b.id)); result.golfRounds.sort((a, b) => a.id.localeCompare(b.id));
    if (!conflicts.length) collections(result);
    return { data: result, conflicts };
  }
  function categoryTotals(entries, viewer) {
    const result = { Wins: 0, Bets: 0 };
    for (const entry of active(entries)) {
      const category = entry.linkRole === 'winnings' || /golf bets|golf winnings/i.test(entry.description) ? 'Wins' : entry.category;
      if (!Object.hasOwn(result, category)) continue;
      result[category] += delta(entry) * (viewer === 'Tristen' ? -1 : 1);
    }
    return result;
  }
  App.ledger = { categoryTotals, people, id, cents, money, balanceLabel, date, collections, validateLinks, active, newest, delta, totals, golfSummary, nextOrder, saveMoney, saveRound, remove, undo, mergeData };
})();
