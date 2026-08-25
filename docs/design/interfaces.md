# MosaicLynx 共通データモデル・インターフェース基本設計

## 1. 目的

本書は、MosaicLynx を構成する SDK、Browser Extension、Mobile App、Relay、chain-specific integration および `symbol-nem-wallet-core`（以下 `wallet-core`）の間で共有する境界言語を定義する。各境界で何を受け取り、何を返し、どの主体が検証・判断するかを、transport や実装型から独立した概念モデルとして整理する。

本書の対象は、署名要求、署名結果、Account、Chain / Network、署名前確認の概要および境界エラーである。Browser Extension と Mobile App は共通の Signer として扱うが、現在のワークスペースに Mobile App の実装は存在しない。Mobile に関する記述は、既存要件およびアーキテクチャで定義された責任境界を示すものであり、実装済みであることを示さない。

## 2. 適用範囲と位置づけ

本書は [アーキテクチャ設計](./architecture.md) を共通データモデルとインターフェース境界の観点から補足する基本設計書である。[セキュリティ設計](./security-design.md) が定める秘密情報、trust boundary、承認および fail-closed の原則を前提とし、署名の処理順や状態遷移は [署名フロー基本設計](./signing-flow.md) に委譲する。

SDK と Web App、Browser Extension、Mobile App、Relay の受け渡し契約は [SDK 要件](../requirements/sdk.md)、[Browser Extension 要件](../requirements/browser-extension.md)、[Mobile App 要件](../requirements/mobile-app.md)、[Relay 要件](../requirements/relay.md) および [Web Transaction Handoff 仕様](../specifications/web-transaction-handoff-spec.md) と整合させる。Symbol / NEM 固有の解釈は [Chain Compatibility Specification](../specifications/chain-compatibility-spec.md) に、Profile / Account の詳細は [Profile / Account 仕様](../specifications/profile-account-spec.md) に従う。

本書でいう「インターフェース」は、データの意味、責任および検証の境界を指す。特定の通信方式、公開 API、DTO または画面を意味しない。

## 3. 設計原則

### 3.1 Transport-independent

共通データモデルは、`window.postMessage`、WebExtension messaging、HTTP、WebSocket、Deep Link、Relay transport などの個別 transport を前提にしない。各 adapter は transport の入力を共通の概念モデルへ変換し、transport 固有の metadata や失敗を共通の意味へ対応付ける。ただし、変換によって request の意味、署名対象または安全条件を変更してはならない。

### 3.2 Platform-independent

共通モデルは Browser Extension、Mobile、SDK の特定実装、OS API、UI toolkit または storage API に依存しない。Extension の browser context や Mobile の handoff context のような platform 固有情報は、共通の `caller context` または `signing context` へ境界情報として渡すが、具体的な取得方式は各 platform の責任とする。

### 3.3 Chain と Network の分離

`Chain` は Symbol または NEM のような対象チェーンを示し、`Network` はそのチェーン上の Mainnet / Testnet などのネットワーク文脈を示す。両者を一つの `networkId` だけで表現することを前提にしない。要求、Account、Profile、署名対象および結果は、適用される Chain と Network の組み合わせを保ったまま扱う。

具体的な enum、数値 ID、network constant、address 規則および transaction schema は本書で定めない。Symbol と NEM の導出、署名 byte 列、address、transaction の意味を共通規則へ暗黙に変換してはならない。

### 3.4 Secret isolation

秘密鍵、Mnemonic、seed、Profile password、復号済み Wallet Store secret および署名用秘密情報は、Signer と `wallet-core` の信頼境界の外へ出さない。特に `Account`、`SigningRequest`、`SigningResponse`、`TransactionSummary` および `Error` は秘密情報を含まない公開・境界モデルとする。

`wallet-core` は秘密情報の処理、Wallet Store、chain-specific key および raw byte signing の正本である。MosaicLynx Application は要求元、表示、承認、Account の選択および orchestration を担い、wallet-core 内部の秘密処理を再実装しない。

### 3.5 Fail-closed

request、caller、permission、Chain、Network、Account、transaction type、署名方式、期限、完全性または署名結果を確認できない場合、推測して処理しない。未知の version、operation、format、transaction type、message format、network または signing context は、対応可能であることを確認できない限り安全側に終了する。Relay の配送成功や UI の表示成功だけを署名成功とみなさない。

### 3.6 Derived locally

署名判断に必要な transaction の意味、Account の公開 identity、Chain / Network の整合性および `TransactionSummary` は、可能な限り Signer が検証済みの target から導出する。外部 requester が提供した表示文言、名称、icon、summary または metadata を、そのまま署名判断の根拠にしない。

