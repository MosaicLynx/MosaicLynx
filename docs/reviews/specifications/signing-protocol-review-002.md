# MosaicLynx Signing Protocol Specification 再レビュー

## 1. Review Target

- 対象: [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)
- 対象 revision: `1ee6932b035f8917b8916ea298326afeb7be5909`
- 確認日: 2026-08-28
- 今回の成果物: `docs/reviews/specifications/signing-protocol-review-002.md`
- 前回レビュー: [`signing-protocol-review-001.md`](./signing-protocol-review-001.md)
- レビュー種別: 最新の `spec-review` Skill と `review-common` framework に基づく独立 Specification Review
- 変更範囲: 新規レビュー成果物のみ。対象 Specification、Requirements、Design、関連 Specification、ADR、source、test、README および過去レビュー成果物は変更しない。
- レビュー対象の責務: transport-independent な common signing semantics。Chrome API、Mobile OS API、Relay endpoint / Redis schema、SDK implementation、UI layout、queue / mutex、timeout 秒数、retry interval、wallet-core concrete API、crypto implementation および evidence evaluator は判定対象の phase boundary 外とする。
- 前回レビューの扱い: `review-001` は履歴と過去の status の確認に限り使用し、今回の `READY` 判定の根拠にはしない。

## 2. Execution Audit

サブエージェントは使用していない。Chair が同じ current evidence を基に、Reviewer A、Reviewer B、Reviewer C の観点を別々に走査し、反証確認後に統合した。

| Phase   | Reviewer / 活動                            | 実施内容と結果                                                                                                                                                                                                     |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phase 0 | Chair                                      | 対象、変更制約、最新 revision、前回 review の非 normative な扱い、Requirements / Design / Specification の authority を確認した。作業開始時の worktree は clean な `main` で `origin/main` と同一だった。          |
| Phase 1 | Reviewer A — Contract Clarity              | logical operation、request / target binding、state、transition、four conditions、error / result contract、OPEN、phase boundary を本文と上流本文から独立確認した。新規不備なし。                                    |
| Phase 1 | Reviewer B — Value / Operational Alignment | Requirements、Signing Flow、Signer / SDK / Relay の responsibility、local / remote、known-result recovery、Mainnet gate、下流 mapping を確認した。Signing Protocol への blocking contradiction なし。              |
| Phase 1 | Reviewer C — Safety / Interoperability     | Profile-local context、concurrent isolation、TOCTOU、blind signing、Symbol / NEM、MESSAGE_SIGN、secret boundary、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、retry / fallback を adversarial に確認した。新規不備なし。 |
| Phase 2 | Chair — Counterargument / Integration      | Case 1〜16、四条件の non-substitution、error authority、stale downstream contract、OPEN の不用意な close、upstream return / downstream delegation を反証確認した。形式的 finding を追加する根拠なし。              |
| Phase 3 | Chair — Gates / Artifact                   | Review Gate 1〜7、Required / Optional / Deferred、Finding status、Final Decision の整合を確認し、本成果物だけを作成する。                                                                                          |

## 3. Evidence Used

