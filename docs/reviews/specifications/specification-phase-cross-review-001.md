# MosaicLynx Specification Phase 最終横断レビュー

## 1. Review Target

- **対象:** `docs/specifications/` 配下の現行 Specification 全体
- **確認対象:** `browser-extension.md`、`chain-compatibility-spec.md`、`interfaces.md`、`mobile-app.md`、`product-spec.md`、`profile-account-spec.md`、`relay.md`、`sdk.md`、`signing-protocol.md`、`web-transaction-handoff-spec.md`
- **対象 revision:** `64dff64fb8ed9f74d31422da359bc310e19fe9d4`（レビュー開始時の `main`）
- **確認日:** 2026-08-29
- **レビュー種別:** Specification Phase の cross-document final review
- **成果物:** `docs/reviews/specifications/specification-phase-cross-review-001.md`
- **変更範囲:** 本レビュー成果物のみ。Specification、Requirements、Design、ADR、既存 review artifact、OPEN 原文および source は変更していない。

個別 Specification の過去レビューは finding history、resolved finding、対象 revision および OPEN history の確認に限って使用した。今回の判定は現行 Specification 本文を直接照合して行った。

## 2. Execution Audit

### 適用した規約とレビュー方法

- 最新の `spec-review` Skill、`review-common`、`reviewers`、`review-gates`、`output-format` を確認した。
- `AGENTS.md` の artifact layout、source-of-truth、変更範囲、validation、commit / push 規約を適用した。
- `.agents/project-context.md` は補助的な repository context としてのみ参照し、製品仕様の normative authority にはしていない。
- サブエージェントは使用していない。Chair が Reviewer A（contract）、Reviewer B（semantics / operations）、Reviewer C（security / interoperability）の観点を別々に走査し、反証、重複排除、統合を行った。

| 観点                                     | 実施内容                                                                                                                                           | 結果                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Reviewer A — Contract                    | authority、request / response、field、operation、type、state、error、result、version / capability を10件の現行本文で突合した。                     | 6件の Major な contract / completeness issue を記録。                                                               |
| Reviewer B — Semantics / Operations      | Four Conditions、lifecycle、recovery、Relay transport、Mainnet gate、OPEN、Requirements → Design → Specification を照合した。                      | 共通 semantics は概ね整合。Handoff の backend 固定、traceability、backup の不整合を記録。                           |
| Reviewer C — Security / Interoperability | Account / Profile / Chain / Network binding、trusted inspection、secret boundary、E2E Relay、unknown / delivery、adversarial scenario を確認した。 | Relay / secret / four-condition boundary は整合。Product の旧 public contract と Browser lifecycle の曖昧さを記録。 |
| Chair — Integration                      | 個別レビューの READY を仮定せず、仕様間の authority、責任、意味および phase boundary を反証した。                                                  | `REVISE SPECIFICATION`。                                                                                            |

レビュー開始時の worktree は `main` かつ clean であった。

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
- [`browser-extension.md`](../../specifications/browser-extension.md): Browser observed caller、Provider、trusted UI、Profile / Account、Chrome lifecycle、local signer。
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

現行 Specification は、安全性の中核である Four Conditions、trusted inspection、wallet-core boundary、Relay の opaque / untrusted boundary、`RESULT_UNKNOWN` と `deliveryDisposition` の基本分離、Profile / Account / Chain / Network binding、Mainnet fail-closed を概ね共有している。

しかし、次の blocking cross-document issue が残っている。

- Product の旧 public API が common / Handoff / SDK / Browser contract と競合し、internal Account selector、別 operation 名、bare result、別 field を normative に見せている。
- Provider の `connect` collection と SDK / Handoff の singular active account の mapping が定義されていない。
- Browser の popup / tab close が、common rule の除外する lifecycle loss から `RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` を生成し得るように読める。
- Handoff が Node.js / Redis / Lua / Pub/Sub / Redis TTL を固定している一方、Relay Specification は storage backend / deployment topology を `OPEN-RELAY-002` として未決にしている。
- Handoff、Product、Profile、Chain に、主要契約を Requirements → Design → Specification へ逆追跡できる traceability が不足している。
- 将来 backup capability について、Product と Profile が暗号・削除契約を異なる粒度で規範化しているが、共通の OPEN / owner がない。

したがって、個別 review の `READY` は維持したまま history として扱うが、Specification Phase 全体は Implementation へ移行できない。

| Severity | New / Open / Reopened | Resolved history |
| -------- | --------------------: | ---------------: |
| Critical |                     0 |                0 |
| Major    |                     6 |                0 |
| Minor    |                     1 |                0 |

## 5. Summary

### 横断判定

