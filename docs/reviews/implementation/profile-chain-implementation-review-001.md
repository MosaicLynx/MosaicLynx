# 実装レビュー: プロファイルチェーン単一化

## レビュー対象

- 対象: `2bdaba9`、`3b2f32e`、`59ac1af` とその変更範囲（`packages/core`、`packages/profile-backup`、`apps/extension`）
- 確認日: 2026-09-20
- 範囲: プロファイル / アカウントの単一チェーン境界、Vault 保存・読込、バックアップ検証、Provider / 承認 / UI のチェーン結び付け、関連テスト
- 対象外: `_snwc`、モバイルの未実装コード、Relay / SDK の無変更領域、外部ノード / ブラウザ実実行環境
- 成果物: 本レビュー

## 実行記録

サブエージェントは使用せず、レビュー Board レビュー統括が次の4パスを独立して実施した。

- レビュアー A（仕様適合性）: Profile.chain、Account.chain / 識別情報、許可、旧ストアの扱いを要件 / 仕様 / 設計と照合
- レビュアー B（セキュリティ）: プロファイル内の認可、Vault / 秘密情報パス、保存領域検証、Provider / 承認境界を確認
- レビュアー C（相互運用性）: Symbol / NEM、Mainnet / Testnet、チェーン固有の識別情報、既存チェーンアダプター / バックアップ契約を確認
- レビュアー D（品質・テスト）: TypeScript、保存状態、不正な形式の / 誤ったチェーン、関連単体テストと検証スクリプトを確認

## 参照した根拠

- `docs/requirements/requirements.md` `CR-017`、`CR-AC-020`
- `docs/specifications/profile-account-spec.md` §3、§4、§11、§12、§26
- `docs/specifications/browser-extension.md` §10、§24、§25
- `docs/design/architecture.md` §3、§6.6、§6.8
- `docs/design/interfaces.md` §6、§8
- `docs/design/security-design.md` §6、§9、§16
- `packages/core/src/domain.ts`、`packages/core/src/use-cases.ts`、`packages/core/src/ports.ts`
- `packages/profile-backup/src/index.ts`
- `apps/extension/src/vault.ts`、`apps/extension/src/background/`、`apps/extension/src/approval/`、`apps/extension/src/popup/`
- 関連単体テストとパッケージマニフェスト / TypeScript 設定

## レビュー結果

`REVISE IMPLEMENTATION`

## 要約

プロファイル / アカウント、Vault、Provider、承認、UI の通常経路は `Profile.chain` と単一 `Account.identity` に移行され、同一プロファイル内のチェーン切替および旧混在したストアの自動移行も除去されている。一方、コアの `PermissionService.grant` がプロファイルの固定チェーン / ネットワークを検証せず権限を保存できるため、コアの公開ドメインサービス単体では許可不変条件が成立しない。

## 指摘の状態

| ID     | 重要度 | 状態        | 初出レビュー | 状態根拠                                                                             |
| ------ | ------ | ----------- | ------------ | ------------------------------------------------------------------------------------ |
| IR-001 | HIGH   | 新規 / 未決 | 2026-09-20   | `PermissionService.grant` がプロファイルを参照せず任意の対象範囲を保存する実装を確認 |

## 必須の修正

### IR-001: コア PermissionService がプロファイルの固定チェーン / ネットワークを検証しない

- 対象: `packages/core/src/use-cases.ts:139-166`
- 発生条件 / 事実: `PermissionService.grant(origin, profileId, scope, accountIds)` は `profileId` に対応するプロファイルを取得せず、プロファイルが Symbol でも NEM 対象範囲、または異なるネットワーク対象範囲の `PermissionGrant` を保存できる。
- 根拠: `CR-017`、`CR-AC-020`、`docs/specifications/profile-account-spec.md` §3、§11、`docs/design/interfaces.md` §6 / §8 はアカウント / 許可 / 認可をプロファイルの固定チェーン / ネットワークと一致させることを要求する。
- 問題: コアの公開許可サービスが単一チェーン不変条件を保証しない。現在の拡張機能直接経路は `assertEnabledScope` と filter で防いでいるが、同じコアサービスまたはリポジトリを利用する Signer が許可付与を信頼すると、異なるチェーンの認可状態が同一プロファイルに関連付く。
- 影響: プロファイル内の許可の完全性 / 認可境界が破れ、下流の誤ったアカウント / 対象範囲結び付けを誘発する。現在の実装で直ちに署名が成立することまでは確認していないため、影響は許可状態の不正保存から下流に波及する範囲に限定して評価した。
- 重要度根拠: 現実的なコアサービス呼出しでプロファイル内の認可状態をチェーン間のに汚染でき、単一チェーンのセキュリティ上の不変条件に直接影響するため `HIGH` とする。
- 必要な最小修正: `PermissionService` がプロファイルリポジトリを参照し、プロファイル未存在、scope.network 不一致、scope.chain 不一致を保存前に拒否する。拒否時に許可リポジトリを変更しないこと。
- 完了条件 / 再確認: 不一致チェーン、不一致ネットワーク、欠落プロファイルの各テストが保存されないことを確認し、既存の有効な許可付与と拡張機能テストが成功することを再実行する。

