import type { SignedTransaction } from '@mosaiclynx/provider-api';
import { Signature, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, TransactionFactory as NemTransactionFactory } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade, SymbolTransactionFactory } from '@nemnesia/symbol-sdk/symbol';

import type { MosaicLynxSignTransactionParams } from './index.js';

const expectedNetworkIdentifier = (network: 'mainnet' | 'testnet'): number => (network === 'mainnet' ? 0x68 : 0x98);

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const validateHexPayload = (payload: unknown): Uint8Array => {
  if (typeof payload !== 'string' || payload.length === 0 || payload.length % 2 !== 0 || !utils.isHexString(payload))
    throw new TypeError('Transaction payload must be non-empty, even-length hexadecimal.');
  const bytes = utils.hexToUint8(payload);
  if (bytes.length > 256 * 1024) throw new TypeError('Transaction payload exceeds 256 KiB.');
  return bytes;
};

export const normalizePublicKey = (value: string): string => {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new TypeError('Public key must be 32-byte hexadecimal.');
  return value.toUpperCase();
};

export const verifySignedTransaction = (
  params: MosaicLynxSignTransactionParams,
  result: SignedTransaction
): SignedTransaction => {
  const originalBytes = validateHexPayload(params.payload);
  const signedBytes = validateHexPayload(result.payload);
  const expectedSigner = params.expectedSignerPublicKey
    ? normalizePublicKey(params.expectedSignerPublicKey)
    : undefined;

  try {
    if (params.chain === 'symbol') {
      const facade = new SymbolFacade(params.network);
      const original = SymbolTransactionFactory.deserialize(originalBytes);
      const signed = SymbolTransactionFactory.deserialize(signedBytes);
      if (!equalBytes(original.serialize(), originalBytes) || !equalBytes(signed.serialize(), signedBytes))
        throw new Error('Non-canonical Symbol transaction.');
      if (signed.network.value !== expectedNetworkIdentifier(params.network)) throw new Error('Network mismatch.');
      const signer = signed.signerPublicKey.toString().toUpperCase();
      if (signer !== result.signerPublicKey.toUpperCase() || (expectedSigner && signer !== expectedSigner))
        throw new Error('Signer mismatch.');
      if (!equalBytes(facade.extractSigningPayload(original), facade.extractSigningPayload(signed)))
        throw new Error('Signed transaction does not match request.');
      const signature = new Signature(signed.signature.bytes);
      if (!facade.verifyTransaction(signed, signature)) throw new Error('Invalid signature.');
      const hash = facade.hashTransaction(signed).toString().toUpperCase();
      if (hash !== result.hash.toUpperCase()) throw new Error('Hash mismatch.');
      return { payload: utils.uint8ToHex(signedBytes), hash, signerPublicKey: signer };
    }

    const facade = new NemFacade(params.network);
    const original = NemTransactionFactory.deserialize(originalBytes);
    const signed = NemTransactionFactory.deserialize(signedBytes);
    if (!equalBytes(original.serialize(), originalBytes) || !equalBytes(signed.serialize(), signedBytes))
      throw new Error('Non-canonical NEM transaction.');
    if (signed.network.value !== expectedNetworkIdentifier(params.network)) throw new Error('Network mismatch.');
    const signer = signed.signerPublicKey.toString().toUpperCase();
    if (signer !== result.signerPublicKey.toUpperCase() || (expectedSigner && signer !== expectedSigner))
      throw new Error('Signer mismatch.');
    if (!equalBytes(facade.extractSigningPayload(original), facade.extractSigningPayload(signed)))
      throw new Error('Signed transaction does not match request.');
    const signature = new Signature(signed.signature.bytes);
    if (!facade.verifyTransaction(signed, signature)) throw new Error('Invalid signature.');
    const hash = facade.hashTransaction(signed).toString().toUpperCase();
    if (hash !== result.hash.toUpperCase()) throw new Error('Hash mismatch.');
    return { payload: utils.uint8ToHex(signedBytes), hash, signerPublicKey: signer };
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new Error('Signed transaction validation failed.');
  }
};
