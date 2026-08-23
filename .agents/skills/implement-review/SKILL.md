---
name: implement-review
description: MosaicLynx の TypeScript 実装、テスト、差分を、仕様適合、security、Symbol / NEM 相互運用性、型安全性、テスト品質の観点でレビューする。コードを修正せず、レビュー成果物を作成する。
---

# Implementation Review

`/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を読み、ユーザーが明示した app / package、ファイル、差分、commit、Pull Request を対象にする。対象が曖昧なら推測で範囲を広げない。

## レビュー観点

- 承認済み仕様、要件、ADRとの適合と外部可視動作の変更
- 入力検証、失敗時の安全性、例外、非同期処理、公開 API、互換性
- 秘密情報のログ・例外・不要なコピーへの漏えい
- 暗号、署名対象、canonical bytes、serialization、数量の精度
- Symbol / NEM、Mainnet / Testnet、SDK version、Relay opaque 境界
- `number` / `bigint`、`Buffer` / `Uint8Array`、ESM、workspace package 境界
- 正常系だけでなく malformed、boundary、wrong network、auth failure、truncated、duplicate、deterministic、secret leakage のテスト

「より良い設計」や未承認の将来機能は指摘として採用しない。既存コードと仕様が競合する場合は、対象仕様・ADR・公式資料・テストの役割を分けて根拠を示す。

## 成果物

`docs/reviews/implementation/<base>-review-NNN.md` を新規作成する。必要なディレクトリを作り、既存成果物を上書きしない。対象、確認日、確認範囲、判定（`READY` / `REVISE IMPLEMENTATION`）、指摘 ID、重大度（`CRITICAL` / `HIGH` / `MEDIUM` / `LOW`）、状態、対象箇所、根拠、影響、必要な修正、未確認範囲、参照資料を記録する。

レビュー中に実装、仕様、テスト、fixture、READMEを変更しない。サブエージェントなしでも観点別自己レビューとして実施し、実行していない検証やレビュー担当を記載しない。
