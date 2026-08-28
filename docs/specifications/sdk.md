# MosaicLynx SDK Specification

## 1. 目的

本書は、MosaicLynx SDK の外部から観測可能な API、Provider 連携、connection / permission 境界、署名要求の生成・配送・相関、結果および失敗の扱いを実装可能な契約として定義する。

SDK は Web Application / dApp と trusted Signer の間にある非特権の integration layer である。SDK は request を構築・dispatch・correlate するが、署名対象の最終検証、trusted presentation、利用者承認、authentication、秘密鍵操作または署名 authority ではない。

本書の規範語は次の意味を持つ。

- **MUST**: 対象範囲で必須である。
- **MUST NOT**: 対象範囲で禁止する。
- **SHOULD**: 原則として満たす。満たせない場合は理由と影響を記録する。
- **MAY**: 他の契約と Security Invariant に反しない範囲で許容する。
- **OPEN**: 本書だけでは決定できない。実装で独自に確定してはならない。

## 2. 適用範囲

### 2.1 対象

本書は、外部アプリケーションから SDK を利用する際の次の契約を対象とする。

- 公開 SDK API と Promise の完了・失敗 semantics
- Provider の discovery、capability / version の適合確認および選択境界
- connection、公開 Account disclosure、permission の利用境界
- transaction、structured message および既存公開範囲の cosignature request
- request construction、dispatch、response correlation および同時実行
- SDK 側の timeout / cancellation と signing request の expiry の分離
- local Provider と remote handoff の共通 semantics
- common error model への normalization

### 2.2 対象外

次は本書で新たに定義しない。

- Browser Extension の injected object、Chrome API、UI、storage および内部 message
- Mobile App の Deep Link、OS API、secure storage、device authentication および UI
- Relay endpoint、Redis、暗号化 envelope、session credential および transport wire protocol
- wallet-core の key storage、KDF、暗号アルゴリズム、署名 primitive および内部 API
- Symbol / NEM の transaction schema、署名 byte、hash、address および chain-specific validation の再定義
- transaction construction helper、任意 Relay の指定、SDK が公開する transport 選択 API
- Aggregate / multisig / cosignature の未確定な公開範囲

上記は、該当する既存仕様または未決事項へ委譲する。SDK はそれらの authority を代替しない。

## 3. 上流資料と規範性

次の資料を本書の上流契約として扱う。

- [Concept Sheet](../concept/concept-sheet.md)
- [共通要件](../requirements/requirements.md)
- [SDK 要件](../requirements/sdk.md)
- [Browser Extension 要件](../requirements/browser-extension.md)
- [Mobile App 要件](../requirements/mobile-app.md)
- [Relay 要件](../requirements/relay.md)
- [Architecture Design](../design/architecture.md)
- [SDK Design](../design/sdk.md)
- [共通 Interface / Data Model Design](../design/interfaces.md)
- [Signing Flow Design](../design/signing-flow.md)
- [Security Design](../design/security-design.md)
- [共通 Interface / Data Model Specification](./interfaces.md)
- [Signing Protocol Specification](./signing-protocol.md)
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)
- [Chain Compatibility Specification](./chain-compatibility-spec.md)
- [Profile / Account Specification](./profile-account-spec.md)

`interfaces.md` と `signing-protocol.md` は確定済みの共通契約である。本書は、それらが定める型、identifier、state、error、serialization、validation および signing semantics を再定義せず、SDK の責任分界へ適用する。

`MosaicLynxSDK` の公開型、Handoff の concrete error code および Handoff 固有の request / response は、[Web Transaction Handoff Specification §5、§7、§10](./web-transaction-handoff-spec.md) を正本とする。レビュー資料は整合性確認に使用し、追加の要求または API の根拠にはしない。

## 4. 用語

| 用語                 | 本書での意味                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| SDK                  | Web Application / dApp から MosaicLynx へ request を渡す非特権 integration layer                                |
| Provider             | SDK が発見・適合確認・連携する Extension またはその他の Signer 接続境界                                         |
| Signer               | Browser Extension または Mobile App。検証、表示、明示承認、authentication、署名を担う authority                 |
| connection           | SDK と Provider / Signer の連携文脈。permission や signing approval とは別である                                |
| permission           | Origin、Scope、Account 等に結び付いた Signer 側の許可。SDK が付与・拡張しない                                   |
| capability           | Provider / Signer が operation または Scope に対応可能であること。authorization ではない                        |
| signing request      | `requestId`、operation、Scope、Account context、expiry および signing target を持つ一つの logical request       |
| local signing        | SDK から Browser Extension Provider を経由する連携                                                              |
| remote handoff       | SDK から既存 Handoff / Relay を経由して Mobile App へ渡す連携                                                   |
| delivery success     | response が配送された状態。署名成功とは別である                                                                 |
| delivery disposition | known signed result に付随する Signer-side の配送状態。Relay ACK / consumed state とは別である                  |
| result unknown       | Signer が署名生成の成否を安全に確定できない状態。公開 API では error ではなく `outcome: 'resultUnknown'` とする |

## 5. SDK 公開 API

### 5.1 API の正本

SDK の公開 factory、instance、引数および戻り値は、[Web Transaction Handoff Specification §5.1](./web-transaction-handoff-spec.md) の `createMosaicLynxSDK`、`MosaicLynxSDKOptions`、`MosaicLynxSDK` および既存の operation-specific type を使用する。本書は新しい method、option、transport selector、callback または convenience API を追加しない。

公開 method の契約は次のとおりである。型の exact field、required / optional および encoding は同 Handoff Specification と [interfaces.md](./interfaces.md) の対応する節に従う。

公開 signing API は次の共通 discriminated union を使用する。

```ts
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
```

