# MosaicLynx Mobile App 基本設計レビュー

## 1. レビュー情報

- 対象: [`docs/design/mobile-app.md`](../../design/mobile-app.md)
- 確認日: 2026-08-26
- レビュー種別: Mobile App 基本設計レビュー
- 判定: `READY`
- 主判定基準: Concept、Requirements、Architecture、Security Design、Signing Flow、Interfaces および Browser Extension 基本設計との整合性、ならびに Mobile 固有の責務・境界・状態・安全条件の十分性。
- 変更範囲: 本レビュー成果物のみを新規作成。レビュー対象本文、上位資料、ADR、実装および既存レビューは変更していない。

## 2. 総評

`docs/design/mobile-app.md` は、Mobile App の基本設計として実装または下位仕様策定へ進められる品質に達している。

本書は、External Application / Browser / Deep Link / Intent / QR / Relay を untrusted input とし、Request intake、Request validator、Privileged application logic、Chain integration、Trusted approval UI、OS security / secure storage adapter、wallet-core binding、Response coordinator の責務を分離している。特に、App 起動、Link open、通知、Relay delivery、OS authentication success のいずれも approval や signing authority とせず、Mobile App 自身が request を検証し、foreground の trusted UI で明示的な approval を取得する構成が明確である。

また、Relay の session / request / recipient / expiry / generation / integrity / replay / response binding、device authentication と approval の分離、encrypted Wallet Store と OS-protected capability と decrypted secret の分離、background・suspended・device lock・process termination・OS kill 後の stale authorization 不使用、Aggregate / cosignature / Partial の全体確認および fail-closed が、Mobile 固有の基本設計判断として具体化されている。

共通の request / response semantics、署名 state、security policy、wallet-core の暗号・鍵管理、Relay wire protocol、Deep Link schema、OS API は上位設計または下位仕様へ適切に委譲されている。Requirements の未決事項を新しい製品要求として確定したり、hardware-backed protection を全端末の必須条件へ一律に昇格させたりする記述も確認されなかった。

実装不能性、上位設計との矛盾、Relay / External Invocation の Trust Boundary 破綻、Approval Binding の重大な不足は確認されなかった。

## 3. 判定

### MOBILE APP DESIGN READY

最終判定: `READY`

基本設計として必要な主要責務、OS security boundary、external invocation、Relay 検証、device authentication、secret lifecycle、approval binding、App lifecycle、failure recovery、security invariant および下位仕様への委譲範囲が定まっている。実装および下位仕様策定へ進めてよい。今回のレビューで記録すべき指摘はない。

## 4. 重点確認結果

