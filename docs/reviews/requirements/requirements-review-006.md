# MosaicLynx 共通 Requirements 対応後再レビュー

## 1. Review Target

- 対象: [MosaicLynx 共通要件定義書](../../requirements/requirements.md)
- 確認日: 2026-08-27
- 対象時点: `6c05ae2cf3f5d70da7ae156d20e053e917b44062`
- 前回レビュー: [requirements-review-005](./requirements-review-005.md)
- 指摘対応コミット: `6c05ae2cf3f5d70da7ae156d20e053e917b44062`
- 上位 Concept: [MosaicLynx Concept Sheet](../../concept/concept-sheet.md)
- 最新 Concept review: [concept-sheet-review-003](../concept/concept-sheet-review-003.md)
- 使用 Skill: [requirements-review Skill](../../../.agents/skills/requirements-review/SKILL.md)、同 Skill が参照する [review-common playbook](../../../.agents/skills/review-common/review-playbook.md)、reviewers、review-gates、output-format
- 今回の位置付け: `requirements-review-005` で検出された `RR-001`〜`RR-004` の対応後再レビュー。前回レビューを無関係な範囲まで全面的にやり直すのではなく、指摘の解消、修正による回帰、Requirements フェーズ境界、Concept traceability、正式な Review Gate を重点確認した。
- 変更範囲: レビュー成果物のみを新規作成した。Requirements、Concept、下流要件、Design、Specification、ADR、release 資料、Skill および実装コードは変更していない。
- 未確認範囲: `CR-OPEN-*`、`OPEN-*` および `REQ4-*` に委譲された詳細な API、wire format、暗号方式、状態遷移、実装・テストの適合性は今回の Common Requirements の判定対象外とした。Mobile は計画上の下流対象であり、実装済み機能として検証していない。

## 2. Execution Audit

- Phase 0: 対象 `docs/requirements/requirements.md`、前回レビュー、対応コミット、Concept、Concept review、出力先の既存番号を確認した。既存最大番号は 005 であり、006 を新規作成対象とした。
- Phase 1 Reviewer A 相当（明確性・完全性）: CR / CR-NFR / CR-AC の MUST、責任主体、前提、失敗条件、受け入れ条件、Requirement ID と下流引継ぎを確認した。`CR-015`、`CR-016`、`CR-NFR-013` と `CR-AC-017`〜`CR-AC-019` を重点確認した。
- Phase 1 Reviewer B 相当（利用価値・スコープ）: 一般ユーザーを第一対象とする中心価値、dApp 開発者の付随価値、Signer 3種、非署名 Relay、SDK の位置付け、v1 / milestone / release、backup / restore、Concept との traceability を確認した。
- Phase 1 Reviewer C 相当（成立性・安全性）: SDK / dApp / Relay の Trust Boundary、認証・unlock・Account authorization・明示的承認、秘密情報分離、no-sign / no-success、fail-closed、入力非信頼、Chain / Network、Mainnet gate、wallet-core 境界を確認した。
- Phase 2: 対応コミットの差分と現行本文を照合し、前回指摘の重複・解消・再発を判定した。既存要件で解消できる事項、下位フェーズへ委譲すべき詳細、今回初めて採用する指摘を分離し、新規指摘は採用しなかった。
- Phase 3: 現行 `requirements-review` Skill の8つの Review Gate を適用し、全 Gate を判定した。サブエージェントは使用していない。レビュー成果物、リンク、見出し、ID、Source 非変更および `git diff --check` を検証対象とした。
- 前回レビューは、指摘 ID、状態および再確認条件の追跡にのみ使用した。前回の主張を現行本文の正しさの代替根拠にはしていない。

## 3. Evidence Used

