# MosaicLynx Mobile App 基本設計レビュー 002

## 1. Review Target

- 対象: [`docs/design/mobile-app.md`](../../design/mobile-app.md)
- Review ID: `mobile-app-review-002`
- 確認日: 2026-08-28
- レビュー種別: `design-review` Skill による Mobile App 基本設計のフル再レビュー
- 主目的: 過去の READY 判定を継承せず、現行 Mobile App Design 全体を独立評価すること。過去レビューの finding は再発確認と ID 管理にだけ使用した。
- 過去レビュー: [`mobile-app-review-001.md`](./mobile-app-review-001.md)。正式な finding ID は発行されておらず、過去判定は今回の Review Gate に継承していない。
- 変更範囲: 本レビュー成果物のみ。対象設計、要件、仕様、ADR、共通 Design、wallet-core、実装および既存 review は変更していない。
- レビュー範囲: Mobile trust boundary、verified handoff context、Relay、共通4条件、Profile / Account、request ingress、semantic inspection、trusted UI、`MESSAGE_SIGN`、pre-sign revalidation、lifecycle、sensitive UI、OS protection、concurrent request、result binding、unknown result、fallback、error、wallet-core、secret、backup / migration、Chain / Network、Aggregate / cosignature、Mainnet gate、traceability、OPEN および Design フェーズ境界。
- Design フェーズ境界: exact OS API、Deep Link schema、notification API、secure storage API、DTO / JSON / wire schema、exact state enum、timeout、retry count、storage schema、cryptographic parameter、implementation class および exact UI layout の不足は finding としていない。
- 未確認範囲: Mobile App の実装・runtime・実機 OS capability・E2E は、現在の workspace に実装がないため確認していない。`docs/specifications/mobile-app.md` は workspace に存在しないため使用できず、Mobile 要件、共通仕様、handoff 仕様および release 資料で代替的に整合確認した。

## 2. Execution Audit

最新の `design-review` Skill、共通 review playbook、reviewers、review gates、output format、[`AGENTS.md`](../../../AGENTS.md) および [`.agents/project-context.md`](../../../.agents/project-context.md) を確認した。サブエージェントは使用せず、Chair が Reviewer A〜D に相当する4つの独立した自己レビュー・パスを実施した。

| 観点                                   | 独立確認                                                                                                                                                              | 判定                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: structure / responsibility | Mobile host、外部 app / Web / SDK、handoff、Relay、trusted UI、chain integration、wallet-core、OS、Profile / Account の責務、依存方向およびデータ所有を確認した。     | 基本の境界は成立。共通 gate の owner 表現と Mainnet gate の高位固定に不足（`DR-001`、`DR-004`）。                                             |
| Reviewer B: security / trust boundary  | 外部入力、verified handoff、Relay opaque、4条件、Profile binding、semantic inspection、message replay、secret、OS protection、fail-closed を確認した。                | `MESSAGE_SIGN` を含む共通4条件の Mobile 適用が本文で確定していない（`DR-001`、`DR-002`）。                                                    |
| Reviewer C: flow / lifecycle           | request ingress、approval、authentication、pre-sign、wallet-core call、result、lifecycle loss、process recreation、concurrency、unknown result、fallback を確認した。 | lifecycle、concurrent isolation、unknown / delivery distinction、fallback は成立。success result の signing-time binding が不足（`DR-003`）。 |
| Reviewer D: traceability / downstream  | Requirements、共通 Design、SDK / Relay、各 Specification、wallet-core 契約、Binding decision、Mainnet ADR、OPEN、下流 owner および委譲境界を確認した。                | 現行 traceability 表は要求された責務ごとの直接追跡を満たさない（`DR-005`）。                                                                  |

