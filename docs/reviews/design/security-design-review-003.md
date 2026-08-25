# MosaicLynx 共通セキュリティ設計再レビュー 003

## レビュー情報

- 対象: [`docs/design/security-design.md`](../../design/security-design.md)
- レビュー日: 2026-08-25
- 再レビュー対象: `security-design-review-002.md` 後の変更
- 参照した変更: `f50c934 docs: 共通セキュリティ設計再レビュー指摘を反映しました`
- 最終判定: `READY`
- 変更範囲: 本レビュー成果物のみ。対象設計書、要件、仕様、実装は変更していない。

## 総評

前回の指摘 SD-REVIEW-001〜003 は、起動時状態、Mobile の Sensitive UI、Symbol / NEM の Account / Key Identity 責任分界として反映され、解消された。

共通設計は、Browser Extension / Mobile App を trusted host、Wallet Core を秘密情報処理の正本、OS Secure Storage を限定的信頼、SDK / dApp / Web / Deep Link / Relay / Node / 外部 API を untrusted とする境界を明確にしている。外部入力の検証、署名前の semantic inspection、trusted UI による表示と実 payload の一致、署名ごとの再認証、request 単位の replay / concurrent isolation、Relay の配送専任、Node の非信頼、fail-closed が相互に整合している。

今回追加された起動・再起動・reload・process recreation 後の `LOCKED` MUST により、認証済み状態の自動復帰を下位設計が許す余地も解消された。Mobile の署名確認・認証画面を含む Sensitive UI についても、画面共有、録画、recent apps、通知などの露出経路を評価し、OS の限界を誤認させない条件が下位設計へ引き継がれている。

Symbol / NEM の鍵については、共通セキュリティ設計が暗号方式を再実装せず、Chain ごとの Account / Key Identity と対象 Chain を明示した導出契約を要求し、具体的な導出仕様を Wallet Core / Chain integration へ委譲している。関連する Architecture、Profile / Account、Product、Chain Compatibility の記述も同じ責任分界へ整合している。

SEC-OPEN-002 と SEC-OPEN-004 は、Mobile の具体的な生体認証 capability と、message handoff の具体契約を下位資料へ委譲する OPEN として妥当である。いずれも、署名ごとの再認証、user presence、message の表示・検証不能時拒否という共通 MUST を弱めるものではない。

## 最終判定

`READY`

Browser Extension、Mobile、Relay、SDK および Chain integration の下位設計へ進めてよい。下位設計では、本書の MUST を受入条件として維持し、SEC-OPEN-002 / 004 の具体化時にも認証省略、自動署名、blind signing、表示と payload の不一致を導入してはならない。

## 前回指摘の解消状況

| ID            | Severity | 判定 | 根拠                                                                                                                                                                                                                |
| ------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD-REVIEW-001 | MEDIUM   | 解消 | §7.1 が起動、再起動、reload、process recreation、extension reload、browser restart 後の `LOCKED` を全 Signer の MUST とし、明示認証なしの復帰を禁止している。                                                       |
| SD-REVIEW-002 | LOW      | 解消 | §13.2 と §18 が秘密情報画面だけでなく、認証・署名確認・transaction / message 承認画面を Sensitive UI とし、screenshot、recording、sharing、preview、notification 等の露出経路評価を Mobile 下位設計へ要求している。 |
| SD-REVIEW-003 | MEDIUM   | 解消 | §6.1 と §19 が Symbol / NEM を別 Key Identity とし、対象 Chain の導出契約を要求。Architecture、Product、Profile / Account、Chain Compatibility も同じ責任分界へ整合している。                                       |

## 17観点の確認結果

