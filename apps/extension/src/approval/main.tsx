import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import { NemChainAdapter } from "@mosaiclynx/chain-nem";
import { deriveSharedAccount, SymbolChainAdapter } from "@mosaiclynx/chain-symbol";
import { createStructuredMessage, structuredMessageDigest } from "@mosaiclynx/core";
import { PrivateKey } from "@nemnesia/symbol-sdk";
import { NemFacade } from "@nemnesia/symbol-sdk/nem";
import { SymbolFacade } from "@nemnesia/symbol-sdk/symbol";
import { approvalSummary } from "./summary.js";
import type { ApprovalRequest, ApprovalResolution } from "./types.js";
import { decryptVault, loadStore, type VaultContents } from "../vault.js";
import { AppThemeProvider, setAppThemeMode } from "../ui/theme.js";
import i18n, { type TranslationKey } from "../popup/i18n.js";
import "../popup/styles.css";

const id = new URLSearchParams(location.search).get("id") ?? "";
const adapters = { symbol: new SymbolChainAdapter(), nem: new NemChainAdapter() } as const;
const approvalTypeKey = {
  connect: "approvalTypeConnect",
  transaction: "approvalTypeTransaction",
  message: "approvalTypeMessage",
} as const;

class ApprovalError extends Error {
  constructor(readonly translationKey: TranslationKey) {
    super(translationKey);
  }
}

const privateKeyFor = (approval: ApprovalRequest, vault: VaultContents): string => {
  const source = approval.account.source;
  let privateKey: string;
  if (source.kind === "mnemonicDerived") {
    if (!vault.mnemonic) throw new ApprovalError("approvalRequestFailed");
    const material = deriveSharedAccount(approval.profile.network, vault.mnemonic, source.accountIndex);
    if (material.derivationPath !== source.derivationPath) throw new ApprovalError("approvalRequestFailed");
    privateKey = material.privateKey;
    for (const chain of ["symbol", "nem"] as const) {
      const expected = approval.account.identities[chain];
      const actual = material.identities[chain];
      if (expected.address !== actual.address || expected.publicKey !== actual.publicKey)
        throw new ApprovalError("approvalRequestFailed");
    }
  } else {
    privateKey = vault.importedPrivateKeys[approval.account.id] ?? "";
    if (!privateKey) throw new ApprovalError("approvalRequestFailed");
  }
  return privateKey;
};

