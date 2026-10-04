# MosaicLynx ブラウザ拡張機能要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/browser-extension.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: ブラウザ拡張機能固有要求 BR-001〜BR-013、受け入れ条件 BR-AC-001〜BR-AC-012、追跡可能性、共通要件・下流資料との責任境界
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、関連仕様、アーキテクチャ、ADR、wallet-core の公開責任境界、前回レビューおよび Chrome 公式資料を照合した。仕様・設計・実装は要求の根拠ではなく、要求からの引継ぎと整合確認の資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

Web ページから申告されたオリジンを信用しないこと、最上位の閲覧文脈の限定、接続要求と署名要求の分離、拡張機能管理下の確認領域、ページ / 拡張機能文脈の分離、実行コンテキスト再生成時の自動再開禁止、権限最小化、リモートコード境界、更新時の安全側での終了、Mainnet 判定条件が整理されている。前回レビューで指摘した初回接続、権限・入力境界、更新後の署名停止、オリジン / フレームの範囲は、本文または受け入れ条件へ相当程度反映されている。

ただし、仕様化へ進める前に修正が必要である。共通要件が参照する `BR-014` が対象文書に存在せず、プロダクト仕様の MVP バックアップ要求との追跡が切れている。また、BR-004 が必須とするプロファイル結び付けと利用者による許可の変更・撤回が受け入れ条件で直接判定できず、BR-011 の本文より BR-AC-009 が弱い表現になっている。これらは、実装が安全に見えるだけでは要件適合を判定できない残存問題である。

## 指摘事項

### BREQ6-001 — `ERROR` — プロファイルバックアップの下流要求を示す `BR-014` が存在せず、ブラウザ拡張機能の責任追跡が切れている

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:1-9,11-97`、`docs/requirements/requirements.md:239-245`
- 根拠: 共通要件の `CR-014` はプロファイル全体バックアップ / 復元を共通 MUST にはしない一方、個別プラットフォームで提供する場合はプラットフォーム要件で責任分担・復元範囲・ウォレットストアの扱いを定めるとし、下流として `browser-extension.md` の `BR-014` を明示している。しかし対象文書は `BR-001`〜`BR-013` までで、`BR-014` がない。さらにプロダクト仕様の MVP はプロファイルの暗号化バックアップエクスポート / インポートを対応範囲に含めている（`docs/specifications/product-spec.md:52-67`、`207-215`）。
- 影響: バックアップをブラウザ拡張機能マイルストーンの要求として維持するのか、共通要件外の任意機能として延期するのかを要求資料から判定できない。維持する場合も、アプリケーションと wallet-core の責任、対象プロファイル / ウォレットストア、復元失敗時の既存状態保持、受け入れ条件が要件へ追跡されない。下流仕様だけに残すと、要件にない機能を仕様が新規に発明する形になる。
- 必要な修正: バックアップを初回ブラウザ拡張機能の能力として維持するなら、`BR-014` 相当のプラットフォーム要求、根拠、受け入れ条件および wallet-core との境界を追加する。延期または対象外とするなら、`CR-014` の `BR-014` 参照とプロダクト仕様の MVP / 受け入れ記載を同時に整合させる。暗号方式やエンベロープスキーマを要件本文で固定する必要はない。

### BREQ6-002 — `ERROR` — BR-004 のプロファイル結び付けと許可の変更・撤回が受け入れ条件から判定できない

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:29-43,67-71,108-119`
- 根拠: BR-004 は接続許可を検証済み Web オリジン、対象プロファイル、アカウント、チェーン、ネットワークに対応付けることを MUST とし、同じ拡張機能管理下で利用者が明示的に変更・撤回できることを要求する。しかし `BR-AC-001` はオリジンと有効な接続許可、`BR-AC-011` は Web オリジン、アカウント、チェーン、ネットワークの対応だけを明記し、プロファイルを含めていない。`BR-AC-004` の「対応が失われた場合」も、プロファイル切替・削除・許可リビジョンの具体的な拒否条件を直接判定しない。
- 影響: 同じオリジン、アカウント、チェーン、ネットワークが別プロファイルにも存在する場合、プロファイル A で成立した許可をプロファイル B の要求へ転用しても、現在の受け入れ条件だけでは不合格にできない。また、利用者が許可を変更・撤回できる UI / 操作がなくても、変更後の不一致だけを試験して合格と判定できる。
- 必要な修正: `BR-AC-001`、`BR-AC-004` または `BR-AC-011` にプロファイルの対応を明記し、プロファイル切替・削除・許可リビジョン変更後に旧許可が別プロファイルや別要求を承認しないことを判定可能にする。利用者の明示操作による許可の作成・変更・撤回が拡張機能管理下で可能であることも、別の受け入れ条件へ追跡する。プロファイル ID、リビジョン、保存領域スキーマなどの具体形式は下流へ委ねてよい。