## 任意の改善

なし。

## 解消済みの指摘

なし。

## 上流工程へのフィードバック

なし。単一チェーンの要求・設計・仕様は実装判定に必要な範囲で確定している。

## 後続工程へ委譲する指摘

- ブラウザ実実行環境の UI 操作、サービスワーカー再起動、拡張機能再読み込み後の保存領域実挙動はローカル単体テストの対象外であり、別途 E2E / リリース準備状態で確認する。
- `_snwc` のネイティブ / WASM バインディングは変更対象外のため、バインディング内部の実装レビューは行っていない。

## 対象範囲と追跡可能性

`CR-017` / `CR-AC-020` → プロファイル / アカウント仕様 §3 / §11 → アーキテクチャ §6.6 / インターフェース §6 / セキュリティ設計 §6・§16 → コアドメイン / 拡張機能 Vault / Provider / 承認の変更を追跡した。コアのプロファイル / アカウント検証、拡張機能のプロファイル対象範囲 filter、単一の識別情報投影、バックアップ平文検証は確認済みである。IR-001 はそのうちコア許可サービスのプロファイル結び付け欠落に限定する。

## ドメイン別の確認

- 仕様適合性: プロファイル / アカウントの単一チェーン、プロファイル固定チェーン、旧混在したストア非互換、UI 表示および Provider 投影を確認。IR-001 は許可サービスの例外。
- セキュリティ: プロファイル / アカウント / 許可結び付け、保存領域拒否、承認 Signer 識別情報、Vault の秘密情報パスを確認。秘密情報のログ・例外漏えいは確認されなかった。wallet-core の内部鍵処理とバインディングは対象外。
- 相互運用性: `deriveSharedAccount` の既存固定ベクターを変更せず、保存する識別情報を Profile.chain に限定した。Symbol / NEM および Mainnet / Testnet の選択境界を確認。
- エラー / abnormal パス: 旧スキーマ、混在したアカウント、誤ったチェーン対象範囲、バックアップ識別情報不一致、誤ったネットワークの既存テストと実装を確認。IR-001 の不一致許可テストは未実装。
- テスト品質: コア、profile-backup、拡張機能の targeted テスト / typecheck は通過。ただしコア PermissionService のプロファイル対象範囲不一致テストが不足している。

## 検証結果

- `pnpm --filter @mosaiclynx/core typecheck`: 合格
- `pnpm --filter @mosaiclynx/core test`: 合格（5 テスト）
- `pnpm --filter @mosaiclynx/profile-backup typecheck`: 合格
- `pnpm --filter @mosaiclynx/profile-backup test`: 合格（3 テスト）
- `pnpm --filter @mosaiclynx/extension typecheck`: 合格
- `pnpm --filter @mosaiclynx/extension test`: 合格（10 ファイル / 29 テスト）
- 対象変更ファイルの Prettier 確認: 合格
- `git diff --check`: 合格
- 未実行: ルート lint、ルートテスト / ビルド、拡張機能ビルド、ブラウザ E2E、外部ノード / バインディング実行環境。IR-001 修正後に必要範囲を再実行する。

## レビュー判定基準

| 判定条件                 | 判定   | 根拠                                                                                        |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| 仕様適合性               | 不合格 | IR-001: コア許可サービスがプロファイル対象範囲を固定しない                                  |
| セキュリティ             | 不合格 | IR-001: プロファイル内の認可状態をチェーン間のに保存可能                                    |
| 相互運用性               | 合格   | チェーンアダプターの固定ベクターとネットワーク / チェーン投影は変更せず、単一識別情報を選択 |
| 異常系                   | 不合格 | 不一致許可の保存拒否がコアサービスで未検証                                                  |
| テスト十分性             | 不合格 | IR-001 を独立検出するコアテストがない                                                       |
| 実装品質・実行環境安全性 | 合格   | 型、依存方向、変更対象の保存領域 / UI 境界に追加の判定を妨げる defect は確認なし            |

## 残存リスクと未決定事項

- IR-001 が解消されるまで、コア `PermissionService` をプロファイル許可の信頼された writer として利用できない。
- ブラウザ E2E、拡張機能ライフサイクル、リリース証跡は本レビューの targeted 検証では未確認。

## 自動変更

なし。レビュー中はレビュー成果物以外を変更していない。

## 最終判断

`REVISE IMPLEMENTATION`
