# MosaicLynx Mobile App Specification

## 1. 文書の位置付け

| 項目         | 内容                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Status       | Design から実装へ引き渡す Mobile App Specification                                                                                    |
| 対象         | iOS / Android の MosaicLynx Mobile App と、その外部 handoff 境界                                                                      |
| 主な責任主体 | Mobile trusted host / trusted Signer                                                                                                  |
| 適用範囲     | Mobile App の責務、外部入力、Profile / Account binding、署名 lifecycle、Relay handoff、秘密情報境界、platform lifecycle、release gate |
| 対象外       | source code、class / file 構造、framework・library・database の選定、CI/CD、deployment procedure、test implementation                 |

本仕様は、承認済みの Mobile App 基本設計を、実装者と利用者が同じ外部動作を実現できる粒度へ具体化する。共通の request / response、署名 lifecycle、error、serialization、Chain-specific protocol および Wallet Core の契約は、既存 Specification を正本として参照する。本書は Mobile App 固有の適用を定め、既存の共通契約を別の契約へ置き換えない。

本仕様における `MUST`、`MUST NOT`、`SHOULD` および `MAY` は、上位 Specification の規範語と同じ意味で用いる。

### 1.1 規範性と authority

判断の authority は次の順序で扱う。

1. 本仕様が Mobile-specific に明示する契約。
2. [共通 Interface / Data Model Specification](./interfaces.md)、[Signing Protocol Specification](./signing-protocol.md)、[Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)、[Profile / Account Specification](./profile-account-spec.md) および [Chain Compatibility Specification](./chain-compatibility-spec.md)。
3. [Mobile App 基本設計](../design/mobile-app.md)、[共通アーキテクチャ設計](../design/architecture.md)、[共通セキュリティ設計](../design/security-design.md)、[署名フロー基本設計](../design/signing-flow.md)、[Interfaces 基本設計](../design/interfaces.md)、[Relay 基本設計](../design/relay.md) および [SDK 基本設計](../design/sdk.md)。
4. [共通要件](../requirements/requirements.md)、[Mobile App 要件](../requirements/mobile-app.md)、[Relay 要件](../requirements/relay.md) および [SDK 要件](../requirements/sdk.md)。

上記文書の共通契約と本書の記述が競合する場合、本書で独自に上書きせず、共通 Specification の authority に従い、未解決の競合は §19 に記載する。

## 2. Scope、前提および非責務

### 2.1 Scope

Mobile App は、端末上で利用者の署名判断を成立させる local trusted Signer である。対象は次の能力である。

- Application Profile と Account の表示、選択、関連付けおよび Scope の管理。
- 外部アプリ・スマホブラウザからの handoff と、Relay 経由の署名要求の受信。
- request、source、session、permission、Profile / Account、Chain / Network、operation、target および期限の検証。
- Mobile App が管理する trusted foreground UI での transaction / message 内容の確認。
- Authentication、Signing-capable unlock、Account authorization および Explicit user approval の独立した signing gate。
- `wallet-core` の外部契約を利用した Wallet Store、秘密情報処理および raw signing。
- 元 request に binding された response の生成と、Relay への暗号化 response の配送。
- Android milestone と iOS milestone を独立した platform capability として評価すること。

Mobile v1 の必須 signing operation は transaction signing と structured `MESSAGE_SIGN` である。既存 handoff が定める `connect`、`refreshActiveAccount` および `disconnect` は同じ Mobile handoff 境界で扱う。`cosignTransaction` の公開必須範囲は既存の OPEN を閉じるまで、対応 capability が明示された場合に限る。

### 2.2 非責務

Mobile App は次を担わない。

- Relay server の session 保管、opaque envelope の semantic 解釈、Relay の TTL・rate limit・HTTP / Redis 管理または Relay-side authorization。
- SDK の公開 API、Web page integration、Provider discovery、transport 選択または dApp の結果検証。
- Relay、Mobile App または Signer による transaction announce、node 選択、残高・履歴取得または継続的な network state 管理。
- 外部アプリ、Web page、Relay、通知、OS link の表示文言を approval の根拠にすること。
- `wallet-core` の KDF、AEAD、Wallet Store、key derivation、chain-specific cryptography または raw signing の再実装。
- OS の Keychain / Keystore / Secure Enclave / StrongBox の内部実装を `wallet-core` の責任として扱うこと。
- 端末紛失時の管理者による秘密情報再発行、遠隔復旧または custody 保証。

## 3. 用語と共通契約

| 用語                       | 本仕様での意味                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile trusted host        | Mobile App 内で request validation、Profile / Account、trusted UI、四条件 gate、lifecycle、wallet-core orchestration および response validation を統合する Signer-side authority。具体的な内部構造を意味しない。             |
| Signer                     | 利用者の確認・承認を受け、承認済み target を wallet-core で署名する trusted component。Mobile App が Mobile 経路の Signer である。                                                                                           |
| Profile-local context      | Application Profile、Profile に固定された Network、active Account、permission、session、request、approval および wallet-core context を内部で binding した security context。公開 wire field としての `profileId` ではない。 |
| Public Account Identity    | `chain`、`network`、`address`、`publicKey` を含む外部公開可能な Account identity。内部 key slot や `accountId` は含まない。                                                                                                  |
| Internal Account Reference | Mobile App 内で Profile、permission および wallet-core key identity を解決する内部参照。外部 requester が直接指定する鍵 selector ではない。                                                                                  |
| Handoff context            | `mosaiclynx.relay.v1`、generation、session、request、source、recipient、credential role、expiry および E2E envelope を含む受け渡し文脈。                                                                                     |
| Signing target             | transaction 全体、structured message、または既存契約が定める chain-specific target。summary、hash-only identifier または外部 lookup は target の代替ではない。                                                               |
| delivery disposition       | known signed result に付随する `PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN`。署名 lifecycle state や Relay transport state ではない。                                                                                    |

Mobile App は `chain: 'symbol' | 'nem'` と `network: 'mainnet' | 'testnet'` を共通契約どおり別々に扱う。Scope、Profile、Account、payload および result の組合せを一致させ、暗黙の Chain / Network 変換を行わない。

## 4. Actor、Component および責任境界

### 4.1 Component responsibility

| Component                    | Mobile App との境界                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application / UI             | Profile、Account、permission、request lifecycle、表示、操作、platform integration、lifecycle invalidation および response orchestration を担う。外部由来の表示を trust anchor にしない。                                                            |
| Mobile trusted host / Signer | caller / handoff、request、Scope、Profile / Account、target、inspection、四条件 gate、署名、result validation および fail-closed の最終 authority である。                                                                                          |
| Trusted approval UI          | Mobile App が管理する foreground の確認領域。Signer が target から生成した confirmation model を表示し、明示的な approve / reject を受ける。                                                                                                        |
| Chain integration            | Symbol / NEM の transaction / message を chain-specific に parse、validate、canonicalize、inspection および display model 化する。共通 lifecycle を担わない。                                                                                       |
| `wallet-core`                | Wallet Store、Profile password 処理、Software Key、cryptographic public identity、秘密情報処理および approved raw bytes の signing を担う。caller、UI、permission、四条件または semantic inspection を担わない。                                    |
| OS / platform                | external invocation routing、device lock、user presence、protected storage、hardware-backed capability および process lifecycle を提供し得る。request validity、approval、署名 semantics を決めない。                                               |
| SDK                          | request の生成、公開 API、transport-independent correlation、response mapping および dApp への結果伝達を担う。semantic inspection、approval、Authentication、Signing-capable unlock、Account authorization、秘密情報処理および signing を担わない。 |
| Relay                        | E2E encrypted opaque envelope の一時的な transport、structural validation、routing、generation、session、expiry、duplicate / stale state および transport status を担う。署名判断、認証、approval、signing、result / disposition の生成を担わない。 |
| dApp / Web page              | request を発行し、返された result を独立検証し、必要な network 処理を行う。Mobile App の approval、secret または gate を制御しない。                                                                                                                |
| Release authority            | current release / evidence policy を評価し、Mainnet capability の gate status を発行する。Mobile App は status を消費し、独自に gate を免除・昇格しない。                                                                                           |

### 4.2 Mobile trusted host の Signer 責任

Mobile trusted host は、次の処理を同一 request context に binding して実施する。

