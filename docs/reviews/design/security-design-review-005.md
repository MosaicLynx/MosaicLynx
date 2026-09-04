# MosaicLynx 共通セキュリティ設計 Fresh Full Review 005

## 1. Review Target

- 対象: [`docs/design/security-design.md`](../../design/security-design.md)
- Review ID: `security-design-review-005`
- 確認日: 2026-09-04
- 種別: 復元後の `design-review` Skill による初回レビュー相当の fresh full review
- 変更範囲: 本 review artifact の新規作成のみ。Security Design 本文、Architecture、Requirements、Specification、実装および設定は変更していない。
- 過去レビュー: [`security-design-review-001.md`](./security-design-review-001.md)、[`security-design-review-002.md`](./security-design-review-002.md)、[`security-design-review-003.md`](./security-design-review-003.md)、[`security-design-review-004.md`](./security-design-review-004.md)

過去の判定や finding は continuity 確認にのみ使用し、Review Gate は現行 Security Design と上流資料、Architecture、関連 Design / Specification、ADR および wallet-core の外部契約を独立に照合して判定した。API、wire format、暗号パラメータ、parser、Binding の ABI、zeroize 実装、UI pixel design、具体的な OS API、実装コードおよびテスト方式は本レビューの finding 範囲外とした。

## 2. Execution Audit

`.agents/skills/design-review/SKILL.md`、共通 review playbook、reviewers、security checklist、review gates、output format、`.agents/project-context.md` および root `AGENTS.md` を確認した。Repository に Security Design 専用の別 Review Skill は存在せず、`design-review` Skill の Reviewer B と security checklist が Security Design の正式な security review 手順である。

サブエージェントは使用せず、Reviewer A〜D を次の4つの独立した self-review path として実施した。

| Path                          | 確認内容                                                                                                                                | 結果                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A: structure / responsibility | 目的、範囲、Application、Browser Extension、Mobile App、SDK、Relay、Node、OS、wallet-core、user の責任分界                              | 基本責務と trusted signer の所有は成立。Relay / SDK / Node への権限逆流なし                                                    |
| B: security primary           | asset、attacker、trust boundary、secret ownership / lifecycle、authentication、authorization、approval、replay、fail-closed、invariants | 主要 security boundary は成立。Mainnet gate と Relay E2E secret separation の表現に Minor finding                              |
| C: flow / operations          | lock / restart、署名前再確認、request substitution、stale / duplicate / concurrent、result、backup、incident recovery                   | 安全側の状態遷移と承認再利用禁止は成立。下位 open item は適切に defer                                                          |
| D: traceability / downstream  | Concept、Requirements、Architecture、ADR、関連 Design / Specification、wallet-core 外部契約、release responsibility                     | Mainnet 要件の Security Design §16 への追跡が generic delegation に留まる。Relay の E2E 要件も target 上の責任記述を明確化可能 |

