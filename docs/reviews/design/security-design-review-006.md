# Security Design Review 006

## 1. Review Target

- 対象: [Security Design](../../design/security-design.md)
- 確認日: 2026-09-20
- 成果物: `docs/reviews/design/security-design-review-006.md`
- レビュー範囲: protected asset、trust boundary、Relay E2E confidentiality、E2E secret / transport credential の所有、Mainnet capability release gate、fail-closed、security invariants、下位委譲。
- 未確認範囲: 暗号方式・パラメータ、credential schema、runtime evaluator、build embedding、実装、ログ設定、テストおよび実際の release evidence。

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が4つの独立 self-review pass を実施した。

| Pass            | 確認結果                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A 相当 | Browser / Mobile Signer、SDK、Relay、wallet-core、Release / Operation の責務と依存方向を確認。E2E secret と transport credential の責務逆流はない。 |
| Reviewer B 相当 | protected asset、Relay trust boundary、E2E confidentiality、Mainnet fail-closed、secret lifecycle、security invariant を確認。                      |
| Reviewer C 相当 | release failure、evidence missing / invalid / expired / unknown、Relay outage / retention / logging の安全側責任を確認。                            |
| Reviewer D 相当 | Requirements、Architecture、ADR、Mainnet release evidence、Relay / Handoff Specification への traceability と委譲境界を確認。                       |

## 3. Evidence Used

| 資料                                               | 確認目的                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Security Design §3、§11、§12、§15〜§18             | 対象本文の trust boundary、secret ownership、Relay、release gate、invariants。    |
| Common Requirements `CR-NFR-006` / `CR-AC-008`     | Mainnet capability の evidence / policy gate と fail-closed。                     |
| Relay Requirements `RR-003`、`RR-008`、`RR-AC-006` | opaque envelope、E2E secret 非保持、transport credential 分離。                   |
| Architecture §6.5、§9、§16、§17.1                  | Relay credential / E2E secret、Mainnet gate、責任主体の既存設計。                 |
| Mainnet Evidence Lite ADR / release evidence       | current release policy、evidence failure、Testnet-only / unavailable の運用根拠。 |
| Relay / Handoff Specification                      | `appToken` / `webToken` と `sessionSecret` の分類・境界の補助確認。               |
| `security-design-review-005.md`                    | `DR-SEC-001` / `DR-SEC-002` の required correction と continuity を確認。         |

## 4. Review Result

`READY`

## 5. Summary

Security Design は Mainnet capability を current release policy / evidence gate に結び付け、evidence 欠落・不整合・期限切れ・検証不能、承認・署名・trusted key failure、policy unknown では Mainnet を有効化しないことを明示した。Testnet-only または unavailable の安全側継続と release evidence への委譲も追跡できる。

Relay については、message confidentiality を Relay が復号できない E2E protected opaque envelope とし、E2E session secret / derived encryption material と endpoint authorization credential を別分類・別所有とした。Relay は E2E secret を受領・復号・保持・hash 化・導出・ログ出力せず、credential と metadata も最小限に扱う。Critical、Major、Minor の新規 finding は確認しなかった。

## 6. Finding Status

| ID                               | Severity          | Status              | 今回の状態根拠                                                                                                     |
| -------------------------------- | ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `SD-SEC-001`〜`SD-SEC-005`       | 過去 Medium       | Resolved / 再発なし | displayability、Wallet Core failure、message context、untrusted boundary、per-sign authentication を維持している。 |
| `SD-REVIEW-001`〜`SD-REVIEW-003` | 過去 Medium / Low | Resolved / 再発なし | startup lock、Sensitive UI、Symbol / NEM Key Identity separation を維持している。                                  |
| `DR-SEC-001`                     | Minor             | Resolved            | §16、§17、§18 が Mainnet evidence / policy gate、fail-closed、release source を明示した。                          |
| `DR-SEC-002`                     | Minor             | Resolved            | §3.2、§11.1、§12.1、§18 が E2E opaque、secret class、credential separation、Relay non-decryption を明示した。      |

