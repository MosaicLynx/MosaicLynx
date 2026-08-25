# MosaicLynx 共通セキュリティ設計再レビュー 002

## レビュー情報

- 対象: [`docs/design/security-design.md`](../../design/security-design.md)
- レビュー日: 2026-08-25
- 再レビュー対象: 前回レビュー `security-design-review-001.md` 後の変更
- 最終判定: `READY WITH CONDITIONS`
- 変更範囲: 本レビュー成果物のみ。対象設計書、要件、仕様、実装は変更していない。

## 総評

前回レビューで指摘した SD-SEC-001〜005 は、対象設計書および Profile / Account 仕様への反映により解消された。

- 署名対象の security-relevant field は全て確認可能でなければならず、表示不能時は拒否する MUST が追加された。
- Wallet Core の error、warning、binding error、Store integrity / verification failure を無視せず fail-closed とする条件が追加された。
- message signing の caller / origin、Account、Chain / Network、purpose、freshness、nonce、domain separation の共通原則が追加された。
- Security Invariant 1 / 8 の外部境界・侵害範囲が本文と一致する表現へ改訂された。
- `while-unlocked` は Profile / Account 仕様から除外され、署名ごとの再認証が正本として固定された。

Trust Boundary、秘密情報の責任分界、署名承認、blind signing 禁止、permission 分離、application-layer replay protection、Relay / Node の非信頼モデル、ログ・保持、backup / export、brute-force、trusted UI、fail-closed、incident recovery、software integrity、および12個の Security Invariants は、共通セキュリティ設計として成立している。

残る条件は、起動時 LOCKED を「原則」ではなく下位設計が逸脱できない MUST として明示すること、Mobile の署名確認・認証画面を含む画面露出リスクを共通原則から下位 policy へ確実に引き継ぐこと、Symbol / NEM の同一秘密鍵利用に関する既存資料間の正本と責任分界を整理することである。いずれも具体 API、暗号 parameter、OS API または実装クラスを本書へ追加する指摘ではない。

## 最終判定

`READY WITH CONDITIONS`

Browser Extension、Relay、SDK および共通の Mobile handoff / approval 境界の下位設計へ進めてよい。ただし、下記条件を満たすまで、Mobile の署名画面や起動直後の状態について下位設計が認証省略・古い状態の復帰・画面露出を許す仕様にならないことを確認できない。

## 確認した資料