候補は、要求または既存設計判断への traceability、Design-level の ownership / boundary / invariant か、下位実装だけでは解消できないか、具体的な asset / impact があるかで反証した。結果として Critical / Major はなく、Minor 2件を optional improvement として統合した。

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                             | 使用目的                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/security-design.md`](../../design/security-design.md)                                                                                                                                                                                                                                                                                              | Review target。Threat Model、Trust Boundary、Key / Secret lifecycle、Lock、Signing Authorization、Permission、Replay、Relay / Node、Sensitive Data、Backup、Fail-closed、Software Integrity、Security Invariants、委譲および SEC-OPEN-* を確認 |
| [`security-design-review-001.md`](./security-design-review-001.md)、[`security-design-review-002.md`](./security-design-review-002.md)、[`security-design-review-003.md`](./security-design-review-003.md)、[`security-design-review-004.md`](./security-design-review-004.md)                                                                                   | 既存 `SD-SEC-*` / `SD-REVIEW-*` の continuity と再発確認。過去 READY 判定は今回の Gate 根拠として継承していない                                                                                                                                |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                                                                | Signer、明示承認、Relay 非署名、秘密情報分離および保証範囲を確認                                                                                                                                                                               |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)                                                                              | Common、Browser、Mobile、Relay、SDK の security requirement、Mainnet gate、secret separation、caller / request binding、結果対応および open item を確認                                                                                        |
| [`docs/design/architecture.md`](../../design/architecture.md)、[`architecture-review-005.md`](./architecture-review-005.md)                                                                                                                                                                                                                                      | 最新 Architecture の trusted signer、§6.9 共通4条件、E2E Relay boundary、Mainnet gate、§17.1 traceability と `DR-003` の影響を独立確認                                                                                                         |
| [`docs/design/signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)                                                                   | Signing、approval、caller / permission、host lifecycle、Relay opaque transport、SDK non-privilege の責任境界を照合                                                                                                                             |
| [`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)                                               | Profile / Account、署名ごとの認証、Symbol / NEM 分離、message context、Relay E2E、backup と Mainnet capability の下位契約を確認                                                                                                                |
| [`0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)、[`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)、[`release-process.md`](../../release/release-process.md)、[`threat-model.md`](../../release/threat-model.md)                                                                                             | Mainnet capability、release evidence / policy、fail-closed、software integrity および保証境界を確認                                                                                                                                            |
| [`_snwc/docs/design/security.md`](../../../_snwc/docs/design/security.md)、[`_snwc/docs/design/architecture.md`](../../../_snwc/docs/design/architecture.md)、[`_snwc/docs/requirements/requirements.md`](../../../_snwc/docs/requirements/requirements.md)、[`_snwc/docs/specifications/specification.md`](../../../_snwc/docs/specifications/specification.md) | wallet-core の secret / Store / raw signing ownership、Application-level approval / authentication 非担当、Binding の論理境界および external contract を確認                                                                                   |

チェックアウト済み `_snwc` には、repository 内の一部資料が参照する `docs/decisions/binding-implementation.md` は存在しなかった。そのため当該ファイルの内容を根拠にせず、現存する wallet-core design / requirements / specification と MosaicLynx Architecture の記述だけを使用した。

## 4. Review Result

**Review Gate: `READY`**

Critical 0、Major 0、Minor 2（いずれも New / Open）である。`design-review` Skill は Critical がない場合、Major / Minor を Optional Improvements として引き継ぎ可能としているため、Gate は `READY` とする。2件は release / Relay の高位 security policy の明示性を改善するもので、private key compromise、untrusted signer、authorization bypass または trust boundary collapse を直接成立させる欠陥ではない。

## 5. Summary

- Browser Extension と Mobile App の trusted host が trusted signer であり、SDK、dApp / Web page、Provider、Deep Link、Relay、Node、external API および OS は最終的な signing authority ではない。trusted component と trusted input の混同はない。
- private key、mnemonic、derived / decryption secret、password-derived secret、Wallet Store、temporary signing data、authentication / session state の所有、lock / revoke / expiry / incident 時の無効化が、host と wallet-core の境界に沿って定義されている。秘密鍵保有と user approval は明確に分離されている。
- Signer 自身の trusted UI、全 security-relevant field の確認可能性、reviewed payload と実 payload の一致、Account / Chain / Network / caller / permission / session binding、署名ごとの再認証、`1 request = 1 confirmation = 1 authentication = 1 signing operation` が定義され、blind signing、unknown state、stale / duplicate / substituted request は拒否される。
- Relay は opaque delivery と短期状態に限定され、Node は補助情報源に限定される。Relay / Node / SDK の侵害だけで key acquisition や unconfirmed signing に到達しない。Relay の E2E confidentiality と E2E secret / transport credential の分離は下位資料では明確だが、target 本文の高位方針としては `DR-SEC-002` を記録する。
- Requirements、Architecture、release evidence の Mainnet fail-closed は成立しているが、target §16 が generic な release delegation に留まり、common Security Design 自身の traceability が弱い。この点を `DR-SEC-001` とした。

## 6. Finding Status

| ID              | Severity      | Status     | 初出 / continuity            | 今回の状態                                                                                                                                 |
| --------------- | ------------- | ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `SD-SEC-001`    | 過去 `MEDIUM` | Resolved   | `security-design-review-001` | §8.1 が適用可能な security-relevant field の確認可能性と、表示不能時の拒否を明示                                                           |
| `SD-SEC-002`    | 過去 `MEDIUM` | Resolved   | `security-design-review-001` | §15.1 が Wallet Core error、validation failure、warning、binding error、Store integrity / verification failureを fail-closed に接続        |
| `SD-SEC-003`    | 過去 `MEDIUM` | Resolved   | `security-design-review-001` | §8.3 が message-level context と request-level replay protection を分離し、caller / purpose / nonce / freshness / domain separation を定義 |
| `SD-SEC-004`    | 過去 `MEDIUM` | Resolved   | `security-design-review-001` | Invariant 1 / 8 が Provider、Content Script、URL、Deep Link、Node 等を含む untrusted boundary を包括                                       |
| `SD-SEC-005`    | 過去 `MEDIUM` | Resolved   | `security-design-review-001` | Profile §20 が `every-signature` に固定され、`while-unlocked` を signing authentication の代替にしない                                     |
| `SD-REVIEW-001` | 過去 `MEDIUM` | Resolved   | `security-design-review-002` | §7.1 が全 Signer の startup / restart / reload 後 `LOCKED` を MUST 化                                                                      |
| `SD-REVIEW-002` | 過去 `LOW`    | Resolved   | `security-design-review-002` | §13.2 / §18 が認証・署名確認・transaction / message context を Mobile Sensitive UI として下流へ引継ぎ                                      |
| `SD-REVIEW-003` | 過去 `MEDIUM` | Resolved   | `security-design-review-002` | §6.1 / §19 が Symbol / NEM を別 Key Identity とし、Chain-specific derivation を要求                                                        |
| `DR-SEC-001`    | Minor         | New / Open | `security-design-review-005` | Mainnet capability の evidence / policy fail-closed が target §16 で明示されず、generic release delegation から一意に追跡できない          |
| `DR-SEC-002`    | Minor         | New / Open | `security-design-review-005` | Relay path の E2E message confidentiality と E2E session secret / transport credential の分離が target 上で十分明示されない                |

`SEC-OPEN-001` と `SEC-OPEN-003` は target 本文で解決済みである。`SEC-OPEN-002`（Mobile biometric capability / fallback / lifecycle）と `SEC-OPEN-004`（既存 message handoff contract と platform display acceptance の最終整合）は Open のままだが、共通 security invariant を弱めない下流委譲であり formal finding ではない。Architecture の `DR-003` は message signing の traceability drift であり、target §8.3 と handoff specification が security boundary を既に定めているため、本 review の finding へ連鎖させない。

## 7. Required Changes

なし。Critical の New / Open / Reopened finding はない。

## 8. Optional Improvements

### `DR-SEC-001` — Mainnet capability の release gate traceability

- **Severity:** Minor
- **Status:** New / Open
- **Location:** [`security-design.md`](../../design/security-design.md) §16、§18 `Release / Operation`、関連資料列挙
- **Problem:** target §16 は正規配布、改ざん検出、version / dependency、レビュー、migration および generic な `release gate` の委譲を定めるが、`Mainnet capability`、適用 policy / evidence、判定不能時の Testnet-only / unavailable への fail-closed を明示していない。Requirements `CR-NFR-006` / `CR-AC-008`、Browser `BR-013`、Mobile `MR-013`、Architecture §16 / §17.1、ADR および release evidence はこの gate を明示しているため、target の common security policy からは追跡が途切れる。
- **Security impact:** platform または release 側が generic な release gate を Mainnet capability gate と解釈しない構成を選べ、evidence 欠落・期限切れ・検証不能・policy 不明時に Mainnet signing capability が有効化される余地が残る。これは release assurance と Mainnet fail-closed invariant の不整合である。ただし現行 Architecture / release source は正しい gate を定めており、直接の key compromise や signing authority 取得を示すものではないため Minor とする。
- **Evidence:** Requirements `CR-NFR-006` / `CR-AC-008` は Mainnet gate 不成立時に有効化しないことを要求する。Architecture §16 は evidence / policy 判定不能で fail-open にしないとし、§17.1 は release evidence を責任主体・正本として追跡する。[`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md) は各 platform を fail-closed とし、evidence 検証失敗時に Testnet-only とする。target §16.1 相当にはこれらを参照する Mainnet-specific statement がない。
- **Required correction:** §16 または同等の共通 release principle に、Mainnet capability は適用される release policy / evidence gate が成立した場合だけ有効化し、missing / inconsistent / expired / unverifiable evidence、approval / signature / trusted-key failure または policy unknown では有効化しないことを明記する。Testnet-only 継続を妨げないことと、詳細を release / operation docs へ委譲することも明示する。
- **Scope boundary:** CI command、SHA pin、SBOM schema、manifest format、trusted key storage、runtime implementation、具体的な platform capability evaluator は本 finding の要求に含めない。
- **Completion / reconfirmation:** target が Mainnet capability、evidence / policy gate、判定不能時の fail-closed、および release source への参照を high-level に持ち、既存の release operation 詳細を重複定義していないことを再確認する。

