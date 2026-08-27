---
name: readme-author
description: MosaicLynx のルート、package、app の README を、実際の package.json、公開 API、コード、既存仕様と一致するように作成・更新する。仕様や将来機能を README で新規決定しない。
---

# README Author

README は利用者が最初に参照する案内であり、実装・公開契約・運用上の制約を正確に伝える文書である。新しい仕様を決める場所ではない。作業開始時に、次の順で必要な資料を確認する。

1. /home/harvestasya/workspace/mosaiclynx/.agents/project-context.md
2. ../author-common/author-playbook.md
3. 対象 README と、その README が説明する app / package
4. 対応する package.json、workspace 設定、tsconfig、公開 export、主要実装
5. 対応するテスト、fixture、build 設定、既存の仕様・ADR
6. 既存のレビュー、ユーザーが指定した修正内容、必要な公式資料

## 対象と出力

- ユーザーが指定した README、app、package、機能の範囲を変更対象とする。
- 出力先の指定がなければ、既存の対象 README を更新する。新規 README の場合も、リポジトリの既存配置規則に従う。
- 既存 README の全面置換は、内容の正確性を保つために必要な場合でも、既存の利用者向け情報と変更意図を確認してから行う。
- 既存 README を別の文書種別、仕様書、設計書、レビュー結果へ変換しない。
- README の記述だけで新しい公開 API、設定、対応チェーン、対応 network、将来機能、セキュリティ保証を決定しない。
- README 以外のコード、package.json、仕様、テストを変更して整合性を作らない。実装と資料が不一致なら、事実を記述し、必要な修正を別作業として明示する。

## README に記載する責務

対象に必要な範囲で、次の利用者向け情報を整理する。

- 何を提供する app / package か、対象利用者と適用範囲
- install、workspace 内での setup、実行に必要な前提
- 最小限の利用例と、主要な公開入口
- 公開 API の実在する名前、引数、戻り値、同期・非同期、失敗時の扱い
- 環境変数、設定、権限、外部サービス、実行環境の前提
- 現在利用できる機能、制約、未対応範囲、運用上の注意
- セキュリティ境界、秘密情報の扱い、利用者が避けるべき操作
- package の license、workspace での位置づけ、必要な関連資料への導線

ルート README では、workspace 全体の構成、主要 app / package、開発コマンド、実装済み範囲を説明する。package / app README では対象自身の利用方法を中心にし、他の README の内容を重複して新たに定義しない。

## 根拠と事実確認

- package 名、import path、公開 export、関数名、引数、戻り値、例外、async 性は manifest、index、型定義、実装で確認する。
- install、build、test、dev コマンドは package.json の scripts とリポジトリの実際の手順を照合する。
- 環境変数、権限、node、browser、network、外部 node、Relay の前提は設定、実装、仕様、テストの組み合わせで確認する。
- 現在の実装、承認済み仕様、将来計画、推測を区別する。実装されていない Mobile、app、package、API を利用可能なものとして書かない。
- 既存 README の主張はそのまま信頼せず、利用者が実行する導線とコードの公開 surface を再確認する。
- 実装やテストが仕様と異なる場合、README で片方を都合よく隠さない。正本と現在の挙動、影響、要確認事項を分けて扱う。
- 公式資料は、外部仕様やコマンドの確認が必要な場合に限って使い、公式資料だけで MosaicLynx の対応範囲を推測しない。

## 重要な境界

- Symbol と NEM の導出、address、transaction、署名、network の違いを一つの一般化した説明にまとめない。
- Mainnet と Testnet を混同しない。Mainnet signing gate、Testnet 限定 capability、announce 非対応など、現在の build capability を明示する。
- Relay が暗号文を中継するだけで内容を解釈・署名・承認しない場合、その trust boundary を README でも維持する。
- Extension、Provider、SDK、wallet-core、chain adapter、外部 node のどこが秘密情報を扱うかを、実装と仕様に基づいて正確に書く。
- 秘密鍵、Mnemonic、Profile password、Vault plaintext、Relay credential、復号した暗号文、実運用の秘密値を例、ログ、スクリーンショット、fixture として記載しない。
- サンプルは実際に公開されている入口だけを使い、存在しない API や略記した pseudo-code を実行可能な例として示さない。

