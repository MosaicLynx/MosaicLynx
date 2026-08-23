# MosaicLynx 共通要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/requirements.md`
- 確認日: 2026-08-23
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: 共通要件本文、共通の対象範囲、共通要求、未決事項、共通受け入れ条件
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプト、既存仕様、ADR、wallet-core 資料および platform / Relay 要件を根拠確認のために参照した。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

中心価値、一般ユーザーを第一対象とする優先順位、Symbol / NEM と Mainnet / Testnet の区別、blind signing の禁止、秘密情報分離、dApp の独立検証、announce を担わない責任境界は概ね明確である。コンセプトの OPEN 項目も共通要件へ引き継がれており、API、データ形式、暗号方式を本文で過度に固定しない方針も保たれている。

一方、現時点では仕様化へ進めるには重大な未解決事項がある。特に、Relay に Signer の要求を直接適用していること、要求の認証・完全性・再利用防止が共通 MUST として成立していないこと、`symbol-nem-wallet-core` と Profile / backup の責任資料が競合していること、受け入れ条件が外部観測可能な判定へ落ちていないことが blocker である。以下の `ERROR` を解消したうえで、各 platform 要件へ分解する必要がある。

## 指摘

### REQ-001 — `ERROR` — Relay に Signer 向け共通要求を直接適用しており、責任境界が判定不能

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:5,11,40,63-73,161-165,230-243`
- 根拠: 本文は Browser Extension、Android、iOS、Relay を4 milestoneとして扱い、`CR-011` と `CR-AC-006` で、各 milestone に利用者の明示的判断、blind signing 禁止、dApp の独立検証などを要求している。しかし Relay 要件は、Relay が署名対象を解釈・表示・承認・署名せず、スマホアプリがそれらを担うと定めている（`docs/requirements/relay.md:27-46,62-66,111-115`）。
- 影響: Relay 自体には確認画面や署名判断がないため、`CR-011` / `CR-AC-006` を Relay に適用したときの合否主体と証拠が定まらない。Relay milestone が、スマホアプリを含む end-to-end の責任なのか、Relay 単体の受け渡し責任なのかも曖昧になる。
- 必要な修正: 共通要件の適用対象を少なくとも「Signer（Extension / Android / iOS）」と「受け渡し基盤（Relay）」に分け、要求ごとの適用対象を表で示す。Relay には、利用者判断を実行する要求ではなく、Relay 経由でもスマホアプリの検証・承認・署名を迂回させない要求を適用する。`CR-AC-006` も4 milestone一括の抽象条件ではなく、Signer側とRelay側の個別完了条件へ分解する。

### REQ-002 — `ERROR` — 署名要求の認証・完全性・鮮度・replay 防止が共通 MUST として定義されていない

- 状態: `OPEN`
- 対象: `CR-001`、`CR-006`、`CR-009`、`CR-010`、`CR-NFR-001`、`CR-NFR-003`
- 根拠: `CR-NFR-001` は外部入力を検証前に信頼しないこと、`CR-NFR-003` は承認対象と署名対象の対応確認を要求するが、どの要求元を認証するか、許可 scope / Origin とどう結び付けるか、要求の改ざん・差し替え・期限切れ・再利用をどう拒否するかを共通要求として定めていない。`CR-010` は「認証に失敗した場合」を挙げるだけで、認証を必須にする要求になっていない。
- 参照資料では、要求 ID と期限、Origin、request digest、再試行時の新規要求、Origin proof 等が必要な性質としてすでに示されている（`docs/specifications/web-transaction-handoff-spec.md:225-231,302-317,338-342`、`docs/specifications/product-spec.md:535-540`）。
- 影響: 悪意ある dApp / Provider / Relay が作成・変更・再送した要求を、利用者が確認した要求として署名する条件を共通要件から導けない。platform 要件や仕様が別々の前提を採用すると、Extension / Mobile / Relay 間で安全性の保証が分裂する。
- 必要な修正: 方式や暗号アルゴリズムを固定せず、少なくとも「要求元と許可 scope の認証」「要求と承認・署名対象の完全性および対応付け」「期限・一意性・replay / duplicate / late delivery の拒否」「結果と元要求の完全性および対応付け」を共通の検証可能な要求として明記する。具体方式は platform / handoff / Relay 仕様へ追跡する。

### REQ-003 — `ERROR` — wallet-core を実質的な正本として扱いながら、統合境界を未決のまま残している

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:13,42,81,141-145,195-203,276-288`
- 根拠: 文書冒頭では実装ライブラリを確定しないと宣言しているが、`symbol-nem-wallet-core` を鍵管理、Wallet Store、raw byte 署名の責任主体として記載し、`CR-NFR-004` / `CR-NFR-005` は wallet-core の失敗や契約を前提にした MUST としている。同時に `CR-OPEN-001` は wallet-core と既存 TypeScript 実装の正本・委譲範囲について A/B/C の選択肢を残している。
- 影響: CR-OPEN-001 の結論によって、現在の共通 MUST の適用対象、署名の正本、Store の正本、失敗の責任主体が変わり得る。未決の設計選択を要求の根拠として固定すると、後続仕様が要件に適合できないか、要件を無断で変更することになる。
- 必要な修正: 統合判断前は「承認済みの鍵管理・署名コンポーネント」など能力ベースの要求に置き換え、wallet-core は候補・参照資料として扱う。または `CR-OPEN-001` を先に決定し、採用した正本・委譲範囲・既存 TypeScript package の残る責任を要求本文と参照資料で一致させる。いずれの場合も wallet-core の内部暗号を再実装しないという境界は維持する。

