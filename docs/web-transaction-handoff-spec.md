# MosaicLynx SDK Web トランザクション受け渡し仕様

## 1. 文書の目的

本書は、dApp が MosaicLynx へトランザクション署名を要求し、署名済みトランザクションを受け取るための Web 向け統合仕様を定義する。

Web ページ向けライブラリの正式名称は **MosaicLynx SDK**、npm package 名は `@mosaiclynx/sdk` とする。SDK は Chrome 拡張機能へ直接渡す方式と、スマートフォンアプリへリレー経由で渡す方式の差を隠蔽し、dApp に一つの `signTransaction()` を公開する。Extension AdapterはExtension MVP、Mobile Relay AdapterとRelay / AppはMobileマイルストーンの提供物である。本書のv1は両者の最終契約を定義するが、Mobile実装をExtension MVPの受け入れ条件には含めない。

MosaicLynx 全体のプロダクト要件は [Product Specification](./product-spec.md)、コンポーネントの責務と依存方向は [Architecture](./architecture.md)、鍵・network・transaction・署名byteの固定契約は [Chain Compatibility Specification](./chain-compatibility-spec.md) に定義する。本書と共通仕様が矛盾する場合、署名可否はProduct Specification、chain byte規則はChain Compatibility Specification、Web受け渡しprotocolは本書を適用する。

## 2. 対応範囲

### 2.1 v1 の対象

- Symbol Mainnet / Testnet のトランザクション署名
- NEM Mainnet / Testnet のトランザクション署名
- Chrome 拡張機能 Provider への直接受け渡し
- 同一スマートフォン上の Web ブラウザから MosaicLynx アプリへの受け渡し
- E2E 暗号化した一時リレーによる要求と結果の往復
- Extension / Mobile Relay 間で共通化した結果型とエラー型

v1のrelease単位は次のとおりとする。

| マイルストーン | 必須範囲 |
| --- | --- |
| Extension MVP | SDK公開API、Extension Adapter、Provider 2.x、共通結果検証 |
| Mobile v1 | Mobile Relay Adapter、Relay、iOS / Android App、verified App Link、Origin proof、mobile signer保証表示 |

### 2.2 v1 の対象外

- 構造化メッセージ署名と Legacy メッセージ署名
- SDK が公開するアカウント接続・一覧・切断 API
- PC の Web ページから QR code でスマートフォンへ渡すフロー
- dApp による transport の強制指定
- 任意リレー、自己ホストリレー、リレー URL の上書き
- 署名済みトランザクションのノードへの announce
- Relay による transaction の解析、署名、broadcast、長期保管

dApp は SDK から受け取った署名済みトランザクションを検証し、必要な場合は自身の責任でノードへ announce する。

## 3. 用語

| 用語 | 意味 |
| --- | --- |
| SDK | dApp が組み込む `@mosaiclynx/sdk` |
| Provider | Chrome 拡張機能が公開する `window.mosaicLynx` |
| Extension Adapter | SDK 内で Provider を呼び出す非公開 Adapter |
| Mobile Relay Adapter | SDK 内でリレーセッションと App Link を扱う非公開 Adapter |
| Relay | E2E 暗号文を短時間だけ保管する MosaicLynx 管理サービス |
| App Link | iOS Universal Links / Android App Links で MosaicLynx アプリを開く verified HTTPS URL |
| capability token | Relay API の操作権限を与える推測困難な bearer token |
| session secret | request / response 暗号鍵の導出に使う 256-bit secret |
| initiator Origin | SDK が `window.location.origin` から取得して要求へ含める Origin。モバイルアプリからは独立検証できない |

## 4. SDK の命名と配布

次の名称を公開契約として使用する。

| 対象 | 名称 |
| --- | --- |
| 表示名 | MosaicLynx SDK |
| npm package | `@mosaiclynx/sdk` |
| 公開 interface | `MosaicLynxSDK` |
| factory | `createMosaicLynxSDK()` |
| 標準 instance 名 | `mosaicLynx` |
| 拡張機能 Provider | `window.mosaicLynx` |
| SDK API version | `1.0.0` |
| 必須 Provider API | `2.x` |
| Relay protocol | `mosaiclynx.relay.v1` |

