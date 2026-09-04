# Author Playbook

作成系 Skill 共通の規則。各 Skill は、この文書に加えて対象文書種別の責務と出力形式を適用する。

## このリポジトリの前提

- リポジトリ名は `MosaicLynx`。Chrome Extension、TypeScript SDK、Relay、chain adapter、backup / protocol package を含む pnpm monorepo である。
- 現在の実装対象は `apps/*` と `packages/*`。`_snwc` は `symbol-nem-wallet-core` の外部コンポーネントであり、MosaicLynx の root package 実装として扱わない。
- 作業指針はリポジトリルートの `AGENTS.md` を読む。`AGENTS.md` は作業方法の根拠であり、製品仕様や Symbol / NEM の技術仕様の正本ではない。
- コンセプトは `docs/concept/`、要件は `docs/requirements/`、設計・設計判断は `docs/design/`、仕様は `docs/specifications/`、レビューは `docs/reviews/` に置く。
- コード、テスト、fixture、生成物は対象 app / package の `package.json`、`tsconfig.json`、`src/`、`test/`、build script から発見する。未確認の固定 path を前提にしない。

## Phase Context の扱い

Phase Context は任意の非規範的な派生情報であり、正式資料の圧縮キャッシュである。
新しい開発フェーズ、要求、設計判断、仕様または Source of Truth ではない。

### 発見と参照順序

`AGENTS.md` の任意の `Phase Contexts` 登録を確認する。対象フェーズの登録がある場合だけ、
登録された既存パスを、対象文書へ入る前の初期理解・探索用に読む。登録がない場合は
Context を探索・作成せず、通常どおり正式資料を直接読む。

Author の基本参照順序は次のとおりとする。各文書種別の Skill が定める追加の playbook や
入力資料はこの順序へ適用する。

1. `AGENTS.md`
2. この Author common playbook
3. `AGENTS.md` に対象フェーズの Phase Context が登録されている場合だけ、その Context
4. 対象文書とユーザーが明示した資料
5. 対象へ直接必要な承認済み正式上流資料
6. 必要な場合だけ、その他の正式資料・公式資料・既存成果物

Context を読んでも、対象文書または直接必要な正式上流資料を省略しない。Context の
authoritative source map は所在を探すために使い、記載内容を検証済みの正本として扱わない。

### 正式資料へのフォールバック

次の場合は必ず正式資料へ戻って確認する。

- Context に情報がない、曖昧である、鮮度が不明である
- Context と対象文書または正式資料が競合している
- 新しい Requirement、Design または Specification を決定する
- security invariant、trust boundary、responsibility boundary に影響する
- traceability またはその他の normative contract を確定する

競合時は正式資料を優先し、Context の記載を根拠に補完・平均化・逆流させない。Context の
stale または inconsistent な疑いは、正式資料を根拠に作業を続けられる場合でも別途報告する。

## 作成の目的

成果物は、確認済みの事実・要求・判断を次工程が使える形へ整理する。入力にない機能、責任、制約、数値、方式、将来構想を網羅性のために発明しない。

文書種別を混同しない。

- concept: なぜ作るか、誰の課題か、どんな価値か、どこまで扱うか
- requirements: 何を満たす必要があるか、制約、責任、受け入れ条件
- design: どの責務・境界・依存方向で構成するか
- specification: 外部から観測できる具体的な契約、データ、validation、error、security
- implementation: 承認済み仕様をコードとテストへ反映する
- README: 現在利用できる product、app、package の使い方

上流文書の不足を下流の形式へ無断変換したり、下流の不足を上流文書へ逆流させたりしない。

## 対象と変更境界

1. ユーザーが明示した対象、出力先、更新範囲を最優先する。
2. 未指定時は各 Skill の候補探索規則で対象を一意に決定する。候補が複数または0件なら推測しない。
3. 既存ファイルは、明示的な更新依頼がある場合だけ更新する。更新時も依頼範囲外の改名・再構成を行わない。
4. 成果物の種類を増やさない。レビュー、要件、仕様、設計、コード、テストを同時に作らない。
5. 既存のユーザー変更、固定名の成果物、連番成果物を移動・削除・上書きしない。

