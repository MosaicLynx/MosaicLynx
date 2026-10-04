# MosaicLynx wallet-core 統合仕様

## 1. 正式実装と範囲

本書は Signer の内部 DTO と完成済み `@nemnesia/symbol-nem-wallet-core` の公開 API の境界の正本である。依存状態はコミット `4c4407e9255857b6d28748e33a2d6ec290776f43`、マニフェストバージョン `0.2.0` に固定する。バージョンの一致だけでは配布成果物の同一性を証明せず、リリース時はコミット / 成果物完全性を照合する。

正本は固定コミットの [型宣言](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/packages/wallet-core/src/index.d.ts)、[ファサード仕様](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/npm-typescript-facade.md)、[コア仕様](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/specification.md)、[RN 仕様](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/react-native.md) とする。MosaicLynx はコアを再実装・変更しない。

```text
信頼されていない要求 → 所有する通常のデータ DTO → スキーマ / 意味上の内容検査
→ 厳密な対象 / 公開アカウント / 対象範囲 / 利用者承認 / 四条件
→ Signer が所有するアダプター → 正式 API の get_public_account / sign
→ 生の署名検証 → 公開署名応答
```

アダプターはフィールド / バイト表現の明示変換と既存公開 API 呼出しだけを担う。秘密鍵管理、鍵導出演算、ストア暗号・復号、生の署名基本機構を持たない。`symbol-sdk` は秘密鍵不要の解析、extractSigningPayload、ハッシュ、公開署名検証、要約、シリアライズに限る。コアが提供する公開識別情報 / 導出はコアを使用する。

## 2. 秘密情報処理と利用可能 API

MosaicLynx の Signer、SDK、チェーンアダプター、レンダラー、UI は秘密鍵、ニーモニック、シード、復号されたウォレットストアを取得・保持しない。通常署名に `export_private_key` / `export_mnemonic` を使用しない。生の秘密情報を公開 DTO、エラー、ログ、クリップボード、URL、キャッシュ、承認レコードに含めない。パスワードは信頼された Signer の現在の操作に必要な UTF-8 バイト列としてだけ扱い、ページ / SDK / Relay に要求・返却・保存しない。

コアファサードの公開16関数は次のとおりであり、API の存在と MosaicLynx からの呼出し許可を区別する。

| API                        | 正式戻り値                        | MosaicLynx の利用                                                                              |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| create_empty_store         | Uint8Array                        | 内容を解釈しない空ストアの作成。これだけでは署名アカウントは存在しない                         |
| prepare_generated_profile  | ReadResult<PreparedProfile>       | mnemonic_utf8 を返すため現行 Signer から呼ばない                                               |
| finalize_generated_profile | MutationResult<ProfileInfo>       | 秘密情報を含む prepare / 受け渡しを要するため現行初期設定として呼ばない                        |
| restore_profile            | MutationResult<ProfileInfo>       | mnemonic_utf8 を入力するため現行 Signer から呼ばない                                           |
| list_profiles              | ReadResult<ProfileInfo[]>         | 未認証索引。選択候補のみ                                                                       |
| export_mnemonic            | ReadResult<MnemonicExport>        | 禁止。署名・表示・復旧の回避策にしない                                                         |
| export_private_key         | ReadResult<PrivateKeyExport>      | 禁止。SDK 署名に使用しない                                                                     |
| list_software_keys         | ReadResult<SoftwareKeyListItem[]> | 未認証索引。選択候補のみ                                                                       |
| derive_software_key        | MutationResult<SoftwareKeyInfo>   | コアが既存プロファイル内で導出。秘密は返らない                                                 |
| import_software_key        | MutationResult<SoftwareKeyInfo>   | 生の private_key 入力のため現行 Signer から呼ばない                                            |
| generate_software_key      | MutationResult<SoftwareKeyInfo>   | コア内で生成。秘密は返らないが、現行アプリケーションアカウントオリジンスキーマ外のため呼ばない |
| get_public_account         | ReadResult<PublicAccountInfo>     | パスワード認証付き公開識別情報                                                                 |
| sign                       | ReadResult<Signature>             | 全対応済みの署名操作の唯一の署名 API                                                           |
| change_profile_password    | MutationResult<null>              | コア内で再暗号化。アプリケーションは置き換えの保管のみ                                         |
| delete_software_key        | MutationResult<null>              | コアに削除委譲。アプリケーションメタデータを同期                                               |
| delete_profile             | MutationResult<null>              | コアに削除委譲。関連要求 / 許可を失効                                                          |

