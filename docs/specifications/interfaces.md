# MosaicLynx 共通 Interface / Data Model Specification

## 1. 目的

本書は、MosaicLynx の SDK、Browser Extension、Mobile App、Relay および symbol-nem-wallet-core（以下 wallet-core）の境界で共有する Interface / Data Model を仕様化する。

本書の目的は、上流の Concept、Requirements、Design で確定した共通概念を、実装者が追加の意味上の設計判断なしに検証・直列化・相関付けできる外部契約へ具体化することである。関数内部のアルゴリズム、クラス構造、UI、transport の endpoint および wallet-core の内部実装は定めない。

本書の規範語は次の意味を持つ。

- **MUST**: 対象範囲で必須である。
- **MUST NOT**: 対象範囲で禁止する。
- **SHOULD**: 原則として満たす。満たせない場合は理由と影響を記録する。
- **OPEN**: 本書だけでは決定できない。下流実装で都合よく確定してはならない。

## 2. 適用範囲

### 2.1 対象

対象は、次の境界をまたぐ公開または共有データの意味、型、必須性、検証、serialization および lifecycle である。

- Web App / dApp ↔ MosaicLynx SDK
- SDK ↔ Browser Extension または Mobile Signer
- Relay ↔ Mobile App の opaque handoff に含まれる request / response の論理契約
- Signer ↔ wallet-core の承認済み target と結果の境界
- 署名結果を dApp が独立検証するための共通情報

### 2.2 対象外

次は本書で新たに定義しない。

- Browser Extension 固有の message event、Chrome API、UI、Storage layout
- Mobile 固有の Deep Link、OS API、secure storage、認証および lifecycle
- Relay の HTTP / WebSocket endpoint、Redis schema、credential protocol、TTL の追加設計
- SDK の全公開 API、transaction construction、transport 選択および framework adapter
- Symbol / NEM の transaction schema、署名 byte 列、hash、address、鍵導出の再定義
- wallet-core の Binding、Wallet Store、KDF、暗号、key slot および内部 error
- signing lifecycle 全体の処理順。状態の共通表現と禁止される再利用だけを定める

上記の詳細は、既存の下位仕様・設計・wallet-core 契約が定める範囲に従う。本書と下位資料が競合する場合、未決事項として扱う。

## 3. 上流資料と規範性

主な上流資料は次のとおりである。

- [Concept Sheet](../concept/concept-sheet.md)
- [共通要件](../requirements/requirements.md)
- [Browser Extension 要件](../requirements/browser-extension.md)
- [Mobile App 要件](../requirements/mobile-app.md)
- [Relay 要件](../requirements/relay.md)
- [SDK 要件](../requirements/sdk.md)
- [アーキテクチャ設計](../design/architecture.md)
- [共通データモデル・インターフェース基本設計](../design/interfaces.md)
- [共通セキュリティ設計](../design/security-design.md)
- [署名フロー基本設計](../design/signing-flow.md)
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)
- [Profile / Account Specification](./profile-account-spec.md)
- [Chain Compatibility Specification](./chain-compatibility-spec.md)

レビュー資料は整合性確認に使用した。レビューの指摘を、それ自体が新しい製品要求または仕様の根拠であるとは扱わない。interfaces-review-001 の IF-001〜IF-003 は、上流設計に既にある境界を本書で明示するために反映した。

## 4. 用語

| 用語                       | 本書での意味                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Chain                      | symbol または nem。transaction、address、key identity および署名規則の境界である。                                      |
| Network                    | mainnet または testnet。Chain と組み合わせて使用する。                                                                  |
| Scope                      | chain と network の組み合わせ。単独の network identifier では表さない。                                                 |
| Signer                     | Browser Extension または Mobile App。意味検証、表示、明示承認、認証および署名 orchestration の authority である。       |
| Public Account Identity    | Chain / Network、address、public key 等の外部へ公開可能な identity。                                                    |
| Internal Account Reference | Profile、permission または wallet-core の key slot を Signer 内部で解決する参照。公開 Account Identity とは別物である。 |
| Signing target             | 実際に署名する transaction、aggregate、cosignature parent、multisig context または structured message。                 |
| TransactionSummary         | Signer が signing target から導出する確認用の概要。target の代替ではない。                                              |
| request identity           | request を一意に識別し、重複・replay・差し替えを検出する identity。                                                     |
| delivery disposition       | 署名結果の生成状態とは別に、request / response が配送された状態。                                                       |

## 5. 共通プリミティブ

### 5.1 Chain、Network、Scope

共通 enum は次のとおりとする。

```ts
type Chain = 'symbol' | 'nem';
type Network = 'mainnet' | 'testnet';

interface Scope {
  chain: Chain;
  network: Network;
}
```

- chain と network はともに required で、null を許可しない。
- chain と network の組み合わせは、payload、Profile、Account および capability と一致しなければならない。
- symbol と nem、mainnet と testnet を暗黙変換してはならない。
- Scope に id を wire の正本として追加しない。symbol-mainnet のような表示用または Application 内部の派生値は、chain と network から再生成する。
- Network の数値 constant、address 規則および transaction 規則は Chain Compatibility Specification に従う。

### 5.2 Identifier

| 識別子                 | 表現                                                                                       | 必須性と用途                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| requestId              | CSPRNG で生成した 128-bit 値を padding なし base64url で表す文字列                         | 外部 request で required。response の相関キーであり、同一 request の duplicate / replay 判定に使う。                                       |
| sessionId              | CSPRNG で生成した 128-bit 値を padding なし base64url で表す文字列                         | Mobile Relay handoff の session で required。SDK 公開 API の引数・戻り値には含めない。Browser session の具体形式は下位仕様に委譲する。     |
| generationId           | Relay generation を表す非秘密の opaque string                                              | Relay handoff request で required。current generation と一致しない値は拒否する。形式、長さおよび生成方式は Relay protocol の OPEN とする。 |
| requestDigest          | SHA-256(JCS(RelayRequest)) の lowercase hexadecimal                                        | Relay response で required。元 request の完全性・相関を検証する。                                                                          |
| correlation identifier | 独立した wire field を定義しない。requestId を request / response correlation の正本とする | correlationId を別名で追加してはならない。既存 protocol が別名を定める場合は、本仕様との整合を OPEN とする。                               |