- [共通 Requirements](../../requirements/requirements.md): 現行の Scope、主体表、CR / CR-NFR、CR-AC、未決事項、下流引継ぎの一次対象。
- 対応コミット `6c05ae2cf3f5d70da7ae156d20e053e917b44062`: `RR-001`〜`RR-004` に対応する現行本文の変更範囲を確認する差分。
- [前回 requirements review](./requirements-review-005.md): `RR-001`〜`RR-004` の初出、Severity、必要条件および Deferred Findings の状態追跡。
- [Concept Sheet](../../concept/concept-sheet.md): 一般ユーザー中心の価値、SDK / Signer / Relay の境界、認証・ロック・Account 認可、Security guarantee boundary、v1、backup / restore、OPEN / FUTURE の上流根拠。
- [Concept review-003](../concept/concept-sheet-review-003.md): Concept が `READY` / `CONCEPT PHASE READY` であることの確認。Requirements の正しさを代替する資料としては扱っていない。
- [Browser Extension 要件](../../requirements/browser-extension.md)、[Mobile App 要件](../../requirements/mobile-app.md)、[Relay 要件](../../requirements/relay.md)、[SDK 要件](../../requirements/sdk.md): 共通要求を各提供形態へ引き継ぐ責任、SDK の非署名・非秘密情報・非最終承認境界、認証・lock・承認・Relay の下流責任を用語・境界の整合確認に使用した。
- [Architecture](../../design/architecture.md): dApp、SDK、Signer、Relay、Application、wallet-core の責任分離と信頼境界の確認。
- [Product Specification](../../specifications/product-spec.md)、[Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md)、[Profile / Account Specification](../../specifications/profile-account-spec.md): 下流の既決事項、認証・Profile / Account・handoff の用語および明白な矛盾の確認。下流詳細を Common Requirements の不足へ逆流させていない。
- [Chain Compatibility Specification](../../specifications/chain-compatibility-spec.md): Symbol / NEM、Mainnet / Testnet および chain-specific 責任の境界確認。
- [Mainnet ADR](../../adr/0001-mainnet-evidence-lite.md)、[evidence policy](../../evidence/evidence-policy.json)、[Mainnet release evidence](../../release/mainnet-release-evidence.md): Mainnet release gate の既決境界確認。
- `.agents/project-context.md`、Requirements review Skill と参照された review-common 資料: 文書の役割、実行手順、正式な Severity、Status、Review Result、出力形式、Gate の確認。

下流資料は用語、責任境界および引継ぎの確認に使用し、下流に未決の詳細があることだけを理由に Common Requirements の blocker を追加していない。

## 4. Review Result

**READY**

## 5. Summary

`RR-001`〜`RR-004` はすべて解消された。

- `RR-001`: SDK が dApp 側の連携接点であり Signer の Trust Boundary 外にあること、秘密情報・署名・利用者の最終承認を担わないこと、入力を無条件に信頼しないことが、Scope、主体表、End-to-End、共通 MUST、CR-AC および SDK Requirements への下流 traceability に反映された。
- `RR-002`: 認証条件、Signer の署名可能な unlock 状態、対象 Profile / Chain / Network / Account の署名認可、利用者の明示的承認を全 Signer の共通署名前提として固定し、不成立・確認不能時の no-sign / no-success と dApp / SDK / Relay の非成立・非迂回を明記した。
- `RR-003`: Security guarantee を MosaicLynx が管理する Signer / 承認境界の正常動作範囲へ限定し、秘密情報分離、明示的承認、外部入力非信頼、外部主体による条件迂回不可を要求・受入条件へ追跡した。OS、端末、Browser、dApp / Web page、正規配布 artifact 等の完全 compromise までの無条件保証は明示的に除外された。
- `RR-004`: `OPEN-004` は履歴上の欠番であり、現在の未決事項ではなく、下流へ引き継がないことが明記された。