### 3.7 Versionable

request、response および protocol concept は、将来の互換性確認と capability negotiation ができる概念的な version context を持つ。具体的な version field の型、番号体系、互換性規則および wire 表現は下位仕様へ委譲する。受信側が要求された意味を解釈できない version は、未知 field の推測や別 operation への fallback で処理しない。

## 4. コンポーネント境界

基本的な経路は次のとおりである。

```text
Web App / dApp
      │ 公開 SDK / Bridge
      ▼
Signer（Browser Extension または Mobile App）
      │ 承認済み target のみ
      ▼
wallet-core
```

Mobile 経路では、Relay は Mobile Signer の前段にある opaque transport である。

```text
Web App / SDK
      │ request / response の E2E handoff
      ▼
Relay ───────────────► Mobile Signer ─────► wallet-core
  opaque delivery       検証・表示・承認         秘密処理・署名
```

### 4.1 境界ごとの責任

| 境界                            | 主な producer / consumer                                                   | 境界で受け渡す概念                                                                                                  | 主な validator / trusted authority                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Web App ↔ SDK                   | Web App が SDK を呼び、SDK が MosaicLynx へ要求する                        | capability、公開 Account、SigningRequest、SigningResponse、Error                                                    | SDK は入力・correlation・transport 差異を扱う。最終的な署名判断と semantic validation は Signer                           |
| SDK ↔ Signer                    | SDK / Bridge が request を生成・配送し、Signer が消費して response を返す  | SigningRequest / SigningResponse / Error                                                                            | Signer が caller、permission、target、Chain / Network、Account、承認および結果を検証する trusted authority                |
| Web App ↔ Browser Extension     | Web App は外部 requester、Extension は browser context を観測する Signer   | SDK request、browser caller context、公開結果                                                                       | Extension の privileged layer が browser 観測情報と request の対応を最終確認する。Web App の自己申告は authority ではない |
| Relay ↔ Mobile                  | Relay は opaque envelope を搬送し、Mobile が request / response を検証する | E2E handoff、session / generation の transport context、opaque request / response                                   | Relay は構造・配送だけを検証する。Mobile Signer が完全性、意味、表示、承認および署名の authority                          |
| Browser Extension ↔ wallet-core | Extension が承認済み signing target を渡し、wallet-core が署名結果を返す   | approved raw target、選択された公開 key / key reference、必要な Chain / Network context、signature / result / error | Extension が利用者の意図と target の一致を authority とし、wallet-core が秘密処理・key identity・raw signing の authority |
| Mobile ↔ wallet-core            | Mobile App が承認済み target を渡し、wallet-core が署名結果を返す          | Browser Extension と同じ共通概念。具体的な Binding / OS integration は別設計                                        | Mobile App が caller・表示・承認の authority、wallet-core が秘密処理・raw signing の authority                            |

各境界の producer は、受け渡しに必要な情報を提供する責任を持つが、受信側の検証を省略させる権限を持たない。`trusted authority` は全データを無条件に信頼するという意味ではなく、その境界で特定の判断を最終的に担う主体を示す。

ここでいう Network context の producer は、Chain / Network を要求へ申告または transport する SDK、Web App、dApp または handoff client と、payload・Profile・Account と照合して Signer-local な trusted context を導出する Signer / chain-specific integration に限る。Relay と blockchain node は、Network metadata の untrusted な搬送元・観測元または候補提供元にはなり得るが、Network model を生成・確定・上書きする authority ではない。

### 4.2 コンポーネント別の受け取りと返却

- **SDK** は Web App の公開操作を論理的な request へ変換し、Signer から受け取った response を元 request に対応付けて返す。秘密情報、最終承認、transaction の意味解釈および raw signing は扱わない。
- **Browser Extension** は SDK / Provider と browser が観測した caller context を受け取り、privileged layer で検証した後、確認領域と wallet-core adapter へ渡す。返すのは検証済みの成功結果または分類された失敗であり、秘密情報ではない。
- **Mobile App** は Relay または別の外部 handoff から opaque な要求を受け取り、App 自身の context、表示および認証で再検証する。現在のワークスペースには実装がなく、OS API、受信方式および host Binding は下位設計に委譲する。
- **Relay** は E2E で保護された envelope と最小限の transport metadata を受け取り、期限・サイズ・session / generation・重複など transport 上の条件を検証して配送する。Network を決定・上書きせず、Signer の Network validation を代替しない。署名判断、意味解釈、承認または署名結果の生成を返す主体ではない。
- **wallet-core** は host から渡された契約上の入力を受け取り、Store・key・秘密情報・raw signing の処理結果または error / diagnostics を返す。利用者の caller、UI、permission または署名意図を判断しない。

