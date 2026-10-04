# MosaicLynx SDK Web トランザクション受け渡し仕様

## 1. 文書の目的

本書は、dApp が MosaicLynx へトランザクション署名またはメッセージ署名を要求し、対応する署名結果を受け取るための Web 向け統合仕様を定義する。

Web ページ向けライブラリの正式名称は **MosaicLynx SDK**、npm パッケージ名は `@mosaiclynx/sdk` とする。MosaicLynx SDKはChrome拡張機能へ直接渡す方式と、スマートフォンアプリへリレー経由で渡す方式の差を隠蔽し、dAppに `signTransaction()` と `signData()` を含む共通署名接点を公開する。拡張機能アダプターは拡張機能 MVP、モバイル Relay アダプターとRelay / アプリはモバイルマイルストーンの提供物である。本書のv1は両者の最終契約を定義するが、モバイル実装を拡張機能 MVPの受け入れ条件には含めない。

MosaicLynx 全体のプロダクト要件は [プロダクト仕様](./product-spec.md)、コンポーネントの責務と依存方向は [アーキテクチャ](../design/architecture.md)、鍵・ネットワーク・トランザクション・署名バイトの固定契約は [チェーン互換性仕様](./chain-compatibility-spec.md) に定義する。本書と共通仕様が矛盾する場合、署名可否はプロダクト仕様、チェーンバイト規則はチェーン互換性仕様、Web受け渡しプロトコルは本書を適用する。

## 2. 対応範囲

### 2.1 v1 の対象

- Symbol Mainnet / Testnet のトランザクション署名
- NEM Mainnet / Testnet のトランザクション署名
- トランザクション署名とメッセージ署名の共通受け渡し
- Chrome 拡張機能 Provider への直接受け渡し
- 同一スマートフォン上の Web ブラウザから MosaicLynx アプリへの受け渡し
- E2E 暗号化した一時リレーによる要求と結果の往復
- 拡張機能 / モバイル Relay 間で共通化した結果型とエラー型

v1のリリース単位は次のとおりとする。

| マイルストーン | 必須範囲                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 拡張機能 MVP   | SDK公開API（`signTransaction()` / `signData()`）、拡張機能アダプター、Provider 2.x、共通結果検証                                |
| モバイル v1    | モバイル Relay アダプター、Relay、iOS / Android アプリ、検証済み App Link、オリジン証明、モバイル署名主体保証表示、署名受け渡し |

### 2.2 v1 の対象外

- PC の Web ページから QR コードでスマートフォンへ渡すフロー
- dApp による通信経路の強制指定
- 任意リレー、自己ホストリレー、リレー URL の上書き
- 署名済みトランザクションのノードへのアナウンス
- Relay によるトランザクションの解析、署名、broadcast、長期保管

dAppはMosaicLynx SDKから受け取った署名済みトランザクションを検証し、必要な場合は自身の責任でノードへアナウンスする。

メッセージ署名は v1 の対象であり、`signData()` によるメッセージ署名要求と `SignedData` による結果を拡張機能 / モバイル Relay の両方で同じ安全境界へ引き渡す。未対応操作 / 形式、検証不能または利用者拒否をトランザクション署名やメッセージ署名の成功へ代替経路してはならない。

### 2.3 v1 操作対応表

| 操作                                              | Relay マイルストーン / SDK・モバイル契約                       | 結果 / 失敗の扱い                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `signTransaction`                                 | Relay マイルストーン必須                                       | `MosaicLynxSigningResult<SignedTransaction>` または共通エラー                                         |
| `signData`                                        | Relay マイルストーン必須                                       | `MosaicLynxSigningResult<SignedData>`（署名済み構造化されたメッセージまたは結果不明）または共通エラー |
| `connect` / `refreshActiveAccount` / `disconnect` | SDK / モバイル通信経路契約、Relay マイルストーン判定を妨げない | 既存のアカウント / 接続解除応答または共通エラー                                                       |
| `cosignTransaction`                               | 任意 / 既存の SDK 契約、Relay マイルストーン判定を妨げない     | 既存の連署署名結果または共通エラー                                                                    |

同じモバイル通信経路 / Relay 基盤を複数操作が再利用しても、Relay マイルストーンの必須対象範囲は `signTransaction` と `signData` の二つから拡張されない。上表の操作は、Relay が意味内容を解釈することを意味しない。Relay は全操作の要求 / 応答エンベロープを内容を解釈しないとして受け渡し、モバイルアプリが復号、操作別の検証・表示・承認・署名を行い、dApp / SDK が結果を独立検証する。

## 3. 用語

| 用語                             | 意味                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| MosaicLynx SDK                   | dAppが組み込む`@mosaiclynx/sdk`                                                                                                |
| Provider                         | Chrome 拡張機能が公開する `window.mosaicLynx`                                                                                  |
| 拡張機能アダプター               | MosaicLynx SDK内でProviderを呼び出す非公開アダプター                                                                           |
| モバイル Relay アダプター        | MosaicLynx SDK内でリレーセッションとApp Linkを扱う非公開アダプター                                                             |
| Relay                            | E2E 暗号文を短時間だけ保管する MosaicLynx 管理サービス                                                                         |
| App Link                         | iOS 普遍的なリンク / Android アプリリンクで MosaicLynx アプリを開く検証済み HTTPS URL                                          |
| Relay エンドポイント認可認証情報 | Relay エンドポイントの認可に使う最小限の bearer 認証情報。現行仕様の `appToken` はこの分類の具体例であり、E2E 秘密情報ではない |
| 対応能力トークン                 | Relay API の操作権限を与える推測困難な bearer トークン。現行通信上のではエンドポイント認可認証情報の一形態として扱う           |
| セッション秘密情報               | 要求 / 応答暗号鍵の導出に使う 256-bit E2E 秘密情報。Relay エンドポイント認可認証情報とは別分類                                 |
| 開始主体オリジン                 | MosaicLynx SDKが`window.location.origin`から取得して要求へ含めるオリジン。モバイル Mainnetではオリジン証明を追加検証する       |

## 4. MosaicLynx SDKの命名と配布

次の名称を公開契約として使用する。

| 対象                          | 名称                    |
| ----------------------------- | ----------------------- |
| 表示名                        | MosaicLynx SDK          |
| npm パッケージ                | `@mosaiclynx/sdk`       |
| 公開インターフェース          | `MosaicLynxSDK`         |
| ファクトリー                  | `createMosaicLynxSDK()` |
| 標準インスタンス名            | `mosaicLynx`            |
| 拡張機能 Provider             | `window.mosaicLynx`     |
| MosaicLynx SDK API バージョン | `1.0.0`                 |
| 必須 Provider API             | `2.x`                   |
| Relay プロトコル              | `mosaiclynx.relay.v1`   |

npm 対象範囲の取得可否は公開準備時に確認する。対象範囲を取得できない場合も、製品名、インターフェース名、ファクトリー名、Relay プロトコル名は変更しない。パッケージ名を変更する場合は配布文書だけを更新する。

現行 SDK API `1.0.0` の公開署名契約は `MosaicLynxSigningResult<T>` を使用する。従前の単純な `Promise<SignedTransaction>` / `Promise<SignedData>` 表現はこの v1 契約では使用せず、ここで v2、別パッケージまたは非推奨の旧式の API を追加しない。すでに公開済みの不変成果物に対する移行、主要バージョンまたは非推奨化の要否は既存のバージョン / リリースポリシーに委譲する。

MosaicLynx SDKはブラウザ ESM ビルドと、型宣言を含むnpm パッケージとして配布する。リモートスクリプトやCDNから実行時コードを取得せず、依存をビルド成果物に固定する。

## 5. 公開 API

### 5.1 型定義

本節は SDK 公開 API の正本の管理主体である。`MosaicLynxSDK`、`MosaicLynxActiveAccount`、`MosaicLynxDeliveryDisposition` および `MosaicLynxSigningResult` は dApp に公開する SDK 投影として本節で定義するが、Relay 通信上の契約の別スキーマではない。`MosaicLynxActiveAccount` はインターフェース §6.3 の `PublicAccountIdentity` と field-for-field に対応し、`MosaicLynxDeliveryDisposition` はインターフェース §6.3 の `DeliveryDisposition` と同じ値・意味を持つ。Relay 要求 / 応答の共通のフィールド、requiredness、共用体および通信上の意味を変更する場合はインターフェース §6 を先に更新し、SDK / 受け渡しの投影はその変更へ追跡する。

```ts
type MosaicLynxChain = 'symbol' | 'nem';
type MosaicLynxNetwork = 'mainnet' | 'testnet';

interface MosaicLynxSignTransactionParams {
  chain: MosaicLynxChain;
  network: MosaicLynxNetwork;
  payload: string;
  expectedSignerPublicKey?: string;
}

interface MosaicLynxActiveAccount {
  chain: MosaicLynxChain;
  network: MosaicLynxNetwork;
  address: string;
  publicKey: string;
}

interface SignedTransaction {
  payload: string;
  hash: string;
  signerPublicKey: string;
}

type MosaicLynxDeliveryDisposition = 'PENDING' | 'DELIVERED' | 'DELIVERY_UNKNOWN';

type MosaicLynxSigningResult<T> =
  | {
      outcome: 'succeeded';
      result: T;
      deliveryDisposition: MosaicLynxDeliveryDisposition;
    }
  | {
      outcome: 'resultUnknown';
    };

interface MosaicLynxScope {
  chain: MosaicLynxChain;
  network: MosaicLynxNetwork;
}
interface MosaicLynxSignDataParams extends MosaicLynxScope {
  purpose: string;
  data: { encoding: 'utf8' | 'hex'; value: string };
  expectedSignerPublicKey?: string;
}
type MosaicLynxCosignTransactionParams =
  | (MosaicLynxScope & { chain: 'symbol'; parentPayload: string; detached: boolean; expectedSignerPublicKey?: string })
  | (MosaicLynxScope & { chain: 'nem'; payload: string; parentPayload: string; expectedSignerPublicKey?: string });
// SignedData / MosaicLynxCosignature は共通インターフェース仕様 §9.4 / §9.6.1 の型を参照。

interface MosaicLynxSDK {
  readonly version: string;

  isAvailable(): Promise<boolean>;

  connect(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount>;
  isConnected(scope: MosaicLynxScope): Promise<boolean>;
  getActiveAccount(scope: MosaicLynxScope): MosaicLynxActiveAccount | undefined;
  refreshActiveAccount(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount | undefined>;

  disconnect(): Promise<void>;

  signTransaction(params: MosaicLynxSignTransactionParams): Promise<MosaicLynxSigningResult<SignedTransaction>>;
  signData(params: MosaicLynxSignDataParams): Promise<MosaicLynxSigningResult<SignedData>>;
  cosignTransaction(params: MosaicLynxCosignTransactionParams): Promise<MosaicLynxSigningResult<MosaicLynxCosignature>>;
}

interface MosaicLynxSDKOptions {
  diagnostics?: {
    enabled: boolean;
    onEvent?(event: MosaicLynxDiagnosticEvent): void;
  };
}

declare function createMosaicLynxSDK(options?: MosaicLynxSDKOptions): MosaicLynxSDK;
```

