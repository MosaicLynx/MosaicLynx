# MosaicLynx 共通 Requirements フル再レビュー（復元後）

## 1. Review Target

- 対象: [MosaicLynx 共通要件定義書](../../requirements/requirements.md)
- 対象時点: `d2a3c61fb7386cff684021b92901d277a257e3c3`
- 前回の共通 Requirements review: [requirements-review-004](./requirements-review-004.md)
- 上位資料: [MosaicLynx Concept Sheet](../../concept/concept-sheet.md)
- 最新 Concept review: [concept-sheet-review-003](../concept/concept-sheet-review-003.md)
- 使用 Skill: `.agents/skills/requirements-review/SKILL.md` と、同 Skill が参照する review-common playbook、reviewers、review-gates、output-format
- 今回の位置付け: 過去の `READY` 判定や指摘解消を前提にせず、復元後の Requirements review 基準で共通 Requirements 全体をゼロベースでフルレビューした。
- 変更範囲: 共通 Requirements、Concept、platform / SDK / Relay Requirements、Design、Specification、ADR、実装コードは変更せず、本レビュー成果物だけを新規作成する。

## 2. Execution Audit

- Phase 0 として、対象、上位 Concept、前回レビュー、共通 Requirements の責任範囲および下流への委譲範囲を確認した。
- Reviewer A 相当（要件の明確性・完全性）として、CR-* / CR-NFR-* の MUST、根拠、下流引継ぎ、CR-AC-* への対応および未決事項を確認した。
- Reviewer B 相当（利用者価値・スコープ）として、一般ユーザー、dApp 開発者、Signer、Relay、SDK、v1 milestone、backup / restore、OPEN / FUTURE の Concept traceability を確認した。
- Reviewer C 相当（成立性・安全性）として、Trust Boundary、認証・ロック・Account 認可、秘密情報、fail-closed、入力検証、Chain / Network、Mainnet gate、失敗時挙動を確認した。
- A / B / C は独立した観点で確認し、採用した指摘について根拠、影響、最小修正方針および下位フェーズ委譲を反証確認した。
- サブエージェントは使用していない。実際に確認した単独レビューの観点を上記3パスとして記録している。
- 過去レビューは履歴と既知の未決事項の把握にだけ使用し、過去の判定を今回の正しさの根拠にはしていない。

## 3. Evidence Used

- [共通 Requirements](../../requirements/requirements.md): 要件、適用主体、受け入れ条件、未決事項および下流引継ぎの一次対象。
- [Concept](../../concept/concept-sheet.md): 一般ユーザーを第一対象とする中心価値、Signer / Relay / SDK の境界、認証・ロック・Account 認可、保証境界、v1、backup / restore、OPEN / FUTURE の上流根拠。
- [Concept review-003](../concept/concept-sheet-review-003.md): Concept が `READY` / `CONCEPT PHASE READY` と判定された状態の確認。今回の Requirements の正しさを代替する資料としては扱っていない。
- `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`: 共通要求を各提供形態・SDKへ分解する責任境界と traceability の確認。
- `docs/design/architecture.md`: dApp、SDK、Signer、Relay、wallet-core、外部依存の責務分離の用語確認。
- `docs/specifications/product-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/specifications/chain-compatibility-spec.md`、`docs/specifications/profile-account-spec.md`: 下流の既決事項、用語および明白な矛盾の確認。下流の詳細を共通 Requirements の欠陥へ逆流させていない。
- `docs/adr/0001-mainnet-evidence-lite.md`、`docs/evidence/evidence-policy.json`、`docs/release/mainnet-release-evidence.md`: Mainnet release gate の既決境界の確認。
- `docs/reviews/requirements/requirements-review-001.md`〜`requirements-review-004.md`: 過去指摘の履歴と今回の再発・継続状態の確認。
- `.agents/project-context.md`、`.agents/skills/requirements-review/SKILL.md` および参照された review-common 資料: repository 上の責任分担、レビュー手順、正式な判定値・重大度・出力形式の確認。

