# MosaicLynx アーキテクチャ設計

## 1. 目的

本書は、MosaicLynx の Chrome Extension（Manifest V3）と、将来の React Native / Expo アプリで共有できるアーキテクチャを定義する。

プロダクト要件は [Product Specification](./product-spec.md) に定義する。

## 2. アーキテクチャ原則

- Core はブラウザ、Chrome API、React、SSS、具体的な Storage 実装へ依存しない。
- 秘密鍵を Web ページ、Content Script、Provider へ渡さない。
- チェーン固有の派生、検証、解析、署名処理を Adapter に閉じ込める。
- Profile を Mainnet / Testnet で分離し、一つの Account の鍵を Symbol / NEM で共用する。署名要求のチェーン・ネットワーク整合性は必ず検証する。
- 外部境界の入力はすべて検証し、内部では型付けされた値だけを扱う。
- 暗号化形式、Storage、承認 UI、ホスト環境を Port 経由で交換可能にする。
- Manifest V3 Service Worker が停止・再起動しても、永続状態から安全に復元できる。

## 3. システム構成

```text
dApp
  │ window.mosaicLynx / window.SSS
  ▼
In-page Provider / SSS Adapter
  │ DOM CustomEvent（requestId 付き）
  ▼
Content Script
  │ chrome.runtime messaging
  ▼
Background Service Worker ───── Approval Window / Popup / Settings
  │                                  │
  ├── Application Services           └── chrome.runtime messaging
  ├── Core
  ├── Symbol / NEM Chain Adapters
  ├── Vault / Crypto Adapter
  └── Storage Repositories
          │
          ├── chrome.storage.local   永続データ
          └── chrome.storage.session セッション状態
```

In-page Provider と Content Script は信頼しない領域として扱う。秘密情報の復号、権限判定、承認状態、署名の最終実行は Background 側に集約する。

## 4. Monorepo 構成

現行構成を次の責務で維持・拡張する。

```text
apps/
└── extension/             Chrome 固有の Background / Content / In-page / UI

packages/
├── core/                  ドメイン、ユースケース、Port
├── chain-symbol/          Symbol 固有処理
├── chain-nem/             NEM 固有処理
├── provider-api/          公開 API、RPC、Event、エラー定義
└── sss-adapter/           window.SSS 互換変換
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
- アクティブスコープ、プロファイル、アカウントの遷移規則
- Repository / Crypto / Chain Adapter / Clock / ID 生成等の Port

Core は次に依存しない。

- `chrome.*`
- DOM / `window`
- React / React Native
- `chrome.storage`
- SSS の型やメソッド名
- SDK 固有クラス

Core は秘密鍵の文字列を通常のドメインオブジェクトとして保持しない。秘密情報は `SecretRef` で参照し、復号と署名は Crypto / Vault Port の内側で行う。

### 5.2 Chain Adapter

`chain-symbol` と `chain-nem` は、それぞれ次を実装する。

- 秘密鍵インポートと正規化
- アドレス / 公開鍵の導出
- ネットワークとアドレスの整合性検証
- メッセージ署名
- トランザクション payload のデコード、検証、要約
- トランザクション署名

秘密鍵の生成はチェーンから独立した `KeyGeneratorPort`、BIP39ニーモニックの生成とSymbol互換パスによる派生は `MnemonicDerivationPort` が担当する。導出した一つの鍵を両方の Chain Adapter へ渡す。Core との境界では SDK オブジェクトを返さず、シリアライズ可能な型を使用する。

```ts
interface KeyGeneratorPort {
  generatePrivateKey(): Promise<SecretBytes>;
}

interface MnemonicDerivationPort {
  generateMnemonic(): Promise<SecretMnemonic>;
  derivePrivateKey(mnemonic: SecretMnemonic, accountIndex: number): Promise<SecretBytes>;
}