1. 外部 invocation または Relay handoff を untrusted input として受信する。
2. source、recipient、session、generation、request identity、integrity、expiry および permission を検証する。
3. current Profile、Profile Network、selected Account、Chain / Network および expected signer を解決し、整合性を検証する。
4. target 全体を chain-specific に inspection し、trusted UI 用 confirmation model を生成する。
5. 利用者の明示的な approve / reject を trusted UI から取得する。
6. Authentication と Signing-capable unlock を別々の条件として取得・確認する。
7. 対象 Profile / Chain / Network / Account の Account authorization を確認する。
8. wallet-core 呼び出し直前に target、Profile-local context および四条件を再検証する。
9. wallet-core を介して署名し、返却結果と元 request / target の対応を検証する。
10. 共通 response contract に従う response を生成し、Signer-originated result semantics を意味不変に保持して配送する。

Relay、SDK、external app、OS metadata、OS authentication adapter または wallet-core のいずれも、この Signer-side responsibility を成立・変更・免除・迂回できない。

## 5. Trust Boundary

```text
External / untrusted
  dApp / Web page / SDK / Deep Link / Universal Link / App Link / Intent / share
  Relay / network / notification / OS handoff metadata
          │ すべて Mobile App で再検証する
          ▼
Mobile request boundary
  source・recipient・session・generation・request identity・integrity・expiry
          │ 検証済み request context のみ
          ▼
Mobile trusted host boundary
  Profile / Account / permission / Chain / Network
  chain-specific inspection / trusted UI / four-condition gate / lifecycle
          │ approval 済み、再検証済み target のみ
          ▼
wallet-core logical / binding boundary
  Wallet Store・key identity・secret processing・raw signing
          │ OS storage / user presence は別責任
          ▼
OS security boundary
  device lock・protected credential / key・hardware-backed capability
```

次を trust anchor としてはならない。

- URL、scheme、association、アプリ名、icon、Origin 文字列、通知または外部 UI。
- Relay の存在、metadata、transport status、HTTP 2xx、ACK、`consumed`、purge または availability。
- SDK / dApp の自己申告、connection、permission、Account cache または Provider state。
- OS authentication success、device unlock、通常の `UNLOCKED`、wallet-core の password / Store validation または signing success。

OS と `wallet-core` は限定された責任範囲で trusted だが、OS が caller、transaction の意味または利用者の意思を保証すること、または wallet-core が利用者承認を代行することを意味しない。Binding、WASM memory、Native host、JavaScript buffer または crash report が秘密情報を自動隔離・消去することも前提にしない。

## 6. Profile / Account / Scope Binding

### 6.1 Profile の選択

- Profile の `network` は作成時に `mainnet` または `testnet` の一つへ固定され、変更できない。
- Symbol と NEM の利用可否は Profile の `enabledChains` と、各 Account の chain-specific identity で管理する。
- request の network と一致しない Profile を選択して署名してはならない。
- 外部 request の `profileId`、internal account reference、Account 名または expected signer は、Profile の選択・鍵選択・authorization の authority ではない。
- Mobile App は Profile を外部 request に合わせて暗黙に切り替えてはならない。利用者が trusted UI で Profile を明示選択した場合も、selected Profile / Network を再表示し、target を再検証し、新しい approval context を要求する。
- Profile switch、Profile lock、Profile association change または Profile の削除・無効化が発生した場合、関連する approval、Authentication、Signing-capable unlock、Account authorization および未完了 request を失効させる。

Application Profile と wallet-core Profile / Wallet Store は同一の責任単位ではない。Application は Profile metadata、active Profile、permission、Account association および表示を管理し、wallet-core はその外部契約に従って cryptographic identity と Wallet Store を管理する。

### 6.2 Account の選択と binding

Account は Chain-specific な cryptographic identity と Application Account association の検証済み対応である。

- Mobile App は request の Scope、Profile Network、enabled Chain、selected Account、payload signer、expected signer および wallet-core public identity を照合する。
- `expectedSignerPublicKey` がある場合、対象 Chain の形式を検証し、selected / authorized Account の実際の signer public key と完全一致させる。不一致は `SIGNER_MISMATCH` 相当の既存 error mapping とし、署名しない。
- `expectedSignerPublicKey` がない場合も、payload signer と利用者が trusted UI で確認した selected Account の一致検証を省略しない。
- Symbol と NEM の Account / Key Identity、address、network、derivation semantics および signing bytes を共通の一つの identity として扱わない。
- `PublicAccountIdentity` には公開を許可された `chain`、`network`、`address`、`publicKey` および既存契約が許す表示情報だけを含める。private key、Mnemonic、seed、Profile password、decrypted Store、wallet-core key slot、internal `accountId` または `profileId` を含めない。
- Account の選択は Account authorization ではない。connection permission、public Account disclosure、session または capability も Account authorization の代替ではない。

### 6.3 Permission と Account authorization

connection / pairing permission は、caller に対する公開 Account disclosure または scope の許可であり、個別 signing authorization ではない。Mobile App は、少なくとも caller / source、Profile、Scope、Account、permission scope / revision、operation、target および freshness の対応を確認する。

Account authorization は、対象 Profile / Chain / Network / Account を当該 request の signing target に使用するための Signer-side authorization である。これは request ごとの Explicit user approval、Authentication および Signing-capable unlock と独立して成立させる。permission が存在することだけで、この authorization を成立させてはならない。

permission が存在しない、revoked、scope / revision 不一致、Profile 不一致、Account 不一致、caller 不一致または authorization 状態を確認できない場合、署名を開始せず既存の `permission_denied` / concrete error mapping に従って終了する。

## 7. 共通 Signing Gate

### 7.1 四条件

Mobile App は wallet-core を呼び出す前に、次の四条件をすべて独立に成立させる。

1. **Authentication**: 当該 request / target に対する利用者の署名ごとの認証が成立している。
2. **Signing-capable unlock**: 対象 Profile の signing capability を利用できる unlock 状態が成立している。通常の `UNLOCKED` と同一視しない。
3. **Account authorization**: 対象 Profile / Chain / Network / Account をこの request で使う authorization が成立している。
4. **Explicit user approval**: 利用者が同じ target、Scope、Account、operation および確認内容を trusted UI で明示的に承認している。

四条件は、次の binding tuple に対する一回限りの短寿命 authorization とする。

```text
(requestId, caller/source, handoff context, session/generation,
 Profile-local context, permission revision, Account, Chain, Network,
 operation, exact target or trusted digest, inspection result, freshness)
```

`requestId` 単独、session、generation、permission、capability、selected Account、OS / device unlock、過去の Authentication、wallet-core password / Store validation または Relay delivery は四条件の代替ではない。

### 7.2 Signing-capable unlock

- `LOCKED` では署名しない。
- 通常の `UNLOCKED` は Application の利用状態であり、Authentication、Signing-capable unlock、Account authorization または Explicit user approval を意味しない。
- signing-capable unlock は、対象 Profile と当該 request context に binding された signing capability として扱う。
- device unlock、OS biometric success または App foreground 復帰だけで signing-capable unlock へ自動遷移してはならない。
- Profile switch、device lock、protected storage capability loss、manual lock、idle timeout、process restart、context loss または security state の不明化で signing-capable unlock を無効化する。
- unlock の credential、KDF、Store validation および秘密情報処理は wallet-core と platform 下位契約に従う。Mobile App はこれらを再実装せず、失敗時は fail-closed とする。

### 7.3 Authentication

Profile / Account Specification の `SigningAuthentication = 'every-signature'` を適用する。署名ごとに、Profile password または既存 platform contract が認める有効な user-presence / device authentication を request に binding して取得する。

Authentication は「現在利用者が App を操作している」ことを示す条件であり、他の三条件を成立させない。認証だけの成功、別 request の認証済み context、前回の biometric success、OS device unlock または自動復帰は署名を許可しない。

具体的な PIN、OS passcode、biometric の組合せ、fallback、再認証頻度、rate limit および lock timeout は §19 の OPEN または platform 下位仕様に従う。未定義の fallback や認証失敗の bypass は許可しない。

### 7.4 四条件成立前の禁止

次のいずれかがある場合、Mobile App は wallet-core を呼び出さず、success result を生成しない。

- 四条件の一つでも未成立、stale、revoked、locked、unknown または mismatch。
- caller、session、generation、Profile、Account、Chain / Network、operation、target、inspection または expiry のいずれかを確認できない。
- trusted UI が foreground でなく、利用者が確認できず、または確認内容が target から生成されていない。
- Mainnet gate が成立していない場合の Mainnet signing。

`connect`、Account disclosure、permission、session の有効性、Relay が request を配送したこと、または wallet-core が bytes を返せることだけで署名可能状態へ進めてはならない。

## 8. External Invocation と Handoff

### 8.1 共通受信原則

