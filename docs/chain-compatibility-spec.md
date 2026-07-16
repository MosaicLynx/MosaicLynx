# MosaicLynx Chain Compatibility Specification

## 1. 目的と規範性

本書は鍵導出、network constant、transaction schema、canonical判定、署名対象byte列の規範契約を定義する。Product Specificationのallowlistを具体化し、本書にないSDK機能、type、version、networkを自動的に許可しない。

実装依存はlockfileのintegrity付き `@nemnesia/symbol-sdk` **`3.3.2-pure.2`** に固定する。開発環境の展開済みpackage、global package、互換range、別forkを署名境界で使用しない。更新は本書、fixture、SBOM、差分解析、第三者reviewを伴う仕様変更とする。

## 2. ニーモニック生成と鍵導出

### 2.1 chain非依存のニーモニック生成

ニーモニックはProfileの共通rootであり、Symbol / NEMまたはMainnet / Testnetごとに生成処理を分岐しない。規範手順は次のとおりとする。

```ts
const bip32 = new Bip32(SymbolFacade.BIP32_CURVE_NAME, "english");
const mnemonic = bip32.random();
const words = mnemonic.trim().split(/\s+/);
if (24 !== words.length)
  throw new Error("invalid generated mnemonic");
const root = bip32.fromMnemonic(mnemonic, "");
```

- `random()`はSDK既定の`seedLength = 32`を使用し、BIP39 English 24 wordsを生成する。
- 生成後、24語、English wordlist、BIP39 checksum、`fromMnemonic(mnemonic, "")`の成功を保存前に検証する。
- BIP39 passphraseは空文字`""`とし、Profile passwordとは独立させる。
- 乱数生成失敗、語数不一致、checksum不正、all-zero child key、SDK例外時はProfileを保存しない。

### 2.2 SDK委譲によるAccount導出

```ts
const facade = new SymbolFacade(profileNetwork);
const childPrivateKey = root
  .derivePath(facade.bip32Path(accountIndex))
  .privateKey;
```

`facade.bip32Path(accountIndex)`の返却値を唯一のpath sourceとする。MosaicLynxのsource、設定、Storage、migrationへcoin type、path文字列、hardened flagを別定数として持たない。保存する`derivationPath`は監査・復旧表示用にsymbol-sdk返却値から生成したsnapshotであり、導出時の入力には使用しない。復旧時も同じ固定版symbol-sdkの`facade.bip32Path(accountIndex)`から再取得し、snapshotとの不一致をdowngrade / compatibility errorとして拒否する。

`accountIndex`は0から始まる31-bit unsigned integerとし、Profileの`nextAccountIndex`をcopy-on-write commit成功後にだけ増加させる。削除、backup restore、失敗した追加によって既使用indexを再利用しない。

### 2.3 Symbol / NEM共用鍵

上記symbol-sdk委譲手順で得た同じ32-byte private keyを次へ渡す。

- Symbol: `new SymbolFacade(network).createAccount(privateKey)`
- NEM: `new NemFacade(network).createAccount(privateKey)`

`NemFacade.BIP32_CURVE_NAME`、`NemFacade.bip32Path()`、`NemFacade.bip32NodeToKeyPair()`はMosaicLynxのmnemonic由来Accountに使用しない。したがってNEM公式walletのmnemonic互換を主張しない。

Account生成、import、Identity導出は次を唯一の本番経路とする。

```ts
const privateKey = new PrivateKey(secretBytes);
const symbolAccount = new SymbolFacade(network).createAccount(privateKey);
const nemAccount = new NemFacade(network).createAccount(privateKey);
```

Symbol / NEMのpublic keyとaddressはそれぞれのsymbol-sdk Accountの`publicKey`と`address`から取得する。MosaicLynxは楕円曲線演算、byte order変換、public key導出、address network byte、checksum、base32 encodeを再実装しない。秘密鍵importも`new PrivateKey(input)`による長さ・hex検証に成功した値だけを受け入れ、MosaicLynx独自のpadding、truncation、byte reversal、case以外の正規化を行わない。

## 3. Network compatibility

| Chain | Network | symbol-sdk network name | identifier | generation hash seed |
| --- | --- | --- | --- | --- |
| Symbol | Mainnet | `mainnet` | `0x68` | `57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6` |
| Symbol | Testnet | `testnet` | `0x98` | `49D6E1CE276A85B70EAFE52349AACCA389302E7A9754BCF1221E79494FC665A4` |
| NEM | Mainnet | `mainnet` | `0x68` | 適用なし |
| NEM | Testnet | `testnet` | `0x98` | 適用なし |

