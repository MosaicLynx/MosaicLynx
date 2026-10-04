# MosaicLynx Chain Compatibility Specification

## 1. 目的と規範性

本書は鍵導出、network constant、transaction schema、canonical判定、署名対象byte列の規範契約を定義する。Product Specificationのallowlistを具体化し、本書にないSDK機能、type、version、networkを自動的に許可しない。

実装依存はlockfileのintegrity付き `@nemnesia/symbol-sdk` **`3.3.2-pure.2`** に固定する。開発環境の展開済みpackage、global package、互換range、別forkを署名境界で使用しない。更新は本書、fixture、SBOM、差分解析、第三者reviewを伴う仕様変更とする。

## 2. ニーモニック生成と鍵導出

### 2.1 chain 非依存の Mnemonic と core ownership

Mnemonic の生成、検証、seed / root / private key の導出、暗号化・復号は固定された正式 wallet-core のみが行う。MosaicLynx は Bip32 / random / fromMnemonic を呼ばず、Mnemonic / private key を取得しない。core の secret-bearing API と現行 MosaicLynx の提供範囲は [Integration §2](./wallet-core-integration.md) を正本とする。BIP39 English 24 words / 空 passphrase は core の契約であり、Profile password を BIP39 passphrase として使わない。

### 2.2 Chain-specific Account 導出

Mnemonic は Profile の共通 root として扱うが、Account / Key Identity の導出は対象 Chain ごとに独立して行う。導出要求には対象 Chain と Profile Network を明示し、対象 Chain に対応する Wallet Core / Chain integration の導出契約だけを使用する。

- Symbol: Symbol-specific な導出契約で Symbol Software Key を導出し、Symbol の正本実装から Symbol Account の public key と address を取得する。
- NEM: NEM-specific な導出契約で NEM Software Key を導出し、NEM の正本実装から NEM Account の public key と address を取得する。

Symbol 用に導出した秘密鍵を NEM 用として、または NEM 用に導出した秘密鍵を Symbol 用として暗黙に利用してはならない。同じ mnemonic または同じ account index を別 Profile で使用しても、Symbol / NEM の Account / Key Identity は別々に管理する。

`accountIndex`は0から始まる31-bit unsigned integerとし、Profileの`nextAccountIndex`をcopy-on-write commit成功後にだけ増加させる。削除、backup restore、失敗した追加によって既使用indexを再利用しない。具体的な derivation path、algorithm、library、seed encoding、hardened rule および各 Chain の key implementation は Wallet Core / Chain integration の責務であり、本書では新たに定義しない。

Account生成、import、Identity導出では対象 Chain を明示し、対象 Chain の正本実装から public key と address を取得する。MosaicLynx は楕円曲線演算、byte order 変換、public key 導出、address network byte、checksum、base32 encode または Wallet Core の秘密情報処理を再実装しない。raw private key import の許可、検証、拒否条件および UX は既存の Wallet Core / platform 契約に従う。

## 3. Network compatibility

| Chain  | Network | symbol-sdk network name | identifier | generation hash seed                                               |
| ------ | ------- | ----------------------- | ---------- | ------------------------------------------------------------------ |
| Symbol | Mainnet | `mainnet`               | `0x68`     | `57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6` |
| Symbol | Testnet | `testnet`               | `0x98`     | `49D6E1CE276A85B70EAFE52349AACCA389302E7A9754BCF1221E79494FC665A4` |
| NEM    | Mainnet | `mainnet`               | `0x68`     | 適用なし                                                           |
| NEM    | Testnet | `testnet`               | `0x98`     | 適用なし                                                           |

Symbolのgeneration hashはsymbol-sdk `Network.MAINNET / TESTNET.generationHashSeed`から取得し、上表は固定versionの回帰期待値としてだけ使用する。identifier、epoch、generation hashをMosaicLynx独自のruntime定数として複製せず、期待値と不一致ならbuildを失敗させる。runtimeでnodeから置換しない。

### 3.1 symbol-sdk utility利用