App 起動、notification、Deep Link、Universal Link、App Link、Intent、share または Relay request の受信は、request を受け取った事実にすぎず、approve、unlock、Authentication または signing を意味しない。すべての外部入力を validation 前は untrusted とする。

Mobile App は request を次の順で取り扱う。

1. 外側の入力を bounded data として受信し、過剰長、duplicate key、unknown field、null、型不一致および malformed encoding を拒否する。
2. handoff protocol、version、operation、request / session / generation identity、recipient、direction、expiry および endpoint credential role を確認する。
3. E2E envelope を既存 Handoff 契約で復号・integrity 検証し、request digest、requestId、session、generation および direction の対応を確認する。
4. source / Origin、permission、Profile / Account、Scope、expected signer および operation を確認する。
5. target を Chain-specific に parse、validate、canonicalize、inspection し、確認可能な内容を生成する。
6. trusted UI へ渡して explicit approval を取得し、認証・unlock・Account authorization と pre-sign revalidation を行う。

いずれかの段階で不一致、未検証、expired、duplicate、replay、unsupported または displayability failure があれば、approval UI の署名操作へ進めず terminal / safe failure とする。

### 8.2 現行 Handoff の link 契約

現行 `mosaiclynx.relay.v1` の Mobile handoff は、verified HTTPS App Link を標準経路とする。

```text
https://link.mosaiclynx.app/v1/handoff/{sessionId}#s={sessionSecret}&a={appToken}
```

- iOS は Associated Domains、Android は Digital Asset Links により正規 App と `link.mosaiclynx.app` を関連付ける。
- `sessionId`、`sessionSecret` および `appToken` は既存 Handoff の CSPRNG / encoding 契約に従う。`appToken` は Mobile-side Relay endpoint authorization credential、`sessionSecret` は E2E secret であり、署名秘密情報ではない。
- fragment は verified client-side handoff で正規 Mobile App へ一時的に渡すためだけに使う。fragment 全体、token、session secret を Relay、HTTP request body、Referer、server / application log、analytics、telemetry、diagnostics、error / crash reporting、Clipboard、browser storage または persistent history へ送らない。
- App は scheme、host、path、session ID、fragment field、重複 field、unknown field および過剰長を strict validation する。validation できない link は signing request に昇格させない。
- 標準 v1 は custom URL scheme ではない。custom scheme、QR、generic share / Intent、その他の Deep Link を追加標準経路として受理するには別途 handoff contract が必要である。ただし採用された場合も、外部入力非信頼、expiry、replay、integrity、Profile binding および四条件を省略しない。
- 正常系では App から browser callback link を開かない。元ページが response を取得する。
- 未導入 fallback は署名フローではない。fallback は fragment を送信・保存せず、導入案内を表示し、credential を正規 App 以外へ転送しない。

### 8.3 Origin proof

Mainnet の Mobile handoff では `originProof` を必須とする。`initiatorOrigin` は public DNS に解決する HTTPS Origin、既定 port 443 とし、private / reserved / loopback / link-local address、redirect、cross-origin、HTTP downgrade、DNS rebinding または manifest の Origin 不一致を拒否する。

Mobile App は同一 Origin の既存 well-known manifest と proof の version、key ID、algorithm、有効期間、status、署名および payload / request identity の対応を検証する。proof が欠落、expired、revoked、wrong Origin、wrong key または検証不能なら Mainnet signing を開始しない。

Testnet では既存 contract が proof なしを許す場合がある。その場合は trusted UI に「要求元（未検証）」として表示し、Mainnet の「登録鍵で検証済み」と同じ保証を表示しない。Origin proof は caller binding の補助であり、request、Scope、permission、target、Profile または四条件の検証を省略する根拠ではない。

## 9. Relay Integration

### 9.1 Relay の authority 限界

Relay は opaque / untrusted transport である。Relay は次を解釈、生成、推測、変更または確定してはならない。

- transaction / message の意味、signer、recipient、Account ownership、risk、display model。
- Authentication、Signing-capable unlock、Account authorization、Explicit user approval または signing authorization。
- transaction / message の semantic validation、signed result、`RESULT_UNKNOWN` または `deliveryDisposition`。
- Mainnet release / evidence gate、Testnet / Mainnet capability または Signer の安全性。

Relay は、既存 Handoff / Relay Specification に従って protocol、generation、session、direction、credential role、サイズ、expiry、lifecycle、request / response correlation、duplicate / conflicting state および opaque envelope の外形を検証する。この structural validation は Mobile App の E2E、Origin、semantic、Account、approval、署名検証の代替ではない。

### 9.2 Mobile-side Relay flow

現行 Handoff 契約に従う Mobile-side flow は次である。

```text
SDK が current generation を取得
  → encrypted request が Relay に登録される
  → verified App Link で Mobile App が起動
  → Mobile App が appToken で request envelope を取得
  → Mobile App が復号・検証・inspection・approval・署名
  → Mobile App が encrypted response を appToken で登録
  → 元ページの SDK が response を取得・復号・検証して ACK
```

Mobile App は `appToken` を Mobile-side request retrieval / response upload にだけ使用し、`webToken` を Mobile-side credential として使用しない。Relay は `sessionSecret` を受信、保存、hash 化、導出または復号に使用しない。

Mobile App は Relay から取得した request が正しいように見えるだけで approval UI へ渡さない。少なくとも protocol、requestId、requestDigest、generation、session、direction、recipient、createdAt / expiresAt、operation、source / Origin、Scope、Profile / Account、integrity、target および duplicate / replay を検証する。

### 9.3 Relay-local state と Mobile / Signer state

次の状態軸を相互に変換してはならない。

| 軸                          | Mobile App / Signer が生成または確定する意味                                                                                                          | Relay が観測・管理する意味                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| request / signing lifecycle | `RECEIVED`、`VALIDATED`、`INSPECTED`、`AWAITING_USER`、`AUTHENTICATING`、`AUTHORIZED`、`SIGNING`、`SUCCEEDED`、`RESULT_UNKNOWN` および terminal state | Relay の transport state では表現しない                                                                  |
| delivery disposition        | known signed result に付随する `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN`                                                                             | Relay は生成・変更・推測・確認しない                                                                     |
| Relay transport lifecycle   | —                                                                                                                                                     | `pending`、`response_available`、`consumed`、`cancelled`、`expired`。lowercase の transport state        |
| transport failure           | —                                                                                                                                                     | unavailable、timeout、state loss、credential failure、network failure 等の Relay / client transport 事実 |

