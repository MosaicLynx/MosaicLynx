# MosaicLynx Browser Extension Specification

## 1. 目的と規範性

本書は、MosaicLynx Browser Extension を、Web Application / dApp からの request を受け付け、利用者が確認・承認した場合だけ wallet-core に署名を依頼する local Signer として実装するための外部動作契約を定める。

Browser Extension は trusted wallet context である。ただし、Web page、Provider、injected bridge、Content Script、SDK が渡す request、Origin、Account、表示 metadata および caller の自己申告は trusted ではない。Browser が観測した caller context、Extension が管理する permission、trusted UI、署名対象の semantic inspection および wallet-core の cryptographic boundary を分離する。

本書の `MUST`、`MUST NOT`、`SHOULD` および `MAY` は、[interfaces.md](./interfaces.md) の規範語に従う。本書は Browser Extension 固有の適用を定めるが、共通 identifier、Scope、Origin、request / response、signing state、error、chain-specific serialization および wallet-core の意味を再定義しない。

## 2. 適用範囲と authority

### 2.1 対象範囲

本書の対象は次の local path である。

```text
Web Application / dApp
        ↓ untrusted page input
page-facing Provider / injected bridge
        ↓ untrusted transport boundary
Content Script
        ↓ browser-provided sender context
Extension privileged host
        ↓ trusted wallet UI / permission / approval
wallet-core
        ↓ cryptographic boundary
signed result
```

対象には Provider exposure、caller / Origin binding、connection、permission、public Account disclosure、request admission、inspection、approval、authentication、wallet-core invocation、response correlation、concurrency、timeout、cancellation および Extension lifecycle を含む。

対象外には SDK の実装、Relay HTTP / storage / encryption、Mobile App、wallet-core の内部実装、Browser framework / bundler / UI framework、Storage engine、Chrome API wrapper、CSS および test framework を含む。対象外の責任は既存 authority または下位実装へ委譲し、本書から新しい endpoint、wire field、error code、signing primitive または token model を追加しない。

### 2.2 上流契約

| 契約領域                          | authority                                                                                                                                                                                                                                                                    | 本書での扱い                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Browser Extension 要求            | [browser-extension.md](../requirements/browser-extension.md)、[requirements.md](../requirements/requirements.md)                                                                                                                                                             | Browser-only の範囲、top-level Origin、permission、UI、lifecycle、secret boundary を適用する               |
| SDK / Provider                    | [sdk.md](./sdk.md)、[web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md)、[interfaces.md](./interfaces.md)                                                                                                                                                   | Provider API、公開 API、capability、公開 identity、request / response、error mapping を再利用する          |
| signing lifecycle / authorization | [signing-protocol.md](./signing-protocol.md)                                                                                                                                                                                                                                 | state set、approval binding、authentication、pre-sign revalidation、cancel、unknown outcome を適用する     |
| transaction / message bytes       | [chain-compatibility-spec.md](./chain-compatibility-spec.md)、[product-spec.md](./product-spec.md)                                                                                                                                                                           | Symbol / NEM の decode、canonicality、inspection、signing bytes、hash および structured message を適用する |
| Profile / Account / lock          | [profile-account-spec.md](./profile-account-spec.md)                                                                                                                                                                                                                         | Profile network、Account identity、lock、`every-signature` authentication を適用する                       |
| Browser trust / security          | [browser-extension.md](../design/browser-extension.md)、[architecture.md](../design/architecture.md)、[security-design.md](../design/security-design.md)、[interfaces.md](../design/interfaces.md)、[signing-flow.md](../design/signing-flow.md)、[sdk.md](../design/sdk.md) | Browser-specific trust boundary、responsibility、failure および lifecycle の実装可能な下位契約とする       |

上表にある仕様間で concrete contract が競合する場合、対象仕様の明示した authority に従う。Handoff の concrete API / error と Signing Protocol の common semantics を Browser Extension 独自の別契約へ変換しない。

### 2.3 初回提供範囲

- 初回 Browser Extension milestone の対象 Browser は Chrome である。最低 version、配布 channel、Manifest version および release configuration は未確定部分を勝手に固定しない。
- Browser Extension は local Provider route を提供する。Mobile Relay を local request の自動 fallback として使用しない。
- Mainnet signing capability は、current release と適用中の release / evidence policy の gate を満たした trusted Signer / release security authority だけが有効化できる。gate が未達成または判定不能な場合は Mainnet signing を disabled / unavailable とし、利用可能・成功可能と報告しない。Browser Provider と SDK は gate evaluator または authority ではない。Testnet-only で安全に継続できる場合は、Mainnet gate failure だけを理由に Testnet signing まで停止しない。

## 3. 用語と責任境界

| 用語                                    | 本書での意味                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Provider                                | `window.mosaicLynx` を通じて page に公開される既存 Provider API。wallet、Signer、Origin authority または approval authority そのものではない                       |
| page-facing boundary                    | Web page / injected context が Provider を観測・呼び出す非特権境界                                                                                                 |
| privileged host                         | Extension 管理下で browser context、permission、request、trusted UI、lifecycle および wallet-core invocation を調整する host                                       |
| browser-provided trusted caller context | Browser / Extension platform が提供する sender、top-level document、tab、frame、Origin 等の観測値。具体 API 名は固定しない                                         |
| Public Account Identity                 | [interfaces.md §5.3](./interfaces.md) の `Scope`、`address`、`publicKey` からなる外部公開可能な identity                                                           |
| Internal Account Reference              | Profile、permission または wallet-core key slot を内部で解決する参照。Public Account Identity と異なり page に公開しない                                           |
| connection                              | Origin-scoped な public Account disclosure と permission grant の操作。signing approval ではない                                                                   |
| approval                                | 一つの request / signing target に対する trusted UI からの利用者の明示承認。Authentication、Signing-capable unlock および Account authorization とは別の条件である |
| signing authorization                   | 同一の Signer-owned Profile-local security context に対して、4条件すべてが成立した短寿命の署名許可                                                                 |
| inspection                              | signing target 全体を parse、validate、semantic analysis し、trusted UI 用 confirmation model を生成する処理                                                       |
| stale context                           | 現在の document、Origin、tab / frame、permission、Profile、Account、Scope、target または protocol context と一致しない状態                                         |

Browser Extension は Web page の入力を検証する trusted Signer host であるが、Web page の入力自体を trusted data として扱わない。Relay はこの local path に含まれず、Relay を通じて local request を再送・補完・fallback しない。

## 4. Component responsibility

| component                              | Browser Extension との境界                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web Application / dApp                 | Provider を呼び出し、signing intent を作成し、受け取った結果を独立検証し、announce / network 処理を担う。Extension の Origin authority、approval、secret を制御しない                                                                |
| page-facing Provider / injected bridge | 既存 Provider contract の検出、呼び出しおよび response delivery を担う。secret、内部 permission、approval、authentication、Wallet Store を持たない                                                                                   |
| Content Script                         | page と privileged host の transport boundary を仲介する。page の自己申告を caller authority に昇格させない                                                                                                                          |
| privileged host                        | browser caller context、request、permission、connection、Account / Scope、inspection、trusted UI、authentication、lifecycle、wallet-core invocation、result validation および response correlation を担う                            |
| trusted approval UI                    | Extension が管理する表示・操作領域で Origin、target、Account、Scope、operation、signer role および影響を表示し、approve / reject を受ける。page DOM や dApp label を authority にしない                                              |
| Chain integration                      | Chain Compatibility Specification に従い、decode、field validation、canonical reserialization、semantic inspection、signing result validation を担う                                                                                 |
| wallet-core                            | Wallet Store、key lifecycle、秘密情報を使用する cryptographic operation、chain-specific key および raw signing を担う。caller、permission、UI、approval は担わない                                                                   |
| SDK                                    | Provider discovery、公開 API、request construction、dispatch、response correlation、timeout / cancellation、error normalization を担う。Origin authority、inspection、approval、authentication、secret および raw signing は担わない |
| Relay / Mobile App                     | local Browser Extension の責任主体ではない。Provider route の failure を Relay route の成功へ変換しない                                                                                                                              |

## 5. Provider Contract

### 5.1 公開名称、version、methods

Provider の page-facing global name は `window.mosaicLynx` とする。Provider API の required major version は `2` であり、SDK / Handoff の既存 compatibility rule に従う。Provider の `version` は実装 version の情報であり、自己申告だけで trust、Origin、permission または signing authority を証明しない。`apiVersion` は Provider API compatibility 判定に使用するが、対応できない major を downgrade、旧 operation または別 transport へ変換しない。

以下は SDK の public API ではなく、Web page と Extension の Provider boundary の契約である。SDK の `connect()`、`signTransaction()`、`signData()` 等は [sdk.md](./sdk.md) の責任範囲で Provider を利用し、Provider が SDK の代替 authority になることはない。

Provider は、[interfaces.md](./interfaces.md)、[sdk.md](./sdk.md)、[web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md) および本書の整合した page-facing public operation semantics を、実装で提供可能な範囲で公開する。現行 `@mosaiclynx/provider-api` の operation shape は implementation evidence であり、公開 field / result の authority ではない。公開 operation の詳細は §5.2 に従い、新しい method、event または field を追加しない。

