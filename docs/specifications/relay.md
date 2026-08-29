# MosaicLynx Relay Specification

## 1. 目的

本書は、MosaicLynx Relay の server-side transport contract を実装可能な粒度で定義する。

Relay は SDK / Browser Extension 側と Mobile App 側の間で、既存 Handoff contract の request / response を短期間中継する opaque / untrusted transport である。Relay は transaction、message、Account、approval または署名結果の意味を扱わない。

本書の規範語は次の意味を持つ。

- **MUST**: 対象範囲で必須である。
- **MUST NOT**: 対象範囲で禁止する。
- **SHOULD**: 原則として満たす。満たせない場合は理由と影響を記録する。
- **MAY**: 他の契約と Security Invariant に反しない範囲で許容する。
- **OPEN**: 本書だけでは決定できない。実装で独自に確定してはならない。

## 2. 適用範囲と上流資料

### 2.1 適用範囲

本書は次の Relay 固有契約を対象とする。

- session / participant / generation の transport lifecycle
- request / response の routing、短期 retention、retrieval、ACK および cancel
- endpoint authorization credential の server-side 検証
- opaque envelope の構造・サイズ・expiry・correlation 検証
- duplicate、replay、stale generation、late delivery、state loss および restart
- concurrency、atomic な logical transition、resource / abuse control
- transport failure、transport status および observability の非機密境界

### 2.2 上流資料と authority

次の資料を本書の上流契約として扱う。

- [Relay Requirements](../requirements/relay.md)
- [Relay Design](../design/relay.md)
- [Interface / Data Model Specification](./interfaces.md)
- [Signing Protocol Specification](./signing-protocol.md)
- [SDK Specification](./sdk.md)
- [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md)
- [共通 Security Design](../design/security-design.md)
- [Signing Flow Design](../design/signing-flow.md)
- [Interfaces Design](../design/interfaces.md)

authority は次のように分担する。

| 対象                                                                                               | authority                                                                                |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 共通 identifier、Scope、Origin、request / response semantics、serialization、common error          | [interfaces.md](./interfaces.md)                                                         |
| signing target、approval、Signer lifecycle、`RESULT_UNKNOWN`、`deliveryDisposition`                | [signing-protocol.md](./signing-protocol.md)                                             |
| SDK 公開 API、route availability、transport selection、SDK から見える concrete error               | [sdk.md](./sdk.md)、[web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md) |
| Web / Mobile handoff の endpoint、field、credential、暗号 envelope、generation、TTL、HTTP status   | [web-transaction-handoff-spec.md](./web-transaction-handoff-spec.md)                     |
| Relay の transport responsibility、server-side admission、routing、bounded state、resource control | 本書                                                                                     |

本書は上記 authority の field、identifier、error、signing state、SDK semantics、Handoff wire contract または暗号形式を再定義しない。特に `deliveryDisposition` とその `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` の semantics、および `RESULT_UNKNOWN` は Signer-originated contract であり、Relay の transport status ではない。Handoff と本書に競合がある場合は、本書で都合よく解消せず OPEN として報告する。

### 2.3 対象外

次は本書で定義しない。

- SDK Public API、Provider discovery、transport selection および Mobile Relay availability
- Browser Extension の Provider / Chrome API、Mobile App の UI / OS API
- transaction / message の parse、semantic validation、summary、Account ownership、permission、approval、authentication または signing
- wallet-core、private key、Mnemonic、Wallet Store および暗号 primitive
- Relay 独自の暗号、key exchange、AAD、digest、nonce または envelope
- storage engine の schema、queue、lock、CAS、broker、cluster topology、deployment、load balancer および systemd
- 新しい WebSocket、push notification、long-term storage、federated Relay または multi-Relay fallback

## 3. 用語

| 用語                 | 本書での意味                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Relay session        | Web-side participant と Mobile-side participant が request / response を交換する短期 transport context                 |
| participant          | session に参加する Web-side または Mobile-side の transport participant。本人性や Account ownership を表さない         |
| generation           | Relay の state continuity を表す非秘密の opaque context。authorization secret ではない                                 |
| request              | Web-side から Mobile-side へ配送する既存 Handoff の encrypted request envelope                                         |
| response             | Mobile-side から Web-side へ配送する既存 Handoff の encrypted response envelope                                        |
| transport credential | `appToken` または `webToken`。対象 endpoint を認証するための credential                                                |
| session secret       | SDK と Mobile App が E2E request / response key を導出する secret。Relay は受信・復号・保持しない                      |
| opaque payload       | Relay が plaintext として解釈しない encrypted envelope                                                                 |
| request expiry       | Handoff request が有効である期限。Relay session lifetime と同一視しない                                                |
| transport status     | Relay が request / response の受理、保持、取得、ACK、cancel、expiry または purge を観測した状態。署名 outcome ではない |
| state loss           | Relay が active session state の継続性を保証できなくなった状態                                                         |

## 4. Relay の責任境界

### 4.1 Relay が担う責任

Relay は次を MUST とする。

- Handoff contract に従った session 作成、participant admission および direction の分離。
- request / response の session、participant、direction、request identity、generation および expiry に基づく routing。
- encrypted envelope と routing metadata の bounded temporary retention。
- endpoint authorization credential の形式・対象 session・endpoint scope の検証。
- protocol、version、envelope 外形、サイズ、expiry、generation、lifecycle および correlation の structural validation。
- duplicate / conflicting response、stale session、expired object、cancelled / consumed state の安全側処理。
- ACK、cancel、expiry、state loss および purge による terminal state 管理。
- concurrent submit / retrieve / response / ACK / cancel / expiry が cross-session や terminal-state reuse を起こさない logical transition。
- Handoff に定められた resource / abuse control と、payload / credential を含まない最小限の observability。

### 4.2 Relay が担わない責任

Relay は次を MUST NOT とする。

- transaction / message の復号、parse、意味解釈、summary 生成または表示。
- signing target、signer、recipient、amount、fee、Account ownership、permission、risk または安全性の判定。
- user approval、authentication、signing authorization、署名結果の生成、検証または変更。
- private key、Mnemonic、Profile password、Wallet Store、session secret、derived encryption material または signing secret の受信、復号、導出、保持、hash 化または出力。
- Relay の transport status、ACK または availability を Signer の validation、approval、authentication、signing success または transaction safety として表明すること。
- Relay の failure から `USER_REJECTED`、`FAILED`、未署名または署名済みを推測すること。

Relay の transport status は、Mobile App / Browser Extension / SDK が行う client-side validation と signing lifecycle を置き換えない。

Authentication、Signing-capable unlock、Account authorization および Explicit user approval は、同一の request / target / Profile-local context に対する trusted Signer の独立した必須 signing conditions である。Relay はこれらを evaluate、establish、semantic verify、cache、restore、infer または substitute してはならず、Relay の session existence、participant admission、token、generation、request / response existence、transport status、HTTP success、ACK、consumed state または availability は4条件の代替にならない。

Mainnet signing capability は、trusted Signer と current release / evidence gate の成立によってのみ有効化される。Relay はその gate の evaluator、verifier、promoter または bypass mechanism ではなく、Relay health、availability、session creation、response retrieval、ACK、consumed state または transport success から Mainnet capability を有効化・推測・昇格してはならない。gate が missing、invalid、expired、inconsistent、unverifiable または unknown の場合の Mainnet disabled / unavailable の判定は trusted Signer / release authority に属する。これは Testnet-only operation の安全な継続を妨げない。

## 5. Endpoint Contract

### 5.1 共通 endpoint 条件

Handoff の HTTP endpoint が有効な deployment では、次を使用する。