npm scope の取得可否は公開準備時に確認する。scope を取得できない場合も、製品名、interface 名、factory 名、Relay protocol 名は変更しない。package 名を変更する場合は配布文書だけを更新する。

SDK は browser ESM build と、型宣言を含む npm package として配布する。remote script や CDN から実行時 code を取得せず、依存を build artifact に固定する。

## 5. 公開 API

### 5.1 型定義

```ts
type MosaicLynxChain = "symbol" | "nem";
type MosaicLynxNetwork = "mainnet" | "testnet";

interface MosaicLynxSignTransactionParams {
  chain: MosaicLynxChain;
  network: MosaicLynxNetwork;
  payload: string;
  expectedSignerPublicKey?: string;
}

interface SignedTransaction {
  payload: string;
  hash: string;
  signerPublicKey: string;
}

interface MosaicLynxSDK {
  readonly version: string;

  isAvailable(): Promise<boolean>;

  signTransaction(
    params: MosaicLynxSignTransactionParams,
  ): Promise<SignedTransaction>;
}

interface MosaicLynxSDKOptions {
  diagnostics?: {
    enabled: boolean;
    onEvent?(event: MosaicLynxDiagnosticEvent): void;
  };
}

declare function createMosaicLynxSDK(
  options?: MosaicLynxSDKOptions,
): MosaicLynxSDK;
```

標準利用例は次のとおりとする。

```ts
import { createMosaicLynxSDK } from "@mosaiclynx/sdk";

const mosaicLynx = createMosaicLynxSDK();

button.addEventListener("click", async () => {
  const signedTransaction = await mosaicLynx.signTransaction({
    chain: "symbol",
    network: "mainnet",
    payload,
    expectedSignerPublicKey,
  });

  await announce(signedTransaction.payload);
});
```

### 5.2 公開 API の規則

- dApp は transport を選択、設定、判定してはならない。SDK が環境に応じて選択する。
- 公開引数または返却値へ transport 名、Relay URL、session ID、capability token、session secret、拡張機能の `accountId` を含めない。
- `payload` は chain SDK が生成した lowercase / uppercase いずれかの偶数長 hexadecimal を受け付け、内部検証前に大文字小文字以外を変換しない。decoded byte length は 256 KiB 以下とする。
- `expectedSignerPublicKey` は任意とする。指定された場合は chain の形式へ正規化した後、実際の signer public key との完全一致を必須とする。不一致は `SIGNER_MISMATCH` とし、署名結果を返さない。
- `expectedSignerPublicKey` がない場合、Extension は接続許可されたアクティブアカウント、Mobile App は承認画面でユーザーが選択したアカウントを使用する。
- 同一 SDK instance の同時要求は許可するが、各要求は独立した request ID と Relay session を持つ。SDK は応答を request ID で分離する。
- `signTransaction()` は App Link を開く可能性があるため、click / tap などの user activation を持つ同期的な event handler から呼び始める。事前の非同期処理で user activation を消費してから呼ぶことを対応対象としない。

### 5.3 `isAvailable()`

`isAvailable()` は次のいずれかで `true` を返す。

- 対応 Provider API version の `window.mosaicLynx` を検出した。
- Provider はないが、SDK の support matrix にある mobile browser で Web Crypto、`fetch`、Page Visibility API、verified HTTPS App Link の起動条件を満たす。

`isAvailable()` はモバイルアプリがインストール済みであることを保証しない。Web platform から確実に判定できないため、未インストールは App Link 起動後の fallback または timeout で扱う。UA / client hint による mobile 判定は transport 選択の UX hint であり、セキュリティ境界として使用しない。

## 6. Transport の自動選択

SDK は `signTransaction()` ごとに次の順序で transport を選択する。

1. `window.mosaicLynx` の存在、必要メソッド、Provider API major version `2` を検証する。
2. 対応 Provider があれば必ず Extension Adapter を選択する。
3. Provider がなく、対応 mobile browser と判定できれば Mobile Relay Adapter を選択する。
4. Provider がない desktop browser、非対応 browser、必要 Web API がない環境では `UNAVAILABLE` を返す。

