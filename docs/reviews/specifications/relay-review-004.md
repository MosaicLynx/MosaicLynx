# MosaicLynx Relay Specification 修正後再レビュー

## 1. Review Target

- **対象:** [`docs/specifications/relay.md`](../../specifications/relay.md)
- **対象 revision:** `6c6ad7c86ed8b83d76307174c59e6b7b86c9a15e`（`main` / `origin/main`）
- **修正コミット:** `6c6ad7c86ed8b83d76307174c59e6b7b86c9a15e`
- **確認日:** 2026-08-29
- **今回の成果物:** `docs/reviews/specifications/relay-review-004.md`
- **前回レビュー:** [`relay-review-001.md`](./relay-review-001.md)、[`relay-review-002.md`](./relay-review-002.md)、[`relay-review-003.md`](./relay-review-003.md)
- **レビュー種別:** 最新の `spec-review` Skill、`review-common` playbook、reviewers、review-gates、output-format および repository instructions に基づく Specification Review
- **レビュー範囲:** 現行 `relay.md` 全文、指定された Requirements / Design / Specification、Handoff §9、RLS-001 / SR-001 / SR-002 の状態、Security Invariants、Acceptance / Conformance、Traceability、OPEN、phase boundary および修正による回帰
- **対象外:** source、test、build、E2E、実 Relay、実 Mobile runtime、real network、Redis / database / deployment、WebSocket / push、wallet-core、暗号実装および release evaluator 実装。これらは今回の Specification Review の mandatory evidence ではない。

前回レビューの結論や修正コミットの説明を normative authority とせず、現行本文と上流資料を直接照合した。既存レビューは finding ID と履歴の追跡に限定して参照した。

## 2. Execution Audit

サブエージェントは使用していない。Chair が Reviewer A〜C の観点を別々の走査として実施し、Phase 2 で根拠、重複、phase boundary および gate を統合した。