| 項目                                | 判定            | 要約                                                                                                                                                                                   |
| ----------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract authority                  | **Fail**        | common authority は Interfaces / Signing Protocol / Handoff に寄せられているが、Product の旧 public contract と Browser の `signMessage` mapping が未整理。`SPCR-001`、`SPCR-007`。    |
| Responsibility / trust boundary     | **Pass**        | SDK、Browser、Mobile、wallet-core、Relay、release authority の基本責任は一貫。Relay に signer authority はない。                                                                       |
| Four Conditions                     | **Pass**        | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は独立必須条件として全 trusted Signer 経路で同じ context に binding。                            |
| Request / response                  | **Fail**        | Product field / result、Provider collection、`signMessage` と `signData` の外部 mapping が一意でない。`SPCR-001`、`SPCR-002`、`SPCR-007`。                                             |
| `RESULT_UNKNOWN`                    | **Conditional** | Common / Mobile / Relay / SDK は正しい。Browser の close 表記だけが Signer-side generation uncertainty を超えて読める。`SPCR-003`。                                                    |
| `deliveryDisposition`               | **Conditional** | `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は trusted Signer-side として整合。Browser close 表記が delivery uncertainty の成立条件を曖昧にする。`SPCR-003`。                           |
| Recovery / re-sign                  | **Pass**        | known result の resend / redelivery / retrieval / lookup と new signing / re-sign を分離。automatic fallback / re-sign は導入されていない。                                            |
| State model                         | **Pass**        | common exact state set と Browser / Mobile / Relay / SDK local state は明示的に分離。Mobile `AUTHENTICATING` は wire state に昇格していない。                                          |
| Profile / Account / Chain / Network | **Conditional** | Common / Browser / Mobile は substitution を禁止。Product の `accountId` / `accountIds` が旧 selector authority として残る。`SPCR-001`、`SPCR-002`。                                   |
| Trusted inspection                  | **Pass**        | Browser / Mobile は target-derived data を trusted UI に表示し、dApp summary、URL、Relay metadata、hash-only を approval の代替にしていない。                                          |
| Secret boundary                     | **Pass**        | private key、Mnemonic、password、decrypted Store、E2E secret、transport credential、intermediate secret を public response / Relay / diagnostics に出さない。                          |
| Relay encryption boundary           | **Pass**        | Relay は E2E encrypted opaque payload を運び、structural validation と Signer semantic validation を分離。Handoff backend 固定だけが別問題。                                           |
| Lifecycle                           | **Pass**        | restart、process loss、permission / Profile change、generation change、duplicate、replay、stale response 後に old approval / authorization を復元しない。                              |
| Mainnet gate                        | **Pass**        | trusted Signer / release authority が gate owner。missing / invalid / expired / inconsistent / unverifiable / unknown は fail-closed、Testnet-only は不必要に止めない。                |
| Version / capability                | **Conditional** | common / downstream は未決を保持。Product の Provider API version と Handoff / SDK naming は明示的に接続されていない。`SPCR-001`、`SPCR-007`、existing OPEN。                          |
| Error semantics                     | **Pass**        | user rejection、validation、authentication、authorization、signing、transport、expiry、cancellation、unknown、delivery unknown の大枠は分離。Browser close の unknown 条件のみ要修正。 |
| OPEN                                | **Fail**        | existing OPEN は不用意に close されていないが、Handoff backend conflict と backup conflict が local OPEN として管理されていない。`SPCR-004`、`SPCR-006`。                              |
| Traceability                        | **Fail**        | Handoff / Product / Profile / Chain に主要契約の Requirements → Design → Specification mapping が不足。`SPCR-005`。                                                                    |
| Specification phase boundary        | **Fail**        | Handoff の具体 Redis 実装固定は Relay の OPEN と衝突。Product / Chain には concrete API / dependency / storage / test implementation の記述も残る。`SPCR-004`、`SPCR-005`。            |

## 6. Finding Status

| Finding    | Severity | Status              | 対象                                                | 判定                                                                                                   |
| ---------- | -------- | ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `SPCR-001` | Major    | Open                | Product / Interfaces / Handoff / SDK / Browser      | Product の page-facing API が common public Account、field、operation、result contract と競合。        |
| `SPCR-002` | Major    | Open                | Handoff / SDK / Browser / Product / Interfaces      | Provider `connect` collection と SDK / Handoff singular active account の cardinality mapping がない。 |
| `SPCR-003` | Major    | Open                | Browser / Interfaces / Signing Protocol             | Browser lifecycle close の `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` 条件が common exclusion より広い。    |
| `SPCR-004` | Major    | Open                | Handoff / Relay / Relay Design / Relay Requirements | Handoff の concrete Redis implementation と `OPEN-RELAY-002` が競合。                                  |
| `SPCR-005` | Major    | Open                | Handoff / Product / Profile / Chain                 | Requirements → Design → Specification traceability が主要契約について不完全。                          |
| `SPCR-006` | Minor    | Open / Future scope | Product / Profile                                   | Future backup の algorithm、envelope、削除 gate が同じ authority へ収束していない。                    |
| `SPCR-007` | Major    | Open                | Browser / Handoff / SDK / Interfaces / Mobile       | Provider `signMessage` と common / SDK / Handoff `signData` の operation / field mapping がない。      |

既存 individual review の finding ID は今回の横断 finding として再利用・上書きしていない。`OPEN-001` などの既存 OPEN も close していない。

## 7. Required Changes

### `SPCR-001` — Product public contract の common contract への収束

- **Location:** [`product-spec.md` §11.1 / §11.3 / §16](../../specifications/product-spec.md)、[`interfaces.md` §5.3 / §6.3](../../specifications/interfaces.md)、[`web-transaction-handoff-spec.md` §5.1 / §5.2](../../specifications/web-transaction-handoff-spec.md)。特に Product の `accountId`、`accountIds`、`activeAccountId`、`recipientPublicKey`、`Account[]`、bare `SignedMessage` / `SignedTransaction`。
- **Fact / condition:** Product は `accountId` を signing request selector として受け付け、`display name` を dApp へ返し、`signMessage` / `signTransaction` が bare result を返す shape を現在形で規範化している。Common / Handoff / SDK は public identity を `Scope + address + publicKey` に限定し、internal selector を禁止し、`expectedSignerPublicKey` と `MosaicLynxSigningResult<T>` / `signData` を使用する。
- **Existing authority:** common public identity / response / error / result は Interfaces、concrete SDK / Handoff API は Handoff と SDK、Provider boundary は Browser Extension が owner。Product はこれらを上書きしない。
- **Issue / impact:** dApp、SDK、Provider、Signer 間で別 field と別 result semantics が実装され得る。internal Account selector による Account substitution を許し、`RESULT_UNKNOWN` / `deliveryDisposition` の public semantics を失う経路も生じる。
- **Minimum fix / confirmation:** Product の current public contract を common / Handoff contract に更新するか、旧 shape を明確に historical / deprecated / out-of-scope として normative scope から除外し、必要な migration decision を owner 付き OPEN として記録する。新しい alias や selector を追加して解消してはならない。
- **Completion / recheck:** Product の public API、Account fields、signing result、concrete error が Interfaces / Handoff / SDK / Browser の一つの mapping へ収束し、`accountId` 等が external authority でないことを cross-review で再確認する。

### `SPCR-002` — Account response の型・cardinality mapping

- **Location:** [`web-transaction-handoff-spec.md` §5.1 / §5.2](../../specifications/web-transaction-handoff-spec.md) の `MosaicLynxActiveAccount` と singular `connect()`、[`sdk.md` §5](../../specifications/sdk.md) の singular return、[`browser-extension.md` §5.2](../../specifications/browser-extension.md) および Product §16 の collection return、[`interfaces.md` §6.3](../../specifications/interfaces.md) の `connected.account: PublicAccountIdentity`。
- **Fact / condition:** `MosaicLynxActiveAccount` と `PublicAccountIdentity` の field は現状同型だが、Provider / Product の `connect` は readonly collection、SDK / Handoff は singular active account である。複数の許可 Account から SDK の返す一件を選ぶ authority、または collection を SDK へ公開する mapping が定義されていない。
- **Existing authority:** Public Account field は Interfaces、SDK public return は SDK / Handoff、Provider adapter mapping は Browser / Handoff の境界で定義する。Profile default や page selector は authority ではない。
- **Issue / impact:** 複数 Account の接続・active Account・permission set の意味が実装者ごとに変わり、stale active Account、Account substitution、response cardinality mismatch を生じる。
- **Minimum fix / confirmation:** collection と active projection の関係、選択主体、空集合・複数件・refresh の response を existing contract だけで明示する。Provider-specific collection を残す場合も SDK / Handoff への一意な projection を定め、Product の旧 `Account[]` と共存させない。
- **Completion / recheck:** Browser → SDK → dApp と Mobile → SDK → dApp の Account response が同じ public identity semantics と明示的 cardinality mapping を持つことを確認する。

### `SPCR-003` — Browser lifecycle と unknown semantics の限定

- **Location:** [`browser-extension.md` §21](../../specifications/browser-extension.md) の popup / approval window close、§23 の `approval UI close / tab close`、および §20 / §22 の `RESULT_UNKNOWN` 限定。比較対象は [`interfaces.md` §10.3](../../specifications/interfaces.md) と [`signing-protocol.md` §6.2 / §19.3](../../specifications/signing-protocol.md)。
- **Fact / condition:** Browser は「popup / approval window close」「tab close」で「署名成否が不明なら `RESULT_UNKNOWN`」、「確定 result の配送だけが不明なら `DELIVERY_UNKNOWN`」と記載している。一方 common contract は SDK timeout、Provider disconnect、page / SDK / Relay lifecycle loss、response absence、delivery failure だけでは Signer が unknown を生成しないと明記する。
- **Existing authority:** `RESULT_UNKNOWN` は trusted Signer が signing generation 自体を確定できない場合だけ、`DELIVERY_UNKNOWN` は trusted Signer が valid signed result を保持した上で delivery disposition を確定できない場合だけ成立する。Browser close / page delivery 自体は authority ではない。
- **Issue / impact:** UI close または page lifecycle event だけで unknown を生成できる解釈が残り、transport / user cancellation と Signer generation uncertainty が混同される。既存 result recovery、再署名禁止および dApp の error handling が崩れる。
- **Minimum fix / confirmation:** Browser-specific close の記述を、trusted Signer が独立に確認した generation uncertainty が存在する場合だけ unknown とする条件へ限定する。generic close、tab close、Provider response loss、page delivery failure は common cancellation / invalidation / transport semantics に従い、単独では unknown を生成しない。
- **Completion / recheck:** Browser の全 close / crash / response-loss table と common exclusion list を再突合し、Signer-only origin と known-result retention を確認する。

### `SPCR-004` — Handoff と Relay の storage authority の整合

- **Location:** [`web-transaction-handoff-spec.md` §7.1 / §9.7](../../specifications/web-transaction-handoff-spec.md)、[`relay.md` §2.3 / §24 `OPEN-RELAY-002`](../../specifications/relay.md)、[`docs/design/architecture.md` §16〜§17](../../design/architecture.md)、[`docs/design/relay.md` §19.3](../../design/relay.md)。
- **Fact / condition:** Handoff は自己ホスト MVP について Node.js Relay、非永続 Redis、Redis Lua、Redis Pub/Sub、Redis absolute TTL、RDB / AOF / volume / backup 無効化、HMAC key を具体的に要求する。Relay Specification は storage engine、schema、queue、lock、CAS、broker、cluster、deployment を対象外とし、backend / topology を `OPEN-RELAY-002` として未決にしている。Architecture / Relay Design も具体 backend を委譲している。
- **Existing authority:** Handoff は endpoint、wire、credential、E2E、generation、TTL、HTTP の protocol authority。Relay の storage / deployment choice は Relay operation / design authority に委譲され、現在 `OPEN-RELAY-002` である。
- **Issue / impact:** Handoff を実装すると Relay OPEN を暗黙に close することになり、異なる storage / deployment を選ぶ実装は Handoff 非準拠となる。protocol contract と implementation choice が逆転し、phase boundary も逸脱する。
- **Minimum fix / confirmation:** Handoff の concrete Node.js / Redis implementation paragraph を protocol requirement から分離し、Relay operation / design の決定または既存 OPEN へ戻す。論理 state、bounded retention、state loss、opaque boundary、security invariant は維持し、backend を今回の review で決定しない。
- **Completion / recheck:** Handoff と Relay の endpoint / logical lifecycle は一致し、backend / topology の authority と OPEN owner が一意であることを確認する。

### `SPCR-005` — Requirements → Design → Specification traceability の補完

- **Location:** [`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)。これらには主要契約を Requirement ID、Design section、current Specification section へ対応付ける traceability section がない。一方 Requirements / Design と Interfaces / Signing / SDK / Browser / Mobile / Relay には traceability table がある。
- **Fact / condition:** Requirements の traceability は Handoff、Product、Chain、Profile を downstream source として参照するが、4条件、trusted inspection、wallet-core boundary、Relay boundary、request / response、result / delivery / recovery、Mainnet gate の coverage と OPEN owner を下流文書側から逆追跡できない。
- **Existing authority:** Requirements が要求、Design が responsibility / boundary、各 Specification が external contract を所有する。Traceability は新しい normative requirement を発明するものではない。
- **Issue / impact:** Implementation がどの requirement / design intent を満たすための contract かを監査できず、Product の旧 contract、Handoff の backend 固定、Profile / Chain の独立主張を自動的に検知できない。Specification phase の completeness gate を通せない。
- **Minimum fix / confirmation:** 各対象 Specification に traceability matrix を追加するか、repository-wide の canonical matrix を設け、少なくとも上記8契約について Requirement ID → Design section → Specification section → owner / OPEN を記録する。今回その source 文書を変更しない。
- **Completion / recheck:** matrix の各行が現行本文の section と対応し、missing / obsolete / conflict の状態が明示され、既存 OPEN を勝手に close していないことを確認する。