`window.mosaicLynx` が存在するが API major version が非対応の場合は downgrade fallback を行わず `UNAVAILABLE` を返す。非対応 Provider がある状態を「Provider がない」とみなして Mobile Relay を選択してはならない。

一度 transport を選択した後は、同じ要求を別 transport へ切り替えない。次の場合も自動 fallback を禁止する。

- 接続または署名をユーザーが拒否した。
- Vault がロック中である。
- Provider または Relay が error を返した。
- transaction、chain、network、signer の検証に失敗した。
- App Link を開けなかった、または要求が timeout した。

再試行は新しい user activation から `signTransaction()` を呼び、新しい request ID、secret、token と再承認を生成する。

### 6.1 Extension Adapter

Extension Adapter は次の処理を SDK 内部で行う。

1. `getAccounts()` で要求 scope に対する接続済みアカウントを確認する。
2. 接続済みアカウントがない場合は `connect({ chain, network })` を呼ぶ。
3. `expectedSignerPublicKey` がある場合、許可済みアカウントから一致する `accountId` を特定する。一致しなければ `SIGNER_MISMATCH` とする。
4. Provider の `signTransaction({ chain, network, payload, accountId })` を呼ぶ。
5. 結果の signer、chain 固有 hash、signed payload と元要求の対応を検証し、共通 `SignedTransaction` を返す。

接続承認と署名承認は統合せず、Provider の別々のユーザー確認として維持する。Provider の error は 10 章の共通 error へ変換する。

### 6.2 Mobile Relay Adapter

Mobile Relay Adapter は、session 生成、暗号化、Relay 登録、App Link 起動、応答待機、復号、結果検証、ACK / cancel を SDK 内部で行う。dApp へ中間状態や Relay credential を公開しない。

## 7. Mobile Relay protocol

### 7.1 論理要求

SDK は次の object を RFC 8785 JCS で canonicalize し、SHA-256 digest を計算してから暗号化する。

```ts
interface OriginProof {
  version: "mosaiclynx.origin.v1";
  keyId: string;
  algorithm: "Ed25519";
  signature: string; // paddingなしbase64url
}

interface RelaySigningRequest {
  protocol: "mosaiclynx.relay.v1";
  operation: "signTransaction";
  requestId: string;
  initiatorOrigin: string;
  originProof?: OriginProof;
  chain: "symbol" | "nem";
  network: "mainnet" | "testnet";
  payload: string;
  expectedSignerPublicKey?: string;
  createdAt: string;
  expiresAt: string;
}
```

Mobile Mainnet要求では`originProof`を必須とする。Mainnetの`initiatorOrigin`はpublic DNSへ解決するHTTPS・既定port 443に限定する。SDKはrequestId生成後、同一Originの`POST /.well-known/mosaiclynx/sign-request`へ次のJCS objectを`Content-Type: application/json`、`credentials: "omit"`、`redirect: "error"`、`cache: "no-store"`で送る。

```ts
interface OriginProofInput {
  version: "mosaiclynx.origin.v1";
  requestId: string;
  initiatorOrigin: string;
  chain: "symbol" | "nem";
  network: "mainnet";
  payloadHash: string; // SHA-256(decoded transaction bytes), lowercase hex
  expiresAt: string;
}
```

dApp backendは入力schema、`initiatorOrigin`、TTLを検証し、`SHA-256(UTF8("mosaiclynx.origin.v1\0") || UTF8(JCS(OriginProofInput)))`をEd25519で署名して`OriginProof`を返す。SDKはresponseをそのまま信頼せずrequestへ含め、Appが独立検証する。

Appは`${initiatorOrigin}/.well-known/mosaiclynx.json`から次のmanifestを取得する。redirect、cross-origin、DNS rebinding、loopback / link-local / private / reserved address、HTTP downgrade、32 KiB超過を拒否する。DNS解決結果を接続先IPと照合し、取得全体を3秒でtimeoutする。

```ts
interface OriginKeyManifest {
  version: "mosaiclynx.origin-keys.v1";
  origin: string;
  keys: Array<{
    keyId: string;
    algorithm: "Ed25519";
    publicKey: string;
    notBefore: string;
    notAfter: string;
    status: "active" | "revoked";
  }>;
}
```

