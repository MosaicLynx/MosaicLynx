import type {
  CosignTransactionParams,
  MosaicAccount,
  MosaicLynxCosignature,
  MosaicLynxProvider,
  SignMessageParams,
  SignedMessage,
  SignedTransaction,
} from '@mosaiclynx/provider-api';

import { verifyCosignature } from './cosignature.js';
import { verifySignedData } from './data-signing.js';
import { MosaicLynxSDKError, fail } from './errors.js';
import { normalizePublicKey, verifySignedTransaction } from './transaction.js';
import type {
  MosaicLynxActiveAccount,
  MosaicLynxCosignTransactionParams,
  MosaicLynxSDKErrorCode,
  MosaicLynxScope,
  MosaicLynxSignDataParams,
  MosaicLynxSignTransactionParams,
} from './types.js';

/** Provider固有エラーをSDKの安定した公開コードへ正規化します。 */
export const mapProviderError = (error: unknown): MosaicLynxSDKError => {
  if (!(typeof error === 'object' && error && 'code' in error)) return fail('INTERNAL_ERROR');
  const code = String((error as { code: unknown }).code);
  const allowed: readonly MosaicLynxSDKErrorCode[] = [
    'USER_REJECTED',
    'VAULT_LOCKED',
    'INVALID_PARAMS',
    'INVALID_MESSAGE',
    'NONCE_REUSED',
    'INVALID_TRANSACTION',
    'UNSUPPORTED_TRANSACTION',
    'CHAIN_MISMATCH',
    'NETWORK_MISMATCH',
    'CONTEXT_CHANGED',
    'REQUEST_EXPIRED',
  ];
  return fail(
    allowed.includes(code as MosaicLynxSDKErrorCode)
      ? (code as MosaicLynxSDKErrorCode)
      : code === 'ACCOUNT_NOT_FOUND'
        ? 'SIGNER_MISMATCH'
        : code === 'UNAUTHORIZED_ORIGIN'
          ? 'NOT_CONNECTED'
          : code === 'UNSUPPORTED_CHAIN'
            ? 'UNAVAILABLE'
            : 'INTERNAL_ERROR'
  );
};

const matching = (account: MosaicAccount | undefined, scope: MosaicLynxScope): account is MosaicAccount =>
  Boolean(account && account.scope.chain === scope.chain && account.scope.network === scope.network);

const publicAccount = (account: MosaicAccount): MosaicLynxActiveAccount => ({
  chain: account.scope.chain,
  network: account.scope.network,
  address: account.address,
  publicKey: normalizePublicKey(account.publicKey),
});

export const activeAccountWithExtension = async (
  provider: MosaicLynxProvider,
  scope: MosaicLynxScope
): Promise<MosaicLynxActiveAccount | undefined> => {
  try {
    const account = await provider.getActiveAccount(scope);
    return matching(account, scope) ? publicAccount(account) : undefined;
  } catch (error) {
    const mapped = mapProviderError(error);
    if (mapped.code === 'NOT_CONNECTED' || mapped.code === 'SIGNER_MISMATCH') return undefined;
    throw mapped;
  }
};

export const connectWithExtension = async (
  provider: MosaicLynxProvider,
  scope: MosaicLynxScope
): Promise<MosaicLynxActiveAccount> => {
  try {
    await provider.connect(scope);
    const account = await provider.getActiveAccount(scope);
    if (!matching(account, scope)) throw fail('NOT_CONNECTED');
    return publicAccount(account);
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    throw mapProviderError(error);
  }
};

export const disconnectWithExtension = async (provider: MosaicLynxProvider): Promise<void> => {
  try {
    await provider.disconnect();
  } catch (error) {
    throw mapProviderError(error);
  }
};

const accountIdFor = async (
  provider: MosaicLynxProvider,
  scope: MosaicLynxScope,
  expectedSignerPublicKey?: string
): Promise<string | undefined> => {
  if (!expectedSignerPublicKey) return undefined;
  const expected = normalizePublicKey(expectedSignerPublicKey);
  let accounts: readonly MosaicAccount[];
  try {
    accounts = await provider.getAccounts();
  } catch (error) {
    throw mapProviderError(error);
  }
  const account = accounts.find(
    (candidate) =>
      candidate.scope.chain === scope.chain &&
      candidate.scope.network === scope.network &&
      normalizePublicKey(candidate.publicKey) === expected
  );
  if (!account) throw fail('SIGNER_MISMATCH');
  return account.id;
};

export const signWithExtension = async (
  provider: MosaicLynxProvider,
  params: MosaicLynxSignTransactionParams
): Promise<SignedTransaction> => {
  const accountId = await accountIdFor(provider, params, params.expectedSignerPublicKey);
  try {
    return verifySignedTransaction(
      params,
      await provider.signTransaction({
        chain: params.chain,
        network: params.network,
        payload: params.payload,
        ...(accountId ? { accountId } : {}),
      })
    );
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    throw mapProviderError(error);
  }
};

export const signDataWithExtension = async (
  provider: MosaicLynxProvider,
  params: MosaicLynxSignDataParams,
  request: SignMessageParams,
  origin: string
): Promise<SignedMessage> => {
  const accountId = await accountIdFor(provider, params, params.expectedSignerPublicKey);
  try {
    const result = await provider.signMessage({ ...request, ...(accountId ? { accountId } : {}) });
    return await verifySignedData(params, request, result, origin);
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    throw mapProviderError(error);
  }
};

export const cosignWithExtension = async (
  provider: MosaicLynxProvider,
  params: MosaicLynxCosignTransactionParams
): Promise<MosaicLynxCosignature> => {
  const accountId = await accountIdFor(provider, params, params.expectedSignerPublicKey);
  const request: CosignTransactionParams =
    params.chain === 'symbol'
      ? {
          chain: 'symbol',
          network: params.network,
          parentPayload: params.parentPayload,
          detached: params.detached,
          ...(accountId ? { accountId } : {}),
        }
      : {
          chain: 'nem',
          network: params.network,
          payload: params.payload,
          parentPayload: params.parentPayload,
          ...(accountId ? { accountId } : {}),
        };
  try {
    const result = await provider.cosignTransaction(request);
    return verifyCosignature(params, result);
  } catch (error) {
    if (error instanceof MosaicLynxSDKError) throw error;
    throw mapProviderError(error);
  }
};