Identifier は opaque value として比較する。大小文字変換、別 encoding への正規化、短縮表示または推測可能な連番化を行ってはならない。CSPRNG、credential、session secret の内部 lifecycle は各 protocol の責任であり、本書は秘密値を共通 model に追加しない。

### 5.3 Account Identity

外部境界で公開可能な Account は次の形を持つ。

```ts
interface PublicAccountIdentity extends Scope {
  address: string;
  publicKey: string;
}
```

- 全 field は required、nullable 不可である。
- address と publicKey の format、長さ、network byte、checksum および encoding は Chain-specific implementation と Chain Compatibility Specification で検証する。
- address、publicKey、Chain、Network は Signer / chain integration が payload、Profile および選択 Account と照合した値を正本とする。
- profileId、内部 accountId、wallet-core key slot、private key、Mnemonic、seed、Profile password、decrypted Wallet Store およびそれらを復元できる値を Public Account Identity に含めない。
- displayName は既存の外部契約が提供する場合だけ補助表示値として扱う。署名者・Chain・Network の検証事実には使用しない。

Internal Account Reference は Signer / Application 内部に限定する。外部 requester が提示した reference は、現在の Profile、permission、Scope、expected signer および Public Account Identity と照合する補助情報に過ぎず、鍵選択または authorization の authority ではない。

### 5.4 Timestamp、Expiry、Nonce

共通日時の確定形式は YYYY-MM-DDTHH:mm:ssZ の UTC RFC 3339、秒精度、fraction なしである。日時 field は string、required な日時は null を許可しない。

- createdAt は request 作成時刻である。
- expiresAt は request の期限である。expiresAt <= createdAt、期限切れまたは期限を延長した request は拒否する。
- Relay handoff の expiresAt は createdAt の 5 分後であり、Relay / App は延長しない。
- issuedAt と message の expiry は request-level expiry と別に検証する。どちらかが期限切れなら署名しない。
- structured message の nonce は CSPRNG の padding なし base64url で、16〜32 byte を表す。Origin + Account 単位で再利用してはならない。
- request expiry、message expiry、session expiry、permission expiry を同一視しない。上流資料に permission の期限 field はないため、permission expiry は §18 の OPEN とする。

時刻の比較は日時の数値的な時刻値で行う。入力文字列の表示形式の違いを理由に意味を変えず、規定外形式は受け付けない。

### 5.5 Origin

Origin は scheme://host[:port] の canonical origin string であり、path、query、fragment、表示名および favicon を含めない。

- Browser SDK は window.location.origin から取得し、dApp 引数で上書きできない。
- Browser Extension は browser が観測した top-level HTTPS Origin を authority とし、page の自己申告値を authority としない。
- file:、data:、opaque Origin、browser internal page、他 Extension Origin および対象外の iframe / child frame は、既存 Browser 要件に従い request caller として受け付けない。
- structured message の origin は URL の canonical origin として保持し、http / https 以外を拒否する。
- Origin の比較は canonical string の完全一致で行う。scheme、host、port、ASCII / Punycode 表現の差を同一視してはならない。host の大小文字・default port 等の canonicalization は、生成元の URL canonicalization に委ね、実装が独自に再定義しない。
- Mainnet Mobile handoff では、initiatorOrigin は public DNS に解決する HTTPS、既定 port 443 に限定する。loopback、link-local、private、reserved address、HTTP downgrade、redirect、cross-origin、DNS rebinding を拒否する。
- Mainnet Mobile handoff では originProof を required とする。Testnet で proof を省略する場合も「要求元未検証」を Signer 側で扱い、verified caller と表示してはならない。
- Origin が欠落、空、形式不正、観測値との不一致または検証不能の場合は、接続・署名を許可しない。disconnect の Relay request も initiatorOrigin を持ち、対象 Origin の許可だけを操作する。

### 5.6 Capability と Permission の関係

Capability は「対応可能性」を表し、authorization、Account ownership、unlock、approval、署名成功または permission の存在を表さない。既存設計で扱う capability の意味は次のとおりである。

- connection
- account / address disclosure
- transaction signing
- message signing
- cosignature signing（既存 SDK contract の optional capability）
- supported Chain / Network
- local signing または remote handoff

上記は capability の意味カテゴリであり、新しい共通 wire identifier を発明するものではない。capability identifier の namespace、capability set の exact field、capability version の型および negotiation object は §18 の OPEN とする。

## 6. Request / Response Envelope

### 6.1 共通の論理契約

すべての外部署名 request は、少なくとも次の意味を持つ。これは transport-independent な論理契約であり、各 transport の wire object に context 等の新しい wrapper field を要求するものではない。

| 論理 field                    | 型                                               | 必須                         | nullable | 意味                                                                                  |
| ----------------------------- | ------------------------------------------------ | ---------------------------- | -------- | ------------------------------------------------------------------------------------- |
| requestId                     | string                                           | MUST                         | 不可     | request identity。§5.2 の形式。                                                       |
| operation                     | operation enum                                   | MUST                         | 不可     | request の意味と validation path。                                                    |
| createdAt                     | timestamp string                                 | MUST                         | 不可     | request 作成時刻。                                                                    |
| expiresAt                     | timestamp string                                 | MUST                         | 不可     | request expiry。                                                                      |
| caller / Origin context       | Origin または platform-specific verified context | 適用時 MUST                  | 不可     | request 元と permission binding。Browser / Web では Origin required。                 |
| Scope                         | Scope                                            | 署名・接続 operation で MUST | 不可     | Chain / Network。disconnect のように下位 wire が省略する operation は既存契約に従う。 |
| signing target                | operation-specific payload                       | 署名 operation で MUST       | 不可     | 実際の検証・署名対象。                                                                |
| protocol / capability context | protocol-specific                                | 適用時 MUST                  | 不可     | version、generation、対応 capability。                                                |

