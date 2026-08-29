# MosaicLynx Specification Phase 最終横断レビュー

## 1. Review Target

- **対象:** `docs/specifications/` 配下の現行 Specification 全体
- **確認対象:** `browser-extension.md`、`chain-compatibility-spec.md`、`interfaces.md`、`mobile-app.md`、`product-spec.md`、`profile-account-spec.md`、`relay.md`、`sdk.md`、`signing-protocol.md`、`web-transaction-handoff-spec.md`
- **対象 revision:** `053b3cfa831d52492e260a459297a14eb659a08c`（レビュー開始時の `main`）
- **確認日:** 2026-08-29
- **レビュー種別:** Specification Phase の最終 cross-document review
- **成果物:** `docs/reviews/specifications/specification-phase-cross-review-002.md`
- **変更範囲:** 本レビュー成果物のみ。Specification、Requirements、Design、ADR、既存 review artifact、OPEN 原文および source は変更していない。

個別 Specification の既存レビューは finding history、resolved finding、対象 revision および OPEN history の確認に使用した。今回の判定は、現行 Specification 本文を直接照合して行った。個別レビューの `READY` を現在の横断整合性の根拠とはしていない。

## 2. Execution Audit

### 適用した規約とレビュー方法

- 最新の `spec-review` Skill、`review-common`、`reviewers`、`review-gates`、`output-format` を確認した。
- `AGENTS.md` の artifact layout、source-of-truth、変更範囲、validation、commit / push 規約を適用した。
- `.agents/project-context.md` は補助的な repository context としてのみ参照し、製品仕様の normative authority にはしていない。
- Reviewer A（contract clarity / completeness）、Reviewer B（semantics / operations / traceability）、Reviewer C（security / interoperability）の観点を独立に走査し、Chair として finding の重複排除、severity、status、gate を統合した。サブエージェントは使用していない。

| 観点                                     | 実施内容                                                                                                                                                     | 結果                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Reviewer A — Contract                    | 10 Specification の authority、request / response、field、operation、type、state、error、result、version / capability を突合した。                           | `SPCR-009` を含む contract authority issue と、`SPCR-005` の completeness issue を記録。             |
| Reviewer B — Semantics / Operations      | Four Conditions、lifecycle、recovery、Relay transport、Mainnet gate、OPEN、Requirements → Design → Specification を照合した。                                | `SPCR-005`、`SPCR-008`、`SPCR-010` を記録。result / delivery / recovery の中核 semantics は整合。    |
| Reviewer C — Security / Interoperability | Profile / Account / Chain / Network binding、trusted inspection、secret boundary、E2E Relay、unknown / delivery、replay / stale、phase boundary を確認した。 | Relay / secret / Four Conditions は整合。Mobile platform gate と response authority の未収束を記録。 |
| Chair — Integration                      | 個別レビューの READY を仮定せず、現行本文と upstream / policy を直接反証した。                                                                               | `REVISE SPECIFICATION`。                                                                             |

### 個別レビュー履歴

| Specification                       | 最新 review artifact                                                   | 最新判定 | 今回の扱い                             |
| ----------------------------------- | ---------------------------------------------------------------------- | -------- | -------------------------------------- |
| Interfaces                          | [`interfaces-review-004.md`](./interfaces-review-004.md)               | `READY`  | history として確認。現行本文を再照合。 |
| Signing Protocol                    | [`signing-protocol-review-002.md`](./signing-protocol-review-002.md)   | `READY`  | history として確認。現行本文を再照合。 |
| SDK                                 | [`sdk-review-004.md`](./sdk-review-004.md)                             | `READY`  | history として確認。現行本文を再照合。 |
| Browser Extension                   | [`browser-extension-review-003.md`](./browser-extension-review-003.md) | `READY`  | history として確認。現行本文を再照合。 |
| Mobile App                          | [`mobile-app-review-003.md`](./mobile-app-review-003.md)               | `READY`  | history として確認。現行本文を再照合。 |
| Relay                               | [`relay-review-004.md`](./relay-review-004.md)                         | `READY`  | history として確認。現行本文を再照合。 |
| Product / Profile / Chain / Handoff | 個別の最新 review artifact は存在しない。                              | —        | 現行本文を直接確認。                   |

## 3. Evidence Used

### Repository instructions / review framework

- [`AGENTS.md`](../../../AGENTS.md)
- [`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)
- [`spec-review/reviewers.md`](../../../.agents/skills/spec-review/reviewers.md)
- [`spec-review/review-gates.md`](../../../.agents/skills/spec-review/review-gates.md)
- [`spec-review/output-format.md`](../../../.agents/skills/spec-review/output-format.md)
- [`review-common/review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)
- [`review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md)
- [`project-context.md`](../../../.agents/project-context.md)（補助 context のみ）

### Current Specifications

- [`interfaces.md`](../../specifications/interfaces.md): common identity、request / response、state、error、result / delivery、permission、Mainnet gate、OPEN。
- [`signing-protocol.md`](../../specifications/signing-protocol.md): transport-independent signing lifecycle、Four Conditions、unknown、recovery、retry、lifecycle。
- [`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md): SDK public API、Provider / Mobile adapter、Relay wire、HTTP、E2E、error、response mapping。
- [`sdk.md`](../../specifications/sdk.md): SDK API、route availability、Provider discovery、mapping、lifecycle、error、Mainnet gate。
- [`browser-extension.md`](../../specifications/browser-extension.md): Browser-observed caller、Provider、trusted UI、Profile / Account、Chrome lifecycle、local signer。
- [`mobile-app.md`](../../specifications/mobile-app.md): Mobile trusted host、App Link、Relay handoff、local lifecycle、trusted UI、OS boundary。
- [`relay.md`](../../specifications/relay.md): opaque transport、structural validation、transport state、retention、ACK / cancel、OPEN。
- [`product-spec.md`](../../specifications/product-spec.md): Product scope、public behavior、Profile / Account、Provider、inspection、release evidence。
- [`profile-account-spec.md`](../../specifications/profile-account-spec.md): Profile / Account、network isolation、secret and backup behavior。
- [`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md): Symbol / NEM、network、schema、serialization、fixed vectors、signing bytes。

### Upstream Requirements / Design / policy

- [`requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)
- [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)
- [`0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)
- [`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)、[`release-process.md`](../../release/release-process.md)、[`evidence-policy.json`](../../evidence/evidence-policy.json)

