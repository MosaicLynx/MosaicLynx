# MosaicLynx wallet-core Integration Specification

## 1. 正式実装と範囲

本書は Signer の internal DTO と完成済み `@nemnesia/symbol-nem-wallet-core` の公開 API の境界の正本である。依存 state は commit `4c4407e9255857b6d28748e33a2d6ec290776f43`、manifest version `0.2.0` に固定する。version の一致だけでは配布 artifact の同一性を証明せず、release 時は commit / artifact integrity を照合する。

正本は固定 commit の [型宣言](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/packages/wallet-core/src/index.d.ts)、[facade specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/npm-typescript-facade.md)、[Core specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/specification.md)、[RN specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/react-native.md) とする。MosaicLynx は Core を再実装・変更しない。

```text
untrusted request → owned plain-data DTO → schema / semantic inspection
→ exact target / public Account / Scope / user approval / 四条件
→ Signer-owned adapter → official get_public_account / sign
→ raw signature validation → public Signing Response
```

adapter は field / byte representation の明示変換と既存公開 API 呼出しだけを担う。秘密鍵管理、鍵導出演算、Store 暗号・復号、raw signing primitive を持たない。`symbol-sdk` は秘密鍵不要の parse、extractSigningPayload、hash、公開署名検証、summary、serialization に限る。core が提供する公開 identity / derivation は core を使用する。

## 2. Secret handling と利用可能 API

MosaicLynx の Signer、SDK、chain adapter、renderer、UI は private key、Mnemonic、seed、decrypted Wallet Store を取得・保持しない。通常 signing に `export_private_key` / `export_mnemonic` を使用しない。raw secret を public DTO、error、log、clipboard、URL、cache、approval record に含めない。password は trusted Signer の現在の操作に必要な UTF-8 bytes としてだけ扱い、page / SDK / Relay に要求・返却・保存しない。

core facade の公開16関数は次のとおりであり、API の存在と MosaicLynx からの呼出し許可を区別する。

| API                        | 正式戻り値                        | MosaicLynx の利用                                                                        |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| create_empty_store         | Uint8Array                        | opaque 空 Store の作成。これだけでは署名 Account は存在しない                            |
| prepare_generated_profile  | ReadResult<PreparedProfile>       | mnemonic_utf8 を返すため現行 Signer から呼ばない                                         |
| finalize_generated_profile | MutationResult<ProfileInfo>       | secret-bearing prepare / handoff を要するため現行 onboarding として呼ばない              |
| restore_profile            | MutationResult<ProfileInfo>       | mnemonic_utf8 を入力するため現行 Signer から呼ばない                                     |
| list_profiles              | ReadResult<ProfileInfo[]>         | 未認証 index。選択候補のみ                                                               |
| export_mnemonic            | ReadResult<MnemonicExport>        | 禁止。署名・表示・復旧の workaround にしない                                             |
| export_private_key         | ReadResult<PrivateKeyExport>      | 禁止。SDK signing に使用しない                                                           |
| list_software_keys         | ReadResult<SoftwareKeyListItem[]> | 未認証 index。選択候補のみ                                                               |
| derive_software_key        | MutationResult<SoftwareKeyInfo>   | core が既存 Profile 内で導出。秘密は返らない                                             |
| import_software_key        | MutationResult<SoftwareKeyInfo>   | raw private_key 入力のため現行 Signer から呼ばない                                       |
| generate_software_key      | MutationResult<SoftwareKeyInfo>   | core 内で生成。秘密は返らないが、現行 Application Account origin schema 外のため呼ばない |
| get_public_account         | ReadResult<PublicAccountInfo>     | password 認証付き公開 identity                                                           |
| sign                       | ReadResult<Signature>             | 全 supported signing operation の唯一の署名 API                                          |
| change_profile_password    | MutationResult<null>              | core 内で再暗号化。Application は replacement の保管のみ                                 |
| delete_software_key        | MutationResult<null>              | core に削除委譲。Application metadata を同期                                             |
| delete_profile             | MutationResult<null>              | core に削除委譲。関連 request / permission を失効                                        |

core `0.2.0` 自体は Mnemonic / private-key import / export を提供するが、その戻り値は MosaicLynx の許可された境界に入らない。core は UI や秘密を渡さない onboarding API を提供しない。現行 MosaicLynx の Signing contract は、core の正式契約で事前に用意された opaque Store を前提とする。Store のないインストールでは署名不可であり、新規ユーザー onboarding を提供できるという release 判定には使わない。新規 Mnemonic 作成・表示・復元・raw key import / export は現行 MosaicLynx UI の supported operation に含めない。これらを再提供するには raw secret を MosaicLynx に返さない別の正式な統合契約が必要であり、本仕様はその実装・API が存在すると仮定しない。