修正による回帰は確認されなかった。一般ユーザー中心の価値、dApp 開発者の位置付け、Browser Extension / Android / iOS の Signer、非署名 Relay、Relay milestone 完了による v1 完了、transaction / message signing、blind signing 禁止、dApp の独立検証、announce の外部責任、Symbol / NEM、Mainnet / Testnet、Mainnet gate、wallet-core 境界、backup / restore の共通非包含、fail-closed、OPEN / FUTURE および下流委譲は維持されている。

新規の Requirements レベル指摘はない。全8 Review Gate が PASS であり、Critical の New / Open / Reopened はないため、Common Requirements を READY と判定する。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー              | 今回の状態根拠                                                                                                              |
| -------- | -------- | -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `RR-001` | Critical | Resolved | `requirements-review-005` | SDK の主体、Scope、Trust Boundary、秘密情報・署名・最終承認の非責任、入力非信頼、SDK 要件への下流 traceability を確認した。 |
| `RR-002` | Critical | Resolved | `requirements-review-005` | CR-016 と CR-AC-017 が4つの署名前提、各不成立時の no-sign / no-success、dApp / SDK / Relay の非成立・非迂回を定義している。 |
| `RR-003` | Critical | Resolved | `requirements-review-005` | CR-NFR-013 と CR-AC-019 が保証の正常動作境界、管理境界内の Security 要求、外部完全 compromise の非保証を定義している。      |
| `RR-004` | Minor    | Resolved | `requirements-review-005` | §9 に `OPEN-004` の履歴上の欠番と現在の未決事項ではないことが明記され、§10 で下流へ引き継がないことが明記されている。       |

## 7. Required Changes

なし。Critical / Major の New / Open / Reopened 指摘はない。

## 8. Optional Improvements

なし。Minor の New / Open / Reopened 指摘はない。`RR-004` は対応確認済みのため、任意改善として残していない。

## 9. Resolved Findings

### RR-001: RESOLVED — SDK の共通責任・Trust Boundary

- 対象箇所: `docs/requirements/requirements.md:5-13,36-44,67-92,189-195,211-224,252-258,277-287,393-399,427-439,488-496`
- 発生条件・確認できた事実: 現行 Requirements は SDK を dApp 側の署名要求・結果の連携接点として主体表、Signer / Relay の適用主体、共通 Scope、End-to-End に含め、Signer ではないことを明記している。`CR-015` は SDK を Signer の Trust Boundary 外とし、秘密情報の保管・復号・利用、署名、利用者の最終承認を禁止し、SDK 経由の入力を Signer が検証前に無条件で信頼しないことを要求している。`CR-008`、`CR-NFR-001`、`CR-NFR-002`、`CR-011`、`CR-AC-018` にも責任境界が追跡されている。
- 既存の根拠: Concept §4、§8、§13 は SDK を dApp 側の連携接点とし、Signer ではなく、秘密情報・署名・最終承認を担わず、Web / dApp 側を Signer の Trust Boundary 外とする。SDK Requirements は共通要件の補足であり、Signer の署名可否・利用者確認・秘密情報処理を SDK へ移さない（`docs/requirements/sdk.md:5-9`）。
- 前回の問題と影響: 前回は共通 Requirements 単体で SDK を共通主体、非署名主体、秘密情報境界および承認境界として判定できず、Concept から SDK への traceability が切れていた。現行本文ではこの欠落が解消され、SDK が Signer の代替・迂回経路になる解釈を共通要求から排除できる。
- 対応確認された最小修正: Scope / 主体表 / End-to-End / 秘密情報要求 / 責任境界へ SDK を追加し、`CR-015` と `CR-AC-018` を新設し、`docs/requirements/sdk.md` を下流として明記した。
- 下位フェーズへ委譲する事項: SDK の API、payload、transport、caller binding、実行環境、error code、実装方式および SDK 固有の試験は SDK Requirements、Design、Specification へ委譲されている。これらの詳細を Common Requirements の不足とはしない。
- 完了条件・再確認方法: SDK が dApp 側の連携接点、Signer 外の主体、秘密情報・署名・最終承認の非担当であること、Signer が SDK 経由の入力を無条件に信頼しないこと、SDK Requirements へのリンクが Scope・共通 MUST・受入条件から追跡できることを確認し、RESOLVED とした。