| Method                        | 引数                                | 戻り値                                                | 前提と意味                                                                                                                                                  |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isAvailable()`               | なし                                | `Promise<boolean>`                                    | Handoff §5.3 の選択可能な local Provider route または Mobile Relay route が存在する場合に true を返す。connection、permission、approval、署名成功を表さない |
| `connect(scope)`              | `MosaicLynxScope`                   | `Promise<MosaicLynxActiveAccount>`                    | 指定 Scope の公開 Account disclosure / connection を Signer に要求する。利用者の connection 許可が必要である                                                |
| `isConnected(scope)`          | `MosaicLynxScope`                   | `Promise<boolean>`                                    | UI を開かず、現在の Scope の connection / permission 状態を確認する。署名 approval ではない                                                                 |
| `getActiveAccount(scope)`     | `MosaicLynxScope`                   | `MosaicLynxActiveAccount \| undefined`                | SDK が保持する公開 Account の現在値を返す。cache は最新 permission や所有権の証明ではない                                                                   |
| `refreshActiveAccount(scope)` | `MosaicLynxScope`                   | `Promise<MosaicLynxActiveAccount \| undefined>`       | Provider / Signer に公開 Account を再照会する。署名を開始しない                                                                                             |
| `disconnect()`                | なし                                | `Promise<void>`                                       | 現在の Origin に対する既存の connection / permission を切断する。Scope 引数で一部だけを暗黙指定しない                                                       |
| `signTransaction(params)`     | `MosaicLynxSignTransactionParams`   | `Promise<MosaicLynxSigningResult<SignedTransaction>>` | transaction signing request を構築・dispatch し、known signed result または Signer-originated `RESULT_UNKNOWN` を返す                                       |
| `signData(params)`            | `MosaicLynxSignDataParams`          | `Promise<MosaicLynxSigningResult<SignedData>>`        | structured message signing request を構築・dispatch し、known signed data または Signer-originated `RESULT_UNKNOWN` を返す                                  |
| `cosignTransaction(params)`   | `MosaicLynxCosignTransactionParams` | `Promise<MosaicLynxCosignature>`                      | 既存公開 contract の範囲で cosignature request を扱う。公開必須能力や chain-specific scope は未決事項を閉じない                                             |

`MosaicLynxSDK.version` は SDK API version を返し、現行 Handoff contract の version は `1.0.0` である。`MosaicLynxSDKOptions` は Handoff §5.1 に定義された diagnostics option のみを公開する。transport、Relay URL、session credential、Account の内部 identifier または秘密情報を公開引数へ追加してはならない。

### 5.2 Promise と完了

- 各 API invocation は、対応する一つの logical request または照会操作に結び付く。
- 一つの invocation は一度だけ resolve または reject する。duplicate callback / response は既に完了した invocation を再完了させない。
- `signTransaction` と `signData` は、通常の failure / rejection なら Handoff §10 の既存 public error code で Promise を reject し、known signed result なら `outcome: 'succeeded'` として resolve し、Signer-originated `RESULT_UNKNOWN` なら `outcome: 'resultUnknown'` として resolve する。`RESULT_UNKNOWN` を exception、SDK error code、transport failure または internal exception へ変換しない。
- `outcome: 'succeeded'` は `result` と Signer-originated `deliveryDisposition` を必ず保持する。`deliveryDisposition: 'DELIVERY_UNKNOWN'` でも signing outcome は `SUCCEEDED` であり、既存 result を失わない。SDK 自身の response取得、ACK または transport completion を根拠に disposition を書き換えない。
- `cosignTransaction` は既存の `MosaicLynxCosignature` contract を維持する。cosignature に同じ result union を適用するか、公開必須能力とするかは `OPEN-SDK-004` 等の既存 OPEN を解消するまで本仕様で決定しない。
- `connect` の resolve は、指定 Scope の公開 Account disclosure と connection 許可の結果であり、後続 signing の user approval を意味しない。
- `isConnected`、`getActiveAccount` および `refreshActiveAccount` の結果は、署名 approval、Account ownership、Origin verification または transaction safety の証明ではない。
- rejection の error code、error type および mapping は [Handoff §10](./web-transaction-handoff-spec.md) と [interfaces.md §10](./interfaces.md) を使用し、SDK 独自の taxonomy を追加しない。

### 5.3 SDK が公開しない authority

SDK は次を公開 API の成功条件にしてはならない。

- connection、capability、公開 Account、cache、Provider response または Relay delivery
- dApp が指定した summary、label、description、recipient 名または amount 表示
- SDK が自己申告または観測した Origin
- private key、Mnemonic、password、unlock credential、device authentication data または Wallet Store
- SDK が生成した approval、Signer の authentication 成功または wallet-core の内部状態

### 5.4 Handoff / Provider response の公開 mapping

SDK は Handoff または Extension Provider から受け取った response を、次の公開 signing result へ一意に対応付ける。

| 入力 response                                                                                  | 公開 SDK result                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `outcome: 'signed'`、`signingOutcome: 'SUCCEEDED'`、`signedTransaction`、`deliveryDisposition` | `outcome: 'succeeded'`、`result: SignedTransaction`、同じ `deliveryDisposition` を持つ `MosaicLynxSigningResult<SignedTransaction>` |
| `outcome: 'dataSigned'`、`signingOutcome: 'SUCCEEDED'`、`signedData`、`deliveryDisposition`    | `outcome: 'succeeded'`、`result: SignedData`、同じ `deliveryDisposition` を持つ `MosaicLynxSigningResult<SignedData>`               |
| `outcome: 'resultUnknown'`、`signingOutcome: 'RESULT_UNKNOWN'`                                 | `outcome: 'resultUnknown'`。signed result、deliveryDisposition、normal errorCode は持たない                                         |
| `outcome: 'rejected'` または `outcome: 'failed'`、既存 `errorCode`                             | Handoff §10 の既存 public error authority に従う Promise reject                                                                     |

Extension Provider path と Mobile Relay path は、transport によらず同じ `MosaicLynxSigningResult<T>` semantics を公開する。local が `SignedTransaction`、remote が union のように経路ごとに型や意味を変えてはならない。Provider adapter が内部 response を別の形で受け取る場合も、SDK は Signer-originated な result / disposition だけを共通型へ変換し、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測・確定しない。

`deliveryDisposition` は Signer-side の known signed result に付随する値であり、Relay の ACK / `response_available` / `consumed` state と同一視しない。現行 Mobile Relay v1 では reverse acknowledgement contract がないため、Mobile App が response を登録した直後の disposition は原則 `PENDING` とする。SDK が response を取得・検証・ACK できても、Signer-originated `PENDING` を `DELIVERED` に書き換えない。`DELIVERED` は Signer が trusted delivery contract に基づいて確定した場合だけ公開される。

`outcome: 'resultUnknown'` を受け取った利用側は、unsigned または signed と仮定せず、自動 re-sign や alternate Signer / transport fallback を行わない。新しい signing operation は fresh request と fresh な共通4条件を必要とする。`outcome: 'succeeded'` では `deliveryDisposition` の値にかかわらず `result` が known signed result であり、dApp は必要に応じて独立検証できる。

## 6. Provider Discovery / Selection / Capability

### 6.1 Provider 境界

Provider adapter は、Browser Extension、Mobile handoff および既存 transport の差異を SDK の内部境界へ閉じ込める。Provider adapter が SDK へ公開できる論理能力は、availability、capability / version、connection / permission dispatch、公開 Account query、signing dispatch、response、disconnect および状態通知に限る。

Provider は wallet、Signer、Origin authority、permission authority、approval authority または wallet-core の代替として扱わない。Provider が返す capability は対応可能性であり、authorization、Account ownership、unlock、個別 request の approval または signing success ではない。

### 6.2 Discovery

Provider discovery は次の規則に従う。

- global object の存在、表示名、icon、自己申告 version または自己申告 Origin だけで Provider を trusted と判断しない。
- 欠落 method、malformed response、fake / conflicting Provider、非対応 major version または互換性を判定できない Provider は利用可能な Provider として選択しない。
- discovery は自動 connect、Account disclosure、permission request または signing request を開始しない。
- `isAvailable()` と transport selection は Handoff §5.3 / §6 の route availability を使用する。対応 Provider が存在しない場合でも、Handoff が認める条件を満たした Mobile Relay route は `isAvailable()` の根拠になり得る。
- 非対応 Provider が存在する場合、それを「Provider がない」とみなして別経路へ silent fallback してはならない。

Provider が複数存在する場合の具体的な明示選択、優先順位および conflicting Provider policy は、既存の未決事項を閉じるため、本書では確定しない。選択不能な場合は、未検証 Provider へ request を送らず unavailable / incompatible として安全側に終了する。

Provider が存在せず、Handoff §5.3 の current release、feature flag、release / product gate、受信 App 提供状況、runtime、Web API および verified HTTPS App Link 条件を満たさない場合、local / remote の選択可能な route は存在せず `isAvailable()` は `false` である。

### 6.3 Capability と対応範囲

既存設計が扱う capability の意味カテゴリは次のとおりである。

- connection
- account / address disclosure
- transaction signing
- message signing
- 既存 SDK contract の cosignature signing
- supported Chain / Network
- local signing または remote handoff

これらは capability の意味であり、新しい wire identifier または capability object の exact field を本書で発明しない。capability identifier の namespace、capability set の exact representation、capability version および negotiation object は [interfaces.md OPEN-002](./interfaces.md) と SDK-OPEN-006 に委譲する。

SDK は request を dispatch する前に、対象 operation、Chain、Network および必要な capability が適合することを確認する。判定不能、unknown、unsupported または incompatible の場合は success とせず、安全側に unavailable / unsupported として扱う。operation を別 operation、raw signing または blind signing へ変換してはならない。

### 6.4 Version / Compatibility

SDK は version 一致だけを capability の根拠にしない。operation、Chain / Network、transport および必要な security property を併せて確認する。

既存の version literal は下位契約に従う。

| 対象              | 既存契約              |
| ----------------- | --------------------- |
| SDK API           | `1.0.0`               |
| 必須 Provider API | `2.x`                 |
| Relay protocol    | `mosaiclynx.relay.v1` |

unknown、unsupported、incompatible または判定不能な version は unavailable / unsupported として扱う。旧 version への downgrade、permission bypass、Origin bypass、raw signing または別 transport の成功へ fallback してはならない。

共通 version field、互換性 matrix、deprecation、migration および version negotiation の詳細は [interfaces.md OPEN-003](./interfaces.md)、SDK-OPEN-006、Mobile / Relay の既存 OPEN に委譲する。

## 7. Connection / Permission / Account

### 7.1 責任分界

connection は SDK と Provider / Signer の連携文脈である。permission は Signer 側が Origin、Scope、Account、Profile または permission revision と結び付けて管理する許可である。signing approval は特定 signing request / target への利用者の明示承認である。これらを同一状態として扱ってはならない。

| 事実                        | 成立すること                                            | 成立しないこと                                                  |
| --------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Provider が発見された       | 接続候補が存在する                                      | connection、permission、approval、署名成功                      |
| capability が広告された     | operation / Scope に対応可能である                      | authorization、Account ownership、unlock                        |
| `connect()` が resolve した | 公開 Account disclosure と指定 Scope の connection 許可 | signing approval、署名ごとの authentication、任意 target の承認 |
| `isConnected()` が `true`   | 現在の connection / permission context が存在する       | 現在の signing request の承認                                   |
| Account cache が存在する    | 表示用の公開 Account 値がある                           | 最新 permission、所有権、Signer の選択状態                      |

permission の最終 authority は Provider / Signer 側にある。SDK は permission を付与、拡張、永続化または独自判定しない。`connect()` の成功のみを根拠に signing API が暗黙接続または暗黙承認を行ってはならない。

### 7.2 API ごとの接続規則

- `connect(scope)` は scope を required とし、`chain` と `network` は `interfaces.md §5.1` の `Scope` に従う。利用者の connection / disclosure 許可が得られない場合は success Account を返さない。
- `isConnected(scope)` は UI を開かない。false、permission denial、未対応または状態不明を、署名 approval として扱わない。
- `getActiveAccount(scope)` は local の公開値のみを返し、値がない場合は `undefined` とする。内部 `profileId`、`accountId`、key slot または secret を返さない。
- `refreshActiveAccount(scope)` は Provider / Signer から公開情報を再取得する。取得不能、revoke、Scope 不一致または context loss の場合は stale Account を成功値として継続利用しない。
- `disconnect()` は Handoff contract に従い、現在の Origin に対する既存 connection / permission を切断する。切断後の Account cache と pending request は新しい request の authorization に使用しない。
- reconnect は新しい Provider / connection context の再確認である。以前の permission、approval、authentication、pending request または signed result を自動復元しない。

permission expiry、独立した revocation identifier および cross-device revocation synchronization は [interfaces.md OPEN-004](./interfaces.md) に委譲する。SDK は未定義の expiry field、revocation token または permission model を追加しない。

### 7.3 Origin / Scope / Account binding

`Scope`、`PublicAccountIdentity`、Origin、timestamp、expiry および permission の共通表現は [interfaces.md](./interfaces.md) を使用する。

- Browser の実 Origin は Browser platform / Browser Extension が観測・検証する。SDK の `window.location.origin` または dApp 引数を verified Origin の authority としない。
- Mobile handoff の caller / Origin proof は Mobile App / platform が既存 Handoff contract に従って検証する。Relay は caller authority ではない。
- SDK は request の Scope と Account context を保持し、response の Scope、Account、signer、Origin / caller binding が元 request と整合することを確認する。
- Symbol / NEM および mainnet / testnet を暗黙変換しない。公開 Account の `address` / `publicKey` の chain-specific format は Chain Compatibility Specification に従う。
- caller context が欠落、空、malformed、観測値と不一致または検証不能なら success、connected、verified Origin または signed result を返さない。

Browser / Mobile caller context の具体的な proof と binding method は [interfaces.md OPEN-005](./interfaces.md) および platform 下位仕様へ委譲する。

## 8. Request Construction / Dispatch

### 8.1 共通 envelope の利用

SDK は [interfaces.md §6](./interfaces.md) の request / response envelope、`requestId`、`operation`、`Scope`、Origin / caller context、timestamp、expiry、Account context および response correlation を使用する。本書で `correlationId`、別 request identifier または別の共通 wrapper を追加しない。

Handoff / Relay を利用する場合の `sessionId`、`generationId`、`requestDigest`、暗号化 envelope、`appToken` および `sessionSecret` は SDK 公開 API へ露出せず、[Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) の内部 handoff contract に従う。

### 8.2 SDK が行う request 処理

SDK は次の logical sequence を、一つの API invocation に対して適用する。

1. 引数の型、required field、Scope、encoding、サイズおよび明らかな context を検証する。
2. Provider / capability / version、connection / permission context および transport 境界を確認する。
3. 新しい `requestId`、createdAt、expiresAt および必要な protocol context を持つ request を構築する。
4. request を選択した Provider または既存 handoff adapter へ一度 dispatch する。
5. response の schema、correlation、Scope、Account、signer、target binding、expiry および protocol context を検証する。
6. 下位 authority の error を common logical model および Handoff concrete code へ normalize する。

送信前の SDK validation は malformed input の早期検出に限る。Signer は request を再検証し、transaction / message の semantic inspection、trusted presentation、explicit approval、authentication および wallet-core input validation を独立して実施する。

### 8.3 Request data と untrusted metadata

SDK が受け取る payload、purpose、label、description、icon、recipient 名または amount 説明のうち、signing target は既存 operation-specific contract の target bytes / structured object である。display metadata は supplementary / untrusted とする。

SDK は requester supplied summary、hash-only description、外部 lookup、Relay metadata または display text を target の代替として dispatch してはならない。SDK は確認用 summary を signing authority として生成・承認しない。

## 9. Signing API 契約

### 9.1 Transaction signing

`signTransaction(params)` は既存の `MosaicLynxSignTransactionParams` を受け取る。`chain`、`network`、`payload` および optional `expectedSignerPublicKey` の exact type、required / optional、hex encoding、256 KiB decoded byte 上限および signer binding は [Web Transaction Handoff Specification §5.2](./web-transaction-handoff-spec.md)、[interfaces.md §9.2](./interfaces.md) および [Signing Protocol §10](./signing-protocol.md) を正本とする。

- `payload` は署名対象 transaction 全体であり、summary、hash、external identifier または Node lookup で代替しない。
- `expectedSignerPublicKey` が指定された場合、SDK は形式を早期検証してよいが、実際の signer と一致することの authority は Signer である。不一致時は既存 Handoff mapping に従い、signed result を返さない。
- known signed transaction の成功時、SDK は `MosaicLynxSigningResult<SignedTransaction>` の `outcome: 'succeeded'` branch を返す。Signer-originated `RESULT_UNKNOWN` は同じ公開型の `outcome: 'resultUnknown'` branch として返し、通常 error へ変換しない。
- connection がない、Scope の permission が revoke 済みまたは active Account が要求に対応しない場合、SDK は暗黙接続せず `NOT_CONNECTED` または既存 mapping に従う error とする。
- SDK は transaction type / version、aggregate inner transaction、canonicality、asset effect、fee、deadline、permission change または安全性を最終判定しない。
- Signer が confirmation した target と response の payload / hash / signer の対応を検証できない場合、SDK は `MosaicLynxSigningResult<SignedTransaction>` の succeeded branch を resolve しない。

### 9.2 Structured message signing

`signData(params)` は既存の `MosaicLynxSignDataParams` を使用する。`chain`、`network`、`purpose`、`data.encoding`、`data.value` および optional `expectedSignerPublicKey` の exact validation は [interfaces.md §9.4](./interfaces.md) と Handoff §5.2 に従う。

- SDK は既存契約に従って nonce、issuedAt および message expiry を生成し、`StructuredMessage` を構築する。
- domain、Origin、purpose、nonce、issuedAt、expiresAt、payload および JCS / signing bytes の semantics を SDK 独自に変更しない。
- Handoff の `RelayDataSigningRequest` が使用する `messageExpiresAt` と共通 `StructuredMessage` の `expiresAt` の対応は [interfaces.md OPEN-001](./interfaces.md) の未決事項である。SDK は片方を他方の alias として暗黙変換しない。
- signed data は、Signer が確認・承認した同一 structured message と対応する `MosaicLynxSigningResult<SignedData>` として resolve する。Signer-originated `RESULT_UNKNOWN` は `outcome: 'resultUnknown'` として resolve し、transaction signing、raw signing または表示不能 message へ fallback しない。

### 9.3 Cosignature

`cosignTransaction(params)` は既存公開 SDK contract が提供する範囲に限る。具体的な public capability、対応 chain、result field、mandatory / optional status は [Signing Protocol §12](./signing-protocol.md)、[interfaces.md §9.3](./interfaces.md) および `SDK-OPEN-002` を正本とする。

- Symbol の `parentPayload` / `detached` と NEM の `payload` / `parentPayload` を同一 shape として扱わない。
- cosignature の target は detached signature bytes 単体ではなく、完全な parent context と selected cosigner / role の組である。
- SDK は parent を外部 lookup、hash-only、summary または Relay description で補完して signing を成功させない。
- parent、embedded / inner transaction、existing signature / cosignature、selected Account、role、Chain / Network および request binding の最終検証と approval は Signer の責任である。
- 未対応または scope 不明の cosignature request を通常 transaction signing、message signing または blind signing に変換しない。

### 9.4 共通 signing の境界

SDK が扱う signing semantics は次の分離を維持する。

```text
request received → SDK validation / construction → Provider dispatch
    → Signer validation / inspection → user approval → authentication
    → wallet-core signing → result validation → SDK public `MosaicLynxSigningResult<T>`
