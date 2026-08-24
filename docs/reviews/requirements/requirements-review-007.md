# MosaicLynx ブラウザ拡張機能要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/browser-extension.md`
- 確認日: 2026-08-24
- 判定: `READY`
- 対象範囲: Browser Extension 固有要求 BR-001〜BR-013、受け入れ条件 BR-AC-001〜BR-AC-013、Traceability、共通要件・下流資料との責任境界
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Product Specification、Architecture、Profile / Account 仕様、Mainnet release policy、前回レビュー、Chrome 公式資料を照合した。仕様・設計・実装は要求の根拠ではなく、要求からの引継ぎと整合確認の資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行版は仕様化へ進められる。初回 milestone の Chrome 限定、拡張機能管理下の確認領域、browser-observed Origin と top-level browsing context の binding、接続要求と署名要求の分離、Origin / Profile / Account / Chain / Network の permission scope、要求ごとの明示承認、Page / Extension context の分離、実行コンテキスト再生成時の自動再開禁止、更新時の fail-closed、権限最小化、remote code 禁止、Mainnet gate が、MUST と外部確認可能な受け入れ条件へ追跡されている。

前回レビューで指摘された Profile binding と permission 操作、remote code の表現、Chrome 対応条件の受け入れ追跡は現行版で解消されている。Profile backup についても、共通要件 `CR-014` と Product Specification が Browser Extension 初回 milestone の必須機能から明示的に外しており、現行 Browser Extension 要件に未存在の `BR-014` を追加する必要はない。

Mainnet gate の評価時点、公開後の evidence 期限切れ・失効・検証不能時の扱い、build-time / runtime の責任境界は対象文書自身が release operation / Mainnet evidence policy へ引き継いでいる。共通要件 `OPEN-005` も同じ範囲を下流運用の論点として扱っているため、本要件の未解決欠陥とは判定しない。

## 指摘事項

現行要件の仕様化を阻害する `ERROR`、`WARN`、`NIT` は確認されなかった。

| 指摘 ID | 重大度 | 状態     | 根拠                                                    | 影響                         | 必要な修正 |
| ------- | ------ | -------- | ------------------------------------------------------- | ---------------------------- | ---------- |
| —       | —      | 該当なし | 全 BR-* と BR-AC-* の対応、上流根拠、責任境界を確認済み | 仕様化を阻害する残存指摘なし | なし       |

## 前回レビュー指摘の対応状況

- `BREQ6-001`（backup の `BR-014` 追跡欠落）: 現行の `CR-014` は Browser Extension 初回 milestone / release への下流追跡を明示的に行わない。Product Specification と Profile / Account Specification も backup を将来の個別 platform / release の capability として扱うため、現行文書との不整合は解消した。
- `BREQ6-002`（Profile binding と permission 操作の受入条件欠落）: `BR-AC-001`、`BR-AC-004`、`BR-AC-011` に Profile binding、Profile A / B の分離、permission の作成・変更・撤回、旧 permission の再利用禁止が追加され、判定可能になった。
- `BREQ6-003`（remote code の受入条件が弱い）: `BR-011` と `BR-AC-009` が、承認の有無にかかわらず署名処理をリモート取得コードへ依存させない表現に一致している。
- `BREQ6-004`（Chrome 限定の受入条件欠落）: `BR-AC-013` が初回 milestone の提供・サポート対象を Chrome のみに限定し、`BR-001` から追跡している。
- `BREQ6-005`（Mainnet gate の評価時点等）: `BR-013` に明示的な下流引継ぎが追加され、共通要件 `OPEN-005`、`docs/release/mainnet-release-evidence.md` および evidence policy と責任境界が一致している。運用詳細を本要件の欠陥とは扱わない。

## 確認できた整合事項

- `BR-001` と `BR-AC-013` が Concept Sheet の最初の提供形態および Chrome 限定の正式判断へ対応している。
- `BR-003`、`BR-004`、`BR-AC-001`、`BR-AC-010`、`BR-AC-011`、`BR-AC-012` が、browser-observed context、Origin の許可範囲、初回接続、permission scope、top-level / frame 境界を一貫して扱っている。
- `BR-005`、`BR-AC-003` が、Origin、署名対象、Chain、Network、Account、確認可能な影響を拡張機能管理下で確認する要求へ対応している。共通要件 `CR-002`、`CR-NFR-007` の詳細表示・解析規則は下流へ適切に委ねられている。
- `BR-006`、`BR-007`、`BR-008`、`BR-AC-002`、`BR-AC-004`、`BR-AC-009` が、Web 側コンテキスト、Service Worker lifecycle、navigation / tab / frame 変化、承認の再利用を分離している。
- `BR-009` と `BR-AC-006` が、Application の Profile / Account / permission 管理と `symbol-nem-wallet-core` の Wallet Store、秘密情報処理、raw signing の責任境界を混同していない。
- `BR-010`、`BR-011`、`BR-AC-008`、`BR-AC-009` が、Chrome の最小権限、未検証入力、CSP / remote code の下流設計へ適切に引き継がれている。
- `BR-012` と `BR-AC-006` が、更新後に既存対象を別対象へ無断置換せず、互換性・wallet-core の失敗を確認できない場合に署名を継続しない要求へ対応している。
- `BR-013` と `BR-AC-007` が、共通要件 `CR-NFR-006` の Mainnet fail-closed と `docs/adr/0001-mainnet-evidence-lite.md`、evidence policy、release operation へ追跡している。
- API、schema、Manifest、Storage key、CSP の具体値、内部通信、暗号方式、migration / rollback の方式を本要件で新規に固定していない。

## 未決定事項・引継ぎ

1. Mainnet gate の評価時点、公開後の evidence 期限切れ・失効・検証不能時の capability 状態、build-time / runtime の責任境界は、release operation / Mainnet evidence policy で決定する。これは `BR-013` が明示的に引き継いでいる範囲である。
2. `BR-002`〜`BR-012` の API、schema、表示粒度、Manifest、Storage、内部通信、状態遷移、wallet-core binding、migration、rollback、versioning は、要求を満たす下流仕様・設計で具体化する。
3. Profile backup export / import は Browser Extension 初回 milestone の必須能力ではない。将来の個別 platform / release で提供すると決定した場合のみ、当該 platform の要件・仕様で責任分担と受け入れ条件を定める。

## Validation

- `pnpm exec prettier --check docs/requirements/browser-extension.md docs/reviews/requirements/requirements-review-007.md`: 成功。
- `git diff --check`: 成功。
- `pnpm format:check`: exit 2。対象外の既存ファイル・submodule にある複数の format warning と HTML syntax error により完了しなかった。対象要件と本レビュー成果物は個別 check で成功している。

## Not validated

- 文書レビューのため、Extension の Manifest、Provider RPC、Chrome E2E、wallet-core binding、Mainnet release evidence の生成・署名・検証および実装テストは実行していない。
- Chrome 公式資料は要求の外部制約との整合確認に使用した。これらは MosaicLynx 固有の製品判断や実装の正しさを保証するものではない。

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
- `docs/release/release-process.md`
- `docs/reviews/requirements/requirements-review-006.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- [Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)
- [Chrome permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Chrome extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [Chrome Web Store remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
