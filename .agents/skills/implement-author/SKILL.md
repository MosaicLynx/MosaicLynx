---
name: implement-author
description: MosaicLynx の TypeScript app / package を、承認済み仕様・要件・ADRに従って実装または修正する。Symbol、NEM、署名、暗号化、Relay、backup、Provider、Extension境界を含む変更に使用し、仕様にない外部可視動作は追加しない。
---

# Implementation Author

承認済み仕様を、型安全で検証可能なコードとテストへ反映する。実装前に仕様・要件・設計・ADRの責務境界を確認し、不明な外部可視動作を推測で埋めない。

作業開始時に次の順で確認する。

1. /home/harvestasya/workspace/mosaiclynx/AGENTS.md
2. /home/harvestasya/workspace/mosaiclynx/.agents/project-context.md
3. ../author-common/author-playbook.md
4. 対象機能の承認済み仕様
5. 対象の要件、基本設計、ADR、公開API
6. 対象コード、テスト、fixture、package manifest、関連レビュー
7. 必要な公式protocol仕様、schema、SDK

## 対象と変更範囲

- ユーザーが明示したapp、package、ファイル、機能だけを対象にする。
- 対象、変更範囲、外部可視動作、検証範囲が不明な場合は推測で広げない。
- workspace packageの責務境界、ESM、strict TypeScript、Node.js指定、公開exports、既存依存を保つ。
- 仕様、README、ADR、fixture、release設定を変更する必要がある場合は、依頼範囲と根拠を確認する。
- 実装、関連テスト、必要なfixtureを成果物とする。レビュー結果を作成・上書きしない。

## 根拠と未決定事項

根拠の優先順位は、ユーザー依頼、承認済み仕様、承認済み要件、適用ADR、基本設計、対象packageの公開契約、公式資料、既存コード・テストの順とする。既存コード、fixture、SDKの便利APIだけで仕様を決めない。

仕様が入力、出力、error、署名対象、暗号、serialization、chain / network、security、互換性を十分に定めていない場合は、実装者が勝手に固定しない。実装不能・安全性判定不能・相互運用性判定不能を分けて、仕様フィードバックとして報告する。

仕様フィードバックを作成する場合は、対象ルートの docs/reviews/implementation/implement-spec-feedback.md に、対象箇所、確認できた事実、未決定または矛盾、実装への影響、仕様作成者に求める決定、検証条件を記録する。推奨案や暫定対応は規範仕様と分け、秘密情報を含めない。

## 実装前ゲート

コードを書く前に、対象に該当する次を確認する。

- 入力、出力、公開契約、前提、必須項目、field型
- サイズ、ネスト、resource、timeout、保持、再試行、重複
- validation、正規化、処理順序、状態、lifecycle、error
- 署名対象、canonical bytes、serialization、encoding、byte order、数量
- Chain、Network、Profile、Account、signer / cosignerの識別
- 暗号化対象、AAD、nonce、salt、tag、鍵長、乱数
- 認証、permission、replay、期限、改ざん、fail-closed
- 未知type / version / field、解析不能、result unknownの扱い
- 固定vector、fixture、適合試験、実行すべき検証

いずれかが外部可視動作や安全性に影響し、根拠なく決定できない場合は、実装を続けず仕様フィードバックへ送る。内部実装の選択肢だけなら、外部動作を変えない仮定として明示し、不要な設計を固定しない。

## 実装上の責務

### 仕様適合

- 仕様の必須、禁止、任意を区別してコードへ反映する。
- 外部入力を使用前に検証し、検証後の型だけを下流へ渡す。
- 正常系、異常系、境界、状態、error、結果対応を仕様どおりに実装する。
- 公開API、RPC、backup、Relay、Providerの契約と互換性を勝手に拡張しない。
- 署名前に対象、caller、Account、Chain、Network、permission、承認状態、payloadの一致を再確認する。
- 失敗時に署名、announce、保存、応答を継続しない。

### セキュリティ

仕様に必要な安全要件を実装する。一般的なベストプラクティスだけを理由に新しい外部動作を追加しない。

- 秘密鍵、Mnemonic、password、導出鍵、Wallet Store、復号データをログ、例外、debug出力へ出さない。
- 外部入力、Chrome message、Provider RPC、Relay body、backup envelopeを未検証で信用しない。
- CSPRNG、認証タグ、署名検証、定数時間比較、サイズ上限は、対象仕様と既存依存に従って扱う。
- 固定nonce、固定salt、予測可能な乱数、認証前の復号結果、検証前の署名対象を本番処理で使わない。
- security境界、fail-closed、replay防止、期限、permissionを仕様の強さ以上に緩和しない。

### ChainとProtocol

次の差異を暗黙に共通化しない。

- SymbolとNEM
- MainnetとTestnet
- protocol仕様とSDK API
- transaction、embedded transaction、aggregate、cosignature、message
- signerとcosigner
- transaction hash、payload hash、signature
- address文字列表現とraw bytes
- announceと署名

chain-specificなparse、validation、canonicalization、署名対象構築は対応adapterと固定vectorへ追跡する。@nemnesia/symbol-sdk 3.3.2-pure.2の便利APIの挙動だけでprotocol規則を作らない。