下流資料との差異だけで共通 Requirements を誤りとは判定せず、Concept と Requirements フェーズで定義すべき責任、制約、安全不変条件および外部可視性を中心に判定した。

## 4. Review Result

**REVISE REQUIREMENTS**

## 5. Summary

現行の共通 Requirements は、一般ユーザーの安全な署名判断を中心に、Browser Extension / Android / iOS を Signer、Relay を非署名の受け渡し基盤として区別している。明示的承認、blind signing の禁止、秘密情報分離、Symbol / NEM、Mainnet / Testnet、署名結果の dApp 独立検証、Mainnet gate、v1 milestone、backup / restore の共通非包含、API 等の下位フェーズ委譲は概ね適切である。

一方、Concept で明示された SDK の責任境界が共通 Requirements の主体・Trust Boundary・秘密情報要求へ引き継がれていない。また、認証条件が満たされ、Signer がロックされておらず、対象 Account の認可が成立していることを署名の共通前提として要求していない。現在の `CR-010` は認証失敗時の安全側終了を述べるだけで、認証・unlock・Account authorization の成功を署名前提として固定していない。このため、共通 Requirements を満たしているだけでは、ロック中・未認証・未認可 Account の署名を全 Signer で排除できない。

さらに、MosaicLynx の保証を管理下の Signer / 承認境界へ限定し、OS、端末、ブラウザ、dApp / Web page、配布 artifact 等の完全侵害まで保証しないという Concept の境界が、共通 Requirements の成功条件・Security 要求へ明示的に移されていない。これらは下位の password / PIN / biometric、API、state machine、threat model を要求する指摘ではなく、Requirements レベルで必要な共通責任・前提・保証範囲の不足である。

以上のため、品質ゲートを通過させる前に `RR-001`〜`RR-003` の修正が必要である。`OPEN-004` の欠番は、現在の未決事項を創作せずに履歴上の欠番であることを明記すればよい任意改善である。

## 6. Finding Status

| ID       | Severity | Status | 初出レビュー | 今回の判定根拠                                                                                                                                  |
| -------- | -------- | ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `RR-001` | Critical | New    | 今回         | SDK が共通 Requirements の主体、Scope、Trust Boundary、秘密情報・承認境界から欠落しており、Concept から共通要求への traceability が切れている。 |
| `RR-002` | Critical | New    | 今回         | 認証成功、Signer の unlock、対象 Account の認可を署名前提とする共通 MUST と、dApp / SDK / Relay による成立・迂回禁止がない。                    |
| `RR-003` | Critical | New    | 今回         | MosaicLynx の Security guarantee boundary と外部完全侵害を保証しない範囲が、共通 Requirements の要求・成功条件へ明示されていない。              |
| `RR-004` | Minor    | New    | 今回         | Concept には `OPEN-004` の履歴上の欠番説明があるが、共通 Requirements では `OPEN-001`、`002`、`003`、`005` の間の欠番理由が追跡できない。       |

過去の共通 review-004 に記録された `REQ4-001`（wallet-core 採用根拠の再現性）、`REQ4-002`（message signing と handoff 仕様の整合）、`REQ4-003`（表示・message 条件の下流具体化）は、それぞれ後述の Deferred Findings に継続して記録する。今回の `RR-002` は、過去の要求元・通信上の認証問題とは異なり、利用者認証・Signer lock・Account authorization という署名前提の欠落である。

## 7. Required Changes

### RR-001: SDK の共通責任・Trust Boundary が未定義