## 4. Review Result

`REVISE SPECIFICATION`

現行 Specification は、次の安全上の中核については横断的に整合している。

- Authentication、Signing-capable unlock、Account authorization、Explicit user approval の Four Conditions は、trusted Signer の独立条件として同一 request / target / Profile / Account / Chain / Network context に binding されている。
- Browser Extension と Mobile App は target-derived data を trusted UI に表示し、dApp summary、URL、通知、Relay metadata、hash-only、Node lookup を approval の代替にしていない。
- wallet-core は secret / raw signing の authority、Relay は opaque / untrusted transport であり、Relay に signer authority、approval、semantic inspection、result authority、Mainnet gate authority はない。
- `RESULT_UNKNOWN`、`deliveryDisposition`、known-result recovery / re-sign の分離は、各主要経路で同じ意味を保持している。

一方、次の blocking cross-document issue が残っている。

- 主要 contract を Requirements → Design → Specification へ逆追跡する explicit matrix が Product、Profile、Chain、Handoff に存在せず、cross-document authority の検証可能性が不足している（`SPCR-005`）。
- Mobile / Handoff が、上流で未決の OS protection、hardware capability、direct signing、backup / restore を current Mobile Mainnet gate の具体条件として規範化している（`SPCR-008`）。
- Interfaces と Handoff が同じ `RelayRequestBase` / `RelayResponse` を別の type 名・alias・authority で定義し、common field authority が一意に確定していない（`SPCR-009`）。
- Product の Mainnet evidence manifest が current Lite policy の required approval と一致せず、Lite と strict policy の条件が同じ normative text に混在している（`SPCR-010`）。

従って、個別 Specification の `READY` は history として維持するが、Specification Phase 全体は Implementation へ移行できない。

| Severity | Active New / Open / Reopened | Resolved history |
| -------- | ---------------------------: | ---------------: |
| Critical |                            0 |                0 |
| Major    |                            4 |                6 |
| Minor    |                            0 |                1 |

Active findings は `SPCR-005`、`SPCR-008`、`SPCR-009`、`SPCR-010` である。`SPCR-001`〜`004`、`SPCR-006`、`SPCR-007` は現行本文との照合により resolved history とした。

## 5. Summary

| 項目                                | 判定            | 要約                                                                                                                                                                                                                                             |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contract authority                  | **Fail**        | Common contract の intended owner は記述されているが、Interfaces と Handoff の concrete request / response declaration が重複し、type alias と protocol authority の関係が一意でない（`SPCR-009`）。                                             |
| Responsibility / trust boundary     | **Pass**        | dApp / SDK は non-Signer、Browser / Mobile trusted host が Signer、wallet-core が secret / raw signing、Relay が opaque transport、release authority が gate owner で一貫している。                                                              |
| Four Conditions                     | **Pass**        | 4条件は独立し、connection、permission、capability、session、ordinary `UNLOCKED`、wallet-core success、Relay delivery で代替されない。                                                                                                            |
| Request / response                  | **Fail**        | request / response の意味は概ね一致するが、Interfaces / Handoff の duplicate declaration と `PublicAccountIdentity` / `MosaicLynxActiveAccount` 等の alias authority が未収束（`SPCR-009`）。 `expiresAt` / `messageExpiresAt` は既存 OPEN-001。 |
| `RESULT_UNKNOWN`                    | **Pass**        | trusted Signer が signing generation 自体の成否を確定できない場合に限定され、timeout、network、Relay、response absence、ACK、delivery failure から生成しない。                                                                                   |
| `deliveryDisposition`               | **Pass**        | `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は known signed result に付随する Signer-side semantics であり、Relay state、HTTP、ACK、retrieval と分離されている。                                                                                  |
| Recovery / re-sign                  | **Pass**        | known result の resend / redelivery / retrieval / lookup と new signing / re-sign が分離され、自動 fallback / re-sign は導入されていない。                                                                                                       |
| State model                         | **Pass**        | Interfaces / Signing Protocol の common exact state set と Browser / Mobile / Relay / SDK local state が区別され、Mobile `AUTHENTICATING` は common wire state になっていない。                                                                  |
| Profile / Account / Chain / Network | **Pass**        | current Product / Browser / SDK / Mobile は public internal selector、Account substitution、Profile substitution、cross-chain、Mainnet / Testnet substitution、stale active Account を禁止している。                                             |
| Trusted inspection                  | **Pass**        | Browser / Mobile は target-derived inspection を trusted UI へ表示し、aggregate / embedded / multisig / cosignature の対象外・解析不能を blind / raw fallback にしない。                                                                         |
| Secret boundary                     | **Pass**        | Mnemonic、private key、Profile password、decrypted Wallet Store、E2E secret、transport credential、intermediate secret を外部境界・ログ・diagnostics に不要に出さない。 public signed result は secret と分離されている。                        |
| Relay encryption boundary           | **Pass**        | Relay は E2E encrypted opaque payload を短期搬送し、structural validation と trusted Signer semantic validation を分離している。                                                                                                                 |
| Lifecycle                           | **Pass**        | suspend、resume、restart、device lock、process loss、generation change、permission / Profile / Account change、duplicate、replay、stale response の後に旧 context を復元しない。                                                                 |
| Mainnet gate                        | **Fail**        | gate owner、fail-closed、Testnet-only continuation の骨格は一致するが、Mobile platform / backup 条件が upstream OPEN と衝突し、Product manifest が current Lite policy と不整合（`SPCR-008`、`SPCR-010`）。                                      |
| Version / capability                | **Conditional** | 独自 version / capability を追加しない方針と既存 OPEN は整合。ただし共通 contract declaration の authority 未収束により、実装時の version / capability input の参照先を再確認する必要がある。                                                    |
| Error semantics                     | **Pass**        | rejection、validation、authentication、authorization、signing、transport、expiry、cancellation、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` の大枠は分離されている。                                                                                    |
| OPEN                                | **Fail**        | 同じ numeric ID の意味衝突は確認しなかったが、Profile backup、Mobile platform gate、message expiry、capability、transport recovery の canonical owner / mirror が全 Specification で完全には整理されていない。`SPCR-005`、`SPCR-008`。           |
| Traceability                        | **Fail**        | Product、Profile、Chain、Handoff に、主要 contract の Requirement ID → Design section → Specification section → owner / OPEN の明示 matrix がない（`SPCR-005`）。                                                                                |
| Specification phase boundary        | **Fail**        | Handoff §7.5 と Mobile §17.2 が upstream で OPEN の platform / backup / hardware choice を具体的 current contract として固定している（`SPCR-008`）。                                                                                             |

