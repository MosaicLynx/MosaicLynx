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

`facade.bip32Path(accountIndex)`の返却値を唯一のpath sourceとする。MosaicLynxのsource、設定、Storage、migrationへcoin type、path文字列、hardened flagを別定数として持たない。保存する`derivationPath`は監査・復旧表示用にSDK返却値から生成したsnapshotであり、導出時の入力には使用しない。復旧時も同じ固定SDKの`facade.bip32Path(accountIndex)`から再取得し、snapshotとの不一致をdowngrade / compatibility errorとして拒否する。

`accountIndex`は0から始まる31-bit unsigned integerとし、Profileの`nextAccountIndex`をcopy-on-write commit成功後にだけ増加させる。削除、backup restore、失敗した追加によって既使用indexを再利用しない。

### 2.3 Symbol / NEM共用鍵

上記SDK委譲手順で得た同じ32-byte private keyを次へ渡す。

- Symbol: `new SymbolFacade(network).createAccount(privateKey)`
- NEM: `new NemFacade(network).createAccount(privateKey)`

`NemFacade.BIP32_CURVE_NAME`、`NemFacade.bip32Path()`、`NemFacade.bip32NodeToKeyPair()`はMosaicLynxのmnemonic由来Accountに使用しない。したがってNEM公式walletのmnemonic互換を主張しない。

## 3. Network compatibility

| Chain | Network | SDK name | identifier | generation hash seed |
| --- | --- | --- | --- | --- |
| Symbol | Mainnet | `mainnet` | `0x68` | `57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6` |
| Symbol | Testnet | `testnet` | `0x98` | `49D6E1CE276A85B70EAFE52349AACCA389302E7A9754BCF1221E79494FC665A4` |
| NEM | Mainnet | `mainnet` | `0x68` | 適用なし |
| NEM | Testnet | `testnet` | `0x98` | 適用なし |

Symbolのgeneration hashはSDK `Network.MAINNET / TESTNET.generationHashSeed`と上表の双方に一致しなければbuildを失敗させる。runtimeでnodeから置換しない。

## 4. Transaction allowlist

| Chain | SDK schema | numeric type | version | 追加条件 |
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

## 5. 入力payloadとcanonical判定

- hexは偶数長、hex characterのみ、decoded 256 KiB以下とする。textの大文字小文字はbyte比較に影響させず、decoded bytesを比較する。
- 通常のouter署名要求はsignature fieldが全zeroでなければ拒否する。payloadのsigner public keyは選択Accountと完全一致し、zero signerをMosaicLynxが補完する方式は採用しない。
- aggregate cosignatureだけは署名済みの完全な親aggregateを入力できる。親signature、initiator signer、transactions hash、全embedded transaction、既存cosignatureを検証する。
- SDK factoryでtype/versionを指定してdeserializeし、全fieldを境界検証した後、同一schemaでserializeする。serialized bytesが入力decoded bytesとbyte-for-byte一致しない場合は拒否する。
- reserved field非zero、declared size不一致、trailing bytes、整数overflow、重複または順序不正cosignature、transactions hash不一致、要素数超過を拒否する。
- Symbol unresolved address / unresolved mosaic IDがnamespace alias encodingの場合は、Transferと全Embedded Transferで拒否する。node照会による解決後の値へ暗黙変換しない。
- NEM messageはtype、length、payloadを完全解析し、SDK schemaが保持しないbyteがあれば拒否する。

## 6. 署名とhash

独自のslice計算を署名実装に持たず、固定SDKのFacadeを唯一の生成実装とする。ただしfixtureでは以下の規則を独立実装した期待値と照合する。

### 6.1 Symbol

- signing bytes: `generationHashSeed || transactionDataBuffer(serializedTransaction)`。`transactionDataBuffer`はSDK `SymbolFacade.extractSigningPayload()`と同じ規則を使い、Aggregate v2ではheader後のversion/network/type、maxFee、deadline、transactionsHashまでを含む
- signature: Symbol `KeyPair.sign(signingBytes)`
- hash: `SHA3-256(signature || signerPublicKey || generationHashSeed || transactionDataBuffer)`
- cosignature: 完全な親transaction hash 32 bytesをsignし、signer public keyとcosignature version 0を返す

### 6.2 NEM

- signing bytes: SDK `TransactionFactory.toNonVerifiableTransaction(transaction).serialize()`
- signature: NEM `KeyPair.sign(signingBytes)`（ed25519-keccak規則は固定SDKに従う）
- hash: `Keccak-256(signingBytes)`
- multisig cosignature: `CosignatureV1`の全fieldと参照先Multisig transactionを検証し、参照hashだけを根拠にUIを生成しない

署名後はSDK verifierでsignatureを検証し、signed payloadを再deserializeして、元payload digest、chain、network、signer、全transaction fieldが不変であることを確認してから返す。

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

## 8. SDK更新手順

SDK更新PRは旧版と新版の全schema serialization、Facade signing bytes、network constant、BIP32 pathを差分比較する。差分がない場合もSBOM、package integrity、fixture結果、fuzz corpus結果、reviewer 2名の承認を保存する。差分がある場合はProvider APIまたはchain compatibility versionを更新し、既存Vaultの鍵を再導出して上書きしない。
