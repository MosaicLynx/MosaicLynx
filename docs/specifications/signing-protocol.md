# MosaicLynx Signing Protocol Specification

## 1. 目的

本書は、MosaicLynx の Browser Extension、Mobile App、SDK、Relay および wallet-core の間で共有する署名処理の意味、署名対象、承認境界、状態、結果および安全側の失敗を実装可能な粒度で定義する。

本書が定義するのは transport に依存しない signing protocol の共通 semantics である。Browser Extension の message transport、Mobile の外部起動、Relay HTTP endpoint、SDK の公開 API および wallet-core の内部 API は本書の対象外であり、対応する下位仕様へ委譲する。

## 2. 適用範囲と規範性

### 2.1 適用範囲

本書は次の logical operation に適用する。

| operation          | 対象                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `TRANSACTION_SIGN` | 通常 transaction、Symbol Aggregate、NEM multisig wrapper など、transaction 全体を最初の署名対象とする処理 |
| `COSIGNATURE_SIGN` | 既存の Aggregate / multisig parent に対して selected cosigner が追加署名する処理                          |
| `MESSAGE_SIGN`     | 既存の structured message または message signing contract に対する署名                                    |

`TRANSACTION_SIGN`、`COSIGNATURE_SIGN` および `MESSAGE_SIGN` は logical operation の分類であり、公開 API 名、transport operation 名または capability identifier を新たに定義するものではない。公開 operation との対応は既存の [Interface / Data Model Specification](./interfaces.md) および [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) に従う。

MosaicLynx v1 の Signer は transaction signing と message signing を共通能力として扱う。`COSIGNATURE_SIGN` の公開範囲は既存の SDK / Chain-specific contract が定める範囲に限り、未決の範囲を本書で拡張しない。

### 2.2 規範性

本書の `MUST`、`MUST NOT`、`SHOULD` および `MAY` は、[共通 Interface / Data Model Specification](./interfaces.md) の同じ表記に従う。

- `MUST`: 適用対象は満たさなければならない。
- `MUST NOT`: 適用対象は指定された処理または状態を成立させてはならない。
- `SHOULD`: 原則として満たすべきであり、満たさない場合は理由と影響を記録する。
- `MAY`: 既存の適用範囲を越えない任意の実装上の選択肢である。

本書と共通契約が重複する場合、identifier、Origin、Scope、Account identity、timestamp / expiry、request / response envelope、common error、serialization および common validation は [interfaces.md](./interfaces.md) を正本とする。Chain-specific な byte、schema、address、hash および署名規則は [Chain Compatibility Specification](./chain-compatibility-spec.md) を正本とする。

## 3. 上流資料

### 3.1 直接の上流契約

- [Signing Flow 基本設計](../design/signing-flow.md): signing lifecycle、authorization、target binding、Aggregate / cosignature / Partial、result disposition および責任境界。
- [共通 Interface / Data Model Specification](./interfaces.md): 共通 identifier、request / response、Account、Scope、Origin、Permission、message model、error、serialization、validation および state 表現。
- [共通 Interface / Data Model 基本設計](../design/interfaces.md): 共通 model の設計意図と責任境界。
- [共通 Security Design](../design/security-design.md): Trust Boundary、explicit approval、authentication、replay protection、secret isolation および fail-closed。

### 3.2 関連仕様・要件

- [共通要件](../requirements/requirements.md): `CR-001`〜`CR-012`、`CR-007-TX`、`CR-007-MSG` および共通受け入れ条件。
- [SDK 要件](../requirements/sdk.md): `SDK-FR-006`、`SDK-FR-007`、`SDK-SEC-005`〜`SDK-SEC-006` および `SDK-OPEN-*`。
- [Browser Extension 要件](../requirements/browser-extension.md): Browser Signer の caller、approval、authentication および lifecycle 要件。
- [Mobile App 要件](../requirements/mobile-app.md): Mobile Signer の外部要求、認証および lifecycle 要件。
- [Relay 要件](../requirements/relay.md): opaque / untrusted delivery、generation、replay、state loss および責任境界。
- [Product Specification](./product-spec.md): v1 の transaction allowlist、message signing、confirmation 要件および acceptance criteria。
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md): `signTransaction`、`signData`、handoff の request / response、concrete error code および Relay 境界。
- [Chain Compatibility Specification](./chain-compatibility-spec.md): Symbol / NEM の transaction、canonicality、署名 byte、hash および fixed vector。
- [Profile / Account Specification](./profile-account-spec.md): Profile、Account、lock および `every-signature` authentication。

レビュー資料は上流の要求または設計を置き換えない。Signing Flow の状態、Aggregate / cosignature / Partial、authorization binding および result disposition は [Signing Flow Design Review](../reviews/design/signing-flow-review-002.md) が `READY` と確認した範囲を引き継ぐ。

## 4. 用語

| 用語                 | 本書での意味                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Signer               | Browser Extension または Mobile App。request の最終検証、確認、承認、認証、署名 orchestration および result validation の主体                |
| signing request      | 一つの logical signing decision に必要な request context、caller、session、permission、Account、Chain、Network、operation および target の組 |
| signing target       | 実際に署名される transaction、Aggregate、cosignature 対象、message または chain-specific target。表示 summary ではない                       |
| inspection           | target を parse、validate、semantic analysis し、確認可能な confirmation model を生成する処理                                                |
| confirmation model   | Signer が signing target から生成する利用者確認用の logical model。UI layout ではない                                                        |
| authorization        | 特定の request / target に対する利用者の明示承認と署名ごとの authentication が成立した短寿命の状態                                           |
| result unknown       | trusted Signer だけが成立させる、署名生成自体の成功・未署名を安全に確定できない状態。配送不明には使用しない                                  |
| delivery disposition | trusted Signer が known signed result に付随させる配送状態。signing state または signing operation ではなく、transport が生成しない          |
| parent               | Aggregate または multisig の全体 transaction context。cosignature の検証・確認対象となる                                                     |
| Partial              | Chain / Network または handoff 上の未完成・追加署名待ちの chain-specific context。共通 signing primitive ではない                            |

## 5. Protocol の共通契約

### 5.1 共通 model の再利用

Signing request / response は [interfaces.md §6](./interfaces.md) の request / response envelope、`Scope`、`PublicAccountIdentity`、`PermissionGrant`、`SigningResponse` および error model を使用する。本書は同じ field、型、identifier、Origin、timestamp、expiry、serialization、common validation または error code を再定義しない。

署名 operation が追加で要求する情報は、既存の operation-specific contract に従う。

- transaction signing: [interfaces.md §9.2](./interfaces.md) の `TransactionSigningRequest`。
- cosignature signing: [interfaces.md §9.3](./interfaces.md) の Chain ごとの request。Symbol と NEM の `payload` / `parentPayload` の関係を混同しない。
- structured message signing: [interfaces.md §9.4](./interfaces.md) の `StructuredMessage` / `SignedData`。
- response: [interfaces.md §6.3、§9.6](./interfaces.md) および handoff の concrete response contract。

外部署名 request は、共通仕様が required とする `requestId`、`operation`、`createdAt`、`expiresAt`、適用される caller / Origin context、Scope、signing target および protocol / capability context を持つ。特定 transport が wire field を省略できるのは、既存 handoff 等の operation-specific contract が明示する場合だけである。

### 5.2 Request identity と correlation