- Origin: `https://relay.mosaiclynx.app`
- API prefix: `/v1`
- TLS: TLS 1.2 以上、HSTS 有効
- Cookie、HTTP user authentication、Relay user account および transaction ID tracking: 使用しない
- response header: `Cache-Control: no-store`、`Referrer-Policy: no-referrer`、`X-Content-Type-Options: nosniff`
- Browser CORS: credential なし、必要な method / header のみ許可。cookie を許可しない
- error body: request body、token、session existence、Account、Origin または payload の詳細を返さない

endpoint、method、header、body、status および credential の正本は [Handoff §9](./web-transaction-handoff-spec.md) である。本書の endpoint 表は server-side responsibility と idempotency を説明するための参照であり、wire field を別定義しない。

### 5.2 Endpoint 一覧

| Endpoint                                        | participant          | Relay の処理                                                                                                               | 成功 / 失敗の authority |
| ----------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `GET /v1/generation`                            | SDK / handoff client | current generation の非秘密 context を返す                                                                                 | Handoff §9.1            |
| `POST /v1/handoffs`                             | Web-side             | generation、ID、expiry、hash、request envelope の構造と admission を検証して session を作成する                            | Handoff §9.2            |
| `GET /v1/handoffs/{sessionId}/request`          | Mobile-side          | `appToken` と request direction を検証し、未完了 request を返す                                                            | Handoff §9.3            |
| `PUT /v1/handoffs/{sessionId}/response`         | Mobile-side          | `appToken`、response direction、correlation、state を検証し、最初の response を保存する                                    | Handoff §9.4            |
| `GET /v1/handoffs/{sessionId}/response?wait=25` | Web-side             | `webToken` と response direction を検証し、response を polling / retrieval する                                            | Handoff §9.5            |
| `POST /v1/handoffs/{sessionId}/ack`             | Web-side             | Handoff §9.6 の外形検証後は常に `204 No Content` を返し、条件を満たす場合だけ response を consumed として purge する       | Handoff §9.6            |
| `DELETE /v1/handoffs/{sessionId}`               | Web-side             | Handoff §9.6 の外形検証後は常に `204 No Content` を返し、条件を満たす場合だけ未完了 session を cancelled として purge する | Handoff §9.6            |

Relay は `sessionId` 単独を authorization として使用しない。各 endpoint は direction、participant role、対象 credential、session state、generation および該当 identity を併せて検証する。

## 6. Generation

### 6.1 意味と取得

`generationId` は current Relay generation を示す非秘密の opaque string である。exact format、長さおよび生成方式は Handoff が OPEN としているため、本書で固定しない。

Relay は `GET /v1/generation` で次の既存契約を返す。

```ts
interface RelayGenerationContext {
  protocol: 'mosaiclynx.relay.v1';
  generationId: string;
}
```

SDK / handoff client は handoff 作成直前に current value を取得し、その handoff の作成 metadata と envelope context に使用する。別の handoff や retry では、当該時点の current value を改めて取得する。Relay は generationId を session、request identity、request / response envelope および current state に binding する。

`generationId` は credential、session secret、E2E key、permission または signing authorization ではない。generationId を知っているだけで endpoint access、session join、message retrieval または response submission が成立してはならない。

### 6.2 Generation change

Relay は次の場合に generation を切り替える。

- Relay restart により active state の継続性を保証できなくなった場合。
- storage loss、state loss、persistence corruption または instance / cluster state の continuity loss が発生した場合。
- 運用上の generation rotation / invalidation を行う場合。

generation change 後は、旧 generation の session、request identity、response identity および pending state を current generation の active state として復旧・再開しない。旧 generation の create request は session を作成せず拒否する。

Relay は過去の全 ciphertext の利用履歴を保持して replay 判定する責任を持たない。旧 ciphertext に current generation metadata が付された request が envelope 外形を満たす場合、Relay storage に一時保存される可能性はある。ただし、それを current generation の有効な handoff として成立させてはならず、Mobile App の generation-bound AEAD / AAD validation により承認・署名・success に到達してはならない。

### 6.3 Generation と stale handling

- current generation と一致しない create metadata は structural rejection とする。
- current generation と session state、request / response identity、envelope metadata の整合を確認できない場合は delivery / transition を進めない。
- stale generation、old session、old credential、late object または state loss 前の response を新しい session へ付け替えない。
- retry は current generation、新しい sessionId / requestId、fresh envelope、fresh transport authorization context および client-side の新しい validation / approval を使用する。
- generation mismatch を signing rejection、user rejection または signing failure に変換しない。

## 7. Session Lifecycle

### 7.1 Session の構造

一つの handoff session は Web-side participant と Mobile-side participant の request / response channel を束ねる。session は少なくとも次の routing context を保持する。

- `sessionId`
- current `generationId`
- protocol context
- Web-side / Mobile-side participant role
- request / response direction
- `requestId` と request / response correlation context
- session `expiresAt`
- token verification representation
- pending / response / terminal transport state

`sessionId`、`requestId`、generationId、token hash または routing metadata から Profile、Account owner、Origin の信頼性、approval、authentication または signing authorization を導出しない。

### 7.2 State machine

Handoff が定義する session state を正本とする。

```text
pending → response_available → consumed
   ├────────────────────────→ cancelled
   └────────────────────────→ expired
response_available ─────────→ expired
```

| State                | Relay の意味                                                             | 許可される操作                                                                |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `pending`            | request が保持され、response を待っている                                | request retrieval、response upload、response polling、ACK / cancel の構造検証 |
| `response_available` | response upload が一度受理され、Web-side が取得できる                    | response retrieval、同一 response の再取得、ACK                               |
| `consumed`           | Web-side が検証済み response を ACK し、terminal purge が開始 / 完了した | 新しい handoff としての操作は不可                                             |
| `cancelled`          | 未完了 session が Web-side cancel または同等の terminal 処理で終了した   | 新しい handoff としての操作は不可                                             |
| `expired`            | session / request lifetime が到達した                                    | 新しい handoff としての操作は不可                                             |

`consumed`、`cancelled`、`expired` は terminal state である。terminal state から `pending` または `response_available` へ戻さず、terminal session を新しい request / response の container として再利用しない。

Relay の state は [signing-protocol.md](./signing-protocol.md) の `RECEIVED`、`VALIDATED`、`AWAITING_USER`、`AUTHORIZED`、`SIGNING`、`SUCCEEDED` または `RESULT_UNKNOWN` ではない。

ここでいう小文字の `pending`、`response_available`、`consumed` 等は Relay の transport lifecycle state であり、Signer-originated な大文字の `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` または `RESULT_UNKNOWN` ではない。

### 7.3 作成と admission

`POST /v1/handoffs` は、次を全て確認した場合だけ session を作成する。

- `protocol`、`generationId`、`sessionId`、`requestId`、`expiresAt`、token hash および encrypted request の required field / type が正しい。
- generationId が current generation と一致する。
- sessionId / requestId の形式と一意性が既存 contract に従う。
- `expiresAt` が Handoff の format / lifetime に従い、Relay が client 指定 expiry を延長しない。
- encrypted envelope の外形、algorithm field および size が Handoff contract に従う。request direction と session binding は create endpoint と server-side session state に関連付け、暗号化された AAD の値自体は Relay が検証しない。
- request / session の lifecycle、外側で表現された correlation、admission および resource limit が正しい。

Relay は encrypted request を復号せず、transaction / message の semantic validity を確認しない。成功 response は Handoff の `{ protocol, sessionId, expiresAt }` のみとし、token、secret、request plaintext または payload を返さない。

### 7.4 Participant 再接続