manifestの`origin`完全一致、key ID、algorithm、有効期間、statusを検証する。`Cache-Control`に従う上限24時間cacheとし、失効keyを受理しない。Testnetはproofなしを許容できるが「要求元未検証」を表示する。

- `requestId` は CSPRNG で生成した 128-bit 値の padding なし base64url とする。
- `initiatorOrigin` は SDK 自身が `window.location.origin` から取得し、dApp 引数では上書きできない。
- 日時は UTC の RFC 3339、秒精度、fraction なしとする。
- `expiresAt` は `createdAt` の5分後とし、Relay と App は延長しない。
- `requestDigest` は `SHA-256(JCS(RelaySigningRequest))` の lowercase hexadecimal とする。

### 7.2 論理応答

Mobile App は成功、拒否、検証失敗をいずれも暗号化した response envelope として返す。Relay の session state からユーザーの判断結果を識別できないようにする。

```ts
type RelaySigningResponse =
  | {
      protocol: "mosaiclynx.relay.v1";
      requestId: string;
      requestDigest: string;
      outcome: "signed";
      signedTransaction: SignedTransaction;
      completedAt: string;
    }
  | {
      protocol: "mosaiclynx.relay.v1";
      requestId: string;
      requestDigest: string;
      outcome: "rejected" | "failed";
      errorCode: MosaicLynxSDKErrorCode;
      completedAt: string;
    };
```

`failed` response の `errorCode` は公開可能な安定コードだけとし、parser、Vault、OS、暗号 library の内部詳細を含めない。

### 7.3 フロー

```text
dApp
  → SDK.signTransaction(params)
  → SDK が requestId / sessionId / secret / tokens を生成
  → RelaySigningRequest を canonicalize、digest、暗号化
  → Relay に暗号文を登録
  → verified App Link で MosaicLynx App を起動
  → App が暗号文を取得、復号、全 transaction を解析
  → App で account 選択、unlock、明示承認
  → App が署名または拒否結果を暗号化して Relay へ登録
  → 元ページの SDK が response を取得、復号、整合性を検証
  → SDK が ACK 後に SignedTransaction または共通 error を返す
  → dApp が必要に応じて announce
```

SDK は App Link を現在の browsing context から開く。アプリがインストール済みの正常系では新しい browser tab を作らない。アプリ未導入時の HTTPS fallback は正常な署名フローではなく、fallback page は fragment を network、log、analytics へ送らず、URL から直ちに除去して導入案内を表示する。

App Link は次の形式とする。

```text
https://link.mosaiclynx.app/v1/handoff/{sessionId}#s={sessionSecret}&a={appToken}
```

- `sessionId` は 128-bit CSPRNG 値の padding なし base64url とする。
- `sessionSecret` と `appToken` は各 256-bit CSPRNG 値の padding なし base64url とする。
- URL fragment は HTTP request、Referer、server access log へ送らない。
- App は scheme、host、path、ID と fragment の形式を strict validation し、未知 field、重複 field、過剰長を拒否する。
- iOS は Associated Domains、Android は Digital Asset Links により `link.mosaiclynx.app` と正規アプリを関連付ける。custom URL scheme は v1 の標準経路にしない。
- HTTPS fallback pageはthird-party script、analytics、service workerを持たず、`default-src 'none'; script-src`を固定したhash付きfirst-party bootstrapだけに限定する。bootstrapは最初の同期処理でfragmentをstrict parseし、必要な導入判定後に`history.replaceState()`でfragmentを除去する。fragment、session ID、tokenをDOM、browser storage、error reportingへ渡さない。

### 7.4 App の署名前検証

App は Core と Chain Adapter を再利用し、Product Specification 12.4 の transaction allowlist と上限を適用する。最低限、次をすべて満たすまで承認画面を表示しない。

- Relay protocol、schema、request ID、日時、TTL が有効である。
- AEAD の認証に成功し、request digest が再計算結果と一致する。
- payload の decoded byte length が 256 KiB 以下である。
- chain、network、transaction type / version、全 field、inner transaction を解析できる。
- decode 後の canonical serialization が元 payload と byte-for-byte で一致する。
- `expectedSignerPublicKey` がある場合、選択可能な account と一致する。
- Mainnetでは`originProof`が同一Originのwell-known manifestに登録された未失効鍵で検証できる。

