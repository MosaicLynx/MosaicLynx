import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { deriveSharedAccount, generateMnemonic } from "@mosaic-lynx/chain-symbol";
import {
  encryptVault,
  loadStore,
  saveStore,
  type ExtensionStore,
  type PublicAccount,
  type PublicProfile,
} from "../vault.js";
import { MAINNET_SIGNING_ENABLED } from "../release-capabilities.js";
import "./styles.css";

type CreateMode = "new" | "import";

const normalizeMnemonic = (value: string): string => value.trim().toLowerCase().split(/\s+/).join(" ");

const App = () => {
  const [store, setStore] = useState<ExtensionStore>();
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<CreateMode>("new");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<"mainnet" | "testnet">("testnet");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [hint, setHint] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicConfirmation, setMnemonicConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void loadStore().then(setStore); }, []);

  const resetSecrets = (): void => {
    setPassword("");
    setConfirmation("");
    setMnemonic("");
    setMnemonicConfirmation("");
  };

  const validateCommon = (): void => {
    if (!name.trim()) throw new Error("Profile name is required.");
    if (password.length < 12) throw new Error("Password must contain at least 12 characters.");
    if (password !== confirmation) throw new Error("Password confirmation does not match.");
  };

  const prepareNew = (): void => {
    setError("");
    try {
      validateCommon();
      setMnemonic(generateMnemonic());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile could not be prepared.");
    }
  };

  const createProfile = async (): Promise<void> => {
    if (!store) return;
    setBusy(true);
    setError("");
    try {
      validateCommon();
      const normalized = normalizeMnemonic(mnemonic);
      if (!normalized) throw new Error("A 24-word mnemonic is required.");
      if (mode === "new" && normalizeMnemonic(mnemonicConfirmation) !== normalized)
        throw new Error("Confirm the mnemonic from your offline backup.");
      const profileId = crypto.randomUUID();
      const accountId = crypto.randomUUID();
      const material = deriveSharedAccount(network, normalized, 0);
      const now = new Date().toISOString();
      const account: PublicAccount = {
        id: accountId,
        profileId,
        name: "Account 1",
        identities: material.identities,
        source: {
          kind: "mnemonicDerived",
          secretRef: `vault:${profileId}:mnemonic:0`,
          accountIndex: 0,
          derivationPath: material.derivationPath,
        },
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const profile: PublicProfile = {
        id: profileId,
        name: name.trim(),
        network,
        accounts: [account],
        defaultAccountId: accountId,
        nextAccountIndex: 1,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        ...(hint.trim() ? { passwordHint: hint.trim() } : {}),
      };
      const vault = await encryptVault(profileId, password, { mnemonic: normalized, importedPrivateKeys: {} });
      const next: ExtensionStore = {
        ...store,
        profiles: [...store.profiles, profile],
        vaults: [...store.vaults, vault],
        settings: { ...store.settings, activeProfileId: profileId },
      };
      await saveStore(next);
      setStore(next);
      setCreating(false);
      setName("");
      setHint("");
      resetSecrets();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const updateSettings = async (settings: Partial<ExtensionStore["settings"]>): Promise<void> => {
    if (!store) return;
    const next = { ...store, settings: { ...store.settings, ...settings } };
    await saveStore(next);
    setStore(next);
  };

  if (!store) return <main className="app-shell"><p>Loading MosaicLynx…</p></main>;

  const profile = store.profiles.find((item) => item.id === store.settings.activeProfileId);
  const account = profile?.accounts.find((item) => item.id === profile.defaultAccountId);

  if (!profile || creating) {
    const showingGenerated = mode === "new" && Boolean(mnemonic);
    return (
      <main className="app-shell onboarding">
        <header><p className="eyebrow">SOFTWARE SIGNER</p><h1>MosaicLynx</h1></header>
        <section>
          <div className="tabs">
            <button className={mode === "new" ? "selected" : ""} onClick={() => { setMode("new"); setMnemonic(""); }}>New</button>
            <button className={mode === "import" ? "selected" : ""} onClick={() => { setMode("import"); setMnemonic(""); }}>Import</button>
          </div>
          <label className="field"><span>Profile name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Network</span><select value={network} onChange={(event) => setNetwork(event.target.value as typeof network)}><option value="testnet">Testnet</option><option value="mainnet">Mainnet</option></select></label>
          {network === "mainnet" && <p className="danger-panel">Mainnet can control assets with real value.</p>}
          {network === "mainnet" && !MAINNET_SIGNING_ENABLED && <p className="warning-panel">This development build keeps Mainnet signing disabled until the required release evidence is installed.</p>}
          <label className="field"><span>Password (12+ characters)</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label className="field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          <label className="field"><span>Password hint (public, optional)</span><input value={hint} onChange={(event) => setHint(event.target.value)} /></label>
        </section>

        {mode === "import" && (
          <section><label className="field"><span>24-word English mnemonic</span><textarea value={mnemonic} onChange={(event) => setMnemonic(event.target.value)} /></label></section>
        )}

        {showingGenerated && (
          <section className="secret-panel">
            <strong>Write this mnemonic to an offline backup</strong>
            <p>Do not copy it to Clipboard, cloud notes, chat, screenshots, or recordings.</p>
            <ol className="mnemonic">{mnemonic.split(" ").map((word, index) => <li key={`${word}-${index}`}>{word}</li>)}</ol>
            <label className="field"><span>Re-enter all words from your offline record</span><textarea value={mnemonicConfirmation} onChange={(event) => setMnemonicConfirmation(event.target.value)} /></label>
          </section>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <footer>
          {store.profiles.length > 0 && <button onClick={() => { setCreating(false); resetSecrets(); }}>Cancel</button>}
          {mode === "new" && !showingGenerated
            ? <button className="primary" onClick={prepareNew}>Generate mnemonic</button>
            : <button className="primary" disabled={busy} onClick={() => void createProfile()}>{busy ? "Encrypting…" : "Create profile"}</button>}
        </footer>
      </main>
    );
  }

  const scope = { chain: store.settings.activeChain, network: profile.network } as const;
  const connections = store.permissions.filter((grant) => grant.profileId === profile.id);
  return (
    <main className={`app-shell theme-${store.settings.theme}`}>
      <header>
        <p className="eyebrow">SOFTWARE SIGNER</p>
        <h1>MosaicLynx</h1>
        <span className="status locked">Locked between approvals</span>
        {profile.network === "testnet" && <span className="network-badge">TESTNET</span>}
      </header>
      <section>
        <p className="section-label">ACTIVE PROFILE</p>
        <select value={profile.id} onChange={(event) => void updateSettings({ activeProfileId: event.target.value })}>
          {store.profiles.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.network}</option>)}
        </select>
        <div className="account-card">
          <strong>{account?.name}</strong>
          <small>{scope.chain.toUpperCase()} · {scope.network}</small>
          <code>{account?.identities[scope.chain].address}</code>
          <code>{account?.identities[scope.chain].publicKey}</code>
        </div>
        <div className="tabs">
          <button className={scope.chain === "symbol" ? "selected" : ""} onClick={() => void updateSettings({ activeChain: "symbol" })}>Symbol</button>
          <button className={scope.chain === "nem" ? "selected" : ""} onClick={() => void updateSettings({ activeChain: "nem" })}>NEM</button>
        </div>
      </section>
      <section>
        <p className="section-label">CONNECTED DAPPS</p>
        {connections.length
          ? connections.map((grant) => <p className="connection" key={`${grant.origin}-${grant.chain}`}>{grant.origin}<small>{grant.chain} {grant.network} · {grant.accountIds.length} account(s)</small></p>)
          : <p className="empty-state">No active connections</p>}
      </section>
      <section className="assurance"><strong>Software Vault</strong><br />Secrets are password-encrypted, but this extension is not a hardware or cold wallet.</section>
      <footer>
        <button onClick={() => void updateSettings({ language: store.settings.language === "ja" ? "en" : "ja" })}>{store.settings.language.toUpperCase()}</button>
        <button onClick={() => setCreating(true)}>Add profile</button>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