一時的な network disconnect では、participant は current session、role、credential、generation、expiry および message state を再検証して同じ session に再接続できる場合がある。再接続は旧 approval、authentication、signing state または result の復元を意味しない。

session が expired、cancelled、consumed、generation 不一致または state loss の場合、resume ではなく fresh handoff とする。具体的な reconnect API、pairing contract、client retry timing は OPEN とする。

## 8. Credential / Endpoint Authorization

### 8.1 Credential の分類

| 値                        | 用途                                                                        | Relay の扱い                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `appToken`                | Mobile-side の request retrieval / response upload endpoint authorization   | raw 値は request / response の endpoint header として一時検証する。保存するのは Handoff が定める検証用 representation のみ |
| `webToken`                | Web-side の response retrieval / ACK / cancel endpoint authorization        | raw 値は endpoint header として一時検証する。保存するのは Handoff が定める検証用 representation のみ                       |
| `sessionSecret`           | SDK / Mobile App が request / response encryption key を導出する E2E secret | Relay は受信、復号、保存、hash 化、ログ出力または暗号鍵導出をしない                                                        |
| `requestId` / `sessionId` | request / session identity と routing                                       | identifier 単独を credential として扱わない                                                                                |
| `generationId`            | state continuity context                                                    | secret、credential または signing authority として扱わない                                                                 |

`appToken` と `webToken` は session secret、request key、response key、derived encryption material または signing credential ではない。App Link fragment における credential の受け渡しは [Handoff §7.3](./web-transaction-handoff-spec.md) の verified client-side handoff に従い、Relay が fragment を受信しない。

### 8.2 Authorization rules

- credential が要求される endpoint は `Authorization: Bearer {token}` を使用する。
- token は Handoff の CSPRNG と検証用 representation の契約に従う。Relay は raw token を長期保存しない。
- appToken は App-side endpoint に、webToken は Web-side endpoint に限定する。相互利用、session 間利用、role の越境を許可しない。
- credential の有効性は対象 session、endpoint、participant role、generation、expiry および lifecycle state と併せて、状態変更の条件として確認する。
- expired、cancelled、consumed、state-lost または generation-invalid session の credential は状態変更に使用しない。
- credential mismatch、session 不在、terminal state または期限切れを区別して session existence を漏えいさせない。Handoff の共通 `404 Not Found` / error body を使用する endpoint ではその contract に従う。
- ただし ACK / cancel は Handoff §9.6 の endpoint-specific HTTP semantics が優先される。method、path、header、body、protocol およびその他の structural validation を満たす ACK / cancel request には、webToken の不一致、session 不在、terminal / purge 済み、期限切れまたは state loss にかかわらず常に `204 No Content` を返し、状態変更の条件を満たさない場合は no-op とする。外形が不正な request はこの例外に含めず、Handoff の structural error contract に従う。
- credential の検証失敗を user rejection、permission denied、signing failure または approval として返さない。

### 8.3 Non-exposure

raw token、sessionSecret、derived key、Authorization header、App Link fragment、encrypted payload 全文および復号 plaintext は、API response、URL path / query、Referer、log、diagnostics、analytics、telemetry、error、APM / WAF capture、backup または admin view に出してはならない。

## 9. Opaque Envelope / Structural Validation

### 9.1 Opaque boundary

Relay が扱う payload は、既存 Handoff の `EncryptedRelayEnvelope` として opaque に保持する。Relay は次をしてはならない。

- request / response を復号する。
- transaction type、message purpose、recipient、amount、fee、signer、Account または Chain / Network の意味を解釈する。
- approval summary、risk score、display model、Account selection または signing result を生成する。
- payload bytes、ciphertext、nonce、tag、AAD、digest または field order を変更する。
- plaintext を routing key、resource policy、approval policy または error mapping の入力にする。

Relay は transport routing に必要な非秘密 metadata と、Handoff が外側で検証可能と定める構造だけを扱う。Handoff の E2E encryption、JCS、AAD、digest、key derivation、binary encoding は変更しない。

### 9.2 Structural validation

Relay は復号せずに次を検証する。

- protocol version、message / envelope kind、required outer field、JSON type、duplicate key および malformed structure
- endpoint / path で指定された sessionId、server-side metadata の requestId、generationId、direction、expiry および利用可能な correlation
- endpoint credential、participant role、session lifecycle および current generation
- body size、envelope size、allowed algorithm / encoding identifier および resource limit
- request / response の direction と対象 endpoint の一致
- response envelope が対象 session、generation、expiry および response direction に対応すること。暗号化された response 内の `requestId`、`requestDigest` その他の correlation は Relay が復号せず、Mobile App / SDK が検証する。

structural validation を通過しても、ciphertext の AEAD 認証、payload integrity、transaction / message semantic validation、Origin proof、Account、permission、approval、authentication または signing outcome が成立したことを意味しない。これらは client / Signer の責任である。

### 9.3 Byte preservation

Relay は受理した encrypted envelope を routing / storage / retrieval の間で byte-preserving に扱う。transport serialization が必要な場合も、Handoff が定める JSON object と field encoding を使用し、ciphertext の内容を decode・normalize・再暗号化しない。

Relay が envelope の外側構造を確認できない場合は、成功として配送・ACK・署名結果化せず、Handoff の structural failure として安全側に終了する。暗号化された内側の integrity は Relay が確認せず、Mobile App / SDK が検証する。

## 10. Request / Response Routing

### 10.1 Routing binding

request / response は次の logical tuple に binding して routing する。

```text
(generationId, sessionId, participant role, direction,
requestId, requestDigest / response correlation,
 credential scope, expiry, lifecycle state)
```

この tuple は end-to-end の binding を表す。Relay が routing に使用するのは、利用可能な outer metadata と server-side session state に表現された部分であり、暗号化された内側の `requestId`、`requestDigest` および response correlation は含まない。Relay は利用可能な各要素を照合し、欠落、malformed、不一致または検証不能な transport metadata があれば delivery / state transition を行わない。内側の correlation は Mobile App / SDK が検証する。

### 10.2 Request route

- Web-side の create request は current generation、fresh sessionId / requestId、Web-side token hash、App-side token hash および encrypted request を一つの handoff session に関連付ける。
- Mobile-side request retrieval は sessionId と appToken により対象 session を認証し、request direction と pending / response state を確認する。
- 同じ appToken による期限内の request 再取得は同一 envelope を返す冪等な retrieval とする。取得だけで request を consumed にしない。
- request が cancelled、consumed、expired または state-lost なら request を新しい handoff として返さない。`response_available` は request の別 handoff 化を意味せず、request retrieval の扱いは Handoff endpoint contract に従う。

### 10.3 Response route

- Mobile-side response upload は対象 session、appToken、response direction、generation および `pending` state を確認する。暗号化された response 内の `requestId` / `requestDigest` は Relay の検証対象ではなく、Mobile App が元 request と対応付け、SDK が受信後に検証する。
- `pending → response_available` は一つの logical atomic transition とする。
- Web-side response retrieval は webToken、response direction、expiry および session state を確認する。
- response retrieval は、ACK されるまで同一 response の再取得を許可できる。再取得は同一 response の duplicate delivery であり、signing outcome の再生成ではない。
- ACK 後の response、cancel / expiry 後の response、別 session / request の response、generation が異なる response は配信しない。

### 10.4 Lookup key

論理 lookup key は sessionId、participant role / credential scope、direction、requestId、generation および lifecycle state の組である。sessionId だけの global lookup を authorization として使用しない。

storage key の hash、prefix、table、Redis key、index または内部 object layout は本書で固定しない。ただし内部表現が異なっても cross-session、cross-recipient、cross-generation lookup が成立してはならない。

## 11. Duplicate / Replay / Late Delivery