## 7. Required Changes

なし。Critical の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。

## 9. Resolved Findings

`DR-SEC-001` は Mainnet capability と release evidence / policy の high-level gate、判定不能時の fail-closed、Testnet-only / unavailable、release evidence source の追跡を追加したことで解消した。`DR-SEC-002` は E2E secret と transport credential を別の security class / owner とし、Relay を ciphertext-only の opaque boundary と明示したことで解消した。

## 10. Upstream Feedback

なし。Mainnet release gate と Relay E2E confidentiality に関する Requirements / ADR は現行 Design を安全に評価できる。

## 11. Deferred Findings

- AES / KDF / AEAD、key length、nonce、credential representation、HTTP header、wire format、TTL、Redis、runtime evaluator は下位仕様・実装・運用へ委譲する。
- evidence の収集、署名、trusted key rotation、build embedding、配布停止および実際の release artifact は Release Readiness Review の対象である。
- Mobile biometric capability、host Binding、backup / migration、current workspace の実装有無は既存 OPEN として維持する。

## 12. Scope and Traceability

Common Requirements と ADR の Mainnet gate は Security Design §16〜§18、Architecture §16 / §17.1 および release evidence へ追跡できる。Relay Requirements の opaque / E2E 条件は Security Design §3.2、§11.1、§12.1、§17、§18 と Relay / Handoff 下位資料へ接続している。Design は暗号・wire・runtime implementation を新たに決定していない。

## 13. Domain Checks

| 観点                                     | 判定                                                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Protected assets / trust boundary        | Pass。private key、Wallet Store、E2E secret、transport credential、Relay、Signer、wallet-core の境界を識別できる。                              |
| Secret ownership / lifecycle             | Pass。E2E secret は client-side、Relay credential は transport authorization、private key は wallet-core / trusted host boundary の責任である。 |
| Authentication / signing authority       | Pass。Relay、SDK、Node、OS が four-condition gate や signing authority を代替しない。                                                           |
| Failure / fail-closed                    | Pass。Mainnet evidence unknown / invalid と Relay opaque / state failure を安全側へ接続している。                                               |
| Security invariants / downstream handoff | Pass。Mainnet gate、E2E confidentiality、no secret logging / persistence を下位へ委譲できる。                                                   |

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
| 1. 目的と範囲                                | Pass | 共通 security policy と下位委譲の範囲を維持している。                                            |
| 2. Context / responsibility / trust boundary | Pass | Relay、Signer、wallet-core、SDK、Release / Operation の trust boundary が明確である。            |
| 3. Dependencies / direction                  | Pass | Relay / SDK が E2E secret、signing authority、Mainnet gate を代替しない。                        |
| 4. Main flows                                | Pass | signing、Relay、release failure、incident / recovery の安全側責任が追跡できる。                  |
| 5. Data ownership                            | Pass | E2E secret、transport credential、metadata、opaque envelope の所有・保持・logging が区別される。 |
| 6. Security / interoperability               | Pass | Mainnet / Testnet、Relay E2E、four-condition gate、chain boundary を弱めていない。               |
| 7. Upstream consistency                      | Pass | Requirements、ADR、Architecture、Relay / Handoff と整合する。                                    |
| 8. Downstream implementability               | Pass | high-level policy を固定し、crypto / wire / runtime detail は正しい owner へ委譲している。       |

## 16. Remaining Risks and Open Decisions

実際の Mainnet evidence evaluator、trusted key、build embedding、Relay protocol / retention、Mobile 実装および runtime secret handling は未検証である。これらは Design の残存 security boundary を変更しないが、Implementation / Release Readiness Review で確認が必要である。

## 17. Automatic Changes

本レビュー中に Security Design、Requirements、Specifications、実装、テスト、設定は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

**`READY` — `SECURITY DESIGN READY`**
