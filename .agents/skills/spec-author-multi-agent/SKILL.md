---
name: spec-author-multi-agent
description: MosaicLynx の仕様を、上流根拠、中心契約、セキュリティ・相互運用性の複数観点から独立に確認して統合する。仕様の漏れや過剰設計が懸念される場合に使用し、要求・実装は作成しない。
---

# Specification Author Multi-Agent

`spec-author/SKILL.md` と `/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を基盤にする。

## 実行

次の3観点を独立に確認する。サブエージェント機能が利用できる場合は分担してよいが、利用できない場合は現在のエージェントが観点を分離して点検する。実際に行っていない起動、並列実行、返答確認を報告しない。

1. 上流根拠: 要件、プロダクト範囲、ADR、既存仕様との追跡
2. 契約: API、入力・出力、validation、error、状態、serialization、受け入れ条件
3. 安全性・相互運用性: 秘密情報、認証、署名 byte 列、Symbol / NEM、Mainnet / Testnet、Relay opaque 境界

観点間の不一致は元資料へ戻り、解消できなければ仕様で決めず未決定事項へ送る。

## 出力

`spec-author` の `docs/specifications/<topic>.md` と既存更新規則に従う。観点別メモ、実行台帳、レビュー結果、実装コードは成果物に含めない。