### `SPCR-006` — Future backup の scope / crypto authority

- **Location:** [`product-spec.md` §9.1](../../specifications/product-spec.md) と [`profile-account-spec.md` §16〜§18](../../specifications/profile-account-spec.md)。
- **Fact / condition:** 両文書は backup を Browser Extension 初回 milestone の必須機能ではない将来 capability とする点は一致する。しかし Product は current Profile password からの backup key、AES-256-GCM、unique salt / nonce、Mainnet Profile の未検証 backup 時の deletion refusal を規範化し、Profile は algorithm / KDF を実装時に安全な方式から選ぶ概念形式とし、削除条件も異なる。
- **Existing authority:** Profile / Account の backup format / lifecycle は Profile owner、Product は capability scope / user-visible product behavior owner。Common Requirements は backup を共通 contract にしていない。
- **Issue / impact:** 将来 capability 実装時に cryptographic envelope、restore verification、Mainnet deletion gate が二つの異なる契約へ分岐する。未決の security decision が OPEN として追跡されていない。
- **Minimum fix / confirmation:** 現行 milestone 外であることを保ったまま、どの文書が backup crypto / deletion contract を所有するかと、Product の具体値を requirement または future OPEN として扱うかを明記し、両文書を整合させる。現時点で algorithm を選択・close しない。
- **Completion / recheck:** future backup の scope、format、crypto policy、restore verification、deletion gate が一つの owner と decision record に追跡できることを確認する。

