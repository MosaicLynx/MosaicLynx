import {
  type MosaicLynxActiveAccount,
  MosaicLynxSDKError,
  type SignedTransaction,
  createMosaicLynxSDK,
} from '@mosaiclynx/sdk';

import './styles.css';
import { type Chain, type Network, createTransferPayload } from './transaction.js';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};

const sdk = createMosaicLynxSDK();
const providerStatus = byId<HTMLDivElement>('provider-status');
const connectButton = byId<HTMLButtonElement>('connect');
const disconnectButton = byId<HTMLButtonElement>('disconnect');
const accountElement = byId<HTMLDivElement>('account');
const form = byId<HTMLFormElement>('transfer-form');
const networkSelect = byId<HTMLSelectElement>('network');
const amountInput = byId<HTMLInputElement>('amount');
const recipientInput = byId<HTMLInputElement>('recipient');
const messageInput = byId<HTMLTextAreaElement>('message');
const currencyElement = byId<HTMLSpanElement>('currency');
const resultElement = byId<HTMLDivElement>('result');
const copyButton = byId<HTMLButtonElement>('copy');
const signButton = byId<HTMLButtonElement>('sign');

let chain: Chain = 'symbol';
let activeAccount: MosaicLynxActiveAccount | undefined;
let latestResult: SignedTransaction | undefined;

const scope = () => ({ chain, network: networkSelect.value as Network });
const matchesScope = (account: MosaicLynxActiveAccount): boolean =>
  account.chain === chain && account.network === networkSelect.value;

const showAccount = (account?: MosaicLynxActiveAccount): void => {
  activeAccount = account;
  accountElement.replaceChildren();
  if (!account) {
    accountElement.className = 'account muted';
    accountElement.textContent = 'この chain / network に接続されたアカウントはありません';
    return;
  }
  accountElement.className = 'account';
  const address = document.createElement('span');
  const publicKey = document.createElement('code');
  address.textContent = account.address;
  publicKey.textContent = account.publicKey;
  accountElement.append(address, publicKey);
};

const refreshAccounts = async (): Promise<void> => {
  showAccount(await sdk.refreshActiveAccount(scope()));
};

const setProviderStatus = async (): Promise<void> => {
  const available = await sdk.isAvailable();
  const label = available ? 'MosaicLynxを利用できます' : '対応するMosaicLynxが見つかりません';
  providerStatus.className = `status ${available ? 'ready' : 'missing'}`;
  providerStatus.replaceChildren(document.createElement('span'), label);
  connectButton.disabled = !available;
  if (available) await refreshAccounts();
};

const connect = async (): Promise<MosaicLynxActiveAccount> => {
  const account = (await sdk.isConnected(scope()))
    ? await sdk.refreshActiveAccount(scope())
    : await sdk.connect(scope());
  if (!account) throw new Error('選択した chain / network のアクティブアカウントが共有されませんでした。');
  showAccount(account);
  return account;
};

const friendlyError = (error: unknown): string => {
  if (error instanceof MosaicLynxSDKError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : '不明なエラーが発生しました。';
};

connectButton.addEventListener('click', async () => {
  connectButton.disabled = true;
  try {
    await connect();
  } catch (error) {
    resultElement.className = 'result error';
    resultElement.textContent = friendlyError(error);
  } finally {
    connectButton.disabled = false;
  }
});

disconnectButton.addEventListener('click', async () => {
  disconnectButton.disabled = true;
  try {
    await sdk.disconnect();
    showAccount();
  } catch (error) {
    resultElement.className = 'result error';
    resultElement.textContent = friendlyError(error);
  } finally {
    disconnectButton.disabled = false;
  }
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-chain]')) {
  button.addEventListener('click', async () => {
    chain = button.dataset.chain as Chain;
    document.querySelectorAll('[data-chain]').forEach((item) => item.classList.toggle('active', item === button));
    currencyElement.textContent = chain === 'symbol' ? 'XYM' : 'XEM';
    recipientInput.placeholder = chain === 'symbol' ? 'T... (39 characters)' : 'T... (40 characters)';
    await refreshAccounts();
  });
}

networkSelect.addEventListener('change', refreshAccounts);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  signButton.disabled = true;
  signButton.textContent = '署名を待っています…';
  resultElement.className = 'result loading';
  resultElement.textContent = '拡張機能の承認画面を確認してください。';
  copyButton.disabled = true;
  latestResult = undefined;
  try {
    const account = activeAccount && matchesScope(activeAccount) ? activeAccount : undefined;
    if (!account) throw new MosaicLynxSDKError('NOT_CONNECTED', '先にMosaicLynxへ接続してください。');
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
    resultElement.className = 'result success';
    const list = document.createElement('dl');
    const resultFields: ReadonlyArray<readonly [string, string]> = [
      ['Hash', latestResult.hash],
      ['Signer public key', latestResult.signerPublicKey],
      ['Signed payload', latestResult.payload],
    ];
    for (const [label, value] of resultFields) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      list.append(term, description);
    }
    resultElement.replaceChildren(list);
    copyButton.disabled = false;
  } catch (error) {
    resultElement.className = 'result error';
    resultElement.textContent = friendlyError(error);
  } finally {
    signButton.disabled = false;
    signButton.textContent = 'Transfer を作成して署名';
  }
});

copyButton.addEventListener('click', async () => {
  if (!latestResult) return;
  await navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
  copyButton.textContent = 'コピーしました';
  window.setTimeout(() => {
    copyButton.textContent = 'JSON をコピー';
  }, 1400);
});

void setProviderStatus();
