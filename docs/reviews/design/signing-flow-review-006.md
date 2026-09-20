# Signing Flow Design Review 006

## 1. Review Target

- 対象: [Signing Flow Design](../../design/signing-flow.md)
- 確認日: 2026-09-20
- 成果物: `docs/reviews/design/signing-flow-review-006.md`
- レビュー範囲: request lifecycle、cancellation race、terminal state、Authorization binding、handoff recipient / device / channel binding、result validation、Relay / Mobile flow、retry / delivery disposition。
- 未確認範囲: API、wire schema、暗号、具体的 concurrency primitive、UI、wallet-core Binding 実装、runtime tests。

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が4つの独立 self-review pass を実施した。

| Pass            | 確認結果                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A 相当 | Signer、SDK、Relay、wallet-core、Mobile の lifecycle responsibility と target / context ownership を確認。                         |
| Reviewer B 相当 | four-condition gate、target equality、recipient / channel binding、wrong-device rejection、fail-closed を確認。                    |
| Reviewer C 相当 | cancel と `SIGNING` の競合、`RESULT_UNKNOWN`、`CANCELLED`、`SUCCEEDED + DELIVERY_UNKNOWN`、restart、retry、terminal reuse を確認。 |
| Reviewer D 相当 | Requirements、Interfaces、Security、Relay / Handoff、Signing Protocol との traceability と downstream implementability を確認。    |

## 3. Evidence Used

| 資料                                       | 確認目的                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Signing Flow §5、§7、§16、§19〜§23         | 対象本文の request model、state machine、cancel、result、security invariant。        |
| Common / SDK / Mobile / Relay Requirements | signing、cancel、timeout、handoff、result、replay の上流根拠。                       |
| Interfaces Design §6.4、§7.6、§8、§9       | 共通 interface と cancellation / recipient semantics の整合。                        |
| Relay Design / Relay Specification         | participant、direction、generation、transport status と signing outcome の分離。     |
| Signing Protocol §6、§19〜§20              | cancel precedence、delivery disposition、automatic retry / fallback 禁止の補助確認。 |
| `signing-flow-review-005.md`               | `DR-SF-007` / `DR-SF-008` の required correction と continuity を確認。              |

## 4. Review Result

`READY`

## 5. Summary

Signing Flow は、cancel を request-bound lifecycle operation として扱い、署名前の cancel を `CANCELLED`、`SIGNING` 中の成否不明を `RESULT_UNKNOWN`、既知成功後の配送不明を `SUCCEEDED + DELIVERY_UNKNOWN` とする precedence を明示した。既知成功を cancel へ変換せず、terminal state を reopen / auto-resign しないことも確認できる。

Handoff についても、intended recipient / participant、device または Signer-local identity、session / generation、response channel / direction を Authorization、pre-sign revalidation、Mobile / Relay flow、result validation に結び付け、wrong-device / wrong-direction / stale-channel response の拒否責任を Signer / adapter に割り当てた。Critical、Major、Minor の新規 finding は確認しなかった。

## 6. Finding Status

