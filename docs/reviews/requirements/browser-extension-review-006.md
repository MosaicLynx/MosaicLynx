# MosaicLynx ブラウザ拡張機能要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/browser-extension.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: Browser Extension 固有要求 BR-001〜BR-013、受け入れ条件 BR-AC-001〜BR-AC-012、Traceability、共通要件・下流資料との責任境界
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、関連仕様、アーキテクチャ、ADR、wallet-core の公開責任境界、前回レビューおよび Chrome 公式資料を照合した。仕様・設計・実装は要求の根拠ではなく、要求からの引継ぎと整合確認の資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

Web ページから申告された Origin を信用しないこと、top-level browsing context の限定、接続要求と署名要求の分離、拡張機能管理下の確認領域、Page / Extension context の分離、実行コンテキスト再生成時の自動再開禁止、権限最小化、remote code 境界、更新時の fail-closed、Mainnet gate が整理されている。前回レビューで指摘した初回接続、権限・入力境界、更新後の署名停止、Origin / frame の範囲は、本文または受け入れ条件へ相当程度反映されている。

ただし、仕様化へ進める前に修正が必要である。共通要件が参照する `BR-014` が対象文書に存在せず、Product Specification の MVP backup 要求との追跡が切れている。また、BR-004 が必須とする Profile binding と利用者による permission の変更・撤回が受け入れ条件で直接判定できず、BR-011 の本文より BR-AC-009 が弱い表現になっている。これらは、実装が安全に見えるだけでは要件適合を判定できない残存問題である。

## 指摘事項

### BREQ6-001 — `ERROR` — Profile backup の下流要求を示す `BR-014` が存在せず、Browser Extension の責任追跡が切れている

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:1-9,11-97`、`docs/requirements/requirements.md:239-245`
- 根拠: 共通要件の `CR-014` は Profile 全体 backup / restore を共通 MUST にはしない一方、個別 platform で提供する場合は platform 要件で責任分担・復元範囲・Wallet Store の扱いを定めるとし、下流として `browser-extension.md` の `BR-014` を明示している。しかし対象文書は `BR-001`〜`BR-013` までで、`BR-014` がない。さらに Product Specification の MVP は Profile の暗号化 backup export / import を対応範囲に含めている（`docs/specifications/product-spec.md:52-67`、`207-215`）。
- 影響: backup を Browser Extension milestone の要求として維持するのか、共通要件外の任意機能として延期するのかを要求資料から判定できない。維持する場合も、Application と wallet-core の責任、対象 Profile / Wallet Store、復元失敗時の既存状態保持、受け入れ条件が要件へ追跡されない。下流仕様だけに残すと、要件にない機能を仕様が新規に発明する形になる。
- 必要な修正: backup を初回 Browser Extension の能力として維持するなら、`BR-014` 相当の platform 要求、根拠、受け入れ条件および wallet-core との境界を追加する。延期または対象外とするなら、`CR-014` の `BR-014` 参照と Product Specification の MVP / 受け入れ記載を同時に整合させる。暗号方式や envelope schema を要件本文で固定する必要はない。

### BREQ6-002 — `ERROR` — BR-004 の Profile binding と permission の変更・撤回が受け入れ条件から判定できない

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:29-43,67-71,108-119`
- 根拠: BR-004 は接続許可を検証済み Web Origin、対象 Profile、Account、Chain、Network に対応付けることを MUST とし、同じ拡張機能管理下で利用者が明示的に変更・撤回できることを要求する。しかし `BR-AC-001` は Origin と有効な接続許可、`BR-AC-011` は Web Origin、Account、Chain、Network の対応だけを明記し、Profile を含めていない。`BR-AC-004` の「対応が失われた場合」も、Profile 切替・削除・permission revision の具体的な拒否条件を直接判定しない。
- 影響: 同じ Origin、Account、Chain、Network が別 Profile にも存在する場合、Profile A で成立した permission を Profile B の要求へ転用しても、現在の受け入れ条件だけでは不合格にできない。また、利用者が permission を変更・撤回できる UI / 操作がなくても、変更後の不一致だけを試験して合格と判定できる。
- 必要な修正: `BR-AC-001`、`BR-AC-004` または `BR-AC-011` に Profile の対応を明記し、Profile 切替・削除・permission revision 変更後に旧 permission が別 Profile や別要求を承認しないことを判定可能にする。利用者の明示操作による permission の作成・変更・撤回が拡張機能管理下で可能であることも、別の受け入れ条件へ追跡する。Profile ID、revision、Storage schema などの具体形式は下流へ委ねてよい。

