# MosaicLynx Relay 基本設計レビュー

## 1. レビュー情報

- 対象: [`docs/design/relay.md`](../../design/relay.md)
- 確認日: 2026-08-26
- レビュー種別: Relay 基本設計レビュー
- 判定: `READY`
- 主判定基準: Concept、Requirements、Architecture、Security Design、Signing Flow、Interfaces、Browser Extension 基本設計および Mobile App 基本設計との整合性、ならびに Relay 固有の責務・境界・状態・delivery semantics・安全条件の十分性。
- 変更範囲: 本レビュー成果物のみを新規作成。レビュー対象本文、上位資料、ADR、実装および既存レビューは変更していない。

## 2. 総評

`docs/design/relay.md` は、Relay の基本設計として実装または下位仕様策定へ進められる品質に達している。

本書は、Relay を Internet-facing な opaque / untrusted transport と位置付け、Connection / Session Gateway、Auth / Admission、Session Registry、Message Router、Temporary Message Store、Delivery Coordinator、Expiration / Cleanup、Abuse / Resource Control、Observability、Cluster / Instance および Administrative Plane の責務を分離している。Relay は session、routing、bounded buffering、delivery、expiration、transport validation、abuse control および observability を担う一方、secret management、transaction semantics、Account authority、user approval、signing authorization、wallet-core および client-side の最終 integrity / replay validation を担わないことが明確である。

また、opaque payload の扱い、session / participant / role / generation の binding、message identity と request / response correlation、exactly-once を保証しない delivery、client-side idempotency、bounded retention、重複・再送・expiry・state loss・restart・failover 後の stale state 不使用、cross-session / cross-recipient isolation、multi-instance 整合性、resource exhaustion および fail-closed が、Relay 固有の基本設計判断として具体化されている。

Browser Extension / SDK は request creation、Origin / relying context、client-side E2E protection と最終検証、Mobile App は request / recipient / integrity / expiry の検証、trusted presentation、explicit approval、device authentication および signing、wallet-core は secret processing / raw signing を担う構成であり、Relay との責任分界も一貫している。Relay の admission、delivery、acknowledgement または保存状態を approval、署名成功、安全性または署名結果の正当性とみなさない設計になっている。

実装不能性、Relay の trust anchor 化、cross-session / cross-recipient の境界破綻、delivery guarantee の危険な過剰主張、secret exposure、replay による無断署名、上位設計との重大な矛盾は確認されなかった。

## 3. 判定

### RELAY DESIGN READY

最終判定: `READY`

基本設計として必要な Relay 固有の責務、Trust Boundary、session / admission、message lifecycle、delivery semantics、replay / duplicate、retention、sensitive data、multi-instance recovery、client との責任分界、security invariant および下位仕様への委譲範囲が定まっている。実装および下位仕様策定へ進めてよい。今回のレビューで記録すべき指摘はない。

## 4. 重点確認結果