### RR-002: RESOLVED — 認証・unlock・Account authorization の署名前提

- 対象箇所: `docs/requirements/requirements.md:94-104,205-232,252-273,415-439`
- 発生条件・確認できた事実: `CR-016` は、(1) 利用者の認証条件成立、(2) Signer の署名可能な unlock 状態、(3) 対象 Profile / Chain / Network / Account の署名認可成立、(4) 利用者の対象署名要求への明示的承認の全成立を、秘密情報使用・署名・署名結果返却の共通前提としている。未認証、locked、Account authorization 不成立、authorization 状態の確認不能、Profile / Chain / Network / Account 不整合、利用者未承認では署名を開始せず、署名結果を返さない。`CR-AC-017` は同じ条件を外部から確認できる成功・拒否条件としている。
- 既存の根拠: Concept §11 は認証条件、Signer の非ロック状態、対象 Account の認可を署名の前提とし、dApp、SDK、Relay による成立・迂回を禁止している。Mobile Requirements の `MR-006` / `MR-AC-005`、Profile / Account Specification の認証・lock 境界は、共通前提を下流で具体化する整合確認資料である。
- 前回の問題と影響: 前回の `CR-010` は認証失敗時の安全側終了に留まり、認証成功、unlock、対象 Account authorization の全成立を署名前提として固定していなかった。現行本文は `CR-010` の fail-closed、`CR-012` の失敗結果、`CR-016` の成功前提を役割分担しており、三者間に矛盾や不要な意味の重複はない。`CR-003` は要求ごとの明示的承認、`CR-009` は Account の確認・選択、`CR-016` は署名可能性の全条件を扱うため、重複ではなく追跡可能な層分けになっている。
- 対応確認された最小修正: §4.2、`CR-010`、`CR-012`、`CR-016` および `CR-AC-017` に、4つの共通前提、各不成立・確認不能時の no-sign / no-success、dApp / SDK / Relay の成立・更新・迂回禁止を追加した。
- 下位フェーズへ委譲する事項: password、PIN、biometric、OS credential、session duration、再認証間隔、unlock state の具体表現、Account permission 構造、API、error code、UI および詳細 state machine は下位要件・設計・仕様へ委譲されている。
- 完了条件・再確認方法: 全 Signer 共通の署名前提、秘密情報使用・署名・成功結果の条件、各 fail-closed 条件、外部主体の非成立・非迂回および下位詳細への委譲が共通本文と CR-AC で確認できることを確認し、RESOLVED とした。

### RR-003: RESOLVED — Security guarantee boundary

- 対象箇所: `docs/requirements/requirements.md:275-287,393-399,415-439`
- 発生条件・確認できた事実: `CR-NFR-013` は、共通 Security 要求と成功条件を、MosaicLynx が管理する Signer / 承認境界が正常に動作する範囲に限定している。その範囲で秘密情報分離、明示的承認、外部入力非信頼、外部主体による検証・認証・認可・署名条件の迂回不可を要求し、`CR-AC-019` で保証境界と条件付き合否を確認できる。OS、端末、Browser、dApp / Web page、正規配布 artifact 等の管理境界外の完全 compromise まで防御する無条件保証ではないことも明記されている。
- 既存の根拠: Concept §13 の「保証の境界」と §14 の成功条件は、Signer / 承認境界の正常動作範囲を保証の中心とし、管理境界外の完全侵害を保証しない。Concept review-003 はこの境界が Concept 内の Security と成功条件に整合することを確認している。
- 前回の問題と影響: 前回は秘密情報分離や明示的承認の要求があっても、MosaicLynx の保証範囲と外部完全侵害の非保証を Common Requirements から判定できなかった。現行本文では保証境界が独立した MUST と受入条件になり、正常な管理境界における要求を外部環境の完全侵害を理由に免除する趣旨にも、外部環境まで絶対保証する趣旨にも読めない。
- 対応確認された最小修正: `CR-NFR-013` を Security 要求として追加し、第8節の成功条件へ境界を反映し、`CR-AC-007` と `CR-AC-019` で秘密情報分離・明示的承認・入力非信頼・条件非迂回と保証範囲を外部判定可能にした。
- 下位フェーズへ委譲する事項: threat model、攻撃者能力、OS / Browser / distribution の個別脅威、OS isolation、code signing、supply-chain controls、暗号・保存方式、security test、release evidence の具体手順は Design / Specification / release security へ委譲されている。
- 完了条件・再確認方法: 保証対象が正常動作中の MosaicLynx 管理下 Signer / 承認境界であること、管理境界内の Security 不変条件が MUST / CR-AC に現れること、管理境界外の完全 compromise を完全防御する無条件保証と読めないこと、詳細方式を先取りしていないことを確認し、RESOLVED とした。

