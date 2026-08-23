---
name: requirements-review
description: MosaicLynx の要件定義を、根拠、範囲、外部可視性、検証可能性、セキュリティ、未決定事項の観点でレビューし、仕様化へ進める品質を判定する。
---

# Requirements Review

`/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を読み、ユーザーが指定した要件定義書1件を対象にする。指定がなければ `docs/requirements/*.md` を候補にし、0件または複数件なら自動選択しない。

## レビュー観点

- 各要求が上流の目的・課題・仕様に追跡できるか
- 対象、対象外、外部責任、前提、制約が明確か
- MUST / SHOULD の外部から観測可能な受け入れ条件があるか
- Symbol / NEM、Mainnet / Testnet、Extension / Relay の境界が混ざっていないか
- 必要な秘密情報・認証・完全性・相互運用性要求が抜けていないか
- API、schema、暗号方式、アーキテクチャなどを根拠なく固定していないか

レビュー指摘だけを根拠に新しい要件を発明しない。未決定事項は不備と断定せず、仕様設計前に判断が必要かどうかを記録する。

## 成果物

`docs/reviews/requirements/<base>-review-NNN.md` を新規作成し、必要なディレクトリを作成する。既存の成果物を上書きしない。対象、確認日、判定（`READY` / `REVISE REQUIREMENTS`）、指摘 ID、重大度（`ERROR` / `WARN` / `NIT`）、状態、根拠、影響、必要な修正、未決定事項、参照資料を含める。コード、仕様書、要件本文は変更しない。サブエージェントなしでも観点別自己レビューとして実施し、実行方法を事実どおり記録する。