コア `0.2.0` 自体はニーモニック / 秘密鍵インポート / エクスポートを提供するが、その戻り値は MosaicLynx の許可された境界に入らない。コアは UI や秘密を渡さない初期設定 API を提供しない。現行 MosaicLynx の署名契約は、コアの正式契約で事前に用意された内容を解釈しないストアを前提とする。ストアのないインストールでは署名不可であり、新規ユーザー初期設定を提供できるというリリース判定には使わない。新規ニーモニック作成・表示・復元・生の鍵インポート / エクスポートは現行 MosaicLynx UI の対応済みの操作に含めない。これらを再提供するには生の秘密情報を MosaicLynx に返さない別の正式な統合契約が必要であり、本仕様はその実装・API が存在すると仮定しない。

## 3. プロファイル / アカウントと認証済み識別情報

アプリケーションプロファイルは一つのチェーン / ネットワークに固定し、Signer 内に一つのコアプロファイル UUID を関連付ける。一つのコアプロファイルを複数のアプリケーションプロファイルに共有しない。コアプロファイルはネットワーク固定、ソフトウェア鍵ごとチェーン固定という正式契約を変更せず、アプリケーションは対象チェーンの鍵だけを関連付ける。異なるチェーンの鍵が同じコアプロファイルの索引に存在しても自動公開・選択・署名しない。

アプリケーションアカウントごとに、そのアプリケーションプロファイルのコア `profile_id` とコア `key_id`（ともにハイフン区切り UUID）の組を内部で保持する。許可の accountId はアプリケーションアカウントの ID でありコア鍵 UUID ではない。SDK / Provider / Relay / dApp にこの組・内容を解釈しない経路選択ハンドルを公開せず、呼び出し元は鍵選択判断権限を持たない。

```ts
get_public_account(
  store: Uint8Array,
  profile_id: string,
  key_id: string,
  requested_context: { chain: 'symbol' | 'nem'; network: 'mainnet' | 'testnet' },
  password_utf8: Uint8Array,
): PublicAccountResult;
```

これは正式関数の型の抜粋であり新しいラッパー API ではない。`value` の `key_id`、`chain`、`network`、`public_key`（生の 32 バイト列）、`address` を選択した内部対象 / 対象範囲と照合する。公開アカウントは `chain / network / address / publicKey` に射影し、publicKey は生バイト列の小文字 hex 64桁とする。事前の一覧索引、キャッシュ、dApp の expectedSignerPublicKey だけで認証済み識別情報としない。正しいパスワードは四条件・利用者承認の代替ではない。

スカラー引数の `Network.TESTNET = 0`、`Network.MAINNET = 1`、`Chain.NEM = 0`、`Chain.SYMBOL = 1` と、DTO 文脈の文字列列挙型は別表現である。トランザクションのネットワークバイト `0x68 / 0x98` をコアスカラー引数に渡さない。AccountIndex は有限の整数 `0..2147483647`。derive は `(store, profile_id, password_utf8, Chain, account_index)`、generate は `(store, profile_id, password_utf8, Chain)` の正式順序を使う。

## 4. 承認済み操作 → コア SigningRequest

```ts
// 正式な @nemnesia/symbol-nem-wallet-core 契約の抜粋
interface SigningRequest {
  target: {
    profile_id: string;
    key_id: string;
    context: { chain: 'symbol' | 'nem'; network: 'mainnet' | 'testnet' };
  };
  payload: Uint8Array;
  approval: { status: 'not_approved' | 'approved' };
}

sign(store: Uint8Array, request: SigningRequest, password_utf8: Uint8Array): SignatureResult;
```