### Relay、Provider、wallet-core

- Relayはopaqueな暗号文の中継であり、意味解析、署名、承認、announceをさせない。
- Provider、Content Script、SDK、Relayへ秘密情報、復号済みVault、署名用秘密値を渡さない。
- ExtensionやApplicationはwallet-coreが正本とする鍵管理、Wallet Store、KDF、秘密情報処理、raw signingを再実装しない。
- wallet-coreへ渡すのは、利用者が承認し署名前に再検証した対象だけにする。
- Mainnet signing gate、Testnet-only capability、backup scope、announce非対応を無断で緩和しない。

## TypeScriptと境界

- 外部入力はunknownで受け、検証後にドメイン型へ変換する。
- 不要なany、型アサーションだけの検証、文字列の使い回しを避ける。
- numberとbigint、BufferとUint8Array、hex stringとraw bytesの変換境界を明示する。
- 文字列とbyte列を暗黙変換せず、encodingとbyte orderを既存規則に従わせる。
- 非同期処理の拒否、例外、期待可能な失敗を握りつぶさない。
- workspace packageの公開exports、main、types、ESM契約を壊さない。
- browser、Node.js、Extension Service Workerの実行環境差を、対象外の互換層を追加せず確認する。

## テスト方針

対象仕様に該当するテストを、正常系だけでなく次の分類から選ぶ。

### 正常系

- 最小の正しい入力、代表入力、最大許容付近
- Symbol / NEM、Mainnet / Testnet、対応version
- transaction、message、aggregate、cosignatureなど対象operation
- 同一入力のdeterministic output、encode / decodeの往復

### 異常系

- 必須欠落、不正型、不正長、範囲外、サイズ超過、過剰nesting
- malformed、truncated、duplicate、unknown type / version / field、invalid encoding
- wrong chain / network、invalid address / public key / signature
- tampered payload、invalid authentication tag、期限切れ、replay、duplicate request
- 認証失敗、permission不一致、caller不一致、timeout、Relay state loss、result unknown

### テストの独立性

- 期待値を実装ロジックの単純な複製で生成しない。
- protocol fixture、fixed vector、公式資料、独立実装を出典として記録する。
- snapshotだけで暗号、署名、canonical bytes、validationの正しさを証明しない。
- テストを通すためだけの本番分岐、固定テスト鍵の本番混入、秘密情報の出力を行わない。
- カバレッジ基準はリポジトリまたはCIに既定がある場合だけ適用し、任意の数値目標を新設しない。

## 実装手順

1. 対象と変更境界を確定する。
2. 承認済み仕様から実装対象と検証対象を抽出する。
3. 実装前ゲートで不足、矛盾、仮定を分類する。
4. 必要なら仕様フィードバックを作成し、外部可視動作の決定を停止する。
5. 既存の型、責務、依存、fixture、テスト構成を確認する。
6. 仕様の入力検証、正常系、異常系、security動作を実装する。
7. 仕様に対応するテストと独立した期待値・fixtureを追加する。
8. lint、format check、typecheck、対象test、buildを実行する。
9. 対応するimplement-review結果があれば、対象一致と指摘状態を確認する。
10. 自己レビュー、検証結果、未決定事項、指摘対応を報告する。

## 検証と報告

対象packageのscriptsとAGENTS.mdに従い、可能な範囲で次を実行する。

- format check
- lint
- typecheck
- unit / integration / e2e test
- coverage
- build
- 対象に必要な適合試験、evidence検証、Redis integration

実行していない検証、環境依存で確認できない事項、未解決の仕様は成功と報告しない。最終報告には変更ファイル、仕様との対応、仕様フィードバック、セキュリティ注意、実行コマンドと結果、未検証範囲、レビュー指摘の対応状況を含める。

## 禁止事項

- 仕様にない機能、公開API、field、error、fallback、互換性の追加
- 将来のためだけの抽象化、予約領域、設定項目、運用機能の追加
- 仕様未決定の暗号、KDF、nonce、salt、署名byte列、serializationの推測
- 浮動小数によるprotocol quantityの計算
- Symbol / NEMまたはMainnet / Testnetの暗黙変換
- Relay opaque境界、wallet-core責任、Mainnet gateの緩和
- 秘密情報のログ、例外、テスト出力、fixture、READMEへの混入
- エラーの握りつぶし、検証失敗後の処理継続、古い承認の無条件再利用

## 自己確認

- 変更した外部可視動作が承認済み仕様へ追跡できる。
- 仕様にない動作、設計、互換性、将来機能を追加していない。
- 未決定事項をASSUMPTIONとして勝手に規範化していない。
- 入力、署名対象、暗号、serialization、chain / networkを検証している。
- Secret isolation、fail-closed、permission、replay、結果対応を守っている。
- Symbol / NEM、Mainnet / Testnet、SDK / protocol、Relay / wallet-coreを混同していない。
- 正常系、該当する異常系、境界、deterministic outputをテストしている。
- fixtureと期待値の出典、未実行の検証、未確認範囲を記録している。
- 秘密情報がコード、ログ、例外、test outputへ出ない。
- 仕様フィードバック、レビュー指摘、残存リスクを正確に分類している。
