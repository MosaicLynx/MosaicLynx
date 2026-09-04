---
name: readme-author
description: MosaicLynx の root、app、package README を、package manifest、公開 API、実装、仕様、テスト、license と照合して作成・更新する。README で仕様や将来機能を新規に決定しない。
---

# README Author

README は、利用者が MosaicLynx の product、app、package を安全に使い始めるための案内である。
実装・公開契約・現在の制約を正確に伝え、仕様や設計を新規に決定する場所にはしない。

## 作業開始時に読む資料

次の順で、対象に必要な範囲を確認する。

1. `AGENTS.md`
2. `../author-common/author-playbook.md`
3. 対象 README と対象 app / package の `package.json`、`tsconfig.json`
4. 実際の公開 export、TypeScript declaration、`src/`、関連テスト、sample、build script
5. 対応する `docs/specifications/`、`docs/design/`、`docs/requirements/`、適用可能な ADR
6. 必要な license、release docs、公式 protocol / schema / SDK 資料
7. 既存レビューとユーザーが指定した修正内容

`_snwc` の `symbol-nem-wallet-core`、Native C ABI、WASM Binding は外部コンポーネントである。
対象 README がその利用契約を説明する場合だけ、外部 repository の instructions と契約を補助的に確認する。

## 対象と変更境界

- ユーザーが指定した README、app、package、機能の範囲だけを対象にする。
- 指定がなければ既存の root `README.md` を対象とする。新規 README の出力先は対象 app / package の既存配置またはユーザー指定で確定する。
- README 以外のコード、manifest、仕様、設計、テストを変更して整合性を作らない。差異は事実、正本、要確認事項に分けて報告する。
- 現在の実装対象は `apps/*` と `packages/*`。仕様・READMEに記載された将来 Mobile を、実装済み app / package と説明しない。
- 既存 README の全面置換、章削除、リンク削除は、利用者への影響と根拠を確認してから行う。

## README に記載する内容

対象に必要な範囲で、次を利用者向けに整理する。

- product、app、package が提供する機能と対象範囲
- package name、install、import、supported runtime、build / test の実在する手順
- 最小限の実行例と、公開 API の実在する名前、引数、戻り値、失敗時の扱い
- Profile、Account、Wallet Store、Pending Profile、backup、Relay encrypted payload の重要な利用契約
- Symbol / NEM、Mainnet / Testnet、chain / network、transaction / data signing の区別
- 現在利用できる機能、対象外、未実装・将来範囲、外部 wallet-core、node、dApp へ委ねる責任
- Mnemonic、秘密鍵、Profile password、署名 payload、Store を扱う際の security 注意
- 実際に存在する license と、詳細な仕様・設計・API契約・release docs へのリンク

公開 API 一覧を作る場合は、manifest の `exports`、実際の source export、declaration、既存テストで
確認できる項目だけを載せる。`dist/` や生成 bundle は、package script と公開手順で正本か確認する。

## 事実確認

- package 名、version、private / publish 設定、依存関係、scripts、exports は対象 `package.json` と lockfile で確認する。
- 公開 API、戻り値、error、warning、型、runtime 前提は `src/`、declaration、仕様書、テストで確認する。
- Extension の loading、Provider、approval UI、origin、storage の説明は `apps/extension` の実装・仕様・テストで確認する。
- Relay の起動、Redis、opaque encrypted payload、短期保管、reverse proxy の説明は `apps/relay` と Relay docs で確認する。
- SDK、chain adapter、backup / protocol の利用例は対応 package の export、実装、仕様、テストで確認する。
- 外部 wallet-core の鍵管理・署名・Binding 契約は、MosaicLynx が実装しているかのように説明しない。
- build、test、lint、typecheck、evidence のコマンドは実際の script と `AGENTS.md` に従う。存在しない npm / pnpm script を書かない。
- 実装、仕様、README が異なる場合は、承認済み仕様を優先し、現在の実装が未達なら README だけで隠さない。
- 実行していない例や検証を、動作確認済みと表現しない。

## プロジェクト固有の境界

- Symbol と NEM の鍵、公開鍵、address、署名、transaction 処理を一括りにしない。
- Mainnet と Testnet を暗黙に変換しない。Profile の Network と指定 Chain の組合せを仕様どおりに説明する。
- 外部 `symbol-nem-wallet-core` が鍵管理、Mnemonic validation、暗号化、導出、署名、Wallet Store を所有する場合、MosaicLynx の SDK、Extension、Relay または Binding が同じ処理を所有するように書かない。
- `sign` が raw byte 列を解釈しない契約なら、Transaction 構築・表示・announce を提供するように誤解させない。
- Wallet Store、Pending Profile、private key、Mnemonic をアプリケーションが編集・ログ出力する例を載せない。
- 秘密情報、実運用 credential、復号済みデータを、例、ログ、fixture、スクリーンショットへ含めない。

## 作業手順

1. 対象 README、読者、変更目的を確定する。
2. manifest、公開 surface、実装、仕様、scripts、テストから現在の事実を収集する。
3. 既存記載を、正確、古い、根拠なし、欠落に分類する。
4. 概要、対応範囲、導入、最小利用、API、制約・安全性、開発・検証、関連資料の順に整理する。
5. コード例、コマンド、リンク、用語、license を根拠と照合する。
6. 外部可視仕様を README だけで拡張していないことを確認し、README だけを更新する。

## 標準構成

対象に不要な章は省くが、次を基準にする。

1. 概要と対象
2. 現在の対応範囲と対象外
3. 導入・最小利用例
4. 主要 API とデータの扱い
5. 制約とセキュリティ
6. 開発・検証コマンド
7. license と関連資料

## 完了条件

- README の重要な主張が manifest、コード、仕様、設計、テスト、script のいずれかへ追跡できる。
- Extension / SDK / Relay / chain adapter / backup / protocol と外部 wallet-core の境界、現在機能 / 将来機能が明確である。
- Symbol / NEM、Mainnet / Testnet、raw bytes / text、SDK / protocol、announce の責任を誤認させない。
- 秘密情報を含まず、未実行の検証を成功扱いしていない。
- README 以外のファイルを変更していない。

## 作業完了後の Git 運用

`../author-common/author-playbook.md` の「完了と Git」を適用する。