## 6. Finding Status

| Finding    | Severity | Status           | 対象                                                             | 判定                                                                                                                                                                |
| ---------- | -------- | ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPCR-001` | Major    | Resolved         | Product / Interfaces / Handoff / SDK / Browser                   | Product の public Account / result / selector を current common contract へ収束したことを確認。                                                                     |
| `SPCR-002` | Major    | Resolved         | Handoff / SDK / Browser / Product / Interfaces                   | Provider collection と SDK / Handoff singular active account の mapping を Browser §5.2.2 で確認。                                                                  |
| `SPCR-003` | Major    | Resolved         | Browser / Interfaces / Signing Protocol                          | close、timeout、response absence、lifecycle loss だけでは unknown を生成しない限定を確認。                                                                          |
| `SPCR-004` | Major    | Resolved         | Handoff / Relay / Relay Design / Relay Requirements              | Handoff が Redis / backend implementation を固定せず、Relay `OPEN-RELAY-002` へ委譲していることを確認。                                                             |
| `SPCR-005` | Major    | Open             | Product / Profile / Chain / Handoff                              | 主要 contract の Requirements → Design → Specification explicit traceability が不足。                                                                               |
| `SPCR-006` | Minor    | Resolved history | Product / Profile                                                | Product が Profile `OPEN-PROFILE-001` を future backup の canonical owner として参照する形へ収束。関連する Mobile の current gate contradiction は新規 `SPCR-008`。 |
| `SPCR-007` | Major    | Resolved         | Browser / Handoff / SDK / Interfaces / Mobile                    | Browser `signMessage` と common `signData` / `MESSAGE_SIGN` の mapping を確認。expiry field conflict は既存 OPEN-001 のまま。                                       |
| `SPCR-008` | Major    | New / Open       | Mobile / Handoff / Mobile Requirements / Mobile Design / Profile | 上流 OPEN の Mobile platform / backup / hardware choices が current Mainnet gate として固定されている。                                                             |
| `SPCR-009` | Major    | New / Open       | Interfaces / Handoff / SDK                                       | concrete request / response declaration と alias の authority が重複している。                                                                                      |
| `SPCR-010` | Major    | New / Open       | Product / ADR / release evidence / evidence policy               | Product の二名承認要求が current Lite policy の release 1・security 0 と一致しない。                                                                                |

## 7. Required Changes

### `SPCR-005` — Requirements → Design → Specification traceability の不足

- **Location:** [`product-spec.md`](../../specifications/product-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)。これらには、他の主要 Specification にある `Traceability` 相当の explicit matrix がない。
- **Fact / condition:** Interfaces、Signing Protocol、Browser、Mobile、Relay、SDK には各自の traceability table がある一方、Product / Profile / Chain / Handoff は upstream link や相互参照を持つだけで、Requirement ID → Design section → Specification section → contract owner / OPEN を横断して逆追跡できない。
- **Existing authority:** 要求は Requirements、責務境界・intent は Design、external contract は Specification が担う。`AGENTS.md` の Source of Truth 順序に従い、レビュー成果物が新しい要求を発明してはならない。
- **Issue / impact:** 個別レビューでは READY でも、Product の public contract、Handoff の protocol、Chain の compatibility、Profile の backup owner のような cross-document divergence を再現可能な根拠付きで検知できない。Implementation がどの document / section を優先すべきかも一意に確認できない。
- **Minimum fix / confirmation:** 4文書それぞれに matrix を追加するか、共通の approved traceability artifact を別途所有させ、少なくとも Four Conditions、trusted inspection、wallet-core boundary、Relay boundary、request / response、result / delivery、recovery、Mainnet gate、主要 OPEN の owner / mirror を Requirement ID・Design section・Specification section へ対応付ける。今回のレビューでは追加・close・移管を決定しない。
- **Completion / recheck:** 主要 contract の全行が upstream requirement と design intent、current normative section、canonical owner、未決時の OPEN へたどれ、Product / Handoff / Profile / Chain の本文と matrix が一致することを再レビューする。

### `SPCR-008` — Mobile Mainnet gate が upstream OPEN の platform / backup choice を固定

- **Location:** [`mobile-app.md` §15.3、§17.2、§19.3、§27](../../specifications/mobile-app.md)、[`web-transaction-handoff-spec.md` §7.5](../../specifications/web-transaction-handoff-spec.md)、[`docs/requirements/mobile-app.md` MR-008 / MR-009 と `MR-OPEN-003` / `MR-OPEN-006`](../../requirements/mobile-app.md)、[`docs/design/mobile-app.md` §27](../../design/mobile-app.md#27-未決事項)。特に Mobile §17.2 の backup export / restore verification、Secure Enclave / hardware attestation、root / jailbreak、OS support 条件と Handoff §7.5 の OS matrix、Argon2id、wrapping、direct hardware signing の規定。
- **Fact / condition:** Mobile §17.2 は Handoff の current Mobile v1 Mainnet 条件として、OS-backed Vault wrapping、device lock / user presence、Secure Enclave 実操作または Android hardware attestation、support OS、backup export と別環境 restore verification を全て要求する。Handoff §7.5 はさらに iOS / Android の具体 API、algorithm、wrapping、import / restore および「direct hardware signing 非対応」を現在の contract として固定する。一方、Mobile §15.3 / §19.3 / §27、Mobile Requirements MR-008 / MR-009 / `MR-OPEN-003` / `MR-OPEN-006`、Mobile Design §27 は、これらの exact integration、direct signing capability、backup / restore、migration を未決としている。Requirements は Profile backup / restore を v1 全体の共通 completion condition に含めない。
- **Existing authority:** Mainnet gate の存在、gate failure / unknown 時の Mainnet disabled、Testnet-only continuation、release authority の ownership は確定している。しかし、platform matrix、OS-protected wrapping、hardware capability、direct signing、backup / restore の exact contract は Mobile Requirements / Design と Profile backup authority が decision を持つ領域であり、Handoff が未承認に固定してはならない。
- **Issue / impact:** Implementation が未承認の platform / cryptographic / backup choice を current normative behavior として採用する。特に unresolved backup capability を Mainnet gate の必須条件にすると、Profile `OPEN-PROFILE-001` と current release policy の解決前に Mainnet readiness を判定できず、将来の Testnet / Mainnet capability boundary も誤って固定される。これは security requirement の fail-closed 自体の問題ではなく、未決事項の premature closure と phase boundary の逸脱である。
- **Minimum fix / confirmation:** gate の authority、missing / invalid / expired / unknown 時の fail-closed、Testnet-only continuation は維持したまま、未承認の exact platform / backup / hardware conditions を Mobile / Handoff の current contract から除去して applicable OPEN / downstream authority へ委譲する。または、Requirements / Design / Profile / release authority 側で明示的に承認し、全参照先を同一決定へ更新する。どちらを選ぶかは今回決定しない。
- **Completion / recheck:** Mobile / Handoff / Product / Profile / Requirements / Design / release policy の Mainnet 条件が同一の owner と current policy を参照し、Mainnet の fail-closed と Testnet-only 継続を保ったまま、未決の backup / OS / hardware details が current normative requirement として残っていないことを確認する。

### `SPCR-009` — Interfaces と Handoff の concrete request / response authority 重複

- **Location:** [`interfaces.md` §6.2 / §6.3](../../specifications/interfaces.md)、[`web-transaction-handoff-spec.md` §5.1 / §7.1 / §7.2](../../specifications/web-transaction-handoff-spec.md)、同 Handoff §1 の「Web受け渡しprotocolは本書を適用する」という authority 文。
- **Fact / condition:** Interfaces は `RelayRequestBase`、`RelayOperation`、`RelayResponseBase`、`RelayResponse` を concrete logical shape として定義し、`PublicAccountIdentity` / `DeliveryDisposition` を使用する。Handoff は同じ `RelayRequestBase` と `RelayResponse` を再定義し、`MosaicLynxActiveAccount` / `MosaicLynxDeliveryDisposition` を使用する。Handoff の response union には Interfaces の `RelayResponseBase` が現れず、両文書は同じ `mosaiclynx.relay.v1`、field、outcome を別 declaration として記載している。両者の aliases が wire 上・型上完全同一であること、common field と Web-specific field の境界、どちらが canonical declaration かが明示されていない。
- **Existing authority:** Interfaces は common request / response / field authority を担い、Handoff は Web handoff の protocol-specific concrete contract と Handoff error code を担うという分担が本文に散在する。ただし、現在の declarations と Handoff §1 の広い override 文だけでは、実装者が一つの canonical type / field authority を選べない。
- **Issue / impact:** SDK、Provider、Mobile、Relay adapter が同じ JSON shape を偶然実装できても、公開 TypeScript 型、Account identity、delivery field、追加 field の必須性および versioning について別契約を実装し得る。request / response contract の unique authority という gate 条件を満たさず、cross-component interoperability と stale / result correlation の検証基準が曖昧になる。
- **Minimum fix / confirmation:** common field / type の canonical owner と、Handoff が具体化してよい protocol-specific portion を明示する。Interfaces の common declaration を参照するなら、Handoff の duplicate union を削除し、`MosaicLynxActiveAccount` / `MosaicLynxDeliveryDisposition` が common type の wire-identical alias であることを明記する。別の分割を採用する場合も、両文書、SDK、Browser、Mobile、Relay の authority table を同時に更新する。新しい alias、field、normalization を今回追加しない。
- **Completion / recheck:** requestId、requestDigest、operation、signer、Account identity、Scope、target、expiry、signed result、error、correlation、delivery field の一つずつについて canonical declaration と consumer mapping が一つになり、Handoff / SDK / Provider / Mobile / Relay が同じ response union を参照することを確認する。

### `SPCR-010` — Product Mainnet evidence manifest と current Lite policy の承認条件不整合

- **Location:** [`product-spec.md` §19 冒頭および `evidence-manifest.json` 記述](../../specifications/product-spec.md)、[`0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)、[`evidence-policy.json`](../../evidence/evidence-policy.json)、[`mainnet-release-evidence.md` Lite policy](../../release/mainnet-release-evidence.md)。
- **Fact / condition:** Product §19 の blockquote は Lite では二名承認等を `not-required` とする。一方、同 §19 の manifest normative description は `二名以上のsecurity/release承認者` を保持すると記載する。Current policy は `mode: lite`、`requiredApprovals.release: 1`、`requiredApprovals.security: 0`、`allowSameApproverMultipleRoles: true` であり、release evidence も Lite は one release approval、strict-only evidence は absent 時 `not-required` とする。
- **Existing authority:** Mainnet approval count と policy parameter は ADR 0001、`evidence-policy.json`、Mainnet release evidence が authority であり、Product はそれらを参照する。Mainnet capability の fail-closed と Testnet-only continuation は共通要求として維持する。
- **Issue / impact:** Current Lite を実装・検証する主体が、Product の二名記述を mandatory field と解釈するのか、policy の release 1 / security 0 を適用するのか決められない。逆に strict migration の条件が Lite に誤適用される可能性があり、Mainnet gate の required evidence / approval を一意に検証できない。
- **Minimum fix / confirmation:** Product の manifest requirements を current `mode` / policy parameter に条件付け、Lite と strict の fields / approval requirements を明確に分離する。または ADR / policy を承認済みの新しい current policy へ更新して Product と一致させる。今回のレビューで policy の値や strict migration を変更しない。
- **Completion / recheck:** current Lite manifest が release approval 1、security approval 0 の policy と矛盾なく検証でき、strict migration の条件は current Lite を阻害しない形で明示され、Browser / Mobile / SDK / Relay が同じ release authority を参照することを確認する。

