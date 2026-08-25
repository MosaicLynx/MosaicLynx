# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: Relay 固有要求 `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-004`、受け入れ条件 `RR-AC-001`〜`RR-AC-008`、未決事項、上流・共通要件および下流 handoff 仕様との責任境界
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay / SDK の実装・テスト・README、既存要件レビューを照合した。下流仕様・実装・テストは要求の上流根拠ではなく、整合確認または要求からの引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

Relay を Signer と分離し、Relay の侵害・障害・改ざん・replay・重複配送・遅延配送が利用者の意図しない署名につながらない責任境界は、全体として適切に整理されている。Relay が署名対象を解釈・表示・承認・署名せず、Mobile が復号・検証・承認・署名し、dApp が署名結果を独立検証する方向も、Concept Sheet と共通要件に整合する。

ただし、現行のままでは仕様化へ進めない。共通要件が v1 の全 Signer に確定している message signing について、`RR-OPEN-001` が Relay の対応操作範囲を未決のまま残している。一方、現行の Web Transaction Handoff Specification は message signing を v1 対象外としている。このままでは Relay milestone が共通 MUST を満たす範囲を判定できない。

また、Relay の bearer credential / session secret の保護が Relay 固有要求として明示されず、`RR-AC-006` の「秘密情報処理を担っていない」という表現は、実際に必要な transport credential の検証・hash 保持まで禁止するようにも読める。さらに、データ保持の一時性が `SHOULD` に留まり、削除・保持上限を判定する受け入れ条件がない。これらは Relay の security / privacy 境界を仕様へ正確に引き継ぐために修正が必要である。

## 指摘事項

### RREQ1-001 — `ERROR` — message signing の Relay 対応範囲が共通要件と下流 handoff 仕様の間で確定していない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:23,52-60,189-193`、`docs/requirements/requirements.md:156-183,391-402`、`docs/specifications/web-transaction-handoff-spec.md:13-38`
- 根拠: 共通要件 `CR-007` / `CR-007-MSG` は、Browser Extension、Android、iOS の各 Signer が v1 共通能力として transaction signing と message signing を提供することを確定している。また `CR-007` は Relay が Mobile Signer に必要な署名要求・署名結果を受け渡すことを定めている。しかし Relay 要件の `RR-OPEN-001` は「対応する操作の範囲」を未決とし、「操作ごとに milestone の対応範囲を分ける」選択肢を残している。一方、Web Transaction Handoff Specification は v1 の対象外に「メッセージ署名」を記載し、v1 の対象を transaction signing としている。同仕様には `signData` の型・実装記述も存在し、文書内でも範囲が一致していない。
- 影響: Relay が transaction signing だけを受け渡しても要件適合とみなせるのか、message signing まで Relay milestone の必須範囲なのかを判定できない。`RR-001`、`RR-002`、`RR-AC-007`、`RR-AC-008` の検証対象、Mobile v1 の完了条件、共通 SDK の結果・失敗契約も確定しない。
- 必要な修正: 共通要件の transaction signing / message signing を v1 の確定 MUST として維持するなら、Relay 要件で両操作を必須範囲として明示し、`RR-OPEN-001` から操作範囲の未決を除く。そのうえで handoff 仕様の対象外記載、Mobile / Relay の milestone 表、`signData` の外部契約、受け入れ条件・テストを同時に整合させる。message signing を Relay v1 の対象外へ戻す判断をするなら、Relay 要件だけでなく `CR-007`、`CR-007-MSG`、共通受け入れ条件、Product / Mobile の対応範囲を同時に変更する。API や暗号方式を本要件へ追加する必要はない。

