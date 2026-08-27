# MosaicLynx 共通 Data Model / Interface 基本設計レビュー 004

## 1. Review Target

- 対象: [`docs/design/interfaces.md`](../../design/interfaces.md)
- 確認日: 2026-08-28
- レビュー成果物: `docs/reviews/design/interfaces-review-004.md`
- レビュー範囲: 共通 Data Model / Interface 基本設計の目的、責務境界、trust boundary、Profile-local context、Account authority、共通署名 gate、request / response / result context、Chain / Network、failure semantics、concurrent request isolation、lifecycle、correlation、SDK、Relay、wallet-core、traceability および OPEN 項目。
- 主目的: 前回レビュー [`interfaces-review-003.md`](./interfaces-review-003.md) の `DR-001`〜`DR-005` が、現在の設計本文で解消されたかを再確認すること。
- 過去判定の扱い: 前回の `REVISE DESIGN`、過去の `READY` および関連レビューの判定は継承せず、現在の対象本文と承認済み根拠から判定した。
- 設計フェーズ境界: exact API、function signature、JSON / DTO schema、field type、wire encoding、exact error code、numeric code、timeout / retry 数、DB / Redis schema、cryptographic parameter、byte serialization、concurrency algorithm、implementation class および UI layout は評価対象の不足としない。
- 未確認範囲: source code、runtime 挙動および未実装 Mobile App の実装検証は行っていない。これらは本基本設計レビューの対象外である。

## 2. Execution Audit

`design-review` Skill、共通 review playbook、reviewers、review gates、output format、[`AGENTS.md`](../../../AGENTS.md) および [`.agents/project-context.md`](../../../.agents/project-context.md) を確認した。サブエージェントは使用せず、Chair が同じ根拠資料を混ぜない4つの独立パスで確認した。