標準利用例は次のとおりとする。

```ts
import { createMosaicLynxSDK } from '@mosaiclynx/sdk';

const mosaicLynx = createMosaicLynxSDK();

const account = await mosaicLynx.connect({ chain: 'symbol', network: 'mainnet' });
const payload = createTransaction({ signerPublicKey: account.publicKey });

button.addEventListener('click', async () => {
  const signingResult = await mosaicLynx.signTransaction({
    chain: 'symbol',
    network: 'mainnet',
    payload,
    expectedSignerPublicKey: account.publicKey,
  });

  if (signingResult.outcome === 'resultUnknown') return;
  await announce(signingResult.result.payload);
});
```

型の別名とフィールド検証はインターフェース §9.3 / §9.4 / §9.6.1 を正本とする。SDK は SignDataParams.data を request.payload にコピーし、検証済み観測されたオリジンと対象範囲 / 目的を用い CSPRNG ノンス、issuedAt、messageExpiresAt を生成する。messageExpiresAt は issuedAt の5分後とし、request.expiresAt は request.createdAt の5分後として別に保持する。署名主体が message.expiresAt へ射影する明示対応付けはインターフェース §9.4 に従う。既存のフィールド名以外の別名は送らない。

### 5.2 公開 API の規則

- dAppは通信経路を選択、設定、判定してはならない。MosaicLynx SDKが環境に応じて選択する。
- 公開引数または返却値へ通信経路名、Relay URL、セッション ID、対応能力トークン、セッション秘密情報、拡張機能の `accountId` を含めない。
- 現行モバイル受け渡しの `appToken` は Relay エンドポイント認可認証情報であり、セッション秘密情報、要求 / 応答暗号化鍵または導出された暗号化資料ではない。SDK の公開 API へ生の認証情報を含めない。
- `payload`はsymbol-sdkが生成した小文字 / uppercaseいずれかの偶数長16進数を受け付け、内部検証前に大文字小文字以外を変換しない。デコード済みバイト長さは256 KiB以下とする。
- `expectedSignerPublicKey` は任意とする。指定された場合はチェーンの形式へ正規化した後、実際の署名主体公開鍵との完全一致を必須とする。不一致は `SIGNER_MISMATCH` とし、署名結果を返さない。
- `expectedSignerPublicKey` がない場合、拡張機能の信頼された署名主体は接続許可された現在の有効なアカウント / プロファイル内の文脈から対象を解決し、モバイルアプリは承認画面でユーザーが選択した公開アカウントの識別情報を使用する。SDK / ページは内部選択子を生成・送信しない。
- `signData()` は既存の公開 `MosaicLynxSignDataParams`（`chain`、`network`、`purpose`、`data`、任意の `expectedSignerPublicKey`）を受け取り、`MosaicLynxSigningResult<SignedData>` を返す。SDK が生成するノンスと有効期限を含む構造化されたメッセージを、既存の `RelayDataSigningRequest` の要求ペイロードとして受け渡しする。ここでいう要求ペイロードは既存の論理要求の表現であり、新しいメッセージ署名通信上のスキーマを追加しない。
- `connect()`は指定対象範囲のアクティブアカウント公開識別情報だけを返す。内部アカウント IDとプロファイル IDは返さない。
- `isConnected()`は承認UIを開かず、拡張機能の現在値またはオリジン単位で保存したモバイル公開識別情報を確認する。
- `disconnect()`は現在のオリジンに対する全対象範囲の許可を削除する。モバイルではアプリ側の削除完了後にだけWeb側キャッシュを削除する。
- 未接続対象範囲からの署名要求は`NOT_CONNECTED`とし、`signTransaction()`による暗黙接続は行わない。
- 同一MosaicLynx SDK インスタンスの同時要求は許可するが、各要求は独立した要求 IDとRelay セッションを持つ。MosaicLynx SDKは応答を要求 IDで分離する。
- `signTransaction()` は App Link を開く可能性があるため、click / tap などの利用者有効化を持つ同期的なイベントハンドラーから呼び始める。事前の非同期処理で利用者有効化を消費してから呼ぶことを対応対象としない。

`signTransaction()`、`signData()`、`cosignTransaction()` の公開返却型は `MosaicLynxSigningResult<T>` とする。通常の失敗 / 拒否は既存受け渡し §10 のエラーコードで保証を拒否し、既知の署名済み結果は `outcome: 'succeeded'` として解決し、署名主体が生成した `RESULT_UNKNOWN` は `outcome: 'resultUnknown'` として解決する。`RESULT_UNKNOWN` を例外、SDK エラーコード、通信経路失敗または内部例外へ変換してはならない。`cosignTransaction()` はインターフェース §9.6.1 の任意対応能力 / チェーン固有の結果に従い `MosaicLynxSigningResult<MosaicLynxCosignature>` を返す。既知の結果 / 不明 / 配送の意味は他署名操作と同じ。非対応対応能力は利用不能とする。

### 5.2.1 受け渡しと公開署名結果の対応付け

受け渡し応答と SDK → dApp の公開署名結果は、次の一意な対応付けを使用する。

| 受け渡し応答                                                                                   | SDK 公開結果                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `outcome: 'signed'`、`signingOutcome: 'SUCCEEDED'`、`signedTransaction`、`deliveryDisposition` | `MosaicLynxSigningResult<SignedTransaction>` の `outcome: 'succeeded'`、`result`、同じ `deliveryDisposition`        |
| `outcome: 'dataSigned'`、`signingOutcome: 'SUCCEEDED'`、`signedData`、`deliveryDisposition`    | `MosaicLynxSigningResult<SignedData>` の `outcome: 'succeeded'`、`result`、同じ `deliveryDisposition`               |
| `outcome: 'resultUnknown'`、`signingOutcome: 'RESULT_UNKNOWN'`                                 | `MosaicLynxSigningResult<T>` の `outcome: 'resultUnknown'`。署名済み結果、deliveryDisposition、errorCode は持たない |
| `outcome: 'rejected'` または `outcome: 'failed'`、`errorCode`                                  | 受け渡し §10 の既存公開エラーコードによる保証拒否                                                                   |

拡張機能 Provider パスとモバイル Relay パスは、dApp へ同じ `MosaicLynxSigningResult<T>` 意味を公開する。拡張機能 Provider が内部で別の応答表現を使用しても、SDK アダプターは署名主体が生成したな既知の結果、`RESULT_UNKNOWN` および配送処理結果の区分だけを上記の共通型へ対応付ける。SDK アダプターは `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成、推測または確定しない。

`cosigned / SUCCEEDED / cosignature / deliveryDisposition` は `MosaicLynxSigningResult<MosaicLynxCosignature>` の成功 / 結果 / 同じ処理結果の区分へ対応付けする。requestId / requestDigest と元 cosignTransaction の操作、親、対象範囲、連署者を照合する。resultUnknown は同じ共通分岐。連署済み結果を SignedTransaction 分岐に詰めない。

### 5.3 `isAvailable()`

本仕様における経路利用可能性は、現在のリリース、実行環境および既存受け渡し契約の条件を満たし、通信経路選択の候補として選択できる経路が存在することを意味する。接続、許可、アカウント情報公開、利用者承認、署名成功またはモバイルアプリのインストール済みを意味しない。

`isAvailable()` は、次の経路利用可能性の論理和で `true` を返す。

```text
isAvailable() = local_provider_route_available
              OR mobile_relay_route_available