Symbolのgeneration hashはsymbol-sdk `Network.MAINNET / TESTNET.generationHashSeed`から取得し、上表は固定versionの回帰期待値としてだけ使用する。identifier、epoch、generation hashをMosaicLynx独自のruntime定数として複製せず、期待値と不一致ならbuildを失敗させる。runtimeでnodeから置換しない。

### 3.1 symbol-sdk utility利用

- hex形式検査と変換はsymbol-sdk `utils.isHexString()`、`utils.hexToUint8()`、`utils.uint8ToHex()`を使用する。MosaicLynx独自hex codecを本番経路に持たない。
- private key、public key、signature、hashはsymbol-sdkの`PrivateKey`、`PublicKey`、`Signature`、`Hash256`で長さと形式を検証する。
- Symbol addressはsymbol-sdk Symbol `Address`、NEM addressはsymbol-sdk NEM `Address`でparse / formatし、Profile networkとの一致は対応Facadeの`network.isValidAddress()` / `isValidAddressString()`で検証する。
- Symbol unresolved addressのalias判定は`Address.isAlias()`、unresolved mosaic IDのalias判定はsymbol-sdk `isMosaicAlias()`を使用する。
- Aggregateのembedded transactions hashは`SymbolFacade.hashEmbeddedTransactions()`で再計算し、payload内`transactionsHash`と一致させる。
- timestamp / deadlineのchain epoch変換はSymbol / NEM FacadeのNetwork timestamp APIを使用し、MosaicLynx独自epoch計算を持たない。

## 4. Transaction allowlist

| Chain | symbol-sdk schema | numeric type | version | 追加条件 |
| --- | --- | ---: | ---: | --- |
| Symbol | `TransferTransactionV1` | `16724` | 1 | unresolved aliasなし、innerなし |
| Symbol | `AggregateCompleteTransactionV2` | `16705` | 2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol | `AggregateBondedTransactionV2` | `16961` | 2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol | detached / attached aggregate cosignature | 親typeに従う | cosignature version 0 | 完全な親payloadを同時に検証 |
| NEM | `TransferTransactionV1` | `257` | 1 | innerなし |
| NEM | `TransferTransactionV2` | `257` | 2 | innerなし |
| NEM | `MultisigTransactionV1` | `4100` | 1 | innerはTransfer v1/v2を1件、入れ子なし |
| NEM | `CosignatureV1` | `4098` | 1 | 完全な参照先Multisig v1を同時に検証 |

SDKに同名typeの別versionが存在しても拒否する。特にSymbol Aggregate v1/v3、任意のEmbedded type、NEM multisig account modificationはallowlist外である。

### 4.1 共通field規範

次表と4.2〜4.4をInspectionの正本とし、列挙したfieldを一つでも読み取り、型検証、表示できない実装はそのschemaを許可しない。`u8/u16/u32/u64`はcatbufferの符号なしlittle-endian整数で、`u64`はJavaScript `number`へ変換せずBigIntまたはSDK value objectのまま`0..2^64-1`を検証する。固定長byteは長さ完全一致、可変長byteは宣言長完全一致を必須とする。SDK objectにないreserved fieldも再serialize一致とnegative fixtureでzeroを検証する。

| field群 | 型・範囲 | reject条件 | UI |
| --- | --- | --- | --- |
| size / payloadSize / innerSize / messageSize | schema所定の`u32/u16`、入力byte内に収まる | 過小・過大、overflow、trailing、alignment外padding非zero | byte数、inner件数 |
| signature | 64 byte | unsigned outerは非zero、署名済み親は暗号検証失敗 | statusと必要時full hex |
| signerPublicKey | 32 byte | all-zero、選択Account/期待roleと不一致。embedded signerも必須 | full hex、Account名 |
| version / network / type | schema所定整数、3章・4章の完全一致 | 未知値、要求scopeとの不一致 | chain、Mainnet/Testnet、type/version |
| fee / maxFee / amount | `u64`、`0..2^64-1` | deserialize/加減算overflow、schema外負数 | atomic整数。名称・桁数を検証済みの場合だけ換算 |
| timestamp / deadline | chain所定整数 | SDK timestamp変換不能、deadline < timestamp（NEM） | ISO換算とraw整数。現在chain時刻との有効性は未照合 |
| address | Symbol 24 byte / NEM 40 ASCII byte | checksum/network不一致、Symbol alias、NEM形式不正 | 全文、短縮は補助のみ |
| mosaicId | `u64` | Symbol alias bit、同一Transfer内の重複、非canonical順 | `0x` + 16桁uppercase、atomic amount |
| message | 宣言type + 宣言長 + byte列 | 未知type、長さ不一致、制御文字を安全表示不能 | UTF-8安全表示とfull hex。暗号性は断定しない |
| reserved / padding | schema所定幅、値0 | 一つでも非zero | technical detailsにfield名と0 |