Signer が所有するアダプターは [インターフェース §12](./interfaces.md) の正規化済み DTO から、同一要求 / 呼び出し元 / プロファイル / 許可済みのアカウント / 対象範囲 / 対象 / 鮮度 / 内容検査 / 四条件に結び付けした上記要求を構築する。`approval.status = 'approved'` は現在の対象と厳密な署名バイト列に明示承認が成立し、直前再確認が成功した時だけ設定する。dApp / SDK / Relay の承認フィールドを転送・信用しない。コアは承認 assertion の鮮度、オリジン、要求 ID、UI の事実を独立検証しない。

| 論理的な操作              | コア request.payload の厳密なバイト列                                                      | 内容検査対象                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| TRANSACTION_SIGN / Symbol | 検証済みトランザクションの SymbolFacade.extractSigningPayload(トランザクション)            | 完全未署名のトランザクションと全埋め込み                      |
| TRANSACTION_SIGN / NEM    | 検証済みトランザクションの NemFacade.extractSigningPayload(トランザクション)               | 完全未署名のトランザクション / 内部                           |
| COSIGNATURE_SIGN / Symbol | 検証・表示済み全体署名済み親に対する SymbolFacade.hashTransaction(親).bytes（32 バイト列） | 全体親、連署者、ネットワーク、役割                            |
| COSIGNATURE_SIGN / NEM    | 検証済み未署名の CosignatureV1 の NemFacade.extractSigningPayload(トランザクション)        | 全体署名済みマルチシグ親と CosignatureV1                      |
| MESSAGE_SIGN              | ASCII `MOSAICLYNX\0MESSAGE\0V1\0` + UTF8(JCS(StructuredMessage))                           | [インターフェース §9.4](./interfaces.md) の正規メッセージ全体 |

表のバイト列は [チェーン互換性 §6](./chain-compatibility-spec.md) を正本とする。通信上のトランザクション hex 全体を未解析で `sign` へ渡さない。Symbol の世代ハッシュは extractSigningPayload が含めるため二重付加しない。Symbol 連署の内部32-byte ハッシュは Signer 自身が全体親から計算したものだけであり、外部ハッシュのみ要求の許可ではない。

コアペイロード / ストア / パスワードは `Uint8Array`。hex 文字列、JS バイト配列、BigInt、SDK KeyPair / PrivateKey / アカウントを渡さない。生の署名バイト列は非共有の所有するバイト列で最大1 MiB、内容を解釈しないストアは最大16 MiB。トランザクション 256 KiB / メッセージ 16 KiB / エンベロープのより厳しい制限も適用する。範囲外・未解析要求はコア呼出し前に拒否する。

`unlock`、`lock`、`verify_password`、`signTransaction`、`cosignTransaction`、`signMessage` というコア公開 API はない。ロック解除と認証 / アカウントの利用認可は Signer 内の判定条件であり、保護されたコア操作は各呼出しでパスワードを認証する。コアパスワードキャッシュ / ロック解除済みセッションを仮定せず、パスワードバイト列は操作終了時に上書きして参照を破棄し、承認 / 永続化済みの状態に保持しない。

## 5. SignatureResult → 公開結果

コア `sign` は同期的に `ReadResult<Signature>`、すなわち `{ value: { signature: Uint8Array }, warnings: DecodeWarning[] }` を返す。署名は生の 64 バイト列。署名済みペイロード / ハッシュ / Signer / 要求 ID / 操作 / 配送処理結果の区分は返さない。ストアは変更されない。

Signer は結果を所有するバイト列として受け、長さ64、選択アカウントの公開鍵、厳密な署名バイト列、チェーン固有の検証者による署名検証を必須とする。生の警告を外部へ転送しない。固定コアの警告が一つでもある場合、索引 / ストアの継続を許可せず要求を安全側へ終了する。署名呼び出し前の警告は `FAILED` / `INTERNAL_ERROR`。呼び出し後に有効な署名済み結果を確定できれば成功として既知結果を保持し、警告を理由に未署名 / 失敗へ縮退しない。確定できなければ §7 の RESULT_UNKNOWN とする。いずれも後続のストア利用を停止し、自動再署名しない。

