# MosaicLynx チェーン互換性仕様

## 1. 目的と規範性

本書は鍵導出、ネットワーク定数、トランザクションスキーマ、正規判定、署名対象バイト列の規範契約を定義する。プロダクト仕様の許可リストを具体化し、本書にないSDK機能、型、バージョン、ネットワークを自動的に許可しない。

実装依存はロックファイルの完全性付き `@nemnesia/symbol-sdk` **`3.3.2-pure.2`** に固定する。開発環境の展開済みパッケージ、グローバルパッケージ、互換範囲、別forkを署名境界で使用しない。更新は本書、フィクスチャ、SBOM、差分解析、第三者レビューを伴う仕様変更とする。

## 2. ニーモニック生成と鍵導出

### 2.1 チェーン非依存のニーモニックとコア所有責任

ニーモニックの生成、検証、シード / ルート / 秘密鍵の導出、暗号化・復号は固定された正式 wallet-core のみが行う。MosaicLynx は Bip32 / random / fromMnemonic を呼ばず、ニーモニック / 秘密鍵を取得しない。コアの秘密情報を含む API と現行 MosaicLynx の提供範囲は [統合 §2](./wallet-core-integration.md) を正本とする。BIP39 English 24 words / 空 passphrase はコアの契約であり、プロファイルパスワードを BIP39 passphrase として使わない。

### 2.2 チェーン固有のアカウント導出

ニーモニックはプロファイルの共通ルートとして扱うが、アカウント / 鍵識別情報の導出は対象チェーンごとに独立して行う。導出要求には対象チェーンとプロファイルネットワークを明示し、対象チェーンに対応する wallet-core / チェーン統合の導出契約だけを使用する。

- Symbol: Symbol-specific な導出契約で Symbol ソフトウェア鍵を導出し、Symbol の正本実装から Symbol アカウントの公開鍵とアドレスを取得する。
- NEM: NEM 固有のな導出契約で NEM ソフトウェア鍵を導出し、NEM の正本実装から NEM アカウントの公開鍵とアドレスを取得する。

Symbol 用に導出した秘密鍵を NEM 用として、または NEM 用に導出した秘密鍵を Symbol 用として暗黙に利用してはならない。同じニーモニックまたは同じアカウント索引を別プロファイルで使用しても、Symbol / NEM のアカウント / 鍵識別情報は別々に管理する。

`accountIndex`は0から始まる31-bit 未署名の整数とし、プロファイルの`nextAccountIndex`をcopy-on-write コミット成功後にだけ増加させる。削除、バックアップ復元、失敗した追加によって既使用索引を再利用しない。具体的な導出パス、アルゴリズム、ライブラリ、シードエンコーディング、hardened 規則および各チェーンの鍵実装は wallet-core / チェーン統合の責務であり、本書では新たに定義しない。

アカウント生成、インポート、識別情報導出では対象チェーンを明示し、対象チェーンの正本実装から公開鍵とアドレスを取得する。MosaicLynx は楕円曲線演算、バイト順序変換、公開鍵導出、アドレスネットワークバイト、チェックサム、base32 encode または wallet-core の秘密情報処理を再実装しない。生の秘密鍵インポートの許可、検証、拒否条件および UX は既存の wallet-core / プラットフォーム契約に従う。

## 3. ネットワーク互換性

| チェーン | ネットワーク | symbol-sdk ネットワーク名前 | 識別子 | 世代ハッシュシード                                                 |
| -------- | ------------ | --------------------------- | ------ | ------------------------------------------------------------------ |
| Symbol   | Mainnet      | `mainnet`                   | `0x68` | `57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6` |
| Symbol   | Testnet      | `testnet`                   | `0x98` | `49D6E1CE276A85B70EAFE52349AACCA389302E7A9754BCF1221E79494FC665A4` |
| NEM      | Mainnet      | `mainnet`                   | `0x68` | 適用なし                                                           |
| NEM      | Testnet      | `testnet`                   | `0x98` | 適用なし                                                           |

Symbolの世代ハッシュはsymbol-sdk `Network.MAINNET / TESTNET.generationHashSeed`から取得し、上表は固定バージョンの回帰期待値としてだけ使用する。識別子、世代、世代ハッシュをMosaicLynx独自の実行環境定数として複製せず、期待値と不一致ならビルドを失敗させる。実行環境でノードから置換しない。

