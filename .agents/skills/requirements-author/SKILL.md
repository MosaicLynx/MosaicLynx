---
name: requirements-author
description: MosaicLynx の要求を、目的、利用者、範囲、機能・非機能・セキュリティ要求、制約、受け入れ条件、未決定事項として整理する。API、データ形式、暗号パラメータ、アーキテクチャ、実装を決めない。
---

# Requirements Author

作業前に `/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` と `docs/specifications/product-spec.md`、対象機能の関連仕様・ADRを確認する。必要な文書だけを読み、リポジトリ全体を一括で読み込まない。

## 出力

- 出力先の指定があればそのパスを使う。
- 指定がなければ `docs/requirements/<topic>.md` を新規作成する。
- 既存の `docs/specifications/`、`docs/architecture/architecture.md` を、要件書と推測して上書きしない。
- 既存ファイルの更新は明示依頼がある場合だけ行う。成果物は要件定義書だけとする。

## 要件化するもの

ユーザー要求と承認済み上流資料から、目的、利用者、対象・対象外、責任境界、前提、制約、外部から観測可能な機能要件、必要な非機能・セキュリティ・相互運用性要求、優先度、受け入れ条件、未決定事項を整理する。

要求と論理的に不可欠な派生要件だけを採用し、各項目に根拠を付ける。MUST / SHOULD / MAY を使う場合は意味を定義し、MUST と重要な SHOULD の受け入れ条件を第三者が判定できる形にする。

## 決めないもの

API パスや型、具体的なフィールド・byte layout、schema、algorithm、KDF、nonce、鍵長、serialization、クラス・関数・package 分割、DB・インフラ、UI layout、テストコードや fixture は、上位資料で既に確定していない限り仕様設計へ引き渡す。

Symbol / NEM、Mainnet / Testnet、Extension / Relay の区別は要求上必要な境界として明示するが、根拠のない対応範囲を追加しない。将来 Mobile は現行実装と混同しない。

## 自己確認

上流要求との追跡、対象範囲、外部可視性、受け入れ条件、未決定事項、セキュリティ要求を確認する。資料間の競合は勝手に解消せず、対象、影響、追加判断が必要な点を記録する。