### RR-004: RESOLVED — OPEN-004 の欠番

- 対象箇所: `docs/requirements/requirements.md:441-496`
- 発生条件・確認できた事実: §9 に `OPEN-004` の見出しと「履歴上の欠番であり、現在の未決事項としては扱わない」という明記がある。§10 では `OPEN-004` を未決事項として下流へ引き継がないことが明記されている。
- 既存の根拠: Concept §15 は `OPEN-004` を履歴上の欠番とし、現在の未決事項ではないと定義している。Common Requirements は `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005`、`FUTURE-001` の意味を変更していない。
- 前回の問題と影響: 前回は Concept の欠番理由が Common Requirements 単体で追跡できず、未決事項の取りこぼしや誤った close と判別できなかった。現行本文では欠番の理由と現在の扱いが追跡可能であり、新しい未決事項は創作されていない。
- 対応確認された最小修正: §9 に `OPEN-004` の欠番説明を追加し、§10 の下流引継ぎで「未決事項として引き継がない」と明記した。
- 下位フェーズへ委譲する事項: なし。これは Requirement ID の履歴追跡に関する文書上の確認であり、API、設計または仕様の決定を要しない。
- 完了条件・再確認方法: Concept と Common Requirements の OPEN 集合を照合し、`OPEN-004` が現在の未決事項でなく、`OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005`、`FUTURE-001` の意味が維持され、下流へ未決事項として渡されないことを確認し、RESOLVED とした。

## 10. Deferred Findings

`REQ4-001`〜`REQ4-003` は `RR-001`〜`RR-004` とは別の既存 Deferred / non-blocking 事項として扱いを維持する。これらは現行 Common Requirements を直ちに不成立にする blocker ではない。

- `REQ4-001`（Open / non-blocking）: `symbol-nem-wallet-core` の採用承認、参照 commit / version、同一 checkout からの外部契約再現性の確認。Common Requirements における wallet-core の責任境界は確定しており、固定参照・承認証跡の再確認は後続の仕様化・設計準備へ委譲する。
- `REQ4-002`（Deferred to specification alignment）: Common Requirements が transaction signing と message signing を v1 共通能力とする一方、既存 Web Transaction Handoff Specification の v1 対象範囲・`signData` 記載に残る整合事項。両 operation の Common Requirements を縮小せず、handoff / Mobile / Relay の下流契約で整合させる。
- `REQ4-003`（Open / lower-phase handoff）: `CR-002`、`CR-007-MSG`、`CR-AC-001`、`CR-AC-006` の「確認可能な影響」、message の Chain / Network / Account、format / encoding / canonicalization、UI 表示詳細の具体化。API、message format、encoding、canonicalization、UI 詳細を Common Requirements へ逆流させず、後続 Specification へ委譲する。

## 11. Scope and Traceability

