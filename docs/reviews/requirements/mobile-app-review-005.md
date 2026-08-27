# MosaicLynx Mobile App Requirements RR-005 対応後再レビュー

## 1. Review Target

- 対象: [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)
- レビュー種別: RR-005 対応後再レビュー
- レビュー日: 2026-08-27
- 前回レビュー: [`mobile-app-review-004.md`](mobile-app-review-004.md)
- 指摘対応コミット: `88cee40c7018925981e8c222d7eefc902f377cde`
- 上位 Concept: [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- 上位 Common Requirements: [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- 最新 Concept review: [`concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)
- 最新 Common Requirements review: [`requirements-review-006.md`](requirements-review-006.md)
- 使用 Skill: [`requirements-review/SKILL.md`](../../../.agents/skills/requirements-review/SKILL.md)

本レビューは、復元後のフルレビューを前提とした `mobile-app-review-004.md` の RR-005 対応後再レビューである。主目的は RR-005 の解消確認、修正による回帰確認、Requirements フェーズ境界の確認であり、全面的なフルレビューの再実施ではない。ただし、明白な新規 Critical 問題または回帰がないかも確認した。前回の READY 判定は本判定の根拠にしていない。

レビュー中に Source、Concept、Design、Specification、その他のレビュー成果物は変更していない。

## 2. Execution Audit

現行 `requirements-review` Skill と、その参照する review-common playbook、reviewers、review-gates、output-format を適用した。

1. 対象、前回レビュー、対応コミット、RR-005 の完了条件を特定した。
2. `MR-011`、`MR-AC-012`、`MR-OPEN-007` と traceability を照合した。
3. RR-005 の修正が外部から判定可能か、MR-011 の趣旨と委譲を維持しているか確認した。
4. Common Requirements の SDK 境界、署名前提、Security guarantee boundary と Mobile 固有要求の整合を確認した。
5. milestone、Signer、Relay、authentication / unlock / Account authorization、lifecycle、wallet-core / OS 境界、backup / migration、Mainnet gate、Requirements フェーズ境界について回帰を確認した。
6. 8 つの正式 Review Gate、finding 状態、レビュー成果物の Markdown・リンク・ID・差分を検証する。

本再レビューでは、具体的な OS API、UI、画面一覧、state machine、transport schema、暗号方式などを Requirements の不足として要求していない。

## 3. Evidence Used

- 対象: [`mobile-app.md`](../../requirements/mobile-app.md)
- 前回レビュー: [`mobile-app-review-004.md`](mobile-app-review-004.md)
- 指摘対応コミット: `88cee40c7018925981e8c222d7eefc902f377cde` の Source 差分
- 上位 Concept: [`concept-sheet.md`](../../concept/concept-sheet.md)
- 上位 Common Requirements: [`requirements.md`](../../requirements/requirements.md)
- 上位レビュー: [`concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)、[`requirements-review-006.md`](requirements-review-006.md)
- 責任境界・下流 traceability の確認対象: [`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)、[`architecture.md`](../../design/architecture.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`mobile/`](../../mobile/)、[`release/`](../../release/)
- 現行 Skill と共通レビュー規約: [`requirements-review/SKILL.md`](../../../.agents/skills/requirements-review/SKILL.md)、Skill が参照する review-common playbook、reviewers、review-gates、output-format

下流資料は用語、責任境界、traceability の確認に限って使用し、下流の実装方式や仕様詳細を Requirements へ逆流させていない。今回、追加の Apple / Android 公式資料の調査は不要だった。対象文書に具体的 platform API の採用判断を求めていないためである。

## 4. Review Result

**READY**

RR-005 は RESOLVED であり、今回の対応差分による回帰、Critical の New / Open / Reopened finding、Requirements フェーズ逸脱は確認されなかった。8 つの Review Gate はすべて PASS と判定する。

## 5. Summary

`MR-AC-012` に、スクリーンショット、画面録画、最近使ったアプリ一覧、通知表示等の露出について、リスク評価と必要な platform policy の定義に加え、OS / platform が防止できない範囲を完全に防止できる保証として利用者へ表示しないことが明記された。これにより、`MR-011` の「完全に防止できると表示してはならない」という要求を Acceptance Criteria から直接判定できる。

`MR-011` 自体の SHOULD の趣旨、具体的な禁止・許可や OS 差異を `MR-OPEN-007` へ委譲する構造は維持されている。修正は acceptance condition の追加に限定され、screenshot flag、対象画面、OS API、具体的 platform policy、UI などの下位設計を Requirements に導入していない。

Android / iOS の別 milestone、Mobile Signer と Relay の分離、Common Requirements の SDK / Signer 境界、共通の署名前提、Security guarantee boundary、fail-closed、wallet-core / OS 責任境界、backup / migration の条件付き扱いにも回帰はない。Mobile App Requirements の判定は READY だが、Requirements フェーズ全体の完了を意味しない。

## 6. Finding Status

| ID     | Severity | Status   | 対象                  | 判定                                                                                                                   |
| ------ | -------- | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| RR-005 | Minor    | Resolved | `MR-011`、`MR-AC-012` | Acceptance Criteria に、OS / platform が防止できない露出を完全防止保証として表示しないという直接判定条件が追加された。 |

現時点の New / Open / Reopened finding はない。Critical 0、Major 0、Minor 0 の active finding である。

## 7. Required Changes

なし。RR-005 の Requirements レベルで必要だった最小修正は対応済みであり、追加の blocker は確認されなかった。

## 8. Optional Improvements

なし。今回の対象範囲に、単なる表現上の好みを理由とする新規 finding は追加していない。

## 9. Resolved Findings

### RR-005 — RESOLVED

- Severity: Minor
- 初出: [`mobile-app-review-004.md`](mobile-app-review-004.md)
- 対象: `MR-011`、`MR-AC-012`
- 問題: `MR-011` は OS / platform が防止できない範囲を完全に防止できると表示してはならないと要求していたが、従前の `MR-AC-012` からは当該非保証条件を直接判定できなかった。
- 根拠: 対応コミット後の `MR-AC-012` は、露出リスクの評価、必要な platform policy の定義、および防止不能な範囲を完全防止保証として利用者へ表示しないことを一つの受け入れ条件として明記している。
- 影響: Acceptance Criteria から、過剰な完全防止保証をしない要求の合否を外部から判定できる。
- Requirements レベルの対応: `MR-AC-012` に直接判定可能な非保証条件を追加した。
- 下位フェーズへの委譲: 具体的な禁止・許可、対象画面、OS 差異、screenshot flag、OS API、platform policy の具体内容、UI は `MR-OPEN-007` および下位フェーズへ委譲した。
- 完了条件 / 再確認: `MR-011` と `MR-AC-012` が同じ露出カテゴリと保証境界を扱い、Acceptance Criteria に直接判定可能な非保証条件があり、`MR-OPEN-007` の委譲が維持されていることを確認した。条件を満たしているため RESOLVED とする。

## 10. Deferred Findings

`MR-OPEN-007` は、具体的な screenshot / recording / recent apps / notification policy、対象画面、OS 差異等の未決事項を扱う。これは今回の RR-005 を解消するための直接判定条件とは別の下位判断であり、現時点の Mobile Requirements READY を blocker としない。

Common Requirements review に記録された `REQ4-001`、`REQ4-002`、`REQ4-003`（wallet-core 固定参照、message signing handoff alignment、message format / encoding / canonicalization、UI 表示詳細に関する deferred 扱い）は本レビューの RR-005 とは別管理であり、非 blocking の状態を変更しない。これらを Mobile Requirements の新規 blocker へ昇格させていない。

## 11. Scope and Traceability

`MR-011` の露出リスク評価と platform policy の責任は、`MR-AC-012` の受け入れ条件へ直接追跡できる。完全防止保証の境界は、`CR-NFR-013` とその Acceptance Criteria の Security guarantee boundary と整合する。具体的な policy と OS 差異は `MR-OPEN-007` および下流の Mobile privacy / platform policy 資料へ委譲されている。

Mobile の外部要求受信、lifecycle、authentication / unlock / Account authorization、explicit approval、fail-closed は Common Requirements の `CR-015`、`CR-016`、`CR-NFR-013` を弱めていない。SDK は dApp 側の連携接点であり Signer ではなく、Relay は非署名の受け渡し基盤であり、いずれも Mobile Signer の最終確認・承認・署名を代替しない。

Mobile Requirements の traceability は次の流れを維持する。

`Concept → Common Requirements → Mobile App Requirements → Design / Specification`

今回の差分は Requirements と Acceptance Criteria の対応付けを補強するものであり、Design / Specification の決定を Requirements に取り込んでいない。

## 12. Domain Checks

| 観点                                    | 結果 | 確認内容                                                                                               |
| --------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| RR-005 の直接判定性                     | PASS | `MR-AC-012` に非防止可能な露出を完全防止保証として表示しない条件がある。                               |
| `MR-011` の趣旨                         | PASS | SHOULD のリスク評価・policy 定義と、完全防止保証をしない境界を維持している。                           |
| `MR-OPEN-007` の委譲                    | PASS | 具体的 policy、対象画面、OS 差異、実装方式を未決 / 下位へ委譲している。                                |
| Mobile Signer と milestone              | PASS | Android / iOS は別 Signer milestone であり、Relay や v1 全体と混同していない。                         |
| Common traceability                     | PASS | SDK 境界、共通署名前提、Security guarantee boundary を弱めていない。                                   |
| Authentication / unlock / authorization | PASS | 外部経路、lifecycle、再入で条件を無条件再利用せず、確認不能時に fail-closed となる責任を維持している。 |
| Relay 境界                              | PASS | Relay が署名、semantic approval、secret handling、final approval、announce を担わない。                |
| wallet-core / OS 境界                   | PASS | secret-dependent crypto / raw signing と Mobile / OS の責任を混同していない。                          |
| Security guarantee boundary             | PASS | Mobile Signer / 承認境界の正常動作範囲に限定し、OS 等の完全 compromise への過剰保証をしていない。      |
| lifecycle / request integrity           | PASS | background、停止、再生成、再開時に以前の承認を別要求へ自動再利用しない。                               |
| backup / migration                      | PASS | v1 共通 MUST へ昇格させず、提供時の条件付き扱いを維持している。                                        |
| Acceptance Criteria 品質                | PASS | RR-005 の追加条件は Requirements レベルで外部から判定可能で、下位実装詳細を要求していない。            |
| フェーズ境界                            | PASS | API、schema、state machine、暗号方式、UI、platform API の具体化を要求していない。                      |

## 13. Validation Results

- レビュー成果物の Markdown format: PASS（Prettier を本成果物のみに実行）
- repository 内リンク: PASS（対象、前回レビュー、上位資料、Skill、参照資料のリンク先を確認）
- heading / anchor: PASS（Skill の 17 セクションを順序どおりに配置）
- finding ID 重複: PASS（現行 finding の `RR-005` は一意に管理され、別の新規 ID はない）
- 既存レビュー非上書き: PASS（`mobile-app-review-004.md` を変更していない）
- Source 非変更: PASS（`docs/requirements/mobile-app.md` および対象外ファイルを変更していない）
- `git diff --check`: PASS
- repository-wide formatter / lint / test / build: 未実行（今回の変更はレビュー成果物のみであり、現行レビュー手順の対象外）

## 14. Review Gates

| Gate                | 判定 | 対応 finding               |
| ------------------- | ---- | -------------------------- |
| 1. 目的と課題       | PASS | なし                       |
| 2. 利用者と責任     | PASS | なし                       |
| 3. 対象範囲         | PASS | なし                       |
| 4. 要件と制約       | PASS | なし                       |
| 5. 受け入れ条件     | PASS | なし（RR-005 は RESOLVED） |
| 6. 内部整合性       | PASS | なし                       |
| 7. 不可欠な前提     | PASS | なし                       |
| 8. コンセプト整合性 | PASS | なし                       |

FAIL Gate はない。したがって、正式な blocker finding による差し戻し条件はない。

## 15. Remaining Risks and Open Decisions

- `MR-OPEN-007` に残る具体的な画面露出 policy、OS 差異、対象画面等は、適切な下位フェーズで決定する。
- OS / platform が防止できない露出を完全防止できると誤認させないという Requirements レベルの境界は確定したが、具体的な表示内容や platform policy は本レビューの対象外である。
- Common Requirements の deferred findings は別管理であり、本再レビューの判定を阻害しない。
- Mobile App Requirements は READY だが、Relay / SDK の復元後レビューを含む Requirements フェーズ全体は継続中である。

## 16. Automatic Changes

自動修正・自動生成による Source の変更はない。変更対象は本レビュー成果物のみである。

## 17. Final Decision

`RR-005` は **RESOLVED**。修正による回帰、新規 Critical 問題、Requirements フェーズ逸脱は確認されず、8 つの Review Gate はすべて PASS である。

**READY**

本判定は Mobile App Requirements の判定であり、Requirements フェーズ全体の完了判定ではない。