```

ただし、`mobile_relay_route_available` は、互換性のあるローカル Provider が存在しない場合にだけ通信経路選択の候補となる。`window.mosaicLynx` が存在するが不正な形式の、互換性のない、競合するまたは現在選択不能な Provider である場合、それを Provider 不在としてモバイル Relay へ切り替えてはならない。

ローカル Provider 経路は、次の全てを満たす場合に利用可能である。

- 対応 Provider API バージョンの `window.mosaicLynx` を検出した。
- 必要メソッド、対応能力、チェーン / ネットワークおよびプロトコル互換性を検証できる。
- 現在の要求に対して拡張機能アダプターを選択できる。

モバイル Relay 経路は Provider が存在しない場合に限り、次の全てを満たす場合に利用可能である。

- 現在の SDK / プロダクトリリースでモバイル Relay が提供対象として有効である。
- 既存のモバイル Relay 機能フラグが有効であり、リリース判定 / プロダクト判定条件により経路が無効化されていない。
- 対象リリースの受信モバイルアプリが提供対象として公開されている。
- 現在の実行環境 / ブラウザがサポート対応表の対象であり、Web 暗号処理、`fetch`、ページ可視性 API および検証済み HTTPS App Link の既存受け渡し条件を満たす。

受信モバイルアプリが端末へ実際にインストールされていることは、Web 側から確実に判定できないため、モバイル Relay 経路利用可能性の必須条件にしない。インストール不可・起動不可・応答不能は、経路選択後の既存代替経路またはタイムアウト / エラー契約で扱う。

機能フラグが無効、対象リリースで未提供、リリース / プロダクト判定条件未達、受信アプリが対象リリースで未公開、実行環境非対応または必要 Web API 不足の場合、モバイル Relay 経路は利用可能性の根拠および通信経路選択の候補から除外する。本仕様の現行本番環境 `1.0.0` では、受信モバイルアプリが公開されるまでモバイル Relay 経路を無効とする。

ローカル / リモートのいずれの経路も選択できない場合に限り、`isAvailable()` は `false` を返す。Provider の存在だけで `true` にせず、Provider が存在しないことだけで `false` にしない。

`isAvailable()` はモバイルアプリがインストール済みであることを保証しない。UA / クライアント参考情報によるモバイル判定は通信経路選択の UX 参考情報であり、セキュリティ境界として使用しない。

## 6. 通信経路の自動選択

MosaicLynx SDKは接続、更新、切断、各署名ごとに次の順序で通信経路を選択する。ここでの選択可能性と `isAvailable()` の判定は §5.3 の経路利用可能性を正本とする。`isConnected()`と`getActiveAccount()`はUIを開かない。

1. `window.mosaicLynx` の存在、必要メソッド、Provider API 主要バージョン `2` を検証する。
2. 対応 Provider があれば必ず拡張機能アダプターを選択する。
3. Provider が存在せず、§5.3 のモバイル Relay 経路利用可能性（現在のリリースの有効化、機能フラグ、リリース / プロダクト判定条件、対象リリースの受信アプリ提供、実行環境および既存 Web API / 検証済み HTTPS App Link 条件）を全て満たす場合だけモバイル Relay アダプターを選択する。本番 `1.0.0` では受信アプリ公開までこの経路を選択しない。
4. ローカル / リモートのいずれも選択できない場合は `UNAVAILABLE` を返す。

`window.mosaicLynx` が存在するが API 主要バージョンが非対応の場合は格下げ代替経路を行わず `UNAVAILABLE` を返す。非対応 Provider がある状態を「Provider がない」とみなしてモバイル Relay を選択してはならない。

一度通信経路を選択した後は、同じ要求を別通信経路へ切り替えない。次の場合も自動代替経路を禁止する。

- 接続または署名をユーザーが拒否した。
- Vault がロック中である。
- Provider または Relay がエラーを返した。
- トランザクション、チェーン、ネットワーク、署名主体の検証に失敗した。
- App Link を開けなかった、または要求がタイムアウトした。

再試行は新しい利用者有効化から対象APIを呼び、新しい要求 ID、秘密情報、トークンと再承認を生成する。

### 6.1 拡張機能アダプター

拡張機能アダプターは次の処理をMosaicLynx SDK内部で行う。

1. SDKの接続、有効なアカウント更新、切断をProviderへ委譲し、ページに公開するの `PublicAccountIdentity` へ射影する。Provider の内部アカウントレコード、`accountId`、`profileId`、ウォレットストア ID、鍵枠または内容を解釈しない内部ハンドルは公開識別情報に含めず、SDK / ページに公開する Provider 間で受け渡さない。
2. 署名時に`getAccounts()`で要求対象範囲の公開アカウントの識別情報と現在の許可 / 有効なアカウントを確認し、接続された対象を解決できなければ`NOT_CONNECTED`または既存の受け渡し §10 対応付けに従う。`getAccounts()` の公開値から内部アカウント選択子を取得・生成しない。
3. `expectedSignerPublicKey` がある場合、SDK / アダプターは公開アカウントの識別情報の `publicKey` と照合する。一致しなければ `SIGNER_MISMATCH` とし、内部アカウント ID を特定・返却しない。Provider へ渡す署名主体期待値は、公開契約にある `expectedSignerPublicKey` とし、内部選択子ではない。
4. `expectedSignerPublicKey` がある場合はその公開署名主体期待値を Provider の署名要求に渡す。ない場合は `expectedSignerPublicKey` を省略し、Provider / 特権を持つホスト / 信頼された署名主体が既存の現在の許可、プロファイル内の文脈、有効なアカウントおよび必要な信頼された UI に従ってアカウントの内部参照を解決する。Provider の公開署名要求は `chain`、`network`、`payload` および任意の `expectedSignerPublicKey` の意味に従い、`accountId`、`profileId` または内容を解釈しない内部ハンドルを渡さない。SDK / ページは内部選択子を生成しない。
5. Provider から取得する論理的な署名結果は、既知の結果なら署名結果 `SUCCEEDED`、署名済み結果および署名主体が生成した `deliveryDisposition`（`PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN`）を保持する。結果ペイロードを固定版symbol-sdkのSymbol / NEM TransactionFactoryでデシリアライズし、ファサードの`verifyTransaction()` / `hashTransaction()`で署名主体、署名、ハッシュ、元要求との対応を検証したうえで、同じ署名済み結果と処理結果の区分を公開 `MosaicLynxSigningResult<SignedTransaction>` の `outcome: 'succeeded'` 分岐へ意味不変に渡す。
6. Provider が署名主体が生成した `RESULT_UNKNOWN` を返す場合、SDK アダプターは署名済み結果、deliveryDisposition および通常の errorCode を付けず、公開 `MosaicLynxSigningResult<SignedTransaction>` の `outcome: 'resultUnknown'` 分岐へ意味不変に対応付ける。SDK アダプター、Provider、保証決済、ページ配送および通信経路は `RESULT_UNKNOWN`、`PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN` を生成、推測または書き換えない。修飾のないな `SignedTransaction` / `SignedMessage` だけを返してこれらを区別できない Provider 構造は、本節の規範的な契約ではない。

接続承認と署名承認は統合せず、Provider の別々のユーザー確認として維持する。Provider のエラーは 10 章の共通エラーへ変換し、Provider / 特権を持つ RPC 固有コードを SDK 公開エラーコードとして追加しない。

### 6.2 モバイル Relay アダプター

モバイル Relay アダプターは、SDK / モバイル通信経路契約として必要な操作のセッション生成、暗号化、Relay登録、App Link起動、応答待機、復号、結果検証、受領確認 / キャンセルをSDK内部で行う。Relay マイルストーンの必須受け渡しは`signTransaction`と`signData`に限り、`connect`、`refreshActiveAccount`、`disconnect`はSDK / モバイルアカウント・セッション契約、`cosignTransaction`は任意 / 既存の SDK 契約として扱い、いずれもRelay マイルストーン阻害要因にしない。公開識別情報キャッシュは表示専用とし、署名時の認可は将来のアプリ側永続許可を正とする。

## 7. モバイル Relay プロトコル

### 7.1 論理要求

#### Relay 世代 / 世代結び付け

Relay は現在の Relay 世代文脈を持つ。世代文脈は非秘密の内容を解釈しない文脈とし、Relay 再起動、有効なセッション状態の完全消失、保存領域消失または既存状態の継続性を保証できなくなった場合に切り替える。切り替え時、旧世代の保留中のセッションは復旧せず、旧世代全体を失効させる。有効なセッション状態は受け渡しの有効期間に限る上限のある / 一時的な状態とし、ペイロード履歴または暗号文履歴を永続的な長期保存領域として保持してはならない。この要件はプロトコル意味であり、特定の保存領域エンジン、データベース / キャッシュプロダクト、永続化エンジン、プロセス実行環境または配置構成を選択するものではない。Relay の保存領域 / 配置バックエンドは [Relay 仕様の `OPEN-RELAY-002`](./relay.md#open-relay-002-保存領域バックエンド--配置構成) および適用可能な下位の実装判断権限に従う。

MosaicLynx SDK は受け渡し作成の直前に現在の世代文脈を取得し、受け渡しの `generationId` として要求 / 応答の論理結び付けおよび Relay API の作成メタデータに含める。Relay は `generationId` が現在の世代と一致する受け渡しだけを作成し、セッション / 要求識別情報をその世代に関連付ける。世代不一致、不正な形式の世代メタデータ、未対応の / 無効なプロトコルまたはバージョン、無効な期限切れ / 有効期間、無効な認可、無効なライフサイクル、重複 / 競合する有効な状態、無効な要求 / セッション / 結果対応付けなど、内容を解釈しない暗号文を復号せず判定できる構造上の失敗は安全側に拒否する。旧世代の作成要求、セッション識別情報、要求識別情報または遅延配送された要求を現在の世代の有効な受け渡しとして復活させない。Relay は内容を解釈しない暗号文の過去世代での使用履歴を判定せず、現在のメタデータを付けた旧暗号文が構造上の検証後に一時保存される可能性はあるが、それを現在の世代の有効受け渡しとして成立させてはならない。

`generationId` は `RelayRequestBase` と `RelayAAD` の認証対象に含める。したがって、世代メタデータだけを現在の値へ差し替えても、旧暗号文の AEAD 認証は成立しない。アプリ / SDK は世代不一致、AAD 結び付けまたはその他の認証失敗を安全側に拒否し、該当要求を利用者承認画面へ進めず、署名せず、成功結果を返さない。Relay の配送成功は署名成功を意味しない。再試行は新しい世代文脈、要求 / セッション識別情報、暗号化エンベロープおよび利用者承認を生成する。

MosaicLynx SDKはインターフェース仕様 §6.2 の正規 `RelayRequest` エンベロープを RFC 8785 JCSで正規化し、SHA-256 ダイジェストを計算してから暗号化する。インターフェース §6.2 の `RelayRequestBase`、`RelayOperation` および共通のフィールドは本書から参照し、本書で独立した同名型として再定義しない。

```ts
interface OriginProof {
  version: 'mosaiclynx.origin.v1';
  keyId: string;
  algorithm: 'Ed25519';
  signature: string; // パディングなしの base64url
}
```

受け渡しの操作固有のフィールドは、正規 `RelayRequest` 共用体に次のように対応する。表にないフィールド、別名、共用体分岐は追加しない。

| 操作                               | 必須操作固有のフィールド                                                          | 任意フィールド / 条件                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `connect` / `refreshActiveAccount` | `chain`、`network`                                                                | `originProof`。モバイル Mainnet の証明要件は下記の受け渡し / リリース判定判断権限に従う    |
| `signTransaction`                  | `chain`、`network`、`payload`                                                     | `expectedSignerPublicKey`、`originProof`                                                   |
| `signData`                         | `chain`、`network`、`purpose`、`nonce`、`issuedAt`、`messageExpiresAt`、`payload` | `expectedSignerPublicKey`、`originProof`                                                   |
| `cosignTransaction` / Symbol       | `chain`、`network`、`parentPayload`、`detached`                                   | `expectedSignerPublicKey`、`originProof`                                                   |
| `cosignTransaction` / NEM          | `chain`、`network`、`payload`、`parentPayload`                                    | `expectedSignerPublicKey`、`originProof`                                                   |
| `disconnect`                       | `operation`                                                                       | 対象範囲フィールドは既存受け渡し契約では持たず、`initiatorOrigin` で対象オリジンを結び付け |

`RelayRequestBase`、共通の `protocol` / `generationId` / `requestId` / `initiatorOrigin` / `createdAt` / `expiresAt`、操作列挙型および共用体の正規宣言はインターフェース §6.2 のみが所有する。上表は受け渡しが所有する操作固有の検証と web 通信経路対応付けであり、別の TypeScript 型または通信上の構造を定義しない。

モバイル Mainnet要求では`originProof`を必須とする。Mainnetの`initiatorOrigin`は公開 DNSへ解決するHTTPS・既定ポート 443に限定する。MosaicLynx SDKはrequestId生成後、同一オリジンの`POST /.well-known/mosaiclynx/sign-request`へ次のJCS オブジェクトを`Content-Type: application/json`、`credentials: "omit"`、`redirect: "error"`、`cache: "no-store"`で送る。

```ts
interface OriginProofInput {
  version: 'mosaiclynx.origin.v1';
  operation: 'connect' | 'refreshActiveAccount' | 'signTransaction' | 'signData' | 'cosignTransaction';
  requestId: string;
  initiatorOrigin: string;
  chain: 'symbol' | 'nem';
  network: 'mainnet';
  payloadHash?: string; // signTransaction のみ。復号したトランザクションのバイト列の SHA-256 を小文字の hex で表す。
  expiresAt: string;
}
```

dApp バックエンドは入力スキーマ、`initiatorOrigin`、TTLを検証し、`SHA-256(UTF8("mosaiclynx.origin.v1\0") || UTF8(JCS(OriginProofInput)))`をEd25519で署名して`OriginProof`を返す。MosaicLynx SDKは応答をそのまま信頼せず要求へ含め、アプリが独立検証する。

アプリは`${initiatorOrigin}/.well-known/mosaiclynx.json`から次のマニフェストを取得する。リダイレクト、オリジン間の、DNS rebinding、ループバック / link-local / private / 予約済みのアドレス、HTTP 格下げ、32 KiB超過を拒否する。DNS解決結果を接続先IPと照合し、取得全体を3秒でタイムアウトする。

```ts
interface OriginKeyManifest {
  version: 'mosaiclynx.origin-keys.v1';
  origin: string;
  keys: Array<{
    keyId: string;
    algorithm: 'Ed25519';
    publicKey: string;
    notBefore: string;
    notAfter: string;
    status: 'active' | 'revoked';
  }>;
}
```

マニフェストの`origin`完全一致、鍵 ID、アルゴリズム、有効期間、状態を検証する。`Cache-Control`に従う上限24時間キャッシュとし、失効鍵を受理しない。Testnetは証明なしを許容できるが「要求元未検証」を表示する。

- `requestId` は CSPRNG で生成した 128-bit 値のパディングなし base64url とする。
- `initiatorOrigin`はMosaicLynx SDK自身が`window.location.origin`から取得し、dApp引数では上書きできない。
- 日時は UTC の RFC 3339、秒精度、fraction なしとする。
- `expiresAt` は `createdAt` の5分後とし、Relay とアプリは延長しない。
- `requestDigest` は `SHA-256(JCS(RelayRequest))` の小文字 16進数とする。

### 7.2 論理応答

モバイルアプリはインターフェース仕様 §6.3 の正規 `RelayResponse` 共用体に従い、成功、拒否、検証失敗をいずれも暗号化した応答エンベロープとして返す。Relay のセッション状態からユーザーの判断結果を識別できないようにする。本節は `RelayResponseBase`、`RelayResponse`、`PublicAccountIdentity`、`DeliveryDisposition` または共通の結果共用体を再定義しない。

受け渡しの操作対応付けは次のとおりである。

| 結果                  | 必須公開フィールド                                                                              | prohibited / 判断権限                                               |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `connected`           | 正規 `account: PublicAccountIdentity`                                                           | 署名結果、`errorCode` は禁止                                        |
| `disconnected`        | 共通の応答フィールドのみ                                                                        | アカウント、署名結果、`errorCode` は禁止                            |
| `signed`              | `signingOutcome: 'SUCCEEDED'`、`signedTransaction`、正規 `deliveryDisposition`                  | アカウント、`errorCode` は禁止                                      |
| `dataSigned`          | `signingOutcome: 'SUCCEEDED'`、`signedData`、正規 `deliveryDisposition`                         | アカウント、`errorCode` は禁止                                      |
| `cosigned`            | `signingOutcome: 'SUCCEEDED'`、`cosignature: MosaicLynxCosignature`、正規 `deliveryDisposition` | アカウント、signedTransaction、signedData、errorCode は禁止         |
| `resultUnknown`       | `signingOutcome: 'RESULT_UNKNOWN'`                                                              | 署名済み結果、`deliveryDisposition`、アカウント、`errorCode` は禁止 |
| `rejected` / `failed` | 正規 `errorCode`                                                                                | 成功結果は禁止                                                      |

`RelayResponseBase`、`protocol` / `requestId` / `requestDigest` / `completedAt`、結果共用体、`PublicAccountIdentity`、`DeliveryDisposition` の型・必須性・通信上のフィールドはインターフェース §6.3 の正規宣言を使用する。受け渡しは `MosaicLynxActiveAccount` または `MosaicLynxDeliveryDisposition` を共通の契約と異なる独立型として定義しない。既存実装上の別名が必要な場合も、wire-identical な非規範的別名としてのみ扱う。

`signingOutcome` は信頼された署名主体が確定する署名 axis であり、`deliveryDisposition` は既知の署名済み結果に付随する配送 axis である。`resultUnknown` は通常の `rejected` / `failed` エラー分岐ではなく、`errorCode`、署名済み結果および deliveryDisposition を持たない。`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は受け渡し §10 の `MosaicLynxSDKErrorCode` に追加しない。