- hex形式検査と変換はsymbol-sdk `utils.isHexString()`、`utils.hexToUint8()`、`utils.uint8ToHex()`を使用する。MosaicLynx独自hex codecを本番経路に持たない。
- public key、signature、hash は symbol-sdk の `PublicKey`、`Signature`、`Hash256` で検証する。private key / Mnemonic の検証・導出・署名に SDK を使わない。
- Symbol addressはsymbol-sdk Symbol `Address`、NEM addressはsymbol-sdk NEM `Address`でparse / formatし、Profile networkとの一致は対応Facadeの`network.isValidAddress()` / `isValidAddressString()`で検証する。
- Symbol unresolved addressのalias判定は`Address.isAlias()`、unresolved mosaic IDのalias判定はsymbol-sdk `isMosaicAlias()`を使用する。
- Aggregateのembedded transactions hashは`SymbolFacade.hashEmbeddedTransactions()`で再計算し、payload内`transactionsHash`と一致させる。
- timestamp / deadlineのchain epoch変換はSymbol / NEM FacadeのNetwork timestamp APIを使用し、MosaicLynx独自epoch計算を持たない。

## 4. Transaction allowlist

| Chain  | symbol-sdk schema                         | numeric type |               version | 追加条件                                      |
| ------ | ----------------------------------------- | -----------: | --------------------: | --------------------------------------------- |
| Symbol | `TransferTransactionV1`                   |      `16724` |                     1 | unresolved aliasなし、innerなし               |
| Symbol | `AggregateCompleteTransactionV2`          |      `16705` |                     2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol | `AggregateBondedTransactionV2`            |      `16961` |                     2 | `EmbeddedTransferTransactionV1`だけ、1..100件 |
| Symbol | detached / attached aggregate cosignature | 親typeに従う | cosignature version 0 | 完全な親payloadを同時に検証                   |
| NEM    | `TransferTransactionV1`                   |        `257` |                     1 | innerなし                                     |
| NEM    | `TransferTransactionV2`                   |        `257` |                     2 | innerなし                                     |
| NEM    | `MultisigTransactionV1`                   |       `4100` |                     1 | innerはTransfer v1/v2を1件、入れ子なし        |
| NEM    | `CosignatureV1`                           |       `4098` |                     1 | 完全な参照先Multisig v1を同時に検証           |

SDKに同名typeの別versionが存在しても拒否する。特にSymbol Aggregate v1/v3、任意のEmbedded type、NEM multisig account modificationはallowlist外である。

### 4.1 共通field規範

次表と4.2〜4.4をInspectionの正本とし、列挙したfieldを一つでも読み取り、型検証、表示できない実装はそのschemaを許可しない。`u8/u16/u32/u64`はcatbufferの符号なしlittle-endian整数で、`u64`はJavaScript `number`へ変換せずBigIntまたはSDK value objectのまま`0..2^64-1`を検証する。固定長byteは長さ完全一致、可変長byteは宣言長完全一致を必須とする。SDK objectにないreserved fieldも再serialize一致とnegative fixtureでzeroを検証する。

| field群                                      | 型・範囲                                  | reject条件                                                    | UI                                                |
| -------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| size / payloadSize / innerSize / messageSize | schema所定の`u32/u16`、入力byte内に収まる | 過小・過大、overflow、trailing、alignment外padding非zero      | byte数、inner件数                                 |
| signature                                    | 64 byte                                   | unsigned outerは非zero、署名済み親は暗号検証失敗              | statusと必要時full hex                            |
| signerPublicKey                              | 32 byte                                   | all-zero、選択Account/期待roleと不一致。embedded signerも必須 | full hex、Account名                               |
| version / network / type                     | schema所定整数、3章・4章の完全一致        | 未知値、要求scopeとの不一致                                   | chain、Mainnet/Testnet、type/version              |
| fee / maxFee / amount                        | `u64`、`0..2^64-1`                        | deserialize/加減算overflow、schema外負数                      | atomic整数。名称・桁数を検証済みの場合だけ換算    |
| timestamp / deadline                         | chain所定整数                             | SDK timestamp変換不能、deadline < timestamp（NEM）            | ISO換算とraw整数。現在chain時刻との有効性は未照合 |
| address                                      | Symbol 24 byte / NEM 40 ASCII byte        | checksum/network不一致、Symbol alias、NEM形式不正             | 全文、短縮は補助のみ                              |
| mosaicId                                     | `u64`                                     | Symbol alias bit、同一Transfer内の重複、非canonical順         | `0x` + 16桁uppercase、atomic amount               |
| message                                      | 宣言type + 宣言長 + byte列                | 未知type、長さ不一致、制御文字を安全表示不能                  | UTF-8安全表示とfull hex。暗号性は断定しない       |
| reserved / padding                           | schema所定幅、値0                         | 一つでも非zero                                                | technical detailsにfield名と0                     |