| Concept                                                                               | Common Requirements                                                      | 下流への引継ぎと確認                                                                                                                                              | 判定 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 一般ユーザーの安全な署名判断、dApp 開発者の付随価値                                   | §2.1〜2.2、`CR-002`、`CR-003`、`CR-NFR-007`、`CR-AC-001`                 | Browser / Mobile の確認・承認要求、SDK の接続価値、各 Signer の下流受入条件                                                                                       | 適切 |
| Browser Extension / Android / iOS が Signer、Relay が非署名基盤、Relay 完了が v1 完了 | §3、§4.1、`CR-007`、`CR-011`、`CR-AC-005`〜`CR-AC-009`                   | [Browser Extension 要件](../../requirements/browser-extension.md)、[Mobile App 要件](../../requirements/mobile-app.md)、[Relay 要件](../../requirements/relay.md) | 適切 |
| SDK は dApp 側の連携接点で Signer ではない                                            | §1、§2.2、§3、§4.1、`CR-015`、`CR-011`、`CR-AC-009`、`CR-AC-018`         | [SDK 要件](../../requirements/sdk.md)（5行目）の補足関係、`SDK-FR-*` / `SDK-SEC-*` / 責務境界表。具体 API・transport は下位へ委譲                                 | 適切 |
| SDK は秘密情報・署名・最終承認を担わず、Signer 外の入力を無条件に信頼しない           | `CR-008`、`CR-NFR-001`、`CR-NFR-002`、`CR-011`、`CR-015`、`CR-AC-018`    | SDK-SEC-001〜005、SDK-PLAT-002〜003。Signer 側の最終検証・承認は Browser / Mobile 要件・Design・Specification へ引継ぎ                                            | 適切 |
| 認証・unlock・Account authorization・explicit approval を署名前提とする               | §4.2、`CR-003`、`CR-009`、`CR-010`、`CR-012`、`CR-016`、`CR-AC-017`      | Browser / Mobile / SDK は外部からの認証・lock・unlock・Account authorization の成立・更新・迂回を担わず、Profile / Account と platform の下流仕様で詳細化         | 適切 |
| Security guarantee boundary                                                           | `CR-NFR-013`、`CR-AC-007`、`CR-AC-019`、§8                               | Architecture の Signer / 承認境界、SDK / Relay の外部境界、release security / threat model へ引継ぎ。外部完全 compromise の詳細は逆流させない                     | 適切 |
| Symbol / NEM、Mainnet / Testnet、wallet-core                                          | `CR-005`、`CR-013`、`CR-NFR-005`、`CR-NFR-006`、`CR-AC-003`、`CR-AC-008` | Chain Compatibility、wallet-core 外部契約、Mainnet ADR / evidence / release 資料で具体化                                                                          | 適切 |
| backup / restore の v1 共通非包含、OPEN / FUTURE                                      | `CR-014`、§7、§9、§10、`FUTURE-001`                                      | 個別 platform / release で提供を決定する場合だけ下流化。`OPEN-004` は下流へ引き継がない                                                                           | 適切 |

要求の方向は `Concept → Common Requirements → Browser / Mobile / Relay / SDK Requirements → Design → Specification` と追跡できる。特に SDK は共通 Requirements の Scope、主体表、`CR-015`、既存の秘密情報・入力・責任境界要求および受入条件から [SDK Requirements](../../requirements/sdk.md) へ接続する。認証・unlock・Account authorization・explicit approval は `CR-016` / `CR-AC-017` から各 Signer / Profile 下流へ、Security guarantee boundary は `CR-NFR-013` / `CR-AC-019` から Architecture / release security へ接続する。

## 12. Domain Checks