| Provider method / event                                   | 意味                                                                                                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect({ chain, network })`                             | 指定 Scope の public Account disclosure と Origin-scoped permission を利用者へ要求する。signing approval、ownership proof、authentication または permanent authorization ではない |
| `disconnect()`                                            | 現在の caller context に対応する connection / permission の終了を要求する。既存 signing outcome を取り消したことを意味しない                                                      |
| `getAccounts()`                                           | 現在の Origin / connection scope で page に公開可能な Account projection を取得する。cache の存在は最新 permission または signing authorization の証明ではない                    |
| `getActiveAccount(scope)`                                 | 指定 Scope の公開 active Account projection を取得する。未接続または確認不能は success として扱わない                                                                             |
| `signTransaction(params)`                                 | 既存 Handoff / SDK の transaction signing request を Extension の admission、inspection、approval、authentication および wallet-core boundary へ渡す                              |
| `signMessage(params)`                                     | 既存 structured message signing contract に従う `MESSAGE_SIGN` request を処理する。raw arbitrary message signing ではない                                                         |
| `cosignTransaction(params)`                               | 既存 Provider / SDK capability の範囲で `COSIGNATURE_SIGN` を処理する。公開範囲が未確定の chain / target は利用可能にしない                                                       |
| `on(event, listener)` / `removeListener(event, listener)` | 既存 Provider event contract に従って public state change を通知する。event を approval、authentication、ownership または signing success の証明にしない                          |

Provider の既存 event 名は `accountsChanged` と `disconnect` である。`accountsChanged` は page に開示可能な Account projection が変更、無効化または接続 scope から外れたことを通知し、内部 Account / Profile ID、secret、permission detail または signing outcome を含めない。`disconnect` は connection context の終了・revoke・喪失を通知し、署名が未実行だったこと、署名が失敗したことまたは結果が存在しないことを表明しない。

Provider の exact JSON / RPC envelope、wire serialization、listener delivery、Provider software version の許容範囲および capability advertisement の exact field は、上記の整合した公開契約を実装へ対応付ける下流 implementation boundary の責任とする。内部表現の差分を page-facing public contract の authority にせず、新しい Provider method、event、field または API version を追加しない。

### 5.2 Provider operation shape

Provider の page-facing TypeScript method / result shape の normative authority は、[interfaces.md](./interfaces.md)、[sdk.md](./sdk.md)、[web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md) および本書の整合した公開契約である。現行 `@mosaiclynx/provider-api` の TypeScript shape は implementation evidence にとどまり、そのまま page-facing normative contract として使用しない。現行 package の `MosaicAccount.id`、`MosaicAccount.profileId`、signing params の `accountId`、bare な signed result との差分は downstream Implementation synchronization の対象であり、本書は既存実装に合わせて internal ID、internal selector または旧 result shape を復活させない。実装が満たす論理的な入出力は次のとおりである。

| operation           | input                                                                                                 | successful result                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `connect`           | `MosaicScope`（`chain`、`network`）                                                                   | 指定 Scope で許可された `PublicAccountIdentity` の readonly collection                                                             |
| `disconnect`        | なし                                                                                                  | `void`。current caller の connection / permission を終了する                                                                       |
| `getAccounts`       | なし                                                                                                  | current caller に公開可能な `PublicAccountIdentity` collection                                                                     |
| `getActiveAccount`  | `MosaicScope`                                                                                         | Scope に対応する `PublicAccountIdentity` または `undefined`                                                                        |
| `signTransaction`   | Scope、hex payload、既存 contract の optional `expectedSignerPublicKey`                               | Handoff-compatible な known signed result または Signer-originated `RESULT_UNKNOWN`                                                |
| `signMessage`       | Scope、既存 structured message の purpose、nonce、issuedAt、expiry、payload および既存 optional field | Handoff-compatible な known signed result または Signer-originated `RESULT_UNKNOWN`                                                |
| `cosignTransaction` | Chain-specific な parent / payload、detached 等、既存 contract の field                               | Chain-specific `MosaicLynxCosignature`。Symbol と NEM の target / result shape を混同しない。Account は trusted context で解決する |

上表の page-facing input、Account record、return value および event payload に、`profileId`、internal `accountId`、Wallet Store ID、key slot、internal routing reference またはそれらを代替する opaque handle を含めない。Account の公開 projection は §10.1 の `PublicAccountIdentity` に限る。Account の利用者選択が必要な場合は trusted Signer UI / Signer-owned context で解決し、page から受け取った selector を authorization、ownership、key selection または signer identity の authority としない。

Provider の内部 RPC method 名（`permissions_connect`、`permissions_disconnect`、`account_list`、`account_getActive`、`sign_message`、`sign_transaction`、`cosign_transaction`）を使用する実装は、これらを page へ新しい endpoint として公開せず、既存 Provider API の method semantics へ対応付ける。request / response は requestId と operation の one-to-one correlation を持ち、成功 result の payload、signer、Account、Scope、target および caller は privileged host が検証したものに限る。

Provider の page method signature に requestId を追加して新しい公開 envelope を作ることはしない。privileged host / bridge は既存の共通 request identity を内部で保持し、method invocation、response、Promise settlement および page delivery を一つの logical request に相関付ける。相関できない response は page に success として返さない。

Provider-native Account record を内部で使用する場合、その内部 record は page-facing Account record として公開しない。privileged host / Signer 内部の routing reference は現在の browser caller、permission、Scope、Profile-local context、Account および expected signer から対象を解決するためだけに使用し、page input、page return、permission authority、ownership proof、Account authorization または key selection authority として扱わない。

### 5.2.1 Signer-originated signing result

Provider の page-facing signing result と、Provider から SDK adapter へ渡す内部 representation は、[web-transaction-handoff-spec.md §5.2.1、§7.2](./web-transaction-handoff-spec.md) および [sdk.md §5](./sdk.md) の意味を保持しなければならない。exact Provider wire field は既存 Provider contract に委譲するが、bare な `SignedTransaction` / `SignedMessage` だけを返して known success と result unknown、または delivery disposition を区別できない契約としてはならない。

- known signed result は signing outcome `SUCCEEDED` と、同じ result に付随する Signer-originated `deliveryDisposition`（`PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN`）を保持する。SDK adapter は同じ result と disposition を `MosaicLynxSigningResult<T>` の `outcome: 'succeeded'` branch へ意味不変に渡す。
- Signer が署名生成自体の成否を安全に確定できない場合だけ `RESULT_UNKNOWN` を保持する。この branch は signed result と delivery disposition を持たず、SDK adapter は `outcome: 'resultUnknown'` へ意味不変に渡す。
- Provider、Promise settlement、Content Script、page delivery、browser lifecycle、SDK adapter または transport completion は、`RESULT_UNKNOWN`、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` を生成、推測、確定または別の意味へ書き換えない。transport や page への response が完了したことだけで `DELIVERED` としない。