Relay の `response_available`、HTTP 2xx、ACK、`consumed`、purge または response retrieval は Mobile の `SUCCEEDED`、`DELIVERED`、`RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を意味しない。逆に Mobile の `SUCCEEDED + PENDING` は Relay の `response_available` と併存できる。

### 9.4 Relay state loss と generation

Relay restart、storage loss または state continuity loss 後は、Relay が generation を切り替え、旧 generation の session / request / response を current handoff として復旧しない。Mobile App は old generation、old ciphertext、old session または state loss 前の approval を再利用しない。

current generation metadata が付いた old ciphertext が Relay に一時保存される可能性があっても、Mobile App は generation-bound E2E validation に失敗する request を approval、signing または success へ進めない。再試行は new generation、new session / request identity、fresh envelope、fresh validation および fresh user approval を伴う。

## 10. Signing Request の検証と Inspection

### 10.1 共通 validation

Mobile App は次の順序で検証する。各項目の exact type、encoding、length、canonicalization および error mapping は参照 Specification の契約を使用する。

1. 外側の input / envelope の型、size、duplicate key、required / optional、unknown field および malformed encoding。
2. protocol literal、version、operation、identifier、timestamp、nullable、range および union combination。
3. requestId、session、generation、requestDigest、direction、recipient、duplicate、replay、consumed / cancelled / expired および late delivery。
4. source / Origin、origin proof（適用時）、permission scope / revision、Profile-local context および selected Account。
5. Chain、Network、operation、expected signer、payload integrity および Profile Network の一致。
6. operation-specific target の parse、chain-specific validation、canonicalization、semantic inspection および displayability。
7. request expiry、message expiry、transaction / parent expiry、session expiry および applicable capability / release gate。

検証失敗時は `VALIDATED`、`INSPECTED`、`AWAITING_USER`、`AUTHORIZED` または `SIGNING` へ進めない。Relay、SDK、dApp、OS または wallet-core が同じ検証に成功したことを Mobile の最終検証の代替にしない。

### 10.2 Transaction signing

現行 handoff の `signTransaction` は、既存の `MosaicLynxSignTransactionParams` / `RelaySigningRequest` に従う。`chain`、`network`、hex payload および optional `expectedSignerPublicKey` の exact contract は Handoff、Interfaces、Signing Protocol および Chain Compatibility Specification を参照する。

最低限、次を満たさない transaction は署名しない。

- payload が偶数長の hexadecimal で、decoded byte length が Handoff の 256 KiB 以下である。
- chain、network、transaction type / version、全 field、signature state および必要な parent / inner context を parse / validate できる。
- decode 後の chain-specific canonical serialization が元 payload と byte-for-byte で一致する。
- selected / authorized Account、payload signer、expected signer、Profile Network および Scope が一致する。
- 利用者が security-relevant field と影響を trusted UI で確認できる。

確認対象には適用可能な transaction type / version、Chain、Network、Account / signer、recipient、asset / mosaic、amount、fee、deadline、message、namespace、metadata、authority / permission change、Aggregate outer / embedded transaction、existing signature / cosignature、parent identity、expected role および warning を含める。各 Chain が定める schema、signing bytes、hash、address、Aggregate / multisig / cosignature scope は Chain Compatibility と下位契約を正本とする。

hash-only、opaque identifier、hash + summary、外部 lookup、Node response、Relay metadata または dApp supplied description だけでは parent / transaction 全体の confirmation model を作らない。Partial、Symbol Aggregate、NEM multisig / cosignature を受信した場合も、Signer が渡された全体を独立に parse / validate / display できるときだけ、その既存 operation の candidate とする。未対応、部分的、ambiguous、unparseable または表示不能な security-relevant field があれば、warning-only や raw signing へ fallback しない。

### 10.3 Structured `MESSAGE_SIGN`

Mobile v1 の message signing は、wire operation `signData` に対応する structured `MESSAGE_SIGN` である。arbitrary raw bytes signing ではない。

現行 handoff の request context は `chain`、`network`、`purpose`、`nonce`、`issuedAt`、`messageExpiresAt`、`payload`（`utf8` または `hex` encoding）および optional `expectedSignerPublicKey` とする。exact field、encoding、nonce format、canonicalization および signed result format は [Interfaces §9.4](./interfaces.md)、[Signing Protocol §15](./signing-protocol.md) および Handoff §5 / §7 を正本とし、field alias を追加しない。

Signer は同じ検証済み structured message model から inspection、trusted UI 表示および wallet-core へ渡す signing input を導出する。少なくとも source / handoff status、Profile、Account、Chain / Network、purpose、message contents、domain、nonce、issued / expiry、request freshness および replay state を適用可能な範囲で binding する。

parse failure、unknown format、raw-only / uninspectable content、expired、duplicate、replay、cross-source、cross-domain または cross-purpose の message は署名しない。外部の表示文言、SDK / Relay metadata または OS metadata から別の message model を作らず、message を transaction signing、別 operation または別 transport の成功へ変換しない。

## 11. Trusted UI、Approval および Signing

### 11.1 Trusted confirmation

署名確認は Mobile App が管理する foreground UI で行う。UI は外部 App、browser、Relay、notification、OS link または stale screen に委譲しない。

利用者が少なくとも次を区別して確認できることを要求する。

- source / relying context、handoff の検証状態および operation。
- Symbol / NEM、Mainnet / Testnet、Profile Network、selected Account、address / public key および expected signer / role。
- transaction または structured message の全 security-relevant field、target identity、expiry、warning および確認可能な影響。
- Aggregate / parent / embedded / inner transaction、existing signature / cosignature、selected cosigner および role（適用時）。
- Mainnet の Origin proof 検証状態、または Testnet で proof がない場合の「要求元（未検証）」表示。

layout、文言、localization、accessibility および platform-specific UI は implementation choice とする。ただし required information の省略、外部 summary の authority 化、表示不能 target の user self-accept、または警告だけでの blind signing を許可しない。

### 11.2 Approval と pre-sign revalidation

Explicit user approval は boolean flag ではなく、§7.1 の binding tuple に対する一回限りの approval context である。利用者の approve intent を取得した後、Authentication、Signing-capable unlock および Account authorization を当該 request に binding して成立させる。

wallet-core の呼び出し直前に、次をすべて再検証する。

1. request が current、未期限切れ、未使用、未取消、未失効である。
2. source、Origin proof / status、recipient、session、generation、requestId および response channel が承認時と同じである。
3. Profile、Profile Network、Account、Chain、Network、permission scope / revision、operation および capability context が同じである。
4. payload、parent、embedded / inner transaction、message、signer、expected signer、existing signature / cosignature、canonical form および inspection result が同じである。
5. trusted UI が foreground で継続し、別 request に state が置換されていない。
6. 四条件がすべて同一 request / target / Profile-local context に対して現在も成立し、missing、stale、revoked、locked、unknown または mismatch ではない。

一つでも失敗した場合は approval / authorization を `INVALIDATED` とし、wallet-core を呼び出さない。確認後の target mutation、Account substitution、Chain / Network substitution または TOCTOU を、再署名や別 transport で隠蔽してはならない。

### 11.3 Signing と result validation

再検証済みで四条件を満たした target だけを wallet-core の既存 raw signing contract へ渡す。Mobile App は transaction construction、署名 byte 列、Chain-specific cryptography または Wallet Store crypto を独自に実装しない。

wallet-core が返した bytes / result は、次の対応を検証してから success response にする。

- original request / requestId / requestDigest / operation。
- source、session / generation、response recipient および Profile-local context。
- signer identity、selected / expected Account、Chain / Network。
- exact target、target digest / hash、message identity または Chain-specific result identity。
- 署名時点の四条件と approval context。

対応を安全に確認できない、wallet-core が失敗した、Store / Binding が不整合、または context が失われた場合は success result を返さない。秘密情報、内部 stack、raw parser detail または過剰な failure detail を返さない。

## 12. Response、Result および Delivery Semantics

### 12.1 Response mapping

Mobile App の Relay response は既存 Handoff の union に限定する。Mobile App は response を E2E 暗号化して Relay へ登録し、Relay は opaque bytes を pass-through する。

| Mobile 側の確定結果                                                   | response の意味                                                                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| transaction signing 成功                                              | `outcome: 'signed'`、`signingOutcome: 'SUCCEEDED'`、known `signedTransaction` および `deliveryDisposition`。                         |
| structured message signing 成功                                       | `outcome: 'dataSigned'`、`signingOutcome: 'SUCCEEDED'`、known `signedData` および `deliveryDisposition`。                            |
| signing generation の成否不明                                         | `outcome: 'resultUnknown'`、`signingOutcome: 'RESULT_UNKNOWN'`。signed result、`deliveryDisposition` および `errorCode` を持たない。 |
| 利用者拒否・validation / inspection / authorization / signing failure | `outcome: 'rejected'` または `outcome: 'failed'` と既存 `MosaicLynxSDKErrorCode`。success result を持たない。                        |

通常 failure の concrete code、response field、serialization および SDK Promise mapping は Handoff §10、Interfaces §10 および SDK Specification を正本とする。本書は新しい error code を追加しない。

### 12.2 `RESULT_UNKNOWN`

`RESULT_UNKNOWN` は、trusted Mobile Signer が **signing generation 自体の成否を確定できない場合**に限定する。例として、wallet-core / Binding 呼び出し中の process termination、結果 buffer の喪失または signing operation の完了状態を trusted host が検証できない場合がある。

次から `RESULT_UNKNOWN` を生成・推測してはならない。

- 単なる network failure、Relay unavailable、Relay restart、response absence、ACK failure、SDK timeout、recipient offline、polling timeout または delivery failure。
- Relay の `pending` / `response_available` / `consumed`、HTTP 2xx、session existence または purge。
- SDK、Provider、dApp または OS の自己申告。

Mobile App が `RESULT_UNKNOWN` を返した後、同じ request / target の未署名を仮定した自動 re-sign、別 Signer、別 Provider または別 transport への自動 fallback を行わない。新しい signing は、利用者が明示的に開始する fresh request、fresh validation、fresh Authentication、fresh Signing-capable unlock、fresh Account authorization および fresh Explicit user approval を必要とする。

### 12.3 `deliveryDisposition`

`deliveryDisposition` は known signed result にだけ付随し、署名 outcome と別軸である。

| 値                 | 意味と authority                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PENDING`          | Mobile Signer が known signed result を保持し、response delivery が Signer-side の trusted delivery contract で完了確定していない。現行 Mobile Relay v1 の response upload 後の初期値は原則 `PENDING`。         |
| `DELIVERED`        | trusted Signer が、既存 delivery contract により当該 known result の delivery 完了を確定した場合だけ許可する。Relay ACK、`consumed`、HTTP 2xx、purge、SDK retrieval または polling success だけでは生成しない。 |
| `DELIVERY_UNKNOWN` | known signed result は保持しているが、その delivery disposition を trusted Signer が確定できない場合だけ許可する。Relay、SDK または transport が network failure 等から生成・推測してはならない。               |

