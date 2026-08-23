import type {
  MosaicLynxCosignature,
  MosaicLynxProvider,
  SignedMessage,
  SignedTransaction,
} from '@mosaiclynx/provider-api';

/** MosaicLynx SDK が扱うブロックチェーン。 */
export type MosaicLynxChain = 'symbol' | 'nem';
/** 署名対象のネットワーク。 */
export type MosaicLynxNetwork = 'mainnet' | 'testnet';

/** 接続・照会・署名に共通するチェーンとネットワーク。 */
export interface MosaicLynxScope {
  readonly chain: MosaicLynxChain;
  readonly network: MosaicLynxNetwork;
}

/** @deprecated `MosaicLynxScope`を使用してください。 */
export type MosaicLynxConnectParams = MosaicLynxScope;

/** dAppへ共有された、指定チェーンのアクティブアカウント公開情報。 */
export interface MosaicLynxActiveAccount extends MosaicLynxScope {
  readonly address: string;
  readonly publicKey: string;
}

/** @deprecated `MosaicLynxActiveAccount`を使用してください。 */
export type MosaicLynxAccount = MosaicLynxActiveAccount;

/** 未署名トランザクションの署名要求。 */
export interface MosaicLynxSignTransactionParams extends MosaicLynxScope {
  readonly payload: string;
  readonly expectedSignerPublicKey?: string;
}

/** 構造化データ署名の要求。nonceと有効期限はSDKが生成します。 */
export interface MosaicLynxSignDataParams extends MosaicLynxScope {
  readonly purpose: string;
  readonly data: {
    readonly encoding: 'utf8' | 'hex';
    readonly value: string;
  };
  readonly expectedSignerPublicKey?: string;
}

/** 実際に署名した構造化メッセージを含むデータ署名結果。 */
export type SignedData = SignedMessage;

export interface MosaicLynxSymbolCosignTransactionParams extends MosaicLynxScope {
  readonly chain: 'symbol';
  readonly parentPayload: string;
  readonly detached: boolean;
  readonly expectedSignerPublicKey?: string;
}

export interface MosaicLynxNemCosignTransactionParams extends MosaicLynxScope {
  readonly chain: 'nem';
  readonly payload: string;
  readonly parentPayload: string;
  readonly expectedSignerPublicKey?: string;
}

/** チェーンごとの完全な親transactionを要求する連署パラメーター。 */
export type MosaicLynxCosignTransactionParams =
  MosaicLynxSymbolCosignTransactionParams | MosaicLynxNemCosignTransactionParams;

export type { MosaicLynxCosignature, SignedTransaction };

/** SDKが呼び出し元へ公開する失敗理由。 */
export type MosaicLynxSDKErrorCode =
  | 'USER_REJECTED'
  | 'UNAVAILABLE'
  | 'NOT_CONNECTED'
  | 'APP_NOT_INSTALLED'
  | 'VAULT_LOCKED'
  | 'REQUEST_EXPIRED'
  | 'INVALID_PARAMS'
  | 'INVALID_MESSAGE'
  | 'NONCE_REUSED'
  | 'INVALID_TRANSACTION'
  | 'UNSUPPORTED_TRANSACTION'
  | 'CHAIN_MISMATCH'
  | 'NETWORK_MISMATCH'
  | 'SIGNER_MISMATCH'
  | 'CONTEXT_CHANGED'
  | 'INVALID_RESPONSE'
  | 'INTERNAL_ERROR';

/** SDK処理の進行状況を通知する診断イベント。 */
export interface MosaicLynxDiagnosticEvent {
  readonly phase: 'transport_selected' | 'approval_requested' | 'response_received' | 'completed' | 'failed';
  readonly transport: 'extension' | 'mobile-relay';
  readonly timestamp: string;
  readonly errorCode?: MosaicLynxSDKErrorCode;
}

/** SDKインスタンスの設定。Mobile Relay有効化は開発・モック検証用です。 */
export interface MosaicLynxSDKOptions {
  readonly mobileRelay?: { readonly enabled: boolean };
  readonly diagnostics?: {
    readonly enabled: boolean;
    readonly onEvent?: (event: MosaicLynxDiagnosticEvent) => void;
  };
}

/** MosaicLynxの接続と署名機能を提供する公開SDK。 */
export interface MosaicLynxSDK {
  readonly version: '1.0.0';
  isAvailable(): Promise<boolean>;
  connect(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount>;
  isConnected(scope: MosaicLynxScope): Promise<boolean>;
  getActiveAccount(scope: MosaicLynxScope): MosaicLynxActiveAccount | undefined;
  refreshActiveAccount(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount | undefined>;
  disconnect(): Promise<void>;
  signTransaction(params: MosaicLynxSignTransactionParams): Promise<SignedTransaction>;
  signData(params: MosaicLynxSignDataParams): Promise<SignedData>;
  cosignTransaction(params: MosaicLynxCosignTransactionParams): Promise<MosaicLynxCosignature>;
}

declare global {
  interface Window {
    /** MosaicLynx拡張機能が注入するProvider。 */
    mosaicLynx?: MosaicLynxProvider;
  }
}