Response は request の requestId に一対一で対応し、request の operation、Scope、Account、signer、target と一致する結果だけを返す。Response の transport delivery status を署名 outcome として解釈してはならない。

### 6.2 Relay handoff の concrete envelope

Relay handoff では、RelayRequestBase の次の field を required とする。

```ts
interface RelayRequestBase {
  protocol: 'mosaiclynx.relay.v1';
  generationId: string;
  requestId: string;
  initiatorOrigin: string;
  createdAt: string;
  expiresAt: string;
}
```

RelayRequest の operation union は次の既存契約に限定する。

```ts
type RelayOperation =
  'connect' | 'refreshActiveAccount' | 'signTransaction' | 'signData' | 'cosignTransaction' | 'disconnect';
```

operation-specific field は次のとおりである。

- connect / refreshActiveAccount: chain、network required、originProof optional（Mobile Mainnet では required）。
- signTransaction: chain、network、payload required、expectedSignerPublicKey optional、originProof optional（Mobile Mainnet では required）。
- signData: chain、network、purpose、nonce、issuedAt、messageExpiresAt、payload required。expectedSignerPublicKey と originProof は optional（Mobile Mainnet では proof required）。
- cosignTransaction: Symbol は parentPayload、detached required、NEM は payload と parentPayload required。chain、network は required、expectedSignerPublicKey と originProof は optional（Mobile Mainnet では proof required）。
- disconnect: operation のみで Scope field は既存 handoff contract では持たない。ただし initiatorOrigin により対象 Origin を binding する。

Relay はこれらの payload を opaque として扱う。上記の field の structural validation は行うが、transaction / message の意味、Account ownership、approval、署名可否を判断しない。

### 6.3 Relay response

Relay response の concrete logical shape は次の union に限定する。

```ts
interface RelayResponseBase {
  protocol: 'mosaiclynx.relay.v1';
  requestId: string;
  requestDigest: string;
  completedAt: string;
}

type RelayResponse =
  | (RelayResponseBase & { outcome: 'connected'; account: PublicAccountIdentity })
  | (RelayResponseBase & { outcome: 'disconnected' })
  | (RelayResponseBase & { outcome: 'signed'; signedTransaction: SignedTransaction })
  | (RelayResponseBase & { outcome: 'dataSigned'; signedData: SignedData })
  | (RelayResponseBase & {
      outcome: 'rejected' | 'failed';
      errorCode: MosaicLynxSDKErrorCode;
    });
```

outcome と payload の依存関係は次のとおりとする。

- connected は account required、その他の signing result と errorCode は禁止する。
- disconnected は account、signing result、errorCode を持たない。
- signed は signedTransaction required、account と errorCode を持たない。
- dataSigned は signedData required、account と errorCode を持たない。
- rejected / failed は errorCode required、成功 result を持たない。

Relay state から利用者の判断結果を推測できてはならない。Relay HTTP の 4xx / 5xx body は既存 handoff 仕様の { "error": "RELAY_REQUEST_REJECTED" } に従い、SDK が利用者向け error として返す concrete mapping は下位 protocol に従う。

### 6.4 Unknown field、duplicate、unsupported value

- JSON object の duplicate key、required field の欠落、unexpected type、null、unknown enum、invalid union combination、trailing data および malformed encoding は拒否する。
- Protocol schema が明示的に extension field を許可していない限り、unknown field は受信側で意味解釈せず拒否する。unknown field を既存 field の alias として扱わない。
- unknown operation、unsupported version、unsupported capability、unknown chain / network、unsupported transaction / message format は、別 operation、raw signing、別 transport または旧 protocol へ fallback せず安全側に終了する。
- 既存 handoff の originProof、expectedSignerPublicKey および operation-specific optional field は、対応 operation でのみ許可する。不要な field を送らない。
- Relay は opaque ciphertext の plaintext field を根拠に意味を補完しない。Mobile Signer が復号後に semantic validation を行う。

## 7. Origin Proof、Capability / Version

### 7.1 Origin Proof

既存 handoff の Origin proof は次の exact shape である。