- 対象箇所: `docs/requirements/requirements.md:5-11,34-43,74-89,185-219,249-259,383-400`
- 発生条件・確認できた事実: 共通 Requirements は dApp、Signer、Relay を End-to-End の主体として列挙するが、`SDK` を主体として列挙していない。SDK への要求文書リンクもなく、`CR-008` / `CR-NFR-001` / `CR-NFR-002` / `CR-011` の秘密情報・入力・承認境界にも SDK が明示されていない。
- 既存の根拠: Concept は、SDK を dApp 側の連携接点であり Signer ではないと定め（`docs/concept/concept-sheet.md:53-55`）、SDK を含む Web / dApp 側を Signer の Trust Boundary 外に置き、SDK は秘密情報を保管・復号・利用せず、署名と最終承認を担わないと定めている（`docs/concept/concept-sheet.md:208-218`）。`docs/requirements/sdk.md:3-9,64-70,223-281` には SDK 固有要求があるが、これは共通 Requirements の上流境界欠落を代替しない。
- 問題: SDK 要件を別文書に適用すれば詳細責任は読めるものの、共通 Requirements 単体の責任表・Trust Boundary・秘密情報分離・承認境界では SDK が dApp 側の非署名主体であることを検証できない。後続の platform / handoff 要件が SDK の client-side adapter を Signer の一部、秘密情報を扱う層、または承認を成立させる層として誤って実装・検証する余地が残る。
- 影響: Concept の主要な責任境界と共通要求の traceability が不完全になり、SDK を経由した入力検証、秘密情報分離、利用者承認の迂回禁止を全提供形態で同じ共通原則として判定できない。
- Requirements レベルで必要な最小修正方針: 共通 Requirements の Scope / 主体表に SDK を dApp 側の連携接点として追加し、Signer ではないこと、秘密情報を保管・復号・利用しないこと、署名しないこと、利用者の最終承認を担わないこと、Signer の Trust Boundary 外であることを共通要求として明記する。`CR-NFR-001`、`CR-008`、`CR-NFR-002`、`CR-011` および必要な受け入れ条件へ共通不変条件を追跡し、SDK 固有の要求文書へリンクする。
- 下位フェーズへ委譲する事項: SDK の API、transport、caller binding、payload、error code、実行環境、実装方式および SDK 固有の受け入れ試験は `docs/requirements/sdk.md` と後続 Design / Specification へ委譲する。
- 完了条件・再確認方法: 共通 Requirements に SDK の責任・非責任・Trust Boundary が追加され、秘密情報・入力・最終承認の共通要求と SDK Requirements の `SDK-SEC-*` / `SDK-FR-*` が相互に追跡できること。CR-AC の適用主体に SDK を含めるべき箇所が漏れていないことを再確認する。

### RR-002: 認証・lock・Account authorization が署名前提として固定されていない