### `SPCR-007` — `signMessage` / `signData` operation mapping

- **Location:** [`browser-extension.md` §5.1 / §5.2](../../specifications/browser-extension.md) の page-facing `signMessage`、[`sdk.md` §5.2](../../specifications/sdk.md)、[`web-transaction-handoff-spec.md` §2 / §5.2 / §7](../../specifications/web-transaction-handoff-spec.md)、[`interfaces.md` §6.4 / §9.4](../../specifications/interfaces.md)、[`mobile-app.md` §10.3](../../specifications/mobile-app.md)。
- **Fact / condition:** Common logical operation、SDK、Handoff、Mobile wire は `signData` / `MESSAGE_SIGN` を使用する。Browser page-facing Provider は `signMessage` を使用するが、`signMessage` → `signData` の one-to-one operation mapping、`data` / `payload` mapping、`expiresAt` / `messageExpiresAt`、result mapping が一つの表として定義されていない。Browser は「既存 structured message」とだけ記述し、Handoff は SDK の `signData` を concrete にする。
- **Existing authority:** common operation / structured message は Interfaces、SDK public API / Handoff response は SDK / Handoff、Provider-specific page method は Browser の adapter boundary。`messageExpiresAt` と `expiresAt` の conflict は既存 `OPEN-001` であり、この finding で close しない。
- **Issue / impact:** Browser dApp と SDK / Mobile の operation、field、expiry、error / result が別 protocol として実装され、message signing が transaction signing や raw bytes signing へ誤射影される可能性がある。
- **Minimum fix / confirmation:** Provider method を `signMessage` とするなら、既存 common `signData` への明示的 adapter mapping と page-facing field / result / error semantics を定義する。canonical operation を変更する場合は Product / Browser / SDK / Handoff の authority を同時に更新する。新しい alias や expiry conversion を独断で追加せず `OPEN-001` を維持する。
- **Completion / recheck:** Extension と Mobile の両経路で、同一 request identity、`MESSAGE_SIGN`、structured message、Signer result、delivery / unknown mapping が一意になることを確認する。