### 3.1 symbol-sdk 補助機能利用

- hex形式検査と変換はsymbol-sdk `utils.isHexString()`、`utils.hexToUint8()`、`utils.uint8ToHex()`を使用する。MosaicLynx独自hex codecを本番経路に持たない。
- 公開鍵、署名、ハッシュは symbol-sdk の `PublicKey`、`Signature`、`Hash256` で検証する。秘密鍵 / ニーモニックの検証・導出・署名に SDK を使わない。
- Symbol アドレスはsymbol-sdk Symbol `Address`、NEM アドレスはsymbol-sdk NEM `Address`で解析 / 形式し、プロファイルネットワークとの一致は対応ファサードの`network.isValidAddress()` / `isValidAddressString()`で検証する。
- Symbol 未解消アドレスの別名判定は`Address.isAlias()`、未解消 mosaic IDの別名判定はsymbol-sdk `isMosaicAlias()`を使用する。
- アグリゲートの埋め込みトランザクションハッシュは`SymbolFacade.hashEmbeddedTransactions()`で再計算し、ペイロード内`transactionsHash`と一致させる。
- タイムスタンプ / 期限のチェーン世代変換はSymbol / NEM ファサードのネットワークタイムスタンプ APIを使用し、MosaicLynx独自世代計算を持たない。

## 4. トランザクション許可リスト

| チェーン | symbol-sdk スキーマ                        |   数値の型 |           バージョン | 追加条件                                      |
| -------- | ------------------------------------------ | ---------: | -------------------: | --------------------------------------------- |
| Symbol   | `TransferTransactionV1`                    |    `16724` |                    1 | 未解消別名なし、内部なし                      |
| Symbol   | `AggregateCompleteTransactionV2`           |    `16705` |                    2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol   | `AggregateBondedTransactionV2`             |    `16961` |                    2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol   | 分離された / attached アグリゲート連署署名 | 親型に従う | 連署署名バージョン 0 | 完全な親ペイロードを同時に検証                |
| NEM      | `TransferTransactionV1`                    |      `257` |                    1 | 内部なし                                      |
| NEM      | `TransferTransactionV2`                    |      `257` |                    2 | 内部なし                                      |
| NEM      | `MultisigTransactionV1`                    |     `4100` |                    1 | 内部はTransfer v1/v2を1件、入れ子なし         |
| NEM      | `CosignatureV1`                            |     `4098` |                    1 | 完全な参照先マルチシグ v1を同時に検証         |

SDKに同名型の別バージョンが存在しても拒否する。特にSymbol アグリゲート v1/v3、任意の埋め込み型、NEM マルチシグアカウント modificationは許可リスト外である。

### 4.1 共通フィールド規範

次表と4.2〜4.4を内容検査の正本とし、列挙したフィールドを一つでも読み取り、型検証、表示できない実装はそのスキーマを許可しない。`u8/u16/u32/u64`はcatbufferの符号なしlittle-endian整数で、`u64`はJavaScript `number`へ変換せずBigIntまたはSDK 値オブジェクトのまま`0..2^64-1`を検証する。固定長バイトは長さ完全一致、可変長バイトは宣言長完全一致を必須とする。SDK オブジェクトにない予約済みのフィールドも再シリアライズ一致とnegative フィクスチャでzeroを検証する。

