import type { SignedTransaction } from '@mosaiclynx/provider-api';

import { verifyNemSignedTransaction } from './transactions/nem.js';
import { verifySymbolSignedTransaction } from './transactions/symbol.js';
import type { MosaicLynxSignTransactionParams } from './types.js';

export { normalizePublicKey, validateHexPayload } from './transactions/common.js';

/**
 * 署名結果をチェーン固有の検証器へ振り分けます。
 * 形式不正は `TypeError` として残し、署名・ハッシュなどの検証失敗は共通エラーに正規化します。
 */
export const verifySignedTransaction = (
  params: MosaicLynxSignTransactionParams,
  result: SignedTransaction
): SignedTransaction => {
  try {
    return params.chain === 'symbol'
      ? verifySymbolSignedTransaction(params, result)
      : verifyNemSignedTransaction(params, result);
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new Error('Signed transaction validation failed.');
  }
};