## 8. Optional Improvements

現時点では、blocking finding の修正と既存 OPEN の owner / traceability の整理を優先する。追加の optional improvement は判定に影響しないため記録しない。

## 9. Resolved Findings

今回の cross-review で新たに resolved とした finding はない。既存の個別 review における resolved finding は history として維持し、今回の横断レビューで再利用・close・改名していない。

## 10. Deferred Findings

以下は current Specification 本文に記録されている既存 OPEN であり、今回勝手に close、rename または決定していない。

| Theme / owner                                   | Existing OPEN                                                                                                     | 横断上の扱い                                                                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structured message expiry                       | `interfaces.md` `OPEN-001`、Signing Protocol `OPEN-001`、Browser / Mobile の参照                                  | Handoff wire の `messageExpiresAt` と Core / Product の `expiresAt` は current mandatory `signData` に影響する。`SPCR-007` の completion に含めるが、今回解決しない。 |
| Capability identifier / negotiation             | Interfaces `OPEN-002`、Signing `OPEN-002`、SDK `OPEN-SDK-002`、Browser `OPEN-BEX-002`                             | 同じテーマの component mirror。Interfaces / applicable compatibility owner が canonical。未決のまま独自 field を追加しない。                                          |
| Common version matrix                           | Interfaces `OPEN-003`、Signing `OPEN-003`、SDK `OPEN-SDK-002`、Browser / Mobile の version OPEN                   | 同じ意味の mirrors であり、異なる version authority を主張していない。                                                                                                |
| Permission expiry / revocation                  | Interfaces `OPEN-004`、Signing `OPEN-004`、Browser `OPEN-BEX-004`、Mobile の permission OPEN                      | permission revision による現行 binding は確定。expiry / independent identifier は未決。                                                                               |
| Caller context / Origin outside handoff         | Interfaces `OPEN-005`、Browser `OPEN-BEX-003`、SDK `OPEN-SDK-005`、Mobile local OPEN                              | platform-specific proof と common identity の owner を混同しない。                                                                                                    |
| Aggregate / multisig / cosignature public scope | Interfaces `OPEN-006`、Signing `OPEN-005`、SDK `OPEN-SDK-004`、Browser `OPEN-BEX-006`、Mobile `MOB-OPEN-009`      | 同一の未決テーマを各 consumer が参照している。cosignature mandatory scope や result union を今回確定しない。                                                          |
| Transport / lifecycle recovery                  | Signing `OPEN-006`、Relay `OPEN-RELAY-003` / `004`、SDK `OPEN-SDK-003`、Browser `OPEN-BEX-004`、Mobile local OPEN | safe lower bound は共通化済み。具体 API、retry、lookup、resend は未決。Relay の concrete storage だけが `SPCR-004` の contradiction。                                 |
| Wallet-core binding                             | Signing `OPEN-007`                                                                                                | concrete host binding、warning / error、result uncertainty は未決。secret boundary と trusted Signer authority は確定。                                               |
| Relay generation / storage / operation policy   | Relay `OPEN-RELAY-001`〜`005`                                                                                     | `OPEN-RELAY-002` と Handoff §9.7 の concrete Redis paragraph が衝突するため `SPCR-004` で修正を要求。その他は close しない。                                          |
| Provider discovery / multiple Provider          | SDK `OPEN-SDK-001`、Browser `OPEN-BEX-002`                                                                        | selection policy 未決。malformed / conflicting Provider の silent fallback 禁止は確定。                                                                               |
| Future backup                                   | Product / Profile に明示的な OPEN なし                                                                            | 将来 capability の crypto / deletion divergence を `SPCR-006` として記録。owner が定まるまで backup implementation を開始しない。                                     |