Relay や blockchain node から得られる Network metadata は、接続・観測または補助情報であり、Signer がそのまま trusted context として採用するものではない。Signer / chain-specific integration が payload、Account、Profile および対象 Chain と照合し、必要な Network context を自ら検証する。node discovery、node selection、chain verification または network fingerprinting の方式は本書で定めない。

## 5. Trust Boundary

### 5.1 Trust の扱い

外部入力は、暗号化されていても、構造検証済みでも、意味上の信頼を得たとは扱わない。境界を越えるたびに、受信側が自分の責任範囲を検証する。

| データまたは主体                                      | Signer から見た扱い                                                       | 必要な扱い                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Web App、dApp、SDK、Provider、Content Script          | untrusted                                                                 | request、caller binding、permission、期限、target および完全性を検証する                  |
| Browser が観測した sender / Origin / document context | browser が観測した事実として利用可能。ただし payload の正しさを証明しない | privileged layer が request と対応付け、tab / frame / document lifecycle を含めて検証する |
| Relay、Relay metadata、Node、外部 API                 | untrusted / 補助情報                                                      | Relay は構造・配送だけを担当し、Signer が E2E integrity、意味、鮮度および結果を再検証する |
| Mobile の Deep Link / App Link / OS handoff metadata  | untrusted                                                                 | Mobile App が caller、session、完全性、期限および request の対応を検証する                |
| `TransactionSummary`                                  | signer が target から導出した場合のみ確認用に利用                         | 外部 summary を署名可否の根拠にせず、payload との不一致は fail-closed                     |
| Signer の確認 UI と承認記録                           | 利用者の署名判断に関する trusted authority                                | 承認対象、Account、Chain / Network、caller、context および target に binding する         |
| wallet-core の署名結果                                | 秘密処理・暗号結果の trusted authority                                    | host が target、Account、Chain / Network、operation および request correlation を検証する |

`wallet-core` の Binding は、API / data ownership の境界であり、WASM、JavaScript、Native host または OS から秘密情報が自動的に隔離されることを意味しない。host 側の一時的な秘密情報の lifecycle は、wallet-core 外部契約と各 platform 設計の責任である。

## 6. 共通データモデル

以下は論理モデルであり、JSON property 名、具体的な型、encoding または wire field の確定ではない。モデルに含める情報は、対象 operation に適用される範囲で扱う。

### 6.1 Network

`Network` は、対象チェーン上のネットワーク文脈を表す。Network は単独で Chain を意味せず、常に `Chain` と組み合わせて扱う。

概念上、次の情報を持つ。

- 対応する Chain（Symbol または NEM）。
- Mainnet / Testnet などの network role。
- 対象を一意に識別し、payload、Account、Profile と照合するための network identity。
- その Network に対応する address、transaction および署名規則を適用するための context。

Network context を要求へ申告または transport する producer は SDK、Web App、dApp または handoff client とする。Relay と blockchain node は Network metadata の untrusted な搬送元・観測元または候補提供元にはなり得るが、Network model を生成・確定・上書きする producer / authority ではない。Signer / chain-specific integration が payload、選択 Account、Profile および対象 Chain と照合して Signer-local な Network context を確定する。未確定、wrong network または Chain と Network の不一致は署名へ進めない。

### 6.2 Account

`Account` は、Signer が扱う公開された signing identity を表す。Application の Profile / permission 上の選択対象と、wallet-core の Software Key との対応を表し得るが、両者の内部 schema を共通モデルへ取り込まない。

概念上、次の公開情報を持つ。

- Chain と Network。
- address および public key。
- 利用者が識別するための display information。

display information は署名判断に必要な事実と区別する。address、public key、Chain、Network および選択状態は Signer が検証・導出した値を使う。dApp へ公開する Account は利用者が許可した公開情報に限る。

#### 公開 identity と内部 reference

`Account` は、コンポーネント境界を安全に通過させ得る **Public account identity** を表す。Chain、Network、address、public key、利用者向けの display information など、公開して問題のない identity を含む。一方、Signer / Application が Profile、permission または wallet-core の key slot を内部で解決するための **Internal account reference** は、`Account` の公開 identity と同一視しない内部 context である。

Internal account reference について、次を原則とする。