```

SDK は `AUTHORIZED`、`SIGNING` または `SUCCEEDED` を自ら成立させない。Signer の approval、authentication および signing result は request、target、Account、Scope、Origin / caller context、permission revision、capability / version context および expiry に binding される。

## 10. SDK Lifecycle / Response Correlation

### 10.1 SDK の local lifecycle

SDK の一つの signing invocation は次の local lifecycle を持つ。これは Signer の共通 signing lifecycle ではない。

```text
CREATED → VALIDATING → DISPATCHED → PENDING → RESOLVED
   └──────────────→ REJECTED / FAILED / TIMED_OUT / CANCELLED / CONTEXT_LOST
```

| State          | SDK での意味                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `CREATED`      | 外部アプリケーションが signing intent を SDK へ渡した                                                      |
| `VALIDATING`   | SDK が引数、context、capability および protocol 境界を確認している                                         |
| `DISPATCHED`   | Provider / handoff へ request を送信した。承認・署名開始を意味しない                                       |
| `PENDING`      | response を待っている。Signer の approval / signing state は確定しない                                     |
| `RESOLVED`     | correlation と必要な構造検証が完了し、`MosaicLynxSigningResult<T>` または対象 operation の公開結果を返した |
| `REJECTED`     | user rejection、permission denial または Provider rejection の終端                                         |
| `FAILED`       | invalid、unsupported、mismatch、transport または internal failure の終端                                   |
| `TIMED_OUT`    | SDK の待機期限に到達した。wallet-side outcome は不明であり得る                                             |
| `CANCELLED`    | SDK または Provider の cancellation contract により待機を終了した                                          |
| `CONTEXT_LOST` | page、Provider、connection、session、permission または Scope context を失った                              |

終端 state へ到達した request は再利用しない。requestId、approval、permission snapshot、connection context、response handler または signed result を新しい request へ流用しない。

Signer の `RECEIVED`、`VALIDATED`、`INSPECTED`、`AWAITING_USER`、`AUTHORIZED`、`SIGNING`、`SUCCEEDED`、`RESULT_UNKNOWN` および delivery disposition は [signing-protocol.md](./signing-protocol.md) の正本であり、SDK の `PENDING` / `RESOLVED` と同一視しない。

### 10.2 Correlation

`requestId` は [interfaces.md §5.2](./interfaces.md) の唯一の request / response correlation authority である。SDK は独立した `correlationId` または別名を追加しない。

response を適用するには、少なくとも次を元 request と照合する。

- `requestId` と operation
- Provider / connection / session context
- Origin / caller context
- Scope、Account および signer
- expected signer（指定時）
- target、payload binding、request digest（適用時）
- protocol / generation / capability context（適用時）
- request expiry、response freshness および terminal state

不一致、duplicate、stale、replayed、late、別 request、別 session または旧 connection の response は現在の invocation に適用しない。response を別 request へ再割当てしてはならない。

SDK が署名結果の形式または対応を補助検証しても、dApp が結果を元 request と独立検証する責任は残る。SDK の resolve は announce、node acceptance または network finality を意味しない。

## 11. Concurrency / Provider Change / Page Lifecycle

### 11.1 Concurrency

同一 SDK instance から複数 request を同時に発行できる。各 request は次を独立に保持する。

- requestId、operation、Provider / connection context、Scope、Account context
- timeout、expiry、cancellation、completion および error
- response correlation、permission snapshot および page lifecycle context

同一 Provider への parallel dispatch、queue、single-flight、ordering、backpressure の具体方式は既存 Provider contract が定める範囲に従う。本書は未決の scheduling policy を新設しない。ただし、ある request の response、Account query、permission、approval、cancellation または error state を別 request に流用してはならない。

同一 request に duplicate response / callback が到着した場合は最初の valid completion だけを適用し、後続を破棄する。late response は新しい request の completion に使用しない。

### 11.2 Provider replacement / disconnect

Provider の replacement、Extension reload、Mobile handoff の切断、Relay generation change、permission revoke、page navigation、page disposal、SDK reinitialization または session expiration が発生した場合、active request を新しい Provider / connection へ無断 reroute しない。

active request は対応する local lifecycle を `CONTEXT_LOST`、`FAILED`、`CANCELLED` または既存下位 contract の terminal outcome へ安全に終了する。旧 context の response は新 context の request に適用しない。再試行する場合は、新しい API invocation、新しい requestId、新しい expiry、validation および必要な user approval を使用する。

### 11.3 Page lifecycle

SDK は page navigation、tab close、unload、BFCache、duplicate initialization 等で pending state を危険な形で復元しない。page の local wait が終了しても、Signer が request を受信していない、承認していないまたは署名していないとは推測しない。

Browser の実 Origin、top-level document、user activation および page lifecycle の具体的な検証は Browser / Handoff 下位仕様に委譲する。Mobile handoff の App Link、Relay session、ACK / cancel は Handoff の既存 contract を使用する。

## 12. Timeout / Cancellation / Expiry

### 12.1 三つの期限

次の期限を混同してはならない。

| 期限                                  | 意味                                                    | SDK の扱い                                                             |
| ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| SDK wait timeout                      | SDK が local response wait を終了する時点               | local lifecycle を終端化する。wallet-side outcome は断定しない         |
| signing request expiry                | request を Signer が受理・処理できる有効期限            | `interfaces.md` と `signing-protocol.md` の expiry validation に従う   |
| message / session / permission expiry | message、handoff session または permission ごとの別期限 | request expiry と同一視しない。未定義の permission expiry は追加しない |

SDK wait timeout、transport timeout または page disposal の後に、Signer が未署名、署名済み、authentication 未実行または request 未受信だと断定してはならない。これらの SDK / transport / lifecycle failure だけから SDK が `RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を生成・推測・確定してはならない。Signer が Handoff §7.2 の `signingOutcome` / `deliveryDisposition` を明示的に返した場合だけ、その意味を保持して §5.4 の公開 `MosaicLynxSigningResult<T>` へ mapping し、`SUCCEEDED`、`USER_REJECTED`、`SIGNING_FAILED`、transport failure または「安全に再送可能」へ推測変換しない。

