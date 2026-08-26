# MosaicLynx SDK 基本設計レビュー

## 1. レビュー情報

- 対象: [`docs/design/sdk.md`](../../design/sdk.md)
- 確認日: 2026-08-26
- レビュー種別: SDK 基本設計レビュー
- 判定: `READY`
- 主判定基準: Concept、Requirements、Architecture、Security Design、Signing Flow、Interfaces、Browser Extension、Mobile App および Relay の責務・境界・安全条件との整合性、ならびに SDK 固有の integration responsibility の十分性。
- 変更範囲: 本レビュー成果物のみを新規作成。レビュー対象本文、上位資料、ADR、実装および既存レビューは変更していない。

## 2. 総評

`docs/design/sdk.md` は、SDK の基本設計として実装または下位仕様策定へ進められる品質に達している。

本書は SDK を Web Application / dApp と trusted wallet context の間に置く非特権 integration layer として定義し、Public SDK API、Provider Discovery、Provider Adapter、Capability / Version Negotiation、Connection / Permission Client、Account / Network Query、Signing Request Builder、Request Coordinator / Response Correlator、Timeout / Cancellation、Error Normalizer、Event / State Notification および Serialization / Validation Boundary の責務を分離している。SDK は Provider discovery、capability、connection / permission initiation、公開情報取得、request construction、dispatch、response correlation、timeout / cancellation、error normalization および version compatibility を担う一方、Origin authority、permission authority、trusted presentation、user approval、device authentication、raw signing、transaction safety judgment、Relay trust decision および wallet-core を担わない。

特に、SDK が Web page と同じ trust domain に置かれ得ること、Provider の存在・capability・response を信頼根拠にしないこと、SDK が自己申告または観測した Origin を security authority にしないこと、Browser Extension / Mobile App の trusted context が最終的な caller / Origin / permission / request validation を担うことが明確である。SDK の早期 validation は developer ergonomics と protocol robustness のためのものに限定され、Signer 側の semantic validation、approval binding、trusted UI および wallet-core signing を代替しない。

また、request / response の operation、Provider / connection context、Account、Chain / Network、target binding、expiry および lifecycle による correlation、stale / duplicate / replay response の破棄、timeout と wallet-side signing 状態の分離、cancellation の非保証、result unknown の安全側処理、複数 request の独立管理、page / Provider / Browser lifecycle 後の stale state 不使用が基本設計として具体化されている。local signing と remote signing は意味を可能な範囲で共通化しつつ、latency、availability、session、cancellation、result unknown および Relay involvement の差異を隠していない。

Browser Extension、Mobile App、Relay、wallet-core および Interfaces との責任分界も一貫しており、SDK compromise 単独で secret material の取得、approval bypass、Origin authority の奪取または unauthorized signing が成立しない。実装不能性、trust boundary の破綻、上位設計との重大な矛盾は確認されなかった。

## 3. 判定

### SDK DESIGN READY

最終判定: `READY`

基本設計として必要な SDK 固有の責務、Trust Boundary、Provider / capability、connection / permission、Origin authority、request / response correlation、lifecycle、timeout / cancellation、local / remote abstraction、compatibility、secret isolation、failure recovery、security invariant および下位仕様への委譲範囲が定まっている。実装および下位仕様策定へ進めてよい。今回のレビューで記録すべき指摘はない。

## 4. 重点確認結果