| 確認項目                       | 判定 | 確認結果                                                                                                                                                                                                                                                       |
| ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基本設計としての粒度           | 適合 | §4〜§26 が責務、境界、状態、lifecycle、fail-closed と委譲範囲を定め、iOS / Android API、React Native、storage schema、wire schema、UI layout 等を固定していない。                                                                                              |
| 上位設計との整合               | 適合 | §2、§25、§26 が共通 security policy、signing semantics、interfaces、wallet-core、Relay / SDK の責務を参照し、Mobile 固有の適用だけを定めている。                                                                                                               |
| コンポーネント境界             | 適合 | §5 が Request intake / validator、External invocation adapter、Relay client、Privileged application logic、Chain integration、Trusted approval UI、OS adapter、Secure storage adapter、wallet-core binding を分離している。                                    |
| Trust Boundary                 | 適合 | §6 が External Application、Browser、Deep Link、Intent、share、Relay、network を untrusted とし、Mobile 側 validator・privileged logic・trusted UI・wallet-core・OS boundary の順序を明示している。                                                            |
| External Invocation            | 適合 | §7 が Deep Link、Universal Link、App Link、custom scheme、Intent、share、QR、notification を起動・handoff の候補に限定し、open / wake-up を approve・unlock・signing とみなしていない。                                                                        |
| Relay Integration              | 適合 | §8 が Relay を opaque / untrusted transport とし、Mobile 側で session、request identity、recipient、expiry、generation、integrity、digest、replay、state loss、response binding を検証している。                                                               |
| Device Authentication          | 適合 | §10、§12〜§16 が device authentication / user presence と signing approval を分離し、認証成功だけでは署名せず、失敗・取消・stale auth は fail-closed としている。                                                                                              |
| Secret Protection              | 適合 | §6、§11、§18、§19、§24 が encrypted Wallet Store、OS-protected credential / key、decrypted secret、wallet-core 内部処理の役割と保持範囲を分離している。                                                                                                        |
| Hardware-backed Protection     | 適合 | §3.3、§11.1、§23、§26、§27 が hardware-backed capability の端末依存性、direct signing との非同一性、非対応端末の fallback と Mainnet 条件を未決事項へ委譲している。                                                                                            |
| Signing Flow                   | 適合 | §12 が reception、context validation、Profile / Account / Network、inspection、trusted presentation、explicit approval、device authentication、pre-sign revalidation、wallet-core、response binding を一貫している。                                           |
| Approval UI                    | 適合 | §5.7、§12.2、§13 が source、Chain / Network、Account、purpose、transaction、Aggregate / cosignature、warning を App 管理下の foreground UI で扱い、外部表示を authority にしていない。                                                                         |
| Approval Binding               | 適合 | §12.3、§14、§20、§24 が request identity、source / session、recipient、Account、Network、operation、target、inspection、freshness、device capability を一回限りの authorization に binding し、署名前に再検証している。                                        |
| App Lifecycle                  | 適合 | §14〜§17、§22 が cold start、foreground、background、suspended、device lock、process termination、OS kill、restart、result unknown、delivery unknown を扱い、stale approval の自動復元を禁止している。                                                         |
| Lock / Unlock                  | 適合 | §10.3、§11.2、§15、§16、§19 が起動、foreground 復帰、idle、manual lock、device lock、approval 前、signing 前の auth / secret / authorization lifecycle を示している。                                                                                          |
| Foreground / Background        | 適合 | §13.1、§15.2、§17 が background notification、Relay polling、wake-up、headless task を署名実行から分離し、foreground trusted UI で再検証・再承認する方針を定めている。                                                                                         |
| Request Lifecycle              | 適合 | §14 が RECEIVED から SIGNING / SUCCEEDED までと terminal state を定義し、consumed、expired、duplicate、replay、context loss、結果不明後の再実行を禁止している。                                                                                                |
| Storage                        | 適合 | §19 が encrypted Wallet Store、OS credential、metadata、permission / pairing、Relay metadata、settings、transient request、approval / auth、decrypted secret を保持範囲別に分類している。                                                                      |
| Aggregate / Cosignature        | 適合 | §20 が Aggregate の outer / embedded 全体、cosignature parent と selected cosigner、Partial / NEM-specific context を確認対象とし、hash-only・部分情報・node / Relay 補完を署名根拠にしていない。                                                              |
| Concurrent Requests            | 適合 | §21 が Relay / Deep Link の同時到着、同一 session、異なる Account / Network を request identity・context・target・response channel ごとに分離している。                                                                                                        |
| Failure / Recovery             | 適合 | §22 が malformed、invalid invocation、invalid Relay、expired、replay、wrong recipient / session / Account / Network、auth failure、background、OS kill、wallet-core、Relay disconnect、stale response を fail-closed に扱っている。                            |
| Push Notification / QR         | 適合 | Requirements が notification を外部受け渡し情報、QR を未決の候補として扱う範囲に対応し、§7.2 は採否・protocol を確定せず、通知・QR を trust anchor にしていない。                                                                                              |
| Platform Compatibility         | 適合 | §23 が iOS / Android の external invocation、lifecycle、device auth、secure storage、screen exposure、Binding 等を OS adapter 境界へ閉じ込め、共通 Application model を維持している。                                                                          |
| Browser Extension との整合     | 適合 | §25 が explicit approval、trusted UI、fail-closed、wallet-core separation、approval binding、request lifecycle、secret isolation を共有し、Browser 固有の context / Service Worker / storage を Mobile にコピーしていない。                                    |
| Relay / SDK / wallet-core 境界 | 適合 | §3、§5、§8、§18、§25 が Mobile の orchestration / UI / lifecycle / OS integration、Relay の transport、SDK の公開契約、wallet-core の secret / raw signing を分離している。                                                                                    |
| Security Invariants            | 適合 | §24 に untrusted input、Relay 非authority、external invocation 非承認、explicit approval、device auth 分離、secret isolation、approval binding、stale state 不使用、background implicit signing 禁止、OS failure 時 fail-closed が MUST として列挙されている。 |

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