| 確認項目                              | 判定 | 確認結果                                                                                                                                                                                                                      |
| ------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基本設計としての粒度                  | 適合 | §3〜§30 が責務、境界、状態、lifecycle、delivery、recovery、fail-closed と委譲範囲を定め、具体 API、Redis / DB schema、wire schema、retry interval、cluster topology 等を固定していない。                                      |
| 上位設計との整合                      | 適合 | §2、§29、§30、§32 が共通 security policy、signing flow、interfaces、Browser Extension、Mobile App、wallet-core の責務を参照し、Relay 固有の transport / delivery 適用に限定している。                                         |
| Relay の責務 / 非責務                 | 適合 | §3〜§4、§29 が connection、session、routing、temporary delivery、expiration、transport validation、abuse control、observability と、secret、approval、signing、semantic validation、wallet authority の非責務を分離している。 |
| Trust Boundary / 非信頼モデル         | 適合 | §5 が Internet-facing input、Browser Extension / SDK、Mobile、Relay persistence、admin plane を適切な境界で扱い、Relay compromise 単独で key acquisition、approval bypass、無断署名が成立しないことを示している。             |
| Payload Visibility / Opaque Transport | 適合 | §8、§13 が E2E opaque envelope と routing metadata を区別し、Relay が transaction / message semantics、Account ownership、approval、risk、blind signing を解釈しない。独自暗号方式も導入していない。                          |
| Session / Admission                   | 適合 | §6〜§7 が transport association、participant / role、generation、expiry、credential、message submission admission を分離し、session identifier 単独の join、retrieve、impersonation、injection を禁止している。               |
| Message Lifecycle                     | 適合 | §9 が `SUBMITTED` から `DELIVERED`、`ACKNOWLEDGED / CONSUMED`、`EXPIRED` / `CANCELLED` / `DROPPED` 等まで transport lifecycle として定義し、Signing Request の approval / signing state を Relay が管理しない。               |
| Delivery Semantics                    | 適合 | §10 が exactly-once を保証せず、bounded retryable / best-effort と重複配送の可能性を明示し、transport status と application processing / signing result を分離している。                                                      |
| Replay / Duplicate                    | 適合 | §11 が Relay 側の structural suppression と client-side の identity、integrity、expiry、generation、approval binding、replay protection を分担し、Relay duplicate suppression を最終保証にしていない。                        |
| Expiration / Retention                | 適合 | §12 が session、message、temporary buffering、delivered / consumed state、operational log を bounded lifetime と最小 retention に分類し、terminal state や restart 後の stale message 再利用を禁止している。                  |
| Sensitive Data                        | 適合 | §13、§24、§28 が private key、Mnemonic、password、Wallet Store、E2E secret、plaintext payload、credential raw 値の受信・復号・保持・logging を禁止している。                                                                  |
| Response Routing / Isolation          | 適合 | §17、§18 が request / response identity、session、direction、role、recipient、generation、correlation を binding し、cross-session、cross-recipient、stale response、response replacement を防ぐ基本構造を示している。        |
| Concurrency / Scaling                 | 適合 | §18〜§19 が同時 submit / delivery / ack / expiry / reconnect / failover を logical transition として扱い、shared session / message state と multi-instance の整合性を要求している。                                           |
| Failure / Recovery                    | 適合 | §20、§25〜§26 が storage failure、partition、overload、restart、state loss、failover、disconnect、expired / stale / replayed message を安全側へ遷移させ、signing state を復元しない。                                         |
| Abuse / Enumeration                   | 適合 | §21〜§22 が flooding、oversized message、storage exhaustion、reconnect storm、identifier guessing、recipient enumeration に対する admission / resource boundary を定めている。                                                |
| Client Responsibility Boundary        | 適合 | §15、§16、§29 が Browser Extension / SDK、Mobile App、wallet-core、Interfaces の request creation、validation、approval、authentication、signing、result validation を Relay から分離している。                               |
| Security Invariants                   | 適合 | §28 に Relay 非authority、非trust anchor、secret isolation、delivery 非approval、bounded retention、isolation、fail-closed、compromise 単独で無断署名不可が MUST として列挙されている。                                       |

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

## 6. Trust Boundary / Relay 非信頼モデル評価

適合。§5 は、External client、Browser Extension、SDK、Mobile App、Internet-facing ingress を untrusted input とし、Relay 内部でも ingress / admission、session registry、routing、opaque persistence、cluster state、administrative plane を分離している。

- Relay は endpoint authentication や session admission を行っても、client、Signer、Account owner、user、approved request または safe transaction とみなさない。
- Relay persistence、delivery success、acknowledgement、session membership、credential validation、operator action は signing authorization の根拠にならない。
- Relay は private key、Mnemonic、Profile password、decrypted Wallet Store、E2E session secret、derived encryption material または signing secret を受信・復号・導出・保持・logging しない。
- Relay が侵害されても、Relay 単独で secret acquisition、E2E payload decryption、valid request forgery、approval bypass、unauthorized signing を成立させない。
- Administrative plane は data plane と分離され、operator は通常運用で payload、E2E secret、credential raw 値、Account、Origin または approval を閲覧・改変しない。

Relay を trust anchor、delivery result を authorization、operator を signing authority と扱う記述は確認されなかった。

## 7. Payload Visibility / Opaque Transport 評価

適合。§8、§13 は Relay が既存 protocol の E2E opaque envelope を扱い、Relay が参照できる metadata を size、version、session、direction、identity、expiry、generation、authorization および routing に必要な最小範囲に限定している。transaction recipient、amount、message contents、Account ownership、approval、risk または semantic safety を metadata から推測しないことも明示されている。