### `DR-SEC-002` — Relay の E2E confidentiality と secret class の明示

- **Severity:** Minor
- **Status:** New / Open
- **Location:** [`security-design.md`](../../design/security-design.md) §3.2 Relay、§11.1、§12.1、§18 Relay、§19 remaining open items
- **Problem:** target は Relay を untrusted とし「暗号化された要求・結果」「opaque envelope」「TLS」を示し、private key / mnemonic を Relay に渡さない。しかし、Relay が E2E ciphertext のみを扱い、E2E session / derived encryption secret を受領・復号・保持しないこと、ならびに Relay endpoint authorization credential と E2E secret が別分類・別責任であることを target 本文で明示していない。`§12.1` の Sensitive 例も Relay temporary identifier に留まる。このままでは TLS 終端で plaintext を扱う transport と、Relay を opaque に保つ E2E architecture の双方が generic wording 上は成立し得る。
- **Security impact:** Relay operator / compromise が transaction / message contents または E2E decrypting material を取得できる構成を、Signer boundary を壊さずに選択できてしまう。これは Relay を confidentiality boundary として過信する metadata / content exposure のリスクである。既存の Signer-side integrity / inspection / approval により直接の signing authority または private key exposure へは直結しないため Minor とする。
- **Evidence:** Requirements `RR-003` / `RR-008` は Relay の opaque delivery と秘密情報・平文・E2E 境界を定める。Architecture §6.5、§9 は E2E opaque envelope と Relay credential / E2E session secret の分離を明示する。Handoff Specification §7.3、§8、§13 は `appToken` と `sessionSecret` を別分類とし、Relay が plaintext / E2E secret を扱わないことを定める。一方、target §11.1 / §18 は opaque / encrypted と TLS を委譲するが、この distinction を明示していない。
- **Required correction:** Relay security principle に、Relay path の message confidentiality は E2E protected opaque envelope を前提とし、Relay は plaintext を復号せず、E2E session / derived encryption secret を受領・保管・ログ出力しないことを明記する。Relay transport authorization credential は E2E secret と別の最小権限情報として扱い、metadata / credential の retention と logging を最小化する方針も示す。暗号方式、key derivation、HTTP header、wire format、TTL の値は下位仕様へ委譲する。
- **Scope boundary:** AES / HKDF / AEAD、key length、nonce、fragment、HTTP / Redis API、credential schema、具体的 metadata allowlist、ログ設定実装は本 finding の要求に含めない。
- **Completion / reconfirmation:** target §11 / §12 / §18 が、E2E secret と transport credential の所有主体、Relay の復号不能・非保持、message confidentiality と metadata minimization の high-level policy を一意に示し、既存 Handoff / Relay specification と矛盾しないことを再確認する。