`initiatorOrigin` は Relay による改ざんからAEADで保護されるだけでは、ブラウザの実際のOriginを証明しない。AppはMainnetで上記`originProof`を検証し、成功時だけ「登録鍵で検証済み」と表示する。Testnetでproofがない場合は「要求元（未検証）」としてcanonical / Punycode表記を表示し、Extension承認画面の検証済みOriginと同じ保証があるように表示しない。

### 7.5 Mobile Signer保証

- Mobile Appの秘密鍵はiOS Keychain / Secure EnclaveまたはAndroid Keystoreのhardware-backed keyで直接Symbol/NEM署名が可能な場合、`Hardware-backed`として扱う。
- OS APIが対象algorithmの直接署名を提供しない場合は、hardware-backed wrapping keyでVault keyをwrapし、秘密鍵自体はApp memoryで短時間利用する。この方式は`OS-backed Software Vault`でありSecure Enclave内署名と表示しない。
- hardware-backed wrappingも利用できない端末ではpassword + Argon2idの`Software Vault`として明示し、Mainnetを既定無効にする。ユーザーが設定で有効化する場合は端末保証の低下を再確認する。
- biometric / device credentialはOSのuser-presence gateとして署名要求ごとに使用する。biometric data、passcode、assertionをWebまたはRelayへ返さない。
- rooted / jailbroken判定、hardware attestation失敗、screen overlay / accessibility abuse検知はrisk signalとして表示・policy評価するが、単一のheuristicだけで鍵を削除しない。
- App background、device lock、screen capture開始、5分timeout、memory warning、operation cancelでsecret handleを無効化する。Mainnet署名画面ではOSのscreen capture抑止APIを利用可能な範囲で有効にする。

## 8. E2E 暗号化

### 8.1 鍵導出

SDK と App は session secret から次の二つの AES key を導出する。

```text
salt = SHA-256(UTF8("mosaiclynx.relay.v1\0" + sessionId))
requestKey  = HKDF-SHA-256(sessionSecret, salt, UTF8("request"), 32)
responseKey = HKDF-SHA-256(sessionSecret, salt, UTF8("response"), 32)
```

session secret、導出鍵、raw capability token は永続 storage、URL query、log、telemetry、error へ保存しない。Web page では SDK instance のメモリだけに保持し、完了、cancel、timeout、page disposal 時に参照を破棄する。

### 8.2 暗号形式

request と response は AES-256-GCM で暗号化する。

```ts
interface EncryptedRelayEnvelope {
  algorithm: "A256GCM";
  nonce: string;
  ciphertextAndTag: string;
}
```

- nonce は暗号化ごとに CSPRNG で生成した 96-bit 値とし、padding なし base64url で表現する。
- `ciphertextAndTag` は Web Crypto が返す ciphertext と 128-bit authentication tag の連結を padding なし base64url で表現する。
- plaintext は論理 request / response を JCS canonicalize した UTF-8 byte 列とする。
- request と response で必ず別鍵を使用し、同じ鍵と nonce の組み合わせを再利用しない。

AAD は次の object を JCS canonicalize した UTF-8 byte 列とする。

```ts
interface RelayAAD {
  protocol: "mosaiclynx.relay.v1";
  sessionId: string;
  direction: "request" | "response";
  expiresAt: string;
}
```

Relay による session ID、direction、expiry、暗号文の差し替えは AEAD 認証失敗として拒否する。復号 error の詳細は外部へ返さず `INVALID_RESPONSE` または `INTERNAL_ERROR` へ正規化する。

## 9. Relay HTTP API

### 9.1 共通要件