### RREQ1-002 — `ERROR` — transport credential と session secret の保護要求が欠落し、`秘密情報処理` の表現も曖昧である

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:36-46,105-109,158-170,183`、`docs/requirements/requirements.md:185-191,257-261,387-395`、`docs/specifications/web-transaction-handoff-spec.md:456-498,502-513,655-679`
- 根拠: Relay 要件 `RR-008` は秘密鍵、Mnemonic、Profile password、復号済み Wallet Store、署名用秘密情報を Relay やログ等へ含めないと定めるが、Relay API の bearer credential、capability token、session secret、導出鍵など、受け渡しの認証・復号に使う transport credential を明示していない。共通要件の秘密情報要求も主に署名秘密情報を列挙している。下流 handoff 仕様は、raw token / session secret / 導出鍵を URL query、ログ、telemetry、storage、error へ保存しないこと、Relay 側には token hash のみを保持することを具体化している。一方、Relay の受け入れ条件 `RR-AC-006` は Relay が「秘密情報処理」を担っていないと記載しており、transport credential の最小限の検証・hash 保持まで禁止するようにも読める。
- 影響: Relay が保護すべき署名秘密情報と、プロトコル上必要な bearer credential / session secret の責任境界が要求段階で分離されない。認証 credential をログ、URL、診断、保存領域へ出力する実装や、逆に必要な token 検証まで禁止する実装を、現行の要求だけでは一貫して不適合と判定できない。
- 必要な修正: 「署名秘密情報」と「transport credential」を定義上分離する。Relay は秘密鍵・Mnemonic・復号済み Wallet Store・署名用秘密情報を受け取らず、transport credential はプロトコルが必要とする最小範囲だけで扱い、raw 値・session secret・導出鍵を URL、ログ、診断、エラー、analytics、継続保存へ露出しないことを MUST として追加する。Relay 側に保存できる検証用表現の範囲は方式非依存のまま下流へ委ねてよい。`RR-AC-006` と `RR-AC-007` に、この境界を外部から確認できる受け入れ条件として追跡する。

### RREQ1-003 — `ERROR` — 一時保持・削除の要求が `SHOULD` に留まり、外部から判定できる受け入れ条件がない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:41-44,146-150,158-166,174-185`
- 根拠: Relay は署名要求・署名結果を履歴サービスとして長期管理しないと責任境界で定め、対象外にも履歴サービスを含めている。しかし `RR-NFR-003` は「必要な範囲を越えて保持しない」を `SHOULD` とし、具体的な保持期間、削除契機、障害復旧時の扱いをすべて後続仕様へ委ねている。`RR-AC-001`〜`RR-AC-008` にも、成功・拒否・cancel・expiry・障害後に要求、結果、credential または metadata が削除・再利用不能になることを確認する条件がない。下流仕様と現行 Relay 実装は TTL、終端時 purge、再起動後の安全側失敗を具体化しているが、それだけでは上流要件にない削除保証を仕様で新規に追加した形になる。
- 影響: 長期履歴を保持する実装でも、理由と影響を記録すれば `SHOULD` 違反として処理でき、Relay の対象外である履歴サービス化との境界が曖昧になる。漏えい時の露出期間、再起動・期限切れ後の古い要求の再出現、運用 storage / backup への残存を要件適合として判定できない。
- 必要な修正: Relay が手渡しに必要な期間を越えて要求・結果を保持せず、履歴・分析・ユーザーアカウントサービスを提供しないことを、必要なら bounded retention として `MUST` にする。保持期間の具体値や storage 実装は下流へ委ねてよいが、終端状態、expiry、cancel、再起動・障害時の削除または再利用不能を確認する受け入れ条件を追加し、`RR-NFR-003` / `RR-NFR-004` から追跡する。

