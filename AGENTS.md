# MosaicLynx リポジトリ作業指針

## このファイルの役割

この `AGENTS.md` は、MosaicLynx リポジトリで作業するエージェントの探索、変更範囲、検証、報告方法を定める。プロダクトの詳細仕様やプロトコル仕様の正本ではない。

作業内容に対応する Skill が `.agents/skills/` にある場合は、その `SKILL.md` を先に読み、対象に適用される repository instructions と合わせて適用する。Skill は特定の repository instructions の見出し名やファイル形式を前提にせず、そこから対象、artifact の配置、Source of Truth、validation、repository 固有の制約を取得する。

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
- `docs/`: 文書種別・用途別ディレクトリのルート。
- `.agents/`: このリポジトリで利用する Skill と補助資料。
- `tools/`: release evidence などの補助スクリプト。

## Artifact Layout

これは MosaicLynx repository の artifact 配置規約である。汎用 Skill はこの見出し名や具体的な path を他の repository の既定値として使用しない。

- `docs/concept/`: コンセプトシート。
- `docs/requirements/`: 要件定義書。
- `docs/design/`: 基本設計書。
- `docs/specifications/`: 実装対象の仕様書。
- `docs/adr/`: 承認済み Architecture Decision Record。
- `docs/reviews/concept/`: コンセプトレビュー。
- `docs/reviews/requirements/`: 要件レビュー。
- `docs/reviews/design/`: 基本設計レビュー。
- `docs/reviews/specifications/`: 仕様レビュー。
- `docs/reviews/implementation/`: 実装レビュー。
- `docs/reviews/readme/`: README レビュー。
- `docs/reviews/release/`: リリース準備レビュー。
- `docs/evidence/`: release evidence policy と公開鍵。
- `docs/release/`: リリース手順、release evidence、脅威モデル。
- `docs/mobile/`: Mobile の privacy、support、store release 資料。

新しい文書・レビュー成果物は、ユーザーが別の出力先を指定していない場合にこの配置規約を使う。既存成果物の候補が複数ある場合は自動選択せず、対象確認を行う。

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

`AGENTS.md` は作業規則、artifact 配置、参照先、repository 境界を定めるためのものであり、製品仕様書やプロトコル仕様書ではない。API contract、wire format、暗号方式・パラメータ、署名 byte 列、chain protocol の詳細、SDK version に依存する仕様、product capability、release gate の詳細は、上記の正本 docs、ADR、package manifest、または対象 version の公式資料で確認する。資料間の競合を `AGENTS.md` だけで解消しない。

## Repository-specific Boundaries

次を混同しない。

- プロダクト仕様とアーキテクチャ設計
- Symbol と NEM
- Mainnet と Testnet
- プロトコル仕様と SDK の API
- Relay の暗号文中継と、署名機による transaction 内容の解析
- 仕様上の期待値と、現在の実装・テストが示す挙動
- 将来 Mobile 対応と、現在ワークスペースに存在する実装

Symbol / NEM の技術的事実を記憶だけで決めない。`docs/specifications/chain-compatibility-spec.md` と対象の固定 vector を確認し、必要に応じて対象 version の公式資料や SDK を照合する。既存コードやテストだけをプロトコル仕様の根拠にしない。

資料が競合する場合は、対象チェーン、network、バージョン、文書の役割、更新時点を確認する。解消できない競合や OPEN 項目は、勝手に選択せず影響範囲とともに報告する。

## 変更範囲

- ユーザーが指定した app / package / ファイルの範囲に限定する。
- 無関係な formatting、rename、依存更新、lockfile 更新を行わない。
- 仕様にない公開 API、設定、fallback、互換動作、エラー条件を便利さだけで追加しない。
- 公開 export、JSON / backup / Relay 形式、RPC 契約、SDK の型を変更する場合は、対象仕様と利用者影響を確認する。
- 新しい依存関係は、既存依存で実現できないことを確認してから追加する。
- 既存のユーザー変更を取り消さない。作業前の `git status` と重なる変更を尊重する。

## セキュリティとチェーン固有の注意

- 秘密鍵、Mnemonic、password、Vault plaintext、credential、復号データなどの秘密情報をログ、例外、warning、テスト出力へ含めない。
- 外部入力、message、RPC、transport body、backup envelope は検証前に信用しない。
- 秘密情報を外部主体へ不要に渡さず、復号・署名・承認の境界は承認済みの仕様・設計に従う。
- 暗号、署名、serialization、数量、address、network の規則を独自判断で変更・補完しない。詳細は対象仕様、ADR、公式資料へ追跡する。
- Symbol と NEM、Mainnet と Testnet など repository が扱う domain / network の境界を暗黙に共通化しない。
- Relay など opaque と定義された transport の内容を、仕様上の権限なく解釈・改変しない。
- product capability、release gate、announce 可否などは、対象の product / release 文書を確認せずに緩和しない。

## TypeScript / pnpm の実装規約

- Node.js は `mise.toml` の指定（現在は node 26）、パッケージ管理は `package.json` の `packageManager`（現在は `pnpm@11.24.0`）を基準にする。
- package は ESM と strict TypeScript を基本とし、公開 package の `exports`、`main`、`types` と実際の export を一致させる。
- workspace package 間の依存は `workspace:*` を優先し、package の責務境界を越える import を追加しない。
- `number` と `bigint`、`Buffer` と `Uint8Array`、hex string と raw bytes を変換するときは、既存の型・仕様・fixture を根拠にする。
- 暗号、署名、serialization は既存の固定依存と実装パターンを優先する。
- コード変更には、正常系だけでなく malformed input、境界値、wrong network / chain、認証失敗、truncated data、重複、deterministic output、secret leakage のうち該当するテストを追加する。

