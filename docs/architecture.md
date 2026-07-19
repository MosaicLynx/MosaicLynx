# MosaicLynx アーキテクチャ設計

## 1. 目的

本書は、MosaicLynx の Chrome Extension（Manifest V3）、Web ページ向け MosaicLynx SDK、将来の React Native / Expo アプリで共有できるアーキテクチャを定義する。

プロダクト要件は [Product Specification](./product-spec.md) に定義する。
Web ページから Extension または Mobile App へトランザクションを渡す仕様は [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) に定義する。
鍵導出、network constant、transaction schema、署名 byte 列は [Chain Compatibility Specification](./chain-compatibility-spec.md) に定義する。

## 2. アーキテクチャ原則

- Core はブラウザ、Chrome API、React、具体的な Storage 実装へ依存しない。
- 秘密鍵を Web ページ、Content Script、Provider へ渡さない。
- チェーン固有の派生、検証、解析、署名処理を Adapter に閉じ込める。
- Profile を Mainnet / Testnet で分離し、一つの Account の鍵を Symbol / NEM で共用する。署名要求のチェーン・ネットワーク整合性は必ず検証する。
- 署名による状態変更と資産移動を完全に解析・表示できない要求は拒否し、警告だけを根拠に署名を許可しない。
- メッセージ署名は Origin、チェーン、ネットワーク、用途、nonce、有効期限を含む構造化形式だけを許可する。
- 外部境界の入力はすべて検証し、内部では型付けされた値だけを扱う。
- 暗号化形式、Storage、承認 UI、ホスト環境を Port 経由で交換可能にする。
- Manifest V3 Service Worker が停止・再起動しても、永続状態から安全に復元できる。

## 3. システム構成

WebページはMosaicLynx SDKの共通APIを利用する。MosaicLynx SDKは対応Providerの存在を検出した場合はExtensionと直接通信し、Providerがない対応スマートフォンではE2E暗号化したMobile Relayを選択する。dAppはtransportを選択しない。

```text
dApp
  │ @mosaiclynx/sdk
  ▼
MosaicLynx SDK
  ├── Extension Adapter ──> window.mosaicLynx
  │                              │
  │                              ▼
  │                        In-page Provider
  │                              │ DOM CustomEvent（requestId 付き）
  │                              ▼
  │                        Content Script
  │                              │ chrome.runtime messaging
  │                              ▼
  │                        Background Service Worker ── Approval UI
  │
  └── Mobile Relay Adapter
          │ E2E 暗号文のみ
          ▼
       Relay <──────────────> Mobile App ── Approval UI
                                   │
                                   ├── Core
                                   ├── Symbol / NEM Chain Adapters
                                   └── Vault / Signer
```

In-page Provider と Content Script は信頼しない領域として扱う。権限判定、承認状態、mutex、routingはBackgroundへ集約する。秘密情報の復号と署名の最終実行は、Service Workerの停止に依存しないvisible trusted signing document内の`LocalVaultSigner`へ限定する。Backgroundとsigning documentは互いの要約を信用せず、同じ元要求、digest、revisionを独立に再検証する。

Relay は信頼しない transport とし、transaction、署名結果、session secret、capability token を平文で渡さない。Mobile App は Core と Chain Adapter の同じ解析・署名規則を使用し、Relay 内で解析または署名しない。モバイル要求のOrigin文字列だけはWeb pageの自己申告であるため信用しない。Mobile MainnetではWeb Transaction Handoff Specificationの同一Origin well-known keyによるorigin proofを必須とし、Testnetでproofがない場合は未検証と表示する。

## 4. Monorepo 構成

現行構成を次の責務で維持・拡張する。

```text
apps/
├── extension/             Chrome 固有の Background / Content / In-page / UI
├── relay/                 E2E暗号文の短期保管、capability、TTL、CAS、long polling
└── mobile/                将来の React Native / Expo host、App Link、承認 UI

packages/
├── core/                  ドメイン、ユースケース、Port
├── chain-symbol/          Symbol 固有処理
├── chain-nem/             NEM 固有処理
├── provider-api/          公開 API、RPC、Event、エラー定義
└── sdk/                   @mosaiclynx/sdk、transport 選択、Extension / Relay Adapter
```

規模の増加に応じ、次のパッケージ分離を許容する。

- `storage-webextension`: Chrome Storage の Repository 実装
- `crypto-web`: Web Crypto を利用する Vault / Crypto 実装
- `ui`: Web とモバイルで共有可能な非 DOM 依存の状態・翻訳リソース

早期にパッケージを細分化しすぎず、依存方向が崩れる場合に分離する。

## 5. レイヤーと責務

### 5.1 Core

Core が持つ責務は次のとおり。

- `ConnectionScope`、`Profile`、`Account`、`PermissionGrant`、`SessionState` のドメイン型
- プロファイルとアカウントの整合性検証
- 接続許可の判定
- ロック状態を前提とする署名ユースケース
- 構造化メッセージの canonical encoding、domain separation、nonce / 有効期限検証
- アクティブスコープ、プロファイル、アカウントの遷移規則
- Repository / Crypto / Chain Adapter / Clock / ID 生成等の Port

Core は次に依存しない。

- `chrome.*`
- DOM / `window`
- React / React Native
- `chrome.storage`
- symbol-sdkおよびMosaicLynx SDK固有クラス

Core は秘密鍵の文字列を通常のドメインオブジェクトとして保持しない。秘密情報は `SecretRef` で参照し、復号と署名は Crypto / Vault Port の内側で行う。

### 5.2 Chain Adapter

`chain-symbol`と`chain-nem`は、固定版symbol-sdkを呼び出し、MosaicLynx固有のpolicyと表示用modelへ変換する。暗号・catbuffer機能は再実装せず、次を担当する。

- 秘密鍵インポートと正規化
- アドレス / 公開鍵の導出
- ネットワークとアドレスの整合性検証
- メッセージ署名
- トランザクション payload のデコード、検証、要約
- トランザクション署名

`MnemonicDerivationPort`の実装はsymbol-sdkの`Bip32.random()`、`Bip32.fromMnemonic()`、`SymbolFacade.bip32Path()`だけを使用する。standalone private key生成をMVPで提供しないため`KeyGeneratorPort`は設けない。導出した一つの鍵を両方のChain Adapterへ渡し、各Adapterはsymbol-sdkの`SymbolFacade.createAccount()`または`NemFacade.createAccount()`からIdentityを取得する。Coreとの境界ではsymbol-sdk objectを返さず、シリアライズ可能な型を使用する。

```ts
interface MnemonicDerivationPort {
  generateMnemonic(): Promise<SecretMnemonic>;
  derivePrivateKey(mnemonic: SecretMnemonic, network: NetworkKind, accountIndex: number): Promise<SecretBytes>;
}

interface ChainAdapterPort {
  readonly chain: 'symbol' | 'nem';
  deriveIdentity(network: NetworkKind, privateKey: SecretBytes): Promise<ChainIdentity>;
  inspectTransaction(scope: ConnectionScope, payload: string): Promise<TransactionInspection>;
  signTransaction(input: ChainSignTransactionInput): Promise<SignedTransaction>;
  signMessage(input: ChainSignMessageInput): Promise<string>;
}
```

