# Architecture Design Review 006

## 1. Review Target

- 対象: [Architecture Design](../../design/architecture.md)
- 確認日: 2026-09-20
- 成果物: `docs/reviews/design/architecture-review-006.md`
- レビュー範囲: Architecture の目的、責務境界、trust boundary、主要 signing / handoff flow、Mainnet gate、下流委譲および §17.1 の traceability。
- 未確認範囲: API、wire format、暗号パラメータ、具体的 error code、parser、UI / OS API、実装・テストの動作正しさ。

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が次の4パスを独立に実施した。

| Pass            | 確認結果                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A 相当 | Signer、SDK、Relay、wallet-core、chain integration、Release / Operation の責務と依存方向を確認。新たな責務逆流はない。                                               |
| Reviewer B 相当 | secret boundary、four-condition gate、Relay opaque boundary、Mainnet fail-closed を確認。設計上の trust boundary は成立している。                                    |
| Reviewer C 相当 | request、cancel、result、delivery unknown、lifecycle loss、handoff および retry の委譲境界を確認。cancel の高位意味は Signing Flow / Interfaces へ一意に追跡できる。 |
| Reviewer D 相当 | Requirements、既存 Design、Handoff Specification、Signing Protocol および §17.1 の traceability を確認。旧 `DR-003` は解消済み。                                     |

## 3. Evidence Used

| 資料                                                   | 確認目的                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Architecture Design §6、§8〜§17.1                      | 対象本文、責務、trust boundary、Mainnet gate、下流引継ぎ。                             |
| Common / Browser / Mobile / Relay / SDK Requirements   | Architecture が満たすべき upstream responsibility と release / handoff 要求。          |
| Interfaces、Signing Flow、Security Design              | Architecture から委譲する共通 context、cancel、recipient/channel、security invariant。 |
| Web Transaction Handoff Specification §2、§5.2、§5.2.1 | v1 message signing の現行下流契約との互換性確認。                                      |
| Signing Protocol §15〜§16、§19〜§21                    | message signing、cancel race、delivery disposition、Mainnet gate の補助確認。          |
| `architecture-review-005.md`                           | `DR-003` の continuity 確認のみ。過去の Gate は継承していない。                        |

## 4. Review Result

`READY`

## 5. Summary

Architecture は、Browser Extension / Mobile App を Signer、SDK を非特権連携、Relay を opaque transport、wallet-core を秘密情報・raw signing の主体として分離している。今回の修正により、message signing の v1 契約が既存 Handoff Specification / Signing Protocol へ追跡され、未決事項として誤読される状態が解消された。

Mainnet capability の fail-closed、Relay の E2E opaque 境界、cancel / recipient binding の詳細責任は、共通 Design と下位資料の責任分界を越えていない。Critical、Major、Minor の新規 finding は確認しなかった。

## 6. Finding Status

| ID       | Severity      | Status   | 今回の状態根拠                                                                                                  |
| -------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `AR-001` | Legacy MEDIUM | Resolved | 固定 v1 Binding と host integration の境界を維持している。                                                      |
| `AR-002` | Legacy MEDIUM | Resolved | Binding と runtime / process / hardware isolation を混同していない。                                            |
| `DR-001` | Critical      | Resolved | 共通4条件と pre-sign revalidation が維持されている。                                                            |
| `DR-002` | Major         | Resolved | §17.1 が責務、正本、責任主体、委譲境界を追跡している。                                                          |
| `DR-003` | Minor         | Resolved | §17 の message signing 記述を現行 Handoff Specification / Signing Protocol と同期し、§17.1 に追跡行を追加した。 |

## 7. Required Changes

なし。Critical の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。

## 9. Resolved Findings

`DR-003` は、Architecture が message signing の format / operation / result / handoff 契約を未決として扱わず、既存の v1 下流正本へ引き継ぐ記述へ更新されたことで解消した。Architecture は API、wire、encoding、serialized message format を再定義していない。

## 10. Upstream Feedback