## 作業手順

1. 対象 README と変更目的、利用者、期待する導線を確定する。
2. workspace と対象 package / app の境界を確認し、参照する正本を列挙する。
3. manifest、公開 export、型、実装、scripts、設定、テストから現在の事実を収集する。
4. 既存 README のうち正確な説明、古い説明、根拠のない説明、欠落している制約を分類する。
5. 構成を対象読者の順序に並べる。概要、導入、最小利用、主要 API、設定、制約・安全性、関連資料の順を基本とする。
6. 最小利用例を、実際の package 名、import path、API、引数、必要な前提に合わせて記述する。
7. 対応範囲、未対応範囲、chain / network、秘密情報、失敗時の注意を省略せずに記載する。
8. すべてのコマンド、API、リンク、見出し、コード例を根拠と照合する。
9. 実行した確認と未実行の確認を区別し、README に動作確認済みと書く範囲を限定する。
10. 最終的に、README だけで仕様や設計を拡張していないことを自己確認する。

## 標準構成

対象に応じて不要な章は省くが、次の構成を基準にする。

1. 概要と対象
2. 現在の対応範囲
3. install / setup
4. 最小利用例
5. 主要な API または利用導線
6. 設定、環境変数、権限
7. 制約、エラー時の注意、セキュリティ
8. 開発・検証コマンド
9. license と関連資料

API 一覧を作る場合は、公開 export と一致する項目だけを載せる。引数や戻り値を省略して利用者が誤用しそうな場合は、型や既存仕様に基づく最小限の説明を追加する。例を載せられない場合に、架空の例で空白を埋めない。

## 更新方針

- ルート README は MosaicLynx 全体、開発、主要 app、SDK、セキュリティの利用者向け情報を扱う。
- package / app README は、その package の install、利用方法、公開 API、必要な前提、制約だけを扱う。
- 変更は依頼された対象に限定する。読み手に必要な補足でも別文書の責務を侵食する場合は、既存資料へのリンクとする。
- 仕様変更が必要に見えるときは、README の記載を先に変更して穴埋めせず、仕様・設計・実装側の課題として切り分ける。
- 既存 README のリンクや章を削除する場合は、参照先が不要になった根拠を確認する。

## 確認と完了条件

- package 名、install 方法、import path、公開 API、引数、戻り値、async 性、環境変数、対応環境が実態と一致している。
- README の各重要な主張に、manifest、コード、仕様、テスト、ADR、公式資料のいずれかの根拠がある。
- コード例は syntax、import、API、必要な初期化、エラー処理の前提を確認し、実行していないものを実行済みと表現していない。
- Symbol / NEM、Mainnet / Testnet、Extension / SDK / Relay / wallet-core、現在機能 / 将来機能の境界を誤認させない。
- 秘密情報や、利用者がそのまま実運用へ流用できる credential を含まない。
- README の変更だけで外部契約、仕様、設計、実装、テスト結果を新規に決定していない。
- 可能な範囲で対象 package の typecheck / test、該当サンプル、format check を実行し、コマンドと結果を報告する。未実行の検証は未検証として扱う。

## 作業完了後のGit運用

`../author-common/author-playbook.md` の「Git運用」を適用する。タイトルだけのコミットは禁止し、タイトルの後に空行を置き、`- ` で始まる変更内容の箇条書きを最低1項目含める。コミット後かつプッシュ前に `git show -s --format='%B' HEAD` で本文を確認し、不足があればローカルで修正する。既存のユーザー変更はコミット対象に混ぜず、この運用指示は成果物本文へ転記しない。
