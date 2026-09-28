(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const u = App.utils;
  const model = App.stateModel;
  let currentState;
  let tabConflict = null;
  const draftKey = config.storage.stateKey + ".pending-tab";
  let persistentStorageAvailable = true;
  let lastSavedJson = "";
  let loadReport = { source: "default", migrations: [], warnings: [], recovered: false, error: "" };

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function readLocal(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      persistentStorageAvailable = false;
      return null;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, value);
      persistentStorageAvailable = true;
      return true;
    } catch (error) {
      persistentStorageAvailable = false;
      emit("app:storageerror", {
        title: error && error.name === "QuotaExceededError" ? "Storage is full" : "Changes are not persistent",
        message: error && error.name === "QuotaExceededError"
          ? "The browser could not save this change. Export a backup, remove unneeded content, or free browser storage."
          : "Browser storage is unavailable. Changes made in this session may be lost.",
        error: error
      });
      return false;
    }
  }

  function removeLocal(key) {
    try { localStorage.removeItem(key); } catch (error) { persistentStorageAvailable = false; }
  }

  function readRecovery() {
    const raw = readLocal(config.storage.recoveryKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const prepared = model.prepare(parsed.state || parsed);
      return { state: prepared.state, createdAt: parsed.createdAt || "", reason: parsed.reason || "Recovery snapshot" };
    } catch (error) {
      return null;
    }
  }

  function load() {
    const candidates = [{ key: config.storage.stateKey, label: "current" }].concat(config.storage.legacyKeys.map(function (key) { return { key: key, label: "legacy" }; }));
    let parseError = "";
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const raw = readLocal(candidate.key);
      if (!raw) continue;
      try {
        const prepared = model.prepare(JSON.parse(raw));
        currentState = prepared.state;
        loadReport = {
          source: candidate.label,
          migrations: prepared.migrations,
          warnings: prepared.validation.warnings,
          recovered: false,
          error: ""
        };
        lastSavedJson = JSON.stringify(currentState);
        if (candidate.key !== config.storage.stateKey || prepared.migrations.length) saveNow();
        return currentState;
      } catch (error) {
        parseError = error.message || "Saved state could not be read.";
      }
    }

    const recovery = readRecovery();
    if (recovery) {
      currentState = recovery.state;
      loadReport = { source: "recovery", migrations: [], warnings: [], recovered: true, error: parseError };
      saveNow();
      return currentState;
    }

    currentState = model.createDefaultState();
    loadReport = { source: "default", migrations: [], warnings: [], recovered: false, error: parseError };
    saveNow();
    return currentState;
  }

  function getState() {
    if (!currentState) return load();
    return currentState;
  }

  function saveNow() {
    if (!currentState) return false;
    const other = readLocal(config.storage.stateKey);
    if (other && lastSavedJson && other !== lastSavedJson) {
      try {
        const remote = model.prepare(JSON.parse(other)).state;
        const base = model.prepare(JSON.parse(lastSavedJson)).state;
        const result = model.mergeResult(currentState, remote, {}, model.syncPayload(base).data);
        if (result.conflicts.length) {
          const changed = !tabConflict || tabConflict.raw !== other;
          tabConflict = { raw: other, remote, base, conflicts: result.conflicts, localHash: model.syncHash(currentState) };
          saveDraft();
          if (changed) emit("app:tabconflict", {});
          return false;
        }
        currentState = model.merge(currentState, remote, {}, model.syncPayload(base).data);
        lastSavedJson = other; tabConflict = null;
        emit("app:statechange", { reason: "tab-merge", state: currentState });
      } catch (error) { saveDraft(); emit("app:storageerror", { title: "Another tab needs review", message: error.message }); return false; }
    }
    const normalized = model.normalize(currentState);
    currentState = normalized;
    const json = JSON.stringify(normalized);
    if (json === lastSavedJson) { clearDraft(); return true; }
    const saved = writeLocal(config.storage.stateKey, json);
    if (saved) {
      lastSavedJson = json;
      clearDraft();
      emit("app:statesaved", { bytes: new Blob([json]).size, updatedAt: normalized.meta.updatedAt });
    }
    return saved;
  }

  const scheduleSave = u.debounce(saveNow, config.controls.autosaveDelayMs);

  function mutate(callback, options) {
    const settings = Object.assign({ touch: true, save: true, reason: "change" }, options || {});
    const state = u.clone(getState());
    callback(state);
    if (settings.touch) model.touch(state);
    currentState = model.normalize(state);
    if (settings.save) { saveDraft(); scheduleSave(); }
    emit("app:statechange", { reason: settings.reason, state: currentState });
    return currentState;
  }

  function saveRecovery(reason, state) {
    const snapshot = {
      createdAt: u.isoNow(),
      reason: u.cleanLine(reason || "Before data replacement", 160),
      state: model.normalize(u.clone(state || getState()))
    };
    return writeLocal(config.storage.recoveryKey, JSON.stringify(snapshot));
  }

  function replace(nextState, options) {
    const settings = Object.assign({ recoveryReason: "Before data replacement", saveRecovery: true, reason: "replace", touch: true }, options || {});
    const prepared = model.prepare(nextState);
    if (settings.saveRecovery && currentState && !saveRecovery(settings.recoveryReason, currentState)) throw new Error("A recovery copy could not be saved.");
    currentState = prepared.state;
    if (settings.touch) model.touch(currentState);
    saveDraft();
    saveNow();
    emit("app:statechange", { reason: settings.reason, state: currentState });
    return currentState;
  }

  function restoreRecovery() {
    const recovery = readRecovery();
    if (!recovery) throw new Error("No usable recovery snapshot is available.");
    return replace(recovery.state, { saveRecovery: false, reason: "recovery" });
  }

  function recoveryInfo() {
    const recovery = readRecovery();
    if (!recovery) return null;
    return { createdAt: recovery.createdAt, reason: recovery.reason, documents: recovery.state.workspace.documents.length };
  }

  function clearAll() {
    scheduleSave.cancel();
    clearDraft();
    tabConflict = null;
    [config.storage.stateKey, config.storage.recoveryKey, config.storage.secretKey, config.storage.sessionSecretKey].concat(config.storage.legacyKeys).forEach(removeLocal);
    try { sessionStorage.removeItem(config.storage.sessionSecretKey); } catch (error) { /* unavailable */ }
    lastSavedJson = "";
    currentState = model.createDefaultState({ demo: false });
    saveNow();
    emit("app:statechange", { reason: "erase-all", state: currentState });
    return currentState;
  }

  function setSecret(token, remember) {
    const clean = u.cleanLine(token, 500);
    try {
      if (remember) {
        localStorage.setItem(config.storage.secretKey, clean);
        sessionStorage.removeItem(config.storage.sessionSecretKey);
      } else {
        sessionStorage.setItem(config.storage.sessionSecretKey, clean);
        localStorage.removeItem(config.storage.secretKey);
      }
      return true;
    } catch (error) {
      emit("app:storageerror", { title: "Token was not stored", message: "This browser would not allow per-device token storage.", error: error });
      return false;
    }
  }

  function getSecret() {
    try { return localStorage.getItem(config.storage.secretKey) || sessionStorage.getItem(config.storage.sessionSecretKey) || ""; }
    catch (error) { return ""; }
  }

  function hasSecret() {
    return Boolean(getSecret());
  }

  function clearSecret() {
    removeLocal(config.storage.secretKey);
    try { sessionStorage.removeItem(config.storage.sessionSecretKey); } catch (error) { /* unavailable */ }
  }

  async function usage() {
    const stateJson = JSON.stringify(getState());
    const localBytes = new Blob([stateJson]).size;
    let estimate = null;
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      try { estimate = await navigator.storage.estimate(); } catch (error) { estimate = null; }
    }
    return {
      stateBytes: localBytes,
      usage: estimate && Number.isFinite(estimate.usage) ? estimate.usage : null,
      quota: estimate && Number.isFinite(estimate.quota) ? estimate.quota : null,
      persistentStorageAvailable: persistentStorageAvailable
    };
  }

  function saveDraft() {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ state: currentState, base: lastSavedJson ? JSON.parse(lastSavedJson) : currentState })); }
    catch (error) { /* The normal storage error path still offers export. */ }
  }
  function clearDraft() { try { sessionStorage.removeItem(draftKey); } catch (error) { /* Storage may be unavailable. */ } }
  function restoreDraft(saved, raw) {
    if (!raw) return saved;
    try {
      const draft = JSON.parse(raw), local = model.prepare(draft.state).state, base = model.prepare(draft.base).state;
      const result = model.mergeResult(local, saved, {}, model.syncPayload(base).data);
      if (result.conflicts.length) {
        currentState = local;
        tabConflict = { raw: lastSavedJson, remote: saved, base, conflicts: result.conflicts, localHash: model.syncHash(local) };
        // Retain the original ancestor until the user resolves both versions.
        lastSavedJson = JSON.stringify(base);
      } else { currentState = model.merge(local, saved, {}, model.syncPayload(base).data); saveNow(); }
      return currentState;
    } catch (error) { emit("app:storageerror", { title: "Saved tab draft needs review", message: error.message }); return saved; }
  }
  function resolveTabs(resolutions) {
    if (!tabConflict) return;
    if (readLocal(config.storage.stateKey) !== tabConflict.raw || model.syncHash(currentState) !== tabConflict.localHash) {
      tabConflict = null; saveNow(); throw new Error("A tab changed during review. Review the latest versions again.");
    }
    const merged = model.merge(currentState, tabConflict.remote, resolutions, model.syncPayload(tabConflict.base).data);
    if (!saveRecovery("Before resolving browser tabs")) throw new Error("A recovery copy could not be saved.");
    lastSavedJson = tabConflict.raw; currentState = merged; tabConflict = null; saveNow();
    emit("app:statechange", { reason: "tab-merge", state: currentState });
  }
  window.addEventListener("storage", function (event) {
    if (event.key === config.storage.stateKey && currentState && event.newValue) saveNow();
  });

  window.addEventListener("pagehide", function () { scheduleSave.flush(); });
  window.addEventListener("beforeunload", function () { scheduleSave.flush(); });

  App.storage = {
    load: function () { let draft; try { draft = sessionStorage.getItem(draftKey); } catch (error) { /* optional tab draft */ } return restoreDraft(load(), draft); },
    getTabConflict: function () { return tabConflict; },
    resolveTabs: resolveTabs,
    getState: getState,
    getLoadReport: function () { return u.clone(loadReport); },
    mutate: mutate,
    replace: replace,
    saveNow: saveNow,
    saveRecovery: saveRecovery,
    restoreRecovery: restoreRecovery,
    recoveryInfo: recoveryInfo,
    clearAll: clearAll,
    setSecret: setSecret,
    getSecret: getSecret,
    hasSecret: hasSecret,
    clearSecret: clearSecret,
    usage: usage,
    isPersistent: function () { return persistentStorageAvailable; }
  };
})();