| 観点             | 判定 | 根拠                                                                                                                                                                                                               |
| ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 要求の完全性     | PASS | SDK 境界、署名前の4条件、no-sign / no-success、Security guarantee boundary が共通 MUST と CR-AC に存在する。前回 `RR-001`〜`RR-003` の不足は確認されない。                                                         |
| 責任・範囲       | PASS | 一般ユーザー、dApp 開発者、dApp、SDK、Signer、Relay、運用者、wallet-core の位置付けが区別され、SDK / Relay / dApp が Signer の条件を代替・迂回しない。                                                             |
| MUST / SHOULD    | PASS | 新設要求は MUST として必要な外部責任・前提・安全不変条件を定義し、認証方式、state 表現、API、UI 等は SHOULD 化せず下位へ委譲している。                                                                             |
| 受け入れ条件     | PASS | `CR-AC-017` が4つの署名前提と各不成立時の no-sign / no-success、`CR-AC-018` が SDK 境界、`CR-AC-019` が保証境界を外部判定可能な条件として定義している。                                                            |
| セキュリティ     | PASS | 管理下 Signer / 承認境界の正常動作を保証範囲とし、秘密情報分離、明示的承認、外部入力非信頼、外部主体による条件迂回不可を要求している。外部完全 compromise の完全防御は保証していない。                             |
| Failure behavior | PASS | 未認証、locked、Account authorization 不成立・確認不能、Profile / Chain / Network / Account 不整合、利用者未承認、検証失敗等で no-sign / no-success とする。詳細 error code は下位へ委譲されている。               |
| 相互運用性       | PASS | Symbol / NEM、Mainnet / Testnet、transaction / message signing、dApp 独立検証、announce の外部責任および wallet-core の chain-specific 責任境界に回帰がない。                                                      |
| Phase boundary   | PASS | endpoint、API signature、schema、JSON / CBOR、wire format、class / module、database、exact crypto、KDF、storage implementation、detailed state machine、detailed UI、error code を新設要求の完了条件としていない。 |
| 回帰             | PASS | 中心価値、利用者優先順位、Signer 3種、Relay 非署名、v1 / milestone、blind signing、独立検証、Mainnet gate、backup / restore 非包含、OPEN / FUTURE、下流委譲を対応差分と現行本文で再確認した。                      |

## 13. Validation Results

- Markdown format: `pnpm exec prettier --write docs/reviews/requirements/requirements-review-006.md` 実行後、`pnpm exec prettier --check docs/reviews/requirements/requirements-review-006.md` を実行する。結果は成功。
- Repository 内リンク: レビュー成果物に記載した相対リンクのリンク先ファイルを確認する。結果は成功。
- Heading / anchor: 共通 output format の17章を順序どおりに配置し、成果物内に壊れた内部 anchor を作成していないこと、参照資料の見出し・行番号が現行資料に存在することを確認する。結果は成功。
- Finding ID 重複: 正式な `RR-001`〜`RR-004` の宣言を一意にし、今回の New ID を追加していないことを確認する。結果は成功。
- 既存レビュー非上書き: `requirements-review-005.md` が保持され、新規成果物 `requirements-review-006.md` を作成したことを確認する。結果は成功。
- Source 非変更: `docs/requirements/requirements.md`、Concept、下流 Requirements、Design、Specification、ADR、release 資料、Skill および実装コードが今回の差分に含まれないことを確認する。結果は成功。
- `git diff --check`: レビュー成果物の whitespace を確認する。結果は成功。
- Repository-wide formatter / lint / typecheck / test / build: Review artifact 単体のレビューであり、今回の Skill 手順上は実行していない。Not validated とする。

## 14. Review Gates

