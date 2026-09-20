# MosaicLynx 共通 Requirements Profile / Chain 境界変更レビュー

## 1. Review Target

- 対象: [MosaicLynx 共通要件定義書](../../requirements/requirements.md)
- 確認日: 2026-09-20
- 対象時点: `a822596` (`docs(requirements): Profile の Chain 境界を単一化`)
- 前回レビュー: [requirements-review-006](./requirements-review-006.md)
- 上位 Concept: [MosaicLynx Concept Sheet](../../concept/concept-sheet.md)
- 最新 Concept review: [concept-sheet-review-003](../concept/concept-sheet-review-003.md)
- 使用 Skill: [requirements-review Skill](../../../.agents/skills/requirements-review/SKILL.md)、[review-common playbook](../../../.agents/skills/review-common/review-playbook.md)、reviewers、security-checklist、review-gates、output-format
- 今回の位置付け: ユーザー決定に基づく `CR-017` と `CR-AC-020` の追加後レビュー。既存 Requirements の品質を独立に再確認し、単一 Chain Profile の要件が仕様設計へ引き渡せる状態かを判定した。
- レビュー範囲: 目的、利用者、責任境界、Symbol / NEM と Mainnet / Testnet の分離、`CR-017`、`CR-AC-020`、下流引継ぎ、既存要求との内部整合性および Security 要件。
- 未確認範囲: Profile / Account の具体 schema、API、保存形式、状態遷移、エラー、UI、backup format、実装・テストの適合性。既存の下流仕様は矛盾と引継ぎ先の確認に限って補助的に参照し、下流詳細の不足を Requirements の欠陥とは判定していない。

## 2. Execution Audit

- Phase 0: 対象 `docs/requirements/requirements.md`、対象コミット、前回レビュー、Concept、Concept review、既存レビュー成果物の最大番号を確認した。既存最大番号は 006 であり、007 を新規成果物とした。
- Phase 1 Reviewer A 相当（明確性・完全性）: `CR-017`、`CR-AC-020`、Profile / Account / Chain / Network 用語、MUST、拒否条件、受入条件、要求 ID と下流引継ぎを確認した。
- Phase 1 Reviewer B 相当（利用価値・スコープ）: 一般ユーザーの安全な署名判断、Symbol / NEM の対応範囲、Chain ごとの別 Profile、v1 / milestone、既存 backup / migration 非対象および Concept との整合を確認した。
- Phase 1 Reviewer C 相当（Security Reviewer）: protected asset、秘密情報分離、Account / signing authority、Profile / Chain 境界、権限・承認の分離、wrong Chain の fail-closed、wallet-core / Application / Signer の責任境界を確認した。
- Phase 2: ユーザー決定を Requirements の根拠として確認し、既存要求との重複・矛盾、下流資料に残る旧契約を分離した。下流資料の旧契約は Requirements の formal finding ではなく、次工程への Deferred Finding とした。
- Phase 3: Requirements Review の8つの Review Gate を適用した。サブエージェントは使用していない。レビュー対象以外の要件、仕様、設計、実装コードは変更していない。

## 3. Evidence Used

- [共通 Requirements](../../requirements/requirements.md): 現行の Scope、Profile / Account 共通要求、`CR-005`、`CR-NFR-005`、`CR-017`、`CR-AC-003`、`CR-AC-020`、未決事項および下流引継ぎの確認。
- 対象コミット `a822596`: `CR-017`、`CR-AC-020`、下流引継ぎおよび `MEMORY.md` の変更範囲の確認。
- [前回 Requirements review](./requirements-review-006.md): `RR-001`〜`RR-004` の状態、既存の Deferred Findings、前回の Gate 判定の追跡。
- [Concept Sheet](../../concept/concept-sheet.md): 一般ユーザー中心の価値、Symbol / NEM の区別、認証・Account 認可、秘密情報、Signer / SDK / Relay の責任境界。
- [Concept review-003](../concept/concept-sheet-review-003.md): Concept が `READY` であり、未解決 Critical がないことの確認。単一 Chain Profile の具体的な根拠を Concept から逆生成していない。
- [Browser Extension 要件](../../requirements/browser-extension.md)、[Mobile App 要件](../../requirements/mobile-app.md)、[SDK 要件](../../requirements/sdk.md): 共通要求を下流へ渡す責任境界と Profile / Account / Chain / Network の利用文脈を確認。
- [Profile / Account Specification](../../specifications/profile-account-spec.md)、[Product Specification](../../specifications/product-spec.md)、[Architecture](../../design/architecture.md): 既存の下流契約と今回の単一 Chain 方針の整合・差分を確認する補助資料。これらを新しい Requirements の根拠にはしていない。
- Requirements Review Skill、review-common playbook、reviewers、security-checklist、review-gates、output-format: レビュー手順、重大度、Gate、成果物形式および Security 観点の確認。