### OPEN 重複・矛盾の判定

- 同じ番号の OPEN が異なる意味で使われている事実は確認しなかった。共通テーマの component-local mirror は、本文の cross-reference により識別可能である。
- ただし、同じテーマを local OPEN として mirror するだけで canonical owner が一覧化されていないため、`SPCR-005` の traceability completion に owner / source mapping を含める。
- `messageExpiresAt` / `expiresAt` は既存 `OPEN-001` として記録済みであり、未記録ではない。Handoff に独自 OPEN がないことは mapping の不足として `SPCR-007` に記録した。
- Handoff §9.7 の Redis 固定は Relay の `OPEN-RELAY-002` と相互に解釈できないため、単なる OPEN mirror ではなく `SPCR-004` の新規 cross contradiction である。
- backup の Product / Profile divergence は current MVP 外だが、どの OPEN にも戻されていないため `SPCR-006` として記録した。

## 11. Scope and Traceability

### Requirements → Design → Specification matrix

| Major contract                   | Requirements                                         | Design                                                                  | Current Specification                                                              | 判定                                                                                                         |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Four Conditions / trusted Signer | `CR-016`、`CR-AC-017`、`BR-005`、`MR-004`〜`MR-006`  | Signing Flow §16 / §23、Security Design §8〜§9、Browser / Mobile Design | Interfaces §9.7、Signing §8、Browser §17、Mobile §7                                | **Pass**。Signer authority、同一 context binding、pre-sign revalidation が一貫。                             |
| Trusted inspection               | `CR-002`、`CR-005`、`BR-005`、`MR-004`、`SDK-FR-006` | Signing Flow §4 / §8、Browser / Mobile Design inspection boundary       | Product §12、Chain Compatibility §4〜§6、Browser §16、Mobile §10                   | **Pass**。target-derived inspection と blind signing 禁止は一貫。                                            |
| wallet-core boundary             | `CR-013`、`SDK-SEC-001`〜`002`                       | Architecture §5 / §6.6、Security Design §17、platform designs           | Interfaces §14、Signing §18、Browser §16、Mobile §5、Chain Compatibility §6        | **Pass**。secret / raw signing authority は wallet-core 側。concrete binding は existing OPEN。              |
| Relay opaque boundary            | `RR-003`、`RR-008`、`RR-AC-006`〜`007`               | Relay Design §3 / §5 / §19、Architecture §16〜§17                       | Relay §4 / §9 / §20、Handoff §7〜§9、Mobile §9                                     | **Conditional**。opaque / structural boundary は Pass、backend fixed conflict は `SPCR-004`。                |
| Request / response contract      | `SDK-FR-005`、`SDK-SEC-003`〜`005`、`RR-001`〜`002`  | Interfaces Design §7 / §12、SDK Design §12、Signing Flow                | Interfaces §5〜§7、Handoff §5〜§7、SDK §5、Browser §5                              | **Fail**。Product legacy fields、Provider cardinality、`signMessage` mapping は `SPCR-001` / `002` / `007`。 |
| Result / delivery / recovery     | `RR-002`、`RR-NFR-002`、`SDK-AC-005` / `007`         | Signing Flow failure / recovery、Relay Design §25 / §28、SDK Design §15 | Interfaces §10.3 / §13、Signing §19、SDK §13、Mobile §12、Relay §14                | **Conditional**。core semantics は Pass、Browser close wording は `SPCR-003`。                               |
| Mainnet gate                     | `CR-NFR-006`、`CR-AC-008`、`SDK-AC-010`、`RR-011`    | ADR 0001、release evidence、Architecture §3 / §16                       | Interfaces §7.4、Signing §21.1、SDK §6.5 / §17、Browser §17、Mobile §17、Relay §20 | **Pass**。release authority、fail-closed、Testnet continuation が一貫。                                      |

### Traceability gap

Handoff、Product、Profile、Chain の各 Specification は、上流へのリンクや相互参照は持つが、主要 contract を Requirement ID → Design section → Specification section → owner / OPEN へ逆追跡する matrix を持たない。これは document style の問題に留まらず、今回発見した Product legacy contract、Handoff storage conflict、future backup divergence を gate 前に検知できない直接原因となっている。`SPCR-005` の completion condition とする。

## 12. Domain Checks

