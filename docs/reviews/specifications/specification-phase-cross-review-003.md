# Specification Phase Cross Review 003

## Review Target

- **対象:** Specification Phase cross-review-002 の `SPCR-005`、`SPCR-008`、`SPCR-009`、`SPCR-010` の解消確認
- **確認日:** 2026-09-20
- **対象仕様:** `product-spec.md`、`profile-account-spec.md`、`chain-compatibility-spec.md`、`interfaces.md`、`web-transaction-handoff-spec.md`、`mobile-app.md`、`sdk.md`
- **レビュー範囲:** Requirements → Design → Specification の traceability、Mainnet gate の current policy、Relay request / response の canonical authority、Mobile platform / backup の phase boundary
- **未確認範囲:** Mobile App の実装・実機 E2E・Store 配布、release evaluator の実行、Relay integration、各仕様に対する実装適合性

## Execution Audit

- Reviewer A として、Requirements / Design / Specification の追跡、API・wire・alias・owner・OPEN の一意性を確認した。
- Reviewer B として、Product / Profile / Chain / Handoff / Mobile の責任境界、Mainnet / Testnet の外部結果、policy と下流引継ぎを確認した。
- Reviewer C として、Relay opaque boundary、四条件、secret / wallet-core boundary、chain / network binding、fail-closed、未知・改ざん入力の仕様上の判定可能性を確認した。
- サブエージェントは使用していない。Chair が3観点を独立に走査し、候補を統合した。

## Evidence Used

| 資料                                                                                                                                                                           | 用途                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `docs/reviews/specifications/specification-phase-cross-review-002.md`                                                                                                          | 旧 blocking finding の事実、required change、completion condition の確認       |
| `docs/requirements/requirements.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`                                               | Requirement ID、Mainnet gate、Mobile platform / backup、Relay / SDK 責任の確認 |
| `docs/design/architecture.md`、`docs/design/security-design.md`、`docs/design/signing-flow.md`、`docs/design/mobile-app.md`、`docs/design/interfaces.md`                       | 責務境界、四条件、Relay opaque、platform / backup の未決範囲の確認             |
| `docs/specifications/product-spec.md`、`profile-account-spec.md`、`chain-compatibility-spec.md`、`interfaces.md`、`web-transaction-handoff-spec.md`、`mobile-app.md`、`sdk.md` | 修正後の normative contract、traceability、canonical owner / mirror の確認     |
| `docs/adr/0001-mainnet-evidence-lite.md`、`docs/evidence/evidence-policy.json`、`docs/release/mainnet-release-evidence.md`                                                     | Lite policy の approval 数、same-approver policy、strict migration の確認      |

## Review Result

**READY**

## Summary

旧 cross-review の4件は、現行仕様上の contradiction / authority ambiguity としては解消された。Product、Profile、Chain、Handoff に Requirements → Design → Specification → canonical owner / OPEN の matrix が追加され、Interfaces §6 が common Relay envelope の canonical owner、Handoff §5.1 が SDK projection の canonical owner と明示された。

Mobile / Handoff は Mainnet gate の fail-closed、Testnet-only continuation、Origin proof、四条件および secret boundary を維持したまま、OS version、hardware、wrapping、attestation、direct signing、backup / restore の exact choice を OPEN / platform / release authority へ戻している。Product の evidence manifest は current Lite policy の release 1、security required 0、same approver multiple roles allowed と整合した。

## Finding Status

