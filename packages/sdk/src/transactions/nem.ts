import type { SignedTransaction } from '@mosaiclynx/provider-api';
import { Signature, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, TransactionFactory as NemTransactionFactory } from '@nemnesia/symbol-sdk/nem';

import type { MosaicLynxSignTransactionParams } from '../types.js';
import { equalBytes, expectedNetworkIdentifier, normalizePublicKey, validateHexPayload } from './common.js';

/** NEM 形式の署名済みトランザクションを、元の署名要求と照合して検証します。 */
export const verifyNemSignedTransaction = (
  params: MosaicLynxSignTransactionParams,
  result: SignedTransaction
): SignedTransaction => {
  const originalBytes = validateHexPayload(params.payload);
  const signedBytes = validateHexPayload(result.payload);
  const expectedSigner = params.expectedSignerPublicKey
    ? normalizePublicKey(params.expectedSignerPublicKey)
    : undefined;
  const facade = new NemFacade(params.network);
  const original = NemTransactionFactory.deserialize(originalBytes);
  const signed = NemTransactionFactory.deserialize(signedBytes);

  if (!equalBytes(original.serialize(), originalBytes) || !equalBytes(signed.serialize(), signedBytes))
    throw new Error('Non-canonical NEM transaction.');
  if (signed.network.value !== expectedNetworkIdentifier(params.network)) throw new Error('Network mismatch.');
  const signer = signed.signerPublicKey.toString().toUpperCase();
  if (signer !== result.signerPublicKey.toUpperCase() || (expectedSigner && signer !== expectedSigner))
    throw new Error('Signer mismatch.');
  // 署名を付与する前後で、署名対象データそのものが変わっていないことを確認する。
  if (!equalBytes(facade.extractSigningPayload(original), facade.extractSigningPayload(signed)))
    throw new Error('Signed transaction does not match request.');
  const signature = new Signature(signed.signature.bytes);
  if (!facade.verifyTransaction(signed, signature)) throw new Error('Invalid signature.');
  const hash = facade.hashTransaction(signed).toString().toUpperCase();
  if (hash !== result.hash.toUpperCase()) throw new Error('Hash mismatch.');
  return { payload: utils.uint8ToHex(signedBytes), hash, signerPublicKey: signer };
};