### RREQ1-004 — `WARN` — Relay 固有要求と受け入れ条件の Traceability がなく、要求ごとの根拠・検証範囲を再現できない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:48-172,174-207`
- 根拠: 本文末尾には上流根拠、整合確認資料、下流引継ぎの区分はあるが、`RR-*` / `RR-NFR-*` ごとの Concept / 共通要件への対応表がない。また受け入れ条件表に関連要求列がなく、`RR-008`、`RR-NFR-001`、`RR-NFR-003`、`RR-NFR-004` などがどの条件で判定されるか直接追跡できない。共通要件、Mobile 要件、Browser Extension 要件は要求・根拠・受け入れ条件・下流を個別に対応付けている。
- 影響: Relay 固有要求が共通 `CR-NFR-008`〜`CR-NFR-012` の具体化なのか、Relay が新たに担う責任なのかを第三者が再現しにくい。受け入れ条件のない要求や、共通要件で既に保証される範囲の重複・弱体化を仕様化時に見落とす。
- 必要な修正: `RR-*` / `RR-NFR-*` ごとに、上流根拠、適用主体、対応する `RR-AC-*` または共通 `CR-AC-*`、下流仕様・設計を記載する Traceability 表を追加する。具体的な API、schema、暗号パラメータを表へ追加する必要はない。