- 秘密鍵そのものではない。
- 秘密鍵、Mnemonic、seed または decrypted secret を導出可能な情報ではない。
- 外部 Web App、dApp または requester が任意指定して直接鍵を選択できる capability ではない。
- Signer の trust boundary 内で、現在の Profile、permission、Account identity および署名 context と照合して解決・検証する。
- 外部へ公開する必要がない場合は、SDK の公開結果、Relay、dApp または Web App へ渡さない。

内部 reference の形式、永続化方法および key slot との対応は下位設計へ委譲する。外部 requester が提示した reference は、Signer が補助情報として検証できる場合を除き、Account 選択や認可の authority とは扱わない。

`Account` に次を含めない。

- private key
- mnemonic
- seed
- Profile password
- decrypted Wallet Store secret
- それらを復元できる秘密情報または秘密情報の代替値

Account は、選択されたことだけで署名権限を意味しない。署名ごとに caller、permission、Chain、Network、target および明示的承認と対応付ける。

### 6.3 SigningRequest

`SigningRequest` は、一つの署名判断に必要な request context、caller、session、operation、Account、Chain、Network および signing target を結び付けた論理単位である。transaction signing と message signing を同じ名前で曖昧に扱わず、`request type` または operation により署名の意味と検証経路を区別する。

#### 含める概念

- **request identity / correlation**: request と response を対応付け、重複・差し替え・別 request への流用を検出する識別情報。
- **version**: request model / protocol concept の解釈に必要な version context。
- **request type / operation**: transaction、message、または下位仕様で定義された署名 operation の意味。cosignature、aggregate、multisig の公開範囲は各 Chain / SDK 仕様に従い、未確定の operation をここで追加しない。
- **Chain / Network**: 署名対象と Profile / Account が属する対象。Chain と Network は別々に確認する。
- **signing target / transaction payload**: 実際に署名する transaction、aggregate、cosignature target、message または chain-specific target。表示用 summary ではなく、署名の入力となる対象そのものを指す。
- **origin / requester / caller context**: Web では browser が観測した Origin・document 等、Mobile では検証済み handoff context 等。外部が記載した名称だけで verified caller とはしない。
- **expiration / freshness**: request の作成時点、期限、nonce、generation 等、鮮度と replay 防止に必要な概念。具体的な表現や期間は下位仕様へ委譲する。
- **account selection information**: 利用者が選択または許可した Public account identity、期待される signer、選択要求または Signer-local な内部 reference。内部 reference は Signer / Application 内部の解決用 context であり、外部 SigningRequest、SDK 公開 API、Relay または dApp 向け response の公開 identity と同一視しない。requester が任意の Account へ切り替える権限を持つことを意味しない。
- **signing context**: session、permission scope、protocol / capability、transaction context、message の purpose / domain / nonce 等、対象 operation の署名判断に必要な文脈。

#### 生成・消費・検証

SDK、Web App または handoff client は request の producer である。Relay は request の意味上の producer ではなく、opaque transport である。Browser Extension または Mobile Signer は request の consumer であり、同時に caller、permission、Chain / Network、Account、target、freshness および capability の validator である。署名可否についての trusted authority は Signer にある。

Signer は request に含まれる自己申告値を検証前に信頼せず、必要な context と `TransactionSummary` を target から導出する。request が不完全、期限切れ、重複、改ざん、unsupported、wrong network、wrong signer または解析不能である場合は署名しない。

### 6.4 SigningResponse

`SigningResponse` は SigningRequest に対する処理結果であり、署名が生成されたか、利用者が拒否したか、処理が失敗したか、または処理結果自体を確定できないかを区別する。request / response の配送成否は、署名生成の成否とは別の transport outcome として扱う。

#### 結果の状態

- **success**: Signer が承認済み target を wallet-core で処理し、返された署名結果を target、Account、Chain、Network、operation および request correlation と対応付けて検証できた状態。
- **user rejected**: 利用者が明示的に拒否した状態。署名成功ではなく、署名結果を伴わない終端結果とする。
- **failed**: validation、unsupported、security、authentication、wallet-core、network または内部処理などにより処理失敗が確定した状態。単に配送状態や処理結果を確定できない場合を `failed` に畳み込まない。
- **`RESULT_UNKNOWN`（result unknown）**: Signer が処理した可能性、署名した可能性または利用者が判断した可能性はあるが、success、user rejected、failed のいずれかを安全に確定できない状態。成功として返さず、同一 request の自動再署名を行わない。