`requestId` は一つの logical signing request の identity であり、response は同じ request の `requestId` に一対一で対応しなければならない。`requestId` は [interfaces.md §5.2](./interfaces.md) の形式、encoding、長さおよび比較規則に従う。

- requestId を別 request、別 session、別 transport または別 target の result に流用してはならない。
- `correlationId` を requestId の別名として追加してはならない。既存 transport が別の correlation field を必要とする場合は、その contract の整合を OPEN とする。
- response を生成する Signer は、requestId に加えて operation、Scope、Account、signer、target および適用される session / protocol context が元 request と一致することを確認しなければならない。
- requestId、target または binding context が不一致の場合、成功 response を返してはならない。

### 5.3 Authorization binding

Authorization は次の tuple への一回限りの承認である。

```text
(caller, session, operation, Account, Chain, Network,
 permission context, protocol / capability context,
 signing target, transaction context, inspection result, freshness)
```

上記の各項目は対象 operation に適用される範囲で binding する。permission は承認時の scope / revision または同等の不変識別子を含み、protocol / capability は承認時の version / capability context または同等の不変識別子を含む。現在の permission または capability が存在することだけでは、承認時 binding の代替にならない。

次の変更は既存 Authorization を無効化する。

- caller、Origin、session、request identity または handoff generation
- operation、protocol version、capability または operation capability
- permission scope、permission revision、Profile または permitted Account
- selected Account、expected signer、Chain または Network
- transaction、Aggregate、parent、embedded / inner transaction、message、payload、nonce、expiry または signing bytes の生成対象
- signer role、existing signature / cosignature、target identity、canonicalization または inspection result

Authorization の内部保存形式、approval record の class 構成および secret の保持方式は実装へ委譲する。ただし、上記 binding を失った Authorization を再利用してはならない。

### 5.4 Signing operation の単位

一つの signing operation は、一つの logical signing target に対して一回限りの Authorization を消費する一つの signing decision である。

次は別の signing operation ではない。

- wallet-core 内部の API call、署名 primitive、署名検証または result validation
- response serialization、response delivery、既存 result の resend / retrieval / lookup
- Relay の配送 retry、polling または ACK

一つの Authorization で複数の独立 target、複数の request、複数の Account、複数の Chain / Network または複数の operation を署名してはならない。batch signing を暗黙に許可しない。

## 6. Signing lifecycle / State Machine

### 6.1 State set

Signing request は、次の state set を使用する。これ以外の共通 signing state または terminal state を本書で追加しない。

```text
RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED

terminal:
REJECTED | FAILED | EXPIRED | CANCELLED | INVALIDATED | RESULT_UNKNOWN
```

| state            | 意味                                                                                                                | signing 可否                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `RECEIVED`       | 外部経路から受信したが、trusted request として扱う前                                                                | 不可                                 |
| `VALIDATED`      | 共通構造、caller、permission、session、freshness、Chain / Network / Account、operation および capability を検証済み | 不可                                 |
| `INSPECTED`      | target と transaction context を chain-specific に parse / validate / inspect し、confirmation model を生成済み     | 不可                                 |
| `AWAITING_USER`  | Signer 管理 UI で確認・拒否を待っている。署名 authentication は未成立                                               | 不可                                 |
| `AUTHORIZED`     | 特定 request / target に対する明示承認と署名ごとの authentication が成立した短寿命状態                              | wallet-core 呼び出し前の再検証が必要 |
| `SIGNING`        | 再検証済み target を wallet-core の signing contract に渡している状態                                               | 同じ operation の自動再実行不可      |
| `SUCCEEDED`      | wallet-core の成功結果と target、signer、Account、Chain、Network、operation、request correlation を検証済み         | 署名済み。再署名不可                 |
| `REJECTED`       | 利用者が明示的に拒否した終端状態                                                                                    | 署名 result なし                     |
| `FAILED`         | validation、unsupported、inspection、authentication、wallet-core または内部処理の失敗が確定した終端状態             | 署名 result を成功として返さない     |
| `EXPIRED`        | request または適用される message / transaction / parent context の期限切れ                                          | 署名不可                             |
| `CANCELLED`      | 利用者、dApp、Signer、platform または transport が処理を取り消した終端状態                                          | 署名不可                             |
| `INVALIDATED`    | context、target、承認、session、lifecycle または完全性が変化し、継続できない終端状態                                | 署名不可                             |
| `RESULT_UNKNOWN` | 署名生成自体の成功・未署名を安全に確定できない終端状態                                                              | 成功扱い・自動再署名不可             |

`REJECTED` は利用者の明示拒否に限定する。検証失敗、認証失敗、期限切れ、取消し、context loss および結果不明を `REJECTED` に変換しない。

### 6.2 State transition