- Origin は `https://relay.mosaiclynx.app`、API prefix は `/v1` に固定し、SDK option や dApp 引数で変更できない。以下のendpoint表記はこのOriginに対する絶対pathである。
- TLS 1.2 以上を必須とし、HSTS を有効にする。
- Cookie、HTTP authentication、user account、transaction ID tracking を使用しない。
- credential を必要とする endpoint は `Authorization: Bearer {capabilityToken}` を使用する。
- token は256-bit CSPRNG値とし、Relay は `SHA-256(token)` だけを保存して constant-time 比較する。
- response に `Cache-Control: no-store` と `Referrer-Policy: no-referrer` を付ける。
- browser API は credential なしの CORS を許可し、許可 method / header を必要最小限にする。cookie を許可しない。
- Relay は session ごとに decoded transaction 256 KiB、暗号化 HTTP body 512 KiBを上限とし、IP と時間窓ごとの作成数・総 byte 数を rate limit する。
- error response は request body、token、session の存在を推測できる詳細を返さない。

### 9.2 Session の作成

```http
POST /v1/handoffs
Content-Type: application/json
```

```ts
interface CreateHandoffRequest {
  protocol: "mosaiclynx.relay.v1";
  sessionId: string;
  requestId: string;
  expiresAt: string;
  appTokenHash: string;
  webTokenHash: string;
  request: EncryptedRelayEnvelope;
}
```

SDK が session ID、両 token と token hash を生成するため、request 暗号化と Relay 登録を一回の request で行える。Relay は ID の形式、一意性、期限、body size、algorithm と envelope の外形だけを検証し、暗号文を復号しない。

成功時は `201 Created` と session ID、確定した expiry だけを返す。Relay は SDK が指定した expiry を変更してはならず、受理できない場合は session を作成せず拒否する。ID が既存の場合は新しい ID で最初からやり直し、既存 session を更新しない。

### 9.3 App による要求取得

```http
GET /v1/handoffs/{sessionId}/request
Authorization: Bearer {appToken}
```

成功時は request envelope、protocol、session ID、expiry を返す。同じ App token による期限内の再取得は冪等とする。存在しない、token 不一致、cancelled、expired は外部から区別しにくい共通 error とする。

### 9.4 App による応答登録

```http
PUT /v1/handoffs/{sessionId}/response
Authorization: Bearer {appToken}
If-None-Match: *
Content-Type: application/json
```

body は `EncryptedRelayEnvelope` とする。`pending → response_available` の compare-and-set に成功した最初の一回だけを受理する。同じ暗号文の再送は冪等成功としてよいが、異なる暗号文、`response_available` 後の上書き、cancel / expiry 後の登録を拒否する。

### 9.5 Web による応答待機

```http
GET /v1/handoffs/{sessionId}/response?wait=25
Authorization: Bearer {webToken}
```

Relay は最大25秒の long polling を許可する。応答がなければ `204 No Content`、あれば response envelope を返す。SDK は page visibility と network 状態を考慮し、即時再接続ループを避け、1秒から最大5秒まで backoff する。expiry を超えて polling しない。

### 9.6 ACK と cancel

```http
POST /v1/handoffs/{sessionId}/ack
Authorization: Bearer {webToken}

DELETE /v1/handoffs/{sessionId}
Authorization: Bearer {webToken}
```

SDK は response の復号と全検証に成功した後だけ ACK する。ACK は `response_available → consumed` へ遷移し、Relay は session data を直ちに purge する。`DELETE` は未完了 session を `cancelled` として purge する。ACK / cancel は同じ token に対して冪等とする。

### 9.7 状態遷移と削除

```text
pending → response_available → consumed
   ├────────────────────────→ cancelled
   └────────────────────────→ expired
response_available ─────────→ expired
```

- `consumed`、`cancelled`、`expired` は終端状態である。
- expiry は作成から5分を超えず、client request による延長を許可しない。
- 終端遷移時に request / response 暗号文、token hash、session metadata を active storage から削除する。
- 非同期 purge のために tombstone が必要な場合、session ID の keyed hash、終端状態、削除期限だけを最大24時間保持できる。token hash、暗号文、Origin、request ID は tombstone に含めない。
- 暗号文を backup、analytics、APM payload、application log に含めない。

## 10. Error の抽象化