### REQ-004 — `ERROR` — Profile / backup / restore の責任資料が競合している

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:75-81,139-145,276-288`
- 根拠: 共通要件は Profile、Account、lock / unlock、backup / restore を wallet-core 契約と Profile / Account 仕様に整合させるとしている。しかし `docs/specifications/profile-account-spec.md:360-424` は Profile 全体の暗号化 backup / restore を要求する一方、`_snwc/docs/requirements/requirements.md:83-106` は暗号化 Profile データそのものの backup / migration / recovery を Application / 上位側の責任とし、wallet-core v1 の対象外としている。
- 影響: backup の所有者、暗号化境界、復元対象、Store の扱い、Profile ID / 重複判定、失敗時の atomic 性が定まらない。`CR-008` が「秘密情報を Relay 等へ公開しない」とだけ定めても、backup をどの主体が生成・復元するかを判定できない。
- 必要な修正: Profile / Account 仕様と wallet-core 資料のどちらをどの範囲の正本とするかを決定し、共通要件では「backup / restore を共通必須能力にするか」「Application / package 固有能力にするか」を明記する。採用した場合は、生成・復元・保存・秘密情報の一時受け渡し・失敗時の状態保持について責任主体を一つに定める。未決のままなら共通要求から backup / restore を外し、対象 platform 要件へ条件付きで追跡する。

### REQ-005 — `ERROR` — 共通署名接点の要求が外部成果ではなく「方向性」として記述され、message signing の適用範囲も不明確

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:63-73,131-137`
- 根拠: `CR-007` は「共通の署名接点を提供する方向性を持つ」としており、利用者または dApp から観測できる成果、対応する操作、対象 milestone、未対応時の扱いがない。一方、共通能力は「メッセージまたはトランザクション」を含むが、Web handoff v1 はメッセージ署名を対象外とし（`docs/specifications/web-transaction-handoff-spec.md:13-20,29-38`）、Product Specification は Extension の MVP に構造化メッセージ署名を含めている（`docs/specifications/product-spec.md:52-67,452-524`）。
- 影響: `CR-007` を満たすために Mobile / Relay も message signing を提供するのか、共通接点は transaction signing だけなのかが判断できない。dApp が transport 差異を扱わないこと、共通の結果検証、未対応 operation の安全な失敗も一つの受け入れ条件へ追跡できない。
- 必要な修正: 「方向性」ではなく、対応する operation と dApp から観測できる共通結果を要求する。transaction signing と message signing の v1 適用範囲を milestone 別に明示し、共通要求にするものと platform / handoff 固有にするものを分離する。API 名、引数、transport の具体化は後続仕様へ委ねてよいが、能力の範囲と未対応時の外部動作は要件で決める。