`DELIVERY_UNKNOWN` は SigningResponse の result status ではなく、request または response の delivery disposition である。送信後の接続断、peer からの配送確認不能または response 配送完了の確認不能など、配送状態を確定できない場合を示す。署名生成が確定済みなら、概念上は `success` と `DELIVERY_UNKNOWN` を併記できるが、同じ target の再署名を開始せず、既存 result の再送・照会だけを候補とする。request の delivery が不明な場合も、未送信・失敗と推測して同じ request を自動再送しない。

`RESULT_UNKNOWN` は処理結果そのものの不明、`DELIVERY_UNKNOWN` は配送状態の不明であり、処理失敗が確定した `failed` と同一視しない。これらの状態からの再送、再照会、idempotency および retry の具体的な契約は下位 protocol design へ委譲する。

#### 含める概念

- 元 request identity / correlation。
- operation、signer identity、Account、Chain、Network。
- success の場合に限る signature、signed transaction、cosignature または対象 operation に対応する result。
- transaction / aggregate / parent / multisig identity、message identity、target digest 等、元 target と結果を独立検証するための result metadata。
- user rejected または failed の場合の Error。詳細な秘密情報や不要な内部状態は含めない。

Signer は wallet-core の返却値をそのまま外へ転送せず、対象との対応を検証してから response を生成する。SDK は response を元 request へ相関付けて Web App へ返す。dApp は transport の成功だけを信頼せず、受け取った signature / signed payload を元 request と独立に検証する。具体的な署名表現、signed payload、hash および cosignature の形式は下位仕様へ委譲する。

### 6.5 TransactionSummary

`TransactionSummary` は、Signer の確認 UI 等で利用する、人間が署名対象を判断するための概要である。これは署名対象を表現する補助的な derived model であり、署名対象の真正性を証明するモデルではない。

対象に適用可能な範囲で、次の概念を含み得る。

- transaction type、version、Chain、Network。
- sender、expected signer、recipient。
- amount、mosaics / assets、fee。
- message、deadline、freshness。
- aggregate、embedded / inner transaction、parent、multisig context。
- cosignature requirement、既存 signature / cosignature。
- 権限・metadata・namespace・account state 等の変更。
- warnings、未検証の補助情報および signer が確認できない事項。

Signer は signing target を chain-specific に parse / validate し、確認に必要な情報を可能な限り target から導出して summary を生成する。Web App、SDK、Relay、Node または外部 API が提供した summary、表示文言、app 名、icon または説明だけを信頼して署名してはならない。外部 summary と実 payload が不一致の場合は、安全側に失敗する。必要な情報を解析・表示できない場合、warning の表示だけで bypass せず署名しない。

transaction type ごとの完全な表示項目、画面 layout、warning の文言および aggregate / multisig の表示規則は、本書の下位にある chain-specific / platform 仕様で定める。

### 6.6 Error

`Error` は、コンポーネント境界を越えて安全に失敗の意味を伝えるための概念モデルである。公開される分類は、再試行や利用者への案内を安全に判断できる粒度とし、秘密情報、復号データ、private key、Mnemonic、password、raw payload の不要な dump、内部 stack trace を含めない。

| 概念カテゴリ          | 意味                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| validation error      | request、context、payload、target、Account、Chain / Network または result の検証に失敗した               |
| protocol error        | version、envelope、correlation、session、generation または境界契約が解釈・検証できない                   |
| unsupported operation | operation、transaction type、message format、version、Chain / Network または capability が対象外         |
| user rejection        | 利用者が明示的に拒否した。署名結果を返さない                                                             |
| security rejection    | caller、permission、完全性、replay、duplicate、freshness、承認対象一致またはその他の安全条件を満たさない |
| signing error         | wallet-core または Signer の署名処理が成功しなかった。`USER_REJECTED` と同一視しない                     |
| network error         | node / network との補助的な通信または必要な外部処理に失敗した。検証省略の理由にはならない                |
| relay error           | Relay の受け渡し、認証、期限、状態または可用性に関する失敗。署名判断を Relay に移さない                  |
| internal error        | 安全に意味を確定できないその他の内部失敗。fail-closed とする                                             |

`USER_REJECTED` は利用者の意思による拒否であり、`SIGNING_FAILED` は処理失敗が確定した状態である。両者は利用者向け表示、dApp の処理、監査および再試行判断で区別できる概念とする。`RESULT_UNKNOWN` は処理結果の outcome、`DELIVERY_UNKNOWN` は request / response の transport outcome であり、いずれも `USER_REJECTED`、`SIGNING_FAILED` または `RELAY_ERROR` へ、原因を確認せず自動的に変換しない。Error は確定した失敗の分類を伝えるために使い、これらの不明状態を表すために無理に Error へ押し込まない。Error category、公開 code、番号体系、retryable の表現は下位仕様で決定する。