- トランザクション: 元の所有するトランザクションの署名フィールドへ検証済み署名だけを設定し SDK ファクトリーでシリアライズ / デシリアライズ、公開ハッシュを計算する。元の全フィールド / Signer / ネットワークを再比較し [インターフェース §9.6](./interfaces.md) の SignedTransaction を返す。
- Symbol 連署署名: parentHash、連署者公開鍵、署名を小文字 hex にし、バージョン `'0'`、分離されたと元対象範囲を [インターフェース §9.6.1](./interfaces.md) の結果に組み立てる。親や埋め込みを変更しない。
- NEM 連署署名: 元の CosignatureV1 の署名フィールドだけを設定した SignedTransaction と親ハッシュ / 対象範囲を同節の結果に組み立てる。親本体に勝手に追記しない。
- メッセージ: 検証済み署名 / signerPublicKey / SHA-256(署名バイト列) の小文字 hex と、同じ正規 StructuredMessage を SignedData とする。返却後も検証者は要求 / オリジン / 対象範囲 / ノンス / 期限切れ / 期待される Signer / 厳密なバイト列を独立照合する。

返却値が不正な形式の、署名検証不能、結果変換が失敗した場合、署名が行われなかったと推測しない。厳密なバイト列 / 選択済みの鍵に対して検証済み生の署名と不変対象を保持できれば署名生成は既知の成功であり成功を維持する。公開 DTO の組立て・シリアライズ・配送だけが失敗しても RESULT_UNKNOWN へ縮退せず、配送確定不能は DELIVERY_UNKNOWN とする。復旧では保持済み署名 / 対象から同じ公開結果を再構成するだけでコア署名を再呼出ししない。生成結果そのものを確認・復元できない呼び出し後失敗だけを RESULT_UNKNOWN とする。無効な署名 / 不正な形式の DTO を成功応答として外部へ返さない。

## 6. バックエンド / 同期契約

| 実行環境         | 正式 entry / 契約                                                                               | 安全側処理                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ノードネイティブ | パッケージルートの node-addons 条件、同期16関数                                                 | 有効なマニフェストに対象がない場合の package-local WASM 初期選択のみ許可。負荷 / 呼び出し失敗後の WASM 再試行禁止 |
| ブラウザ WASM    | パッケージルート既定。モジュール evaluation / 初期化は非同期になり得るが完了後の16関数は同期    | 初期化完了前は利用不能。リモートコード / 生バインディングを追加しない                                             |
| React ネイティブ | react-native 条件、新規アーキテクチャ TurboModule / JSI provider、同じ同期16関数 / DTO / エラー | provider / 実行環境 / 登録簿 / ライフサイクル無効化を継続利用せず、ノード / WASM 代替経路禁止                     |

SDK / 通信経路保証とコア同期関数を混同しない。非同期処理の調整を使っても actual `sign` 呼び出しの開始を Signer が記録し、タイムアウト / キャンセルで第二の呼出しを作らない。RN のネイティブ provider setup は正式パッケージの契約に従い、モバイルアプリが実装済みとは扱わない。

## 7. エラー、警告、不明状態

コア操作エラーは `Error`、`name === 'WalletCoreError'`、18の既知 `code`、`message === code` の正式形を検証する。実行環境エラークラスエクスポートを仮定しない。初期化エラーは `name === 'WalletCoreBackendInitializationError'`、`message === 'backend initialization failed'`、コアコードなしである。

以下の公開コードは [受け渡し §10](./web-transaction-handoff-spec.md) の既存集合を使用する。論理的な分類は Signer 内のな原因分類であり、新しい通信上のフィールドを加えない。