| #   | 観点                                     | 評価 | 根拠・判定                                                                                                                                                                                                                                                 |
| --- | ---------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Trust Boundary                           | 適合 | §3〜§5。Trusted / Limited Trust / Untrusted、Wallet Core / host / OS の境界、外部入力原則、Relay / SDK 侵害時の秘密鍵取得・無確認署名の非直結が明確。                                                                                                      |
| 2   | Key Lifecycle                            | 適合 | §6。秘密鍵・mnemonic の保持主体、host 保管領域と Wallet Core の責任、外部への Secret 非提供、平文永続化禁止、Wallet Core 暗号仕様の再実装禁止、生成・import、短期破棄を確認。Chain 固有の導出詳細も下位責任へ適切に委譲されている。                        |
| 3   | Lock / Authentication                    | 適合 | §7。全 Signer の起動時 `LOCKED` MUST、明示認証、lock 時破棄、Browser Extension のパスコード必須・署名ごとの再入力、Mobile の PIN / パスコード / 生体認証の責任分界、外部要求からの認証省略禁止、自動署名禁止を確認。                                       |
| 4   | Signing Authorization                    | 適合 | §8.1。Signer 自身が署名対象から表示を生成し、security-relevant field の表示不能時拒否、payload 一致、Network / type / recipient / amount / mosaic / fee / deadline / message / aggregate / metadata 等の確認、payload 変更時の再承認を要求。               |
| 5   | Blind Signing                            | 適合 | §8.2。Blind Signing、未知 type、未対応 version、parse / validate 不能、解釈不能 raw payload、通常モードの警告 bypass を拒否。                                                                                                                              |
| 6   | External Request / Permission            | 適合 | §9。Browser Extension の origin 単位、Mobile の caller 識別、Account 選択、connection と signing authorization の分離、revoke、外部からの privilege escalation 防止を確認。                                                                                |
| 7   | Replay / Concurrent Request              | 適合 | §10。`requestId`、`createdAt` / `expiresAt`、処理済み要求の拒否、request / response correlation、同時要求分離、payload 差し替え時の再承認、指定された一対一不変条件を確認。                                                                                |
| 8   | Relay Security Model                     | 適合 | §11.1。Relay は非信頼・配送専任で、秘密鍵・署名権限・承認・意味解釈を持たず、改ざん・遅延・重複・取り違えは Signer 側で検出または拒否する。TLS と最小保持も明記。                                                                                          |
| 9   | Network / Node Trust                     | 適合 | §11.2。Node response、payload、fee、metadata、namespace、mosaic 等を外部入力または補助情報として扱い、network mismatch、検証不能、悪意ある Node に対して安全側に拒否する。                                                                                 |
| 10  | Sensitive Data / Logging / Retention     | 適合 | §12。Secret / Sensitive / Public の分類、Secret の log / telemetry / crash report 禁止、transaction payload 全文ログ原則禁止、最小保持、cache / temp / backup / log からの残存防止、cryptographic erasure、account / session / permission の無効化を確認。 |
| 11  | Backup / Export / Clipboard / Screenshot | 適合 | §13。明示操作・再認証・trusted UI、外部要求からの export 禁止、平文 export 非デフォルト、Wallet Core 形式優先、Secret clipboard 原則禁止、Mobile Sensitive UI の露出評価、Browser Extension の screenshot 非保証、QR の Secret 扱いを確認。                |
| 12  | Brute-force Protection                   | 適合 | §7.3。高速・無制限試行、再起動による容易な reset、自動鍵削除を防ぎ、Wallet Core / Mobile OS / 外部 caller の責任を分離。                                                                                                                                   |
| 13  | Anti-Phishing / Trusted UI               | 適合 | §14。パスコード・署名確認 UI を MosaicLynx 管理下に置き、外部 HTML / Markdown / 任意 UI / app 名 / icon / 説明文を信頼根拠にしない。caller / origin は自身で検証・表示する。                                                                               |
| 14  | Fail-Closed                              | 適合 | §15.1。parse、validation、network、permission、request 整合性、認証、Wallet Core の error / warning / binding error / Store integrity failure、Relay / Node / API 障害を署名拒否へ接続。復旧後の承認流用も禁止。                                           |
| 15  | Software Integrity                       | 適合 | §16。正規配布、改ざん検出、Wallet Core version、dependency / supply chain、厳格な security review、migration の秘密情報保護、debug / production 分離を確認。詳細 CI / SBOM は適切に委譲。                                                                  |
| 16  | Incident / Recovery                      | 適合 | §15.2。署名可能状態、session、temporary authentication、処理中 request、旧承認を破棄し、再承認なし再開を禁止。秘密鍵自動削除を禁止し、漏洩疑い時の Account 移行・鍵更新へ誘導し、Relay 侵害と鍵更新を不必要に直結させない。                                |
| 17  | Security Invariants                      | 適合 | §17 の12項目が MUST として明記され、本文の trust boundary、署名ごとの再認証、fail-closed、incident recovery と矛盾しない。                                                                                                                                 |

## SEC-OPEN-001〜004 の評価