| Phase   | Reviewer / 活動                                | 実施内容と結果                                                                                                                                                                                                                        |
| ------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 | Chair                                          | 対象 revision が指定コミットと一致し、開始時の `main...origin/main` と clean worktree を確認した。変更範囲を review artifact だけに限定した。                                                                                         |
| Phase 1 | Reviewer A — Contract clarity / completeness   | `relay.md` の scope、用語、endpoint、state、ACK / cancel、transport status、Signer disposition、failure、acceptance および traceability を全文確認した。                                                                              |
| Phase 1 | Reviewer B — Semantics / operational alignment | 指定 Requirements / Design / Interfaces / Signing Protocol / SDK / Handoff を照合し、責任分界、known-result recovery、fallback、Mainnet gate および OPEN の整合を確認した。                                                           |
| Phase 1 | Reviewer C — Security / interoperability       | opaque / untrusted boundary、secret boundary、4条件、generation / state loss、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、ACK / consumed、cross-session および fail-closed を adversarial に確認した。                                     |
| Phase 2 | Chair — counterargument / integration          | Relay-local `transport status` と Signer-only `deliveryDisposition` の区別、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN`、`RESULT_UNKNOWN` の authority および response failure の非推論を反証確認した。新規 finding は採用しなかった。 |
| Phase 3 | Chair — gates / artifact                       | 既存 finding の status、Required / Optional / Deferred、7 Review Gates、Validation Results、Final Decision を統合し、本成果物だけを作成した。                                                                                         |

## 3. Evidence Used

| 区分                         | 確認資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 用途                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill / repository           | [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、[`reviewers.md`](../../../.agents/skills/spec-review/reviewers.md)、[`review-gates.md`](../../../.agents/skills/spec-review/review-gates.md)、[`output-format.md`](../../../.agents/skills/spec-review/output-format.md)、[`review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)、[`review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md) | review phase、severity / status、gate、phase boundary、artifact layout、validation および報告規約。                                                                 |
| Target / history             | [`relay.md`](../../specifications/relay.md)、[`relay-review-001.md`](./relay-review-001.md)、[`relay-review-002.md`](./relay-review-002.md)、[`relay-review-003.md`](./relay-review-003.md)                                                                                                                                                                                                                                                                                                                                                                                            | 現行本文全文、RLS-001 / SR-001 / SR-002 の履歴、既存 OPEN および回帰確認。過去レビューは normative authority として使用していない。                                 |
| Requirements                 | [`requirements.md`](../../requirements/requirements.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                                                                                                                                      | Relay の責任、RR-004 / RR-006 / RR-009、RR-AC、共通4条件、Mainnet gate、SDK / Mobile / Browser の非権限および fail-closed 要求。                                    |
| Design                       | [`relay.md`](../../design/relay.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`sdk.md`](../../design/sdk.md)、[`security-design.md`](../../design/security-design.md)、[`architecture.md`](../../design/architecture.md)                                                                                                                                                                                                                                                                                                     | opaque / untrusted boundary、transport と signing の分離、Signer authority、known-result recovery、4条件、Mainnet gate、secret boundary および責任分界。            |
| Related Specification        | [`interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`sdk.md`](../../specifications/sdk.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                                                                                                                                                                           | common response、`deliveryDisposition`、`RESULT_UNKNOWN`、4条件、Mainnet gate、SDK non-authority、Handoff §9 endpoint / HTTP / credential / expiry / ACK / cancel。 |
| Supplementary implementation | なし                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 実装挙動、build、runtime および release evaluator は本レビューの normative authority として扱っていない。                                                           |

## 4. Review Result

`READY`

現行本文は、Handoff §9 の endpoint-specific ACK / cancel semantics、Relay-local `transport status`、Signer-originated `deliveryDisposition`、`RESULT_UNKNOWN`、4条件および Mainnet release / evidence gate の authority を相互に区別している。SR-001 / SR-002 の修正を直接確認し、RLS-001 の regression も確認しなかった。blocking Critical / Major finding および mandatory evidence / context の不足はない。

## 5. Summary

- Relay は opaque / untrusted transport であり、transaction / message semantics、approval、authentication、Account authorization、signing、Signer result、4条件および Mainnet gate の authority を持たない。
- `transport status` は Relay の受理、保存、取得、ACK、cancel、expiry、purge 等の transport observation として定義され、Signer-originated `deliveryDisposition` と同じ意味の Relay-local field / state として再利用されていない。
- `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は trusted Signer が known signed result に付与する delivery axis であり、Relay は値を生成、推測、変更または確認しない。ACK / `consumed`、retrieval、HTTP 2xx、purge および Relay-local `delivered` は `DELIVERED` を意味しない。
- `RESULT_UNKNOWN` は trusted Signer が signing generation 自体の成否を確定できない場合だけ、`DELIVERY_UNKNOWN` は known signed result を保持したまま Signer-side delivery disposition を確定できない場合だけ成立する。timeout、network / storage failure、state loss、response absence、ACK failure 等から Relay / SDK は生成しない。
- known signed result の recovery は resend、redelivery、retrieval、lookup に限定され、新しい signing / re-sign と分離されている。Relay は automatic re-sign、local / remote、Provider、Signer の自動 fallback を開始・要求しない。
- Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件と Mainnet release / evidence gate は trusted Signer / release authority の責任であり、Relay の session、token、generation、transport success または availability は代替にならない。Mainnet gate failure / unknown でも安全な Testnet-only operation の継続を不必要に妨げない。

## 6. Finding Status

旧レビューの `ERROR` は履歴上の表記であり、現行 Skill の severity 体系では RLS-001 を `Major` として追跡する。今回の status は現行本文の直接確認に基づく。

| Finding   | Severity | Status     | 初出レビュー | Previous | Current      | 今回の判定根拠                                                                                                                                                                                                         |
| --------- | -------- | ---------- | ------------ | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RLS-001` | Major    | `Resolved` | review-001   | Resolved | **Resolved** | §5.2、§8.2、§13.1、§13.2、§14.1、§15.1、§16.1 が、valid-shape ACK / cancel の常時 `204 No Content`、条件付き mutation、その他の no-op、existence hiding および state loss semantics を Handoff §9.6 と整合させている。 |
| `SR-001`  | Critical | `Resolved` | review-003   | New      | **Resolved** | §2.2、§7.2、§13.3、§14.1、§14.3、§20、§21、§22 が `transport status`、Signer-only `deliveryDisposition`、両 unknown の成立条件、opaque pass-through、ACK / consumed 非同値および no-generation を明示している。        |
| `SR-002`  | Minor    | `Resolved` | review-003   | New      | **Resolved** | §4.2、§20、§21、§22、§23 が4条件と Mainnet gate の trusted Signer / release authority、Relay non-authority、fail-closed、Testnet-only continuation を acceptance / traceability まで追跡している。                     |

新規 finding はない。過去 finding を新しい ID へ言い換えていない。

## 7. Required Changes

なし。現行の `Critical` または `Major` の New / Open / Reopened finding は存在しない。

## 8. Optional Improvements

なし。現行の `Minor` の New / Open / Reopened finding は存在しない。

## 9. Resolved Findings

### RLS-001 — ACK / cancel semantics

- **Severity / Status:** `Major` / `Resolved`
- **対象箇所:** `relay.md` §5.2、§8.2、§13.1、§13.2、§14.1、§15.1、§16.1
- **確認できた事実:** Handoff §9.6 の外形が妥当な ACK / cancel は常に `204 No Content` とし、状態変更は正しい endpoint-scoped `webToken`、対応 session、`response_available` または適用可能な active lifecycle、current generation / lifecycle 等を確認できる場合だけ行う。それ以外は no-op であり、unknown session、token mismatch、terminal / purge、expiry、duplicate、generation mismatch、state loss を response 差異から露出させない。
- **上流根拠:** [`web-transaction-handoff-spec.md` §9.6](../../specifications/web-transaction-handoff-spec.md#96-ack-と-cancel)。
- **今回の判定:** `204` を mutation 成功、session existence、token validity、signing success、signing cancellation success、unsigned または application processing success と解釈しないことも各 endpoint に明記されている。回帰なし。
- **完了条件 / 再確認方法:** §13.1 / §13.2 の HTTP response と state mutation の分離、§14.1 / §15.1 / §16.1 の no-op / state-loss semantics が Handoff §9.6 と一致すること。充足。

### SR-001 — Transport status と Signer-originated `deliveryDisposition`

- **Severity / Status:** `Critical` / `Resolved`
- **対象箇所:** `relay.md` §2.2、§7.2、§13.3、§14.1、§14.3、§20、§21、§22、§23
- **確認できた事実:** Relay-local は `transport status` とし、`accepted`、`stored`、`available`、`retrieved`、`consumed` 等を transport lifecycle observation として扱う。一方、`deliveryDisposition` と `PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は known signed result に付随する Signer-originated field として trusted Signer に限定される。Relay は generate、infer、derive、promote、downgrade、rewrite、normalize、merge、replace、confirm を行わない。
- **上流根拠:** [`interfaces.md` §10.3](../../specifications/interfaces.md#103-unknown-result-と-delivery-disposition)、[`signing-protocol.md` §19.3](../../specifications/signing-protocol.md#193-delivery-disposition)、[`web-transaction-handoff-spec.md` §7.2](../../specifications/web-transaction-handoff-spec.md#72-論理応答)。
- **確認できた事実:** encrypted response に disposition が含まれても Relay は opaque bytes / envelope として意味保持して中継する。`retrieved`、ACK、`consumed`、HTTP 2xx、purge、`unavailable` または Relay-local `delivered` は `DELIVERED` を意味しない。小文字の Relay state `pending` と大文字の Signer disposition `PENDING` も別物である。
- **完了条件 / 再確認方法:** Relay / SDK が transport observation から `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測・確定せず、response 内の Signer-originated value だけを意味不変に pass-through すること。§14.3、§20、§22 および Case A〜E で充足。

### SR-002 — 4条件 / Mainnet gate の Relay non-authority

- **Severity / Status:** `Minor` / `Resolved`
- **対象箇所:** `relay.md` §4.2、§20、§21、§22、§23
- **確認できた事実:** Authentication、Signing-capable unlock、Account authorization、Explicit user approval は同一 request / target / Profile-local context に対する trusted Signer の独立した必須 conditions と列挙され、Relay は evaluate、establish、semantic verify、cache、restore、infer、substitute しない。session existence、participant admission、token、generation、request / response existence、stored / available、retrieval、ACK、consumed、transport success および availability も代替にならない。
- **上流根拠:** [`requirements.md` CR-016 / CR-AC-017](../../requirements/requirements.md#cr-016-署名可能状態の共通前提-signer-end-to-end)、[`interfaces.md` §7.4](../../specifications/interfaces.md#74-mainnet-signing-capability-gate)、[`signing-protocol.md` §21.1](../../specifications/signing-protocol.md#211-互換性)。
- **確認できた事実:** Mainnet capability は trusted Signer と current release / evidence gate の成立時だけ有効であり、Relay は evaluator、verifier、promoter、bypass mechanism ではない。gate が missing、invalid、expired、inconsistent、unverifiable、unknown の場合の Mainnet disabled / unavailable は trusted Signer / release authority が決め、Testnet-only operation の安全な継続を妨げない。
- **完了条件 / 再確認方法:** §20 の Security Invariants、§21 の Component Responsibilities、§22 の Acceptance / Case F および §23 の traceability から、4条件と Mainnet gate の Relay non-authority が独立に検証できること。充足。

## 10. Deferred Findings

- `OPEN-RELAY-001` generation exact format、`OPEN-RELAY-002` storage backend / deployment topology、`OPEN-RELAY-003` reconnect / resume policy、`OPEN-RELAY-004` retry / transport failure mapping、`OPEN-RELAY-005` operational resource policy は、`relay.md` §24 に未決事項として残っている。今回不用意に閉じていない。
- `response_available` から cancel 可能な exact lifecycle branch は、Handoff と Relay に共通する既存 deferred issue のままである。§13.2 は「cancellation が適用可能な active lifecycle」とし、Relay 独自の branch を確定していない。
- exact retry interval / count、storage schema、Redis / database、mutex / queue、deployment topology、WebSocket / push、crypto implementation および release evaluator implementation は本レビューの phase boundary 外である。

## 11. Scope and Traceability

対象本文は Relay の external transport contract、opaque / untrusted boundary、credential scope、routing、lifecycle、failure、retention、privacy、resource control および上流 authority への委譲を定義する。Signer の意味解釈、4条件、approval、Mainnet gate、wallet-core および SDK の公開 result mapping は Relay が所有せず、本文では non-authority と pass-through を検証した。review artifact 自体は normative authority ではない。

| 上流要求 / 契約                                                          | 対象本文                              | 評価                                                                                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `RR-001`〜`RR-003`、`RR-AC-006`〜`RR-AC-010`、Relay Design §3 / §5 / §28 | §1〜§4、§9、§10、§20、§21             | opaque envelope を構造検証と routing の範囲で扱い、semantic parse、approval、signing、secret を Relay から除外している。                        |
| `RR-004`、`RR-006`、`RR-NFR-002`、`RR-NFR-005`、Handoff §9.7             | §6、§7、§11、§13〜§16、§20、§22       | generation、expiry、state loss、terminal state、duplicate / replay、fresh retry、fail-closed、ACK / cancel を追跡できる。                       |
| `RR-005`、`RR-007`、`RR-008`、`RR-NFR-003`〜`005`、Handoff §7〜§9        | §5、§7〜§12、§15〜§18、§20〜§22       | session / participant / direction / request identity / credential scope、secret separation、bounded retention、privacy を追跡できる。           |
| `RR-009`、`RR-AC-001`、`RR-AC-012`、Signing Protocol §19、SDK §13〜§15   | §13〜§16、§20〜§22                    | transport failure、result / disposition、known-result recovery、fresh retry、no automatic re-sign / fallback の境界を追跡できる。               |
| `CR-016`、`CR-AC-017`、Interfaces §9.7、Signing Protocol §8 / §22        | §4.2、§20、§21、§22、§23              | 4条件を trusted Signer の独立した必須 conditions とし、Relay の非権限および transport state 非代替性を acceptance / traceability で検証できる。 |
| `CR-NFR-006`、`CR-AC-008`、Interfaces §7.4、Signing Protocol §21.1       | §4.2、§20、§21、§22、§23              | Mainnet release / evidence gate の authority、non-substitution、fail-closed および Testnet-only continuation を追跡できる。                     |
| Interfaces §10.3、Signing Protocol §19.3、Handoff §7.2 / §9.6、SDK §13.3 | §2.2、§7.2、§13.3、§14、§20、§22、§23 | `deliveryDisposition` は Signer-originated、Relay は opaque pass-through、ACK / consumed は `DELIVERED` ではないことを追跡できる。              |

## 12. Domain Checks

| Check                                  | 判定                 | 根拠                                                                                                                                                                                            |
| -------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opaque / untrusted Relay boundary      | **Pass**             | §1、§4.2、§9、§20、§21 は Relay を opaque / untrusted とし、plaintext、semantic、approval、signing、secret を扱わない。                                                                         |
| Transport status terminology           | **Pass**             | §2.1、§3、§7.2、§13.3、§18、§20、§22 は Relay-local を `transport status` とし、spaced `delivery disposition` を Relay-local state 名として定義していない。                                     |
| Signer `deliveryDisposition` authority | **Pass**             | §2.2、§13.3、§20、§21、§22 は known signed result に付随する trusted Signer-only field とし、Relay の generate / infer / rewrite / confirm を禁止する。                                         |
| `PENDING` authority and separation     | **Pass**             | lower-case Relay `pending` と upper-case Signer `PENDING` を §7.2 で明示的に区別し、`PENDING` の設定・遷移 authority を trusted Signer に限定する。                                             |
| `DELIVERED` authority                  | **Pass**             | retrieval、HTTP 2xx、ACK、`consumed`、purge、`unavailable` および Relay-local `delivered` から Signer `DELIVERED` を作らない（§13.3、§20、§22）。                                               |
| `DELIVERY_UNKNOWN` authority           | **Pass**             | known signed result を保持し Signer-side disposition を確定できない場合だけ成立し、Relay / SDK は timeout、failure、state loss 等から生成しない（§14.3、§20、Case D）。                         |
| `RESULT_UNKNOWN` authority             | **Pass**             | signing generation 自体の成否が不明な場合だけ trusted Signer が成立させ、Relay / SDK は transport / storage failure から生成しない（§14.3、§20、Case C / E）。                                  |
| Three-axis separation                  | **Pass**             | §7.2、§13.3、§14.3、§20〜§22 が Relay transport status、Signer signing outcome、Signer delivery disposition を別軸としている。                                                                  |
| ACK / consumed vs `DELIVERED`          | **Pass**             | §13.1、§13.2、§13.3、§20、§22 は ACK / `consumed` / purge と Signer `DELIVERED` を同値にしない。                                                                                                |
| Transport failure separation           | **Pass**             | storage / consistency failure は transport unavailable / unknown、response delivery failure は transport failure / uncertainty とし、signing outcome / disposition を決めない（§14.1、§14.3）。 |
| Known-result recovery                  | **Pass**             | known signed result の recovery は resend、redelivery、retrieval、lookup に限り、new signing / re-sign と分離する（§14.3、§20、Case D）。                                                       |
| Automatic re-sign / fallback           | **Pass**             | `RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure、state loss 等から automatic re-sign、local / remote、Provider / Signer fallback を開始・要求しない（§14.3、§20、§22）。                |
| Four conditions: Relay non-authority   | **Pass**             | 4条件を個別に列挙し、Relay が evaluate / establish / verify / cache / restore / infer / substitute しないこと、transport state が代替でないことを §4.2、§20〜§22 に記載する。                   |
| Mainnet gate: Relay non-authority      | **Pass**             | trusted Signer / release authority の gate、Relay non-evaluator、non-substitution、fail-closed を §4.2、§20〜§22 に記載する。                                                                   |
| Testnet-only continuation              | **Pass**             | Mainnet gate failure / unknown が安全な Testnet-only operation を不必要に停止しないことを §4.2、§20、§22 Case F で確認できる。                                                                  |
| Security Invariants                    | **Pass**             | §20 の23 invariant が opaque boundary、status separation、no generation、ACK 非同値、4条件、Mainnet gate、recovery、fallback、secret boundary を一貫して要求する。                              |
| Acceptance / Conformance               | **Pass**             | §22 の項目13〜16と Case A〜F が本文の normative contract と一致し、storage / transport observation と Signer semantics を区別して検証できる。                                                   |
| Handoff §9 authority                   | **Pass**             | §5.1、§5.2、§8.2、§12.2、§13、§14.1、§22 が endpoint / HTTP / credential / expiry / ACK / cancel を Handoff §9 に従わせ、新しい endpoint / token / TTL / wire field を追加していない。          |
| RLS-001 regression                     | **Pass — none**      | valid-shape ACK / cancel は `204 No Content`、条件付き mutation、それ以外 no-op。旧 `404` 競合の再発なし。                                                                                      |
| Deferred cancel lifecycle              | **Pass — deferred**  | §7.2 の state graph と §13.2 の適用可能 lifecycle は exact `response_available → cancelled` branch を独自確定せず、既存 deferred issue を維持する。                                             |
| Existing OPEN consistency              | **Pass — unchanged** | §24 に `OPEN-RELAY-001`〜`005` が残り、今回の変更で close / rename されていない。                                                                                                               |
| Specification phase boundary           | **Pass**             | Redis、database、Lua、mutex、queue、deployment、exact retry、WebSocket / push、crypto implementation、release evaluator implementation を外部契約として追加していない。                         |

### Case A〜F

| Case                               | 本文の期待動作                                                                                                                         | 判定     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| A — response saved                 | `stored` / `available` は Relay transport status。`SUCCEEDED`、`DELIVERED`、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` を推測しない（§22）。 | **Pass** |
| B — response retrieved + ACK       | Relay は `consumed` / purge へ進み得るが、Signer disposition を変更せず、`DELIVERED` にしない（§13.1、§22）。                          | **Pass** |
| C — state loss before retrieval    | transport failure / state loss とし、Relay は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成しない（§14.1、§16.1、§22）。                | **Pass** |
| D — `SUCCEEDED + DELIVERY_UNKNOWN` | known signed result と disposition を含む encrypted response を opaque に保持・中継し、書き換えない（§14.3、§22）。                    | **Pass** |
| E — `RESULT_UNKNOWN`               | Signer-originated response を transport failure、signing failure、success または別値へ変換しない（§14.3、§22）。                       | **Pass** |
| F — Mainnet gate failure           | Relay は gate を override / promote せず、安全な Testnet-only transport operation を不必要に停止しない（§4.2、§20、§22）。             | **Pass** |

## 13. Validation Results

| Validation                             | 結果                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revision / worktree / changed files    | `git status --short --branch`、`git log -1 --oneline` および対象 revision を確認。開始時は `main...origin/main`、`HEAD=6c6ad7c86ed8b83d76307174c59e6b7b86c9a15e`、clean。成果物作成後は変更が本 artifact だけであることを確認する。                                                                                                                                          |
| Target Markdown formatter              | `pnpm exec prettier --check docs/specifications/relay.md` は pnpm launcher の `ERR_SQLITE_ERROR: unable to open database file` で失敗。repository-local `./node_modules/.bin/prettier --check docs/specifications/relay.md` を代替実行し **Pass**。元 command と同じ Prettier executable の対象 check であり、pnpm launcher 自体の環境エラー以外の未検証範囲は確認されない。 |
| Review artifact formatter              | 作成後に `pnpm exec prettier --check docs/reviews/specifications/relay-review-004.md` を試行し、同じ pnpm database error を確認。repository-local `./node_modules/.bin/prettier --write docs/reviews/specifications/relay-review-004.md` および `./node_modules/.bin/prettier --check docs/reviews/specifications/relay-review-004.md` を実行し **Pass**。                   |
| `git diff --check`                     | review artifact 作成後に実行し **Pass**。                                                                                                                                                                                                                                                                                                                                    |
| Markdown links / paths                 | artifact 内の repository-local link / path と、指定された Requirements、Design、Specification、過去 review の存在を確認し **Pass**。                                                                                                                                                                                                                                         |
| Terminology / authority audit          | `transport status`、stale Relay-local spaced `delivery disposition`、Signer-only disposition、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN`、`RESULT_UNKNOWN` の occurrence を走査し、Relay-local positive generation / inference の記述がないことを確認 **Pass**。                                                                                                             |
| ACK / failure / recovery audit         | ACK / consumed vs `DELIVERED`、transport failure separation、known-result recovery、automatic re-sign / fallback、four-condition non-authority、Mainnet gate non-authority、Testnet-only continuation を本文・上流資料・Case A〜F で照合し **Pass**。                                                                                                                        |
| Finding / gate consistency             | RLS-001、SR-001、SR-002 の既存 ID と current status、new finding 0、Critical / Major / Minor 件数、Review Result / Final Decision を照合し **Pass**。                                                                                                                                                                                                                        |
| Implementation / build / E2E / runtime | **Not validated**。今回の Specification Review の mandatory evidence ではなく、source、test、real Relay、Mobile runtime、Mobile、wallet-core、network、E2E、build および release evaluator implementation は実施していない。                                                                                                                                                 |

## 14. Review Gates

| Gate                           | 判定     | 根拠                                                                                                                                                                          | 対応 |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1. Purpose / scope             | **Pass** | §1〜§4 が Relay を短期 opaque / untrusted transport に限定し、Signer、SDK、wallet-core、release authority の責任を分けている。                                                | なし |
| 2. Contract                    | **Pass** | §5〜§13、§19、§22 が Handoff endpoint、credential、state、transport status、opaque pass-through、ACK / cancel と禁止事項を一意に定める。RLS-001 / SR-001 は Resolved。        | なし |
| 3. Processing / failure        | **Pass** | §14〜§16、§20、§22 が storage / response delivery failure、unknown、state loss、ACK / cancel、recovery、re-sign / fallback を分離する。                                       | なし |
| 4. Internal consistency        | **Pass** | §2.2、§7.2、§13.3、§14.3、§20、§22 で Relay transport status と Signer disposition / signing outcome の用語・値・authority が整合する。                                       | なし |
| 5. Verifiability               | **Pass** | §20 の Security Invariants、§22 の acceptance と Case A〜F、§23 の traceability で分離・non-generation・non-substitution を検証できる。                                       | なし |
| 6. Security / interoperability | **Pass** | opaque / untrusted boundary、secret isolation、Signer-only values、Handoff §9、ACK 非同値、fail-closed、known-result recovery および no fallback が上流資料と整合する。       | なし |
| 7. Upstream consistency        | **Pass** | Requirements、Design、Interfaces、Signing Protocol、SDK、Handoff、Architecture および Security Design と直接照合し、existing OPEN を閉じず、上流 authority を変更していない。 | なし |

全 applicable gate が Pass であり、blocking Critical / Major finding、confirmation required、mandatory evidence / context の不足はない。

## 15. Remaining Risks and Open Decisions

- `OPEN-RELAY-001`〜`005` は継続している。これらは exact generation format、storage / deployment、reconnect、retry mapping、operational resource policy の未決事項であり、今回の blocker ではない。
- Handoff §9.6 の “unfinished session” と `response_available` から cancel 可能な exact branch は deferred のままである。Relay は独自の lifecycle semantics を追加していない。
- 実装、runtime、E2E、実ネットワーク、release evaluator および Mobile App は未検証である。今回の `READY` は Specification contract の gate 判定であり、実装準拠や runtime readiness を意味しない。

## 16. Automatic Changes

なし。レビュー中に作成・変更したのは `docs/reviews/specifications/relay-review-004.md` だけである。`docs/specifications/relay.md`、他 Specification、Requirements、Design、ADR、source、tests、README および過去 review artifact は変更していない。

## 17. Final Decision

`READY`

- **RLS-001:** `Resolved`。ACK / cancel の valid-shape `204`、条件付き mutation、no-op、existence hiding に regression はない。
- **SR-001:** `Resolved`。Relay-local `transport status` と Signer-originated `deliveryDisposition`、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN`、`RESULT_UNKNOWN` の authority、意味保存、failure separation および Case A〜E が一意である。
- **SR-002:** `Resolved`。4条件と Mainnet release / evidence gate の trusted Signer / release authority、Relay non-authority、fail-closed、Testnet-only continuation が責務、Security Invariants、Acceptance、Traceability から検証できる。
- **新規 finding:** なし。
- **件数:** Critical `0` / Major `0` / Minor `0`。
- **opaque / untrusted boundary:** Pass。
- **transport status terminology:** Pass。Relay-local terminology は `transport status`。
- **deliveryDisposition authority:** Pass。trusted Signer-originated のみ。
- **PENDING authority:** Pass。Relay `pending` と別軸。
- **DELIVERED authority:** Pass。ACK / consumed / retrieval 等から生成しない。
- **DELIVERY_UNKNOWN authority:** Pass。known signed result を保持する trusted Signer のみ。
- **RESULT_UNKNOWN authority:** Pass。signing generation 自体の成否不明に限定し、Relay / SDK は生成しない。
- **ACK / consumed vs DELIVERED:** Pass。非同値。
- **transport failure separation:** Pass。`transport_failure != RESULT_UNKNOWN != DELIVERY_UNKNOWN`。
- **known-result recovery:** Pass。resend / redelivery / retrieval / lookup と re-sign を分離。
- **automatic re-sign / fallback:** Pass。自動開始・要求なし。
- **four conditions Relay non-authority:** Pass。
- **Mainnet gate Relay non-authority:** Pass。
- **Testnet-only continuation:** Pass。
- **Security Invariants:** Pass。
- **Acceptance / Conformance:** Pass。Case A〜F を含め本文と一致。
- **Traceability:** Pass。Requirements / Design / Interfaces / Signing Protocol / SDK / Handoff と整合。
- **RLS-001 regression:** なし。
- **Existing OPEN:** `OPEN-RELAY-001`〜`005` は未決のまま維持。
- **Handoff §9 authority:** Pass。
- **deferred cancel lifecycle:** 既存 deferred issue のまま。
- **Specification phase boundary:** Pass。

したがって、本 Specification は次工程へ進められる **READY** と判定する。これは実装、build、E2E、real Relay、Mobile runtime または release evidence evaluator の検証済み判定ではない。
