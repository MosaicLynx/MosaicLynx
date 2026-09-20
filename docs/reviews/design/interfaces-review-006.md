# Interfaces Design Review 006

## 1. Review Target

- 対象: [Interfaces Design](../../design/interfaces.md)
- 確認日: 2026-09-20
- 成果物: `docs/reviews/design/interfaces-review-006.md`
- レビュー範囲: 共通 SigningRequest / SigningResponse、cancellation、terminal outcome、handoff participant / recipient、device / Signer identity、response channel / direction、検証責任、security invariant、traceability。
- 未確認範囲: 公開 API 名、JSON / DTO / wire schema、device identifier の形式、Relay route、暗号 envelope、具体的 error code、実装・テストの動作正しさ。

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が4つの独立 self-review pass を実施した。

| Pass            | 確認結果                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reviewer A 相当 | SDK、Signer、Relay、Browser、Mobile、wallet-core の共通 interface responsibility と data ownership を確認。cancel / recipient の owner が重複していない。          |
| Reviewer B 相当 | request / response binding、wrong participant / channel、secret isolation、fail-closed を確認。Relay ACK と署名 authority の混同はない。                           |
| Reviewer C 相当 | cancel acknowledgement、terminal state、`SIGNING` race、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` および concurrent isolation を確認。outcome precedence は一意である。 |
| Reviewer D 相当 | Requirements、Signing Flow、Security、Relay / Handoff Specification、Signing Protocol への traceability を確認。`DR-006` / `DR-007` は解消済み。                   |

## 3. Evidence Used

| 資料                                                    | 確認目的                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Interfaces Design §6.3〜§6.6、§7.3、§7.6、§8、§9、§14.1 | 共通概念、cancel、recipient/channel binding、validator、traceability。                          |
| Common / SDK / Mobile / Relay Requirements              | cancellation、correlation、handoff participant、direction、fail-closed の上流根拠。             |
| Signing Flow §5、§7、§16、§19〜§20                      | 共通 lifecycle と同じ outcome / binding semantics であることの確認。                            |
| Relay Design / Relay Specification §6〜§9               | participant、direction、generation、transport status が Signer outcome と分離されることの確認。 |
| Signing Protocol §6、§19〜§20                           | cancel precedence、delivery disposition、terminal reuse 禁止の補助確認。                        |
| `interfaces-review-005.md`                              | `DR-006` / `DR-007` の required correction と continuity を確認。                               |

## 4. Review Result

`READY`

## 5. Summary

共通 interface は cancellation を単なる error category ではなく、同一 request identity と binding context に対する lifecycle operation として扱うようになった。署名前の `CANCELLED`、`SIGNING` 中の成否不明による `RESULT_UNKNOWN`、既知成功後の `SUCCEEDED + DELIVERY_UNKNOWN`、terminal state の再利用禁止が共通意味として追跡できる。

また、handoff participant / recipient、device または Signer-local identity、session / generation、response channel / direction を request / response context として明示し、Mobile / adapter / Relay / Signer の検証責任と mismatch 時の fail-closed を定義した。Critical、Major、Minor の新規 finding は確認しなかった。

## 6. Finding Status

| ID                 | Severity | Status              | 今回の状態根拠                                                                                                                                   |
| ------------------ | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DR-001`           | Critical | Resolved            | Profile-local security context と cross-request invalidation が維持されている。                                                                  |
| `DR-002`           | Major    | Resolved            | Application Account authority と wallet-core identity authority が分離されている。                                                               |
| `DR-003`           | Critical | Resolved            | 共通4条件が同一 request / target context に binding されている。                                                                                 |
| `DR-004`           | Major    | Resolved            | failure taxonomy、cancel、expiry、unknown、delivery unknown、automatic re-sign prohibition が整理されている。                                    |
| `DR-005`           | Critical | Resolved            | caller、Profile、Account、target、result、recipient の cross-request reuse が禁止されている。                                                    |
| `DR-006`           | Major    | Resolved            | cancel authority / scope、acknowledgement、race outcome、terminal reuse 禁止を §6.4、§7.6、§8、§9 に追加した。                                   |
| `DR-007`           | Major    | Resolved            | intended recipient / participant、device / Signer identity、session / generation、channel / direction と validator を共通 interface に追加した。 |
| `IF-001`〜`IF-003` | —        | Resolved / 再発なし | public / internal identity、unknown / delivery distinction、Relay / Node non-authority を再確認した。                                            |