| フィールド群                                   | 型・範囲                                      | 拒否条件                                                       | UI                                                    |
| ---------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| サイズ / payloadSize / innerSize / messageSize | スキーマ所定の`u32/u16`、入力バイト内に収まる | 過小・過大、オーバーフロー、末尾の、整合外パディング非zero     | バイト数、内部件数                                    |
| 署名                                           | 64 バイト                                     | 未署名の外側は非zero、署名済み親は暗号検証失敗                 | 状態と必要時全体 hex                                  |
| signerPublicKey                                | 32 バイト                                     | all-zero、選択Account/期待役割と不一致。埋め込み署名主体も必須 | 全体 hex、アカウント名                                |
| バージョン / ネットワーク / 型                 | スキーマ所定整数、3章・4章の完全一致          | 未知値、要求対象範囲との不一致                                 | チェーン、Mainnet/Testnet、type/version               |
| 手数料 / maxFee / 数量                         | `u64`、`0..2^64-1`                            | deserialize/加減算オーバーフロー、スキーマ外負数               | 不可分な整数。名称・桁数を検証済みの場合だけ換算      |
| タイムスタンプ / 期限                          | チェーン所定整数                              | SDK タイムスタンプ変換不能、期限 < タイムスタンプ（NEM）       | ISO換算と生の整数。現在チェーン時刻との有効性は未照合 |
| アドレス                                       | Symbol 24 バイト / NEM 40 ASCII バイト        | checksum/network不一致、Symbol 別名、NEM形式不正               | 全文、短縮は補助のみ                                  |
| mosaicId                                       | `u64`                                         | Symbol 別名ビット、同一Transfer内の重複、非正規順              | `0x` + 16桁uppercase、不可分な数量                    |
| メッセージ                                     | 宣言型 + 宣言長 + バイト列                    | 未知型、長さ不一致、制御文字を安全表示不能                     | UTF-8安全表示と全体 hex。暗号性は断定しない           |
| 予約済みの / パディング                        | スキーマ所定幅、値0                           | 一つでも非zero                                                 | technical 詳細にフィールド名と0                       |

配列はSDK スキーマが規定する正規順序を保持する。mosaic IDの重複、sort不正、埋め込みトランザクション間パディングの非zero、連署署名署名主体重複または非正規順を拒否する。空Transfer mosaic配列はメッセージが空でなければ許可できるが、資産効果0と明示する。数量 0は許可スキーマ上有効でも強調表示する。

### 4.2 Symbol全フィールド

| スキーマ                                                          | 必須フィールド（通信上の順、予約済みのを含む）                                                                                                                                                                                                                              | スキーマ固有の拒否条件                                                                                             | フィクスチャ ID 接頭辞       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `TransferTransactionV1`                                           | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]`                     | 型=`16724`、バージョン=1、別名なし、mosaic 正規順序、宣言count/size一致                                            | `SYM-TRANSFER-V1-{MAINNET    | TESTNET}-NNN` |
| `EmbeddedTransferTransactionV1`                                   | `size, embeddedTransactionHeaderReserved_1, signerPublicKey, entityBodyReserved_1, version, network, type, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]`                                            | 親とネットワーク一致、型=`16724`、バージョン=1、signature/fee/deadlineを持たない                                   | `SYM-EMBEDDED-TRANSFER-V1-…` |
| `AggregateCompleteTransactionV2` / `AggregateBondedTransactionV2` | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, transactionsHash, payloadSize, aggregateTransactionHeaderReserved_1, transactions[], cosignatures[{version, signerPublicKey, signature}]` | 型=`16705/16961`、バージョン=2、埋め込み 1..100、payloadSize一致、transactionsHash再計算一致、連署署名バージョン=0 | `SYM-AGG-{COMPLETE           | BONDED}-V2-…` |
| アグリゲート連署署名要求                                          | `parentPayload`の上記全フィールド + `parentHash, cosignerPublicKey, detached`                                                                                                                                                                                               | 完全親なし、親hash/signature/transactionsHash不正、既存連署者、開始主体と同じ鍵、選択アカウント不一致              | `SYM-COSIG-V0-{ATTACHED      | DETACHED}-…`  |

Symbolの`maxFee`は外側の`fee` フィールドそのものであり、ノードの手数料 multiplierを照会しないMosaicLynxはactual 手数料を確定しない。UIは`最大手数料 −maxFee atomic XYM`と表示し、資産正味効果では開始主体に`[-maxFee, 0]`の範囲として別計上する。Transferごとに各mosaic `m`について`delta[embeddedSigner,m] -= amount`、`delta[recipient,m] += amount`とする。self-transferもgross送付と受取を表示し、netは0とする。アグリゲートでは全埋め込みをBigIntで加算し、途中または合計が`[-(2^64-1)*100, +(2^64-1)*100]`を越える実装上オーバーフローを拒否する。連署署名画面では親の効果を「成立時の親トランザクション効果」として表示し、連署者自身の資産減少へ誤算入しない。