## 7. Interface Responsibilities

### 7.1 SDK ↔ Signer

SDK は Web App の操作を SigningRequest として組み立て、Signer が検証できる caller、session、permission、Chain / Network、Account、target および freshness の context を維持して渡す。Signer は SDK の自己申告を最終 authority とせず、受け取った request を検証し、Signer 管理の確認 UI で承認・拒否を取得し、wallet-core と連携して SigningResponse を返す。

SDK は transport の差異を隠蔽し得るが、Signer の承認、semantic inspection、署名ごとの認証、秘密情報処理または fail-closed を代替しない。SDK が受け取った response は correlation、status、signature / signed payload の対応を確認してから Web App へ返す。

### 7.2 Web App ↔ Browser Extension

Web App は外部 requester として SDK / Provider を通じて要求する。Web App が提示する Origin、app name、summary、Account、Network または署名方式は、Browser Extension にとって untrusted input である。

Browser Extension の privileged layer は、browser が観測した sender、Origin、tab / frame / document context と request を対応付け、接続許可、Account、Chain / Network、期限、target および operation を検証する。Content Script、Provider および page context は routing / bridge の境界であり、秘密情報を保持せず、caller の最終認証 authority ではない。

Extension は自ら管理する確認領域で、target から導出した summary を表示し、明示的な承認または拒否を取得する。返却された response は Web App が独立に検証すべきものであり、Extension から返ったことだけで署名の正当性を証明したとは扱わない。

### 7.3 Relay ↔ Mobile

SDK / handoff client は Relay を通じて Mobile に渡す request / response を E2E の envelope として扱う。Relay は envelope の構造、サイズ、期限、session / generation、認証および状態遷移など、意味を解釈しない transport 条件だけを検証し、必要な範囲で一時的に配送する。

Relay は署名要求の内容を独自判断で変更しない。transaction / message の意味を解釈せず、表示、利用者の承認・拒否、署名可否、署名、announce または node 選択を担わない。Relay から届いたデータは Mobile がすべて untrusted input として再検証する。

Mobile Signer は caller、handoff session、request integrity、期限、Account、Chain / Network、target、summary、permission および capability を検証し、App 自身の UI と認証で承認を取得する。Relay の配送成功、metadata または状態復旧だけで承認済み・署名済みとみなしてはならない。具体的な E2E envelope、HTTP / Redis、Deep Link および generation の形式は [handoff 仕様](../specifications/web-transaction-handoff-spec.md) と Relay の下位設計へ委譲する。

### 7.4 Browser Extension ↔ wallet-core

Browser Extension は、利用者が承認した target と必要な選択 Account / key reference を、固定された wallet-core 外部契約に従って adapter へ渡す。署名前に確認した target と渡す raw target の一致、Chain / Network、signer identity、operation、permission および認証状態を Extension が再確認する。

wallet-core は Wallet Store、key identity、秘密情報の処理、chain-specific key および raw byte signing を担い、結果、error または diagnostics を返す。wallet-core に caller の信頼、利用者の UI 承認、dApp permission、transaction の利用者向け意味解釈を委譲しない。

Extension は wallet-core の result を target、Account、Chain / Network および request correlation に対応付けて検証し、検証不能な result は成功として返さない。Binding、FFI、WASM / Native、secret byte の一時 lifecycle、具体的な入力 DTO は wallet-core の外部契約と後続設計で決定する。

### 7.5 Mobile ↔ wallet-core

Mobile App と wallet-core の責任分担は、Browser Extension と同じ共通境界を持つ。Mobile App は外部要求の受信、Profile / Account の表示・選択、Chain / Network、確認 UI、利用者認証、承認対象の binding、OS integration および lifecycle を担う。wallet-core は秘密情報、Wallet Store、key identity および raw signing を担う。

OS の Keychain / Keystore / Secure Enclave / StrongBox 等の保護能力を wallet-core の責任と同一視しない。Mobile の process、background、再起動または OS 終了で context が失われた場合、古い承認を無条件に復元して wallet-core を呼び出さない。具体的な Binding host integration、OS 保護および backup / migration は [Mobile App 要件](../requirements/mobile-app.md) と既存の未決事項に従う。

### 7.6 SDK ↔ MosaicLynx の共通 interface concept

SDK が MosaicLynx に対して要求する共通の概念接点は、次の範囲に限定する。

- 対応 capability と Chain / Network の確認。
- 接続、許可された公開 Account の取得、接続解除または許可撤回。
- transaction signing と message signing の SigningRequest 生成・受け渡し。
- SigningResponse の success、user rejected、failed、result unknown の区別、および request / response の delivery outcome。
- request の cancellation、expiration、duplicate、replay および transport / relay failure の安全な結果。

