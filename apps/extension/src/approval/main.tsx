import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import { NemChainAdapter } from "@mosaic-lynx/chain-nem";
import { deriveSharedAccount, SymbolChainAdapter } from "@mosaic-lynx/chain-symbol";
import { createStructuredMessage, structuredMessageDigest } from "@mosaic-lynx/core";
import { PrivateKey } from "@nemnesia/symbol-sdk";
import { NemFacade } from "@nemnesia/symbol-sdk/nem";
import { SymbolFacade } from "@nemnesia/symbol-sdk/symbol";
import type { ApprovalRequest, ApprovalResolution } from "./types.js";
import { decryptVault, loadStore, type VaultContents } from "../vault.js";
import { AppThemeProvider, setAppThemeMode } from "../ui/theme.js";
import "../popup/styles.css";

const id = new URLSearchParams(location.search).get("id") ?? "";
const adapters = { symbol: new SymbolChainAdapter(), nem: new NemChainAdapter() } as const;

const privateKeyFor = (approval: ApprovalRequest, vault: VaultContents): string => {
  const source = approval.account.source;
  let privateKey: string;
  if (source.kind === "mnemonicDerived") {
    if (!vault.mnemonic) throw new Error("This mnemonic-derived account is absent from the vault.");
    const material = deriveSharedAccount(approval.profile.network, vault.mnemonic, source.accountIndex);
    if (material.derivationPath !== source.derivationPath) throw new Error("Derivation path compatibility check failed.");
    privateKey = material.privateKey;
    for (const chain of ["symbol", "nem"] as const) {
      const expected = approval.account.identities[chain];
      const actual = material.identities[chain];
      if (expected.address !== actual.address || expected.publicKey !== actual.publicKey)
        throw new Error("The derived identity does not match the public account index.");
    }
  } else {
    privateKey = vault.importedPrivateKeys[approval.account.id] ?? "";
    if (!privateKey) throw new Error("The imported key is absent from the vault.");
  }
  return privateKey;
};

const App = () => {
  const [approval, setApproval] = useState<ApprovalRequest>();
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void chrome.runtime.sendMessage({ kind: "mosaic-lynx:approval:get", id }).then((value: ApprovalRequest | undefined) => {
      setApproval(value);
      if (value?.type === "connect") setSelected([value.account.id]);
    });
  }, []);

  useEffect(() => {
    void loadStore().then((store) => setAppThemeMode(store.settings.theme));
  }, []);

  const expired = useMemo(() => approval ? Date.parse(approval.expiresAt) <= Date.now() : false, [approval]);

  const resolve = async (resolution: ApprovalResolution): Promise<void> => {
    await chrome.runtime.sendMessage({ kind: "mosaic-lynx:approval:resolve", id, resolution });
    window.close();
  };

  const reject = (): void => { void resolve({ approved: false }); };

  const approve = async (): Promise<void> => {
    if (!approval || !password || expired) return;
    setBusy(true);
    setError("");
    let privateKey = "";
    try {
      const store = await loadStore();
      const envelope = store.vaults.find((vault) => vault.profileId === approval.profile.id);
      if (!envelope || envelope.revision !== approval.vaultRevision)
        throw new Error("The profile changed while this request was open.");
      const contents = await decryptVault(envelope, password);
      if (approval.type === "connect") {
        if (!selected.length) throw new Error("Select at least one account.");
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
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      privateKey = "";
      setPassword("");
      setBusy(false);
    }
  };

  if (!approval)
    return <main className="app-shell"><p className="empty-state">Request is no longer available.</p></main>;

  return (
    <main className="app-shell approval-shell">
      <header className="approval-header">
        <div className="approval-brand-row"><h1>MosaicLynx</h1><Chip size="small" color={approval.scope.network === "mainnet" ? "error" : "secondary"} label={approval.scope.network.toUpperCase()} /></div>
        <p className="eyebrow">{approval.type.toUpperCase()} APPROVAL · {approval.scope.chain.toUpperCase()}</p>
        <p className="origin"><strong>{approval.origin}</strong><br /><span>{approval.originAscii}</span></p>
      </header>

      <Card component="section" variant="outlined" className="approval-summary" aria-label="Request summary">
        {approval.summary.map((item) => (
          <div className="summary-row" key={item.label}>
            <span>{item.label}</span><strong>{item.value}</strong>
          </div>
        ))}
      </Card>

      {approval.type === "connect" && (
        <section>
          <p className="section-label">ACCOUNTS TO SHARE</p>
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
          <strong>Chain state is not checked</strong>
          <p>Balances, restrictions, metadata, and announce status are external to this offline signing check.</p>
          <details><summary>Technical details</summary><code>{approval.payload}</code></details>
        </Alert>
      )}

      <section className="approval-auth">
        <TextField
          fullWidth
          label="Profile password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
        <Alert severity="info" icon={false}>Software Vault — not a hardware wallet or cold wallet.</Alert>
        {expired && <Alert severity="error">This request has expired.</Alert>}
        {error && <Alert severity="error" role="alert">{error}</Alert>}
      </section>

      <footer>
        <Button fullWidth variant="outlined" color="inherit" type="button" onClick={reject} disabled={busy}>Reject</Button>
        <Button
          fullWidth
          variant="contained"
          type="button"
          onClick={() => void approve()}
          disabled={busy || !password || expired || (approval.type === "connect" && selected.length === 0)}
        >
          {busy ? "Verifying…" : "Approve"}
        </Button>
      </footer>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(<AppThemeProvider><App /></AppThemeProvider>);