配列はSDK schemaが規定するcanonical orderを保持する。mosaic IDの重複、sort不正、embedded transaction間paddingの非zero、cosignature signer重複または非canonical順を拒否する。空Transfer mosaic配列はmessageが空でなければ許可できるが、asset効果0と明示する。amount 0は許可schema上有効でも強調表示する。

### 4.2 Symbol全field

| schema | 必須field（wire順、reservedを含む） | schema固有のreject条件 | fixture ID prefix |
| --- | --- | --- | --- |
| `TransferTransactionV1` | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]` | type=`16724`、version=1、aliasなし、mosaic canonical order、宣言count/size一致 | `SYM-TRANSFER-V1-{MAINNET|TESTNET}-NNN` |
| `EmbeddedTransferTransactionV1` | `size, embeddedTransactionHeaderReserved_1, signerPublicKey, entityBodyReserved_1, version, network, type, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]` | 親とnetwork一致、type=`16724`、version=1、signature/fee/deadlineを持たない | `SYM-EMBEDDED-TRANSFER-V1-…` |
| `AggregateCompleteTransactionV2` / `AggregateBondedTransactionV2` | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, transactionsHash, payloadSize, aggregateTransactionHeaderReserved_1, transactions[], cosignatures[{version, signerPublicKey, signature}]` | type=`16705/16961`、version=2、embedded 1..100、payloadSize一致、transactionsHash再計算一致、cosignature version=0 | `SYM-AGG-{COMPLETE|BONDED}-V2-…` |
| aggregate cosignature request | `parentPayload`の上記全field + `parentHash, cosignerPublicKey, detached` | 完全親なし、親hash/signature/transactionsHash不正、既存cosigner、initiatorと同じkey、選択Account不一致 | `SYM-COSIG-V0-{ATTACHED|DETACHED}-…` |

Symbolの`maxFee`はouterの`fee` fieldそのものであり、ノードのfee multiplierを照会しないMosaicLynxはactual feeを確定しない。UIは`最大手数料 −maxFee atomic XYM`と表示し、asset正味効果ではinitiatorに`[-maxFee, 0]`の範囲として別計上する。Transferごとに各mosaic `m`について`delta[embeddedSigner,m] -= amount`、`delta[recipient,m] += amount`とする。self-transferもgross送付と受取を表示し、netは0とする。aggregateでは全embeddedをBigIntで加算し、途中または合計が`[-(2^64-1)*100, +(2^64-1)*100]`を越える実装上overflowを拒否する。cosignature画面では親の効果を「成立時の親Transaction効果」として表示し、cosigner自身のasset減少へ誤算入しない。

署名者roleは、通常Transferでouter signer=`initiator / asset sender`、Aggregateでouter signer=`initiator / fee payer`、各embedded signer=`embedded sender`とする。選択keyがunsigned outer signerならtransaction署名、親Aggregateのinitiatorでなく、かつ既存cosignatureに存在しなければ`cosigner`候補とする。payloadだけからmultisig membershipは確定できないため「cosigner候補・オンチェーン権限未照合」と表示し、membershipを断定しない。

### 4.3 NEM全field

| schema | 必須field（wire順、子objectを含む） | schema固有のreject条件 | fixture ID prefix |
| --- | --- | --- | --- |
| `TransferTransactionV1` | `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline, recipientAddressSize, recipientAddress, amount, messageEnvelopeSize, message?{messageType,messageSize,message}` | type=`257`、entity version=1、reserved=0、固定size=`32/64/40`、unsigned signature=zero、mosaic配列なし、全length一致 | `NEM-TRANSFER-V1-{MAINNET|TESTNET}-NNN` |
| `TransferTransactionV2` | v1全field + `mosaicsCount, mosaics[{mosaicId{namespaceId{nameSize,name},nameSize,name},amount}]` | entity version=2、qualified mosaic IDの各nameがSDK規則に適合、重複/非canonical順なし、count一致 | `NEM-TRANSFER-V2-{MAINNET|TESTNET}-NNN` |
| `MultisigTransactionV1` | common header `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline` + `innerTransactionSize, innerTransaction(TransferV1/V2全field), cosignaturesCount, cosignatures[CosignatureV1全field]` | type=`4100`、inner 1件、inner multisig禁止、size/network一致。通常の開始署名はcosignaturesCount=0。参照親では0..100、重複signerなし | `NEM-MULTISIG-V1-…` |
| `CosignatureV1` | common header全field + `multisigTransactionHashOuterSize, multisigTransactionHashSize, multisigTransactionHash, multisigAccountAddressSize, multisigAccountAddress` | type=`4098`、entity version=1、固定size=`36/32/40`、完全な参照先Multisig payloadなし、hash/address/inner不一致 | `NEM-COSIG-V1-…` |