### 12.2 Cancellation

既存公開 API に新しい `cancel()` method または `AbortSignal` 引数を追加しない。既存 Provider / Handoff が cancellation contract を提供する場合、SDK はその contract に従い local wait と Provider-side request を区別して扱う。

SDK の local cancellation は、SDK の response handler、wait および request state を終了させる。cancel request の送信、受理、ACK または delivery は、Signer が cancellation を完了したこと、署名していないことまたは signed result が存在しないことを証明しない。

cancel 後に届く response、signed result、duplicate callback または `RESULT_UNKNOWN` は現在の invocation に適用しない。再試行は同一 request の再開ではなく、新しい request と新しい validation / approval とする。

### 12.3 自動 retry / fallback

SDK は user rejection、Authentication failure、Signing-capable unlock failure、Account authorization failure、permission denial / revocation、caller / Origin mismatch、integrity failure、replay / duplicate failure、semantic validation / inspection failure、Chain / Network mismatch、security-relevant context mismatch、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure または delivery failure を、自動 signing retry、re-sign、別 Provider、別 Signer、別 transport、別 operation または raw signing で迂回しない。

local から remote、remote から local、Provider A から Provider B、Signer A から Signer B、Relay failure から local Signer、local Provider failure から Relay Signer への automatic fallback を行わない。Relay / transport の reconnect、response redelivery または一時的な失敗に対する具体的 retry 回数、interval、resubmission、lookup または result retrieval は、既存 Handoff / Relay contract および未決事項に委譲する。retry が許可される場合も、known signed result の resend / redelivery / retrieval / lookup と signing retry を分離し、同一 request、承認、secret、token または permission context を再利用してはならない。

