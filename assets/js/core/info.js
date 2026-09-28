(function () {
  "use strict";

  const App = window.LocalApp;
  const u = App.utils;

  function parse(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const result = { rules: [], contacts: [] };
    let section = "";
    lines.forEach(function (raw) {
      const line = raw.trim();
      if (/^bad\s*\(drunk\)\s*golf rules:?$/i.test(line)) { section = "rules"; return; }
      if (/contacts:?$/i.test(line)) { section = "contacts"; return; }
      if (!line) return;
      if (section === "rules") {
        const match = line.match(/^\d+[.)]\s*(.+)$/);
        if (match) result.rules.push(u.cleanLine(match[1], 300));
        else section = "";
        return;
      }
      if (section === "contacts") {
        const parts = line.split(/\s*::\s*/).map(function (value) { return u.cleanLine(value, 200); });
        if (parts.length === 4 && parts.every(Boolean) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parts[3])) {
          result.contacts.push({ name: parts[0], relationship: parts[1], phone: parts[2], email: parts[3] });
        } else section = "";
      }
    });
    return result;
  }

  function phoneHref(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return "tel:+1" + digits;
    if (digits.length >= 7 && digits.length <= 15) return "tel:+" + digits;
    return "";
  }

  App.info = Object.freeze({ parse: parse, phoneHref: phoneHref });
})();
