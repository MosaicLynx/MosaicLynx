---
name: readme-review
description: MosaicLynx の README を package manifest、公開 API、実装、仕様、テスト、設定と照合し、正確性、利用可能性、情報不足、過剰記載、重要な制約、整合性をレビューする。コードや仕様は変更しない。
---

# README Review

READMEを利用者向け文書としてレビューし、インストールから最初の利用まで進められ、記載内容を現在の実装が裏付けているかを判定する。作業開始時に次の順で全文を読む。

1. 適用対象の repository instructions（対象から参照可能な `AGENTS.md` など）
2. ../review-common/review-playbook.md
3. reviewers.md
4. review-gates.md
5. output-format.md

## 対象と成果物

- ユーザーがREADMEのパスを指定した場合は、その1件を対象にする。
- package、app、機能が指定されREADMEのパスがない場合は直接対応するREADMEを探す。候補が0件または複数件なら推測で選ばず、対象確認で終了する。
- 未指定の場合はルート README.md または対象 package / app の README.md を、対象が一意な場合だけ選ぶ。
- 成果物は対象 package / app の docs/reviews/readme/<READMEベース名>-review-NNN.md に新規作成し、既存ファイルを上書きしない。正式 ID は RM 接頭辞でベース名ごとに連番にする。

## 確認する事実源

README全体を読んだ後、package.json、workspace設定、公開exports、型定義、主要実装、仕様、license、テスト、サンプル、build設定を必要な範囲で照合する。確認できない環境や未実行サンプルは成功扱いにしない。

READMEの誤りを直接生じさせないAPI設計、製品仕様、実装品質、性能、coverage、将来機能はレビュー対象外とする。

## レビュー観点

- インストール、package名、import、API、引数、戻り値、必要設定、対応環境
- 利用者が最初の実行まで辿れる手順と最小例
- 実装済み機能、未実装・将来機能、capability、Mainnet / Testnet、Symbol / NEMの表現
- Relay、署名 gate、秘密情報、announce非対応など重要な制約の欠落・過剰保証
- package manifest、公開API、仕様、コード、テスト、リンク、licenseとの整合
- 利用者向けの順序、用語、見出し、コード例の読みやすさ

## 実行と判定

review-playbook.md の Phase 0〜3 を適用する。Reviewer A〜C の独立パスで、事実/API、利用開始、制約/過剰記載を確認し、指摘を反証してからゲートを適用する。README、コード、manifest、仕様、設定をレビュー中に変更しない。

判定は READY、READY WITH MINOR FIXES、REVISE README とする。ERROR または WARN があれば REVISE README、NITだけなら READY WITH MINOR FIXES、指摘なしなら READY とする。

## 作業完了後のGit運用

`../review-common/review-playbook.md` の「Git運用」を適用する。