## 4. Review Result

**READY**

## 5. Summary

`CR-017` と `CR-AC-020` は、ユーザー決定「Symbol と NEM の両方を利用できる Profile 構成の廃止」を、Requirements フェーズで必要な外部要求・責任境界・受入条件へ整理できている。

- 一つの Profile が属する Chain を一つに限定している。
- Symbol と NEM の両方を利用する場合は Chain ごとに別 Profile として扱うことを定めている。
- Account / Key Identity、接続許可、署名権限、署名要求、承認および署名結果の Chain 境界を分離している。
- 別 Chain への暗黙の切り替え、共有、fallback、移送を禁止し、受入条件で no-sign / no-success を確認できる。
- 開発中のため、既存の複数 Chain Profile / backup との互換性・移行・既存状態の引継ぎを要件に含めないことを明記している。

Requirements 本文に Critical / Major / Minor の新規指摘はない。前回の `RR-001`〜`RR-004` は今回の変更による回帰を確認しなかったため、Resolved の状態を維持する。

既存の Profile / Account Specification と Product Specification には、なお `enabledChains` および同一 Profile で Symbol / NEM を扱う旧契約が残っている。この差分は今回の Requirements の品質を不成立にするものではなく、`REQ7-001` として次の Specification 整合化へ引き継ぐ。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー              | 今回の状態根拠                                                                                           |
| -------- | -------- | -------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `RR-001` | Critical | Resolved | `requirements-review-005` | SDK の責任境界、Trust Boundary、秘密情報・署名・最終承認の非担当が現行本文に維持されている。             |
| `RR-002` | Critical | Resolved | `requirements-review-005` | 認証、unlock、Account authorization、Explicit approval の4条件と no-sign / no-success が維持されている。 |
| `RR-003` | Critical | Resolved | `requirements-review-005` | Security guarantee boundary と管理境界外の完全 compromise の非保証が維持されている。                     |
| `RR-004` | Minor    | Resolved | `requirements-review-005` | `OPEN-004` は履歴上の欠番として扱われ、現在の未決事項へ戻っていない。                                    |
| —        | —        | —        | —                         | 今回の New / Open / Reopened formal finding はない。                                                     |

## 7. Required Changes

なし。Critical / Major の New、Open、Reopened はない。

## 8. Optional Improvements

なし。Minor の New、Open、Reopened はない。

## 9. Resolved Findings

今回、前回レビュー指摘に対する追加の修正確認は対象変更の回帰確認に限定した。`RR-001`〜`RR-004` は現行本文で解消状態を維持しており、再オープン条件は確認されなかった。

## 10. Upstream Feedback

なし。Concept は Symbol / NEM の対応、Chain / Network の分離、Signer の責任境界および Security 原則を定めており、今回のユーザー決定と矛盾する明示的な Profile 構成を定めていない。単一 Chain Profile の決定はユーザーから直接与えられた Requirements の変更根拠として扱った。

## 11. Deferred Findings

既存の `REQ4-001`〜`REQ4-003` は前回レビューから継続する。今回の変更に伴う新規の下流整合事項を `REQ7-001` として追加する。いずれも Requirements の Review Gate を不合格にする formal finding ではない。

- `REQ4-001`（Open / non-blocking）: `symbol-nem-wallet-core` の採用承認、参照 commit / version、同一 checkout からの外部契約再現性の確認。
- `REQ4-002`（Deferred to specification alignment）: transaction signing と message signing の v1 共通能力と、既存 Web Transaction Handoff Specification の対象範囲・`signData` 記載の整合。
- `REQ4-003`（Open / lower-phase handoff）: `CR-002`、`CR-007-MSG`、`CR-AC-001`、`CR-AC-006` の確認可能な影響、message の Chain / Network / Account、format / encoding / canonicalization、UI 詳細。
- `REQ7-001`（Deferred to specification alignment）: [Profile / Account Specification](../../specifications/profile-account-spec.md) §3、§4、§11、§26 および [Product Specification](../../specifications/product-spec.md) §4、§7.4、§10 が、`enabledChains`、Symbol / NEM 両方の Account、Profile 作成後のチェーン追加・変更を前提としている。`CR-017` と `CR-AC-020` を正本として、次の Specification Author が単一 Chain Profile の作成、Account、権限、表示、backup の適用範囲を整合させる。既存データ移行・後方互換性の追加は今回のユーザー決定に反するため、下流で新規要件化しない。

