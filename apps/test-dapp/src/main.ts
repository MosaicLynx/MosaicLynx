import {
  type MosaicLynxActiveAccount,
  MosaicLynxSDKError,
  type SignedData,
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
const refreshAccountButton = byId<HTMLButtonElement>('refresh-account');
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
const messageForm = byId<HTMLFormElement>('message-form');
const messagePurposeInput = byId<HTMLInputElement>('message-purpose');
const messageEncodingSelect = byId<HTMLSelectElement>('message-encoding');
const messageDataInput = byId<HTMLTextAreaElement>('message-data');
const signMessageButton = byId<HTMLButtonElement>('sign-message');

let chain: Chain = 'symbol';
let activeAccount: MosaicLynxActiveAccount | undefined;
let latestResult: SignedData | SignedTransaction | undefined;

const scope = () => ({ chain, network: networkSelect.value as Network });
const matchesScope = (account: MosaicLynxActiveAccount): boolean =>
  account.chain === chain && account.network === networkSelect.value;

const friendlyError = (error: unknown): string => {
  if (error instanceof MosaicLynxSDKError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : '不明なエラーが発生しました。';
};

const showError = (error: unknown): void => {
  resultElement.className = 'result error';
  resultElement.textContent = friendlyError(error);
};

const updateAvailability = (available: boolean): void => {
  connectButton.disabled = !available;
  refreshAccountButton.disabled = !available;
  signButton.disabled = !available;
  signMessageButton.disabled = !available;
  disconnectButton.disabled = !available || !activeAccount;
};

const showAccount = (account?: MosaicLynxActiveAccount): void => {
  activeAccount = account;
  accountElement.replaceChildren();
  disconnectButton.disabled = !account;
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
  updateAvailability(available);
  if (available) await refreshAccounts();
  else showAccount();
};

const connect = async (): Promise<MosaicLynxActiveAccount> => {
  const account = (await sdk.isConnected(scope()))
    ? await sdk.refreshActiveAccount(scope())
    : await sdk.connect(scope());
  if (!account) throw new Error('選択した chain / network のアクティブアカウントが共有されませんでした。');
  showAccount(account);
  return account;
};

const renderFields = (fields: ReadonlyArray<readonly [string, string]>): void => {
  const list = document.createElement('dl');
  for (const [label, value] of fields) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
  }
  resultElement.className = 'result success';
  resultElement.replaceChildren(list);
  copyButton.disabled = false;
};

const beginSigning = (button: HTMLButtonElement, text: string): void => {
  button.disabled = true;
  button.textContent = '署名を待っています…';
  resultElement.className = 'result loading';
  resultElement.textContent = text;
  copyButton.disabled = true;
  latestResult = undefined;
};

connectButton.addEventListener('click', async () => {
  connectButton.disabled = true;
  try {
    await connect();
  } catch (error) {
    showError(error);
  } finally {
    updateAvailability(providerStatus.classList.contains('ready'));
  }
});

refreshAccountButton.addEventListener('click', async () => {
  refreshAccountButton.disabled = true;
  try {
    await refreshAccounts();
  } catch (error) {
    showError(error);
  } finally {
    updateAvailability(providerStatus.classList.contains('ready'));
  }
});

disconnectButton.addEventListener('click', async () => {
  disconnectButton.disabled = true;
  try {
    await sdk.disconnect();
    showAccount();
  } catch (error) {
    showError(error);
  } finally {
    updateAvailability(providerStatus.classList.contains('ready'));
  }
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-chain]')) {
  button.addEventListener('click', async () => {
    chain = button.dataset.chain as Chain;
    document.querySelectorAll('[data-chain]').forEach((item) => item.classList.toggle('active', item === button));
    currencyElement.textContent = chain === 'symbol' ? 'XYM' : 'XEM';
    recipientInput.placeholder = chain === 'symbol' ? 'T... (39 characters)' : 'T... (40 characters)';
    try {
      await refreshAccounts();
    } catch (error) {
      showError(error);
    }
  });
}

networkSelect.addEventListener('change', () => {
  void refreshAccounts().catch(showError);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  beginSigning(signButton, '拡張機能の承認画面を確認してください。');
  try {
    const account = activeAccount && matchesScope(activeAccount) ? activeAccount : undefined;
    if (!account) throw new MosaicLynxSDKError('NOT_CONNECTED', '先にMosaicLynxへ接続してください。');
    const currentScope = scope();
    const params = {
      ...currentScope,
      payload: createTransferPayload({
        ...currentScope,
        signerPublicKey: account.publicKey,
        recipient: recipientInput.value.trim(),
        amount: amountInput.value,
        message: messageInput.value,
      }),
      expectedSignerPublicKey: account.publicKey,
    };
    const signed = await sdk.signTransaction(params);
    latestResult = signed;
    renderFields([
      ['Hash', signed.hash],
      ['Signer public key', signed.signerPublicKey],
      ['Signed payload', signed.payload],
    ]);
  } catch (error) {
    showError(error);
  } finally {
    signButton.textContent = 'Transfer を作成して署名';
    updateAvailability(providerStatus.classList.contains('ready'));
  }
});

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  beginSigning(signMessageButton, '拡張機能の承認画面を確認してください。');
  try {
    const account = activeAccount && matchesScope(activeAccount) ? activeAccount : undefined;
    if (!account) throw new MosaicLynxSDKError('NOT_CONNECTED', '先にMosaicLynxへ接続してください。');
    const encoding = messageEncodingSelect.value;
    if (encoding !== 'utf8' && encoding !== 'hex')
      throw new MosaicLynxSDKError('INVALID_PARAMS', 'Encodingが不正です。');
    const signed = await sdk.signData({
      ...scope(),
      purpose: messagePurposeInput.value.trim(),
      data: { encoding, value: messageDataInput.value },
      expectedSignerPublicKey: account.publicKey,
    });
    latestResult = signed;
    renderFields([
      ['Signature', signed.signature],
      ['Signer public key', signed.signerPublicKey],
      ['Signing digest', signed.signingDigest],
      ['Structured message', JSON.stringify(signed.message, null, 2)],
    ]);
  } catch (error) {
    showError(error);
  } finally {
    signMessageButton.textContent = 'メッセージに署名';
    updateAvailability(providerStatus.classList.contains('ready'));
  }
});

copyButton.addEventListener('click', async () => {
  if (!latestResult) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(latestResult, null, 2));
    copyButton.textContent = 'コピーしました';
    window.setTimeout(() => {
      copyButton.textContent = 'JSON をコピー';
    }, 1400);
  } catch (error) {
    showError(error);
  }
});

void setProviderStatus().catch(showError);