`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は error code ではない。cosignature の public result union は既存の `OPEN-BEX-006` および上流の OPEN を維持し、本節はそれを確定しない。

### 5.2.2 Provider collection と SDK / Handoff active projection

Provider の `connect` / `getAccounts` が扱う Account collection は Browser-specific な public permission / disclosure projection であり、permission set そのものや SDK / Handoff の public response cardinality とは別である。Provider は collection を保持・返却できるが、その collection を SDK `connect(scope)` の result として暗黙に返してはならない。

SDK / Handoff の `connect(scope)`、`getActiveAccount(scope)` および `refreshActiveAccount(scope)` が dApp へ返す Account は、既存 Handoff の `MosaicLynxActiveAccount` と common の `PublicAccountIdentity` に対応する singular public identity である。

この active projection は、trusted Browser host が current browser caller、current Profile、current permission、current active Account および validated `Scope` を照合して導出する。current active Account が current permission の対象であり、Scope と address / publicKey の chain-specific validation を満たす場合だけ、SDK / Handoff の singular response として返す。Provider collection の大きさ、array order、先頭 Account、dApp supplied の `accountId`、display name または stale cached Account は selection authority ではない。`expectedSignerPublicKey` は signer expectation の制約であり、internal Account selector ではない。

| 状態                    | Browser Provider collection                                                                                  | SDK / Handoff の public response                                                                                                                                                                                             | 適用する既存 semantics                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Account 0件             | 空 collection。公開可能な active projection はない                                                           | `connect(scope)` は singular Account を resolve せず、既存 Handoff §10 の `NOT_CONNECTED` mapping に従う。`getActiveAccount` / `refreshActiveAccount` は `undefined`                                                         | empty collection を Account identity の成功値へ昇格しない              |
| Account 1件             | 1件の `PublicAccountIdentity`                                                                                | その Account だけを singular active projection として返す                                                                                                                                                                    | `Scope`、permission、Profile および chain-specific identity を検証する |
| 複数 permission Account | 許可された collection を保持する                                                                             | current active Account が collection に含まれ、validated Scope と一致する場合だけ、その一件を返す。解決できない場合は singular success を返さず、既存 `NOT_CONNECTED` mapping / `undefined` に従う。array order で選択しない | collection、permission set、active Account を混同しない                |
| active Account change   | current permission に含まれる新しい projection として再計算し、既存 `accountsChanged` event の範囲で通知する | `refreshActiveAccount(scope)` は再照会した新しい singular projection を返す。pending request は existing Account / context-change semantics に従う                                                                           | dApp が Account change を直接指定しない                                |
| permission revoke       | revoke 後の collection を返し、active が対象外なら active projection を返さない                              | cached Account を success として使用せず、`refreshActiveAccount` は `undefined`。接続・署名の failure は既存 Handoff / SDK error mapping に従う                                                                              | revoke 後に古い authorization を再利用しない                           |
| `refreshActiveAccount`  | trusted host が current state を再照会する                                                                   | fresh な singular Account または `undefined`。署名 approval は作成しない                                                                                                                                                     | cache、event delivery、過去の response は authority ではない           |
| stale active Account    | collection / active state の stale 値を成功 projection として使用しない                                      | `getActiveAccount` / `refreshActiveAccount` は `undefined`、`connect` は既存 Handoff error mapping に従い success Account を返さない                                                                                         | stale Account から別 Account への自動 fallback をしない                |

Mobile Relay path も同じ `MosaicLynxActiveAccount` の singular SDK / Handoff response を使用する。Provider collection の存在は Mobile または SDK の public response cardinality を変更しない。上表で明示した `NOT_CONNECTED`、`undefined` および既存 Handoff / SDK error mapping 以外の empty-account error、selection rule、alias または response wrapper を本書で追加しない。

### 5.2.3 `signMessage` / `signData` adapter mapping

Browser page-facing `signMessage` は Provider-specific adapter method であり、独立した logical signing operation や別の message protocol ではない。各 invocation は、既存 common request identity を一つだけ持つ `signData` request と、common logical operation `MESSAGE_SIGN` へ一対一で対応付ける。

| mapping 項目              | Browser Provider                                                                                                                                                             | SDK / Handoff / common authority                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| page-facing method        | `signMessage(params)`                                                                                                                                                        | Provider-specific method。SDK が dApp に公開する method は `signData(params)`                                                                                                  |
| SDK method                | Provider invocation を `signData` request として dispatch                                                                                                                    | `signData(params)` → `signData` handoff operation                                                                                                                              |
| common logical operation  | `MESSAGE_SIGN`                                                                                                                                                               | `interfaces.md §9.1` / `signing-protocol.md` の canonical logical operation                                                                                                    |
| request identity          | Provider invocation と underlying request を一つの既存 `requestId` に相関。page method に新しい requestId field を追加しない                                                 | `requestId` は request / response の一対一 correlation key。`operation`、Origin / caller、Scope、Account、target とともに検証する                                              |
| structured message target | Browser-observed canonical Origin、`Scope`、fixed domain `mosaiclynx.message.v1`、purpose、nonce、issuedAt、expiry および payload からなる同一の structured message          | `StructuredMessage` / `SignedData` と Handoff の existing `RelayDataSigningRequest` に従う。raw arbitrary bytes、表示不能 message、別 domain または別 wire schema へ変換しない |
| data / payload            | Provider の structured message payload の `encoding` / `value` を、内容を変えずに message signing data として渡す                                                            | SDK `signData` の `data` と Handoff `payload` は同じ logical message content を表す。両方を page contract の別入力として同時に要求しない                                       |
| expected signer           | optional `expectedSignerPublicKey` がある場合だけ公開 signer expectation として渡す。`accountId`、`accountIds`、`activeAccountId`、key slot、`recipientPublicKey` は渡さない | Signer が actual signer と完全一致を検証し、不一致は既存 `SIGNER_MISMATCH` mapping。省略時の Account / key resolution は trusted Signer の current context に委譲する          |
| successful result         | Provider-specific representation が存在する場合も known signed data と Signer-originated disposition を保持する                                                              | Handoff `dataSigned` / `SUCCEEDED` / `signedData` / `deliveryDisposition` → SDK `MosaicLynxSigningResult<SignedData>` の `outcome: 'succeeded'`、`result`、同じ disposition    |
| error                     | Provider internal error を page-facing contract へそのまま昇格しない                                                                                                         | Handoff §10 と `interfaces.md §10` の既存 concrete / logical error mapping。新しい Provider error code、alias または fallback を追加しない                                     |
| `RESULT_UNKNOWN`          | Provider / page lifecycle / Promise settlement から生成・推測しない                                                                                                          | trusted Signer-originated `resultUnknown` / `RESULT_UNKNOWN` を signed result、errorCode、deliveryDisposition なしで SDK の `outcome: 'resultUnknown'` へ意味不変に渡す        |
| `deliveryDisposition`     | Provider、page delivery、transport completion から生成・推測・書き換えない                                                                                                   | known signed result に付随する Signer-originated `PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN` を同じ値で保持する。`RESULT_UNKNOWN` branch には付けない                     |

`signMessage` は `signData` / `MESSAGE_SIGN` の structured message semantics に必ず従い、transaction signing、arbitrary raw bytes signing または blind signing への fallback として扱わない。`expiresAt` と Handoff `messageExpiresAt` の canonicalization / mapping は [interfaces.md OPEN-001](./interfaces.md) の decision に従い、Browser が alias、両方の同時必須化、一方の勝手な canonical 化または自動 conversion rule を追加しない。上記以外の result、error、unknown および delivery mapping は Mobile Relay path と同じである。

### 5.3 discovery と capability

SDK は Provider の存在、required method、`apiVersion` major `2`、必要 capability および current runtime compatibility を確認して local route を選択する。`window.mosaicLynx` の存在、global 名、icon、self-declared Origin、self-declared capability、Account cache または `version` だけを trust anchor としない。

- malformed、method 欠落、fake / conflicting、非対応 major、unknown operation、判定不能な capability は Provider unavailable / unsupported として扱う。
- compatible local Provider が存在する場合にだけ Extension route を選択する。incompatible Provider を不在とみなして remote fallback しない。
- Provider reject、validation failure、timeout、Vault lock、context change、result unknown または approval failure の後に別 transport、raw signing または別 operationへ自動 fallback しない。
- capability は connection、account / address disclosure、transaction signing、message signing、cosignature signing、supported Chain / Network、local / remote 等の対応可能性であり、permission、Account ownership、unlock、authentication、approval または success ではない。
- capability identifier、capability set、capability version、negotiation object および compatibility matrix は [interfaces.md §5.6](./interfaces.md) の OPEN を維持する。Browser Extension 独自の identifier を追加しない。

### 5.4 Provider error boundary

Provider、privileged RPC、SDK および wallet-core の error authority を混同しない。境界ごとの authority は次のとおりである。

| error layer                                    | authority / Browser Extension の扱い                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| common logical error category                  | [interfaces.md](./interfaces.md) の common error model。validation、unsupported、permission、user rejection 等の論理的な意味を定める。                                      |
| signing outcome / terminal semantics           | [signing-protocol.md](./signing-protocol.md)。`REJECTED`、`FAILED`、`EXPIRED`、`CANCELLED`、`INVALIDATED`、`RESULT_UNKNOWN` 等の signing lifecycle の意味を定める。         |
| SDK / Handoff concrete public error            | [web-transaction-handoff-spec.md §10](./web-transaction-handoff-spec.md) の `MosaicLynxSDKErrorCode`。page / SDK 境界で公開できる concrete code の唯一の authority とする。 |
| Provider / privileged RPC / transport-specific | privileged host と内部 transport の境界に限定する implementation-specific code。page-facing public code または Handoff error code の追加集合として扱わない。                |
| wallet-core internal error                     | wallet-core contract。Store、Binding、cryptographic warning / error の内部詳細を page-facing error へ露出しない。                                                           |

現行 Provider package に存在する `UNAUTHORIZED_ORIGIN`、`INVALID_MESSAGE`、`NONCE_REUSED`、`UNSUPPORTED_CHAIN`、`ACCOUNT_NOT_FOUND`、`RESOURCE_LIMIT` 等の `ProviderErrorCode` は、Provider / privileged RPC 内部の code としてだけ扱う。これらをそのまま Handoff / SDK public error code として公開したり、追加集合として扱ったりしてはならない。privileged boundary は、既知の失敗原因を common logical category と Handoff §10 の既存 concrete code へ正規化し、page-facing Provider / SDK adapter へ provider-specific code を転送しない。

unknown、malformed または Handoff §10 に対応付けられない Provider / RPC code は、success、signed result または新しい public code に変換せず fail-closed とする。公開 error が必要な場合の catch-all は Handoff §10 の既存 `INTERNAL_ERROR` に限り、raw code や内部 detail を露出しない。`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` はこの error model に含めず、§5.2.1、§12 および §22 の result / delivery semantics で表現する。

SDK に返る concrete error は [web-transaction-handoff-spec.md §10](./web-transaction-handoff-spec.md) の authority に従う。page context に返す error に stack trace、privileged Browser API detail、filesystem path、Wallet Store error、cryptographic internal detail、secret、internal Account / Profile ID または raw cause を含めない。

## 6. Provider exposure と injection boundary

Provider の露出経路は、page context、injected script、Content Script および Extension privileged context を分離する。具体的な script layout、message API、framework、bundler、CSP、Manifest permission および Chrome API 呼び出し順は下位実装へ委譲する。

- page context と injected script は Web Application と同じ untrusted boundary である。Provider object が存在するだけで caller を trusted とみなさない。
- Content Script は page から受け取った payload、Origin、Account、Chain、Network、display metadata および request identity を privileged host へ渡す前に、既存 protocol の structural validation を行う。ただし Content Script の検証は privileged host の最終検証を代替しない。
- privileged host は browser-provided sender / document context を検証し、page-provided Origin と一致しない request を接続・署名へ進めない。
- page、injected script、Content Script は private key、Mnemonic、Profile password、decrypted Wallet Store、Internal Account Reference、permission decision、approval state、authentication state または wallet-core handle を取得・操作できない。
- remote executable code、page-provided HTML / Markdown、page CSS、dApp callback および page event で trusted approval UI、signing authorization または secret boundary を変更できない。
- Provider replacement、duplicate Provider、extension reload および context loss は、既存 request の response recipient と approval binding を再検証する理由となる。古い Provider object を current authority として再利用しない。

## 7. Origin / caller binding

### 7.1 Authority の区別

Origin / caller に関して、次を同一視してはならない。

| 値                                                      | authority                                                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| request payload 内の Origin                             | page が提供する untrusted input。binding の候補情報に過ぎない                                               |
| SDK-observed Origin                                     | SDK が `window.location.origin` 等から得る補助情報。Browser の最終 authority ではない                       |
| page-provided Origin / app label                        | untrusted。permission、UI の Origin authority、signer identity に使用しない                                 |
| browser-observed sender / tab / frame / document Origin | Extension が permission、request、UI および response に binding する authority                              |
| permission Origin                                       | canonical browser-observed Origin と完全一致しなければならない。page self-declaration で上書きしない        |
| trusted UI の Origin                                    | browser-observed Origin から privileged host が導出する。dApp label、favicon、summary を authority にしない |

Browser Extension は [interfaces.md §5.5](./interfaces.md) の canonical Origin を使用する。Origin は scheme、host、port の canonical string であり、path、query、fragment、display name および favicon を含めない。missing、空、malformed、観測値との不一致、frame / document を一意に結び付けられない場合は connection / signing を許可しない。

Origin binding は、適用範囲に応じて少なくとも次を含む。

```text
browser-observed Origin
+ top-level document / browsing context
+ requesting tab / frame / document identity
+ connection / permission scope and revision
+ Profile / Account / Chain / Network
+ requestId / operation / capability
+ signing target or structured message context
+ request freshness and protocol context
```

request payload の Origin が observed Origin と異なる場合、payload の値を採用せず安全側に終了する。requestId だけ、接続済みだけ、Provider の callback だけまたは page の Origin proof だけで caller authenticity を成立させない。

### 7.2 Top-level、frame、tab、navigation

初回 Browser Extension milestone では、次を caller として受け付ける。

- top-level browsing context の HTTPS Origin。
- 開発用途に限る任意 port の `http://localhost`、`http://127.0.0.1`、`http://[::1]`。

通常の HTTP、`file:`、`data:`、opaque Origin、browser internal page、他の Extension Origin および iframe / child frame は受け付けない。iframe support を暗黙に追加しない。

request は top-level Origin、requesting document、tab identity、frame identity（該当する場合）および document generation に binding する。Browser / Extension が top-level と requesting frame の関係、document identity または navigation 後の current context を安全に一意化できない場合、署名を許可せず fail-closed とする。

same tab の reload、same-Origin navigation、cross-Origin navigation、frame replacement、tab close または popup / window context の変更で、request の caller binding と approval continuity を再検証する。新しい document や別 Origin へ古い approval、signed result、permission または response callback を配送しない。

### 7.3 Common four-condition signing authorization

Signing authorization は、同一の Signer-owned Profile-local security context に対する、一つの request / exact signing target の短寿命な許可である。次の4条件が、同じ context に対して互いに独立してすべて成立した場合だけ `AUTHORIZED` として扱う。

1. Authentication。
2. Signing-capable unlock。
3. 対象 Profile / Chain / Network / Account に対する Account authorization。
4. Explicit user approval。

次の関係を維持する。

- Authentication ≠ Signing-capable unlock
- Signing-capable unlock ≠ Account authorization
- Account authorization ≠ Explicit user approval
- Explicit user approval ≠ Authentication

4条件は、少なくとも次の同一 binding context に結び付ける。

```text
request identity
+ browser-observed Origin
+ document / tab / frame context
+ Profile / Profile-local security context
+ permission / revision
+ Account
+ Chain / Network
+ operation
+ capability / version
+ exact signing target
+ inspection result
+ expiry / freshness
```

connection、permission、Account disclosure、selected Account、Provider availability、capability、ordinary `UNLOCKED`、過去の Authentication、password validation、Wallet Store validation、wallet-core capability、page / SDK state、Provider response または transport completion は、4条件のいずれの代替にもならない。permission の存在は Account authorization を、selected Account は Account authorization を、`every-signature` またはその他の Authentication は残りの条件を包含しない。