`RESULT_UNKNOWN` は、wallet-core / バインディング呼び出し中のプロセス消失など、信頼された署名主体が署名生成自体の成否を確定できない場合に限る。SDK、Provider、Relay および通信経路は、SDK タイムアウト、Relay 障害、ネットワーク失敗、応答欠如、接続解除、受信者オフライン、再接続失敗、応答配送失敗またはページ / SDK / Relay ライフサイクル消失から `RESULT_UNKNOWN` を生成・推測・確定しない。

`DELIVERY_UNKNOWN` は、署名主体が有効な署名済み結果を保持しているが、その結果の配送処理結果の区分を確定できない場合に使用する。したがって `outcome: 'signed'` / `outcome: 'dataSigned'` / `outcome: 'cosigned'`、`signingOutcome: 'SUCCEEDED'`、既知の署名済み結果および `deliveryDisposition: 'DELIVERY_UNKNOWN'` の組み合わせを許可する。SDK、Provider、Relay および通信経路はこの処理結果の区分を署名失敗、`RESULT_UNKNOWN` または通常エラーへ変換しない。

`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は配送処理結果の区分の値であり、署名ライフサイクルの状態ではない。Relay はこのフィールドの意味を生成・変更せず、応答を内容を解釈せずに搬送する。署名主体が生成した `signingOutcome` / `deliveryDisposition` は要求対応付けを維持したまま SDK、Provider および Relay を通過し、意味を失わない。

`deliveryDisposition` は Relay の保存領域 / 消費状態ではなく、署名主体が信頼されたプロトコル / 受領確認契約に基づいて確定する既知の署名済み結果の配送処理結果の区分である。署名主体が既知の署名済み結果を生成した時点で配送完了をまだ確定できない場合、初期値は `PENDING` とする。`DELIVERED` は署名主体が自身の信頼された配送契約により既存署名済み結果の配送完了を安全に確定できた場合だけ許可する。

現行モバイル Relay v1 の `SDK → response取得 → decrypt / validate → ACK → Relay response_available → consumed` は Relay の通信経路保存領域 / 消費状態であり、署名主体側の `deliveryDisposition` の判断権限ではない。モバイルアプリが SDK の受領確認を観測する reverse 受領確認契約は現行 v1 にないため、モバイル応答の初期 `deliveryDisposition` は原則 `PENDING` とし、アプリ / 署名主体は Relay 応答登録または SDK の受領確認を根拠に `DELIVERED` を生成してはならない。SDK も自身が応答を取得・受領確認できたことを根拠に `PENDING` を `DELIVERED` へ書き換えない。

したがって、`Relay ACK / consumed state != Signer-side deliveryDisposition` である。SDK は自身の通信経路完了を SDK-local ライフサイクルとして扱い、署名主体が生成した `PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN` を変更せず公開 `MosaicLynxSigningResult<T>` へ伝達する。

`failed` 応答の `errorCode` は公開可能な安定コードだけとし、パーサー、Vault、OS、暗号ライブラリの内部詳細を含めない。`RESULT_UNKNOWN` や `DELIVERY_UNKNOWN` を `INTERNAL_ERROR`、通信経路失敗または `failed` に縮退させてはならない。

### 7.3 フロー

```text
dApp
  → MosaicLynxSDK.connect / signTransaction / 接続解除
  → MosaicLynx SDK が requestId / sessionId / 秘密情報 / tokens を生成
  → RelayRequest を正規化、ダイジェスト、暗号化
  → Relay に暗号文を登録
  → 検証済み App Link で MosaicLynx アプリを起動
  → アプリが暗号文を取得、復号、操作別に検証
  → アプリで接続アカウント選択、署名内容確認、または切断を明示承認
  → アプリが接続・署名・切断・拒否または resultUnknown 結果を暗号化して Relay へ登録
  → 元ページの MosaicLynx SDK が応答を取得、復号、整合性を検証
  → MosaicLynx SDK が ACK 後に既知の署名済み結果（署名主体が生成した deliveryDisposition 付き）を `outcome: 'succeeded'` として解決、resultUnknown を `outcome: 'resultUnknown'` として解決、または共通エラーとして拒否
  → dApp が必要に応じてアナウンス