| ID                       | Severity              | Status              | 今回の状態根拠                                                                                                                              |
| ------------------------ | --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-SF-001`〜`DR-SF-006` | 過去 Critical / Major | Resolved / 再発なし | four-condition gate、Profile binding、result validation、concurrent isolation、fallback 禁止を再確認した。                                  |
| `DR-SF-007`              | Major                 | Resolved            | §7.4 が cancel authority、state ごとの outcome precedence、`RESULT_UNKNOWN` / `CANCELLED` / `SUCCEEDED + DELIVERY_UNKNOWN` を定義した。     |
| `DR-SF-008`              | Major                 | Resolved            | §5、§7.4、§16、§19、§20 が recipient / device / signer identity、session / generation、channel / direction を binding / revalidation する。 |
| `SDR-001`〜`SDR-004`     | 過去 Medium           | Resolved / 再発なし | permission / capability、unknown / delivery、one-time signing、全体 inspection の責務を維持した。                                           |

## 7. Required Changes

なし。Critical の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。

## 9. Resolved Findings

`DR-SF-007` は `SIGNING` と cancel の race を、wallet-core outcome の知識に基づき `CANCELLED` / `RESULT_UNKNOWN` / known success に区別したことで解消した。`DR-SF-008` は request / Authorization / result の共通 binding tuple と Mobile / Relay flow の再検証へ recipient / device / channel を追加したことで解消した。

## 10. Upstream Feedback

なし。Requirements は必要な cancellation、handoff、result safety の根拠を提供している。

## 11. Deferred Findings

- cancel の公開 API、ack field、transport、concurrency、result lookup / resend は下位仕様へ委譲する。
- device identity、channel の concrete representation、Relay / OS routing、UI、wallet-core Binding および runtime tests は後続工程で確認する。
- Mainnet release evidence の実装・運用適合性は release readiness / implementation review の対象である。

## 12. Scope and Traceability

Signing Flow の lifecycle / security invariant は Common Requirements、Interfaces、Security Design、Relay / Handoff、Signing Protocol へ追跡できる。共通 flow は ownership と outcome semantics を定め、具体的な API、wire、cryptography、transport implementation は下位へ委譲している。

## 13. Domain Checks

| 観点                              | 判定                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Main flows / state                | Pass。RECEIVED から SUCCEEDED、terminal、cancel race、delivery disposition の意味が相互に衝突しない。                               |
| Authorization / signing authority | Pass。Signer が four-condition gate、target binding、pre-sign revalidation、result validation の owner である。                     |
| Handoff / response safety         | Pass。intended recipient、participant、device / signer identity、channel / direction を再検証し、wrong-device response を拒否する。 |
| Failure / retry / restart         | Pass。unknown、cancel、expiry、state loss、delivery failure 後の auto-resign / fallback を禁止している。                            |
| Chain / network / secret boundary | Pass。Symbol / NEM、Mainnet / Testnet、wallet-core、Relay の境界に回帰がない。                                                      |

## 14. Validation Results

| 検証                                                                                                                                                    | 結果                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `pnpm exec prettier --check ...`                                                                                                                        | 無出力のまま完了しなかったため中断。           |
| `./node_modules/.bin/prettier --check docs/design/architecture.md docs/design/interfaces.md docs/design/signing-flow.md docs/design/security-design.md` | PASS。                                         |
| `git diff --check`                                                                                                                                      | PASS。                                         |
| app / package lint、typecheck、test、build                                                                                                              | Not applicable。docs/design のみの変更である。 |

## 15. Review Gates

| Gate                                         | 判定 | 根拠                                                                                      |
| -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| 1. 目的と範囲                                | Pass | 共通 signing lifecycle と対象外の詳細実装を分離している。                                 |
| 2. Context / responsibility / trust boundary | Pass | Signer、Relay、SDK、wallet-core、Mobile の境界が維持されている。                          |
| 3. Dependencies / direction                  | Pass | transport は signing authority を持たず、wallet-core は Application approval を持たない。 |
| 4. Main flows                                | Pass | cancel、signing、result validation、delivery、restart、retry を一意に扱える。             |
| 5. Data ownership                            | Pass | Authorization、target、result、recipient / channel context を request-local に保持する。  |
| 6. Security / interoperability               | Pass | wrong recipient、wrong device、wrong direction、stale generation を fail-closed とする。  |
| 7. Upstream consistency                      | Pass | Requirements、Interfaces、Security、Relay / Handoff、Signing Protocol と整合する。        |
| 8. Downstream implementability               | Pass | high-level outcome precedence は固定し、exact API / concurrency は適切に委譲している。    |

## 16. Remaining Risks and Open Decisions

公開 cancellation / delivery contract、具体的な Relay recovery、Mobile 実装、wallet-core Binding および runtime evidence は未確定・未確認である。ただしこれらを理由に cancel safety、recipient binding、four-condition gate を弱めてはならない。

## 17. Automatic Changes

本レビュー中に Signing Flow、Requirements、Specifications、実装、テスト、設定は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

**`READY` — `SIGNING FLOW DESIGN READY`**