## 8. Optional Improvements

現時点では、blocking finding の修正と canonical owner / traceability の整理を優先する。次は判定を直接変更しないが、修正後に検討できる。

- Handoff と Interfaces の contract table から、consumer 別 mapping と wire-level field presence を生成できるようにする。
- mirrored OPEN に canonical owner、mirror ID、decision authority、影響する component を一行で示す。
- Mainnet policy の current / strict distinction を Product、release evidence、evidence policy の共通用語で表す。

## 9. Resolved Findings

今回の current text の再照合で、過去 cross-review finding の次を resolved history とした。既存の review artifact や OPEN 原文は変更していない。

| Finding    | Current evidence                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPCR-001` | Product §11.3 / §16 が page-facing `PublicAccountIdentity` と internal selector の非公開を明記し、旧 `accountId` / `accountIds` / `activeAccountId` を requester authority として扱わない。 |
| `SPCR-002` | Browser §5.2.2 が Provider collection と SDK / Handoff singular active account の 0 / 1 / multiple / stale mapping を定義。                                                                 |
| `SPCR-003` | Browser §22.2 / §24.1 が close、timeout、response absence、Provider disconnect、lifecycle loss だけでは `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成しないと限定。                          |
| `SPCR-004` | Handoff §7.1 / §9.7 が temporary state / logical atomicity を要求し、storage engine、DB、Redis、CAS、process、deployment を Relay `OPEN-RELAY-002` へ委譲。                                 |
| `SPCR-006` | Product §5.2 / §9.1 / §11 と Profile `OPEN-PROFILE-001` が future backup technical / lifecycle authority を Profile に集約。Mobile の current gate issue は `SPCR-008` として分離。         |
| `SPCR-007` | Browser §5.2.3 が page `signMessage` を common `signData` / `MESSAGE_SIGN` へ一対一に mapping。`expiresAt` / `messageExpiresAt` の decision は OPEN-001 として維持。                        |

