---
name: implement-author
description: MosaicLynx の TypeScript 実装、Extension、SDK、Relay、chain adapter、backup / protocol package を、承認済み仕様・要件・設計に従って実装または修正する。外部 wallet-core 契約と binding 境界を含む変更に使用し、仕様にない外部可視動作を追加しない。
---

# Implementation Author

承認済み仕様を MosaicLynx の TypeScript コードとテストへ反映する。対象は `apps/*` と
`packages/*` であり、対象 package の manifest、公開 export、実装、テスト、fixture の責務を
守る。`_snwc` の `symbol-nem-wallet-core` 実装は外部コンポーネントであり、MosaicLynx 側で
鍵管理・暗号・導出・raw signing を再実装しない。仕様にない外部可視動作を推測で実装しない。

## 作業開始時に読む資料

1. `AGENTS.md`
2. `../author-common/author-playbook.md`
3. 対象機能の `docs/specifications/` と `docs/design/`
4. `docs/requirements/`、適用可能な ADR、対応する公開レビュー
5. 対象 app / package の `package.json`、`tsconfig.json`、公開 export、`src/`、テスト、fixture、build script
6. `docs/specifications/chain-compatibility-spec.md` と、Symbol / NEM の事実確認に必要な公式資料
7. 外部 wallet-core / Binding の契約を対象にする場合だけ、`_snwc` の repository instructions と MosaicLynx 側の該当設計・仕様

`docs/design/` の設計判断と仕様に競合があれば、実装で補完せず未決定事項または仕様フィードバックとして分離する。

## 対象と変更範囲

- ユーザーが明示した app、package、ファイル、機能だけを対象にする。
- MosaicLynx の実装対象は `apps/*` と `packages/*`。未指定で複数の app / package が候補になる場合は対象を推測しない。
- `_snwc` は外部 wallet-core であり、root repository の TypeScript package として扱わない。そこを直接変更する依頼では、対象ディレクトリの instructions を別途適用する。
- 生成物、`dist/`、WASM asset、extension bundle は実際の package script と仕様が正本である場合だけ更新し、生成物を直接編集して正本にしない。
- 仕様、README、設計、テスト、fixtureを変更する必要がある場合は、依頼範囲と各ファイルの正本を確認する。レビュー成果物を作成・上書きしない。
- 新しい依存関係、公開 API、設定、JSON / backup / Relay field、fallback、互換動作を、便利さや将来拡張だけを理由に追加しない。

## 実装前ゲート

コードを書く前に、対象仕様から次を確認する。

- 入力、出力、公開 export、型、必須性、ownership、error、warning
- Profile、Account、Wallet Store、Pending Profile、backup の opaque 契約、replacement、atomicity、version、resource limit
- validation、正規化、状態、重複、処理順序、失敗時の結果
- Mnemonic、private key、public key、signature、address、hash の表現・長さ・raw bytes / text 境界
- 署名対象 byte 列、canonical serialization、encoding、byte order、数量、Chain、Network
- Relay の encrypted payload と、署名機による transaction 内容解析の責務分離
- 暗号化対象、AAD、nonce、salt、tag、KDF、乱数、認証失敗、秘密情報の保持期間
- Extension の privileged boundary、Provider / dApp 境界、承認 UI、SDK の transport 非依存契約
- Native C ABI / WASM Binding は対象に含む場合だけ、その external wallet-core 契約、入力形式、出力 ownership、error 境界
- unknown type / version / field、malformed、truncated、duplicate、wrong chain / network の扱い
- 固定 vector、fixture、適合試験、実行すべき package script

外部可視動作や安全性に影響する事項が根拠なく決められない場合は、実装を続けず、
`docs/reviews/implementation/<対象ベース名>-feedback-NNN.md` に仕様フィードバックとして新規作成する。
対象ベース名ごとの最大番号の次を使い、既存成果物を上書きしない。内部実装の選択だけなら、
外部動作を変えない範囲で選び、不要な公開抽象化を追加しない。

## 実装上の規則

### 仕様適合

- 仕様の必須、禁止、任意を区別してコードへ反映する。
- 外部入力を使用前に検証し、検証済みの型だけを下流へ渡す。
- strict TypeScript、既存の ESM / export、workspace dependency、既存の error / result パターンを維持する。
- `number` / `bigint`、`Buffer` / `Uint8Array`、hex string / raw bytes の変換は仕様・既存型・fixtureへ追跡する。
- 正常系、異常系、境界、状態、error、replacement の結果を仕様どおりに実装する。
- 入力 Store、backup、Relay payload を直接変更せず、仕様が定める成功時の replacement と失敗時の未変更条件を守る。
- `symbol-nem-wallet-core` が所有する結果、error、opaque data を SDK、Extension、Relay、chain adapter または Binding で勝手に変換・拡張しない。
- 署名、保存、export、削除、announce を認証・検証・対象一致の前に実行しない。Relay は opaque transport の責務を越えて内容を解釈しない。

