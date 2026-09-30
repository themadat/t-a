(function () {
  "use strict";
  const App = window.LocalApp, storage = App.storage;
  let credential = "", fingerprintValue = "", sequence = 0, busy = false;
  let tokenRequired = false, connectingAtStartup = false;
  async function fingerprint(token) {
    const clean = String(token || "").trim();
    if (!clean || clean.length > 500 || /\s/.test(clean)) throw new Error("Enter a valid token without spaces.");
    if (!globalThis.crypto?.subtle) throw new Error("Token setup requires HTTPS or localhost.");
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("t-a:token-identity:v1:" + clean));
    return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
  }
  function personIn(state, hash) {
    return ["Adam", "Tristen"].find(name => state.workspace.tokenLabels?.[name] === hash) || "";
  }
  function person() {
    return credential && credential === storage.getSecret() ? personIn(storage.getState(), fingerprintValue) : "";
  }
  function emit() { window.dispatchEvent(new CustomEvent("app:identitychange")); }
  async function refresh() {
    const token = storage.getSecret();
    if (token === credential && fingerprintValue) { emit(); return; }
    const request = ++sequence;
    credential = ""; fingerprintValue = ""; emit();
    if (!token) return;
    try {
      const hash = await fingerprint(token);
      if (request !== sequence || token !== storage.getSecret()) return;
      credential = token; fingerprintValue = hash; emit();
    } catch (error) { /* Missing crypto leaves editing locked; Connect reports the error. */ }
  }
  function canInitializeFrom(remote) {
    const data = App.stateModel.syncPayload(storage.getState()).data;
    return Boolean(personIn(remote, fingerprintValue) && !data.notes && !data.moneyEntries?.length && !data.golfRounds?.length);
  }
  async function connect(input) {
    if (busy || App.sync.getInfo().busy) throw new Error("Wait for the current connection to finish.");
    busy = true; render();
    try {
      const token = String(input.token || storage.getSecret()).trim(), hash = await fingerprint(token);
      const remote = await App.sync.inspectToken(token);
      const name = personIn(remote || storage.getState(), hash);
      if (!name) throw new Error("This token has no shared name yet. Adam needs to label both tokens and sync the setup first.");
      App.sync.saveConfiguration({ ...storage.getState().modules.cloudSync, ...input, token });
      await refresh();
      const synced = await App.sync.syncNow();
      if (!synced) throw new Error("Token saved, but connection setup still needs a successful Sync Now. Your existing entries are preserved.");
      if (person() !== name) throw new Error("The token labels changed during connection. Connect again to use the latest labels.");
      storage.mutate(state => { state.modules.cloudSync.autoSync = true; }, { reason: "sync-auto", touch: false });
      storage.saveNow(); emit(); return name;
    } finally { busy = false; render(); }
  }
  async function associate(adamToken, tristanToken, rememberToken) {
    if (busy || App.sync.getInfo().busy) throw new Error("Wait for the current connection to finish.");
    if (storage.getState().workspace.tokenLabels.Adam && person() !== "Adam") throw new Error("Connect Adam’s token to change the labels.");
    busy = true; render();
    try {
      const [Adam, Tristen] = await Promise.all([fingerprint(adamToken), fingerprint(tristanToken)]);
      if (Adam === Tristen) throw new Error("Use two different tokens, one for Adam and one for Tristen.");
      if (!storage.saveRecovery("Before assigning token names")) throw new Error("A recovery copy could not be saved. No labels were changed.");
      // Only Adam's credential is retained on the setup device. Tristen's token is never persisted.
      App.sync.saveConfiguration({ ...storage.getState().modules.cloudSync, token: String(adamToken).trim(), rememberToken });
      storage.mutate(state => { state.workspace.tokenLabels = { Adam, Tristen }; }, { reason: "token-labels" });
      await refresh();
      if (!storage.saveNow()) throw new Error("Labels could not be saved. Resolve local storage before sharing the setup.");
      return { Adam, Tristen };
    } finally { busy = false; render(); }
  }
  function render() {
    const status = document.querySelector("#tokenIdentityStatus"), setup = document.querySelector("#tokenOwnerSetup");
    if (!status || !setup) return;
    const labels = storage.getState().workspace.tokenLabels, name = person();
    status.textContent = name ? "Connected as " + name : labels.Adam ? "Enter your assigned token to connect." : "Adam must label both tokens once before shared use.";
    setup.hidden = Boolean(labels.Adam && name !== "Adam");
    document.querySelector("#saveTokenLabels").disabled = busy || App.sync.getInfo().busy;
    document.querySelector("#saveSyncButton").disabled = busy || App.sync.getInfo().busy;
  }
  function updateTokenGate() {
    const dialog = document.querySelector("#tokenDialog");
    if (!dialog) return;
    if (!storage.getSecret()) tokenRequired = true;
    document.body.classList.toggle("token-required", tokenRequired);
    if (tokenRequired && !dialog.open) App.components.openDialog(dialog, { focus: "#startupToken" });
    else if (!tokenRequired && dialog.open) App.components.closeDialog(dialog);
  }
  function initTokenGate() {
    const form = document.querySelector("#tokenForm"), dialog = document.querySelector("#tokenDialog");
    if (!form || !dialog) return;
    tokenRequired = !storage.getSecret();
    dialog.addEventListener("cancel", event => event.preventDefault());
    window.addEventListener("app:identitychange", updateTokenGate);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (connectingAtStartup) return;
      const input = document.querySelector("#startupToken"), button = document.querySelector("#startupTokenSave"), status = document.querySelector("#startupTokenStatus");
      connectingAtStartup = true; button.disabled = true; input.readOnly = true;
      form.setAttribute("aria-busy", "true"); status.textContent = "Connecting and loading the latest entries…";
      try {
        await connect({ ...storage.getState().modules.cloudSync, token: input.value, rememberToken: document.querySelector("#startupRememberToken").checked });
        input.value = ""; tokenRequired = false; updateTokenGate();
      } catch (error) {
        status.textContent = error.message || "Could not load your ledger. Check your token and try again.";
      } finally {
        connectingAtStartup = false; button.disabled = false; input.readOnly = false; form.removeAttribute("aria-busy");
      }
    });
    updateTokenGate();
  }
  function init() {
    window.addEventListener("app:statechange", refresh);
    window.addEventListener("app:identitychange", render);
    window.addEventListener("app:syncchange", render);
    window.addEventListener("storage", refresh);
    document.querySelector("#saveTokenLabels").addEventListener("click", async () => {
      const adam = document.querySelector("#adamSetupToken"), tristan = document.querySelector("#tristanSetupToken"), status = document.querySelector("#tokenSetupStatus");
      let operation;
      try {
        operation = associate(adam.value, tristan.value, document.querySelector("#syncRememberToken").checked);
        adam.value = ""; tristan.value = "";
        await operation;
        status.textContent = "Labels saved locally. Publishing the setup…";
        const synced = await App.sync.syncNow();
        if (synced) { storage.mutate(state => { state.modules.cloudSync.autoSync = true; }, { reason: "sync-auto", touch: false }); storage.saveNow(); }
        status.textContent = synced ? "Both labels are shared. Tristen can now enter his token and press Connect." : "Labels are saved here but are not shared yet. Complete Sync Now before giving Tristen the app.";
      } catch (error) { status.textContent = error.message; }
    });
    initTokenGate(); refresh();
  }
  App.identity = { fingerprint, person, refresh, connect, associate, canInitializeFrom, init };
})();