| 確認項目                             | 判定 | 確認結果                                                                                                                                                                                                                              |
| ------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基本設計としての粒度                 | 適合 | §3〜§23 が責務、境界、状態、lifecycle、failure、invariant と委譲範囲を定め、具体 API、method signature、Provider object 名、wire schema、error code、bundler 等を固定していない。                                                     |
| 上位設計との整合                     | 適合 | §2、§20、§23、§25 が共通 protocol、security policy、signing flow、Browser / Mobile / Relay / wallet-core の責務を参照し、SDK 固有の integration responsibility に限定している。                                                       |
| SDK の非特権境界                     | 適合 | §1、§3、§6 が SDK を Web Application と同じ非特権 context に置き、SDK compromise 単独で secret acquisition、approval bypass、raw signing に至らない構造を示している。                                                                 |
| Provider Abstraction                 | 適合 | §5、§7 が discovery、capability、dispatch、response、disconnect、event の公開境界を定め、Provider 内部の privileged API や browser-specific implementation を露出していない。                                                         |
| Provider Discovery / Trust           | 適合 | Provider の存在、表示名、global object、自己申告 Origin、response、capability を trust anchor とせず、fake / conflicting / malformed / incompatible Provider を安全側に扱う。                                                         |
| Capability                           | 適合 | §7.3 が capability を機能の対応可能性として扱い、permission、authorization、Account ownership、unlock、approval、個別 request の成功と分離している。                                                                                  |
| Connection / Permission              | 適合 | §8 が connection、account/address disclosure、signing request、user approval を分離し、permission の最終 authority を Provider / wallet 側に置いている。                                                                              |
| Origin Authority                     | 適合 | §9、§22 が SDK の self-declared / observed Origin を authority にせず、Browser-observed Origin は Browser Extension / platform、Mobile handoff source は Mobile / platform が最終検証する責任分界を示している。                       |
| Account / Network Disclosure         | 適合 | §10 が address、public key、Chain / Network 等の許可済み公開情報だけを扱い、private key、Mnemonic、Wallet Store、unlock credential、device authentication material を除外している。                                                   |
| Signing Request                      | 適合 | §11 が construction、早期 validation、dispatch、結果受信を SDK 責務とし、semantic inspection、trusted presentation、explicit approval、device authentication、signing を Signer 側へ残している。                                      |
| SDK Validation / Security Validation | 適合 | SDK validation 通過を safe / approved / signable と表明せず、Signer が caller、permission、Account、Chain / Network、integrity、semantic safety、approval、wallet-core input を再検証する。                                           |
| Display Metadata                     | 適合 | SDK / dApp の label、description、icon、recipient 名、amount 説明等を supplementary / untrusted metadata とし、trusted approval UI の payload 根拠にしていない。                                                                      |
| Request / Response Correlation       | 適合 | §12〜§13 が request identity、operation、Provider / session、Account、Chain / Network、target binding、expiry、lifecycle で相関し、stale / duplicate / replay / 別 request の response を適用しない。                                 |
| Request Lifecycle                    | 適合 | `CREATED` から `RESOLVED` と `REJECTED` / `FAILED` / `TIMED_OUT` / `CANCELLED` / `CONTEXT_LOST` を SDK lifecycle として定め、Signer の approval / signing lifecycle と分離している。                                                  |
| Timeout Semantics                    | 適合 | §14 が timeout を SDK 側の待機終了として扱い、wallet-side request 未受信、approval 閉鎖、未署名、署名済み result 不存在を保証しない。                                                                                                 |
| Cancellation Semantics               | 適合 | local wait と Provider cancellation request を区別し、送信・受理・delivery を wallet-side cancellation completion や non-signing の証明とみなさない。                                                                                 |
| Error Model                          | 適合 | §15 が unavailable、permission、user rejection、invalid、unsupported、mismatch / integrity / replay、timeout / cancelled、transport / Relay、wallet-side / internal を成功と区別している。                                            |
| Concurrency / Reconnect              | 適合 | §16 が request ごとに identity、operation、context、timeout、cancellation、completion、permission snapshot を分離し、disconnect / reload / reconnect 後に古い state を復元しない。                                                    |
| Page Lifecycle                       | 適合 | navigation、reload、tab close、BFCache、duplicate initialization、SDK reinitialization を考慮し、page context をまたぐ pending approval、permission、signed result、request identity の危険な復元を禁止している。                     |
| Local / Remote Signing               | 適合 | §17 が local と remote の共通 semantics と、latency、availability、session、user activation、lifecycle、timeout、cancellation、result unknown の差異を分離している。                                                                  |
| Relay Boundary                       | 適合 | Relay を opaque / untrusted transport とし、delivery、session、credential、Relay response を authorization、transaction validation、result authority として扱っていない。                                                             |
| Version / Compatibility              | 適合 | §18 が SDK / Provider / protocol / capability / Signer / Mobile / Relay の unknown / unsupported / incompatible を fail-closed とし、permission bypass、Origin bypass、raw signing、unsafe fallback を禁止している。                  |
| Serialization Boundary               | 適合 | SDK internal model、application-facing model、共通 protocol representation を分離し、Interfaces の semantics を再定義せず、意味を保てない conversion を拒否する。                                                                     |
| Secret / wallet-core Boundary        | 適合 | §19、§20、§22 が SDK の secret 非保持、wallet-core の trusted cryptographic boundary、Provider private context 非露出、logging / telemetry non-leakage を定めている。                                                                 |
| Failure / Recovery                   | 適合 | §21 が Provider failure、permission、malformed、rejection、timeout、disconnect、stale response、Relay failure、wallet-side failure を安全側に終了させ、自動 fallback / 再署名を禁止している。                                         |
| Security Invariants                  | 適合 | §22 に SDK 非authority、Provider detection 非permission、capability 非authorization、Origin 非authority、validation 非代替、correlation、timeout / cancellation 非保証、secret isolation が MUST 相当の不変条件として列挙されている。 |