4条件または binding context のいずれかが missing、stale、revoked、locked、changed、mismatched、unknown または invalidated なら、Signer は fail-closed とし、`AUTHORIZED`、`SIGNING` または `SUCCEEDED` へ進めず wallet-core を呼び出さない。認証 UI、unlock API および内部実装方式は本書で固定しない。

## 8. Connection

### 8.1 Connection flow

`connect({ chain, network })` は、指定 Scope の public Account disclosure と Origin-scoped permission を利用者へ要求する。概念フローは次のとおりである。

```text
Provider request
  → browser caller / Origin / Scope validation
  → existing permission lookup
  → trusted connection UI
  → explicit user grant or denial
  → public Account projection and connection response
```

connection が成功するには、browser-observed Origin、top-level document context、Scope、Profile、選択された Account 集合および permission revision を対応付けられること、ならびに利用者の明示操作が必要である。未許可 Origin からの検証可能な request は connection request としてのみ扱い、signing UI へ進めない。

Connection UI は少なくとも canonical / Punycode 表現の requesting Origin、Scope、Profile / Account の公開識別情報および許可対象を利用者が区別できる形で表示する。具体的 layout、文言、選択 UI は下位 UI 仕様へ委譲する。

### 8.2 Connection の意味と公開情報

connection success は次を意味しない。

- Account ownership proof または Account の control proof
- permanent authorization、device authentication または signing approval
- wallet unlock、Profile password の検証、署名ごとの authentication
- transaction / message の承認、署名、signing success または announce success

公開できる情報は [interfaces.md §5.3](./interfaces.md) の Public Account Identity と、既存の Provider / SDK が許可する非秘密の補助表示値に限る。private key、Mnemonic、Wallet Store identifier、internal Account / Profile ID、key slot、password、authentication information および secret metadata を page へ公開しない。

### 8.3 Persistence、reconnect、disconnect

Permission の persistence、session record および storage engine は既存 model と下位実装へ委譲する。ただし次を必須とする。

- reconnect は current browser caller、current document、permission scope、revision、Profile、Account、Chain / Network を再確認する。過去の cache、approval、authentication、session または result を無条件に復元しない。
- `isConnected()`、`getAccounts()` および `getActiveAccount()` は signing approval を作成せず、現在の公開状態を返すだけである。
- `disconnect()` / permission revoke 後は cached Account、pending request、approval、authentication および signing authorization を新しい request に利用しない。
- disconnect は過去に開始した不可逆な signing の outcome を user rejection、未署名または cancellation に変換しない。
- active Account、permission、Profile、Scope または caller context が変更された場合、`accountsChanged` / `disconnect` event は既存 event contract の範囲で通知する。event delivery は state authority ではない。

## 9. Permission model

### 9.1 Grant の binding

Application 管理下の permission は、[interfaces.md §8](./interfaces.md) の `PermissionGrant` logical model を使用する。

```text
Origin + Profile + Scope(Chain, Network) + permitted Account set + revision
```

`profileId`、`accountIds`、revision 等の内部 record は page / SDK / Relay に公開しない。permission の対象は connection と public Account disclosure であり、signing approval、authentication、Account ownership または key authority を含まない。

### 9.2 Grant、revision、revoke

- Origin、Profile、Scope、permitted Account set および permission revision は request admission と signing authorization に binding する。
- permission の scope、Account set、Profile 対応または revision が変更・revoke された時点で、対応する session、pending request、approval、authentication および signing authorization を無効化する。
- permission の存在だけ、古い revision だけ、Account cache だけまたは Provider event だけでは `AUTHORIZED` に進めない。
- permission を別 Origin、別 Profile、別 Scope、別 Account、別 operation または別 capability へ拡張しない。
- permission expiry、独立 `permissionId`、`revokedAt`、cross-device synchronization および exact persistent storage は upstream OPEN を維持する。Browser Extension が期限値や新しい revocation token を独自に定義しない。

### 9.3 Connection permission と signing authorization

Connection permission は、署名要求を trusted inspection、approval、authentication、Signing-capable unlock、Account authorization または wallet-core signing へ自動的に通す authority ではない。各 signing request は、§7.3 の4条件を同一の Profile-local context に対して独立に満たさなければならない。Profile が要求する `every-signature` は Authentication の条件を満たすためのものであり、他の3条件を代替しない。

## 10. Public Account、Profile、Account / Network selection

### 10.1 公開 Account identity

Page-facing の公開 Account は、共通 contract に従い次の意味を持つ。

```ts
interface PublicAccountIdentity extends Scope {
  address: string;
  publicKey: string;
}
```

全 field は required で、chain-specific format、長さ、checksum、network および public key の整合を privileged host / Chain integration が確認する。display name 等が既存 contract にある場合も補助表示に限り、signer identity、authorization または ownership proof の根拠にしない。

page へ公開してはならないものは、private key、Mnemonic、Wallet Store identifier、internal `accountId`、internal `profileId`、key slot、password、decrypted store、derived encryption key、authentication secret および signing internal secret である。

privileged host / Signer が内部で Account を解決するために Internal Account Reference を使用する場合も、それは routing の内部参照に限る。Internal Account Reference は page input、page return、permission authority、ownership proof、Account authorization、key selection authority または Public Account Identity ではない。transaction signing の対象 Account は、payload、expected signer、current permission、Profile-local context、Chain / Network および必要な signer role から privileged host / Signer が解決する。複数の許可 Account から利用者の選択が必要な message / cosignature 等では、trusted Signer UI / Signer-owned context で選択し、internal reference を page へ出さない。

### 10.2 Profile、Account、Chain / Network

- Profile network は [profile-account-spec.md](./profile-account-spec.md) に従い、作成後に暗黙変更しない。
- Symbol と NEM は別の Chain-specific Account / Key Identity として扱う。同じ mnemonic、Profile または index を理由に秘密鍵、address、public key、schema または signing bytes を共用しない。
- request の Scope、Profile、選択 Account、active Account、payload signer、expected signer、Chain / Network capability および release gate を相互に照合する。
- wrong Chain、wrong Network、wrong Profile または wrong Account の request に対して、対象を自動切替、暗黙接続、別 Account への fallback または古い approval の移送を行わない。
- `expectedSignerPublicKey` が指定された場合は、対象 Chain の形式を検証し、実際の signer と完全一致させる。一致しない場合は既存 concrete error authority に従い success を返さない。

## 11. Signing Request Admission

### 11.1 Admission の必須検証

Provider、SDK、Web Application、Node または Relay が既に検証した request でも、privileged host は trusted approval flow に入れる前に再検証する。少なくとも次を確認する。

- Provider API / protocol version、operation、required capability および current local route compatibility
- requestId の形式、one-to-one correlation、duplicate / replay、request freshness
- createdAt、expiresAt、適用される message / transaction / parent expiry
- browser-observed Origin、top-level document、tab / frame / sender context および page-provided Origin との一致
- permission の Origin、Profile、Scope、permitted Account set、revision および current connection
- Profile lock / unlock 状態、選択 Account、expected signer、signer role、Chain / Network
- payload の type、encoding、size、structural validity、integrity、canonical input 条件
- request に対応する operation と target の組み合わせ、capability、generation / lifecycle context
- request が過去に terminal state、cancel、rejection、expiry、context loss または result unknown になっていないこと

検証の一部でも欠落、malformed、unknown、expired、stale、mismatch、unsupported または判定不能であれば、通常の signing approval flow へ進めない。page が提示した `Origin`、Account、Chain、Network、summary、label、recipient name、amount text、description または message display text を最終 authority としない。

### 11.2 検証順序と境界

概念的な処理順は次のとおりである。

```text
RECEIVED
  → envelope / identifier / freshness
  → browser caller / Origin / document
  → permission / Profile / Account / Scope
  → operation / capability
  → chain-specific target parse / canonical validation
  → trusted inspection
  → approval / authentication
```

この順序は、untrusted input を trusted UI、permission decision、wallet-core または signing authorization に昇格させないための境界である。具体的な内部 class、queue、lock、CAS、DB transaction および message transport は固定しない。

## 12. Signing lifecycle

### 12.1 共通 state

Browser Extension は [signing-protocol.md §6](./signing-protocol.md) の state set を使用し、独自の public signing state machine を追加しない。

```text
RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED

terminal:
REJECTED | FAILED | EXPIRED | CANCELLED | INVALIDATED | RESULT_UNKNOWN
```

`DELIVERY_UNKNOWN` は signing state ではなく、`SUCCEEDED` した result の delivery disposition である。