| コアエラー / 条件                                                                                     | 論理的な分類          | 確定時状態 / 公開コード                                                                      |
| ----------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| Signer 内のロック済み                                                                                 | locked                | FAILED / VAULT_LOCKED。署名は呼ばない                                                        |
| ProfileNotFound / SoftwareKeyNotFound                                                                 | account_unavailable   | FAILED / CONTEXT_CHANGED                                                                     |
| AuthenticationFailed                                                                                  | authentication_failed | FAILED / INTERNAL_ERROR。承認 / 認証失効、パスワード成否の詳細を外部へ返さない               |
| NetworkMismatch                                                                                       | network_mismatch      | FAILED / NETWORK_MISMATCH。固定チェーンの不一致が Signer 側で確認できた場合は CHAIN_MISMATCH |
| InvalidArgument / InvalidAccountIndex                                                                 | invalid_request       | FAILED / INVALID_PARAMS                                                                      |
| InvalidStore / UnsupportedStoreVersion / UnsupportedProfileSchemaVersion                              | internal_failure      | FAILED / INTERNAL_ERROR。ストアの内部情報を露出しない                                        |
| CryptoFailure / RandomSourceFailure / SerializationFailure                                            | signing_failed        | 失敗確定時だけFAILED / INTERNAL_ERROR                                                        |
| InvalidMnemonic / InvalidPrivateKey / DuplicateProfile / DuplicateSoftwareKey / PendingProfileInvalid | internal_failure      | 署名経路には到達しない契約 violation。失敗確定時だけFAILED / INTERNAL_ERROR                  |
| BindingFailure / 読み取り不能な出力 / 不明コード / 予期しない例外 / 結果変換失敗                      | internal_failure      | 呼び出し前はFAILED / INTERNAL_ERROR。呼び出し後は下記確定性ルール                            |
| BackendInitializationError                                                                            | unsupported           | 呼び出し前 FAILED / 利用不能。署名呼び出し自体は行わない                                     |

正式なコア検証エラーで署名が生成されていないことを契約上確定できる場合だけ失敗とする。BindingFailure は出力割り当て / 変換 / ライフサイクルの失敗も含むためコードだけで未実行を断定しない。例外構造を信頼できない場合、署名開始後の未知例外、プロセス消失、完了欠落は Signer が生成の成否を復元できなければ RESULT_UNKNOWN とする。生のコア例外 / 警告 / 原因 / スタック / パスワード / ストア / 内部 UUID を公開エラーにコピーしない。

Signer が `sign` を一度も呼んでいないと確実に把握する場合だけ署名未開始として期限切れ / キャンセル済みを確定できる。呼び出し後のタイムアウトは、その事象だけでは未署名としない。有効な署名済み結果を既に持つ時は成功、Signer が配送結果を確定できない場合は DELIVERY_UNKNOWN。SDK / Relay / Provider のタイムアウト / 受領確認欠如は処理結果の区分判断権限を持たず transport_failure として扱う。既知結果の復旧は同一要求 / 受信者への再送 / 取得だけで再署名しない。

## 8. ストア所有責任、置き換え、適合性

事前準備は信頼されたホストがローカルに受け取った暗号化済みストアに限る。dApp / SDK / Relay の署名要求にストアやコア ID を含めて登録してはならない。受入れ前に16 MiB上限、所有するバイト列を確認し、正式 list_profiles / list_software_keys を候補として読み、利用者の明示選択と get_public_account のパスワード認証後にだけ §3 の内部関連付けを登録する。既存ストアを自動上書き・統合せず、検証失敗時は旧状態を維持する。この事前準備はニーモニック / 生の鍵初期設定や未確定の完全バックアップ形式ではない。

ストアは暗号化済み内容を解釈しない `Uint8Array` として保管・コピーできる。アプリケーションメタデータ / アカウント関連付けをストア内部へ埋め込まず、CBOR、KDF、暗号化フィールド、秘密情報を解析・変更・複製しない。変更結果の `store` は完全置き換えとして永続化成功後だけ原子的に採用する。失敗時は旧確定ストア / メタデータを維持し、関連認可を失効させる。

適合確認では、各操作の厳密なバイト列 / 生の署名 / 公開結果、誤ったプロファイル / 鍵 / チェーン / ネットワーク、誤ったパスワード、ロック済み、警告、不正な形式の署名、BindingFailure、初期化失敗、三つのバックエンドの同一 DTO を確認する。署名呼出しが要求ごとに最大一回、外部ゲッター / 変更が表示・署名バイト列を変えないこと、秘密情報エクスポートを呼ばないことを独立判定する。固定ベクターの期待バイト列はチェーン互換性 §7 とコアの公開既知ベクターに追跡する。秘密情報を含むフィクスチャを本番環境実行環境に載せない。

本書の根拠は今回の明示された秘密情報境界と正式コア状態、CR-008 / CR-013 / CR-016 / CR-NFR-004、アーキテクチャ §6.8、インターフェース §9 / §12 / §15、チェーン互換性 §6 である。レビュー 005 の SR-006 / SR-007 の受け入れ条件への対応であり、コアの内部設計・暗号方式を変更しない。
