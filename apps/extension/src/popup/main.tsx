import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { deriveSharedAccount, generateMnemonic } from "@mosaic-lynx/chain-symbol";
import {
  decryptVault,
  encryptVault,
  loadStore,
  saveStore,
  type ExtensionStore,
  type PermissionGrant,
  type PublicAccount,
  type PublicProfile,
  type VaultContents,
} from "../vault.js";
import { MAINNET_SIGNING_ENABLED } from "../release-capabilities.js";
import { AppThemeProvider, setAppThemeMode } from "../ui/theme.js";
import "./i18n.js";
import "./styles.css";

type CreateMode = "new" | "import";
type OnboardingStep = "welcome" | "method" | "details" | "import" | "import-review" | "backup" | "confirm" | "complete";
type Language = ExtensionStore["settings"]["language"];
type HomeView = "home" | "menu" | "profiles" | "accounts" | "connections";
type ConfirmationAction =
  | { readonly kind: "account"; readonly name: string }
  | { readonly kind: "connection"; readonly grant: PermissionGrant };

const DEBUG_SKIP_BACKUP_CONFIRMATION = !MAINNET_SIGNING_ENABLED;

const normalizeMnemonic = (value: string): string => value.trim().toLowerCase().split(/\s+/).join(" ");

interface PasswordFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly revealLabel: string;
  readonly autoFocus?: boolean;
  readonly autoComplete?: "new-password" | "current-password";
}