## 10. Deferred Findings

以下は current Specification に記録されている OPEN であり、今回 close、rename、選択または決定していない。

| Theme / canonical owner                         | Existing OPEN / reference                                                                                         | Cross-review status                                                                                                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structured message expiry                       | Interfaces / Signing `OPEN-001`、Handoff §7.1、Product / Core `expiresAt`                                         | **Deferred。** `messageExpiresAt` と `expiresAt` の alias / wire mapping を実装で暗黙に決めない。Handoff 側の explicit owner reference は `SPCR-005` / `SPCR-009` の再確認対象。                              |
| Capability / common version                     | Interfaces `OPEN-002` / `OPEN-003`、Signing `OPEN-002` / `OPEN-003`、SDK `OPEN-SDK-002`、Browser / Mobile mirrors | **Deferred。** Numeric ID の意味衝突は確認しなかった。独自 identifier / version field を追加しない。                                                                                                          |
| Permission expiry / revocation                  | Interfaces `OPEN-004`、Signing `OPEN-004`、Browser `OPEN-BEX-004`、Mobile mirrors                                 | **Deferred。** 現行 permission revision binding は確定。expiration / independent revocation identifier は未決。                                                                                               |
| Caller context / Origin                         | Interfaces `OPEN-005`、Browser `OPEN-BEX-003`、SDK `OPEN-SDK-005`、Mobile mirrors                                 | **Deferred。** Browser observed Origin と Mobile proof の境界は維持。                                                                                                                                         |
| Aggregate / multisig / cosignature public scope | Interfaces `OPEN-006`、Signing `OPEN-005`、SDK `OPEN-SDK-004`、Browser / Mobile mirrors                           | **Deferred。** consumer が optional scope を mandatory に昇格させない。                                                                                                                                       |
| Transport / lifecycle recovery                  | Signing `OPEN-006`、Relay `OPEN-RELAY-003` / `004`、SDK `OPEN-SDK-003`、Browser / Mobile mirrors                  | **Deferred。** retry、lookup、resend、resume の具体 API は未決。安全下限は共通化済み。                                                                                                                        |
| Wallet-core binding                             | Signing `OPEN-007`、Mobile / design mirrors                                                                       | **Deferred。** secret / raw signing authority は wallet-core、host integration は未決。                                                                                                                       |
| Relay generation / storage / resource policy    | Relay `OPEN-RELAY-001`〜`005`                                                                                     | **Deferred。** Handoff backend conflict は `SPCR-004` resolved。Relay は opaque / transport-only。                                                                                                            |
| Provider discovery / multiple Provider          | SDK `OPEN-SDK-001`、Browser `OPEN-BEX-002`                                                                        | **Deferred。** selection policy、fake / conflicting Provider の exact behavior は未決。                                                                                                                       |
| Future Profile backup                           | Profile `OPEN-PROFILE-001`、Mobile `MOB-OPEN-006` / `MR-OPEN-006`                                                 | **Deferred with contradiction.** Profile が technical owner であることは current Product と整合するが、Mobile / Handoff が backup verification を current Mainnet gate に含めており、`SPCR-008` が blocking。 |
| Mobile platform / release matrix                | Mobile `MOB-OPEN-001` / `003` / `008`、Mobile Requirements `MR-OPEN-003` / `008`、Mobile Design §27               | **Deferred with contradiction.** gate existence / fail-closed は確定、exact platform / hardware / runtime condition は未決。`SPCR-008` が blocking。                                                          |
| Mainnet approval policy                         | ADR 0001、`evidence-policy.json`、release evidence、Product §19                                                   | **Deferred with contradiction.** current Lite と Product manifest description の不一致を `SPCR-010` として記録。                                                                                              |