| state            | Browser Extension での意味                                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RECEIVED`       | 受信したが trusted request として扱う前。署名不可                                                                                                                                                         |
| `VALIDATED`      | envelope、caller、permission、session、Scope、Account、operation、capability、freshness、integrity を検証済み。署名不可                                                                                   |
| `INSPECTED`      | target 全体を parse / validate / inspect し、trusted confirmation model を生成済み。署名不可                                                                                                              |
| `AWAITING_USER`  | Extension 管理 UI で確認・拒否を待つ。authentication / authorization は未成立                                                                                                                             |
| `AUTHORIZED`     | 同一の Signer-owned Profile-local security context に対して Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件が独立して成立した短寿命状態。署名前再検証が必要 |
| `SIGNING`        | 4条件と binding context を再検証した target を wallet-core contract へ渡している状態。自動再実行不可                                                                                                      |
| `SUCCEEDED`      | 4条件が成立した同一 context において、wallet-core result と request、target、signer、Account、Scope、operation の対応を検証済みの状態                                                                     |
| `REJECTED`       | 利用者の明示拒否。検証失敗や timeout をこの state に変換しない                                                                                                                                            |
| `FAILED`         | failure が確定した terminal state。signature success として返さない                                                                                                                                       |
| `EXPIRED`        | request または適用される target / message context の期限切れ                                                                                                                                              |
| `CANCELLED`      | signing を開始せず処理を終了できた cancellation                                                                                                                                                           |
| `INVALIDATED`    | caller、permission、lifecycle、target、integrity 等の binding が失われた状態                                                                                                                              |
| `RESULT_UNKNOWN` | signing 自体が実行されたか、または成功したかを安全に確定できない状態                                                                                                                                      |

### 12.2 Browser-specific state との分離

Popup open、UI focused、authentication prompt visible、Provider connected、Service Worker alive、tab active 等は Browser-specific operational state であり、`AUTHORIZED`、`SIGNING`、`SUCCEEDED` または user rejection の代替ではない。Browser-specific state を追加する場合も、共通 signing outcome、approval binding および terminal state の意味を変更しない。

## 13. Trusted Inspection と blind signing

### 13.1 Inspection authority

署名前の inspection は Extension の privileged host と Chain integration が、実際の signing target bytes / structured message から行う。trusted UI が表示する confirmation model は、署名へ渡す target と同じ authoritative data から導出し、表示用に別の再計算・補完・丸め・変換を持たない。

次は display authority ではない。

- Web Application / dApp の summary、label、recipient name、amount text、description、Markdown、HTML、icon、brand name
- SDK や Provider が任意に追加した human-readable summary
- Node、Relay、外部 metadata、hash lookup、name service または remote API の補助情報

補助 metadata を表示する場合も、署名対象から得た authoritative value と区別し、検証・permission・signer identity の authority に使わない。取得不能な補助情報を理由に target の意味を推測しない。

### 13.2 Blind signing の禁止

次の target は、warning-only、raw sign、generic sign、fallback sign、hash-only approval または user responsibility の表示で承認可能にしてはならない。

- parse、field validation、canonical reserialization または signer validation ができないもの
- Chain、Network、Account、signer role、recipient、asset effect、permission effect、message content 等の security-relevant field を表示できないもの
- unknown type / version、unsupported format、truncated / trailing / non-canonical payload
- outer だけで embedded / inner / parent 全体を確認できないもの

inspection、表示、approval binding または result validation を安全に完了できない場合は fail-closed とし、既存 error authority に従って terminal failure とする。

## 14. Transaction signing

### 14.1 Chain Compatibility への委譲

Browser Extension は transaction bytes、hash、signature format、generation hash、chain serialization、address、network constant または transaction schema を独自定義しない。[chain-compatibility-spec.md](./chain-compatibility-spec.md) の固定 SDK、allowlist、decode / encode、field validation、canonical equality、signature verification および hash contract をそのまま使用する。

現行の対応候補は Chain Compatibility Specification の allowlist に限る。例として Symbol は `TransferTransactionV1`、`AggregateCompleteTransactionV2`、`AggregateBondedTransactionV2` および対応する full-parent cosignature、NEM は `TransferTransactionV1/V2`、`MultisigTransactionV1` および対応する `CosignatureV1` である。具体的な type、version、embedded 件数、field、fixture および release gate は Chain Compatibility Specification を更新せずに拡張しない。

Extension は次を実施する責任を持つ。

1. payload の encoding、size、Chain / Network、expected signer および unsigned / signed 条件を検証する。
2. 対象 Chain の正本 decoder で全 field を decode する。
3. reserved、length、integer、address、mosaic、message、signature、network、signer および schema 条件を検証する。
4. 正本 serializer で再構成した bytes と入力 bytes を byte-for-byte 比較する。
5. 全 security-relevant field から inspection model を生成し、trusted UI へ表示する。
6. wallet-core result を正本 verifier / factory で検証し、元 payload、target digest / hash、Chain、Network、signer および Account と対応付ける。

Node metadata、fee multiplier、未確定 alias 解決、外部 lookup または dApp の表示文字列で input bytes の意味を置き換えない。

## 15. Aggregate、cosignature、Partial、NEM multisig

### 15.1 Symbol Aggregate

Symbol Aggregate Complete / Bonded は outer transaction だけで approval を作らない。outer field、transactions hash、全 embedded transaction、embedded signer、recipient、asset / amount、fee、deadline、network、existing signature / cosignature、expected signer および signer role を一つの target context として parse、inspection、表示および binding する。

embedded transaction、transactions hash、既存 cosignature、canonical order、asset effectまたは role を安全に確認できない場合は signing しない。Bonded / Partial であることだけを根拠に Node から parent を取得・補完しない。

### 15.2 Cosignature

`COSIGNATURE_SIGN` の signing target は detached cosignature bytes、hash または summary 単体ではなく、selected cosigner と完全な parent transaction の関係である。parent 全体、embedded / inner content、既存 signature / cosignature、target hash、selected Account、expected signer、role、Chain / Network および duplicate 条件を確認できる場合だけ処理する。

既存 cosignature、parent 不在、hash-only、parent と detached target の不一致、initiator / cosigner role 不一致または公開 scope が未確定の場合は、通常 transaction signing、raw signing、外部 lookup または warning-only へ fallback しない。

### 15.3 Partial と NEM multisig

Partial は共通の第三の signing operation ではなく、Chain / Network または handoff 上の未完成 context である。parent、embedded / inner、existing signatures、expected signer、expiry および影響を確認できない Partial は署名しない。

NEM multisig / cosignature は Symbol Aggregate / cosignature に変換しない。NEM-specific decoder、role、inner transaction、fee / asset effect、parent consistency および signer validation を [chain-compatibility-spec.md](./chain-compatibility-spec.md) と [signing-protocol.md](./signing-protocol.md) に従って行う。NEM と Symbol の key、address、hash、serialization および approval target を共通化しない。

## 16. Structured Message Signing

`signMessage()` / SDK `signData()` は既存の structured message contract と `MESSAGE_SIGN` semantics を使用する。Browser Extension は新しい raw message、arbitrary bytes、別 domain、別 wire schema または fallback signing を追加しない。

message signing target は少なくとも次へ binding する。

```text
mosaiclynx.message.v1
+ browser-observed canonical Origin
+ Account
+ Chain / Network
+ purpose / domain
+ nonce
+ issuedAt / expiry
+ requestId / request expiry
+ caller context
+ payload encoding and bytes
```

- Origin は page が自己申告した値ではなく browser-observed value から導出する。
- nonce の再利用、request expiry、message expiry、issuedAt の範囲、purpose、payload encoding および Unicode / hex 条件は既存 Product / Interfaces / Handoff contract を検証する。
- trusted UI と signing bytes は同一の structured message から導出する。UI 表示用の別 message、要約または変換を署名対象にしない。
- raw arbitrary message、表示不能な message、unknown format または uninspectable payload を warning-only で署名しない。
- `expiresAt` と Handoff の `messageExpiresAt` の未解決な差異は [interfaces.md OPEN-001](./interfaces.md) を維持し、Browser Extension が alias、優先順位または変換を独自決定しない。

## 17. Trusted Approval UI

### 17.1 表示契約

署名ごとに Extension が管理する trusted approval UI を表示し、利用者が少なくとも次を確認できるようにする。

- requesting canonical Origin。dApp label、icon、favicon、page title とは別に表示する
- selected signing Account の公開 identity、必要な signer role
- Chain / Network
- operation（transaction、aggregate、cosignature、NEM multisig または structured message）
- transaction / parent / embedded / inner / message の全 security-relevant contents
- asset transfer、fee / amount、recipient、permission / authority change、message content 等の確認可能な影響
- expected signer、existing signature / cosignature、unsupported / warning / unverifiable 状態
- approve と reject の明示操作

UI layout、CSS、component framework、window / popup / side panel の選択、localization、accessibility および文言は下位 UI 仕様へ委譲する。page DOM、page CSS、remote HTML / Markdown、dApp-provided display text または spoofable branding で trusted UI の意味を変更できない。

### 17.2 Approval と authentication

Approve は一つの logical signing target に対する single-use の Explicit user approval である。これだけでは signing authorization を成立させない。approval binding は [signing-protocol.md §5.3](./signing-protocol.md) に従い、適用範囲で caller / Origin、document context、requestId、session、operation、permission revision、Profile、Account、Chain / Network、capability、target、inspection result、signer role、expiry および freshness を含む。

同じ approval を次へ流用してはならない。

- 別 request、別 payload、別 target、別 Account、別 Origin、別 Network / Chain
- duplicate request、retry、different signer role、different cosigner
- stale permission、new document、new Provider、new generation

Profile `UNLOCKED` は signing-capable unlock または signing authorization を自動的に意味しない。connection、permission、Account disclosure、selected Account、Provider availability、capability、過去の Authentication、password validation、Wallet Store validation、wallet-core capability または trusted UI の表示だけで signing してはならない。Authentication、Signing-capable unlock、Account authorization および Explicit user approval は、同一の Profile-local context に対する独立した4条件であり、`every-signature` authentication もその一つだけを満たす。Browser-specific OS biometric API、password prompt 実装、unlock API、fallback および rate limit は独自に固定しない。

## 18. Pre-sign Revalidation と wallet-core boundary

### 18.1 署名前再検証

`AUTHORIZED → SIGNING` 直前に、現在値と approval record の次を再検証する。

- browser-observed Origin、sender、tab、frame、document、navigation context
- requestId、operation、protocol / capability context、request / message expiry
- current connection、permission scope、permission revision、Profile、selected Account
- Chain / Network、expected signer、signer role、Mainnet release capability
- transaction / parent / embedded / inner / message payload、digest、hash、canonical bytes、inspection result
- Authentication の request-specific validity と binding
- Signing-capable unlock の current validity と binding
- 対象 Profile / Chain / Network / Account に対する Account authorization の current validity と binding
- Explicit user approval の対象 target、inspection result および binding
- response recipient、Provider instance、current lifecycle / generation context

上記4条件または binding context の一つでも不一致、stale、missing、expired、revoked、lock、context loss、target mutation または validation failure があれば old authorization / approval を使わず、既存 signing protocol の `INVALIDATED`、`EXPIRED`、`FAILED` 等の applicable terminal semantics に従う。対象を自動修正、Account / Network を自動切替、payload を再構成または再承認なしに再署名しない。

### 18.2 wallet-core invocation

wallet-core を呼び出す前に、privileged host が trusted validation、trusted inspection、Authentication、Signing-capable unlock、対象 Account に対する Account authorization および Explicit user approval の4条件を、同一の Profile-local context で完了・再確認する。wallet-core へ Web Application の raw request、page summary、page supplied Account selector または未検証 payload をそのまま渡して signing authority を委譲しない。4条件または binding context が一つでも確認不能なら wallet-core を呼び出さない。

wallet-core には既存の approved target、resolved internal key reference および必要な chain-specific binding だけを既存 Binding contract で渡す。wallet-core の exact API、Rust / WASM function name、FFI、key slot、KDF、Wallet Store、zeroization および cryptographic primitive は本書で定義しない。wallet-core result は host が request / target / signer / Scope と独立に検証し、検証できない warning、error、partial result または response を success として返さない。

### 18.3 Mainnet release / evidence gate

Mainnet signing capability は、current release と適用中の release / evidence policy を満たしたことを trusted Signer / release security authority が確認した場合にだけ有効化する。[interfaces.md §7.4](./interfaces.md)、[signing-protocol.md](./signing-protocol.md) および [CR-NFR-006](../requirements/requirements.md) の gate semantics を適用し、Browser Provider / SDK は gate evaluator、release authority または gate の代替ではない。

次のいずれも Mainnet gate の成立を証明しない。

- `Scope.network === 'mainnet'`。
- Provider availability、Provider capability、SDK availability または connection。
- permission、Account disclosure、ordinary unlock、wallet-core capability または page / SDK state。
- test success、signed result、Provider response、response delivery success または transport success。

gate が missing、invalid、expired、inconsistent、unverifiable または unknown の場合、Mainnet signing capability は disabled / unavailable とし、成功可能と推測しない。gate failure / unknown を理由に automatic retry、automatic re-sign、alternate Provider、Relay または Mobile fallback を行わない。Mainnet gate failure だけで Testnet request を Mainnet request へ変換したり、独立した Testnet signing を不必要に停止したりしない。Testnet-only で安全に継続できるかは Testnet の独立した条件で判断する。

evidence schema、evaluator algorithm、trusted key format、build rollout / rollback および release tooling は [ADR 0001](../adr/0001-mainnet-evidence-lite.md)、[Mainnet release evidence](../release/mainnet-release-evidence.md) および [evidence policy](../evidence/evidence-policy.json) の authority に委譲し、本書で再定義しない。

## 19. Secret Handling

次の情報は page context、Provider、SDK、Content Script、URL、notification、clipboard、log、telemetry、error、diagnostics、Relay または Web Application へ渡さない。

- private key、Mnemonic、seed、Profile password、authentication secret
- decrypted Wallet Store、derived encryption key、Wallet Store plaintext、key slot の秘密情報
- signing internal secret、wallet-core handle、credential、session secret
- 秘密を復元できる内部 metadata、raw exception、秘密を含む request / approval object

Decrypted secret は wallet-core が必要とする boundary に限定し、Extension の長期保存、page-facing object、request cache、approval record または diagnostics に保持しない。lock、crash、restart、extension reload、unsafe update、context loss、Profile switch または lifecycle discontinuity が起きた場合は、未確認の decrypted secret / authorization を継続利用しない。

## 20. Extension lifecycle

### 20.1 Lifecycle loss の基本規則

次の lifecycle event は、request / approval / Authentication / Signing-capable unlock / Account authorization / signing / response correlation の continuity を再評価する契機である。

- background / Service Worker restart または停止
- extension reload、update、browser restart
- popup / approval window close、focus loss、tab close
- page navigation、reload、Origin change、frame destruction / replacement
- Provider replacement、Content Script replacement、document generation change
- Profile switch、Account change / deletion、Network / Chain change
- lock、permission revoke、permission revision change、wallet-core context loss

安全に current caller、permission、target、approval、Authentication、Signing-capable unlock、Account authorization、Profile / Account、protocol context および response recipient を再構築できない場合、古い authorization を再利用せず `INVALIDATED` または applicable unknown outcome として扱う。4条件の一つでも再構成・再確認できない場合は wallet-core を呼び出さない。再構築できないことを、署名未実行、user rejection または signing failure の証明にしない。

### 20.2 Service Worker / background restart

MV3 等の Service Worker / background の具体 runtime API、keep-alive、persistent storage、recovery protocol は固定しない。ただし restart 後に次を推測で復元してはならない。

- pending request、`AUTHORIZED` approval、Authentication success、Signing-capable unlock、Account authorization、`SIGNING` state、wallet-core operation
- current sender / tab / frame / document、permission revision、Profile / Account、request target
- signed result、response correlation、delivery status、signing outcome

restart 前の authorization を安全に再構成できない場合は invalidation する。`SIGNING` 中の process / wallet-core response loss は `RESULT_UNKNOWN` の定義を使用し、同じ target を自動再署名しない。確定済み result の delivery だけが不明なら Signer-originated な `SUCCEEDED + DELIVERY_UNKNOWN` として signing outcome と分離する。Lifecycle loss、Provider response loss または page delivery failure だけでこの disposition を生成しない。

## 21. Navigation、Tab、Frame、Provider change

request 中に Origin change、same-Origin reload、cross-Origin navigation、tab close、frame replacement または Provider replacement が生じた場合、current browser caller context と request の binding を再検証する。

- old document の approval を new document、new Origin、new frame または別 tab に移さない。
- old document へ返すべき response が delivery unknown になっても、別 document の request に適用しない。
- frame が破棄され、top-level / frame relationship を一意に確認できない場合は signing を継続しない。
- popup / approval window の close は、未署名なら applicable cancellation / expiry、署名成否が不明なら `RESULT_UNKNOWN`、確定 result の配送だけが不明なら `DELIVERY_UNKNOWN` とする。
- page-provided requestId や callback object が残っていても、新しい document の caller proof、permission または approval として再利用しない。

## 22. Response generation、correlation、delivery

### 22.1 Response binding

Provider response は original request と one-to-one に対応し、少なくとも次の組を検証する。

```text
requestId
+ operation
+ browser-observed Origin / caller context
+ tab / frame / document context
+ session / lifecycle / protocol context
+ Scope
+ Account / signer / signer role
+ target / digest / hash / structured message context
+ request and target expiry
```

response recipient、Provider instance、document または caller context が一致しない response は success として適用しない。late、duplicate、mismatched、replayed、stale、unknown operation、wrong Scope、wrong Account、wrong signer または wrong target の response は破棄し、別 request / Origin / tab / frame へ配送しない。

### 22.2 Signing outcome と delivery disposition

- known signed result の signing outcome は `SUCCEEDED` であり、`PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN` の Signer-originated `deliveryDisposition` を同じ result に付随させる。`deliveryDisposition` は signing state ではない。
- `RESULT_UNKNOWN` は Signer が署名生成自体の成否を安全に確定できない場合だけに用いる。signed result と delivery disposition を持たず、通常の error、signing failure または未署名へ変換しない。
- `DELIVERY_UNKNOWN` は known signed result が存在し、delivery の確定だけが不明な場合に用いる。`RESULT_UNKNOWN`、signing failure または error code へ変換しない。
- Provider page-facing result、Provider → SDK adapter、Promise settlement、Content Script、page delivery、browser lifecycle、Relay response、HTTP status または transport completion は、これらの意味を生成、推測、確定または書き換えない。response が page に届いたことだけで `DELIVERED` としない。
- Provider → SDK adapter は [web-transaction-handoff-spec.md §5.2.1、§7.2](./web-transaction-handoff-spec.md) に従い、known result と同じ disposition を `MosaicLynxSigningResult<T>` の `outcome: 'succeeded'` branch へ、Signer-originated `RESULT_UNKNOWN` を `outcome: 'resultUnknown'` branch へ意味不変に渡す。SDK adapter はこれらを生成しない。

## 23. Request concurrency、duplicate、replay

複数 dApp、複数 Origin、複数 tab、same-Origin の複数 document および複数 pending approval を独立した request として扱う。

- 各 request は独立した requestId、caller context、permission revision、Profile、Account、Scope、operation、target、inspection model、approval、authentication、expiry および result recipient を持つ。
- same Origin であること、同じ Account であること、同じ payload であることまたは同じ permission であることだけで approval / authentication / result を共有しない。
- 別 Origin の request を一つの approval、Account selection、permission、response channel または callback に混在させない。
- duplicate / replay request は second signing を行わず、既存 lifecycle / error authority に従って terminal にする。duplicate response / callback も一度だけ適用する。
- account change、lock、disconnect、permission revoke、Profile switch が一つの request に影響しても、別 request の target、approval、Account または result を上書きしない。
- queue、前面 UI の選択、同時数上限、fairness、serialization の exact policy は未確定の下位実装へ委譲する。ただし global singleton approval や ambiguous batch approval を暗黙に導入しない。

## 24. Timeout、cancellation、unknown outcome

### 24.1 Timeout と cancellation の区別

次を別の事実として扱う。

| 事象                                                           | Browser Extension の semantics                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| SDK local timeout                                              | SDK が待機を終了した事実。signing success、未署名または rejection を意味しない                                                  |
| Provider request timeout / request expiry                      | request を `EXPIRED` 等の applicable terminal state とし、古い approval を再利用しない                                          |
| user reject                                                    | `REJECTED`。明示的な利用者拒否に限る                                                                                            |
| approval UI close / tab close                                  | 未署名で安全に終了できた場合は applicable cancellation / expiry。signing 成否不明なら `RESULT_UNKNOWN`                          |
| explicit cancellation                                          | `SIGNING` 前に安全に終了できた場合は `CANCELLED`。signing 未実行の証明に自動変換しない                                          |
| lock / permission revoke / context change                      | old authorization を invalidation。別 Account / Scope へ移さない                                                                |
| wallet-core / extension crash                                  | signing outcome が不明なら `RESULT_UNKNOWN`。自動再署名しない                                                                   |
| Signer が known signed result を保持し delivery を確定できない | `SUCCEEDED + DELIVERY_UNKNOWN`。transport / page delivery の事実だけで生成せず、signing error / user rejection / 未署名としない |

具体的 timeout 値、retry interval、queue persistence、recovery API および existing result retrieval は SDK / Handoff / platform OPEN を維持する。timeout / cancellation 後の retry が許可される場合も、新しい requestId、fresh envelope、再検証、新しい approval および authentication を要求する。

既存 Provider method set に含まれない cancel endpoint / method を本書から追加しない。Provider request の cancellation は、既存 SDK / Signing Protocol / Handoff の lifecycle contract、caller context loss または disconnect semantics を通じて扱い、cancellation を signing 未実行や user rejection の証明にしない。

### 24.2 Cancellation と signing の境界

`SIGNING` 前の cancellation は signing を開始せず `CANCELLED` とする。`SIGNING` 中の cancellation は wallet-core の結果と process continuity を確認できる場合だけ applicable outcome を決める。`SUCCEEDED` 後の cancellation は確定した signature を取り消さず、既存 result delivery semantics に従う。

## 25. Account / Profile / permission change

次の変更は pending request、approval、authentication、response recipient および cached public state の再評価対象である。

- active Account の変更、Account の削除または replacement
- Profile switch、Profile deletion、Profile lock / unlock、Signing-capable unlock の変更
- Chain / Network changeまたは Profile scope の変更
- permission revoke、permission scope / Account set / revision change
- vault lock、wallet-core store replacement、security incident、Authentication または Account authorization の失効

old Account の approval、Authentication、Signing-capable unlock、Account authorization、key reference、pending result または response を new Account / Profile / Scope へ移さない。signing が既に不可逆な段階に進んでいる場合、permission revoke / disconnect の発生だけから user rejection、未署名または cancellation を推測しない。result unknown は Signing Protocol の semantics を維持する。

## 26. Extension update と compatibility

Extension update / reload で Provider API version、protocol、capability、serialization、wallet-core Binding または permission model が変化する場合、pending request / approval を旧 version から current contract へ推測変換しない。

- known compatible version / capability の検証ができない場合は unavailable / unsupported または invalidation とする。
- unknown field、unknown enum、unknown version、unsupported operation、unsupported Chain / Network、変更された target encoding は fail-closed とする。
- update 後の Profile、Account、permission、Wallet Store、signing capability の対応を安全に検証できない場合、署名可能状態を継続しない。
- official distribution、integrity、dependency、current release、Mainnet release / evidence gate および update / rollback policy は release / security authority へ委譲する。Extension update / runtime state、Provider / SDK availability または capability は Mainnet gate を評価・代替しない。
- update compatibility を理由に explicit approval、Origin binding、secret isolation、blind signing prohibition、response correlation または fail-closed を弱めない。

## 27. Error authority と page error exposure

### 27.1 Authority

| error の範囲                                   | authority / Browser Extension の扱い                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| common logical error category                  | [interfaces.md](./interfaces.md) の common error model。validation、unsupported、permission、user rejection 等の論理的な意味を定める。                                      |
| signing outcome / terminal semantics           | [signing-protocol.md](./signing-protocol.md)。`REJECTED`、`FAILED`、`EXPIRED`、`CANCELLED`、`INVALIDATED`、`RESULT_UNKNOWN` 等の signing lifecycle の意味を定める。         |
| SDK / Handoff concrete public error            | [web-transaction-handoff-spec.md §10](./web-transaction-handoff-spec.md) の `MosaicLynxSDKErrorCode`。page / SDK 境界で公開できる concrete code の唯一の authority とする。 |
| Provider / privileged RPC / transport-specific | privileged host と内部 transport の境界に限定する implementation-specific code。page-facing public code または Handoff error code の追加集合として扱わない。                |
| wallet-core internal error                     | wallet-core contract。Store、Binding、cryptographic warning / error の内部詳細を page-facing error へ露出しない。                                                           |

Browser Extension は内部 error を新しい SDK public error taxonomy、code、alias または retry policy として追加しない。既存 authority に対応しない internal detail は public error に昇格させず、安全な既存 failure mapping または必要な upstream OPEN として扱う。

### 27.2 公開 error の最小化

page-facing error は必要最小限の既存 public contract に正規化し、stack trace、extension internal path、Browser API detail、raw Wallet Store error、cryptographic primitive、secret、credential、Profile ID、Account ID、raw approval、full payload、Node / Relay internal detail を含めない。

error response は signing outcome、approval、authentication、Origin verification、Account ownership または session existence を過剰に推測できる detail を返さない。Provider-specific / privileged RPC code はこの page-facing boundary を越えず、既知の失敗原因だけを Handoff §10 の既存 public code へ normalize する。unknown または mapping 不能な code は success にせず fail-closed とし、必要な公開 catch-all は Handoff §10 の `INTERNAL_ERROR` に限る。Browser Extension は endpoint-specific な新しい public code を再定義しない。

## 28. Diagnostics、logging、anti-phishing

### 28.1 Diagnostics / logging

diagnostics は安全性の補助であり、Origin authority、permission authority、approval authority または signing result verifier ではない。必要最小限の normalized event、operation category、non-secret request disposition、public error category および lifecycle category だけを記録する。

次を log、warning、exception、telemetry、crash report または diagnostic callback へ出力しない。

- private key、Mnemonic、password、decrypted Wallet Store、derived key、authentication secret
- session secret、credential、wallet-core handle、raw approval / authorization
- 不要な full transaction / message / signed payload、full sensitive field または復元可能な raw request
- internal Account ID、Profile ID、key slot、filesystem path、stack trace、Browser privileged API detail

payload digest、requestId、Scope、canonical Origin または public address を diagnostics へ含める場合も、既存 privacy / logging contract の最小範囲に限定し、secret や signing authority と結び付けて外部へ公開しない。

### 28.2 Anti-phishing

trusted Extension UI は page UI と識別可能な Extension-managed context で表示し、requesting Origin、Account、Chain / Network、operation および影響を明示する。dApp label、favicon、icon、page title、remote branding、HTML / Markdown、page CSS または user-supplied summary を requesting Origin や trusted signer identity の代替にしない。

具体的 branding、window design、phishing warning wording および OS UI integration は上流で未確定なら独自追加しない。

## 29. Security Invariants

Browser Extension は次を常に維持する。

1. Page input、Provider、SDK、Content Script、Node、Relay および外部 API は untrusted である。
2. caller context は browser-observed sender、top-level document、tab / frame、Origin および lifecycle context に binding する。
3. connection permission は approval ではなく、permission は signing authority を含まない。
4. Authentication、Signing-capable unlock、Account authorization および Explicit user approval は、同一の Signer-owned Profile-local security context に対する独立した4条件である。Authentication ≠ Signing-capable unlock、Signing-capable unlock ≠ Account authorization、Account authorization ≠ Explicit user approval、Explicit user approval ≠ Authentication を維持する。
5. connection、permission、Account disclosure、selected Account、Provider availability、capability、ordinary `UNLOCKED`、過去の Authentication、password validation、Wallet Store validation、wallet-core capability または page / SDK state を4条件の代替にしない。
6. trusted inspection と全 security-relevant field の表示が signing 前に完了する。
7. blind signing、hash-only approval、summary-only approval、Node lookup 補完および raw fallback を許可しない。
8. 一つの approval は一つの logical signing target に対する single-use authorization である。
9. stale、expired、duplicate、replayed、cancelled、revoked、terminal または lifecycle-lost state を再利用しない。
10. `AUTHORIZED → SIGNING` 直前と wallet-core invocation 前に、4条件と request identity、browser-observed Origin、document / tab / frame、Profile、permission / revision、Account、Chain / Network、operation、capability / version、exact target、inspection result および expiry / freshness の binding context をすべて再確認する。いずれかが不成立なら wallet-core を呼び出さず fail-closed とする。
11. private key、Mnemonic、Wallet Store plaintext、password、authentication secret、credential および signing internal secret を page / Provider / SDK / Relay へ露出しない。
12. response correlation は requestId だけに依存せず、caller、document、operation、Scope、Account、target および lifecycle context を検証し、失敗時は fail-closed とする。
13. known signed result は `SUCCEEDED` と Signer-originated `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` を保持し、`RESULT_UNKNOWN` は signed result / delivery disposition なしで表現する。Provider、SDK、Promise settlement、transport または page delivery はこれらを生成・推測・書き換えない。
14. `RESULT_UNKNOWN` の不確実性または `DELIVERY_UNKNOWN` の後に automatic re-sign、alternate Provider、Relay / Mobile fallback を行わない。
15. Navigation、tab / frame replacement、Provider replacement、lock、permission revision、Profile / Account change、restart および update 後に stale approval を継続しない。
16. signing outcome、user rejection、cancellation、transport delivery、response receipt、connection success および authentication success を混同しない。

## 30. Scope boundary と委譲事項

本書は security-sensitive な observable behavior を固定するが、次を実装方式として固定しない。

- SDK implementation、Provider transport、RPC / event serialization、injected script layout、Content Script message protocol
- Chrome API 名、Manifest の完全な JSON、permission 名、CSP、Browser API wrapper、最低 Browser version
- React / Vue / Svelte、state management、bundler、file layout、storage engine、queue / lock / CAS / DB transaction
- wallet-core exact API、Rust / WASM / FFI、KDF、AEAD、key derivation、Wallet Store format、secret byte lifecycle
- UI component、CSS、design system、window / side panel、OS biometric API、localization、test framework
- permission expiry、persistent session recovery、concurrency upper bound、timeout / retry interval、Provider selection matrix

これらを実装で決定する場合も、Origin authority、permission と approval の分離、trusted inspection、blind signing prohibition、wallet-core boundary、secret isolation、signing protocol state、error authority および fail-closed を弱めてはならない。

## 31. Conformance / Acceptance Criteria

Browser Extension 実装は、少なくとも次を検証可能でなければならない。

1. `window.mosaicLynx` の Provider API major `2`、required methods、capability および compatibility を確認し、incompatible / malformed Provider を安全に扱う。
2. page / injected / Content Script と privileged host を分離し、page input が trusted caller、permission、approval または secret へ昇格しない。
3. browser-observed top-level Origin、document、tab / frame context と request を binding し、self-declared Origin、iframe、unsupported Origin、navigation 後の stale request を拒否する。
4. `connect()`、public Account disclosure、permission、active Account、disconnect / revoke および各 signing approval を別の意味として扱う。
5. `Scope`、Profile-local security context、Account、expected signer、Chain / Network、capability / version、expiry、requestId、duplicate / replay および target structure を signing 前に再検証し、Account selector を authorization authority として扱わない。
6. `RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` と全 terminal state を Signing Protocol に従って扱い、`AUTHORIZED` は同一 context の Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件がすべて成立した場合だけ作成する。独自の危険な state を追加しない。
7. trusted UI が browser-observed Origin、Account、Chain / Network、operation、全 target contents、signer role、impact、warning および approve / reject を表示し、page summary を authority にしない。
8. Symbol / NEM transaction、Aggregate、cosignature、NEM multisig および structured message を各 authority に従って全体検証し、unknown / uninspectable / unsupported / raw fallback を署名しない。
9. `AUTHORIZED → SIGNING` 直前に caller、request identity、permission / revision、Profile-local context、Account、Scope、Chain / Network、operation、capability / version、exact target、inspection result、expiry / freshness および4条件すべてを再検証する。missing、stale、revoked、locked、changed、mismatched、unknown または invalidated は fail-closed とする。
10. Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件と binding context を確認できた承認済み target に限って wallet-core を呼び出し、result を元 request、target、signer、Account、Chain / Network および operation と検証する。
11. concurrent request、duplicate callback、late / stale / mismatched response、same-Origin multiple tabs、permission revoke、lock、Account change および Provider replacement を request 間で混同しない。
12. known signed result の `SUCCEEDED` と Signer-originated `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN`、および signed result / delivery disposition を持たない `RESULT_UNKNOWN` を相互に誤変換せず、SDK timeout、transport completion、page response delivery または lifecycle loss からこれらを推測せず、自動再署名しない。
13. Service Worker / background restart、extension update、browser restart、navigation、tab / frame destruction 後に old approval、Authentication、Signing-capable unlock、Account authorization、signing state、response correlation または secret を推測復元しない。
14. page-facing error は Handoff §10 の既存 public code に限り、Provider / privileged RPC の internal code を転送せず、unknown code を success にしない。diagnostics、logging、events、cache および URL に secret、credential、internal ID、stack trace、raw Wallet Store error または不要な full payload を露出しない。
15. Mainnet signing capability は current release と適用中の release / evidence policy を満たした trusted Signer / release security authority だけが有効化し、Provider / SDK availability、capability、connection、permission、Account disclosure、ordinary unlock、wallet-core capability、test success、signed result、Provider response または transport / response delivery success を gate の代替にしない。gate が missing、invalid、expired、inconsistent、unverifiable または unknown の場合は disabled / unavailable とし、Testnet-only の安全な継続を不必要に停止しない。

## 32. OPEN Issues

本書で上流未決事項を独自に確定しない。以下の remaining OPEN を Browser Extension の実装開始前または関連下位仕様で解消する。`OPEN-BEX-001` は上流共通契約を本書へ反映したことで解消済みであり、remaining OPEN には含めない。

### Resolved: OPEN-BEX-001 — Public Account projection と internal routing

上流の共通契約により、page-facing の Account identity は §10.1 の `PublicAccountIdentity` に限定する。`profileId`、internal `accountId`、Wallet Store ID、key slot および opaque internal routing handle は page-facing field、page input、permission authority、ownership proof、Account authorization または key selection authority ではない。必要な internal Account reference は privileged host / Signer 内部の routing に限り、transaction signing の対象 Account は payload、expected signer、permission および current Profile-local context から解決する。複数の許可 Account の選択は trusted Signer UI / Signer-owned context で行う。

### OPEN-BEX-002: Provider discovery、capability、multiple Provider

- **問題:** multiple Provider、fake / conflicting Provider の選択 policy、capability identifier / negotiation、Provider version compatibility matrix および explicit selection API が未確定である。
- **影響:** discovery、`isAvailable()`、connection、all signing operations、Provider replacement。
- **本書の扱い:** API major `2` の既存 compatibility、malformed / incompatible の fail-closed および自動 fallback 禁止だけを適用する。新しい selection API、capability ID または version rule を追加しない。
- **戻すべき上流:** [sdk.md OPEN-SDK-001、OPEN-SDK-002](./sdk.md)、[SDK Design §7、§18](../design/sdk.md)、[interfaces.md OPEN](./interfaces.md)。

### OPEN-BEX-003: Frame、caller proof、Origin canonicalization

- **問題:** Browser-specific な top-level / requesting frame の exact observation、document identity、Origin canonicalization、iframe support の将来範囲および multiple window policy が未確定である。
- **影響:** connection、permission binding、trusted UI、navigation、response delivery。
- **本書の扱い:** 初回 milestone は上流要件どおり top-level caller とし、iframe / child frame を暗黙に許可しない。安全に一意化できなければ fail-closed とする。
- **戻すべき上流:** [browser-extension.md BR-004、BR-008](../requirements/browser-extension.md)、[Browser Extension Design §7、§19](../design/browser-extension.md)、Browser-specific下位仕様。

### OPEN-BEX-004: Permission expiry、session persistence、recovery

- **問題:** permission expiry、独立 revocation identifier、session persistence、background lifecycle recovery、pending request の保持および既存 result の retrieval policy が未確定である。
- **影響:** reconnect、Service Worker restart、permission revision、timeout、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`。
- **本書の扱い:** old authorization の推測復元、automatic re-sign、stale session の再利用を禁止する。具体 timeout、storage、recovery API を追加しない。
- **戻すべき上流:** [interfaces.md §8](./interfaces.md)、[signing-protocol.md OPEN-006](./signing-protocol.md)、[SDK Design §13、§21](../design/sdk.md)、Browser lifecycle 下位仕様。

