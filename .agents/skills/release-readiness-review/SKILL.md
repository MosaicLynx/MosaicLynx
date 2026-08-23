---
name: release-readiness-review
description: MosaicLynx の公開対象 npm package を公開前に確認し、README、CHANGELOG、package.json、SemVer、依存関係、パッケージ内容、検証、release evidence の不足を判定する。publish、commit、tag、ソースコード変更は行わない。
---

# Release Readiness Review

作業前に `/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` と対象 package の `package.json`、README、CHANGELOG、公開 export、workspace 設定、関連する release docs を確認する。対象 package が未指定なら、公開 package と private package を推測で混同しない。現在、ルートと多くの workspace package は `private: true` であり、`packages/sdk` は公開対象の候補である。

## 確認項目

- package 名、version、`private`、`main`、`types`、`exports`、files / ignore の整合
- SemVer、CHANGELOG、README の利用方法と公開 API の一致
- workspace 依存、実行時依存、不要な依存、固定版 SDK の扱い
- `pnpm pack --dry-run` などで確認できる package 内容、dist、型定義、README、license
- format、lint、typecheck、test、build と対象固有の evidence / integration 検証
- Symbol / NEM、Mainnet / Testnet、署名 gate、秘密情報、Relay の保証範囲が過剰に記載されていないか

必要なら README、CHANGELOG、package.json の公開メタデータだけを修正して再確認できるが、ユーザーが修正を求めていないレビューでは変更しない。ソースコード、依存 version の無断変更、実際の publish、commit、tag、registry への書き込みは行わない。

## 成果物

`docs/reviews/release/<package>-review-NNN.md` を新規作成し、必要なディレクトリを作る。既存成果物を上書きせず、対象、確認日、判定（`READY` / `READY WITH MINOR FIXES` / `NOT READY`）、指摘 ID、重大度、状態、根拠、影響、必要な metadata / docs 修正、実行した検証、未確認範囲を記録する。publish していない場合は、publish 済みと誤解される表現を使わない。
