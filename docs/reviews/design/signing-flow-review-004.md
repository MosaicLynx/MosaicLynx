# MosaicLynx Signing Flow Design Review 004

## 1. Review Target

- 対象: [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- 前回レビュー: [`signing-flow-review-003.md`](./signing-flow-review-003.md)
- Review ID: `signing-flow-review-004`
- 確認日: 2026-08-27
- 種別: `design-review` Skill による Signing Flow 再レビュー
- Review Result: `READY`
- 変更範囲: 本レビュー成果物のみ。対象設計、要件、仕様、ADR、wallet-core、実装、テストおよび過去レビューは変更していない。
- 主目的: 前回 `DR-SF-001`〜`DR-SF-006` の修正確認、過去 `SDR-001`〜`SDR-004` の再発確認、および修正に伴う新規 Critical / Major 回帰の確認。
- 主な確認範囲: Signer の責任境界、共通4条件、Profile binding、request / approval / authentication / signing / result binding、lifecycle、結果対応、concurrent request isolation、automatic fallback 禁止、semantic inspection、Aggregate / cosignature、wallet-core、SDK、Relay、Trust Boundary、fail-closed、traceability および OPEN の範囲。
- Design フェーズ境界: exact API、function signature、DTO / JSON schema、wire format、exact state enum、timeout / retry 値、DB / Redis schema、cryptographic parameter、OS API、implementation class、具体的 concurrency algorithm および UI layout の不足は finding としていない。
- 未確認範囲: ソースコードの実装適合性、実行時の暗号学的正しさ、Mobile 未実装部分の実装品質、wallet-core Binding の host integration 実装および下位仕様の具体契約。これらは責任境界、用語、binding、lifecycle、traceability および明白な矛盾の確認に限って参照した。
- 判定方針: 前回の `REVISE DESIGN` および過去の `READY` は今回の判定へ継承せず、現行の `docs/design/signing-flow.md` を根拠に判定した。

## 2. Execution Audit

最新の `design-review` Skill、共通 review playbook、reviewers、review gates、output format、`.agents/project-context.md` および `AGENTS.md` を確認した。サブエージェントは使用せず、playbook の Reviewer A〜D を同一資料に対する独立した自己レビューの4パスとして実施し、結論を統合した。

| Path                          | 独立した確認観点                                                                                                                                                                                          | 結果                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: structure / responsibility | Signer、Browser Extension、Mobile App、SDK、Relay、wallet-core、Chain integration の責務、依存方向、Profile / Account の所有境界                                                                          | Browser Extension privileged layer / Mobile trusted host が共通署名ゲートの owner であり、SDK / Relay / wallet-core への責任逆流はない。Profile-bound Account / Wallet Core context の内部 binding も確認できた。 |
| B: security / trust boundary  | Authentication、Signing-capable unlock、Account authorization、Explicit user approval、trusted UI、semantic inspection、TOCTOU、secret、fail-closed、Chain / Network                                      | 4条件の独立 gate、代替不可条件、署名前再確認、結果時点の gate context、Relay opaque boundary、wallet-core non-Signer boundary が成立している。                                                                    |
| C: flow / operations          | lifecycle、restart / state loss、result unknown、delivery unknown、expiry、replay、duplicate、concurrent request、cancel、retry、fallback、result delivery                                                | 各 request の独立 context、terminal state の再利用禁止、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の分離、security failure 後の自動 fallback 禁止および fresh retry 条件を確認した。                                  |
| D: traceability / downstream  | Concept / Requirements、Architecture、Security Design、Interfaces、platform design、Signing Protocol、handoff、Profile / Account、Chain Compatibility、wallet-core 契約、SDK-OPEN-007 の owner と委譲境界 | `DR-SF-001`〜`DR-SF-006` の完了条件が現行本文へ追跡できる。`SDK-OPEN-007` は公開契約の詳細だけを OPEN とし、Signer authority を未決へ戻していない。                                                               |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 使用目的                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)                                                                                                                                                                                                                                                                                                                                                   | 変更範囲、Source of Truth、Mobile の未実装扱い、検証、文書・レビュー成果物およびプロジェクト固有の責任境界を確認                                                                    |
| [`design-review SKILL.md`](../../../.agents/skills/design-review/SKILL.md)、[review playbook](../../../.agents/skills/review-common/review-playbook.md)、[reviewers](../../../.agents/skills/design-review/reviewers.md)、[review gates](../../../.agents/skills/design-review/review-gates.md)、[output format](../../../.agents/skills/design-review/output-format.md)、[common output format](../../../.agents/skills/review-common/output-format.md) | 独立レビューの4観点、finding の状態・重大度、成果物構成、Review Gate および Git 運用を確認                                                                                          |
| [`docs/design/signing-flow.md`](../../design/signing-flow.md)                                                                                                                                                                                                                                                                                                                                                                                            | Review target。§2〜§27 の責任境界、4条件、Profile / Account binding、lifecycle、結果対応、concurrency、fallback、Aggregate / cosignature、OPEN および下流委譲を確認                 |
| [`signing-flow-review-003.md`](./signing-flow-review-003.md)                                                                                                                                                                                                                                                                                                                                                                                             | `DR-SF-001`〜`DR-SF-006` の初出内容、完了条件および今回の状態判定対象を確認。前回の判定は今回へ継承していない                                                                       |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                                                                                                                                                        | Signer、Relay、明示承認、認証・lock・Account authorization、秘密情報分離、Symbol / NEM および Mainnet / Testnet の上流方針を確認                                                    |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)                                                                                                                                                                                                                                                                                                                                                                                | `CR-010`、`CR-011`、`CR-013`、`CR-015`、`CR-016`、`CR-NFR-001`、`CR-NFR-005`、`CR-NFR-008`〜`CR-NFR-013`、`CR-AC-017`〜`CR-AC-019` を確認                                           |
| [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                                                                                                                                                                                      | Browser observed caller、permission、Profile / Account / Chain / Network、trusted UI、lifecycle、再認証および wallet-core 境界を確認                                                |
| [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)                                                                                                                                                                                                                                                                                                                                                                                    | Mobile trusted host、handoff、Profile / Account、lock / authentication、OS lifecycle、concurrent request、failure recovery および wallet-core 境界を確認                            |
| [`docs/requirements/relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                                                                                                                                                              | Relay の opaque delivery、structural validation、generation、stale / duplicate / state loss、secret non-exposure および Signer 非担当範囲を確認                                     |
| [`docs/requirements/sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                                                                                                                                                                                                                                  | SDK の非特権境界、caller / Origin authority、correlation、transport fallback 禁止、結果対応および `SDK-OPEN-007` の公開契約 scope を確認                                            |
| [`docs/design/architecture.md`](../../design/architecture.md)                                                                                                                                                                                                                                                                                                                                                                                            | Browser / Mobile の Signer owner、§6.9 の共通4条件、wallet-core boundary、依存方向、主要フローおよび下流委譲を確認                                                                  |
| [`docs/design/security-design.md`](../../design/security-design.md)                                                                                                                                                                                                                                                                                                                                                                                      | Trust Boundary、lock / authentication、approval、Profile / Account binding、replay / concurrent isolation、fail-closed および security invariant を確認                             |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                                                                                                                                                                                | request / response の概念 binding、Profile の内部境界、Signer authority、result validation、SDK / Relay / wallet-core の責任分界を確認                                              |
| [`docs/design/browser-extension.md`](../../design/browser-extension.md)                                                                                                                                                                                                                                                                                                                                                                                  | Browser privileged layer、observed caller、permission、trusted UI、Profile / Account、lifecycle および request isolation を確認                                                     |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                                                                                                                                                                | Mobile trusted host、handoff、Profile / Account、authentication、concurrent request、lifecycle loss、Aggregate / cosignature および fail-closed を確認                              |
| [`docs/design/relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                                                                                                                                                                          | Relay の opaque boundary、session / generation、delivery failure、state loss、concurrency、retry および Signer 非担当範囲を確認                                                     |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                                                                                                                                                              | SDK の request / result correlation、Signer 非代替、caller authority、fallback、retry および OPEN の境界を確認                                                                      |
| [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)                                                                                                                                                                                                                                                                                                                                                                    | 下流の authorization binding、state、every-signature authentication、result / delivery semantics、Aggregate / cosignature、fail-closed を確認                                       |
| [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                                                                                                                                                                                            | Browser / Mobile / Relay handoff、transport selection、concurrent request、retry、fallback、generation および opaque boundary を確認                                                |
| [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)                                                                                                                                                                                                                                                                                                                                                            | Profile Network、Chain-specific Account / Key Identity、Profile association、`every-signature` authentication、unlock 分離および lifecycle を確認                                   |
| [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)                                                                                                                                                                                                                                                                                                                                                    | Symbol / NEM、Mainnet / Testnet、Chain-specific Account / Key Identity、transaction semantics および target inspection の境界を確認                                                 |
| [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)、[`docs/specifications/product-spec.md`](../../specifications/product-spec.md)                                                                                                                                                                                                                                                                                                 | 公開 request / response の Profile 非公開境界、result correspondence、Provider / platform の下流契約および署名可否の整合を確認                                                      |
| [`_snwc/README.md`](../../../_snwc/README.md)、[wallet-core requirements](../../../_snwc/docs/requirements/requirements.md)、[wallet-core specification](../../../_snwc/docs/specifications/specification.md)、[Binding decision](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                                               | Wallet Store、Profile password、raw signing、blind signing prevention、Application-level approval / authentication 非担当、WASM / Native Binding の固定範囲および host 側責務を確認 |

## 4. Review Result

**Review Gate: `READY`**

`DR-SF-001`〜`DR-SF-006` は、現行の Signing Flow 本文でそれぞれの完了条件を満たしており、すべて `RESOLVED` と判定する。Browser Extension privileged layer と Mobile App trusted host が共通署名ゲートの owner であり、Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件が transaction、message、Aggregate、cosignature を含む flow 全体へ適用される。

Profile は公開 wire field ではなく Signer 内部の security context として request、approval、authentication、signing、result に binding され、Profile Network、Chain-specific Account / Key Identity および Wallet Core context の対応、switch / lock / association change による失効が明示されている。結果返却時の signing-time gate context、request isolation、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の分離、security failure 後の automatic fallback 禁止および fresh retry も確認できる。

過去 `SDR-001`〜`SDR-004` の再発、新規 Critical / Major finding、Trust Boundary・wallet-core responsibility・SDK non-Signer boundary・Relay opaque boundary・semantic inspection・trusted UI・blind signing prohibition・replay / duplicate・lifecycle loss・fail-closed の重大回帰は確認されなかった。

## 5. Summary

- `DR-SF-001`: `RESOLVED`。§2.1、§4、§7、§8、§9、§10、§11、§14、§16、§20、§22、§23、§25 が、4条件の独立性、Signer owner、各 operation への共通適用、署名前再確認、結果返却条件、fail-closed および外部主体による迂回禁止を一貫して定める。
- `DR-SF-002`: `RESOLVED`。§3、§5、§7、§15、§16、§18、§19、§20、§23 が Profile を Signer-local security context として固定し、Profile Network、Chain-specific Account / Key Identity、Wallet Core context、Profile A / B の流用禁止、変更時失効および公開 wire field 非要求を定める。
- `DR-SF-003`: `RESOLVED`。§7.2、§7.3、§7.4、§20.1〜§20.3 が、request、caller、Profile、Account、Chain / Network、operation、exact target、signing-time 4条件および approval context を安全に帰属できる場合だけ success とし、context loss / unknown / stale / revoked / locked / mismatch では success を返さない。
- `DR-SF-004`: `RESOLVED`。§4、§16、§18、§19、§23 が、複数 active request の request identity、source、session、Profile、Account、Chain / Network、operation、target、inspection、approval、authentication、result / response channel の独立性と implicit integration / batch の禁止を定める。
- `DR-SF-005`: `RESOLVED`。§7.2、§9、§21、§22、§23 が、指定された security failure 全般の後の別 transport / Provider / Signer route への automatic fallback を禁止し、明示的再試行に fresh user activation、request、validation、4条件および approval を要求する。
- `DR-SF-006`: `RESOLVED`。§26 の `SDK-OPEN-007` は caller / Origin context の要求・伝播・correlation、transport representation、version、API detail の公開契約だけを OPEN とし、Signer の最終 caller verification authority を固定している。
- 過去 `SDR-001`〜`SDR-004`: いずれも `RESOLVED` 相当で、permission / capability binding、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、one-time signing operation、Aggregate / cosignature の全体 inspection に再発はない。
- 今回初出の正式 finding はない。Minor / Nit の新規探索はレビュー範囲を拡大しないため行っていない。

## 6. Finding Status

| ID          | Severity | Status     | 初出レビュー              | 今回の状態根拠                                                                                                                                                                                                                                                                 |
| ----------- | -------- | ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DR-SF-001` | Critical | `RESOLVED` | `signing-flow-review-003` | 4条件の独立 gate、両 Signer owner、`AWAITING_USER → AUTHORIZED`、`AUTHORIZED → SIGNING` 前の再確認、各 operation、success result、failure、代替不可条件および外部主体の迂回禁止を確認。                                                                                        |
| `DR-SF-002` | Critical | `RESOLVED` | `signing-flow-review-003` | Profile を Signer 内部 context として Profile Network、Chain-specific Account / Key Identity、Wallet Core context、approval / auth / result および変更時失効へ binding。公開 SigningRequest / SDK / Relay に profileId を追加していない。                                      |
| `DR-SF-003` | Major    | `RESOLVED` | `signing-flow-review-003` | success の条件に signing-time 4条件と approval context を含め、context loss / unknown / stale / revoked / locked / mismatch で success を返さない。`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を分離。                                                                             |
| `DR-SF-004` | Major    | `RESOLVED` | `signing-flow-review-003` | 複数 active request の全 security context と result / response channel を独立させ、Browser tab / frame、Mobile Deep Link / Relay handoff、implicit approval integration を共通 invariant 化。                                                                                  |
| `DR-SF-005` | Major    | `RESOLVED` | `signing-flow-review-003` | 指定された user rejection、locked、authentication / unlock / Account authorization / permission、caller / integrity / replay / duplicate / inspection、Chain / Network mismatch、security mismatch、`RESULT_UNKNOWN` の後の automatic fallback 禁止と fresh retry 条件を確認。 |
| `DR-SF-006` | Major    | `RESOLVED` | `signing-flow-review-003` | `SDK-OPEN-007` を公開契約の詳細へ限定し、Browser observed caller / Origin、Mobile verified handoff context、Signer 最終責任、外部自己申告の非 authority および SDK 非代替を OPEN 外として固定。                                                                                |

今回初出の正式 finding はない。正式 finding heading の重複もない。

## 7. Required Changes

なし。Critical / Major の `New`、`Open` または `Reopened` finding はない。

## 8. Optional Improvements

なし。今回の依頼は前回 finding の再確認と重大回帰確認を主目的とし、Minor / Nit の新規探索を行っていない。

## 9. Resolved Findings

### DR-SF-001: RESOLVED — 共通署名ゲートの4条件

- 対象箇所: `signing-flow.md` §2.1、§2.2、§3、§4、§7.1〜§7.3、§8、§9、§10、§11、§13、§14、§16、§17、§18、§19、§20、§22、§23、§25。
- 確認できた事実: Browser Extension と Mobile App が Signer であり、両者が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を独立した4条件として成立・再確認する。`AWAITING_USER → AUTHORIZED` は4条件すべてを要求し、`AUTHORIZED → SIGNING` 前にも4条件を再確認する。Transaction、Aggregate、cosignature、NEM multisig および message の各 flow に同じ gate が適用される。success result も署名時の4条件と approval context の安全な帰属を要求する。
- 既存の根拠: 共通要件 `CR-016`、`CR-AC-017`、Architecture §6.3、§6.4、§6.9、Security Design §7〜§8、Signing Protocol §8および§22。
- 問題と影響: 前回の「4条件が承認・署名成立条件として一体化されていない」問題は、現行本文では解消されている。未成立、locked、unknown、stale、revoked または mismatch では署名・success result を返さず、connection、permission、capability、session、単なる `UNLOCKED`、過去の authentication、wallet-core password / Store validation および Relay delivery success を代替にしない。
- 必要な最小修正または確認: 現行の §4、§7、§16、§20、§22、§23 による共通 gate と owner の維持。
- 完了条件または再確認方法: 両 Signer が gate owner として一意に記載され、`AWAITING_USER → AUTHORIZED`、`AUTHORIZED → SIGNING`、`SIGNING → SUCCEEDED`、各 operation および failure semantics に4条件が追跡できること。現行本文で充足している。

### DR-SF-002: RESOLVED — Profile の内部 security context binding

- 対象箇所: `signing-flow.md` §3、§5、§7.1〜§7.3、§9、§14、§15、§16、§18、§19、§20、§23、§25、§26。
- 確認できた事実: Profile は公開 field ではなく Signer 内部 context であり、Profile Network、Chain-specific Account / Key Identity および Wallet Core context を一意に解決する。request、caller、session、Profile、Account、Chain、Network、operation、target の関係が論理 model と Authorization tuple に含まれ、approval、authentication、signing、result にわたり同じ Profile context を使う。Profile switch、lock、association change、Account / Chain / Network switch は旧 Authorization を失効させ、Profile A の状態を Profile B に流用しない。
- 既存の根拠: 共通要件 §4.2、`CR-013`、`CR-016`、Browser Extension 要件 BR-003、BR-008、BR-011、Mobile App 要件 MR-005〜MR-007、Profile / Account Specification §10、§20、§26。
- 問題と影響: 前回の「Profile が request / approval / authentication / signing / result binding と変更時失効条件から欠落している」問題は解消されている。公開 SigningRequest、SDK API または Relay envelope への `profileId` 追加を要求せず、Signer-local な resolution と binding を維持している。
- 必要な最小修正または確認: Profile の内部 binding、Profile Network の固定、Chain-specific Account / Key Identity と Wallet Core context の一意性、切替・lock・association change 時の失効を下位仕様が維持すること。
- 完了条件または再確認方法: request から result まで Profile を含む context tuple を追跡でき、Profile A の approval / auth / result を Profile B に流用できないこと、公開 wire field を増やさずに実装へ引き渡せること。現行本文で充足している。

### DR-SF-003: RESOLVED — success result の signing-time context

- 対象箇所: `signing-flow.md` §7.1〜§7.4、§20.1〜§20.3、§21、§22、§23。
- 確認できた事実: `SIGNING → SUCCEEDED` は Wallet Core の成功だけでなく、request、caller、Profile、Account、Chain / Network、operation、target、signer、signed payload、Aggregate / multisig parent または message context、署名時の4条件および approval context の対応確認を要求する。結果 context が lost、unknown、stale、revoked、locked または mismatch の場合は success としない。
- 既存の根拠: 共通要件 `CR-006`、`CR-NFR-012`、`CR-AC-004`、`CR-AC-017`、Architecture §6.9、Security Design §15、Interfaces §6.4。
- 問題と影響: 前回の「cryptographic result と target の対応だけで success を返せる」問題は解消されている。Signer が gate context を安全に帰属できない場合に success result を返す余地は現行本文から除かれている。
- 必要な最小修正または確認: success result の内部 validation に signing-time 4条件と approval context を維持し、context を確認できない場合は success とせず、自動再署名もしないこと。
- 完了条件または再確認方法: `SIGNING → SUCCEEDED`、Result validation、Response、`DELIVERY_UNKNOWN` を確認し、署名生成の成否不明と配送成否不明を混同しないこと。現行本文では `RESULT_UNKNOWN` は署名生成自体に限定され、確定済み result の配送失敗は `DELIVERY_UNKNOWN` とされている。

### DR-SF-004: RESOLVED — Concurrent request isolation

- 対象箇所: `signing-flow.md` §4、§5、§7.3、§15、§16、§18、§19、§20、§21、§23。
- 確認できた事実: 複数 active request は独立した security context として扱い、request identity、caller / source、session、Profile、Account、Chain / Network、operation、target、semantic inspection、approval、authentication および result / response channel を共有・統合しない。Browser の複数 tab / frame と Mobile の複数 Deep Link / Relay handoff が明示対象であり、複数 target の batch signing と implicit integration も禁止される。
- 既存の根拠: Security Design §10.2、Mobile Design §21、Web Transaction Handoff Specification §5.3、共通要件 `CR-NFR-009`、`CR-NFR-011`、`CR-AC-013`、`CR-AC-014`。
- 問題と影響: 前回の「同時 request の最低限の独立性が共通 Flow に固定されていない」問題は解消されている。1 request の approval、authentication、inspection、target または result channel が別 request へ流用される余地を、設計 invariant として閉じている。
- 必要な最小修正または確認: 各 active request の context と channel の独立性、同時 request の implicit approval integration 禁止を維持する。queue、mutex、parallel algorithm、fairness、同時数および UI の具体方式は下位へ委譲する。
- 完了条件または再確認方法: Browser tab / frame、Mobile Deep Link / Relay handoff の複数 request について、request ごとの identity、approval / auth / inspection / result binding が独立していることを確認し、現行本文で充足している。

### DR-SF-005: RESOLVED — security failure 後の automatic fallback 禁止

- 対象箇所: `signing-flow.md` §2.3、§7.2、§8、§9、§14、§21、§22、§23、§26。
- 確認できた事実: user rejection、locked、Authentication failure、Signing-capable unlock failure、Account authorization failure、permission failure、caller mismatch、integrity failure、replay / duplicate failure、semantic inspection failure、Chain / Network mismatch、security-relevant context mismatch および `RESULT_UNKNOWN` の後に、別 transport、Provider または Signer route へ automatic fallback して署名を試みない。明示的再試行は fresh user activation、fresh request、fresh validation、fresh Authentication、fresh Signing-capable unlock、fresh Account authorization、fresh Explicit user approval を伴う新しい flow である。
- 既存の根拠: Architecture §5.2、SDK Requirements §6、§11、Web Transaction Handoff Specification §6、Signing Protocol §19、共通要件 `CR-007`、`CR-012`、`CR-AC-007`、`CR-AC-015`。
- 問題と影響: 前回の「security decision の拒否・失敗・不明を alternate route が迂回できる」問題は解消されている。transport recovery を理由に caller、認証、承認、freshness または署名結果不明の境界を自動的に越えない。
- 必要な最小修正または確認: automatic fallback と signing retry を禁止し、利用者が明示的に開始する fresh flow の条件を維持する。transport 選択順序、Provider discovery および retry algorithm の詳細は下位へ委譲する。
- 完了条件または再確認方法: 指定された全 security failure の後に同一要求を別 route へ自動送信・署名しないこと、明示再試行が全 fresh 条件を満たすことを確認し、現行本文で充足している。

### DR-SF-006: RESOLVED — `SDK-OPEN-007` の scope

- 対象箇所: `signing-flow.md` §2.1、§2.3、§5、§9、§18、§19、§20、§23、§25、§26。
- 確認できた事実: `SDK-OPEN-007` に残るのは SDK が caller / Origin context を要求・伝播・correlate する公開契約、correlation、transport-specific representation、version および API detail である。caller verification の最終責任は Signer にあり、Browser observed caller / Origin は Browser privileged layer、Mobile verified handoff context は Mobile trusted host が authority とする。SDK、Provider、dApp、Relay の自己申告値は trusted caller authority ではなく、SDK は Signer の検証を代替しない。
- 既存の根拠: SDK Requirements `SDK-SEC-004`、`SDK-OPEN-007`、SDK Design §11〜§12、Architecture §6.9、Interfaces §7、Web Transaction Handoff Specification §7。
- 問題と影響: 前回の「OPEN が Signer authority まで未決に見える」問題は解消されている。公開 API / transport の未決を残したままでも、caller authority、検証 owner および SDK non-Signer boundary は一意に読める。
- 必要な最小修正または確認: `SDK-OPEN-007` の authority boundary を維持し、下流公開契約の決定時に observed / verified context を自己申告値へ置換しないこと。
- 完了条件または再確認方法: §26 の OPEN scope と §2、§9、§18、§19、§23 の authority が一致し、下流が SDK を caller verification の代替として解釈できないこと。現行本文で充足している。

## 10. Deferred Findings

現在の対象本文に残る正式な Deferred finding はない。以下は、設計本文が明示的に下位仕様・実装・運用へ委譲しており、今回の Design finding としない未決事項である。

- SDK の exact API、caller / Origin context の公開要求方法、伝播・correlation、transport-specific representation、version、公開 operation scope および error field。
- Browser message、Provider contract、Storage、Service Worker lifecycle、Mobile OS API、Deep Link / App Link、platform UI、Binding host integration および具体的な lifecycle implementation。
- Relay の E2E encryption、HTTP / Redis、generation、TTL、endpoint、storage、retention、credential、delivery lookup / resend および retry interval。
- Wallet Core の Rust / Binding API、host integration、秘密 byte lifecycle、error mapping および migration。ただし wallet-core の Wallet Store、secret processing、raw signing の責任と、Application-level の Authentication、Signing-capable unlock、Account authorization、Explicit user approval 非担当は固定されている。`_snwc` の WASM `wasm-bindgen` / Native C ABI の Binding 方式の決定も未決へ戻されていない。
- Symbol / NEM の schema、type / version、serialization、hash、signature bytes、対応 scope および fixture。Aggregate / cosignature / NEM multisig の全体 inspection、no blind signing および共通4条件は委譲条件ではなく現行設計で固定されている。
- `RESULT_UNKNOWN` 後の既存 result の照会・再配送契約、platform confirmation model の受け入れ条件、Mobile Sensitive UI の具体 policy。

これらは exact API、schema、wire format、cryptographic parameter、OS API または concrete algorithm を Design 本文へ逆流させる根拠にならない。OPEN を理由に common signing gate、Profile binding、concurrent isolation、Relay opaque boundary、SDK non-Signer boundary、blind signing prohibition または fail-closed を弱めてはならない。

## 11. Scope and Traceability

| 上流要求・境界                                                        | 現行 Signing Flow の対応                                                                                                                                                                    | 下流・owner                                                                                                                                                       | 判定                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `CR-016`、`CR-AC-017`、Architecture §6.9 の共通署名 gate              | §2.1、§3、§4、§7、§8、§9、§14、§16、§20、§22、§23、§25。4条件、owner、pre-sign、result、failure、代替不可および迂回禁止を記載                                                               | Browser Extension privileged layer / Mobile trusted host。Authentication / unlock / Account authorization の詳細は platform / Profile 下流へ委譲                  | Pass。`DR-SF-001`                  |
| `CR-005`、`CR-NFR-005`、Profile / Account 要件                        | §5、§9、§10〜§14、§15、§16、§18〜§20、§23〜§24。Profile Network、Chain-specific Account / Key Identity、Chain / Network、Aggregate / multisig を分離                                        | Profile / Account Specification、Chain Compatibility、Chain integration。owner は Signer / Application と各 Chain integration                                     | Pass。`DR-SF-002` および `SDR-004` |
| `CR-006`、`CR-NFR-012`、Interfaces result contract                    | §7.3〜§7.4、§20。request、caller、Profile、Account、Chain / Network、operation、target、4条件、approval context、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を対応付け                           | Signer が result validation、SDK / dApp が independent verification、handoff が delivery contract を担当                                                          | Pass。`DR-SF-003`                  |
| Security Design §10.2、Mobile Design §21、handoff concurrency         | §4、§15、§16、§18、§19、§23。全 context、inspection、approval、authentication、result channel の request 単位 isolation、Browser / Mobile の複数 request、batch / implicit integration 禁止 | Browser / Mobile Signer。queue、mutex、parallel processing、fairness、上限および UI は下位へ委譲                                                                  | Pass。`DR-SF-004`                  |
| Architecture §5.2、SDK Requirements §6 / §11、handoff §6              | §7.2、§8、§9、§14、§21〜§23。security failure 後の automatic fallback を禁止し、明示 retry に fresh conditions を要求                                                                       | SDK / Provider / platform transport は Signer の decision を迂回しない。具体的な transport selection / retry は下流                                               | Pass。`DR-SF-005`                  |
| SDK Requirements `SDK-OPEN-007`、Architecture caller authority        | §2.3、§5、§9、§18、§19、§23、§26。Browser observed caller / Origin、Mobile verified handoff、Signer final authority、SDK / dApp / Relay self-claim non-authority を固定                     | Browser privileged layer / Mobile trusted host が caller verification owner。SDK は公開契約の詳細だけを決める                                                     | Pass。`DR-SF-006`                  |
| `CR-013`、wallet-core requirements / specification / Binding decision | §2.2、§9、§17、§25、§26。approved raw target のみを渡し、wallet-core の Wallet Store、secret processing、chain-specific key、raw signing と Application-level gate を分離                   | wallet-core は raw signing / secret boundary、Signer は orchestration / inspection / approval / gate。Binding method は `_snwc` decision、host integration は下流 | Pass。責任逆流なし                 |
| `CR-002`、`CR-004`、`CR-007-TX`、`CR-007-MSG`                         | §8〜§15、§23〜§24。transaction、message、Aggregate、cosignature、Partial、NEM multisig の semantics を chain-specific に検査し、確認不能なら拒否                                            | Chain integration / platform trusted UI。schema、byte、UI detail は下流                                                                                           | Pass。blind signing 回帰なし       |

下流資料は、責任境界、用語、binding、lifecycle、traceability および明白な矛盾の確認に限定して参照した。API、schema、wire format、exact state machine、実装構造等の不足を Signing Flow の finding へ逆流させていない。

## 12. Domain Checks

| Check                                                      | 判定 | 根拠                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose / scope                                            | Pass | §1〜§2 が Browser Extension、Mobile App、SDK、Relay、wallet-core の共通 signing lifecycle と対象外の詳細を分離している                                                                                                         |
| Signer boundary / owner                                    | Pass | §2.1、§18、§19、§25 が Browser privileged layer / Mobile trusted host を Signer とし、SDK、Relay、dApp、Provider、Content Script、wallet-core を最終判断主体としていない                                                       |
| Common signing gate                                        | Pass | §4、§7、§8、§9、§14、§16、§20、§22、§23 が4条件を独立必須として全 operation と結果へ適用している                                                                                                                               |
| Authentication / unlock / Account authorization separation | Pass | §3、§4、§7、§16、§17、§22、§23 が4条件を connection、permission、capability、session、`UNLOCKED`、wallet-core password / Store validation から分離している                                                                     |
| Profile / Account / Chain / Network binding                | Pass | §5、§9、§15、§16、§18〜§20、§23〜§24 が Profile Network、Chain-specific Account / Key Identity、Wallet Core context、Profile switch / lock / association change を binding・失効へ接続している                                 |
| Request / approval / authentication / target binding       | Pass | §4、§5、§15、§16、§20、§23 が request、caller、session、Profile、operation、target、inspection、approval、authentication、freshness および result の correspondence を定める                                                   |
| Caller authority / SDK boundary                            | Pass | §2.3、§5、§9、§18、§19、§23、§26 が Browser observed context / Mobile verified handoff を authority とし、SDK / Provider / dApp / Relay self-claim を non-authority としている                                                 |
| Trusted UI / semantic inspection / blind signing           | Pass | §2.1、§4、§8〜§15、§23 が Signer-generated confirmation model、full target inspection、Aggregate / multisig parent inspection、warning-only bypass 禁止を定める                                                                |
| Wallet Core responsibility                                 | Pass | §2.2、§17、§24、§25 が Wallet Store、key management、secret processing、raw signing を wallet-core に置き、Application-level authentication、authorization、approval、caller verification、semantic inspectionを Signer に置く |
| Relay opaque boundary                                      | Pass | §2.4、§19、§23、§25 が Relay を untrusted / opaque transport とし、意味解釈、approval、authentication、signing、result success 判定を担わせていない                                                                            |
| Lifecycle / restart / context loss                         | Pass | §7.2〜§7.3、§15、§18、§19、§21〜§23 が restart、process loss、Profile / Account / Chain / Network change、stale、revoked、locked、old Authorization の再利用禁止を定める                                                       |
| Result safety / delivery semantics                         | Pass | §7.3〜§7.4、§20、§21〜§22 が success の gate context、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、resend / retrieval と再署名の分離を定める                                                                                          |
| Concurrent request isolation                               | Pass | §4、§16、§18、§19、§23 が Browser tab / frame、Mobile Deep Link / Relay handoff の request identity、approval、authentication、inspection、response channel を独立させる                                                       |
| Replay / duplicate / one-time signing operation            | Pass | §4、§6、§7、§16、§21、§23 が one-time Authorization、duplicate / replay 拒否、terminal state 再利用禁止、resend / lookup の非 signing operation 化を維持している                                                               |
| Retry / automatic fallback                                 | Pass | §7.2、§21〜§23 が security failure 後の alternate route を禁止し、明示 retry を fresh user activation / request / validation / gate / approval に限定している                                                                  |
| Symbol / NEM and Aggregate / cosignature                   | Pass | §6、§10〜§13、§23〜§24 が Symbol Aggregate と NEM multisig を共通 transaction model で上書きせず、parent / embedded / inner 全体 inspection と no blind signing を維持している                                                 |
| Fail-closed / secret non-exposure                          | Pass | §2、§4、§7、§17、§19、§22〜§23 が未成立・確認不能・不整合・Wallet Core / Binding failure を署名・success へ変換せず、secret を外部へ露出しない境界を定める                                                                     |
| Traceability / downstream implementability                 | Pass | §25〜§27 と関連資料が、共通安全条件を固定しつつ API、schema、wire、crypto、OS、algorithm 等を適切な下流 owner へ委譲している                                                                                                   |
| Design phase boundary                                      | Pass | exact API、schema、wire、timeout、retry count、DB / Redis、crypto parameter、OS API、class、UI 等を不足 finding としていない                                                                                                   |

## 13. Validation Results

レビュー成果物の明示的なパスだけを formatter / format check の対象とした。Source の変更はないため、lint、typecheck、test、build は実施対象外とした。

- `pnpm exec prettier --write docs/reviews/design/signing-flow-review-004.md` — PASS
- `pnpm exec prettier --check docs/reviews/design/signing-flow-review-004.md` — PASS
- `git diff --check` — PASS
- Markdown local link validation — PASS。レビュー成果物内の対象設計、前回レビュー、上流・下流資料、wallet-core requirements / specification / Binding decision へのローカル参照先が存在する。
- Finding ID duplicate check — PASS。正式 finding heading は `DR-SF-001`〜`DR-SF-006` の各1件で、重複はない。今回初出 finding はない。
- Review Gate / finding status consistency — PASS。6件すべて `RESOLVED`、Required Changes はなし、全 Gate は Pass、Review Result は `READY` で整合している。
- Change scope check — PASS。レビュー成果物以外に差分はない。
- `Not validated`: `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。Source code を変更しておらず、今回の review artifact の文書検証対象外であるため実行していない。

## 14. Review Gates

| Gate                                                   | 判定 | 根拠                                                                                                                                                           | 対応 ID                                                               |
| ------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1. Purpose / scope                                     | Pass | §1〜§2 が対象、対象外、前提および Design フェーズ境界を明確にする                                                                                              | なし                                                                  |
| 2. Context / responsibility / trust boundary / secrets | Pass | §2、§17〜§19、§23、§25 が Signer、SDK、Relay、wallet-core、dApp、Node、秘密情報の境界と owner を明確にする                                                     | `DR-SF-001`〜`DR-SF-006`（すべて RESOLVED）                           |
| 3. Dependency direction                                | Pass | §2、§17、§25 が SDK / Relay / Chain integration / wallet-core への責任逆流を禁止し、Signer orchestration の依存方向を示す                                      | なし                                                                  |
| 4. Major flows and failure                             | Pass | §7〜§9、§14、§16、§18〜§22 が受信、inspection、approval、4条件、署名、result、restart、replay、duplicate、retry、fallback、delivery failure を定める           | `DR-SF-001`、`DR-SF-003`、`DR-SF-004`、`DR-SF-005`（すべて RESOLVED） |
| 5. Data ownership / retention / destruction            | Pass | §5、§15〜§17、§19、§20、§23、§25 が Profile / Account / Wallet Core context、秘密情報、approval、result、Relay opaque state の所有境界を明確にする             | `DR-SF-002`、`DR-SF-003`（すべて RESOLVED）                           |
| 6. Security / interoperability                         | Pass | §4、§10〜§14、§17、§19、§21〜§24 が共通 gate、fail-closed、Relay opaque、wallet-core 正本、Symbol / NEM、Mainnet / Testnet、Aggregate / cosignature を維持する | `DR-SF-001`、`DR-SF-002`、`DR-SF-005`（すべて RESOLVED）              |
| 7. Upstream consistency                                | Pass | `CR-016`、`CR-AC-017`、`CR-NFR-012`、Architecture §6.9、Security Design §8 / §10 / §15 および SDK `SDK-OPEN-007` と現行本文が整合する                          | `DR-SF-001`、`DR-SF-002`、`DR-SF-003`、`DR-SF-006`（すべて RESOLVED） |
| 8. Downstream implementability                         | Pass | §25〜§27 が共通安全条件と owner を固定し、exact API、schema、wire、crypto、OS、concurrency algorithm 等を対応する下流へ委譲する                                | `DR-SF-001`〜`DR-SF-006`（すべて RESOLVED）                           |

## 15. Remaining Risks and Open Decisions

- `SDK-OPEN-007` は caller / Origin context の公開要求・伝播・correlation、transport representation、version、API detail が未決である。ただし Browser observed caller / Origin、Mobile verified handoff context、Signer の最終 caller verification、SDK / Provider / dApp / Relay の non-authority は固定済みである。
- `CR-OPEN-001` / `CR-OPEN-002` および Mobile の open item として、wallet-core host integration、secret byte lifecycle、OS protection、error mapping、migration、Mobile process / OS API、具体的な platform authentication が残る。ただし wallet-core の raw signing / secret boundary と Application-level gate の責務分離は未決ではない。`_snwc` の v1 Binding method は Binding decision により固定されている。
- SDK の transport selection、Provider discovery、retry interval / count、既存 result の lookup / resend、Relay retention、Mobile pending request、platform confirmation model および具体 UI は下流仕様・運用で確定する。security failure 後の automatic fallback 禁止と fresh retry 条件は変更できない。
- Symbol / NEM の対応 type、version、serialization、hash / signature bytes、Aggregate / multisig / cosignature の公開 scope および fixture は Chain Compatibility / SDK / platform 下流で確定する。全体 inspection、parent binding、no blind signing および共通4条件は維持する。
- 現在の workspace に Mobile App 実装は存在しないため、今回の判定は Mobile の設計責任と共通安全条件の成立を対象とし、Mobile runtime の実装済み・検証済みとは扱わない。

これらは現行 Design Gate を阻害する finding ではない。特に、OPEN や wallet-core Binding の具体化を理由に共通署名ゲート、Profile binding、request isolation、result safety、Relay opaque boundary、SDK non-Signer boundary、Aggregate / cosignature inspection、blind signing prohibition または fail-closed を弱めてはならない。

## 16. Automatic Changes

`docs/reviews/design/signing-flow-review-004.md` のみを新規作成した。対象の `docs/design/signing-flow.md`、上流要件、下流仕様、ADR、wallet-core、実装、テストおよび既存レビューは変更していない。

## 17. Final Decision

**`READY`**

`DR-SF-001`〜`DR-SF-006` は、現在の Signing Flow 本文に基づきすべて `RESOLVED` と判定する。過去 `SDR-001`〜`SDR-004` の再発はなく、新規 Critical / Major finding、重大な Trust Boundary / responsibility regression、共通署名ゲートとの矛盾、Profile binding の問題、concurrent request isolation の問題、automatic fallback policy の問題、Design フェーズ逸脱は確認されなかった。Signing Flow は、指定された下流設計・仕様・実装へ進められる状態である。
