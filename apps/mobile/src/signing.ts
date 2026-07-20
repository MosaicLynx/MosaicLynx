import { NemChainAdapter } from '@mosaiclynx/chain-nem';
import { SymbolChainAdapter } from '@mosaiclynx/chain-symbol';
import type { TransactionInspection } from '@mosaiclynx/core';
import type { RelaySigningRequest, SignedTransaction } from '@mosaiclynx/relay-protocol';

import { MAINNET_SIGNING_ENABLED } from './release-capabilities';

const adapters = { symbol: new SymbolChainAdapter(), nem: new NemChainAdapter() } as const;

export const inspectTestnetRequest = (request: RelaySigningRequest): TransactionInspection => {
  if (!MAINNET_SIGNING_ENABLED && request.network !== 'testnet') throw new Error('MAINNET_DISABLED');
  const inspection = adapters[request.chain].inspectTransaction?.('testnet', request.payload);
  if (!inspection) throw new Error('UNSUPPORTED_TRANSACTION');
  if (request.expectedSignerPublicKey && inspection.signerPublicKey !== request.expectedSignerPublicKey.toUpperCase())
    throw new Error('SIGNER_MISMATCH');
  return inspection;
};

export const signTestnetRequest = (request: RelaySigningRequest, privateKey: string): SignedTransaction => {
  if (!MAINNET_SIGNING_ENABLED && request.network !== 'testnet') throw new Error('MAINNET_DISABLED');
  const adapter = adapters[request.chain];
  const result = adapter.signTransaction?.('testnet', request.payload, privateKey);
  if (!result || !adapter.verifySignedTransaction?.('testnet', request.payload, result))
    throw new Error('INVALID_TRANSACTION');
  return result;
};