## 13. Error Normalization / Authority

### 13.1 Authority

error の authority は次のように分担する。

| 層                                                                                    | 正本                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| common logical category、error の一般意味、security-sensitive detail の非露出         | [interfaces.md §10](./interfaces.md)                                                 |
| signing failure、`RESULT_UNKNOWN`、delivery disposition および terminal semantics     | [signing-protocol.md §10、§18〜§20](./signing-protocol.md)                           |
| SDK / Handoff の concrete public code、`MosaicLynxSDKError`、Provider / Relay mapping | [web-transaction-handoff-spec.md §10](./web-transaction-handoff-spec.md)             |
| Relay HTTP structural rejection body                                                  | Handoff / Relay contract の `RELAY_REQUEST_REJECTED`。SDK public code と同一視しない |

SDK は新しい public error code、error category、alias または taxonomy を追加しない。特に common Interface Specification と Handoff の concrete code 集合を重複定義しない。

### 13.2 Mapping の規則

SDK は下位 error を、外部アプリケーションが success、rejection、permission、invalid、unsupported、expiry、cancel、mismatch、transport および unknown outcome を区別できるように normalize する。既存 Handoff mapping に対応する場合は、その code を保持する。

- user rejection は user rejection として返し、system failure や retryable success としない。
- unavailable、not connected、permission denied、unsupported、chain / network mismatch、signer mismatch、expired、invalid response および internal failure は Handoff の既存 code へ射影する。
- signing outcome が unknown のとき、成功、未署名、user rejection または signing failure と推測しない。
- delivery success は signed result の生成成功に変換しない。
- Handoff §10 に定義されていない internal parser、Vault、OS、暗号 library、Provider stack trace、HTTP status、URL、token、credential または secret を公開 error の message、details、cause または diagnostics に含めない。
- `cause` は公開安全性を損なわない範囲に限定し、内部 exception の raw 値や secret-bearing object を保持しない。