### 11.1 Create duplicate

- 既存 sessionId の create request は `409 Conflict` とし、既存 session を更新・上書き・延長しない。
- 既存 requestId、sessionId または conflicting active state の再利用は新しい handoff として受理しない。current `generationId` は Relay の generation context であり、複数 handoff に同じ current 値が使われることを妨げない。
- 同じ body の create retry も既存 session を再開せず、新しい identity を要求する。

### 11.2 Request retrieval duplicate

期限内に正しい appToken で同じ request を繰り返し取得することは許可されるが、同じ envelope を返すだけとする。取得回数によって signing、approval または session state を変更しない。

### 11.3 Response duplicate

- 同一 session / request に対して最初に受理した response を正本とする。
- 同じ envelope の retry は `204 No Content` として冪等に扱う。
- 異なる encrypted response は `409 Conflict` とし、先行 response を上書き・差し替えしない。
- response upload の race では一つの response だけが `response_available` へ遷移させる。

### 11.4 Polling / consumed / expired

- 同じ webToken による polling の繰り返しは state を巻き戻さない。
- `response_available` の同じ response を複数回返しても、client 側の request / response identity 検証を置き換えない。
- `consumed`、`cancelled`、`expired` の object は有効な handoff として取得・更新・再配送しない。
- polling の late response、timeout 後の response、cancel race または expiry race は新しい request に適用しない。

### 11.5 Old credential / generation

old token、別 session の token、old generation metadata、stale session、old requestId または old response は、ACK / cancel 以外では拒否・非公開とし、Relay はこれらを user rejection、permission denial、approval または signing success へ変換しない。ACK / cancel は Handoff §9.6 に従い、request の外形が妥当であれば `204 No Content` を返すが、状態変更は行わない。

Relay は過去の全 ciphertext history を持たなくてもよい。old ciphertext が current metadata とともに一時保存され得る場合の client-side AEAD / AAD failure、署名前拒否および success 非到達は Handoff / Mobile App の責任分界に従う。

## 12. Retention / TTL / Expiry

### 12.1 期限の分離

次の期限を同一視しない。

| 期限                | 定義                                                                  | Relay の扱い                                                 |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| request expiry      | Handoff request が Signer へ渡せる有効期限                            | outer expiry として検証し、期限後に delivery しない          |
| session lifetime    | session / participant / routing / credential scope が有効な期間       | Handoff の session expiry に従い、client 指定値を延長しない  |
| message retention   | request / response envelope を temporary storage に保持する期間       | session / terminal state の bounded retention に限定する     |
| response retention  | `response_available` response を Web-side が ACK するまで保持する期間 | response retrieval を許可し、ACK 後に purge する             |
| credential lifetime | appToken / webToken が対象 endpoint に有効な期間                      | session、endpoint、role、generation、expiry と併せて検証する |
| SDK wait timeout    | SDK が local wait を止める期限                                        | Relay は SDK timeout から signing outcome を推測しない       |
| message expiry      | structured message 内の expiry                                        | Relay は plaintext を解釈せず、client / Signer が検証する    |

### 12.2 Handoff の固定値

Handoff §9.7 に従い、session / handoff expiry は作成から 5 分を超えず、client request による延長を許可しない。Relay は SDK 指定の expiry を変更してはならない。

Relay は 5 分の request / session expiry と、内部 cleanup の実行時刻を別に扱う。cleanup が遅れても expired object を有効な handoff として配送せず、cleanup が早くても success、未署名または user rejection を推測しない。

### 12.3 Terminal purge

`consumed`、`cancelled` または `expired` への terminal transition 時に、active storage から request / response ciphertext、token hash、session metadata を削除する。ACK は SDK が response の復号と全検証に成功した後だけ送信する。

非同期 purge のために tombstone が必要な場合は、Handoff §9.7 に従い、session ID の keyed hash、terminal state および削除期限だけを最大 24 時間保持できる。token hash、ciphertext、Origin、requestId または plaintext を tombstone に含めない。

long-term payload history、ciphertext history、backup、analytics、署名監査履歴または retry queue として Relay retention を利用してはならない。

## 13. ACK / Cancel / Transport Status

### 13.1 ACK

`POST /v1/handoffs/{sessionId}/ack` は、Handoff §9.6 が endpoint request として valid と扱う外形を検証した後、HTTP response と state mutation を分離して処理する。

- 外形が妥当な ACK request には、状態変更の成否にかかわらず常に `204 No Content` を返す。`204` は state mutation の成功、session の存在、webToken の正しさ、signing success、signing 未実行または application processing success を証明しない。
- 状態変更は、正しい endpoint-scope の webToken、対応する session、`response_available` state および current generation / lifecycle の有効性を全て確認できた場合だけ行う。その場合に限り `response_available → consumed` へ一度だけ遷移し、適用可能な Relay state を purge する。
- webToken 不一致、unknown session、already consumed、already purged、expired、cancelled、duplicate ACK、generation mismatch または state loss 後に対象 state を確認できない場合は、状態変更を行わず no-op とする。これらの差異を HTTP response から区別させない。
- ACK は response の E2E 復号、schema、correlation、integrity および result validation が成功したことを前提とするが、Relay 自身はその validation を行わない。
- ACK / `consumed` は Mobile App の approval、authentication、signing success または dApp の独立検証完了を意味しない。
- purge 後の同一 ACK retry を含む ACK は idempotent / existence-hiding な transport operation であり、session existence や token validity を新たに漏えいさせない。

### 13.2 Cancel

`DELETE /v1/handoffs/{sessionId}` は、Handoff §9.6 が endpoint request として valid と扱う外形を検証した後、HTTP response と state mutation を分離して処理する。

- 外形が妥当な cancel request には、状態変更の成否にかかわらず常に `204 No Content` を返す。`204` は state mutation の成功、session の存在、webToken の正しさ、signing cancellation の成功、signing 未実行または application processing success を証明しない。
- 状態変更は、正しい endpoint-scope の webToken、対応する active session および current lifecycle で cancellation が適用可能であることを全て確認できた場合だけ行う。その場合に限り session を `cancelled` として扱い、適用可能な Relay state を purge する。
- webToken 不一致、unknown session、already cancelled、already consumed、already expired、already purged、duplicate cancel、generation mismatch または state loss / restart 後に対象 state を確認できない場合は、状態変更を行わず no-op とする。これらの差異を HTTP response から区別させない。
- cancel は Relay object の削除・無効化であり、Signer に対する signing cancellation の完了を意味しない。
- cancel の送信、受理、`204 No Content` または purge は、署名が未実行である証明ではない。
- purge 後の同一 cancel retry を含む cancel は idempotent / existence-hiding な transport operation であり、session existence や token validity を新たに漏えいさせない。
- cancel と response upload / ACK / expiry が競合した場合、一つの terminal transition だけを適用し、terminal state を再活性化しない。
- cancel 後の late response は response result として配送しない。

### 13.3 Transport status と Signer-originated `deliveryDisposition`

Relay-local に扱えるのは `transport status` だけである。例えば accepted、stored、available、retrieved、acknowledged、consumed、cancelled、expired、dropped、unavailable 等の transport lifecycle observation を記録・報告できる。ただし、これらは新しい public enum または wire field として本書で追加しない。

`deliveryDisposition` は、known signed result に付随する Signer-originated field であり、値は `PENDING`、`DELIVERED` または `DELIVERY_UNKNOWN` に限る。`PENDING` を設定し、`DELIVERED` または `DELIVERY_UNKNOWN` へ遷移させる authority は trusted Signer にだけある。`SUCCEEDED + DELIVERY_UNKNOWN` の場合、Signer は known signed result を保持する。