| OPEN         | 判定            | 評価                                                                                                                                                                                                                                                                                                                                     |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-OPEN-001 | 解決済み        | Profile / Account 仕様 §20 が `every-signature` に固定され、`while-unlocked` を署名時認証の有効条件から除外している。共通設計の署名ごとの再認証と一致する。                                                                                                                                                                              |
| SEC-OPEN-002 | OPEN 継続が妥当 | Mobile で生体認証を利用可能とする共通方針と、具体的な capability、credential 保管、fallback、lifecycle は分離されている。Mobile 未実装・下流仕様の将来 capability 記述は、共通 MUST と矛盾しない未決事項である。生体認証失敗時に認証なしへ落とさず、毎回の user presence / 再認証を維持する条件は確定している。                          |
| SEC-OPEN-003 | 解決済み        | 共通設計は Symbol / NEM の Account / Key Identity を分離し、対象 Chain を明示した導出契約を Wallet Core / Chain integration へ委譲している。関連する Architecture、Product、Profile / Account、Chain Compatibility も同じ方針であり、共通セキュリティ設計に残すべき OPEN ではない。                                                      |
| SEC-OPEN-004 | OPEN 継続が妥当 | §8.3 が caller / origin、Account、Chain / Network、purpose、message contents、freshness、nonce、domain separation と message-level / request-level replay の分離を原則化している。具体 API、wire schema、encoding、nonce format、serialized message format は protocol / SDK / platform 下位設計へ委譲すべきで、共通設計の不足ではない。 |

## Security Invariants 12項目の確認

| #   | 結果 | 確認                                                                                                                                                                    |
| --- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 適合 | Secret を SDK、dApp / Web、Provider、Content Script、Deep Link、Relay、Node、外部 API、URL、log / telemetry / diagnostics 等の untrusted external boundary に渡さない。 |
| 2   | 適合 | Secret の平文永続保存を禁止し、Wallet Core の暗号仕様を再実装しない。                                                                                                   |
| 3   | 適合 | 外部入力をすべて untrusted input として扱う。                                                                                                                           |
| 4   | 適合 | 解析・検証・表示できない署名対象を拒否する。                                                                                                                            |
| 5   | 適合 | 利用者が確認した内容と実際の署名 payload を一致させる。                                                                                                                 |
| 6   | 適合 | request、confirmation、authentication、signing を一対一に分離する。                                                                                                     |
| 7   | 適合 | 署名ごとの利用者認証を必須とし、自動署名を許可しない。                                                                                                                  |
| 8   | 適合 | 外部連携経路・補助サービス・untrusted component の単独侵害で Secret 取得または無確認署名に到達しない。                                                                  |
| 9   | 適合 | Secret を log / telemetry / crash report に出力しない。                                                                                                                 |
| 10  | 適合 | 安全性を確認できない場合は fail-closed とする。                                                                                                                         |
| 11  | 適合 | 認証・署名確認 UI を MosaicLynx 自身が制御する。                                                                                                                        |
| 12  | 適合 | セキュリティ異常時に署名可能状態を解除し、以前の承認状態を再利用しない。                                                                                                |

## 指摘一覧

今回の再レビューで、`BLOCKER`、`HIGH`、`MEDIUM`、`LOW`、`NIT` に該当する新規指摘はない。

## 未解決事項と下位設計への引継ぎ

- SEC-OPEN-002: Mobile の生体認証 capability、fallback、credential 保管、lifecycle。認証省略や自動署名を許す OPEN ではない。
- SEC-OPEN-004: message signing の具体 API、wire schema、encoding、nonce format、serialized message format と、既存 handoff 契約に対する platform 受入条件の最終整合。
- aggregate / multisig / cosignature、Profile 全体 backup / restore、Mobile lifecycle、OS protection、release operation の具体詳細。これらは共通 MUST を弱めない範囲で下位設計へ委譲する。

## 参照資料

- `docs/design/security-design.md`
- `docs/design/architecture.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/requirements/sdk.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `docs/reviews/design/security-design-review-001.md`
- `docs/reviews/design/security-design-review-002.md`

## Validation

- Prettier / Markdown format check: `pnpm exec prettier --check docs/reviews/design/security-design-review-003.md` を実行し、成功。
- `git diff --check`: 成功。
- 変更範囲: レビュー成果物 1 ファイルのみを確認。
- リポジトリ全体 `pnpm format:check`: 既存の `_nem` / `_sns` 等に起因する format warning と HTML parse error があるため失敗。レビュー成果物単体は成功し、今回の変更起因ではない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行対象外。未実行を成功とは扱わない。

## コミット・プッシュ

- 日本語の既存履歴形式に合わせてコミットする。
- `origin/main` への push を実施する。