```ts
interface OriginProof {
  version: 'mosaiclynx.origin.v1';
  keyId: string;
  algorithm: 'Ed25519';
  signature: string;
}

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

Mobile Mainnet App は manifest の Origin 完全一致、key ID、algorithm、有効期間および status を検証し、revoked key を受理しない。Origin proof は caller binding の補助であり、Signer の request、Scope、permission、target および expiry の検証を省略する根拠ではない。

OriginProofInput は既存 handoff の shape と規則に従う。payloadHash は signTransaction の場合だけ許可し、decoded transaction bytes の SHA-256 lowercase hexadecimal とする。Proof の signing input、manifest 取得制約および timeout は Web Transaction Handoff Specification の既存契約をそのまま使用する。

### 7.2 Version representation

既存資料で確定している version / protocol literal は次のとおりである。

| 対象                      | 確定値                    |
| ------------------------- | ------------------------- |
| MosaicLynx SDK            | 1.0.0                     |
| Provider API              | 2.x major 2 が必須        |
| Relay protocol            | mosaiclynx.relay.v1       |
| structured message domain | mosaiclynx.message.v1     |
| Origin proof              | mosaiclynx.origin.v1      |
| Origin key manifest       | mosaiclynx.origin-keys.v1 |

上記以外に、全 component で共有する version field の名前、SemVer の許容範囲、protocol version と capability version の関係、deprecation、migration および negotiation message は確定していない。実装は独自の共通 version field や version comparison rule を追加してはならない。

### 7.3 Compatibility rule

- Provider API major が非対応なら UNAVAILABLE とし、Mobile Relay へ downgrade しない。
- operation、Chain、Network、format、protocol または capability を解釈できない場合は unavailable / unsupported とし、別の operation や raw signing へ変換しない。
- compatibility を理由に explicit approval、Origin binding、Chain / Network 分離、request correlation、secret isolation または fail-closed を弱めない。
- additive field を無視できるのは、受信 schema がその field を安全に無視できると明示している場合だけである。既存契約で明示がない場合は unknown field として拒否する。
- breaking change は既存 literal または既存 version の意味を変更せず、新しい protocol / capability version として上流資料で承認する。

## 8. Permission Model

### 8.1 Permission Grant

Application が保持する permission の既存論理 model は次のとおりである。これは SDK / Relay の公開 API ではなく、Signer / Application 管理下の model である。

```ts
interface PermissionGrant {
  origin: string;
  profileId: string;
  scope: Scope;
  accountIds: string[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

- 全 field は required、null 不可である。
- origin は §5.5 の canonical Origin。profileId と accountIds は内部参照であり、SDK 公開 API、Relay、Web page または dApp に返さない。
- scope.chain、scope.network は対象 Profile と Account identity に一致しなければならない。
- accountIds は利用者が明示的に許可した Account の集合である。空集合を接続許可として扱わず、全 Account を暗黙追加しない。
- revision は permission の変更を識別する non-negative integer。scope、account set、Profile、Origin の変更ごとに増加させ、署名 Authorization の binding に含める。
- createdAt / updatedAt は §5.4 の timestamp。updatedAt < createdAt は拒否する。
- 接続 permission は connection / public Account disclosure の許可であり、署名ごとの explicit confirmation、authentication、inspection または signing authorization を含まない。
- accountIds、scope または revision が変更・revoke された時点で、対応する session、未完了 Authorization および古い approval は無効化する。

### 8.2 Permission binding と revocation

署名 request は、少なくとも次の binding を検証する。

```text
Origin + Profile + Scope + permitted Account + permission revision
```

requestId は permission の代替ではない。Origin、Profile、Scope、Account、permission revision のいずれかが一致しない request は署名しない。Profile の可変な default Account を、接続許可された Account の代替にしてはならない。

現行上流 model に独立した permissionId、revokedAt、expiresAt または revocation token はない。revocation は permission binding と revision change により表現する。独立 revocation identifier、permission expiration、cross-device permission synchronization が必要かは §18 の OPEN-004 とする。

### 8.3 Unknown permission / capability

- unknown permission scope、unknown capability、unknown account reference または未検証の permission revision は、許可されていないものとして扱う。
- Permission の存在だけで署名を開始しない。
- connection、account/address disclosure、signing request は別概念である。signing request には毎回の確認・認証を適用する。
- Permission を別 Origin、別 Profile、別 Scope、別 Account または別 protocol capability へ拡張・流用しない。

## 9. Signing 関連共通モデル

### 9.1 Logical operation

署名の共通 logical operation は次のとおりである。

| Logical operation | 対象                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- |
| TRANSACTION_SIGN  | 通常 transaction、Symbol Aggregate、NEM multisig wrapper 等を最初の署名対象として扱う。 |
| COSIGNATURE_SIGN  | 既存 parent Aggregate / multisig へ selected cosigner が追加署名する。                  |
| MESSAGE_SIGN      | structured message または既存 message signing contract に署名する。                     |

公開 handoff operation への対応は signTransaction、signData、cosignTransaction であり、logical operation と API 名を混同しない。Aggregate、Partial、NEM multisig は共通 operation を増やさず、Chain-specific transaction context として扱う。

### 9.2 Transaction request

signTransaction の既存 request field は次のとおりである。

```ts
interface TransactionSigningRequest extends Scope {
  operation: 'signTransaction';
  payload: string;
  expectedSignerPublicKey?: string;
}
```

- payload は required の hexadecimal string。偶数長、hex character のみ、decoded byte length 256 KiB 以下とする。
- 大文字小文字の変更以外の入力変換を検証前に行わない。canonical serialization 後の bytes は入力 decoded bytes と byte-for-byte 一致しなければならない。
- expectedSignerPublicKey は optional。指定時は対象 Chain の形式へ検証し、実際の signer public key と完全一致させる。不一致は SIGNER_MISMATCH とし成功 result を返さない。
- expectedSignerPublicKey がない場合も、payload の signer と許可された / 選択された Account の identity を Signer が照合する。zero signer の補完は行わない。
- 対応 transaction type / version、全 field、aggregate embedded transaction、署名状態、network、canonicality、size、integer range および chain-specific effect は product-spec と chain-compatibility-spec に従う。
- unknown type / version、未解析 field、余剰 byte、非 canonical encoding、overflow、過剰な nest / element、wrong signer、unresolved alias を安全に解決できない場合は署名しない。

### 9.3 Cosignature request

公開 request は chain ごとに次を持つ。

```ts
interface SymbolCosignatureRequest extends Scope {
  chain: 'symbol';
  operation: 'cosignTransaction';
  parentPayload: string;
  detached: boolean;
  expectedSignerPublicKey?: string;
}

interface NemCosignatureRequest extends Scope {
  chain: 'nem';
  operation: 'cosignTransaction';
  payload: string;
  parentPayload: string;
  expectedSignerPublicKey?: string;
}
```

parentPayload は required であり、hash、summary、opaque identifier または外部 lookup だけで代替してはならない。Signer は parent 全体、embedded / inner transaction、existing signature / cosignature、selected cosigner、role、asset effect、fee、deadline、Chain / Network、期限および request binding を再構成・検証・表示する。完全な parent を確認できない場合は署名しない。

Symbol の Aggregate と NEM multisig の structure、hash、address、signing bytes および role semantics を共通化しない。

### 9.4 Structured message

既存 Product / Core の structured message model は次のとおりである。

```ts
interface StructuredMessage {
  domain: 'mosaiclynx.message.v1';
  origin: string;
  chain: Chain;
  network: Network;
  purpose: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  payload: { encoding: 'utf8' | 'hex'; value: string };
}

interface SignedData {
  signature: string;
  signerPublicKey: string;
  signingDigest: string;
  message: StructuredMessage;
}
```

- domain は固定 literal である。
- purpose は [a-z0-9][a-z0-9._:-]{0,63} に一致する required string。
- nonce は 16〜32 random bytes の padding なし base64url。Origin + Account で reserve / used を管理し、同一 nonce を再利用しない。
- issuedAt は現在時刻の前後 5 分以内、expiresAt は issuedAt より後かつ 10 分以内。request expiry と message expiry の早い方を署名期限とする。
- payload.encoding = utf8 は NFC 済みの有効な Unicode でなければならず、NFC でない入力を変換してはならない。hex は偶数長 lowercase hexadecimal、decoded payload は 16 KiB 以下とする。
- signing bytes は ASCII prefix MOSAICLYNX\0MESSAGE\0V1\0 と、StructuredMessage を RFC 8785 JCS で canonicalize した UTF-8 bytes の連結である。署名 primitive は wallet-core / chain-specific 契約に委譲する。
- message の表示内容と signing bytes は同じ structured message から生成し、raw bytes の羅列だけで blind signing を成立させない。

既存 Relay handoff の RelayDataSigningRequest は同じ message context を messageExpiresAt field で表している。一方、Product / Core / SignedData は expiresAt を使用する。この field 名の統一、両 field の対応または wire adapter の正本は未決であり、§18 の OPEN-001 として上流へ feedback する。実装は片方を暗黙に別名扱いしてはならない。

### 9.5 TransactionSummary / Inspection

TransactionSummary は Signer が target から導出する confirmation 用 model である。適用可能な範囲で次の情報を含める。

- operation、transaction type、version、Chain、Network
- sender、expected signer、selected signer、recipient、asset / mosaic、amount、fee、deadline
- message、aggregate outer / embedded transaction、parent / multisig context
- existing signature / cosignature、expected role、metadata / namespace / authority / permission changes
- target digest、canonical consistency、freshness、external state unverified、warnings

summary は表示のための derived information であり、署名 target、hash-only parent、外部 dApp の説明または Relay metadata の代替ではない。summary と target の不一致、必須情報の欠落、表示不能、未知 field または安全な意味解釈の失敗は INSPECTION_FAILED 相当として署名を拒否する。画面 layout、表示順、文言および transaction type ごとの field は下位仕様に委譲する。

### 9.6 Signing result

transaction signing の成功結果は次の公開情報を持つ。

```ts
interface SignedTransaction {
  payload: string;
  hash: string;
  signerPublicKey: string;
}
```

payload、hash、signerPublicKey は required、nullable 不可である。Signer は wallet-core の返却値をそのまま転送せず、元 target、requestId、operation、Account、Chain、Network、expected signer と対応することを検証する。dApp は受け取った結果を元 request と独立に検証し、announce は dApp の責務とする。

cosignature result の exact field と message signing の signature encoding は既存下位契約に従う。未確定の公開形式を本書で追加しない。

## 10. Error Model

### 10.1 共通 error の意味

境界を越える error は、外部利用者が安全な終了・新規 request・再接続を判断できる最小限の情報だけを含む。共通 error は次の logical category を区別する。

| Category              | 意味                                                                                      | retryable の既定                                        |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| invalid_request       | schema、必須 field、形式、サイズ、encoding、context または payload が不正                 | 同じ request は不可。入力を修正した新規 request のみ    |
| unsupported           | operation、Chain、Network、format、type、version または capability が非対応               | 同じ意味の fallback 不可。対応確認後の新規 request のみ |
| permission_denied     | Origin、session、scope、Profile、Account または permission revision が不一致・revoke 済み | 同じ request は不可                                     |
| user_rejected         | 利用者が明示的に拒否した                                                                  | 自動 retry 不可                                         |
| authentication_failed | 署名ごとの認証が失敗した                                                                  | 古い approval の再利用不可                              |
| expired               | request、message、transaction context または parent が期限切れ                            | 新しい expiry と新規承認を伴う request のみ             |
| cancelled             | 利用者、dApp、Signer、platform または transport が取消した                                | 同じ request の再開不可                                 |
| duplicate_or_replay   | 使用済み、重複、replay、late delivery または stale identity                               | 同じ request の再送不可                                 |
| inspection_failed     | parse、validation、semantic inspection または表示が不可能                                 | blind signing 不可                                      |
| signing_failed        | wallet-core / Signer の処理失敗が確定                                                     | 原因を隠した自動再署名不可                              |
| timeout               | wait、transport または lifecycle の期限到達                                               | outcome を推測せず新規 request のみ                     |
| transport_failure     | Provider、Relay、network、handoff または delivery の失敗                                  | Relay delivery を署名成功と扱わない                     |
| internal_failure      | 安全に意味を確定できない内部失敗                                                          | fail-closed                                             |

retryable は共通 wire field として確定していない。上表の既定は処理規則であり、下位 protocol が明示する場合だけ具体的な retryable field へ射影する。

### 10.2 SDK 公開 error code

既存 handoff で確定している公開 code は次の union である。

```ts
type MosaicLynxSDKErrorCode =
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

interface MosaicLynxSDKError {
  code: MosaicLynxSDKErrorCode;
  message: string;
}
```

message は human-readable だが、分岐・authorization・retry の根拠にしない。安定した code を使用する。HTTP status、URL、token、暗号 library error、Provider 内部例外、stack trace、parser dump、Vault detail および wallet-core の秘密情報を公開 message、details または cause に含めない。

Relay の RELAY_REQUEST_REJECTED は Relay HTTP の structural rejection body であり、SDK 公開 error code と同一視しない。Relay / Provider / wallet-core の error mapping は、外部が必要な category を失わない範囲で normalize する。

### 10.3 Unknown result と delivery disposition

RESULT_UNKNOWN は署名生成自体の成否を安全に確定できない terminal outcome である。成功、拒否、失敗または未署名と推測してはならず、同一 request の自動 retry / 再署名を禁止する。

DELIVERY_UNKNOWN は error category または signing state ではなく、確定済み result の delivery disposition である。

```text
PENDING → DELIVERED
PENDING → DELIVERY_UNKNOWN
```

SUCCEEDED + DELIVERY_UNKNOWN では、同じ target の再署名、新しい signature の生成および SIGNING への復帰を禁止する。許される候補は既存 result の resend / retrieval / lookup だけであり、具体的な API は下位 handoff に委譲する。RESULT_UNKNOWN と DELIVERY_UNKNOWN を USER_REJECTED、SIGNING_FAILED、RELAY_ERROR または相互の別状態へ自動変換しない。

## 11. Serialization

### 11.1 JSON と field naming

既存の SDK / Relay / handoff boundary は JSON object と TypeScript の camelCase field naming を使用する。実装は既存 field 名を snake_case、別名または位置依存 tuple へ変換してはならない。

- JSON object の required / optional は本書および operation-specific contract に従う。
- optional field の absent と null は同じ意味ではない。nullable と明示されない field に null を送らず、値がない場合は field を omitted とする。
- boolean、string、array、object の型を別 JSON 型へ coercion しない。
- integer quantity、amount、fee、deadline、timestamp number および chain-specific numeric field は浮動小数で計算しない。wire の exact representation は Chain Compatibility Specification に従う。
- arbitrary binary は共通モデルで raw JSON byte array としない。既存契約が指定する hexadecimal または padding なし base64url を使用する。どちらも指定されていない binary field は OPEN とする。
- public key、signature、hash、payload の encoding と大小文字規則は operation / Chain-specific contract に従う。入力を表示都合で変換してから digest / signature verification しない。

### 11.2 Canonicalization と digest

RFC 8785 JSON Canonicalization Scheme（JCS）が指定された object は、次の順に処理する。

1. schema、型、required field、unknown field および value constraint を検証する。
2. RFC 8785 JCS で canonicalize する。
3. 指定された場合に限り UTF-8 bytes の digest を計算する。
4. digest、AEAD、signature または response binding を検証する。

Relay handoff request の requestDigest は SHA-256(JCS(RelayRequest)) の lowercase hexadecimal である。structured message の signing bytes は §9.4 の prefix + JCS bytes である。JCS が指定されていない model に独自 canonicalization を追加してはならない。

### 11.3 Relay encrypted envelope

Relay の暗号文は Relay が opaque として扱う。既存 envelope の外形は次のとおりである。

```ts
interface EncryptedRelayEnvelope {
  algorithm: 'A256GCM';
  nonce: string;
  ciphertextAndTag: string;
}
```

nonce と ciphertextAndTag の base64url 表現、AAD、key derivation および generation binding は Web Transaction Handoff Specification と packages/relay-protocol の既存契約に従う。Relay は復号、再暗号化、payload rewriting、semantic conversion および signing result の生成を行わない。

## 12. Validation

### 12.1 共通検証順序

各受信側は、少なくとも次の順序で fail-closed に検証する。関数内部の実装方法は規定しない。

1. JSON / envelope の型、size、duplicate key、required / optional、unknown field。
2. enum、literal、identifier format、timestamp format、length、range および null 禁止。
3. requestId、sessionId、generation、requestDigest、response correlation および duplicate / replay。
4. Origin、caller、session、permission scope / revision、Profile / Account binding。
5. Chain、Network、payload signer、expected signer および Profile consistency。
6. operation-specific transaction / message parse、canonicality、semantic inspection および displayability。
7. confirmation / authentication / Authorization binding。
8. 署名前の target、context、digest、permission revision、capability context および raw input の再検証。
9. wallet-core result と request / target / Account / Chain / Network の対応。

途中の検証を別 component の成功、Relay delivery、Provider response、過去の approval、現在の permission の存在だけで代替してはならない。

### 12.2 Model ごとの検証

| Model                 | 共通 validation                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Scope                 | enum、Chain / Network の組み合わせ、payload / Account / Profile との一致。                                                     |
| Identifier            | exact encoding、必要な byte length、空値禁止、duplicate / reuse 禁止。                                                         |
| Origin                | canonical form、許可された scheme、browser observed context / proof との完全一致、Mainnet の DNS / HTTPS 制約。                |
| Timestamp             | UTC RFC 3339 秒精度、実在日時、順序、expiry、既定 TTL。                                                                        |
| PublicAccountIdentity | required field、Chain-specific address / public key、Scope 一致、signer identity 一致。                                        |
| PermissionGrant       | Origin、Profile、Scope、permitted account、revision、timestamp の整合。unknown permission は未許可。                           |
| Transaction payload   | 偶数長 hex、256 KiB 以下、decode、allowlist、全 field、size、range、network、canonical reserialize byte equality。             |
| Structured message    | fixed domain、purpose regex、nonce length / freshness / reuse、payload encoding、NFC / lowercase hex、issued / expiry window。 |
| TransactionSummary    | target-derived、全 security-relevant field、表示可能性、target との不一致なし。外部 summary 単独信用禁止。                     |
| Response              | requestId / digest、operation、signer、Account、Scope、target、outcome と result / error の union consistency。                |
| Error                 | stable public code、secret / internal detail の非露出、unknown code の安全側処理。                                             |

### 12.3 Mutually exclusive と依存関係

- RelayResponse は outcome ごとに許可された result field だけを持つ。
- rejected / failed に成功 result を併記しない。
- originProof は対応 operation のみ許可し、Mobile Mainnet では required とする。
- expectedSignerPublicKey は指定時だけ検証し、指定がない場合でも payload / selected Account の signer validation を省略しない。
- Symbol cosignature の parentPayload と NEM cosignature の payload / parentPayload を混同しない。
- request expiry と message expiry のどちらかが過ぎた場合は署名しない。
- 同一 requestId で内容が異なる request は conflict / tampering として拒否する。同一内容の duplicate も追加 signing を発生させない。

## 13. 共通 State / Lifecycle 表現

署名 request の state は次の exact set を使用する。

```text
RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED

terminal:
REJECTED | FAILED | EXPIRED | CANCELLED | INVALIDATED | RESULT_UNKNOWN
```

- RECEIVED: 外部経路から受信したが、trusted request として扱う前。
- VALIDATED: 構造、caller、permission、session、freshness、Chain / Network / Account、operation、capability を検証済み。
- INSPECTED: target を chain-specific に解析し、confirmation model を生成済み。
- AWAITING_USER: Signer 管理 UI で確認・拒否を待つ。署名認証は未成立。
- AUTHORIZED: 特定 request / target に対する明示承認と署名ごとの認証が成立した短寿命状態。
- SIGNING: target 再検証後に wallet-core の signing contract を呼び出している状態。自動再実行しない。
- SUCCEEDED: wallet-core result と target、signer、Account、Scope、request correlation を検証済み。
- REJECTED: 利用者拒否。署名 result を持たない。
- FAILED: 失敗が確定した。
- EXPIRED: request または適用 message / transaction context の期限切れ。
- CANCELLED: 利用者、dApp、Signer、platform または transport による取消。
- INVALIDATED: context、target、permission、session、lifecycle または integrity の変化により継続不能。
- RESULT_UNKNOWN: 署名生成自体の成否不明。delivery failure には使用しない。

Terminal state を reopen しない。REJECTED、FAILED、EXPIRED、CANCELLED、INVALIDATED、RESULT_UNKNOWN から同じ request / Authorization で signing を再開しない。SUCCEEDED 後の delivery status は signing state ではなく §10.3 の disposition として扱う。

## 14. Forward / Backward Compatibility

### 14.1 互換性を許可できる変更

次の変更だけを、既存の security invariant と schema validation を維持する範囲で許可候補とする。

- 新しい optional field を、受信側が明示的に安全に無視または処理できる同一 version へ追加する。
- 既存 capability set に、既存 operation の意味を変えない新 capability を追加する。
- 新しい protocol / capability version を追加し、old version の意味を変更しない。

### 14.2 互換性を許可しない変更

- required field の削除、型変更、enum の意味変更、同じ field への別 encoding の導入。
- Chain / Network、Origin、Account、permission、request correlation、expiry、approval または target binding の弱体化。
- unknown operation / version / field を旧 operation、raw signing または別 transport の成功へ fallback すること。
- 同じ version literal のまま signing bytes、canonicalization、signature result、error semantics を変更すること。

Unknown field、unknown enum、unsupported version、duplicate key、ambiguous union、malformed payload は、明示的な forward-compatible schema がない限り拒否する。Backward compatibility の期間、deprecation、migration および capability negotiation の処理手順は本書の範囲外である。

## 15. Security Invariants

Interface / Data Model 層では、少なくとも次を MUST とする。

1. request、response、permission、Account、summary、error、URL、log、diagnostic に private key、Mnemonic、seed、Profile password、decrypted Wallet Store、session secret、credential raw 値または復元可能な秘密情報を含めない。
2. Origin、caller、session、permission、Account、Chain、Network、operation、capability、target、freshness を適用範囲で binding する。requestId 単独で authorization を表現しない。
3. requestId、nonce、expiry、generation および duplicate / replay state を用いて、遅延・再送・state loss が追加署名に直結しないようにする。
4. 外部入力、encrypted envelope、Relay metadata、Node metadata、dApp の display text および自己申告 Origin を、semantic validation 前に trusted としない。
5. Signer が target 全体を parse、validate、inspect、display できない場合は署名しない。warning だけで blind signing を許可しない。
6. 1 request = 1 confirmation = 1 authentication = 1 signing operation を維持する。
7. 署名前に承認時 context、permission revision、capability context、target、canonical bytes、digest および signer を再検証する。変更時は Authorization を invalidated とする。
8. Relay の acceptance、delivery、acknowledgement、保存状態または availability を approval、semantic safety、署名成功または Account authorization と混同しない。
9. RESULT_UNKNOWN の後に自動再署名せず、SUCCEEDED + DELIVERY_UNKNOWN の後に既存 result 以外を再生成しない。
10. unknown、unsupported、malformed、期限切れ、認証失敗、context loss または検証不能は fail-closed とする。

## 16. Component Responsibilities

| Component         | 共通 model の利用                                                                                                                                                                      | 担当しないこと                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| SDK               | 公開 Scope / Account、request construction、requestId correlation、capability / version の確認、response validation、error normalization                                               | 最終 Origin authority、permission authority、semantic inspection、approval、secret processing、raw signing、announce         |
| Browser Extension | browser-observed Origin / document context、PermissionGrant、Account / Profile / Scope binding、target inspection、TransactionSummary、trusted UI、approval / authentication、結果検証 | Page / Provider の自己申告を authority とすること、wallet-core 内部責務、Relay の意味解釈                                    |
| Mobile App        | handoff source、origin proof、session / generation、request integrity、Scope / Account、target inspection、trusted UI、device authentication、approval、result generation              | Relay delivery を approval とすること、未実装の Mobile capability を実装済みとすること、wallet-core 内部責務                 |
| Relay             | protocol / generation / requestId / expiry / size / structural lifecycle、opaque envelope の一時配送                                                                                   | payload semantics、transaction / message inspection、Origin / Account authority、approval、署名、announce、long-term history |
| wallet-core       | 秘密情報、Wallet Store、key identity、chain-specific cryptography、raw signing の正本                                                                                                  | Origin、permission、UI、user approval、transaction meaning、request correlation、公開 error の設計                           |

Relay と wallet-core は共通 model の一部を transport / cryptographic boundary として受け取るが、相手の責任を代替しない。Mobile App は現在の workspace に実装がない将来コンポーネントであり、ここで記載するのは要求・設計上の責任境界である。

## 17. Traceability

重要な契約のみを次に追跡する。

| Requirement                                                | Design                                                                 | 本仕様                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CR-005、CR-NFR-005、SDK-FR-012                             | architecture §13、interfaces design §3.3                               | §5.1、§9.2、§12.2 の Chain / Network 分離と chain-specific validation               |
| CR-NFR-008、CR-NFR-009、CR-NFR-010、CR-NFR-011、CR-NFR-012 | browser-extension design §7〜§10、signing-flow §5、§16、§21            | §5.2〜§5.5、§6、§8、§13、§15 の binding、freshness、correlation、replay 防止        |
| CR-002、CR-003、CR-004、CR-007-TX、CR-007-MSG              | security-design §8、signing-flow §8〜§15、interfaces design §6.5       | §9 の target、TransactionSummary、structured message、blind signing 禁止            |
| CR-006、SDK-FR-008、RR-002                                 | signing-flow §20、interfaces design §6.4、handoff §7.2                 | §6.3、§9.6、§10.3 の result correlation、response outcome、unknown / delivery 分離  |
| CR-011、RR-003、RR-008、RR-NFR-003                         | architecture §8〜§12、relay design §8、§27〜§29、security-design §17   | §6.2、§7、§11.3、§15、§16 の Relay opaque boundary、generation、secret isolation    |
| SDK-FR-002〜004、BR-004、MR-004                            | browser-extension design §8〜§9、sdk design §8〜§10                    | §5.3、§8 の Public Account、PermissionGrant、Origin / Scope / Account binding       |
| SDK-COMP-001〜004、RR-NFR-005                              | sdk design §7、§18、relay design §27、interfaces review IF-001〜IF-003 | §7、§14 の known version literal、unsupported / unknown の fail-closed、OPEN の保持 |

## 18. OPEN Issues

### OPEN-001: Structured message expiry field の整合

- **問題:** Product / Core / SignedData は expiresAt、RelayDataSigningRequest は messageExpiresAt を使用する。
- **本書だけで決定できない理由:** 既存仕様間の contract 差であり、片方を alias とするには Provider、Mobile handoff、Relay および structured-message の更新判断が必要である。
- **影響範囲:** signData request、JCS object、署名 bytes、expiry validation、response verification、SDK / Mobile interoperability。
- **戻すべき上流文書:** docs/specifications/web-transaction-handoff-spec.md、docs/specifications/product-spec.md、必要に応じて docs/requirements/requirements.md の CR-007-MSG 下流契約。

### OPEN-002: Common capability identifier / negotiation contract

- **問題:** capability の意味カテゴリはあるが、identifier の namespace、set field、version representation、negotiation response、deprecation rule が確定していない。
- **本書だけで決定できない理由:** SDK、Provider、Mobile、Relay の version policy と公開 scope を同時に決める必要があり、Design が下位仕様へ委譲している。
- **影響範囲:** unsupported 判定、Provider API、Mobile / Relay compatibility、Mainnet capability gate、forward compatibility。
- **戻すべき上流文書:** docs/requirements/sdk.md の SDK-OPEN-006、SDK-OPEN-007、docs/requirements/relay.md の RR-OPEN-001、必要に応じて SDK / Relay Design。

### OPEN-003: Common protocol version field and compatibility matrix

- **問題:** SDK 1.0.0、Provider 2.x、Relay mosaiclynx.relay.v1 等の literal は確定しているが、全境界共通の version field と matrix がない。
- **本書だけで決定できない理由:** version mismatch の公開 error、backward compatibility の期間、deprecation、migration は release / platform policy と結合する。
- **影響範囲:** unknown version、additive field、Provider / Relay selection、旧 client の安全な拒否。
- **戻すべき上流文書:** docs/requirements/sdk.md の SDK-OPEN-006、docs/requirements/mobile-app.md の MR-OPEN-001、Relay handoff / release design。

### OPEN-004: Permission expiry and independent revocation identifier

- **問題:** 現行 PermissionGrant は Origin、Profile、Scope、Account set、revision、created / updated を持つが、expiresAt、独立 permissionId、revokedAt は定義していない。
- **本書だけで決定できない理由:** permission expiry と request / session expiry を混同できず、複数 platform の revoke / synchronization contract を先に決める必要がある。
- **影響範囲:** revocation、Authorization invalidation、Mobile / Browser state synchronization、backup / restore、session recovery。
- **戻すべき上流文書:** docs/design/interfaces.md の permission delegation、docs/design/security-design.md §9、docs/requirements/sdk.md の connection / permission 下流仕様、必要に応じて Profile / Account Specification。

### OPEN-005: Browser / Mobile caller context outside existing handoff

- **問題:** Browser の observed Origin と Mobile Mainnet の Origin proof は定義されているが、Browser session identifier の wire form、Mobile の非 Relay caller、非 Web 外部 invocation の共通表現は未確定である。
- **本書だけで決定できない理由:** platform API、OS handoff、permission authority、Mainnet gate と結合し、共通 callerContext を独自追加すると architecture を拡張するため。
- **影響範囲:** Origin binding、session correlation、permission scope、Mobile / Browser cross-transport compatibility。
- **戻すべき上流文書:** docs/requirements/sdk.md の SDK-OPEN-007、docs/requirements/mobile-app.md の MR-OPEN-002、Browser / Mobile Design。

### OPEN-006: Aggregate / multisig / cosignature public scope

- **問題:** signing-flow は parent 全体確認と chain-specific boundary を定めるが、各 platform / SDK で公開する operation、type / version、result field は未確定である。
- **本書だけで決定できない理由:** Chain Compatibility、SDK API、Mobile / Relay milestone と同時に決定しなければならない。
- **影響範囲:** cosignTransaction capability、parent payload、TransactionSummary、error、fixture、互換性。
- **戻すべき上流文書:** docs/requirements/sdk.md の SDK-OPEN-002、docs/specifications/chain-compatibility-spec.md の対応範囲、signing-flow / platform 下位仕様。

## 19. Specification 完了条件

本書を参照する実装・レビューは、少なくとも次を確認できる状態を完了とする。

- §5〜§6 の required / optional、identifier、Origin、Scope、Envelope および response union を検証できる。
- §8 の permission binding と公開 / 内部 Account 境界を越境させない。
- §9 の transaction / message / cosignature を Chain-specific 契約へ委譲し、blind signing を許可しない。
- §10〜§14 の error、serialization、validation、state、compatibility を用いて成功と安全側失敗を区別できる。
- §15〜§16 の secret isolation、request correlation、Relay opaque boundary、wallet-core boundary を維持できる。
- §18 の OPEN を未解決のまま、実装が独自の共有 field、version、permission expiry、message expiry alias または capability negotiation を発明していない。
