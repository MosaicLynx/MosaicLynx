# MosaicLynx SDK 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/sdk.md`
- 確認日: 2026-08-25
- 判定: `READY`
- 対象範囲: SDK 固有要求 `SDK-FR-*`、`SDK-SEC-*`、`SDK-PRIV-*`、`SDK-PLAT-*`、`SDK-COMP-*`、`SDK-ERR-*`、`SDK-NFR-*`、受け入れ条件、未決事項、共通要件および Web 受け渡し仕様との整合性
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、ブラウザ拡張機能 / モバイル / Relay 要件、アーキテクチャ、プロダクト仕様、チェーン互換性仕様、Web トランザクション受け渡し仕様、wallet-core の参照資料を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または要求からの引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行の SDK 要件は仕様化へ進められる状態である。SDK を Signer と区別し、秘密情報、承認 UI、wallet-core、Relay サーバー、アナウンスを SDK の責任外に置いている。接続許可と署名承認、ブラウザの実オリジンとモバイル / Relay の受け渡しセッション、要求・承認・結果、Symbol / NEM、Mainnet / Testnet の境界も明示されている。

`SDK-FR-007` と `SDK-AC-004` はメッセージ署名を SDK v1 の必須操作として確定し、既存の Web 受け渡し仕様 §2 および `signData` 契約と整合している。`SDK-AC-003`、`SDK-AC-005`〜`SDK-AC-008` は呼び出し元 / オリジン、正常な通信経路間の結果、失敗分類および自動再試行 / 代替経路禁止を外部から確認できる形で追跡している。

前回レビュー `sdk-review-001` の指摘は、次のとおり現行版で解消または適切に反映されている。

- メッセージ署名の v1 必須範囲を確定し、未決事項 `SDK-OPEN-001` を除去している。
- ブラウザの実オリジン / ブラウザ文脈とモバイル / Relay の受け渡しセッション / 呼び出し元の最終検証主体を分離し、検証不能時の安全側結果を定めている。
- 成功と九つの失敗分類を外部アプリケーションが区別できること、および拒否・検証失敗・結果不明の自動再試行 / 代替経路禁止を受け入れ条件へ反映している。
- トランザクション署名とメッセージ署名の正常系について、要求、操作、Signer、アカウント、チェーン / ネットワーク、対応付けおよび Signer の確認・承認対象との対応を通信経路間ので検証する受け入れ条件を追加している。

## 指摘事項

重大度 `ERROR` / `WARN` に該当する未解決指摘はない。`NIT` も、仕様化を妨げる曖昧さとしては確認されなかった。

| 指摘 ID | 重大度 | 状態     | 内容                                                                                               |
| ------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| なし    | —      | 終了済み | 現行文書の要求、根拠、責務境界、受け入れ条件および未決事項に、仕様化を停止させる未解決事項はない。 |

## 未決事項・下流引継ぎ

`SDK-OPEN-002`〜`SDK-OPEN-007` は未解決の不備ではなく、要件から仕様・設計へ引き継ぐ判断事項として妥当である。特に次を仕様化前に確定する必要がある。

- アグリゲート / マルチシグ / 連署署名の SDK 公開範囲。
- 通信経路の選択順、明示的代替経路および利用不能 / 接続失敗 / タイムアウトの扱い。
- トランザクション組み立て補助処理の責務。
- 正式対応実行環境、配布形態、バージョン管理、後方互換性および非推奨化ポリシー。
- プラットフォーム固有の呼び出し元 / オリジンとの結び付けと、SDK が外部へ表明できる保証範囲。

これらは、対応しない操作を対応能力上利用不能とし、別操作への利用者に知らせない格下げや安全境界の迂回を許さないという現行要件の制約下で決定する必要がある。

## 確認できた整合事項

- `docs/requirements/requirements.md` の `CR-007` / `CR-007-MSG` と、Web 受け渡し仕様 §2 のトランザクション / メッセージ署名の v1 範囲が整合している。
- `SDK-FR-005`、`SDK-SEC-004`、`SDK-PLAT-002`〜`003` および `SDK-AC-003` が、ブラウザとモバイル / Relay の呼び出し元検証主体を適切に分離している。
- `SDK-FR-008`、`SDK-FR-009`、`SDK-NFR-003`、`SDK-AC-005`〜`006` が、正常結果を含む通信経路間の対応確認を要求している。
- `SDK-FR-011`、`SDK-ERR-001`、`SDK-AC-007`〜`008` が、成功、拒否、未接続・許可不足、入力不正、未対応、検証失敗、結果不明を含む失敗境界を追跡している。
- `SDK-SEC-001`、`SDK-SEC-007`〜`008`、`SDK-PRIV-001`〜`003` および `SDK-AC-009` が、秘密情報・認証情報・ペイロード・診断情報の境界を明示している。
- `SDK-FR-012`、`SDK-NFR-002`、`SDK-AC-010`〜`012` が、Symbol / NEM、Mainnet / Testnet、固定互換性、不正な形式の入力および秘密情報漏えいの検証可能性を維持している。
- モバイルアプリが現在のワークスペースに実装済みであると誤認させず、提供開始後の検証結果だけを受け入れる記述になっている。

## 検証

- `pnpm exec prettier --check docs/requirements/sdk.md docs/reviews/requirements/sdk-review-002.md`: 成果物作成後に実行する。
- `git diff --check`: 成果物作成後に実行する。

## 未検証

- 本レビューは要件・仕様・責務境界の文書レビューであり、SDK、Provider、Relay、モバイルアプリの実装変更や実装テストは行っていない。
- モバイルアプリは現在のワークスペースに実装されていないため、モバイル / Relay の実機連携、App Link、オリジン証明、モバイル E2E は検証していない。
- Relay の Redis 統合、Mainnet リリース証跡の生成・署名・検証、外部公式資料との追加照合は実行していない。

## 参照資料

- `docs/requirements/sdk.md`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/design/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- `docs/reviews/requirements/sdk-review-001.md`