Relay は `deliveryDisposition` またはその値を generate、infer、derive、promote、downgrade、rewrite、normalize、merge、replace または confirm してはならない。暗号化 response envelope 内に Signer-originated `deliveryDisposition` が含まれていても、Relay はその意味を認識・解釈せず、opaque bytes / envelope を意味保持して中継するだけである。Relay transport status の `retrieved`、ACK、`consumed`、HTTP 2xx、response purge または `unavailable` は、Signer-side `DELIVERED` を意味しない。

Relay transport status の `delivered` という観測を実装・運用上使用する場合も、それは Signer の `deliveryDisposition: 'DELIVERED'` とは別の Relay-local observation である。Relay は transport status から `RESULT_UNKNOWN`、`USER_REJECTED`、`FAILED`、署名済み、未署名または Signer-side `deliveryDisposition` を推測しない。

## 14. Failure Semantics

### 14.1 Failure categories

| Relay condition                           | Relay の処理                                                                                                                                                                                       | Signing outcome への解釈                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| malformed / structural rejection          | request / transition を受け付けず、必要最小限の generic error を返す                                                                                                                               | signing validation / rejection を推測しない                                         |
| authorization failure                     | 対象 object を変更せず、Handoff の endpoint error contract に従う。ACK / cancel の valid request は `204 No Content` の no-op とする                                                               | permission denial、user rejection または signing failure に変換しない               |
| not found / terminal / expired            | 同じ外部応答に統一できる endpoint では同一化する。ACK / cancel の valid request は `204 No Content` の no-op とする                                                                                | 未署名、署名済みまたは user rejection を断定しない                                  |
| stale generation                          | current state として受理・作成・配送しない                                                                                                                                                         | signing outcome ではない                                                            |
| storage unavailable / consistency failure | state transition、delivery、ACK / cancel の状態変更を success とせず安全側に停止する。transport status は unavailable / unknown として扱い、valid request の HTTP semantics は Handoff §9.6 に従う | signing outcome または Signer-originated `deliveryDisposition` を推測しない         |
| restart / state loss                      | old state を復元せず generation を切り替える                                                                                                                                                       | old approval / signing state を復元しない                                           |
| network / transport timeout               | bounded wait / delivery を終える                                                                                                                                                                   | SDK timeout と signing request expiry を混同しない                                  |
| response delivery failure                 | transport failure または transport status unavailable / unknown として扱う                                                                                                                         | `SUCCEEDED`、未署名、`RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を Relay が決めない |
| duplicate / replay / conflict             | duplicate は既存 contract に従い冪等化し、conflict / stale は拒否する                                                                                                                              | approval / signing success に変換しない                                             |

上表の一般的な authorization failure、not found、terminal、expired、stale state または consistency failure の response rule は、ACK / cancel の endpoint-specific semantics を上書きしない。Handoff §9.6 に従い、外形が妥当な ACK / cancel は常に `204 No Content` とし、token validity、session existence、terminal / purge 状態または state loss を response の差異で露出させない。状態変更の条件を満たさない場合は no-op とする。malformed request、protocol / method / structural validation failure はこの扱いではなく、既存の Handoff structural error contract に従う。

ここでいう transport status の `unknown` または transport failure は、Signer-side `DELIVERY_UNKNOWN` ではない。`transport_failure != RESULT_UNKNOWN != DELIVERY_UNKNOWN` であり、Relay が確定できるのは transport failure / transport lifecycle だけである。

### 14.2 Error authority

Relay は新しい public SDK error code または error taxonomy を定義しない。

- common logical category は [interfaces.md §10](./interfaces.md)。
- signing outcome、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` および terminal semantics は [signing-protocol.md](./signing-protocol.md)。
- SDK / Handoff の concrete code と mapping は [web-transaction-handoff-spec.md §10](./web-transaction-handoff-spec.md)。
- Relay HTTP structural rejection body は Handoff の `RELAY_REQUEST_REJECTED` contract に従う。

Relay の error response は request body、token、session existence、ciphertext、plaintext、stack trace、storage schema、internal exception または secret を露出しない。Relay は HTTP status を SDK / Signer の logical signing outcome と同一視しない。

### 14.3 Result / Signer disposition authority

Relay は transport failure、ACK、response delivery、session purge または state loss から signing outcome / Signer disposition を生成しない。SDK も transport observation から `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測・確定しない。SDK / Relay が扱えるのは、trusted Signer が独立して確定し response に含めた value を、correlation と構造検証の範囲で意味不変に通過させることだけである。

`RESULT_UNKNOWN` は trusted Signer が signing generation 自体の成否を安全に確定できない場合だけ成立する。`DELIVERY_UNKNOWN` は trusted Signer が known signed result を既に保持しているが、Signer-side `deliveryDisposition` を安全に確定できない場合だけ成立し、`SUCCEEDED + DELIVERY_UNKNOWN` として signed result を保持する。Relay は timeout、network failure、Relay restart、state loss、storage failure、response absence、HTTP failure、polling failure、ACK failure、consumed state の不明、recipient offline または delivery failure から、いずれも生成・推測してはならない。

`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を含む response は、Relay にとって opaque response envelope である。Relay はその value を transport failure、signing failure、成功または別の disposition へ変換しない。

known signed result を Signer が保持している場合の recovery は、既存 result の resend、redelivery、retrieval または lookup に限る。これは new signing / re-sign ではなく、Relay failure を理由に新しい signature を要求・生成してはならない。新しい signing operation が明示的に開始される場合でも、Signer 側で新しい request、再検証、4条件および explicit approval を成立させる。local → remote、remote → local、Provider A → Provider B または Signer A → Signer B の automatic fallback も開始・要求しない。

同じ target の自動再署名、旧 request / envelope の再利用、別 transport への無断 fallback または user rejection への推測変換を Relay が開始・要求してはならない。

## 15. Concurrency / Atomicity

Relay は複数 session、participant、request、response、polling、ACK、cancel、expiry および instance を同時に扱う。

### 15.1 Invariants

- session ごとに participant role、direction、generation、requestId、expiry および state を分離する。
- 一つの session の response upload は `pending → response_available` を一度だけ成功させる。
- 同一 envelope の response retry は同じ結果として冪等に扱い、異なる envelope は conflict とする。
- `response_available → consumed`、`pending → cancelled`、expiry および purge は terminal state の再活性化なしに適用する。ACK / cancel の状態変更は、それぞれ §13.1 / §13.2 の条件を満たす場合だけ行う。
- ACK vs ACK、cancel vs cancel、ACK vs expiry、cancel vs expiry、ACK vs purge、cancel vs response submission、ACK vs state loss または cancel vs restart が競合しても、適用可能な logical transition は一度だけとし、state rollback、double response、cross-session delivery、terminal reuse を許さない。
- concurrent polling は同じ response を返し得るが、response を別 request に付け替えない。
- shared state の整合性を確認できない場合は状態を推測・復元せず、state mutation / delivery を成功として進めない。外形が妥当な ACK / cancel の HTTP response はこの場合も `204 No Content` とし、状態変更は no-op とする。

### 15.2 Exactly-once の範囲

Relay は exactly-once delivery または exactly-once application processing を保証しない。重複配送、polling retry、reconnect、instance failover は client-side idempotency と request / response correlation を前提とする。

Relay の処理順を Mobile App の approval 順序、transaction nonce、signing order または user intent と解釈してはならない。queue、lock、CAS、leader、ownership および retry algorithm は実装へ委譲するが、上記 logical invariants を満たす必要がある。

## 16. Restart / State Loss / Reconnect

### 16.1 Restart / state loss

Relay restart、storage loss、persistence corruption、cluster split-brain または state continuity loss の後は、次を MUST とする。