署名者役割は、通常Transferで外側署名主体=`initiator / asset sender`、アグリゲートで外側署名主体=`initiator / fee payer`、各埋め込み署名主体=`embedded sender`とする。選択鍵が未署名の外側署名主体ならトランザクション署名、親アグリゲートの開始主体でなく、かつ既存連署署名に存在しなければ`cosigner`候補とする。ペイロードだけからマルチシグ membershipは確定できないため「連署者候補・オンチェーン権限未照合」と表示し、membershipを断定しない。

### 4.3 NEM全フィールド

| スキーマ                | 必須フィールド（通信上の順、子オブジェクトを含む）                                                                                                                                                                                                                              | スキーマ固有の拒否条件                                                                                                             | フィクスチャ ID 接頭辞    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `TransferTransactionV1` | `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline, recipientAddressSize, recipientAddress, amount, messageEnvelopeSize, message?{messageType,messageSize,message}`                        | 型=`257`、entity バージョン=1、予約済みの=0、固定サイズ=`32/64/40`、未署名の署名=zero、mosaic配列なし、全長さ一致                  | `NEM-TRANSFER-V1-{MAINNET | TESTNET}-NNN` |
| `TransferTransactionV2` | v1全フィールド + `mosaicsCount, mosaics[{mosaicId{namespaceId{nameSize,name},nameSize,name},amount}]`                                                                                                                                                                           | entity バージョン=2、qualified mosaic IDの各名前がSDK規則に適合、重複/非正規順なし、回数一致                                       | `NEM-TRANSFER-V2-{MAINNET | TESTNET}-NNN` |
| `MultisigTransactionV1` | 共通のヘッダー `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline` + `innerTransactionSize, innerTransaction(TransferV1/V2全field), cosignaturesCount, cosignatures[CosignatureV1全field]` | 型=`4100`、内部 1件、内部マルチシグ禁止、size/network一致。通常の開始署名はcosignaturesCount=0。参照親では0..100、重複署名主体なし | `NEM-MULTISIG-V1-…`       |
| `CosignatureV1`         | 共通のヘッダー全フィールド + `multisigTransactionHashOuterSize, multisigTransactionHashSize, multisigTransactionHash, multisigAccountAddressSize, multisigAccountAddress`                                                                                                       | 型=`4098`、entity バージョン=1、固定サイズ=`36/32/40`、完全な参照先マルチシグペイロードなし、hash/address/inner不一致              | `NEM-COSIG-V1-…`          |

NEM 通信上のでは`version`、2-byte `entityBodyReserved_1`、`network`を別フィールドとして読み、従来APIの合成バージョン値だけで検証しない。`signerPublicKeySize=32`、`signatureSize=64`、`recipientAddressSize=40`等の固定サイズフィールドを単なるパーサー都合として捨てず生のフィールドへ含める。NEM メッセージ型は固定版SDKが保持し再シリアライズできる`PLAIN=1`または`ENCRYPTED=2`だけを許可し、未知値を単なるhex メッセージとして続行しない。`messageEnvelopeSize=0`はメッセージ不在、非zeroは`8 + messageSize`との完全一致を必須とする。NEM v2 mosaic IDは名前空間名前とmosaic 名前の生の ASCIIを各構成要素として全文表示し、外部メタデータによる別名へ置換しない。

NEMの`fee`は各トランザクションに明記された支払額として扱う。通常Transferは`delta[signer,XEM] -= fee`に加え、mosaicなしのv1では`delta[signer,XEM] -= amount`、`delta[recipient,XEM] += amount`とする。v2でmosaicsがある場合、`amount`を各mosaic 数量へ掛けるSDK/NEM スキーマの意味を固定フィクスチャで検証し、`quantity = amount × mosaic.amount`をBigIntで計算して`u64`を越えれば拒否する。マルチシグラッパーは外側署名主体へ外側手数料、内部マルチシグアカウントへ内部手数料とtransfer効果を別々に計上する。連署署名は連署者へ連署署名自身の手数料だけを計上し、参照先親の効果は「成立時の親トランザクション効果」として二重加算しない。