| 観点                                   | 独立確認                                                                                                                                                                            | 判定                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Reviewer A: structure / responsibility | dApp、SDK、Provider / Content Script、Browser / Mobile Signer、Relay、wallet-core、Application Profile / Account、Chain-specific integration、依存方向およびデータ所有を確認した。  | 前回 `DR-001`、`DR-002` に対応する責務・authority の分離を確認。新規指摘なし。                        |
| Reviewer B: security / trust boundary  | Profile-local context、4条件 gate、capability の意味、trusted UI、semantic inspection、Relay opaque、wallet-core secret / raw signing、fail-closed、automatic fallback を確認した。 | 前回 `DR-001`、`DR-002`、`DR-003` に対応する安全境界を確認。新規指摘なし。                            |
| Reviewer C: flow / lifecycle / failure | request lifecycle、approval、authentication、unlock、result / delivery、expiry、replay / duplicate、failure semantics、複数 Browser request および Mobile handoff を確認した。      | 前回 `DR-001`、`DR-004`、`DR-005` に対応する失効・分離・unknown 区分を確認。新規指摘なし。            |
| Reviewer D: traceability / downstream  | 上流要件、関連設計、下流仕様、wallet-core requirements / specification / Binding decision、OPEN および Design フェーズ境界との追跡を確認した。                                      | `DR-001`〜`DR-005` の再確認条件が本文へ引き渡され、下流へ過剰逆流していないことを確認。新規指摘なし。 |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                            | 用途                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                                                                                                                       | 主対象。現行の Profile-local context、Account authority、4条件 gate、Error model、concurrent isolation、責任表、validation、security invariant および委譲範囲を直接確認した。                                                |
| [`interfaces-review-003.md`](./interfaces-review-003.md)                                                                                                                                                                                                                                                                                                                                        | `DR-001`〜`DR-005` の初出、重大度および再確認条件の追跡に使用した。前回の主張や判定を今回の根拠として継承していない。                                                                                                        |
| [`concept-sheet.md`](../../concept/concept-sheet.md)、[`requirements.md`](../../requirements/requirements.md)                                                                                                                                                                                                                                                                                   | Product の責任境界、明示承認、秘密情報分離、Chain / Network 分離、`CR-012`、`CR-013`、`CR-015`、`CR-016`、`CR-NFR-008`〜`CR-NFR-012` を照合した。                                                                            |
| [`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                        | Browser / Mobile / Relay / SDK の要求、caller、Profile / Account、lifecycle、failure、concurrency および非署名責任を照合した。                                                                                               |
| [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)                                                                                                                                                                                                                                   | 上位 Design の責務、trust boundary、4条件 gate、authorization binding、result disposition、replay / concurrency invariant および fail-closed を照合した。                                                                    |
| [`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                | 下位 Design の caller / source、Profile / Account 管理、Relay opaque、SDK non-Signer、wallet-core 境界、failure および concurrent request の整合を確認した。                                                                 |
| [`interfaces.md` specification](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | 下流仕様で既に具体化された identity、scope、failure、unknown、operation、target inspection、Profile Network、handoff および Chain-specific 境界を確認した。exact schema / wire / byte は本レビューの判定へ逆流させていない。 |
| [`wallet-core requirements`](../../../_snwc/docs/requirements/requirements.md)、[`wallet-core specification`](../../../_snwc/docs/specifications/specification.md)、[`Binding decision`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                               | Software Key cryptographic identity、public key、address、Store / secret processing、raw signing、Application 側責任および Binding の責任境界を照合した。                                                                    |
| `design-review` Skill 一式、共通 playbook、project context、`AGENTS.md`                                                                                                                                                                                                                                                                                                                         | レビュー手順、4観点、正式 ID、重大度、Review Gate、出力順、設計フェーズ境界、検証および Git 運用を確認した。                                                                                                                 |

## 4. Review Result

`READY`

## 5. Summary

現行の `interfaces.md` は、前回 `DR-001`〜`DR-005` の再確認条件を共通 Interface Design の責務・境界・不変条件として明示している。Application Profile / Profile Network は公開 request / response field ではない Signer-local security context とされ、request から result delivery まで binding され、Profile・Account・permission・Chain / Network・caller の変更時に影響する context が失効する。

Account については、Application / Signer が Profile / Account association、selection、display、permission、authorization の authority を持ち、wallet-core が Software Key の cryptographic identity、public key、address、Store、secret processing および raw signing の authority を持つと分離されている。chain-specific integration が target、expected signer、Chain / Network および wallet-core identity の整合を検証し、外部 self-declaration、internal key reference、wallet-core signing success を Account authorization の authority としないことも明記されている。

Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件は、同一 caller / Profile / Account / Chain / Network / operation / target / freshness context に binding された必須 gate として定義され、Signer の成立・再確認後だけ wallet-core call と success result を許可する。capability、permission、session、ordinary `UNLOCKED`、previous authentication、SDK / Provider state、Relay metadata / delivery、dApp self-declaration および wallet-core result は代替にならない。

Error model は、要求された failure semantics、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` を意味上区別し、rejection と cancellation、expiry、authentication、authorization、locked、wallet-core / signing、transport / Relay、internal failure を混同しない。各 SigningRequest は独立した security / lifecycle unit とされ、Browser の複数 tab / frame / document と Mobile の複数 Deep Link / Relay handoff を含め、request context、approval、authentication、unlock、authorization、wallet-core result、recipient および delivery state の cross-request reuse を禁止している。

上記の修正による SDK non-Signer、Relay opaque、wallet-core secret / raw signing、Profile responsibility、Account authority、Chain / Network separation、semantic inspection、trusted UI、blind signing prohibition、target-derived summary、replay / duplicate、automatic fallback prohibition、secret isolation および fail-closed の重大回帰は確認されなかった。新規 Critical / Major finding はない。

## 6. Finding Status

| ID       | Severity | Status              | 初出レビュー            | 今回の状態根拠                                                                                                                                                                                                                   |
| -------- | -------- | ------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | Resolved            | `interfaces-review-003` | `DR-001: RESOLVED`。§6 の Profile-local security context と lifecycle invalidation が request、approval、authentication、unlock、authorization、wallet-core call、result validation、recipient / delivery へ及ぶことを確認した。 |
| `DR-002` | Major    | Resolved            | `interfaces-review-003` | `DR-002: RESOLVED`。§6.2 と §8 が Application / Signer、wallet-core、chain-specific integration の authority を分離し、公開 projection と internal reference を区別している。                                                    |
| `DR-003` | Critical | Resolved            | `interfaces-review-003` | `DR-003: RESOLVED`。§9.1 が4条件の肯定形 invariant、Signer authority、wallet-core call / success の前提および capability の非代替性を固定している。                                                                              |
| `DR-004` | Major    | Resolved            | `interfaces-review-003` | `DR-004: RESOLVED`。§6.4、§6.6、§7.6 および §9 が要求された failure semantics と result / delivery unknown の分離、自動再署名禁止を明記している。                                                                                |
| `DR-005` | Critical | Resolved            | `interfaces-review-003` | `DR-005: RESOLVED`。§6.3 と §9.2 が複数 request の独立性、cross-request reuse 禁止、Browser / Mobile の適用範囲および transport / SDK identifier の非authority を明記している。                                                  |
| `IF-001` | —        | Resolved / 再発なし | `interfaces-review-001` | Public account identity と Internal account reference の分離を §6.2 に確認した。回帰なし。                                                                                                                                       |
| `IF-002` | —        | Resolved / 再発なし | `interfaces-review-001` | `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN`、確定 failure および automatic re-sign prohibition を §6.4、§6.6、§9 に確認した。回帰なし。                                                                                               |
| `IF-003` | —        | Resolved / 再発なし | `interfaces-review-001` | Relay / node は Network authority ではなく untrusted / 補助情報であり、Signer / chain-specific integration が local context を確定することを §4.1、§4.2、§6.1 に確認した。回帰なし。                                             |

## 7. Required Changes

なし。Critical / Major の New、Open または Reopened finding はない。前回 `DR-001`〜`DR-005` はすべて Resolved である。

## 8. Optional Improvements

なし。今回の主目的に関係しない Minor / Nit の新規探索は行わず、採用した Minor finding もない。

## 9. Resolved Findings

### DR-001: RESOLVED

- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §4.1、§6、§6.3〜§6.4、§7〜§9。
- 確認できた事実: Application Profile と Profile Network は、公開 request / response field ではない Signer-local security context と定義されている（§6、行122〜135）。Application / Signer は Profile / Account association、active Profile、permission、Account selection を所有する（行126、§6.2）。同一 context には request、caller / source、session、permission、approval、Authentication、Signing-capable unlock、Account authorization、Account、Chain / Network、operation、target、freshness、wallet-core call、result、result validation、response recipient および delivery context が含まれる（行126〜131）。
- 失効条件: Profile switch、Profile lock、Profile context loss、Profile / Account association change、permission revoke、Account switch、Chain / Network change および caller / source context change が、影響する pending request、approval、authentication、authorization、result delivery context を失効させる（行133）。Profile A の context を Profile B へ流用せず、古い recipient へ配送しない。
- 根拠: 共通要件 `CR-016`、`CR-NFR-008`〜`CR-NFR-012`、Architecture §6.6 / §6.9、Security Design §10、Signing Flow §5 / §16 / §20、Profile / Account Specification §2 / §20、および Browser / Mobile Design の lifecycle / response binding。
- 問題・影響: 不足なし。SDK、Relay または public wire schema に Profile ID を要求せずに、Signer が自身の Profile-local context と request を binding できる設計になっている。
- 完了条件 / 再確認: request 受信から result delivery まで同じ Profile-local context が維持され、上記 context change 後に旧 authorization、approval、authentication、result または recipient を再利用しないことを確認した。`DR-001` は `Resolved` とする。

### DR-002: RESOLVED

- Severity: `Major`
- Target: [`interfaces.md`](../../design/interfaces.md) §3.4、§4.1、§5.1、§6.2、§7.4〜§7.5、§8。
- 確認できた事実: wallet-core は Software Key に対応する cryptographic public identity、public key、address、key identity、Store / secret processing および raw signing の authority である（行35〜37、§6.2 行164〜170）。Application / Signer は Application Profile における Account association、Account selection、display、permission、Account authorization および active Profile / Account context の authority である。chain-specific integration は expected signer、target、Chain / Network、address / public key と wallet-core identity の整合を検証する（§6.2）。
- 分離条件: `Account` は両者を検証済みで対応付けた public projection であり、Internal account reference は内部 context である（行172〜184）。外部 requester の Account self-declaration、internal key reference または wallet-core signing success は Account authorization の authority ではない（行170）。Symbol / NEM の Chain-specific Account / Key Identity を一つの共通秘密鍵 identity に統合しない（行195）。
- 根拠: 共通要件 `CR-013`、Profile / Account Specification §4 / §10 / §11、Chain Compatibility Specification §2〜§6、wallet-core requirements §2、wallet-core specification §2 / §3 / §9、および Binding decision。
- 問題・影響: 不足なし。Application Account の選択・認可と wallet-core identity の生成・署名が一意に分離され、選択した Account と実際の signer identity の整合を Signer / chain-specific integration が確認する。
- 完了条件 / 再確認: public Account projection、internal reference、Application authority、wallet-core authority および chain-specific validation の区別を実装者が推測せず読めることを確認した。`DR-002` は `Resolved` とする。

### DR-003: RESOLVED

- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.3、§7、§8、§9.1、§10。
- 確認できた事実: Signer は、同一 caller、Profile、Account、Chain / Network、operation、target および freshness context に対する次の4条件をすべて成立させ、署名直前に再確認した場合に限り、承認済み target を wallet-core へ渡し、result validation を通過した success result を生成できる（行388〜400）。条件は Authentication、Signing-capable unlock、対象 Profile / Chain / Network / Account に対する Account authorization、Explicit user approval である。
- 非代替条件: capability は support / availability / protocol compatibility のみを表し、authentication、unlock、authorization、approval または signing authority を意味しない。connection、permission、session、ordinary `UNLOCKED`、previous authentication、SDK / Provider state、Relay metadata / delivery、dApp self-declaration、wallet-core password / Store validation および wallet-core signing result も代替ではない（行397）。Signer / Application host が成立・再確認の authority である。
- 根拠: 共通要件 `CR-016`、Architecture §6.9、Security Design §7〜§9 / §17、Signing Flow §4 / §16 / §23、下流 interfaces / signing protocol の approval・authorization binding。
- 問題・影響: 不足なし。4条件または binding context が未成立、失効、locked、stale、unknown または不整合なら wallet-core call も success result も許可しない（行399）。
- 完了条件 / 再確認: 4条件が肯定形 invariant として統合され、成立責任が Signer にあり、4条件と signing context を確認できる場合だけ success を返すことを確認した。`DR-003` は `Resolved` とする。

### DR-004: RESOLVED

- Severity: `Major`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.4、§6.6、§7.6、§9。
- 確認できた事実: Error model は invalid request、unsupported、user rejected、cancelled、expired、authentication failure、Account authorization failure、permission failure、locked / signing-capable unlock failure、replay / duplicate、wallet-core failure、signing failure、transport failure、Relay failure、internal failure を個別の意味として記載している（行276〜300）。
- Unknown / retry 条件: `RESULT_UNKNOWN` は処理 outcome 自体を安全に確定できない状態、`DELIVERY_UNKNOWN` は request / response の delivery disposition を確定できない状態と定義され、互いおよび確定 failure と区別される（行300）。rejection と cancellation、expiry、authentication / authorization / locked、wallet-core / signing、transport / Relay も区別され、確定 failure、unknown のいずれも automatic re-sign の根拠にしない（行302）。
- 根拠: 共通要件 `CR-012`、`CR-NFR-010`〜`CR-NFR-012`、Signing Flow §20〜§22、Interfaces Specification §10、Signing Protocol §16 / §19。
- 問題・影響: 不足なし。下位 adapter が failure を arbitrary に畳み込み、result outcome と delivery outcome または rejection と cancellation を混同する余地を、基本設計の semantic contract が抑止している。具体 code / number / JSON schema は適切に下位へ委譲されている。
- 完了条件 / 再確認: 要求された全 semantic category と unknown 区分、automatic re-sign prohibition を確認した。`DR-004` は `Resolved` とする。

### DR-005: RESOLVED

- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.3、§6.4、§7、§8、§9.2。
- 確認できた事実: 各 `SigningRequest` は独立した security / lifecycle unit とされている。複数 request 間で、request identity、caller / source、Browser の tab / frame / document または Mobile の handoff source、session、permission、Profile、Account、Chain / Network、operation、target、freshness、approval、Authentication、Signing-capable unlock、Account authorization、wallet-core result、response recipient および delivery state を共有・合成・流用しない（行222〜230）。
- 適用範囲・非authority: Browser の複数 tab / frame と Mobile の複数 Deep Link / Relay handoff が同じ原則の対象である。request A の caller、Profile / Account、approval、authentication、authorization、target または result を request B に使わず、late / stale result を別 request や別 recipient へ返さない。requestId 単独、transport session、Relay generation または SDK instance は isolation の security authority ではない（行230、401〜403）。
- 根拠: Security Design §10.2、Signing Flow §4 / §7 / §23、Browser Extension Design §17、Mobile App Design §21、SDK Design §5.8 / §16、Relay Design §18。
- 問題・影響: 不足なし。transport や SDK の共通実体が存在しても、承認・認証・署名・結果・配送を request 間で合成する解釈を許さない共通 invariant になっている。
- 完了条件 / 再確認: 具体的な queue、lock、state machine または concurrency algorithm を要求せず、cross-request isolation と Browser / Mobile の対象範囲を設計原則として明記していることを確認した。`DR-005` は `Resolved` とする。

## 10. Deferred Findings

正式な Deferred finding はない。次の事項は本設計の責務・境界を維持する下位委譲または既存 OPEN であり、今回の Review Gate を阻害しない。

- API 名、function signature、公開 DTO / JSON schema、field type、wire encoding、protocol envelope。
- Browser API、Mobile OS handoff、wallet-core Binding の host integration、secret lifecycle、Relay HTTP / Redis schema、TTL、exact retry / lookup 契約。
- Symbol / NEM の transaction schema、canonical serialization、署名 byte、aggregate / multisig / cosignature、message serialization および transaction type ごとの表示詳細。
- Error code、番号体系、公開文言、timeout、retry count および具体的な adapter mapping。
- Mobile の実装、runtime、OS protection capability および release evidence の検証。現在のワークスペースに Mobile 実装がないことは対象本文にも明記されている。

これらの委譲は、Profile binding、Account authority、4条件 gate、semantic inspection、Relay opaque、secret isolation、failure distinction、concurrent isolation および fail-closed を弱めることを許容しない。

## 11. Scope and Traceability

| Interface responsibility                                        | 上流・関連根拠                                                                                                                           | 対象本文との追跡                                               | 判定                                                                                                                              |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Profile-local context と request〜delivery binding              | 共通要件 `CR-016`、`CR-NFR-008`〜`CR-NFR-012`、Architecture §6.6 / §6.9、Security §10、Signing Flow §16 / §20                            | §6 行122〜135、§6.3〜§6.4、§8、§9.2                            | 適合。Profile ID の公開要求なしに Signer-local context を維持する。                                                               |
| Application Account authority と wallet-core identity authority | 共通要件 `CR-013`、Architecture §6.6〜§6.8、Profile / Account Specification、wallet-core requirements / specification / Binding decision | §3.4、§6.2 行150〜195、§7.4〜§7.5、§8                          | 適合。public projection、internal reference、Application authority、wallet-core authority、chain-specific validation を分離する。 |
| 共通4条件 gate と capability の非代替性                         | 共通要件 `CR-016`、Architecture §6.9、Security §7〜§9、Signing Flow §4 / §16 / §23                                                       | §6.3 行216〜220、§7、§8 行370、§9.1 行388〜400、§10 行409〜415 | 適合。Signer が4条件を成立・再確認し、成立後だけ wallet-core / success に進める。                                                 |
| Error / failure semantics と result / delivery separation       | 共通要件 `CR-012`、`CR-NFR-010`〜`CR-NFR-012`、Signing Flow §20〜§22、Interfaces Specification §10、Signing Protocol §16 / §19           | §6.4 行232〜255、§6.6 行276〜302、§7.6、§9 行381〜386          | 適合。failure taxonomy、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` および automatic re-sign prohibition が揃う。                        |
| Concurrent request isolation                                    | Security Design §10.2、Signing Flow §4 / §7 / §23、Browser / Mobile / SDK Design の concurrency                                          | §6.3 行222〜230、§9.2 行401〜403                               | 適合。Browser の複数 tab / frame と Mobile の複数 handoff に適用し、algorithm は委譲する。                                        |
| SDK non-Signer / Relay opaque / wallet-core boundary            | 共通要件 `CR-013`、`CR-015`、Relay / SDK Requirements、Architecture §6.2 / §6.5 / §6.8                                                   | §4、§5、§7、§8、§9                                             | 適合。責任の逆流、secret boundary の弱体化、Relay / wallet-core の authority 混同はない。                                         |
| Chain / Network、Symbol / NEM separation                        | 共通要件 `CR-005`、`CR-NFR-005`、Profile / Account Specification、Chain Compatibility Specification                                      | §3.3、§4.1 行88、§6.1〜§6.2、§6.5                              | 適合。Relay / node は Network authority ではなく、chain-specific integration が照合する。                                         |
| Semantic inspection、trusted UI、blind signing prohibition      | 共通要件 `CR-002`〜`CR-004`、Security §8 / §14、Signing Flow §15                                                                         | §3.5〜§3.6、§5.1、§6.5、§7、§9                                 | 適合。summary は target から導出し、未解析・不一致は fail-closed とする。                                                         |

## 12. Domain Checks

| 評価項目                                                  | 判定 | 根拠                                                                                                                                                                            |
| --------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| システムコンテキスト、目的、範囲、対象外                  | Pass | §1〜§2 が SDK、Browser Extension、Mobile、Relay、chain-specific integration、wallet-core の対象と Mobile 未実装状態、Design フェーズ境界を明示する。                            |
| dApp / SDK / Provider / Content Script の責務             | Pass | §4、§5.1、§7.1〜§7.2 が非署名・非承認・非秘密境界を維持する。                                                                                                                   |
| Browser / Mobile Signer の責務                            | Pass | §4、§7.2〜§7.5 が caller、Profile、approval、authentication、inspection、signing orchestration を Signer に置く。                                                               |
| Relay opaque boundary                                     | Pass | §4.1〜§4.2、§5.1、§7.3 が Relay を構造・配送のみに限定し、意味解釈・承認・署名・Network authority を禁止する。                                                                  |
| wallet-core secret / raw signing boundary                 | Pass | §3.4、§4.2、§5.1、§7.4〜§7.5、§8 が Store、secret processing、cryptographic identity、raw signing の authority と host の責務を分離する。                                       |
| Profile-local binding / lifecycle invalidation            | Pass | §6 行122〜135、§8、§9.2 が Profile Network を含む context の request〜delivery binding と指定された失効条件を定める。                                                           |
| Account authority separation                              | Pass | §6.2 行150〜195 が Application / Signer、wallet-core、chain-specific integration、public projection、internal reference および外部 self-declaration の関係を固定する。          |
| Chain / Network、Symbol / NEM separation                  | Pass | §3.3、§6.1〜§6.2、§6.5 が Chain と Network を分離し、Symbol / NEM の chain-specific identity / semantics を共通規則へ統合しない。                                               |
| Semantic inspection / trusted UI / target-derived summary | Pass | §3.6、§5.1、§6.5、§7.2〜§7.5 が target からの導出、trusted UI、payload / summary 不一致時の fail-closed および blind signing prohibition を定める。                             |
| 共通4条件 gate                                            | Pass | §9.1 が4条件、Signer authority、wallet-core call / success の前提、same-context binding および capability 等の非代替性を肯定形で定める。                                        |
| Error / failure semantics                                 | Pass | §6.4、§6.6、§7.6、§9 が全要求カテゴリ、rejection / cancellation、expiry、auth / authorization / locked、wallet-core / signing、transport / Relay、internal failure を区別する。 |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`                     | Pass | §6.4 行241〜245、§6.6 行300〜302、§9 が result outcome と delivery disposition を分離し、再署名・推測変換を禁止する。                                                           |
| Replay / freshness / duplicate / automatic fallback       | Pass | §3.5、§6.3 行218〜230、§6.4 行243〜245、§9、§10 が stale / duplicate / replay の拒否、fresh context および fallback / re-sign prohibition を定める。                            |
| Concurrent requests                                       | Pass | §6.3 行222〜230 と §9.2 が全列挙 context の独立保持、cross-request reuse prohibition、Browser / Mobile 適用および transport / SDK identifier の非authorityを定める。            |
| Secret isolation / fail-closed                            | Pass | §3.4〜§3.5、§5.1、§7、§9 が秘密情報の非公開、未検証入力の拒否、解析不能・不整合時の安全側終了を維持する。                                                                       |
| Traceability / downstream implementability                | Pass | §2、§11〜§14 と traceability table が上流根拠・下流委譲を分離し、API / schema / wire / crypto の不足を本設計の finding にしていない。                                           |
| Design フェーズ境界                                       | Pass | §2、§11、§12 が exact API、schema、wire、error code、crypto、byte、algorithm、class、UI を下位へ委譲している。                                                                  |

## 13. Validation Results

- Prettier / Markdown format: `pnpm exec prettier --write docs/reviews/design/interfaces-review-004.md` および `pnpm exec prettier --check docs/reviews/design/interfaces-review-004.md` — `PASS`。
- Git whitespace: `git diff --check` および staged artifact に対する `git diff --cached --check` — `PASS`。
- Markdown link: review artifact の相対リンクと、対象本文から参照する既存資料の存在を確認 — `PASS`。
- Finding ID duplicate: 本成果物内の `DR-001`〜`DR-005`、`IF-001`〜`IF-003` の status table / finding heading に重複なし — `PASS`。
- Review section order: 共通 output format の17章が指定順序で存在 — `PASS`。
- Review Gate / finding status consistency: `READY`、Critical / Major の Required Changes が空、`DR-001`〜`DR-005` がすべて `Resolved`、全 gate が Pass — `PASS`。
- Changed files: review 成果物以外が変更されていないことを `git status`、diff および commit 内容で確認 — `PASS`。
- Source lint / typecheck / test / build: source code を変更しないため実行しない。`Not validated` とする。

## 14. Review Gates

| Gate                                         | 判定 | 根拠                                                                                                                                                                    | 対応 ID                                                                        |
| -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1. Purpose / scope                           | Pass | §1〜§2 が共通 Interface Design の目的、対象、Mobile 未実装状態、対象外および Design フェーズ境界を明示する。                                                            | —                                                                              |
| 2. Context / responsibility / trust boundary | Pass | Profile-local context、Application / Signer、Relay、wallet-core、SDK、trusted UI および secret boundary が分離されている。                                              | `DR-001: RESOLVED`、`DR-002: RESOLVED`、`DR-003: RESOLVED`                     |
| 3. Dependency direction                      | Pass | SDK / dApp / Provider / Relay は Signer authority を代替せず、chain-specific integration と wallet-core の責務も逆流していない。                                        | —                                                                              |
| 4. Major flows / failure / concurrency       | Pass | request〜approval〜authentication〜unlock〜wallet-core〜result〜delivery の同一 context、failure semantics、unknown および concurrent isolation が確認できる。          | `DR-001: RESOLVED`、`DR-003: RESOLVED`、`DR-004: RESOLVED`、`DR-005: RESOLVED` |
| 5. Data ownership                            | Pass | Application Profile / Account、wallet-core Software Key identity / Store / secret、chain-specific validation の owner が明確である。                                    | `DR-001: RESOLVED`、`DR-002: RESOLVED`                                         |
| 6. Security / interoperability               | Pass | 4条件 gate、capability 非代替性、secret isolation、semantic inspection、blind signing prohibition、Chain / Network、Symbol / NEM、Relay opaque が維持されている。       | `DR-001: RESOLVED`、`DR-002: RESOLVED`、`DR-003: RESOLVED`                     |
| 7. Upstream consistency                      | Pass | 要件 `CR-012`、`CR-013`、`CR-015`、`CR-016`、`CR-NFR-008`〜`CR-NFR-012` と上位 Design / 下流仕様の重大な矛盾がない。                                                    | `DR-001: RESOLVED`〜`DR-005: RESOLVED`                                         |
| 8. Downstream implementability               | Pass | Profile binding、Account authority、4条件 gate、failure semantics、concurrent isolation の最低条件が推測なしに下流へ渡り、exact API / schema 等は適切に委譲されている。 | `DR-001: RESOLVED`〜`DR-005: RESOLVED`                                         |

全8ゲートに不合格はなく、品質ゲートを阻害する Critical / Major finding はない。

## 15. Remaining Risks and Open Decisions

- `interfaces.md` §13 に記載された SDK の具体契約、Mobile の受信・OS integration、Relay の具体 protocol、wallet-core の host integration、Symbol / NEM の対応範囲および下流の error mapping は、各正本で引き続き確定する必要がある。
- 現在のワークスペースに Mobile App の実装はなく、本レビューは Mobile 設計の責任境界を確認したもので、Mobile runtime / E2E の完了を意味しない。
- 上記は本 Interface Design の gate failure ではない。ただし下流実装・仕様化で Profile-local binding、4条件 gate、failure distinction、concurrent isolation、Relay opaque および wallet-core boundary を弱めないことが前提である。
- IF-001、IF-002、IF-003 の回帰は確認されず、再オープンすべき過去 finding はない。

## 16. Automatic Changes

なし。レビュー中に [`docs/design/interfaces.md`](../../design/interfaces.md)、その他の設計本文、仕様、source code、test、設定を変更していない。変更対象は本レビュー成果物のみである。

## 17. Final Decision

`READY`

`DR-001`〜`DR-005` はすべて `RESOLVED`、`IF-001`〜`IF-003` の再発はなく、新規 Critical / Major finding および重大な trust boundary 回帰もない。Profile-local binding、Account authority separation、共通4条件 gate、Error / Failure semantics、Concurrent request isolation が共通 Interface Design へ統合され、Interfaces Design を `READY` と判断できる。