## 6. Trust Boundary 評価

適合。§5〜§6 の境界は、次の順序と責任を保っている。

- External Application、Browser、Deep Link、Intent、share、Relay、network はすべて untrusted input。
- Request intake / validator は source context、session、request identity、expiry、recipient、integrity を構造的に検証するが、semantic meaning や approval state を決めない。
- Privileged application logic は permission、Profile / Account、Chain / Network、inspection、approval、device authentication、lifecycle、wallet-core 呼び出し、response correlation の authority。
- Trusted approval UI は Mobile App が管理する foreground surface であり、外部アプリ、Browser、Relay、notification、OS link の表示を承認証拠にしない。
- wallet-core は Wallet Store、secret processing、key operation、raw signing の logical / Binding boundary。
- OS security adapter は device lock、user presence、secure storage、protected credential / key、hardware-backed capability を提供する候補であり、caller、request integrity、transaction semantics、approval の authority ではない。

Relay、Deep Link、Universal Link、App Link、Intent、QR、通知または OS authentication success を trust anchor と扱う構造は確認されなかった。

## 7. Relay / External Invocation 評価

### 7.1 External Invocation

適合。§7 は App 起動を request reception の可能性に限定し、approve、unlock、signing と同一視していない。custom scheme の登録競合、Universal Link / App Link の routing 情報と request integrity の分離、QR / share / Intent の untrusted 扱い、通知 payload の非authority、外部受け渡しへの Secret 非包含を明示している。

送信元、request identity、session、recipient、expiry、integrity、Profile / Account、Chain / Network、operation および current lifecycle を Mobile 側で検証し、確認できない invocation は signing request に昇格させない。具体的な URL schema、association、proof、callback、UX は `MR-OPEN-002` と下位仕様へ委譲しており、基本設計として過剰に固定していない。

### 7.2 Relay Integration

適合。§8 は Relay を E2E request / response の opaque transport と位置付け、Relay の delivery、metadata、session 存在、credential または到着事実を semantic authority としていない。Mobile App が approval UI の前に session、request identity、response correlation、generation、expiry、consumed / cancelled、duplicate、replay、late delivery、recipient、digest、direction、Chain / Network、operation、payload integrity を確認する。

state loss、old generation、session expiry、identity 不一致、ciphertext / integrity failure の後に、古い request・approval・ciphertext を復元せず、新しい handoff context と承認を要求する。配送だけが不明な場合は既存 result の再配送・照会だけを候補とし、同一 target の再署名を行わない。

## 8. Device Authentication / Secret Protection 評価

### 8.1 Device Authentication

適合。§10 は authentication を App unlock または署名前 user presence の補助条件とし、signing approval の authority と分離している。フローは request validation / inspection → trusted UI の確認 → explicit approve intent → device authentication → binding 再検証 → wallet-core signing となっている。

biometric / passcode / PIN の具体方式、fallback、rate limit、再認証頻度は `MR-OPEN-004` と下位仕様へ委譲され、認証失敗の自動 bypass、前回成功状態の無期限利用、別 request への流用は禁止されている。

### 8.2 Secret Protection / Hardware-backed Protection

適合。§11、§18、§19 は encrypted Wallet Store を wallet-core の opaque data、OS-protected credential / wrapping key を platform integration、decrypted secret を短寿命の memory-only data として分けている。Mobile App は wallet-core の KDF、AEAD、Store format、key hierarchy、raw signing を独自実装せず、外部アプリ、Browser、Relay、URL、notification、log、diagnostic、analytics、telemetry へ Secret を渡さない。

Secure Enclave、Keystore、StrongBox 等の利用可能性と hardware-backed direct signing は同一視されず、非対応端末の fallback、OS-protected wrapping、Mainnet capability 条件は未決事項として残されている。OS capability を確認できない場合に保護保証を過大表示せず、保護状態・Store integrity・Binding が不明なら signing-capable state を解除する方針も明確である。

## 9. Approval Binding 評価

適合。§12.3 の authorization は request identity、source / session、Profile / Account、Chain / Network、operation、signing target、inspection result、permission / capability、freshness に binding される。approve intent と device authentication の後、wallet-core 呼び出し直前に source、session、recipient、response channel、期限、Account、Network、permission revision、device capability、payload、parent、embedded transaction、message、signer、expected signer、existing signature / cosignature、inspection、canonicalization、confirmation model、operation、target を再検証する。