## 9. Resolved Findings

過去の全 formal finding は、今回の本文照合で次のとおり resolved と再確認した。

- `SD-SEC-001`: §8.1 の「適用可能な security-relevant field をすべて確認可能にし、表示不能なら署名しない」により解消。
- `SD-SEC-002`: §15.1 の Wallet Core error / warning / binding / Store integrity failure を success や warning-only bypass へ進めない条件により解消。
- `SD-SEC-003`: §8.3 が message-level context と request-level correlation / expiry / replay を分離し、message replay / cross-domain / cross-purpose の維持を要求するため解消。
- `SD-SEC-004`: §17 Invariant 1 / 8 が SDK、dApp、Provider、Content Script、Deep Link、Relay、Node、API、URL、log / telemetry / diagnostics を含む untrusted boundary と単独侵害影響を明示するため解消。
- `SD-SEC-005`: §7.1 / §7.2 と Profile §20 の `every-signature` により、UNLOCKED、permission、session、直前の認証を署名ごとの認証の代替にしないため解消。
- `SD-REVIEW-001`: startup、restart、reload、process recreation、extension reload、browser restart 後の全 Signer `LOCKED` が §7.1 にあるため解消。
- `SD-REVIEW-002`: §13.2 が Secret 画面だけでなく authentication、signing confirmation、transaction / message context を Mobile Sensitive UI として下流へ引き継ぐため解消。
- `SD-REVIEW-003`: §6.1 / §19 が Symbol / NEM を別 Key Identity とし、対象 Chain を明示して chain-specific derivation を使うため解消。

