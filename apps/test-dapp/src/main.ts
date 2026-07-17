import { createMosaicLynxSDK, MosaicLynxSDKError, type SignedTransaction } from "@mosaiclynx/sdk";
import type { MosaicAccount, MosaicLynxProvider } from "@mosaiclynx/provider-api";
import { createTransferPayload, type Chain, type Network } from "./transaction.js";
import "./styles.css";

declare global {
  interface Window { mosaicLynx?: MosaicLynxProvider }
}

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};

const sdk = createMosaicLynxSDK();
const providerStatus = byId<HTMLDivElement>("provider-status");
const connectButton = byId<HTMLButtonElement>("connect");
const accountElement = byId<HTMLDivElement>("account");
const form = byId<HTMLFormElement>("transfer-form");
const networkSelect = byId<HTMLSelectElement>("network");
const amountInput = byId<HTMLInputElement>("amount");
const recipientInput = byId<HTMLInputElement>("recipient");
const messageInput = byId<HTMLTextAreaElement>("message");
const currencyElement = byId<HTMLSpanElement>("currency");
const resultElement = byId<HTMLDivElement>("result");
const copyButton = byId<HTMLButtonElement>("copy");
const signButton = byId<HTMLButtonElement>("sign");

let chain: Chain = "symbol";
let activeAccount: MosaicAccount | undefined;
let latestResult: SignedTransaction | undefined;

const waitForProvider = async (timeoutMs = 2_000): Promise<MosaicLynxProvider | undefined> => {
  if (window.mosaicLynx) return window.mosaicLynx;
  return new Promise((resolve) => {
    const finish = (): void => {
      window.clearTimeout(timeout);
      window.removeEventListener("mosaiclynx:ready", onReady);
      resolve(window.mosaicLynx);
    };
    const onReady = (): void => finish();
    const timeout = window.setTimeout(finish, timeoutMs);
    window.addEventListener("mosaiclynx:ready", onReady, { once: true });
  });
};

const scope = () => ({ chain, network: networkSelect.value as Network });
const matchesScope = (account: MosaicAccount): boolean =>
  account.scope.chain === chain && account.scope.network === networkSelect.value;

const showAccount = (account?: MosaicAccount): void => {
  activeAccount = account;
  accountElement.replaceChildren();
  if (!account) {
    accountElement.className = "account muted";
    accountElement.textContent = "この chain / network に接続されたアカウントはありません";
    return;
  }
  accountElement.className = "account";
  const name = document.createElement("strong");
  const address = document.createElement("span");
  const publicKey = document.createElement("code");
  name.textContent = account.name;
  address.textContent = account.address;
  publicKey.textContent = account.publicKey;
  accountElement.append(name, address, publicKey);
};

const refreshAccounts = async (): Promise<void> => {
  if (!window.mosaicLynx) return showAccount();
  const accounts = await window.mosaicLynx.getAccounts();
  showAccount(accounts.find(matchesScope));
};

const setProviderStatus = async (): Promise<void> => {
  await waitForProvider();
  const available = await sdk.isAvailable();
  const provider = window.mosaicLynx;
  const bridgeReady = document.documentElement.dataset.mosaicLynxBridge === "ready";
  const injectionFailed = document.documentElement.dataset.mosaicLynxInjection === "failed";
  let label = "拡張機能を検出";
  if (!available && provider)
    label = `非対応のProvider API (${provider.apiVersion ?? "unknown"})`;
  else if (!available && !bridgeReady)
    label = "Content script未実行（サイト権限を確認）";
  else if (!available && injectionFailed)
    label = "Providerの読み込みに失敗";
  else if (!available)
    label = "Providerが見つかりません（拡張機能エラーを確認）";
  providerStatus.className = `status ${available ? "ready" : "missing"}`;
  providerStatus.replaceChildren(document.createElement("span"), label);
  connectButton.disabled = !window.mosaicLynx;
  if (window.mosaicLynx) await refreshAccounts();
};

const connect = async (): Promise<MosaicAccount> => {
  const provider = window.mosaicLynx;
  if (!provider) throw new Error("MosaicLynx 拡張機能を検出できません。");
  let account = (await provider.getAccounts()).find(matchesScope);
  if (!account) account = (await provider.connect(scope())).find(matchesScope);
  if (!account) throw new Error("選択した chain / network のアカウントが共有されませんでした。");
  showAccount(account);
  return account;
};

const friendlyError = (error: unknown): string => {
  if (error instanceof MosaicLynxSDKError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : "不明なエラーが発生しました。";
};

connectButton.addEventListener("click", async () => {
  connectButton.disabled = true;
  try { await connect(); }
  catch (error) { resultElement.className = "result error"; resultElement.textContent = friendlyError(error); }
  finally { connectButton.disabled = !window.mosaicLynx; }
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-chain]")) {
  button.addEventListener("click", async () => {
    chain = button.dataset.chain as Chain;
    document.querySelectorAll("[data-chain]").forEach((item) => item.classList.toggle("active", item === button));
    currencyElement.textContent = chain === "symbol" ? "XYM" : "XEM";
    recipientInput.placeholder = chain === "symbol" ? "T... (39 characters)" : "T... (40 characters)";
    await refreshAccounts();
  });
}

networkSelect.addEventListener("change", refreshAccounts);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  signButton.disabled = true;
  signButton.textContent = "署名を待っています…";
  resultElement.className = "result loading";
  resultElement.textContent = "拡張機能の承認画面を確認してください。";
  copyButton.disabled = true;
  latestResult = undefined;
  try {
    const account = activeAccount && matchesScope(activeAccount) ? activeAccount : await connect();
    const params = {
      ...scope(),
      payload: createTransferPayload({
        ...scope(),
        signerPublicKey: account.publicKey,
        recipient: recipientInput.value.trim(),
        amount: amountInput.value,
        message: messageInput.value,
      }),
      expectedSignerPublicKey: account.publicKey,
    };
    latestResult = await sdk.signTransaction(params);
    resultElement.className = "result success";
    const list = document.createElement("dl");
    const resultFields: ReadonlyArray<readonly [string, string]> = [
      ["Hash", latestResult.hash],
      ["Signer public key", latestResult.signerPublicKey],
      ["Signed payload", latestResult.payload],
    ];
    for (const [label, value] of resultFields) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      list.append(term, description);
    }
    resultElement.replaceChildren(list);
    copyButton.disabled = false;
  } catch (error) {
    resultElement.className = "result error";
    resultElement.textContent = friendlyError(error);
  } finally {
    signButton.disabled = false;
    signButton.textContent = "Transfer を作成して署名";
  }
});

copyButton.addEventListener("click", async () => {
  if (!latestResult) return;
  await navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
  copyButton.textContent = "コピーしました";
  window.setTimeout(() => { copyButton.textContent = "JSON をコピー"; }, 1400);
});

window.mosaicLynx?.on("accountsChanged", () => { void refreshAccounts(); });
void setProviderStatus();