## 5. 指摘一覧

今回のレビューで、`BLOCKER`、`HIGH`、`MEDIUM`、`LOW`、`NIT` に該当する指摘は確認されなかった。

| Severity | 件数 |
| -------- | ---: |
| BLOCKER  |    0 |
| HIGH     |    0 |
| MEDIUM   |    0 |
| LOW      |    0 |
| NIT      |    0 |

したがって、レビュー指摘 ID は発行していない。問題がない領域に形式的な指摘を追加しない。

## 6. Trust Boundary / Provider 評価

適合。§3、§6、§7 は、Web Application / dApp、SDK code、page data、Provider response、Provider の自己申告値を untrusted として扱い、SDK の parse、type check、capability negotiation、correlation、error normalization が trusted wallet context の代わりにならないことを明示している。

- SDK は Provider を検出しても、trusted wallet、permission 済み、Account disclosure 可、signing authorized または user-approved と判断しない。
- Provider Abstraction は availability、capability、connection / permission dispatch、公開情報、signing request dispatch、response、disconnect、event の integration boundary に留まり、Extension privileged API、Mobile secure storage、approval state、wallet-core API を公開しない。
- fake、conflicting、malformed、partial、old または incompatible Provider は unavailable / incompatible / validation failure とし、意図しない Provider への自動送信を行わない。
- SDK compromise 単独で private key、Mnemonic、Wallet Store、device authentication material、E2E secret または raw signing API に到達できない。

Provider detection、Provider response、SDK resolved state、connection event または capability event を trust anchor と扱う構造は確認されなかった。

## 7. Origin Authority / Permission 評価

適合。§9 は SDK が観測した Origin、host、referrer、URL、caller 名、application label、自己申告 context を security authority にしない。Browser では Browser-observed Origin / tab / frame / document を Browser Extension / browser platform が最終検証し、Mobile / remote flow では handoff session、source、recipient、integrity、expiry を Mobile / platform が検証する。SDK が渡す caller / Origin は Signer が trusted context で検証するための補助的な request context に留まる。

具体的な Origin proof、browser API、OS API、nonce、cryptographic binding、protocol field は `SDK-OPEN-007` と下位仕様へ委譲されているが、次の基本方針は未決事項へ戻されていない。

- SDK は Origin authority ではない。
- Web Application の self-declared Origin を信頼しない。
- trusted Browser / Mobile context が最終 binding / validation を担う。
- 検証不能時に verified Origin、caller verified、接続済みまたは署名成功と表明しない。

§8 は connection、account/address disclosure、signing request、user approval を分離し、permission の最終 authority を Provider / wallet 側に置いている。SDK の local cache、capability、公開 Account、public key、connection state は permission、Account ownership、signing permission または最新の signer state の証明ではない。

## 8. Signing / SDK Validation / Display Boundary 評価

