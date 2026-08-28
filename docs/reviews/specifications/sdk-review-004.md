# MosaicLynx SDK Specification 再レビュー

## 1. Review Target

| 項目          | 内容                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| 対象          | [`docs/specifications/sdk.md`](../../specifications/sdk.md)                              |
| 対象 revision | `3f577523cfc79f198c721b76688a2b8367bb6cda`                                               |
| 実施日        | 2026-08-28                                                                               |
| レビュー種別  | 最新 `spec-review` Skill による独立再レビュー                                            |
| 今回の焦点    | 前回の `SR-001`（Mainnet release / evidence gate）修正確認と、現行仕様全文の回帰レビュー |
| 成果物        | `docs/reviews/specifications/sdk-review-004.md`                                          |

前回レビュー成果物はステータスと履歴の確認に限って参照した。

- [`sdk-review-001.md`](./sdk-review-001.md)
- [`sdk-review-002.md`](./sdk-review-002.md)
- [`sdk-review-003.md`](./sdk-review-003.md)

レビュー中に変更したのは本成果物だけであり、対象仕様、Requirements、Design、関連 Specification、ADR、source、test、README、過去レビューは変更していない。

## 2. Execution Audit

現行の以下を全文確認し、Phase 0〜3 を実施した。

- Phase 0: 対象 revision、要求された上流・関連文書、過去 finding、既存 OPEN、変更制約を確認。
- Phase 1 Reviewer A: public API、型、Promise、mapping、authority、実装可能性を独立確認。
- Phase 1 Reviewer B: Requirements / Design traceability、責務、Mainnet gate、Testnet 継続、release 境界を独立確認。
- Phase 1 Reviewer C: trust boundary、four conditions、unknown、fallback、retry、secret、Relay、相互運用性を独立確認。
- Phase 2: A/B/C の観点を突合し、修正が新たな矛盾を導入していないか反証確認。
- Phase 3: Review Gate、finding status、required change、final decision、validation の整合を確認。

| 観点                                       | 結果                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Reviewer A — Contract                      | `MosaicLynxSigningResult<T>`、Handoff mapping、Mainnet gate の public semantics は一貫している。                        |
| Reviewer B — Requirements / Responsibility | `CR-NFR-006`、`CR-AC-008`、SDK Requirements、release/evidence authority との責務分離は追跡可能である。                  |
| Reviewer C — Safety / Interoperability     | Signer authority、fail-closed、transport 分離、no automatic re-sign / fallback、local / remote 同値性は維持されている。 |
| Chair — Integrated result                  | 新規 Critical / Major / Minor finding なし。`SDK-001` と `SR-001` は現行本文で Resolved。                               |

## 3. Evidence Used

### Skill / repository instructions