現行 Handoff v1 には Mobile App が SDK の ACK を受ける reverse acknowledgement contract がない。そのため Mobile App は Relay response 登録や SDK ACK の観測だけで `PENDING` を `DELIVERED` に変更しない。`DELIVERY_UNKNOWN` を使用する場合も、known result の存在と Signer-side authority を確認できなければならない。

### 12.4 Known signed result の recovery

known signed result の recovery は新しい signing operation ではない。

- `SUCCEEDED + PENDING` または `SUCCEEDED + DELIVERY_UNKNOWN` の既存 result は、許可された `resend`、`redelivery`、`retrieval` または `lookup` のみで回復対象とする。
- recovery は元 request、requestDigest、operation、signer、Account、Chain / Network、target および response recipient への binding を再検証する。
- 同じ encrypted response の冪等な再登録、既存 response の取得または既存 result の再配送は許可され得るが、新しい signature は生成しない。
- recovery のために `SIGNING` へ戻らず、別 target、別 Account、別 Signer、別 Provider または別 transport へ自動切替しない。
- result の保持期間、lookup API、redelivery API および recovery record の storage は既存 Handoff / Relay / SDK contract が定める範囲に従い、未確定部分は §19 の OPEN とする。

Relay の response upload、ACK、retrieval、`consumed` または purge は recovery の authority ではない。Mobile App はこれらを `DELIVERED`、`RESULT_UNKNOWN` または再署名の根拠にしない。

## 13. State Model と Transition

### 13.1 Request / signing lifecycle

Mobile App は既存 Signing Protocol の state set を使用する。`AUTHENTICATING` は Mobile の device authentication / user-presence substep であり、新しい wire operation ではない。

```text
RECEIVED → VALIDATED → INSPECTED → AWAITING_USER
  → AUTHENTICATING → AUTHORIZED → SIGNING → SUCCEEDED
```

| State            | Mobile App における意味                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `RECEIVED`       | 外部 invocation または Relay から入力を受信した。trust、approval、署名可否は未確定。                                                     |
| `VALIDATED`      | 外形、identity、source / handoff、integrity、expiry、recipient、permission、Profile / Account、Scope を検証した。                        |
| `INSPECTED`      | chain-specific parse / validate / canonicalize と confirmation model 生成を完了した。                                                    |
| `AWAITING_USER`  | trusted foreground UI で target を表示し、個別の user action を待っている。                                                              |
| `AUTHENTICATING` | 当該 request に binding された device authentication / user presence を実行している。                                                    |
| `AUTHORIZED`     | 四条件が同じ request / target / Profile-local context に対して独立にすべて成立した。一回限りの短寿命状態。                               |
| `SIGNING`        | pre-sign revalidation 済み target を wallet-core に渡し、結果を待っている。                                                              |
| `SUCCEEDED`      | known signed result と signer / request / target / four-condition context の対応を検証した。                                             |
| `REJECTED`       | 利用者が明示的に拒否した。wallet-core は呼び出さない。                                                                                   |
| `FAILED`         | validation、unsupported、permission、authentication、unlock、Account authorization、inspection、wallet-core または確定した内部 failure。 |
| `EXPIRED`        | request、message、transaction / parent または適用期限が切れた。                                                                          |
| `CANCELLED`      | 利用者、dApp、Signer、platform または transport の cancellation が signing generation 確定前に成立した。                                 |
| `INVALIDATED`    | Profile、Account、source、session、generation、target、permission、四条件または lifecycle context が失効・変更・不明になった。           |
| `RESULT_UNKNOWN` | signing generation 自体の成否を trusted Mobile Signer が確定できない。署名結果ではない。                                                 |

`REJECTED`、`FAILED`、`EXPIRED`、`CANCELLED`、`INVALIDATED` および `RESULT_UNKNOWN` から、同じ request / authorization を使って `AWAITING_USER`、`AUTHORIZED`、`AUTHENTICATING` または `SIGNING` へ戻してはならない。新しい signing は新しい request identity と四条件を必要とする。

### 13.2 Lock state

Mobile App は少なくとも `LOCKED`、通常の `UNLOCKED`、request-bound な signing-capable state および unavailable / terminal state を論理的に区別する。

| 事象                             | 必須動作                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cold start / restart             | `LOCKED` とし、過去の Authentication、approval、authorization、signing operation を復元しない。                                                            |
| device lock / user-presence loss | signing-capable state、decrypted secret および Authentication context を無効化する。device unlock だけで復帰しない。                                       |
| manual lock / idle timeout       | signing-capable state、approval、Authentication、Account authorization および一時秘密を無効化する。                                                        |
| foreground 復帰                  | request、Profile、Account、Scope、expiry、target、permission および device state を再検証し、内容を再表示して fresh approval / Authentication を要求する。 |
| process restart / OS kill        | `LOCKED`。旧 approval、auth、unlock、signing operation を自動再開しない。                                                                                  |

## 14. Lifecycle、Failure および Recovery

### 14.1 Background / suspension / resume

- background または suspended に移行した時点で、未完了 approval、Authentication、Account authorization および signing-capable state を原則として無効化する。
- opaque request reference、expiry、必要最小限の session metadata を保持できるが、署名対象、decrypted secret、approval または auth context を復元してはならない。
- background notification、silent wake、Relay polling、callback または headless execution だけで UI、unlock、approval または signing を実行しない。
- foreground へ resume した場合、source、request identity、session / generation、payload、Profile / Account、Scope、permission、expiry、device capability および operation を再検証し、target を再表示し、利用者の fresh approval と Authentication を取得する。

### 14.2 Process termination / state loss

- process termination、強制終了、crash、OS kill または端末再起動後に、自動署名・自動 unlock・自動 approval を行わない。
- signing 開始前に state を失った request は `INVALIDATED`、`CANCELLED` または既存 error mapping の安全側結果とし、署名しない。
- wallet-core 呼び出し中に process / Binding state を失い signing generation の成否を確定できない場合だけ `RESULT_UNKNOWN` とする。
- wallet-core result と response が確定済みである場合、known result recovery の契約に従って既存 result の resend / retrieval だけを行い、再署名しない。
- Relay state loss、session expiry、generation change または source context loss の後に、old request、old ciphertext、old authorization または old approval を新しい context へ移さない。

### 14.3 Network loss / Relay unavailable

- network loss や Relay unavailable は、request validation、inspection、四条件または approval を省略する根拠にならない。
- request を取得できない場合、Mobile App は署名 UI・署名・success result を生成しない。
- 署名前の Relay / network failure は、既存の transport failure / timeout / error mapping として扱い、`RESULT_UNKNOWN` を推測しない。
- 署名後に known result があり、response upload / delivery の状況が Signer-side contract で確定できない場合、既存 result recovery と `deliveryDisposition` の規則だけを適用する。新しい signing を開始しない。
- Relay が再接続できても、old session が expired、cancelled、consumed、state-lost または generation-invalid なら resume せず、fresh handoff を要求する。

### 14.4 Cancellation、timeout、duplicate および replay

- request / message / transaction / parent / session の期限は別々に検証し、いずれかが適用範囲で切れた場合は署名開始前に `EXPIRED` とする。現行 Relay handoff の request / session expiry は Handoff の 5 分契約に従い、Mobile App は延長しない。
- signing 前の user / dApp / platform cancellation は `CANCELLED` または既存 concrete error mapping とし、wallet-core を呼ばない。
- `SIGNING` 中の cancellation、timeout または process interruption で signing generation の成否を確定できない場合は `RESULT_UNKNOWN`。署名が生成されていないことを trusted Signer が確定できる場合だけ cancellation / failure とする。
- `SUCCEEDED` 後の response cancellation は既存 signed result を取り消さない。再署名を開始しない。
- 同じ `requestId` の同一内容が active request として重複した場合、第二の UI、Authentication、authorization または wallet-core signing を開始しない。既存処理または既存 result recovery に関連付けるか、既存 transport contract の安全な duplicate 処理へ委譲する。
- 同じ `requestId` で内容、Scope、source、target または operation が異なる場合は conflict / tampering として拒否する。
- 使用済み、terminal、expired、cancelled、revoked、old generation、stale または late request は再利用しない。
- duplicate / replay の判定不能時は fail-closed とし、追加署名を発生させない。