### BREQ6-003 — `ERROR` — BR-011 のリモートコード禁止が BR-AC-009 の「未承認」によって弱められている

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:85-89,116`
- 根拠: BR-011 本文は「リモートから取得した実行コードを信頼して署名処理へ組み込んではならない」と、承認の有無を条件にせず要求している。一方、`BR-AC-009` は「未承認のリモート実行ファイルコード」に依存しないことだけを記載している。「承認済みリモート実行ファイルコード」の定義は本文にも追跡可能性にもなく、本文より広い許容を読み込める。Chrome のセキュリティ指針も、拡張機能のコードと権限を最小化し、拡張機能ページの CSP を明示する境界を示している。
- 影響: リモートコードをリリース担当者や設定で「承認」した場合に、取得元・完全性・更新性が未定義の実行コードへ署名処理を依存させても、受け入れ条件上は合格と解釈できる。これはリモートコードを信頼しないというセキュリティ要求と矛盾する。
- 必要な修正: BR-011 の意図を維持するなら、`BR-AC-009` を「署名処理がリモートから取得した実行コードに依存しない」と本文と同じ強さへ修正する。「承認済み」を許可したい場合は、何を承認済みとするか、どの主体がどの完全性境界で検証するかを要求として明示し、BR-011 本文もその範囲へ改める。Chrome のマニフェスト鍵、CSP、bundling 手順は下流で定めてよい。

### BREQ6-004 — `WARN` — BR-001 に対応する受け入れ条件がなく、BR-AC-012 の追跡可能性対応先が不適切

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:13-15,104-119,127-129`
- 根拠: BR-001 は初回ブラウザ拡張機能マイルストーンの対応ブラウザを Chrome のみに限定する MUST であるが、追跡可能性は BR-AC-012 を参照している。BR-AC-012 が確認するのは HTTPS / ループバック HTTP、オリジン種別、最上位の / 子フレームの受付範囲であり、Chrome のみを提供・サポートすることではない。Chrome 以外を対象にしないこと、または配布物の対応環境が Chrome のみであることを判定する条件がない。
- 影響: 非 Chrome 環境を誤って対応対象として宣伝・検証しても、ブラウザ拡張機能要件の受け入れ条件だけでは不合格にできない。Chrome のバージョンやチャネルを後続仕様へ委ねること自体は可能だが、初回マイルストーンの対応環境境界が受け入れ証拠へ追跡されない。
- 必要な修正: Chrome のみを対応対象とする配布・対応環境表、または同等の外部確認可能な受け入れ条件を追加し、BR-001 をそれへ追跡する。Chrome の最低バージョンやマニフェストの具体値をこの要件で固定する必要はない。

### BREQ6-005 — `WARN` — Mainnet 判定条件の評価時点と、公開後に根拠が無効化された場合の境界が未定義

- 状態: `OPEN / release operation へ引継ぎ`
- 対象: `docs/requirements/browser-extension.md:95-97,114,141`
- 根拠: BR-013 / BR-AC-007 は判定条件未達成または判定不能のビルドを Mainnet 署名可能な状態で公開しないことを要求する。共通要件 `CR-NFR-006` は安全側での終了、ポリシー判定不能、信頼された鍵不備、根拠の期限切れ・検証失敗を Mainnet 利用不能とする。現在のリリース参照はプラットフォームごとにビルド時の判定条件を実行し、Lite 根拠の有効期限を30日としている（`docs/release/mainnet-release-evidence.md`、`docs/evidence/evidence-policy.json`）。対象要件では、判定条件をビルド作成時だけ評価するのか、公開済み対応能力の起動時にも再評価するのか、署名済みマニフェストの期限切れ・鍵失効・ポリシー判定不能を既存ビルドがどう扱うのかが定まっていない。
- 影響: リリース pipeline、実行環境対応能力、根拠期限切れ / 失効の責任境界が実装・検証ごとに分かれる可能性がある。ビルド時の判定条件だけを意図する場合でも、その境界が要求から再現できない。
- 必要な修正: Mainnet 対応能力の判定条件評価時点と、期限切れ・失効・検証不能時の外部状態をリリース操作で決定し、BR-013 / BR-AC-007 から追跡する。ビルド時の安全側での終了のみを保証するなら、その旨を明記し、実行環境の追加保証を暗黙に読み込ませない。