したがって、payload mutation、request substitution、Account / Network substitution、transaction substitution、別 request への approval / authentication 流用、stale approval reuse に対する基本設計上の防御が成立している。具体的な digest algorithm、serialization、request schema は共通 Interfaces / protocol と下位仕様へ適切に委譲されている。

## 10. Lifecycle / Recovery 評価

適合。cold start、foreground 復帰、background、suspended、device lock / unlock、idle、manual lock、process recreation、process termination、OS kill、クラッシュ、端末再起動、Relay state loss、response delivery unknown が、authorization、authentication context、decrypted secret、signing operation の保持・破棄と対応付けられている。

background では署名せず、foreground 復帰後に request を再検証・再表示して新しい approval / authentication を要求する。process termination / OS kill 後は旧 approval / auth / signing operation を自動復元せず、結果不明時は `RESULT_UNKNOWN`、配送不明時は `DELIVERY_UNKNOWN` として同一 target の再署名を禁止している。

## 11. Security Invariants 評価

適合。§24 の 15 項目は、共通 Security Design §17 および Signing Flow の原則を Mobile の OS、invocation、Relay、foreground / background、device auth、storage、process lifecycle、notification へ適用している。単純な複製ではなく、Mobile 固有の次の条件が追加されている。

- App 起動、Deep Link、Relay message、notification、OS authentication success だけでは署名しない。
- Relay、URL、scheme、association、app name、icon、Origin、表示文言を request integrity や利用者意図の単独根拠にしない。
- background、suspended、device lock、process restart、OS kill 後に approval / auth / signing operation を復元しない。
- headless wake-up、notification、Relay callback だけで implicit signing しない。
- OS capability を過大表示せず、wallet-core 外で暗号、KDF、Store encryption、password authorization、raw signing を実装しない。

本文の component、lifecycle、storage、failure 表と矛盾する invariant は確認されなかった。

## 12. 上位設計との整合性

### Concept / Requirements

[`concept-sheet.md`](../../concept/concept-sheet.md) の Mobile milestone、local Signer、秘密情報と外部要求の分離、利用者の明示判断、理解不能な要求の安全な終了、Relay の非署名責任に一致する。[`mobile-app.md`](../../requirements/mobile-app.md) の MR-001〜MR-013、MR-AC-001〜MR-AC-014、MR-OPEN-001〜MR-OPEN-008 に対して、§3、§7、§8、§10〜§17、§19、§22〜§27 が実装可能な設計判断と下位引継ぎを示している。

QR、通知、Deep Link、Universal Link、App Link、OS protection、hardware-backed capability、authentication fallback、backup / migration、OS kill recovery は Requirements の範囲を超えて確定されていない。

### Architecture

[`architecture.md`](../../design/architecture.md) §5.2、§6.4〜§6.8、§8〜§12 と整合する。Mobile App は外部 handoff、Profile / Account、approval、authentication、OS integration、lifecycle、wallet-core Binding を担い、Relay は opaque delivery、SDK は公開契約、wallet-core は secret processing / raw signing を担う。Browser Extension の context や UI 実装を Mobile へ無断移植していない。

### Security Design

[`security-design.md`](../../design/security-design.md) §3〜§10、§14〜§18 と整合する。Mobile 固有の device authentication、OS Secure Storage の限定的信頼、foreground trusted UI、external invocation、Relay state loss、screen / notification exposure、background / process lifecycle を共通の Secret isolation、explicit approval、re-authentication、fail-closed に適用している。

### Signing Flow / Interfaces

[`signing-flow.md`](../../design/signing-flow.md) §4〜§7、§10〜§13、§18〜§24 および [`interfaces.md`](../../design/interfaces.md) §4〜§9 と整合する。共通 request context、target binding、state model、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、Aggregate / cosignature / Partial、response correlation を Mobile 独自 protocol として再定義していない。

### Browser Extension