- 対象箇所: `docs/requirements/requirements.md:91-100,193-205,207-227,315-323,383-400`
- 発生条件・確認できた事実: 共通 Requirements は、Account を確認・選択すること（`CR-009`）、認証に失敗した場合の安全側終了（`CR-010`）、要求元の許可範囲（`CR-NFR-008`）を定めている。しかし、認証条件が満たされていること、Signer がロックされていないこと、対象 Account の署名認可が成立していることを署名前の必須条件として定めていない。`requirements.md` には `lock` / `ロック` の共通要求がない。
- 既存の根拠: Concept は、認証条件、Signer の非ロック状態、対象 Account の認可が成立した場合だけ秘密情報を使用でき、dApp / SDK / Relay はそれらを成立・迂回できないと定めている（`docs/concept/concept-sheet.md:172-178`）。Mobile Requirements では同原則が `MR-006` と `MR-AC-005` に具体化されている（`docs/requirements/mobile-app.md:60-64,139-150`）。これは Mobile 固有の下位要求だけに置くべき事項ではなく、全 Signer 共通の安全不変条件である。
- 問題: `CR-010` の「認証に失敗した場合」は、認証成功を署名前提にする要求ではない。`CR-009` の Account 選択や `CR-NFR-008` の dApp の許可範囲も、Signer の unlock 状態と対象 Account の利用認可を表さない。そのため、認証・lock・Account authorization を確認せずに署名する実装でも、現行の共通 MUST との不適合を明確に判定できない。
- 影響: 全 Signer に共通する利用者承認の前提が欠け、ロック中、未認証、認可されていない Account、または外部主体が成立させたと主張する認証状態で署名が成立する回帰を防げない。dApp / SDK / Relay がその条件を成立・迂回しないことも共通受け入れ条件で検証できない。
- Requirements レベルで必要な最小修正方針: 各 Signer は、利用者の認証条件が成立し、Signer が unlock 状態で、現在の Profile / Chain / Network と対象 Account の署名認可が成立している場合に限り秘密情報を使用して署名できることを共通 MUST とする。ロック中、未認証、認可不成立、確認不能時は署名結果を返さず安全側に終了し、dApp / SDK / Relay はこれらの条件を成立・更新・迂回できないこと、および受け入れ条件を追加する。
- 下位フェーズへ委譲する事項: password、PIN、biometric、session の選択、unlock の状態表現、再認証頻度、OS API、API、error code、詳細 state machine は platform Requirements の補足と Design / Specification へ委譲する。
- 完了条件・再確認方法: 共通 Requirements と CR-AC に、認証済み・unlock・対象 Account authorization の三条件、各条件の不成立時の no-sign / no-success、dApp / SDK / Relay の非迂回を追跡できること。Browser Extension、Android、iOS の各 platform Requirements がこの共通 MUST を参照していることを再確認する。

### RR-003: Security guarantee boundary が共通 Requirements へ引き継がれていない

- 対象箇所: `docs/requirements/requirements.md:24-45,74-100,185-191,249-305,379-400`
- 発生条件・確認できた事実: 共通 Requirements は秘密情報分離、入力非信頼、Mainnet gate、Signer / Relay / dApp の責任を MUST としているが、MosaicLynx が保証する範囲を「MosaicLynx が管理する Signer / 承認境界の正常動作範囲」に限定する記述がない。`CR-AC-007` の秘密情報分離と第8節の成功条件も、外部環境の完全侵害を除外する条件を明示していない。
- 既存の根拠: Concept は保証の中心を MosaicLynx が管理する Signer / 承認境界の正常動作に限定し、OS、端末、ブラウザ、dApp / Web page、正規配布 artifact 等の管理境界外の完全侵害まで防ぐことを意味しないと定めている（`docs/concept/concept-sheet.md:220-224`）。Concept review-003 でもこの境界の整合を確認している（`docs/reviews/concept/concept-sheet-review-003.md:54,168-169`）。
- 問題: 現行の共通要求・成功条件は保証の前提を置かずに秘密情報分離や承認不在署名の達成を要求しているため、正常な管理下の保証と、OS / 端末 / ブラウザ / Web page / distribution artifact の完全侵害を含む絶対保証の境界が外部から判定できない。外部入力を信頼しない要求だけでは、MosaicLynx の保証範囲を定義したことにならない。
- 影響: Security review、release gate、platform capability 表示および利用者向け説明が、MosaicLynx の管理責任を越える環境まで保証すると読める。逆に、外部主体の侵害を理由に MosaicLynx 管理下の Signer / 承認境界の要求を免除する誤解も防げない。
- Requirements レベルで必要な最小修正方針: Security または Scope に、共通 Security 要求と成功条件は MosaicLynx が管理する Signer / 承認境界が正常に動作する範囲の保証であること、OS、端末、ブラウザ、dApp / Web page、外部配布 artifact 等の完全侵害まで保証しないことを明記する。外部境界からの入力は引き続き検証前に信頼せず、管理境界内で満たすべき no-secret / explicit-approval / fail-closed を受け入れ条件へ追跡する。
- 下位フェーズへ委譲する事項: 詳細 threat model、攻撃者能力、OS / browser / distribution の個別脅威、security test、release evidence の具体手順および緩和策は Design / Specification / release security 文書へ委譲する。
- 完了条件・再確認方法: 共通 Requirements の保証境界と非保証範囲が Concept と同じ意味で明記され、第8節の成功条件・`CR-NFR-002`・`CR-AC-007` がその条件付き保証と矛盾しないことを再確認する。OS、端末、ブラウザ、dApp / Web page、配布 artifact の完全侵害を保証する文言がないことも確認する。