## 3. Profile / Account と authenticated identity

Application Profile は一つの Chain / Network に固定し、Signer-local に一つの core Profile UUID を関連付ける。一つの core Profile を複数の Application Profile に共有しない。core Profile は Network 固定、Software Key ごと Chain 固定という正式契約を変更せず、Application は対象 Chain の key だけを関連付ける。異なる Chain の key が同じ core Profile の index に存在しても自動公開・選択・署名しない。

Application Account ごとに、その Application Profile の core `profile_id` と core `key_id`（ともにハイフン区切り UUID）の組を内部で保持する。permission の accountId は Application Account の ID であり core key UUID ではない。SDK / Provider / Relay / dApp にこの組・opaque routing handle を公開せず、caller は key 選択 authority を持たない。

```ts
get_public_account(
  store: Uint8Array,
  profile_id: string,
  key_id: string,
  requested_context: { chain: 'symbol' | 'nem'; network: 'mainnet' | 'testnet' },
  password_utf8: Uint8Array,
): PublicAccountResult;
```

これは正式関数の型の抜粋であり新しい wrapper API ではない。`value` の `key_id`、`chain`、`network`、`public_key`（raw 32 bytes）、`address` を選択した internal target / Scope と照合する。公開 Account は `chain / network / address / publicKey` に射影し、publicKey は raw bytes の lowercase hex 64桁とする。事前の list index、cache、dApp の expectedSignerPublicKey だけで authenticated identity としない。正しい password は四条件・利用者承認の代替ではない。

scalar 引数の `Network.TESTNET = 0`、`Network.MAINNET = 1`、`Chain.NEM = 0`、`Chain.SYMBOL = 1` と、DTO context の string enum は別表現である。transaction の network byte `0x68 / 0x98` を core scalar 引数に渡さない。AccountIndex は finite integer `0..2147483647`。derive は `(store, profile_id, password_utf8, Chain, account_index)`、generate は `(store, profile_id, password_utf8, Chain)` の正式順序を使う。

## 4. Approved operation → core SigningRequest