### OPEN-BEX-005: Authentication、UI、update compatibility

- **問題:** Browser-specific authentication implementation、trusted UI host、exact UI / accessibility、update migration / rollback、Provider version transition および Browser support matrix が未確定である。
- **影響:** `AWAITING_USER`、`AUTHORIZED`、lock / unlock、restart、update、Mainnet release capability。
- **本書の扱い:** `every-signature`、explicit approval、trusted UI、fail-closed および old authorization 非再利用だけを確定する。OS API、UI framework、update migration を固定しない。
- **戻すべき上流:** [profile-account-spec.md](./profile-account-spec.md)、[security-design.md §7、§14、§16](../design/security-design.md)、[browser-extension.md BR-012、BR-013](../requirements/browser-extension.md)、release policy。

### OPEN-BEX-006: Public Aggregate / cosignature scope

- **問題:** full-parent inspection と safe cosignature semantics は確定しているが、Provider / SDK v1 の required / optional capability、対応 chain、公開 result field および operation scope が未確定である。
- **影響:** Provider capability、`cosignTransaction()`、Symbol Aggregate、NEM multisig / cosignature、release gate。
- **本書の扱い:** 全体確認できない target を拒否する。Partial、hash-only、summary-only または NEM / Symbol の暗黙変換を追加しない。
- **戻すべき上流:** [sdk.md OPEN-SDK-004](./sdk.md)、[signing-protocol.md OPEN-005](./signing-protocol.md)、[chain-compatibility-spec.md](./chain-compatibility-spec.md)、Provider / platform signing scope。