### OPEN 重複・矛盾の判定

- 同じ numeric OPEN ID が異なる意味に使われている事実は確認しなかった。`OPEN-001`、`OPEN-002` 等の component-local mirror は概ね同じテーマを指している。
- ただし、mirror の canonical owner / decision authority が全 Specification に明示されていない。特に Handoff の `messageExpiresAt`、Mobile の backup / platform mirrors、Product / Profile の future capability は、cross-review で owner と current contract の一致を再確認する必要がある（`SPCR-005`、`SPCR-008`）。
- 既存 OPEN を、実装上の都合で close または fallback に変換していない。
- `SPCR-008` と `SPCR-010` は単なる未決事項ではなく、未決・current policy の内容が別文書で mandatory contract として書かれているため、blocking contradiction / ambiguity と判定した。

## 11. Scope and Traceability

### Requirements → Design → Specification matrix

| Major contract                   | Requirements                                         | Design                                                                  | Current Specification                                                                           | 判定                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Four Conditions / trusted Signer | `CR-016`、`CR-AC-017`、`BR-005`、`MR-004`〜`MR-006`  | Signing Flow §16 / §23、Security Design §8〜§9、Browser / Mobile Design | Interfaces §9.7、Signing §8、Browser §17、Mobile §7                                             | **Pass。** independent gate、same context binding、pre-sign revalidation が一貫。                                                           |
| Trusted inspection               | `CR-002`、`CR-005`、`BR-005`、`MR-004`、`SDK-FR-006` | Signing Flow §4 / §8、Browser / Mobile Design                           | Product §12、Chain §4〜§6、Browser §16、Mobile §10                                              | **Pass。** target-derived inspection と blind signing 禁止が一貫。                                                                          |
| wallet-core boundary             | `CR-013`、`SDK-SEC-001`〜`002`                       | Architecture §5 / §6.6、Security Design §17、platform designs           | Interfaces §14、Signing §18、Browser §16、Mobile §5、Chain §6                                   | **Pass。** secret / raw signing authority は wallet-core。具体 Binding は OPEN。                                                            |
| Relay opaque boundary            | `RR-003`、`RR-008`、`RR-AC-006`〜`007`               | Relay Design §3 / §5 / §19、Architecture §16〜§17                       | Relay §4 / §9 / §20、Handoff §7〜§9、Mobile §9                                                  | **Pass。** Relay は opaque / structural transport。                                                                                         |
| Request / response               | `SDK-FR-005`、`SDK-SEC-003`〜`005`、`RR-001`〜`002`  | Interfaces Design §7 / §12、SDK Design §12、Signing Flow                | Interfaces §5〜§7、Handoff §5〜§7、SDK §5、Browser §5                                           | **Fail。** duplicate concrete declaration / alias authority が `SPCR-009`。                                                                 |
| Result / delivery / recovery     | `RR-002`、`RR-NFR-002`、`SDK-AC-005` / `007`         | Signing Flow failure / recovery、Relay Design §25 / §28、SDK Design §15 | Interfaces §10.3 / §13、Signing §19、SDK §13、Mobile §12、Relay §14                             | **Pass。** core semantics は一致。具体 recovery API は既存 OPEN。                                                                           |
| Mainnet gate                     | `CR-NFR-006`、`CR-AC-008`、`MR-013`、`RR-011`        | ADR 0001、release evidence、Architecture §3 / §16、Mobile Design §23.1  | Interfaces §7.4、Signing §21.1、SDK §6.5 / §17、Browser §17、Mobile §17、Relay §20、Product §19 | **Fail。** gate owner / fail-closed は一致するが、Mobile exact conditions と Lite approval description が不整合（`SPCR-008`、`SPCR-010`）。 |