### 14.5 Local state と remote state の不一致

| 状況                                                                | Mobile App の動作                                                                                                                |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Relay は `response_available` だが Mobile が署名状態を持たない      | Relay state から `SUCCEEDED`、承認済みまたは `DELIVERED` を推測しない。request / response を再検証できなければ安全側に終了する。 |
| Mobile は known signed result を持つが Relay が応答を見つけられない | result を再署名せず、許可された retrieval / resend / redelivery / lookup だけを行う。                                            |
| Relay が `consumed` / purge 済みだが Mobile に known result がある  | `DELIVERED` を推測しない。既存 recovery contract に従い、result を破棄して別 target を署名しない。                               |
| Relay が generation / state continuity を失った                     | old session / request / approval を復元せず、fresh generation / session / request / envelope / approval を要求する。             |
| Mobile process が state を失ったが Relay に request が残る          | `LOCKED` から再開し、request を新たに検証・inspection・表示し、fresh four-condition gate を成立させる。自動署名しない。          |

## 15. Secret Handling と Wallet Core Boundary

### 15.1 秘密情報の分類

| 情報                                                        | 保持・処理主体                                          | Mobile App の契約                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mnemonic、private key、derived key、Wallet Store の秘密部分 | `wallet-core` と trusted host の限定された Binding 境界 | 外部 App、Web page、SDK、Relay、URL、notification、log、diagnostics、analytics、response または persistent plain storage へ渡さない。                |
| Profile password                                            | 利用者の trusted auth surface と wallet-core の既存契約 | signing / unlock に必要な期間だけ扱い、通常の UI state、Relay、SDK、log または response に保存しない。                                               |
| Encrypted Wallet Store                                      | wallet-core 定義の opaque data                          | Mobile Application は保存・置換・version 整合性を管理するが、内部 format、KDF、AEAD、key index を解釈・再実装しない。                                |
| OS-protected credential / wrapping key                      | OS / platform integration                               | capability、端末変更、backup、失敗状態を Mobile の責任として表示・処理し、wallet-core の責任と混同しない。                                           |
| `sessionSecret` / `appToken`                                | Handoff / Relay の一時 handoff credential               | 署名秘密情報ではないが、Handoff の fragment / endpoint 境界だけで最小期間扱う。署名 gate、Account authorization または Wallet Store の代替にしない。 |

### 15.2 Wallet-core binding

Mobile App は、四条件と Profile / Account binding を再検証した approved raw target だけを wallet-core の既存 Binding へ渡す。wallet-core は key lifecycle、Wallet Store、秘密情報を使用する cryptographic processing、public identity および raw signing を担う。Mobile App は caller、permission、UI、semantic inspection、approval、OS user presence または release gate を wallet-core へ委譲しない。

Native / WASM、host buffer ownership、zeroization、Store replacement、migration、OS wrapping および platform integration の exact contract は wallet-core / platform 下位仕様へ委譲する。どの実装方式でも、Mobile App は wallet-core 外で KDF、AEAD、key derivation、Wallet Store encryption、password bypass または raw signing を追加しない。

秘密 byte は必要な cryptographic operation の最短期間だけ privileged host / Binding 境界に置く。Binding 呼び出し後、lock、background policy、device lock、process termination、error または context loss で一時秘密と認証 context を無効化する。memory copy、native / WASM buffer、screen preview、clipboard、notification、crash report および analytics への不要な複製を避ける。

### 15.3 Backup / migration

Profile 全体 backup / restore、端末移行、OS-protected key の移行および recovery は v1 の共通必須能力ではない。提供する場合は、復元対象、復元後の signing capability、OS 保護状態、端末 bound key が復元されないことおよび失敗時の結果を利用者へ明示し、Profile / Account Specification と wallet-core 契約に従う。端末 bound wrapping key だけから秘密情報を復旧できると表示してはならない。

## 16. Diagnostics、Logging および Privacy

Diagnostics は既定で無効とする。有効にする場合も、既存 Handoff の allowlist に適合する非秘密 event だけを扱う。

許可される event 情報は次の範囲に限る。

- phase: `transport_selected`、`approval_requested`、`response_received`、`completed` または `failed`。
- transport: `extension` または `mobile-relay`（SDK / handoff diagnostics と共通の値）。
- event timestamp。
- 既存の安定した public `errorCode`（該当時）。

次を log、例外、warning、diagnostics、analytics、telemetry、crash report、support output、Relay metadata または response に含めてはならない。

- Mnemonic、private key、derived key、Profile password、decrypted Wallet Store、session secret、transport credential、authorization secret。
- full request / response、plaintext、ciphertext 全文、payload、signed payload、raw transaction、message contents、hash、public key、address、requestId、sessionId、generationId、URL、Origin、stack trace、parser dump または internal reference。

外部由来の文字列や画像を表示する場合も、executable content として扱わず、log / error へそのまま複製しない。Support / security report に秘密情報、handoff URL、token、session secret または full transaction payload を含めない。

## 17. Mainnet / Testnet Capability と Release Gate

### 17.1 Gate authority

Mainnet signing capability の authority は、trusted Signer と current release / evidence policy を管理する release authority にある。Mobile App、SDK、Relay、OS availability、wallet-core capability または App Store / Google Play の配布成功は、gate evaluator でも gate の代替でもない。

Mobile App は gate status を検証可能な input として消費し、次のいずれかの場合は Mainnet signing capability を有効化せず fail-closed とする。

- required evidence の欠落、期限切れ、invalid、mismatch または signature verification failure。
- trusted key / trust source の不備。
- current policy を安全に判定できない、または gate status が unknown。
- platform capability、support policy、Origin proof、Profile / Account context または四条件の必要な状態を確認できない。

Gate failure / unknown は Mainnet だけを disabled / unavailable にする。安全に許可された Testnet-only operation、Profile / Account 管理、署名要求の安全な拒否および既存 Testnet handoff を、Mainnet gate failure を理由に不必要に停止しない。

### 17.2 現行 Mobile v1 の platform capability

現行 Handoff の Mobile Signer contract では、Symbol / NEM の raw signing を iOS Secure Enclave / Android StrongBox の P-256 署名 capability へ自動変換しない。Mobile v1 の direct hardware signing は非対応であり、hardware-backed capability の存在だけで direct hardware signer と表示してはならない。

Handoff が Mainnet capability の条件として定める current Mobile v1 の要件は、少なくとも次の全てである。

1. OS-backed Vault wrapping が利用できる。
2. device lock と signature ごとの user presence が有効である。
3. iOS の Secure Enclave 実操作、または Android の hardware attestation を検証できる。
4. root / jailbreak の重大な signal がない。
5. support 対象 OS と security update 範囲に含まれる。
6. 要求される backup export と別環境 restore verification が完了している。
7. Mainnet handoff の有効な Origin proof がある。
8. Mainnet release evidence gate が合格している。

一つでも runtime で失われた場合、既存 Profile を削除せず signing capability を lock し、Mainnet signing を拒否する。Testnet-only の安全な operation は、同じ失敗だけを理由に停止しない。非対応端末・attestation 不明・software-only storage・support policy 外の端末では、実際に確認できた保証範囲だけを表示する。

現在の公開 Mobile build は `docs/mobile/mobile-store-release.md` に従い Testnet-only であり、Mainnet をサポートしない。この状態を `isAvailable()`、Relay connection、wallet-core signing success または App の起動成功から変更してはならない。

### 17.3 Release evidence の扱い

初期 Mainnet release は [ADR 0001](../adr/0001-mainnet-evidence-lite.md) と [Mainnet release evidence](../release/mainnet-release-evidence.md) の current policy に従う。evidence manifest、trusted key、platform capability report、artifact / source / lockfile / SBOM digest、SDK integrity、compatibility metadata および required test evidence の exact format と評価手順は release authority の契約を使用する。

