# MosaicLynx ブラウザ拡張機能要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/browser-extension.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: Browser Extension 固有要求 BR-001〜BR-013、受け入れ条件 BR-AC-001〜BR-AC-007、Traceability、未決事項
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。共通要件、Concept Sheet、wallet-core の公開責任境界、関連仕様・ADR・既存レビューおよび本文の Chrome 公式参照資料を照合した。
- 変更範囲: 本レビュー成果物のみを新規作成する。要件本文、仕様書、ADR、コードは変更していない。

## 総評

Browser Extension の責任境界は概ね明確である。Web ページからの自己申告 Origin を信用しないこと、拡張機能管理下の確認領域、Page / Extension context の分離、実行コンテキストの停止・再生成時の自動再開禁止、Profile / Account / Chain / Network の対応、wallet-core との境界、Mainnet gate の fail-closed が BR-001〜BR-013 と Traceability に整理されている。共通要件 CR-001〜CR-013、CR-NFR-001〜CR-NFR-012 および CR-AC-001〜CR-AC-016 への追跡も概ね成立している。

ただし、仕様化へ進む前に修正が必要である。最小権限と入力・コード実行境界というセキュリティ MUST に対する受け入れ条件がなく、更新後の安全性・互換性を確認できない場合に署名可能状態を継続しないという BR-012 の中心条件も BR-AC-006 に反映されていない。また、BR-003 が「現在の許可状態の検証後」に確認領域へ渡すことを要求する一方、BR-004 は未許可 Origin に対する接続許可の成立方法を定めていないため、初回接続の外部動作が一意に判定できない。

## 指摘事項

### BREQ5-001 — `ERROR` — BR-010 / BR-011 のセキュリティ MUST が受け入れ条件へ追跡されていない

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:73-81,98-106`
- 根拠: BR-010 は Web ページへのアクセス、拡張機能内権限、外部通信権限を必要最小限に限定する MUST である。BR-011 は未検証入力、XSS、injection、remote code による確認表示・承認・署名権限・秘密情報の改変を防ぎ、リモート実行コードを署名処理へ信頼して組み込まない MUST である。しかし BR-AC-001〜BR-AC-007 のいずれにも、権限の必要最小限性、悪意あるページからの改変耐性、remote code の非実行または非信頼化を直接確認する条件がない。BR-AC-002 は Web 側からの直接取得・操作だけを扱い、BR-AC-005 は要求の拒否を一般化しているに留まる。
- 影響: Manifest・外部通信権限・実行コード境界を、要求と異なる実装でも「署名要求が拒否された」だけで合格と判定できる。セキュリティ上重要な MUST の仕様適合と検証範囲が第三者に再現できない。
- 必要な修正: BR-010 と BR-011 に対する受け入れ条件を追加し、少なくとも「宣言された権限・アクセス範囲が署名要求の受付・確認に必要な範囲であること」「敵対的な Web ページ入力が確認領域、承認状態、署名権限または秘密情報を改変できないこと」「署名処理が未承認の remote executable code に依存しないこと」を外部から確認できる形にする。具体的な Manifest key、CSP、テスト実装方式は後続仕様・設計へ残してよい。

### BREQ5-002 — `ERROR` — BR-012 の更新後 fail-closed 条件が BR-AC-006 で検証できない

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:83-85,105,127`
- 根拠: BR-012 は、更新で既存の Profile、Account、接続許可または Wallet Store を無断で別対象へ置換しないことに加え、「更新後の安全性や互換性を確認できない状態では、署名可能状態を継続してはならない」と要求している。一方、BR-AC-006 は更新または wallet-core 失敗時に既存情報と責任境界が無断変更されないことだけを確認し、更新後の確認不能時に署名を停止する条件を含まない。また「安全性」「互換性」「明示的な確認」の判定対象が定義されていない。
- 影響: データが置換されていなくても、互換性を確認できない更新後 build が署名を継続できる余地が残る。Chrome の更新は extension が idle になった時点で適用され得るため、更新・再起動・migration の境界を曖昧にしたままでは、承認中要求や既存署名能力の扱いを一意に検証できない。
- 必要な修正: BR-AC-006 または別の受け入れ条件で、更新の正常系、互換性確認失敗・判定不能、migration / rollback の中断または破損時に、既存データを無断で置換せず、要求された署名可能状態を継続しないことを明示する。「明示的な確認」が必要な対象と、確認不能時に利用者へ観測される状態も要件レベルで定める。具体的な versioning、migration、rollback 方式は下流へ委ねてよい。wallet-core の失敗については、共通要件 CR-NFR-004 の「署名結果を返さず継続しない」条件も BR-AC-006 へ対応付ける。

### BREQ5-003 — `WARN` — 初回接続の許可成立フローがなく、BR-003 と BR-004 の受付境界が一意でない

- 状態: `OPEN`
- 対象: `docs/requirements/browser-extension.md:25-35,98-104,118-119`
- 根拠: BR-003 は署名要求を、現在の許可状態を検証してから確認領域へ渡すと定める。BR-004 は未許可 Origin、Account、Chain または Network からの要求を暗黙の接続や Account 切り替えで許可してはならないと定める。しかし、未許可 Origin が利用者へ接続許可を求める要求を出せるのか、接続許可を誰のどの明示操作で作成・変更・撤回するのか、その要求と署名要求をどう区別するのかが定義されていない。
- 影響: 未許可 Origin の接続要求を確認領域へ表示すると BR-003 の「現在の許可状態の検証前に渡さない」と衝突し、表示しなければ新規 Origin が許可を得る正規経路がない。Account の公開範囲と署名許可の初回付与も、実装・テストごとに異なる可能性がある。
- 必要な修正: 接続要求を Browser Extension の対象能力に含めるか、対象外として未許可要求を拒否するかを明示する。含める場合は、接続許可の作成・Account scope の選択・変更・撤回を拡張機能管理下の利用者明示操作に結び付け、署名要求は有効な許可成立後にだけ確認領域へ渡すことを受け入れ条件へ追加する。これは API や permission schema を固定する提案ではなく、CR-009、CR-NFR-008 の外部責任を Browser Extension の受付フローへ引き継ぐための境界整理である。

