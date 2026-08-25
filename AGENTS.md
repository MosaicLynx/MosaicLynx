# MosaicLynx リポジトリ作業指針

## このファイルの役割

この `AGENTS.md` は、MosaicLynx リポジトリで作業するエージェントの探索、変更範囲、検証、報告方法を定める。プロダクトの詳細仕様やプロトコル仕様の正本ではない。

作業内容に対応する Skill が `.agents/skills/` にある場合は、その `SKILL.md` を先に読み、同じディレクトリの `.agents/project-context.md` と合わせて適用する。

## プロジェクト概要

MosaicLynx は、Symbol / NEM dApp 向けの署名機能を持つ Chrome Manifest V3 拡張機能と、transport 非依存の TypeScript SDK、Relay、チェーンアダプター、バックアップ・プロトコルのモノレポである。

現在のワークスペースに存在する実装対象は `apps/*` と `packages/*` である。仕様に記載された将来の Mobile アプリを、実装済みのワークスペースとして扱わない。

## リポジトリ構成

- `apps/extension/`: Chrome 拡張機能。Vault、承認 UI、Provider 境界を含む。
- `apps/relay/`: Fastify と Redis を使う自己ホスト型 Relay。Relay は暗号文を中継・短期保管する。
- `apps/link-fallback/`: Universal Link / App Link の fallback 静的アプリ。
- `apps/test-dapp/`: Provider と SDK の動作を確認する Vite テスト dApp。
- `packages/core/`: チェーンに依存しないドメイン、ポート、canonical 構造化メッセージ。
- `packages/chain-symbol/`: Symbol の導出、検証、署名、トランザクション検査。
- `packages/chain-nem/`: NEM の導出、検証、署名、トランザクション検査。
- `packages/provider-api/`: Provider の公開契約。
- `packages/relay-protocol/`: Relay の暗号化・交換形式。
- `packages/profile-backup/`: Profile backup の形式と検証。
- `packages/sdk/`: 利用者向け `@mosaiclynx/sdk`。
- `packages/release-evidence/`: release evidence の生成・検証。
- `docs/concept/`: コンセプトシート。
- `docs/requirements/`: 要件定義書。
- `docs/specifications/`: 実装対象の仕様書。
- `docs/`: 文書種別・用途別ディレクトリのルート。
- `docs/evidence/`: release evidence policy と公開鍵。
- `docs/mobile/`: Mobile の privacy、support、store release 資料。
- `docs/release/`: リリース手順、release evidence、脅威モデル。
- `docs/adr/`: 承認済み Architecture Decision Record。
- `docs/reviews/concept/`: コンセプトレビュー。
- `docs/reviews/requirements/`: 要件レビュー。
- `docs/reviews/specifications/`: 仕様レビュー。
- `docs/reviews/implementation/`: 実装レビュー。
- `docs/reviews/readme/`: README レビュー。
- `docs/reviews/release/`: リリース準備レビュー。
- `.agents/`: このリポジトリ固有の作業 Skill とプロジェクトコンテキスト。
- `tools/`: release evidence などの補助スクリプト。

## Source of Truth

判断の根拠は、対象に応じて次の順で確認する。

1. ユーザーの明示した依頼と変更範囲
2. 対象機能の承認済みドキュメント
3. 適用可能な `docs/adr/` の設計判断
4. 対象 package / app の `package.json`、`tsconfig.json`、公開 export、実装、テスト
5. 対象バージョンの公式仕様、公式 SDK、公式実装

主なドキュメントの役割は次のとおり。

- `docs/specifications/product-spec.md`: 拡張機能のプロダクト範囲、外部可視動作、受け入れ条件。
- `docs/design/architecture.md`: モノレポの責務分担、依存方向、境界、保存、RPC、テスト戦略。
- `docs/specifications/chain-compatibility-spec.md`: Symbol / NEM の導出、network、transaction、署名 byte 列、固定 vector。
- `docs/specifications/web-transaction-handoff-spec.md`: SDK、Extension、Relay の受け渡し契約と暗号化。
- `docs/specifications/profile-account-spec.md`: Profile、Account、backup、復元、ロック、認証の仕様。
- `docs/release/release-process.md`、`docs/release/mainnet-release-evidence.md`、`docs/release/threat-model.md`: リリース証跡、運用、脅威モデル。
- `docs/evidence/evidence-policy.json`: release evidence の検証ポリシー。
- `docs/adr/`: 仕様・実装に影響する承認済みの設計判断。

`docs/concept/`、`docs/requirements/`、`docs/specifications/` は文書種別ごとの作成先であり、対応するレビューは `docs/reviews/` 以下の同名種別ディレクトリへ保存する。アーキテクチャ、release、Mobile、evidence も用途別ディレクトリへ配置する。技術情報は既存の仕様、ADR、必要に応じた公式資料から確認する。

## 情報の区分

次を混同しない。

- プロダクト仕様とアーキテクチャ設計
- Symbol と NEM
- Mainnet と Testnet
- プロトコル仕様と `@nemnesia/symbol-sdk` の API
- Relay の暗号文中継と、署名機による transaction 内容の解析
- 仕様上の期待値と、現在の実装・テストが示す挙動
- 将来 Mobile 対応と、現在ワークスペースに存在する実装