Mobile App は Mainnet gate を独自に緩和・昇格せず、gate failure を `RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure、別 Signer または自動 re-sign へ変換しない。現在の checked-in policy / release material が Mainnet capability を許さない場合、公開 Mobile build は Testnet-only とする。

## 18. Security Invariants

以下は Mobile App に適用される MUST であり、下位仕様・実装・運用は弱めてはならない。

1. 外部 App、Web page、SDK、Deep Link、Universal Link、App Link、Intent、share、Relay、network、notification および OS metadata は、validation 前はすべて untrusted とする。
2. App 起動、request 受信、Relay delivery、OS authentication、device unlock、permission、connection、通常の `UNLOCKED` または wallet-core success だけで署名しない。
3. 同じ request / target / Profile-local context に対する Authentication、Signing-capable unlock、Account authorization および Explicit user approval の四条件が独立にすべて成立し、署名前に再検証できる場合だけ wallet-core を呼び出す。
4. request identity、source、session / generation、permission、Profile、Account、Chain / Network、operation、target、inspection、freshness、response recipient および四条件を binding し、別 request / Profile / Account / Scope へ流用しない。
5. selected Account、connection permission、session、capability、Origin proof、OS credential または Relay state を Account authorization、approval または signing authority の代替にしない。
6. trusted UI が target 全体と適用可能な security-relevant field を確認可能にできない transaction / message / parent / aggregate / multisig に署名しない。
7. 外部 summary、hash-only parent、Node / Relay lookup、notification または外部表示を inspection の代替にしない。
8. `signData` / `MESSAGE_SIGN` を transaction signing、arbitrary raw bytes または表示不能な format へ fallback しない。
9. Symbol / NEM、Mainnet / Testnet、Account、address、public key、signing bytes および chain-specific semantics を暗黙変換しない。
10. expired、consumed、cancelled、replayed、duplicate、late、stale、revoked、old generation または context-lost request / approval / auth を再利用しない。
11. background、suspended、device lock、process restart、OS kill、Relay state loss または Profile / Account change 後に、古い approval、Authentication、unlock、Account authorization または signing operation を自動復元しない。
12. `RESULT_UNKNOWN` は signing generation 自体の成否不明に限り、delivery / network / Relay failure から生成しない。
13. `DELIVERY_UNKNOWN` は known signed result の trusted Signer-side delivery disposition 不明に限り、Relay / SDK / ACK / timeout から生成・推測しない。
14. `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は Relay の `pending`、`response_available`、`consumed` または HTTP status と混同しない。
15. known signed result の resend / redelivery / retrieval / lookup を re-sign、新規 signing または alternate route と混同しない。
16. user rejection、security failure、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、Relay failure、transport timeout または response absence の後に、自動 fallback、別 Signer、別 Provider、別 transport または自動 re-sign で承認境界を迂回しない。
17. Mnemonic、private key、derived key、Profile password、decrypted Wallet Store、E2E secret、transport credential、raw payload および不要な public identity を external channel、Relay、SDK、log、diagnostics または persistent plain storage へ漏らさない。
18. `wallet-core` 外で key derivation、Wallet Store encryption、password authorization、cryptographic signing または秘密情報処理を再実装しない。
19. Relay は opaque / untrusted transport のままとし、authentication、approval、Account authorization、inspection、signing、result / disposition、Mainnet gate または announce の authority にしない。
20. Mainnet signing は current release / evidence gate と platform 条件が成立した場合だけ有効化し、gate failure / unknown では Testnet-only を安全に継続できる範囲を残す。
21. security-critical な context、integrity、lifecycle、state continuity、result binding または secret boundary を確認できない場合は fail-closed とする。

## 19. Error、OPEN および委譲

### 19.1 Error semantics

Mobile App は新しい public error taxonomy を追加せず、Handoff §10、Interfaces §10、Signing Protocol §16 および SDK Specification の既存 mapping を使用する。

| 事象                                                                    | Mobile App の動作                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| malformed / unknown / unsupported input                                 | `FAILED` 相当の既存 `INVALID_PARAMS`、unsupported または operation-specific mapping。署名しない。              |
| wrong source / recipient / session / generation                         | permission / context mismatch として拒否または `INVALIDATED`。自動切替しない。                                 |
| wrong Profile / Account / Chain / Network / signer                      | mismatch error として拒否。Profile、Account、Scope を自動置換しない。                                          |
| parse / canonical / display failure                                     | inspection failure。warning-only、raw signing または外部 lookup fallback をしない。                            |
| user rejection                                                          | `REJECTED` と既存 `USER_REJECTED` mapping。wallet-core を呼ばない。                                            |
| authentication / signing-capable unlock / Account authorization failure | `FAILED` または `INVALIDATED` と既存 mapping。古い状態を再利用しない。                                         |
| request / message / parent expiry                                       | `EXPIRED` と既存 `REQUEST_EXPIRED` 等の mapping。延長しない。                                                  |
| cancellation 前に signing が確定していない                              | `CANCELLED` と既存 mapping。再開しない。                                                                       |
| wallet-core failure が確定                                              | `FAILED` と既存 signing / internal mapping。秘密情報を含めない。                                               |
| Relay / network / transport failure                                     | transport failure / timeout と既存 mapping。これだけで `RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を作らない。 |
| signing generation の成否不明                                           | `RESULT_UNKNOWN` response semantics。正常 error code や signed result を付けない。                             |
| known signed result の delivery status 不明                             | `SUCCEEDED` result に trusted `DELIVERY_UNKNOWN` を付す。known result を捨てず、再署名しない。                 |

`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は error code ではない。`RESULT_UNKNOWN` を `FAILED`、transport failure または user rejection に、`DELIVERY_UNKNOWN` を `RESULT_UNKNOWN`、failure または `DELIVERED` に自動変換しない。

### 19.2 Implementation choice / 下位仕様への委譲

次は本仕様を弱めない範囲で implementation choice または下位仕様へ委譲する。

- UI layout、文言、localization、accessibility、screen capture policy の具体的実装。
- OS API call、Native / WASM host integration、buffer ownership、zeroization、secure storage adapter、database / storage library。
- request queue / reject の algorithm、concurrency 上限、fairness、内部 record schema および memory management。
- platform-specific の notification、background task、process lifecycle hook、error presentation。

### 19.3 OPEN Issues

以下は、実装前に別 authority で決定が必要な事項である。未決であることは blind signing、approval 省略、old authorization の再利用、Relay authority 化または fail-open recovery を許可しない。

- **MOB-OPEN-001 / MR-OPEN-001**: iOS / Android の support OS version、端末範囲、Store / test distribution、個別 milestone の完了条件。
- **MOB-OPEN-002 / MR-OPEN-002**: 現行標準の verified HTTPS App Link 以外の Deep Link、custom scheme、QR、generic share / Intent の採否、優先順位、source proof および追加 handoff contract。
- **MOB-OPEN-003 / MR-OPEN-003 / CR-OPEN-001 / CR-OPEN-002**: Mobile host における wallet-core Binding、Native / WASM integration、OS-protected wrapping、secret byte lifecycle、error mapping および migration の exact contract。
- **MOB-OPEN-004 / MR-OPEN-004**: PIN、OS passcode、biometric、Profile password の役割、fallback、retry / rate limit、再認証頻度および lock timeout。
- **MOB-OPEN-005 / MR-OPEN-005 / OPEN-RELAY-003 / OPEN-RELAY-004**: pending request の保持・再表示、temporary reconnect / resume、known result の retention、resend / retrieval / lookup API、Relay unavailable / delivery timeout の client-facing mapping。
- **MOB-OPEN-006 / MR-OPEN-006**: Profile 全体 backup / restore、端末移行、OS key migration、端末紛失・削除・保護状態喪失時の復元可能性。Mainnet gate が要求する evidence と、一般 capability としての提供範囲を混同しないこと。
- **MOB-OPEN-007 / MR-OPEN-007**: screen capture、recording、recent-app preview、notification、clipboard および crash / diagnostics の platform privacy policy。
- **MOB-OPEN-008 / MR-OPEN-008**: Mobile release evidence の platform matrix、capability report、runtime enforcement、Store 公開と Mainnet capability の関係。Mainnet gate の存在、gate failure / unknown 時の Mainnet disabled、Testnet-only continuation および trusted release authority は確定済みである。
- **MOB-OPEN-009 / OPEN-006 / OPEN-SDK-004**: Aggregate、Partial、Symbol / NEM cosignature の公開 operation、supported scope、result contract および SDK 必須 capability。

共通 Interface の structured message expiry field、capability / version negotiation、permission expiry / revocation identifier および Mobile caller context の追加公開契約も、既存 `OPEN-001`〜`OPEN-005` と SDK / Handoff の authority に従う。本仕様は field alias、独自 version field、独自 capability identifier または独自 public error を追加しない。

## 20. Acceptance / Conformance Criteria

Mobile App の実装は、少なくとも次を満たす場合に本仕様へ適合する。