## 8. Optional Improvements

### RR-004: OPEN-004 の欠番理由が共通 Requirements で追跡できない

- 対象箇所: `docs/requirements/requirements.md:402-432`
- 発生条件・確認できた事実: 共通 Requirements は `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` および `FUTURE-001` を定義しているが、`OPEN-004` の説明がない。
- 既存の根拠: Concept は `OPEN-004` を履歴上の欠番であり、現在の未決事項ではないと明記している（`docs/concept/concept-sheet.md:241-265`）。共通 Requirements は Concept の未決事項を引き継ぐ文書であるが、欠番を引き継がない理由を示していない。
- 問題: 新しい未決事項が欠落したのか、既存の `OPEN-004` を誤って閉じたのか、履歴上の欠番なのかを共通 Requirements 単体では判別できない。
- 影響: OPEN ID の変更影響分析、platform Requirements への追跡およびレビュー履歴の照合で、未決事項の取りこぼしと誤認する可能性がある。
- Requirements レベルで必要な最小修正方針: `OPEN-004` は履歴上の欠番であり、現在の未決事項としては扱わない旨を第9節へ一文追加する。新しい機能・要件・OPEN 項目を創作しない。
- 下位フェーズへ委譲する事項: なし。OPEN ID の履歴管理に関する文書上の追跡であり、API、設計または仕様の決定は不要である。
- 完了条件・再確認方法: Concept と共通 Requirements の OPEN 集合を照合し、`OPEN-004` が意図的な欠番として説明され、`OPEN-001`、`002`、`003`、`005`、`FUTURE-001` の意味が変わっていないことを確認する。

## 9. Resolved Findings

今回の正式な新規指摘は `RR-001`〜`RR-004` であり、以下は過去レビューの指摘が現行本文で再発していないことを独立に確認した結果である。

- `REQ3-001`: 第1節、第3節、第4節、`CR-011` および `CR-AC-009` で、Relay には受け渡し境界だけを適用し、Signer の解析・承認・署名責任を直接適用しないことが明確になっている。
- `REQ3-002`: `CR-NFR-008`〜`CR-NFR-012` に要求元、許可範囲、完全性、鮮度、replay / duplicate、結果対応の共通 MUST と根拠・受け入れ条件がある。これは今回の利用者認証・lock・Account authorization の不足とは別の問題である。
- `REQ3-003`: `CR-007`、`CR-007-TX`、`CR-007-MSG` と `OPEN-003` で、transaction signing / message signing を共通能力として固定し、個別 milestone 完了条件を未決として分離している。
- `REQ3-004`: `CR-013`、`CR-OPEN-001`、`CR-OPEN-002` で wallet-core の責任範囲を制約として固定し、Binding / FFI / WASM / Native 等の具体方式を下位設計へ委譲している。
- Relay と Signer、v1 と milestone / release、backup / restore の共通非包含、Symbol / NEM、Mainnet / Testnet、dApp の独立検証、announce の外部責任、Mainnet gate および共通受け入れ条件の大枠に回帰は確認できない。
- Requirements 本文には AGENTS.md、AI / agent 指示、reviewer 向け注意、formatter / checker 手順、下流文書の編集命令、レビュー履歴の自己弁護などは混入していない。責任境界の複数箇所での記載は、Scope、要求、Security、受け入れ条件の各目的に対応しており、現時点で不必要な重複による重大な冗長化とは判定しない。

## 10. Deferred Findings

以下は既存 review-004 から継続している下流・根拠資料側の事項であり、今回の正式な新規 ID として重複採番しない。