```

MosaicLynx SDKはApp Linkを現在の閲覧文脈から開く。アプリがインストール済みの正常系では新しいブラウザタブを作らない。アプリ未導入時のHTTPS 代替経路は正常な署名フローではなく、代替経路ページはフラグメントをネットワーク、ログ、利用状況分析へ送らず、URLから直ちに除去して導入案内を表示する。

App Link は次の形式とする。

```text
https://link.mosaiclynx.app/v1/handoff/{sessionId}#s={sessionSecret}&a={appToken}
```

- `sessionId` は 128-bit CSPRNG 値のパディングなし base64url とする。
- `sessionSecret` と `appToken` は各 256-bit CSPRNG 値のパディングなし base64url とする。
- `appToken` は Relay エンドポイント認可認証情報であり、`sessionSecret` は E2E セッション秘密情報である。両者は別分類であり、フラグメントは検証済みクライアント側の受け渡しとして正規モバイルアプリへ一時的に渡すためだけに使う。
- フラグメント自体は Relay へ送信せず、HTTP 要求、Referer、サーバーアクセスログ、アプリケーションログ、利用状況分析、遠隔計測データ、診断情報、エラー / 異常終了報告、クリップボードまたはブラウザ保存領域に含めない。アプリが取得した `appToken` を Relay API の `Authorization` ヘッダーへ必要最小限だけ設定することは、フラグメント自体の送信とは別のエンドポイント認可境界である。
- 検証済み App Link または代替経路がブラウザ文脈を保持・生成する場合、認証情報を含むフラグメントをブラウザ履歴に継続保持せず、必要な処理後に `history.replaceState()` 等で URL / 閲覧文脈から除去する。
- アプリは方式、ホスト、パス、ID とフラグメントの形式を strict 検証し、未知フィールド、重複フィールド、過剰長を拒否する。
- iOS は Associated Domains、Android は Digital 資産リンクにより `link.mosaiclynx.app` と正規アプリを関連付ける。独自の URL 方式は v1 の標準経路にしない。
- HTTPS 代替経路ページはthird-party スクリプト、利用状況分析、サービスワーカーを持たず、`default-src 'none'; script-src`を固定したハッシュ付きfirst-party bootstrapだけに限定する。bootstrapは最初の同期処理でフラグメントをstrict 解析し、認証情報を正規アプリ以外へ転送せず、必要な導入判定後に`history.replaceState()`でフラグメントを除去する。フラグメント、セッション ID、トークンをDOM、ブラウザ保存領域、永続的な履歴、クリップボード、診断情報またはエラー報告へ渡さず、必要な処理後にURL / 閲覧文脈から除去する。

### 7.4 アプリの署名前検証

アプリはコアとチェーンアダプターを再利用し、プロダクト仕様 12.4 のトランザクション許可リストと上限を適用する。最低限、次をすべて満たすまで承認画面を表示しない。

- Relay プロトコル、スキーマ、要求 ID、日時、TTL が有効である。
- AEAD の認証に成功し、要求ダイジェストが再計算結果と一致する。
- ペイロードのデコード済みバイト長さが 256 KiB 以下である。
- チェーン、ネットワーク、トランザクション型 / バージョン、全フィールド、内部トランザクションを解析できる。
- デコード後の正規シリアライズが元ペイロードとバイト単位で一致するで一致する。
- `expectedSignerPublicKey` がある場合、選択可能なアカウントと一致する。
- Mainnetでは`originProof`が同一オリジンのwell-known マニフェストに登録された未失効鍵で検証できる。
- 同一要求 / プロファイル内の文脈に対する認証、署名可能な状態へのロック解除、アカウントの利用認可および利用者による明示的な承認の4条件が成立している。

`initiatorOrigin` は Relay による改ざんからAEADで保護されるだけでは、ブラウザの実際のオリジンを証明しない。アプリはMainnetで上記`originProof`を検証し、成功時だけ「登録鍵で検証済み」と表示する。Testnetで証明がない場合は「要求元（未検証）」として正規 / Punycode表記を表示し、拡張機能承認画面の検証済みオリジンと同じ保証があるように表示しない。Relay の受信・配送、SDK / Provider 状態、通常の `UNLOCKED`、wallet-core パスワード / ストア検証または接続 / 許可は、この4条件の代替ではない。

### 7.5 モバイル署名主体保証と Mainnet 判定条件判断権限

モバイル v1 の受け渡しは、Symbol / NEM の生の署名対応能力を OS の特定ハードウェア API、OS バージョン、ラップアルゴリズム、証明 level または直接のハードウェア署名へ自動的に写像しない。受け渡しは未承認のプラットフォーム対応能力、バックアップ / 復元条件またはハードウェア選択を現在の契約として固定せず、実際に承認されたプラットフォーム / リリース契約の結果だけを受け取る。

モバイル Mainnet の受け渡しでは、`originProof` の検証と現在のリリース / 根拠判定条件の結果を署名主体が確認する。判定条件状態、プラットフォーム対応能力、サポートポリシー、プロファイル / アカウント文脈、四条件または必要な証明を確認できない場合は Mainnet 署名を有効化せず、Testnet 専用の安全な経路を維持する。Relay 配送、SDK 利用可能性、OS 利用可能性、wallet-core 署名成功またはアプリ起動成功を判定条件の代替にしない。

次の厳密な選択は本書の責任主体ではない。

- OS バージョン、端末範囲、安全な Enclave / Keystore / StrongBox、証明、ルート / jailbreak signal、利用者存在および Vault ラップの具体条件はモバイル要件 / 設計とプラットフォーム対応能力契約に委譲する。
- プロファイルバックアップ / 復元、端末移行およびバックアップ検証の契約はプロファイル / アカウント仕様 `OPEN-PROFILE-001` とモバイル `MOB-OPEN-006` / `MR-OPEN-006` に委譲する。未決のバックアップ契約を Mainnet 判定条件の現在の必須条件として推測しない。
- モバイルリリース証跡のプラットフォーム対応表、対応能力報告書、実行環境強制およびストア条件は `MR-OPEN-008` / `MOB-OPEN-008`、リリース判断権限および現在の根拠ポリシーに委譲する。

これらの委譲は、欠落 / 無効な / 期限切れ / 検証不能の / 不明な判定条件状態で Mainnet を安全側に終了する要件、Testnet 専用継続、信頼された UI、四条件、wallet-core 境界および秘密情報の分離を弱めない。直接ハードウェア署名を提供する場合は、チェーン固有の固定ベクター、インポート、証明、署名バイト整合性を含む別の承認済み仕様が必要であり、本書はその対応能力を現行 v1 として扱わない。

- 生体認証 / 端末認証情報はOSの利用者の立ち会い判定条件として署名要求ごとに使用する。生体認証データ、パスコード、assertionをWebまたはRelayへ返さない。
- rooted / jailbroken判定、ハードウェア証明失敗、画面 overlay / アクセシビリティ悪用検知はリスク signalとして表示・ポリシー評価するが、単一のheuristicだけで鍵を削除しない。
- アプリバックグラウンド、端末ロック、画面取得開始、5分タイムアウト、メモリ警告、操作キャンセルで秘密情報ハンドルを無効化する。Mainnet署名画面ではOSの画面取得抑止APIを利用可能な範囲で有効にする。

署名実装の正本は [wallet-core 統合](./wallet-core-integration.md)。署名主体が意味上の検証・承認後に正式 `sign` を呼ぶ。SDK / Relay は生の署名、鍵取得、秘密情報を含む暗号処理を行わない。

## 8. E2E 暗号化

### 8.1 鍵導出

MosaicLynx SDKとアプリはセッション秘密情報から次の二つのAES 鍵を導出する。

```text
salt = SHA-256(UTF8("mosaiclynx.relay.v1\0" + sessionId))
requestKey  = HKDF-SHA-256(sessionSecret, salt, UTF8("request"), 32)
responseKey = HKDF-SHA-256(sessionSecret, salt, UTF8("response"), 32)
```

セッション秘密情報、導出鍵、生の `appToken` は永続保存領域、URL パス / 照会、ログ、遠隔計測データ、診断情報、エラーへ保存しない。`sessionSecret` と `appToken` を含むフラグメントは検証済みクライアント側の受け渡しに限って一時使用し、Web ページではMosaicLynx SDK インスタンスのメモリだけに保持する。アプリが`appToken`を取得した後はフラグメントをURL / 閲覧文脈から除去し、完了、キャンセル、タイムアウト、ページ破棄時に参照を破棄する。

### 8.2 暗号形式

要求と応答は AES-256-GCM で暗号化する。

```ts
interface EncryptedRelayEnvelope {
  algorithm: 'A256GCM';
  nonce: string;
  ciphertextAndTag: string;
}
```

- ノンスは暗号化ごとに CSPRNG で生成した 96-bit 値とし、パディングなし base64url で表現する。
- `ciphertextAndTag` は Web 暗号処理が返す暗号文と 128-bit 認証タグの連結をパディングなし base64url で表現する。
- 平文は論理要求 / 応答を JCS 正規化した UTF-8 バイト列とする。
- 要求と応答で必ず別鍵を使用し、同じ鍵とノンスの組み合わせを再利用しない。

AAD は次のオブジェクトを JCS 正規化した UTF-8 バイト列とする。

```ts
interface RelayAAD {
  protocol: 'mosaiclynx.relay.v1';
  generationId: string;
  sessionId: string;
  direction: 'request' | 'response';
  expiresAt: string;
}
```

アプリ / SDK は世代 ID、セッション ID、方向、期限切れ、または暗号文の差し替えを AEAD 認証失敗として拒否する。Relay は現在の世代メタデータ、ライフサイクル、認可およびエンベロープ外形を検証するが、内容を解釈しない暗号文の内部認証状態は検証しない。世代不一致と復号エラーの詳細は外部へ返さず、安全な共通エラー（`CONTEXT_CHANGED`、`INVALID_RESPONSE` または `INTERNAL_ERROR`）へ正規化する。

Relay はこの仕様で定義する要求 / 応答の平文を扱わず、`EncryptedRelayEnvelope` と受け渡しに必要な最小限の安全なメタデータだけを内容を解釈しないとして保持・受け渡しする。Relay の API 応答、保存領域、バックアップ、ログ、診断情報、利用状況分析、遠隔計測データに平文を露出させず、Relay 運用者やログ出力基盤が通常経路で取得できるようにしてはならない。復号、操作の意味解釈、表示、承認および署名はアプリ / 署名主体の責任である。

## 9. Relay HTTP API

### 9.1 共通要件

- オリジンは`https://relay.mosaiclynx.app`、API 接頭辞は`/v1`に固定し、MosaicLynx SDK optionやdApp引数で変更できない。以下のエンドポイント表記はこのオリジンに対する絶対パスである。
- TLS 1.2 以上を必須とし、HSTS を有効にする。
- Cookie、HTTP 認証、利用者アカウント、トランザクション ID 追跡を使用しない。
- 認証情報を必要とするエンドポイントは `Authorization: Bearer {capabilityToken}` を使用する。
- トークンは256-bit CSPRNG値とし、Relay は `SHA-256(token)` だけを保存して constant-time 比較する。
- 応答に `Cache-Control: no-store` と `Referrer-Policy: no-referrer` を付ける。
- ブラウザ API は認証情報なしの CORS を許可し、許可メソッド / ヘッダーを必要最小限にする。cookie を許可しない。
- SDKとアプリはデコード済みトランザクションを256 KiB以下に制限し、Relayは暗号文を復号できないためこの値を直接検査しない。Relayとreverse proxyは暗号化HTTP 本文を生バイトで512 KiB以下に制限する。
- RelayはIPと1分の時間窓ごとの作成数・総バイト数を頻度上限する。自己ホストMVPの既定値は10件/分かつ4 MiB/分とし、無効な作成要求も加算する。値は運用設定で変更できるが、既存セッションの取得、応答、受領確認、キャンセルへ作成用上限を適用しない。
- エラー応答は要求本文、トークン、セッションの存在を推測できる詳細を返さない。