```ts
// official @nemnesia/symbol-nem-wallet-core contract の抜粋
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

Signer-owned adapter は [Interfaces §12](./interfaces.md) の normalized DTO から、同一 request / caller / Profile / permitted Account / Scope / target / freshness / inspection / 四条件に binding した上記 request を構築する。`approval.status = 'approved'` は現在の target と exact signing bytes に明示承認が成立し、直前再確認が成功した時だけ設定する。dApp / SDK / Relay の approval field を転送・信用しない。core は approval assertion の freshness、Origin、request ID、UI の事実を独立検証しない。

| Logical operation         | core request.payload の exact bytes                                                               | inspection target                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| TRANSACTION_SIGN / Symbol | 検証済み transaction の SymbolFacade.extractSigningPayload(transaction)                           | 完全 unsigned transaction と全 embedded                      |
| TRANSACTION_SIGN / NEM    | 検証済み transaction の NemFacade.extractSigningPayload(transaction)                              | 完全 unsigned transaction / inner                            |
| COSIGNATURE_SIGN / Symbol | 検証・表示済み full signed parent に対する SymbolFacade.hashTransaction(parent).bytes（32 bytes） | full parent、cosigner、network、role                         |
| COSIGNATURE_SIGN / NEM    | 検証済み unsigned CosignatureV1 の NemFacade.extractSigningPayload(transaction)                   | full signed multisig parent と CosignatureV1                 |
| MESSAGE_SIGN              | ASCII `MOSAICLYNX\0MESSAGE\0V1\0` + UTF8(JCS(StructuredMessage))                                  | [Interfaces §9.4](./interfaces.md) の canonical message 全体 |

表の bytes は [Chain Compatibility §6](./chain-compatibility-spec.md) を正本とする。wire transaction hex 全体を未解析で `sign` へ渡さない。Symbol の generation hash は extractSigningPayload が含めるため二重付加しない。Symbol cosigning の内部32-byte hash は Signer 自身が full parent から計算したものだけであり、外部 hash-only request の許可ではない。

core payload / Store / password は `Uint8Array`。hex string、JS byte array、BigInt、SDK KeyPair / PrivateKey / Account を渡さない。raw signing bytes は非共有の owned byte 列で最大1 MiB、opaque Store は最大16 MiB。transaction 256 KiB / message 16 KiB / envelope のより厳しい制限も適用する。範囲外・未解析 request は core 呼出し前に拒否する。

`unlock`、`lock`、`verify_password`、`signTransaction`、`cosignTransaction`、`signMessage` という core public API はない。unlock と Authentication / Account authorization は Signer-local gate であり、protected core operation は各呼出しで password を認証する。core password cache / unlocked session を仮定せず、password bytes は操作終了時に上書きして参照を破棄し、approval / persisted state に保持しない。

## 5. SignatureResult → public result

core `sign` は同期的に `ReadResult<Signature>`、すなわち `{ value: { signature: Uint8Array }, warnings: DecodeWarning[] }` を返す。signature は raw 64 bytes。signed payload / hash / signer / request ID / operation / delivery disposition は返さない。Store は変更されない。

Signer は結果を owned bytes として受け、長さ64、選択 Account の public key、exact signing bytes、Chain-specific Verifier による signature 検証を必須とする。raw warnings を外部へ転送しない。固定 core の warning が一つでもある場合、index / Store の継続を許可せず request を安全側へ終了する。sign invocation 前の警告は `FAILED` / `INTERNAL_ERROR`。invocation 後に valid signed result を確定できれば SUCCEEDED として既知結果を保持し、警告を理由に unsigned / FAILED へ縮退しない。確定できなければ §7 の RESULT_UNKNOWN とする。いずれも後続の Store 利用を停止し、自動再署名しない。

- transaction: 元の owned transaction の署名 field へ検証済み signature だけを設定し SDK factory で serialize / deserialize、public hash を計算する。元の全 field / signer / network を再比較し [Interfaces §9.6](./interfaces.md) の SignedTransaction を返す。
- Symbol cosignature: parentHash、cosigner public key、signature を lowercase hex にし、version `'0'`、detached と元 Scope を [Interfaces §9.6.1](./interfaces.md) の結果に組み立てる。parent や embedded を変更しない。
- NEM cosignature: 元の CosignatureV1 の署名 field だけを設定した SignedTransaction と親 hash / Scope を同節の結果に組み立てる。parent 本体に勝手に追記しない。
- message: 検証済み signature / signerPublicKey / SHA-256(signing bytes) の lowercase hex と、同じ canonical StructuredMessage を SignedData とする。返却後も verifier は request / origin / Scope / nonce / expiry / expected signer / exact bytes を独立照合する。

返却値が malformed、signature 検証不能、result conversion が失敗した場合、署名が行われなかったと推測しない。exact bytes / selected key に対して検証済み raw signature と immutable target を保持できれば署名生成は既知の成功であり SUCCEEDED を維持する。public DTO の組立て・serialize・配送だけが失敗しても RESULT_UNKNOWN へ縮退せず、配送確定不能は DELIVERY_UNKNOWN とする。復旧では保持済み signature / target から同じ公開結果を再構成するだけで core sign を再呼出ししない。生成結果そのものを確認・復元できない post-invocation failure だけを RESULT_UNKNOWN とする。無効な signature / malformed DTO を成功 response として外部へ返さない。

## 6. Backend / synchronous contract

| runtime      | 正式 entry / contract                                                                              | 安全側処理                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Node Native  | package root の node-addons 条件、同期16関数                                                       | valid manifest に target がない場合の package-local WASM 初期選択のみ許可。load / invocation failure 後の WASM retry 禁止 |
| Browser WASM | package root default。module evaluation / initialization は async になり得るが完了後の16関数は同期 | 初期化完了前は unavailable。remote code / raw binding を追加しない                                                        |
| React Native | react-native 条件、New Architecture TurboModule / JSI provider、同じ同期16関数 / DTO / error       | provider / runtime / registry / lifecycle invalidation を継続利用せず、Node / WASM fallback 禁止                          |

SDK / transport Promise と core 同期関数を混同しない。非同期 orchestration を使っても actual `sign` invocation の開始を Signer が記録し、timeout / cancel で第二の呼出しを作らない。RN の native provider setup は正式 package の契約に従い、Mobile App が実装済みとは扱わない。

## 7. Error、warnings、unknown state

core operation error は `Error`、`name === 'WalletCoreError'`、18の既知 `code`、`message === code` の正式形を検証する。runtime error class export を仮定しない。初期化 error は `name === 'WalletCoreBackendInitializationError'`、`message === 'backend initialization failed'`、core code なしである。

以下の public code は [Handoff §10](./web-transaction-handoff-spec.md) の既存集合を使用する。logical category は Signer-local な原因分類であり、新しい wire field を加えない。

| core error / condition                                                                                | logical category      | 確定時 state / public code                                                                  |
| ----------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| Signer-local locked                                                                                   | locked                | FAILED / VAULT_LOCKED。sign は呼ばない                                                      |
| ProfileNotFound / SoftwareKeyNotFound                                                                 | account_unavailable   | FAILED / CONTEXT_CHANGED                                                                    |
| AuthenticationFailed                                                                                  | authentication_failed | FAILED / INTERNAL_ERROR。approval / auth 失効、password 成否の詳細を外部へ返さない          |
| NetworkMismatch                                                                                       | network_mismatch      | FAILED / NETWORK_MISMATCH。固定 Chain の不一致が Signer 側で確認できた場合は CHAIN_MISMATCH |
| InvalidArgument / InvalidAccountIndex                                                                 | invalid_request       | FAILED / INVALID_PARAMS                                                                     |
| InvalidStore / UnsupportedStoreVersion / UnsupportedProfileSchemaVersion                              | internal_failure      | FAILED / INTERNAL_ERROR。Store の内部情報を露出しない                                       |
| CryptoFailure / RandomSourceFailure / SerializationFailure                                            | signing_failed        | 失敗確定時だけ FAILED / INTERNAL_ERROR                                                      |
| InvalidMnemonic / InvalidPrivateKey / DuplicateProfile / DuplicateSoftwareKey / PendingProfileInvalid | internal_failure      | signing 経路には到達しない contract violation。失敗確定時だけ FAILED / INTERNAL_ERROR       |
| BindingFailure / unreadable output / unknown code / unexpected exception / result conversion failure  | internal_failure      | pre-invocation は FAILED / INTERNAL_ERROR。post-invocation は下記確定性ルール               |
| BackendInitializationError                                                                            | unsupported           | pre-invocation FAILED / UNAVAILABLE。sign invocation 自体は行わない                         |

正式な Core validation error で signature が生成されていないことを契約上確定できる場合だけ FAILED とする。BindingFailure は output allocation / conversion / lifecycle の失敗も含むため code だけで未実行を断定しない。例外 shape を信頼できない場合、sign 開始後の未知 exception、process loss、completion 欠落は Signer が生成の成否を復元できなければ RESULT_UNKNOWN とする。raw core exception / warnings / cause / stack / password / Store / internal UUID を公開 error にコピーしない。

Signer が `sign` を一度も呼んでいないと確実に把握する場合だけ signing-not-started として expired / cancelled を確定できる。invocation 後の timeout は、その事象だけでは unsigned としない。valid signed result を既に持つ時は SUCCEEDED、Signer が配送結果を確定できない場合は DELIVERY_UNKNOWN。SDK / Relay / Provider の timeout / ACK absence は disposition authority を持たず transport_failure として扱う。既知結果の recovery は同一 request / recipient への resend / retrieval だけで再署名しない。

## 8. Store ownership、replacement、conformance

事前 provision は trusted host が local に受け取った暗号化済み Store に限る。dApp / SDK / Relay の signing request に Store や core ID を含めて登録してはならない。受入れ前に16 MiB上限、owned bytes を確認し、正式 list_profiles / list_software_keys を候補として読み、利用者の明示選択と get_public_account の password 認証後にだけ §3 の内部 association を登録する。既存 Store を自動上書き・merge せず、検証失敗時は旧状態を維持する。この provision は Mnemonic / raw-key onboarding や未確定の完全 backup format ではない。

Store は暗号化済み opaque `Uint8Array` として保管・copy できる。Application metadata / Account association を Store 内部へ埋め込まず、CBOR、KDF、暗号化 field、secret を parse・変更・複製しない。mutation result の `store` は完全 replacement として永続化成功後だけ原子的に採用する。失敗時は旧確定 Store / metadata を維持し、関連 authorization を失効させる。

適合確認では、各 operation の exact bytes / raw signature / public result、wrong Profile / key / Chain / Network、wrong password、locked、warnings、malformed signature、BindingFailure、初期化失敗、三 backend の同一 DTO を確認する。sign 呼出しが request ごとに最大一回、external getter / mutation が表示・署名 bytes を変えないこと、secret export を呼ばないことを独立判定する。fixed vector の期待 bytes は Chain Compatibility §7 と core の公開既知 vector に追跡する。secret-bearing fixture を production runtime に載せない。

本書の根拠は今回の明示された secret boundary と正式 core state、CR-008 / CR-013 / CR-016 / CR-NFR-004、Architecture §6.8、Interfaces §9 / §12 / §15、Chain Compatibility §6 である。Review 005 の SR-006 / SR-007 の acceptance criteria への対応であり、core の内部設計・暗号方式を変更しない。