```ts
type MosaicLynxSDKErrorCode =
  | "USER_REJECTED"
  | "UNAVAILABLE"
  | "APP_NOT_INSTALLED"
  | "VAULT_LOCKED"
  | "REQUEST_EXPIRED"
  | "INVALID_PARAMS"
  | "INVALID_TRANSACTION"
  | "UNSUPPORTED_TRANSACTION"
  | "CHAIN_MISMATCH"
  | "NETWORK_MISMATCH"
  | "SIGNER_MISMATCH"
  | "CONTEXT_CHANGED"
  | "INVALID_RESPONSE"
  | "INTERNAL_ERROR";

class MosaicLynxSDKError extends Error {
  readonly code: MosaicLynxSDKErrorCode;
}
```

SDK は transport 固有 error を次の共通規則で正規化する。

| 状況 | Code |
| --- | --- |
| 接続または署名をユーザーが拒否 | `USER_REJECTED` |
| 対応 transport がない | `UNAVAILABLE` |
| OS が未導入を確定、または管理 fallback page が通知 | `APP_NOT_INSTALLED` |
| 未導入を確定できず TTL 到達 | `REQUEST_EXPIRED` |
| Vault がロックされ、フロー内で解除されなかった | `VAULT_LOCKED` |
| request schema、サイズ、encoding が不正 | `INVALID_PARAMS` |
| transaction が不正または非 canonical | `INVALID_TRANSACTION` |
| allowlist 外の type / version | `UNSUPPORTED_TRANSACTION` |
| chain / network 不一致 | `CHAIN_MISMATCH` / `NETWORK_MISMATCH` |
| expected / selected / actual signer 不一致 | `SIGNER_MISMATCH` |
| navigation、page disposal、権限・状態変更 | `CONTEXT_CHANGED` |
| response の AEAD、digest、request ID、payload 対応が不正 | `INVALID_RESPONSE` |
| 外部へ詳細を公開しない失敗 | `INTERNAL_ERROR` |

Relay の HTTP status、URL、token、暗号 error、Provider 内部例外、stack trace は SDK error message に含めない。`cause` を本番 build の公開 error へ保持しない。

## 11. Page lifecycle と UX

- SDK は要求開始時の `window.location.origin` と top-level document を保持する。
- iframe、opaque Origin、`file:`、`data:`、browser internal page から Mobile Relay を開始しない。
- 応答待機中に Origin が変わる navigation、page disposal、SDK cancel が発生した場合は Relay を cancel し、結果を返さない。
- document が background になっても session は expiry まで待機できる。復帰時に request ID と expiry を再検証する。
- App から browser を開き直す callback link は使用しない。元ページが Relay response を待機取得する。
- App Link 起動ボタンには MosaicLynx App が開くこと、要求が5分で期限切れになることを表示する。
- App がロック中の場合、App 内で unlock する。Web page に password、passkey assertion、biometric data を入力または返却させない。
- 拒否、App close、timeout は署名されていない状態として完了する。

## 12. Diagnostics と privacy

diagnostics は既定で無効とする。有効時も次の allowlist だけを通知できる。

```ts
interface MosaicLynxDiagnosticEvent {
  phase:
    | "transport_selected"
    | "approval_requested"
    | "response_received"
    | "completed"
    | "failed";
  transport: "extension" | "mobile-relay";
  timestamp: string;
  errorCode?: MosaicLynxSDKErrorCode;
}
```

diagnostics、Relay log、telemetry に payload、signed payload、hash、public key、Origin、request ID、session ID、token、secret、URL、暗号文を含めない。SDK は diagnostics callback の例外を署名フローへ伝播させない。

## 13. Security requirements

- Relay は機密性、完全性、真正性の信頼点にしない。Relay の侵害時も transaction と署名結果を復号・改ざんできないことを設計目標とする。
- App Link domain と正規 App の association file を TLS、変更承認、監視で保護する。
- App と SDK は Relay response を schema validation してから使用し、prototype pollution、過剰 JSON depth、duplicate key、未知 algorithm を拒否する。
- capability token は bearer credential として扱い、URL path / query、Referer、log、Clipboard へ出さない。
- full App Link を Clipboard、analytics、crash report、browser storage へ保存しない。
- Relay は request body を WAF / APM が記録しない設定とし、access log から Authorization header と query を除外する。
- request / response の AEAD 検証前に plaintext を UI、log、domain object として扱わない。
- signed response は元 request digest、chain、network、expected signer と照合し、別 request へ転用しない。
- SDK は受領した signed payload が元 unsigned transaction と chain 規則上対応することを検証する。
- Web page 自身の侵害、悪意ある dApp、端末 OS、アンロック中 App、正規配布 artifact の侵害は E2E Relay 暗号化の保証範囲外である。
- initiator Origin文字列だけを検証根拠にしない。Mainnetはorigin proofを必須とし、Testnetでproofがない場合だけ未検証と表示する。proofはOriginの登録鍵による要求整合性を示すもので、サイト運営主体の善性、transactionの安全性、Web page非侵害までは保証しない。