| Finding    | Severity | Status   | 初出レビュー                              | 今回の状態根拠                                                                                                                                                                                                             |
| ---------- | -------- | -------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPCR-005` | Major    | Resolved | `specification-phase-cross-review-002.md` | Product §20、Profile §28、Chain §9、Handoff §16 に Requirements → Design → Specification → owner / OPEN matrix があり、Interfaces §17、Mobile §21、SDK の既存 traceability と接続している。                                |
| `SPCR-008` | Major    | Resolved | `specification-phase-cross-review-002.md` | Mobile §17.2、Handoff §7.5、Mobile §21、Handoff §16 が exact OS / hardware / backup choice を current gate から除外し、`MR-OPEN-003/006/008`、`MOB-OPEN-006/008`、`OPEN-PROFILE-001` と release authority へ委譲している。 |
| `SPCR-009` | Major    | Resolved | `specification-phase-cross-review-002.md` | Interfaces §6 が common wire authority、Handoff §5.1 が SDK projection authority、Handoff §7.1 / §7.2 と SDK §5.1 が独立した Relay schema / union を再定義しないことを明示している。                                       |
| `SPCR-010` | Major    | Resolved | `specification-phase-cross-review-002.md` | Product §19 が current Lite policy を明示し、`evidence-policy.json`、ADR 0001、Mainnet release evidence の release 1 / security 0 / same-approver 設定と一致している。                                                     |

## Required Changes

なし。現行 `spec-review` の Gate 不合格に対応する `SR` Critical finding はない。

## Optional Improvements

なし。既存の OPEN と実装・release 検証は Deferred Findings に整理した。

## Resolved Findings

### `SPCR-005` — Requirements → Design → Specification traceability

- **対象箇所:** Product §20、Profile §28、Chain §9、Handoff §16。
- **確認事実:** 各 matrix が Requirement ID、Design section、Specification section、canonical owner または OPEN を同じ行で示す。四条件、trusted inspection、wallet-core boundary、Relay boundary、request / response、result / delivery、recovery、Mainnet gate および Profile backup / platform OPEN が追跡可能である。
- **完了条件:** 旧 finding が求めた4文書の explicit matrix と cross-document owner / OPEN が確認できるため、Resolved とする。

### `SPCR-008` — Mobile Mainnet gate の premature platform / backup choice

- **対象箇所:** Mobile §17.2、§20、§21、Handoff §7.5、§14.4、§16。
- **確認事実:** exact OS version、hardware API、wrapping、attestation、support matrix、direct hardware signing、backup / restore verification は current v1 gate の具体条件として固定されていない。gate status または capability の missing / invalid / expired / unknown 時の Mainnet fail-closed、Testnet-only continuation、Origin proof、四条件および secret isolation は維持されている。
- **完了条件:** upstream OPEN と current normative gate の contradiction が除去され、未決 choice は `MR-OPEN-003/006/008`、`MOB-OPEN-006/008`、`OPEN-PROFILE-001` および release authority へ戻されているため、Resolved とする。

### `SPCR-009` — Interfaces / Handoff / SDK contract authority

- **対象箇所:** Interfaces §6、Handoff §5.1、§7.1、§7.2、SDK §5.1。
- **確認事実:** Interfaces §6 は `RelayRequestBase`、`RelayOperation`、`RelayResponseBase`、`RelayRequest`、`RelayResponse`、`PublicAccountIdentity`、`DeliveryDisposition` の common semantic / wire authority である。Handoff は operation-specific validation、crypto、HTTP、lifecycle と SDK public projection を担当し、SDK は Handoff の canonical public type を参照する。`MosaicLynxActiveAccount` と `MosaicLynxDeliveryDisposition` は projection / wire-identical mapping と明示されている。
- **完了条件:** request / response の common declaration、SDK projection、consumer mapping の authority が一意で、別の union / alias を独立に実装する余地が除去されているため、Resolved とする。

### `SPCR-010` — Lite evidence manifest approval policy

- **対象箇所:** Product §19、§20、`docs/evidence/evidence-policy.json`、ADR 0001、Mainnet release evidence。
- **確認事実:** Product は current Lite の release approval 1件、security approval required 0、same approver multiple roles allowed を明記し、strict policy の追加条件を移行後だけ適用する。current policy の approval count を Product が独自変更していない。
- **完了条件:** current Lite の manifest description と policy / ADR / release evidence が一致し、strict migration の条件が Lite へ誤適用されないため、Resolved とする。

## Upstream Feedback

なし。Mobile platform / backup、wallet-core Binding、capability report / Store 条件は、既存の上流 OPEN を normative に参照する形で current Specification の安全な境界を確定できる。OPEN 自体から新しい Requirement、Design Decision または仕様 contract は生成していない。

## Deferred Findings

- `OPEN-001`〜`OPEN-005`、Aggregate / multisig / cosignature scope、permission expiry、caller context、transport recovery、wallet-core Binding の exact contract は既存 OPEN として未決であり、本レビューで close していない。
- `OPEN-PROFILE-001`、`MR-OPEN-003/006/008`、`MOB-OPEN-006/008` は、Profile backup、OS / hardware integration、platform matrix、runtime enforcement、Store release の decision authority として維持する。
- 本レビューは docs-only の仕様確認であり、Mobile 実装、実機、Relay integration、release evidence evaluator、Store、外部 node および full E2E の実行結果を保証しない。

## Scope and Traceability

| 領域                                | Requirements / Design                                                                         | 現行 Specification / owner                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 共通 request / response             | `CR-001`、`CR-006`、`RR-001/002`、Interfaces Design §6                                        | Interfaces §6 が wire/common owner。Handoff §7、SDK、Browser、Mobile、Relay は参照のみ                                |
| 四条件・trusted inspection          | `CR-002`、`CR-003`、`CR-004`、`CR-016`、Signing Flow §4、§8〜§16、Security Design §7〜§11     | Product §20、Profile §28、Chain §9、Handoff §16、Mobile §21 が追跡。Signer / wallet-core / Relay の責任を分離         |
| Relay / secret boundary             | `CR-008`、`CR-010`、`CR-011`、`RR-003`、`RR-008`、Architecture §8〜§9、Security Design §3〜§6 | Handoff §7〜§9、§13〜§16、Mobile §16、§25、SDK §5.3〜§5.4。Relay は opaque、wallet-core が secret / raw signing owner |
| Chain / network / canonical bytes   | `CR-005`、`CR-007-TX`、`CR-007-MSG`、`CR-NFR-005`、Signing Flow §8〜§15                       | Chain §2〜§8 が chain-specific owner。Profile association、Interfaces、Handoff、Signer は本書へ参照                   |
| Mainnet gate / Lite policy          | `CR-NFR-006`、`CR-AC-008`、`MR-013`、Architecture §3、§16、ADR 0001                           | Product §19、Mobile §17、Handoff §7.5、Profile §28、Chain §9 が current policy と release authority を参照            |
| Backup / platform future capability | `CR-014`、`MR-008`、`MR-009`、Mobile Design §27                                               | Profile `OPEN-PROFILE-001`、`MR-OPEN-003/006/008`、`MOB-OPEN-006/008`。current Mainnet gate の exact choice ではない  |

## Domain Checks

| Check                            | 判定 | 根拠                                                                                                                                                   |
| -------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API / data contract              | Pass | Interfaces §6 の common wire owner、Handoff §7 の operation mapping、Handoff §5.1 / SDK §5.1 の public projection が分離されている。                   |
| Validation / error / state       | Pass | Handoff §7.2、§9〜§14、Mobile §17、§20 が correlation、unknown、delivery、lifecycle、fail-closed を維持している。                                      |
| Security / secret boundary       | Pass | Relay の opaque 性、四条件、wallet-core ownership、Mainnet gate の fail-closed、unknown / tampered input の安全側処理が各仕様に残っている。            |
| Chain / network interoperability | Pass | Chain §2〜§8 と固定 vector / canonical re-serialization の責任を変更していない。Symbol / NEM、Mainnet / Testnet の境界を traceability へ明記している。 |
| OPEN / phase boundary            | Pass | 未決の OS、hardware、backup、capability、recovery、cosignature choice を current contract に昇格していない。                                           |
| Security testability             | Pass | fixed vector、negative input、fail-closed、policy、traceability の検証根拠を既存仕様から追跡できる。実装テスト実行は本レビュー範囲外である。           |

## Validation Results

| Validation                                                                     | Result                            |
| ------------------------------------------------------------------------------ | --------------------------------- |
| `./node_modules/.bin/prettier --check`（変更した7仕様書、明示パス）            | PASS                              |
| `git diff --check`                                                             | PASS                              |
| 参照先 file / heading / policy key の存在確認                                  | PASS                              |
| `SDK-001` の誤参照確認（`SDK-FR-005` / `SDK-FR-008` へ修正済み）               | PASS                              |
| package / app test、lint、typecheck、build、Relay integration、Mobile 実機 E2E | Not validated（docs-only review） |

## Review Gates

| Gate                  | 判定 | 根拠                                                                                                          | 対応 ID                                     |
| --------------------- | ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1. 目的と範囲         | Pass | Product、Profile、Chain、Handoff、Mobile、SDK の owner と対象外が追跡可能。                                   | なし                                        |
| 2. 契約               | Pass | common envelope と SDK projection の canonical authority が一意。                                             | `SPCR-009` Resolved                         |
| 3. 処理と例外         | Pass | fail-closed、unknown、delivery、recovery、Mainnet / Testnet の外部結果が維持されている。                      | `SPCR-008` Resolved                         |
| 4. 内部整合性         | Pass | Lite policy、Mobile / Handoff platform boundary、common response union の矛盾を除去。                         | `SPCR-008`、`SPCR-009`、`SPCR-010` Resolved |
| 5. 検証可能性         | Pass | 4文書の Requirements → Design → Specification → owner / OPEN matrix を確認。                                  | `SPCR-005` Resolved                         |
| 6. 安全性と相互運用性 | Pass | Chain-specific bytes、secret boundary、Relay opaque、four conditions、tampered input の責任を変更していない。 | なし                                        |
| 7. 上流整合性         | Pass | current evidence policy と upstream Mobile / Profile OPEN を参照し、未決 choice を固定していない。            | `SPCR-008`、`SPCR-010` Resolved             |

## Remaining Risks and Open Decisions

- `READY` は仕様フェーズの判定であり、未解決 OPEN の close、Mobile / Relay 実装、実機 capability、release evidence の生成・署名・検証を意味しない。
- `MOB-OPEN-003/006/008`、`MR-OPEN-003/006/008` および `OPEN-PROFILE-001` が解消される際は、current Mainnet gate の fail-closed、Testnet-only continuation、Origin proof、四条件および secret boundary を維持したまま、全 mirror と traceability を同一 revision で再確認する。
- `evidence-policy.json` の strict migration は別の承認済み policy change であり、本レビューで変更していない。

## Automatic Changes

レビュー中に対象仕様、Requirements、Design、implementation、test、fixture または既存 review artifact を自動変更していない。本レビュー成果物だけを新規作成した。

## Final Decision

**READY**