| Gate                | 判定 | 根拠                                                                                                                                                                                            | 不合格時の対応 ID                      |
| ------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1. 目的と課題       | PASS | 一般ユーザーの安全な署名判断を中心価値とし、dApp 開発者の統合容易性を付随価値として維持している。                                                                                               | なし                                   |
| 2. 利用者と責任     | PASS | SDK は dApp 側の連携接点で Signer ではなく、Signer / Relay / dApp / wallet-core の責任も区別されている。認証・unlock・Account authorization・明示的承認の成立主体も Signer 側に固定されている。 | なし（`RR-001`、`RR-002` は Resolved） |
| 3. 対象範囲         | PASS | Browser Extension / Android / iOS は Signer、Relay は非署名基盤、SDK は Signer 外の連携接点、Mainnet / Testnet と Symbol / NEM、backup / restore 非包含が区別されている。                       | なし（`RR-001`、`RR-003` は Resolved） |
| 4. 要件と制約       | PASS | SDK の共通責任、署名前提、Security guarantee boundary、Mainnet gate、wallet-core、blind signing 禁止および下流委譲が MUST / 制約として識別できる。                                              | なし（`RR-002`、`RR-003` は Resolved） |
| 5. 受け入れ条件     | PASS | `CR-AC-017`〜`CR-AC-019` が署名前提、SDK 境界、Security guarantee boundary の正常・拒否条件を外部から判定可能にしている。                                                                       | なし（`RR-001`〜`RR-003` は Resolved） |
| 6. 内部整合性       | PASS | `CR-003`、`CR-009`、`CR-010`、`CR-012`、`CR-015`、`CR-016` と対応 CR-AC は役割が層分けされ、中心価値、v1、Relay、Chain / Network、Mainnet gate、backup 非包含と矛盾しない。                     | なし                                   |
| 7. 不可欠な前提     | PASS | wallet-core、release policy、各 platform の下流文書と外部責任が前提として明示され、詳細な外部契約の未確定は `REQ4-*` / `OPEN-*` として非 blocker の範囲で分離されている。                       | なし                                   |
| 8. コンセプト整合性 | PASS | Concept の SDK 境界、認証・ロック・Account 認可、Security guarantee boundary、OPEN-004 の扱い、Signer / Relay、v1 および利用者価値が Common Requirements へ追跡されている。                     | なし                                   |

すべての Review Gate が PASS であり、現在の不合格 Gate はない。そのため、不合格 Gate に対応する現行の Critical finding もない。

## 15. Remaining Risks and Open Decisions

- Common Requirements の `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` は、課題検証、利用者が必要とする確認情報の具体化、milestone 個別完了条件、Mainnet 公開運用の詳細として残る。いずれも本文で扱いと下流引継ぎが明示されており、今回の `RR-001`〜`RR-004` の blocker ではない。
- `CR-OPEN-001` / `CR-OPEN-002` は wallet-core の具体的統合方式、Binding、実行環境および秘密情報 lifecycle の下流設計事項として残る。責任境界自体は確定している。
- `REQ4-001`〜`REQ4-003` は §10 の Deferred Findings のとおり、今回の Common Requirements READY 判定を妨げない下流・根拠資料側の事項として維持する。
- 外部 OS、端末、Browser、dApp / Web page、正規配布 artifact の完全 compromise は `CR-NFR-013` の保証範囲外である。詳細 threat model、残余リスク、release security の運用は下位資料で扱う。
- 現在のワークスペースに Mobile 実装が存在しないことは、計画上の Mobile Requirements の不在や実装完了を意味しない。Common Requirements の計画・責任境界の判定と実装検証を混同しない。

今回の対応に起因する blocking risk、Concept との未解消の重大な競合、新しい未決事項は確認されなかった。

## 16. Automatic Changes

レビュー中に変更したのは、今回のレビュー成果物 [requirements-review-006.md](./requirements-review-006.md) の新規作成だけである。`docs/requirements/requirements.md`、Concept、下流 Requirements、Design、Specification、ADR、release 資料、Skill および実装コードは変更していない。

## 17. Final Decision

**READY**

`RR-001`〜`RR-004` はすべて RESOLVED、Critical の New / Open / Reopened はなく、回帰なし、Requirements フェーズ逸脱なし、8つの Review Gate はすべて PASS である。`REQ4-001`〜`REQ4-003` は Deferred / non-blocking として維持する。

REQUIREMENTS PHASE READY