| 遷移                                      | 必須条件                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RECEIVED → VALIDATED`                    | 共通 envelope、identifier、Origin / caller、permission、session、freshness、Scope、Account、operation、capability および integrity を検証できた場合のみ |
| `VALIDATED → INSPECTED`                   | target 全体を対象 Chain の契約で parse / validate し、confirmation model を生成できた場合のみ                                                           |
| `INSPECTED → AWAITING_USER`               | Signer が確認可能な内容を生成し、trusted UI で利用者に提示できる場合のみ                                                                                |
| `AWAITING_USER → AUTHORIZED`              | 利用者が対象を確認して明示承認し、当該 signing request に対する `every-signature` authentication が成功した場合のみ                                     |
| `AUTHORIZED → SIGNING`                    | target、context、approval、authentication、permission revision、capability および expiry を署名直前に再検証し、全て一致した場合のみ                     |
| `SIGNING → SUCCEEDED`                     | wallet-core が成功を返し、Signer が signature / signed payload と元 request / target の対応を検証できた場合のみ                                         |
| 任意の non-terminal state → `REJECTED`    | 利用者が明示的に拒否した場合のみ                                                                                                                        |
| 任意の non-terminal state → `FAILED`      | 失敗が確定し、`EXPIRED`、`CANCELLED`、`INVALIDATED` または `RESULT_UNKNOWN` に該当しない場合                                                            |
| 任意の non-terminal state → `EXPIRED`     | 適用される request、message、transaction または parent の期限が到達した場合                                                                             |
| 任意の non-terminal state → `CANCELLED`   | cancel が受理され、署名生成成功または成否不明に先立って処理を終了できた場合                                                                             |
| 任意の non-terminal state → `INVALIDATED` | context loss、binding 変更、integrity failure、generation change または stale state により継続不能になった場合                                          |
| `SIGNING → RESULT_UNKNOWN`                | process loss、wallet-core / binding の応答喪失等により署名生成自体の成否を確定できない場合                                                              |

次の遷移は禁止する。

- `AWAITING_USER` または `AUTHORIZED` から target / context の再確認なしに `SIGNING` へ進むこと。
- `REJECTED`、`FAILED`、`EXPIRED`、`CANCELLED`、`INVALIDATED` または `RESULT_UNKNOWN` から同じ request / Authorization を用いて signing を再開すること。
- `SUCCEEDED` から同じ request / target を再署名すること。
- terminal state を、新しい request identity を生成せずに reopen すること。
- Relay 配送成功、UI 再表示、Service Worker 再起動、Mobile process 復旧または現在の permission の存在だけで `AUTHORIZED` に戻ること。

### 6.3 Lifecycle loss

次の事象で承認対象と認証状態の連続性を安全に再構成できない場合、既存 Authorization を破棄する。

- Browser Extension の Service Worker 停止・再起動、extension reload または browser restart
- Mobile App の background、process termination、process recreation、restart または device lifecycle change
- Relay restart、state loss、generation change または handoff context の消失
- browser navigation、tab / frame / document context の変更
- Profile lock、permission revoke、permission scope / revision change、Account / Chain / Network change

`RECEIVED`、`VALIDATED`、`INSPECTED`、`AWAITING_USER` で失われた context を復元できない場合は `INVALIDATED` とする。`AUTHORIZED` は、同じ trusted context から approval、authentication、target および全 binding を再構成できない限り `INVALIDATED` とする。古い approval や authentication のみを復元して signing を再開してはならない。

`SIGNING` 中に wallet-core の結果が確定しない場合は `RESULT_UNKNOWN` とする。署名結果が確定した後に response delivery だけが失敗した場合は `RESULT_UNKNOWN` にせず、§19.3 の `DELIVERY_UNKNOWN` とする。

## 7. Request acceptance と共通 validation

### 7.1 受信から inspection まで

Signer は request を受信した時点で署名可能と扱ってはならない。受信後、少なくとも次の順序で検証する。各項目の共通 field rule は [interfaces.md §12](./interfaces.md) を使用する。

1. JSON / envelope の型、size、duplicate key、required / optional、unknown field および malformed encoding。
2. enum、literal、identifier format、timestamp format、length、range、null 禁止および operation union。
3. requestId、session / generation、requestDigest、response correlation および duplicate / replay。
4. Origin、caller、session、permission scope / revision、Profile および permitted Account。
5. Chain、Network、Profile、selected Account、payload signer および expected signer。
6. operation-specific target の parse、canonicality、semantic validation、integrity および displayability。
7. request / message / transaction / parent expiry。

検証のいずれかに失敗した場合、Signer は `INSPECTED`、`AWAITING_USER`、`AUTHORIZED` または `SIGNING` へ進めず、該当する terminal state で安全に終了する。Relay、SDK、Provider、dApp、Node または requester が同じ検証を成功させたことを Signer の検証の代替にしてはならない。

### 7.2 Permission と connection の分離

署名 request は、Origin / caller、Profile、Scope、permitted Account および permission revision が一致する既存 permission と binding しなければならない。

- connection permission は connection / public Account disclosure の許可であり、署名ごとの approval、authentication、inspection または signing authorization ではない。
- session は接続・handoff・transport context であり、permission または signing authorization ではない。
- Profile が `UNLOCKED` であること、既存 session があること、接続済みであることまたは直前の認証が成功したことだけで署名を開始してはならない。
- permission が存在しない、revoke 済み、scope / revision 不一致、Profile 不一致または Account 不一致の場合は `permission_denied` として signing を拒否する。
- permission、scope、Account または revision の変更は未完了 request の Authorization を無効化する。

### 7.3 Duplicate / replay / late delivery

- 同じ `requestId` で内容が異なる request は conflict / tampering として拒否し、追加署名を発生させない。
- 同じ `requestId` で内容が同じ request が active request と重複した場合、第二の signing operation、confirmation、authentication または wallet-core signing を開始してはならない。既存処理または既存 result の扱いは下位 transport contract に従う。
- 使用済み、terminal、期限切れ、cancel 済み、失効済み、旧 generation または stale な request は signing request として再利用してはならない。
- late delivery は現在の request、session、generation、expiry および target binding を再検証し、対応を確認できない場合は拒否する。
- duplicate / replay の検出結果を、署名成功、利用者拒否または別 operation の成功へ変換しない。

### 7.4 Expiry

request expiry、message expiry、transaction / parent context の expiry、session expiry および permission の状態は別々に検証する。

- 適用される期限のいずれかが過ぎた場合、署名開始前は `EXPIRED` とし、署名を開始しない。
- request expiry は [interfaces.md §5.4](./interfaces.md) と operation-specific handoff contract に従う。Relay handoff の 5 分 TTL は Handoff Specification の定義を使用し、延長しない。
- structured message の `issuedAt`、message expiry および request expiry は、[interfaces.md §9.4](./interfaces.md) の検証規則に従う。field 名の不一致は §24 の OPEN-001 として扱う。
- expiry 到達後に、UI の再表示、transport retry または process 復旧だけで `AUTHORIZED` / `SIGNING` に戻してはならない。`SIGNING` 開始後の expiry は署名が未実行である根拠にはならず、wallet-core の結果が確定しない場合は `RESULT_UNKNOWN` とする。

## 8. Approval / Authentication / Signing 境界

### 8.1 独立した事実

次の事実を同一視してはならない。

| 事実                     | 意味                                                           | 次段階を自動的に許可するか                              |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------------------- |
| request received         | Signer が外部入力を受信した                                    | 許可しない。`RECEIVED` に留める                         |
| request valid            | 構造と適用 context の検証に成功した                            | 許可しない。inspection が必要                           |
| permission exists        | caller が scope / Account を利用できる許可がある               | 許可しない。毎回の confirmation / authentication が必要 |
| inspected                | target から確認可能な内容を生成できた                          | 許可しない。利用者の判断が必要                          |
| user reviewed            | 利用者が Signer UI で内容を確認できる状態になった              | 許可しない。明示承認が必要                              |
| user approved            | 利用者が当該 target を明示的に承認した                         | authentication が必要                                   |
| authentication succeeded | 当該 signing request / target に対する署名ごとの認証が成立した | 署名前再検証が必要                                      |
| signing succeeded        | wallet-core の result と target の対応が検証済みである         | `SUCCEEDED`。delivery success とは別                    |
| response delivered       | result が相手へ配送されたことが確認できた                      | 署名成功の根拠にはしない                                |

### 8.2 User approval

Signer は target から confirmation model を生成し、利用者が少なくとも次を確認できる状態を作らなければならない。

- caller / Origin または適用される verified caller context
- operation が transaction signing、cosignature signing または message signing のいずれであるか
- Chain、Network、selected Account、expected signer および signer role
- transaction、parent、embedded / inner transaction、message の security-relevant field
- asset / amount / recipient、fee、deadline、metadata、namespace、authority / permission change 等の適用される影響
- target identity、digest、canonical consistency、freshness、expiry、既存 signature / cosignature および未検証の補助情報

対象 Chain / operation に適用される security-relevant field を parse、意味解釈または表示できない場合、warning の表示だけで approval を成立させてはならない。確認文言、表示順、画面レイアウトおよび platform UI は別仕様へ委譲する。

`TransactionSummary`、dApp が提供した summary、app 名、icon、説明、Relay metadata、Node response または外部 lookup は、Signer が target から導出した confirmation model の authority ではない。summary と target が一致しない場合、または target だけから必要情報を確認できない場合は署名しない。

### 8.3 Authentication / unlock

署名ごとの認証は、[Profile / Account Specification §20](./profile-account-spec.md) の `every-signature` を使用する。

- `UNLOCKED` は Profile の利用状態であり、signing authentication ではない。
- connection permission、session、過去の approval、過去の authentication または wallet-core の利用可能状態で署名認証を代替してはならない。
- 外部 request、Relay、SDK、Provider または dApp が unlock / authentication を直接実行または強制してはならない。
- authentication が失敗、cancel、timeout または別 request へ紐付いた場合、当該 request は署名せず、古い approval を再利用しない。
- Browser / Mobile の具体的な credential、OS authentication、rate limit および Binding は platform / Profile の下位仕様へ委譲する。ただし `every-signature` と explicit user presence の境界を弱めてはならない。

### 8.4 Approval 後の再検証

wallet-core を呼び出す直前に Signer は、少なくとも次を再検証する。

1. request が未期限切れ、未使用、未取消、未失効である。
2. caller、session、Origin、permission scope / revision、Account、Chain、Network、operation および protocol / capability context が Authorization と一致する。
3. target、transaction context、parent、embedded / inner transaction、message、signer、expected signer、既存 signature / cosignature が confirmation model と一致する。
4. chain-specific parse、validation、canonicalization、signature state、target digest および signing bytes の生成対象が承認時と一致する。
5. wallet-core に渡す raw target が承認済み target から再構成され、外部補助情報または別 input で置換されていない。

一つでも確認できない場合は Authorization を `INVALIDATED` とし、署名しない。

## 9. Signing Target 共通契約

### 9.1 正本と summary

署名対象の正本は、operation-specific request が保持する検証済み target bytes / structured object と、対象 operation に適用される transaction context である。requester supplied summary、表示用文字列、hash-only identifier または外部 lookup は signing target の正本ではない。

Signer は次の順で target を扱う。

1. request payload の形式、size、encoding および integrity を検証する。
2. 対象 Chain / operation の contract で target 全体を parse / validate する。
3. target から confirmation model と target identity / digest を導出する。
4. 利用者の approval / authentication を当該 target に binding する。
5. 署名直前に target を再取得・再解析し、承認時の target と byte / semantic level で一致させる。
6. 一致した target だけを wallet-core の既存 signing contract へ渡す。

canonicalization、digest、binary encoding、signature bytes および hash の具体的な方式は [interfaces.md](./interfaces.md) と [Chain Compatibility Specification](./chain-compatibility-spec.md) の既存契約を使用する。Signing Protocol が独自の digest、canonicalization、byte order または binary representation を追加してはならない。

### 9.2 Account / signer / Chain / Network binding

- request の `Scope` と target の Chain / Network は一致しなければならない。
- Profile の Network、selected Account、payload 内 signer、expected signer および返却 result の signer を Signer が照合する。
- `expectedSignerPublicKey` が省略されても、payload signer と許可された / 選択された Account の照合を省略しない。
- expected signer が指定される場合は対象 Chain の形式で検証し、実際の signer と完全一致しなければならない。
- Symbol / NEM、Mainnet / Testnet、別 Account および別 signer への暗黙変換を行わない。
- address、public key、network byte、checksum、chain-specific signer semantics は Chain Compatibility Specification に従う。

不一致は署名を開始せず、common error category として `permission_denied`、`invalid_request`、`inspection_failed` または既存の chain / signer mismatch の意味へ、下位 protocol の mapping に従って表現する。新しい error code を本書で定義しない。

### 9.3 Target mutation と TOCTOU

confirmation 後に次のいずれかが変化した場合、既存 Authorization は失効する。

- payload bytes、structured message field、transaction field、parent、embedded / inner transaction
- signer、expected signer、selected Account、Chain、Network、operation
- requestId、session、Origin、permission revision、capability、protocol version、expiry
- existing signature / cosignature、parent hash、transactions hash、canonical serialization または inspection result

Signer は変更後の target を古い confirmation に対して署名してはならない。再開する場合は、下位 lifecycle contract が許可する新しい request identity、新しい inspection、明示 approval および署名ごとの authentication を必要とする。

## 10. Transaction Signing

### 10.1 Transaction request

transaction signing は [interfaces.md §9.2](./interfaces.md) の `TransactionSigningRequest` を使用する。`operation` は既存 request contract の `signTransaction` と対応し、`chain`、`network`、`payload` および optional `expectedSignerPublicKey` の意味・required / optional・validation は共通 specification を参照する。

`payload` は対象 Chain の transaction 全体を表す hexadecimal bytes である。Signer は decode 前後の byte 対応、256 KiB 上限、Chain / Network、transaction type / version、全 field、署名状態、canonicality、integer range および signer を検証する。unknown type / version、未解析 field、余剰 byte、非 canonical encoding、overflow、過剰な nested element、wrong signer または unresolved alias を推測で補完してはならない。

### 10.2 対応範囲

transaction type / version の対応範囲は [Chain Compatibility Specification §4](./chain-compatibility-spec.md) と [Product Specification §12](./product-spec.md) の既存 allowlist に限定する。

| Chain  | 既存 allowlist の範囲                                               | Signing Protocol 上の条件                                                                                              |
| ------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Symbol | Transfer、Aggregate Complete / Bonded および既存 cosignature schema | type / version、embedded transaction、transactions hash、signer、asset effect、parent context を全体確認できる場合のみ |
| NEM    | Transfer、Multisig および既存 multisig cosignature schema           | wrapper / inner transaction、multisig role、signer、asset effect、parent context を全体確認できる場合のみ              |

上表は既存 allowlist の分類を示すものであり、新しい transaction type / version または public operation を追加しない。allowlist の exact version、inner type / version、件数、nesting、serialization および fixed vector は Chain Compatibility Specification を参照する。SDK / platform の対応範囲が未確定の target は unsupported として拒否する。

署名前に対応範囲を自動拡張しない。fixed SDK に新しい type / version が追加されても、仕様上の allowlist が更新されるまで許可しない。

### 10.3 Transaction confirmation と result

通常 transaction の確認 model は、適用される全 security-relevant field、recipient、asset / amount、fee、deadline、message、signer、Chain、Network、target identity および未検証状態を含む。

Signer は wallet-core に渡した target から得た result について、少なくとも次を確認する。

- signed payload が承認済み transaction target に対応する。
- signer、Account、Chain、Network、operation および expected signer が request と一致する。
- payload、signature、hash および target identity が既存の Chain-specific contract に従う。
- response の `requestId`、request digest / target binding および result metadata が元 request と一致する。

検証できない場合は `SUCCEEDED` とせず、署名 result を返さない。announce、node 選択および継続的な network state 管理は dApp の責任であり、Signing Protocol の成功条件に含めない。

## 11. Aggregate Transaction

### 11.1 Aggregate 全体

Symbol Aggregate Complete / Bonded は、outer transaction と embedded transaction 全体を同一の transaction context として扱う。outer だけ、summary だけまたは transactions hash だけを確認対象にしてはならない。

Signer は適用される範囲で次を parse、validate、inspect および confirmation model へ反映する。

- outer の type、version、network、signer、fee、deadline および target identity
- embedded transaction の件数、順序、type、version、signer、recipient、mosaic / amount および message
- transactions hash、existing cosignature、expected signer / role
- asset effect、namespace、metadata、authority / permission change、multisig またはその他の状態変更
- outer signer、embedded signer、fee payer、asset sender、recipient の関係

embedded transaction の一部、signer、asset effect、権限変更または parent binding を安全に確認できない場合、Aggregate 全体を署名しない。Aggregate Complete / Bonded は共通 operation を増やす理由にならず、最初の署名は `TRANSACTION_SIGN`、既存 parent への追加署名は `COSIGNATURE_SIGN` の target として扱う。

### 11.2 Aggregate signing と cosigning の分離

- Aggregate 本体への署名は outer / embedded transaction 全体を transaction target とする。
- Aggregate への cosignature は §12 の parent 全体と selected cosigner の関係を target とする。
- Aggregate が Bonded / Partial であることは、Node lookup、parent 補完または確認省略の根拠にならない。
- Symbol Aggregate の structure、transactions hash、signing bytes および cosignature schema は NEM multisig と共通化しない。

対応する全体情報を request から確認できない場合は、追加情報を Node、Relay、dApp または外部 API から取得して signing を継続せず、`inspection_failed` として安全側に終了する。

## 12. Cosignature

### 12.1 Signing target

Cosignature の target は detached cosignature bytes 単体ではない。target は、完全な parent transaction context と selected cosigner / role の組である。

```text
complete parent Aggregate / multisig context
  ├─ outer transaction
  ├─ embedded / inner transaction 全体
  ├─ existing signature / cosignature
  ├─ parent identity / hash
  └─ selected cosigner Account / role
              ↓
       COSIGNATURE_SIGN target
              ↓
       cosignature result