### Traceability gap

主要 contract の consumer mapping は Interfaces / Signing / Browser / Mobile / Relay / SDK に分散して存在するが、Product、Profile、Chain、Handoff に同形式の requirement-to-design-to-spec matrix がなく、文書全体の canonical owner、mirror OPEN、phase boundary を機械的・レビュー可能に確認できない。これは単なる文書 style ではなく、今回の `SPCR-008`〜`010` を implementation 前に検知・解消するための gate evidence の不足である。

## 12. Domain Checks

|   # | Check                               | 判定            | Evidence / finding                                                                                                                                                                             |
| --: | ----------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Contract Authority                  | **Fail**        | Interfaces / Signing / Handoff の intended split はあるが、Interfaces / Handoff の concrete response declaration と aliases が一意でない（`SPCR-009`）。                                       |
|   2 | Responsibility / Trust Boundary     | **Pass**        | SDK / dApp は Signer 外、Browser / Mobile trusted host が Signer、wallet-core が cryptographic authority、Relay が opaque、release authority が gate owner。                                   |
|   3 | Four Conditions                     | **Pass**        | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は同一 context に独立 binding。                                                                          |
|   4 | Request / Response                  | **Fail**        | common fields の意味は一致するが、duplicate type / alias / authority が実装開始の一意性を阻害（`SPCR-009`）。                                                                                  |
|   5 | `RESULT_UNKNOWN`                    | **Pass**        | generation uncertainty のみ。timeout、network、Relay、absence、ACK、recipient offline、delivery failure から生成しない。                                                                       |
|   6 | `deliveryDisposition`               | **Pass**        | known result に付随する Signer-side `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN`。Relay `pending` / `response_available` / `consumed`、HTTP、ACK と分離。                                      |
|   7 | Recovery / Re-sign                  | **Pass**        | known result recovery と new signing を分離。automatic alternate Signer / Provider / transport / re-sign はない。                                                                              |
|   8 | State Model                         | **Pass**        | common exact states と Mobile / Browser / SDK / Relay local state を区別。 `AUTHENTICATING` は local。                                                                                         |
|   9 | Profile / Account / Chain / Network | **Pass**        | internal selector の外部指定、Profile / Account / Scope substitution、Symbol / NEM、Mainnet / Testnet の暗黙変換を禁止。                                                                       |
|  10 | Trusted Inspection                  | **Pass**        | Browser / Mobile の trusted UI が target-derived data を表示。external summary、URL、notification、Relay metadata、hash-only、lookup は代替でない。                                            |
|  11 | Secret Boundary                     | **Pass**        | Mnemonic、private key、derived secret、password、decrypted Store、E2E secret、credential、intermediate buffer を外部 / logs / diagnostics へ出さない。 public signed result は別。             |
|  12 | Relay Encryption Boundary           | **Pass**        | E2E encrypted opaque payload、structural validation、Signer semantic validation が分離。Relay は plaintext / approval / signed result / secret を扱わない。                                    |
|  13 | Lifecycle                           | **Pass**        | process / extension / app restart、lock、network loss、Relay generation change、permission revoke、Profile / Account change、duplicate / replay / stale 後に旧 security context を復元しない。 |
|  14 | Mainnet Gate                        | **Fail**        | release authority、fail-closed、Testnet continuation は一致するが、Mobile platform / backup conditions と current Lite approval requirements が不一致（`SPCR-008`、`SPCR-010`）。              |
|  15 | Version / Capability                | **Conditional** | 独自追加禁止と OPEN 維持は整合。ただし duplicate contract authority の再整理が必要。                                                                                                           |
|  16 | Error Semantics                     | **Pass**        | user rejection、validation、auth、authorization、signing、transport、expiry、cancel、unknown、delivery unknown を相互に変換しない。                                                            |
|  17 | OPEN                                | **Fail**        | numeric ID の意味衝突はないが、canonical owner / mirror の不足と current mandatory wording の contradiction がある（`SPCR-005`、`SPCR-008`）。                                                 |
|  18 | Traceability                        | **Fail**        | Product / Profile / Chain / Handoff の explicit matrix が不足（`SPCR-005`）。                                                                                                                  |
|  19 | Specification Phase Boundary        | **Fail**        | Handoff §7.5 / Mobile §17.2 が upstream OPEN の OS / hardware / backup choices を current contract に固定（`SPCR-008`）。                                                                      |

### Adversarial Cross-check