### BREQ6-003 — `ERROR` — BR-011 の remote code 禁止が BR-AC-009 の「未承認」によって弱められている

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:85-89,116`
- 根拠: BR-011 本文は「リモートから取得した実行コードを信頼して署名処理へ組み込んではならない」と、承認の有無を条件にせず要求している。一方、`BR-AC-009` は「未承認の remote executable code」に依存しないことだけを記載している。「承認済み remote executable code」の定義は本文にも Traceability にもなく、本文より広い許容を読み込める。Chrome の security guidance も、拡張機能のコードと権限を最小化し、extension page の CSP を明示する境界を示している。
- 影響: remote code をリリース担当者や設定で「承認」した場合に、取得元・完全性・更新性が未定義の実行コードへ署名処理を依存させても、受け入れ条件上は合格と解釈できる。これは remote code を信頼しないというセキュリティ要求と矛盾する。
- 必要な修正: BR-011 の意図を維持するなら、`BR-AC-009` を「署名処理がリモートから取得した実行コードに依存しない」と本文と同じ強さへ修正する。「承認済み」を許可したい場合は、何を承認済みとするか、どの主体がどの完全性境界で検証するかを要求として明示し、BR-011 本文もその範囲へ改める。Chrome の Manifest key、CSP、bundling 手順は下流で定めてよい。

### BREQ6-004 — `WARN` — BR-001 に対応する受け入れ条件がなく、BR-AC-012 の Traceability 対応先が不適切

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:13-15,104-119,127-129`
- 根拠: BR-001 は初回 Browser Extension milestone の対応ブラウザを Chrome のみに限定する MUST であるが、Traceability は BR-AC-012 を参照している。BR-AC-012 が確認するのは HTTPS / loopback HTTP、Origin 種別、top-level / child frame の受付範囲であり、Chrome のみを提供・サポートすることではない。Chrome 以外を対象にしないこと、または配布物の対応環境が Chrome のみであることを判定する条件がない。
- 影響: 非 Chrome 環境を誤って対応対象として宣伝・検証しても、Browser Extension 要件の受け入れ条件だけでは不合格にできない。Chrome のバージョンや channel を後続仕様へ委ねること自体は可能だが、初回 milestone の対応環境境界が受け入れ証拠へ追跡されない。
- 必要な修正: Chrome のみを対応対象とする配布・対応環境表、または同等の外部確認可能な受け入れ条件を追加し、BR-001 をそれへ追跡する。Chrome の最低バージョンや Manifest の具体値をこの要件で固定する必要はない。

### BREQ6-005 — `WARN` — Mainnet gate の評価時点と、公開後に evidence が無効化された場合の境界が未定義

- 状態: `OPEN / release operation へ引継ぎ`
- 対象: `docs/requirements/browser-extension.md:95-97,114,141`
- 根拠: BR-013 / BR-AC-007 は gate 未達成または判定不能の build を Mainnet 署名可能な状態で公開しないことを要求する。共通要件 `CR-NFR-006` は fail-closed、policy 判定不能、trusted key 不備、evidence の期限切れ・検証失敗を Mainnet unavailable とする。現在の release reference は platform ごとに build-time gate を実行し、Lite evidence の有効期限を30日としている（`docs/release/mainnet-release-evidence.md`、`docs/evidence/evidence-policy.json`）。対象要件では、gate を build 作成時だけ評価するのか、公開済み capability の起動時にも再評価するのか、署名済み manifest の期限切れ・鍵失効・policy 判定不能を既存 build がどう扱うのかが定まっていない。
- 影響: release pipeline、runtime capability、evidence expiry / revocation の責任境界が実装・検証ごとに分かれる可能性がある。build-time gate だけを意図する場合でも、その境界が要求から再現できない。
- 必要な修正: Mainnet capability の gate 評価時点と、期限切れ・失効・検証不能時の外部状態を release operation で決定し、BR-013 / BR-AC-007 から追跡する。build-time の fail-closed のみを保証するなら、その旨を明記し、runtime の追加保証を暗黙に読み込ませない。