適合。§11 は SDK の責務を signing intent の construction、protocol boundary への変換、dispatch、response reception および早期 validation に限定している。SDK は transaction / message の安全性、semantic inspection、Aggregate 内部 transaction、cosignature target、表示可能性、blind signing の可否、approval binding、raw signing を確定しない。

SDK が行う malformed input、unsupported operation、明らかな Chain / Network mismatch、context 欠落、size / serialization 異常の検出は、developer ergonomics と protocol robustness のための早期検出である。SDK validation 通過後も Signer が caller、permission、Account、Chain / Network、payload integrity、semantic safety、trusted presentation、explicit approval、wallet-core input を独立検証するため、`SDK validation passed = safe to sign` にはならない。

SDK / dApp の display text、label、description、icon、recipient 名、amount 説明は supplementary / untrusted metadata であり、trusted approval UI が payload から再構成・検証する signing representation を置き換えない。未対応または意味を保てない request を raw signing、警告付き blind signing、別 operation、別 transport へ自動変換しない点も適合している。

## 9. Request / Response Correlation 評価

適合。§12〜§13 は、request identity、operation、Provider / connection / session context、Account、Chain / Network、signer context、target binding、expiry、permission snapshot および page lifecycle を request 単位で管理する。success を返す前に、response が対象 request、operation、現在の context、Account、Chain / Network、signer、target に対応することを確認する。

対応を確認できない response、遅延 response、duplicate、stale、expired、cancelled、replayed、別 request、別 session または旧 connection の response は適用せず、成功推測もしない。終端処理は一 request 一回であり、duplicate completion を無視または安全な duplicate として扱う。SDK の correlation は dApp による signed result の独立検証を代替しない。

## 10. Timeout / Cancellation / Error 評価

適合。§14〜§15 は、timeout を SDK の application wait / response application の終了として扱い、Signer が request を受信していない、approval が閉じた、device authentication が未実行、署名が未実行、signed result が存在しないとは保証しない。timeout 後の再試行は、共通仕様に従う新しい request と新しい validation / approval の境界を必要とする。

Cancellation は local wait / response handler / request state の終了と、Provider が提供する protocol cancellation request を区別する。送信・受理・delivery を wallet-side cancellation completion と同一視せず、cancellation 後も signer が既に承認・署名した可能性を否定しない。

error category は user rejection、permission denial、invalid、unsupported / incompatible、mismatch / integrity / replay、timeout / expired / cancelled、transport / Relay、wallet-side / internal を区別し、user rejection、検証失敗、result unknown を自動 retry / fallback で迂回しない。具体的な error code、exception、message、retry 回数は下位仕様へ適切に委譲されている。

## 11. Concurrency / Connection Loss / Page Lifecycle 評価

適合。§16 は account query、connection、transaction signing、message signing、cancellation、response を single global state に混在させず、request identity、operation、Account、Chain / Network、Provider context、timeout、cancellation、completion、error、permission snapshot および page lifecycle context を request 単位で分離する。

Provider disconnect、Extension reload、Browser restart、tab navigation、page reload、SDK reinitialization、session expiration 後の reconnect は、previous approval、authentication、pending request、signed result、permission または old response の復元を意味しない。旧 response が新しい SDK instance / connection に到着した場合も identity、context、expiry、session を検証し、対応しなければ破棄する。BFCache、tab close、duplicate initialization を含む page lifecycle 後に stale request / response state を危険に再利用しない。

## 12. Local / Remote Signing Abstraction 評価

適合。§17 は次の二経路を可能な範囲で共通の application-facing semantics として扱っている。

```text
local:  SDK → Provider → Browser Extension → wallet-core
remote: SDK → Provider / handoff client → Relay → Mobile App → wallet-core
```

operation、request identity、Account / Chain / Network context、success / rejection / failure の意味および result correlation は共通化する一方、latency、availability、session establishment、user activation、page / App lifecycle、timeout、cancellation、result unknown は完全に同一視しない。Relay の内部 protocol、credential、session store、Mobile の privileged interface を SDK API へ露出せず、Relay unavailable や Mobile 未提供を signing success に変換しない。