## 12. Scope and Traceability

| 根拠・変更                                                                 | Common Requirements                                          | 下流への引継ぎ                                                                                          | 判定 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---- |
| ユーザー決定: 同一 Profile で Symbol / NEM の両方を利用する構成を廃止      | §4.2、`CR-017`、`CR-AC-020`                                  | Profile / Account Specification、Product Specification、各 Signer の Profile / Account 詳細             | 適切 |
| Symbol / NEM と Mainnet / Testnet を区別する                               | `CR-005`、`CR-NFR-005`、`CR-AC-003`                          | Chain Compatibility、各 platform の要求・仕様                                                           | 適切 |
| Account、権限、承認および署名結果を対象 Chain と一致させる                 | §4.2、`CR-010`、`CR-016`、`CR-017`、`CR-AC-017`、`CR-AC-020` | Browser / Mobile / SDK の Profile-local context、permission、Account authorization、pre-sign validation | 適切 |
| 既存の複数 Chain Profile / backup 互換性・移行・既存状態の引継ぎを対象外化 | `CR-017`                                                     | 下流仕様は開発中の直接変更として扱い、移行機能を追加しない                                              | 適切 |
| 既存の全体責任境界・Security 原則                                          | `CR-008`、`CR-011`、`CR-013`、`CR-NFR-001`〜`CR-NFR-013`     | wallet-core、Signer、SDK、Relay、release security の既存責任境界                                        | 適切 |

要求の方向は `ユーザー決定 / Concept → Common Requirements → Browser / Mobile / Relay / SDK Requirements → Design → Specification` と追跡できる。今回の変更は Symbol / NEM の対応を削除せず、Profile の同時利用境界だけを狭めている。具体的な schema、API、error、状態遷移および保存方式は下流へ委譲されている。

## 13. Domain Checks

| 観点             | 判定 | 根拠                                                                                                                                        |
| ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 要求の完全性     | PASS | 単一 Chain Profile、別 Profile の利用、異なる Chain の権限・承認・要求の共有禁止が共通要求と受入条件に存在する。                            |
| 責任・範囲       | PASS | Application / Signer が Profile / Account 境界を担い、SDK / Relay / dApp / wallet-core の既存責任境界を変更していない。                     |
| MUST / SHOULD    | PASS | `CR-017` は必要な外部不変条件を MUST とし、具体 API、型、保存方式、UI、エラー方式は下流へ委譲している。                                     |
| 受け入れ条件     | PASS | `CR-AC-020` が単一 Chain の確認、別 Profile の利用、異なる Chain の状態・権限・要求の拒否を外部から判定可能にしている。                     |
| セキュリティ     | PASS | Account / Key Identity、signing authority、permission、approval を Chain 境界に結び付け、wrong Chain の共有・fallback・移送を禁止している。 |
| Failure behavior | PASS | 複数 Chain の関連付け、別 Chain の暗黙切替、共有、fallback、移送を成立させず、署名結果を成功として返さない。                                |
| 相互運用性       | PASS | Symbol / NEM の対応自体は維持し、chain-specific な識別・Account・署名境界を保つ。Mainnet / Testnet の既存分離にも回帰がない。               |
| Phase boundary   | PASS | API、schema、error code、暗号、backup format、状態遷移、UI、実装方式を新しい Requirements として固定していない。                            |
| 回帰             | PASS | SDK 境界、4条件署名認可、Security guarantee boundary、Mainnet gate、backup の v1 共通非包含、OPEN / FUTURE の意味に回帰がない。             |

