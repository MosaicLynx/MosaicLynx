---
name: readme-author
description: MosaicLynx のルート、package、app の README を、実際の package.json、公開 API、コード、既存仕様と一致するように作成・更新する。仕様や将来機能を README で新規決定しない。
---

# README Author

作業前に `/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` を読み、対象 README と対応する `package.json`、workspace 設定、公開 export、主要実装、テスト、既存仕様を確認する。

## 方針

- ルート README は MosaicLynx 全体、開発、主要 app、SDK、セキュリティの利用者向け情報を扱う。
- package / app README は、その package の install、利用方法、公開 API、必要な前提、制約だけを扱う。
- コマンド、package 名、API 名、import path、対応環境、実装済み機能は実際の manifest とコードで確認する。
- 現在のワークスペースにない `apps/mobile` や `@mosaiclynx/mobile` を、実装済みの手順として追加しない。将来機能は既存仕様に明記された場合だけ「将来」として区別する。
- Symbol / NEM、Mainnet / Testnet、Mainnet signing gate、Testnet-only capability、Relay が内容を解釈しないことなど、利用者が誤ると危険な境界を省略しない。
- 秘密鍵、Mnemonic、password、credential、復号データ、実運用の秘密値を README やサンプルへ書かない。

## 更新と確認

ユーザーが更新を依頼した対象だけを変更する。公開 API、仕様、アーキテクチャ、将来機能を README から新規決定しない。変更後は、該当するサンプル・コマンドを実行できる範囲で確認し、実行していない例を動作確認済みと記載しない。可能な範囲で `pnpm format:check` と対象 package の typecheck / test を実行する。