## 10. Upstream Feedback

なし。Common、Browser、Mobile、Relay、SDK Requirements は、Mainnet gate、E2E confidentiality、secret separation、approval、replay、結果対応および guarantee boundary を十分に定義している。今回の2件は Requirements の不足ではなく、既存要求・Architecture・下位仕様を Security Design の高位 policy へ明示的に接続する target 側の改善である。

## 11. Deferred Findings

- `SEC-OPEN-002`: Mobile biometric capability、fallback、credential、lifecycle の具体的な責任と Profile §22 との整合。署名ごとの再認証と OS authentication / wallet authorization の分離は target で確認済みであり、具体 API は Mobile design / specification へ委譲する。
- `SEC-OPEN-004`: 既存 handoff の message signing contract と platform display acceptance の最終整合。target §8.3 の policy を API / schema / encoding / serialized format として重複定義しない。
- Common `CR-OPEN-001` / `CR-OPEN-002`、Mobile の host / OS / lifecycle / backup、Relay の protocol / TTL / state / retention、SDK の transport / caller binding、chain の supported type / version、Profile-wide backup / restore は、それぞれの既存正本へ委譲する。Backup は explicit user action、reauthentication、trusted UI、wrong state での無傷な検証という高位責任を満たすが、format や merge / overwrite の詳細を本レビューで決めない。
- Architecture `DR-003`: Architecture §17 と既存 handoff specification の message signing status drift。target §8.3 が message security context を定めており、現時点で Security Design の trust boundary / authorization gap にはならない。Architecture 側の traceability 同期は Architecture review の Open item として継続する。
- `_snwc` の checkout に存在しない binding decision の exact historical text は未確認である。ただし現存する wallet-core design / requirements / specification と Architecture が、Core の secret / Store / raw signing と host の UI / permission / approval / lifecycle を分離しているため、今回の high-level security finding はこの欠落資料に依存しない。

## 12. Scope and Traceability

| 上流要求 / 判断                                                                                                                          | Security Design 対応                | 評価                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common purpose、`CR-002`、`CR-007`、`CR-008`、`CR-010`、`CR-012`、`CR-013`、`CR-015`、`CR-016`、`CR-NFR-001`〜`005`、`CR-NFR-007`〜`013` | §1〜§10、§12〜§18                   | Pass。目的、secret separation、chain / network、four conditions、result binding、fail-closed、untrusted input、user judgment を追跡できる                                                      |
| `CR-NFR-006` / `CR-AC-008` Mainnet release gate                                                                                          | §2.1、§4.3、§16、§18                | `DR-SEC-001`。release responsibility はあるが、Mainnet capability と evidence / policy fail-closed が target に明記されない                                                                    |
| Browser `BR-*`、特に `BR-013`                                                                                                            | §2、§3、§5、§7〜§10、§13〜§18       | Pass。Browser privileged signer、origin / permission、trusted UI、restart lock、Mainnet gate を関連 Architecture / release source と整合。ただし共通 target の Mainnet wording は `DR-SEC-001` |
| Mobile `MR-*`、特に `MR-013`                                                                                                             | §2、§3、§5、§7、§13、§14、§18、§19  | Pass。Mobile trusted host、external handoff、OS limited trust、Sensitive UI、Mainnet gate、未実装範囲を混同しない。biometric details は `SEC-OPEN-002`                                         |
| Relay `RR-003`〜`RR-009`、`RR-NFR-*`                                                                                                     | §3、§4、§5、§10〜§12、§15、§17、§18 | `DR-SEC-002`。Relay non-privilege、opaque delivery、integrity、expiry、replay、retention は対応するが E2E secret / transport credential distinction の明示を要する                             |
| SDK `SDK-*`                                                                                                                              | §3、§5、§8〜§10、§15、§17、§18      | Pass。SDK は non-Signer、secret / auth / approval / final inspection を持たず、correlation と safe propagation の責任を持つ                                                                    |
| Architecture §6.5、§6.9、§9、§16、§17.1                                                                                                  | §3、§5、§6〜§11、§15〜§18           | Pass。trusted signer、four conditions、wallet-core、Relay E2E、Mainnet gate、delegation は整合。Architecture `DR-003` は security boundary に影響しない                                        |
| Profile / Account、Chain Compatibility、Web Handoff Specification                                                                        | §6〜§11、§13、§15、§18、§19         | Pass。every-signature、fixed Profile Network、Symbol / NEM separation、message context、handoff result / replay を下位正本へ委譲                                                               |
| ADR 0001、Mainnet release evidence、release threat model                                                                                 | §4.2、§4.3、§15.2、§16、§18         | `DR-SEC-001`。release integrity / incident boundary はあるが Mainnet gate の common-level traceability を補強すべき                                                                            |
| wallet-core external contract                                                                                                            | §3、§5、§6、§7、§8、§15、§18        | Pass。Core は secret / Store / crypto / raw signing の正本、Application / host は UI / permission / authentication / approval / orchestration の owner。binding detail を過剰要求しない        |