- `REQ4-001`（Open / non-blocking）: wallet-core の採用承認、参照 commit / version、同一 checkout からの外部契約再現性が未確認である。`CR-013` の責任境界自体は Requirements 内で明確だが、仕様化前に承認記録または固定参照を追跡する必要がある。
- `REQ4-002`（Deferred to specification alignment）: 共通 Requirements が message signing を v1 共通能力とする一方、`docs/specifications/web-transaction-handoff-spec.md` の v1 対象範囲・`signData` 記載には未整合が残る。Requirements の両 operation を縮小せず、handoff / Mobile / Relay の下流契約を整合させる事項である。
- `REQ4-003`（Open / lower-phase handoff）: `CR-002`、`CR-007-MSG`、`CR-AC-001`、`CR-AC-006` の「確認可能な影響」「message に適用される Chain / Network / Account」等の具体化は、API、format、encoding、canonicalization、UI詳細を発明せず、後続 Specification で定義する。

これらは現行共通 Requirements の主要な責任・境界を直ちに不成立にするものではないが、`RR-001`〜`RR-003` の修正後に下流へ引き継ぐ際も未解決のまま放置してはならない。

## 11. Scope and Traceability

| Concept の主要事項                                | 共通 Requirements の確認                                                                                     | 判定                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| 一般ユーザーが第一対象、dApp 開発者が主要な協力者 | §2.1〜2.2、`CR-002`〜`CR-003`、`CR-NFR-007`、`CR-AC-001`                                                     | 適切                 |
| Browser Extension / Android / iOS が Signer       | §3、`CR-007`、`CR-011`、`CR-AC-005`〜`CR-AC-006`                                                             | 適切                 |
| Relay は非署名の受け渡し基盤                      | §1、§3、`CR-011`、`CR-AC-009`                                                                                | 適切                 |
| SDK は dApp 側の連携接点で Signer ではない        | 共通 Requirements の主体表・共通 Trust Boundary・CR 要求に明記なし                                           | **不足（RR-001）**   |
| 秘密情報を Web / dApp / SDK / Relay から分離      | dApp、Web page、Relay は `CR-008` / `CR-NFR-002` にあるが SDK がない                                         | **不足（RR-001）**   |
| 明示的承認、認証・lock・Account 認可              | 明示的承認は `CR-003`、Account 選択は `CR-009`、認証失敗は `CR-010` にあるが、三条件の署名前提と非迂回がない | **不足（RR-002）**   |
| dApp の独立検証、announce 等の外部責任            | `CR-006`、`CR-011`、`CR-NFR-012`                                                                             | 適切                 |
| Symbol / NEM、Mainnet / Testnet、Mainnet gate     | `CR-005`、`CR-NFR-005`、`CR-NFR-006`、`CR-AC-003`、`CR-AC-008`                                               | 適切                 |
| v1 / milestone / release                          | §3、`OPEN-003`、`CR-AC-005`〜`CR-AC-009`                                                                     | 適切                 |
| backup / restore は v1 共通必須ではない           | `CR-014`、§7、`CR-AC-010` および下流委譲                                                                     | 適切                 |
| MosaicLynx の Security guarantee boundary         | 外部入力非信頼・秘密情報分離はあるが、管理下 Signer / 承認境界への保証限定と外部完全侵害の非保証がない       | **不足（RR-003）**   |
| OPEN / FUTURE                                     | `OPEN-001`、`002`、`003`、`005`、`FUTURE-001` は追跡可能だが `OPEN-004` の欠番説明がない                     | **補強要（RR-004）** |

要求から下流への方向は、CR-* / CR-NFR-* → Browser / Mobile / Relay / SDK Requirements → Design / Specification と概ね整理されている。各要求に `根拠` と `下流` があり、Requirements 本文へ過剰なリンクを追加する必要はない。ただし、SDK への共通 traceability がないため `RR-001` の修正が必要である。`CR-013` の wallet-core は承認済み外部コンポーネントの責任制約として扱われ、Binding や storage 等の方式を Requirements へ逆流させてはいない。

