import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
export function domain() {
  const window = {};
  const context = vm.createContext({ window, crypto: webcrypto, TextEncoder, Intl, Date, console });
  for (const file of ['config', 'core/utils', 'core/info', 'core/ledger', 'core/note-import', 'core/state']) {
    vm.runInContext(readFileSync(new URL('../assets/js/' + file + '.js', import.meta.url), 'utf8'), context);
    if (file === 'core/utils') window.LocalApp.utils = { ...window.LocalApp.utils, sanitizeRichHtml: String, richTextToPlainText: value => String(value).replace(/<br\s*\/?>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&') };
  }
  return window.LocalApp;
}
export const moneyFields = { date: '2026-01-01', kind: 'owed', amountCents: 1250, from: 'Adam', to: 'Tristen', description: 'Lunch', category: 'Food', details: '', sourceRoundId: '', linkRole: '' };
export const roundFields = { date: '2026-01-02', adam: 90, tristan: 94, winningsCents: 400, winner: 'Adam', paymentCents: 0, payer: '', holes: '18', course: 'Practice course', details: '', review: '' };