## 13. Domain Checks

| 観点                                  | 評価と根拠                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Threat Model                       | Pass。§4 が private key / mnemonic / Store / payload equality / Account-context / approval state / sensitive retention を asset とし、malicious dApp、SDK / Relay / node compromise、replay、substitution、phishing、concurrency を attacker capability としている。trusted host 本体の全面侵害は保証外と明示し、万能攻撃者へ拡張していない。local storage、OS / browser boundary は限定的 trust として扱う。                             |
| 2. Trust Boundary                     | Pass。Web ↔ SDK、SDK ↔ Extension / Mobile、UI ↔ wallet-core、wallet-core ↔ OS / storage、Mobile ↔ Relay、Relay ↔ Node / network、untrusted request ↔ signer を §3 / §5 / §11 / §18 で区別する。trusted signer と authorization owner は host。`DR-SEC-002` は Relay の E2E secret wording の改善であり boundary collapse ではない。                                                                                                       |
| 3. Key / Secret Lifecycle             | Pass。private key、mnemonic、derived / decryption secret、password-derived secret、Wallet Store、temporary signing data、authentication / session stateについて generation / import、storage、use、exposure、export、deletion、lock / unlock、memory、backup / recovery の高位 owner と lifecycle が §6〜§7、§12〜§13、§15、§18 にある。zeroize や具体 API は下位委譲で妥当。E2E secret の Relay 非保持だけ `DR-SEC-002` で明示性を補う。 |
| 4. Authentication / Lock              | Pass。startup / restart / reload 後 `LOCKED`、explicit unlock、auto-lock、external request による unlock 禁止、署名ごとの再認証、OS authentication は限定 capability、dApp / SDK / Relay は auth 不可。`SEC-OPEN-002` は biometric capability の詳細だけで、OS auth と wallet authorization の混同はない。                                                                                                                                |
| 5. Signing Authorization / Approval   | Pass。発生元、trusted display、target-derived display、Account、Chain / Network、recipient / amount / fee / deadline / message、aggregate inner transaction、cosignature / permission effects の適用可能 field、approve / reject、blind signing、stale、payload substitution、result binding を §8〜§10、§15、§17 で確認できる。秘密鍵保有は approval の代替でない。                                                                      |
| 6. Permission Model                   | Pass。Browser origin-per-connection、Mobile caller / handoff identity、Account selection、connection と signing permission の分離、revoke 即時性、external expansion 禁止、caller / account / chain / network / session binding を §9 に定める。具体 schema は下位委譲で、unknown / stale permission の再利用は禁止される。                                                                                                               |
| 7. Replay / Request Binding           | Pass。requestId、createdAt、expiresAt、processed-ID、same-ID different-content reject、caller / permission / session / Account / Chain / Network / payload context、concurrent isolation、one-to-one operation、response correlation を §8.3、§9、§10、§15 で定める。具体的 byte representation は要求していない。                                                                                                                        |
| 8. Relay Security                     | Pass with `DR-SEC-002` optional improvement。Relay は secret、signing、semantic interpretation、approval、auth authority を持たず、integrity / expiry / duplicate / result mix-up と availability failure を分離する。Requirements / Architecture / Handoff は E2E opaque を明確にするため、target §11 の E2E secret / transport credential wording を合わせるべき。                                                                      |
| 9. Node / Blockchain Boundary         | Pass。Node / API は untrusted auxiliary source。malicious / stale / inconsistent / unavailable response、wrong network、forged status を signing authority とせず、Network mismatch / parse failure を拒否し、availability failure で validation を skip しない。single node availability improvement は要求していない。                                                                                                                  |
| 10. Sensitive Data                    | Pass。Secret / Sensitive / Public を区分し、public blockchain data も wallet 内部の Account-caller association、permission、session、Relay identifier と同一視しない。logs、exceptions、warnings、telemetry、crash、analytics、notifications、URL、clipboard、retention、deletion を §12〜§13 で扱う。Relay E2E secret の分類明示だけ `DR-SEC-002`。                                                                                      |
| 11. Backup / Recovery                 | Pass at Security Design level。explicit user action、reauth、trusted UI、plaintext export / cloud auto-save 禁止、failed export の temp cleanup、wrong / invalid state での安全側責任を確認。Profile full backup / restore format、merge、overwrite、wrong account の具体契約は `CR-014` と Profile open item へ defer し、過剰要求しない。                                                                                               |
| 12. Anti-Phishing / Trusted UI        | Pass。own UI、external HTML / Markdown / branding / Deep Link / Relay text の不使用、caller / origin の own verified value、Web password field 禁止、consistent security UI を §8、§13、§14 で定める。pixel-level layout は下位委譲。                                                                                                                                                                                                     |
| 13. Fail-Closed                       | Pass。unknown / unsupported / malformed / inconsistent binding、missing permission、expired / duplicate / modified request、parse / display / crypto / core / store / binding / result verification failure、Relay / Node outage、internal exception、decryption failure、partial UI、result unknown で no sign / no success。availability と security failure を区別している。                                                           |
| 14. Software / Supply-Chain Integrity | Pass with `DR-SEC-001` optional improvement。official distribution、tamper detection、version / dependency management、review、migration、debug / production separation、incident boundary を §4.3、§15.2、§16、§18 で定める。具体 CI / SBOM / artifact operation は正しく委譲されるが、Mainnet evidence gate の common statement が必要。                                                                                                |
| 15. Security Invariants               | Pass。§17 の12 invariantを全件確認した。secret no external boundary / plaintext persistence、untrusted input、inspect-before-sign、reviewed payload equality、one-to-one operation、per-sign auth、external compromise non-escalation、no secret logs、fail-closed、own UI、incident invalidation が Architecture / Requirements と整合する。Mainnet gate は別途 `DR-SEC-001` の traceability gap。                                       |
| 16. Responsibility Boundary           | Pass。Application / trusted host が caller、permission、inspection、display、auth、approval、orchestration、wallet-core が secret / Store / crypto / raw signing、SDK が handoff / correlation、Relay が opaque delivery、Node が auxiliary data、OS が限定保護、user が explicit judgment を担う。最終判断主体は host Signer と明確で、空白・重複・矛盾は確認されない。                                                                  |