|   # | Check                               | 判定            | Evidence / finding                                                                                                                                                                                                                                                          |
| --: | ----------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Contract Authority                  | **Fail**        | Interfaces / Signing / Handoff を common authority とする方針はあるが、Product legacy public contract と Browser `signMessage` mapping が未整理。`SPCR-001`、`SPCR-007`。                                                                                                   |
|   2 | Responsibility / Trust Boundary     | **Pass**        | dApp / SDK は non-Signer、Browser / Mobile trusted host が Signer、wallet-core が secret / raw signing、Relay が opaque transport、release authority が gate owner。Relay に authentication-as-signer、approval、inspection、signing、unknown / delivery authority はない。 |
|   3 | Four Conditions                     | **Pass**        | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は独立し、connection、permission、capability、session、ordinary `UNLOCKED`、wallet-core success、Relay delivery で代替されない。                                                      |
|   4 | Request / Response                  | **Fail**        | `requestId` / `requestDigest` / operation / Scope / target / signer correlation の common semantics は整合するが、Product fields、Account cardinality、`signMessage` / `signData` mapping が不整合。`SPCR-001`、`SPCR-002`、`SPCR-007`。                                    |
|   5 | `RESULT_UNKNOWN`                    | **Conditional** | Common は trusted Signer の generation uncertainty に限定し、timeout / transport / Relay / response absence から生成しない。Browser close table の広い表現を `SPCR-003` で限定する。                                                                                        |
|   6 | `deliveryDisposition`               | **Conditional** | `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` は known signed result に付く Signer-side semantics。ACK、retrieval、HTTP 2xx、Relay state と分離。Browser close table の `DELIVERY_UNKNOWN` 条件を `SPCR-003` で限定する。                                                    |
|   7 | Recovery / Re-sign                  | **Pass**        | known signed result の resend / redelivery / retrieval / lookup と new signing / re-sign を分離。failure、unknown、timeout、delivery failure 後の automatic alternate Signer / Provider / transport はない。                                                                |
|   8 | State Model                         | **Pass**        | common exact state set は Interfaces / Signing Protocol。Mobile `AUTHENTICATING`、Mobile `LOCKED`、Relay lowercase transport state、SDK local `PENDING` / `TIMED_OUT` は wire / common state として扱われない。                                                             |
|   9 | Profile / Account / Chain / Network | **Conditional** | Common / Browser / Mobile は Profile substitution、Account substitution、wrong Chain / Network、stale active Account を拒否。Product の `accountId` / `accountIds` が旧 external selector authority として残る。`SPCR-001` / `002`。                                        |
|  10 | Trusted Inspection                  | **Pass**        | Browser / Mobile は target-derived summary、全 embedded / parent context、message content、Origin、Chain / Network、Account を trusted UI へ表示。dApp summary、external UI、URL、Relay metadata、hash-only、Node lookup は approval authority でない。                     |
|  11 | Secret Boundary                     | **Pass**        | Mnemonic、private key、derived secret、Profile password、decrypted Wallet Store、E2E secret、transport credential、intermediate buffers を page / SDK / Relay / logs / diagnostics へ露出しない。normal public signed result は secret と分離。                             |
|  12 | Relay Encryption Boundary           | **Pass**        | Relay は opaque encrypted bytes と必要最小限の metadata の structural validation / routing のみ。plaintext transaction、message、signed result、approval、secret を取得しない。                                                                                             |
|  13 | Lifecycle                           | **Pass**        | suspend / resume、restart、process termination、device lock、network loss、Relay restart / generation、permission revoke、Profile / Account change、duplicate、replay、stale response の後に old security context を復元しない。                                            |
|  14 | Mainnet Gate                        | **Pass**        | release authority / current evidence policy を trusted Signer が適用。missing / invalid / expired / unknown は Mainnet fail-closed。SDK、Relay、connection、Store、Testnet success、HTTP / ACK は代替でない。Testnet-only operation は不必要に止めない。                    |
|  15 | Version / Capability                | **Conditional** | authority を独自追加しない方針、unknown / incompatible の fail-closed、existing OPEN の維持は Pass。Product Provider API と Handoff / SDK operation / version mapping は `SPCR-001` / `007`。                                                                               |
|  16 | Error Semantics                     | **Pass**        | Handoff §10 の concrete code、Interfaces の logical categories、Signer outcome、delivery disposition を分離。Browser close wording の unknown conditionだけが `SPCR-003` の対象。                                                                                           |
|  17 | OPEN                                | **Fail**        | 既存 OPEN は保持されている。Handoff Redis decision が Relay OPEN と競合し、future backup divergence は OPEN がない。`SPCR-004`、`SPCR-006`。                                                                                                                                |
|  18 | Traceability                        | **Fail**        | Handoff / Product / Profile / Chain に主要契約の explicit Requirements → Design → Specification mapping がない。`SPCR-005`。                                                                                                                                                |
|  19 | Specification Phase Boundary        | **Fail**        | Handoff §9.7 の Node.js / Redis / Lua / Pub/Sub / Redis TTL は Relay OPEN / Design delegation と衝突。Product / Chain の concrete public API / dependency / storage / test implementation 記述も phase boundary の再確認対象。`SPCR-004`、`SPCR-005`。                      |

## 13. Validation Results