配列はSDK schemaが規定するcanonical orderを保持する。mosaic IDの重複、sort不正、embedded transaction間paddingの非zero、cosignature signer重複または非canonical順を拒否する。空Transfer mosaic配列はmessageが空でなければ許可できるが、asset効果0と明示する。amount 0は許可schema上有効でも強調表示する。

### 4.2 Symbol全field

| schema                                                            | 必須field（wire順、reservedを含む）                                                                                                                                                                                                                                         | schema固有のreject条件                                                                                             | fixture ID prefix            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `TransferTransactionV1`                                           | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]`                     | type=`16724`、version=1、aliasなし、mosaic canonical order、宣言count/size一致                                     | `SYM-TRANSFER-V1-{MAINNET    | TESTNET}-NNN` |
| `EmbeddedTransferTransactionV1`                                   | `size, embeddedTransactionHeaderReserved_1, signerPublicKey, entityBodyReserved_1, version, network, type, recipientAddress, mosaicsCount, messageSize, transferTransactionBodyReserved_1, message, mosaics[{mosaicId, amount}]`                                            | 親とnetwork一致、type=`16724`、version=1、signature/fee/deadlineを持たない                                         | `SYM-EMBEDDED-TRANSFER-V1-…` |
| `AggregateCompleteTransactionV2` / `AggregateBondedTransactionV2` | `size, verifiableEntityHeaderReserved_1, signature, signerPublicKey, entityBodyReserved_1, version, network, type, fee, deadline, transactionsHash, payloadSize, aggregateTransactionHeaderReserved_1, transactions[], cosignatures[{version, signerPublicKey, signature}]` | type=`16705/16961`、version=2、embedded 1..100、payloadSize一致、transactionsHash再計算一致、cosignature version=0 | `SYM-AGG-{COMPLETE           | BONDED}-V2-…` |
| aggregate cosignature request                                     | `parentPayload`の上記全field + `parentHash, cosignerPublicKey, detached`                                                                                                                                                                                                    | 完全親なし、親hash/signature/transactionsHash不正、既存cosigner、initiatorと同じkey、選択Account不一致             | `SYM-COSIG-V0-{ATTACHED      | DETACHED}-…`  |

Symbolの`maxFee`はouterの`fee` fieldそのものであり、ノードのfee multiplierを照会しないMosaicLynxはactual feeを確定しない。UIは`最大手数料 −maxFee atomic XYM`と表示し、asset正味効果ではinitiatorに`[-maxFee, 0]`の範囲として別計上する。Transferごとに各mosaic `m`について`delta[embeddedSigner,m] -= amount`、`delta[recipient,m] += amount`とする。self-transferもgross送付と受取を表示し、netは0とする。aggregateでは全embeddedをBigIntで加算し、途中または合計が`[-(2^64-1)*100, +(2^64-1)*100]`を越える実装上overflowを拒否する。cosignature画面では親の効果を「成立時の親Transaction効果」として表示し、cosigner自身のasset減少へ誤算入しない。

署名者roleは、通常Transferでouter signer=`initiator / asset sender`、Aggregateでouter signer=`initiator / fee payer`、各embedded signer=`embedded sender`とする。選択keyがunsigned outer signerならtransaction署名、親Aggregateのinitiatorでなく、かつ既存cosignatureに存在しなければ`cosigner`候補とする。payloadだけからmultisig membershipは確定できないため「cosigner候補・オンチェーン権限未照合」と表示し、membershipを断定しない。

### 4.3 NEM全field

| schema                  | 必須field（wire順、子objectを含む）                                                                                                                                                                                                                                            | schema固有のreject条件                                                                                                              | fixture ID prefix         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `TransferTransactionV1` | `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline, recipientAddressSize, recipientAddress, amount, messageEnvelopeSize, message?{messageType,messageSize,message}`                       | type=`257`、entity version=1、reserved=0、固定size=`32/64/40`、unsigned signature=zero、mosaic配列なし、全length一致                | `NEM-TRANSFER-V1-{MAINNET | TESTNET}-NNN` |
| `TransferTransactionV2` | v1全field + `mosaicsCount, mosaics[{mosaicId{namespaceId{nameSize,name},nameSize,name},amount}]`                                                                                                                                                                               | entity version=2、qualified mosaic IDの各nameがSDK規則に適合、重複/非canonical順なし、count一致                                     | `NEM-TRANSFER-V2-{MAINNET | TESTNET}-NNN` |
| `MultisigTransactionV1` | common header `type, version, entityBodyReserved_1, network, timestamp, signerPublicKeySize, signerPublicKey, signatureSize, signature, fee, deadline` + `innerTransactionSize, innerTransaction(TransferV1/V2全field), cosignaturesCount, cosignatures[CosignatureV1全field]` | type=`4100`、inner 1件、inner multisig禁止、size/network一致。通常の開始署名はcosignaturesCount=0。参照親では0..100、重複signerなし | `NEM-MULTISIG-V1-…`       |
| `CosignatureV1`         | common header全field + `multisigTransactionHashOuterSize, multisigTransactionHashSize, multisigTransactionHash, multisigAccountAddressSize, multisigAccountAddress`                                                                                                            | type=`4098`、entity version=1、固定size=`36/32/40`、完全な参照先Multisig payloadなし、hash/address/inner不一致                      | `NEM-COSIG-V1-…`          |

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

## 6. 署名 bytes、正式 core 委譲、公開 hash

秘密鍵不要の SDK 処理と raw signing を分離する。全 signing operation は [wallet-core Integration](./wallet-core-integration.md) の正式 `sign(store, request, password_utf8)` に委譲する。MosaicLynx は秘密鍵を export・保持しない。`symbol-sdk` の秘密鍵付き Account / KeyPair / sign / cosign primitive を production signing で呼ばない。

### 6.1 Symbol

- decode / encode は SymbolTransactionFactory.deserialize / transaction.serialize。network は要求 Scope と固定 SDK Network が一致することを確認する。
- transaction signing bytes は network-bound `SymbolFacade.extractSigningPayload(transaction)` の返す Uint8Array 全体。これは generationHashSeed + SDK transactionDataBuffer であり、Aggregate v2 は version / network / type、fee、deadline、transactionsHash の対象規則に従う。独自 slice / generation hash 重複付加をしない。
- core の raw signature を transaction.signature に設定し、公開 `SymbolFacade.verifyTransaction(transaction, signature)` / hashTransaction を使用する。SDK を使う署名生成は行わない。
- cosigning の inspection target は full signed Aggregate、全 embedded、既存 signature / cosignature、selected cosigner / Scope / role。親 signature を verifyTransaction、既存 cosignature を parent hash bytes と各 public key の Verifier で検証する。duplicate signer / wrong role / network mismatch / 親期限切れは拒否する。
- cosigning bytes はその full parent から `SymbolFacade.hashTransaction(parent).bytes` で再計算した raw 32 bytes。これに core sign を適用し public-key Verifier で検証する。外部 hash 単体は入力として受理しない。
- attached / detached の wire projection は [Interfaces §9.6.1](./interfaces.md) に従い、parent payload に署名要素を自動追記しない。mode によらず version 0・signature bytes は同じ親 hash に binding される。

### 6.2 NEM

- decode / encode は TransactionFactory.deserialize / serialize。
- transaction signing bytes は `NemFacade.extractSigningPayload(transaction)` の Uint8Array。固定 SDK の `TransactionFactory.toNonVerifiableTransaction(transaction).serialize()` と同じ対象を固定 vector で照合する。core が NEM primitive を適用し generation hash / prefix を追加しない。
- core signature を元 transaction の signature field に設定し NemFacade.verifyTransaction / hashTransaction で検証・計算する。
- cosigning は full signed MultisigV1 parent と unsigned CosignatureV1 を受ける。outer / inner network、全 field、親と既存 cosignature の signature、親 hash、multisigAccountAddress と inner signer、selected cosigner、duplicate / role / deadline を検証する。parent hash は `NemFacade.hashTransaction(parent)` で再計算し CosignatureV1 の参照 hash と一致させる。
- cosigning bytes は CosignatureV1 の NemFacade.extractSigningPayload 結果。core sign 後に CosignatureV1 の署名済み payload / hash / signer を検証して [Interfaces §9.6.1](./interfaces.md) の結果を返す。parent には追記しない。

### 6.3 Structured message

[Interfaces §9.4](./interfaces.md) の canonical StructuredMessage 全体を JCS にし、ASCII `MOSAICLYNX\0MESSAGE\0V1\0` prefix を一度だけ連結して core sign に渡す。message 専用 core API を仮定しない。Symbol / NEM の public-key Verifier で exact bytes と signature を返却前に検証する。hex の解釈不能 bytes や別 format へ fallback しない。

全経路で request / immutable target / selected public key / Chain / Network / exact bytes / result の binding を検証する。transaction は署名 field 以外の全 field と canonical bytes が元要求と同じであることを再deserializeして確認する。cosignature と message の公開 result は Interfaces を正本とする。署名生成の唯一の実装は wallet-core、public hash / parse / verify の固定 SDK 利用は core の秘密情報処理を代替しない。

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

各正常 vector は network、public identity、unsigned / parent payload、全解析 field、exact signing bytes、signature、public result / hash を含む。secret-bearing core vector は外部 core の公開既知値として別に照合し、MosaicLynx production / UI / adapter に Mnemonic / private key を入力しない。

各schemaに、少なくともwrong network、wrong signer、unknown version、nonzero reserved、size ±1、trailing byte、truncation全offset、最大整数、overflow、alias、最大件数、最大件数+1、非canonical並び、改ざんtransactions hashを用意する。Web、Extension、Mobileの全実装が同じfixtureを通過しない限りreleaseしない。

## 8. symbol-sdk更新手順

symbol-sdk更新PRは旧版と新版の全schema serialization、Facade signing bytes、network constant、core vector との対応を差分比較する。差分がない場合もSBOM、package integrity、fixture結果、fuzz corpus結果、reviewer 2名の承認を保存する。差分がある場合はProvider APIまたはchain compatibility versionを更新し、既存Vaultの鍵を再導出して上書きしない。

## 9. Traceability

本表は Chain / Network / transaction compatibility の外部契約を、承認済み Requirements、Design、関連 Specification および canonical owner / OPEN へ追跡するための表である。本書は Product の product scope、Profile の backup contract、共通 handoff envelope または wallet-core の内部形式を再定義しない。

| Requirement / acceptance                                                             | Design                                                                 | 本仕様     | Canonical owner / OPEN                                                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CR-005`、`CR-NFR-005`、`CR-AC-003`                                                  | Architecture §6.7、Interfaces Design §3.3、Signing Flow §4、§8〜§15    | §2〜§5     | Chain / Network identity、address network、schema compatibility は本書。Profile Network association は Profile / Account Specification                                                    |
| `CR-002`、`CR-004`、`CR-007-TX`、`CR-007-MSG`、`CR-AC-002`、`CR-AC-005`、`CR-AC-006` | Signing Flow §8〜§15、Security Design §11、Browser / Mobile Design §10 | §4、§5、§7 | allowlist、全 field inspection、canonicality、blind-signing rejection は本書。trusted UI / approval は platform Specification                                                             |
| `CR-006`、`CR-NFR-009`、`CR-NFR-012`、`CR-AC-004`、`CR-AC-012`                       | Signing Flow §7、§19〜§23、Interfaces Design §6、§9                    | §5〜§7     | signed result の request / signer / network 対応は Signer / Interfaces / Handoff が所有し、本書は chain-specific verification を所有                                                      |
| `CR-008`、`CR-013`、`CR-NFR-004`、`CR-AC-010`                                        | Architecture §6.8、Security Design §6、§13                             | §2、§6     | key derivation、Wallet Store、raw signing は wallet-core / Chain integration の外部契約。本書は MosaicLynx 側で再実装しない                                                               |
| `CR-NFR-006`、`CR-AC-008`                                                            | Architecture §3、§16、Security Design §16                              | §7         | Mainnet capability の evidence / approval policy は ADR 0001、`evidence-policy.json`、Mainnet release evidence。Chain fixture は gate evidence の入力であり gate policy の owner ではない |
| `CR-007-TX`、`CR-007-MSG`、`CR-AC-015`                                               | SDK Design §7、Signing Flow §14、Interfaces Design §9                  | §4、§6、§8 | Aggregate / multisig / cosignature の v1 operation scope / result は Interfaces §9.6.1 と platform / SDK Specification。allowlist外は本書で拒否し、暗黙に拡張しない                       |

### 9.1 OPEN と下流引継ぎ

- 本書にない transaction type / version、schema、field、network または signing byte 規則は、SDK / Browser / Mobile / Handoff から推測して追加しない。
- Interfaces §9.6.1 の optional cosignature scope と本書の allowlist を共通契約とし、非対応 capability は拒否する。必須化・他 type の拡張を暗黙に行わない。
- symbol-sdk version、fixture contract version、parser version の更新は、§8 の手順と Mainnet release evidence の同一 revision 更新を必要とする。
