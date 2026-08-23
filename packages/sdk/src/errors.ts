import type { MosaicLynxSDKErrorCode } from './types.js';

/**
 * SDK が利用者へ返す、扱いやすいエラーです。
 * `code` を使うことで、表示文言に依存せず失敗理由を判定できます。
 */
export class MosaicLynxSDKError extends Error {
  public constructor(
    public readonly code: MosaicLynxSDKErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'MosaicLynxSDKError';
  }
}

const publicMessage: Record<MosaicLynxSDKErrorCode, string> = {
  USER_REJECTED: 'The signing request was rejected.',
  UNAVAILABLE: 'MosaicLynx is not available in this browser.',
  NOT_CONNECTED: 'This site is not connected to MosaicLynx.',
  APP_NOT_INSTALLED: 'The MosaicLynx app is not installed.',
  VAULT_LOCKED: 'The MosaicLynx vault is locked.',
  REQUEST_EXPIRED: 'The signing request expired.',
  INVALID_PARAMS: 'The signing request parameters are invalid.',
  INVALID_MESSAGE: 'The structured data is invalid.',
  NONCE_REUSED: 'The structured data nonce was already used.',
  INVALID_TRANSACTION: 'The transaction is invalid.',
  UNSUPPORTED_TRANSACTION: 'The transaction type or version is unsupported.',
  CHAIN_MISMATCH: 'The transaction chain does not match the request.',
  NETWORK_MISMATCH: 'The transaction network does not match the request.',
  SIGNER_MISMATCH: 'The transaction signer does not match the request.',
  CONTEXT_CHANGED: 'The page context changed while signing.',
  INVALID_RESPONSE: 'MosaicLynx returned an invalid response.',
  INTERNAL_ERROR: 'MosaicLynx could not complete the request.',
};

/** 内部エラーコードを公開用の SDK エラーへ変換します。 */
export const fail = (code: MosaicLynxSDKErrorCode): MosaicLynxSDKError =>
  new MosaicLynxSDKError(code, publicMessage[code]);