NEM 役割は通常Transfer 署名主体=`initiator / asset sender / fee payer`、マルチシグ外側署名主体=`initiator / wrapper fee payer`、内部署名主体=`multisig account / asset sender / inner fee payer`、連署署名署名主体=`cosigner / cosignature fee payer`とする。`multisigAccountAddress`、参照ハッシュ、内部署名主体から役割のバイト整合性を検証するが、現在のマルチシグ構成と必要署名数はオンチェーン未照合と表示する。

### 4.4 内容検査出力とフィクスチャ対応

`TransactionInspection`は少なくとも`fixtureContractVersion, chain, network, schema, numericType, version, role[], rawFields[], recipients[], grossTransfers[], assetDeltas[], feeEffects[], deadline, warnings[], externalStateUnverified[], payloadDigest, canonicalPayloadDigest`を持つ。`rawFields`は上表の全フィールドを通信上の順に含み、値をlocale依存文字列だけで保持しない。UIは判断要約、全明細、technical 詳細の三層へ同じ内容検査を投影し、別計算を持たない。

フィクスチャ IDは`<prefix>-NNN`を安定IDとし、正常系`001..099`、境界`100..199`、拒否`900..999`を割り当てる。各フィールドの最小/最大、サイズ ±1、予約済みの nonzero、不明 type/version、誤った network/signer、truncation全offset、duplicate/sort、別名、オーバーフロー、100/101件を最低1 フィクスチャへ対応させる。UI スナップショット / E2Eは同じフィクスチャ IDをテスト titleと成果物名に含め、日本語・英語の期待表示、期待役割、gross/net、手数料、拒否コードをフィクスチャ内に保持する。

## 5. 入力ペイロードと正規判定

- hexは偶数長、hex characterのみ、デコード済み 256 KiB以下とする。テキストの大文字小文字はバイト比較に影響させず、デコード済みバイト列を比較する。
- 通常の外側署名要求は署名フィールドが全zeroでなければ拒否する。ペイロードの署名主体公開鍵は選択アカウントと完全一致し、zero 署名主体をMosaicLynxが補完する方式は採用しない。
- アグリゲート連署署名だけは署名済みの完全な親アグリゲートを入力できる。親署名、開始主体署名主体、トランザクションハッシュ、全埋め込みトランザクション、既存連署署名を検証する。
- Symbolは`SymbolTransactionFactory.deserialize()`、NEMは`TransactionFactory.deserialize()`でデコードし、全フィールドを境界検証した後、返されたsymbol-sdk トランザクションオブジェクトの`serialize()`で再encodeする。シリアライズ済みのバイト列が入力デコード済みバイト列とバイト単位で一致する一致しない場合は拒否する。
- 予約済みのフィールド非zero、declared サイズ不一致、末尾のバイト列、整数オーバーフロー、重複または順序不正連署署名、トランザクションハッシュ不一致、要素数超過を拒否する。
- Symbol 未解消アドレス / 未解消 mosaic IDが名前空間別名エンコーディングの場合は、Transferと全埋め込み Transferで拒否する。ノード照会による解決後の値へ暗黙変換しない。
- NEM メッセージは型、長さ、ペイロードを完全解析し、symbol-sdk スキーマが保持しないバイトがあれば拒否する。

## 6. 署名バイト列、正式コア委譲、公開ハッシュ

秘密鍵不要の SDK 処理と生の署名を分離する。全署名操作は [wallet-core 統合](./wallet-core-integration.md) の正式 `sign(store, request, password_utf8)` に委譲する。MosaicLynx は秘密鍵をエクスポート・保持しない。`symbol-sdk` の秘密鍵付きアカウント / KeyPair / 署名 / 連署基本機構を本番環境署名で呼ばない。

### 6.1 Symbol