## 根拠

根拠の優先順位は、ユーザー依頼、対象フェーズの承認済み上流文書、同一フェーズの既存成果物、適用可能な設計判断、対象文書、公式仕様・schema・SDK、既存実装・テストの順とする。下流資料は、各 Skill が条件付き参照を定める場合またはユーザーが明示した場合だけ補助的に使い、新しい上流成果物の根拠にはしない。

`docs/specifications/chain-compatibility-spec.md` など、`AGENTS.md` が示す対象仕様と公式資料を必要な範囲で読む。既存コード・テスト・SDKの挙動は現状や実現可能性の確認には使えるが、プロジェクト要求や Symbol / NEM protocol の正本にはしない。

資料間の競合は、chain、network、version、資料の役割、更新時点、影響とともに未決定事項として残す。解消できない競合を実装・仕様・設計上の都合で採用しない。

## 共通の境界

- Symbol と NEM、Mainnet と Testnet、Extension と SDK、Relay と signer、SDK と protocol を暗黙に共通化しない。
- `symbol-nem-wallet-core` の Wallet Store、秘密情報処理、chain-specific key、raw signing は外部契約として扱い、MosaicLynx 側で再実装・再定義しない。Binding の詳細を扱う場合だけ、対象の外部契約と `docs/design/` の該当設計を確認する。
- Wallet Store と Pending Profile は opaque byte 列として扱い、仕様がない限り内容を推測・編集しない。
- Mnemonic、秘密鍵、Profile password、復号済み payload、credential を成果物、例、ログ、エラー、テスト出力に含めない。
- 暗号、署名 byte 列、KDF、AEAD、salt、nonce、数量、canonical serialization を根拠なしに変更・補完しない。

## 作成手順

1. 対象文書、対象フェーズの上流資料、同一フェーズの既存成果物および Skill が指定する補助資料を確定する。
2. 入力を事実、要求、制約、仮定、未決定、将来構想へ分類する。
3. 対象文書種別の責務に該当する情報だけを採用する。
4. 各採用内容を出典または上流項目へ追跡できるようにする。
5. 後工程で決められる内容は方式を発明せず、引継ぎまたは未決定事項へ置く。
6. 本文、図表、例、用語、リンクの内部整合性を確認する。
7. 指定された成果物だけを作成・更新し、自己確認と必要な形式確認を行う。

## 整形と検証

検証前に実際の変更ファイルとユーザーが依頼した検証範囲を確認し、ルート `AGENTS.md` の
`## 検証` を適用する。作業フェーズだけで検証範囲を決めない。

- `docs/**`、README 等の docs-only 作業では、Markdown、リンク、relative reference、
  traceability、文書間整合性、差分・状態確認だけを対象にし、app / package の実装テストを
  自動実行しない。
- `AGENTS.md` と `.agents/**` だけの agent / skill-only 作業では、Skill の構造・参照・
  Markdown・必要な validator だけを対象にし、実装テストを実行しない。
- app / package の検証は、実際の変更分類または明示された依頼範囲に該当するものだけを
  追加する。Extension、Relay、SDK、chain adapter、backup / protocol、release evidence の
  package script と root `AGENTS.md` の追加確認を使用する。変更対象外の検証を「念のため」実行しない。
- 対象変更がない検証は `NOT APPLICABLE / SKIPPED (no relevant change)` と報告できる。
  実行していない検証、確認できない外部環境、未解決の仕様を成功として記録しない。

## 完了と Git

- 成果物が対象文書種別の責務に収まり、根拠へ追跡できる。
- 対象外の機能、方式、API、実装、将来構想を混入させていない。
- 未決定事項と下流への引継ぎを、事実や決定済み事項と分けている。
- `git status` と差分を確認し、無関係な変更を含めない。
- ユーザーが明示的に依頼しない限り、commit、push、tag、publish、remote変更を行わない。