- current generation を切り替える。
- 旧 active session、pending request、response、credential state、approval、authentication または signing authorization を復元しない。
- old generationId、old sessionId、old requestId または old response を current session として再開しない。
- shared state の整合性を確認できない期間は、旧 state を推測・復元せず、新規 handoff と delivery を必要に応じて停止する。ACK / cancel の対象 state を確認できない場合は状態変更を行わないが、外形が妥当な ACK / cancel には Handoff §9.6 に従い `204 No Content` を返す。malformed request 等の structural validation failure は既存 contract に従う。
- client が retry する場合は fresh generation、fresh session / request identity、fresh envelope、credential の再検証および新しい client-side validation / approval を必要とする。

Relay は state loss から signing outcome を推測しない。旧 ciphertext が構造上受理され得る場合でも、Mobile App / SDK が generation-bound integrity / AAD validation に失敗した request を承認・署名・success へ進めない。

restart、state loss または generation change と ACK / cancel が競合した場合も、Relay は signing outcome、session existence または token validity を推測しない。current generation / lifecycle と対象 state を確認できる logical transition だけを一度適用し、確認できない場合は対象 state を復元・推測せず状態変更を行わない。外形が妥当な ACK / cancel にはいずれの場合も `204 No Content` を返す。

### 16.2 Temporary disconnect / reconnect

一時 disconnect では、同じ session の current participant が current credential、role、generation、expiry および state を再検証して再取得できる範囲に限り reconnect を許可できる。reconnect は session identity 単独では成立しない。

Relay は client の local wait timeout、Mobile App の process state、user approval、device authentication または signing controller を復元しない。具体的な reconnect / resume API と retry policy は OPEN とする。

## 17. Resource / Abuse Protection

### 17.1 Handoff 固定値

Relay と reverse proxy は encrypted HTTP body を raw byte で 512 KiB 以下に制限する。Relay は ciphertext を復号して transaction payload の 256 KiB 上限を検査しない。この transaction payload 上限は SDK / Signer 側の責任である。

create request について、IP と 1 分の時間窓ごとに次を適用する。

- 作成数: 10 件 / 分
- 総 byte 数: 4 MiB / 分
- invalid create request も count する
- 値は運用設定で変更できるが、既存 session の request retrieval、response、ACK および cancel に create 用 limit を適用しない

上記は Handoff §9.1 の既存契約を再利用する。新しい rate-limit dimension、quota、priority または bypass を本書で追加しない。

### 17.2 その他の abuse

Relay は payload semantics を解釈せず、次の resource exhaustion を bounded に拒否・抑制できる。

- connection / session / message flooding
- reconnect storm、long-poll connection exhaustion
- oversized / malformed envelope
- storage / buffer exhaustion
- identifier guessing、recipient enumeration、credential brute force
- duplicate submit、response replacement、expired message flooding

body size、connection budget、buffer、admission backoff および identifier enumeration countermeasure の追加値は運用設計へ委譲する。負荷対策を理由に validation、expiry、E2E integrity、explicit approval または secret isolation を弱めてはならない。

## 18. Observability / Privacy

Relay は運用に必要な最小限の非機密情報だけを観測する。

許容される分類は次のとおりである。

- instance health、availability、active connection / session の概数
- transport status の accepted / rejected、stored、available、retrieved、acknowledged、consumed、expired、cancelled、dropped、unavailable
- routing latency、buffer / storage pressure、reconnect、resource exhaustion、admission rejection
- generation change、state loss、invalid protocol / version、credential failure、cross-session validation failure

次を API response、storage、backup、log、diagnostics、analytics、telemetry、APM / WAF capture または admin view に含めてはならない。

- request / response plaintext
- transaction / message contents、summary、signed payload
- ciphertext 全文、sessionSecret、derived encryption material
- raw appToken / webToken、Authorization header、App Link fragment
- private key、Mnemonic、Profile password、Wallet Store、device authentication data
- 不要な Account / Origin / session / request の組合せ
- internal stack trace、storage key、operator credential または secret-bearing exception

具体的な metric 名、label、sampling、log retention、alert threshold、dashboard および privacy filter は運用仕様へ委譲する。Relay の diagnostics は signing outcome、approval、Account ownership または payload safety を表明しない。

## 19. Compatibility / Serialization

### 19.1 Protocol compatibility

- Relay protocol は `mosaiclynx.relay.v1` を使用する。
- Handoff が指定する protocol、envelope kind、required metadata、algorithm identifier および lifecycle と互換性がない request は拒否する。
- unknown field、unknown enum、unknown algorithm、unsupported version、duplicate key、ambiguous structure または malformed JSON は、既存下位契約が明示的に許可しない限り拒否する。
- version mismatch を古い insecure format、plaintext transport、旧 credential の無期限受理、別 operation または approval bypass へ downgrade しない。
- optional / additive field の扱いは Handoff / Interfaces の compatibility rule に従う。Relay が意味を推測して field を無視・変換しない。

### 19.2 Serialization

Relay は Handoff の JSON / camelCase / field encoding を使用し、同じ logical object を別の独自 wire format に変換しない。

- `generationId`、`sessionId`、`requestId`、`requestDigest`、`expiresAt`、token hash、direction および envelope の既存 encoding を変更しない。
- `null`、omitted field、wrong JSON type、duplicate key または extra field の扱いは Handoff / Interfaces に従う。
- ciphertext、nonce、tag、secret および binary field を表示都合で case conversion、decode、re-encode または normalization しない。
- Relay の storage serialization は wire serialization と別でよいが、retrieval 時に Handoff の byte-preserving envelope を壊してはならない。

## 20. Security Invariants

Relay は次を MUST とする。