Relay は `GET /v1/generation` で現在の世代文脈の非秘密な `generationId` を返す。MosaicLynx SDK はこの値を受け渡し作成の直前に取得し、別受け渡しのために再利用しない。Relay 再起動、状態消失または状態継続性消失の後は新しい `generationId` を返し、旧値を現在の文脈として受理しない。

```http
GET /v1/generation
```

```ts
interface RelayGenerationContext {
  protocol: 'mosaiclynx.relay.v1';
  generationId: string;
}
```

### 9.2 セッションの作成

```http
POST /v1/handoffs
Content-Type: application/json
```

```ts
interface CreateHandoffRequest {
  protocol: 'mosaiclynx.relay.v1';
  generationId: string;
  sessionId: string;
  requestId: string;
  expiresAt: string;
  appTokenHash: string;
  webTokenHash: string;
  request: EncryptedRelayEnvelope;
}
```

MosaicLynx SDKがRelayから現在の世代文脈を取得し、セッション ID、両トークンとトークンハッシュを生成するため、要求暗号化とRelay登録を一回の要求で行える。Relayは世代 ID が現在の世代と一致すること、IDの形式、一意性、期限、本文サイズ、アルゴリズムとエンベロープの外形、認可、ライフサイクルおよび対応付けだけを検証し、暗号文を復号しない。世代不一致または旧世代の作成要求はセッションを作成せず拒否する。現在の世代メタデータを付けた旧暗号文は、Relay が内容を解釈しない暗号文の過去利用を判定できないため、外形等が妥当なら保存領域へ一時保存される可能性があるが、現在の世代の有効な受け渡しとはならない。アプリは取得した要求を現在の generationId の AAD で検証し、旧暗号文の AEAD 認証失敗を承認・署名・成功に進めない。

成功時は`201 Created`と`{ protocol, sessionId, expiresAt }`だけを返す。RelayはMosaicLynx SDKが指定した期限切れを変更してはならず、受理できない場合はセッションを作成せず拒否する。IDが既存の場合は`409 Conflict`とし、新しいIDで最初からやり直して既存セッションを更新しない。スキーマまたは期限切れ不正は`400 Bad Request`、本文超過は`413 Content Too Large`、頻度上限は`429 Too Many Requests`とする。

### 9.3 アプリによる要求取得

```http
GET /v1/handoffs/{sessionId}/request
Authorization: Bearer {appToken}
```

成功時は`200 OK`で要求エンベロープ、プロトコル、セッション ID、期限切れを返す。同じアプリトークンによる期限内の再取得は冪等とする。存在しない、トークン不一致、キャンセル済み、期限切れは同じ`404 Not Found`と共通エラー本文を返す。

### 9.4 アプリによる応答登録

```http
PUT /v1/handoffs/{sessionId}/response
Authorization: Bearer {appToken}
If-None-Match: *
Content-Type: application/json
```

本文は`EncryptedRelayEnvelope`とする。`pending → response_available`のcompare-and-setに成功した最初の一回だけを`204 No Content`で受理する。同じエンベロープ値の再送は`204`、異なる暗号文による二重応答は`409 Conflict`、トークン不一致、キャンセル / 期限切れ後は共通`404 Not Found`とする。

### 9.5 Web による応答待機

```http
GET /v1/handoffs/{sessionId}/response?wait=25
Authorization: Bearer {webToken}
```

Relayは`wait`の整数値0〜25を受け付け、最大25秒のlong ポーリングを許可する。応答がなければ`204 No Content`、あれば`200 OK`で応答エンベロープを返す。不正な照会、トークン不一致、キャンセル / 期限切れ後は共通`404 Not Found`とする。MosaicLynx SDKはページ可視性とネットワーク状態を考慮し、即時再接続ループを避け、1秒から最大5秒までbackoffする。期限切れを超えてポーリングしない。

### 9.6 受領確認とキャンセル

```http
POST /v1/handoffs/{sessionId}/ack
Authorization: Bearer {webToken}

DELETE /v1/handoffs/{sessionId}
Authorization: Bearer {webToken}
```

MosaicLynx SDKは応答の復号と全検証に成功した後だけ受領確認する。受領確認は`response_available → consumed`へ遷移し、Relayはセッションデータを直ちに削除する。`DELETE`は未完了セッションを`cancelled`として削除する。受領確認 / キャンセルは外形が妥当な要求へ常に`204 No Content`を返すが、正しいWeb トークンの場合だけ状態を変更する。これにより削除後の再試行を冪等にし、セッションの存在やトークン一致を応答から判別させない。

### 9.7 状態遷移と削除

```text
pending → response_available → consumed
   ├────────────────────────→ cancelled
   └────────────────────────→ expired
response_available ─────────→ expired
```

- `consumed`、`cancelled`、`expired` は終端状態である。
- 期限切れは作成から5分を超えず、クライアント要求による延長を許可しない。
- 終端遷移時に要求 / 応答暗号文、トークンハッシュ、セッションメタデータを有効な保存領域から削除する。
- 非同期削除のために削除記録が必要な場合、セッション ID の keyed ハッシュ、終端状態、削除期限だけを最大24時間保持できる。トークンハッシュ、暗号文、オリジン、要求 ID は削除記録に含めない。
- 暗号文をバックアップ、利用状況分析、APM ペイロード、アプリケーションログに含めない。

Relay 再起動、状態消失または保存領域消失により旧状態が失われた場合、Relay は世代文脈を切り替え、旧世代の要求 / セッションを復旧しない。旧 generationId の作成要求、旧要求識別情報、旧セッション識別情報または状態消失前の有効なセッションは現在の世代の有効セッションとして再開・復活させない。Relay は過去暗号文の履歴判定を要求されず、旧暗号文に現在の generationId メタデータを付けた作成が外形等を満たす場合の一時保存は許容される。アプリが要求を取得すると、現在の generationId を用いて AAD を再構成し、旧暗号文が旧世代 AAD で生成されたことによる AEAD 認証失敗を検出する。アプリはその要求を承認画面へ進めず、署名せず、成功結果を返さない。Relay 配送成功も署名成功として扱わない。再試行は新しい世代文脈、要求 / セッション識別情報、通信経路認可文脈、暗号化エンベロープおよび新しい利用者承認を伴う新しい署名要求として開始する。