```

request field の required / optional は [interfaces.md §9.3](./interfaces.md) を正本とする。Symbol の cosignature request と NEM の cosignature request を同じ payload shape として扱わない。

### 12.2 Parent validation

Signer は少なくとも次を parent 全体から検証・確認する。

- parent の Chain、Network、transaction identity、canonical hash / parent binding
- outer、embedded / inner transaction、全 field、asset effect、recipient、権限変更および signer role
- selected Account と expected cosigner の一致
- existing signature / cosignature、duplicate signer、already signed、対象外 signer
- initiator / cosigner / multisig participant の role semantics
- parent expiry、request expiry、caller、session、permission および capability
- cosignature result と parent、selected cosigner、Account、Chain、Network、request の対応

parent 全体を Signer 自身が再構成・parse・validate・inspection・confirmation できない場合、cosignature を生成してはならない。

次は parent の全体表現ではない。

- hash only
- opaque identifier
- hash + summary
- external summary または dApp / Relay / Node の description
- parent の一部 field のみ
- hash + Node / external lookup

Node、Relay、SDK または dApp が提供する parent の意味説明を、Signer の inspection または approval の代替にしてはならない。具体的な cosignature public API、result field および対応範囲は `SDK-OPEN-002` と Chain / platform 下位仕様へ委譲する。

### 12.3 Duplicate cosignature

existing cosignature、同一 selected cosigner の重複、already signed、wrong role または parent identity の衝突を検出した場合、追加の署名を発生させず安全側に終了する。既存 result の再配送と新しい cosignature の生成を同一視しない。

## 13. Partial Transaction

Partial は、Symbol / NEM protocol、network または handoff 上で transaction が未完成、未集約または追加署名待ちである状態を表す chain-specific transaction context である。

- Partial を第三の共通 signing operation として扱わない。
- 初期 signer が全体 transaction を署名する場合は `TRANSACTION_SIGN` の target とする。
- 既存 parent に追加署名する場合は `COSIGNATURE_SIGN` の target とする。
- Partial であることだけで signing を許可しない。
- parent、outer、embedded / inner contents、existing signature、expected signer、期限および effect を全体確認できない場合は `inspection_failed` として署名しない。
- Node lookup、monitoring または external state search による parent 補完を共通前提にしない。

Partial の保存、transport、network lifecycle、取得 API、public scope および Chain-specific semantics は既存 Chain / SDK / Relay の OPEN と下位仕様に委譲する。

## 14. NEM Multisig

NEM multisig は Symbol Aggregate と同じ transaction model に変換しない。共通 Signing Protocol が提供するのは lifecycle、approval、Account binding、result correlation、fail-closed および blind signing prevention だけである。

NEM integration は次を正本として扱う。

- multisig wrapper と inner transaction の構造
- multisig account、initiator、inner signer、fee payer および cosigner の role semantics
- NEM の type、version、address、network、hash および signing bytes
- existing signature、duplicate、必要な parent context および result validation

NEM multisig の wrapper、inner transaction または必要な parent context を全体確認できない場合、署名しない。参照 hash だけで NEM multisig cosignature を生成してはならない。具体的な type / version、serialization および wallet-core Binding は Chain Compatibility / wallet-core 下位契約へ委譲する。

## 15. Structured Message Signing

### 15.1 Message model

structured message signing は transaction signing と別の `MESSAGE_SIGN` operation として扱う。message model、field、型、required / optional、encoding、validation、JCS および `SignedData` は [interfaces.md §9.4](./interfaces.md) を正本とし、本書で別の message schema を定義しない。

Signer は適用される次の context を同一の message semantics として検証・表示・署名へ binding する。

- verified caller / Origin
- Account、Chain、Network
- fixed domain、purpose / operation
- message contents
- nonce、issuedAt、message expiry および request-level freshness
- domain separation と signing bytes の対応

request-level の `requestId` / `createdAt` / `expiresAt` による受け渡し replay protection と、signed message 自体の nonce、expiry、cross-domain、cross-purpose protection は別の層として両方検証する。

### 15.2 Message signing flow

1. request の operation が message signing であることを検証する。
2. message model の schema、domain、purpose、payload encoding、nonce、issuedAt、expiry、Origin、Account、Chain / Network および request context を検証する。
3. Signer が同じ structured message から confirmation model と signing bytes の生成対象を作成する。
4. 利用者が message contents と適用 context を確認し、明示承認と署名ごとの authentication を行う。
5. 署名直前に message、domain、purpose、nonce、expiry、caller、Account、Chain、Network および signing bytes の生成対象を再検証する。
6. wallet-core の既存 chain-specific / message signing contract へ渡し、返却 signature と signed message の対応を検証する。

message の表示内容と signing bytes を別の input から生成してはならない。raw bytes の羅列だけを表示して確認可能と扱わず、解釈・表示できない message format、payload または required context は署名しない。message signing failure を transaction signing success、raw signing success または別 message format の success へ fallback してはならない。

### 15.3 Message expiry field の扱い

Product / Core / `SignedData` は `expiresAt`、既存 RelayDataSigningRequest は `messageExpiresAt` を使用する。この field 名、両者の対応および wire adapter の authority は [interfaces.md OPEN-001](./interfaces.md) の未決事項であり、本書で alias、変換規則または優先順位を確定しない。

field の整合が確定するまで、実装は一方の field を暗黙に他方の別名として扱ってはならない。実装対象となる handoff contract が定める field と validation を使用し、対象 contract が確定していない組み合わせは `OPEN` として扱う。

## 16. Result、Failure および Error

### 16.1 Success result

`SUCCEEDED` は、wallet-core が何らかの bytes を返した状態ではない。Signer が少なくとも次の対応を検証済みであることを意味する。

- 元 requestId / correlation
- operation
- signer identity / expected signer
- Account、Chain、Network
- signature または signed payload
- transaction、Aggregate、parent / multisig または message identity
- target digest、transaction hash、aggregate hash または既存 Chain-specific equivalent

success result の具体的 field、signature encoding、hash および response wire shape は [interfaces.md §9.6](./interfaces.md)、[Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) および Chain-specific contract を使用する。

### 16.2 Error authority

本書は signing-specific の新しい error code、numeric code、error taxonomy または wire error を追加しない。

- logical failure category は [interfaces.md §10.1](./interfaces.md) の `invalid_request`、`unsupported`、`permission_denied`、`user_rejected`、`authentication_failed`、`expired`、`cancelled`、`duplicate_or_replay`、`inspection_failed`、`signing_failed`、`timeout`、`transport_failure` および `internal_failure` を使用する。
- SDK / Web Handoff の concrete `MosaicLynxSDKErrorCode` と mapping は [Web Transaction Handoff Specification §10](./web-transaction-handoff-spec.md) を正本とする。本書は Handoff 固有 code を再定義しない。
- Relay の `{ "error": "RELAY_REQUEST_REJECTED" }` は Relay HTTP の structural rejection であり、SDK 公開 error code または signing outcome と同一視しない。
- error message、details および cause は [interfaces.md §10.2](./interfaces.md) と Handoff §10 に従い、secret、raw payload、token、URL、stack trace、parser dump、Vault detail または wallet-core 内部情報を含めない。

### 16.3 Failure to state mapping

| 条件                                                                       | logical category                                               | terminal state                | signing result                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------- | ------------------------------ |
| schema、required field、形式、size、encoding または request context 不正   | `invalid_request`                                              | `FAILED`                      | 返さない                       |
| operation、Chain、Network、type、version、format または capability 非対応  | `unsupported`                                                  | `FAILED`                      | 返さない                       |
| Origin、session、permission、Account、Chain / Network または signer 不一致 | `permission_denied` または既存 mismatch category               | `FAILED` または `INVALIDATED` | 返さない                       |
| 利用者の明示拒否                                                           | `user_rejected`                                                | `REJECTED`                    | 返さない                       |
| 署名ごとの authentication 失敗                                             | `authentication_failed`                                        | `FAILED`                      | 返さない                       |
| request、message、transaction または parent expiry                         | `expired`                                                      | `EXPIRED`                     | 返さない                       |
| 利用者、dApp、Signer、platform または transport による取消し               | `cancelled`                                                    | `CANCELLED`                   | 返さない                       |
| duplicate、replay、late、stale または既使用 identity                       | `duplicate_or_replay`                                          | `FAILED` または `INVALIDATED` | 返さない                       |
| parse、semantic inspection、confirmation または displayability failure     | `inspection_failed`                                            | `FAILED`                      | 返さない                       |
| wallet-core / Signer の失敗が確定                                          | `signing_failed`                                               | `FAILED`                      | 返さない                       |
| wait、transport または lifecycle の期限到達で signing outcome が確定       | `timeout` または `transport_failure`                           | `FAILED`                      | outcome を成功と推測しない     |
| signing generation 自体の結果不明                                          | signing outcome の `RESULT_UNKNOWN`（error category ではない） | `RESULT_UNKNOWN`              | 成功・拒否・失敗として返さない |

`RESULT_UNKNOWN` は error category の代替ではなく signing outcome の不明である。`DELIVERY_UNKNOWN` は §19.3 の delivery disposition であり、`RESULT_UNKNOWN`、`REJECTED` または `FAILED` に自動変換しない。

## 17. Serialization と deterministic processing

### 17.1 共通 serialization

request、response、Account、Scope、Error、timestamp、identifier および common state の serialization は [interfaces.md §11](./interfaces.md) に従う。

- JSON object と camelCase field naming を使用する既存 contract を、snake_case、別名または position-dependent tuple へ変更しない。
- optional field の absent と null を同一視しない。nullable と明示されない field に null を送らない。
- boolean、string、array、object および integer を別 JSON 型へ coercion しない。
- binary、public key、signature、hash、payload の encoding は operation / Chain-specific contract に従う。未指定の encoding を本書で選択しない。

### 17.2 Canonical target

JCS が指定された structured message / handoff object は、schema、type、required field、unknown field、value constraint を検証してから [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785) で canonicalize する。digest、AEAD、signature または result binding の計算前に、承認対象と実署名対象の canonical representation が一致しなければならない。

transaction payload は Chain Compatibility Specification が定める Chain-specific canonical serialization と decoded input bytes を byte-for-byte 比較する。MosaicLynx が独自 parser、serializer、signing-byte slice、hash、address または signature implementation をこの protocol のために追加してはならない。

### 17.3 No hidden transformation

Signer は検証前に payload、message、Origin、public key または target を表示都合で変換してはならない。共通 specification が明示する canonicalization または encoding normalization 以外の変換を行った場合、元 input との binding を確認できないため署名しない。

## 18. Component Responsibilities

### 18.1 共通責任分界

| component         | 本書での責任                                                                                                                                                                                                  | 本書で担わない責任                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK               | request の生成・correlation、適用 context の搬送、Signer からの result の元 request への対応付け、transport-independent な failure の受け渡し                                                                 | 最終 caller verification、semantic inspection、confirmation、user approval、authentication、raw signing、秘密情報処理                       |
| Browser Extension | Browser observed caller / Origin、permission、Account、Chain / Network、target の最終検証、inspection、trusted UI、explicit approval、署名ごとの authentication、wallet-core orchestration、result validation | SDK / Provider の自己申告を authority とすること、暗黙の自動署名、別 target への approval 流用                                              |
| Mobile App        | handoff context、caller、permission、Account、Chain / Network、target の再検証、inspection、Mobile trusted UI、explicit approval、authentication、wallet-core orchestration、result validation                | Relay を信頼 anchor とすること、headless / notification / external invocation だけで署名すること、platform integration 未確定事項の暗黙決定 |
| Relay             | opaque envelope と必要な structural / transport metadata の受け渡し、lifecycle、expiry、generation、credential、request / session / result の対応および duplicate / stale state の transport validation       | plaintext の復号・意味解釈、transaction / message inspection、approval、署名、signature generation、announce、semantic success 判定         |
| wallet-core       | Wallet Store、key management、秘密情報処理、chain-specific key および raw byte signing の既存契約                                                                                                             | caller verification、permission、UI、user approval、authentication decision、semantic inspection、target の外部補完                         |

### 18.2 Local signing と remote handoff

Browser Extension の direct path と Mobile App の Relay handoff path は transport が異なるが、次の protocol semantics を共有する。

- Signer が最終 authority である。
- untrusted input を検証してから inspection / approval へ進む。
- request、permission、Account、Chain、Network、target、approval、authentication、署名結果を相互に binding する。
- Relay delivery success、Provider response または connection permission を署名成功・approval・authentication の代替にしない。
- 同じ target の retry と、既存 result の delivery retry を分離する。

Browser の sender / tab / frame / document、Mobile の Deep Link / App Link / OS lifecycle、Relay endpoint / storage、SDK public API はそれぞれの specification に委譲する。

## 19. Retry、Cancellation、Delivery Disposition

### 19.1 Retry / resubmission

- user rejection、permission mismatch、validation failure、inspection failure、authentication failure、duplicate / replay、expiry、context change または `RESULT_UNKNOWN` の後に、同じ request / target / Authorization を自動 retry してはならない。
- retry が下位 contract で許可される場合も、新しい requestId、必要な新しい session / generation context、fresh envelope、fresh expiry、再検証、新しい explicit approval および署名ごとの authentication を伴う新しい request とする。
- `RESULT_UNKNOWN` の後に、同じ target を署名していないと推測して自動再署名してはならない。
- Relay / response delivery retry は、署名済み result が確定している場合の resend / redelivery / retrieval / lookup だけを候補とし、新しい signing operation とはしない。
- `SUCCEEDED` から `SIGNING` に戻る retry、または既存 result の配送失敗を理由に新しい signature を生成する retry を禁止する。

具体的な retry interval、回数、storage、lookup API、transport fallback および user-selected alternative path は `SDK-OPEN-003`、`RR-OPEN-002` および platform / handoff 下位仕様へ委譲する。

### 19.2 Cancellation

cancel は signing request に対する処理を終了させる操作であり、approval、authentication または signing success を意味しない。

- `RECEIVED` から `AUTHORIZED` までの cancel は、署名を開始せず `CANCELLED` とする。
- `SIGNING` 中の cancel で wallet-core の結果が確定しない場合は `RESULT_UNKNOWN` とする。成否が確定し署名が生成されていない場合だけ `CANCELLED` とする。
- `SUCCEEDED` 後の response cancel は既存の signing result を取り消したことを意味しない。delivery disposition は下位 handoff contract に従い、再署名しない。
- cancel 済み request を reopen、再認証または再署名してはならない。

### 19.3 Delivery disposition

署名 lifecycle と delivery disposition は別に管理する。確定済み result の delivery disposition は次の概念 set を使用する。

```text
PENDING → DELIVERED
PENDING → DELIVERY_UNKNOWN
```

`SUCCEEDED + DELIVERY_UNKNOWN` は、signature が確定しているが response delivery の完了を確認できない状態である。この状態から `SIGNING` に戻らず、同じ target を再署名せず、新しい signature を生成しない。候補は既存 result の resend / redelivery / retrieval / lookup のみである。

`RESULT_UNKNOWN` は trusted Signer が signing generation 自体の成否を確定できない場合だけが authority となる。`DELIVERY_UNKNOWN` は trusted Signer が保持する valid signed result の delivery disposition を確定できない場合だけが authority となる。SDK、Provider、Relay および transport は、timeout、outage、response absence、disconnect、recipient offline、reconnect failure、page / SDK / Relay lifecycle loss または delivery failure から両 disposition を生成・推測・確定してはならない。response delivery failure を `RESULT_UNKNOWN`、`FAILED`、user rejection または相互の別 disposition として推測変換してはならない。

Signer-originated disposition は、SDK、Provider および Relay が request correlation とともに意味不変に pass-through する。これらを Handoff §10 の public error code、`INTERNAL_ERROR` または transport failure へ縮退させてはならない。具体的な concrete response representation は [Web Transaction Handoff Specification §7.2](./web-transaction-handoff-spec.md) を正本とする。

## 20. Security Invariants

本章は [共通 Security Design §17](../design/security-design.md) の signing protocol への直接適用だけを定める。security design の全記載を再定義しない。

1. Signer は untrusted request、SDK、Provider、dApp、Relay、Node または外部 API の自己申告だけを署名 authority としない。
2. Origin / caller、permission、session、Account、Chain、Network、operation、capability、target、freshness および request correlation を適用範囲に応じて binding する。
3. requester supplied summary、外部 description、hash-only parent または Node lookup を confirmation / inspection の代替にしない。
4. 利用者が確認できない、Signer が全 security-relevant field を解析・表示できない、または target と summary が一致しない場合は署名しない。
5. explicit approval と署名ごとの authentication を要求し、connection permission、UNLOCKED、session、過去の approval / authentication または Relay delivery success で代替しない。
6. approval 後、署名直前および result 受領後に target、context、signer、Account、Chain / Network、request correlation を再検証する。
7. duplicate、replay、late、stale、expired、cancelled、revoked、generation changed または context-lost request を署名しない。
8. terminal state の request、old Authorization、old session、old ciphertext または old target を再利用しない。
9. `RESULT_UNKNOWN` の後に自動再署名せず、`DELIVERY_UNKNOWN` の後に再署名せず既存 result の配送処理だけを許可する。
10. private key、Mnemonic、Profile password、decrypted Wallet Store、session secret、transport credential、raw signing secret または不要な raw payload を request、response、Error、log、diagnostics、Relay、SDK、Browser page または Mobile external channel に露出しない。
11. Relay は opaque / untrusted transport のままとし、署名判断、inspection、approval、署名および announce を担わない。
12. unknown、unsupported、malformed または security-relevant field を解釈できない target を warning-only または fallback で許可しない。

## 21. Compatibility と下位仕様への委譲

### 21.1 互換性

共通 version、capability、unknown field、unknown enum、optional field、additive / breaking change の規則は [interfaces.md §7、§14](./interfaces.md) を使用する。

- protocol、operation、Chain、Network、format、type、version または capability を解釈できない場合は `unsupported` として fail-closed にする。
- compatibility を理由に explicit approval、Origin binding、Account / Chain / Network 分離、request correlation、secret isolation または fail-closed を弱めない。
- unknown field を既存 field の alias として扱わない。受信 schema が安全な extension field を明示的に許可していない場合は拒否する。
- old version、unknown capability または incompatible provider を別 operation、raw signing、別 message format または別 transport の成功へ downgrade しない。
- version literal と capability set の具体的 negotiation contract が未確定の範囲は、共通仕様の OPEN を解消するまで独自追加しない。

### 21.2 委譲事項

| 領域              | 本書で固定するもの                                                                                       | 下位仕様へ委譲するもの                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| SDK / Provider    | request / result correlation、Signer authority、failure semantics、安全側 retry                          | 公開 API、transport selection、user activation、具体 error mapping、公開 operation scope |
| Browser Extension | observed caller の最終検証、approval / authentication / target binding、lifecycle loss の安全側          | Chrome message、Provider、tab / frame / document、Service Worker、UI、storage            |
| Mobile App        | handoff context の再検証、foreground trusted UI、approval / authentication、process loss の安全側        | Deep Link / App Link、OS auth、background policy、Binding、Mobile UI、recovery           |
| Relay             | opaque delivery、structural validation、generation、expiry、duplicate / stale state、secret non-exposure | HTTP、Redis、E2E crypto、credential、endpoint、storage、retention、retry interval        |
| Chain integration | 全 target の parse / validation / inspection、canonical consistency、chain-specific result validation    | Symbol / NEM schema、type / version、address、hash、signing bytes、fixture、実装方式     |
| wallet-core       | approved raw target の既存契約への signing、secret boundary                                              | key derivation、Wallet Store、cryptography、Binding、memory lifecycle、内部 API          |

## 22. Conformance / Acceptance Criteria

Signing Protocol の実装は、少なくとも次を検証可能でなければならない。

- request を `RECEIVED` で受け、共通 validation、permission、Account、Chain / Network、operation、capability および target validation が完了するまで signing しない。
- `RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` の state set と terminal state を正しく扱い、未定義 state を追加しない。
- explicit approval、`every-signature` authentication、署名前再検証および approval / authentication の request-target binding を確認できる。
- ordinary transaction、Symbol Aggregate、NEM multisig、cosignature、Partial および structured message の意味を混同せず、全体確認できない target を拒否できる。
- Aggregate / multisig parent 全体を受け取らない hash-only cosignature、external summary および Node lookup 補完を拒否できる。
- structured message の domain、Origin、Chain / Network、purpose、nonce、expiry、payload encoding および signing bytes の関係を [interfaces.md §9.4](./interfaces.md) に従って検証できる。
- wallet-core result を元 request、target、signer、Account、Chain / Network および operation と独立に対応付け、検証できない result を成功として返さない。
- `REJECTED`、`FAILED`、`EXPIRED`、`CANCELLED`、`INVALIDATED`、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` を相互に誤変換せず、terminal state の request を再利用しない。
- concrete public error code は Handoff §10 または対象下位 contract の authority に従い、本書の独自 code を受け付けない。
- retry は新しい request / Authorization として扱い、既存 result の delivery retry と signing retry を分離する。
- private key、Mnemonic、password、decrypted secret、credential および不要な payload が component boundary を越えない。