Chain Adapterのsymbol-sdk利用契約は次のとおりとする。

| 処理               | Symbol                                   | NEM                                                              |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| private key検証    | `new PrivateKey(bytes)`                  | `new PrivateKey(bytes)`                                          |
| Account / Identity | `SymbolFacade.createAccount()`           | `NemFacade.createAccount()`                                      |
| transaction decode | `SymbolTransactionFactory.deserialize()` | `TransactionFactory.deserialize()`                               |
| canonical encode   | transaction objectの`serialize()`        | transaction objectの`serialize()`                                |
| transaction署名    | Symbol Accountの`signTransaction()`      | NEM Accountの`signTransaction()`                                 |
| cosignature        | Symbol Accountの`cosignTransaction()`    | `CosignatureV1`をdeserialize後、NEM Accountの`signTransaction()` |
| signature検証      | `SymbolFacade.verifyTransaction()`       | `NemFacade.verifyTransaction()`                                  |
| transaction hash   | `SymbolFacade.hashTransaction()`         | `NemFacade.hashTransaction()`                                    |

symbol-sdkに対応APIまたはschemaがない場合、独自暗号・独自catbuffer実装で補完せず未対応として拒否する。MosaicLynx独自処理はallowlist、全fieldの意味検証、resource上限、canonical byte比較、表示要約、context / Permission / revision検証に限定する。

`inspectTransaction()` は単なる要約生成ではなく、署名可否を決めるセキュリティ境界である。Adapter はProduct Specification 12.4のallowlistにあるtransaction type / versionの全fieldと、aggregate / multisig内の全inner transactionをsymbol-sdk objectから再帰的に検証する。payloadは256 KiB、aggregate inner transactionは100件、ネストはouterとembeddedの2階層を上限とする。symbol-sdk factoryによるdeserialize後に同じobjectを`serialize()`した結果が元payloadとbyte-for-byteで一致しない場合、未知type / version、未解析field、余剰byte、上限を超えるネストまたは要素数がある場合は失敗させる。cosignatureは完全な親transactionを同時にsymbol-sdkでdeserialize、hash検証できなければ失敗させる。

秘密鍵の利用方法を Chain Adapter から分離し、将来の Secure Element、ハードウェア署名機、MPC に差し替えられる境界を持つ。

```ts
interface SignerPort {
  getPublicKey(ref: SecretRef, chain: 'symbol' | 'nem'): Promise<string>;
  getCapabilities(ref: SecretRef): Promise<SignerCapabilities>;
  sign(ref: SecretRef, request: CanonicalSigningRequest): Promise<SignatureResult>;
  cancel(operationId: string): Promise<void>;
}
```

MVPの`LocalVaultSigner`は同一秘密鍵をSymbol / NEMの両Adapterで使用する。これはNEM側のニーモニック互換を要件とせず、SymbolFacadeで選択したpathの派生結果をsymbol-sdkの`NemFacade.createAccount()`へ入力する意図的な設計判断である。両チェーンで同じ秘密鍵を使うため、一方の実装侵害が両Identityに及ぶことをUIと脅威モデルへ明記し、symbol-sdkが実装するチェーン別署名、公開鍵導出、署名入力を固定vectorで検証する。

上記は目標インターフェースである。現行実装のチェーンごとの `createAccount()` / `importAccount()` は共用鍵モデルと異なるため、共通の鍵生成・派生処理と `deriveIdentity()` へ段階的に置き換える。

### 5.3 Provider API

`provider-api` は次を定義する。

- `window.mosaicLynx` の公開インターフェース
- シリアライズ可能な RPC request / response
- Event 名と payload
- 安定した Provider エラーコード
- `version` と `apiVersion`

公開メソッドは専用 API とし、内部は request ベースの RPC とする。メソッドとイベントは API バージョン単位で互換性を管理する。

Provider は接続、許可済みアカウントの参照、構造化メッセージ署名、トランザクション署名、切断だけを公開する。構造化メッセージ署名は signature に加え、実際に署名した完全な `StructuredMessage`、signer public key、signing digest を返す。`switchProfile()`、`switchChain()`、`lock()`、`unlock(password)` は公開せず、プロファイル選択とロック操作は拡張機能 UI で完結させる。

### 5.4 Extension Host

`apps/extension` は次の Chrome 固有処理を担当する。

- Manifest V3 と CSP
- In-page script の注入
- Content Script と Background 間のブリッジ
- `sender.url` に基づく Origin の確定
- Background での RPC dispatch
- Popup、承認画面、設定画面
- Chrome Storage Repository
- Service Worker のライフサイクル復元
- 自動ロックタイマー
- ローカライズとテーマ適用

### 5.5 MosaicLynx SDK と Mobile Relay

`packages/sdk`はMosaicLynx SDKとしてdAppにtransport非依存の`signTransaction()`を公開する。Extension AdapterはExtension MVP、Mobile Relay AdapterはMobileマイルストーンに属し、後者をExtension MVPのrelease blockerにしない。MosaicLynx SDKは次を担当する。

- 対応 `window.mosaicLynx` Provider の検出と Extension Adapter の選択
- Provider がない対応 mobile browser での Mobile Relay Adapter の選択
- Extension の接続前提を満たすための `getAccounts()` / `connect()` の内部調整
- Relay session、E2E 暗号化、App Link 起動、response 待機、ACK / cancel
- Provider / Relay固有errorから共通MosaicLynx SDK errorへの変換
- signed payload、request digest、chain、network、expected signer の結果検証

MosaicLynx SDKはtransportの強制option、Relay credential、Extensionの`accountId`を公開しない。Providerが利用可能な場合は常にExtensionを優先し、拒否または失敗後にMobile Relayへ自動fallbackしない。

Relay は暗号文と最小限の短寿命 metadata だけを保持する。Mobile App は App Link の fragment から session secret と App capability を受け取り、Relay から request を取得してローカルで復号・解析・承認・署名する。request / response は別鍵の AES-256-GCM で保護し、5分の TTL、first-write-wins、ACK / cancel / expiry 時の削除を必須とする。詳細な wire protocol と HTTP API は Web Transaction Handoff Specification に従う。

## 6. 依存方向

```text
extension ──> core
extension ──> provider-api
extension ──> chain-symbol / chain-nem

sdk ────────> provider-api
sdk ────────> Web platform APIs
sdk ────────> chain-symbol / chain-nem（公開 transaction の結果検証のみ）
mobile ─────> core
mobile ─────> chain-symbol / chain-nem

chain-symbol ──> core
chain-nem ─────> core
provider-api ──> shared types only
```

禁止する依存は次のとおり。

- `core -> extension`
- `core -> provider-api`
- `chain-* -> chrome.* / UI`
- `provider-api -> extension`
- `sdk -> extension / chrome.*`
- `relay -> core / chain-* / Vault`

## 7. ドメインモデル

### 7.1 ネットワークと接続スコープ