上記 OPEN を理由に、connection permission を signing approval とすること、Origin authority を SDK / page へ移すこと、blind / raw signing、secret API、new error code、automatic re-sign または fail-open recovery を導入してはならない。

## 33. Traceability

主要な契約を `Requirement → Design → Common Specification → Browser Extension Specification` の順に追跡する。

| Requirement                                              | Design                                                                                                                                                            | Common Specification                                                                                                                                                        | 本書                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `BR-001`、`BR-013`、`CR-011`、`CR-NFR-006`               | [Browser Extension Design §3、§19](../design/browser-extension.md)、[Architecture §2、§5](../design/architecture.md)                                              | [interfaces.md §7.4](./interfaces.md)、[signing-protocol.md](./signing-protocol.md)、[product-spec.md](./product-spec.md)、[ADR 0001](../adr/0001-mainnet-evidence-lite.md) | §2.3、§18.3、§26、§31.15                        |
| `BR-002`、`BR-005`、`CR-002`〜`CR-004`                   | [Browser Extension Design §10、§11](../design/browser-extension.md)、[Security Design §8、§14](../design/security-design.md)                                      | [signing-protocol.md §6、§8、§15](./signing-protocol.md)、[product-spec.md](./product-spec.md)                                                                              | §13、§17、§29                                   |
| `CR-016`、`CR-AC-017`、`BR-005`、`CR-003`、`CR-009`      | [Browser Extension Design §4、§5.3](../design/browser-extension.md)、[Signing Flow §18、§23](../design/signing-flow.md)                                           | [interfaces.md §9.7](./interfaces.md)、[signing-protocol.md §5.3、§6.2](./signing-protocol.md)、[profile-account-spec.md](./profile-account-spec.md)                        | §7.3、§9.3、§12、§17.2、§18、§20、§25、§29、§31 |
| `BR-003`、`BR-004`、`BR-008`、`SDK-FR-005`               | [Browser Extension Design §7、§8](../design/browser-extension.md)、[Interfaces Design §5](../design/interfaces.md)、[Signing Flow §18](../design/signing-flow.md) | [interfaces.md §5.5、§6](./interfaces.md)、[sdk.md §5、§6](./sdk.md)、[Handoff §5〜§7](./web-transaction-handoff-spec.md)                                                   | §5〜§9、§21、§22                                |
| `BR-006`、`BR-009`、`CR-008`、`SDK-SEC-001`              | [Architecture §5、§7](../design/architecture.md)、[Security Design §5、§6、§12](../design/security-design.md)                                                     | [profile-account-spec.md](./profile-account-spec.md)、[interfaces.md §5.3](./interfaces.md)                                                                                 | §4、§6、§10、§18、§19、§29                      |
| `BR-007`、`BR-008`、`CR-NFR-009`〜`CR-NFR-011`           | [Browser Extension Design §12、§15、§18](../design/browser-extension.md)、[Signing Flow §7、§18、§21](../design/signing-flow.md)                                  | [signing-protocol.md §6、§19、§20](./signing-protocol.md)、[sdk.md §13〜§16](./sdk.md)                                                                                      | §12、§20〜§26                                   |
| `SDK-FR-001`〜`SDK-FR-004`、`SDK-FR-009`                 | [SDK Design §7〜§10、§17](../design/sdk.md)                                                                                                                       | [sdk.md §5、§6、§15](./sdk.md)、[Handoff §5、§6](./web-transaction-handoff-spec.md)                                                                                         | §5、§8〜§10、§23、§27                           |
| `SDK-FR-006`、`SDK-FR-007`、`CR-005`、`CR-007`           | [Signing Flow §9〜§17](../design/signing-flow.md)、[Browser Extension Design §10、§16](../design/browser-extension.md)                                            | [chain-compatibility-spec.md](./chain-compatibility-spec.md)、[signing-protocol.md §9〜§17](./signing-protocol.md)                                                          | §11、§13〜§16                                   |
| `SDK-FR-008`、`SDK-FR-010`、`SDK-FR-011`                 | [Signing Flow §20〜§22](../design/signing-flow.md)、[SDK Design §12〜§16](../design/sdk.md)                                                                       | [interfaces.md §6、§10](./interfaces.md)、[signing-protocol.md §5、§19](./signing-protocol.md)、[Handoff §5.2.1、§7.2、§10](./web-transaction-handoff-spec.md)              | §5.2.1、§22〜§24、§27                           |
| `BR-010`、`BR-011`、`BR-012`、`CR-NFR-001`、`CR-NFR-002` | [Security Design §4、§14〜§17](../design/security-design.md)、[Architecture §11](../design/architecture.md)                                                       | [profile-account-spec.md](./profile-account-spec.md)、[signing-protocol.md §20](./signing-protocol.md)                                                                      | §6、§17、§19、§26、§28、§29                     |