| Scenario                                                          | Cross-document result                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| malicious dApp → SDK → Relay → Mobile                             | **Safety pass。** SDK / Relay は trust anchor でなく、Mobile が source、integrity、Scope、Profile、Account、target、四条件を再検証する。Relay は opaque。                                                                 |
| forged / stale handoff                                            | **Safety pass。** AEAD、requestDigest、session / generation、expiry、recipient、Origin proof の不一致を fail-closed。旧 generation は復旧しない。                                                                         |
| request / Account / Chain / Network substitution                  | **Safety pass。** request、Profile、Account、Chain、Network、expected signer、target の binding と pre-sign revalidation が共通。                                                                                         |
| permission revocation / Profile change during approval            | **Safety pass。** revision / Profile-local context change で active request、approval、auth、authorization を失効させる。自動再開しない。                                                                                 |
| process loss during signing                                       | **Safety pass。** trusted Signer が signing generation 自体を確定できない場合だけ `RESULT_UNKNOWN`。process loss を transport failure と同一視しない。                                                                    |
| signed result generation 後の network loss                        | **Safety pass。** known signed result を `RESULT_UNKNOWN` に変換せず、Signer-originated disposition を保持し、recovery は既存 result に限定。                                                                             |
| Relay state loss / generation change                              | **Safety pass。** 旧 pending handoff は失効。Relay は unknown / result / disposition を生成しない。新 request は fresh context が必要。                                                                                   |
| duplicate / replay / stale response / delayed ACK                 | **Safety pass。** request correlation、generation、duplicate / consumed state、response validation、ACK と `deliveryDisposition` を分離。                                                                                 |
| extension / mobile restart、misleading external UI / notification | **Safety pass。** old approval / auth を復元せず、external display を trusted inspection の代替にしない。                                                                                                                 |
| Mainnet gate unavailable                                          | **Safety principle pass, contract readiness fail。** Mainnet は disabled / unavailable、Testnet-only は継続する。ただし exact Mobile gate conditions と approval policy の authority が未収束（`SPCR-008`、`SPCR-010`）。 |

## 13. Validation Results

レビュー成果物作成後に実行した結果を記録する。Specification、Requirements、Design、source、既存 review artifact は変更していない。

| Validation                                                                                                 | Result                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --check docs/reviews/specifications/specification-phase-cross-review-002.md`（初回）   | **Fail。** formatter が code style issue を報告したため、成果物だけを `pnpm exec prettier --write` で整形した。 |
| `pnpm exec prettier --write docs/reviews/specifications/specification-phase-cross-review-002.md`           | **Pass。** 対象 review artifact のみを整形した。                                                                |
| `pnpm exec prettier --check docs/reviews/specifications/specification-phase-cross-review-002.md`（整形後） | **Pass。** `All matched files use Prettier code style!`。                                                       |
| `git diff --check`                                                                                         | **Pass。** whitespace error なし。                                                                              |
| Repository-wide lint / typecheck / test / build                                                            | `Not run`。review artifact の Markdown-only 変更であり、repository instructions の対象外。                      |

## 14. Review Gates

| Gate                           | 判定            | 根拠                                                                                                                                                                                |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Purpose / scope             | **Conditional** | 各 Specification の目的と対象範囲は理解できるが、Handoff / Mobile の authority 文が downstream と upstream OPEN の境界を曖昧にする。                                                |
| 2. Contract                    | **Fail**        | Interfaces / Handoff の concrete request / response authority が一意でない（`SPCR-009`）。                                                                                          |
| 3. Processing / failure        | **Conditional** | unknown、delivery、recovery、lifecycle の安全下限は検証可能だが、Mobile Mainnet gate の exact conditions が upstream OPEN と競合（`SPCR-008`）。                                    |
| 4. Internal consistency        | **Fail**        | Mobile / Handoff platform gate、Interfaces / Handoff response declaration、Product / Lite policy に unresolved contradiction / ambiguity がある。                                   |
| 5. Verifiability               | **Fail**        | Product / Profile / Chain / Handoff の upstream traceability matrix がなく、policy / owner / OPEN まで独立検証できない（`SPCR-005`）。                                              |
| 6. Security / interoperability | **Conditional** | secret、Relay、Four Conditions、inspection、serialization の中核は pass。ただし response authority の曖昧さと未承認 platform choice は implementation interoperability を阻害する。 |
| 7. Upstream consistency        | **Fail**        | Mobile upstream OPEN と downstream current gate、ADR / evidence policy と Product manifest description が一致しない（`SPCR-008`、`SPCR-010`）。                                     |

Blocking Major finding が残るため、generic review gate に従い `READY` にはできない。

## 15. Remaining Risks and Open Decisions

- `SPCR-005` が解消されるまで、各文書の個別 `READY` を Specification Phase 全体の contract completeness とみなさない。
- `OPEN-001` の `expiresAt` / `messageExpiresAt`、capability / version negotiation、permission expiry / revocation、caller context、aggregate / cosignature scope、transport recovery、wallet-core binding は既存 OPEN として維持する。
- Profile backup の canonical owner は Profile `OPEN-PROFILE-001` に収束したが、Mobile / Handoff が backup verification を current Mainnet gate に書いている。`SPCR-008` の修正・再レビューが必要。
- current Lite gate は policy 上 release approval 1、security approval 0。Product §19 の manifest description を条件化または policy decision の更新なしに Implementation / release evaluator を確定してはならない（`SPCR-010`）。
- current workspace に Mobile App implementation は存在しない。今回の判定は Mobile specification / upstream consistency の判定であり、実装・runtime・実機・Store・release evaluator の検証ではない。

## 16. Automatic Changes

なし。今回変更したのは本 review artifact のみであり、finding を根拠に Specification、Requirements、Design、ADR、既存 review、OPEN 原文または source を自動修正していない。

## 17. Final Decision

`REVISE SPECIFICATION`

Active blocking Major finding は `SPCR-005`、`SPCR-008`、`SPCR-009`、`SPCR-010`。cross-document contradiction / authority ambiguity が残っており、Requirements → Design → Specification traceability と current Mainnet contract の一意性も不足しているため、Implementation Phase へ移行不可と判定する。

修正後は、少なくとも各 finding の completion condition を再確認し、10 Specification と upstream policy を同じ revision で横断再レビューすること。`READY` は、blocking finding がなく、common authority、security / responsibility boundary、Mainnet policy、traceability、external contract、phase boundary が全て一意かつ検証可能になった場合に限る。