1. iOS と Android が別々の milestone として評価され、片方の capability・test・release evidence が他方または v1 全体の完了へ流用されない。
2. App Link、Relay、notification、OS metadata、SDK または外部 App からの入力が validation 前に trusted 扱いされず、malformed、unknown、duplicate、replay、late、expired、wrong recipient、wrong generation、wrong Scope および tampered input が approval / signing に到達しない。
3. Profile Network、enabled Chain、selected Account、payload signer、expected signer、public identity および request Scope の対応が確認でき、Profile / Account の暗黙切替や cross-chain identity reuse が起こらない。
4. Authentication、Signing-capable unlock、Account authorization および Explicit user approval の全組合せについて、一つでも欠ける場合に wallet-core が呼び出されず、成功 result が返らない。四条件は同一 request / target / Profile-local context に binding される。
5. transaction 全体、structured message、Aggregate / parent / embedded / inner transaction および適用可能な multisig / cosignature context が chain-specific に検証・表示できない場合に、warning-only、hash-only、Node lookup、raw signing または別 operation fallback が起こらない。
6. `signData` が transaction signing と区別され、message content、purpose、nonce、issued / expiry、source / domain context と実際の signing input が同一の検証済み model から導出される。
7. user rejection、authentication / unlock / Account authorization failure、inspection failure、expiry、cancellation、Relay unavailable、network loss、process termination および state loss が安全側の既存 error / terminal semantics として扱われ、automatic approval / unlock / re-sign が起こらない。
8. `RESULT_UNKNOWN` が signing generation 自体の成否不明に限定され、transport failure、ACK failure、response absence、Relay state または timeout から生成されない。
9. known signed result がある場合、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` が Signer-side authority に従って保持され、Relay の `pending`、`response_available`、`consumed`、HTTP 2xx、ACK または purge から推測・書換えされない。
10. `SUCCEEDED + DELIVERY_UNKNOWN` または `SUCCEEDED + PENDING` の recovery が既存 result の resend / redelivery / retrieval / lookup に限られ、new signing、re-sign、alternate Signer / Provider / transport fallback にならない。
11. Relay が plaintext、transaction / message meaning、secret、approval、four-condition status、signed result、`RESULT_UNKNOWN` または `deliveryDisposition` を取得・生成・変更できない。Mobile は Relay structural validation と semantic / approval validation を区別する。
12. background / suspend / resume、device lock、process termination、OS kill、Relay generation change、local / remote state mismatch の各経路で旧 approval、Authentication、unlock、Account authorization、target または secret が自動再利用されない。resume は fresh validation、再表示、fresh approval および必要な再認証を行う。
13. Mnemonic、private key、derived key、Profile password、decrypted Wallet Store、session secret、transport credential、payload、signed payload、public identity、ID、URL、Origin および stack trace が指定された diagnostics / log / error 境界へ漏れない。diagnostics allowlist 以外の event が出力されない。
14. wallet-core の既存 Binding、Wallet Store、key lifecycle、raw signing および Chain-specific cryptography を Mobile Application が再実装せず、approved target のみを渡す。Binding / OS capability を hardware direct signing と誤表示しない。
15. Mainnet gate の required evidence、trusted key、policy、platform capability、Origin proof または gate status が missing / invalid / expired / unknown の場合に Mainnet signing が無効であり、Testnet-only operation は安全な範囲で継続できる。現行公開 Mobile build は Testnet-only である。
16. Mobile Relay response の mapping が Handoff の existing response union、requestDigest、requestId、operation、signer、Account、Scope、target および expiry へ対応し、dApp が結果を独立検証できる。Mobile App が announce または node selection を行わない。

## 21. Traceability

| 本仕様の領域                                            | Requirements                                                                               | Design                                                                       | Existing Specification / authority                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Scope、責務および Mobile milestone                      | `CR-001`、`CR-006`、`CR-007`、`CR-011`、`MR-001`、`MR-012`                                 | Architecture §5.2、§6.4；Mobile Design §2〜§5、§25                           | Interfaces §16；Signing Protocol §18；Handoff §2、§7                                                     |
| Trust boundary と Relay non-authority                   | `CR-008`、`CR-010`、`CR-011`、`CR-015`；`RR-003`、`RR-009`                                 | Security Design §3〜§5；Architecture §8〜§9；Mobile Design §6、§8、§25       | Relay Specification §4、§9、§20；Handoff §7、§13                                                         |
| Profile / Account / Network binding                     | `CR-005`、`CR-009`、`CR-013`、`MR-004`、`MR-007`                                           | Architecture §6.6〜§6.8；Mobile Design §9、§18〜§19                          | Interfaces §5、§8、§9；Profile / Account Specification §2〜§12、§26                                      |
| Authentication、unlock、Account authorization、approval | `CR-003`、`CR-004`、`CR-016`、`CR-AC-017`；`MR-005`、`MR-006`                              | Security Design §7〜§8；Signing Flow §4、§16；Mobile Design §4.1、§10、§12.3 | Signing Protocol §7〜§9；Profile / Account Specification §20；Interfaces §9.7                            |
| Transaction / message inspection                        | `CR-002`、`CR-004`、`CR-007-TX`、`CR-007-MSG`、`CR-NFR-005`、`MR-004`                      | Signing Flow §9〜§15；Mobile Design §5.6、§12.2                              | Signing Protocol §9〜§15；Interfaces §9.2〜§9.5；Chain Compatibility Specification                       |
| Handoff / link / Origin proof                           | `CR-001`、`CR-NFR-008`、`CR-NFR-009`；`MR-002`、`MR-003`                                   | Mobile Design §7；Interfaces Design §7.3                                     | Handoff §7.1〜§7.5、§8〜§11；Interfaces §5、§7                                                           |
| Result / delivery semantics                             | `CR-006`、`CR-010`、`CR-012`、`CR-NFR-012`；`RR-002`、`RR-NFR-002`                         | Signing Flow §7.3〜§7.4、§19；Mobile Design §8.3、§14、§22                   | Interfaces §6.3、§9.6、§10.3、§13；Signing Protocol §16、§19；Handoff §7.2、§9.6                         |
| Lifecycle、duplicate、replay、concurrency、state loss   | `CR-NFR-003`、`CR-NFR-009`〜`CR-NFR-011`；`MR-005`、`MR-006`；`RR-004`、`RR-006`、`RR-007` | Mobile Design §14〜§17、§21〜§22；Security Design §10、§15                   | Signing Protocol §6〜§8、§19〜§20；Relay Specification §6〜§7、§11〜§16、§20                             |
| Secret handling / wallet-core                           | `CR-008`、`CR-013`、`CR-NFR-002`、`CR-NFR-004`；`MR-003`、`MR-007`〜`MR-010`；`RR-008`     | Architecture §6.8〜§6.9；Security Design §6；Mobile Design §11、§18〜§19     | Profile / Account Specification §10、§13、§20；Interfaces §5.3、§16；wallet-core external contract       |
| Mainnet gate / Testnet-only                             | `CR-NFR-006`、`CR-AC-008`、`MR-013`、`MR-AC-009`                                           | Architecture §3、§6.9、§16；Mobile Design §3.3、§23〜§24                     | Interfaces §7.4；Handoff §7.5、§13〜§14；ADR 0001；Mainnet release evidence；current mobile release docs |

### 21.1 Traceability の読み方

本書が追加したのは、既存要求・設計・共通契約を Mobile の reception、trusted UI、OS lifecycle、Relay client、Profile binding および platform gate に適用する外部動作である。共通 schema、暗号 parameter、公開 API、error code、Chain-specific byte 列、Relay endpoint の詳細を本書の独自契約として再定義していない。

## 22. References

- [Mobile App 要件](../requirements/mobile-app.md)
- [共通要件](../requirements/requirements.md)
- [Relay 要件](../requirements/relay.md)
- [SDK 要件](../requirements/sdk.md)
- [Mobile App 基本設計](../design/mobile-app.md)
- [共通アーキテクチャ設計](../design/architecture.md)
- [共通セキュリティ設計](../design/security-design.md)
- [署名フロー基本設計](../design/signing-flow.md)
- [共通 Interfaces Specification](./interfaces.md)
- [Signing Protocol Specification](./signing-protocol.md)
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)
- [Profile / Account Specification](./profile-account-spec.md)
- [Chain Compatibility Specification](./chain-compatibility-spec.md)
- [Relay Specification](./relay.md)
- [SDK Specification](./sdk.md)
- [MosaicLynx Browser Extension Specification](./browser-extension.md)（共通契約の整合確認のみ。Browser-specific な実装・caller context は Mobile へ流用しない）
- [ADR 0001: Lite evidence policy](../adr/0001-mainnet-evidence-lite.md)
- [Mainnet release evidence](../release/mainnet-release-evidence.md)
- [Mobile support](../mobile/mobile-support.md)
- [Mobile store release](../mobile/mobile-store-release.md)
- [Mobile privacy](../mobile/mobile-privacy.md)