local 失敗から remote、remote 失敗から local への無断 fallback は、rejection、mismatch、integrity、caller、replay failure、result unknown を迂回し得るため禁止されている。明示的な transport 選択や代替 UX は Requirements の未決事項として扱われている。

## 13. Versioning / Compatibility / Serialization 評価

適合。§18 は SDK、Provider / protocol、capability、Signer / Mobile / Relay version の関係を operation、Chain / Network、transport および security property と併せて確認し、version 一致だけを capability の根拠にしない。unknown、unsupported、incompatible、判定不能な version、unknown field / algorithm、deprecated operation、古い permission model、曖昧または意味を保てない conversion は安全側に拒否する。

SDK internal model、application-facing model、共通 protocol representation を分離し、serialization 前後で operation、request identity、Chain / Network、Account、payload binding および expiry の意味を変えない。Interfaces の protocol semantics、wire schema、canonical serialization、request ID format、signature format および error code を SDK 独自に再定義していない。

## 14. Secret / wallet-core Boundary 評価

適合。§4、§6、§10、§19、§20、§22 は SDK が private key、Mnemonic、password、Wallet Store、復号済み secret、device authentication information、unlock token、E2E secret、credential raw 値を要求・保持・復号・導出・出力・logging しないことを定める。

wallet-core は trusted wallet component 内部の cryptographic boundary とされ、SDK は raw signing API、Wallet Store decryption、secret operation passthrough、Provider private context、Mobile secure storage または device authentication channel へ直接到達しない。signed result は秘密情報ではない範囲で扱うが、署名結果の正当性は dApp / SDK が独立検証する責任分界を維持している。

Logging、exception、URL、query、event、callback、Provider message、cache、debug output、telemetry、APM 相当の診断経路にも secret、full payload、approval detail、不要な Origin / Account 組み合わせ、session secret、credential または内部 stack trace を恒常的に記録しない設計である。

## 15. Browser Extension / Mobile App / Relay との責任分界

適合。§20 と上位設計の照合により、次の境界が保たれている。

| 主体                   | 主な責任                                                                                                                                                                     | SDK が委譲・代替しない責任                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Web Application / dApp | signing intent、SDK 利用、結果の独立検証、必要な network 処理                                                                                                                | SDK や Provider response を trust anchor にしない。secret を渡さない。                                       |
| SDK                    | discovery、capability / version、connection / permission client、公開情報、request construction、dispatch、correlation、timeout / cancellation、error normalization          | wallet、Origin authority、approval authority、signing authority、transaction safety judge ではない。         |
| Browser Extension      | Browser-observed Origin、permission / Account disclosure authority、request security validation、trusted UI、device / unlock、signing orchestration、wallet-core integration | SDK は public Provider 境界だけを利用し、privileged / private context へ入らない。                           |
| Mobile App             | handoff / source validation、OS security、device authentication、trusted approval、Account / Network、signing、response generation                                           | SDK は Mobile privileged channel、Relay validation、secure storage、device authentication を直接制御しない。 |
| Relay                  | opaque transport、session / routing、short-lived delivery、expiration、connection lifecycle                                                                                  | SDK は Relay を trust anchor、authorization backend、semantic validator、result authority として扱わない。   |
| wallet-core            | secret processing、Wallet Store、cryptographic operation、raw signing                                                                                                        | SDK / Web Application へ直接公開せず、trusted wallet component 内部に置く。                                  |
| Interfaces             | request / response semantics、operation、identity / correlation、versioning、共通 protocol                                                                                   | SDK は独自 wire contract、signing protocol、approval model を発明しない。                                    |

接続済み、capability あり、Relay delivered、Provider success または SDK resolved は、user approval、署名成功、Origin verified、Account ownership、transaction safety または結果の独立検証完了を意味しない。

## 16. Security Invariants 評価

適合。§22 は共通 Security Design の単純な複製ではなく、SDK の Provider、page、correlation、lifecycle、transport abstraction、diagnostics へ次のように適用している。

