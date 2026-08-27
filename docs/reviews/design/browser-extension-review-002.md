# Browser Extension 基本設計レビュー 002

## Review Target

- 対象: [`docs/design/browser-extension.md`](../../design/browser-extension.md)
- Review ID: `browser-extension-review-002`
- 確認日: 2026-08-28
- レビュー種別: Browser Extension 基本設計の独立フル再レビュー
- 適用 Skill: [`design-review/SKILL.md`](../../../.agents/skills/design-review/SKILL.md)
- 前回レビュー: [`browser-extension-review-001.md`](./browser-extension-review-001.md)
- 変更範囲: レビュー成果物のみ。対象設計、仕様、実装、既存レビューは変更していない。

前回レビューの `READY` は今回の判定へ継承しない。前回成果物には正式な `DR-*` finding ID がなく、今回の過去 finding 状態は「正式 finding なし」とする。

## Execution Audit

以下を順に確認した。

1. `AGENTS.md` と [`.agents/project-context.md`](../../../.agents/project-context.md)
2. [`design-review/SKILL.md`](../../../.agents/skills/design-review/SKILL.md)
3. [`review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)
4. [`reviewers.md`](../../../.agents/skills/design-review/reviewers.md)
5. [`review-gates.md`](../../../.agents/skills/design-review/review-gates.md)
6. [`output-format.md`](../../../.agents/skills/design-review/output-format.md)

Reviewer A（構造・責務）、B（Security・Trust）、C（Flow・運用）、D（Traceability・下流引渡し）を同一担当者が独立した観点として実施し、その後 Chair として evidence、scope、severity、gate を再確認した。subagent は使用していない。

過去レビューは finding の再発確認と ID 状態確認に限って使用し、過去の Review Gate や `READY` を current evidence として採用していない。

## Evidence Used

### 対象・上位資料

- [`docs/design/browser-extension.md`](../../design/browser-extension.md)（全章）
- [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)
- [`docs/requirements/sdk.md`](../../requirements/sdk.md)

### 共通 Design と関連レビュー

- [`docs/design/architecture.md`](../../design/architecture.md)
- [`docs/design/security-design.md`](../../design/security-design.md)
- [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- [`docs/design/interfaces.md`](../../design/interfaces.md)
- [`architecture-review-004.md`](./architecture-review-004.md)
- [`security-design-review-004.md`](./security-design-review-004.md)
- [`signing-flow-review-004.md`](./signing-flow-review-004.md)
- [`interfaces-review-004.md`](./interfaces-review-004.md)

上記4件の共通 Design review は整合確認の背景資料として読んだが、それらの `READY` や Review Gate を今回へ自動継承していない。

### 関連 Design・Specification・ADR

- [`docs/design/mobile-app.md`](../../design/mobile-app.md)
- [`docs/design/relay.md`](../../design/relay.md)
- [`docs/design/sdk.md`](../../design/sdk.md)
- [`docs/specifications/browser-extension.md`](../../specifications/browser-extension.md)
- [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)
- [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)
- [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)
- [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)
- [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)
- [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)
- [`_snwc/docs/requirements/requirements.md`](../../../_snwc/docs/requirements/requirements.md)
- [`_snwc/docs/specifications/specification.md`](../../../_snwc/docs/specifications/specification.md)
- [`_snwc/docs/decisions/binding-implementation.md`](../../../_snwc/docs/decisions/binding-implementation.md)

下流資料は、責務境界、message signing の固定要求、wallet-core Binding の責務、result semantics、具体仕様への委譲範囲を確認するために使用した。下流の API、wire format、browser API、storage schema、具体 UI layout を基本設計へ要求していない。

## Review Result

**REVISE DESIGN**

## Summary

Browser Extension の基本的な trust boundary、browser 観測 Origin、Provider / Content Script の非権限化、trusted UI、navigation・reload・Service Worker lifecycle、request isolation、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、automatic fallback 禁止、wallet-core との cryptographic responsibility 分離は、上位資料と概ね整合している。

ただし、共通署名ゲート4条件を Browser Signer の独立した必須条件として明記できておらず、message signing の構造化 context / replay invariant と、署名成功結果に必要な signing-time context が不足している。また、上位で必須化済みの message signing を `OPEN` のまま残している。これらは下位 API の不足ではなく、Browser privileged layer の責務・security invariant・下流実装の成立条件に関わる。

- Critical: 2件（`DR-001`, `DR-002`）
- Major: 2件（`DR-003`, `DR-004`）
- Minor: 1件（`DR-005`）
- 合計: 5件

## Finding Status

| ID       | Severity | 今回の状態 | 概要                                                                               |
| -------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `DR-001` | Critical | New        | Browser Signer における共通署名ゲート4条件の独立性・owner・再検証が不明確          |
| `DR-002` | Critical | New        | message signing の structured context、message replay、raw fallback 禁止の設計不在 |
| `DR-003` | Major    | New        | signing result の Profile と signing-time 4条件 context の binding が不十分        |
| `DR-004` | Major    | New        | 上位で必須化・下流で具体化済みの message signing capability が `OPEN` に残る       |
| `DR-005` | Minor    | New        | SDK・Browser Specification・handoff・wallet-core 等への直接 traceability が不足    |

### 過去 finding の状態

`browser-extension-review-001.md` は Browser Extension について `READY` と判定しているが、正式な `DR-*` finding ID を記録していない。したがって、過去 finding の `RESOLVED` / `REOPENED` 対象はなく、今回の判定へ継承した finding もない。前回の `READY` は current Review Gate の根拠にしていない。

## Required Changes

### DR-001 — Critical

- Target: [`browser-extension.md §4, §5.3, §10, §12, §15, §20`](../../design/browser-extension.md:48)
- Facts / conditions:
  - Browser Design は `Authentication` と `Explicit approve/reject` を記載するが、`Account authorization` を責務・条件として明示していない。
  - `§12` の `AUTHORIZED` は「user approve + per-request auth」の2要素として記載され、`Signing-capable unlock` と `Account authorization` が同じ request の独立条件として含まれていない。
  - `§15` は一時的な signing-capable state を扱うが、それが共通ゲートの必須条件であること、Browser privileged layer が owner であること、他の状態が代替にならないことを確定していない。
  - `§10` の pre-sign revalidation は Profile と4条件それぞれの signing-time context を明示せず、`§20` の invariant も request-specific authentication と approval のみを明示する。
- Evidence:
  - 共通 Architecture は privileged layer が `Authentication`、`Signing-capable unlock`、対象 Profile / Chain / Network / Account の `Account authorization`、`Explicit approval` の全4条件を所有し、全て必須とする [`architecture.md §6.9`](../../design/architecture.md:210)。
  - Signing Flow は4条件を独立かつ同時に要求し、connection、permission、capability、session、ordinary `UNLOCKED`、過去の認証、wallet-core password / Store 成功を代替にしない [`signing-flow.md §4`](../../design/signing-flow.md:74)。
  - Interfaces も Application の Account authorization と privileged Signer の4条件 gate を分離している [`interfaces.md §8–9`](../../design/interfaces.md:350)。
- Problem: Browser Extension の最終 Signer が、4条件を同一 signing request に対する独立した必須 gate として成立・再確認・無効化・成功結果へ引き継ぐ設計になっていない。`Account authorization` の owner も Browser Application / privileged layer として確定していない。
- Impact: 実装が permission、account selection、session、ordinary unlock、以前の認証、wallet-core password / Store 復号成功を authorization や signing-capable unlock の代替として扱い、dApp / Provider / Content Script が gate の成立・変更・免除へ影響できる余地が残る。Profile / Account switch 後の pending authorization、pre-sign、success result が同じ4条件へ結び付かない場合、誤った Account からの署名や approval bypass につながる。
- Minimum correction: Browser privileged layer を4条件の唯一の orchestration owner として明記し、同一 request・Profile・Account・Chain / Network・target に対して `Authentication`、`Signing-capable unlock`、`Account authorization`、`Explicit user approval` の全てを独立に必須とする。connection / permission / capability / session / ordinary `UNLOCKED` / previous authentication / wallet-core password or Store validation は代替でないこと、signing 前に全てを再確認し、変化時に authorization / approval を失効させ、成功 result に signing-time 4-condition context を必須化することを追加する。具体的な認証方式、state name、wire schema は下位へ委譲してよい。
- Reconfirmation criteria: Browser Design の flow、lifecycle、security invariant、responsibility table に4条件と privileged owner が明示され、pre-sign と success result が4条件を全て同じ request / Profile / Account / target へ binding する。Provider / Content Script / SDK / dApp と wallet-core が gate を成立・変更・免除できないこと、および4条件のいずれかの失効が fail-closed になることを確認できる。

### DR-002 — Critical

- Target: [`browser-extension.md §10.1–10.3, §16, §20, §23`](../../design/browser-extension.md:268)
- Facts / conditions:
  - Browser Design は transaction の一般的な inspection 項目と `message` の存在には触れるが、message signing 固有の domain / purpose / nonce / issued・expiry / message replay binding / cross-purpose separation を必須 invariant として定めていない。
  - `§16` は aggregate / cosign / partial と NEM multisig を詳述する一方、structured message の caller・domain・purpose・nonce・有効期限を独立した署名対象・表示対象として扱わない。
  - `§23` は message signing の public operation と supported scope を未決として残している。
- Evidence:
  - 共通要求は v1 で message signing を必須とし、内容を利用者が確認でき、raw / uninspectable message fallback を許さない [`requirements.md CR-007-MSG`](../../requirements/requirements.md:175)。
  - Signing Flow は message を transaction と別の `MESSAGE_SIGN` context とし、caller / Profile / Account / Chain / Network / purpose / domain / nonce / issued・expiry / freshness / replay を binding する [`signing-flow.md §14`](../../design/signing-flow.md:359)。
  - Browser Specification は structured message の public operation、同じ message model からの表示・署名 bytes、replay 防止、raw arbitrary message 禁止を既に適用している [`browser-extension.md §16`](../../specifications/browser-extension.md:427)。
- Problem: Browser の基本設計が message signing を transaction signing と同じ共通 gate へ接続するだけでなく、message 固有の context separation と replay invariant を要求していない。`message` を任意 payload と解釈する余地があり、下流が structured message 契約を省略しても設計違反を検出できない。
- Impact: 同じ message の再利用、別 Origin / purpose / domain への cross-context replay、表示内容と署名 bytes の不一致、raw または unrenderable message の署名を Browser Signer が拒否できない設計になり得る。共通要求および message signing v1 の相互運用性を満たせない。
- Minimum correction: Browser Design に `MESSAGE_SIGN` を既存の structured message contract として適用することを明記し、browser observed caller、Profile / Account、Chain / Network、domain / purpose、message content、nonce、issued・expiry、request freshness / replay を inspection、approval、pre-sign、result に binding する。同一 trusted model が UI と signing input の根拠であること、raw arbitrary / uninspectable message fallback がないことも明記する。nonce の byte 長や具体 wire schema は Specification へ委譲してよい。
- Reconfirmation criteria: message signing の独立した Browser flow / invariant として、context separation、message-level replay protection、structured inspection、4条件、pre-sign revalidation、result binding、fail-closed が追跡できる。transaction と message の対応付けが operation の混同や raw fallback を許さないことを確認できる。

### DR-003 — Major

- Target: [`browser-extension.md §7.3, §10.2, §12, §20`](../../design/browser-extension.md:221)
- Facts / conditions:
  - response binding は request identity、session、origin、browsing context、operation、Account、Chain / Network、target を列挙するが、Profile と signing-time 4-condition context を列挙していない。
  - `SUCCEEDED` は「署名結果を検証し、request binding」とするのみで、署名時点の Authentication、Signing-capable unlock、Account authorization、Explicit approval の全てを success condition として要求していない。
  - `§20` の result invariant も origin / session / context / target / operation までで、Profile と signer、4条件の時点付き context が欠ける。
- Evidence: Signing Flow は成功結果の概念に元 request / caller、signer、Profile / Account、Chain / Network、exact target digest、signing-time 4-condition context、approval context を含め、全て検証できなければ success としない [`signing-flow.md §19`](../../design/signing-flow.md:500)。
- Problem: Browser Design の result binding が、署名対象を正しい request へ戻す相関だけでなく、正しい Profile と署名時点の全 gate が成立した結果であることまで保証していない。
- Impact: Profile switch、Account association change、lock、permission revision、approval/authentication state の変化を generic request binding が捕捉できない場合、署名自体が cryptographically valid でも Browser が誤った context の success として返し得る。delivery failure と signing-time authorization failure の境界も下流実装へ不適切に残る。
- Minimum correction: Browser の success invariant に、元 request、caller、tab / frame / document、Profile、Account、Chain / Network、operation、exact target または digest、signing-time の4条件、approval context を必須化する。これらの一つでも再検証不能、stale、context loss、unknown なら success を返さず、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の既存区分へ接続する。具体 response schema は下位へ委譲してよい。
- Reconfirmation criteria: pre-sign から wallet-core result validation、original recipient への delivery まで、Profile と4条件を含む同一 binding tuple が明示され、別 document への返却・古い authorization の success 化・delivery failure の再署名が拒否されることを確認できる。

### DR-004 — Major

- Target: [`browser-extension.md §23`](../../design/browser-extension.md:550)
- Facts / conditions: Browser Design は `message signing public operation and supported scope` を未決事項としている。しかし共通要求では message signing v1 が Browser を含む各 client の必須能力であり、現行 Browser Specification では `signMessage` / `MESSAGE_SIGN` と structured message の境界が定義済みである。
- Evidence:
  - 共通要求は Browser / Android / iOS の transaction signing と message signing を v1 の提供対象として固定している [`requirements.md OPEN-003`](../../requirements/requirements.md:455) および [`CR-007-MSG`](../../requirements/requirements.md:175)。
  - Browser Specification は `MESSAGE_SIGN`、structured message、caller / chain / network / purpose / nonce / expiry の binding を下位契約として固定している [`specifications/browser-extension.md §16`](../../specifications/browser-extension.md:427)。
  - Signing protocol は message の replay / cross-domain / cross-purpose 防止と raw fallback 禁止を定めている [`signing-protocol.md`](../../specifications/signing-protocol.md:475)。
- Problem: 既に上位要求・共通設計・下流仕様で capability の存在と security boundary が決まっている事項を Design の `OPEN` に戻している。実装者が message signing 自体を v1 外、任意 capability、または後続 scope と解釈する余地がある。
- Impact: `DR-002` の不足を固定化し、Browser と SDK / signing protocol の traceability を切断する。message signing を有効化しない、または transaction と異なる弱い approval / replay semantics で実装するリスクがある。
- Minimum correction: `OPEN` を message signing capability の有無ではなく、既定の structured message contract を Browser API / wire / expiry field へどう接続するかという下位統合事項へ限定する。v1 で `MESSAGE_SIGN` を提供し、DR-002 の invariant に従うことは Design で確定する。API 名、field 名、exact expiry window は Specification へ委譲してよい。
- Reconfirmation criteria: §23 の未決事項を上位決定と矛盾しない粒度へ修正し、Browser の message signing capability、structured inspection、replay / domain separation、共通4条件、結果 semantics が `requirements`、`signing-flow`、`browser-extension specification` へ追跡できる。

## Optional Improvements

### DR-005 — Minor

- Target: [`browser-extension.md §2, §22, §24`](../../design/browser-extension.md:9)
- Facts / conditions: §24 の traceability table は Concept、Browser requirements、Architecture、Security Design、Signing Flow、Interfaces、ADR までを主に対応付けるが、`docs/requirements/sdk.md`、`docs/design/sdk.md`、Browser Extension Specification、Signing Protocol、Web Transaction Handoff、Profile / Account Specification、Chain Compatibility Specification、wallet-core requirements / specification / Binding decision を直接対応付けていない。
- Evidence: SDK / Provider の authority 非付与、structured message、Profile-local Account authorization、chain-specific inspection、wallet-core Binding の責務は、上記の下流資料でそれぞれ具体化されている。対象 Design §22 は委譲先を一般化して記載するのみで、責務と根拠の対になった追跡行を提供していない。
- Problem: Browser Design の主要責務から、現行の SDK 契約・Browser Specification・message protocol・Profile / Account・chain compatibility・wallet-core 境界へ直接辿れないため、DR-001、DR-002 のような上位決定の取りこぼしをレビュー・実装時に検出しにくい。
- Impact: 仕様更新時の影響範囲、Browser privileged layer と下流 owner の境界、message / result / wallet-core への引渡し条件の確認コストが増える。安全性を直接破る欠陥ではないが、独立した Design review の再現性と downstream implementability を下げる。
- Minimum correction: §24 に、Browser の主要責務ごとに Requirements、Architecture / Security / Signing Flow / Interfaces、SDK、対象 Specification、必要な ADR / wallet-core decision、責任 owner を結ぶ traceability 行を追加する。API や DTO の列挙ではなく、責務・不変条件・委譲先の対応を記載する。
- Reconfirmation criteria: caller authority、4条件、Account authority、message signing、chain inspection、result unknown、wallet-core raw signing、Mainnet gate の各責務から、少なくとも一つの上位根拠と一つの下流契約・owner へ直接追跡できる。

## Resolved Findings

なし。前回 Browser Extension review に正式な finding ID がなく、今回 `RESOLVED` として継承する項目はない。前回の全体 `READY` 判定は過去記録であり、今回の解決判定を意味しない。

## Deferred Findings

以下は本レビューで不足 finding として扱わない。いずれも基本設計の責務・境界・主要 flow を保ったまま、Specification / Implementation に委譲されている。

- manifest field、Chrome / Firefox の具体 version、具体 browser API、frame observation / Origin canonicalization の実装方式
- Provider API、message type、DTO、JSON / wire schema、session protocol、delivery query / redelivery の具体形式
- exact storage API / schema、queue / mutex、timeout、retry count、lock timeout、rate limit、concrete state machine 名
- cryptographic parameter、nonce の exact format、署名 bytes、transaction schema、aggregate / cosignature の chain-specific encoding
- wallet-core Binding DTO、secret bytes の concrete handoff、Store migration、具体 error code mapping
- trusted UI の exact layout、文言、auth UI、account selector UI
- release CI / evidence format、distribution、concrete Mainnet build switch

ただし、これらの下流決定は `DR-001`〜`DR-004` の共通4条件、message signing invariant、result binding、fail-closed を弱めてはならない。

## Scope and Traceability

| Browser responsibility                         | Target sections     | Upstream / common owner                             | Downstream contract or boundary                                              | Assessment                              |
| ---------------------------------------------- | ------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| browser trust boundary / privileged Signer     | §5–6, §20–21        | Architecture, Security Design                       | Browser Specification, extension implementation                              | 基本境界は整合。4条件の明示は `DR-001`  |
| caller / Origin authority                      | §7–8, §20           | Browser requirements, Security Design               | Browser Specification の sender / tab / frame / document binding             | 整合                                    |
| Provider / Content Script non-authority        | §5.1–5.2, §21       | Architecture, Interfaces                            | SDK / Provider contract                                                      | 整合                                    |
| Profile / Account association と authorization | §5.4, §9, §10       | Requirements, Architecture, Interfaces              | Profile / Account Specification、wallet-core は identity / raw signing owner | authorization の4条件 owner が `DR-001` |
| common signing gate                            | §10, §12, §15, §20  | Architecture, Signing Flow, Interfaces              | Browser signer implementation                                                | `DR-001`                                |
| transaction / aggregate / cosign inspection    | §5.5, §10, §16      | Chain Compatibility, Signing Flow                   | Browser Specification、chain adapters                                        | 整合                                    |
| structured message signing                     | §10, §16, §20, §23  | Requirements, Signing Flow                          | Signing Protocol、Browser Specification、SDK                                 | `DR-002`, `DR-004`                      |
| lifecycle / invalidation                       | §12, §15, §18, §20  | Browser requirements, Architecture, Security Design | Browser Specification、extension runtime                                     | 整合                                    |
| result binding / unknown result                | §7.3, §12, §18, §20 | Signing Flow, Interfaces                            | Interfaces Specification、handoff                                            | `DR-003`。unknown 区分自体は整合        |
| SDK / Relay / transport boundary               | §3, §5.1, §21–22    | Architecture, SDK / Relay Design                    | SDK、Web Transaction Handoff、Relay                                          | 整合                                    |
| wallet-core cryptographic boundary             | §5.3, §13, §21      | Architecture, Interfaces                            | wallet-core specification / Binding decision                                 | 整合                                    |
| Mainnet capability gate                        | §9, §19, §22–23     | Browser requirements, ADR, release policy           | release evidence                                                             | 整合                                    |

## Domain Checks

| Check                                      | Result               | Basis / related finding                                                                                                                                                                           |
| ------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Browser Trust Boundary                  | 要修正               | Web page / SDK / Provider / Content Script を untrusted、privileged host を最終 Signer、wallet-core を crypto owner とする境界は明確。ただし4条件の owner / invariant が `DR-001`                 |
| 2. Caller / Origin Authority               | Pass                 | Browser observed Origin、tab / frame / document を authority とし、dApp / SDK / Provider / Content Script の自己申告を authority としない。navigation 等で失効する                                |
| 3. Provider / Content Script Boundary      | Pass                 | forwarding / correlation は担うが、unlock、authorization、approval、inspection、signing decision を担わず、直接 raw signing に到達しない                                                          |
| 4. 共通署名ゲート4条件                     | Fail                 | `Authentication` と approval は記載されるが、`Signing-capable unlock` と `Account authorization` の独立必須条件・owner・pre-sign / result context が不足（`DR-001`）                              |
| 5. Profile / Account Binding               | 要修正               | Profile / Network / Account / caller / target / approval の binding と失効は広く記載。ただし Profile と Account authorization、4条件の同一 request binding が不十分（`DR-001`, `DR-003`）         |
| 6. Account Authority                       | 要修正               | Application の association / selection と wallet-core の identity / key / raw sign は分離されるが、Account authorization の明示 owner が不足（`DR-001`）                                          |
| 7. Permission Model                        | Pass                 | Origin / Profile / Account / Chain / Network / revision に結び付き、connection / permission / session が signing gate の代替でない。revoke / revision で失効する                                  |
| 8. Request Ingress                         | Pass                 | ingress は untrusted とし、privileged layer が caller、request、freshness、permission、Profile / Account、Chain / Network、operation、target を検証する                                           |
| 9. Semantic Inspection                     | Pass                 | Browser が parse、validate、canonicalize、inspect し、unknown / unsupported / parse failure / unrenderable / wrong chain・signer を fail-closed とする                                            |
| 10. Trusted UI                             | Pass                 | Extension-managed UI が observed caller、Profile / Account、Chain / Network、operation、重要 target 内容を表示し、page DOM / dApp HTML に依存しない                                               |
| 11. TOCTOU / Pre-sign Revalidation         | 要修正               | caller / document / permission / target / approval の再確認はあるが、Profile と4条件全体の再確認が明示されない（`DR-001`）                                                                        |
| 12. Service Worker / Extension Lifecycle   | Pass                 | stop / restart / reload / browser restart で `LOCKED`、old session / approval / secret を復元せず、navigation / tab / frame / document loss で失効する                                            |
| 13. Concurrent Requests                    | Pass                 | request ごとに identity、caller context、session、Profile / Account、target、approval、recipient を分離し、approval reuse / cross-request mixing を禁じる                                         |
| 14. Result Binding                         | 要修正               | original request / caller context / target はあるが、Profile と signing-time 4-condition context が成功条件に不足（`DR-003`）                                                                     |
| 15. `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`  | Pass                 | signing outcome unknown と delivery-only failure を分離し、delivery failure を再署名の根拠にしない                                                                                                |
| 16. Automatic Fallback                     | Pass                 | Relay / alternate route / external failure で inspection、auth、origin、account、network を skip せず、明示的な fresh request を要求する                                                          |
| 17. Error Semantics                        | Pass with delegation | Design は invalid / unsupported / rejected / cancelled / expired / auth / lock / replay / signing / transport / unknown の意味を運用表で区別し、exact code は Interfaces Specification へ委譲する |
| 18. wallet-core Boundary                   | Pass                 | Extension が validation / approval 済み target のみ渡し、wallet-core の成功を caller authorization / user approval と解釈せず、crypto を再実装しない                                              |
| 19. Secret Handling                        | Pass                 | private key、mnemonic、password-derived secret、decrypted Store、temporary secret を page / SDK / Provider / Content Script / log / diagnostics へ出さず、memory-only とする                      |
| 20. Browser Storage / State Responsibility | Pass                 | Profile-local metadata、permission、session、pending request、approval / auth state の owner と lifecycle が示され、具体 schema は委譲される                                                      |
| 21. Chain / Network                        | Pass                 | Symbol / NEM、Mainnet / Testnet、chain-specific account / transaction semantics を混同せず、page 指定だけで確定しない                                                                             |
| 22. Message Signing                        | Fail                 | structured message context、message replay、domain / purpose separation、raw fallback 禁止が不足し、capability も `OPEN`（`DR-002`, `DR-004`）                                                    |
| 23. Aggregate / Cosignature                | Pass                 | outer / embedded / parent / expected signer / role / existing cosignature を full-context inspection し、hash-only / unrenderable は拒否する                                                      |
| 24. Mainnet Gate                           | Pass                 | Mainnet capability は evidence / release policy と結び付け、indeterminate / unmet は fail-closed とする                                                                                           |
| 25. Traceability                           | 要修正               | common Design への対応はあるが、SDK、Specification、handoff、Profile / Account、chain、wallet-core への直接追跡が不足（`DR-005`）                                                                 |
| 26. OPEN 項目                              | 要修正               | Browser / platform / protocol の具体 detail は妥当な OPEN。一方 message signing capability 自体の OPEN は上位決定と不整合（`DR-004`）                                                             |
| 27. Design フェーズ境界                    | Pass                 | manifest、API、schema、browser API、storage schema、state machine、crypto parameter、exact UI layout を finding にしていない                                                                      |

## Validation Results

- `pnpm exec prettier --write docs/reviews/design/browser-extension-review-002.md`: passed
- `pnpm exec prettier --check docs/reviews/design/browser-extension-review-002.md`: passed
- `git diff --check`: passed
- Markdown link の相対 target 確認: 51 links checked、missing 0
- finding ID の重複確認: `DR-001`〜`DR-005` の heading / status table が unique
- Review Gate と finding status の整合確認: passed。`REVISE DESIGN`、Critical 2件、Major 2件、Minor 1件で、Critical / Major を Required Changes に対応付けた
- `git status --short` / `git diff --name-only`: commit 前は新規レビュー成果物のみ。対象設計その他の本文変更なし

Source code の変更はないため、lint、typecheck、test、build は対象外とした。

## Review Gates

| Gate                                | Result | Evidence / blocking finding                                                                                                |
| ----------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1. Purpose / Scope                  | Pass   | local Browser Signer の範囲、non-goal、Mobile / Relay / node announce の境界が §1–3 にある                                 |
| 2. Context / Responsibility / Trust | Fail   | privileged layer の共通4条件・Account authorization owner が不足（`DR-001`）                                               |
| 3. Dependency Direction             | Pass   | Provider / Content Script → privileged host → chain integration / wallet-core の方向、wallet-core の非責務が明確           |
| 4. Major Flows                      | Fail   | signing flow が4条件全てと structured message context / success context を表現しない（`DR-001`, `DR-002`）                 |
| 5. Data Ownership                   | Pass   | secret、Profile-local state、permission、request、wallet-core key / Store の owner が概ね分離                              |
| 6. Security / Interoperability      | Fail   | 共通4条件の適用と message signing の replay / domain invariant が不足（`DR-001`, `DR-002`）                                |
| 7. Upstream Consistency             | Fail   | Browser の message capability を `OPEN` に戻し、共通 gate の明示が上位要求に追随していない（`DR-001`, `DR-002`, `DR-004`） |
| 8. Downstream Implementability      | Fail   | 4条件、message model、success result context の実装前提が一意に固定されない（`DR-001`, `DR-002`）                          |

`Critical` finding が存在し、Gate 2、4、6、7、8 を通過できないため、Review Gate は `REVISE DESIGN` である。Major / Minor の finding はこの Gate 判定を過去の `READY` へ戻すものではない。

## Remaining Risks and Open Decisions

設計本文を今回修正していないため、`DR-001`〜`DR-004` が解消されるまで Browser Extension を設計として `READY` と扱えない。特に、4条件の一部を connection / permission / session / ordinary unlock / wallet-core password と誤認すること、structured message を任意 payload として扱うこと、署名成功を cryptographic success だけで返すことが残存リスクである。

`DR-005` の traceability 改善と、manifest、browser API、wire、storage、queue、UI layout 等の具体化は、上記 invariant を固定した後に各下流資料で決定する。Mainnet gate、Relay opaque boundary、Symbol / NEM 分離、Mobile 非対象の既存前提は変更しない。

## Automatic Changes

自動的な本文修正、仕様変更、実装変更は行っていない。作成したのは本レビュー成果物のみである。

## Final Decision

**REVISE DESIGN**

Browser Extension Design は、trust boundary、caller / Origin authority、Provider / Content Script responsibility、lifecycle、concurrent request isolation、unknown result、fallback policy、wallet-core boundaryの大部分を満たす。しかし、共通4条件の Browser Signer への明示適用（`DR-001`）、message signing の structured / replay invariant（`DR-002`）、signing result の signing-time binding（`DR-003`）、必須 capability を `OPEN` に戻さないこと（`DR-004`）が必要であり、現時点で `READY` とは判断できない。