受け渡しのプロトコル契約は、セッション状態遷移、応答登録、受領確認、キャンセル、期限切れおよび終端削除が論理的なに一貫して成立し、競合により重複成功、terminal-state 再利用、セッション間の変更、競合する応答または消費済み状態復活が発生しないことを要求する。この原子性は Relay が満たすべき論理的な要求であり、特定の保存領域エンジン、データベース / キャッシュプロダクト、CAS、ロック、キュー、ブローカー、スクリプト、プロセス実行環境または配置構成を指定しない。Relay の保存領域 / 配置バックエンドの選択は [Relay 仕様の `OPEN-RELAY-002`](./relay.md#open-relay-002-保存領域バックエンド--配置構成) および適用可能な下位の実装判断権限に委譲する。

期限切れおよび保持期限はプロトコル意味として一意でなければならず、期限切れを超えた状態を有効な受け渡しとして扱ってはならない。再起動、保存領域 / プロセス / インスタンス / クラスター状態消失または継続性消失の後に期限切れ / 古くなった状態を復活させず、利用者に知らせない復旧を行わない。状態継続性を保証できなくなった場合は世代を切り替え、旧世代の保留中のセッションを現在の状態として復旧しない。再試行は新鮮な世代、要求 / セッション識別情報、通信経路認可文脈、暗号化エンベロープおよび新しい利用者承認を伴う新しい受け渡しとする。

Relay は `EncryptedRelayEnvelope` と受け渡しに必要な最小限の非秘密メタデータだけを内容を解釈せずに扱い、暗号文を復号せず、平文のトランザクション / メッセージ / 署名済み結果、セッション秘密情報または意味上の意味を保持・解析しない。内部保存領域鍵、ログ、診断情報、バックアップ、利用状況分析または遠隔計測データは生のセッション識別子、生の IP、認証情報 / トークン、E2E 秘密情報、平文または暗号文全文を不用意に露出させてはならない。検証用表現、保存領域配置および保持 / 削除の具体方式は Relay 仕様と適用可能な下位の実装判断権限に従う。有効な状態は上限のある / 一時的なに保ち、終端削除、長期ペイロード / 暗号文履歴の非保持、バックアップ / 利用状況分析 duplication の禁止および状態消失安全側での終了を維持する。

全API 応答は`Cache-Control: no-store`、`Referrer-Policy: no-referrer`、HSTS、`X-Content-Type-Options: nosniff`を返す。CORSは`Access-Control-Allow-Origin: *`、認証情報なしとし、メソッドおよび`Authorization`、`Content-Type`、`If-None-Match`だけを許可する。4xx / 5xx 本文は状態によらず`{ "error": "RELAY_REQUEST_REJECTED" }`へ統一し、要求ログ出力を無効にする。

## 10. エラーの抽象化

```ts
type MosaicLynxSDKErrorCode =
  | 'USER_REJECTED'
  | 'UNAVAILABLE'
  | 'NOT_CONNECTED'
  | 'APP_NOT_INSTALLED'
  | 'VAULT_LOCKED'
  | 'REQUEST_EXPIRED'
  | 'INVALID_PARAMS'
  | 'INVALID_TRANSACTION'
  | 'UNSUPPORTED_TRANSACTION'
  | 'CHAIN_MISMATCH'
  | 'NETWORK_MISMATCH'
  | 'SIGNER_MISMATCH'
  | 'CONTEXT_CHANGED'
  | 'INVALID_RESPONSE'
  | 'INTERNAL_ERROR';

class MosaicLynxSDKError extends Error {
  readonly code: MosaicLynxSDKErrorCode;
}
```

MosaicLynx SDKは通信経路固有エラーを次の共通規則で正規化する。

| 状況                                                     | コード                                |
| -------------------------------------------------------- | ------------------------------------- |
| 接続または署名をユーザーが拒否                           | `USER_REJECTED`                       |
| 対応通信経路がない                                       | `UNAVAILABLE`                         |
| 対象対象範囲へ接続されていない                           | `NOT_CONNECTED`                       |
| OS が未導入を確定、または管理代替経路ページが通知        | `APP_NOT_INSTALLED`                   |
| 未導入を確定できず TTL 到達                              | `REQUEST_EXPIRED`                     |
| Vault がロックされ、フロー内で解除されなかった           | `VAULT_LOCKED`                        |
| 要求スキーマ、サイズ、エンコーディングが不正             | `INVALID_PARAMS`                      |
| トランザクションが不正または非正規                       | `INVALID_TRANSACTION`                 |
| 許可リスト外の型 / バージョン                            | `UNSUPPORTED_TRANSACTION`             |
| チェーン / ネットワーク不一致                            | `CHAIN_MISMATCH` / `NETWORK_MISMATCH` |
| 期待される / 選択済みの / actual 署名主体不一致          | `SIGNER_MISMATCH`                     |
| ページ遷移、ページ破棄、権限・状態変更                   | `CONTEXT_CHANGED`                     |
| 応答の AEAD、ダイジェスト、要求 ID、ペイロード対応が不正 | `INVALID_RESPONSE`                    |
| 外部へ詳細を公開しない失敗                               | `INTERNAL_ERROR`                      |

RelayのHTTP 状態、URL、トークン、暗号エラー、Provider内部例外、スタック追跡はMosaicLynx SDK エラーメッセージに含めない。`cause`を本番ビルドの公開エラーへ保持しない。

`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は、上表のエラーコードではなく §7.2 の結果 / 配送意味である。`RESULT_UNKNOWN` を `INTERNAL_ERROR`、`CONTEXT_CHANGED`、通信経路失敗またはその他のエラーコードへ縮退させてはならない。`DELIVERY_UNKNOWN` は既知の署名済み結果を保持した `SUCCEEDED` 応答に付随し、署名失敗、`RESULT_UNKNOWN` またはエラーコードへ変換してはならない。SDK / Provider / Relay は署名主体が生成した値を対応付け / 通信経路 / スキーマ検証の範囲で意味不変に通過させる。

`signData` を含む v1 対象操作が未対応の、期限切れ、リプレイ、検証不能または利用者拒否になった場合、SDK は署名結果を返さず受け渡し §10 の共通エラーとして扱う。署名生成が不明の場合は §7.2 の `resultUnknown` 応答として保持し、共通エラー、別操作の成功または自動代替経路として返してはならない。

## 11. ページライフサイクルと UX

- MosaicLynx SDKは要求開始時の`window.location.origin`と最上位の文書を保持する。
- iframe、内容を解釈しないオリジン、`file:`、`data:`、ブラウザ内部ページからモバイル Relay を開始しない。
- 応答待機中にオリジンが変わるページ遷移、ページ破棄、MosaicLynx SDK キャンセルが発生した場合はRelayをキャンセルし、結果を返さない。
- 文書がバックグラウンドになってもセッションは期限切れまで待機できる。復帰時に要求 ID と期限切れを再検証する。
- アプリからブラウザを開き直すコールバックリンクは使用しない。元ページが Relay 応答を待機取得する。
- App Link 起動ボタンには MosaicLynx アプリが開くこと、要求が5分で期限切れになることを表示する。
- アプリがロック中の場合、アプリ内でロック解除する。Web ページにパスワード、passkey assertion、生体認証データを入力または返却させない。
- 署名主体がコア署名を一度も呼んでいないと確実に把握する呼び出し前タイムアウト / キャンセルだけは署名未開始として期限切れ / キャンセル済みを確定できる。アプリ終了 / 保証タイムアウト / 通信経路タイムアウト自体は未署名の証明ではない。
- 署名呼び出し後に完了 / 生成失敗を署名主体が確定できない場合は RESULT_UNKNOWN。有効な署名済み結果を既に確認した場合は成功を維持し、署名主体が配送成否を確定できない場合は DELIVERY_UNKNOWN とする。成功後のキャンセルは署名を取り消さない。
- SDK / Provider / Relay は待機失敗を transport_failure として扱い、署名主体の RESULT_UNKNOWN / DELIVERY_UNKNOWN を生成・推測しない。呼び出し元再試行は承認ではなく、requestId に結び付けした重複 / 改ざん検査と新鮮な承認を適用する。不確定状態から自動再署名しない。

## 12. 診断情報とプライバシー

診断情報は既定で無効とする。有効時も次の許可リストだけを通知できる。

```ts
interface MosaicLynxDiagnosticEvent {
  phase: 'transport_selected' | 'approval_requested' | 'response_received' | 'completed' | 'failed';
  transport: 'extension' | 'mobile-relay';
  timestamp: string;
  errorCode?: MosaicLynxSDKErrorCode;
}
```

診断情報、Relay ログ、遠隔計測データにペイロード、署名済みペイロード、ハッシュ、公開鍵、オリジン、要求 ID、セッション ID、トークン、秘密情報、URL、暗号文を含めない。MosaicLynx SDKは診断情報コールバックの例外を署名フローへ伝播させない。

## 13. セキュリティ要件

- Relay は機密性、完全性、真正性の信頼点にしない。Relay の侵害時もトランザクションと署名結果を復号・改ざんできないことを設計目標とする。
- App Link ドメインと正規アプリの関連付けファイルを TLS、変更承認、監視で保護する。
- アプリ / SDK / Provider は [インターフェース §12.0](./interfaces.md) の上限のあるスナップショット / own-data 正規化を完了した不変 DTO だけを使用し、プロトタイプ pollution、getters / 継承した properties、depth・サイズ超過、重複鍵、未知アルゴリズムを拒否する。検証済み外部オブジェクトを再読み取りしない。
- 対応能力トークン（現行仕様の `appToken` を含む）は Relay エンドポイント認可認証情報として扱い、URL パス / 照会、Referer、ログ、クリップボードへ不要に出さない。検証済みクライアント側の受け渡しのフラグメントに一時的に置く場合も、フラグメント自体を HTTP 要求、Relay、ブラウザ保存領域、履歴、利用状況分析、遠隔計測データ、診断情報、エラー / 異常終了報告へ送らず、正規アプリ以外へ転送しない。
- 全体 App Link をクリップボード、利用状況分析、異常終了報告書、ブラウザ保存領域へ保存しない。
- Relay は要求本文を WAF / APM が記録しない設定とし、アクセスログから認可ヘッダーと照会を除外する。
- 要求 / 応答の AEAD 検証前に平文を UI、ログ、ドメインオブジェクトとして扱わない。
- 署名済み応答は元要求ダイジェスト、チェーン、ネットワーク、期待される署名主体と照合し、別要求へ転用しない。
- `RESULT_UNKNOWN` は信頼された署名主体が生成した `resultUnknown` 応答だけで表し、SDK タイムアウト、Relay / ネットワーク失敗、応答欠如、Provider 接続解除、受信者オフライン、ページ / SDK / Relay ライフサイクル消失または配送失敗から生成しない。
- `DELIVERY_UNKNOWN` は信頼された署名主体が保持する既知の署名済み結果に付随する deliveryDisposition として保持し、既存結果の再送 / 再配送 / 取得 / 照会と署名再試行 / 再署名を分離する。
- MosaicLynx SDKは受領した署名済みペイロードを固定版symbol-sdkでデシリアライズ / 検証し、元未署名のトランザクションとチェーン規則上対応することを検証する。MosaicLynx SDK独自のcatbuffer、署名、ハッシュ実装は使用しない。
- Web ページ自身の侵害、悪意ある dApp、端末 OS、アンロック中アプリ、正規配布成果物の侵害は E2E Relay 暗号化の保証範囲外である。
- 開始主体オリジン文字列だけを検証根拠にしない。Mainnetはオリジン証明を必須とし、Testnetで証明がない場合だけ未検証と表示する。証明はオリジンの登録鍵による要求整合性を示すもので、サイト運営主体の善性、トランザクションの安全性、Web ページ非侵害までは保証しない。

## 14. 受け入れ条件とテスト

### 14.1 MosaicLynx SDK 契約テスト

- 同じ `signTransaction()` 呼び出しが拡張機能とモバイル Relay の両方で `MosaicLynxSigningResult<SignedTransaction>` を返し、既知の署名済み結果と `RESULT_UNKNOWN` を区別できる。
- 同じ `signData()` 呼び出しが拡張機能とモバイル Relay の両方で `MosaicLynxSigningResult<SignedData>` を返し、メッセージ署名がトランザクション署名として扱われない。
- 受け渡しの `signed` / `dataSigned` / `cosigned`、`resultUnknown`、`rejected` / `failed` が、公開署名結果の成功、resultUnknown、保証拒否へ一意に対応付けされる。
- `outcome: 'succeeded'` は既知の署名済み結果と署名主体が生成した `deliveryDisposition` を保持し、`DELIVERY_UNKNOWN` でも `result` を破棄しない。
- `outcome: 'resultUnknown'` は署名済み結果、deliveryDisposition、通常の errorCode を持たない。
- 拡張機能 Provider パスとモバイル Relay パスが同じ公開署名結果意味を持ち、SDK アダプターが処理結果の区分を生成・推測・確定しない。
- `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` の判断権限が署名主体側のに限定され、Relay 受領確認 / 消費済み状態と混同されない。
- SDK の応答取得・受領確認成功が署名主体が生成した `PENDING` を `DELIVERED` に変更しない。
- 公開 API に通信経路固有の option、認証情報、`accountId` がない。
- Provider が存在する場合は Relay セッションを作成しない。
- Provider がなく、§5.3 の現在のリリース、機能フラグ、リリース / プロダクト判定条件、対象リリースの受信アプリ提供、実行環境、Web API および検証済み HTTPS App Link 条件を全て満たす対応モバイルブラウザだけがモバイル Relay を選択する。
- Provider がない desktop / 非対応環境は `UNAVAILABLE` を返す。
- 拒否、失敗、タイムアウト後に通信経路を切り替えない。
- 接続、接続確認、有効なアカウント更新、切断が両通信経路で同じ公開識別情報契約を持つ。
- 未接続の署名要求は両通信経路で`NOT_CONNECTED`になる。
- `expectedSignerPublicKey` が両通信経路で同じ意味を持つ。
- Provider / Relay固有エラーが共通MosaicLynx SDK エラーへ変換される。
- `resultUnknown` が `errorCode` を持たず、`signingOutcome: 'RESULT_UNKNOWN'` として検証できる。
- `signed` / `dataSigned` / `cosigned` が既知の署名済み結果、`signingOutcome: 'SUCCEEDED'` および `deliveryDisposition` を保持し、`DELIVERY_UNKNOWN` を失敗 / `RESULT_UNKNOWN` へ変換しない。
- SDK タイムアウト、Relay 障害、応答欠如、接続解除、ページ / SDK / Relay ライフサイクル消失または配送失敗から `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測しない。
- `SUCCEEDED + DELIVERY_UNKNOWN` の復旧が既存結果の再送 / 再配送 / 取得 / 照会に限定され、新しい署名または代替の経路を生成しない。
- 診断情報が既定無効で、許可リスト外の情報を通知しない。

### 14.2 暗号処理テスト

- JCS、要求ダイジェスト、HKDF、AAD、AES-GCM の固定ベクターを Web とアプリの双方で共有する。
- 要求 / 応答鍵の取り違えを拒否する。
- ノンス、暗号文、タグ、セッション ID、方向、期限切れの各改ざんを拒否する。
- 別セッションの応答、要求 ID 不一致、ダイジェスト不一致、リプレイを拒否する。
- `signData` の要求 / `dataSigned` 応答の要求 ID、ダイジェスト、メッセージ、署名主体および操作対応を検証し、不一致を拒否する。
- 乱数生成失敗時はセッションを作成せず安全に失敗する。
- セッション秘密情報とトークンが URL 照会、フラグメント以外のHTTP 要求、Referer、ログ、保存領域、利用状況分析、遠隔計測データ、診断情報またはエラー報告に現れない。検証済み App Link フラグメントの`appToken`をアプリが取得後に認可ヘッダーでRelay エンドポイントへ使用することは許容するが、フラグメント自体は送信しない。

### 14.3 Relay 統合テスト

- first-write-wins と全状態遷移を compare-and-set で保証する。
- トークン不一致、トークン役割の取り違え、二重応答、期限後応答を拒否する。
- long ポーリング、ネットワーク切断、再試行、受領確認、キャンセルが冪等に動作する。
- 256 KiB デコード済みペイロード、512 KiB HTTP 本文の境界値と超過を試験する。
- 受領確認、キャンセル、期限切れ後に暗号文とトークンハッシュが削除される。
- バックアップ、アプリケーションログ、APM、アクセスログに禁止データが含まれない。
- Relay が要求 / 応答を内容を解釈しないとして扱い、平文が API 応答、保存領域、バックアップ、ログ、診断情報、利用状況分析、遠隔計測データに現れない。
- Relay 構造上の拒否として、旧 generationId、世代不一致、不正な形式の世代メタデータ、無効なライフサイクル、無効な認可、重複有効な状態、無効な対応付けの障害注入を行い、Relay がセッションを作成・遷移させないことを確認する。
- アプリ / エンドツーエンド拒否として、旧暗号文 + 現在の generationId メタデータ、世代メタデータ改ざん、AAD 不一致、delayed 旧暗号文、旧応答暗号文の再利用を障害注入し、アプリ承認に到達せず、署名成功にならず、再試行が旧暗号文を利用せず新規世代、新規識別情報、新鮮な暗号文および新規承認になることを確認する。旧暗号文が Relay 保存領域に一時保存されないことはテスト要求にしない。
- 頻度上限が既存セッションの取得・完了を不必要に妨げない。

### 14.4 モバイル / ブラウザ E2E

- iOS 普遍的なリンクと Android アプリリンクが正規アプリを直接開く。
- インストール済み正常系で新しいブラウザタブを作らない。
- 未インストール代替経路がフラグメントを送信・保存せず、導入案内を表示する。
- 元ページが開いたまま応答を取得し、アプリからブラウザコールバックを開かない。
- アプリ終了、拒否、ロック、タイムアウト、ページ遷移、ページ破棄で署名結果を返さない。
- アプリ承認画面がMainnetでは有効なオリジン証明を必須とし「登録鍵で検証済み」、証明を省略できるTestnetでは「要求元（未検証）」と表示する。
- well-known マニフェストのリダイレクト、期限切れ／失効鍵、誤ったオリジン、誤った要求ダイジェスト、改ざん証明、private-network解決を拒否する。
- リリース / プラットフォーム対応能力報告書で承認された保証範囲だけを表示し、対応能力または判定条件状態が不明 / 未対応の場合は Mainnet を有効化しない。具体的な OS / ハードウェア条件と直接のハードウェア署名の採否はモバイル / プラットフォーム判断権限に委譲する。
- 不明 / non-canonical / サイズ超過のトランザクションと署名主体不一致を署名前に拒否する。
- Symbol / NEM × Mainnet / Testnet の対応トランザクション固定ベクターで署名結果を検証する。

## 15. 将来拡張

将来のプロトコルでは、既存 v1 の意味を変更せず、新しい操作または主要プロトコルを追加する。

- React ネイティブ CLIによるモバイル Relay受信アプリと承認UI
- PC とスマートフォン間の QR 受け渡し
- transparency ログまたは第三者認証を伴うdApp 鍵 directory（v1の同一Originwell-known方式を置換せず追加する）
- 組織向けポリシー / 二者承認 / ハードウェア署名主体
- 明示的に信頼登録した自己ホスト Relay

破壊的変更は`mosaiclynx.relay.v2`とMosaicLynx SDK 主要バージョンで導入し、アプリは未知プロトコルを安全側に拒否する。

## 16. 追跡可能性

本仕様は Web トランザクション受け渡しの外部契約を定める。共通要求 / 応答エンベロープ、公開アカウントの識別情報、配送処理結果の区分および共通の結果共用体の正本の管理主体は [インターフェース仕様 §6](./interfaces.md#6-要求--応答エンベロープ) であり、本書 §7.1〜§7.2 はそれを再定義しない。モバイルアプリの OS / ハードウェア / バックアップ対応能力の具体条件は本書の責任主体ではなく、下表の未決とリリース判断権限に追跡する。

| 要件                                                                                   | 設計                                                                  | 本仕様                                | 正本の管理主体 / 未決                                                                                                                                                |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CR-001`、`CR-006`、`CR-007`、`CR-015`；`RR-001`、`RR-002`、`SDK-FR-005`、`SDK-FR-008` | アーキテクチャ §5.2、§6.1〜§6.4；署名フロー §7、§19                   | §2、§5、§7.1〜§7.4、§9〜§10、§12〜§14 | 共通エンベロープ / 識別情報 / 結果 / 処理結果の区分はインターフェース §6；Web 受け渡しプロトコルは本書                                                               |
| `CR-008`、`CR-010`、`CR-011`、`CR-NFR-002`、`CR-NFR-003`                               | セキュリティ設計 §3〜§6、§10、§15；アーキテクチャ §8〜§9              | §6、§8、§11、§13〜§15                 | Relay は内容を解釈しない通信経路；秘密情報境界と四条件判断権限は署名主体 / アプリ                                                                                    |
| `CR-003`、`CR-004`、`CR-016`、`CR-AC-017`                                              | 署名フロー §4、§16；セキュリティ設計 §7〜§8                           | §7.4、§10.3、§11、§13                 | 認証、ロック解除、アカウントの利用認可、承認は信頼された署名主体；Relay / SDK は代替しない                                                                           |
| `CR-002`、`CR-007-TX`、`CR-007-MSG`、`CR-NFR-005`                                      | 署名フロー §9〜§15；アーキテクチャ §6.5                               | §7.4、§10.3、§11                      | トランザクション / メッセージ内容検査はチェーン互換性と署名主体；受け渡しは結果を内容を解釈せずに搬送                                                                |
| `CR-NFR-008`、`CR-NFR-009`、`MR-002`、`MR-003`                                         | インターフェース設計 §7.3；モバイル設計 §7                            | §7.3〜§7.5、§8〜§11                   | 検証済み App Link、オリジン証明、暗号・リプレイ検証は本書；共通要求フィールドはインターフェース §6                                                                   |
| `CR-006`、`CR-012`、`CR-NFR-012`；`RR-002`、`RR-NFR-002`                               | 署名フロー §7.3〜§7.4、§19；アーキテクチャ §6.3                       | §7.2、§12.3〜§12.4、§13〜§14          | 署名主体が生成した結果 / 配送処理結果の区分は署名主体；Relay 受領確認 / 消費済み状態は判断権限ではない                                                               |
| `CR-NFR-003`〜`CR-NFR-011`、`RR-004`、`RR-006`、`RR-007`                               | セキュリティ設計 §10、§15；署名フロー §20〜§23；Relay 設計 §6〜§7     | §8、§12〜§14                          | 期限切れ、重複、リプレイ、世代、状態消失は各判断権限のライフサイクル契約                                                                                             |
| `CR-008`、`CR-013`、`CR-NFR-002`、`CR-NFR-004`；`RR-008`                               | アーキテクチャ §6.8〜§6.9；セキュリティ設計 §6；モバイル設計 §11、§18 | §8.1、§11、§14〜§15                   | ウォレットストア、秘密鍵、生の署名は wallet-core / 信頼されたバインディング；バックアップ / 移行は `OPEN-PROFILE-001`、`MOB-OPEN-006` / `MR-OPEN-006`                |
| `CR-NFR-006`、`CR-AC-008`、`MR-013`、`MR-AC-009`                                       | アーキテクチャ §3、§6.9、§16；モバイル設計 §3.3、§23〜§24             | §7.5、§11、§14.4                      | Mainnet 判定条件の存在、不明時安全側での終了、Testnet 継続は本書；プラットフォーム対応表 / 実行環境強制 / ストアは `MOB-OPEN-008` / `MR-OPEN-008` とリリース判断権限 |

### 16.1 未決の扱い

`MOB-OPEN-003` / `MR-OPEN-003`（wallet-core バインディング、OS 保護、秘密情報ライフサイクル）、`MOB-OPEN-006` / `MR-OPEN-006`（バックアップ / 復元、端末移行）、`MOB-OPEN-008` / `MR-OPEN-008`（プラットフォーム対応表、対応能力報告書、実行環境強制、ストアリリース）および `OPEN-PROFILE-001` は、本書が未決定の具体条件を補完するための判断権限である。これらが未解決の間も、Mainnet 判定条件の存在、判定条件失敗 / 不明時の Mainnet 無効、Testnet 専用継続、オリジン証明、四条件判定条件、秘密情報の分離および Relay の内容を解釈しない性は変更しない。これらの未決を解消するまで、具体的な OS / ハードウェア / バックアップ条件を現在の v1 の必須契約として扱わない。