interface ChainAdapterPort {
  readonly chain: "symbol" | "nem";
  deriveIdentity(network: NetworkKind, privateKey: SecretBytes): Promise<ChainIdentity>;
  inspectTransaction(scope: ConnectionScope, payload: string): Promise<TransactionInspection>;
  signTransaction(input: ChainSignTransactionInput): Promise<SignedTransaction>;
  signMessage(input: ChainSignMessageInput): Promise<string>;
}
```

上記は目標インターフェースである。現行実装のチェーンごとの `createAccount()` / `importAccount()` は共用鍵モデルと異なるため、共通の鍵生成・派生処理と `deriveIdentity()` へ段階的に置き換える。

### 5.3 Provider API

`provider-api` は次を定義する。

- `window.mosaicLynx` の公開インターフェース
- シリアライズ可能な RPC request / response
- Event 名と payload
- 安定した Provider エラーコード
- `version` と `apiVersion`

公開メソッドは専用 API とし、内部は request ベースの RPC とする。メソッドとイベントは API バージョン単位で互換性を管理する。

Provider は接続、許可済みアカウントの参照、メッセージ署名、トランザクション署名、切断だけを公開する。`switchProfile()`、`switchChain()`、`lock()`、`unlock(password)` は公開せず、プロファイル選択とロック操作は拡張機能 UI で完結させる。

### 5.4 SSS Adapter

`sss-adapter` は SSS API を Provider API へ変換する Anti-Corruption Layer とする。

- SSS の staged transaction / message 状態を Adapter 内に保持する。
- SSS の同期 API と MosaicLynx の非同期承認フローの差を吸収する。
- 未対応 API は安全側に失敗させ、署名済みに見える仮値を返さない。
- 対応する SSS バージョンとメソッドごとの互換性をテストする。
- `requestSSS()` / `isAllowedSSS()` は実際の Origin 権限状態を反映する。

Core および Chain Adapter は SSS に依存しない。

### 5.5 Extension Host

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

## 6. 依存方向

```text
extension ──> core
extension ──> provider-api
extension ──> sss-adapter
extension ──> chain-symbol / chain-nem

chain-symbol ──> core
chain-nem ─────> core
sss-adapter ───> provider-api
provider-api ──> shared types only
```

禁止する依存は次のとおり。

- `core -> extension`
- `core -> provider-api`
- `core -> sss-adapter`
- `chain-* -> chrome.* / UI`
- `provider-api -> extension`
- `sss-adapter -> core / chain-*`

## 7. ドメインモデル

### 7.1 ネットワークと接続スコープ

```ts
type ChainKind = "symbol" | "nem";
type NetworkKind = "mainnet" | "testnet";

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
  vaultRef: string;
  createdAt: string;
  updatedAt: string;
}

type AccountSource =
  | { kind: "mnemonic"; secretRef: string; derivationPath: string }
  | { kind: "privateKey"; secretRef: string };

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
  createdAt: string;
  updatedAt: string;
}
```

Account のネットワークは所属 Profile から決定する。一つの Account は一つの秘密鍵を参照し、Symbol / NEM の Chain Adapter がその同じ鍵からチェーン固有のアドレスと公開鍵を導出する。いずれかの Identity が Profile と異なるネットワークのアドレスを持つ場合は保存を拒否する。最後の Account の削除と、存在しない Account をデフォルトにする更新を Core で拒否する。

新規 Profile 作成時は BIP39 英語 24 語のニーモニックを生成し、Symbol Desktop Wallet と同じ派生パスで初期 Account の鍵を導出する。その鍵を Symbol / NEM の両方へ入力し、それぞれの Identity を作成する。NEM ウォレットとのニーモニック互換性は持たない。派生パスとアカウント番号は互換テストの既知ベクトルとともに固定する。

### 7.3 Permission

```ts
interface PermissionGrant {
  origin: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}
```

接続許可は Profile 単位とする。許可された dApp は、その Profile の共用 Account から、要求チェーンに対応する Identity だけを取得できる。Account 単位の許可リストは持たない。

### 7.4 Approval

```ts
interface ApprovalRequest {
  id: string;
  type: "connect" | "signMessage" | "signTransaction";
  origin: string;
  profileId: string;
  scope: ConnectionScope;
  accountId?: string;
  requestDigest: string;
  summary: DisplayField[];
  createdAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "rejected" | "expired";
}
```

`summary` は表示専用とし、署名対象には使用しない。承認時は `requestDigest`、Origin、profileId、scope、accountId と元要求が一致することを再検証する。

## 8. Storage と暗号化

### 8.1 Storage の分離

| 領域 | 保存先 | 内容 |
| --- | --- | --- |
| 永続公開データ | `chrome.storage.local` | プロファイルごとの暗号化 Vault、公開プロフィール索引、設定、Permission、schema version |
| セッション | `chrome.storage.session` | プロファイルごとのロック状態、アクティブ ID、短寿命の承認索引 |
| メモリのみ | Service Worker のメモリ | 復号鍵、署名中の秘密情報、承認 Promise |

Service Worker の停止でメモリ状態が失われることを前提とする。承認待ち要求が再開できない場合は安全に失敗させ、承認済みとして扱わない。

### 8.2 保存形式

```ts
interface StoredEnvelope {
  schemaVersion: number;
  vaults: Array<{
    profileId: string;
    formatVersion: number;
    kdf: { name: string; salt: string; params: Record<string, number> };
    cipher: { name: string; iv: string; ciphertext: string };
  }>;
  publicIndex: PublicProfileIndex[];
  settings: PublicSettings;
  permissions: PermissionGrant[];
}
```

暗号方式をコードへ固定せず、`formatVersion`、KDF、salt、パラメータ、cipher、nonce / IV を保存する。認証付き暗号を使用し、改ざん時は復号を拒否する。具体的アルゴリズムとパラメータは脅威分析と性能計測後に ADR で確定する。

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
- `file:`, `data:`, `chrome:`, opaque origin 等は明示的な対応方針がない限り拒否する。
- ページが申告する `origin`、`profileId`、`accountId`、`scope` を信用せず、権限と保存状態に照合する。

### 9.3 Background → Approval UI

- 承認画面は `approvalId` のみを URL で受け取る。
- 詳細は Background から取得し、URL query に payload や秘密情報を含めない。
- ID は推測困難で一度限り、有効期限付きとする。
- Window close を reject として処理する。
- 同じ ID の二重 resolve を拒否する。

## 10. 接続と署名フロー

### 10.1 接続

```text
dApp.connect({ chain, network })
  → RPC schema 検証
  → sender.url から Origin 確定
  → 指定 network のアクティブ Profile を特定
  → Origin + profileId の Permission を検索
  → 未許可なら承認画面
  → 承認された Profile の Permission を保存
  → 共用 Account を指定 chain の Identity に射影して返却