これらは Web App から観測できる共通の意味であり、各 operation の API 名、戻り値の wire format、transport 選択、transaction construction、announce、node access または UI を本書で確定するものではない。SDK adapter は platform 間で意味をそろえるが、platform 固有の caller 検証や Signer の最終判断を抽象化の中に隠して省略してはならない。

## 8. Validation Responsibilities

検証責任は、一つのコンポーネントにすべてを集中させるのではなく、各境界の意味に分ける。

| 検証対象                                                    | 主な責任主体                         | 検証の意味                                                                                                |
| ----------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| transport の外形、サイズ、期限、session / generation、重複  | Relay または各 adapter               | 配送可能性と構造の確認。署名可否は判断しない                                                              |
| browser caller context                                      | Browser Extension privileged layer   | browser が観測した Origin / sender / document と request の対応確認                                       |
| Mobile caller / handoff context                             | Mobile App                           | handoff metadata、session、完全性、期限および request source の確認                                       |
| request identity、version、operation、permission、freshness | Signer                               | 署名判断の request binding、未知・重複・期限切れの拒否                                                    |
| Chain / Network / Account                                   | Signer と chain-specific integration | payload、Profile、選択 Account、expected signer および address / public key の整合確認                    |
| signing target と TransactionSummary                        | Signer と chain-specific integration | target 全体の parse / validate、意味解釈、表示可能性および target からの summary 導出                     |
| 利用者承認・署名ごとの認証                                  | Signer の trusted UI / host          | 利用者の明示判断を対象 request と target に binding                                                       |
| Wallet Store、Software Key、秘密情報、raw signing           | wallet-core                          | Store / key / password / crypto / signing 契約の検証と処理                                                |
| wallet-core result と response                              | Signer                               | signature / signed payload と承認済み target、Account、Chain / Network、operation、correlation の対応確認 |
| 署名結果の利用                                              | dApp / Web App                       | response を元 request と独立に確認し、必要な announce 等を自身の責任で行う                                |

一つの検証結果を別の責任の代替にしない。たとえば Relay の envelope 検証は Signer の transaction inspection を代替せず、wallet-core の署名成功は利用者の承認を代替せず、SDK の caller string は Browser が観測した Origin を代替しない。

## 9. Security Considerations

詳細は [共通セキュリティ設計書](./security-design.md) に委譲する。本書における共通 interface の適用上、次を維持する。

- 秘密情報を request、response、Account、summary、Error、transport、URL、log、warning、diagnostic または外部 UI に含めない。
- Signer が target 全体を解析・検証・表示できない場合は署名しない。未知の transaction type、message format、Chain / Network、署名方式を警告だけで許可しない。
- 接続 permission、session、UNLOCKED 状態、Relay 配送成功または過去の認証を、署名ごとの承認・認証の代替にしない。
- `1 request = 1 confirmation = 1 authentication = 1 signing operation` の対応を維持し、別 request、別 Account、別 Chain / Network、別 operation または別 target に承認を流用しない。
- request や context の変化、lifecycle loss、replay、duplicate、結果不明を検出した場合は、古い Authorization を再利用せず安全側に終了する。
- `USER_REJECTED`、`SIGNING_FAILED`、`RESULT_UNKNOWN` および `DELIVERY_UNKNOWN` を成功または相互に別の状態へ変換しない。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の後に同一 request を自動再実行・再署名せず、自動 fallback で安全境界を迂回しない。具体的な再送・再照会は下位 protocol design へ委譲する。

## 10. Versioning / Extensibility

request、response および handoff concept は version context により、受信側が解釈可能な契約かを確認できるようにする。versioning の基本方針は次のとおりである。

- version の意味、対応可能な operation、Chain / Network、message format および capability を受信側が確認する。
- 必須の意味を解釈できない version、unknown operation、unknown format または incompatible capability は fail-closed とする。
- 追加情報を無視できるかどうかは、意味を変えず安全に無視できることを下位仕様で確認する。未知 field を理由なく意味解釈したり、別の field へ代替したりしない。
- 新しい version や operation の追加で、Chain / Network の区別、Secret isolation、summary と payload の一致、明示承認および result correlation を弱めない。
- version 差異や capability 不一致を、別の signing operation、raw signing または transport へ暗黙に fallback しない。

具体的な version field、番号体系、forward / backward compatibility、deprecation、capability negotiation および migration は [SDK 要件](../requirements/sdk.md)、handoff 仕様、chain-specific 仕様および各 platform の下位設計で決定する。