## 7. Required Changes

なし。Critical の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。

## 9. Resolved Findings

`DR-006` は、cancel の authority / scope と acknowledgement の意味、state ごとの outcome precedence および terminal reuse prohibition を共通 interface に固定したことで解消した。`DR-007` は、recipient / participant、device / signer identity、channel / direction の概念と検証責任を追加し、wrong-device、wrong-direction、stale generation、別 request の response を fail-closed としたことで解消した。

## 10. Upstream Feedback

なし。既存 Requirements は cancellation、handoff、correlation および failure distinction の根拠として十分である。

## 11. Deferred Findings

- cancel method、ack field、concurrency、retry / lookup、HTTP status および公開 error code は下位仕様へ委譲する。
- device identifier の公開可否、OS identity、Relay route、Deep Link、WebSocket、暗号 binding は下位仕様・platform design の責務である。
- `SDK-OPEN-007`、Mobile handoff、Relay reconnect / recovery および具体 API は既存 OPEN として維持する。

## 12. Scope and Traceability

Common / SDK / Mobile / Relay Requirements の cancellation、request / response correlation、direction、participant および fail-closed を Interfaces の共通 concept、validator、security invariant および traceability table へ接続している。Exact schema は Interfaces Specification、transport は Relay / Handoff、Signer lifecycle は Signing Flow / Signing Protocol が引き続き所有する。

## 13. Domain Checks

| 観点                                      | 判定                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Context / responsibility / trust boundary | Pass。SDK / Relay は非権限、Browser / Mobile Signer が判断主体、wallet-core は raw signing 主体である。         |
| Request / response lifecycle              | Pass。cancel acknowledgement、terminal outcome、delivery disposition、cross-request isolation が追跡できる。    |
| Handoff binding                           | Pass。recipient / participant、device / signer identity、generation、channel / direction を受信側が再検証する。 |
| Security / secret boundary                | Pass。Relay ACK、transport status、session existence が approval / signing success の代替にならない。           |
| Downstream handoff                        | Pass。具体 field / wire を固定せず、必要な semantic boundary を下位仕様へ渡している。                           |

## 14. Validation Results

| 検証                                                                                                                                                    | 結果                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `pnpm exec prettier --check ...`                                                                                                                        | 無出力のまま完了しなかったため中断。           |
| `./node_modules/.bin/prettier --check docs/design/architecture.md docs/design/interfaces.md docs/design/signing-flow.md docs/design/security-design.md` | PASS。                                         |
| `git diff --check`                                                                                                                                      | PASS。                                         |
| app / package lint、typecheck、test、build                                                                                                              | Not applicable。docs/design のみの変更である。 |

## 15. Review Gates

| Gate                                         | 判定 | 根拠                                                                                             |
| -------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| 1. 目的と範囲                                | Pass | 共通 concept と non-goals が維持されている。                                                     |
| 2. Context / responsibility / trust boundary | Pass | Relay、Signer、SDK、wallet-core の authority が明確である。                                      |
| 3. Dependencies / direction                  | Pass | recipient / channel の検証責任が transport と Signer に分かれている。                            |
| 4. Main flows                                | Pass | cancel race、terminal、delivery unknown、late / stale response を区別している。                  |
| 5. Data ownership                            | Pass | request、approval、result、recipient、delivery state を request 間で共有しない。                 |
| 6. Security / interoperability               | Pass | wrong participant / device / direction を fail-closed とし、Chain / Network binding を維持する。 |
| 7. Upstream consistency                      | Pass | Requirements、Signing Flow、Relay / Handoff と重大な矛盾がない。                                 |
| 8. Downstream implementability               | Pass | exact API / schema は委譲しつつ semantic contract の推測余地を解消している。                     |

## 16. Remaining Risks and Open Decisions

Public API と transport-specific representation、cancel acknowledgement の wire 契約、device identity の具体化および実装適合性は下位工程で確認する。これらは共通 interface の high-level semantics を変更しない。

## 17. Automatic Changes

本レビュー中に Interfaces、Requirements、Specifications、実装、テスト、設定は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

**`READY` — `INTERFACES DESIGN READY`**