- デコード / encode は SymbolTransactionFactory.deserialize / transaction.serialize。ネットワークは要求対象範囲と固定 SDK ネットワークが一致することを確認する。
- トランザクション署名バイト列は network-bound `SymbolFacade.extractSigningPayload(transaction)` の返す Uint8Array 全体。これは generationHashSeed + SDK transactionDataBuffer であり、アグリゲート v2 はバージョン / ネットワーク / 型、手数料、期限、transactionsHash の対象規則に従う。独自 slice / 世代ハッシュ重複付加をしない。
- コアの生の署名を transaction.signature に設定し、公開 `SymbolFacade.verifyTransaction(transaction, signature)` / hashTransaction を使用する。SDK を使う署名生成は行わない。
- 連署の内容検査対象は全体署名済みアグリゲート、全埋め込み、既存署名 / 連署署名、選択済みの連署者 / 対象範囲 / 役割。親署名を verifyTransaction、既存連署署名を親ハッシュバイト列と各公開鍵の検証者で検証する。重複署名主体 / 誤った役割 / ネットワーク不一致 / 親期限切れは拒否する。
- 連署バイト列はその全体親から `SymbolFacade.hashTransaction(parent).bytes` で再計算した生の 32 バイト列。これにコア署名を適用し public-key 検証者で検証する。外部ハッシュ単体は入力として受理しない。
- attached / 分離されたの通信上の投影は [インターフェース §9.6.1](./interfaces.md) に従い、親ペイロードに署名要素を自動追記しない。方式によらずバージョン 0・署名バイト列は同じ親ハッシュに結び付けされる。

### 6.2 NEM

- デコード / encode は TransactionFactory.deserialize / シリアライズ。
- トランザクション署名バイト列は `NemFacade.extractSigningPayload(transaction)` の Uint8Array。固定 SDK の `TransactionFactory.toNonVerifiableTransaction(transaction).serialize()` と同じ対象を固定ベクターで照合する。コアが NEM 基本機構を適用し世代ハッシュ / 接頭辞を追加しない。
- コア署名を元トランザクションの署名フィールドに設定し NemFacade.verifyTransaction / hashTransaction で検証・計算する。
- 連署は全体署名済み MultisigV1 親と未署名の CosignatureV1 を受ける。外側 / 内部ネットワーク、全フィールド、親と既存連署署名の署名、親ハッシュ、multisigAccountAddress と内部署名主体、選択済みの連署者、重複 / 役割 / 期限を検証する。親ハッシュは `NemFacade.hashTransaction(parent)` で再計算し CosignatureV1 の参照ハッシュと一致させる。
- 連署バイト列は CosignatureV1 の NemFacade.extractSigningPayload 結果。コア署名後に CosignatureV1 の署名済みペイロード / ハッシュ / 署名主体を検証して [インターフェース §9.6.1](./interfaces.md) の結果を返す。親には追記しない。

### 6.3 構造化されたメッセージ

[インターフェース §9.4](./interfaces.md) の正規 StructuredMessage 全体を JCS にし、ASCII `MOSAICLYNX\0MESSAGE\0V1\0` 接頭辞を一度だけ連結してコア署名に渡す。メッセージ専用コア API を仮定しない。Symbol / NEM の public-key 検証者で厳密なバイト列と署名を返却前に検証する。hex の解釈不能バイト列や別形式へ代替経路しない。

全経路で要求 / 不変対象 / 選択済みの公開鍵 / チェーン / ネットワーク / 厳密なバイト列 / 結果の結び付けを検証する。トランザクションは署名フィールド以外の全フィールドと正規バイト列が元要求と同じであることを再デシリアライズして確認する。連署署名とメッセージの公開結果はインターフェースを正本とする。署名生成の唯一の実装は wallet-core、公開ハッシュ / 解析 / 検証の固定 SDK 利用はコアの秘密情報処理を代替しない。

## 7. 固定ベクターとリリース判定

実装リポジトリの規範フィクスチャは次のパスに置く。

```text
packages/chain-symbol/test/vectors/
├── bip32.json
├── transfer-v1.json
├── aggregate-complete-v2.json
├── aggregate-bonded-v2.json
└── cosignature-v0.json
packages/chain-nem/test/vectors/
├── shared-symbol-bip32.json
├── transfer-v1.json
├── transfer-v2.json
├── multisig-v1.json
└── cosignature-v1.json
```

各正常ベクターはネットワーク、公開識別情報、未署名 / 親ペイロード、全解析フィールド、厳密な署名バイト列、署名、公開結果 / ハッシュを含む。秘密情報を含むコアベクターは外部コアの公開既知値として別に照合し、MosaicLynx 本番環境 / UI / アダプターにニーモニック / 秘密鍵を入力しない。

