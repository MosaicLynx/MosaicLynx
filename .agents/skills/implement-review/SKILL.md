---
name: implement-review
description: MosaicLynx の TypeScript 実装、テスト、fixture、差分、commit、Pull Request を、仕様適合、security、Symbol / NEM 相互運用性、型安全性、異常系、テスト品質の観点でレビューする。コードは修正しない。
---

# Implementation Review Board

承認済み仕様を実装が正しく満たしているかを判定する。レビューを設計変更やリファクタリングの入口にしない。作業開始時に次の順で全文を読む。

1. /home/harvestasya/workspace/mosaiclynx/.agents/project-context.md
2. ../review-common/review-playbook.md
3. reviewers.md
4. review-gates.md
5. output-format.md

## 対象と成果物

- ユーザーが明示した app、package、ファイル、差分、commit、Pull Request だけを対象にする。
- 対象が曖昧なら推測で範囲を広げず、対象確認で終了する。
- 変更範囲、直接の依存、対応する承認済み仕様・要件・ADR、関連テストを確定する。全リポジトリの無関係な品質評価は行わない。
- 対象ソースのルートに docs/reviews/implementation/ がある場合はそこへ、対象がリポジトリ全体ならルートへ、<ベース名>-review-NNN.md を新規作成する。
- 既存の固定名、連番成果物、implement-spec-feedback.md を移動・削除・上書きしない。正式 ID は IR 接頭辞で対象ベース名ごとに連番にする。

## 根拠の範囲

変更差分、実装、テスト、fixture、承認済み仕様、要件、ADR、chain の公式仕様・schema・SDKを必要な範囲で照合する。既存コードやテストの挙動だけをプロトコル仕様の根拠にしない。

未確認の network、registry、Redis、外部サービス、長時間テストは成功扱いにしない。秘密情報、復号データ、credentialを成果物や出力へ含めない。

## レビュー観点

- 承認済み仕様、要件、ADRへの適合と外部可視動作
- 入力検証、失敗時の安全性、例外、非同期処理、公開 API、互換性
- 秘密情報のログ・例外・不要なコピーへの漏えい
- 暗号、署名対象、canonical bytes、serialization、数量の精度
- Symbol / NEM、Mainnet / Testnet、SDK version、Relay opaque 境界
- number / bigint、Buffer / Uint8Array、hex / raw bytes、ESM、workspace境界
- 正常系、malformed、boundary、wrong chain / network、auth failure、truncated、duplicate、deterministic、secret leakage のテスト

仕様にない機能、公開 API、設定、error、fallback、互換性、将来拡張、一般論だけの追加防御は指摘しない。

## 実行と検証

review-playbook.md の Phase 0〜3 を適用する。Reviewer A〜D を独立した観点で確認し、各候補を反証してからゲートを適用する。サブエージェントを使った場合だけ識別子と完了状態を監査情報へ記録し、使わない場合は自己レビューの4パスを記録する。

必要な非破壊検証は、対象 package の scripts と AGENTS.md を確認して実行する。少なくとも、該当する対象 package の typecheck、test、lint、format check、build を候補とし、Redis integration、coverage、外部接続は実行した場合だけ記録する。

## 判定

判定は READY または REVISE IMPLEMENTATION とする。CRITICAL が品質ゲートを不合格にする場合だけ後者とし、HIGH / MEDIUM / LOW は具体的な影響と修正優先度を記録する。仕様が曖昧な場合は、コード欠陥と仕様未決定を分離する。

レビュー中に実装、仕様、テスト、fixture、README、設定を変更しない。

## 作業完了後のGit運用

`../review-common/review-playbook.md` の「Git運用」を適用する。