### REQ-006 — `ERROR` — 受け入れ条件が要求単位の検証へ落ちておらず、外部観測可能性が不足している

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:230-243`
- 根拠: `CR-AC-001`、`CR-AC-003`、`CR-AC-005`、`CR-AC-006`、`CR-AC-008` は「確認できる」「不要に公開されない」「独立して確認できる」「必要な gate」など、試験対象・失敗条件・判定主体・証拠の範囲が未定義である。`CR-001`、`CR-006`、`CR-007`、`CR-009`、`CR-NFR-001`、`CR-NFR-003`、`CR-NFR-004`、`CR-NFR-005`、`CR-NFR-007` に対応する受け入れ条件も明示されていない。
- 影響: 要件レビュー、platform milestone の完了判定、仕様レビューで、要求を満たしたかを同じ基準で判定できない。特に `CR-AC-006` は4 milestone 全体の抽象的な結果であり、どの milestone のどの証拠が不足しているか特定できない。
- 必要な修正: 要求 ID と受け入れ条件の traceability 表を追加し、各 MUST について少なくとも主体、前提、観測する結果、拒否 / 失敗時の結果を記録する。秘密情報非露出については、対象境界（ログ、例外、URL、通信、保存、diagnostic 等）と確認証拠の種類を定める。「仕様・テストケースは後続で決定する」ことは許容するが、後続で何を判定できなければならないかは共通要件に残す。

### REQ-007 — `WARN` — Mainnet gate が「必要な gate」のままで、承認済み ADR / policy への依存が不明確

- 状態: `OPEN`
- 対象: `CR-NFR-006`、`CR-AC-008`、`OPEN-005`
- 根拠: 本文は evidence 項目、承認者、security gate、公開手順をすべて `OPEN-005` に残している。しかし `docs/adr/0001-mainnet-evidence-lite.md:3-13` と `docs/release/mainnet-release-evidence.md:3-23` は初期 Mainnet release の Lite gate、30日有効期限、署名済み manifest、artifact / source / lockfile / SBOM / SDK integrity 等の証拠、release approval をすでに決めている。`docs/evidence/evidence-policy.json:1-8` も checked-in policy として存在する。
- 影響: Mainnet を有効化できる条件が要件から再現できず、実装・release review が `OPEN-005` の未決定を理由に相互に異なる gate を採用する可能性がある。
- 必要な修正: 要件では具体的なコマンドを固定せず、少なくとも承認済み ADR / evidence policy に従う fail-closed の capability 要求と、将来決定が必要な残余事項を分離する。Lite policy を変更する判断が必要なら、`OPEN-005` を「変更・追加の条件」に限定する。

### REQ-008 — `WARN` — 要求ごとの根拠記載に欠落があり、セキュリティ要求の由来を追跡できない

- 状態: `OPEN`
- 対象: `CR-NFR-001`、`CR-NFR-004`、`CR-NFR-005`、`CR-NFR-007`、`CR-012`
- 根拠: 多くの `CR-*` にはコンセプト章と参考仕様が付いているが、上記要求には要求単位の根拠がない。文書末尾の参照資料一覧だけでは、コンセプト由来の要求、wallet-core 契約由来の制約、仕様化で新たに必要と判断した要求を区別できない。`AGENTS.md` は作業指針であり、プロダクト要件の正本として扱うべき資料ではない。
- 影響: 要件の過不足を upstream の課題・価値へ追跡できず、レビュー指摘に対する修正の妥当性も確認しにくい。特に wallet-core の warning / Store error と Symbol / NEM 相互運用性の要求が、共通要件として必要な範囲を超えていないか判定できない。
- 必要な修正: 各要求に「根拠」「適用範囲」「下流仕様 / ADR」を付ける。新規のセキュリティ要求は、コンセプトで不足する場合でも、脅威モデルまたは承認済み設計判断を根拠として明示する。`AGENTS.md` は実施上の注意として参照し、要求の根拠からは外す。

## 確認できた整合事項

- 一般ユーザーを第一対象、dApp 開発者を協力者、dApp を署名後処理の外部主体として整理している。
- v1、milestone、release を区別し、Browser Extension → Android → iOS → Relay の順序と Relay 完了を全体 v1 完了とする方針をコンセプトから追跡している。
- Symbol / NEM、Mainnet / Testnet、Signer / dApp / Relay の責任を混同しない原則を多くの要求へ反映している。
- blind signing、自動署名、永続的署名許可、Relay の意味解釈・署名・announce・長期保管を対象外としている。
- API、データ形式、暗号アルゴリズム、状態遷移を共通要件で詳細固定せず、後続仕様へ委ねる方針は適切である。ただし、REQ-003〜005 に記載した責任主体・能力範囲は、方式を固定しないままでも決める必要がある。
- OPEN 項目と下流工程への引継ぎを明示しており、未決事項をすべて確定要求として扱ってはいない。

## 要件定義を再レビューする前に必要な判断

1. Relay に適用する共通要求と、Signer（Extension / Android / iOS）だけに適用する共通要求を分離する。
2. 署名要求・結果に必要な認証、完全性、鮮度、replay 防止、許可 scope の共通性質を要求として確定する。
3. `symbol-nem-wallet-core` の正本範囲と、既存 TypeScript package の責任を決定する。
4. Profile 全体 backup / restore の責任主体と、wallet-core v1 の対象外方針との競合を解消する。
5. transaction signing と message signing の milestone 別適用範囲を確定する。
6. 全 MUST と受け入れ条件の traceability、および Mainnet gate の ADR / policy への依存を明記する。

## 参照資料

- `.agents/project-context.md`
- `docs/concept/concept-sheet.md`
- `docs/reviews/concept/concept-sheet-review-001.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/release/mainnet-release-evidence.md`
- `docs/evidence/evidence-policy.json`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