`INVALID_MESSAGE`、`NONCE_REUSED` など Handoff §10 に存在しない concrete code を SDK の独自公開 code として追加しない。structured message の不正、nonce replay、expiry、validation failure の具体的な mapping は既存 Handoff / Interfaces / Signing Protocol authority に従う。

### 13.3 `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN`

`RESULT_UNKNOWN` は trusted Signer だけが生成する signing outcome であり、Handoff §7.2 の `resultUnknown` response を SDK public `MosaicLynxSigningResult<T>` の `outcome: 'resultUnknown'` branch として保持する。SDK timeout、Relay outage、network failure、response absence、Provider disconnect、recipient offline、reconnect failure、response delivery failure または page / SDK / Relay lifecycle loss から SDK が生成・推測・確定してはならない。同一 target の自動 re-sign を禁止する。これは Promise reject ではない。

`DELIVERY_UNKNOWN` は trusted Signer が保持する確定済み result の delivery disposition であり、signing error または signed / unsigned の判定ではない。SDK は Handoff §7.2 の known signed result、`signingOutcome: 'SUCCEEDED'` および `deliveryDisposition: 'DELIVERY_UNKNOWN'` を、公開 `MosaicLynxSigningResult<T>` の `outcome: 'succeeded'`、`result` および同じ disposition として保持する。signing failure、user rejection、`RESULT_UNKNOWN` または未署名へ変換しない。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` は Handoff §10 の public error code ではない。既存下位 contract が result retrieval / resend を提供する場合だけ、その contract に従い、既知 result の redelivery / lookup と再署名を分離する。

## 14. Serialization / Validation

### 14.1 共通 serialization

SDK の application-facing model と protocol model は、[interfaces.md §11](./interfaces.md) および operation-specific contract に従う。

- JSON object と camelCase field naming を使用する既存 contract の field 名を変更しない。
- required field の欠落、nullable でない field の `null`、wrong JSON type、unknown required semantics、duplicate key または malformed object は受理しない。
- optional field の omitted と `null` を同一視しない。nullable と明示されない optional field は値がないとき omitted とする。
- integer / amount / fee / deadline / chain-specific quantity を浮動小数で計算または表現しない。
- binary は operation-specific contract が指定する hexadecimal または padding なし base64url を使用する。未指定の binary encoding を SDK が選択しない。
- JCS、digest、canonical bytes および signature encoding が指定された箇所は、指定された既存 contract をそのまま使用する。
- payload、requestId、Origin、Scope、expiry または signer の意味を表示用の case conversion、shortening、alias または coercion で変更しない。

SDK は Handoff の `RelayRequest` / `RelayResponse`、session secret、app token、request encryption、ACK および transport endpoint を独自 wire format に変換しない。remote handoff の canonicalization、encryption および delivery は Handoff Specification が authority である。

### 14.2 共通 validation

SDK は dispatch 前に少なくとも次を検証する。

- required field の存在、nullable 禁止、JSON 型および allowed enum value
- `Scope` の `chain` / `network` の組み合わせ
- requestId / identifier の形式、重複および request context
- timestamp / expiry の形式、期限切れおよび request lifetime
- Origin / caller context の存在と、SDK が扱える境界
- operation に対応する payload の存在、encoding、size および chain / network context
- expected signer public key の chain-specific format（指定時）
- Provider / capability / version / connection の適合性
- response の requestId、operation、Scope、Account、signer、target、digest および freshness

SDK validation に通過した request も Signer が再検証する。Signer が parse、inspection、target binding、approval、authentication または response result の安全性を確認できない場合、SDK は success として返さない。

unknown enum、unsupported operation、unknown version、malformed payload、duplicate identifier、expired request、Scope mismatch、Account / signer mismatch、Origin mismatch、response mismatch および replay は fail-closed とする。既存 authority に対応する concrete code がない場合は、独自 code を発明せず OPEN として upstream feedback にする。

## 15. Local / Remote Handoff の共通 semantics

SDK は次の二つの経路で operation、request identity、Scope、Account context、公開 `MosaicLynxSigningResult<T>`、success / rejection / failure の意味を可能な範囲で共通化する。

```text
local:  SDK → Provider → Browser Extension → wallet-core
remote: SDK → Handoff client → Relay → Mobile App → wallet-core
```

共通化してはならない、または完全には隠せない差異は availability、latency、session establishment、user activation、page / App lifecycle、timeout、cancellation および result unknown である。

- local Provider の response と remote Relay delivery を同じ trust anchor としない。
- local Provider path と remote Relay path は、known signed result、`RESULT_UNKNOWN` および Signer-originated `deliveryDisposition` を同じ公開 union semantics へ対応付ける。
- Relay は opaque transport であり、SDK は Relay に transaction / message の意味解釈、approval、署名または caller authority を与えない。
- remote handoff の `sessionId`、secret、token、generation、ciphertext および endpoint は SDK の application-facing API に露出しない。
- local 失敗から remote、remote 失敗から local へ自動 fallback しない。特に rejection、mismatch、integrity、caller、replay および result unknown を迂回しない。
- Mobile App 未提供、Relay unavailable、Provider unavailable または compatibility failure は signing success ではない。

## 16. Security Invariants

SDK は少なくとも次を常に維持する。

1. SDK は private key、Mnemonic、password、Wallet Store、復号済み secret、device authentication data、session secret または credential raw 値を要求・保持・復号・導出・出力しない。
2. SDK は Web Application と同じ非特権 context にあり、Signer、wallet-core、Origin authority または trust anchor ではない。
3. Provider の存在、capability、connection、permission、Account cache、response または Relay delivery を signing approval / success とみなさない。
4. Browser / Mobile の trusted context が担う Origin / caller binding を SDK の自己申告または観測で代替しない。
5. requestId、operation、Provider / session、Origin / caller、Account、Scope、target および expiry を response と相関し、別 request の response を適用しない。
6. expired、cancelled、duplicate、stale、replayed、context-lost または terminal request を再利用しない。
7. SDK supplied summary / metadata を Signer の target inspection、trusted presentation または approval の authority にしない。
8. SDK validation を Signer の semantic validation、explicit approval、authentication または wallet-core signing の代替にしない。
9. timeout、cancel、disconnect、delivery success または response received から署名状態・Signer disposition を推測しない。Signer-originated unknown / delivery disposition は Handoff 表現のまま扱う。
10. unsupported、incompatible、malformed、mismatch、caller failure および replay failure を raw signing、別 operation または unsafe fallback で迂回しない。
11. diagnostics、exception、cache、URL、event または telemetry に payload、signed payload、secret、token、credential、不要な Origin / Account 組合せまたは internal stack trace を含めない。
12. signing success と delivery success、SDK `RESOLVED` と Signer `SUCCEEDED`、connection success と user approval、`RESULT_UNKNOWN` と transport failure をそれぞれ別の事実として扱い、Signer-originated disposition を公開 result で保持する。

## 17. Component Responsibilities

| Component              | 共通 SDK 契約の利用                                                                                                                                                                                          | 本書が委譲する責任                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| SDK                    | discovery、capability / version check、connection / permission dispatch、公開 Account、request construction、dispatch、correlation、公開 signing result mapping、timeout / cancellation、error normalization | Origin authority、approval、authentication、semantic inspection、raw signing、secret、Relay server、network announce |
| Browser Extension      | Provider を通じた connection、Origin / permission authority、request validation、trusted UI、authentication、wallet-core signing、response generation                                                        | SDK は Extension の private context、Chrome API、UI、Vault へ入らない                                                |
| Mobile App             | Handoff request の検証、Origin proof / source validation、permission、trusted UI、device authentication、signing、encrypted response                                                                         | SDK は App の secure storage、OS API、device authentication、内部 API を制御しない                                   |
| Relay                  | opaque ciphertext の短期 handoff、session / routing、expiry、delivery lifecycle                                                                                                                              | SDK は Relay を Signer、caller validator、semantic validator、trust anchor としない                                  |
| wallet-core            | 秘密情報、Wallet Store、chain-specific cryptographic operation、raw signing                                                                                                                                  | SDK は wallet-core の内部 model、KDF、key storage、署名 primitive を再定義しない                                     |
| Web Application / dApp | signing intent、SDK 呼出し、signed result の独立検証、必要な announce / network 処理                                                                                                                         | SDK / Provider / Relay の response だけを trust anchor にしない                                                      |

Browser Extension 固有 Provider API、Mobile 固有 handoff、Relay endpoint、SDK package export の実装構造および wallet-core 内部 API は、それぞれの下位仕様へ委譲する。

## 18. Compatibility / Change Policy

- additive な optional field は、既存 recipient が unknown field を安全に無視できることが上流契約で確認される場合に限り許容する。security binding、target、Scope、Origin、expiry、requestId または operation semantics を変える field は additive change とみなさない。
- required field、enum の意味、identifier、operation、Scope、target encoding、error code、state semantics または approval binding の変更は breaking change として扱う。
- unknown field、unknown enum、unknown version または unsupported capability の扱いが既存 contract にない場合、SDK は意味を推測せず拒否または unavailable とする。
- SDK は旧 API への downgrade、unknown capability の無視、security property を弱める compatibility mode または silent conversion を実装しない。
- compatibility matrix、deprecation、migration、formal runtime / browser support および release policy は上流の OPEN を解消した後に別仕様で定める。

本仕様の現行 SDK API `1.0.0` は、`signTransaction()` と `signData()` の return type として `MosaicLynxSigningResult<T>` を使用する。従前の `Promise<SignedTransaction>` / `Promise<SignedData>` という単純な表現は本仕様の公開 contract ではなく、v2、別 package または deprecated legacy API を追加せず、この現行 v1 contract に統一する。すでに公開済みの immutable artifact に対する migration、major version または deprecation の要否は、既存 `SDK-OPEN-006` と release policy の判断に委譲し、本書では新しい version literal を定めない。

## 19. Acceptance / Conformance

SDK 実装は少なくとも次を満たす場合に本仕様へ適合する。

1. Provider の availability、operation、Chain / Network、version / capability の不一致を、署名成功と区別する。
2. connection、公開 Account disclosure、permission および各 signing request の explicit approval を別に扱う。
3. transaction と message の operation identity を保ち、unsupported、unparsed、displayless または raw fallback を成功にしない。
4. response が元 request の requestId、operation、Provider / session、Origin / caller、Account、Scope、signer、target および expiry に対応しない限り resolve しない。対応する response は、known signed result なら `outcome: 'succeeded'`、Signer-originated unknown なら `outcome: 'resultUnknown'` として公開する。
5. 同一 SDK instance の concurrent request、duplicate callback、late response、cancelled request および Provider replacement が request 間で状態を混同しない。
6. SDK timeout、request expiry、transport failure、user rejection、cancellation、result unknown および delivery unknown を混同しない。
7. timeout / cancel 後に自動 re-sign、古い approval の再利用、別 transport fallback または response の別 request への適用をしない。
8. Extension Provider と Mobile Relay の両方で `MosaicLynxSigningResult<SignedTransaction>` / `MosaicLynxSigningResult<SignedData>` の公開型と意味を維持し、`DELIVERY_UNKNOWN` でも `result` を保持する。
9. Handoff §10 の concrete error authority を使用し、SDK 独自の error code / taxonomy を追加しない。
10. secret、credential、full payload、signed payload および安全でない内部詳細が diagnostics / error / cache / URL に漏れない。
11. Symbol / NEM、mainnet / testnet、malformed input、wrong signer、wrong Scope、duplicate / replay および context loss を fail-closed で扱う。

## 20. Traceability

| Requirement                                         | Design                                                                                                      | 本仕様での具体化                                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `SDK-FR-001`、`SDK-PLAT-003`、`SDK-COMP-001`〜`004` | [SDK Design §7、§18](../design/sdk.md)、[Handoff §5.3、§6](./web-transaction-handoff-spec.md)               | §5.1、§6.2 の local / remote route availability、discovery、capability、version、unsupported / incompatible の fail-closed |
| `SDK-FR-002`〜`004`                                 | [SDK Design §8、§10](../design/sdk.md)                                                                      | §5、§7 の connect、公開 Account、permission、disconnect および再利用禁止                                                   |
| `SDK-FR-005`、`SDK-SEC-004`                         | [SDK Design §9、§11](../design/sdk.md)、[Security Design](../design/security-design.md)                     | §7.3、§8、§16 の Origin authority、request construction、secret / trust boundary                                           |
| `SDK-FR-006`、`SDK-FR-007`                          | [SDK Design §11](../design/sdk.md)、[Signing Flow §9〜§17](../design/signing-flow.md)                       | §9 の transaction、message、cosignature 境界と Signer authority の分離                                                     |
| `SDK-FR-008`、`SDK-SEC-005`〜`006`                  | [SDK Design §12〜§16](../design/sdk.md)                                                                     | §10、§11 の requestId correlation、concurrency、stale / duplicate / replay 防止                                            |
| `SDK-FR-009`、`SDK-PLAT-002`〜`003`                 | [SDK Design §17](../design/sdk.md)、[Relay Design](../design/relay.md)                                      | §15 の local / remote semantics、Relay 非 authority、無断 fallback 禁止                                                    |
| `SDK-FR-010`、`SDK-FR-011`                          | [SDK Design §13〜§15](../design/sdk.md)、[Signing Protocol §18〜§20](./signing-protocol.md)                 | §10〜§13 の lifecycle、timeout、cancel、unknown outcome、error authority                                                   |
| `SDK-FR-012`、`SDK-AC-010`〜`012`                   | [SDK Design §10、§18](../design/sdk.md)、[Chain Compatibility Specification](./chain-compatibility-spec.md) | §7、§9、§14、§19 の Scope、chain / network、payload / signer validation                                                    |
| `SDK-SEC-001`〜`003`、`SDK-PRIV-001`〜`003`         | [SDK Design §6、§19、§22](../design/sdk.md)、[Security Design](../design/security-design.md)                | §5.3、§16、§17 の非特権境界、secret isolation、diagnostics privacy                                                         |

共通 `requestId`、Scope、Origin、Account、timestamp / expiry、error、serialization および signing state は [interfaces.md](./interfaces.md) と [signing-protocol.md](./signing-protocol.md) を参照する。Handoff の concrete API / error code は [web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md) を参照する。

## 21. OPEN Issues

### OPEN-SDK-001: Provider discovery と複数 Provider の明示選択

- **問題:** 複数 Provider、fake / conflicting Provider、非対応 Provider が同時に存在する場合の具体的な選択 policy と、利用者が明示選択する API が確定していない。
- **本書だけで決定できない理由:** SDK Design は discovery、非信頼 Provider の排除および自動 fallback 禁止を定めるが、選択順と公開 API の exact shape を定めていない。
- **影響範囲:** `isAvailable()`、connect、全 signing operation、Provider replacement。
- **戻すべき上流文書:** `docs/requirements/sdk.md` の `SDK-OPEN-003`、`docs/design/sdk.md` §7、必要に応じて Provider / Browser Design。

### OPEN-SDK-002: Common capability / version negotiation

- **問題:** capability identifier namespace、capability set、capability version、negotiation object および compatibility matrix が共通仕様として未確定である。
- **本書だけで決定できない理由:** [interfaces.md OPEN-002 / OPEN-003](./interfaces.md) が同じ未決事項を明示しており、SDK が独自 identifier を追加すると共通契約が分裂する。
- **影響範囲:** discovery、`isAvailable()`、operation support、Chain / Network support、Provider compatibility。
- **戻すべき上流文書:** `docs/requirements/sdk.md` の `SDK-OPEN-006`、`docs/design/sdk.md` §18、[interfaces.md](./interfaces.md)。

### OPEN-SDK-003: Cancellation / timeout / transport failure policy

- **問題:** local wait cancellation と Provider / Signer protocol cancellation、具体 timeout、retry、lookup / resubmission の公開 semantics が全経路で統一されていない。
- **本書だけで決定できない理由:** Signing Protocol は result / delivery unknown の安全側 semantics を確定するが、具体 API、timeout 値および transport failure recovery を下位仕様へ委譲している。
- **影響範囲:** Promise rejection、Provider disconnect、Mobile handoff、Relay delivery、`RESULT_UNKNOWN`。
- **戻すべき上流文書:** `docs/requirements/sdk.md` の `SDK-OPEN-003`、`docs/design/sdk.md` §14、§21、Signing Protocol OPEN-006、Handoff / platform lifecycle specification。

### OPEN-SDK-004: Cosignature public scope

- **問題:** `cosignTransaction` の SDK v1 における必須 / optional capability、対応 chain、公開 result field および実装 milestone が未確定である。
- **本書だけで決定できない理由:** 共通 Signing Protocol は parent binding、inspection および approval semantics を確定するが、SDK public scope を未決としている。
- **影響範囲:** Provider capability、public API availability、Symbol Aggregate / NEM multisig、result mapping。
- **戻すべき上流文書:** `docs/requirements/sdk.md` の `SDK-OPEN-002`、[interfaces.md OPEN-006](./interfaces.md)、Signing Protocol OPEN-005、Chain / platform 下位仕様。

### OPEN-SDK-005: Runtime / caller binding / release compatibility

- **問題:** 正式対応 runtime、Browser scope、Mobile runtime、Browser-observed Origin / Mobile caller proof の具体方式、package compatibility、deprecation および release matrix が未確定である。
- **本書だけで決定できない理由:** SDK は非特権境界と fail-closed を定めることはできるが、platform authority が提供する具体 proof、runtime matrix および配布 policy を独自に決定できない。
- **影響範囲:** `isAvailable()`、Origin binding、local / remote transport、SSR / Worker、version negotiation、公開保証。
- **戻すべき上流文書:** `docs/requirements/sdk.md` の `SDK-OPEN-005`〜`007`、[interfaces.md OPEN-003 / OPEN-005](./interfaces.md)、`docs/design/sdk.md` §18、§19、Browser / Mobile / release design。

上記 OPEN を理由に、connection だけで signing approval を成立させること、Origin authority を SDK へ移すこと、blind / raw signing、old request / approval の再利用、同一 target の自動再署名、秘密情報 API または新しい public error code を追加してはならない。