## 12. Domain Checks

| 観点                      | 判定        | 根拠                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 要求の完全性              | **FAIL**    | SDK 境界、署名前の認証・lock・Account authorization、Security guarantee boundary が共通 MUST / 条件として不足している（`RR-001`〜`RR-003`）。                                                                                                                                                              |
| 責任・範囲                | **FAIL**    | Signer / Relay / dApp の分離は明確だが、SDK を dApp 側の非署名主体として共通 Scope に含めていない。利用者認証条件の責任・非迂回主体も不十分である。                                                                                                                                                        |
| MUST / SHOULD             | **PARTIAL** | 主要な安全不変条件は MUST 化され、`SHOULD` は platform の optional policy に限定されている。一方、認証・lock・Account authorization の共通 MUST が欠落している。                                                                                                                                           |
| 受け入れ条件              | **PARTIAL** | CR-AC-* は主要 CR の成功・失敗を広く対応付けているが、ロック中・未認証・未認可 Account の no-sign / no-success と、保証境界の条件が受け入れ条件へ現れていない。                                                                                                                                            |
| Trust Boundary / Security | **FAIL**    | dApp、Web、Relay、network、Provider 等の入力非信頼、秘密情報、Relay 非署名、fail-closed、Mainnet gate はあるが、SDK の明示、認証前提、管理境界外の完全侵害非保証が不足している。                                                                                                                           |
| Failure behavior          | **PARTIAL** | malformed、unsupported、mismatch、expiry、replay、duplicate、verification、wallet-core failure 等の安全側終了はある。lock / unauthorized Account は共通失敗条件として明示されず、cancel / timeout の具体分類は下流へ委譲されている。後者は下位詳細として扱えるため、今回の独立指摘は `RR-002` に限定した。 |
| 相互運用性                | **PASS**    | Symbol / NEM、Mainnet / Testnet、chain-specific contract、固定 vector への追跡があり、チェーン固有の詳細方式を Requirements へ持ち込んでいない。                                                                                                                                                           |
| v1 / milestone / backup   | **PASS**    | 4 milestone、Relay の非署名完了、個別 release、CR-007 の共通 operation、backup / restore の共通非包含が相互に整合している。                                                                                                                                                                                |
| Cleanliness               | **PASS**    | repository 運用、AI / agent 指示、formatter、下流編集命令、レビュー履歴的記述は Requirements 本文にない。                                                                                                                                                                                                  |
| Phase boundary            | **PASS**    | API、endpoint、schema、protocol、algorithm、KDF、storage、class、詳細 UI / state machine を要求していない。wallet-core の名前は承認済み責任制約として扱い、統合方式は下位へ委譲している。                                                                                                                  |

## 13. Validation Results

レビュー成果物に対して、以下を実行し、結果を確認した。

- Markdown format: `pnpm exec prettier --check docs/reviews/requirements/requirements-review-005.md` が成功。
- Repository 内リンク: 成果物内の相対リンク先が存在することを確認。
- Heading / anchor: 共通 output format の17章を順序どおりに保持し、参照した見出しと ID が存在することを確認。
- Finding ID 重複: `RR-001`〜`RR-004` は一意で、対象 Requirements の CR-* / Relay の RR-* と混同しないレビュー指摘 ID として一覧化した。
- 既存レビュー上書き: `requirements-review-001.md`〜`requirements-review-004.md` を変更せず、新しい `requirements-review-005.md` を作成した。
- Source 変更なし: `docs/requirements/requirements.md`、Concept、platform / SDK / Relay Requirements、Design、Specification、ADR、release、Skill、実装コードを変更していない。
- `git diff --check`: 成功。
- Repository-wide formatter、lint、typecheck、test、build: Requirements レビュー成果物単体の確認範囲を越えるため実行していない。