- [`.agents/skills/spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)
- [`.agents/skills/spec-review/reviewers.md`](../../../.agents/skills/spec-review/reviewers.md)
- [`.agents/skills/spec-review/review-gates.md`](../../../.agents/skills/spec-review/review-gates.md)
- [`.agents/skills/spec-review/output-format.md`](../../../.agents/skills/spec-review/output-format.md)
- [`.agents/skills/review-common/review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)
- [`.agents/skills/review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md)
- [`.agents/project-context.md`](../../../.agents/project-context.md)
- [`AGENTS.md`](../../../AGENTS.md)

### Requirements / Design

- [`docs/requirements/requirements.md`](../../requirements/requirements.md): `CR-015`、`CR-016`、`CR-NFR-006`、`CR-AC-008`。
- [`docs/requirements/sdk.md`](../../requirements/sdk.md): `SDK-NFR-004`、`SDK-AC-010`、`SDK-PLAT-001〜005` と SDK の責務・error model。
- [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md): downstream / transport 境界。
- [`docs/design/architecture.md`](../../design/architecture.md)、[`sdk.md`](../../design/sdk.md)、[`interfaces.md`](../../design/interfaces.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`security-design.md`](../../design/security-design.md): 責務、Signer trust boundary、release/evidence ownership、failure / fallback 方針。

### Related Specifications

- [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)、特に §7.4、§9.7、§10.3、§13.1、§16、§17。
- [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)、特に §21.1。
- [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、特に §5〜§7、§10。
- [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)。
- Browser Extension / Relay Specification: local Provider の downstream contract と Relay の opaque 境界を確認。

レビュー成果物を製品要求や Specification の normative authority として使用していない。

## 4. Review Result

`READY`

現行 `sdk.md` は、前回の Critical finding `SR-001` を解消し、上流 Requirements / Design / Interfaces / Signing Protocol / Handoff と整合している。現行の actionable な `New` / `Open` / `Reopened` finding はない。

| Severity | New / Open / Reopened | Resolved history |
| -------- | --------------------: | ---------------: |
| Critical |                     0 |                2 |
| Major    |                     0 |                0 |
| Minor    |                     0 |                0 |

## 5. Summary

`§3`、`§6.5`、`§9.4`、`§13.1〜13.3`、`§15〜17`、`§19 Case A/B`、`§20` が、Mainnet signing capability を current release と適用中の release / evidence policy を満たす trusted Signer / release security authority の責務として明示している。SDK は evidence evaluator、gate authority、Mainnet capability の独自認定主体ではなく、route availability、Provider discovery / capability、connection、permission、Account disclosure、Relay / App Link、version、test、signed response、transport success から Mainnet signing を推測・昇格・有効化しない。

gate が missing、invalid、expired、inconsistent、unverifiable、unknown の場合も、SDK は fail-closed にし、trusted Signer / release authority の既存 unavailable / disabled / unsupported / rejected の意味を保持する。`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure、success への誤変換、automatic fallback、automatic re-sign はない。Testnet-only の安全な継続も明記され、Case A / B と traceability が追加されている。

従来の SDK の non-Signer 境界、four conditions の Signer authority、`MosaicLynxSigningResult<T>`、local / remote semantic equivalence、Relay ACK と Signer-side delivery disposition の分離、公開 Account 境界、Origin、correlation、lifecycle、error authority に回帰はない。

## 6. Finding Status

| Finding   | Severity               | Status     | 判定根拠                                                                                                                                                                          |
| --------- | ---------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SDK-001` | Critical（旧レビュー） | `Resolved` | `isAvailable()` は current route availability として Handoff の local Provider route または Mobile Relay route を扱い、connection / permission / signing success と分離している。 |
| `SR-001`  | Critical               | `Resolved` | Mainnet release / evidence gate、authority、fail-closed、result / error semantics、retry / fallback 禁止、Case A/B、traceability が現行本文に反映されている。                     |

今回の新規 finding はない。過去 finding の ID は変更していない。

## 7. Required Changes

なし。現行の Critical / Major `New`、`Open`、`Reopened` はなく、Specification の修正を要求する事項はない。

## 8. Optional Improvements

なし。Minor の actionable finding はない。

## 9. Resolved Findings

### `SDK-001` — Resolved

過去の問題は、Provider が存在しない場合の `isAvailable()` と Mobile Relay route availability の整合が不明確だったことである。現行 `sdk.md` §6.2 は、`isAvailable()` を Handoff §5.3 / §6 の route availability とし、compatible local Provider route または mobile relay route が利用可能なら Provider の不在だけで `false` にしない。両 route が利用不能なら `false` とする。また、incompatible / malformed Provider を trusted route とせず、Mobile route への security failure の silent fallback も行わない。

現行 §5.3、§6.2、§6.5、§15、§19 は、availability が connected、permission granted、Account authorized、authenticated、unlocked、approved、Mainnet signing enabled、signing succeeds、Mobile App installed の確定を意味しないと明記する。従って、local Provider route と Mobile Relay route の current availability contract は維持され、同じ問題の再発はない。

### `SR-001` — Resolved

前回は SDK の public contract に Mainnet release / evidence gate の authority と non-substitution rule が不足していた。現行本文を直接再確認した結果、次を満たす。

1. §3、§6.5、§13.1、§16、§17 は、current release と適用中 policy を満たす trusted Signer / release security authority だけが Mainnet capability を有効化でき、SDK は authority / evaluator ではないと定める。
2. §5.3、§6.5、§9.4、§13.1、§16 は、`isAvailable()`、route、discovery、capability、version、connection、permission、Account disclosure、Relay、App Link、Mobile App、wallet-core、test、signed response、transport success を Mainnet gate の代替にしない。`route available ≠ Mainnet signing enabled` は一意である。
3. §6.5、§13.3、§16、§19 Case A/B は、gate の missing / invalid / expired / inconsistent / unverifiable / unknown で SDK が Mainnet success を推測・昇格・有効化しない fail-closed 契約を定める。
4. §5.4、§6.5、§9.4、§13.3 は、trusted Signer の unavailable / disabled / unsupported / rejected 等を意味保持し、success、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure に変換せず、SDK 独自 Mainnet error taxonomy も追加しない。
5. §12.3、§15、§16、§19 は、gate failure / unknown を理由とする automatic re-sign、local ↔ remote、Provider A ↔ B、Signer A ↔ B の fallback を禁止する。
6. §6.5、§15、§19 Case A は、Mainnet gate の不達成で Testnet-only の安全な利用まで不必要に unavailable にしない。
7. §19 Case A / Case B は、route / dependency success と Mainnet gate failure / unknown の分離を実装・contract test で検証可能な観測結果として定める。
8. §20 は `CR-NFR-006`、`CR-AC-008`、`SDK-NFR-004`、`SDK-AC-010`、`SDK-PLAT-001〜005`、Interfaces §7.4、Signing Protocol §21.1 への traceability を示す。

以上により `SR-001` は `Resolved` とする。evidence evaluator の実装、trusted key format、SBOM、rollout 等は Specification phase boundary に従い、SDK の不足として要求していない。

## 10. Deferred Findings

現行 SDK 仕様の formal deferred finding はない。

ただし、次の事項は本文で安全制約を維持したまま OPEN とされており、今回のレビューで勝手に確定されていない。

- `OPEN-SDK-001`: multiple Provider selection。
- `OPEN-SDK-002`: capability / version negotiation の詳細。
- `OPEN-SDK-003`: cancellation / timeout / transport failure の追加詳細。
- `OPEN-SDK-004`: cosignature public scope。
- `OPEN-SDK-005`: runtime / caller binding / release compatibility の具体的 matrix。
- message expiry の `messageExpiresAt` と structured message `expiresAt` の未決定事項。

Browser Extension / Provider 側に旧 Provider result shape、旧 error code、selector / internal Account ID が残る場合は、SDK / Handoff common contract が明確な限り downstream Browser Extension / Provider synchronization issue である。SDK の finding へ逆流させない。現在ワークスペースに Mobile 実装がないこと、release evidence evaluator や実機経路の実行未確認も、仕様上の blocking finding とはしていない。

## 11. Scope and Traceability

**Cross-document Consistency**

| 上流 / 関連項目                                  | 現行 SDK の反映                                                                    | 判定 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ---- |
| `CR-NFR-006`、`CR-AC-008`                        | §3、§6.5、§13.1〜13.3、§15〜17、§19 Case A/B                                       | Pass |
| `SDK-NFR-004`、`SDK-AC-010`、`SDK-PLAT-001〜005` | §3、§6.2〜6.5、§13、§15〜19、§20                                                   | Pass |
| Interfaces §7.4                                  | Mainnet gate authority、non-substitution、fail-closed、Testnet 継続                | Pass |
| Signing Protocol §21.1                           | Signer / release authority、既存 failure semantics、no downgrade                   | Pass |
| Handoff §5〜§7、§10                              | public API、route availability、result union、disposition、error mapping           | Pass |
| Profile / Security Design                        | Profile-local context、four conditions、Public / Internal Account、secret boundary | Pass |

要求された上流の normative authority と、現行 `sdk.md` の外部可視契約の間に blocking contradiction はない。

**Scope / Responsibility**

SDK の責務は request construction、Provider discovery、compatibility check、dispatch、correlation、transport abstraction、response validation、public result mapping、local lifecycle、public error normalization に限定される。Authentication、signing-capable unlock、Account authorization、explicit user approval、semantic signing decision、trusted confirmation、final target validation、signing generation、result disposition decision、secret handling、Mainnet evidence evaluation は SDK の authority ではない。

**Specification phase boundary**

internal class、source layout、browser / Mobile OS API、Redis / DB schema、queue / mutex、exact retry / timeout、UI、crypto implementation、wallet-core API、evidence evaluator algorithm、trusted key / SBOM format、rollout / rollback を不足として要求していない。一方、外部可視の API、Promise、mapping、authority、error、lifecycle、retry / fallback prohibition、public / internal boundary は現行本文で検証可能である。

## 12. Domain Checks

**Regression Review**

| 確認項目                                                                              | 判定                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK non-Signer / non-privileged integration layer                                     | Pass。§1〜§3、§17 で authority を持たない。                                                                                                                                                           |
| Authentication、signing-capable unlock、Account authorization、explicit user approval | Pass。4 条件は trusted Signer の authority であり、SDK / Relay / route から推測しない。                                                                                                               |
| Profile-local security context                                                        | Pass。connection、permission、Account、request context、fresh operation を混同しない。                                                                                                                |
| Mainnet gate authority                                                                | Pass。trusted Signer と current release / evidence policy が authority。SDK は evaluator ではない。                                                                                                   |
| availability / capability 分離                                                        | Pass。route available は Mainnet signing enabled を意味しない。                                                                                                                                       |
| Mainnet fail-closed / Testnet-only 継続                                               | Pass。gate の不確実性で Mainnet を推測せず、Testnet-only を不必要に止めない。                                                                                                                         |
| Public API                                                                            | Pass。`isAvailable()`、`connect()`、`isConnected()`、`getActiveAccount()`、`refreshActiveAccount()`、`disconnect()`、`signTransaction()`、`signData()`、`cosignTransaction()` は Handoff と一致する。 |
| `MosaicLynxSigningResult<T>`                                                          | Pass。transaction、message、Signer-originated disposition、`resultUnknown` の union が一貫する。                                                                                                      |
| Promise resolve / reject                                                              | Pass。known result は succeeded resolve、Signer-originated `RESULT_UNKNOWN` は `resultUnknown` resolve、通常 failure は Handoff §10 reject。                                                          |
| Handoff → SDK mapping                                                                 | Pass。signed transaction / data、result unknown、rejected / failed が一意に対応する。                                                                                                                 |
| `RESULT_UNKNOWN` authority                                                            | Pass。trusted Signer-originated value のみ受け付け、SDK timeout / transport / lifecycle から生成しない。                                                                                              |
| `DELIVERY_UNKNOWN` authority                                                          | Pass。known signed result と Signer-side delivery uncertainty のみで、SDK transport failure から生成しない。                                                                                          |
| `PENDING` / `DELIVERED` と Relay ACK                                                  | Pass。SDK は disposition を変更せず、Relay ACK / consumed state と分離する。                                                                                                                          |
| local / remote semantic equivalence                                                   | Pass。同じ public result / error semantics で、adapter は Signer-originated shape の変換に限定される。                                                                                                |
| connection / permission / Account disclosure                                          | Pass。`connect()` success は signing approval、authentication、unlock、authorization ではない。                                                                                                       |
| Public / Internal Account boundary                                                    | Pass。profileId、internal accountId、Wallet Store ID、key slot、secret-derived identifier を public Account として公開しない。                                                                        |
| Origin authority                                                                      | Pass。SDK は caller-originated context を構築・伝達するが、最終 Origin verification authority ではない。                                                                                              |
| request / response correlation                                                        | Pass。requestId、operation、Scope、Account、Signer、target / digest、session / generation、stale / duplicate を検証する。                                                                             |
| concurrent request isolation                                                          | Pass。invocation ごとの logical request、identity、context、result、error、session、Account を共有しない。                                                                                            |
| timeout / cancellation                                                                | Pass。SDK lifecycle failure と Signer outcome を分離し、未署名や unknown を推測しない。                                                                                                               |
| transport failure                                                                     | Pass。Relay / Provider / page lifecycle / network failure を signing outcome に変換しない。                                                                                                           |
| known-result recovery                                                                 | Pass。resend / retrieval / lookup と new signing / re-sign を分離する。                                                                                                                               |
| automatic re-sign / route fallback                                                    | Pass。failure、unknown、gate failure、rejection のいずれからも automatic retry / fallback しない。                                                                                                    |
| Handoff §10 error authority                                                           | Pass。SDK 独自 taxonomy や旧 Provider code を public authority として再導入しない。                                                                                                                   |
| secret boundary / diagnostics                                                         | Pass。private key、Mnemonic、seed、password、Wallet Store、raw secret、session secret 等を SDK public surface / log / error に出さない。                                                              |
| Relay opaque boundary                                                                 | Pass。Relay status、HTTP success、ACK を Signer / signing authority としない。                                                                                                                        |
| Provider discovery / compatibility                                                    | Pass。malformed、fake、conflicting、incompatible、unsupported Provider を trusted Signer として使用しない。                                                                                           |
| version / capability                                                                  | Pass。authorization、approval、Mainnet evidence gate の代替にせず、未決 negotiation を勝手に閉じない。                                                                                                |
| Existing OPEN                                                                         | Pass。`OPEN-SDK-001〜005` 等を残し、安全制約だけを確定している。                                                                                                                                      |

**Mainnet acceptance cases**

| Case                                              | 期待結果                                                                                                                                                                                | 判定                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Case A — route available、Mainnet gate 未達成     | route / `isAvailable()` は Mainnet enabled を意味せず、Signer の unavailable / disabled / existing rejection を保持。fallback、re-sign、unknown 変換をしない。Testnet-only は継続可能。 | Pass。§6.5、§9.4、§19。  |
| Case B — dependency success、Mainnet gate unknown | SDK は Mainnet capability を推測・有効化せず fail-closed。Signer / release authority の既存意味を保持し、fallback、re-sign、独自 taxonomy を追加しない。                                | Pass。§6.5、§13.3、§19。 |

## 13. Validation Results

| 検証                                                                                         | 結果                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --check docs/specifications/sdk.md`                                      | Pass。                                                                                                                 |
| 新規 review artifact の Prettier check                                                       | 作成後に実行し Pass。                                                                                                  |
| `git diff --check`                                                                           | Pass。                                                                                                                 |
| Markdown local link / path                                                                   | Pass。対象および成果物から参照する local path の存在を確認した。                                                       |
| `sdk.md` Markdown table 構造                                                                 | Pass。全 table の列数を確認し、§13.1 は 2 列、§17 は 3 列で各行が一貫している。                                        |
| TypeScript code block syntax                                                                 | Pass。対象の TypeScript fence を Prettier TypeScript parser で確認した。                                               |
| public method return type / Promise semantics                                                | Pass。§5.1〜5.4 と Handoff の mapping を照合した。                                                                     |
| `SR-001` required change 各項目                                                              | Pass。authority、代替禁止、fail-closed、result/error、retry/fallback、Testnet、Case A/B、traceability を確認した。     |
| `SDK-001` regression                                                                         | Pass。local Provider route、Mobile Relay route、Handoff availability、Provider unavailable / incompatible を確認した。 |
| finding ID / status、Review Gate / Final Decision                                            | Pass。`SDK-001` / `SR-001` を既存 ID のまま Resolved とし、Gate と READY を整合させた。                                |
| source build / runtime / Provider E2E / Relay E2E / Mobile 実機 / release evidence evaluator | Not validated。今回の Specification Review の必須実行範囲外。                                                          |

## 14. Review Gates

| Gate                               | 判定 | 根拠                                                                                                    |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| Gate 1 — Purpose / Scope           | Pass | SDK の non-Signer integration scope と out-of-scope が明確。                                            |
| Gate 2 — Contract                  | Pass | Handoff API、result union、disposition、Mainnet authority、public boundary が明確。                     |
| Gate 3 — Processing / Exceptions   | Pass | response mapping、error authority、unknown、timeout、cancellation、transport、retry / fallback が明確。 |
| Gate 4 — Internal Consistency      | Pass | local / remote、Mainnet gate、Relay ACK、§13.1 table、OPEN と確定事項の間に矛盾なし。                   |
| Gate 5 — Verifiability             | Pass | Case A / B、traceability、correlation、fail-closed、public type を contract test で検証可能。           |
| Gate 6 — Safety / Interoperability | Pass | four conditions、Signer trust、secret / Relay boundary、no re-sign / fallback、Testnet 継続を保護。     |
| Gate 7 — Upstream Alignment        | Pass | Requirements、Design、Interfaces §7.4、Signing Protocol §21.1、Handoff と blocking contradiction なし。 |

全 Review Gate が Pass であり、Critical / Major の未解消 finding はない。

## 15. Remaining Risks and Open Decisions

- `OPEN-SDK-001〜005`、message expiry 表現などの既存 OPEN は残っている。これらは現行本文が安全制約と未決境界を明示しているため、今回の READY を阻害しない。
- Browser Extension / Provider の旧 result / error / Account selector 契約が実装・下流仕様に残る可能性がある。これは downstream synchronization の owner であり、SDK contract の finding ではない。
- release evidence evaluator、trusted key、build embedding、Mobile route、Provider / Relay / 実機 runtime の実行結果は今回検証していない。これらは別の implementation / release / downstream review の証跡で確認する。

現行 SDK Specification に対する残存 blocking risk はない。

## 16. Automatic Changes

レビュー中の自動修正は行っていない。変更は新規 review artifact の作成だけであり、対象 Specification と関連文書は未変更である。

## 17. Final Decision

`READY`

`SR-001` は、Mainnet release / evidence gate の authority、availability / capability との分離、fail-closed、Signer-originated result / error semantics、retry / fallback 禁止、Testnet-only 継続、Case A/B、traceability の追加によって `Resolved` と判定する。`SDK-001` も `Resolved` を維持する。その他の blocking finding はなく、現行 `sdk.md` は Specification Review の Review Gate を満たしている。