- `docs/design/security-design.md`
- `docs/reviews/design/security-design-review-001.md`
- `docs/design/architecture.md`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/requirements/sdk.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`

前回指摘の解消確認には commit `840de754c19201dc3fcd2c4aef862d31267d18f4` を使用した。下流資料との差異だけを理由に共通設計を誤りとは判定せず、共通要求、承認済み責任分界および Wallet Core 境界を中心に確認した。

## 前回指摘の解消状況

| 前回 ID    | 判定 | 根拠                                                                                                                                                    |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD-SEC-001 | 解消 | §8.1 が security-relevant field の全表示、表示不能時拒否、補助情報なしでの重要情報表示を MUST 相当で明記。                                              |
| SD-SEC-002 | 解消 | §15.1 が Wallet Core の error、validation failure、warning、binding error、Store integrity / verification failure を署名拒否へ明示的に接続。            |
| SD-SEC-003 | 解消 | §8.3 が message-level context と request-level replay protection を分離し、caller / origin、purpose、nonce、freshness、domain separation を共通原則化。 |
| SD-SEC-004 | 解消 | Invariant 1 / 8 が untrusted external boundary と外部連携経路・補助サービス・untrusted component を包括。                                               |
| SD-SEC-005 | 解消 | Profile §20 が `every-signature` のみへ変更され、`while-unlocked` を有効な実装条件から除外。                                                            |

## 指摘一覧

| ID            | Severity | 対象                   | 要約                                                                                                                                 |
| ------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| SD-REVIEW-001 | `MEDIUM` | §7.1                   | 起動時 LOCKED が「原則」とされ、Mobile を含む全 Signer の逸脱禁止条件が明示されていない                                              |
| SD-REVIEW-002 | `LOW`    | §13.2、§18             | Mobile の署名確認・認証画面を含む screenshot / recording / preview / notification の露出評価が共通設計から明示的に引き継がれていない |
| SD-REVIEW-003 | `MEDIUM` | §6.1、§19 SEC-OPEN-003 | 同一秘密鍵利用について、既存資料の互換性要求と architecture の除外表現が競合しており、正本・責任主体が曖昧                           |

### SD-REVIEW-001: 起動時 LOCKED の MUST 化

**Severity:** `MEDIUM`

**根拠:** §7.1 は「アプリ / 拡張機能の起動時は原則 LOCKED」と記載し、Browser Extension のブラウザ再起動・拡張機能再ロード時 lock は明記するが、Mobile App を含む全 Signer が起動時に必ず LOCKED であることを MUST としていない。

`docs/specifications/product-spec.md` §6.2 は保存済み Profile がある通常起動で unlock 画面を表示し、`docs/requirements/mobile-app.md` MR-005 / MR-006 は再起動後の自動再開および明示操作なしの認証完了を禁止している。共通設計の「原則」は、platform 固有設計で自動復帰を例外扱いできる余地を残す。

**推奨対応:** 「Browser Extension / Mobile App は起動、再起動、reload、process recreation 後に MUST LOCKED とし、利用者の明示認証なしに UNLOCKED または署名可能状態へ移行してはならない」とする。具体的な lock UI、OS credential、Service Worker / process lifecycle は下位設計へ委譲する。

### SD-REVIEW-002: Mobile の画面露出範囲

**Severity:** `LOW`

**根拠:** §13.2 は Mobile の秘密情報表示画面について screenshot / screen recording 防止を要求し、recent apps preview、通知、履歴、temp UI に private key / mnemonic を残さないことを定めている。これは Secret 保護として適切である。

一方、`docs/requirements/mobile-app.md` MR-011 / MR-AC-012 は秘密情報だけでなく、署名対象、承認画面、最近使ったアプリ一覧、通知表示の露出リスク評価を要求している。署名確認画面は Secret ではない場合でも transaction / message、caller、Account、資産移動情報を含む Sensitive UI であり、§18 の Mobile 委譲表だけではその評価を必須の引継ぎ条件として読み取りにくい。

**推奨対応:** §13.2 または §18 の Mobile 維持条件に「秘密情報入力・表示画面に加え、署名確認 / 認証画面、recent apps preview、通知、画面共有・録画を Sensitive UI として評価し、platform policy と保護限界を明示する」と追加する。OS が防止できない範囲を完全防止と表示しない原則は維持し、具体的な対象画面や API は Mobile 設計へ委譲する。

### SD-REVIEW-003: 同一秘密鍵利用の正本と責任分界

**Severity:** `MEDIUM`

**根拠:** `docs/specifications/profile-account-spec.md` §11、`docs/specifications/product-spec.md` §10.2 / §10.3、`docs/specifications/chain-compatibility-spec.md` §2.3 は、同じ秘密鍵から Symbol / NEM の Identity を導出する互換性要求と、片方のチェーンまたは秘密鍵侵害時に両チェーン Account が影響を受ける共通リスクを記載している。

一方、`docs/design/architecture.md` §13 は「一つの Account の鍵を Symbol / NEM で共用する前提を本設計から除外する」と記載し、security design §19 SEC-OPEN-003 も「旧来の共用前提を採用していない」と表現している。これは共通セキュリティ設計で鍵方式を勝手に変更すべきという意味ではないが、同一リポジトリ内で正反対に読めるため、下位の Profile / Wallet Core / Chain integration 設計が異なる blast radius を前提にする。

**推奨対応:** 同一秘密鍵利用の採否を本書で暗号設計として決めず、承認済みの Account model / Chain Compatibility / Wallet Core 外部契約のどれを正本とするかを ADR または責任分界表で明示する。共通セキュリティ設計は、採用された方式にかかわらず Chain / Network / Account を混同しないこと、Symbol / NEM の処理を暗黙に共通化しないこと、同一鍵を採用する場合の cross-chain blast radius を利用者へ示すことを保持する。

## 17観点の確認結果

| #   | 観点                                     | 評価         | 根拠・判定                                                                                                                                                   |
| --- | ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Trust Boundary                           | 適合         | §3〜§5。Trusted / Limited Trust / Untrusted、Wallet Core / host / OS、外部入力、Relay / SDK 侵害時の非直結が明確。                                           |
| 2   | Key Lifecycle                            | 条件付き適合 | §6。保持主体、平文永続化禁止、Wallet Core 正本、import の trusted UI、短期破棄は適切。同一秘密鍵の Account model は SD-REVIEW-003 の整理が必要。             |
| 3   | Lock / Authentication                    | 条件付き適合 | §7。署名ごとの再認証と Browser の password 再入力は適合。起動時 LOCKED の「原則」を MUST 化する必要がある（SD-REVIEW-001）。                                 |
| 4   | Signing Authorization                    | 適合         | §8.1。security-relevant field 全表示、補助情報なしの重要情報、表示不能時拒否、payload 一致、TOCTOU 防止を確認。                                              |
| 5   | Blind Signing                            | 適合         | §8.2。未知 type、未対応 version、parse / validate 不能、raw payload の安全な解釈不能、警告 bypass を拒否。                                                   |
| 6   | External Request / Permission            | 適合         | §9。Origin / caller、Account 選択、connection と signing の分離、revoke、権限拡張禁止を確認。                                                                |
| 7   | Replay / Concurrent Request              | 適合         | §10。requestId、createdAt / expiresAt、処理済み拒否、結果 correlation、同時要求分離、payload 変更時の再承認、不変原則を確認。                                |
| 8   | Relay Security Model                     | 適合         | §11.1。Relay は untrusted / delivery-only、opaque、TLS、最小保持、署名・承認・秘密情報なし。                                                                 |
| 9   | Network / Node Trust                     | 適合         | §11.2。Node response、payload、fee、metadata 等の外部入力扱い、network mismatch、取得失敗時の fail-closed を確認。                                           |
| 10  | Sensitive Data / Logging / Retention     | 適合         | §12。Secret / Sensitive / Public 分類、ログ禁止、payload 全文ログ禁止、最小保持、revoke / lock / deletion、cryptographic erasure を確認。                    |
| 11  | Backup / Export / Clipboard / Screenshot | 条件付き適合 | §13 は Secret の export / clipboard / QR / screen を適切に扱う。署名確認・認証画面を含む Mobile Sensitive UI の引継ぎを明示する必要がある（SD-REVIEW-002）。 |
| 12  | Brute-force Protection                   | 適合         | §7.3。高速・無制限試行、再起動 reset、自動鍵削除を防ぎ、Wallet Core / OS / 外部 caller の責任を分離。                                                        |
| 13  | Anti-Phishing / Trusted UI               | 適合         | §14。外部 HTML / Markdown / branding / 自己申告表示を信頼せず、MosaicLynx 管理 UI と caller / origin 検証を要求。                                            |
| 14  | Fail-Closed                              | 適合         | §15.1。parse、validation、network、permission、request、認証、Wallet Core の全非成功状態、Relay / Node / API 障害、result unknown を拒否。                   |
| 15  | Software Integrity                       | 適合         | §16。正規配布、改ざん検出、Wallet Core version、supply chain、厳格レビュー、migration、debug / production 分離を確認。                                       |
| 16  | Incident / Recovery                      | 適合         | §15.2。署名可能状態、session、temporary auth、処理中要求を破棄し、再承認なし再開、自動鍵削除、Relay 侵害との不必要な鍵更新連動を禁止。                       |
| 17  | Security Invariants                      | 適合         | §17 の12項目は MUST として本文と整合し、前回の境界表現不足も解消。                                                                                           |

## SEC-OPEN-001〜004 の評価

| OPEN         | 評価                                  | 判定・引継ぎ                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-OPEN-001 | 解決済み                              | Profile §20 が `every-signature` 固定となり、UNLOCKED と signing authentication が分離された。共通設計の署名ごとの再認証と一致する。                                                                                                                                                                                                                                 |
| SEC-OPEN-002 | OPEN 継続が妥当                       | Mobile で生体認証を利用可能とする共通方針と、OS capability、credential 保管、fallback、lifecycle は分離されている。Profile / Product の「将来 capability」は Mobile が未実装であることと整合するため、単純な古い記述とは断定しない。Mobile 設計では生体認証失敗時に認証なしへ落とさず、毎回の user presence / 再認証を維持する。共通設計の下位設計準備を阻害しない。 |
| SEC-OPEN-003 | OPEN 継続。ただし責任境界の整理が必要 | 共通セキュリティ設計で秘密鍵方式を再設計せず、Wallet Core / Account model / Chain Compatibility / Chain integration 側へ委譲する判断は妥当。ただし現在の Profile / Product / Chain Compatibility と Architecture の記述が競合するため、SD-REVIEW-003 の正本整理なしに chain/account 詳細設計を確定してはならない。                                                   |
| SEC-OPEN-004 | 適切に縮小済み                        | 具体 API、wire schema、encoding、serialized message format は下流へ委譲し、common security principle と既存 handoff 契約の整合確認に限定されている。§8.3 と既存 `signData` / structured message 契約により、共通原則の不足も解消。                                                                                                                                   |

## Security Invariants 12項目の確認

| #   | 結果 | 確認                                                                                                           |
| --- | ---- | -------------------------------------------------------------------------------------------------------------- |
| 1   | 適合 | Secret を untrusted external boundary に渡さず、Provider、Content Script、Deep Link、URL、Node、ログ等を例示。 |
| 2   | 適合 | Secret の平文永続保存を禁止。Wallet Core の内部暗号仕様を再設計していない。                                    |
| 3   | 適合 | 外部入力をすべて untrusted とする。                                                                            |
| 4   | 適合 | 解析・検証・表示不能な署名対象を拒否。                                                                         |
| 5   | 適合 | 表示・承認内容と実 payload の一致を要求。                                                                      |
| 6   | 適合 | request / confirmation / authentication / signing の一対一不変条件を保持。                                     |
| 7   | 適合 | 署名ごとの認証と自動署名禁止。Profile §20 と整合。                                                             |
| 8   | 適合 | 外部連携経路・補助サービス・untrusted component の単独侵害では Secret 取得・無確認署名に到達しない。           |
| 9   | 適合 | Secret の log / telemetry / crash report 出力禁止。                                                            |
| 10  | 適合 | 安全性不明、Wallet Core 非成功、Relay / Node / API 障害等を fail-closed。                                      |
| 11  | 適合 | 認証・署名確認 UI を MosaicLynx 自身が制御。                                                                   |
| 12  | 適合 | 異常時に署名可能状態と以前の承認を破棄。                                                                       |

## 下位設計への進行可否

条件付きで進行可能である。

- Browser Extension の Provider / origin / privileged layer、Relay の opaque transport、SDK の handoff、message / transaction inspection は進めてよい。
- Mobile の詳細設計は、起動・再起動・process recreation 後の LOCKED、毎回の user presence / 再認証、署名確認・認証画面の露出 policy と限界を受入条件へ含めること。
- Symbol / NEM の Account / key model と Chain integration の詳細設計は、同一秘密鍵利用に関する正本と cross-chain blast radius を整理してから確定すること。
- SEC-OPEN-002 は具体的 Mobile capability の OPEN として保持できるが、認証省略や自動署名を許可する OPEN ではない。
- SEC-OPEN-004 は具体契約の再設計を意味せず、既存 handoff 契約に対する表示・対応 format の最終確認として扱うこと。

## 未解決事項

- SD-REVIEW-001: 起動時 LOCKED を全 Signer 共通 MUST として明記すること。
- SD-REVIEW-002: Mobile の署名確認・認証画面、preview、通知、録画・画面共有を含む Sensitive UI policy の引継ぎ。
- SD-REVIEW-003 / SEC-OPEN-003: 同一秘密鍵利用の正本、Account model、Wallet Core / Chain integration の責任および cross-chain blast radius の整合。
- SEC-OPEN-002: Mobile 生体認証の capability、fallback、credential 保管、lifecycle。
- aggregate / multisig / cosignature、Profile 全体 backup / restore、Mobile lifecycle、OS protection、release operation の具体詳細。これらを理由に共通 MUST を弱めてはならない。

## Validation

- Prettier / Markdown format check: `pnpm exec prettier --check docs/reviews/design/security-design-review-002.md` は成功。
- `git diff --check`: staged 差分で成功。
- 変更範囲確認: staged diff でレビュー成果物 1 ファイルのみを確認。
- リポジトリ全体 `pnpm format:check`: 失敗。対象ファイルはチェックを通過したが、既存の `_nem` / `_sns` 等に大量の format warning と HTML parse error があり exit 2。今回のレビュー成果物起因ではない。
- リポジトリ全体の lint / typecheck / test / build: レビュー成果物のみのため実行対象外。未実行を成功とは扱わない。

## 変更範囲・コミット・プッシュ

- 作成ファイル: `docs/reviews/design/security-design-review-002.md`
- 対象設計書、concept、requirements、Wallet Core、Browser Extension / Mobile / Relay / SDK 資料、実装コードは変更しない。
- コミット: 日本語の既存履歴形式に合わせる。
- push: `origin/main` へ実施する。