| Validation                                                                                                 | Result                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec prettier --check docs/reviews/specifications/specification-phase-cross-review-001.md`           | **Not validated by pnpm**。pnpm launcher が `unable to open database file` で失敗した。repository-local `./node_modules/.bin/prettier --check docs/reviews/specifications/specification-phase-cross-review-001.md` を代替実行し **Pass**。 |
| `./node_modules/.bin/prettier --write docs/reviews/specifications/specification-phase-cross-review-001.md` | **Pass**。成果物を formatter で整形した。                                                                                                                                                                                                  |
| `git diff --check`                                                                                         | **Pass**。                                                                                                                                                                                                                                 |
| Review artifact local links / referenced paths                                                             | **Pass**。成果物内の local reference path と既存 review link の存在を確認した。                                                                                                                                                            |
| Specification text / OPEN / cross-document occurrence audit                                                | Pass。10件の Specification と指定された Requirements / Design / policy / review history を直接確認した。                                                                                                                                   |
| Source build / runtime / Provider E2E / Relay integration / Mobile device / release evidence evaluator     | **Not validated**。今回の対象は Specification review artifact のみであり、これらは実装・runtime validation の範囲外。                                                                                                                      |

## 14. Review Gates

| Gate                               | 判定            | 根拠                                                                                                                                                                                                               |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gate 1 — Purpose / Scope           | **Pass**        | 全 `docs/specifications/` を対象にし、実装変更を行わない cross-document review として実施した。                                                                                                                    |
| Gate 2 — Contract                  | **Fail**        | Product legacy public contract、Account cardinality、`signMessage` / `signData` mapping が一意でない。`SPCR-001`、`SPCR-002`、`SPCR-007`。                                                                         |
| Gate 3 — Processing / Exceptions   | **Conditional** | common failure / unknown / delivery / recovery semantics は整合。Browser close の unknown condition は修正が必要。`SPCR-003`。                                                                                     |
| Gate 4 — Internal Consistency      | **Fail**        | Handoff Redis 固定と Relay `OPEN-RELAY-002` が直接競合し、Product / Profile backup にも future contradiction がある。`SPCR-004`、`SPCR-006`。                                                                      |
| Gate 5 — Verifiability             | **Fail**        | Handoff / Product / Profile / Chain の主要 contract に Requirements → Design → Specification traceability が不足。`SPCR-005`。                                                                                     |
| Gate 6 — Safety / Interoperability | **Conditional** | Four Conditions、trusted inspection、secret / Relay boundary、Profile binding、Mainnet fail-closed は Pass。public operation / Account mapping と Browser unknown ambiguity が interoperability / semantics risk。 |
| Gate 7 — Upstream Alignment        | **Fail**        | Requirements / Design は Relay backend、concrete storage、主要 ownership を委譲しているが Handoff が一部を固定し、Product の旧 public contract が downstream common contract に反する。                            |

未解消 Major finding があり、Internal Consistency、Verifiability、Upstream Alignment が Fail のため、Specification Phase は READY ではない。

## 15. Remaining Risks and Open Decisions

- `SPCR-001`、`SPCR-002`、`SPCR-007` を解消するまで、Extension Provider → SDK → dApp と Mobile Relay → SDK → dApp の同一 public contract を実装開始できない。
- Existing `OPEN-001`（`expiresAt` / `messageExpiresAt`）は current message-signing wire に直接影響する。今回 close していないため、`signData` の実装開始前に owner decision と adapter contract が必要である。
- `SPCR-003` を修正するまで、Browser UI close / tab close / Provider response loss の外部 failure semantics が Signer-only unknown と完全には区別できない。
- `SPCR-004` を解消するまで、Relay implementation がどの layer の decision を根拠に storage / deployment を選べるか不明である。`OPEN-RELAY-002` は維持する。
- `SPCR-005` を解消するまで、Requirements / Design と current normative contract の coverage を release / implementation review で再現可能に監査できない。
- `SPCR-006` は current Browser MVP 外だが、future backup を実装する場合の secret protection、restore verification、Mainnet deletion policy に影響する。
- `OPEN-002` / `OPEN-003`、permission expiry、caller proof、cosignature public scope、transport recovery、wallet-core binding は既存 OPEN として保持し、未決を capability / field / fallback の独自実装で埋めない。

## 16. Automatic Changes

なし。今回変更したのは本 review artifact のみである。Specification、Requirements、Design、ADR、過去 review artifact、OPEN 原文、source、test、manifest、lockfile は変更していない。

## 17. Final Decision

`REVISE SPECIFICATION`

`SPECIFICATION PHASE READY` とは判定しない。

理由は、未解消の Major cross-document finding が6件あり、Product public contract、Provider / SDK / Handoff mapping、Browser unknown semantics、Relay storage authority、traceability、future backup authority に修正または明示的な owner decision が必要だからである。

### Implementation readiness

**Not ready for Implementation phase.**

Four Conditions、trusted inspection、wallet-core boundary、Relay opaque boundary、secret handling、Mainnet gate、known-result recovery の安全下限は実装へ引き渡せる。しかし、request / response public contract、mandatory `signData` mapping、Account cardinality、Browser unknown condition、Relay backend authority、traceability が未完了であり、これらを解消して cross-review を再実施する必要がある。

### Required re-review condition

`SPCR-001`〜`SPCR-005`、`SPCR-007` の completion condition を満たし、`SPCR-006` の future owner / scope を記録したうえで、現行本文を直接再照合する。既存 OPEN は意図的に維持し、resolution または deferral の authority と影響範囲を matrix で確認する。
