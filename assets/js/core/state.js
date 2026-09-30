(function () {
  "use strict";

  const App = window.LocalApp;
  const config = App.config;
  const u = App.utils;
  const SYNC_FORMAT = "local-first-app-data";
  const SYNC_VERSION = 2;
  // Older clients reject v7 rather than dropping Bet winnings or converting unknown scores.
  const SYNC_SCHEMA_VERSION = 7;
  const CLOUD_TARGET = Object.freeze({
    owner: u.cleanLine(config.cloudSync?.owner, 39),
    repo: u.cleanLine(config.cloudSync?.repo, 100).replace(/\.git$/i, ""),
    branch: u.cleanLine(config.cloudSync?.branch || "main", 250) || "main",
    path: u.cleanLine(config.cloudSync?.path || "data/t-a.json", 500).replace(/^\/+/, "") || "data/t-a.json"
  });
  const MODULE_IDS = ["money", "golf", "roadmap"];
  function blankNotes(now) {
    return [
      { id: "app-notes", title: "Notes", html: "", order: 0, createdAt: now, updatedAt: now }
    ];
  }

  function defaultTheme() {
    return config.themeDefaults;
  }

  function createDefaultState() {
    const now = u.isoNow();

    const documents = blankNotes(now);
    return {
      schemaVersion: config.schemaVersion,
      meta: {
        appVersion: config.identity.version,
        buildId: config.identity.buildId,
        createdAt: now,
        updatedAt: now,
        lastMutationId: u.uid("mutation"),
      },
      workspace: { title: config.identity.name, documents: documents, moneyEntries: [], golfRounds: [], tokenLabels: {} },
      preferences: {
        person: "",
        ledgerLayouts: {},
        appearance: {
          mode: "system",
          accent: defaultTheme().accent,
          accent2: defaultTheme().accent2,
          success: defaultTheme().success,
          warning: defaultTheme().warning,
          danger: defaultTheme().danger,
          textScale: 1
        },
        controls: {
          whatsNewDismissSeconds: config.controls.whatsNewAutoDismissMs / 1000,
          buttonStyle: "both",
          shortcutHints: true,
          shortcutHintModifier: config.controls.shortcutHintModifier,
          developerMode: false
        },
        hints: {
          enabled: config.features.hints && config.controls.hintsEnabledByDefault,
          dismissed: []
        },
        installation: {
          iconVariant: "auto"
        }
      },
      ui: {
        activeModule: "money",
        search: "",
        ledgerYear: "",
        ledgerSearch: "",
        ledgerCategories: [],
        dismissedHints: [],
        seenReleaseVersion: "",
        supportTab: "settings"
      },
      modules: {
        documents: { enabled: config.features.documents },
        roadmap: { search: "", state: "all", priority: "all", target: "all", effort: "all", sortBy: "priority", sortDirection: "asc" },
        cloudSync: {
          enabled: config.features.cloudSync,
          owner: CLOUD_TARGET.owner,
          repo: CLOUD_TARGET.repo,
          branch: CLOUD_TARGET.branch,
          path: CLOUD_TARGET.path,
          rememberToken: true,
          autoSync: false,
          baselineData: null,
          advancedOpen: false,
          baselineTarget: "",
          baselineSha: "",
          baselineHash: "",
          lastSyncedAt: "",
          lastCheckedAt: ""
        }
      }
    };
  }

  function normalizeDocument(input, index, usedIds, now) {
    const source = u.plainObject(input);
    let id = u.cleanLine(source.id, 100).replace(/[^a-z0-9_-]/gi, "-");
    if (!id || usedIds.has(id)) id = u.uid("document");
    usedIds.add(id);
    const createdAt = u.ensureIso(source.createdAt, now);
    return {
      id: id,
      title: u.cleanLine(source.title || source.name || "Untitled note", 140) || "Untitled note",
      html: u.sanitizeRichHtml(source.html || source.content || source.text || ""),
      order: Number.isFinite(Number(source.order)) ? Math.round(Number(source.order)) : index,
      createdAt: createdAt,
      updatedAt: u.ensureIso(source.updatedAt, createdAt)
    };
  }

  function consolidateDocuments(documents, now) {
    const note = documents[0];
    if (!note) return blankNotes(now);
    const text = u.richTextToPlainText(note.html, config.controls.maxDocumentHtmlLength);
    return [{ id: "app-notes", title: "Notes", html: u.escapeHtml(text).replace(/\n/g, "<br>"), order: 0, createdAt: note.createdAt, updatedAt: note.updatedAt }];
  }

  function normalize(input) {
    const source = u.plainObject(input);
    const base = createDefaultState({ demo: false });
    const now = u.isoNow();
    const sourceMeta = u.plainObject(source.meta);
    const sourceWorkspace = u.plainObject(source.workspace);
    const sourcePreferences = u.plainObject(source.preferences);
    const sourceAppearance = u.plainObject(sourcePreferences.appearance);
    const sourceControls = u.plainObject(sourcePreferences.controls);
    const sourceHints = u.plainObject(sourcePreferences.hints);
    const sourceInstallation = u.plainObject(sourcePreferences.installation);
    const sourceUi = u.plainObject(source.ui);
    const sourceModules = u.plainObject(source.modules);
    const sourceRoadmap = u.plainObject(sourceModules.roadmap);
    const sourceCloud = u.plainObject(sourceModules.cloudSync);
    const theme = defaultTheme();
    const normalizedDocumentIds = new Set();
    const normalizedDocuments = (Array.isArray(sourceWorkspace.documents) ? sourceWorkspace.documents : []).slice(0, 1).map(function (document, index) {
      return normalizeDocument(document, index, normalizedDocumentIds, now);
    });
    const documents = consolidateDocuments(normalizedDocuments, now);
    const documentIds = new Set(documents.map(function (documentItem) { return documentItem.id; }));
    const mode = ["system", "light", "dark"].includes(sourceAppearance.mode) ? sourceAppearance.mode : "system";
    const activeCandidates = MODULE_IDS.filter(function (id) { return id !== "roadmap" || config.features.roadmap; });
    const activeModule = activeCandidates.includes(sourceUi.activeModule) ? sourceUi.activeModule : (activeCandidates[0] || "");
    const state = {
      schemaVersion: config.schemaVersion,
      meta: {
        appVersion: config.identity.version,
        buildId: config.identity.buildId,
        createdAt: u.ensureIso(sourceMeta.createdAt, now),
        updatedAt: u.ensureIso(sourceMeta.updatedAt, now),
        lastMutationId: u.cleanLine(sourceMeta.lastMutationId, 100) || u.uid("mutation"),
      },
      workspace: {
        title: u.cleanLine(sourceWorkspace.title || base.workspace.title, 100) || base.workspace.title,
        documents: documents,
        tokenLabels: tokenLabels(sourceWorkspace.tokenLabels),
        ...App.ledger.collections(sourceWorkspace)
      },
      preferences: {
        person: ["Adam", "Tristen"].includes(sourcePreferences.person) ? sourcePreferences.person : "",
        ledgerLayouts: Object.fromEntries(["Adam", "Tristen", "default"].filter(name => ["compact", "expanded"].includes(sourcePreferences.ledgerLayouts?.[name])).map(name => [name, sourcePreferences.ledgerLayouts[name]])),
        appearance: {
          mode: mode,
          accent: u.normalizeColor(sourceAppearance.accent, theme.accent),
          accent2: u.normalizeColor(sourceAppearance.accent2, theme.accent2),
          success: u.normalizeColor(sourceAppearance.success, theme.success),
          warning: u.normalizeColor(sourceAppearance.warning, theme.warning),
          danger: u.normalizeColor(sourceAppearance.danger, theme.danger),
          textScale: u.clamp(sourceAppearance.textScale, 0.85, 1.3, u.clamp(sourceAppearance.readingScale, 0.85, 1.3, 1))
        },
        controls: {
          whatsNewDismissSeconds: Math.round(u.clamp(sourceControls.whatsNewDismissSeconds, 1, 300, config.controls.whatsNewAutoDismissMs / 1000)),
          buttonStyle: ["icons", "text", "both"].includes(sourceControls.buttonStyle) ? sourceControls.buttonStyle : "both",
          shortcutHints: sourceControls.shortcutHints !== false,
          shortcutHintModifier: sourceControls.shortcutHintModifier === "ShiftControlOption" ? sourceControls.shortcutHintModifier : config.controls.shortcutHintModifier,
          developerMode: sourceControls.developerMode === true
        },
        hints: {
          enabled: config.features.hints && (typeof sourceHints.enabled === "boolean" ? sourceHints.enabled : config.controls.hintsEnabledByDefault),
          dismissed: Array.from(new Set((Array.isArray(sourceHints.dismissed) ? sourceHints.dismissed : []).map(function (id) { return u.cleanLine(id, 80); }).filter(Boolean))).slice(0, 200)
        },
        installation: {
          iconVariant: ["auto", "light", "dark"].includes(sourceInstallation.iconVariant) ? sourceInstallation.iconVariant : "auto"
        }
      },
      ui: {
        activeModule: activeModule,
        search: u.cleanLine(sourceUi.search, 200),
        ledgerYear: /^\d{4}$/.test(sourceUi.ledgerYear) ? sourceUi.ledgerYear : "",
        ledgerSearch: u.cleanLine(sourceUi.ledgerSearch, 200),
        ledgerCategories: Array.isArray(sourceUi.ledgerCategories) ? [...new Set(sourceUi.ledgerCategories.map(category => category === "Golf" ? "Rounds" : category).filter(category => ["Rounds", "Bets", "Food", "Other"].includes(category)))] : [],
        dismissedHints: Array.from(new Set((Array.isArray(sourceUi.dismissedHints) ? sourceUi.dismissedHints : []).map(function (id) { return u.cleanLine(id, 80); }).filter(Boolean))).slice(0, 200),
        seenReleaseVersion: u.cleanLine(sourceUi.seenReleaseVersion, 32),
        supportTab: ["settings", "dataSync", "info", "help", "releases", "shortcuts", "roadmap", "developer"].includes(sourceUi.supportTab) ? sourceUi.supportTab : "settings"
      },
      modules: {
        documents: { enabled: config.features.documents && u.plainObject(sourceModules.documents).enabled !== false },
        roadmap: {
          search: u.cleanLine(sourceRoadmap.search, 200),
          state: ["all", "released", "planned", "wishlist"].includes(sourceRoadmap.state) ? sourceRoadmap.state : "all",
          priority: ["all", "1", "2", "3"].includes(String(sourceRoadmap.priority)) ? String(sourceRoadmap.priority) : "all",
          target: sourceRoadmap.target ? u.cleanLine(sourceRoadmap.target, 80) : "all",
          effort: ["all", "1", "2", "3", "4"].includes(String(sourceRoadmap.effort)) ? String(sourceRoadmap.effort) : "all",
          sortBy: ["priority", "target", "effort", "age", "title"].includes(sourceRoadmap.sortBy) ? sourceRoadmap.sortBy : "priority",
          sortDirection: sourceRoadmap.sortDirection === "desc" ? "desc" : "asc"
        },
        cloudSync: {
          enabled: config.features.cloudSync && sourceCloud.enabled !== false,
          owner: CLOUD_TARGET.owner,
          repo: CLOUD_TARGET.repo,
          branch: CLOUD_TARGET.branch,
          path: CLOUD_TARGET.path,
          rememberToken: sourceCloud.rememberToken !== false,
          autoSync: sourceCloud.autoSync === true,
          baselineData: sourceCloud.baselineData ? normalizeData(sourceCloud.baselineData) : null,
          advancedOpen: sourceCloud.advancedOpen === true,
          baselineTarget: u.cleanLine(sourceCloud.baselineTarget, 800),
          baselineSha: u.cleanLine(sourceCloud.baselineSha, 100),
          baselineHash: u.cleanLine(sourceCloud.baselineHash, 100),
          lastSyncedAt: sourceCloud.lastSyncedAt ? u.ensureIso(sourceCloud.lastSyncedAt, "") : "",
          lastCheckedAt: sourceCloud.lastCheckedAt ? u.ensureIso(sourceCloud.lastCheckedAt, "") : ""
        }
      }
    };
    return state;
  }

  function validate(state) {
    const errors = [];
    const warnings = [];
    if (!state || typeof state !== "object") errors.push("The root value must be an object.");
    if (state.schemaVersion !== config.schemaVersion) errors.push("The state-model version is not supported.");
    if (!state.workspace || !Array.isArray(state.workspace.documents) || state.workspace.documents.length !== 1) errors.push("Notes are missing.");
    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  function prepare(input) {
    if (input && ("syncFormat" in Object(input) || "syncVersion" in Object(input))) return prepareSync(input);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The backup must be a JSON object.");
    const source = input.exportFormat === "local-first-workspace-backup" ? input.state : input;
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("The backup state is invalid.");
    if (Object.keys(source).length && (![4, 5, config.schemaVersion].includes(source.schemaVersion) || !source.workspace || !Array.isArray(source.workspace.documents) || source.workspace.documents.length !== 1)) throw new Error("This backup is not a supported T&A workspace.");
    const migration = { state: source, applied: source.schemaVersion < config.schemaVersion ? [source.schemaVersion + "→" + config.schemaVersion] : [] };
    const state = normalize(migration.state);
    const validation = validate(state);
    if (!validation.ok) throw new Error(validation.errors.join(" "));
    return { state: state, migrations: migration.applied, validation: validation };
  }

  function touch(state) {
    state.meta.appVersion = config.identity.version;
    state.meta.buildId = config.identity.buildId;
    state.meta.updatedAt = u.isoNow();
    state.meta.lastMutationId = u.uid("mutation");
    return state;
  }

  function resetPreferences(state) {
    const defaults = createDefaultState({ demo: false });
    const next = u.clone(state);
    next.preferences = defaults.preferences;
    next.ui.search = "";
    next.ui.dismissedHints = [];
    next.ui.supportTab = "settings";
    next.modules.roadmap = defaults.modules.roadmap;
    next.modules.cloudSync.advancedOpen = false;
    return normalize(touch(next));
  }

  function exportEnvelope(state) {
    return {
      exportFormat: "local-first-workspace-backup",
      exportedAt: u.isoNow(),
      application: {
        name: config.identity.name,
        version: config.identity.version,
        buildId: config.identity.buildId
      },
      schemaVersion: config.schemaVersion,
      state: normalize(u.clone(state))
    };
  }

  // Cloud data is a complete content snapshot. Empty collections are omitted;
  // their absence still clears that content when a snapshot is downloaded.
  function tokenLabels(input) {
    if (input && input.Tristan && !input.Tristen) { input = { ...input, Tristen: input.Tristan }; delete input.Tristan; }
    if (input === undefined) return {};
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !["Adam", "Tristen"].includes(key))) throw new Error("Token labels are invalid.");
    const result = {};
    for (const name of ["Adam", "Tristen"]) if (input[name] !== undefined) {
      if (typeof input[name] !== "string" || !/^[a-f0-9]{64}$/.test(input[name])) throw new Error("Token labels must contain fingerprints, never tokens.");
      result[name] = input[name];
    }
    if (Object.keys(result).length && (!result.Adam || !result.Tristen || result.Adam === result.Tristen)) throw new Error("Assign two different tokens, one to each person.");
    return result;
  }

  function normalizeData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(key => !["notes", "moneyEntries", "golfRounds", "tokenLabels"].includes(key))) throw new Error("The cloud file contains invalid or unsupported content.");
    if ("notes" in data && (typeof data.notes !== "string" || data.notes.length > config.controls.maxDocumentHtmlLength)) throw new Error("Notes are invalid or too long.");
    const result = App.ledger.collections(data);
    const labels = tokenLabels(data.tokenLabels);
    if (labels.Adam) result.tokenLabels = labels;
    result.moneyEntries.sort((a, b) => a.id.localeCompare(b.id));
    result.golfRounds.sort((a, b) => a.id.localeCompare(b.id));
    if (data.notes) result.notes = data.notes;
    return result;
  }

  function syncPayload(state) {
    const normalized = normalize(state);
    const data = {};
    if (normalized.workspace.tokenLabels.Adam) data.tokenLabels = normalized.workspace.tokenLabels;
    const notes = u.richTextToPlainText(normalized.workspace.documents[0].html, config.controls.maxDocumentHtmlLength);
    if (notes) data.notes = notes;
    for (const key of ["moneyEntries", "golfRounds"]) if (normalized.workspace[key].length) data[key] = normalized.workspace[key].slice().sort((a, b) => a.id.localeCompare(b.id));
    return { syncFormat: SYNC_FORMAT, syncVersion: SYNC_VERSION, schemaVersion: SYNC_SCHEMA_VERSION, data: data };
  }

  function syncHash(state) { return "data-v2:" + u.fingerprint(syncPayload(state)); }

  function fromData(data) {
    const checked = normalizeData(data);
    return normalize({ workspace: { ...checked, documents: [{ id: "app-notes", title: "Notes", html: u.escapeHtml(checked.notes || "").replace(/\n/g, "<br>") }] } });
  }

  function prepareSync(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The GitHub data must be a JSON object.");
    if (!("syncFormat" in input) && !("syncVersion" in input)) {
      const prepared = prepare(input);
      if (!input.schemaVersion || input.schemaVersion === 4) prepared.state.legacyNotesOnly = true;
      return Object.assign({}, prepared, { legacy: true });
    }
    const legacy = input.syncVersion === 1 && input.schemaVersion === 5;
    if (input.syncFormat !== SYNC_FORMAT || (!legacy && (input.syncVersion !== SYNC_VERSION || ![6, SYNC_SCHEMA_VERSION].includes(input.schemaVersion)))) throw new Error("This cloud data format is not supported. Update the app before syncing.");
    if (legacy && Object.keys(input.data || {}).some(key => key !== "notes")) throw new Error("The old Notes file contains unsupported content.");
    const state = fromData(input.data);
    if (legacy) state.legacyNotesOnly = true;
    return { state, legacy, migrations: [], validation: validate(state) };
  }

  function applySync(localState, remoteState) {
    const next = normalize(localState), remote = normalize(remoteState);
    next.workspace.documents = remote.workspace.documents;
    next.workspace.tokenLabels = remoteState.legacyNotesOnly ? next.workspace.tokenLabels : remote.workspace.tokenLabels;
    if (!remoteState.legacyNotesOnly) for (const key of ["moneyEntries", "golfRounds"]) next.workspace[key] = remote.workspace[key];
    return normalize(touch(next));
  }

  function mergeResult(localState, remoteState, resolutions, baseOverride) {
    const base = baseOverride === undefined ? localState.modules.cloudSync.baselineData : baseOverride;
    const local = syncPayload(localState).data, remote = syncPayload(remoteState).data;
    if (remoteState.legacyNotesOnly) { remote.moneyEntries = local.moneyEntries; remote.golfRounds = local.golfRounds; remote.tokenLabels = local.tokenLabels; }
    return App.ledger.mergeData(local, remote, base, resolutions);
  }
  function canMerge(localState, remoteState) { return !mergeResult(localState, remoteState).conflicts.length; }
  function merge(localState, remoteState, resolutions, baseOverride) {
    const result = mergeResult(localState, remoteState, resolutions, baseOverride);
    if (result.conflicts.length) throw Object.assign(new Error(result.conflicts.some(x => x.key === "notes") ? "Notes differ. Review both versions." : "Entries differ. Review the conflicting changes."), { conflicts: result.conflicts });
    return applySync(localState, fromData(result.data));
  }

  App.stateModel = {
    migrations: { 4: "Preserve Notes and add Money/Golf collections" },
    mergeResult: mergeResult,
    fromData: fromData,
    createDefaultState: createDefaultState,
    normalize: normalize,
    validate: validate,
    prepare: prepare,
    touch: touch,
    resetPreferences: resetPreferences,
    exportEnvelope: exportEnvelope,
    syncPayload: syncPayload,
    syncHash: syncHash,
    prepareSync: prepareSync,
    applySync: applySync,
    canMerge: canMerge,
    merge: merge
  };
})();