## 11. 下位設計への委譲

本書で定めた概念モデルを実装可能な契約へ落とす際、次を下位設計・仕様へ委譲する。

- JSON property、JSON Schema、TypeScript interface、Rust struct、DTO、CBOR schema。
- JSON / CBOR 等の encoding、binary の所有権、hex / Base64 の選択および byte 列の表現。
- SDK の具体的 API 名、Provider 契約、caller binding、transport 選択および error mapping。
- Browser Extension の message event、`window.postMessage`、Chrome API、Service Worker、Storage、具体的な UI。
- Mobile の Deep Link / Universal Link / App Link / Intent、OS API、secure storage、認証、lifecycle、画面および host Binding。
- Relay の HTTP endpoint、REST / WebSocket message、opaque envelope、E2E 暗号方式、TTL、Redis、認証、storage、rate limit および wire protocol。
- wallet-core の Rust / Binding API、FFI、WASM / Native、Wallet Store、秘密情報 lifecycle、cryptography、key derivation および signing bytes。
- Symbol / NEM の transaction type、version、schema、canonicalization、hash、signature byte 列、aggregate / multisig / cosignature の完全な解析範囲。
- transaction type ごとの完全な TransactionSummary、確認 UI、warning および表示順。
- Error code の完全な catalogue、番号体系、公開文言、retryability および transport status。

## 12. Non-goals

本書は次を決定しない。

- 完全な JSON Schema、JSON property の完全な定義、TypeScript interface、Rust struct または CBOR schema。
- JSON / CBOR の encoding 詳細、hex / Base64 の選択。
- HTTP endpoint、REST API、WebSocket message format、Relay wire protocol または Deep Link URI schema。
- Browser Extension の message event 名、`window.postMessage` の具体的形式。
- Error code の完全な一覧・番号体系。
- transaction type ごとの完全な解析仕様、完全な確認 UI 仕様。
- Plugin framework、generic message bus、RPC framework、transport protocol の新規導入。
- SDK API の詳細設計、UI 詳細設計、wallet-core 内部 API の再設計。

これらの対象外は、共通の責任境界、trust、validation および fail-closed の原則を省略できることを意味しない。

## 13. 既存の未決事項

本書は新しい未決事項を追加しない。次の既存の未決事項は、共通モデルの意味を変えずに下位工程で解決する。

- SDK の具体的な version policy、caller / Origin binding、transport 選択、transaction construction および aggregate / cosignature の公開範囲（[SDK 要件の未決事項](../requirements/sdk.md#15-未決事項)）。
- Mobile の受信方式、OS 保護と wallet-core Binding、process lifecycle、backup / migration（[Mobile App 要件の未決事項](../requirements/mobile-app.md#7-スマホアプリ固有の未決事項)）。
- Application と wallet-core の具体的統合方式、Binding、秘密 byte lifecycle、error mapping（[共通要件の未決事項](../requirements/requirements.md#9-共通の未決事項)）。
- Relay 障害時の外部から観測できる失敗境界と、結果不明後の既存結果の照会・再配送契約（[Relay 要件の未決事項](../requirements/relay.md#9-relay-固有の未決事項)）。
- Symbol / NEM の対応 transaction type / version、aggregate / multisig / cosignature、message format の公開範囲と表示受け入れ条件。

これらが未決であっても、秘密情報の分離、Signer による semantic validation、利用者の明示承認、summary と実 payload の一致、Relay の非署名責任および fail-closed の原則は変更しない。

## 14. 関連資料

- [Concept Sheet](../concept/concept-sheet.md)
- [共通要件](../requirements/requirements.md)
- [Browser Extension 要件](../requirements/browser-extension.md)
- [Mobile App 要件](../requirements/mobile-app.md)
- [Relay 要件](../requirements/relay.md)
- [SDK 要件](../requirements/sdk.md)
- [アーキテクチャ設計](./architecture.md)
- [共通セキュリティ設計書](./security-design.md)
- [署名フロー基本設計](./signing-flow.md)
- [Web Transaction Handoff 仕様](../specifications/web-transaction-handoff-spec.md)
- [Profile / Account 仕様](../specifications/profile-account-spec.md)
- [Chain Compatibility Specification](../specifications/chain-compatibility-spec.md)
- [wallet-core README](../../_snwc/README.md)
- [wallet-core 仕様](../../_snwc/docs/specifications/specification.md)
- [wallet-core Binding 実装方針](../../_snwc/docs/decisions/binding-implementation.md)
