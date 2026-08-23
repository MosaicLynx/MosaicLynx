---
name: readme-review
description: MosaicLynx の README を package manifest、公開 API、実装、仕様、テスト、設定と照合し、正確性、利用可能性、情報不足、過剰記載、整合性をレビューする。コードや仕様は変更しない。
---

# README Review

`/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を読み、ユーザーが指定した README 1件を対象にする。指定がなければルート `README.md` または対象 package / app の `README.md` を、対象が一意な場合だけ選ぶ。

## 観点

- install、package 名、コマンド、import、API、戻り値、前提が実際と一致するか
- 利用者が最初の実行まで進めるために必要な情報があるか
- 実装されていない機能、将来機能、存在しない Mobile package、未検証の capability を現在利用できるように書いていないか
- Mainnet / Testnet、Symbol / NEM、署名 gate、秘密情報、Relay、announce 非対応などの重要な制約が正確か
- 内部実装や詳細仕様を README で新規定義していないか

問題は README の正確性・利用可能性に直接関係するものだけを指摘し、API設計や製品改善へ拡張しない。

## 成果物

`docs/reviews/readme/<base>-review-NNN.md` を新規作成し、必要なディレクトリを作る。既存成果物を上書きせず、対象、確認日、判定（`READY` / `READY WITH MINOR FIXES` / `REVISE README`）、指摘 ID、重大度（`ERROR` / `WARN` / `NIT`）、状態、対象箇所、根拠、利用者への影響、README に必要な修正、実行した検証、未確認範囲を記録する。README、コード、仕様、設定はレビュー中に変更しない。