const App = () => {
  const { t } = useTranslation();
  const [approval, setApproval] = useState<ApprovalRequest>();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey>();

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [store, value] = await Promise.all([
        loadStore(),
        chrome.runtime.sendMessage({ kind: "mosaiclynx:approval:get", id }) as Promise<ApprovalRequest | undefined>,
      ]);
      await i18n.changeLanguage(store.settings.language);
      if (!mounted) return;
      document.documentElement.lang = store.settings.language;
      setAppThemeMode(store.settings.theme);
      setApproval(value);
      if (value?.type === "connect") setSelected([value.account.id]);
      setReady(true);
    })().catch(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (ready) document.title = t("approvalWindowTitle");
  }, [ready, t]);

  const expired = useMemo(() => approval ? Date.parse(approval.expiresAt) <= Date.now() : false, [approval]);
  const summary = useMemo(() => approval ? approvalSummary(approval, (key) => t(key)) : [], [approval, t]);

  const resolve = async (resolution: ApprovalResolution): Promise<void> => {
    await chrome.runtime.sendMessage({ kind: "mosaiclynx:approval:resolve", id, resolution });
    window.close();
  };

  const reject = (): void => { void resolve({ approved: false }); };

  const approve = async (): Promise<void> => {
    if (!approval || !password || expired) return;
    setBusy(true);
    setError(undefined);
    let privateKey = "";
    try {
      const store = await loadStore();
      const envelope = store.vaults.find((vault) => vault.profileId === approval.profile.id);
      if (!envelope || envelope.revision !== approval.vaultRevision)
        throw new ApprovalError("approvalProfileChanged");
      let contents: VaultContents;
      try {
        contents = await decryptVault(envelope, password);
      } catch {
        throw new ApprovalError("approvalUnlockFailed");
      }
      if (approval.type === "connect") {
        if (!selected.length) throw new ApprovalError("approvalSelectAccount");
        await resolve({ approved: true, accountIds: selected });
        return;
      }
      privateKey = privateKeyFor(approval, contents);
      if (approval.type === "transaction") {
        const signedTransaction = adapters[approval.scope.chain].signTransaction(
          approval.scope.network,
          approval.payload,
          privateKey,
        );
        await resolve({ approved: true, signedTransaction });
        return;
      }
      if (approval.type === "message") {
        const structured = createStructuredMessage(approval.origin, approval.messageParams);
        const key = new PrivateKey(privateKey);
        const account = approval.scope.chain === "symbol"
          ? new SymbolFacade(approval.scope.network).createAccount(key)
          : new NemFacade(approval.scope.network).createAccount(key);
        const signature = account.keyPair.sign(structured.signingBytes).toString();
        const signingDigest = await structuredMessageDigest(structured.signingBytes);
        await resolve({
          approved: true,
          signedMessage: {
            signature,
            signerPublicKey: account.publicKey.toString(),
            signingDigest,
            message: structured.message,
          },
        });
        return;
      }
    } catch (cause) {
      setError(cause instanceof ApprovalError ? cause.translationKey : "approvalRequestFailed");
    } finally {
      privateKey = "";
      setPassword("");
      setBusy(false);
    }
  };

  if (!ready) return <main className="app-shell" aria-busy="true" />;

  if (!approval)
    return <main className="app-shell"><p className="empty-state">{t("approvalRequestUnavailable")}</p></main>;

  return (
    <main className="app-shell approval-shell">
      <header className="approval-header">
        <div className="approval-brand-row"><h1>MosaicLynx</h1><Chip size="small" color={approval.scope.network === "mainnet" ? "error" : "secondary"} label={approval.scope.network.toUpperCase()} /></div>
        <p className="eyebrow">{t(approvalTypeKey[approval.type])} · {approval.scope.chain.toUpperCase()}</p>
        <p className="origin"><strong>{approval.origin}</strong><br /><span>{approval.originAscii}</span></p>
      </header>

      <Card component="section" variant="outlined" className="approval-summary" aria-label={t("approvalRequestSummary")}>
        {summary.map((item) => (
          <div className="summary-row" key={item.label}>
            <span>{t(item.label)}</span><strong>{item.value}</strong>
          </div>
        ))}
      </Card>

      {approval.type === "connect" && (
        <section>
          <p className="section-label">{t("approvalAccountsToShare").toUpperCase()}</p>
          {approval.availableAccounts.map((account) => (
            <label className="account-choice" key={account.id}>
              <Checkbox
                checked={selected.includes(account.id)}
                onChange={(event) => setSelected(event.target.checked
                  ? [...selected, account.id]
                  : selected.filter((id) => id !== account.id))}
              />
              <span><strong>{account.name}</strong><small>{account.address}</small></span>
            </label>
          ))}
        </section>
      )}

      {approval.type === "transaction" && (
        <Alert severity="warning" variant="outlined">
          <strong>{t("approvalChainStateUnverifiedTitle")}</strong>
          <p>{t("approvalChainStateUnverifiedBody")}</p>
          <details><summary>{t("approvalTechnicalDetails")}</summary><code>{approval.payload}</code></details>
        </Alert>
      )}

      <section className="approval-auth">
        <TextField
          fullWidth
          label={t("approvalProfilePassword")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
        {expired && <Alert severity="error">{t("approvalRequestExpired")}</Alert>}
        {error && <Alert severity="error" role="alert">{t(error)}</Alert>}
      </section>

      <footer>
        <Button fullWidth variant="outlined" color="inherit" type="button" onClick={reject} disabled={busy}>{t("approvalReject")}</Button>
        <Button
          fullWidth
          variant="contained"
          type="button"
          onClick={() => void approve()}
          disabled={busy || !password || expired || (approval.type === "connect" && selected.length === 0)}
        >
          {busy ? t("approvalVerifying") : t("approvalApprove")}
        </Button>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<AppThemeProvider><App /></AppThemeProvider>);