### BREQ5-004 — `WARN` — 「検証済み Web Origin」と frame の未決範囲を仕様化前に定義する必要がある

- 状態: `OPEN / BR-OPEN-002 へ引継ぎ`
- 対象: `docs/requirements/browser-extension.md:29-35,59-63,100,119,140-144`
- 根拠: BR-004 と BR-AC-001 は「検証済み Web Origin」を要求するが、検証済みとはブラウザが観測した要求元コンテキストとの binding、canonical Origin との一致、またはサイト運営主体の認証のどれを意味するかを定義していない。BR-OPEN-002 は Origin と frame の受付範囲を未決としているが、frame を許可する場合の permission 単位、表示する Origin、top-level と child frame の関係を未決のまま残している。
- 影響: Web ページが申告した文字列を拒否できても、利用者へ「何が検証済みなのか」を一貫して表示できない。frame の扱いが後続資料ごとに変わると、同じ dApp の接続許可・署名要求・承認対象の binding がずれる。
- 必要な修正: BR-OPEN-002 の決定期限までに、Origin の検証がブラウザコンテキストに基づく要求元の確認であり、サイトの善性・運営主体の認証を意味するのかを区別する。併せて、受け付ける frame 範囲、top-level / child frame の permission・承認単位、表示と失敗時の扱いを決定する。暗号学的な dApp 認証を必須にする必要性は、共通要件 CR-NFR-008 の範囲を越えて新規に要求しない。

## 確認できた整合事項

- BR-001 は Concept Sheet §12 と共通要件 §3 の「Chrome を最初の提供形態とする」方針に追跡できる。追加ブラウザを BR-OPEN-001 に分離しており、対象範囲の拡大を暗黙に確定していない。
- BR-002〜BR-008 は、Signer の確認・承認責任、秘密情報分離、要求元・許可範囲、承認対象との一致、鮮度、replay / duplicate 防止および安全側終了を定める共通要件へ概ね追跡できる。
- BR-009 は共通要件 CR-013 と、初期化済み `_snwc` の公開責任境界（Wallet Store・raw signing・blind signing 防止・Application の表示／承認責任）と整合している。wallet-core の内部形式や Binding 方式を本書で再定義していない。
- BR-013 と BR-AC-007 は、共通要件 CR-NFR-006 および ADR-0001 の Mainnet gate 未達成・判定不能時の fail-closed と整合している。
- 本文は API、schema、Manifest key、Storage key、CSP、暗号方式、内部通信および migration の具体方式を固定しておらず、要件と仕様・設計の責務を分けている。
- Chrome 公式資料の参照先は確認できた。Content Script の isolated world はページと異なる実行環境を提供する一方、content script は敵対的ページや DOM、メッセージ入力から自動的に安全になるものではない。Service Worker は停止・再生成され得る。権限は必要最小限にし、Manifest V3 では remote code を実行しないことが案内されている。これらは BR-006、BR-007、BR-010、BR-011 の補助根拠となるが、MosaicLynx 固有の受け入れ条件の代替ではない。

## 未決定事項・引継ぎ

1. BREQ5-001: BR-010 / BR-011 の受け入れ条件と、Manifest・入力境界・remote code に関する検証証拠を追加する。
2. BREQ5-002: 更新後の互換性確認不能、migration / rollback 失敗、wallet-core 失敗時に署名可能状態を継続しない外部状態を定める。
3. BREQ5-003: 初回接続、Account scope の許可変更、切断・撤回と署名要求の受付を区別する。
4. BREQ5-004 / `BR-OPEN-002`: browser-observed Origin とサイト認証の意味を分け、frame の受付・permission・承認・表示単位を決定する。
5. `BR-OPEN-001`: Chrome 以外の対応範囲と決定時期を、初回 milestone の外部受け入れ範囲へ反映する。

## Not validated

- 本件は要件文書レビューのため、Extension のコード、Manifest、Provider RPC、wallet-core Binding、E2E テスト、Chrome Web Store 配布 build および Mainnet release evidence の実行検証は行っていない。
- ルートの `pnpm format:check` は、既存サブモジュールの大量の既存 format warning と、`_nem/infra/package/3rd-party-licenses/cddl + gplv2 with classpath exception - cddl+gpl.html` の既存 HTML 構文エラーにより完了しなかった。新規レビュー成果物は `pnpm exec prettier --check docs/reviews/requirements/browser-extension-review-001.md` で個別に確認し、成功した。

## 参照資料

- `docs/requirements/browser-extension.md`
- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`（下流仕様との引継ぎ確認のみ）
- `docs/design/architecture.md`（下流設計との責任境界確認のみ）
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/release/mainnet-release-evidence.md`
- `docs/evidence/evidence-policy.json`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `docs/reviews/requirements/requirements-review-001.md`〜`requirements-review-004.md`（レビュー履歴の確認）
- [.agents/skills/requirements-review/SKILL.md](/home/dazzs/projects/MosaicLynx/.agents/skills/requirements-review/SKILL.md)
- [Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)
- [Chrome permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Chrome extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [Chrome Web Store remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