[`browser-extension.md`](../../design/browser-extension.md) §2、§5〜§22 と共有すべき explicit approval、trusted UI、Origin / caller binding、permission、request lifecycle、wallet-core separation、fail-closed、Aggregate / cosignature の確認条件が一致する。一方、Mobile 文書は Browser の sender / tab / frame / document や Service Worker を持ち込まず、OS lifecycle、device authentication、secure storage、Relay client、external invocation を Mobile 固有責務として分離している。

### Relay / Handoff / ADR

[`relay.md`](../../requirements/relay.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) の Relay opaque transport、E2E handoff、generation / session / request correlation、Mobile 側の復号・検証・表示・承認・署名責任と整合する。Relay protocol の envelope、暗号 parameter、endpoint、TTL、ACK、polling は下位仕様へ委譲されている。[`ADR 0001`](../../adr/0001-mainnet-evidence-lite.md) の Mainnet release evidence / gate も §3、§23、§26、§27 で platform capability とともに下位 release policy へ引き継いでいる。

## 13. 基本設計粒度の評価

粒度は妥当である。

- 実装者が主要判断に迷わない範囲として、Mobile 固有の invocation、Relay、OS security、device authentication、secret lifecycle、foreground / background、process loss、approval binding、failure recovery を定めている。
- iOS / Android API、Keychain / Keystore / Secure Enclave / StrongBox の具体呼び出し、React Native component、database schema、Relay wire schema、Deep Link URL schema、error code、queue algorithm、lock timeout、E2E test は下位仕様へ委譲している。
- Hardware-backed protection の capability、fallback、Mainnet 条件、backup / migration、OS kill 後の request recovery、screen exposure policy は未決事項として管理され、未決事項と implementation detail を混同していない。

したがって、具体 API、storage schema、wire schema、画面 layout、OS version matrix、biometric policy の欠落を基本設計の不足とは判定しない。

## 14. 未決事項の評価

§27 の未決事項は、基本設計を確定不能にする blocker ではなく、Requirements の `MR-OPEN-001`〜`MR-OPEN-008`、handoff / Relay 下位仕様、wallet-core Binding、platform privacy / release 設計へ適切に引き継がれている。

- 外部要求受信方式、source proof、Relay 主経路・代替経路、pairing、session recovery は、起動経路を trust anchor にしない invariant を維持したまま下位仕様で決定できる。
- PIN / passcode / biometric の役割、fallback、rate limit、再認証頻度は、device authentication と approval の分離を維持したまま決定できる。
- Secure storage、hardware-backed protection、非対応端末 fallback、direct hardware signing、Mainnet gate は、実際に確認できる capability を越えて保証しない条件とともに決定できる。
- pending request の再表示、OS kill 後 recovery、background 保持、delivery unknown 後の照会、backup / restore、端末移行、screen exposure は、古い authorization を再利用しない条件を弱めずに決定できる。

これらの未決事項を理由に、Relay を trust anchor とすること、device authentication だけで自動署名すること、古い approval を復元すること、blind signing、Secret の外部受け渡しまたは fail-open recovery を許可していない。

## 15. 最終判定

`docs/design/mobile-app.md` は、Mobile App 基本設計として `READY` と判定する。

### MOBILE APP DESIGN READY

指摘件数: `BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / NIT 0`

## 16. Validation

- Markdown formatting: `pnpm exec prettier --check docs/reviews/design/mobile-app-review-001.md` に成功した。
- 相対リンク: レビュー成果物から参照する上位資料のローカルファイル存在を確認した。
- 指摘 ID 重複: 指摘なし。指摘 ID は発行していない。
- Severity 表記: 指摘なし。集計表の表記は指定された `BLOCKER` / `HIGH` / `MEDIUM` / `LOW` / `NIT` と一致している。
- レビュー対象: `docs/design/mobile-app.md` のみを対象とし、本文は変更していない。
- `git diff --check`: レビュー成果物について問題なし。
- 変更ファイル: 既存の `_nem` / `_symbol` の変更を除き、今回の変更はレビュー成果物 1 ファイルのみ。
- リポジトリ全体 `pnpm format:check`: exit 2。`_nem`、`_sns`、`_snwc`、`_symbol`、`.agents`、既存アプリ・パッケージ等に多数の既存 format warning と HTML syntax error があるため失敗した。今回のレビュー成果物は全体走査で warning 対象になっておらず、個別 check に成功しているため、今回の変更起因とは判定しない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行していない。未実行を成功とは扱わない。