```

ロック中に公開アカウント情報を返すかは、プライバシー要件として別途確定する。少なくとも未許可 Origin には返さない。

### 10.2 署名

```text
dApp.sign*({ chain, network, ...params })
  → Origin / Permission / profile / account を検証
  → Profile の network と要求 network の一致を検証
  → 対象 Profile のロック状態を検証
  → Chain Adapter で payload を検証・解析
  → payload の chain / network と要求値の一致を検証
  → 未知の本文でも scope と基本構造を検証できれば警告を生成
  → 元要求の digest を生成
  → 承認画面で解析結果と警告を表示
  → 承認時に Origin / profile / scope / account / digest / timeout を再検証
  → SecretRef を使って Chain Adapter で署名
  → 秘密情報を破棄
  → 署名結果または安定したエラーを返却
```

MosaicLynx は署名結果をネットワークへアナウンスしない。

## 11. セッションとロック

- 拡張機能起動時の既定値は全 Profile locked とする。
- 復号鍵は永続 Storage に保存しない。
- Profile の手動ロック時は、その Profile の復号鍵、秘密情報、署名待ち要求を破棄する。
- 自動ロックは UI の表示時間ではなく、Profile ごとの最終アクティビティから計測し、初期値は15分とする。
- ブラウザ終了、端末のスリープからの復帰、Service Worker 再起動時は全 Profile locked とする。
- 複数タブからの要求は直列化または明示的にキュー管理し、どの Origin の要求かを混同しない。

パスワード、KDF salt、暗号文、ロック状態は Profile ごとに独立させる。一つの Profile のアンロック結果を別の Profile へ流用しない。

- パスワードは12文字以上とし、文字種を強制しない。
- ヒントは任意の公開メタデータとして保存し、Vault の復号なしで表示できるものとする。
- 失敗試行への遅延は UI だけに依存せず、セッション状態として管理する。
- 失敗回数を理由に Vault を削除したり、恒久的に復号不能にしたりしない。

## 12. Provider Event

Background は状態変更後に、該当する接続済み Origin の tab / frame だけへ Event を送る。

| Event | 発火条件 |
| --- | --- |
| `accountsChanged` | Origin に公開中のアカウント集合またはアクティブアカウントが変わった |
| `disconnect` | Origin の接続許可が削除された |

全タブへの無差別 broadcast は行わない。URL 解析に失敗した tab は通知対象外とする。

接続済み Profile とは異なるネットワークの Profile を拡張機能 UI で選択しても、dApp の接続コンテキストを暗黙に変更しない。必要な場合は既存接続を無効化して `disconnect` を通知し、dApp に再接続を要求する。

## 13. エラー設計

Provider は最低限、次の安定したコードを持つ。

| Code | 意味 |
| --- | --- |
| `USER_REJECTED` | ユーザーが拒否、画面を閉じた、または承認が期限切れ |
| `UNAUTHORIZED_ORIGIN` | Origin に必要な接続許可がない |
| `VAULT_LOCKED` | Vault がロック中 |
| `INVALID_PARAMS` | request schema または値が不正 |
| `UNSUPPORTED_CHAIN` | チェーンまたはネットワークが未対応 |
| `ACCOUNT_NOT_FOUND` | 対象アカウントが存在しない、または許可範囲外 |
| `INVALID_TRANSACTION` | payload を検証できない |
| `CHAIN_MISMATCH` | 要求、Account、payload のチェーンが一致しない |
| `NETWORK_MISMATCH` | 要求、Profile、payload のネットワークが一致しない |
| `REQUEST_EXPIRED` | 要求が有効期限を超えた |
| `INTERNAL_ERROR` | 外部へ詳細を公開しない内部エラー |

内部例外、Storage key、スタックトレース、暗号エラーの詳細を Web ページへそのまま返さない。

## 14. オフライン署名

- 残高表示、ノード管理、トランザクション送信は実装しない。
- 鍵生成、アドレス導出、payload の検証・解析、署名をローカルで完結させる。
- Chain Adapter と Core から HTTP client への依存を排除する。
- ネットワーク識別に必要な定数は、対応 SDK またはバージョン管理されたローカル設定から取得する。
- トランザクション本文の一部が未知でも、ローカルでチェーン、ネットワーク、基本構造を検証できる場合は警告付き署名を許可する。
- チェーン、ネットワーク、基本構造のいずれかを検証できない payload は拒否する。

## 15. ローカライズと UI

- UI 文字列を React component に直書きせず、翻訳 key で管理する。
- 日本語と英語で同一のセキュリティ情報を表示する。
- Chain、Network、Origin、Address は翻訳によって意味が曖昧にならない表示とする。
- Mainnet / Testnet は色だけに依存せず、文字とアイコンを併用する。
- 承認画面は popup 本体と独立した route / entry point とし、要求ごとの状態だけを表示する。

UI から Core ユースケースを直接呼ばず、Application Controller を介して状態変更とエラー変換を行う。

## 16. テスト戦略

### 16.1 Core unit test

- Profile のネットワークと異なる Symbol / NEM Identity の保存拒否
- 最後の共用 Account 削除の拒否
- Permission の Origin / profile 制約
- locked 状態での署名拒否
- 状態遷移とエラーコード

### 16.2 Chain Adapter test

- 一つの鍵からの Symbol / NEM Identity 導出
- Symbol / NEM × Mainnet / Testnet の4接続スコープにおけるインポート・アドレス導出
- ニーモニックと派生パスの既知ベクトル
- メッセージ署名の既知ベクトル
- トランザクション解析・署名の既知ベクトル
- 不正 payload、別ネットワーク payload の拒否
- scope を検証できる未知 transaction の警告付き署名

### 16.3 Provider / SSS contract test

- 公開メソッドから内部 RPC への mapping
- Event payload と API version
- 全 Provider エラーコード
- SSS 対応表の各メソッド
- 未対応 SSS API の安全な失敗

### 16.4 Extension integration / E2E

- In-page → Content → Background → Approval の往復
- `sender.url` と偽装 Origin の不一致拒否
- 未接続 Origin からの情報取得・署名拒否
- 承認、拒否、window close、timeout、二重 resolve
- Service Worker 再起動後の locked 復元
- 自動ロック
- 複数 Origin / 複数 tab の並行要求
- Storage migration と暗号データ改ざん拒否

MVP の自動テストはノードへ接続せず、固定ベクトルで再現可能にする。

## 17. 実装上の優先課題

現行コードはアーキテクチャの骨格を備えているが、プロダクション利用前に次が必要である。

1. Symbol Desktop Wallet の派生パスを既知ベクトルとして固定する。
2. `chrome.storage` 用 Repository と versioned migration を実装する。
3. 認証付き暗号と KDF を用いる Vault Adapter を実装する。
4. 現在 Background 内にある一時状態・権限・承認処理を Application Service へ分離する。
5. Chain Adapter にニーモニック派生、解析、署名を追加する。
6. 承認要求へ timeout、window close、digest 再検証、二重解決防止を追加する。
7. `host_permissions: <all_urls>` の必要性を再評価し、最小権限化する。
8. SSS Adapter の `requestSSS()` / `isAllowedSSS()` を実権限へ接続する。
9. Provider から管理 API を削除し、接続・署名引数へ chain / network を追加する。
10. CSP、RPC schema validation、E2E security test を追加する。

## 18. ADR が必要な項目

次は決定理由と移行影響が大きいため、仕様確定後に Architecture Decision Record を残す。

- ADR-001: ネットワーク単位 Profile と Profile Vault
- ADR-002: BIP39 英語 24 語、Symbol 互換派生パス、Symbol / NEM 共用鍵
- ADR-003: KDF、暗号方式、パラメータと password rotation
- ADR-004: Origin + Profile 単位の Permission
- ADR-005: Provider からの管理 API 削除と chain / network 検証
- ADR-006: scope 検証可能な未知 transaction の警告付き署名
- ADR-007: Service Worker 再起動・自動ロック時のセッション方針
