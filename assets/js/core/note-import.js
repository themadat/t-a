(function () {
  "use strict";
  const App = window.LocalApp, u = App.utils, ledger = App.ledger;
  async function digest(value) {
    if (!globalThis.crypto?.subtle) throw new Error("Note import requires HTTPS or localhost.");
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map(n => n.toString(16).padStart(2, "0")).join("");
  }
  function person(value) { return /^(A|Adam)$/i.test(value) ? "Adam" : "Tristen"; }
  async function parse(source) {
    if (typeof source !== "string" || source.length > 500000) throw new Error("The note must be text smaller than 500 KB.");
    const batch = await digest(source), moneyEntries = [], golfRounds = [], warnings = [], appendix = [], summaries = [];
    const occurrences = new Map(); let section = "", running = 0, lineNumber = 0;
    async function common(kind, canonical, line, date, order) {
      const hash = await digest(JSON.stringify(canonical).replace(/Tristen/g, "Tristan")); const key = kind + hash;
      const occurrence = occurrences.get(key) || 0; occurrences.set(key, occurrence + 1);
      return { id: "import:" + kind + ":" + hash + ":" + occurrence, date, order, createdAt: "", updatedAt: "", createdBy: "Imported", updatedBy: "Imported", rev: batch,
        deleted: false, source: { batch, line, occurrence: lineNumber } };
    }
    for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
      lineNumber++; const trimmed = line.trim();
      if (/^Money$/i.test(trimmed)) { section = "money"; continue; }
      if (/^Rounds$/i.test(trimmed)) { section = "golf"; continue; }
      if (!section || !trimmed) { if (section === "appendix") appendix.push(line); continue; }
      if (section === "appendix") { appendix.push(line); continue; }
      if (section === "money" && /^Date\s+What/.test(trimmed)) continue;
      if (section === "golf" && /^\d{4}:/.test(trimmed)) { summaries.push(trimmed); continue; }
      if (!/^\d{4}-/.test(trimmed)) {
        if (section === "golf") { section = "appendix"; appendix.push(line); continue; }
        throw new Error("Unrecognized money line " + lineNumber + ". Review it before importing.");
      }
      if (section === "money") {
        const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(.+?)\s*(Adam|Trist[ae]n)\s*=>\s*(Adam|Trist[ae]n):?\s*\$(\d+(?:\.\d{1,2})?)\s+([+-]?)\$(\d+(?:\.\d{1,2})?)(.*)$/i);
        if (!match) throw new Error("Could not read money line " + lineNumber + ". No data was imported.");
        const amount = ledger.cents(match[5]), from = person(match[3]), to = person(match[4]);
        const description = match[2].trim().replace(/(?:Adam|Trist[ae]n)\s+(?:Paid|Won):?\s*$/i, "").trim();
        const details = match[8].replace(/^\s*to\s+(?:Adam|Trist[ae]n)/i, "").trim();
        const fields = { date: match[1], description, amountCents: amount, from, to, details };
        const entry = Object.assign(await common("money", fields, line, match[1], moneyEntries.length + 1), fields,
          { kind: "owed", category: /golf bets|golf winnings/i.test(description) ? "Wins" : /golf|range/i.test(description) ? "Golf" : /food|pizza|sub|coldstone/i.test(description) ? "Food" : /bet/i.test(description) ? "Bets" : "Other", sourceRoundId: "", linkRole: "" });
        moneyEntries.push(entry); running += ledger.delta(entry);
        const expected = Number(match[7]) * 100 * (match[6] === "-" ? -1 : 1);
        if (Math.abs(running - expected) > 0.001) warnings.push("Money line " + lineNumber + ": the written running total differs from the entries.");
      } else {
        const match = trimmed.match(/^(\d{4}-(?:\d{2}|\?\?)-(?:\d{2}|\?\?)):\s*Adam\s+(\d+)\s*\|\s*Trist[ae]n\s+(\d+)\s*\|\s*([^|]+)\|\s*(Adam|Trist[ae]n|A|T|EVEN)\s*\+\$(\d+(?:\.\d{1,2})?)\s*$/i);
        if (!match) throw new Error("Could not read golf line " + lineNumber + ". No data was imported.");
        const winningsCents = Math.round(Number(match[6]) * 100), eventDate = match[1].includes("?") ? match[1].slice(0, 4) : match[1];
        const fields = { date: eventDate, adam: Number(match[2]), tristan: Number(match[3]), winningsCents, winner: winningsCents ? person(match[5]) : "" };
        golfRounds.push(Object.assign(await common("round", fields, line, eventDate, 0), fields, { holes: "unknown", course: "", details: "", winningsEntryId: "", paymentCents: 0, payer: "", paymentEntryId: "", review: "" }));
      }
    }
    if (!moneyEntries.length && !golfRounds.length) throw new Error("No Money or Rounds entries were found.");
    golfRounds.forEach((round, index) => { round.order = golfRounds.length - index; });
    const matches = [];
    golfRounds.forEach(round => {
      if (!round.winningsCents) return;
      const candidates = moneyEntries.filter(entry => round.date.length === 10 && entry.date === round.date && /golf bets/i.test(entry.description) && !/mini/i.test(entry.description));
      if (candidates.length === 1 && candidates[0].amountCents === round.winningsCents && candidates[0].to === round.winner) matches.push({ roundId: round.id, moneyId: candidates[0].id });
      else {
        round.review = round.date.length === 4 ? "Exact date unknown; winnings are not linked to Money." : candidates.length ? "Round winnings differ from Money. Original values preserved." : "No matching winnings entry in Money. Nothing was added to the balance.";
        warnings.push(round.date + ": " + round.review);
      }
    });
    summaries.forEach(line => {
      const match = line.match(/^(\d{4}):\s*(Adam|Trist[ae]n)-(\d+)\s*\|\s*(Adam|Trist[ae]n)\s*\+\$(\d+)/i);
      if (!match) { warnings.push("Unrecognized annual summary: " + line); return; }
      const actual = ledger.golfSummary(golfRounds, match[1]);
      if (actual.margin !== Number(match[3]) * (person(match[2]) === "Adam" ? 1 : -1) || actual.winnings !== Number(match[5]) * 100 * (person(match[4]) === "Adam" ? 1 : -1)) warnings.push("The " + match[1] + " summary differs from its rounds.");
    });
    ledger.collections({ moneyEntries, golfRounds });
    return { batch, moneyEntries, golfRounds, matches, warnings, appendix: appendix.join("\n").trim(), balance: running };
  }
  function apply(workspace, parsed, linkMatches, acceptOverlap) {
    const existingBatches = new Set([...workspace.moneyEntries, ...workspace.golfRounds].map(x => x.source?.batch).filter(Boolean));
    const newRows = ["moneyEntries", "golfRounds"].some(key => parsed[key].some(row => !workspace[key].some(x => x.id === row.id)));
    if (existingBatches.size && !existingBatches.has(parsed.batch) && newRows && !acceptOverlap) throw new Error("This is an edited or different note. Review possible duplicates and explicitly allow the additional rows.");
    let added = 0; const incoming = u.clone(parsed), base = ledger.nextOrder(workspace);
    const addedIds = new Set();
    for (const key of ["moneyEntries", "golfRounds"]) incoming[key].forEach(row => {
      if (workspace[key].some(x => x.id === row.id)) return;
      row.order += base; workspace[key].push(row); addedIds.add(row.id); added++;
    });
    if (linkMatches) incoming.matches.forEach(match => {
      const round = workspace.golfRounds.find(x => x.id === match.roundId), entry = workspace.moneyEntries.find(x => x.id === match.moneyId);
      // Reimport must not relink or modify records a person has edited since import.
      if (!addedIds.has(round?.id) || !addedIds.has(entry?.id)) return;
      round.winningsEntryId = entry.id; entry.sourceRoundId = round.id; entry.linkRole = "winnings";
    });
    ledger.validateLinks(workspace);
    return { added, appendix: !existingBatches.has(parsed.batch) && added ? parsed.appendix : "" };
  }
  App.noteImport = { parse, apply };
})();