```ts
type ChainKind = 'symbol' | 'nem';
type NetworkKind = 'mainnet' | 'testnet';

interface ConnectionScope {
  chain: ChainKind;
  network: NetworkKind;
  id: `${ChainKind}-${NetworkKind}`;
}
```

Profile は `network` だけを保持し、一つの Profile に Symbol / NEM 双方の Account を保持する。`ConnectionScope` は dApp の接続・署名コンテキストに使用する。文字列連結だけに依存せず、Repository へ渡す前に列挙値を検証する。

### 7.2 Profile と Account

```ts
interface Profile {
  id: string;
  network: NetworkKind;
  name: string;
  accountIds: string[];
  defaultAccountId: string;
  nextAccountIndex: number;
  vaultRef: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

type AccountSource =
  | { kind: 'mnemonicDerived'; secretRef: string; accountIndex: number; derivationPath: string }
  | { kind: 'importedPrivateKey'; secretRef: string };

interface ChainIdentity {
  address: string;
  publicKey: string;
}

interface Account {
  id: string;
  profileId: string;
  name: string;
  identities: Record<ChainKind, ChainIdentity>;
  source: AccountSource;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

Account のネットワークは所属 Profile から決定する。一つの Account は一つの秘密鍵を参照し、Symbol / NEM の Chain Adapter がその同じ鍵からチェーン固有のアドレスと公開鍵を導出する。いずれかの Identity が Profile と異なるネットワークのアドレスを持つ場合は保存を拒否する。最後の Account の削除と、存在しない Account をデフォルトにする更新を Core で拒否する。

新規Profile作成時のニーモニック生成はchain / network非依存の共通処理とする。固定した`@nemnesia/symbol-sdk 3.3.2-pure.2`で`new Bip32(SymbolFacade.BIP32_CURVE_NAME, "english").random()`を使用し、既定32-byte entropyからBIP39 English 24 wordsを生成する。空のBIP39 passphraseで`fromMnemonic()`できることを保存前に検証する。

Account導出では、Profile networkに対応する`SymbolFacade`の`facade.bip32Path(accountIndex)`を`root.derivePath()`へ直接渡す。MosaicLynx側にpath定数、coin type、hardened規則を複製しない。その鍵をSymbol / NEMの両方へ入力し、それぞれのIdentityを作成する。NEM walletとのニーモニック互換性は持たず、`NemFacade.bip32Path()`は使用しない。Profileの`nextAccountIndex`は単調増加し、削除済みindexを再利用しない。詳細はChain Compatibility Specificationに従う。

### 7.3 Permission

```ts
interface PermissionGrant {
  origin: string;
  profileId: string;
  scope: ConnectionScope;
  accountIds: string[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

接続許可は Origin、Profile、接続スコープ、ユーザーが明示的に選択した Account の集合で管理する。許可された dApp は、`accountIds` に含まれる Account から、要求チェーンに対応する Identity だけを取得できる。Account の追加時に既存 Permission へ自動追加しない。削除時は Permission からも除去し、空になった Permission は削除する。

### 7.4 Approval

```ts
type ApprovalOperation = 'connect' | 'signStructuredMessage' | 'signTransaction' | 'cosignTransaction';
type ApprovalStatus =
  'pending' | 'presented' | 'approved' | 'signing' | 'completed' | 'rejected' | 'cancelled' | 'expired' | 'failed';

interface ApprovalRequestEnvelopeV1 {
  schema: 'mosaiclynx.approval.v1';
  approvalId: string; // 128-bit CSPRNG、paddingなしbase64url
  requestId: string; // Provider requestとのsingle-use相関ID
  operation: ApprovalOperation;
  binding: {
    extensionInstanceId: string;
    origin: string; // Backgroundがsender.urlから確定したcanonical Origin
    originAscii: string;
    tabId: number;
    frameId: 0;
    documentId: string;
    profileId: string;
    accountId?: string;
    scope: ConnectionScope;
  };
  revisions: {
    profile: number;
    account?: number;
    permission?: number;
    vault: number;
  };
  request: ApprovalCanonicalRequest;
  requestDigest: string; // SHA-256(JCS({operation,binding,revisions,request}))
  payloadDigest?: string; // SHA-256(decoded raw payload)
  inspection?: {
    schema: 'mosaiclynx.inspection.v1';
    fixtureContractVersion: string;
    parserVersion: string;
    canonicalPayloadDigest: string;
    resultDigest: string; // SHA-256(JCS(result))
    result: TransactionInspection;
  };
  display: {
    locale: 'ja' | 'en';
    fields: DisplayField[]; // cacheにすぎず、承認・署名の根拠にしない
  };
  lifecycle: {
    createdAt: string;
    expiresAt: string;
    status: ApprovalStatus;
    revision: number; // 全遷移で+1するCAS値
    presentedAt?: string;
    decidedAt?: string;
    terminalAt?: string;
    terminalReason?: string; // 安定codeのみ。parser内部情報は禁止
  };
}

type ApprovalCanonicalRequest =
  | { kind: 'connect'; requestedAccountIds: string[] }
  | { kind: 'structuredMessage'; message: StructuredMessage }
  | {
      kind: 'transaction';
      chain: 'symbol' | 'nem';
      network: 'mainnet' | 'testnet';
      payload: string;
      parentPayload?: string;
      expectedSignerPublicKey?: string;
    };
```

`ApprovalRequestEnvelopeV1`をExtension内の承認要求の唯一の正本とする。`request`にはProviderから受領した意味を変えない元payloadを保持し、hexのcase以外の正規化、signer補完、alias解決を行わない。`requestDigest`は`operation`、全`binding`、全`revisions`、`request`を上記順のobjectとしてJCS canonicalizeしたUTF-8 byteのSHA-256 lowercase hexとする。`display`と`inspection.result`は派生cacheであり、署名入力へ逆変換しない。未知field、欠落field、schema不一致はfail closedとする。

正本は`chrome.storage.local`の専用`approvalBodies`へ、Profile Vaultとは別のinstallation-scoped 256-bit approval storage keyでAES-256-GCM暗号化して保存する。鍵はWebCryptoで生成したextractable=falseの`CryptoKey`とし、extension originのIndexedDBへstructured cloneで保存してContent Scriptへhandleを渡さない。AADは`schema || approvalId || requestId || profileId || createdAt || expiresAt`、nonceはrecordごとに一意な96-bit CSPRNG値とする。`chrome.storage.session`には`approvalId`、binding、digest、期限、status、revisionだけの非秘密索引を置き、raw payload、message本文、inspection全文を置かない。暗号化失敗、鍵喪失、AEAD失敗時は復旧を試みず`failed`にする。

承認時は `requestDigest`、Origin、tabId、frameId、documentId、profileId、scope、accountId、全revisionと元要求が一致することを再検証する。navigation または tab close により document が変わった要求は拒否する。Backgroundは受領時にschema、sender binding、Permission、上限、digest、chain inspectionを独立検証する。trusted documentはBackgroundのsummaryを信用せず、正本をStorageから復号し、同じ検証器でschema、binding、revision、canonical payload、inspection、signer、digestを再計算する。承認直前とProfile mutex取得後の署名直前にも再計算し、Backgroundとtrusted documentの`requestDigest`、`payloadDigest`、`resultDigest`が全て一致した場合だけ署名する。

状態遷移は `pending → presented → approved → signing → completed`、`pending / presented → rejected / cancelled / expired`、任意の非終端状態から`failed`だけを許可し、`approvalId + lifecycle.revision + current status`のcompare-and-setで二重遷移を防止する。終端状態は変更不可とする。`approved`はUI判断を記録するだけで署名権限tokenではなく、同じtrusted document内で直ちに`signing`へCASできない場合は`failed`にする。

Service Worker再起動時は`pending / presented`だけを索引から復元し、tab、document、期限、正本AEAD、全revisionを再検証して`pending`へ戻す。`approved / signing`は必ず`failed: WORKER_RESTART_DURING_DECISION`とし再開しない。approval windowのclose / crash / reload、別routeへのnavigationは対象approvalを`cancelled`にし、そのwindowだけが所有するVault handleを破棄する。要求元top-level documentのnavigation / reload / tab close、Origin変更は同じ`documentId`に属する全approvalを`cancelled`にする。extension reload / update、approval storage key喪失は全非終端approvalを`failed`にする。

Approval の TTL は作成から5分を上限とする。構造化メッセージはメッセージ自身の `expiresAt` と Approval TTL の早い方を使用する。期限延長は既存 request の更新ではなく、新しい requestId、digest、nonce と再承認を必要とする。

終端化後はraw正本と派生inspectionを同期削除し、非秘密tombstone（approvalId hash、requestId hash、status、terminalAt、expiresAt）だけを最大24時間保持してlate responseとreplayを拒否する。`expired`は期限監視と次回起動時sweepの双方で処理し、正本を期限後60秒以内に削除する。Profile削除、Permission disconnect、manual lockでは該当範囲を即時終端化して正本を削除する。Storage削除はbest effortではなく、削除確認後のread-backで不在を検証し、失敗中は新規署名を停止する。ブラウザ媒体上の物理的secure eraseは保証しない。

構造化メッセージは次の論理フィールドを canonical encoding し、表示内容ではなくその byte 列へ署名する。

```ts
interface StructuredMessage {
  domain: 'mosaiclynx.message.v1';
  origin: string;
  chain: 'symbol' | 'nem';
  network: 'mainnet' | 'testnet';
  purpose: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  payload: { encoding: 'utf8' | 'hex'; value: string };
}
```

構造化メッセージ v1 の signing bytes は、ASCII prefix `MOSAICLYNX\0MESSAGE\0V1\0` と、上記 object を RFC 8785 JSON Canonicalization Scheme（JCS）で canonicalize した UTF-8 byte 列の連結とする。入力は次の規則で検証し、暗黙の変換は行わない。

- `origin` は URL parser で canonicalize した `scheme://host[:port]`、chain / network は列挙値とし、Background の検証済みコンテキストと完全一致させる。
- `purpose` は ASCII の `[a-z0-9][a-z0-9._:-]{0,63}` とし、人間向け説明は別の表示 metadata として署名対象へ混入させない。
- `nonce` は CSPRNG で生成した 16 byte 以上 32 byte 以下の base64url（padding なし）とする。
- `issuedAt` / `expiresAt` は UTC の RFC 3339、秒精度、fraction なしとする。`issuedAt` は現在時刻の前後5分以内、`expiresAt` は `issuedAt` より後かつ10分以内とする。
- `utf8` payload は NFC 済みの有効な Unicode scalar sequence とし、NFC でない入力は変換せず拒否する。`hex` payload は偶数長の lowercase hexadecimal とする。decoded payload は 16 KiB 以下とする。

signing bytes と、その SHA-256 digest を画面へ渡す前に生成し、承認後に再生成して一致を確認する。nonce は Origin + Profile + Account 単位で有効期限まで再利用を拒否する。request 受付時に nonce hash を原子的に `reserved` とし、署名開始時に `used` へ遷移させる。同じ nonce の並行要求を拒否し、拒否・失敗後も expiresAt までは再利用させない。replay cache は payload を含まない hash と scope、state、expiresAt だけを短寿命で永続化し、Service Worker 再起動でも期限内の再利用を拒否する。期限後に削除する。上記規則と signing bytes は chain ごとの署名 test vector で固定する。

## 8. Storage と暗号化

### 8.1 Storage の分離

| 領域           | 保存先                           | 内容                                                                                                       |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 永続公開データ | `chrome.storage.local`           | プロファイルごとの暗号化 Vault、公開プロフィール索引、公開アカウント索引、設定、Permission、schema version |
| セッション     | `chrome.storage.session`         | アクティブ ID、短寿命の承認索引、trusted documentの非秘密challenge。unlockedを永続的事実として保存しない   |
| メモリのみ     | visible trusted signing document | 復号鍵、Vault session、署名中の秘密情報                                                                    |
| メモリのみ     | Service Worker                   | 承認routing、mutex、非秘密digest。復号鍵とraw secretは禁止                                                 |

Service Worker の停止でrouting状態が失われることを前提とする。visible trusted signing documentが存続する場合でも、Worker復帰後に一回限りchallenge、extension instance、Profile / Permission / Vault revision、request digestを再照合するまで署名しない。trusted documentが失われた場合、承認待ち要求は安全に失敗させ、承認済みとして扱わない。
`chrome.storage.local` と `chrome.storage.session` は `setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })` を設定し、Content Script と Web page から直接参照できないことを起動時と E2E test で確認する。

### 8.2 保存形式

公開プロフィールと公開アカウントは別のStorage keyへ保存し、プロフィール一覧をAccount索引と独立して取得できる構造にする。Extension Store V2は次のkey単位で分離する。

| Key                             | 内容                                 |
| ------------------------------- | ------------------------------------ |
| `mosaicLynxMetaV2`              | schema versionと設定                 |
| `mosaicLynxProfilesV2`          | Accountを内包しない公開Profile索引   |
| `mosaicLynxAccountsV2`          | `profileId`で参照する公開Account索引 |
| `mosaicLynxVaultsV2`            | Profileごとの暗号化Vault             |
| `mosaicLynxPermissionsV2`       | OriginごとのPermission               |
| `mosaicLynxUsedMessageNoncesV2` | 短寿命のnonce replay索引             |

V1の単一key形式を検出した場合は、Profile内のAccountを公開Account索引へ分離し、V2の全keyを一回のcommitで保存できた後にのみV1 keyを削除する。Vault envelopeの暗号schema versionはStorage schema versionから独立させ、Storage移行だけで既存VaultのAADを変更しない。

```ts
interface ExtensionStoreV2 {
  schemaVersion: 2;
  profiles: PublicProfileIndex[];
  accounts: PublicAccountIndex[];
  vaults: VaultEnvelope[];
  settings: PublicSettings;
  permissions: PermissionGrant[];
  usedMessageNonces: UsedMessageNonce[];
}
```

Profileの暗号化backupはStorage envelopeと別formatにし、次を満たす。

```ts
interface EncryptedProfileBackup {
  format: 'mosaiclynx.profile-backup.v1';
  createdAt: string;
  profileNetwork: NetworkKind;
  schemaVersion: number;
  kdf: { name: 'argon2id'; salt: string; memoryKiB: number; iterations: number; parallelism: number };
  cipher: { name: 'AES-256-GCM'; nonce: string; ciphertextAndTag: string };
}
```

backup plaintextはVault contents、公開Profile / Account、source、accountIndex、SDKから得たpath snapshot、`nextAccountIndex`、Permissionを含む。exportごとに新しいsalt / nonceで再暗号化し、format、createdAt、network、schema、KDF / cipher metadataをAADに含める。importは新しいProfile IDへcopy-on-writeし、全Identity再導出・照合後だけcommitする。既存Profileを上書きしない。

MVP の保存形式は次を最低要件とし、ADR-003 と固定 test vector に記録する。

- パスワードからの鍵導出は Argon2id、memory 64 MiB、iterations 3、parallelism 1、output 32 byte を最低値とし、salt は CSPRNG で Profile ごとに 128 bit 生成する。対象端末の計測により強化してよいが、実行時または低性能端末で最低値より弱めない。
- Argon2id を bundled WebAssembly で実装する場合、artifact を build 時に固定・検証し、remote WASM を取得しない。必要な `wasm-unsafe-eval` は extension page CSP の最小範囲に限定して ADR に記録し、JavaScript の `eval`、動的 module、remote code を許可しない。
- Vault は AES-256-GCM で暗号化し、96 bit nonce を暗号化操作ごとに CSPRNG で生成して同一鍵で再利用しない。
- AAD に `profileId`、`formatVersion`、`schemaVersion`、KDF / cipher metadata を canonical encoding して含め、別 Profile や旧形式への暗号文差し替えを拒否する。
- 復号、暗号化、password rotation は一時領域で完全性を検証してから copy-on-write で commit する。失敗時は旧 Vault を保持し、中間平文を永続化しない。
- format / KDF parameter の強化はアンロック成功時に検出し、ユーザー承認後に原子的に移行できるようにする。古い値へ downgrade しない。
- password error、AEAD 認証失敗、形式不正の詳細は外部へ区別して返さない。

暗号方式をコードへ暗黙に固定せず、`formatVersion`、KDF、salt、パラメータ、cipher、nonce / IV を保存する。認証付き暗号の検証に失敗した場合は復号を拒否する。JavaScript の GC により完全なメモリ消去を保証できないことを脅威モデルへ記載し、秘密は文字列ではなく上書き可能な byte buffer で可能な限り短時間だけ保持する。

公開索引には UI 表示に必要な最小情報だけを置く。秘密鍵、ニーモニック、復号鍵、パスワード、秘密情報を導出できる値は含めない。

### 8.3 Vault Port

```ts
interface ProfileVaultPort {
  initialize(profileId: string, password: SecretString, contents: VaultContents): Promise<void>;
  unlock(profileId: string, method: UnlockMethod): Promise<VaultSession>;
  lock(profileId: string): Promise<void>;
  isLocked(profileId: string): Promise<boolean>;
  readSecret(ref: SecretRef, operation: AuthorizedOperation): Promise<SecretHandle>;
  writeSecret(secret: SecretBytes, metadata: SecretMetadata): Promise<SecretRef>;
  rotatePassword(profileId: string, current: SecretString, next: SecretString): Promise<void>;
}
```

呼び出し側へ raw secret を長時間返さず、可能なら `withSecret(ref, callback)` または署名操作そのものを Vault / Crypto 境界内で実行する。

### 8.4 プラットフォームの保証範囲

Chrome Extension の `LocalVaultSigner` は password で暗号化したソフトウェア署名機であり、秘密鍵を Secure Enclave / Secure Element 内へ隔離できない。アンロック中に OS、ブラウザ、拡張機能プロセスまたは配布 artifact が侵害された場合、署名操作や復号後の秘密が攻撃され得る。この限界を製品説明と脅威モデルへ明記し、コールドウォレット、ハードウェアウォレット、企業カストディ相当と表示しない。

- raw secret を通常の domain object、Redux / React state、DOM、例外、telemetry に渡さない。
- chain / crypto library は秘密依存処理で可能な範囲の constant-time 実装を選び、秘密値に依存する詳細エラーや分岐時間を外部へ公開しない。
- アンロック時間と署名中の secret lifetime を最小化し、lock、sleep、Service Worker termination、署名完了 / 失敗時に handle を無効化する。
- より高い保証は `SignerPort` を通じたモバイル Secure Element、hardware signer、MPC 実装で提供し、LocalVaultSigner と保証レベルを UI 上で区別する。

### 8.5 MV3 Vault Session Decision

- `LocalVaultSigner`はvisibleなホームまたは承認window内でのみ生成する。offscreen document、Content Script、Service Workerをsecret ownerにしない。
- password入力、Argon2id、Vault復号、transaction再解析、署名、署名後検証を同じtrusted documentの署名controller内で行う。Service Workerとの通信はrequest digest、公開解析結果、revision、署名済み結果に限定する。
- trusted documentはService Workerから受け取った要約を署名根拠にせず、永続Storageから元payloadとPermissionを取得し直して独立に検証する。Storageは`TRUSTED_CONTEXTS`に限定する。
- window close、document reload / crash、15分無操作、manual lock、sleep復帰、extension updateでsecret handleを無効化する。署名途中なら結果を返さず、新しいrequestと再承認を要求する。
- Worker再起動だけでtrusted documentが存続する場合、documentが生成した256-bit challengeをruntime port再接続時に一度だけ使用する。challengeをsession復号鍵や署名権限として扱わず、revision不一致ならlockする。
- popupだけでunlockした場合、popup closeでlockする。15分sessionを必要とするユーザーには固定ホームwindowを明示的に開かせ、background keepaliveを安全性や可用性の前提にしない。

## 9. RPC とメッセージ境界

### 9.1 Web page → Content Script

- ランダムな `requestId` を付けた `CustomEvent` を使用する。
- request schema、メソッド、payload サイズを検証する。
- Content Script は Origin を request payload に入れてもよいが、認証情報としては使用しない。
- 応答 listener を完了・失敗・timeout 時に必ず解除する。

### 9.2 Content Script → Background

- `chrome.runtime.sendMessage` を使用する。
- Background は `sender.url` を URL として解析し、Origin を確定する。
- `sender.id` が自拡張の ID であることと、要求元 tab / frame を検証する。
- MVP はトップレベル frame からの要求だけを許可する。`sender.frameId !== 0` の要求は拒否し、将来 iframe を許可する場合は top-level Origin と frame Origin の双方を Permission と承認画面へ含める。
- `file:`, `data:`, `chrome:`, opaque origin 等は明示的な対応方針がない限り拒否する。
- ページが申告する `origin`、`profileId`、`accountId`、`scope` を信用せず、権限と保存状態に照合する。

### 9.3 Background → Approval UI

- 承認画面は `approvalId` のみを URL で受け取る。
- 詳細は Background から取得し、URL query に payload や秘密情報を含めない。
- ID は推測困難で一度限り、有効期限付きとする。
- Window close を reject として処理する。
- 同じ ID の二重 resolve を拒否する。
- 承認 UI は拡張機能自身の Origin であることを常時識別できる chrome-extension URL、製品名、固定レイアウトを持ち、Web page 内 modal を承認 UI として使用しない。
- Origin は URL parser で canonicalize し、Unicode 表記だけでなく ASCII / Punycode 表記と scheme、port を表示する。サイト名、favicon、ページタイトルは未検証 metadata として補助表示に限定する。

## 10. 接続と署名フロー

### 10.1 接続

```text
dApp.connect({ chain, network })
  → RPC schema 検証
  → sender.url から Origin 確定
  → 指定 network のアクティブ Profile を特定
  → Origin + profileId + scope の Permission を検索
  → 未許可なら公開する Account を選択する承認画面
  → 承認された Profile の Permission を保存
  → Permission.accountIds の Account だけを指定 chain の Identity に射影して返却
```

ロック中の新規接続と Permission 変更は許可せず、アンロックとユーザー承認を必要とする。既存 Permission を持つ Origin の `getAccounts()` には、その Permission の `accountIds` に限定した公開情報だけを返してよい。未許可 Origin、別 scope、Permission に含まれない Account には返さない。

### 10.2 署名

```text
dApp.sign*({ chain, network, ...params })
  → Origin / Permission / profile / account を検証
  → Profile の network と要求 network の一致を検証
  → 対象 Profile のロック状態を検証
  → symbol-sdk TransactionFactory で payload を deserialize
  → Chain Adapter で symbol-sdk object の全フィールドを検証・解析
  → payload の chain / network と要求値の一致を検証
  → symbol-sdk object.serialize() によるcanonical byte一致、signer、全inner transaction、上限を検証
  → 未知 type / version、未解析フィールド、非 canonical payload は拒否
  → 元要求の digest を生成
  → 承認画面で解析結果と警告を表示
  → 承認時に Origin / profile / scope / account / digest / timeout を再検証
  → SecretRefからsymbol-sdk Facade.createAccount()でAccountを生成
  → symbol-sdk Account.signTransaction() / cosignTransaction()で署名
  → symbol-sdk Facade.verifyTransaction() / hashTransaction()で結果検証
  → 秘密情報を破棄
  → 署名結果または安定したエラーを返却
```

MosaicLynx は署名結果をネットワークへアナウンスしない。

## 11. セッションとロック

- 拡張機能起動時の既定値は全 Profile locked とする。
- 復号鍵は永続 Storage に保存しない。
- Profile の手動ロック時は、その Profile の復号鍵、秘密情報、署名待ち要求を破棄する。
- 自動ロックはtrusted signing document内のProfileごとの最終ユーザー操作から計測し、初期値は15分とする。dAppのRPC、polling、background eventをactivityとして延長しない。
- ブラウザ終了、端末のスリープからの復帰、全trusted signing document close / crash、extension reload / update時は全 Profile locked とする。Service Worker再起動時は8.5の再接続検証を行い、trusted documentがなければlockedとする。
- pending上限はProfile全体で20件、同一`Profile + Origin`で5件、同一top-level documentで3件とし、いずれかへ達した新規要求を永続化・window作成前に`RESOURCE_LIMIT`で拒否する。全Profile合計は50件、同一Originからの受付はrolling 60秒に10件までとする。`connect`と署名要求を別枠にして上限を迂回させない。終端要求とtombstoneはpending数へ数えない。
- Profileごとに受付時刻昇順のFIFO queueを持つ。同時刻は`approvalId`のbyte順で決定し、優先度変更、Originによる割込み、dApp指定順を許可しない。期限切れ、context失効、cancel済みはhead到達前にも除去する。
- 一つのProfileで表示可能な承認windowは常に1個とする。別Profileを含むextension全体でも最大2個とし、各windowは一つの`approvalId`だけを所有する。既存windowへ次要求を差し替えず、終端化してUIが初期化された後にだけ次を表示する。popup、home、approval window間で同じVault sessionを暗黙共有しない。
- Profile mutexは`signing`、lock、Account / Permission / Vault更新を直列化する。queue待ちとユーザー閲覧中にmutexを保持しない。mutex取得後にrevisionと全digestを再検証する。lockは新規署名より優先し、実行中署名を結果返却前に無効化するcancel generationを増加させる。
- user cancelは対象approvalだけ、window closeはそのwindow所有approvalだけ、top-level navigation / tab closeは同じ`documentId`の全approval、Origin disconnectは同じ`Origin + Profile + scope`の全approval、Account削除は同じ`Profile + accountId`、Profile lock / deleteは同じProfile、extension reload / updateは全Profileの非終端approvalを無効化する。
- disconnect / revision変更 / cancelと署名完了が競合した場合、mutex内のcancel generationとCASを最後に照合し、cancelが先にcommit済みなら署名済みbyteを破棄してdAppへ返さない。暗号処理自体を中断できない場合も結果公開を阻止する。

署名、Profile / Account 更新、Permission 更新、lock は Profile 単位の mutex で直列化する。各要求は作成時の Profile、Account、Permission、Vault の revision を保持し、承認時と署名直前にすべて一致することを確認する。不一致なら承認済みであっても破棄する。Service Worker 再起動後は `approved` 状態から署名を再開せず、新しい要求と再承認を必要とする。

queue、上限counter、window ownership、cancel generationは`chrome.storage.session`の非秘密索引を正本とし、更新は単一Background controllerでCASする。Worker再起動時は暗号化正本との突合でcounterを再構築し、不一致時は小さい値へ補正せず全非終端要求をfail closedで終端化する。rate limit状態はOrigin hashと時刻bucketだけをsessionへ保持し、raw payloadを含めない。

パスワード、KDF salt、暗号文、ロック状態は Profile ごとに独立させる。一つの Profile のアンロック結果を別の Profile へ流用しない。

- パスワードは12文字以上とし、文字種を強制しない。
- ヒントは任意の公開メタデータとして保存し、Vault の復号なしで表示できるものとする。
- 失敗試行への遅延は UI だけに依存せず、セッション状態として管理する。
- 失敗回数を理由に Vault を削除したり、恒久的に復号不能にしたりしない。

## 12. Provider Event

Background は状態変更後に、該当する接続済み Origin の tab / frame だけへ Event を送る。

| Event             | 発火条件                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `accountsChanged` | Origin に公開中のアカウント集合またはアクティブアカウントが変わった |
| `disconnect`      | Origin の接続許可が削除された                                       |

全タブへの無差別 broadcast は行わない。URL 解析に失敗した tab は通知対象外とする。

接続済み Profile とは異なるネットワークの Profile を拡張機能 UI で選択しても、dApp の接続コンテキストを暗黙に変更しない。必要な場合は既存接続を無効化して `disconnect` を通知し、dApp に再接続を要求する。

## 13. エラー設計

Provider は最低限、次の安定したコードを持つ。

| Code                      | 意味                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `USER_REJECTED`           | ユーザーが拒否、または承認画面を閉じた                                       |
| `UNAUTHORIZED_ORIGIN`     | Origin に必要な接続許可がない                                                |
| `VAULT_LOCKED`            | Vault がロック中                                                             |
| `INVALID_PARAMS`          | request schema または値が不正                                                |
| `INVALID_MESSAGE`         | 構造化メッセージ、encoding、時刻、domain を検証できない                      |
| `NONCE_REUSED`            | 同じ Origin / Profile / Account で nonce が予約済みまたは使用済み            |
| `UNSUPPORTED_CHAIN`       | チェーンまたはネットワークが未対応                                           |
| `ACCOUNT_NOT_FOUND`       | 対象アカウントが存在しない、または許可範囲外                                 |
| `UNSUPPORTED_TRANSACTION` | transaction type / version が MVP allowlist にない                           |
| `INVALID_TRANSACTION`     | payload が不正、未解析、非 canonical、または signer が不一致                 |
| `CHAIN_MISMATCH`          | 要求、Account、payload のチェーンが一致しない                                |
| `NETWORK_MISMATCH`        | 要求、Profile、payload のネットワークが一致しない                            |
| `REQUEST_EXPIRED`         | 要求が有効期限を超えた                                                       |
| `CONTEXT_CHANGED`         | Origin、document、Profile、Account、Permission、Vault の revision が変化した |
| `RESOURCE_LIMIT`          | pending、rate、windowの上限に達した。要求は保存・表示していない              |
| `INTERNAL_ERROR`          | 外部へ詳細を公開しない内部エラー                                             |

内部例外、Storage key、スタックトレース、暗号エラーの詳細を Web ページへそのまま返さない。

## 14. オフライン署名

- 本書の「オフライン署名」は、Signer がノードや外部 metadata service へ通信せず、署名処理をローカルで完結することを意味する。オンラインの Chrome 上で dApp と通信する MVP はコールドウォレットまたは air-gapped signer ではない。
- 残高表示、ノード管理、トランザクション送信は実装しない。
- 鍵生成、アドレス導出、payload の検証・解析、署名をローカルで完結させる。
- Chain Adapter と Core から HTTP client への依存を排除する。
- network identifier、generation hash seed、epoch等は固定版symbol-sdkのNetwork objectから取得する。MosaicLynx独自定数へ複製せず、Chain Compatibility Specificationの期待値と起動時／build時に照合する。
- Symbolのunresolved address / mosaic IDがnamespace aliasを表す場合は解決先をローカルで確定できないためMVPでは拒否する。通常のraw mosaic IDのname / divisibilityを確定できない場合だけ、推測した名称や換算額を表示せずraw IDとatomic amountを「名称・桁数は外部未検証」として表示できる。
- 残高、restriction、deadline到達前の承認、既存cosignature、重複announce等のオンチェーン状態は保証範囲外とし、全署名画面へ「チェーン状態は未照合」と表示する。
- transaction の全フィールドと状態変更をローカルで解析できない payload は拒否する。外部 metadata を取得できないことと、transaction 自体を解析できないことを混同しない。
- 将来のコールド運用は別の Air-gapped Signer Host として設計し、unsigned payload と検証済みコンテキストを QR / file で入力し、signed payload を返す。In-page Provider を持つ Chrome Host をコールド運用として表示しない。

## 15. ローカライズと UI

- UI 文字列を React component に直書きせず、翻訳 key で管理する。
- 日本語と英語で同一のセキュリティ情報を表示する。
- Chain、Network、Origin、Address は翻訳によって意味が曖昧にならない表示とする。
- Mainnet / Testnet は色だけに依存せず、文字とアイコンを併用する。
- 承認画面は popup 本体と独立した route / entry point とし、要求ごとの状態だけを表示する。
- 承認画面は、全 embedded transaction を集約した資産の増減、全宛先、最大手数料、期限、署名者の役割、権限変更を最上位に表示し、その下に個別 transaction と raw field / digest を表示する。
- key link / unlink、account restriction、mosaic supply、namespace、multisig 構成変更等は高リスク操作として transaction type ごとの専用文言を使用する。未対応の高リスク type は拒否する。
- 制御文字、双方向文字、ゼロ幅文字を可視化し、UTF-8 表示と hex 表示、実際の signing bytes の digest を確認できるようにする。
- 承認をキーボード操作の初期 focus または Enter key の既定動作にしない。拒否 / close / timeout は常に非署名で完了する。

UI から Core ユースケースを直接呼ばず、Application Controller を介して状態変更とエラー変換を行う。

### 15.1 供給網とアップデート

- lockfile と package integrity を固定し、リリースごとに SBOM、依存ライセンス、既知脆弱性 scan 結果を保存する。
- Chain Adapter、暗号、serialization、QR / encoding 等の署名境界に入る依存は allowlist 化し、version 更新時に固定 vector、差分 test、fuzz test を必須とする。
- 本番 build は remote code、`eval`、動的 script、未固定 CDN asset を含めず、再現可能な手順で生成する。公開 artifact の digest と provenance を保存する。
- Chrome Web Store の公開主体は phishing-resistant MFA と複数人による release approval で保護する。緊急時の公開停止、脆弱 version 告知、鍵移行手順を incident response plan に定義する。
- schema / Vault migration は copy-on-write とし、完全性検証後に active version を切り替える。中断・容量不足・破損時は旧 version を維持し、暗号形式の downgrade を拒否する。
- アプリ version と最低安全 version は署名確認画面と監査記録から確認可能にする。自動更新されたことだけを安全性の根拠にしない。

Release metadataはoffline同梱の署名済みmanifestとする。manifestはversion、minimumSafeVersion、schema range、symbol-sdk / parser version、artifact digest、SBOM digest、公開時刻、失効理由URLを含み、Store artifactと同じrelease keyで署名する。runtime network取得値だけで署名可否を変えない。既知の緊急失効は次のStore updateへ同梱し、旧version利用者への告知と資産移行手順を公開する。

本番releaseは次を全て満たすまで作成しない。

- Chain Compatibility Specificationの全vector、differential test、30分以上のparser fuzz smokeと継続fuzz corpus回帰
- release buildの再現性を独立した2環境で確認しartifact digestが一致
- critical / high既知脆弱性0件。例外は期限、影響分析、owner、二者承認を持つ公開可能なrisk acceptanceが必要
- Store公開者とrelease承認者を分離し、phishing-resistant MFAを使用
- Vault / signing boundaryの外部security reviewを初回Mainnet releaseと各major変更で完了

### 15.2 監査と組織利用の境界

詳細監査記録と組織policyはExtension MVPに含めず、Organizationマイルストーンとする。MVPは秘密を含まない直近の操作結果をUI session内に表示してよいが、永続audit trailまたはカストディ統制を提供すると表示しない。Organization版の監査記録は秘密鍵、ニーモニック、password、full message、full transaction payload を含めず、次の情報を canonical record として保持またはexportできるようにする。

- request digest と解析結果 digest
- Origin、chain、network、Account の公開識別子
- transaction type、資産増減と権限変更の要約
- 承認 / 拒否 / timeout、時刻、アプリ / parser version、policy result

監査記録は端末内hash chainだけで完結させない。組織管理鍵で署名し、連番、前record hash、trusted time sourceの時刻を含め、設定した間隔で外部WORMまたは独立audit serviceへanchorする。export / anchor未完了、rollback、欠番、時刻後退をpolicy violationとして検知する。保存期間、legal hold、削除承認、暗号化export、閲覧者をpolicyで固定する。

組織向けの宛先 allowlist、金額上限、transaction type 禁止、二者承認、緊急停止は `ApprovalPolicyPort` の責務として承認 UI より前に評価する。MVP でこれらを実装しない場合、単独承認型でありカストディ用途の統制を満たさないことを明示し、企業カストディ対応を標榜しない。

### 15.3 性能・安定性 budget

基準端末は4 logical cores、8 GiB RAM、Chrome現行安定版とし、CIのthrottled browserで次をp95として測定する。

| 操作                                        |                                                      budget |
| ------------------------------------------- | ----------------------------------------------------------: |
| 承認windowのshell表示                       |                                                  500 ms以内 |
| 64 MiB Argon2id unlock                      |                        2.5秒以内、peak追加memory 96 MiB以内 |
| 256 KiB単体transaction解析・canonical再検証 |                                                     1秒以内 |
| 100 inner aggregate解析・要約               |       1.5秒以内、UI main thread blocking 100 ms未満/segment |
| 承認後の再検証・software署名                |                                                  750 ms以内 |
| Extension production bundle                 | 圧縮後5 MiB以内（固定WASMを除く）。WASMを含む総量15 MiB以内 |

budget超過はsecurity checkを省略する理由にせず、安全にtimeoutして署名しない。payload size、inner count、KDF時間、parser時間の境界値を低性能端末でも試験する。

## 16. テスト戦略

### 16.1 Core unit test

- Profile のネットワークと異なる Symbol / NEM Identity の保存拒否
- 最後の共用 Account 削除の拒否
- Permission の Origin / profile 制約
- Permission の scope / accountIds 制約と Account 追加時の非自動公開
- locked 状態での署名拒否
- 構造化メッセージの canonical encoding、domain、Origin、nonce、有効期限
- Profile revision 変更、Permission 変更、lock と署名の競合時の拒否
- 状態遷移とエラーコード

### 16.2 Chain Adapter test

- 一つの鍵からの Symbol / NEM Identity 導出
- Symbol / NEM × Mainnet / Testnet の4接続スコープにおけるインポート・アドレス導出
- ニーモニックと派生パスの既知ベクトル
- メッセージ署名の既知ベクトル
- トランザクション解析・署名の既知ベクトル
- 不正 payload、別ネットワーク payload の拒否
- 対応 type / version ごとの全フィールドと全 inner transaction の解析
- decode → canonical encode の byte-for-byte 一致
- 未知 type / version、未解析フィールド、余剰 byte、過剰ネスト、整数 overflow の拒否
- payload signer と Account の不一致拒否、および chain 固有署名入力の既知ベクトル

### 16.3 Provider contract test

- 公開メソッドから内部 RPC への mapping
- Event payload と API version
- 全 Provider エラーコード

### 16.4 Extension integration / E2E

- In-page → Content → Background → Approval の往復
- `sender.url` と偽装 Origin の不一致拒否
- iframe、opaque Origin、IDN / Punycode Origin の検証と表示
- 未接続 Origin からの情報取得・署名拒否
- 承認、拒否、window close、timeout、二重 resolve
- Service Worker 再起動後の locked 復元
- 自動ロック
- 複数 Origin / 複数 tab の並行要求
- `TRUSTED_CONTEXTS` による Storage access 制限
- nonce / IV 再利用防止、AAD 差し替え拒否、KDF 最低値
- Storage migration の中断、容量不足、rollback と暗号データ改ざん拒否
- transaction type ごとの正味効果と高リスク専用表示の UI test

MVP の自動テストはノードへ接続せず、固定ベクトルで再現可能にする。

## 17. 実装上の優先課題

仕様上の選択は確定した。現行コードを規範仕様へ適合させる実装順序は次のとおりとする。

1. Chain Compatibility Specificationの固定表に従い、全フィールド解析、canonical 再シリアライズ、未知 transaction / alias 拒否を実装する。
2. 構造化メッセージの canonical encoding、domain separation、nonce / expiry と固定 vector を実装する。
3. Origin + Profile + scope + accountIds の Permission と、Account 追加時の非自動公開を実装する。
4. `SymbolFacade.bip32Path(accountIndex)`、単調増加index、Symbol / NEM共用秘密鍵のchain別署名を規範fixtureとして実装する。
5. Argon2id、AES-256-GCM、AAD、CSPRNG、atomic rotation を用いる Vault Adapter を実装する。
6. `chrome.storage` の trusted-context 制限、Repository、copy-on-write migration を実装する。
7. 現在 Background 内にあるsecret処理をvisible trusted signing documentへ移し、Backgroundには一時状態・権限・承認routing、Profile mutex、revision検証だけを残す。
8. 承認要求へ timeout、window close、digest 再検証、二重解決防止、Origin / tab / frame binding を追加する。
9. `host_permissions: <all_urls>` の必要性を再評価し、最小権限化する。
10. Provider から管理 API を削除し、接続・署名引数へ chain / network を追加する。
11. CSP、RPC schema validation、fuzz test、E2E security test、SBOM / release provenance を追加する。
12. 暗号化backup export / import、restore verification、backup状態付き削除guardを実装する。
13. 三層署名確認、WCAG 2.2 AA、performance budgetを自動試験する。

## 18. ADR 登録項目

次の決定は本仕様で確定済みであり、実装PRで対応するADR fileへ本文、代替案、migration、test evidenceを転記する。ADR作成時に意味を変更してはならない。

- ADR-001: ネットワーク単位 Profile と Profile Vault
- ADR-002: BIP39 英語 24 語、Symbol 互換派生パス、Symbol / NEM 共用鍵
- ADR-003: KDF、暗号方式、パラメータと password rotation
- ADR-004: Origin + Profile + scope + accountIds 単位の Permission
- ADR-005: Provider からの管理 API 削除と chain / network 検証
- ADR-006: 全フィールド解析、canonical 再シリアライズと未知 transaction の署名拒否
- ADR-007: Service Worker 再起動・自動ロック時のセッション方針
- ADR-008: 構造化メッセージ署名のdomain separationとreplay防止
- ADR-009: SignerPort、ApprovalPolicyPort と将来の hardware / MPC 境界
- ADR-010: 供給網、リリース承認、copy-on-write migration と downgrade 防止
- ADR-011: visible trusted signing documentによるMV3 Vault session
- ADR-012: Extension MVP / Mobile v1 / Organizationのrelease分離
- ADR-013: unresolved Symbol aliasのMVP署名拒否
- ADR-014: 暗号化Profile backupとrestore verification
- ADR-015: Mobile Mainnet origin proofとmobile signer保証レベル