## 14. 受け入れ条件とテスト

### 14.1 SDK contract test

- 同じ `signTransaction()` 呼び出しが Extension と Mobile Relay の両方で共通 `SignedTransaction` を返す。
- 公開 API に transport 固有の option、credential、`accountId` がない。
- Provider が存在する場合は Relay session を作成しない。
- Provider がない対応 mobile browser だけが Mobile Relay を選択する。
- Provider がない desktop / 非対応環境は `UNAVAILABLE` を返す。
- 拒否、失敗、timeout 後に transport を切り替えない。
- 未接続 Extension は接続承認後に署名承認へ進む。
- `expectedSignerPublicKey` が両 transport で同じ意味を持つ。
- Provider / Relay 固有 error が共通 SDK error へ変換される。
- diagnostics が既定無効で、allowlist 外の情報を通知しない。

### 14.2 Crypto test

- JCS、request digest、HKDF、AAD、AES-GCM の固定 vector を Web と App の双方で共有する。
- request / response key の取り違えを拒否する。
- nonce、ciphertext、tag、session ID、direction、expiry の各改ざんを拒否する。
- 別 session の response、request ID 不一致、digest 不一致、replay を拒否する。
- 乱数生成失敗時は session を作成せず安全に失敗する。
- session secret と token が URL query、HTTP request、log、storage に現れない。

### 14.3 Relay integration test

- first-write-wins と全状態遷移を compare-and-set で保証する。
- token 不一致、token role の取り違え、二重応答、期限後応答を拒否する。
- long polling、network 切断、retry、ACK、cancel が冪等に動作する。
- 256 KiB decoded payload、512 KiB HTTP body の境界値と超過を試験する。
- ACK、cancel、expiry 後に暗号文と token hash が削除される。
- backup、application log、APM、access log に禁止データが含まれない。
- rate limit が既存 session の取得・完了を不必要に妨げない。

### 14.4 Mobile / browser E2E

- iOS Universal Links と Android App Links が正規 App を直接開く。
- インストール済み正常系で新しい browser tab を作らない。
- 未インストール fallback が fragment を送信・保存せず、導入案内を表示する。
- 元ページが開いたまま response を取得し、App から browser callback を開かない。
- App close、拒否、lock、timeout、navigation、page disposal で署名結果を返さない。
- App 承認画面がMainnetでは有効なorigin proofを必須とし「登録鍵で検証済み」、proofを省略できるTestnetでは「要求元（未検証）」と表示する。
- well-known manifestのredirect、期限切れ／失効key、wrong Origin、wrong request digest、改ざんproof、private-network解決を拒否する。
- hardware-backed / OS-backed Software Vault / Software Vaultの保証レベルを正しく表示し、非hardware-backed端末ではMainnetを既定無効にする。
- unknown / non-canonical / oversized transaction と signer 不一致を署名前に拒否する。
- Symbol / NEM × Mainnet / Testnet の対応 transaction 固定 vectorで署名結果を検証する。

## 15. 将来拡張

将来の protocol では、既存 v1 の意味を変更せず、新しい operation または major protocol を追加する。

- 構造化メッセージ署名
- アカウント接続と公開 Identity の取得
- PC とスマートフォン間の QR handoff
- transparency logまたは第三者認証を伴うdApp key directory（v1の同一Originwell-known方式を置換せず追加する）
- 組織向け policy / 二者承認 / hardware signer
- 明示的に信頼登録した自己ホスト Relay

破壊的変更は `mosaiclynx.relay.v2` と SDK major version で導入し、App は未知 protocol を安全側に拒否する。