## 前回レビュー指摘の対応状況

- `BREQ5-001`（BR-010 / BR-011 の受け入れ条件欠落）: BR-AC-008 / BR-AC-009 の追加により、要求への追跡は改善した。ただし、remote code の表現強度については `BREQ6-003` が残る。
- `BREQ5-002`（更新後 fail-closed の受け入れ条件）: BR-AC-006 に更新後の確認不能、既存状態の無断置換禁止、wallet-core 失敗時の継続禁止が追加され、本文上は対応した。具体的な互換性判定証拠は下流の migration / release 設計へ引き継ぐ。
- `BREQ5-003`（初回接続の成立フロー）: BR-003、BR-004、BR-AC-010 により、未許可 Origin の接続要求と署名要求を区別し、接続許可成立前に署名確認へ進めない境界が明確になった。
- `BREQ5-004`（Origin / frame の未決範囲）: HTTPS / loopback HTTP、拒否対象、top-level 限定、browser-observed context とサイト認証の区別が本文と BR-AC-012 に反映された。

## 確認できた整合事項

- BR-002〜BR-009 は、Signer の確認・承認責任、秘密情報分離、要求元と permission の対応、実行コンテキストの lifecycle、wallet-core と Application の責任境界へ概ね追跡できる。
- BR-003 / BR-004 は、Web ページの自己申告文字列を Origin の根拠にせず、未許可 Origin を接続要求として明示的な接続許可へ送る境界を定めている。
- BR-007 / BR-008 は、Chrome service worker の停止・再生成やページ navigation 等による承認の取り違えを防ぐ方向で、共通要件の要求鮮度・完全性・replay 防止へ接続している。
- BR-010 / BR-011 は、Manifest、CSP、入力検証、remote code の具体方式を本書で固定せず、必要権限と実行コード境界という要求に留めている。
- BR-013 は、共通要件の Mainnet fail-closed と ADR 0001 / evidence policy へ追跡可能であり、gate 未達成時に Testnet-only で継続する設計を妨げない。
- 前回レビュー後も API、schema、Manifest key、Storage key、暗号方式、内部通信、migration の具体方式を要件本文へ持ち込んでいない。

## 未決定事項・引継ぎ

1. Profile backup export / import を Browser Extension の初回 milestone 要求として正式採用するか、延期・対象外として関連資料を整合させる。
2. 接続許可の受け入れ条件に Profile binding、Profile の変更・削除、permission revision、利用者による変更・撤回を明示する。
3. remote code の受け入れ条件を BR-011 本文と同じ禁止範囲へそろえる。
4. Chrome のみを対応対象とすることを、配布・対応環境の外部証拠へ追跡する。
5. Mainnet gate の build-time / runtime 境界、evidence expiry、trusted key の失効・検証不能時の capability 状態を release operation で定める。

## Validation

- `pnpm exec prettier --check docs/requirements/browser-extension.md docs/reviews/requirements/browser-extension-review-006.md`: 成功。
- `git diff --check`: 成功。
- `pnpm format:check`: exit 2。対象外の既存 submodule にある `_nem/infra/package/3rd-party-licenses/cddl + gplv2 with classpath exception - cddl+gpl.html`、`_sns/packages/symbol-qr-library/examples/index.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_network.properties.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_node.properties.html` の HTML 構文エラーと、既存ファイルの format warning により完了しなかった。対象文書と本レビュー成果物は個別 check で成功している。

## Not validated

- 文書レビューのため、Extension の Manifest、Provider RPC、Chrome E2E、wallet-core Binding、Mainnet release evidence の生成・署名・検証および実装テストは実行していない。

## 参照資料

- `docs/requirements/browser-extension.md`
- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/architecture/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/evidence/evidence-policy.json`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `docs/reviews/requirements/requirements-review-005.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- [Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)
- [Chrome permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Chrome extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [Chrome Web Store remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
