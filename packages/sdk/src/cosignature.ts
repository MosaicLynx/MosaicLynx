import type { MosaicLynxCosignature } from '@mosaiclynx/provider-api';
import { PublicKey, Signature, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, TransactionFactory as NemTransactionFactory, models as nemModels } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade, SymbolTransactionFactory, models as symbolModels } from '@nemnesia/symbol-sdk/symbol';

import { fail } from './errors.js';
import { normalizePublicKey } from './transaction.js';
import type { MosaicLynxCosignTransactionParams } from './types.js';

const equal = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((byte, index) => byte === right[index]);

/** 連署結果が完全な親transactionと要求内容に対応することを独立検証します。 */
export const verifyCosignature = (
  params: MosaicLynxCosignTransactionParams,
  result: MosaicLynxCosignature
): MosaicLynxCosignature => {
  try {
    const signerPublicKey = normalizePublicKey(result.signerPublicKey);
    if (result.chain !== params.chain) throw fail('INVALID_RESPONSE');
    if (params.expectedSignerPublicKey && signerPublicKey !== normalizePublicKey(params.expectedSignerPublicKey))
      throw fail('SIGNER_MISMATCH');
    if (params.chain === 'symbol' && result.chain === 'symbol') {
      const facade = new SymbolFacade(params.network);
      const parent = SymbolTransactionFactory.deserialize(utils.hexToUint8(params.parentPayload));
      if (
        !(parent instanceof symbolModels.AggregateCompleteTransactionV2) &&
        !(parent instanceof symbolModels.AggregateBondedTransactionV2)
      )
        throw fail('INVALID_RESPONSE');
      const parentHash = facade.hashTransaction(parent);
      if (
        result.parentHash.toUpperCase() !== parentHash.toString().toUpperCase() ||
        result.detached !== params.detached
      )
        throw fail('INVALID_RESPONSE');
      const bytes = utils.hexToUint8(result.payload);
      const cosignature = params.detached
        ? symbolModels.DetachedCosignature.deserialize(bytes)
        : symbolModels.Cosignature.deserialize(bytes);
      if (
        !equal(cosignature.serialize(), bytes) ||
        cosignature.signerPublicKey.toString().toUpperCase() !== signerPublicKey ||
        cosignature.signature.toString().toUpperCase() !== result.signature.toUpperCase()
      )
        throw fail('INVALID_RESPONSE');
      if (
        !new facade.static.Verifier(new PublicKey(signerPublicKey)).verify(
          parentHash.bytes,
          new Signature(result.signature)
        )
      )
        throw fail('INVALID_RESPONSE');
      return {
        ...result,
        signerPublicKey,
        parentHash: parentHash.toString().toUpperCase(),
        payload: result.payload.toUpperCase(),
      };
    }
    if (params.chain === 'nem' && result.chain === 'nem') {
      const facade = new NemFacade(params.network);
      const unsigned = NemTransactionFactory.deserialize(utils.hexToUint8(params.payload));
      const signed = NemTransactionFactory.deserialize(utils.hexToUint8(result.payload));
      if (
        !(unsigned instanceof nemModels.CosignatureV1) ||
        !(signed instanceof nemModels.CosignatureV1) ||
        !equal(facade.extractSigningPayload(unsigned), facade.extractSigningPayload(signed)) ||
        signed.signerPublicKey.toString().toUpperCase() !== signerPublicKey ||
        !facade.verifyTransaction(signed, new nemModels.Signature(signed.signature.bytes)) ||
        facade.hashTransaction(signed).toString().toUpperCase() !== result.hash.toUpperCase()
      )
        throw fail('INVALID_RESPONSE');
      return { ...result, signerPublicKey, payload: result.payload.toUpperCase(), hash: result.hash.toUpperCase() };
    }
    throw fail('INVALID_RESPONSE');
  } catch (error) {
    if (error instanceof Error && 'code' in error) throw error;
    throw fail('INVALID_RESPONSE');
  }
};
