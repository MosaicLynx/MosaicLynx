---
name: release-readiness-review
description: MosaicLynx の公開対象 npm package を、README、CHANGELOG、package.json、SemVer、依存関係、配布物、検証、release evidence、securityの観点で公開前に確認する。publish、tag、source codeの変更は行わず、レビュー成果物など今回の作業で生じた変更は完了時のGit運用に従う。
---

# Release Readiness Review

公開対象 package が、現在の実装と変更内容を正しく説明し、安全に配布できるかを判定する。公開操作を行わず、レビューを完了するための最小限の読み取り検証を行う。作業開始時に次の順で全文を読む。

1. /home/harvestasya/workspace/mosaiclynx/.agents/project-context.md
2. ../review-common/review-playbook.md
3. reviewers.md
4. review-gates.md
5. output-format.md

## 対象の確定

- ユーザーが package のパス、name、対象差分を指定した場合は、その公開対象だけを確認する。
- 未指定なら staged、unstaged、untracked の変更を package 単位で集約し、変更された packages/\* の package.json を候補にする。package.json自体が未変更でも変更内容がある公開packageは候補とする。
- private: true、apps/\*、test用packageは明示指定がない限り除外する。
- 公開候補が0件なら対象確認が必要として終了し、2件以上なら候補、path、name、versionを示して対象確認で終了する。
- 対象を確定する前にファイル変更、pack、test、build、registry確認を実行しない。

## 確認範囲

対象確定後、次の順で確認する。

1. packageのAGENTS.md、package.json、README、CHANGELOG、workspace設定、公開API、関連仕様・release docs
2. git差分、未追跡、未解決conflict、直近tag
3. README、CHANGELOG、package metadata、exports、dependencies、配布内容、SemVer
4. 変更しない品質検証
5. evidence policy、release process、threat modelが対象に関係する場合の整合

## 確認項目

- name、version、private、license、repository、homepage、bugs、main、module、types、exports、files、sideEffects、engines、publishConfig
- READMEのinstall、利用例、公開API、対応環境、security注意、移行情報、versionとの一致
- CHANGELOGの現在version、日付、変更内容、破壊的変更、非推奨、移行手順
- dependencies、peerDependencies、optionalDependencies、devDependencies、workspace依存の公開時解決性
- pack dry-runでのdist、型、README、CHANGELOG、LICENSE、秘密情報、fixture、不要ファイル
- 公開export、型、データ形式、error契約、既定動作から見たSemVer
- lint、format check、typecheck、test、build、coverage、evidence検証の実行可否と実結果
- Symbol / NEM、Mainnet / Testnet、署名 gate、Relay保証、秘密情報の過剰記載または同梱

## SemVer

公開API、型、データ形式、error契約、既定動作の破壊は major、後方互換の機能追加は minor、bug fix・内部実装・文書・testだけは patchを候補とする。0.x方針、prerelease、tag、CHANGELOGに明示された規則があれば優先する。根拠が曖昧な場合は version を変更せず、候補と未決定理由を記録する。

## 実行と変更境界

review-playbook.md の Phase 0〜3 を適用する。Reviewer A〜D の独立パスで、対象・文書、metadata・依存・配布、SemVer・公開契約、検証・evidenceを確認する。

デフォルトはレビューのみであり、README、CHANGELOG、package.jsonを含めレビュー対象のファイルを変更しない。ユーザーが修正も明示した場合に限り、README、CHANGELOG、package.jsonのversion・公開metadataだけを対象にできる。source、test、設定、fixture、lockfile、tag、remote、registryは変更しない。今回作成したレビュー成果物などの変更は、作業完了後のGit運用に従って扱う。

判定は READY、READY WITH MINOR FIXES、NOT READY、TARGET CONFIRMATION REQUIRED とする。必須文書・metadata・配布物・SemVer・重要検証に公開阻害事項があれば NOT READY、軽微な改善だけなら READY WITH MINOR FIXES、対象不明なら TARGET CONFIRMATION REQUIRED とする。

## 作業完了後のGit運用

`../review-common/review-playbook.md` の「Git運用」を適用する。タイトルだけのコミットは禁止し、タイトルと本文（箇条書きの説明）を日本語で記述する。プレフィックス、ファイルパス、API名、固有名詞、技術用語、コマンド名などは必要な範囲で原表記を使用してよい。タイトルの後に空行を置き、`- ` で始まる変更内容の箇条書きを最低1項目含める。コミット後かつプッシュ前に `git show -s --format='%B' HEAD` で本文を確認し、不足があればローカルで修正する。既存のユーザー変更はコミット対象に混ぜず、この運用指示は成果物本文へ転記しない。
