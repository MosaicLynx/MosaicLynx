# MosaicLynx Concept Sheet 対応後再レビュー

## 1. Review Target

- 対象: [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- 確認日: 2026-08-27
- 成果物: `docs/reviews/concept/concept-sheet-review-003.md`
- 前回レビュー: [`concept-sheet-review-002.md`](./concept-sheet-review-002.md)
- 前回指摘対応コミット: `b4fd26c8ab5b5ad512b025ef479346fd2a632301`
- 使用 Skill: [`.agents/skills/concept-review/SKILL.md`](../../../.agents/skills/concept-review/SKILL.md)
- 位置付け: 前回のフルレビューで記録された CSR-001〜CSR-007 の対応後再レビュー。前回レビューをゼロから繰り返すのではなく、各指摘の解消、修正による回帰、Concept フェーズ境界および READY 可否を確認した。
- 変更範囲: 前回対応コミットの Concept Sheet 差分、対象 Concept Sheet 本文、前回レビュー、必要な関連資料の責任境界・用語・スコープのみを確認した。今回の変更対象は本レビュー成果物だけである。
- 未確認範囲: 実際の利用者調査、下流工程の詳細な API・データ形式・暗号・実装・テストの妥当性は、今回の Concept 再レビューの対象外とした。

## 2. Execution Audit

`concept-review` Skill の Phase 0〜3、`review-common/review-playbook.md`、Skill 固有の reviewers / gates / output format を適用した。サブエージェントは使用せず、次の3観点を別パスで自己レビューした。

- Reviewer A（品質と論理）: v1、milestone、release、Signer / Relay / SDK の用語と本文内部の整合性を確認した。
- Reviewer B（課題と価値）: 中心課題、一般ユーザー、dApp 開発者、中心価値、成功条件および利用者優先順位の回帰を確認した。
- Reviewer C（境界と成立性）: 製品・責任・Trust Boundary、backup / restore、Mainnet gate、対象外範囲、OPEN / FUTURE、Concept のフェーズ境界を確認した。

## 3. Evidence Used

- [対象 Concept Sheet](../../concept/concept-sheet.md): 現在の製品境界、課題、価値、責任、セキュリティ原則、スコープ、成功条件、未決事項の一次確認。
- [前回レビュー](./concept-sheet-review-002.md): CSR-001〜CSR-007 の初出内容、前回の確認基準および対応対象の追跡。前回の結論を今回の正しさの根拠にはしていない。
- 対応コミット `b4fd26c8ab5b5ad512b025ef479346fd2a632301` の対象差分: 前回指摘に対応する実際の変更範囲の確認。
- [共通要件定義](../../requirements/requirements.md)、[SDK 要件](../../requirements/sdk.md): Signer、Relay、SDK、dApp および v1 / milestone の用語・責任境界の確認。
- [アーキテクチャ設計](../../design/architecture.md)、[プロダクト仕様](../../specifications/product-spec.md)、[Profile / Account 仕様](../../specifications/profile-account-spec.md)、[Web Transaction Handoff 仕様](../../specifications/web-transaction-handoff-spec.md)、[Mainnet release evidence](../../release/mainnet-release-evidence.md): 責任境界、backup の位置付け、Mainnet gate および下流委譲の意図確認。
- [プロジェクトコンテキスト](../../../.agents/project-context.md): 現在のワークスペースと文書の役割の確認。

## 4. Review Result

**READY**

## 5. Summary

CSR-001〜CSR-007 はすべて **RESOLVED** と判定する。Signer は Browser Extension / Android / iOS の利用者向け署名主体、Relay は非署名の受け渡し基盤として明確になり、SDK の Web / dApp 側の Trust Boundary、認証・ロック・Account 認可の署名前提、backup / restore の v1 非包含、保証境界、OPEN-004 の欠番も本文で確認できる。

中心価値、第一対象である一般ユーザー、dApp 開発者の協力者としての位置付け、dApp による署名結果の独立検証、Symbol / NEM、Mainnet / Testnet、Mainnet release gate、v1 / milestone の定義、非対象範囲および成功条件に回帰はない。修正された責任境界の反復は各該当節の役割に沿ったもので、Concept の理解を妨げる不必要な冗長化とは判定しない。

残る OPEN-001〜OPEN-003、OPEN-005 と FUTURE-001 は、本文が明示的に未決事項・将来検討事項として分類しており、Concept を閉じて Requirements へ進むことを妨げない。重大な新規指摘はなく、Concept は READY と判定する。

## 6. Finding Status

Skill の重大度区分に合わせ、前回レビューでの表記を括弧内に併記する。

| ID      | Severity              | Status   | 初出レビュー             | 今回の状態根拠                                                                                                               |
| ------- | --------------------- | -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| CSR-001 | Minor（前回: MEDIUM） | RESOLVED | concept-sheet-review-002 | Signer 3種と非署名 Relay、Relay milestone の完了意味を本文で分離した。                                                       |
| CSR-002 | Major（前回: HIGH）   | RESOLVED | concept-sheet-review-002 | SDK を dApp 側の連携接点かつ Signer 外の主体とし、秘密情報・署名・最終承認を担わないことを明記した。                         |
| CSR-003 | Minor（前回: MEDIUM） | RESOLVED | concept-sheet-review-002 | 認証条件、Signer の lock 状態、対象 Account 認可を署名の前提とし、dApp / SDK / Relay の成立・迂回を禁止した。                |
| CSR-004 | Minor（前回: MEDIUM） | RESOLVED | concept-sheet-review-002 | backup / restore を v1 共通必須能力・全体完了条件から外し、platform / release 単位の別判断と条件付き保護対象として整理した。 |
| CSR-005 | Minor（前回: MEDIUM） | RESOLVED | concept-sheet-review-002 | 保証を MosaicLynx が管理する Signer / 承認境界の正常動作範囲へ限定し、外部環境の完全侵害を保証しないと明記した。             |
| CSR-006 | Minor（前回: LOW）    | RESOLVED | concept-sheet-review-002 | repository 運用、AI / agent 指示、文書編集規則、検証指示および下流文書の整合指示を Concept から除去した。                    |
| CSR-007 | Minor（前回: NIT）    | RESOLVED | concept-sheet-review-002 | OPEN-004 を履歴上の欠番であり、現在の未決事項ではないと明記した。                                                            |

## 7. Required Changes

なし。Critical または Major の New / Open / Reopened 指摘はない。CSR-002 は Major 相当の前回指摘だが、今回 RESOLVED である。

## 8. Optional Improvements

なし。Minor の New / Open / Reopened 指摘はない。

## 9. Resolved Findings

### CSR-001: RESOLVED

- 対象箇所: [§1](../../concept/concept-sheet.md#1-概要) 5〜20行、[§6.5](../../concept/concept-sheet.md#65-提供形態を段階的に広げる) 95〜97行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 110〜125行、[§9](../../concept/concept-sheet.md#9-対象範囲) 127〜140行、[§14](../../concept/concept-sheet.md#14-成功条件) 226〜239行。
- 確認できた事実: Browser Extension、Android、iOS が利用者向け Signer とされ、Relay は Mobile Signer と外部主体を接続する非署名の受け渡し基盤とされた。Relay は秘密情報、意味解釈、承認および署名を担わず、Relay milestone の完了も Signer 化ではなく受け渡し境界の成立と説明されている。
- 根拠: Concept Sheet 本文の製品構成、v1 定義、対象範囲および成功条件。共通要件でも同じ主体分離を確認した。
- 判定理由と影響: Relay の製品上の役割、Signer の利用者向け価値、v1 / milestone / release の関係が同じ解釈になり、Relay 完了を署名機能の追加と誤認する残存条件は確認できない。
- 完了条件 / 再確認方法: Signer 3種、非署名 Relay、Relay 完了の意味が製品構成・スコープ・成功条件で一貫して記載されていることを確認し、完了とした。

### CSR-002: RESOLVED

- 対象箇所: [§4](../../concept/concept-sheet.md#4-コンセプト) 51〜55行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 110〜125行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 202〜224行、[§14](../../concept/concept-sheet.md#14-成功条件) 226〜239行。
- 確認できた事実: SDK は dApp 側の署名要求・結果の受け渡しを補助する連携接点であり、Signer ではない。SDK は秘密情報を保管・復号・利用せず、署名および利用者の最終承認を担わない。SDK を含む Web / dApp 側は Signer の Trust Boundary 外であり、Web 側入力は検証前から信頼されない。
- 根拠: Concept Sheet の主要機能、信頼しないもの、責任境界および成功条件。SDK 要件は用語・責任境界の照合にのみ使用した。
- 判定理由と影響: SDK が Signer、秘密情報主体または承認主体と読める余地は解消され、秘密情報と最終承認の責任境界が明確になった。
- 完了条件 / 再確認方法: SDK の位置付け、非責任、Web / dApp 側の Trust Boundary および無条件に入力を信頼しない原則が本文で確認できることを確認し、完了とした。

### CSR-003: RESOLVED

- 対象箇所: [§11](../../concept/concept-sheet.md#11-基本原則) 158〜190行。
- 確認できた事実: Signer は、利用者が管理する認証条件、Signer の非ロック状態、対象 Account の認可条件が成立した場合だけ秘密情報を使用して署名できる。dApp、SDK、Relay はこれらを成立させたり迂回したりできない。具体的な認証方式、lock の扱い、Account 認可構造は下位フェーズへ委譲されている。
- 根拠: Concept Sheet の「署名には認証・ロック・Account 認可を前提とする」原則。共通要件・Profile / Account 資料は前提の用語確認に使用した。
- 判定理由と影響: 利用者の明示的承認だけでなく、Signer が秘密情報を使用できる条件と Web 側主体の限界が Concept レベルで明確になった。password、PIN、biometric、session などの方式は先取りされていない。
- 完了条件 / 再確認方法: 認証・lock・Account 認可を署名前提として明記し、下位設計へ委譲していることを確認し、完了とした。

### CSR-004: RESOLVED

- 対象箇所: [§9](../../concept/concept-sheet.md#9-対象範囲) 127〜140行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 202〜224行。
- 確認できた事実: backup / restore は現行 v1 の共通必須能力および全体完了条件に含めず、提供可否を platform / release 単位で別途判断するとされた。将来、秘密情報を含む backup / restore を提供する場合は、その backup の平文を保護対象とする条件も明示されている。
- 根拠: Concept Sheet の対象範囲と「守る情報」。Profile / Account 資料は backup の下流位置付けの照合に使用した。
- 判定理由と影響: backup / restore の機能要件と、将来提供時の保護原則が分離され、v1 全体の必須能力と誤読される残存条件は確認できない。format、暗号方式、復元手順は記載されていない。
- 完了条件 / 再確認方法: v1 非包含、platform / release 単位の判断、条件付きの保護対象という3点を確認し、完了とした。

### CSR-005: RESOLVED

- 対象箇所: [§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 202〜224行、[§14](../../concept/concept-sheet.md#14-成功条件) 226〜239行。
- 確認できた事実: 保証の中心は、MosaicLynx が管理する Signer / 承認境界が正常に動作する範囲での秘密情報分離と明示的承認なしの署名防止に限定されている。OS、端末、ブラウザ、dApp / Web page、正規配布 artifact など管理境界外の完全侵害まで防ぐ保証ではない。成功条件も同じ境界を付している。
- 根拠: Concept Sheet の「保証の境界」と成功条件。プロダクト仕様および Mainnet release 資料は保証・gate の意図確認に使用した。
- 判定理由と影響: 「安全」「公開されない」という中心価値を否定せずに保証対象を限定し、外部環境の完全侵害まで MosaicLynx が保証すると読む余地を解消した。詳細 threat model は下位フェーズへ委譲されている。
- 完了条件 / 再確認方法: Security 節と成功条件の双方が Signer / 承認境界の正常動作範囲を明示し、外部完全侵害を除外していることを確認し、完了とした。

### CSR-006: RESOLVED

- 対象箇所: [§12](../../concept/concept-sheet.md#12-制約) 192〜200行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 202〜224行、[§16](../../concept/concept-sheet.md#16-次フェーズ) 283〜298行。
- 確認できた事実: 前回問題となった repository 運用ルール、AI / agent 向け指示、文書編集ルール、プロトコル正しさの根拠、既存仕様の修正指示、要件定義での追加禁止および `AGENTS.md` / `.agents/project-context.md` の根拠資料記載は削除されている。残る下位委譲は、Concept の製品境界として詳細 API 等を扱わないこと、脅威モデル等を下位フェーズで定めることに限られる。
- 根拠: Concept Sheet の制約、非対象範囲、下位委譲および根拠資料。プロジェクトコンテキストは文書役割の照合に使用した。
- 判定理由と影響: 製品上の制約（Mainnet gate、Relay の非署名責任など）と repository 作業規則が混在しておらず、Concept が下流文書の編集方針や検証手順を規範化していない。
- 完了条件 / 再確認方法: repository 運用指示の除去と、Concept として許容される下位フェーズ委譲の残存を区別して確認し、完了とした。

### CSR-007: RESOLVED

- 対象箇所: [§15](../../concept/concept-sheet.md#15-未決事項) 241〜271行。
- 確認できた事実: OPEN-004 は「履歴上の欠番」であり、現在の未決事項として扱わないと明記されている。現在の未決事項は OPEN-001〜OPEN-003 および OPEN-005 として追跡できる。
- 根拠: Concept Sheet の OPEN 管理。追加の未決事項や新しい OPEN 番号は創作されていない。
- 判定理由と影響: 欠番の理由と現在の扱いが明確になり、OPEN 番号の追跡時に未記載の論点と誤認する条件は解消された。
- 完了条件 / 再確認方法: OPEN-004 の非未決扱いと、既存 OPEN 番号の連続性を確認し、完了とした。

## 10. Deferred Findings

なし。未解決のレビュー指摘はない。API、endpoint、schema、message format、protocol、algorithm、cryptographic parameter、class / module、storage format、error code、詳細 state machine、詳細 UI、implementation library および詳細 test case は、Concept の非対象または下位フェーズ委譲として扱われており、今回の指摘にはしていない。

## 11. Scope and Traceability

- Concept の製品境界は、Browser Extension / Android / iOS を利用者向け Signer、Relay を非署名の受け渡し基盤、SDK を dApp 側の連携接点として整理している。dApp による署名結果の独立検証と署名後の network 処理も外部責任として維持されている。
- Concept の中心価値は一般ユーザーの安全な署名判断であり、dApp 開発者はそれを支える主要な協力者、運用者は提供を支える関係者として位置付けられている。組織利用・カストディ・企業向け監査統制は v1 の初期対象外である。
- Symbol / NEM と Mainnet / Testnet の区別、利用者の明示的承認、Signer の認証・lock・Account 認可、秘密情報分離、Mainnet release gate、dApp の独立検証は、Concept 内で製品上の原則として追跡できる。
- 対象 Concept の根拠資料に Requirements / Design / Specification / release 資料が列挙されていること自体は問題ではない。今回確認した本文は、それらを Concept の正本または規範的な下流編集指示として扱っておらず、用語・責任境界・前提の確認資料として参照している。
- 要件定義以降へ委譲するのは、OPEN-001〜OPEN-003、OPEN-005 の決定と、各 platform / release の具体的な受け入れ条件、API、形式、方式、脅威モデルなどである。これらの詳細を Concept の合否条件へ逆流させていない。

## 12. Domain Checks

- 課題・価値: 中心課題を検証前の仮説として扱い、一般ユーザーが署名対象・チェーン・ネットワーク・起こり得る結果を判断できる価値へつないでいる。課題仮説の未実証は OPEN-001 として明示されている。
- 対象ユーザー: 一般ユーザーが第一対象であり、dApp 開発者の統合容易性は一般ユーザーの一貫した署名体験を支える付随価値として整理されている。修正による優先順位の変更はない。
- v1 の境界: Browser Extension、Android、iOS の Signer と Relay の非署名 milestone、実施順序、個別 release と全体 v1、Relay 完了の意味が区別されている。Mobile は計画上の後続提供形態であり、実装済み機能とは扱われていない。
- 責任境界: Signer、SDK、利用者、dApp、Relay、運用者の責任が混同されていない。Relay は署名せず、SDK は秘密情報・署名・最終承認を担わず、dApp は結果を独立検証する。
- Trust Boundary / Security: Web / dApp / SDK、外部要求、Relay、network 入力を検証前から信頼しない。Signer / 承認境界の保証範囲と外部完全侵害の非保証が整合している。認証・lock・Account 認可も概念前提に留まり、詳細方式は要求されていない。
- Chain / Network: Symbol と NEM、Mainnet と Testnet を同じ意味として扱わず、Mainnet は release evidence 等の gate 未達時に一般利用可能にしない原則が維持されている。
- 成功条件: 一般ユーザーの確認・承認・拒否、安全側終了、秘密情報分離、dApp の独立検証、各 milestone の責任境界および非対象範囲を観測対象としている。Security 成功条件には保証境界が付されている。
- OPEN / FUTURE: OPEN-001〜OPEN-003、OPEN-005 は未決事項、OPEN-004 は履歴上の欠番、FUTURE-001 は v1 の進行を妨げない将来検討事項として分類されている。
- 回帰確認: なし。中心価値、一般ユーザー、dApp 開発者、Signer、Relay、SDK、Chain / Network、秘密情報、明示的承認、独立検証、Mainnet gate、v1 / milestone、非対象範囲、OPEN / FUTURE、成功条件のいずれにも悪化は確認できない。責任境界の再掲も各節の役割に対応しており、Concept を不必要に冗長化していない。

## 13. Validation Results

- Markdown format: 本レビュー成果物に対する Prettier check を実行し、成功した。
- repository 内リンク: 本レビュー成果物から参照する対象 Concept、前回レビュー、Skill、関連資料の相対パスを確認し、リンク先ファイルの存在を確認した。
- heading / anchor: 対象 Concept の参照節見出しとリンク anchor を確認し、欠落を確認しなかった。
- 指摘 ID 重複: CSR-001〜CSR-007 の正式 ID 集合が一意であり、別の CSR / CS 指摘 ID は追加されていないことを確認した。
- 既存レビューの上書き: `concept-sheet-review-001.md` と `concept-sheet-review-002.md` が保持され、`concept-sheet-review-003.md` を新規成果物として作成したことを確認した。
- Source 非変更: 今回のレビュー差分では Concept Sheet、Requirements、Design、Specification、ADR、実装コードおよび `concept-review` Skill を変更していないことを確認した。staged diff に含まれるのは本レビュー成果物だけであり、禁止された変更範囲は含まれていない。
- `git diff --check`: 成果物の whitespace check を実行し、成功した。
- repository 標準 formatter: `pnpm format:check` は exit 2 で失敗した。既存の `_nem/infra/package/3rd-party-licenses/cddl + gplv2 with classpath exception - cddl+gpl.html`、`_sns/packages/symbol-qr-library/examples/index.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_network.properties.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_node.properties.html` の HTML 構文エラーと大量の既存 warning が原因であり、今回の成果物によるものではない。今回の成果物は個別 Prettier check を通過している。

## 14. Review Gates

| Gate               | 判定 | 根拠                                                                                              | 対応 ID                   |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------- | ------------------------- |
| 明確さ             | PASS | Signer 3種、非署名 Relay、dApp 側 SDK の役割が一意に読める。                                      | CSR-001, CSR-002          |
| 課題               | PASS | 一般ユーザーが秘密情報を渡さず署名対象を判断しにくい課題を検証前の仮説として説明している。        | なし                      |
| 対象ユーザーと価値 | PASS | 一般ユーザーを第一対象、dApp 開発者を主要な協力者とし、中心価値と付随価値を区別している。         | なし                      |
| v1 の境界          | PASS | 4 milestone、実施順序、個別 release、Relay 完了の意味、backup / restore 非包含を区別している。    | CSR-001, CSR-004          |
| 責任境界           | PASS | Signer、SDK、利用者、dApp、Relay、運用者の責任と Web / dApp 側の Trust Boundary が明確である。    | CSR-001, CSR-002, CSR-003 |
| 内部整合性         | PASS | 成功条件、Security の保証境界、Mainnet gate、Chain / Network 区別、非対象範囲が相互に矛盾しない。 | CSR-005                   |
| 成立性             | PASS | 明白な製品境界の矛盾はなく、OPEN は未決事項または将来検討事項として追跡可能である。               | CSR-006, CSR-007          |

全ゲートに不合格はなく、Critical 相当の残存問題もない。

## 15. Remaining Risks and Open Decisions

- `OPEN-001`: 中心課題の実在性と現在の回避方法は未検証部分を含む。ただし、課題仮説として明示され、要件定義および初期 milestone で継続検証する扱いである。
- `OPEN-002`: 一般ユーザーが署名判断に必要とする確認情報の具体化は Requirements / 利用者検証へ委譲されている。
- `OPEN-003`: 4 milestone の個別完了条件、次段階への条件および依存関係は Requirements へ委譲されている。
- `OPEN-005`: Mainnet 一般公開の詳細な証拠判定は Requirements / release 設計へ委譲されている。Mainnet gate 自体の原則は Concept に固定されている。
- `FUTURE-001`: 組織向け監査・統制・カストディ保証は v1 の初期対象外であり、将来展開時まで保留されている。
- 外部 OS、端末、ブラウザ、dApp / Web page、正規配布 artifact の完全侵害は MosaicLynx の保証範囲外であり、詳細 threat model と残余リスクは下位資料で定める。

上記は Concept に残された明示的な未決事項・前提であり、今回の修正に起因する未解決指摘ではない。

## 16. Automatic Changes

今回のレビュー成果物 `docs/reviews/concept/concept-sheet-review-003.md` だけを新規作成した。対象 Concept、Requirements / Design / Specification / ADR、実装コードおよび `concept-review` Skill への自動変更はない。

## 17. Final Decision

**READY**

CSR-001〜CSR-007 はすべて RESOLVED、重大な新規指摘なし、回帰なし、Concept フェーズ逸脱なしである。Requirements フェーズへ進められる。

CONCEPT PHASE READY