## 23. Traceability

重要な契約のみを Requirement → Design → Specification の順に追跡する。

| Requirement                                              | Design                                                                                                                | 本仕様                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `CR-001`、`CR-003`、`CR-010`、`CR-012`                   | [signing-flow §7、§8、§22](../design/signing-flow.md)、[security-design §8](../design/security-design.md)             | §6、§8、§16 の request acceptance、approval、terminal state、fail-closed            |
| `CR-002`、`CR-004`、`CR-007-TX`                          | [signing-flow §9〜§10、§15](../design/signing-flow.md)、[interfaces design §6.5](../design/interfaces.md)             | §9〜§11 の target、transaction、Aggregate、confirmation、canonicality               |
| `CR-007-MSG`、`SDK-FR-007`                               | [signing-flow §14](../design/signing-flow.md)、[security-design §8.3](../design/security-design.md)                   | §15 の structured message operation、context、expiry、signing bytes binding         |
| `CR-005`、`CR-NFR-005`、`SDK-FR-012`                     | [signing-flow §24](../design/signing-flow.md)、[interfaces design §3.3](../design/interfaces.md)                      | §9.2、§10、§14 の Chain / Network / signer binding と chain-specific boundary       |
| `CR-006`、`SDK-FR-008`、`RR-002`                         | [signing-flow §20](../design/signing-flow.md)、[interfaces design §6.4](../design/interfaces.md)                      | §5.2、§16.1、§19.3 の result correlation、validation、delivery disposition          |
| `CR-011`、`RR-003`、`RR-006`、`RR-008`                   | [signing-flow §17〜§19、§23](../design/signing-flow.md)、[security-design §5、§10、§17](../design/security-design.md) | §6.3、§18、§19、§20 の component boundary、lifecycle loss、replay、secret isolation |
| `SDK-SEC-005`、`SDK-SEC-006`、`CR-NFR-010`、`CR-NFR-011` | [signing-flow §16、§21](../design/signing-flow.md)、[security-design §10](../design/security-design.md)               | §5.3、§7.3、§9.3、§19.1 の Authorization binding、duplicate、replay、fresh retry    |