- SDK は secret material、wallet unlock、device authentication、Wallet Store、raw signing に関与しない。
- SDK は wallet、signing authority、approval authority、transaction validator、Origin authority、trust anchor ではない。
- Provider detection は connection、permission、Account disclosure、unlock、approval、signing capability の確定を意味しない。
- capability は authorization、Account ownership、user approval、個別 request の success を意味しない。
- connection、account/address disclosure、signing request、user approval を分離し、permission の最終 authority を Provider / wallet 側に置く。
- Origin / caller の最終 binding は Browser / Mobile の trusted context が担い、SDK の自己申告・観測情報だけで verified としない。
- SDK validation、display metadata、Provider response、SDK resolved state は wallet-side security validation、trusted presentation、approval、署名結果検証の代替ではない。
- request / response、operation、Account、Chain / Network、Provider context、target binding、expiry を一意に correlation し、stale / duplicate / replay / 別 request response を適用しない。
- timeout は wallet-side cancellation、未署名、signed result 不存在を保証せず、cancellation は signing definitely did not happen を保証しない。
- reconnect、Provider reload、Browser restart、page reload、SDK reinitialization は stale approval、permission、pending request、signed result の復元を意味しない。
- incompatible protocol / capability / runtime は unsafe fallback せず、user rejection、mismatch、integrity、caller、replay failure、result unknown を自動 retry / fallback で迂回しない。
- Relay delivery、Provider response、connection event、SDK resolved state を署名成功・安全性・Origin verified の根拠にしない。

本文の component、lifecycle、failure / recovery、responsibility boundary と矛盾する invariant は確認されなかった。

## 17. 上位設計との整合性

### Concept / Requirements

[`concept-sheet.md`](../../concept/concept-sheet.md) の Signer と SDK の責任分界、外部入力を信頼しない原則、利用者承認、request / result correspondence、Chain / Network 境界および Relay 非authority と一致する。[`sdk.md`](../../requirements/sdk.md) の SDK-FR、SDK-SEC、SDK-PRIV、SDK-PLAT、SDK-COMP、SDK-ERR、SDK-NFR、受け入れ条件および `SDK-OPEN-002`〜`SDK-OPEN-007` が、本書の責務・failure・compatibility・Origin binding・cross-transport の根拠として追跡されている。最新の SDK 要件レビューでも、仕様化を阻害する未解決指摘は確認されていない。

### Architecture

[`architecture.md`](../../design/architecture.md) §5.1〜§5.2、§6.2、§6.5〜§6.8、§8〜§12、§16〜§17 と整合する。SDK は dApp-facing API と Provider / handoff の integration boundary を担い、Browser Extension の privileged layer、Mobile App の OS / approval boundary、Relay の opaque transport、wallet-core の secret / raw signing boundary を越境しない。

### Security Design

[`security-design.md`](../../design/security-design.md) §3〜§4、§8〜§11、§15、§17〜§18 と整合する。SDK / dApp / Provider / Relay を untrusted external boundary とし、secret isolation、explicit approval、Origin / caller validation、request-level replay、target binding、independent result verification、bounded diagnostics、fail-closed を SDK の integration 適用へ落とし込んでいる。

### Signing Flow / Interfaces

[`signing-flow.md`](../../design/signing-flow.md) §4〜§7、§16、§20〜§25 および [`interfaces.md`](../../design/interfaces.md) §4〜§9 と整合する。SDK lifecycle を Signer の `RECEIVED`、`VALIDATED`、`AWAITING_USER`、`AUTHORIZED`、`SIGNING`、`SUCCEEDED` と混同せず、request / response identity、target binding、result unknown、delivery unknown、failure semantics を独自 protocol として再定義していない。

### Browser Extension / Mobile App / Relay

[`browser-extension.md`](../../design/browser-extension.md) §3〜§8、§12〜§22、[`mobile-app.md`](../../design/mobile-app.md) §7〜§16、§25 および [`relay.md`](../../design/relay.md) §3〜§17、§28〜§30 と、Provider 非trust、Browser-observed Origin、Mobile source / session validation、trusted UI、explicit approval、wallet-core separation、Relay opaque delivery、client-side replay / integrity、fail-closed の原則が一致する。