## 検証

変更内容に応じて、実行したコマンドだけを結果として報告する。

```sh
pnpm exec prettier --write path/to/artifact
pnpm exec prettier --check path/to/artifact
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

formatter と Markdown format check は、作成・更新した成果物の明示的なパスだけを対象に実行する。リポジトリ全体を走査する `pnpm format:check` は、ユーザーが明示的に求めた場合または release gate が対象に含める場合だけ実行する。

追加の確認:

- Extension の変更: `pnpm --filter @mosaiclynx/extension test`、必要なら `pnpm build:extension`
- Relay の通常テスト: `pnpm --filter @mosaiclynx/relay test`
- Redis を使う Relay integration: `pnpm --filter @mosaiclynx/relay test:integration`。Redis が必要で、未実行なら成功と扱わない。
- SDK / Provider / chain adapter / backup / protocol の変更: 対象 package の `pnpm --filter <package> test` と `typecheck` を追加する。
- release evidence の変更: `pnpm evidence:collect`、`pnpm evidence:manifest`、`pnpm evidence:verify`、`pnpm evidence:gate` の対象範囲を確認する。

ドキュメントまたは `.agents` だけの変更では、作成・更新した成果物に対する formatter check を実行する。全体 formatter を実行した場合は、成果物単体の結果と分けて報告する。実行できなかった検証は `Not validated` として理由を報告する。

### pnpm Validation command policy

- 原則として、repository-defined な pnpm scripts / commands を使用する。
- pnpm 実行時に sandbox または execution environment の制約によって `ERR_SQLITE_ERROR: unable to open database file` が発生した場合、その pnpm launcher / environment failure 自体は、対象コードまたは文書の validation failure として扱わない。
- ただし、エラー内容を確認し、対象コード・設定・依存関係そのものの不具合ではなく、pnpm の database access に起因する環境制約であることを確認する。
- `node_modules` が存在し、対象 command に対応する repository-local executable が利用可能な場合は、`./node_modules/.bin/<command>` を直接実行して、可能な範囲で同等の validation を継続する。例えば Prettier では次を使用する。

  ```sh
  ./node_modules/.bin/prettier --check .
  ```

- direct executable を使用する場合も、元の pnpm script に追加引数、複数 command、environment variable、pre/post script などが含まれていないか確認する。
- pnpm script と direct executable が意味的に同等でない場合は、「完全な代替 validation」とは報告しない。
- repository-local executable でも必要な validation を実行できない場合のみ、環境制約による未検証項目として明示する。pnpm の環境エラーを理由に validation 自体を省略して PASS としてはいけない。
- fallback を使用した場合は、完了報告に次を明記する。
  - 失敗した pnpm command
  - environment error
  - 代替として実行した local executable / command
  - 代替 validation の結果
  - 元 command と完全に同等でない場合の未検証範囲

## レビュー・報告規約

- `docs/specifications/` など既存の正本を、単なる作業メモやレビュー結果で上書きしない。
- 仕様を作成・更新する場合は、プロダクト範囲、アーキテクチャ、チェーン互換性、Relay / Profile の責務境界を維持する。
- ADR が必要な重要判断は `docs/adr/` に記録し、既存 ADR の OPEN 項目を根拠なく閉じない。
- レビュー成果物は Artifact Layout に定めた `docs/reviews/<type>/` に対象ベース名と連番を付けて保存し、既存の成果物を上書きしない。必要なディレクトリがない場合は作成する。
- レビューでは仕様適合、バグ、セキュリティ、相互運用性、未決定事項、改善提案を区別する。レビュー指摘だけを根拠に実装や仕様を拡張しない。

## 完了報告

最終報告では、必要に応じて次を区別する。

- Changes: 変更ファイルと外部可視動作への影響
- Evidence: 参照した仕様、ADR、実装、テスト、公式資料
- Validation: 実行した formatter、lint、typecheck、test、build と結果
- Not validated: 未実行の検証と理由
- Remaining issues: 未決定事項、競合、残存する仮定、追加レビュー

未確認の事項を確認済みと書かず、未実行の検証を成功と報告しない。

## コミットメッセージ規約

変更があるコミットを作成する場合は、タイトルだけのコミットを作成しない。タイトルおよび本文の説明は日本語で記述する。プレフィックス、対象コンポーネント／領域のパス、API名、固有名詞、技術用語、コマンド名などは必要な範囲で原表記を使用してよい。パスは `apps/extension`、`packages/core`、`docs/requirements` のようなリポジトリルート相対のコンポーネント／領域単位で記載し、ファイル名や拡張子は含めない。タイトルの後に空行を置き、`- ` で始まる変更内容の箇条書きを最低1項目続ける。変更が1点だけでも本文を省略しない。

例えば、タイトルと本文を別引数で渡す。

```sh
git commit -m "<type>: <変更の概要>" -m $'- <変更箇所>: <変更内容>'
```

コミット後、プッシュ前に `git show -s --format='%B' HEAD` を実行し、タイトル、空行、箇条書きの本文を確認する。本文がなければローカルで修正してからプッシュし、既にプッシュしたコミットの履歴は明示的な依頼なく書き換えない。