## 14. Validation Results

| 検証                                                                                     | 結果                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --write docs/reviews/design/security-design-review-005.md`           | `ERR_SQLITE_ERROR: unable to open database file` で失敗。pnpm launcher の environment error と確認                            |
| `./node_modules/.bin/prettier --write docs/reviews/design/security-design-review-005.md` | PASS。上記 environment error の代替として local executable を実行                                                             |
| `pnpm exec prettier --check docs/reviews/design/security-design-review-005.md`           | `ERR_SQLITE_ERROR: unable to open database file` で失敗。pnpm launcher の environment error と確認                            |
| `./node_modules/.bin/prettier --check docs/reviews/design/security-design-review-005.md` | PASS。artifact 単体の Markdown formatting を確認                                                                              |
| Internal link check                                                                      | PASS。artifact 内の相対リンクを抽出し、既存 target path を確認。存在しない `_snwc` binding decision はリンク化していない      |
| Finding ID / continuity check                                                            | PASS。`SD-SEC-001`〜`005`、`SD-REVIEW-001`〜`003` の resolved status と `DR-SEC-001` / `DR-SEC-002` の detail / status を照合 |
| Severity / status / gate check                                                           | PASS。Critical 0、Major 0、Minor 2、Required Changes なし、Optional Improvements 2、`READY` の整合を確認                      |
| Requirements / Architecture / Security Invariants traceability check                     | PASS。Common、Browser、Mobile、Relay、SDK、Architecture `DR-003`、Mainnet gate、§17 の12 invariantを artifact に追跡          |
| Change scope                                                                             | PASS。`git status` / `git diff --name-only` で review artifact 以外の変更がないことを確認                                     |
| `git diff --check`                                                                       | PASS。commit 前後の whitespace error なし                                                                                     |

Not validated: docs-only review artifact のため、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、package / app の実装検証は実行対象外とした。pnpm formatter は環境エラーで失敗したため、repository-local Prettier で同等の artifact formatting / check を実行した。`_snwc` の absent binding decision の exact content は未確認である。

## 15. Review Gates

| Gate                                         | 判定 | 根拠                                                                                                                                                    | 対応 ID                    |
| -------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1. 目的と範囲                                | Pass | §1〜§2 が共通 security policy、対象主体、Mobile 未実装の境界、下位詳細の委譲を定める                                                                    | なし                       |
| 2. Context / responsibility / trust boundary | Pass | §3〜§5、§11、§18 が trusted signer、untrusted input、wallet-core、OS、Relay、Node、SDK の境界を定める                                                   | なし                       |
| 3. Dependencies / direction                  | Pass | SDK / Relay / Node / OS / wallet-core の責任逆流を禁止し、crypto / protocol / OS detail を正しい owner へ委譲する                                       | なし                       |
| 4. Main flows                                | Pass | §7〜§11、§15 が request、inspection、approval、auth、sign、result、replay、restart、incident の安全側条件を定める                                       | なし                       |
| 5. Data ownership                            | Pass | §6、§12、§13、§18 が secret、sensitive metadata、public identity、Wallet Store、temporary state の owner / retention を定める                           | `DR-SEC-002`               |
| 6. Security / interoperability               | Pass | §3、§6〜§11、§14〜§18 が four conditions、chain / network separation、Relay / Node non-authority、fail-closed、invariants を定める                      | `DR-SEC-001`, `DR-SEC-002` |
| 7. Upstream consistency                      | Pass | Requirements、Architecture、Profile、Handoff、wallet-core、ADR / release evidence と重大な意味矛盾なし。Mainnet / Relay の明示性は optional improvement | `DR-SEC-001`, `DR-SEC-002` |
| 8. Downstream implementability               | Pass | high-level ownership / invariants と委譲先は一意。下位仕様が E2E Relay / Mainnet gate の詳細を実装でき、target の2件は Critical ではない                | `DR-SEC-001`, `DR-SEC-002` |

全8 Gate は Pass。`DR-SEC-001` / `DR-SEC-002` は Minor の Optional Improvements であり、formal gate failure ではない。

## 16. Remaining Risks and Open Decisions

- Mobile App は current workspace に未実装であり、Mobile OS protection、biometric capability、Binding integration、lifecycle、backup / migration は下流 open item のままである。
- Relay / E2E の具体 protocol、credential、retention、state、storage、metadata policy、および SDK の transport / caller binding は下位正本で確認する。`DR-SEC-002` が解消されるまで、target 単独では TLS-only と E2E opaque の区別を読み手が補う必要がある。
- Mainnet release evidence の evaluator、trusted key、artifact、policy、build embedding、runtime enforcement の具体運用は release / operation の責務である。`DR-SEC-001` はその詳細を要求せず、target の high-level fail-closed traceability だけを求める。
- `SEC-OPEN-002`、`SEC-OPEN-004`、Profile-wide backup、chain supported scope、wallet-core host Binding は、既存の共通 invariant を弱めない範囲で下流へ引き継ぐ。
- 現行実装、tests、fixtures が全 platform / milestone の要求を満たすかは本レビュー対象外であり、Implementation / Release Readiness Review で確認する。

## 17. Automatic Changes

レビュー中に Security Design、Architecture、Requirements、Specification、実装コード、テスト、README、設定は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

**`READY` — `SECURITY DESIGN READY`**

Critical / Major の未解決 finding はなく、Minor 2件は Optional Improvements として明示的に引き継いだ。主要な Threat Model、Trust Boundary、Secret ownership / lifecycle、Signing Authorization、Permission / Replay、Relay / Node boundary、Security Invariants、Requirements traceability および Architecture / 他 Design の responsibility boundary は Security Design として成立している。