## 24. OPEN Issues

本書は上流資料で未決の事項を独自に確定しない。以下は、確定可能な共通 semantics を維持したまま、該当する上流へ戻す事項である。

### OPEN-001（共通 Interface Specification）: Structured message expiry field

- **問題:** Product / Core / `SignedData` の `expiresAt` と RelayDataSigningRequest の `messageExpiresAt` が一致していない。
- **本書だけで決定できない理由:** field alias、変換、JCS object、signing bytes、handoff、response verification の複数契約を同時に変更するため。
- **影響範囲:** §15、message validation、expiry、SDK / Mobile / Relay interoperability。
- **戻すべき上流:** [interfaces.md OPEN-001](./interfaces.md)、[Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)、必要に応じて Product Specification と `CR-007-MSG`。

### OPEN-002（共通 Interface Specification）: Capability identifier / negotiation

- **問題:** capability の意味カテゴリは確定しているが、identifier namespace、set field、version、negotiation response および deprecation が未確定である。
- **影響範囲:** `VALIDATED`、unsupported 判定、operation scope、Mainnet gate および compatibility。
- **戻すべき上流:** [interfaces.md OPEN-002](./interfaces.md)、`SDK-OPEN-006`、`SDK-OPEN-007`、`RR-OPEN-001` および SDK / Relay compatibility design。
- **本書の扱い:** operation capability は承認時 binding に含めるが、独自 identifier や negotiation message は追加しない。