Provider の exact package export、common identifier / error、Signing Protocol state、Handoff concrete contract、Chain Compatibility bytes および Profile / Account semantics は各 linked specification を参照する。本書に記載した Browser-specific rule は、それらの authority を置き換えない。

現行 Provider package / SDK の `accountId`、internal Account field、Provider-specific error code または direct signed-result representation との差分は、下流 Implementation synchronization の対象である。本書はそれらの実装 evidence を page-facing / SDK public contract の authority としない。

## 34. 関連資料

- [Browser Extension Requirements](../requirements/browser-extension.md)
- [Common Requirements](../requirements/requirements.md)
- [SDK Requirements](../requirements/sdk.md)
- [Browser Extension Design](../design/browser-extension.md)
- [Architecture Design](../design/architecture.md)
- [Security Design](../design/security-design.md)
- [Interfaces Design](../design/interfaces.md)
- [Signing Flow Design](../design/signing-flow.md)
- [SDK Design](../design/sdk.md)
- [Interface / Data Model Specification](./interfaces.md)
- [Signing Protocol Specification](./signing-protocol.md)
- [SDK Specification](./sdk.md)
- [Relay Specification](./relay.md)
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)
- [Profile / Account Specification](./profile-account-spec.md)
- [Chain Compatibility Specification](./chain-compatibility-spec.md)
- [Product Specification](./product-spec.md)