過去の `READY`、共通 Design review の `READY` および過去 review の総評は、今回の判定根拠として自動継承していない。

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                             | 使用目的                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                                        | 主対象。現行の全章を確認し、責務、trust boundary、handoff、Relay、Profile / Account、認証、inspection、lifecycle、result、fallback、Mainnet、traceability および OPEN を判定した。 |
| [`mobile-app-review-001.md`](./mobile-app-review-001.md)                                                                                                                                                                                                                                                                         | 過去の判定と、正式な finding ID が存在しないことを確認した。過去の READY は継承していない。                                                                                        |
| [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`browser-extension.md`](../../design/browser-extension.md)                                                        | Mobile trusted host、共通4条件、Profile-local context、result、lifecycle、Relay / SDK / wallet-core 境界、Browser との共通 semantics を照合した。                                  |
| [`architecture-review-004.md`](./architecture-review-004.md)、[`security-design-review-004.md`](./security-design-review-004.md)、[`signing-flow-review-004.md`](./signing-flow-review-004.md)、[`interfaces-review-004.md`](./interfaces-review-004.md)、[`browser-extension-review-003.md`](./browser-extension-review-003.md) | READY 済み共通 Design の current responsibility / invariant / downstream owner を参照した。各 Review Gate は今回へ継承していない。                                                 |
| [`concept-sheet.md`](../../concept/concept-sheet.md)、[`requirements.md`](../../requirements/requirements.md)、[`mobile-app.md` 要件](../../requirements/mobile-app.md)、[`relay.md` 要件](../../requirements/relay.md)、[`sdk.md` 要件](../../requirements/sdk.md)                                                              | Mobile milestone、Signer / Relay 境界、共通署名 gate、message signing、secret、lifecycle、Mainnet gate、SDK non-Signer および Relay 非署名責任の上流根拠を確認した。               |
| [`relay.md` Design](../../design/relay.md)、[`sdk.md` Design](../../design/sdk.md)                                                                                                                                                                                                                                               | Relay opaque、SDK non-Signer、handoff、error、retry / fallback、response correlation および downstream responsibility を照合した。                                                 |
| [`interfaces.md` Specification](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                | structured message、message replay、request / result context、unknown result、delivery disposition、handoff source、Mainnet origin proof および具体仕様の owner を確認した。       |
| [`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)                                                                                                                                                                     | Profile Network、Application Account authority、wallet-core identity、Chain-specific inspection、Aggregate / cosignature、Symbol / NEM 分離および backup 境界を確認した。          |
| [`0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)、[`mobile-store-release.md`](../../mobile/mobile-store-release.md)、[`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)                                                                                                        | Mainnet capability、release evidence、配布条件および gate 未達成時の安全側扱いを確認した。                                                                                         |
| [`wallet-core requirements`](../../../_snwc/docs/requirements/requirements.md)、[`wallet-core specification`](../../../_snwc/docs/specifications/specification.md)、[`Binding decision`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                | Wallet Store、Profile password、Software Key identity、raw signing、Native / WASM Binding、secret lifecycle および Application-level authorization 非担当を確認した。              |
| `docs/specifications/mobile-app.md`                                                                                                                                                                                                                                                                                              | 確認を試みたが workspace に存在しない。Mobile 固有の downstream contract は Mobile 要件、handoff / common specifications および release 資料で確認した。                           |

## 4. Review Result

**Review Gate: `REVISE DESIGN`**

現行 Mobile App Design は、外部入力を untrusted とする trust boundary、Mobile trusted UI、Relay の opaque transport、wallet-core の秘密・raw signing 境界、lifecycle invalidation、concurrent request isolation、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` および automatic fallback prohibition を概ね維持している。

しかし、Mobile Design 自身に、共通4条件を独立した gate として成立・再確認・結果帰属する記述、v1 `MESSAGE_SIGN` の structured contract、署名時4条件を含む success result binding、Mainnet gate の高位 fail-closed invariant、および要求された責務単位の直接 traceability が不足している。Critical 2件、Major 2件、Minor 1件を記録する。

## 5. Summary

- `DR-001: UNRESOLVED`。`Authentication`、`Signing-capable unlock`、Account authorization、Explicit user approval の4条件が、Mobile trusted host の独立した必須 gate として本文に確定していない。`AUTHORIZED`、pre-sign、success、lock / unlock の各記述も4条件を一貫して表さない。
- `DR-002: UNRESOLVED`。Mobile v1 の `MESSAGE_SIGN` が operation として明示されず、structured message の domain、purpose、nonce、issued / expiry、message-level replay および同一 inspection model の binding、raw / uninspectable fallback 禁止が確定していない。
- `DR-003: UNRESOLVED`。response binding は request、source、Profile / Account、Chain / Network、operation、target digest を含むが、signer identity、署名時点4条件および approval context を success 条件として明示していない。
- `DR-004: UNRESOLVED`。Mainnet gate の存在・未達成時の capability 無効化・判定不能時 fail-closed が Mobile Design の security invariant として明示されず、§3.3 / §27 で Mainnet gate 条件全体が OPEN に戻っている。
- `DR-005: UNRESOLVED`。§28 は8つの広い資料対応に留まり、caller authority、4条件、Account authorization、structured message、result unknown / delivery unknown、fallback、wallet-core、Mainnet 等について、責務・invariant・owner・downstream boundary の直接対応を網羅していない。

上記以外では、Mobile trusted host を Signer とする基本方向、external app / SDK / Relay / handoff metadata の non-authority、Profile / Account と wallet-core identity の分離、semantic inspection、trusted UI、lifecycle、screen exposure の評価責任、secure storage 境界、concurrent request、unknown result、secret isolation および fallback prohibition に重大な回帰は確認されなかった。

## 6. Finding Status

| ID       | Severity | Status       | 初出レビュー | 今回の状態根拠                                                                                                                                                                              |
| -------- | -------- | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | `UNRESOLVED` | 今回初出     | Mobile 本文は explicit approval と device authentication を分離するが、4条件全体、独立性、Mobile host owner、pre-sign / result の再確認および代替不可条件を共通 gate として固定していない。 |
| `DR-002` | Critical | `UNRESOLVED` | 今回初出     | Mobile 本文に `MESSAGE_SIGN` の literal がなく、message-specific context / replay / structured inspection / raw fallback prohibition が同一 operation として確定していない。                |
| `DR-003` | Major    | `UNRESOLVED` | 今回初出     | §8.3 と §14 の success 定義が署名時4条件、signer identity、approval context まで対応付けていない。                                                                                          |
| `DR-004` | Major    | `UNRESOLVED` | 今回初出     | Mainnet gate の高位必須条件・fail-closed が本文の invariant にない。exact evidence / OS detail の OPEN 自体は問題にしていない。                                                             |
| `DR-005` | Minor    | `UNRESOLVED` | 今回初出     | §28 は必要な資料の一部を参照するが、要求された責務単位の direct traceability と downstream owner / boundary 対応が不足している。                                                            |

### 過去 Mobile App Design review の状態

`mobile-app-review-001.md` は `READY` とし、正式な finding ID を一件も発行していない。したがって、過去 finding の `RESOLVED` / `REOPENED` 対象はなく、今回の5件は過去 finding の再開ではなく current design に対する今回初出の finding である。過去の READY は判定根拠にしていない。

## 7. Required Changes

- `DR-001`: Mobile trusted host を共通署名 gate の唯一の Signer-side orchestration owner と明記し、4条件を独立必須として、同一 request / source / session / Profile / Account / Chain / Network / operation / target / freshness に binding する。pre-sign、success result、失効・stale・unknown・locked 時の fail-closed、および connection、permission、capability、session、ordinary `UNLOCKED`、previous authentication、OS unlock、SDK / Relay、dApp self-declaration、wallet-core password / Store validation / signing success の非代替を明記する。
- `DR-002`: Mobile v1 の `MESSAGE_SIGN` を structured message signing として明示し、verified / unverified source status、Profile / Account、Chain / Network、operation、domain、purpose、message、nonce、issued / expiry、request freshness、replay state および4条件を binding する。Signer 自身の同一 trusted model から inspection と signing input を導出し、raw arbitrary / uninspectable fallback、cross-context replay、expired / duplicate / replay signing を禁止する。exact format は下流 Specification に委譲してよい。
- `DR-003`: success result の必要条件に original request、source、signer identity、Profile、Account、Chain / Network、operation、exact target / trusted digest、署名時点の4条件および approval context を追加する。context loss、stale、revoked、locked、mismatch、unknown は success にせず、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を維持し、delivery failure を再署名根拠にしないことを明記する。
- `DR-004`: Mainnet capability は current release policy / evidence gate の成立時だけ有効、gate 未達成・期限切れ・不整合・判定不能時は Mainnet signing を無効化する、と高位 invariant として固定する。exact OS condition、evidence format、runtime enforcement は下流へ委譲し、Testnet-only 継続の余地は維持する。
- `DR-005`: §28 を、少なくとも caller / Origin または handoff source、non-authority、4条件、Profile / Account authority、structured message、Chain / Network、Aggregate / cosignature、result / unknown、fallback、wallet-core boundary、Mainnet gate ごとに、上位 requirement / Design、本文適用箇所、downstream contract および owner を対応付ける表へ補強する。

### DR-001: UNRESOLVED — Mobile の共通署名ゲート4条件

- ID: `DR-001`
- Severity: `Critical`
- Target: [`mobile-app.md`](../../design/mobile-app.md) §4、§5.5〜§5.8、§10、§12.3、§14、§16、§24。
- Facts / conditions: §4 は利用者の explicit approve / reject と device authentication を別条件として取得すると記載するが、Authentication、Signing-capable unlock、対象 Profile / Chain / Network / Account の Account authorization、Explicit user approval の4条件を列挙していない。§14 の `AUTHORIZED` は signing intent の明示だけ、§16 の signing 前条件は explicit approval・device authentication・target / context 再検証だけであり、Account authorization と署名可能 unlock の独立性が確認できない。§24 も device authentication と approval を分けるだけで、Mobile trusted host が4条件の唯一の orchestration owner であること、4条件を署名前と結果時に再確認することを一貫して定めていない。
- Evidence: [共通要件 CR-016 / CR-AC-017](../../requirements/requirements.md)、[Architecture §6.9](../../design/architecture.md)、[Signing Flow §4 / §16 / §20](../../design/signing-flow.md)、[Interfaces §9](../../design/interfaces.md) は、4条件の独立性、同一 binding、pre-sign、result validation、失効時 fail-closed および connection / permission / session / ordinary `UNLOCKED` / wallet-core 処理の非代替を要求する。
- Problem: Mobile Design の各 flow が、device authentication、permission / pairing、Account selection、ordinary `UNLOCKED`、OS unlock、wallet-core password / Store validation または wallet-core signing success を、Account authorization・Signing-capable unlock・Explicit approval と取り違えないための共通 gate contract を直接示していない。SDK、Relay、external app、OS handoff metadata または wallet-core が gate を成立・変更・免除・迂回できない境界も、Mobile の gate owner として明示されていない。
- Impact: 下流実装が「認証成功」「アプリが unlock 済み」「Account が選択された」「wallet-core が署名した」ことだけで署名可能と解釈し、別 request / caller / Profile / Account / Chain / Network / operation / target / freshness に承認・認証・認可を流用する security boundary の不整合が生じる。
- Minimum correction: Mobile trusted host を共通署名 gate の唯一の Signer-side orchestration owner と明記し、4条件を同一 binding context に対する独立必須条件として §4、§12〜§16、§24 に適用する。pre-sign と success result で4条件を再確認し、いずれかが missing、stale、revoked、locked、unknown または mismatch なら fail-closed とする。connection、permission、capability、session、ordinary `UNLOCKED`、previous authentication、OS unlock、Account selection、SDK / Relay、dApp self-declaration、handoff metadata、wallet-core password / Store validation および wallet-core signing success は代替でないと明記する。
- Reconfirmation criteria: `Authentication`、`Signing-capable unlock`、Account authorization、Explicit user approval が、同一 request / source / session / Profile / Account / Chain / Network / operation / exact target / freshness に binding され、Mobile trusted host が pre-sign と result validation の owner であることを確認する。各条件の失効・不明・locked・stale 時に wallet-core call と success result がともに禁止され、外部主体・OS・wallet-core が gate を変更・迂回できないことを確認する。

### DR-002: UNRESOLVED — Mobile v1 の structured `MESSAGE_SIGN`

- ID: `DR-002`
- Severity: `Critical`
- Target: [`mobile-app.md`](../../design/mobile-app.md) §5.6、§12.2〜§12.3、§20、§24、§27。
- Facts / conditions: 現行 Mobile Design に `MESSAGE_SIGN` という operation 名がない。§5.6 と§12.2 は transaction / message を同じ一般的な列挙で扱い、message の domain、purpose、nonce、issued / expiry、message-level replay、cross-domain / cross-purpose replay または transaction とは別の result contract を同一 context として定めていない。Signer 自身が structured message から inspection と signing input を生成すること、parse failure / uninspectable message の raw fallback を禁止することも明記されていない。
- Evidence: [Signing Flow §6.1 / §14](../../design/signing-flow.md) は v1 `MESSAGE_SIGN`、message context、Signer inspection、4条件、pre-sign、raw bytes fallback 禁止を定義する。[Interfaces Specification §9.4](../../specifications/interfaces.md)、[Signing Protocol](../../specifications/signing-protocol.md) および [Web Transaction Handoff](../../specifications/web-transaction-handoff-spec.md) は structured message、message replay、signed result 対応を下流 contract として定める。exact nonce format、serialization、expiry duration は今回要求していない。
- Problem: Mobile が generic message payload を受け付けるだけの設計に留まり、Browser と共通の structured message signing capability が Mobile v1 で確定していない。外部 app の表示文言と実際の signing bytes が分離したり、uninspectable raw bytes、期限切れ・duplicate・replay または cross-Origin / domain / purpose request が署名可能になったりする余地がある。
- Impact: 利用者が確認した意味と実際に署名される message の対応を検証できず、transaction signing へ誤分類することによる replay、意図外署名および同一 message の再利用が生じる。
- Minimum correction: Mobile v1 の `MESSAGE_SIGN` を structured message operation として明示する。verified / unverified source status、Profile / Account、Chain / Network、operation、domain、purpose、message content、nonce、issued / expiry、request freshness、replay state および共通4条件を同一 message signing context に binding し、Signer が同じ trusted model から inspection と signing input を導出することを定める。arbitrary raw bytes、parse failure / uninspectable raw fallback、cross-Origin / cross-domain / cross-purpose replay、expired / duplicate / replay signing を禁止し、pre-sign と result binding を適用する。exact field / wire / serialization は下流へ委譲してよい。
- Reconfirmation criteria: Mobile Design に `MESSAGE_SIGN` の capability と structured contract が明記され、指定された全 context が同一 binding に含まれることを確認する。Signer inspection と signing input が同一 trusted message model から導出され、raw / uninspectable fallback がなく、expired・duplicate・replay・cross-context replay が拒否され、4条件・pre-sign・result validation が適用されることを確認する。

### DR-003: UNRESOLVED — success result の signing-time binding

- ID: `DR-003`
- Severity: `Major`
- Target: [`mobile-app.md`](../../design/mobile-app.md) §8.3、§12.3、§14、§15.4、§22。
- Facts / conditions: §8.3 の response は session、request identity、source、Profile / Account、Chain / Network、operation、target digest を binding するが、signer identity、署名時点の Authentication、Signing-capable unlock、Account authorization、Explicit user approval および approval context を success 条件として列挙していない。§14 の `SUCCEEDED` は signature result と元 request の対応確認に留まる。一方、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の分離、stale response の別 request への配送禁止および delivery failure の再署名禁止は記載されている。
- Evidence: [Signing Flow §20](../../design/signing-flow.md) は success result に original request、caller、signer、Profile、Account、Chain / Network、target identity、署名時4条件および approval context を要求する。[Interfaces Design](../../design/interfaces.md) と [Interfaces Specification](../../specifications/interfaces.md) は result validation、recipient、unknown / delivery の意味を定める。
- Problem: Mobile-level success が wallet-core の返却結果または target digest の確認だけで成立するように読め、署名時の gate context と trusted approval の帰属を安全に検証できない場合の success 禁止が明確でない。
- Impact: context lost、Profile / Account switch、source mismatch、locked、authorization revoke、approval replacement または wallet-core result の取り違え後に、別 request や別 recipient へ署名成功を返す可能性がある。配送不明時の再署名禁止はあっても、生成済み result 自体の安全な帰属が不足する。
- Minimum correction: success の必要条件に original request、verified source、signer identity、Profile、Account、Chain / Network、operation、exact target / trusted digest、署名時点の4条件および approval context を追加する。context loss、stale、revoked、locked、caller / Profile / Account / Chain / Network / target mismatch、signing-time context unknown または result disposition unknown は success にしない。`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を維持し、delivery failure は既存 result の resend / lookup 以外の再署名根拠にしない。
- Reconfirmation criteria: Mobile trusted host が wallet-core result をそのまま転送せず、上記全 context と signing-time 4条件を result validation で確認することを確認する。navigation / lifecycle / source loss 後に旧 result を別 recipient へ返さず、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を混同せず、delivery failure から同一 target を再署名しないことを確認する。

### DR-004: UNRESOLVED — Mainnet gate の高位 fail-closed invariant

- ID: `DR-004`
- Severity: `Major`
- Target: [`mobile-app.md`](../../design/mobile-app.md) §3.3、§23、§27、§28。
- Facts / conditions: §3.3 は hardware-backed protection、非対応端末の fallback、Mainnet capability への適用条件を requirements / release gate の未決事項として扱い、§27 は「直接 hardware signing の capability および Mainnet gate 条件」を OPEN にしている。§23 と§28 は Mainnet gate を参照するが、適用 release policy の gate 未達成・判定不能時に Mobile Mainnet signing capability を無効化する高位必須条件を Security Invariant または責務表で明示していない。
- Evidence: [共通要件 CR-NFR-006 / CR-AC-008](../../requirements/requirements.md) は gate 未達成・判定不能時の Mainnet capability 無効化を MUST とする。[Architecture](../../design/architecture.md) と [ADR 0001](../../adr/0001-mainnet-evidence-lite.md) は release evidence の gate と fail-closed を定める。[Web Transaction Handoff](../../specifications/web-transaction-handoff-spec.md) は Mobile v1 の具体的な capability / release 条件を下流で具体化している。
- Problem: exact OS API、evidence format、hardware 条件を OPEN にすること自体ではなく、Mainnet capability が release gate に従属し、gate が absent / invalid / expired / unknown のとき利用不可になることが Mobile Design から直接確認できない。§28 の資料リンクだけでは downstream owner と enforcement invariant が確定しない。
- Impact: platform capability、配布 build または release evidence が未確認でも Mainnet signing を公開・有効化する実装解釈が残り、Mainnet safety gate が可用性や個別 OS capability の判断に置き換わる。
- Minimum correction: Mainnet capability は適用中の release policy / evidence gate が成立した場合だけ有効、必須 evidence の欠落・不整合・期限切れ・署名検証失敗・trusted key 不備・policy 判定不能では Mainnet signing を無効化する、と Mobile の高位 invariant として §23 / §24 / §28 に明記する。exact evidence format、OS API、runtime enforcement および platform matrix は downstream に委譲し、Testnet-only 継続は許可する。
- Reconfirmation criteria: Mobile Design が Mainnet gate の存在、release / evidence owner、未達成・判定不能時の capability disable および fail-closed を明示し、§27 の OPEN が exact platform / evidence detail に限定されていることを確認する。ADR、Requirements、release policy と矛盾せず、OS unlock、hardware signal または App Store 配布成功だけで gate を代替しないことを確認する。

### DR-005: UNRESOLVED — 責務単位の traceability

- ID: `DR-005`
- Severity: `Minor`
- Target: [`mobile-app.md`](../../design/mobile-app.md) §28。
- Facts / conditions: §28 の traceability 表は8行で、local Signer、host / UI / wallet-core 境界、external invocation、Relay、device authentication、secret、common signing flow、platform capability / Mainnet を広く対応付けている。しかし、caller / Origin authority、Provider / Content Script 相当の non-authority、共通4条件、Profile / Account authority、structured `MESSAGE_SIGN`、Chain / Network inspection、Aggregate / cosignature、result binding、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、automatic fallback、wallet-core raw signing / secret boundary、Mainnet gate の各責務について、上位 requirement、本文適用箇所、下流 contract および owner を直接対応させる個別行がない。SDK、Signing Protocol、Profile / Account Specification、Chain Compatibility、wallet-core requirements / Binding decision、release evidence も current table から直接追跡できない。
- Evidence: [Architecture §17.1](../../design/architecture.md)、[Browser Extension Design §24](../../design/browser-extension.md)、[Interfaces Design §14.1](../../design/interfaces.md) は責務 / invariant、上位根拠、下流 contract / owner、本文適用箇所を直接対応付ける。[Mobile 要件 §8](../../requirements/mobile-app.md) は MR-* ごとに上流根拠、整合資料、下流引継ぎ、外部契約および受入条件を示す。
- Problem: 現行本文の各安全条件が共通資料に散在するため、Mobile の各責務を誰が成立させ、どの downstream boundary が詳細化し、どこで再確認するかを一つの表で確認できない。特に今回不足している4条件、MESSAGE_SIGN、result および Mainnet gate が、単なる参照リンクと未決 detail の間で曖昧になる。
- Impact: 下流仕様・実装・レビューで責任の逆流、Mobile 側の未実装責任、Relay / SDK / wallet-core への gate authority の誤移管、または Mainnet / message / result invariant の欠落を検出しにくい。これは exact schema 不足ではなく、基本設計の owner と traceability の不足である。
- Minimum correction: §28 を、caller / handoff source authority、external / SDK / Relay non-authority、共通4条件、Profile / Account、structured message、Chain / Network、Aggregate / cosignature、result / unknown、fallback、wallet-core、Mainnet gate ごとに、上位 Requirements / Design、Mobile 本文 section、downstream contract / owner および委譲境界を記載する表へ補強する。`docs/specifications/mobile-app.md` がない場合は、既存の共通・handoff・Profile・Chain・wallet-core・release 資料を明示的に割り当てる。
- Reconfirmation criteria: 要求された責務が一行以上の直接対応を持ち、各行に責任主体、security invariant、Mobile 適用 section、下流 contract / owner および detail delegation があることを確認する。リンク一覧だけでなく、4条件・MESSAGE_SIGN・result unknown / delivery・fallback・wallet-core secret boundary・Mainnet gate の各境界を上位から下流まで追跡できることを確認する。

## 8. Optional Improvements

今回の Review Gate に関係しない Minor / Nit の新規探索は行っていない。上記 `DR-005` の traceability 補強以外に、今回の判定を左右する Optional Improvement はない。

## 9. Resolved Findings

なし。過去 `mobile-app-review-001` に正式 finding はなく、今回の `DR-001`〜`DR-005` はすべて未解消である。

## 10. Deferred Findings

次の事項は、Mobile Design が高位の責務・安全条件を固定する限り、Design フェーズの適切な委譲または OPEN と判定した。

| 項目                                                                                                                              | 判定                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対応 OS version、端末範囲、Store / test 配布、milestone                                                                           | `MR-OPEN-001` の downstream detail。各 platform / release owner へ委譲してよい。                                                                                  |
| Deep Link、Universal Link、App Link、QR、share / Intent の採否、schema、association、callback、proof protocol                     | `MR-OPEN-002` の detail。routing 自体は untrusted、verified handoff context の検証責任と fail-closed は OPEN に戻してはならない。                                 |
| Relay の主経路、pairing UX、session recovery、generation、response retrieval、unavailable 時の UX                                 | Relay / handoff の下位契約。Relay を signer / approval authority にしない invariant は固定済みである。                                                            |
| PIN、passcode、biometric、Profile password の具体的役割、fallback、retry、lock timeout                                            | `MR-OPEN-004` の detail。4条件の独立性と OS unlock 非代替は `DR-001` で固定対象とする。                                                                           |
| Native / WASM Binding、OS protected wrapping、hardware capability、secret buffer lifecycle、Store migration                       | `MR-OPEN-003` / `006` および wallet-core Binding contract の detail。wallet-core の raw signing / secret owner と Mobile orchestration owner の分離は委譲しない。 |
| pending request の保持、再表示、process kill 後の recovery、delivery lookup                                                       | lifecycle / handoff の detail。古い approval / auth / target を復元せず、unknown result を再署名に使わない invariant は固定済みである。                           |
| backup / restore、端末移行、端末紛失、App delete、OS protection loss の具体手順                                                   | `MR-OPEN-006` と Profile / Account specification の downstream detail。Application metadata と opaque Store の責任分離は固定済みである。                          |
| screenshot、recording、screen sharing、recent-app preview、notification、clipboard、crash / diagnostics policy                    | `MR-OPEN-007` の platform detail。露出リスク評価、過大な保護保証の禁止、secret isolation は本 Design の責務である。                                               |
| exact API、field、wire representation、nonce format、expiry duration、timeout、retry count、storage schema、state enum、UI layout | Design フェーズ境界内の downstream specification / implementation detail。今回の不足 finding ではない。                                                           |

## 11. Scope and Traceability

現行 §28 は資料を列挙しているが、共通 Design のように各責務を requirement、本文適用、下流 contract / owner へ直接結び付けていない。`docs/specifications/mobile-app.md` が存在しないこと自体を設計不備とはしないが、Mobile の責務は既存の共通・handoff・Profile・Chain・wallet-core・release contract へ直接追跡できる必要がある。

| 責務 / invariant                                                                            | 上位根拠                                                                                                                                                                                                                                                        | 現行本文                                 | 必要な downstream contract / owner                                                                                               | 評価                                                                            |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Mobile trusted host が Signer、外部 app / Web / SDK / Relay / handoff metadata が untrusted | [Architecture](../../design/architecture.md)、[Security Design](../../design/security-design.md)、[Mobile 要件](../../requirements/mobile-app.md)                                                                                                               | §3〜§6、§25                              | Mobile trusted host、SDK non-Signer、Relay owner。Mobile Design §5.5 を owner として明示                                         | 概ね適合。4条件の明示が別 finding。                                             |
| verified handoff source / Origin authority と OS metadata の非 authority                    | [Mobile 要件](../../requirements/mobile-app.md)、[Interfaces Specification](../../specifications/interfaces.md)、[Web Handoff](../../specifications/web-transaction-handoff-spec.md)                                                                            | §7、§8、§12                              | Mobile host が source、session、integrity、freshness、recipient を検証。Mainnet origin proof は handoff / release owner          | 概ね適合。direct matrix が不足（`DR-005`）。                                    |
| 共通4条件 gate、pre-sign、fail-closed、外部主体の非代替                                     | [Requirements CR-016 / CR-AC-017](../../requirements/requirements.md)、[Architecture §6.9](../../design/architecture.md)、[Signing Flow](../../design/signing-flow.md)、[Interfaces](../../design/interfaces.md)                                                | §4、§10、§12〜§16、§24                   | Mobile trusted host が成立・再確認・失効・result 帰属の owner                                                                    | `DR-001`。                                                                      |
| Profile / Account authority と wallet-core identity の分離                                  | [Interfaces](../../design/interfaces.md)、[Profile / Account Specification](../../specifications/profile-account-spec.md)、[Mobile 要件](../../requirements/mobile-app.md)                                                                                      | §9、§18〜§19、§25                        | Application / Mobile は association、selection、permission、authorization。wallet-core は identity / Store / raw signing         | 概ね適合。Profile-local context の direct traceability が不足（`DR-005`）。     |
| Structured `MESSAGE_SIGN` と message replay boundary                                        | [Requirements](../../requirements/requirements.md)、[Signing Flow](../../design/signing-flow.md)、[Interfaces Specification](../../specifications/interfaces.md)、[Signing Protocol](../../specifications/signing-protocol.md)                                  | §5.6、§12.2、§20 の generic message 記述 | Mobile Signer が structured model、inspection、message replay、result binding を owner。exact contract は message / handoff spec | `DR-002`。                                                                      |
| Chain / Network、Symbol / NEM、Aggregate / cosignature inspection                           | [Chain Compatibility](../../specifications/chain-compatibility-spec.md)、[Signing Flow](../../design/signing-flow.md)                                                                                                                                           | §5.6、§9、§12.2、§20                     | chain-specific integration が parse / validate / inspection。Mobile trusted host が gate / approval owner                        | 概ね適合。                                                                      |
| success result、signer、target、signing-time gate、approval context、unknown / delivery     | [Signing Flow](../../design/signing-flow.md)、[Interfaces Specification](../../specifications/interfaces.md)、[Web Handoff](../../specifications/web-transaction-handoff-spec.md)                                                                               | §8.3、§14、§15.4、§22                    | Mobile host が result validation / response generation、handoff owner が delivery contract                                       | `DR-003`。unknown / delivery の区別自体は適合。                                 |
| automatic fallback prohibition と fresh retry                                               | [Signing Flow](../../design/signing-flow.md)、[SDK Design](../../design/sdk.md)、[Relay Design](../../design/relay.md)、[Web Handoff](../../specifications/web-transaction-handoff-spec.md)                                                                     | §22、§25                                 | Mobile / SDK / Relay が security boundary を迂回しない。明示 retry は fresh request / gate                                       | 適合。                                                                          |
| wallet-core raw signing / secret boundary                                                   | [Architecture](../../design/architecture.md)、[Security Design](../../design/security-design.md)、[wallet-core specification](../../../_snwc/docs/specifications/specification.md)、[Binding decision](../../../_snwc/docs/decisions/binding-implementation.md) | §5.9、§6、§11、§18〜§19、§25             | wallet-core が Store / secret / key identity / raw signing owner、Mobile host が orchestration / approval owner                  | 概ね適合。gate と Mainnet の direct traceability が不足（`DR-001`、`DR-005`）。 |
| Mainnet gate と capability fail-closed                                                      | [Requirements CR-NFR-006](../../requirements/requirements.md)、[Architecture](../../design/architecture.md)、[ADR 0001](../../adr/0001-mainnet-evidence-lite.md)                                                                                                | §3.3、§23、§27〜§28                      | release / evidence owner が policy を判定し、Mobile capability が未達成・判定不能で無効化                                        | `DR-004`。                                                                      |

## 12. Domain Checks

| Check                                     | Result  | Basis / regression assessment                                                                                                                                                                                                                                    |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Mobile Trust Boundary                  | Partial | §3〜§6、§18、§25 は外部 app / Web / SDK / Relay / OS metadata を untrusted、Mobile App を local Signer、wallet-core を cryptographic owner とする。ただし共通 gate owner の明示が不足（`DR-001`）。                                                              |
| 2. Verified Handoff Context               | Pass    | §7〜§8、§12 は source、handoff/session、request identity、recipient、integrity、freshness、expiry、generation を Mobile 側で検証し、unverifiable request を安全に終了する。Testnet の未検証 source 表示と Mainnet origin proof は downstream policy と整合する。 |
| 3. Relay Boundary                         | Pass    | Relay は §8 で opaque transport、structural validation、短期 delivery に限定され、semantic inspection、approval、authentication、signing、result authority を担わない。                                                                                          |
| 4. 共通署名ゲート4条件                    | Fail    | §4、§10、§12〜§16、§24 に4条件の独立した列挙、owner、pre-sign / result 適用、非代替条件がない（`DR-001`）。                                                                                                                                                      |
| 5. Profile / Account Binding              | Partial | Profile Network、Account、payload signer、permission / revision、変更時失効はあるが、Authentication、Account authorization、approval、result までの Profile-local context の一貫した明示が不足（`DR-001`、`DR-003`）。                                           |
| 6. Account Authority                      | Pass    | §9、§18 は Application が association / selection / display / permission を、wallet-core が cryptographic identity / Store / raw signing を担うと分離し、Mobile が対応を検証する。                                                                               |
| 7. Request Ingress                        | Pass    | §7.1、§8.2、§12.1 は source、request identity、freshness、session / generation、recipient、Profile / Account、Chain / Network、operation、payload を自己申告だけで確定しない。                                                                                   |
| 8. Semantic Inspection                    | Partial | transaction、Aggregate、cosignature、NEM-specific target の unknown / parse / unrenderable fail-closed はある。message-specific structured contract の不足は `DR-002`。                                                                                          |
| 9. Trusted UI                             | Pass    | §5.7、§12〜§13 は Mobile App foreground UI で source、Profile / Account、Chain / Network、operation、target、warning、approval を扱い、external UI / notification / link text を authority としない。                                                            |
| 10. `MESSAGE_SIGN`                        | Fail    | `MESSAGE_SIGN` literal、structured message context、message-level replay、same-model inspection、raw / uninspectable prohibition が Mobile Design にない（`DR-002`）。                                                                                           |
| 11. TOCTOU / Pre-sign Revalidation        | Fail    | target、source、Profile / Account、Chain / Network、approval、foreground / lifecycle の再確認はあるが、4条件と signing-time context の全条件を明示的に再確認していない（`DR-001`）。                                                                             |
| 12. Mobile Lifecycle                      | Pass    | background、suspend、device lock、restart、process death、OS kill 後に auth / approval / signing operation を復元せず、必要時に再表示・再承認する。                                                                                                              |
| 13. Sensitive UI / Screen Exposure        | Pass    | §11.2、§17、§23 は screenshot、recording、sharing、recent preview、notification、clipboard、crash / diagnostic の露出を評価し、OS が防止できる範囲を超える保証を禁止する。                                                                                       |
| 14. Secure Storage / Hardware Protection  | Pass    | §11、§18〜§19 は opaque Store、OS protected credential、decrypted secret、Binding の責任を分離し、hardware-backed capability を過大表示しない。具体 API は適切に委譲されている。                                                                                 |
| 15. Concurrent Requests                   | Pass    | §21 は request identity、source、session、Profile / Account、Chain / Network、operation、target、inspection、response channel を request ごとに分離し、approval / device authentication / target / response の reuse を禁止する。                                |
| 16. Result Binding                        | Fail    | §8.3 は request / source / Profile / Account / Chain / Network / operation / target digest を含むが、signer identity、署名時4条件、approval context を success 条件に含めない（`DR-003`）。                                                                      |
| 17. `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` | Pass    | §8.3、§14、§15.4、§22 は署名 outcome unknown と delivery-only unknown を分離し、delivery failure を再署名根拠にしない。                                                                                                                                          |
| 18. Automatic Fallback                    | Pass    | §22、§25 は Relay / external / security failure 後の別 transport、別 request、別 Signer への自動 fallback と古い approval の再利用を禁止する。                                                                                                                   |
| 19. Error Semantics                       | Pass    | malformed、unsupported、expired、replay / duplicate、wrong source / recipient、wrong Account / Network、auth failure、rejection、lifecycle、wallet-core、Relay、stale、unknown を意味上分けている。exact code は要求していない。                                 |
| 20. wallet-core Boundary                  | Pass    | §5.9、§11、§18、§25 は Mobile が approved target だけを渡し、wallet-core が UI、source、permission、approval、transaction meaning を担わないとする。4条件の明示不足は `DR-001` に含める。                                                                        |
| 21. Secret Handling                       | Pass    | §7、§11、§18〜§19、§24〜§25 は private key、Mnemonic、password、decrypted Store、session secret、auth context を Relay / SDK / external app / URL / log / diagnostic / notification へ渡さない。                                                                 |
| 22. Backup / Migration                    | Pass    | §11、§19、§23、§27 は Application metadata と wallet-core opaque Store、OS wrapping、backup / migration の責任を分離し、具体手順を downstream に委譲する。                                                                                                       |
| 23. Chain / Network                       | Pass    | §5.6、§9、§12、§20、§24 は Symbol / NEM、Mainnet / Testnet、chain-specific identity / semantics を混同せず、外部指定だけで切り替えない。                                                                                                                         |
| 24. Aggregate / Cosignature               | Pass    | §12.2、§20 は Aggregate parent / embedded、existing signatures / cosignatures、selected cosigner、NEM multisig context を全体 inspection し、unrenderable / incomplete target を拒否する。                                                                       |
| 25. Mainnet Gate                          | Fail    | §3.3、§23、§27〜§28 は Mainnet gate を参照するが、gate existence、release evidence failure / unknown 時の Mainnet capability disable を Mobile invariant として固定しない（`DR-004`）。                                                                          |
| 26. Traceability                          | Fail    | §28 の8行表は、要求された責務ごとの上位根拠・本文適用・downstream contract / owner の直接対応として不十分（`DR-005`）。                                                                                                                                          |
| 27. OPEN Items                            | Partial | OS / handoff / Relay / auth / Binding / lifecycle / backup / sensitive UI の exact detail は適切に OPEN。ただし Mainnet gate の高位 invariant と `MESSAGE_SIGN` capability / replay boundary を OPEN に戻してはならない（`DR-002`、`DR-004`）。                  |
| Design phase boundary                     | Pass    | exact API、OS API、wire / storage schema、state enum、timeout、retry、crypto parameter、implementation class、UI layout を不足 finding にしていない。                                                                                                            |

## 13. Validation Results

- `pnpm exec prettier --write docs/reviews/design/mobile-app-review-002.md` — PASS
- `pnpm exec prettier --check docs/reviews/design/mobile-app-review-002.md` — PASS
- `git diff --check` — PASS
- Markdown local link validation — PASS。成果物から参照する68個の存在する local link を確認した。`docs/specifications/mobile-app.md` は未存在として記録し、リンクは作成していない。
- Finding ID 重複確認 — PASS。正式 finding は `DR-001`〜`DR-005` の5件で、Finding Status、Required Changes、各詳細、Domain Checks および Final Decision の対応を確認した。
- Review Gate と finding status の整合確認 — PASS。未解消 Critical / Major があるため `REVISE DESIGN` となり、Finding Status、Review Gates および Final Decision が一致している。
- 変更範囲確認 — PASS。レビュー成果物以外の変更がないことを確認した。

Source code の変更はないため、lint、typecheck、test、build は実行対象外とする。

## 14. Review Gates

| Gate                             | Result  | Evidence / blocking finding                                                                                                                                                                                 |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Purpose and scope             | Pass    | §1〜§3 は Mobile local Signer、iOS / Android scope、Relay / OS / wallet-core の非責務および Design フェーズ境界を示す。                                                                                     |
| 2. Context and responsibility    | Fail    | trust boundary は概ね成立するが、共通4条件を Mobile trusted host が唯一の gate owner として成立・再確認する記述が不足（`DR-001`）。                                                                         |
| 3. Dependency direction          | Pass    | external app / SDK / Relay / OS → Mobile intake / privileged host → chain integration / trusted UI / wallet-core の方向で、Relay / SDK / wallet-core への authority 逆流はない。                            |
| 4. Major flows                   | Fail    | receive / inspect / approval / auth / signing / result / lifecycle はあるが、`MESSAGE_SIGN` と4条件付き success の flow が欠ける（`DR-001`、`DR-002`、`DR-003`）。                                          |
| 5. Data ownership                | Partial | Profile / Account metadata、opaque Store、secret、request、approval、auth、result の保持境界はあるが、Profile-local 4-condition / result context の明示が不足（`DR-001`、`DR-003`）。                       |
| 6. Security and interoperability | Fail    | Symbol / NEM、inspection、secret boundary、Relay、lifecycle は適合するが、structured `MESSAGE_SIGN`、4条件および Mainnet gate invariant が不足（`DR-001`、`DR-002`、`DR-004`）。                            |
| 7. Upstream consistency          | Fail    | current common Requirements / Architecture / Signing Flow / Interfaces は Mobile に4条件・message・result・Mainnet の共通 invariant を要求するが、Mobile 本文の記述が追従していない（`DR-001`〜`DR-004`）。 |
| 8. Downstream implementability   | Fail    | exact schema 等の不足ではないが、Mobile の gate、message operation、success condition、Mainnet owner を下流が一義的に実装できる高位 contract として追跡できない（`DR-001`〜`DR-005`）。                     |

未解消の Critical / Major finding があり、Review Gate は `REVISE DESIGN` である。

## 15. Remaining Risks and Open Decisions

- 共通4条件が Mobile Design の各状態・pre-sign・success に明示されないまま下流へ進むと、device authentication、ordinary `UNLOCKED`、permission、OS unlock、wallet-core password / Store validation または wallet-core signing success が Account authorization や Explicit approval の代替として実装されるリスクがある。
- `MESSAGE_SIGN` が generic message として残ると、transaction と message の意味・replay boundary が混同され、表示 model と signing input の分離、raw / uninspectable fallback、cross-domain / cross-purpose replay の実装解釈が発生する。
- success result が signing-time gate context と approval context を持たないと、wallet-core の成功結果または delivery success を Mobile-level success と誤帰属するリスクがある。
- Mainnet の exact OS / evidence 条件は下流で決定してよいが、Mainnet gate の存在と未達成・判定不能時の capability disable は Mobile Design で OPEN に戻してはならない。
- `docs/specifications/mobile-app.md` は存在しない。Mobile 固有の後続仕様を新設する場合も、共通4条件、structured message、result binding、lifecycle、Relay opaque、wallet-core boundary および Mainnet gate を上位から直接引き継ぐ必要がある。
- 現在の workspace に Mobile 実装がないため、本文で確認できた安全条件を runtime /実機 capability の確認済み事実と扱ってはならない。

## 16. Automatic Changes

なし。レビュー中に変更するのは新規レビュー成果物 [`mobile-app-review-002.md`](./mobile-app-review-002.md) のみであり、Mobile Design、要件、仕様、ADR、共通 Design、wallet-core、実装および既存 review は変更していない。

## 17. Final Decision

`REVISE DESIGN`

現行 Mobile App Design は、trust boundary、Relay / wallet-core の責任分界、semantic inspection、trusted UI、lifecycle / process recreation、concurrent request isolation、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、automatic fallback prohibition、secret handling および Chain-specific 境界に重大な回帰を起こしていない。しかし、共通4条件、v1 structured `MESSAGE_SIGN`、signing-time success result binding、Mainnet gate の高位 fail-closed invariant および要求された direct traceability が不足している。`DR-001`〜`DR-005` を解消し、再レビューで各 reconfirmation criteria を確認するまで、Mobile App Design を `READY` と判定できない。