NEM wireでは`version`、2-byte `entityBodyReserved_1`、`network`を別fieldとして読み、従来APIの合成version値だけで検証しない。`signerPublicKeySize=32`、`signatureSize=64`、`recipientAddressSize=40`等の固定size fieldを単なるparser都合として捨てずraw fieldへ含める。NEM message typeは固定版SDKが保持し再serializeできる`PLAIN=1`または`ENCRYPTED=2`だけを許可し、未知値を単なるhex messageとして続行しない。`messageEnvelopeSize=0`はmessage不在、非zeroは`8 + messageSize`との完全一致を必須とする。NEM v2 mosaic IDはnamespace nameとmosaic nameのraw ASCIIを各構成要素として全文表示し、外部metadataによる別名へ置換しない。

NEMの`fee`は各transactionに明記された支払額として扱う。通常Transferは`delta[signer,XEM] -= fee`に加え、mosaicなしのv1では`delta[signer,XEM] -= amount`、`delta[recipient,XEM] += amount`とする。v2でmosaicsがある場合、`amount`を各mosaic quantityへ掛けるSDK/NEM schemaの意味を固定fixtureで検証し、`quantity = amount × mosaic.amount`をBigIntで計算して`u64`を越えれば拒否する。Multisig wrapperはouter signerへouter fee、inner multisig Accountへinner feeとtransfer効果を別々に計上する。Cosignatureはcosignerへcosignature自身のfeeだけを計上し、参照先親の効果は「成立時の親Transaction効果」として二重加算しない。

NEM roleは通常Transfer signer=`initiator / asset sender / fee payer`、Multisig outer signer=`initiator / wrapper fee payer`、inner signer=`multisig account / asset sender / inner fee payer`、Cosignature signer=`cosigner / cosignature fee payer`とする。`multisigAccountAddress`、参照hash、inner signerからroleのbyte整合性を検証するが、現在のmultisig構成と必要署名数はオンチェーン未照合と表示する。

### 4.4 Inspection出力とfixture対応

`TransactionInspection`は少なくとも`fixtureContractVersion, chain, network, schema, numericType, version, role[], rawFields[], recipients[], grossTransfers[], assetDeltas[], feeEffects[], deadline, warnings[], externalStateUnverified[], payloadDigest, canonicalPayloadDigest`を持つ。`rawFields`は上表の全fieldをwire順に含み、値をlocale依存文字列だけで保持しない。UIは判断要約、全明細、technical detailsの三層へ同じinspectionを投影し、別計算を持たない。

fixture IDは`<prefix>-NNN`を安定IDとし、正常系`001..099`、境界`100..199`、reject`900..999`を割り当てる。各fieldの最小/最大、size ±1、reserved nonzero、unknown type/version、wrong network/signer、truncation全offset、duplicate/sort、alias、overflow、100/101件を最低1 fixtureへ対応させる。UI snapshot / E2Eは同じfixture IDをtest titleとartifact名に含め、日本語・英語の期待表示、期待role、gross/net、fee、reject codeをfixture内に保持する。

## 5. 入力payloadとcanonical判定

- hexは偶数長、hex characterのみ、decoded 256 KiB以下とする。textの大文字小文字はbyte比較に影響させず、decoded bytesを比較する。
- 通常のouter署名要求はsignature fieldが全zeroでなければ拒否する。payloadのsigner public keyは選択Accountと完全一致し、zero signerをMosaicLynxが補完する方式は採用しない。
- aggregate cosignatureだけは署名済みの完全な親aggregateを入力できる。親signature、initiator signer、transactions hash、全embedded transaction、既存cosignatureを検証する。
- Symbolは`SymbolTransactionFactory.deserialize()`、NEMは`TransactionFactory.deserialize()`でdecodeし、全fieldを境界検証した後、返されたsymbol-sdk transaction objectの`serialize()`で再encodeする。serialized bytesが入力decoded bytesとbyte-for-byte一致しない場合は拒否する。
- reserved field非zero、declared size不一致、trailing bytes、整数overflow、重複または順序不正cosignature、transactions hash不一致、要素数超過を拒否する。
- Symbol unresolved address / unresolved mosaic IDがnamespace alias encodingの場合は、Transferと全Embedded Transferで拒否する。node照会による解決後の値へ暗黙変換しない。
- NEM messageはtype、length、payloadを完全解析し、symbol-sdk schemaが保持しないbyteがあれば拒否する。

