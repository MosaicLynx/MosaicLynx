---
name: spec-review
description: MosaicLynx の仕様書を、要求適合、実装可能性、API・データ契約、security、相互運用性、検証可能性の観点でレビューし、実装へ進める品質を判定する。
---

# Specification Review

`/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を読み、ユーザーが指定した仕様書1件を対象にする。指定がなければ `docs/specifications/*.md` を候補にし、0件または複数件なら自動選択しない。既存の仕様書以外をレビュー対象にする場合は、明示されたパスを優先する。

## レビュー観点

- 要求、プロダクト範囲、ADR、既存仕様との追跡と矛盾
- 入力、出力、API、データ形式、validation、error、状態、determinism の不足
- 実装者が推測せずに実装・テストできるか
- 秘密情報、認証、改ざん、リプレイ、署名対象、暗号文境界の安全性
- Symbol / NEM、Mainnet / Testnet、SDK とプロトコルの区別
- 対象外や将来機能の混入、過剰な実装固定

レビュー指摘から新しい機能や仕様を発明しない。未決定事項は、実装前に判断が必要かと影響を記録する。

## 成果物

`docs/reviews/specifications/<base>-review-NNN.md` を新規作成する。必要なディレクトリを作り、既存成果物を上書きしない。対象、確認日、判定（`READY` / `REVISE SPECIFICATION`）、指摘 ID、重大度（`ERROR` / `WARN` / `NIT`）、状態、根拠、影響、必要な修正、未決定事項、参照資料を含める。仕様書、コード、テストは変更しない。サブエージェントなしでも観点別自己レビューとして実施し、実行方法を事実どおり記録する。
