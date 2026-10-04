# 実装レビュー: プロファイルチェーン単一化（再レビュー）

## レビュー対象

- 対象: `2bdaba9`、`3b2f32e`、`59ac1af`、`9d79f46`、`8f5c1c5` とその変更範囲（`packages/core`、`packages/profile-backup`、`apps/extension`）
- 確認日: 2026-09-20
- 範囲: プロファイル / アカウントの単一チェーン境界、Vault 保存・読込、許可結び付け、バックアップ検証、Provider / 承認 / UI のチェーン結び付け、関連テスト
- 対象外: `_snwc`、モバイルの未実装コード、Relay / SDK の無変更領域、外部ノード / ブラウザ実実行環境
- 成果物: 本レビュー。前回レビュー [profile-chain-implementation-review-001](./profile-chain-implementation-review-001.md) の IR-001 を再確認した。

## 実行記録

サブエージェントは使用せず、レビュー Board レビュー統括が次の4パスを独立して実施した。

- レビュアー A（仕様適合性）: Profile.chain、Account.chain / 識別情報、許可、旧ストアの扱いを要件 / 仕様 / 設計と照合
- レビュアー B（セキュリティ）: プロファイル内の認可、Vault / 秘密情報パス、保存領域検証、Provider / 承認境界を確認
- レビュアー C（相互運用性）: Symbol / NEM、Mainnet / Testnet、チェーン固有の識別情報、既存チェーンアダプター / バックアップ契約を確認
- レビュアー D（品質・テスト）: TypeScript、保存状態、不正な形式の / 誤ったチェーン、関連単体テストとワークスペース検証を確認

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
- 関連単体テスト、パッケージマニフェスト、TypeScript 設定、ワークスペース検証結果

## レビュー結果

`READY`

## 要約

プロファイルは `chain` を作成時に固定し、アカウントは `chain` と単一 `identity` を持つ構成へ移行されている。拡張機能の Vault、Provider、承認、アカウント管理、作成・管理 UI、バックアップ検証は Profile.chain に一致するデータだけを扱う。旧 V1/V2 混在したストアの自動移行は行わず、V3 ストアのプロファイル、アカウント、許可のチェーン / ネットワーク不一致は安全側に終了して拒否する。

前回 IR-001 のコア許可対象範囲検証不足は、`PermissionService` がプロファイルリポジトリを参照し、存在・チェーン・ネットワークの不一致を保存前に拒否する実装とテストで解消された。

## 指摘の状態

| ID     | 重要度 | 状態     | 初出レビュー                              | 今回の状態根拠                                                                                 |
| ------ | ------ | -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| IR-001 | HIGH   | 解消済み | `profile-chain-implementation-review-001` | `PermissionService.grant` のプロファイル対象範囲検証、チェーン間の拒否テスト、保存前拒否を確認 |

## 必須の修正

なし。

## 任意の改善

なし。

## 解消済みの指摘

### IR-001: コア PermissionService がプロファイルの固定チェーン / ネットワークを検証しない

- 解消内容: `packages/core/src/use-cases.ts` の `PermissionService` に `ProfileRepository` を追加し、プロファイル未存在、scope.network 不一致、scope.chain 不一致を許可リポジトリの保存前に拒否するよう変更した。
- 確認テスト: `packages/core/test/core.test.ts` で有効な許可付与、チェーン間の不一致、誤ったネットワークの境界を確認した。
- 追加確認: `apps/extension/src/vault.ts` の V3 ストア読込でも許可の Profile.chain / ネットワーク不一致を拒否し、`apps/extension/test/vault-storage.test.ts` で混在した許可状態を検証した。
- 再確認結果: 許可完全性の残存判定を妨げる defect は確認されなかった。

## 上流工程へのフィードバック

なし。単一チェーンの要求・設計・仕様は実装判定に必要な範囲で確定している。

## 後続工程へ委譲する指摘

- ブラウザ実実行環境の UI 操作、サービスワーカー再起動、拡張機能再読み込み後の保存領域実挙動はローカル単体テストの対象外であり、別途 E2E / リリース準備状態で確認する。
- `_snwc` のネイティブ / WASM バインディングは変更対象外のため、バインディング内部の実装レビューは行っていない。
- Relay 統合、外部ノード、Mainnet リリース証跡は今回の変更範囲に直接含まれず、該当工程で確認する。

## 対象範囲と追跡可能性

`CR-017` / `CR-AC-020` → プロファイル / アカウント仕様 §3 / §11 → アーキテクチャ §6.6 / インターフェース §6 / セキュリティ設計 §6・§16 → コアドメイン / コア use cases / 拡張機能 Vault / Provider / 承認の変更を追跡した。許可 writer と永続化済みのストア読み上げの双方でプロファイル内のチェーン / ネットワーク結び付けを確認し、拡張機能の公開投影は Account.identity 単体から生成されることを確認した。