TLS と E2E protection を混同せず、Relay 独自の key exchange、MAC、nonce、AAD、digest または envelope を追加していない。改変、順序変更、重複、遅延または誤配送の最終検出は Mobile App / Browser Extension / SDK の request / response integrity、target binding、expiry および semantic validation に委譲されている。これは [`security-design.md`](../../design/security-design.md)、[`interfaces.md`](../../design/interfaces.md)、[`mobile-app.md`](../../design/mobile-app.md) および [`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) と整合する。

## 8. Session / Admission 評価

適合。§6 の session は Web-side participant と Mobile participant の transport context として定義され、Profile、Account、Origin、approval、Wallet Store、device authentication または signing authorization と混同されていない。session identifier は routing identifier に留まり、知識だけで join、message retrieve、participant impersonation、response injection、ack / cancel 横取りまたは cross-session access が成立しない。

§7 は transport connection authentication、session participation、message submission admission、delivery、signing authorization、user approval を表で分離している。認証済み client が approved signer または approved request ではないこと、admission failure が fail-closed で不要な存在情報を返さないこと、reconnect が current session / role / generation / expiry の再検証を伴うことが明確である。

## 9. Message Lifecycle / Delivery Semantics 評価

適合。§9 は Relay が `SUBMITTED`、`TRANSPORT_VALIDATED`、`STORED / PENDING`、`AVAILABLE`、`DELIVERED`、`ACKNOWLEDGED / CONSUMED` と terminal condition を管理し、`AUTHORIZED`、`SIGNING`、`SUCCEEDED` または `USER_REJECTED` を transport lifecycle に取り込まない。

§10 は exactly-once delivery / application processing を保証せず、bounded な retryable / best-effort delivery と重複配送を前提にしている。Relay の重複配送は client-side idempotency / request identity により処理され、delivery failure は signature generation retry と分離される。既存 result の再配送・照会が可能な場合も、同一 target の再署名へ進まないため、`Relay の重複配送 ≠ 二重署名` の責任分界が維持されている。

## 10. Replay / Duplicate 評価

適合。§11 は active session 内の identity 不整合、expired / cancelled / consumed / invalidated / generation 不一致、direction / recipient / correlation 不一致、ack / cancel / response retry および旧 generation の復活を transport-level で抑止する。一方で、Relay が過去の全 ciphertext を保持して replay 判定する前提にはせず、Mobile App / Browser Extension / SDK が generation-bound integrity、request identity、expiry、source / recipient、Account、Chain / Network、operation、approval binding および既消費状態を最終検証する。

この分担は、Relay の state loss 後に旧 ciphertext が transport 外形を満たし得る場合でも、client-side validation を通じて approval / signing / success に到達させないという Requirements の受け入れ条件と整合する。重複抑止の有無を署名成功の根拠にしていない。

## 11. Retention / Sensitive Data 評価

適合。§12 は session、message、temporary buffering、delivered / consumed state、operational log を分け、transport handoff に必要な最短の bounded lifetime として扱う。payload history、分析、長期 retry queue、backup、履歴サービスとして利用せず、terminal state、restart、state loss、expiry 後に古い handoff を再利用できない。

§13、§24 は API response、storage、backup、log、diagnostic、analytics、telemetry、APM / WAF capture、error、admin view に plaintext transaction、message content、decrypted request / response、private key、Mnemonic、Profile password、E2E secret または credential raw 値を出さないことを定めている。routing metadata も必要最小限に限定され、security-design の Secret isolation / bounded retention 方針と整合する。

## 12. Cross-session / Cross-recipient Isolation 評価

適合。§17〜§19 は session、participant、role、generation、request / response identity、direction、recipient、correlation、delivery state を組み合わせて routing context を保持する。異なる session / recipient の message、response、acknowledgement、cancel、state transition を混在させず、identity collision だけで access できない。

同一 session の複数 request、同一 client の複数 connection、reconnect と delivery、expiry と delivery、ack と cleanup、submit と duplicate、response と disconnect、instance failover の競合も、atomic な logical transition として扱い、terminal state の再活性化、state rollback、recipient substitution を許可しない構造になっている。

## 13. Horizontal Scaling / Failure / Recovery 評価

適合。§19 は stateless にできる structural processing と、session / participant / role / generation、pending opaque envelope、response / ack / cancel / consumed / expiry / terminal state、delivery coordination に必要な shared state を区分している。shared state の利用不能、generation 不一致、consistency 不確認、split-brain 疑いでは新規 handoff、state transition、delivery を停止・拒否する。

§20、§25〜§26 は instance failure、persistence failure、network partition、storage unavailable、overload、rolling restart、state loss、failover、disconnect を success に変換せず、failure、timeout、expiry または result unknown として扱う。restart / state loss 後に expired / consumed / deleted message、stale session、old generation、signing authorization、approval、device authentication、Wallet Store または client secret を復元しないため、availability のために security boundary を弱めていない。

## 14. Browser Extension / SDK / Mobile App / wallet-core との責任分界

適合。§15、§16、§29〜§30 および上位資料との照合により、次の責務分界が保たれている。

| 主体                    | Relay と共有しない責務                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser Extension / SDK | Web integration、Origin / relying context、request creation、client-side E2E protection、最終 request / response validation、署名開始の判断                                       |
| Relay                   | request creator、transaction inspector、approval presenter、Account authority、signing、wallet-core、client-side replay / integrity の最終保証                                    |
| Mobile App              | request / source / recipient / session / integrity / expiry の検証、semantic inspection、trusted approval、device authentication、Account / Network、signing、response validation |
| wallet-core             | Wallet Store、Profile password authorization、secret processing、key lifecycle、cryptographic operation、raw signing                                                              |
| Interfaces              | request / response semantics、operation、identity、correlation、result / failure の意味                                                                                           |

Relay は SDK / Browser Extension が作成した protocol message を Mobile App へ運ぶだけであり、Mobile App の verification、trusted presentation、approval、device authentication、wallet-core signing を `verified`、`safe`、`approved` 等の status で置き換えない。Relay 独自の signing protocol、semantic protocol、operation conversion も定義していない。

## 15. Security Invariants 評価

適合。§28 の 16 項目は、既存 Security Design の単純な複製ではなく、Relay の transport / cluster / persistence / routing へ次のように適用している。

- Relay は signing authority、wallet、transaction validator、policy engine、Account authority、user approval authority ではない。
- Relay の認証、admission、保存、delivery、acknowledgement、availability は request authenticity、approval、signing success、transaction safety の根拠ではない。
- session / request / recipient identifier または transport credential の knowledge だけで message retrieve、session hijack、impersonation、injection、cross-session access を成立させない。
- expired、consumed、cancelled、replayed、duplicate、stale、invalidated、old generation の message / session を有効な delivery target にしない。
- Relay の duplicate、順序変更、遅延、再送が client-side approval binding / replay protection を越えて二重署名へ直結しない。
- cross-session、cross-recipient、stale response leakage を許さず、restart / state loss / failover / reconnect 後に古い state、approval、signing authorization、secret を危険に復元しない。
- payload / sensitive data を恒常的に retention / log せず、security-critical validation、session consistency、generation、routing integrity を確認できないときは fail-closed とする。
- Relay compromise 単独では secret acquisition、E2E decryption、approval bypass、unauthorized signing が成立しない。

本文の component、lifecycle、failure / recovery、responsibility boundary と矛盾する invariant は確認されなかった。

## 16. 上位設計との整合性

### Concept / Requirements

[`concept-sheet.md`](../../concept/concept-sheet.md) の Signer と Relay の責任分界、外部要求を信頼しない原則、利用者承認、bounded retention および Relay compromise への耐性に一致する。[`relay.md`](../../requirements/relay.md) の RR-001〜RR-011、RR-NFR-001〜RR-NFR-005、RR-AC-001〜RR-AC-012、RR-OPEN-001〜RR-OPEN-002 が、opaque transport、generation / identity、replay、result unknown、retention、logging、failure、scaling および client-side validation の根拠として追跡されている。最新の Requirements レビューでも未解決の重大指摘は確認されなかった。

### Architecture

[`architecture.md`](../../design/architecture.md) §3、§5.5、§6.5、§8〜§9、§16〜§17 と整合する。Relay は opaque online transport として structural validation、session / routing、temporary state を担い、Mobile / Browser / SDK の client-side integrity、approval、signing を代替しない。Relay の persistence、cluster、availability の設計も、shared state と consistency を安全側に扱う範囲に留まっている。

### Security Design

[`security-design.md`](../../design/security-design.md) §3〜§4、§10〜§12、§15、§17〜§18 と整合する。Relay、Internet input、operator / storage を限定的信頼境界とし、secret isolation、E2E protection、explicit approval、one request = one confirmation = one authentication = one signing、replay / concurrent request、bounded retention および fail-closed を Relay の transport 適用へ落とし込んでいる。

### Signing Flow / Interfaces

[`signing-flow.md`](../../design/signing-flow.md) §7、§16、§20〜§22 および [`interfaces.md`](../../design/interfaces.md) §4〜§9 と整合する。request / response identity、correlation、target binding、result unknown、delivery unknown、failure、versioning の意味を Relay が独自に再定義せず、Relay lifecycle を signing lifecycle として扱っていない。

### Browser Extension / Mobile App

[`browser-extension.md`](../../design/browser-extension.md) §21、§25、[`mobile-app.md`](../../design/mobile-app.md) §8、§12、§14〜§16、§25 と、explicit approval、trusted UI、client-side validation、wallet-core separation、fail-closed、stale state 不使用の原則が一致する。Browser Extension の page / privileged boundary や Mobile App の foreground / device authentication / OS lifecycle を Relay の責務へ取り込んでいない。

### Handoff / ADR

[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) の transaction / message signing handoff、opaque Relay delivery、Mobile 側の復号・検証・承認・署名責任と整合する。Relay の具体 envelope、credential、TTL、ACK、polling および storage schema は本書で再定義されていない。[`ADR 0001`](../../adr/0001-mainnet-evidence-lite.md) の release evidence / availability 条件も、Relay が Mainnet signing authority になる形へ拡張されていない。

## 17. 基本設計粒度の評価

粒度は妥当である。

- 実装者が主要判断に迷わない範囲として、Relay の責務、Trust Boundary、session / admission、message lifecycle、delivery semantics、replay、retention、routing isolation、concurrency、scaling、failure / recovery、abuse control および client boundary を定めている。
- WebSocket / HTTP の具体選定、Redis / DB / broker、persistence schema、wire schema、session ID format、exact TTL、retry interval、queue algorithm、cluster topology、metrics 名、admin API、rate limit 数値等は下位仕様・運用設計へ委譲している。
- `RR-OPEN-001`〜`RR-OPEN-002` および transport / persistence / operations の未決事項を、Relay を trust anchor 化する設計判断へすり替えていない。

したがって、具体 API、Redis key、DB schema、wire schema、retry interval、TTL、load balancing、metrics 一覧の欠落を基本設計の不足とは判定しない。

## 18. 未決事項の評価

§31 の未決事項は、基本設計を確定不能にする blocker ではなく、Requirements、handoff specification、protocol specification、下位 storage / cluster / operations 設計へ適切に引き継がれている。

- `RR-OPEN-001` は transaction / message signing handoff と milestone の契約を下流で確定するが、Relay の signing authority 化を許可しない。
- `RR-OPEN-002` は unavailable、expiry、result unknown、validation failure、retryable failure の外部分類を下流で決めるが、失敗を success と扱わず、古い request を再利用しない下限を維持する。
- transport authentication、session / pairing、opaque persistence、generation、multi-instance consistency、failover、retention、admin governance は、structural validation、bounded retention、client-side approval / replay protection、fail-closed を弱めない条件で下流へ委譲されている。
- 要求にない federation、decentralized relay network、permissionless discovery、automatic signing fallback、long-term payload history を未決事項として追加していない。

未決事項があることを理由に、Relay が payload semantics、approval、Account ownership、signing authorization または wallet state を判定する余地は残されていない。

## 19. 最終判定

`docs/design/relay.md` は、Relay 基本設計として `READY` と判定する。

### RELAY DESIGN READY

指摘件数: `BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / NIT 0`

## 20. Validation

- Markdown formatting: `pnpm exec prettier --check docs/reviews/design/relay-review-001.md` に成功した。
- 相対リンク: レビュー成果物から参照する上位資料、Requirements、handoff specification、ADR のローカルファイル存在を確認した。
- 指摘 ID 重複: 指摘なし。指摘 ID は発行していない。
- Severity 表記: 指摘なし。集計表の表記は指定された `BLOCKER` / `HIGH` / `MEDIUM` / `LOW` / `NIT` と一致している。
- レビュー対象: `docs/design/relay.md` のみを対象とし、本文は変更していない。
- `git diff --check`: レビュー成果物について問題なし。
- 変更ファイル: 既存の `_nem` / `_symbol` の変更を除き、今回の変更はレビュー成果物 1 ファイルのみ。
- リポジトリ全体 `pnpm format:check`: exit 2。既存の `_nem`、`_sns`、`_snwc`、`_symbol`、`.agents`、既存アプリ・パッケージ等に多数の format warning と HTML syntax error があるため失敗した。今回のレビュー成果物は全体走査で warning 対象になっておらず、個別 check に成功しているため、今回の変更起因とは判定しない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行していない。未実行を成功とは扱わない。