Symbol / NEM の技術的事実を記憶だけで決めない。`docs/specifications/chain-compatibility-spec.md` と固定 vector を確認し、必要に応じて対象バージョンの公式資料や SDK を照合する。既存コードやテストだけをプロトコル仕様の根拠にしない。

資料が競合する場合は、対象チェーン、network、バージョン、文書の役割、更新時点を確認する。解消できない競合や OPEN 項目は、勝手に選択せず影響範囲とともに報告する。

## 変更範囲

- ユーザーが指定した app / package / ファイルの範囲に限定する。
- 無関係な formatting、rename、依存更新、lockfile 更新を行わない。
- 仕様にない公開 API、設定、fallback、互換動作、エラー条件を便利さだけで追加しない。
- 公開 export、JSON / backup / Relay 形式、RPC 契約、SDK の型を変更する場合は、対象仕様と利用者影響を確認する。
- 新しい依存関係は、既存依存で実現できないことを確認してから追加する。
- 既存のユーザー変更を取り消さない。作業前の `git status` と重なる変更を尊重する。

## セキュリティとチェーン固有の注意

- 秘密鍵、Mnemonic、Profile password、Vault plaintext、Relay credential、復号した暗号文をログ、例外、warning、テスト出力へ含めない。
- 外部入力、Chrome message、Provider RPC、Relay body、backup envelope は検証前に信用しない。
- 秘密情報を Web page、dApp、Service Worker、Relay へ不要に渡さない。署名時の復号境界は対象仕様に従う。
- KDF、AEAD、salt、nonce、署名 byte 列、canonical serialization を独自判断で変更しない。
- Symbol と NEM の導出・address・network constant・transaction schema・署名処理を暗黙に共通化しない。
- Mainnet と Testnet を型、条件、表示、Profile 境界のいずれでも混在させない。
- Protocol quantity は浮動小数で計算しない。byte 列、hex、public key、private key、signature、hash の表現と長さを確認する。
- Relay は仕様で opaque とされた暗号文を解釈・改変しない。期限、サイズ、回数、認証、状態遷移を仕様に従って検証する。
- Mainnet signing の release gate、Testnet 限定の backup、announce 非対応など、現在の build capability を無断で緩和しない。

## TypeScript / pnpm の実装規約

- Node.js は `mise.toml` の指定、パッケージ管理は `pnpm@11.13.0` を基準にする。
- package は ESM と strict TypeScript を基本とし、公開 package の `exports`、`main`、`types` と実際の export を一致させる。
- workspace package 間の依存は `workspace:*` を優先し、package の責務境界を越える import を追加しない。
- `number` と `bigint`、`Buffer` と `Uint8Array`、hex string と raw bytes を変換するときは、既存の型・仕様・fixture を根拠にする。
- 暗号、署名、serialization は既存の固定依存と実装パターンを優先する。
- コード変更には、正常系だけでなく malformed input、境界値、wrong network / chain、認証失敗、truncated data、重複、deterministic output、secret leakage のうち該当するテストを追加する。

## 検証

変更内容に応じて、実行したコマンドだけを結果として報告する。

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

追加の確認:

- Extension の変更: `pnpm --filter @mosaiclynx/extension test`、必要なら `pnpm build:extension`
- Relay の通常テスト: `pnpm --filter @mosaiclynx/relay test`
- Redis を使う Relay integration: `pnpm --filter @mosaiclynx/relay test:integration`。Redis が必要で、未実行なら成功と扱わない。
- SDK / Provider / chain adapter / backup / protocol の変更: 対象 package の `pnpm --filter <package> test` と `typecheck` を追加する。
- release evidence の変更: `pnpm evidence:collect`、`pnpm evidence:manifest`、`pnpm evidence:verify`、`pnpm evidence:gate` の対象範囲を確認する。

ドキュメントまたは `.agents` だけの変更でも、可能な範囲で `pnpm format:check` を実行する。実行できなかった検証は `Not validated` として理由を報告する。

## 文書とレビュー

- `docs/specifications/` など既存の正本を、単なる作業メモやレビュー結果で上書きしない。
- 仕様を作成・更新する場合は、プロダクト範囲、アーキテクチャ、チェーン互換性、Relay / Profile の責務境界を維持する。
- ADR が必要な重要判断は `docs/adr/` に記録し、既存 ADR の OPEN 項目を根拠なく閉じない。
- レビュー成果物は `docs/reviews/<concept|requirements|specifications|implementation|readme|release>/` に対象ベース名と連番を付けて保存し、既存の成果物を上書きしない。必要なディレクトリがない場合は作成する。
- レビューでは仕様適合、バグ、セキュリティ、相互運用性、未決定事項、改善提案を区別する。レビュー指摘だけを根拠に実装や仕様を拡張しない。

## 完了報告

最終報告では、必要に応じて次を区別する。

- Changes: 変更ファイルと外部可視動作への影響
- Evidence: 参照した仕様、ADR、実装、テスト、公式資料
- Validation: 実行した formatter、lint、typecheck、test、build と結果
- Not validated: 未実行の検証と理由
- Remaining issues: 未決定事項、競合、残存する仮定、追加レビュー

未確認の事項を確認済みと書かず、未実行の検証を成功と報告しない。