### OPEN-003（共通 Interface Specification）: Common version / compatibility matrix

- **問題:** SDK、Provider、Relay、structured message および Origin proof の known literal はあるが、全境界共通の version field、backward compatibility period、deprecation および migration が未確定である。
- **影響範囲:** request acceptance、unsupported、retry、旧 client との相互運用。
- **戻すべき上流:** [interfaces.md OPEN-003](./interfaces.md)、`SDK-OPEN-006`、`MR-OPEN-001` および Relay / release design。
- **本書の扱い:** known literal 以外の共通 version field、comparison rule または downgrade を追加しない。

### OPEN-004（共通 Interface Specification）: Permission expiry / revocation identifier

- **問題:** 現行 PermissionGrant は revision による変更を表現するが、独立 permission expiry、permissionId、revokedAt および cross-device synchronization は未定義である。
- **影響範囲:** §5.3、§7.2、§6.3 の Authorization invalidation、Mobile / Browser synchronization。
- **戻すべき上流:** [interfaces.md OPEN-004](./interfaces.md)、共通 permission design、Profile / Account Specification。
- **本書の扱い:** request expiry、session expiry、permission の存在を同一視せず、独自の permission identifier / expiry field を追加しない。

### OPEN-005（公開 Aggregate / multisig / cosignature scope）