const PasswordField = ({ label, value, onChange, revealLabel, autoFocus, autoComplete = "new-password" }: PasswordFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const reveal = (): void => setRevealed(true);
  const conceal = (): void => setRevealed(false);
  return (
    <TextField
      className="field mui-field"
      fullWidth
      label={label}
      autoFocus={autoFocus}
      type={revealed ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                type="button"
                aria-label={revealLabel}
                aria-pressed={revealed}
                onPointerDown={reveal}
                onPointerUp={conceal}
                onPointerCancel={conceal}
                onPointerLeave={conceal}
                onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") reveal(); }}
                onKeyUp={conceal}
                onBlur={conceal}
              >{revealed ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

const App = () => {
  const [store, setStore] = useState<ExtensionStore>();
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [mode, setMode] = useState<CreateMode>("new");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<"mainnet" | "testnet">("testnet");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [hint, setHint] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<readonly number[]>([]);
  const [importPreview, setImportPreview] = useState<ReturnType<typeof deriveSharedAccount>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [homeView, setHomeView] = useState<HomeView>("home");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [accountNameDraft, setAccountNameDraft] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>();
  const language = store?.settings.language ?? "en";
  const { t, i18n } = useTranslation();

  useEffect(() => { void loadStore().then(setStore); }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n, language]);

  useEffect(() => {
    if (store) setAppThemeMode(store.settings.theme);
  }, [store?.settings.theme]);

  const updateSettings = async (settings: Partial<ExtensionStore["settings"]>): Promise<void> => {
    if (!store) return;
    const next = { ...store, settings: { ...store.settings, ...settings } };
    await saveStore(next);
    setStore(next);
  };

  const resetForm = (): void => {
    setMode("new");
    setName("");
    setNetwork("testnet");
    setPassword("");
    setConfirmation("");
    setHint("");
    setMnemonic("");
    setSelectedWordIds([]);
    setImportPreview(undefined);
    setError("");
  };

  const cancelCreation = (): void => {
    resetForm();
    setCreating(false);
    setStep("method");
  };

  const validateDetails = (): void => {
    if (!name.trim()) throw new Error(t("requiredName"));
    if (password.length < 12) throw new Error(t("shortPassword"));
    if (password !== confirmation) throw new Error(t("mismatchPassword"));
  };

  const continueFromDetails = (): void => {
    setError("");
    try {
      validateDetails();
      if (mode === "new") {
        setMnemonic(generateMnemonic());
        setSelectedWordIds([]);
        setStep("backup");
      } else {
        setStep("import");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requiredName"));
    }
  };

  const reviewImport = (): void => {
    setError("");
    try {
      const normalized = normalizeMnemonic(mnemonic);
      if (normalized.split(" ").length !== 24) throw new Error(t("invalidMnemonic"));
      const material = deriveSharedAccount(network, normalized, 0);
      setMnemonic(normalized);
      setImportPreview(material);
      setStep("import-review");
    } catch {
      setError(t("invalidMnemonic"));
    }
  };

  const createProfile = async (skipBackupConfirmation = false): Promise<void> => {
    if (!store) return;
    setBusy(true);
    setError("");
    try {
      validateDetails();
      const normalized = normalizeMnemonic(mnemonic);
      if (normalized.split(" ").length !== 24) throw new Error(t("invalidMnemonic"));
      if (mode === "new" && !skipBackupConfirmation) {
        const confirmed = selectedWordIds.map((id) => normalized.split(" ")[id]).join(" ");
        if (confirmed !== normalized) throw new Error(t("wrongOrder"));
      }
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
        accounts: [...store.accounts, account],
        vaults: [...store.vaults, vault],
        settings: { ...store.settings, activeProfileId: profileId },
      };
      await saveStore(next);
      setStore(next);
      setPassword("");
      setConfirmation("");
      setMnemonic("");
      setSelectedWordIds([]);
      setImportPreview(undefined);
      setStep("complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("invalidMnemonic"));
    } finally {
      setBusy(false);
    }
  };

  const openView = (view: HomeView): void => {
    setHomeView(view);
    setError("");
    setNotice("");
    setShowAddAccount(false);
    setAccountPassword("");
    if (view === "profiles" && store) {
      const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
      setProfileNameDraft(active?.name ?? "");
    }
    if (view === "accounts" && store) {
      const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
      const activeAccount = store.accounts.find((item) => item.id === active?.defaultAccountId);
      setAccountNameDraft(activeAccount?.name ?? "");
    }
  };

  const selectProfile = async (profileId: string): Promise<void> => {
    if (!store) return;
    const selected = store.profiles.find((item) => item.id === profileId);
    setProfileNameDraft(selected?.name ?? "");
    await updateSettings({ activeProfileId: profileId });
  };

  const renameProfile = async (): Promise<void> => {
    if (!store) return;
    const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
    if (!active) return;
    setError("");
    setNotice("");
    if (!profileNameDraft.trim()) {
      setError(t("requiredName"));
      return;
    }
    const now = new Date().toISOString();
    const next: ExtensionStore = {
      ...store,
      profiles: store.profiles.map((item) => item.id === active.id
        ? { ...item, name: profileNameDraft.trim(), revision: item.revision + 1, updatedAt: now }
        : item),
    };
    await saveStore(next);
    setStore(next);
    setProfileNameDraft(profileNameDraft.trim());
    setNotice(t("renamed"));
  };

  const selectAccount = async (accountId: string): Promise<void> => {
    if (!store) return;
    const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
    const selected = store.accounts.find((item) => item.profileId === active?.id && item.id === accountId);
    setAccountNameDraft(selected?.name ?? "");
    if (!active || active.defaultAccountId === accountId) return;
    const now = new Date().toISOString();
    const next: ExtensionStore = {
      ...store,
      profiles: store.profiles.map((item) => item.id === active.id
        ? { ...item, defaultAccountId: accountId, revision: item.revision + 1, updatedAt: now }
        : item),
    };
    await saveStore(next);
    setStore(next);
  };

  const renameAccount = async (): Promise<void> => {
    if (!store) return;
    const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
    const activeAccount = store.accounts.find((item) => item.profileId === active?.id && item.id === active?.defaultAccountId);
    if (!activeAccount) return;
    setError("");
    setNotice("");
    if (!accountNameDraft.trim()) {
      setError(t("requiredAccountName"));
      return;
    }
    const now = new Date().toISOString();
    const next: ExtensionStore = {
      ...store,
      accounts: store.accounts.map((item) => item.id === activeAccount.id
        ? { ...item, name: accountNameDraft.trim(), revision: item.revision + 1, updatedAt: now }
        : item),
    };
    await saveStore(next);
    setStore(next);
    setAccountNameDraft(accountNameDraft.trim());
    setNotice(t("accountRenamed"));
  };

  const deleteAccount = async (): Promise<void> => {
    if (!store) return;
    const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
    const activeAccount = store.accounts.find((item) => item.profileId === active?.id && item.id === active?.defaultAccountId);
    const remainingAccounts = store.accounts.filter((item) => item.profileId === active?.id && item.id !== activeAccount?.id);
    if (!active || !activeAccount) return;
    setError("");
    setNotice("");
    if (!remainingAccounts.length) {
      setError(t("lastAccountCannotBeDeleted"));
      return;
    }
    const now = new Date().toISOString();
    const permissions = store.permissions
      .map((grant) => grant.profileId === active.id && grant.accountIds.includes(activeAccount.id)
        ? { ...grant, accountIds: grant.accountIds.filter((id) => id !== activeAccount.id), revision: grant.revision + 1, updatedAt: now }
        : grant)
      .filter((grant) => grant.accountIds.length > 0);
    const nextDefaultAccount = remainingAccounts[0]!;
    const next: ExtensionStore = {
      ...store,
      accounts: store.accounts.filter((item) => item.id !== activeAccount.id),
      profiles: store.profiles.map((item) => item.id === active.id
        ? { ...item, defaultAccountId: nextDefaultAccount.id, revision: item.revision + 1, updatedAt: now }
        : item),
      permissions,
      usedMessageNonces: store.usedMessageNonces.filter((entry) => entry.accountId !== activeAccount.id),
    };
    await saveStore(next);
    setStore(next);
    setAccountNameDraft(nextDefaultAccount.name);
    setNotice(t("accountDeleted"));
  };

  const deleteConnection = async (grant: PermissionGrant): Promise<void> => {
    if (!store) return;
    const next: ExtensionStore = {
      ...store,
      permissions: store.permissions.filter((item) => !(item.origin === grant.origin
        && item.profileId === grant.profileId && item.chain === grant.chain && item.network === grant.network)),
    };
    await saveStore(next);
    setStore(next);
    setNotice(t("connectionDeleted"));
  };

  const addDerivedAccount = async (): Promise<void> => {
    if (!store) return;
    const active = store.profiles.find((item) => item.id === store.settings.activeProfileId);
    const envelope = store.vaults.find((item) => item.profileId === active?.id);
    if (!active || !envelope) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!accountNameDraft.trim()) throw new Error(t("requiredAccountName"));
      let contents: VaultContents;
      try {
        contents = await decryptVault(envelope, accountPassword);
      } catch {
        throw new Error(t("unlockFailed"));
      }
      if (!contents.mnemonic) throw new Error(t("mnemonicUnavailable"));
      const material = deriveSharedAccount(active.network, contents.mnemonic, active.nextAccountIndex);
      const accountId = crypto.randomUUID();
      const now = new Date().toISOString();
      const newAccount: PublicAccount = {
        id: accountId,
        profileId: active.id,
        name: accountNameDraft.trim(),
        identities: material.identities,
        source: {
          kind: "mnemonicDerived",
          secretRef: `vault:${active.id}:mnemonic:${active.nextAccountIndex}`,
          accountIndex: active.nextAccountIndex,
          derivationPath: material.derivationPath,
        },
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const next: ExtensionStore = {
        ...store,
        accounts: [...store.accounts, newAccount],
        profiles: store.profiles.map((item) => item.id === active.id
          ? {
            ...item,
            defaultAccountId: accountId,
            nextAccountIndex: item.nextAccountIndex + 1,
            revision: item.revision + 1,
            updatedAt: now,
          }
          : item),
      };
      await saveStore(next);
      setStore(next);
      setAccountNameDraft(newAccount.name);
      setAccountPassword("");
      setShowAddAccount(false);
      setNotice(t("accountAdded"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("mnemonicUnavailable"));
    } finally {
      setBusy(false);
    }
  };

  const candidates = useMemo(() => normalizeMnemonic(mnemonic).split(" ")
    .map((word, id) => ({ id, word }))
    .filter(({ word }) => Boolean(word))
    .sort((a, b) => a.word.localeCompare(b.word) || a.id - b.id), [mnemonic]);

  if (!store) return <main className="app-shell"><p>{t("loading")}</p></main>;

  const profile = store.profiles.find((item) => item.id === store.settings.activeProfileId);
  const account = store.accounts.find((item) => item.profileId === profile?.id && item.id === profile.defaultAccountId);
  const isFirstProfile = store.profiles.length === 0;

  if (!profile || creating) {
    const flowStep = mode === "new"
      ? ({ method: 1, details: 2, backup: 3, confirm: 4 } as Partial<Record<OnboardingStep, number>>)[step]
      : ({ method: 1, details: 2, import: 3, "import-review": 4 } as Partial<Record<OnboardingStep, number>>)[step];
    const header = (title: string, body: string) => (
      <header className="flow-header">
        <div className="brand-row"><h1>MosaicLynx</h1>{flowStep && <span className="step-count">{flowStep} / 4</span>}</div>
        {flowStep && <LinearProgress className="flow-progress" variant="determinate" value={(flowStep / 4) * 100} />}
        <h2>{title}</h2>
        <p>{body}</p>
      </header>
    );
    const backButton = (onClick: () => void) => <Button variant="outlined" color="inherit" type="button" onClick={onClick}>{t("back")}</Button>;

    return (
      <main className="app-shell onboarding">
        {step === "welcome" && isFirstProfile && (
          <>
            <div className="welcome-mark" aria-hidden="true">M</div>
            {header(t("welcomeTitle"), t("welcomeBody"))}
            <section className="welcome-settings">
              <label className="field compact-field"><span>{t("language")}</span>
                <select value={language} onChange={(event) => void updateSettings({ language: event.target.value as Language })}>
                  <option value="ja">日本語</option><option value="en">English</option>
                </select>
              </label>
              <p className="assurance">{t("welcomeNote")}</p>
            </section>
            <footer><button className="primary wide" onClick={() => setStep("method")}>{t("start")}</button></footer>
          </>
        )}

        {step === "method" && (
          <>
            {header(t("methodTitle"), t("methodBody"))}
            <section className="method-list">
              <button className="method-card" onClick={() => { setMode("new"); setError(""); setStep("details"); }}>
                <strong>{t("newTitle")}</strong><span>{t("newBody")}</span><b aria-hidden="true">→</b>
              </button>
              <button className="method-card" onClick={() => { setMode("import"); setError(""); setStep("details"); }}>
                <strong>{t("importTitle")}</strong><span>{t("importBody")}</span><b aria-hidden="true">→</b>
              </button>
            </section>
            <footer>
              {isFirstProfile ? backButton(() => setStep("welcome")) : <button onClick={cancelCreation}>{t("cancel")}</button>}
            </footer>
          </>
        )}

        {step === "details" && (
          <>
            {header(t("detailsTitle"), t("detailsBody"))}
            <section className="form-grid">
              <label className="field"><span>{t("profileName")}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="field"><span>{t("network")}</span><select value={network} onChange={(event) => setNetwork(event.target.value as typeof network)}><option value="testnet">Testnet</option><option value="mainnet">Mainnet</option></select></label>
              {network === "mainnet" && <p className="danger-panel inline-panel">{t("mainnetDanger")}</p>}
              {network === "mainnet" && !MAINNET_SIGNING_ENABLED && <p className="warning-panel inline-panel">{t("mainnetDisabled")}</p>}
              <PasswordField label={t("password")} value={password} onChange={setPassword} revealLabel={t("revealPassword")} />
              <PasswordField label={t("confirmPassword")} value={confirmation} onChange={setConfirmation} revealLabel={t("revealPassword")} />
              <label className="field full-field"><span>{t("hint")}</span><input value={hint} onChange={(event) => setHint(event.target.value)} /><small>{t("hintHelp")}</small></label>
            </section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <footer>{backButton(() => { setError(""); setStep("method"); })}<button className="primary" onClick={continueFromDetails}>{t("next")}</button></footer>
          </>
        )}

        {step === "import" && (
          <>
            {header(t("importInputTitle"), t("importInputBody"))}
            <section><label className="field"><span>{t("mnemonic")}</span><textarea className="mnemonic-input" autoFocus value={mnemonic} onChange={(event) => setMnemonic(event.target.value)} spellCheck={false} /></label></section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <footer>{backButton(() => { setError(""); setStep("details"); })}<button className="primary" onClick={reviewImport}>{t("next")}</button></footer>
          </>
        )}

        {step === "import-review" && importPreview && (
          <>
            {header(t("importReviewTitle"), t("importReviewBody"))}
            <section className="review-card">
              <strong>Account 1</strong>
              <span>Symbol</span><code>{importPreview.identities.symbol.address}</code>
              <span>NEM</span><code>{importPreview.identities.nem.address}</code>
            </section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <footer>{backButton(() => { setError(""); setStep("import"); })}<button className="primary" disabled={busy} onClick={() => void createProfile()}>{busy ? t("creating") : t("create")}</button></footer>
          </>
        )}

        {step === "backup" && (
          <>
            {header(t("backupTitle"), t("backupBody"))}
            <section className="secret-panel backup-panel">
              <ol className="mnemonic">{mnemonic.split(" ").map((word, index) => <li key={`${word}-${index}`}>{word}</li>)}</ol>
            </section>
            <p className="danger-note">{t("backupWarning")}</p>
            <footer>{backButton(() => { setMnemonic(""); setStep("details"); })}<button className="primary" onClick={() => setStep("confirm")}>{t("backedUp")}</button></footer>
          </>
        )}

        {step === "confirm" && (
          <>
            {header(t("confirmTitle"), t("confirmBody"))}
            <section className="word-confirmation">
              <div className="word-label"><span>{t("selectedWords")} ({selectedWordIds.length}/24)</span><span><button className="text-button" disabled={!selectedWordIds.length} onClick={() => setSelectedWordIds(selectedWordIds.slice(0, -1))}>{t("undo")}</button><button className="text-button" disabled={!selectedWordIds.length} onClick={() => setSelectedWordIds([])}>{t("clear")}</button></span></div>
              <ol className="selected-words">{selectedWordIds.map((id, index) => <li key={id}>{candidates.find((candidate) => candidate.id === id)?.word}<small>{index + 1}</small></li>)}</ol>
              <span className="candidate-label">{t("candidates")}</span>
              <div className="word-candidates">{candidates.map((candidate) => <button key={candidate.id} disabled={selectedWordIds.includes(candidate.id)} onClick={() => setSelectedWordIds([...selectedWordIds, candidate.id])}>{candidate.word}</button>)}</div>
            </section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <footer className="confirmation-footer">
              {backButton(() => { setError(""); setStep("backup"); })}
              {DEBUG_SKIP_BACKUP_CONFIRMATION && <button className="debug-button" disabled={busy} title={t("debugOnly")} onClick={() => void createProfile(true)}>{t("skipDebug")}</button>}
              <button className="primary" disabled={busy || selectedWordIds.length !== 24} onClick={() => void createProfile()}>{busy ? t("creating") : t("create")}</button>
            </footer>
          </>
        )}

        {step === "complete" && (
          <>
            <div className="welcome-mark complete-mark" aria-hidden="true">✓</div>
            {header(t("completeTitle"), t("completeBody"))}
            <footer><button className="primary wide" onClick={() => { resetForm(); setCreating(false); setStep("method"); setHomeView("home"); }}>{t("goHome")}</button></footer>
          </>
        )}
      </main>
    );
  }

  const scope = { chain: store.settings.activeChain, network: profile.network } as const;
  const connections = store.permissions.filter((grant) => grant.profileId === profile.id);
  const profileAccounts = store.accounts.filter((item) => item.profileId === profile.id);
  const confirmationDialog = (
    <Dialog
      open={Boolean(confirmationAction)}
      onClose={() => setConfirmationAction(undefined)}
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title">{t("confirmAction")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {confirmationAction?.kind === "account"
            ? t("confirmDeleteAccount", { name: confirmationAction.name })
            : confirmationAction?.kind === "connection"
              ? t("confirmDeleteConnection", { origin: confirmationAction.grant.origin })
              : ""}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmationAction(undefined)}>{t("cancel")}</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            const action = confirmationAction;
            setConfirmationAction(undefined);
            if (action?.kind === "account") void deleteAccount();
            if (action?.kind === "connection") void deleteConnection(action.grant);
          }}
        >
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
  const pageHeader = (title: string, backTo: HomeView = "menu") => (
    <header className="page-header">
      <button className="icon-button" type="button" aria-label={t("back")} onClick={() => openView(backTo)}>←</button>
      <h1>{title}</h1>
    </header>
  );

  if (homeView === "menu") {
    return (
      <main className={`app-shell management-shell theme-${store.settings.theme}`}>
        {pageHeader(t("menu"), "home")}
        <section className="menu-list">
          <button className="menu-item" onClick={() => openView("accounts")}><span><strong>{t("accountManagement")}</strong><small>{t("accountCount", { count: profileAccounts.length })}</small></span><b>›</b></button>
          <button className="menu-item" onClick={() => openView("profiles")}><span><strong>{t("profileManagement")}</strong><small>{t("profileCount", { count: store.profiles.length })}</small></span><b>›</b></button>
          <button className="menu-item" onClick={() => openView("connections")}><span><strong>{t("connectionManagement")}</strong><small>{connections.length || t("noConnections")}</small></span><b>›</b></button>
        </section>
        <section className="menu-settings">
          <p className="section-label">{t("settings").toUpperCase()}</p>
          <label className="setting-row"><span>{t("language")}</span><select value={language} onChange={(event) => void updateSettings({ language: event.target.value as Language })}><option value="ja">日本語</option><option value="en">English</option></select></label>
          <div className="setting-row"><span>{t("theme")}</span>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={store.settings.theme}
              onChange={(_, value: ExtensionStore["settings"]["theme"] | null) => { if (value) void updateSettings({ theme: value }); }}
              aria-label={t("theme")}
            >
              <ToggleButton value="light" aria-label={t("lightTheme")}><LightModeOutlined fontSize="small" /></ToggleButton>
              <ToggleButton value="dark" aria-label={t("darkTheme")}><DarkModeOutlined fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </div>
          <p className="assurance"><strong>{t("softwareVault")}</strong><br />{t("assurance")}</p>
        </section>
      </main>
    );
  }

  if (homeView === "profiles") {
    return (
      <main className={`app-shell management-shell theme-${store.settings.theme}`}>
        {pageHeader(t("profileManagement"))}
        <p className="page-description">{t("profileManagementBody")}</p>
        <section className="management-list">
          {store.profiles.map((item) => (
            <button className={item.id === profile.id ? "management-item active-item" : "management-item"} key={item.id} onClick={() => void selectProfile(item.id)}>
              <span><strong>{item.name}</strong><small>{item.network.toUpperCase()}</small></span>
              {item.id === profile.id && <b>{t("active")}</b>}
            </button>
          ))}
        </section>
        <section className="edit-panel">
          <label className="field"><span>{t("profileName")}</span><input value={profileNameDraft} onChange={(event) => setProfileNameDraft(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <button className="primary wide" onClick={() => void renameProfile()}>{t("rename")}</button>
        </section>
        <footer><button className="wide" onClick={() => { resetForm(); setCreating(true); setStep("method"); }}>{t("addProfile")}</button></footer>
      </main>
    );
  }

  if (homeView === "accounts") {
    return (
      <main className={`app-shell management-shell theme-${store.settings.theme}`}>
        {pageHeader(t("accountManagement"))}
        <p className="page-description">{t("accountManagementBody")}</p>
        <section className="management-list account-list">
          {profileAccounts.map((item) => (
            <button className={item.id === profile.defaultAccountId ? "management-item active-item" : "management-item"} key={item.id} onClick={() => void selectAccount(item.id)}>
              <span><strong>{item.name}</strong><small>{item.identities[scope.chain].address}</small></span>
              {item.id === profile.defaultAccountId && <b>{t("active")}</b>}
            </button>
          ))}
        </section>
        {showAddAccount ? (
          <section className="edit-panel add-account-panel">
            <p>{t("addAccountBody")}</p>
            <label className="field"><span>{t("accountName")}</span><input autoFocus value={accountNameDraft} onChange={(event) => setAccountNameDraft(event.target.value)} /></label>
            <PasswordField label={t("password")} value={accountPassword} onChange={setAccountPassword} revealLabel={t("revealPassword")} autoComplete="current-password" />
            {profile.passwordHint && <small className="password-hint">{t("hint")}: {profile.passwordHint}</small>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="button-row"><button onClick={() => { setShowAddAccount(false); setAccountNameDraft(account?.name ?? ""); setAccountPassword(""); setError(""); }}>{t("cancel")}</button><button className="primary" disabled={busy} onClick={() => void addDerivedAccount()}>{busy ? t("adding") : t("addAccount")}</button></div>
          </section>
        ) : (
          <section className="edit-panel account-edit-panel">
            <label className="field"><span>{t("accountName")}</span><input value={accountNameDraft} onChange={(event) => setAccountNameDraft(event.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            <div className="button-row"><button className="danger-button" onClick={() => account && setConfirmationAction({ kind: "account", name: account.name })}>{t("deleteAccount")}</button><button className="primary" onClick={() => void renameAccount()}>{t("rename")}</button></div>
          </section>
        )}
        {!showAddAccount && (
          <footer className="management-footer">
            <button className="primary wide" onClick={() => { setAccountNameDraft(`Account ${profile.nextAccountIndex + 1}`); setShowAddAccount(true); setNotice(""); }}>{t("addAccount")}</button>
          </footer>
        )}
        {confirmationDialog}
      </main>
    );
  }

  if (homeView === "connections") {
    return (
      <main className={`app-shell management-shell theme-${store.settings.theme}`}>
        {pageHeader(t("connectionManagement"))}
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <section className="connections-list">
          {connections.length
            ? connections.map((grant) => <div className="connection" key={`${grant.origin}-${grant.chain}`}><span>{grant.origin}<small>{grant.chain} {grant.network} · {t("connectedAccountCount", { count: grant.accountIds.length })}</small></span><button className="danger-button" onClick={() => setConfirmationAction({ kind: "connection", grant })}>{t("deleteConnection")}</button></div>)
            : <p className="empty-state">{t("noConnections")}</p>}
        </section>
        {confirmationDialog}
      </main>
    );
  }

  return (
    <main className={`app-shell home-shell theme-${store.settings.theme}`}>
      <header className="home-header">
        <div className="home-title-row"><h1>MosaicLynx</h1><button className="icon-button menu-button" aria-label={t("menu")} onClick={() => openView("menu")}><span></span><span></span><span></span></button></div>
        <div className="profile-summary"><span>{profile.name}</span><span className={`network-pill ${profile.network}`}>{profile.network.toUpperCase()}</span></div>
      </header>
      <section className="home-account-section">
        <ToggleButtonGroup className="tabs" exclusive fullWidth value={scope.chain} aria-label="Chain">
          <ToggleButton value="symbol" onClick={() => void updateSettings({ activeChain: "symbol" })}>Symbol</ToggleButton>
          <ToggleButton value="nem" onClick={() => void updateSettings({ activeChain: "nem" })}>NEM</ToggleButton>
        </ToggleButtonGroup>
        <label className="field account-select"><span>{t("account")}</span><select value={profile.defaultAccountId} onChange={(event) => void selectAccount(event.target.value)}>{profileAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="address-card">
          <span>{scope.chain.toUpperCase()} {t("address")}</span>
          <code>{account?.identities[scope.chain].address}</code>
        </div>
        <div className="public-key-details"><span>{t("publicKey")}</span><code>{account?.identities[scope.chain].publicKey}</code></div>
      </section>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<AppThemeProvider><App /></AppThemeProvider>);