1. Relay は opaque / untrusted transport であり、signing authority、wallet、transaction validator、Account authority、permission authority、approval engine、release / evidence evaluator または trust anchor ではない。
2. Relay は transaction / message の意味、signing target、Account、permission、approval、authentication、signing capability または signing result を解釈・検証・変更しない。Relay が扱うのは operation-independent な outer transport / structural validation だけである。
3. endpoint authentication、session admission、message storage、transport status、ACK、consumed state または availability を approval、authentication、署名成功または transaction safety とみなさない。
4. Relay は private key、Mnemonic、Profile password、decrypted Wallet Store、sessionSecret、derived key または signing secret を受信・復号・保持・導出・hash 化・出力しない。
5. `appToken` / `webToken` は endpoint authorization credential、`sessionSecret` は E2E secret として分離する。sessionId、requestId、generationId を secret とみなさない。
6. session、participant role、direction、generation、request / response identity、credential scope、expiry および lifecycle を routing に binding し、cross-session / cross-recipient delivery を許さない。
7. malformed、unknown、unsupported、expired、cancelled、consumed、replayed、duplicate、stale、invalidated または old generation の object を有効な handoff として再利用しない。
8. Relay は encrypted request / response envelope を opaque bytes として意味保持し、payload plaintext、transaction / message semantics、summary、Account ownership、approval または risk を解釈しない。
9. Relay の structural validation と client / Signer の AEAD、semantic、Origin、Account、permission、approval および signing validation を混同しない。
10. Relay restart、state loss、failover、reconnect または generation change 後に古い request、response、credential、approval、authentication、signing state または secret を危険な形で復元しない。
11. Relay は exactly-once application processing を保証しないが、duplicate / conflict を既存 contract に従って扱い、同一 response の競合上書きと terminal state の再活性化を防ぐ。
12. Relay の `transport status` / `transport_failure` は signing outcome と別であり、`transport_failure != RESULT_UNKNOWN != DELIVERY_UNKNOWN` を維持する。transport status から signing outcome または Signer-originated semantics を推測しない。
13. `deliveryDisposition` とその `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は trusted Signer が known signed result に付与する reserved semantics である。Relay はこれらを generate、infer、derive、promote、downgrade、rewrite、normalize、merge、replace または confirm しない。
14. Relay は response retrieval、HTTP 2xx、ACK、consumed、purge または Relay-local の `delivered` observation を Signer-side `deliveryDisposition: 'DELIVERED'` に変換しない。
15. `RESULT_UNKNOWN` は signing generation 自体の成否、`DELIVERY_UNKNOWN` は known signed result の Signer-side `deliveryDisposition` を trusted Signer が安全に確定できない場合だけ成立する。Relay および SDK は transport failure からいずれも生成しない。
16. Authentication、Signing-capable unlock、Account authorization および Explicit user approval の4条件は trusted Signer の独立した必須 signing conditions であり、Relay は evaluate、establish、semantic verify、cache、restore、infer または substitute しない。
17. session existence、participant admission、token、generation、request / response existence、stored / available state、retrieval、ACK、consumed state、transport success または Relay availability は4条件の代替ではない。Relay restart / state loss 後に4条件、approval、authentication または signing authorization を復元したと推測しない。
18. Mainnet signing capability は trusted Signer と current release / evidence gate の成立時だけ有効である。Relay health、availability、HTTP success、session creation、response retrieval、ACK、consumed state、generation current、credential validity または transport success を gate の根拠にせず、Relay は gate を evaluate、verify、promote または bypass しない。
19. Mainnet gate が missing、invalid、expired、inconsistent、unverifiable または unknown の場合、Relay は Mainnet signing capability を override、promote、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure、alternate route または re-sign へ変換しない。Testnet-only operation の安全な継続を transport availability と結び付けて妨げない。
20. known signed result の recovery は resend、redelivery、retrieval または lookup に限り、new signing / re-sign ではない。`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure または state loss から automatic re-sign、local / remote route の切替、Provider / Signer fallback または approval bypass を行わない。
21. resource / availability 対策で E2E confidentiality / integrity、expiry、request correlation、explicit approval または secret isolation を弱めない。
22. security-critical validation、generation consistency、routing integrity または shared state consistency を確認できない場合は fail-closed とする。
23. observability、error、admin plane、backup および retention は payload、credential、secret、不要な identity linkage を漏えいさせない。新しい `RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` または transport unknown の public error code を追加しない。

## 21. Component Responsibilities

| Component                     | Relay との契約                                                                                                                                                                                                             | Relay が代替しない責任                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK / Browser Extension       | request creation、Origin / caller context、E2E protection、Relay endpoint 呼出し、response の最終検証、Signer-originated result / `deliveryDisposition` の意味不変な受け渡し                                               | Relay transport status を approval、signing success、Origin verified または Account authorization とみなさない。transport observation から disposition を生成しない |
| Mobile App                    | request retrieval、generation / integrity / expiry / source validation、semantic inspection、trusted UI、Authentication、Signing-capable unlock、Account authorization、Explicit user approval、signing、response creation | Relay transport status を検証済み request、4条件、approval、safe transaction または Mainnet capability とみなさない                                                 |
| Relay                         | session、routing、credential admission、opaque temporary storage、transport status、ACK / cancel、expiry、resource control、transport observability                                                                        | transaction / message parse、Account / permission、4条件、approval、authentication、signing、result validity、Signer `deliveryDisposition`、Mainnet gate            |
| wallet-core                   | secret processing、Wallet Store、cryptographic operation、raw signing                                                                                                                                                      | Relay から直接利用できる API、secret または signing authority を提供しない                                                                                          |
| Interfaces / Signing Protocol | 共通 request / response、identity、serialization、signing state、failure / result semantics、Signer-originated `deliveryDisposition` の authority                                                                          | Relay が別の common model、operation conversion または signing state を発明しない                                                                                   |

## 22. Acceptance / Conformance

Relay implementation は少なくとも次を満たす場合に本仕様へ適合する。