## 14. Review Gates

| Gate                | 判定     | 根拠・対応指摘                                                                                                                                                                                     |
| ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 目的と課題       | **PASS** | 一般ユーザーの安全な署名判断、秘密情報分離、dApp 開発者の協力価値が共通要件へ追跡されている。                                                                                                      |
| 2. 利用者と責任     | **FAIL** | SDK の非署名・Signer 外責任が共通主体表にない。また認証・lock・Account authorization の成立主体と dApp / SDK / Relay の非迂回が不足している（`RR-001`、`RR-002`）。                                |
| 3. 対象範囲         | **FAIL** | Signer / Relay / dApp の範囲は整理されているが、SDK を含む Web / dApp 側の Trust Boundary と、管理境界外の完全侵害を保証しない範囲が共通文書で判定できない（`RR-001`、`RR-003`）。                 |
| 4. 要件と制約       | **FAIL** | Concept の署名前提である認証・unlock・Account authorization と、保証境界が共通 MUST / 制約として識別できない（`RR-002`、`RR-003`）。                                                               |
| 5. 受け入れ条件     | **FAIL** | 主要 CR-AC の対応表はあるが、ロック中・未認証・未認可 Account の no-sign / no-success と保証境界条件を合否判定できない（`RR-002`、`RR-003`）。                                                     |
| 6. 内部整合性       | **PASS** | 現行 Requirements 内の Relay、v1、backup、Chain / Network、Mainnet gate、責任分担には重大な相互矛盾は確認しなかった。message signing の handoff 不整合は下流 Deferred Finding として分離している。 |
| 7. 不可欠な前提     | **PASS** | wallet-core、release policy、下流 platform の存在を前提として明示し、未確認の外部契約は `REQ4-001` として記録している。未確認であることだけを Requirements gate の失敗とはしない。                 |
| 8. コンセプト整合性 | **FAIL** | Concept の SDK 境界、署名前の認証・lock・Account authorization、保証境界が共通 Requirements に完全には引き継がれていない（`RR-001`〜`RR-003`）。                                                   |

不合格 Gate は Critical の正式指摘 `RR-001`〜`RR-003` に対応付ける。したがって、Skill の判定規則により Review Result は `REVISE REQUIREMENTS` となる。

## 15. Remaining Risks and Open Decisions

- Blocking / required: `RR-001`、`RR-002`、`RR-003`。これらが解消されるまで、共通 Requirements を仕様設計へ進める判定にはしない。
- Optional: `RR-004`。`OPEN-004` を履歴上の欠番として明示し、未決事項を創作せずに追跡可能性を補強する。
- 下流 Deferred: `REQ4-001` の wallet-core 承認根拠・固定参照、`REQ4-002` の message signing handoff 整合、`REQ4-003` の表示・message 条件具体化。
- Concept との重大な不整合は、上記 `RR-001`〜`RR-003` の未引継ぎを除き確認していない。中心価値、対象ユーザー、Signer / Relay、dApp 独立検証、Chain / Network、Mainnet gate、v1、backup / restore および非対象範囲は整合している。
- Trust Boundary / Security 上の重大問題は、共通 Requirements の欠落として `RR-001`〜`RR-003` に記録した。具体的な暗号方式、storage、API、threat model の詳細は未決のまま下位フェーズへ委譲する。
- `_snwc` の外部契約本文、実装、統合、Mainnet release evidence の実行結果は本レビューの対象外であり、未確認事項として扱う。未確認の検証を成功とは扱わない。

## 16. Automatic Changes

なし。レビュー中に Source、下流文書、Skill、実装コードを自動変更していない。

## 17. Final Decision

**REVISE REQUIREMENTS**

Blocking finding `RR-001`〜`RR-003` を共通 Requirements へ反映し、`RR-004` の欠番追跡を必要に応じて補強した後、Requirements review を再実施する。