## 前回レビュー指摘の対応状況

- `BREQ5-001`（BR-010 / BR-011 の受け入れ条件欠落）: BR-AC-008 / BR-AC-009 の追加により、要求への追跡は改善した。ただし、リモートコードの表現強度については `BREQ6-003` が残る。
- `BREQ5-002`（更新後安全側での終了の受け入れ条件）: BR-AC-006 に更新後の確認不能、既存状態の無断置換禁止、wallet-core 失敗時の継続禁止が追加され、本文上は対応した。具体的な互換性判定証拠は下流の移行 / リリース設計へ引き継ぐ。
- `BREQ5-003`（初回接続の成立フロー）: BR-003、BR-004、BR-AC-010 により、未許可オリジンの接続要求と署名要求を区別し、接続許可成立前に署名確認へ進めない境界が明確になった。
- `BREQ5-004`（オリジン / フレームの未決範囲）: HTTPS / ループバック HTTP、拒否対象、最上位の限定、ブラウザで観測した文脈とサイト認証の区別が本文と BR-AC-012 に反映された。

## 確認できた整合事項

- BR-002〜BR-009 は、Signer の確認・承認責任、秘密情報分離、要求元と許可の対応、実行コンテキストのライフサイクル、wallet-core とアプリケーションの責任境界へ概ね追跡できる。
- BR-003 / BR-004 は、Web ページの自己申告文字列をオリジンの根拠にせず、未許可オリジンを接続要求として明示的な接続許可へ送る境界を定めている。
- BR-007 / BR-008 は、Chrome サービスワーカーの停止・再生成やページページ遷移等による承認の取り違えを防ぐ方向で、共通要件の要求鮮度・完全性・リプレイ防止へ接続している。
- BR-010 / BR-011 は、マニフェスト、CSP、入力検証、リモートコードの具体方式を本書で固定せず、必要権限と実行コード境界という要求に留めている。
- BR-013 は、共通要件の Mainnet 安全側での終了と ADR 0001 / 根拠ポリシーへ追跡可能であり、判定条件未達成時に Testnet 専用で継続する設計を妨げない。
- 前回レビュー後も API、スキーマ、マニフェスト鍵、保存領域鍵、暗号方式、内部通信、移行の具体方式を要件本文へ持ち込んでいない。

## 未決定事項・引継ぎ

1. プロファイルバックアップエクスポート / インポートをブラウザ拡張機能の初回マイルストーン要求として正式採用するか、延期・対象外として関連資料を整合させる。
2. 接続許可の受け入れ条件にプロファイル結び付け、プロファイルの変更・削除、許可リビジョン、利用者による変更・撤回を明示する。
3. リモートコードの受け入れ条件を BR-011 本文と同じ禁止範囲へそろえる。
4. Chrome のみを対応対象とすることを、配布・対応環境の外部証拠へ追跡する。
5. Mainnet 判定条件のビルド時の / 実行環境境界、根拠期限切れ、信頼された鍵の失効・検証不能時の対応能力状態をリリース操作で定める。

## 検証

- `pnpm exec prettier --check docs/requirements/browser-extension.md docs/reviews/requirements/browser-extension-review-002.md`: 成功。
- `git diff --check`: 成功。
- `pnpm format:check`: 終了 2。対象外の既存 submodule にある `_nem/infra/package/3rd-party-licenses/cddl + gplv2 with classpath exception - cddl+gpl.html`、`_sns/packages/symbol-qr-library/examples/index.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_network.properties.html`、`_symbol/mkdocs/snippets/devbook/reference/config/config_node.properties.html` の HTML 構文エラーと、既存ファイルの形式警告により完了しなかった。対象文書と本レビュー成果物は個別確認で成功している。

## 未検証

- 文書レビューのため、拡張機能のマニフェスト、Provider RPC、Chrome E2E、wallet-core バインディング、Mainnet リリース証跡の生成・署名・検証および実装テストは実行していない。

## 参照資料

- `docs/requirements/browser-extension.md`
- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/design/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/evidence/evidence-policy.json`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `docs/reviews/requirements/browser-extension-review-001.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- [Chrome 内容スクリプト / 分離された実行領域](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [拡張機能サービスワーカーライフサイクル](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome 拡張機能セキュリティ](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)
- [Chrome 許可](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Chrome 拡張機能更新ライフサイクル](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [Chrome Web ストアリモートコード指針](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