各スキーマに、少なくとも誤ったネットワーク、誤った署名主体、不明バージョン、nonzero 予約済みの、サイズ ±1、末尾のバイト、truncation全offset、最大整数、オーバーフロー、別名、最大件数、最大件数+1、非正規並び、改ざんトランザクションハッシュを用意する。Web、拡張機能、モバイルの全実装が同じフィクスチャを通過しない限りリリースしない。

## 8. symbol-sdk更新手順

symbol-sdk更新PRは旧版と新版の全スキーマシリアライズ、ファサード署名バイト列、ネットワーク定数、コアベクターとの対応を差分比較する。差分がない場合もSBOM、パッケージ完全性、フィクスチャ結果、ファズ corpus結果、レビュアー 2名の承認を保存する。差分がある場合はProvider APIまたはチェーン互換性バージョンを更新し、既存Vaultの鍵を再導出して上書きしない。

## 9. 追跡可能性

本表はチェーン / ネットワーク / トランザクション互換性の外部契約を、承認済み要件、設計、関連仕様および正本の管理主体 / 未決へ追跡するための表である。本書はプロダクトのプロダクト対象範囲、プロファイルのバックアップ契約、共通受け渡しエンベロープまたは wallet-core の内部形式を再定義しない。

| 要求 / 受け入れ                                                                      | 設計                                                                   | 本仕様     | 正本の管理主体 / 未決                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CR-005`、`CR-NFR-005`、`CR-AC-003`                                                  | アーキテクチャ §6.7、インターフェース設計 §3.3、署名フロー §4、§8〜§15 | §2〜§5     | チェーン / ネットワーク識別情報、アドレスネットワーク、スキーマ互換性は本書。プロファイルネットワーク関連付けはプロファイル / アカウント仕様                                     |
| `CR-002`、`CR-004`、`CR-007-TX`、`CR-007-MSG`、`CR-AC-002`、`CR-AC-005`、`CR-AC-006` | 署名フロー §8〜§15、セキュリティ設計 §11、ブラウザ / モバイル設計 §10  | §4、§5、§7 | 許可リスト、全フィールド内容検査、正規形式への適合性、blind-signing 拒否は本書。信頼された UI / 承認はプラットフォーム仕様                                                       |
| `CR-006`、`CR-NFR-009`、`CR-NFR-012`、`CR-AC-004`、`CR-AC-012`                       | 署名フロー §7、§19〜§23、インターフェース設計 §6、§9                   | §5〜§7     | 署名済み結果の要求 / 署名主体 / ネットワーク対応は署名主体 / インターフェース / 受け渡しが所有し、本書はチェーン固有の検証を所有                                                 |
| `CR-008`、`CR-013`、`CR-NFR-004`、`CR-AC-010`                                        | アーキテクチャ §6.8、セキュリティ設計 §6、§13                          | §2、§6     | 鍵導出、ウォレットストア、生の署名は wallet-core / チェーン統合の外部契約。本書は MosaicLynx 側で再実装しない                                                                    |
| `CR-NFR-006`、`CR-AC-008`                                                            | アーキテクチャ §3、§16、セキュリティ設計 §16                           | §7         | Mainnet 対応能力の根拠 / 承認ポリシーは ADR 0001、`evidence-policy.json`、Mainnet リリース証跡。チェーンフィクスチャは判定条件根拠の入力であり判定条件ポリシーの責任主体ではない |
| `CR-007-TX`、`CR-007-MSG`、`CR-AC-015`                                               | SDK 設計 §7、署名フロー §14、インターフェース設計 §9                   | §4、§6、§8 | アグリゲート / マルチシグ / 連署署名の v1 操作対象範囲 / 結果はインターフェース §9.6.1 とプラットフォーム / SDK 仕様。許可リスト外は本書で拒否し、暗黙に拡張しない               |

### 9.1 未決と下流引継ぎ

- 本書にないトランザクション型 / バージョン、スキーマ、フィールド、ネットワークまたは署名バイト規則は、SDK / ブラウザ / モバイル / 受け渡しから推測して追加しない。
- インターフェース §9.6.1 の任意連署署名対象範囲と本書の許可リストを共通契約とし、非対応対応能力は拒否する。必須化・他型の拡張を暗黙に行わない。
- symbol-sdk バージョン、フィクスチャ契約バージョン、パーサーバージョンの更新は、§8 の手順と Mainnet リリース証跡の同一リビジョン更新を必要とする。