なし。Requirements の不足・曖昧さ・矛盾は今回確認しなかった。

## 11. Deferred Findings

- Mobile の OS lifecycle、host Binding、backup / migration および具体 handoff は既存の `MR-OPEN-*` と下位設計へ委譲する。
- Mainnet evidence の収集、署名、trusted key、build embedding、runtime evaluator は release / operation の責務として委譲する。
- API、wire、暗号、具体的 error mapping、実装および runtime evidence は本レビュー対象外である。

## 12. Scope and Traceability

Architecture §17 / §17.1 から、共通 security、signing lifecycle、Interfaces、Browser、Mobile、Relay、SDK、Chain Compatibility、Profile / Account、wallet-core、Mainnet release evidence および v1 message signing へ一意に追跡できる。cancel race と recipient / channel binding は Interfaces / Signing Flow が意味を所有し、Architecture は責務境界と委譲先だけを示す構造である。

## 13. Domain Checks

| 観点                                      | 判定                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Context / responsibility / trust boundary | Pass。Signer、SDK、Relay、wallet-core、Node、Release / Operation の authority と非 authority が分離されている。      |
| Dependencies / direction                  | Pass。SDK / Relay / host adapter から wallet-core の secret ownership へ責務が逆流していない。                       |
| Main flows / failure                      | Pass。cancel、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、restart、stale、duplicate、fallback 禁止が下流へ接続されている。 |
| Secret ownership / Mainnet                | Pass。E2E secret と transport credential、Mainnet evidence gate の責任が追跡できる。                                 |
| Downstream handoff                        | Pass。message signing の既存契約を含め、下流設計・仕様へ必要な抽象判断が渡る。                                       |

## 14. Validation Results

| 検証                                                                                                                                                    | 結果                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm exec prettier --check docs/design/architecture.md docs/design/interfaces.md docs/design/signing-flow.md docs/design/security-design.md`           | 15秒以上無出力で完了しなかったため中断。環境側の pnpm launcher 未完了として扱う。 |
| `./node_modules/.bin/prettier --check docs/design/architecture.md docs/design/interfaces.md docs/design/signing-flow.md docs/design/security-design.md` | PASS。                                                                            |
| `git diff --check`                                                                                                                                      | PASS。                                                                            |
| app / package lint、typecheck、test、build                                                                                                              | Not applicable。docs/design のみの変更であり実装変更はない。                      |

## 15. Review Gates

| Gate                                         | 判定 | 根拠                                                                                            |
| -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| 1. 目的と範囲                                | Pass | Architecture の対象、対象外、未決事項が維持されている。                                         |
| 2. Context / responsibility / trust boundary | Pass | Signer、SDK、Relay、wallet-core、Release / Operation の責務が明確である。                       |
| 3. Dependencies / direction                  | Pass | 依存方向と秘密情報境界に逆流がない。                                                            |
| 4. Main flows                                | Pass | signing、handoff、cancel、result unknown、delivery unknown、lifecycle loss を下流へ引き継げる。 |
| 5. Data ownership                            | Pass | Profile、Account、E2E secret、transport credential、opaque Relay data の所有を混同していない。  |
| 6. Security / interoperability               | Pass | Chain / Network、Mainnet gate、four-condition gate、Relay non-authority が維持されている。      |
| 7. Upstream consistency                      | Pass | Requirements、ADR、release evidence、既存 Design と矛盾しない。                                 |
| 8. Downstream implementability               | Pass | message signing の下流正本と残存する詳細委譲を区別している。                                    |

## 16. Remaining Risks and Open Decisions

Mobile 実装、具体的な handoff / Relay protocol、wallet-core host integration、release evidence evaluator および実装・テストの適合性は別工程で確認する。これらの未決事項は Architecture の共通 security boundary を弱めない。

## 17. Automatic Changes

本レビュー中に Architecture、Requirements、Specifications、実装、テスト、設定は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

**`READY` — `ARCHITECTURE DESIGN READY`**