- **問題:** parent 全体確認と安全な cosignature semantics は確定しているが、SDK / platform が公開する operation、exact format、result field、supported scope は未確定である。
- **影響範囲:** §2、§10〜§14、capability、Chain Adapter、fixture および handoff。
- **戻すべき上流:** `SDK-OPEN-002`、[Chain Compatibility Specification](./chain-compatibility-spec.md)、signing-flow の下位仕様、platform / SDK specification。
- **本書の扱い:** Aggregate / Partial / multisig を既存 logical operation の context として扱うが、公開 operation、transaction construction または新 capability を追加しない。

### OPEN-006（Transport / lifecycle failure policy）

- **問題:** 共通 protocol は expiry、cancel、lifecycle loss、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` および fresh retry の安全下限を定めるが、transport ごとの timeout 値、retry 回数、既存 result の lookup / resend、pending 保持および recovery が未確定である。
- **影響範囲:** §6.3、§19、SDK / Relay / Mobile / Browser の外部 failure contract。
- **戻すべき上流:** `SDK-OPEN-003`、`RR-OPEN-002`、`MR-OPEN-005`、Web Transaction Handoff Specification および platform lifecycle specification。
- **本書の扱い:** 署名 retry と delivery retry を分離するが、具体的な transport policy、endpoint または recovery API を追加しない。

### OPEN-007（Wallet Core Binding）

- **問題:** wallet-core の approved raw target、result unknown、warning / binding failure および秘密 byte lifecycle を各 host へ結び付ける具体的な Binding が未確定である。
- **影響範囲:** `SIGNING`、`RESULT_UNKNOWN`、§16.3、§18 の wallet-core boundary。
- **戻すべき上流:** `CR-OPEN-001`、`CR-OPEN-002`、wallet-core binding decision および platform integration design。
- **本書の扱い:** wallet-core の cryptography、KDF、Store format、内部 API または raw signing algorithm を再定義しない。error / warning / binding failure は success とせず安全側に扱う。

上記 OPEN を理由に、blind signing、approval / authentication の省略、Relay の signing authority 化、古い Authorization の再利用、同一 target の自動再署名または秘密情報の外部露出を許可してはならない。