### Handoff / ADR

[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) の transaction / message signing、request / response identity、opaque Relay、Mobile 側の最終検証・承認・署名責任と整合する。Provider object、handoff credential、Origin proof、wire schema、timeout、cancellation protocol は本書で再定義されていない。[`ADR 0001`](../../adr/0001-mainnet-evidence-lite.md) の Mainnet capability / release evidence 条件も、SDK が安全境界を越えて署名 authority になる形へ拡張されていない。

## 18. 基本設計粒度の評価

粒度は妥当である。

- 実装者が主要判断に迷わない範囲として、SDK の非特権境界、Provider discovery / capability、connection / permission、Origin authority、account disclosure、request construction、validation boundary、correlation、lifecycle、timeout / cancellation、error、concurrency、local / remote、compatibility、secret isolation、failure recovery を定めている。
- TypeScript の具体 API、class / function、Provider object 名、method signature、request ID format、wire schema、error code、timeout 秒数、cancellation protocol、package export、bundler、framework adapter、browser matrix、queue algorithm 等は下位仕様へ委譲している。
- 未決事項は Provider 選択、cancellation protocol、transport 選択、Aggregate / multisig / cosignature 公開範囲、runtime / version policy、Origin proof の具体方式に限定され、確定済みの security principle を OPEN に戻していない。

したがって、具体 API、method signature、Provider object 名、schema、error code、timeout 値、React hook、package export map の欠落を基本設計の不足とは判定しない。

## 19. 未決事項の評価

§24 の未決事項は、基本設計を確定不能にする blocker ではなく、Requirements の `SDK-OPEN-002`〜`SDK-OPEN-007`、Provider contract、handoff / protocol specification、platform / release policy へ適切に引き継がれている。

- Provider discovery の具体 mechanism、fake / conflicting Provider の選択 policy、複数 Provider の明示選択は、detection を trust としない invariant を維持したまま決定できる。
- cancellation が local wait のみか Provider / Signer への protocol request を含むかは未決だが、いずれの場合も SDK が non-signing を強く保証しない基本境界は確定している。
- local / remote transport 選択、明示的代替 UX、Aggregate / multisig / cosignature の公開範囲、runtime、versioning、compatibility は下流で具体化できる。
- Browser-observed Origin、Mobile handoff source、caller proof、permission binding の具体 mechanism は未決だが、SDK が authority ではなく、trusted context が最終 validation / binding を担うことは確定している。

未決事項を理由に、SDK が Origin authority、approval engine、wallet、Relay trust anchor、raw signing API または unsafe fallback を持つ余地は残されていない。

## 20. 最終判定

`docs/design/sdk.md` は、SDK 基本設計として `READY` と判定する。

### SDK DESIGN READY

指摘件数: `BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / NIT 0`

## 21. Validation

- Markdown formatting: `pnpm exec prettier --check docs/reviews/design/sdk-review-001.md` に成功した。
- 相対リンク: レビュー成果物から参照する Concept、Requirements、上位設計、handoff specification、ADR のローカルファイル存在を確認した。
- 指摘 ID 重複: 指摘なし。指摘 ID は発行していない。
- Severity 表記: 指摘なし。集計表の表記は指定された `BLOCKER` / `HIGH` / `MEDIUM` / `LOW` / `NIT` と一致している。
- レビュー対象: `docs/design/sdk.md` のみを対象とし、本文は変更していない。
- `git diff --check`: レビュー成果物について問題なし。
- 変更ファイル: 既存の `_nem` / `_symbol` の変更を除き、今回の変更はレビュー成果物 1 ファイルのみ。
- リポジトリ全体 `pnpm format:check`: exit 2。既存の `_nem`、`_sns`、`_snwc`、`_symbol`、`.agents`、既存アプリ・パッケージ等に多数の format warning と HTML syntax error があるため失敗した。今回のレビュー成果物は全体走査で warning 対象になっておらず、個別 check に成功しているため、今回の変更起因とは判定しない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行していない。未実行を成功とは扱わない。