| 区分                  | 確認した本文                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 用途                                                                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill / repository    | [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、[`reviewers.md`](../../../.agents/skills/spec-review/reviewers.md)、[`review-gates.md`](../../../.agents/skills/spec-review/review-gates.md)、[`output-format.md`](../../../.agents/skills/spec-review/output-format.md)、[`review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)、[`review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md) | current review format、SR prefix、severity、Reviewer A〜C、Phase 0〜3、Review Gate、phase boundary、成果物章構成および git 運用を確認した。                                                                                                                             |
| Requirements          | [`requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`sdk.md`](../../requirements/sdk.md)、[`relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                                                                                      | common signing goal、CR-016 の四条件、fail-closed、target / result correlation、secret、Mainnet gate、各 component の責任と retry / fallback 禁止を確認した。                                                                                                           |
| Design                | [`signing-flow.md`](../../design/signing-flow.md)、[`security-design.md`](../../design/security-design.md)、[`interfaces.md`](../../design/interfaces.md)、[`architecture.md`](../../design/architecture.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`sdk.md`](../../design/sdk.md)、[`relay.md`](../../design/relay.md)                                                                                                                                                                                         | Signing Flow 本文を lifecycle、authorization、Aggregate / cosignature / Partial、result disposition、responsibility の normative authority として照合した。Security、Profile-local context、trust boundary、component boundary および transport delegation を確認した。 |
| Related Specification | [`interfaces.md`](../../specifications/interfaces.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`sdk.md`](../../specifications/sdk.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)、[`relay.md`](../../specifications/relay.md)、[`browser-extension.md`](../../specifications/browser-extension.md)                                                   | 共通 data / error authority、concrete Handoff §10、Profile signing authentication、Symbol / NEM、product acceptance、Relay opaque boundary、Browser / Provider downstream mapping を cross-document 照合した。                                                          |
| Review history        | [`signing-protocol-review-001.md`](./signing-protocol-review-001.md)、[`interfaces-review-004.md`](./interfaces-review-004.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 前回 review の status、最新 Interfaces review の status および history を確認した。いずれも Requirements / Design の代替にはしていない。                                                                                                                                |
| 修正履歴              | `38427a5624eafdd5b83aa230dbd283ae19042751`、`1ee6932b035f8917b8916ea298326afeb7be5909`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 今回重点指定された four-condition、traceability、TOCTOU、upstream authority の本文変更を確認した。                                                                                                                                                                      |

## 4. Review Result

`READY`

新規 `SR` formal finding はない。Critical の New / Open / Reopened はなく、blocking Review Gate 1〜7 はすべて Pass である。下流 Browser Extension / Provider の旧 error list は同期課題として記録するが、Signing Protocol の欠陥や gate failure とは分類しない。

## 5. Summary

現行本文は、transport-independent な common signing semantics として、次を一貫して定義している。

- `TRANSACTION_SIGN`、`COSIGNATURE_SIGN`、`MESSAGE_SIGN` を区別し、Partial を第三の共通 primitive にしていない。
- Authentication、Signing-capable unlock、Account authorization、Explicit user approval の four conditions を独立した必須条件とし、connection、permission、ordinary `UNLOCKED`、過去の認証・approval、wallet-core、Relay、SDK / Provider state 等を代替にしていない。
- request、target、Profile-local security context、caller、Account、Chain / Network、inspection、freshness、wallet-core result、response correlation を binding し、concurrent request を独立させている。
- exact state set、`AUTHORIZED` の意味、pre-sign revalidation、TOCTOU invalidation、`SUCCEEDED` の result correlation、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の二軸を定義している。
- known-result recovery と signing retry を分離し、automatic re-sign / alternate route fallback を禁止している。
- Handoff §10 の concrete public error authority、Signer-only result disposition、Mainnet release / evidence gate、secret / wallet-core boundary を維持している。

下流には Browser Extension Specification §5.4 の `ProviderErrorCode` に `INVALID_MESSAGE` / `NONCE_REUSED` 等の旧 code list が残り、Handoff §10 の現行集合と同期していない。これは Browser Extension / Provider contract と Handoff documentation の owner が解消すべき downstream synchronization issue であり、Signing Protocol が旧 code を再導入していないため、本 review の formal finding にはしない。

## 6. Finding Status

| ID  | Severity | Status | 判定                                                   |
| --- | -------- | ------ | ------------------------------------------------------ |
| —   | —        | —      | 新規 formal finding なし。`SR` ID は割り当てていない。 |

`signing-protocol-review-001` は旧 review format で新規 formal finding を記録していない。存在しない過去 finding を `Resolved` として作成していない。

## 7. Required Changes

なし。現行 `Critical` / `Major` の New、Open、Reopened はない。

## 8. Optional Improvements

なし。現行 `Minor` の New、Open、Reopened はない。

## 9. Resolved Findings

なし。前回レビューから継承して解決済みとする finding は作成していない。

## 10. Deferred Findings

以下は formal finding ではなく、対象本文が明示している既存の OPEN である。四条件、fail-closed、Signer authority、secret boundary を弱めるものではない。

| OPEN       | 未決事項                                                                                   | 戻すべき authority                                                             |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `OPEN-001` | Structured message expiry field の `expiresAt` / `messageExpiresAt` と wire adapter の対応 | Interfaces、Handoff、Product、`CR-007-MSG`                                     |
| `OPEN-002` | capability identifier、set、version、negotiation、互換性                                   | Interfaces、SDK / Relay compatibility design                                   |
| `OPEN-003` | common version / compatibility matrix                                                      | Interfaces、SDK、Mobile / Relay / release design                               |
| `OPEN-004` | permission expiry / revocation identifier                                                  | Interfaces、permission design、Profile / Account                               |
| `OPEN-005` | public Aggregate / multisig / cosignature scope                                            | SDK、Chain Compatibility、platform / SDK specification                         |
| `OPEN-006` | transport / lifecycle failure、timeout、retry、lookup、pending policy                      | SDK、Relay、Handoff、platform lifecycle                                        |
| `OPEN-007` | wallet-core binding、外部 contract、error / warning / binding failure                      | Common requirements、wallet-core binding decision、platform integration design |

未決事項を理由に security invariant を曖昧にした箇所、または `OPEN` を不用意に closed とした箇所は確認されなかった。

## 11. Scope and Traceability

- Requirements の common signing goal、CR-001〜CR-016、CR-NFR-001〜CR-NFR-013、SDK / Browser / Mobile / Relay の責任と acceptance は、対象 §1、§5〜§8、§16、§18〜§22 に反映されている。
- [`docs/design/signing-flow.md`](../../design/signing-flow.md) 本文が lifecycle、authorization binding、Aggregate / cosignature / Partial、message、result disposition、retry / fallback の normative authority である。対象 §3.1、§23 はこれを明記し、過去の Design Review artifact を authority にしていない。
- Interfaces Design / Specification の Profile-local context、PublicAccountIdentity、四条件、concurrent isolation、state、error / result authority は対象 §5〜§9、§16、§19、§20 と整合している。
- Handoff §10 は concrete public error authority、Handoff §7.2 は concrete result / delivery representation、Profile / Account は `every-signature` と ordinary `UNLOCKED` の分離、Chain Compatibility は Symbol / NEM bytes / schema authority である。対象は各 authority を再定義していない。
- `review-001` と `interfaces-review-004` は status / history の補助 evidence に限った。Review artifact の主張を product requirement / design authority として traceability に使用していない。

## 12. Domain Checks

### 12.1 Contract / security / lifecycle

| Check                                            | 判定 | Evidence / 判定理由                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope / logical operations                       | Pass | §1〜§2 が transport-independent common semantics に限定し、`TRANSACTION_SIGN`、`COSIGNATURE_SIGN`、`MESSAGE_SIGN` を分離。Partial は §13 の chain-specific context として扱う。                                                                                                                                                                     |
| Common four conditions                           | Pass | §5.3、§8.1、§20.5 が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を独立した必須条件として列挙し、相互非包含を明記する。                                                                                                                                                                                   |
| Four-condition non-substitution                  | Pass | §5.3、§8.1、§20.6 が connection、permission、Account disclosure、capability、Provider availability、session、ordinary `UNLOCKED`、過去の Authentication / approval、wallet-core validation / capability、Relay delivery / ACK、SDK / Provider state、Node response を代替から除外する。permission の存在だけでは Account authorization にならない。 |
| Profile-local security context                   | Pass | §5.3 の tuple が request identity、caller / source、session、Profile、Profile-local context、permission、Account、Chain / Network、operation、protocol / capability、target、transaction / message context、inspection、freshness、四条件を binding。§16、§20 は wallet-core call / result と response correlation も同一 context に対応付ける。    |
| Public / Internal Account boundary               | Pass | §5.3、§9、§20 が `profileId`、internal `accountId`、Wallet Store ID、key slot、opaque handle を public signing field に追加せず、`PublicAccountIdentity` と Internal Account Reference を分離する。                                                                                                                                                 |
| Concurrent request isolation                     | Pass | §5.3、§20 が active request ごとに approval、Authentication、request-bound unlock、Account authorization、target、Profile-local context、result、response channel を共有・統合・流用しないと定義。queue / mutex は要求していない。                                                                                                                  |
| State machine                                    | Pass | §6 の exact set は `RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` と terminal `REJECTED / FAILED / EXPIRED / CANCELLED / INVALIDATED / RESULT_UNKNOWN`。未定義の共通 state を追加していない。                                                                                                                |
| `AUTHORIZED`                                     | Pass | §6.1、§6.2 が同一 request / target / Profile-local context と四条件すべてを必要とし、missing / stale / revoked / locked / unknown / mismatch なら進めない。                                                                                                                                                                                         |
| `AWAITING_USER → AUTHORIZED`                     | Pass | 四条件すべてを同一 context に対して必要とし、UI 順序や OS API は固定していない。                                                                                                                                                                                                                                                                    |
| `AUTHORIZED → SIGNING` pre-sign revalidation     | Pass | §6.2、§8.4 が request、caller、Profile、permission、Account、Chain / Network、operation、target、inspection、freshness、protocol / capability、四条件を signing 直前に再検証し、一つでも unknown / mismatch なら署名しない。                                                                                                                        |
| `SUCCEEDED`                                      | Pass | §6.1、§6.2、§16 が wallet-core success だけでなく、四条件成立 context、request、target、signer、Profile / Account、Chain / Network、operation、result、request correlation の対応検証を要求する。                                                                                                                                                   |
| Lifecycle invalidation                           | Pass | §5.3、§6.3 が Profile switch / lock / association、Account / Chain / Network change、caller、permission revision、session / generation、target / inspection、process / lifecycle loss で古い Authorization、四条件、result context を失効させる。                                                                                                   |
| TOCTOU / target mutation                         | Pass | §9.1〜§9.3 が raw validation → full parse / inspection → confirmation / identity → 四条件 binding → pre-sign 再取得・再解析 → byte / semantic equality → wallet-core の順序を定義。approval 後の変更は old Authorization を失効させる。                                                                                                             |
| Fresh signing operation                          | Pass | §9.3、§19.1 が target 変更後または retry 時に new request identity、fresh caller / Profile / permission / Account / Chain / Network binding、inspection、四条件、approval、pre-sign validation を要求し、old binding を再利用しない。                                                                                                               |
| Blind signing                                    | Pass | §8.2、§9、§11〜§15、§20 が requester summary、hash-only parent、external description、Node lookup、parse / display不能 target、warning-only fallback、raw message fallback を禁止する。                                                                                                                                                             |
| Aggregate / cosignature / Partial / NEM multisig | Pass | §11 は Symbol Aggregate outer + embedded 全体、§12 は完全 parent + selected cosigner / role、§13 は Partial を第三 primitive にせず、§14 は NEM multisig を Symbol Aggregate と同じ semantics にしない。Chain Compatibility / wallet-core authority を維持する。                                                                                    |
| `MESSAGE_SIGN`                                   | Pass | §15 が domain、Origin、purpose、payload、nonce、issuedAt、expiry、Account、Chain / Network、request freshness、signing bytes を binding し、同一 structured message から confirmation model と signing bytes を導出する。raw fallback はない。四条件も要求する。                                                                                    |
| Replay / duplicate                               | Pass | §7 が duplicate active、conflicting duplicate、replay、late、stale、expiry を区別し、同一 content の duplicate は新 operation にせず、conflict / stale は拒否する。                                                                                                                                                                                 |

### 12.2 Result / delivery / recovery / failure

| Check                                | 判定 | Evidence / 判定理由                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESULT_UNKNOWN`                     | Pass | §6.2、§16、§19.3 が trusted Signer の signing generation 自体の成否不明に限定する。SDK timeout、Relay outage、network failure、response absence、Provider disconnect、recipient offline、delivery failure、page / SDK / Relay lifecycle loss だけでは生成・推測しない。automatic re-sign はない。                                                                                                  |
| `DELIVERY_UNKNOWN`                   | Pass | §19.3 が known signed result に付随する Signer-side delivery disposition と定義し、`SUCCEEDED + DELIVERY_UNKNOWN` と result 保持を許可する。terminal signing state ではなく、`RESULT_UNKNOWN` / failure に変換しない。                                                                                                                                                                             |
| Relay ACK / transport authority      | Pass | §18〜§19 が Relay、ACK、polling、response storage、consumed state、SDK / Provider state を signing success、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、`DELIVERED` の authority から除外する。                                                                                                                                                                                                          |
| Known-result recovery                | Pass | `SUCCEEDED + DELIVERY_UNKNOWN` から許可されるのは既存 result の resend、redelivery、retrieval、lookup。`SIGNING` に戻らず、新しい signature を生成しない。                                                                                                                                                                                                                                         |
| Retry / re-sign                      | Pass | §19.1 が user rejection、四条件 failure、permission、validation / inspection、replay、expiry、context change、unknown、transport / delivery failure 後の同一 request / target / Authorization の自動 retry / re-sign を禁止する。許可される新しい signing は fresh operation のみ。                                                                                                                |
| Automatic fallback                   | Pass | §6.2、§19.1 が local ↔ remote、Provider A ↔ B、Signer A ↔ B、Relay failure から local signing 等の security / unknown / transport failure 回避を禁止する。                                                                                                                                                                                                                                         |
| Failure state / error mapping        | Pass | §6、§16 は確定した validation、unsupported、inspection、Authentication、Signing-capable unlock、Account authorization、wallet-core、internal failure を `FAILED` とし、明示的 user rejection を `REJECTED` と分離する。具体 public code は発明せず Handoff §10 へ委譲する。                                                                                                                        |
| Handoff §10 authority                | Pass | §16.2 が独自 public error taxonomy を持たず、Interfaces の logical category と Handoff §10 の concrete code を分離する。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` は error code ではなく、過去の `INVALID_MESSAGE` / `NONCE_REUSED` も再導入していない。                                                                                                                                               |
| Unlock / Account authorization error | Pass | §16.3 は Signing-capable unlock failure / Account authorization failure を確定 failure として署名禁止・resultなしにする一方、concrete code を新設せず Interfaces / Handoff authority に委譲する。実装者が state、no-result、no-retry を判断するには十分であり、具体 code の不足を理由とする新 finding はない。既存 code の不一致を解消する場合の owner は Handoff §10 / Provider contract である。 |
| Mainnet release / evidence gate      | Pass | §21 が trusted Signer + current release / evidence gate を要求し、missing / invalid / expired / inconsistent / unverifiable / unknown なら Mainnet signing unavailable / disabled。network、permission、capability、SDK / Provider / Relay、wallet-core、test、signed response は代替でなく、Testnet-only は不要に停止しない。                                                                     |
| Secret / wallet-core boundary        | Pass | §18、§20 が private key、Mnemonic、seed、Profile password、decrypted Wallet Store、session secret、transport credential、raw signing secret、不要な raw payload を外部・log・Relay・SDK・page へ出さず、wallet-core を raw secret / signing boundary として維持する。                                                                                                                              |

### 12.3 Case-based review

| Case                                 | Expected / 判定                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1. ordinary transaction success      | 四条件成立 → pre-sign revalidation → wallet-core success → result correlation 検証 → `SUCCEEDED`。Pass。                  |
| 2. ordinary `UNLOCKED` only          | Authentication / Signing-capable unlock / Account authorization / approval が未成立なら `AUTHORIZED` 不可。Pass。         |
| 3. permission exists only            | permission は Account authorization、approval、認証の代替でない。署名不可。Pass。                                         |
| 4. target changes after approval     | old Authorization を invalidated。再開は fresh request、inspection、四条件、approval、pre-sign を伴う新 operation。Pass。 |
| 5. user rejects                      | 明示拒否は `REJECTED`。`FAILED` / `RESULT_UNKNOWN` ではない。Pass。                                                       |
| 6. Authentication fails              | 確定 failure、`FAILED`、signed result なし、automatic fallback なし。Pass。                                               |
| 7. Signing-capable unlock fails      | 署名しない。既存 Interfaces / Handoff authority に従い、automatic fallback なし。Pass。                                   |
| 8. Account authorization fails       | 署名しない。古い permission / Account selection を authority にしない。Pass。                                             |
| 9. wallet-core 中 process loss       | Signer が成否を安全に確定できなければ `RESULT_UNKNOWN`。automatic re-sign なし。Pass。                                    |
| 10. signing success 後 delivery 不明 | `SUCCEEDED + DELIVERY_UNKNOWN`、known result 保持、re-sign なし。Pass。                                                   |
| 11. Relay outage のみ                | transport failure。Relay / SDK は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測しない。Pass。                        |
| 12. Profile switch                   | Authorization、四条件、result context を失効。Pass。                                                                      |
| 13. concurrent requests              | approval、auth、Account authorization、result、response channel を共有しない。Pass。                                      |
| 14. hash-only Aggregate cosignature  | 完全 parent context がないため inspection failure / reject。Pass。                                                        |
| 15. structured `MESSAGE_SIGN`        | domain、Origin、purpose、nonce、expiry、Account、Chain / Network、payload、four conditions を確認。Pass。                 |
| 16. Mainnet gate unknown             | Mainnet signing unavailable。Testnet-only は継続可能。Pass。                                                              |

### 12.4 Downstream synchronization / phase boundary

- **Downstream synchronization issue: あり（non-blocking）**。`docs/specifications/browser-extension.md` §5.4 は旧 `ProviderErrorCode` 集合に `INVALID_MESSAGE` / `NONCE_REUSED` 等を残す一方、Handoff §10 が concrete SDK error authority であり、これらを含めない。owner は Browser Extension / Provider contract と Handoff の同期である。Signing Protocol §16.2 は Handoff authority を正しく参照しており、下流の旧一覧を common contract へ逆流させていない。
- **Specification phase boundary: Pass**。queue、mutex、scheduler、exact class / source、Chrome / OS API、UI layout、timeout 秒数、retry interval、DB / Redis schema、wallet-core internal method、crypto implementation、evidence evaluator は要求していない。一方、state meaning、transition、authority、binding、failure、result disposition、recovery、public / internal boundary、validation は十分に規定されている。

## 13. Validation Results

| 確認                                     | 結果                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対象 Specification の Prettier check     | `pnpm exec prettier --check docs/specifications/signing-protocol.md` — Pass。                                                                                       |
| Review artifact の Prettier              | `pnpm exec prettier --write docs/reviews/specifications/signing-protocol-review-002.md` — Pass。                                                                    |
| Review artifact の Prettier check        | `pnpm exec prettier --check docs/reviews/specifications/signing-protocol-review-002.md` — Pass。                                                                    |
| whitespace check                         | `git diff --check` — Pass。                                                                                                                                         |
| Markdown link / path check               | 本文中の local Markdown link target を確認し、存在する path のみであることを確認 — Pass。                                                                           |
| state / transition consistency           | 対象 §6 の exact state set、transition table、terminal 禁止遷移を相互確認 — Pass。                                                                                  |
| four-condition terminology               | Authentication / Signing-capable unlock / Account authorization / Explicit user approval の4語と独立性・non-substitution を対象、upstream、artifact で確認 — Pass。 |
| stale review authority                   | 対象 §3、§23 と本 artifact が current `docs/design/signing-flow.md` 本文を authority とし、過去 review を history / status に限定 — Pass。                          |
| old approval / authentication model      | ordinary `UNLOCKED`、connection、permission、過去 Authentication / approval が signing gate になっていないことを確認 — Pass。                                       |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`    | Signer-only authority、non-collapse、known-result recovery、no re-sign、Relay / SDK non-authority を確認 — Pass。                                                   |
| Handoff §10 authority                    | concrete code を対象が再定義せず、両 unknown を public error code にしていないことを確認 — Pass。                                                                   |
| OPEN consistency                         | `OPEN-001`〜`OPEN-007` が対象 §24 に残り、security invariant を弱めていないことを確認 — Pass。                                                                      |
| finding ID / status consistency          | 新規 `SR` ID なし。Required / Optional / Deferred / Final Decision と整合 — Pass。                                                                                  |
| Review Gate / Final Decision consistency | Gate 1〜7 が Pass、Review Result / Final Decision が `READY`、Required Changes がなし — Pass。                                                                      |
| changed files                            | 成果物のみが変更対象であることを作成前後に確認 — Pass。                                                                                                             |

source build、runtime、Provider / Relay E2E、Mobile runtime、実機および release evidence evaluator の実行は、本 Specification Review に必須でないため実施していない。

## 14. Review Gates

| Gate                         | 判定 | 根拠                                                                                                                                                                                                           |
| ---------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Purpose / Scope           | Pass | §1〜§3 が common signing semantics の scope と下流委譲を明確化し、実装詳細を発明していない。                                                                                                                   |
| 2. Contract                  | Pass | §2、§5、§8〜§17、§20 が logical operations、four conditions、Profile-local binding、target、message、Aggregate / cosignature / Partial、error / result authority を定義している。                              |
| 3. Processing / Exceptions   | Pass | §6、§7、§8、§16、§19 と Case 1〜16 が normal、reject、確定 failure、expiry、cancel、invalidation、unknown、delivery uncertainty、recovery を区別している。                                                     |
| 4. Internal Consistency      | Pass | state / transition、四条件、TOCTOU、`SUCCEEDED`、unknown / delivery の二軸、retry / fallback、Mainnet gate が相互に矛盾しない。                                                                                |
| 5. Verifiability             | Pass | 各 gate、binding、pre-sign、result correlation、禁止事項、acceptance、OPEN、Handoff mapping を本文の肯定形・禁止形と関連仕様から検証できる。                                                                   |
| 6. Safety / Interoperability | Pass | fail-closed、no blind signing、Symbol / NEM 分離、secret boundary、Relay opaque、no re-sign / fallback、Mainnet evidence gate、Handoff authority が維持されている。                                            |
| 7. Upstream Alignment        | Pass | Requirements、`docs/design/signing-flow.md` 本文、Security / Interfaces Design、関連 Specifications の authority と整合する。下流旧 error list は owner を分離した non-blocking synchronization issue である。 |

全 Gate Pass。Gate failure に対応する `SR` Critical finding はない。

## 15. Remaining Risks and Open Decisions

- `OPEN-001`〜`OPEN-007` は各 authority に戻されており、field naming、capability negotiation、version matrix、permission revocation、public scope、transport recovery、wallet-core binding は未決のままである。これらは現行の四条件・fail-closed・Signer authority を緩めない。
- Browser Extension §5.4 の旧 Provider error list と Handoff §10 の concrete code 集合に同期差がある。下流 owner が修正すべきであり、Signing Protocol の current authority を変更する根拠ではない。
- Mobile App は Requirements / Design 上の将来対象であり、現在の workspace 実装の存在を意味しない。
- runtime、build、E2E、実機および release evidence の実行結果は本 review の evidence に含めていない。

## 16. Automatic Changes

新規 review artifact の作成と、その artifact に対する formatter のみを行った。`docs/specifications/signing-protocol.md`、他の Specification、Requirements、Design、ADR、source、test、README、過去 review artifact、下流旧 contract は自動修正していない。

## 17. Final Decision

`READY`

現行 Signing Protocol は、最新 Requirements / Design / 関連 Specification に対して、common four conditions、non-substitution、Profile-local context、concurrent isolation、exact state machine、`AUTHORIZED`、pre-sign revalidation、`SUCCEEDED` correlation、lifecycle invalidation、TOCTOU、fresh operation、Aggregate / cosignature / Partial / NEM multisig、MESSAGE_SIGN、replay / duplicate、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、known-result recovery、retry / re-sign、automatic fallback、failure semantics、Handoff §10、Mainnet gate、public / internal Account boundary、secret / wallet-core boundary、既存 OPEN、traceability および phase boundary を一貫して満たす。新規 blocking finding はなく、Review Gate 1〜7 はすべて Pass であるため、`READY` と判定する。