`deriveSharedAccount` がチェーンアダプターの固定ベクター契約として両チェーンの導出資料を返す実装は維持されているが、プロファイル / アカウント / Vault / Provider が保存・公開するのは Profile.chain に対応する一つの識別情報に限定される。これは下位のアダプター互換性とアプリケーションプロファイルの責務を分離する既存境界に合致する。

## ドメイン別の確認

- 仕様適合性: 合格。プロファイル固定チェーン、単一の識別情報、別プロファイルによる Symbol / NEM 分離、旧混在した状態非互換、UI / Provider / 承認の対象範囲結び付けを確認。
- セキュリティ: 合格。プロファイル / アカウント / 許可結び付け、保存領域拒否、承認署名主体識別情報、Vault 秘密情報パス、誤ったチェーン / ネットワーク失敗パスを確認。秘密情報のログ・例外漏えいは確認されなかった。wallet-core の内部鍵処理とバインディングは対象外。
- 相互運用性: 合格。`deriveSharedAccount` の固定ベクターを変更せず、選択済みの Profile.chain の識別情報のみをアカウント投影 / バックアップ検証に利用することを確認。Symbol / NEM、Mainnet / Testnet の境界を確認。
- エラー / abnormal パス: 合格。旧スキーマ、混在したプロファイル / アカウント / 許可、誤ったチェーン対象範囲、バックアップ識別情報不一致、誤ったネットワーク、重複ニーモニックの関連パスを確認。
- テスト品質: 合格。コア、profile-backup、拡張機能の targeted テストと全ワークスペーステスト / typecheck / ビルドが成功し、IR-001 の保存前拒否を独立テストした。
- 型・依存・公開互換性: 合格。コアの PermissionService constructor 変更箇所をワークスペーステスト / typecheck で追跡し、無関係なパッケージの公開契約は変更していない。

## 検証結果

- `pnpm lint`: 合格（最終変更前のルート run）。
- `./node_modules/.bin/oxlint --deny-warnings`: 合格（最終変更後のリポジトリ内の直接の検証）。
- `pnpm typecheck`: 合格（12 ワークスペース projects）。
- `pnpm test`: 合格（12 ワークスペース projects。拡張機能 10 ファイル / 30 テスト、コア 5 テスト、profile-backup 3 テストを含む）。
- `pnpm build`: 合格（拡張機能、test-dapp、SDK、Relay、全ワークスペースビルド）。Vite の chunk サイズ警告は表示されたがビルドは成功した。
- `pnpm --filter @mosaiclynx/core typecheck && pnpm --filter @mosaiclynx/core test`: 合格。
- `pnpm --filter @mosaiclynx/profile-backup typecheck && pnpm --filter @mosaiclynx/profile-backup test`: 合格。
- `pnpm --filter @mosaiclynx/extension typecheck && pnpm --filter @mosaiclynx/extension test`: 合格。最終追加後は直接の `tsc` / `vitest` でも合格。
- 対象変更ファイルの Prettier 確認: 合格。
- `git diff --check`: 合格。
- 未確認: ブラウザ実実行環境、サービスワーカー再起動 / 再読み込み E2E、外部ノード、ネイティブ / WASM バインディング実行環境、Relay Redis 統合。これらは今回の対象変更外または別工程で確認する。

## レビュー判定基準

| 判定条件                 | 判定 | 根拠                                                                                                  |
| ------------------------ | ---- | ----------------------------------------------------------------------------------------------------- |
| 仕様適合性               | 合格 | プロファイル / アカウント / 許可の単一チェーン不変条件と旧混在した状態非互換を実装・テストで確認      |
| セキュリティ             | 合格 | コア許可 writer と拡張機能ストア読み上げがプロファイルチェーン / ネットワークを安全側での終了に検証   |
| 相互運用性               | 合格 | チェーンアダプター固定ベクター、選択済みの識別情報、チェーン / ネットワークの境界を維持               |
| 異常系                   | 合格 | 不正な形式のストア、混在した許可、誤ったチェーン / ネットワーク、バックアップ不一致、重複の拒否を確認 |
| テスト十分性             | 合格 | IR-001 の再発を含む targeted / ワークスペーステスト、typecheck、ビルドが成功                          |
| 実装品質・実行環境安全性 | 合格 | strict TypeScript、ワークスペース依存関係、保存領域置き換え、公開投影の整合を確認                     |

## 残存リスクと未決定事項

- ブラウザ実実行環境とライフサイクル / E2E は未確認であり、公開前のリリース準備状態で別途確認が必要。
- プロファイルバックアップ対応能力自体は仕様上将来対応能力のため、現行マイルストーンの必須リリース判定としては判定していない。
- `deriveSharedAccount` の下位の共有の資料契約はチェーン互換性の既存ベクターとして残るが、アプリケーションの混在したプロファイルを許可するものではない。

## 自動変更

なし。再レビュー中はレビュー成果物以外を変更していない。

## 最終判断

`READY`
