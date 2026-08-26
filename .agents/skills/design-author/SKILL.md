---
name: design-author
description: MosaicLynx の承認済み要件・仕様・ADRを、責務境界、コンポーネント、依存方向、信頼境界、主要フロー、データ所有、運用前提、検証方針を含む基本設計へ整理する。API・wire format・暗号パラメータ・実装コードは決めない。
---

# Design Author

承認済み要求を実装へつなぐ基本設計を作成または更新する。基本設計は「どの責務を、どの境界で、どの依存方向に配置するか」を定める文書であり、要求、外部仕様、詳細実装を混同しない。作業開始時に次の順で確認する。

1. /home/harvestasya/workspace/mosaiclynx/.agents/project-context.md
2. ../author-common/author-playbook.md
3. 対象機能のコンセプトと要件定義
4. 対象機能の承認済み仕様
5. docs/design/architecture.md と関連する既存設計
6. 適用可能な docs/adr/
7. 必要な公開API、実装、テスト、公式資料
8. output-format.md

## 対象と出力

- ユーザーが対象パス、app、package、機能を指定した場合はその範囲を使う。
- 出力先の指定があればそのパスを使う。指定がなければ docs/design/<topic>.md に新規作成する。
- 既存の設計書は、明示的な更新依頼がない限り上書きしない。候補が複数の場合は自動選択しない。
- 成果物は基本設計書だけとする。要件、仕様、ADR、実装、テスト、レビュー成果物を同時に作成しない。
- 対象が現在のワークスペースにない Mobile などの将来範囲を、実装済みとして記述しない。

## 設計する内容

対象に必要な範囲で、次を設計として整理する。

- 目的、対象、対象外、設計上の前提、用語
- システムコンテキスト、外部主体、trust boundary、秘密情報の境界
- 論理コンポーネント、責務、所有する状態・データ、依存方向
- 主要なデータ・処理フロー、lifecycle、失敗時の責任、安全側の終了
- SDK、Extension、Relay、chain adapter、wallet-core、外部 node の境界
- Symbol / NEM、Mainnet / Testnet、Profile / Account の境界
- 可用性、再起動、再試行、重複、保持期間、運用責任などの設計前提
- セキュリティ不変条件、検証境界、テスト戦略、traceability
- 採用した設計判断、代替案、未決定事項、下流仕様への引継ぎ

図表は責務、依存、信頼境界、主要フローを明確にする場合だけ使用し、図が本文の契約を上書きしないようにする。

## 設計しない内容

上位資料で既に確定していない限り、次を基本設計で新規に固定しない。

- 公開APIのmethod、parameter、response、error code
- JSON / backup / Relay のwire field、schema、version番号、serialization
- 暗号方式、KDF、鍵長、nonce、salt、tag、署名byte列
- Symbol / NEM のtransaction type、network constant、address規則、protocol byte layout
- クラス、関数、package分割、DB schema、具体的なライブラリ、UI layout
- 単体テストケース、fixture、CIの具体的なコマンド

これらが設計の成立条件として必要なら、方式を推測せず、下位仕様または未決定事項として引き渡す。

## 根拠と判断

根拠の優先順位は、ユーザー依頼、承認済み要件、承認済み仕様、適用可能なADR、既存設計、公式資料、実装・テストの順とする。既存コードやSDK APIの存在だけで設計を正当化しない。

資料間の競合、重要な未決定事項、ADRが必要な新しい判断は、対象、影響、追加判断を明記する。根拠なく閉じたり、設計上の都合で要求・仕様を変更したりしない。

秘密情報を設計例、図、ログ、エラー、fixtureへ含めない。Relayはopaque transportとして扱い、意味解析・署名・承認をRelayへ移さない。

## 自己確認

output-format.md の構成で、上流追跡、責務境界、依存方向、trust boundary、主要フロー、失敗時の責任、chain / network差異、下流仕様への引継ぎを確認する。設計書本文が実装コードや将来構想を実装済みと誤認させないことを確認する。

## 作業完了後のGit運用

作業内容の確認と必要な検証を終えたら、今回の変更をコミットし、現在の作業ブランチを `origin` へプッシュする。変更がない場合は新規コミットを作成しない。コミットメッセージには変更の種類を示すプレフィックス（`docs:`、`feat:`、`fix:`、`chore:` など）を付け、概要の後に変更箇所と内容が分かる箇条書きを続ける。既存のユーザー変更はコミット対象に混ぜない。この運用指示は、作成・更新する成果物本文へ転記しない。