Security checklist では、protected assets、confidentiality、integrity、authentication / authorization、secret lifecycle、failure safety、trust / responsibility boundary、chain / network separation を適用した。`CR-008`、`CR-009`、`CR-010`、`CR-013`、`CR-016`、`CR-NFR-001`、`CR-NFR-002`、`CR-NFR-004`、`CR-NFR-005`、`CR-NFR-008`、`CR-NFR-009`、`CR-NFR-013` および今回の `CR-017` / `CR-AC-020` で確認できる。暗号方式、KDF、AEAD、nonce、salt、zeroize、API field、wire format、実装方式は適用対象外とした。

## 14. Validation Results

- 対象本文の行番号、要求 ID、受入条件 ID、下流参照および既存レビュー番号を確認した。
- `git diff --check`: レビュー成果物作成前の作業ツリーについて実行し、問題がないことを確認した。
- Markdown formatter: レビュー成果物作成後に対象ファイルだけを確認する。repository-wide formatter は実行対象外とした。
- Repository-wide lint / typecheck / test / build: 要件レビュー成果物のみの変更であり、実装検証は対象外とした。
- Source 非変更: レビュー中は `docs/requirements/requirements.md`、Concept、下流 Requirements、Design、Specification、ADR、release 資料および実装コードを変更していない。

## 15. Review Gates

| Gate              | 判定 | 根拠                                                                                                                                   | 対応 ID |
| ----------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1. 目的と課題     | PASS | 単一 Chain 化は安全な署名判断と Chain / Account 境界を明確にする変更であり、Symbol / NEM の製品価値を削除していない。                  | なし    |
| 2. 利用者と責任   | PASS | 利用者は Chain ごとに別 Profile を扱い、Application / Signer、SDK、Relay、dApp、wallet-core の既存責任が維持される。                   | なし    |
| 3. 対象範囲       | PASS | Symbol / NEM の両対応は維持し、Profile の同時 Chain 利用だけを対象外とした。Mainnet / Testnet、backup 共通非包含も維持される。         | なし    |
| 4. 要件と制約     | PASS | 単一 Chain 境界、異なる Chain の権限・承認・要求の共有禁止、開発中のため既存移行非対象が明示されている。                               | なし    |
| 5. 受け入れ条件   | PASS | `CR-AC-020` により、単一 Chain、別 Profile、拒否・no-sign / no-success を外部から確認できる。                                          | なし    |
| 6. 内部整合性     | PASS | 新設要件は既存の Chain / Network 分離、Account authorization、fail-closed、Security boundary と矛盾しない。                            | なし    |
| 7. 不可欠な前提   | PASS | 既存の wallet-core、Signer、SDK、Relay の責任境界と下流委譲を維持し、具体方式を要求へ逆流させていない。                                | なし    |
| 8. Concept 整合性 | PASS | Concept の Symbol / NEM 対応、Chain / Network 分離、安全な署名判断と矛盾せず、ユーザー決定を Requirements の追加制約として追跡できる。 | なし    |

すべての Review Gate が PASS であり、現在の不合格 Gate はない。`REQ7-001` は既存下流契約との整合化に関する Deferred Finding であり、Requirements の Gate failure には対応付けない。

## 16. Remaining Risks and Open Decisions

- `REQ7-001`: 下流 Profile / Account Specification と Product Specification に旧来の複数 Chain Profile 契約が残る。次工程では `CR-017` を正本として整合化する必要がある。
- `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` および `CR-OPEN-001`、`CR-OPEN-002` は既存の未決事項として維持される。
- 単一 Chain Profile の具体的な作成、Account の関連付け、permission、表示、backup の適用範囲、エラーおよび状態遷移は未決定であり、Specification / Design で定める。
- 既存状態の互換性・移行を考慮しない方針により、開発中の既存データは再作成を前提とする。ただし、具体的なデータ削除や保存処理は今回の Requirements では決めていない。

## 17. Automatic Changes

レビュー中に変更したのは、このレビュー成果物 `docs/reviews/requirements/requirements-review-007.md` の新規作成だけである。Requirements、Concept、下流 Requirements、Design、Specification、ADR、release 資料、Skill および実装コードは変更していない。

## 18. Final Decision

**READY**

`CR-017` と `CR-AC-020` はユーザー決定、既存の Chain / Network 分離、Account / signing authority の Security 境界へ追跡でき、Critical / Major / Minor の新規 formal finding はない。8つの Review Gate はすべて PASS である。`REQ7-001` は次の Specification 整合化へ Deferred とし、Requirements を仕様設計へ進められる状態と判定する。

REQUIREMENTS PHASE READY