### RREQ1-005 — `WARN` — 正常な受け渡しと Chain / Network / Account を含む独立検証の受け入れ条件が弱い

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:50-60,174-185`、`docs/requirements/requirements.md:148-165,357-365,385-402`
- 根拠: `RR-001` と `RR-002` は transaction signing / message signing の要求と結果を受け渡す MUST だが、受け入れ条件は主に障害・改ざん・replay 等の拒否条件である。`RR-AC-007` は Mobile が検証・承認後に署名できること、`RR-AC-008` は dApp が元要求との対応を確認できることを定めるものの、正常な transaction と message の両方が受け渡されること、結果が署名者・Account・Chain・Network と対応することを明示しない。これらは共通 `CR-AC-004`〜`CR-AC-006`、`CR-AC-015` が要求する確認範囲である。
- 影響: request / response が届く経路だけを実装し、Chain / Network / Account の置換や operation の取り違えを dApp が検証できない状態でも、Relay 固有の受け入れ条件だけでは合格と解釈できる。正常系の handoff 不成立も、障害時の安全側テストだけでは発見しにくい。
- 必要な修正: `RR-AC-007` / `RR-AC-008` に共通 `CR-AC-004`〜`CR-AC-006`、`CR-AC-015` を明示的に追跡し、正常な transaction signing と message signing の request / response が元要求、署名者、Account、Chain、Network に対応することを確認する条件を追加する。message signing の範囲を下流へ委ねる場合でも、共通要件との整合を先に `RREQ1-001` で決定する。

### RREQ1-006 — `WARN` — 障害・拒否・未対応・検証失敗の分類を未決にする際の下限が明示されていない

- 状態: `OPEN / 共通要件・下流仕様へ引継ぎ`
- 対象: `docs/requirements/relay.md:68-80,187-207`、`docs/requirements/requirements.md:156-165,221-225,401-402`
- 根拠: `RR-004` は dApp が受け渡し失敗または期限切れを成功と区別できることを要求し、`RR-OPEN-002` は停止、期限切れ、結果不明、再試行可能な失敗の粒度を未決としている。一方、共通 `CR-007` / `CR-012` / `CR-AC-015` は、利用者拒否、未対応 operation / format、要求元・許可範囲不一致、内容不一致、期限切れ、replay / duplicate、Chain / Network / Account 不一致、解析・表示不能、検証失敗、利用不能などを、成功や別 operation の成功と区別して扱えることを求めている。下流 handoff 仕様にも共通 SDK error の分類がある。
- 影響: `RR-OPEN-002` の「粒度」を広く解釈すると、Relay 経由で異なる安全側失敗を一つへ潰しても要件上許容されるように読める。dApp の再試行判断や、古い要求の再利用防止の外部契約を仕様化前に誤って単純化する可能性がある。
- 必要な修正: 具体的な wire error code や HTTP status は未決のまま、少なくとも共通要件が要求する「成功と安全側失敗の区別」「再試行は新しい request」「期限切れ・結果不明・検証失敗を成功扱いしない」という下限を `RR-OPEN-002` と受け入れ条件へ明記する。分類を共通の一つの error へ正規化できる範囲を定める場合は、dApp が安全に再試行・終了を判断できる条件を残す。

## 確認できた整合事項

- `RR-001`〜`RR-009` は、Relay が信頼境界の内側に入らず、Mobile が要求を復号・検証・表示・承認・署名し、dApp が結果を独立検証する共通責任境界に概ね整合する。
- `RR-004`〜`RR-007` と `RR-NFR-002` は、共通要件の要求内容の完全性、鮮度、replay / duplicate / late delivery、結果と元要求の対応へ接続する方向で整理されている。
- `RR-010` / `RR-011` は、DoS や可用性対策を理由に検証・承認・秘密情報分離を弱めない原則を示し、rate limit やインフラ方式を要件本文で固定していない。
- Relay の対象外として、署名、transaction の意味解釈、announce、node 選択、長期履歴サービス、ユーザーアカウントサービスを除外しており、Concept Sheet、Architecture、Mobile 要件の責任分担と整合する。
- 現在のワークスペースには Mobile アプリ実装は存在しない。Relay 要件のレビューでは、将来の Mobile 実装を実装済み機能・検証済みの受け入れ条件として扱っていない。
- 現行 Relay 実装・テストは、opaque envelope、token role 分離、期限、first-write-wins、long polling、ACK / cancel、rate limit、Redis 再起動時の安全側失敗を部分的に具体化している。ただし、これらの実装・テストの存在だけを要件適合の根拠にはしていない。

## 未決定事項・引継ぎ

1. `RREQ1-001`: message signing を Relay / Mobile v1 の必須範囲とするか、共通要件側を変更するかを決定し、handoff 仕様、milestone 表、`signData` 契約、テストを整合させる。
2. `RREQ1-002`: 署名秘密情報、Relay credential、session secret、導出鍵の分類と、各主体の受信・一時保持・ログ・診断・URL 露出禁止の境界を要件として固定する。
3. `RREQ1-003`: Relay の bounded retention、終端・expiry・cancel・障害後の削除または再利用不能を MUST と受け入れ条件へ追跡する。TTL、storage、purge 機構の具体値は下流で決定する。
4. `RREQ1-004`〜`RREQ1-006`: Traceability、正常系 handoff、共通 failure taxonomy の最低保証を、Relay 要件と共通・下流資料の間で対応付ける。
5. Relay の API、envelope schema、暗号方式、token 形式、状態遷移、rate limit、インフラ、テストの具体方式は、上記の要件境界を満たす範囲で Web Transaction Handoff Specification と設計へ引き継ぐ。

## Validation

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-001.md`: 成功。
- `git diff --check`: 成功。
- `pnpm format:check`: exit 2。既存のサブモジュールおよび対象外ファイルに大量の format warning と HTML 構文エラーがあり、全体チェックは完了しなかった。対象文書と本レビュー成果物は個別 Prettier check で成功している。

## Not validated

- 文書レビューのため、Mobile アプリ、Relay production deployment、iOS / Android App Link、wallet-core Binding、Mainnet release evidence の生成・署名・検証は実行していない。
- Redis を使う Relay integration test は、要件レビューの判定に不要なため実行していない。
- message signing の v1 範囲について、要件・仕様の整合判断は行ったが、修正は実施していない。

## 参照資料

- `docs/requirements/relay.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/design/architecture.md`
- `apps/relay/README.md`
- `apps/relay/src/app.ts`
- `apps/relay/src/types.ts`
- `apps/relay/src/memory-store.ts`
- `apps/relay/src/redis-store.ts`
- `apps/relay/test/app.test.ts`
- `apps/relay/test/redis.integration.test.ts`
- `packages/relay-protocol/src/index.ts`
- `packages/relay-protocol/test/protocol.test.ts`
- `packages/sdk/src/mobile-relay.ts`
- `packages/sdk/test/mobile-relay.test.ts`
- `docs/reviews/requirements/requirements-review-004.md`
- `docs/reviews/requirements/browser-extension-review-003.md`
- `docs/reviews/requirements/mobile-app-review-003.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