### セキュリティ

- 秘密鍵、Mnemonic、Profile password、導出鍵、平文 Store、復号データをログ、例外、warning、debug出力へ出さない。
- 秘密情報を不要な主体へ渡さず、SDK / Provider / Extension / Relay の境界で仕様にない secret copy を増やさない。
- 暗号、署名、serialization、乱数、AEAD、KDF、nonce、salt は仕様と既存の固定依存に従い、独自方式を追加しない。
- 認証失敗、改ざん、破損、wrong chain / network、invalid length では処理と状態変更を継続しない。
- Browser host、dApp、Relay、external node からの入力を信用せず、承認・signing authority・Account の対応を確認する。

### Symbol / NEM

- Symbol と NEM、Mainnet と Testnet を暗黙に共通化しない。
- `@nemnesia/symbol-sdk` `3.3.2-pure.2` は現行の互換性基準であり、SDK の利便 API の挙動だけを protocol 仕様とみなさない。
- public key、private key、signature、hash、address の長さと表現、raw bytes と hex / text を確認する。
- HD導出、署名対象、address生成、network値、byte order は `docs/specifications/chain-compatibility-spec.md`、公式資料、固定 fixtureへ追跡する。
- ブロックチェーン数量の計算に浮動小数を使わない。

### 外部 wallet-core / Binding 境界

- MosaicLynx は外部 wallet-core の鍵管理、秘密情報処理、chain-specific key、raw signing の実装責任を代替しない。
- Native C ABI / WASM Binding を扱う場合も、仕様に定められた buffer、DTO、error、ownership の境界変換に限定し、秘密情報管理や署名意味判断を重複実装しない。
- WASM の `Uint8Array` や JavaScript 側のコピーが自動 zeroize されるとは扱わず、公開範囲を仕様どおりに保つ。

## テスト方針

対象仕様に応じ、必要なテストを対象 package / app の既存パターンで追加・更新する。

- 正常、最小、境界、Mainnet / Testnet、Symbol / NEM、deterministic output
- malformed、truncated、invalid length、resource limit、duplicate、unknown version / enum / field
- wrong password、wrong chain / network、invalid mnemonic / private key、tampered store、invalid tag
- atomicity、重複登録、password change、削除、export、replacement Store、再利用禁止
- Extension の Provider / approval / origin 境界、Relay の opaque encrypted payload、SDK の transport 差異
- 署名 byte 列、address、公開鍵、HD導出の独立した fixed vector / interop fixture

期待値を実装ロジックの単純な複製で生成しない。fixtureの出典を記録し、秘密値をテスト出力や
fixture に含めない。coverageの任意の数値目標を新設しない。

## 実装手順と検証

1. 対象、仕様、変更境界、既存ユーザー変更を確認する。
2. 仕様から外部可視動作と検証条件を抽出する。
3. 実装前ゲートで不足・矛盾・未決定事項を分類する。
4. 必要なら仕様フィードバックを作成し、決定前の外部動作を実装しない。
5. 対象 app / package の責務、依存方向、公開 export、テストを確認して最小変更を実装する。
6. 仕様に対応する正常系・異常系・境界テストを追加・更新する。
7. ルート `AGENTS.md` の `## 検証` と対象 package / app の script に従い、変更に該当する formatter、lint、typecheck、test、build だけを実行する。
8. 未実行の検証、未確認の protocol 事実、残存リスク、仕様フィードバックを報告する。

docs-only または agent / skill-only の作業では、コード、manifest、dependency、build configuration、
test、fixture に変更がない限り、app / package の実装テストを実行しない。Extension、Relay、SDK、
chain adapter、backup / protocol、release evidence に影響する場合は、ルート `AGENTS.md` と対象
package の filter script を適用する。環境や外部 node が不足する場合は未実行理由を明記する。

## 自己確認

- 変更した外部可視動作が承認済み仕様へ追跡できる。
- Extension / SDK / Relay / chain adapter / external wallet-core の責務、依存、秘密情報境界を守っている。
- Symbol / NEM、Mainnet / Testnet、SDK / protocol、raw bytes / text を混同していない。
- Wallet Store / Pending Profile / Relay payload の opaque 契約、atomicity、replacement を守っている。
- 仕様にない機能、API、field、error、fallback、将来拡張を追加していない。
- 正常系だけでなく該当する異常系・境界・相互運用性を検証している。
- 秘密情報がコード、ログ、例外、error、warning、fixture、test outputへ出ていない。
- 実行した検証と未検証範囲を区別して報告できる。

## 作業完了後の Git 運用

`../author-common/author-playbook.md` の「完了と Git」を適用する。