## 6. 署名とhash

独自のslice計算、署名、hash計算を本番実装に持たず、固定版symbol-sdkのFacade / Accountを唯一の生成実装とする。ただしfixtureでは以下の規則を独立実装した期待値と照合する。

### 6.1 Symbol

- decode / encode: `SymbolTransactionFactory.deserialize(payload)` / transactionの`serialize()`
- Account: `SymbolFacade.createAccount(privateKey)`
- transaction signature: Symbol Accountの`signTransaction(transaction)`
- signature verification: `SymbolFacade.verifyTransaction(transaction, signature)`
- transaction hash: `SymbolFacade.hashTransaction(transaction)`
- cosignature: Symbol Accountの`cosignTransaction(parentTransaction, detached)`。完全な親transactionを渡し、hashだけをMosaicLynxから直接signしない
- fixture上のsigning bytes: `generationHashSeed || transactionDataBuffer(serializedTransaction)`。`transactionDataBuffer`はsymbol-sdk `SymbolFacade.extractSigningPayload()`と同じ規則を独立照合し、Aggregate v2ではheader後のversion/network/type、maxFee、deadline、transactionsHashまでを含む

### 6.2 NEM

- decode / encode: `TransactionFactory.deserialize(payload)` / transactionの`serialize()`
- Account: `NemFacade.createAccount(privateKey)`
- transaction signature: NEM Accountの`signTransaction(transaction)`
- signature verification: `NemFacade.verifyTransaction(transaction, signature)`
- transaction hash: `NemFacade.hashTransaction(transaction)`
- fixture上のsigning bytes: symbol-sdk `TransactionFactory.toNonVerifiableTransaction(transaction).serialize()`の結果を独立照合する
- multisig cosignature: `CosignatureV1`をsymbol-sdkでdeserializeし、全fieldと参照先Multisig transactionを検証してからNEM Accountの`signTransaction()`へ渡す。参照hashだけを根拠にUIを生成しない

### 6.3 構造化 message

CoreはProduct Specification 12.2のdomain separationとJCSからsigning bytesを生成するが、Ed25519署名自体を実装しない。

- Symbolは`SymbolFacade.createAccount(privateKey).keyPair.sign(signingBytes)`を使用し、symbol-sdk Symbol `Verifier`で返却前に検証する。
- NEMは`NemFacade.createAccount(privateKey).keyPair.sign(signingBytes)`を使用し、symbol-sdk NEM `Verifier`で返却前に検証する。
- MosaicLynx独自のEd25519、ed25519-keccak、SHA3 / Keccak primitive実装を本番署名経路に持たない。

署名後はsymbol-sdk VerifierまたはFacadeの`verifyTransaction()`でsignatureを検証し、signed payloadをsymbol-sdk factoryで再deserializeして、元payload digest、chain、network、signer、全transaction fieldが不変であることを確認してから返す。

## 7. 固定vectorとrelease gate

実装リポジトリの規範fixtureは次のpathに置く。

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

各正常vectorはmnemonicまたはprivate key、network、accountIndex/path、public key、address、unsigned payload、全解析field、signing bytes、signature、signed payload、hashを含む。秘密値を含むvectorはテスト専用の公開既知値だけを使用する。

各schemaに、少なくともwrong network、wrong signer、unknown version、nonzero reserved、size ±1、trailing byte、truncation全offset、最大整数、overflow、alias、最大件数、最大件数+1、非canonical並び、改ざんtransactions hashを用意する。Web、Extension、Mobileの全実装が同じfixtureを通過しない限りreleaseしない。

## 8. symbol-sdk更新手順

symbol-sdk更新PRは旧版と新版の全schema serialization、Facade signing bytes、network constant、BIP32 pathを差分比較する。差分がない場合もSBOM、package integrity、fixture結果、fuzz corpus結果、reviewer 2名の承認を保存する。差分がある場合はProvider APIまたはchain compatibility versionを更新し、既存Vaultの鍵を再導出して上書きしない。