1. current generation と session / request / response identity を binding し、stale generation を current state として受理しない。
2. `appToken`、`webToken`、sessionSecret、sessionId および generationId の意味と endpoint scope を分離する。
3. request / response encrypted envelope を復号・意味解釈・改変せず byte-preserving に routing する。
4. Handoff §9 の endpoint、HTTP status、5 分の expiry、512 KiB body 制限、rate limit、polling、ACK および cancel semantics に適合する。
5. `pending → response_available → consumed / cancelled / expired` の state transition を terminal reuse / rollback なしに処理する。
6. duplicate request、same requestId / different content、duplicate response、repeated polling、consumed retrieval、expired session、old credential、late delivery および stale generation を cross-session contamination なしに扱う。
7. response upload の競合、ACK / cancel / expiry / cleanup の race、restart / state loss の race で異なる response の上書きや terminal state の再活性化を起こさない。
8. Relay structural rejection、authorization failure、not found、expired、stale generation、storage failure、timeout、network failure および transport status の uncertainty を signing approval、signing outcome または Signer `deliveryDisposition` と混同しない。
9. Relay restart / state loss 後に old session、old request、old credential、approval または secret を復元せず、fresh generation / identity / envelope を要求する。
10. Relay は `RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を生成せず、response に含まれる Signer-originated value がある場合だけ opaque bytes / meaning を保持して通過させる。Relay 独自の signing result や public error code を追加しない。
11. private key、Mnemonic、Wallet Store、sessionSecret、raw credential、plaintext、ciphertext 全文および不要な sensitive metadata を log / diagnostics / admin view に出さない。
12. concurrent session / request / response / polling / ACK / cancel / expiry が session isolation、direction isolation、credential scope および fail-closed を維持する。

13. Relay が Authentication、Signing-capable unlock、Account authorization および Explicit user approval の4条件を evaluate、establish、semantic verify、cache、restore、infer または substitute せず、transport state を4条件の代替にしない。
14. Relay が Mainnet release / evidence gate を evaluate、verify、promote または bypass せず、gate failure / unknown を transport failure、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、alternate route または re-sign に変換しない。Testnet-only operation はこの gate failure により不必要に停止しない。
15. known signed result の recovery が resend、redelivery、retrieval または lookup に限られ、new signing / re-sign、automatic alternate Signer / Provider fallback または既存 approval の再利用にならない。
16. Relay の ACK、`consumed`、response retrieval、HTTP 2xx、purge または Relay-local `delivered` observation が、Signer `deliveryDisposition: 'DELIVERED'` に変換されない。

次のケースを含め、上記の分離を検証できなければならない。

- **Case A — response の保存:** Relay が response を正常に保存した場合、観測可能な値は transport status の `stored` / `available` である。`SUCCEEDED`、`DELIVERED`、`RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を推測しない。
- **Case B — response retrieval と ACK:** SDK が response を取得して ACK した場合、Relay は `consumed` への遷移または purge を行ってよいが、Signer-originated `deliveryDisposition` を変更せず、`DELIVERED` にしない。
- **Case C — retrieval 前の state loss:** Relay が response retrieval 前に state を失った場合、結果は transport failure / state loss であり、Relay は `RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を生成しない。
- **Case D — `SUCCEEDED + DELIVERY_UNKNOWN`:** Signer response に known signed result と `DELIVERY_UNKNOWN` が含まれる場合、Relay は encrypted response を opaque に保持・中継し、値を書き換えない。受信 client は復号・検証後も known signed result を利用できる。
- **Case E — `RESULT_UNKNOWN`:** Signer response に `RESULT_UNKNOWN` が含まれる場合、Relay はそれを transport failure、signing failure、成功または別の値として再解釈しない。
- **Case F — Mainnet gate failure:** Signer 側で Mainnet gate が失敗・不明となった場合、Relay は Mainnet signing capability を override / promote しない。安全な Testnet-only transport operation は継続できる。

## 23. Traceability

| Requirement                                    | Design                                                                                                            | Handoff / Common Specification                                                                                                                                                   | 本書での具体化                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `RR-001`〜`RR-003`、`RR-AC-007`〜`RR-AC-010`   | [Relay Design §3、§15〜§17](../design/relay.md)                                                                   | [Handoff §7〜§9](./web-transaction-handoff-spec.md)、[Signing Protocol](./signing-protocol.md)                                                                                   | §4、§5、§9、§10、§21 の opaque transport と request / response routing                                        |
| `RR-004`、`RR-006`、`RR-NFR-002`、`RR-NFR-005` | [Relay Design §9〜§12、§25〜§26](../design/relay.md)                                                              | [Interfaces §5〜§6、§10.3](./interfaces.md)、[Signing Protocol §10、§18〜§20](./signing-protocol.md)                                                                             | §6、§7、§11、§13、§14、§16 の expiry、duplicate、generation、transport status と result / disposition の分離  |
| `RR-005`、`RR-007`                             | [Relay Design §6、§17〜§19](../design/relay.md)                                                                   | [Interfaces §5〜§6](./interfaces.md)、[Handoff §7、§9](./web-transaction-handoff-spec.md)                                                                                        | §7、§10、§15、§20 の session / participant / direction / correlation isolation                                |
| `RR-008`、`RR-NFR-003`、`RR-NFR-004`           | [Relay Design §12〜§13、§24](../design/relay.md)                                                                  | [Handoff §7.3、§8〜§9](./web-transaction-handoff-spec.md)、[Security Design](../design/security-design.md)                                                                       | §8、§9、§12、§18、§20 の credential、E2E、retention、non-logging                                              |
| `RR-009`、`RR-AC-001`、`RR-AC-012`             | [Relay Design §7、§20、§25](../design/relay.md)                                                                   | [SDK §13〜§15](./sdk.md)、[Signing Protocol §10、§19](./signing-protocol.md)                                                                                                     | §14、§16、§21、§22 の failure、transport status、fresh retry と Signer boundary                               |
| `RR-010`、`RR-011`                             | [Relay Design §18〜§21、§23](../design/relay.md)                                                                  | [Handoff §9.1](./web-transaction-handoff-spec.md)、[Architecture](../design/architecture.md)                                                                                     | §15、§17、§18、§20 の concurrency、resource control、admin / observability boundary                           |
| result / delivery semantics                    | [Relay Design §10、§25、§28](../design/relay.md)                                                                  | [Interfaces §6.3、§10.3](./interfaces.md)、[Signing Protocol §19.3](./signing-protocol.md)、[SDK §5.4、§13.3](./sdk.md)、[Handoff §7.2、§9.6](./web-transaction-handoff-spec.md) | `deliveryDisposition` は Signer-originated。Relay は opaque pass-through のみで、生成・推測・rewrite をしない |
| four signing conditions                        | [Signing Flow Design §16、§23](../design/signing-flow.md)、[Security Design §8〜§9](../design/security-design.md) | [Requirements `CR-016` / `CR-AC-017`](../requirements/requirements.md)、[Interfaces §9.7](./interfaces.md)、[Signing Protocol §8](./signing-protocol.md)                         | §4.2、§20〜§22 の trusted Signer-only authority。Relay transport state は代替にならない                       |
| Mainnet release / evidence gate                | [Relay Design §20、§28〜§32](../design/relay.md)、[Architecture §3、§6.9、§16](../design/architecture.md)         | [Requirements `CR-NFR-006` / `CR-AC-008`](../requirements/requirements.md)、[Interfaces §7.4](./interfaces.md)、[Signing Protocol §21.1](./signing-protocol.md)                  | §4.2、§20〜§22 の Relay non-authority、fail-closed、Testnet-only continuation                                 |

Handoff の `RelayRequestBase`、`EncryptedRelayEnvelope`、`appToken` / `webToken`、`sessionSecret`、`requestDigest`、`generationId`、endpoint、HTTP status、5 分 expiry、body size および rate limit は Handoff の既存契約を参照する。本書はそれらを Relay server の admission、routing、retention、lifecycle および failure 処理へ適用する。

## 24. OPEN Issues

### OPEN-RELAY-001: generation exact format

- **問題:** `generationId` の exact format、length、generation creation algorithm および公開値の更新方法が未確定である。
- **本書だけで決定できない理由:** Handoff は generation を非秘密 opaque context として定義するが、format と生成方式を OPEN としている。
- **影響範囲:** `/v1/generation`、handoff creation、stale generation、state loss、client-side AAD binding。
- **戻すべき上流文書:** [Handoff §7.1 / §9.1](./web-transaction-handoff-spec.md)、Relay Design §6、Relay Requirements `RR-006`。

### OPEN-RELAY-002: storage backend / deployment topology

- **問題:** storage backend、shared state、multi-instance consistency、deployment topology、replication、failover および backup / disaster recovery の具体方式が未確定である。
- **本書だけで決定できない理由:** Relay の論理 state と atomicity は確定できるが、DB / Redis schema、broker、cluster および運用方式は本書の authority ではない。
- **影響範囲:** session state、concurrent transition、retention、restart、state loss、availability。
- **戻すべき上流文書:** Relay Design §19、§26、§30〜§31、Architecture §16〜§17、運用設計。

### OPEN-RELAY-003: reconnect / resume policy

- **問題:** current session の一時 disconnect 後に許可する reconnect / resume API、participant replacement、再取得範囲および retry timing が未確定である。
- **本書だけで決定できない理由:** 旧 state の復元禁止と fresh handoff の semantics は確定しているが、正常な一時再接続の具体 API は Handoff / platform contract に委譲されている。
- **影響範囲:** long polling、Mobile App lifecycle、Browser page lifecycle、session expiry、duplicate delivery。
- **戻すべき上流文書:** Handoff §9.5〜§9.7、SDK OPEN-SDK-003、Relay Requirements `RR-OPEN-002`、Mobile / SDK platform specification。

### OPEN-RELAY-004: retry / transport failure mapping

- **問題:** Relay unavailable、storage failure、delivery timeout、response retrieval failure および result retrieval / resend の client-facing retry boundary が全経路で未確定である。
- **本書だけで決定できない理由:** `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味は Signing Protocol が定めるが、具体的な retry、lookup、resend API と SDK / Mobile への mapping は下位契約へ委譲されている。
- **影響範囲:** SDK Promise、Mobile handoff、response retention、再試行による二重署名防止。
- **戻すべき上流文書:** Handoff §10、SDK §12〜§13、Signing Protocol OPEN-006、Relay Requirements `RR-OPEN-002`。

### OPEN-RELAY-005: operational resource policy

- **問題:** Handoff が定める create rate / body size 以外の connection、buffer、storage、long-poll、quota、abuse response および metric retention の exact policy が未確定である。
- **本書だけで決定できない理由:** resource boundary と Handoff の既定値は定義できるが、運用環境ごとの追加 budget、window、algorithm および alert は運用設計の責任である。
- **影響範囲:** availability、DoS resistance、false rejection、observability、運用時の retention。
- **戻すべき上流文書:** Relay Design §21、§24、Requirements `RR-010` / `RR-011`、運用 / security operation specification。

上記 OPEN を理由に、Relay を trust anchor、signing authority、payload validator、approval engine、long-term storage または credential issuer に変更してはならない。新しい token taxonomy、signing error、operation、transport、fallback または public API も追加してはならない。
