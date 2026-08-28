# MosaicLynx Browser Extension Specification 独立再レビュー

## 1. Review Target

- **対象:** [`docs/specifications/browser-extension.md`](../../specifications/browser-extension.md)
- **対象 revision:** `1e8fa8f658697c0644b436d0572d7247238e466c`（`main` / `origin/main`）
- **確認日:** 2026-08-29
- **今回の成果物:** `docs/reviews/specifications/browser-extension-review-003.md`
- **前回レビュー:** [`browser-extension-review-001.md`](./browser-extension-review-001.md)、[`browser-extension-review-002.md`](./browser-extension-review-002.md)
- **レビュー種別:** 最新の `spec-review` Skill、`review-common` playbook、reviewers、review-gates、output-format に基づく独立 Specification Review
- **レビュー範囲:** 対象本文の全文、前回 finding の解消状況、Requirements / Design / 共通・関連 Specification との追跡、Trust Boundary、Account / error / signing / result / delivery / Mainnet gate、lifecycle、相互運用性および Specification phase boundary
- **対象外:** SDK / Provider 実装の修正、Relay HTTP / storage / encryption、Mobile 実装、wallet-core 内部、Chrome API の具体呼出し、UI framework / layout、storage schema、queue / mutex、exact timeout、暗号実装、release evaluator 実装、実ブラウザおよび E2E。実装は supplementary evidence としてのみ参照した。

今回の判定は差分だけでなく、現行 `browser-extension.md` 全文を独立に確認して行った。過去レビューは finding の履歴と比較材料に限定し、normative authority として使用していない。

## 2. Execution Audit

サブエージェントは使用していない。Chair が Phase 0 で scope / authority を確定し、Phase 1 で Reviewer A〜C の観点を別々の走査として実施し、Phase 2 で反証・重複排除・責任分界を確認した後、Phase 3 でゲートと成果物を統合した。

| Phase   | Reviewer / 活動                              | 実施内容と結果                                                                                                                                                                                                                                                                    |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 | Chair                                        | `HEAD` と `origin/main` が対象 revision と一致し、開始時 worktree が clean であること、対象本文・上流資料・成果物の範囲を確認した。                                                                                                                                               |
| Phase 1 | Reviewer A — Contract clarity / completeness | Provider operation、Public Account Identity、internal reference、error authority、signing state、four conditions、Mainnet gate、result / delivery、OPEN、acceptance および traceability を対象全文で確認した。前回 SR-001、SR-002、SR-004、SR-005、SR-006 の解消を候補化した。    |
| Phase 1 | Reviewer B — Value / operational alignment   | Browser Extension Requirements、Product、Browser Extension Design、Architecture、SDK / Handoff、Profile / Account および Relay の責任分界を照合した。Product の method shape 同期課題は Browser Extension target の blocking finding ではないと再確認した。                       |
| Phase 1 | Reviewer C — Safety / interoperability       | browser-observed Origin、page / Content Script / privileged host、secret、TOCTOU、Symbol / NEM、MESSAGE_SIGN、Aggregate / cosignature、unknown outcome、delivery、retry / fallback および lifecycle を adversarial に確認した。安全契約の回帰は確認しなかった。                   |
| Phase 2 | Chair — counterargument / integration        | 上流参照だけで外部契約が一意になるか、Provider の旧 shape を復活させていないか、`INVALID_MESSAGE` / `NONCE_REUSED` を昇格していないか、four conditions が各工程に及ぶか、Mainnet gate と runtime availability が混同されていないかを反証した。採用すべき新規 finding はなかった。 |
| Phase 3 | Chair — gates / artifact                     | Finding status、Required / Optional / Deferred、7 Review Gates、Validation Results、Final Decision の相互整合を確認し、本成果物だけを作成する。                                                                                                                                   |

## 3. Evidence Used

| 区分                                  | 確認資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 用途                                                                                                                                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill / repository                    | [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、`reviewers.md`、`review-gates.md`、`output-format.md`、[`review-common/review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)、[`review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md)                                                                                                  | Review phase、formal status、severity、7 gates、phase boundary、成果物構成および Git 運用を確認した。                                                                                                            |
| Target / history                      | [`browser-extension.md`](../../specifications/browser-extension.md)、[`browser-extension-review-001.md`](./browser-extension-review-001.md)、[`browser-extension-review-002.md`](./browser-extension-review-002.md)                                                                                                                                                                                                                                                                                                                | 現行本文全文、既存 OPEN および SR-001〜SR-006 の履歴を確認した。過去 finding の主張は今回の根拠に再利用していない。                                                                                              |
| Requirements                          | [`requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`sdk.md`](../../requirements/sdk.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                                  | BR-001〜BR-013、CR-016 / CR-AC-017、CR-NFR-006、SDK / Mobile / Relay の責任と安全側失敗を確認した。                                                                                                              |
| Design                                | [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                         | privileged host の Signer-side authority、four conditions、trust boundary、wallet-core 境界、lifecycle、Account routing および result authority を確認した。                                                     |
| Common / related Specification        | [`interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`sdk.md`](../../specifications/sdk.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)、[`relay.md`](../../specifications/relay.md) | Public / internal Account boundary、logical / concrete error、four-condition gate、Handoff result union、delivery disposition、Profile、chain / network、Product shape および Relay opaque boundary を確認した。 |
| Supplementary implementation evidence | `packages/provider-api/src/index.ts`、`packages/sdk/src/extension.ts`、`packages/sdk/src/types.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                 | 現行実装に旧 `accountId` / `profileId`、Provider-specific error、direct signed-result shape が残ることを確認した。実装を Specification の authority として扱っていない。                                         |

## 4. Review Result

`READY`

現行 Browser Extension Specification は、前回の Critical / Major finding を解消した状態で、上流の要求・設計・共通契約へ追跡可能である。現行本文から、page-facing Account identity、Provider error、four-condition signing gate、Mainnet release gate および result / delivery semantics を一意に判定できる。残る `OPEN-BEX-002`〜`OPEN-BEX-006` は安全側の境界を弱めず上流・下位仕様へ委譲されており、今回の Specification gate を阻害しない。

## 5. Summary

次を確認した。

- Page-facing Account は §5.2、§10.1 および §32 の `PublicAccountIdentity` に限定され、`profileId`、internal `accountId`、Wallet Store ID、key slot および opaque internal handle は page-facing input / output / event / permission authority に使われない。Account 選択は trusted Signer / Profile-local context が解決し、`expectedSignerPublicKey` は public signer expectation に留まる。
- Provider / privileged RPC の internal error と common logical error、Handoff §10 の concrete public error、SDK public error および signing outcome が §5.4 / §27 で分離されている。`INVALID_MESSAGE`、`NONCE_REUSED` 等を Handoff / SDK public code へ自動昇格せず、新しい Browser-specific taxonomy / alias も追加していない。
- Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件が、§7.3、§12.1、§17.2、§18、§20、§24、§29、§31 および §33 に同一 Profile-local context の独立した必須条件として通っている。connection、permission、Account disclosure、ordinary `UNLOCKED`、`every-signature` の単独成立、cached state または prior approval が代替にならない。
- Mainnet capability は trusted Signer / release security authority の release / evidence gate に限定され、Provider / SDK は evaluator / authority ではない。missing、invalid、expired、inconsistent、unverifiable、unknown の gate は disabled / unavailable とし、Testnet-only の安全な継続を不要に停止しない。evidence evaluator、trusted key、SBOM / release tooling の詳細は本書へ導入されていない。
- Known signed result は `SUCCEEDED` と Signer-originated `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` を保持し、署名生成自体が不明な場合だけ `RESULT_UNKNOWN` を使う。Provider、Content Script、Promise settlement、page delivery、SDK adapter、transport および Relay response はこれらを生成・推測・昇格・書換えない。
- Origin authority、trust boundary、secret isolation、trusted inspection、chain / network separation、Aggregate / cosignature、MESSAGE_SIGN、correlation、duplicate / replay、lifecycle、cancellation、automatic re-sign / fallback 禁止に回帰は確認しなかった。

## 6. Finding Status

`Status` は current Skill の formal disposition を示し、「今回の判定」はユーザー指定の再評価表現を示す。

| Finding  | Severity | Status     | 初出レビュー | Previous                  | Current      | 今回の状態根拠                                                                                                                                                                                                         |
| -------- | -------- | ---------- | ------------ | ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SR-001` | Critical | `Resolved` | review-001   | Partially Resolved / Open | **Resolved** | §5.2、§10.1、§9.1 および §32 で public projection、internal routing、selector authority および `OPEN-BEX-001` の解消を明示した。                                                                                       |
| `SR-002` | Critical | `Resolved` | review-001   | Unresolved / Open         | **Resolved** | §5.4 / §27 が Provider / RPC internal code、common logical category、Handoff §10 concrete code、SDK error および outcome を分離し、unknown mapping を fail-closed とした。                                             |
| `SR-003` | Major    | `Resolved` | review-001   | Resolved                  | **Resolved** | §5.1〜§5.2 は current SDK / Handoff の scoped `getActiveAccount` と existing `cosignTransaction` を採用した。Product §16.1 の古い method block は upstream synchronization issue のままであり、target の責任ではない。 |
| `SR-004` | Critical | `Resolved` | review-002   | New                       | **Resolved** | §7.3、§12.1、§18.1〜§18.2、§29、§31 が4条件を `AUTHORIZED`、pre-sign、wallet-core invocation、invariant、acceptance、traceability へ一貫して適用した。                                                                 |
| `SR-005` | Major    | `Resolved` | review-002   | New                       | **Resolved** | §2.3、§18.3、§26、§31.15 が trusted authority、非代替性、全 fail-closed 状態、automatic fallback 禁止、Testnet-only 継続および release authority 委譲を明示した。                                                      |
| `SR-006` | Major    | `Resolved` | review-002   | New                       | **Resolved** | §5.2.1、§12、§20、§22、§24 および §31 が known result / delivery disposition / `RESULT_UNKNOWN` を分離し、Provider から SDK adapter まで意味不変に渡す契約を明示した。                                                 |

新規 finding はない。

## 7. Required Changes

なし。Critical または Major の `New`、`Open`、`Reopened` はない。

## 8. Optional Improvements

なし。Minor の `New`、`Open`、`Reopened` はない。UI layout、Chrome API、Manifest、storage、queue / mutex、exact timeout、framework、release evaluator 実装を任意改善として追加要求しない。

## 9. Resolved Findings

### SR-001 — Account projection / selector authority

`PublicAccountIdentity` は §10.1 で `Scope`、`address`、`publicKey` のみに限定される。§5.2 は page-facing input、Account record、return value、event payload に internal ID / handle を含めず、page supplied selector を authorization、ownership、key selection または signer identity の authority にしない。複数 Account の選択は trusted Signer UI / Signer-owned context で行う。`expectedSignerPublicKey` は §5.2、§10.2 の public signer expectation であり、internal selector ではない。`OPEN-BEX-001` も §32 で解消済みと明記されている。これは Interfaces §5.3、Handoff §5.2 / §6.1、SDK §5 / §7 と整合する。

### SR-002 — Provider error authority / mapping

§5.4 と §27 は、Provider / privileged RPC / transport-specific code を internal boundary に閉じ、common logical category、Signing Protocol outcome、Handoff §10 の `MosaicLynxSDKErrorCode` および wallet-core internal error を別層として扱う。現行 Provider package の `INVALID_MESSAGE`、`NONCE_REUSED`、`UNAUTHORIZED_ORIGIN` 等を public Handoff / SDK code の追加集合にせず、mapping 不能な code は success や新しい public code にせず、必要な catch-all は既存 `INTERNAL_ERROR` に限定する。これは Interfaces §10、Signing Protocol §16、Handoff §10、SDK §5.2 / §5.4 と整合する。

### SR-003 — Product method shape synchronization

§5.1〜§5.2 の Provider contract は SDK / Handoff / Interfaces の current shape を authority とし、Product Specification §16.1 の scoped `getActiveAccount` 省略および `cosignTransaction` 省略を Browser Extension の仕様へ逆流させていない。これは target 内で解消済みである。一方、Product / Provider / SDK / Handoff の横断同期自体は owner を持つ downstream / upstream follow-up であり、本レビューの target finding ではない。

### SR-004 — Common four signing conditions

§7.3 が4条件を同一の request、caller、Profile-local context、Account、Chain / Network、operation、exact target、inspection、expiry に binding し、いずれかが missing / stale / revoked / locked / changed / mismatched / unknown / invalidated なら `AUTHORIZED`、`SIGNING`、`SUCCEEDED` または wallet-core invocation へ進まない。§12.1 の `AUTHORIZED`、§18.1 の署名前再検証、§18.2 の wallet-core invocation 前、§20 の lifecycle、§24 の cancellation、§29 の invariant、§31.6 / §31.9 / §31.10 の acceptance、§33 の traceability が同じ意味を保持する。§7.3、§17.2、§29 は connection、permission、Account disclosure、ordinary `UNLOCKED`、selected Account、prior authentication、cache または `every-signature` 単独成立を代替にしていない。

### SR-005 — Mainnet release / evidence gate

§2.3 と §18.3 は current release / applicable evidence policy の gate を trusted Signer / release security authority の authority とする。Provider / SDK は gate evaluator、release authority または代替ではない。§18.3 / §31.15 は network、Provider / SDK availability、capability、connection、permission、Account disclosure、ordinary unlock、wallet-core capability、test success、signed result、Provider response、response delivery、transport success を gate proof としない。SDK / Provider / protocol version compatibility および wallet-core availability は、§5.3、§18.1、§26 の runtime / route / binding 条件であり、release evidence gate の authority ではない。gate の missing、invalid、expired、inconsistent、unverifiable、unknown は disabled / unavailable とされ、automatic retry / re-sign / alternate route を行わず、独立した Testnet-only signing は不必要に停止しない。evidence schema、evaluator、trusted key、SBOM / tooling は release authority へ委譲される。

### SR-006 — Signing result / delivery semantics

§5.2.1、§22.2 は known signed result を `SUCCEEDED` と Signer-originated `deliveryDisposition`（`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN`）の組として保持し、Signer が署名生成自体を確定できない場合だけ `RESULT_UNKNOWN` とする。後者は signed result、delivery disposition、normal error code を持たない。§12.1、§20.2、§21、§24、§29、§31 は response loss、page delivery、transport completion、lifecycle loss から status / disposition を推測せず、自動再署名しないことを確認できる。§5.2.1 / §22.2 は Handoff §5.2.1 / §7.2、SDK §5.1 / §5.4 の `MosaicLynxSigningResult<T>` mapping を意味不変に適用する。Known-result recovery は新しい署名ではなく、上流の既存 result の resend / redelivery / retrieval / lookup 契約に限定され、未確定の recovery API を本書で発明していない。Relay ACK / consumed state も Signer-side disposition の authority ではなく、Relay response / HTTP / transport completion から disposition を生成しない。

## 10. Deferred Findings

以下は current target が安全側の境界を維持したまま、対応する上流・下位仕様へ委譲している既存 OPEN である。SR-001、SR-002、SR-004〜SR-006 の解消を代替するものではない。

| OPEN                                                              | 判定            | 継続できる理由                                                                                                                 | 維持すべき安全側条件                                                                                                              |
| ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `OPEN-BEX-002` Provider discovery / multiple Provider             | 妥当な deferred | selection policy、capability identifier、version matrix は SDK / Interfaces の OPEN に委譲されている。                         | API major 2、malformed / incompatible の fail-closed、自動 fallback 禁止。                                                        |
| `OPEN-BEX-003` frame / caller proof / Origin canonicalization     | 妥当な deferred | exact Browser observation、document identity、将来 iframe policy は platform 下位仕様に委譲され、初回は top-level としている。 | browser-observed caller、iframe / unsupported Origin の拒否、caller を一意に binding できない場合の拒否。                         |
| `OPEN-BEX-004` permission expiry / session persistence / recovery | 妥当な deferred | expiry、persistence、background recovery、既存 result retrieval policy の方式は未確定である。                                  | old authorization の推測復元、automatic re-sign、stale session の再利用を禁止し、known-result recovery は既存 result のみとする。 |
| `OPEN-BEX-005` authentication / UI / update compatibility         | 妥当な deferred | OS credential、trusted UI host、UI detail、migration / rollback および Browser matrix は下位仕様へ委譲されている。             | ordinary `UNLOCKED`、connection、prior authentication、Provider state を signing gate としない。                                  |
| `OPEN-BEX-006` public Aggregate / cosignature scope               | 妥当な deferred | required / optional capability、対応 chain、public result field は上流 OPEN に残る。                                           | full parent / embedded / inner / role inspection、hash-only / summary-only / chain conversion の禁止。                            |

`OPEN-BEX-001` は §32 で解消済みであり、remaining OPEN ではない。Product §16.1 と現行 Provider / SDK / Handoff の method shape の横断同期、ならびに現行実装の public shape 同期は、target の normative contract を再び曖昧にしないことを前提に別工程で扱う。

## 11. Scope and Traceability

対象本文は Browser Extension の observable contract、authority、security invariant、lifecycle、failure および下流への委譲を扱う。SDK / Provider 実装、Relay protocol、Mobile、wallet-core internals、Chrome API、UI layout、storage、queue / mutex、exact timeout、cryptographic implementation および release evaluator implementation は本レビューの判定対象にしていない。

| 上流要求 / 契約                                                                            | 対象本文                                       | 評価                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-001〜BR-012、BR-004 / BR-005 / BR-007 / BR-008                                          | §2、§6〜§9、§13、§17、§19〜§26、§29〜§31       | Chrome scope、browser-observed Origin、connection / permission、trusted UI、inspection、lifecycle、secret、fallback 禁止を追跡できる。                                         |
| BR-013、CR-NFR-006、Interfaces §7.4、Signing Protocol §21.1                                | §2.3、§18.3、§26、§31.15、§33                  | trusted Signer / release authority、gate の非代替性、fail-closed、Testnet-only 継続および詳細方式の委譲を追跡できる。                                                          |
| CR-016、CR-AC-017、Browser Extension Design §4 / §5.3、Signing Protocol §8 / §9.1          | §7.3、§12、§17.2、§18、§20、§25、§29、§31、§33 | four conditions が admission の安全側境界、`AUTHORIZED`、pre-sign、wallet-core 前、lifecycle、acceptance および traceability に通っている。                                    |
| Interfaces §5.3、SDK §5 / §7、Handoff §5 / §6.1                                            | §5.1〜§5.2、§9、§10.1、§32                     | page-facing identity と privileged routing の分離、`expectedSignerPublicKey` の public expectation、`OPEN-BEX-001` 解消を追跡できる。                                          |
| Interfaces §10、Signing Protocol §16、Handoff §10、SDK §5.2 / §5.4                         | §5.4、§27、§31.14                              | Provider internal error、common logical error、Handoff / SDK public code、unknown mapping および secret / internal detail 非露出を追跡できる。                                 |
| Interfaces §6.3 / §10.3、Signing Protocol §6 / §19、Handoff §5.2.1 / §7.2、SDK §5.1 / §5.4 | §5.2.1、§12、§20〜§24、§29、§31                | known result、Signer-only `RESULT_UNKNOWN`、Signer-side delivery disposition、recovery、no automatic re-sign / fallback および local / remote semantics の同値性を追跡できる。 |
| CR-NFR-005、Chain Compatibility、Product transaction / message contract                    | §14〜§16、§31.8                                | Symbol / NEM、Mainnet / Testnet、transaction、Aggregate / cosignature、NEM multisig、MESSAGE_SIGN、canonical inspection および blind signing prohibition を追跡できる。        |
| Product §16.1、current Provider / SDK / Handoff method shape                               | §5.1〜§5.2                                     | target の method shape は current common contract を採用する。Product の古い block および実装の旧 shape は別の synchronization / implementation review の責任である。          |

## 12. Domain Checks

| Check                                  | 判定                       | 根拠                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API / data contract                    | **Pass**                   | §5.1〜§5.2 が Provider method、Scope、Public Account projection、`expectedSignerPublicKey`、known result / unknown result を上流契約へ対応付け、旧 internal field / bare result を normative contract にしていない。                                                                                                              |
| Public / internal Account boundary     | **Pass — SR-001 Resolved** | page-facing input / output / event / permission authority に internal ID / handle を含めず、trusted Signer / Profile-local context が Account を解決する。                                                                                                                                                                        |
| Provider / SDK error authority         | **Pass — SR-002 Resolved** | §5.4 / §27 が Provider / RPC internal code、common logical error、Handoff §10、SDK public error、signing outcome および wallet-core internal error を分離する。                                                                                                                                                                   |
| Common four conditions                 | **Pass — SR-004 Resolved** | §7.3 で独立必須条件を定義し、§12.1、§18、§20、§24、§29、§31、§33 で state、admission の安全側境界、pre-sign、wallet-core、cancellation、invariant、acceptance、traceability に反映する。                                                                                                                                          |
| Mainnet release / evidence gate        | **Pass — SR-005 Resolved** | §2.3 / §18.3 / §31.15 は trusted Signer / release authority、非代替性、全 fail-closed 状態、no fallback、Testnet-only 継続および下位 release authority への委譲を定める。version compatibility、Provider / SDK availability、wallet-core availability / capability、test、signed response、transport は gate authority ではない。 |
| Signing result / delivery semantics    | **Pass — SR-006 Resolved** | §5.2.1 / §22 が `SUCCEEDED + deliveryDisposition` と `RESULT_UNKNOWN` の排他的意味、Signer authority、SDK mapping、transport / page delivery 非生成および no re-sign を定める。                                                                                                                                                   |
| Browser Origin / trust boundary        | **Pass**                   | §6〜§7 が page / injected / Content Script を untrusted とし、browser-observed top-level Origin、sender、tab / frame / document を authority とする。page self-declaration、iframe、unsupported scheme は authority にならない。                                                                                                  |
| Secret / wallet-core boundary          | **Pass**                   | §4、§6、§18.2、§19、§28〜§30 が secret、Wallet Store、credential、internal handle を page / Provider / SDK / Content Script / Relay / log へ出さず、raw signing は wallet-core boundary に委譲する。                                                                                                                              |
| Inspection / chain interoperability    | **Pass**                   | §13〜§16、§31.8 が full target inspection、canonical equality、Symbol / NEM separation、Aggregate / parent / embedded / inner、NEM multisig、structured `MESSAGE_SIGN` および blind / raw fallback 禁止を維持する。                                                                                                               |
| Lifecycle / concurrency / cancellation | **Pass**                   | §20〜§25、§29、§31.11〜§31.13 が restart、update、navigation、Provider replacement、duplicate / replay、timeout、cancellation、stale context、unknown outcome、response isolation および no automatic re-sign を定める。                                                                                                          |
| Specification phase boundary           | **Pass**                   | 本レビューは observable contract、authority、security invariant、相互運用性および検証可能性だけを判定し、source layout、React、Chrome API、storage schema、mutex、exact timeout、crypto / evaluator implementation を要求していない。                                                                                             |

## 13. Validation Results

| Validation                                                                                    | 結果                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target Markdown formatter                                                                     | `pnpm exec prettier --check docs/specifications/browser-extension.md` を実行し、成功。                                                                                                                                                |
| Review artifact formatter                                                                     | 作成後に `pnpm exec prettier --write docs/reviews/specifications/browser-extension-review-003.md`、続けて `pnpm exec prettier --check docs/reviews/specifications/browser-extension-review-003.md` を実行し、成功。                   |
| Whitespace                                                                                    | `git diff --check` を実行し、成功。対象本文および review artifact に whitespace error はない。                                                                                                                                        |
| Markdown table structure                                                                      | 対象本文と review artifact の pipe table について delimiter と row column 数を確認し、構造 error はない。                                                                                                                             |
| Repository-local links / paths                                                                | 対象本文、レビュー成果物および成果物から参照する repository-local path を確認し、missing target はない。                                                                                                                              |
| Finding ID / severity / status                                                                | SR-001〜SR-006 の formal status、Previous / Current、Required / Optional / Resolved / Deferred の分類を確認し、整合している。新規 finding はない。                                                                                    |
| Review Gate / Final Decision                                                                  | 7 gate をすべて Pass とし、Critical / Major の未解消 finding なしの `READY` と整合している。                                                                                                                                          |
| Full-text / upstream consistency                                                              | 対象本文全文と指定された Requirements、Design、common / related Specification の必要節を直接照合した。前回差分だけに依存していない。                                                                                                  |
| Implementation build / tests / Chrome runtime / real wallet-core / release evidence evaluator | **Not validated**。今回の Specification Review の範囲外であり、実装修正、build、E2E、実ブラウザ、実 wallet-core および release evaluator の実行はしていない。現行実装の旧 public shape は supplementary evidence としてのみ記録した。 |

## 14. Review Gates

| Gate                  | 判定     | 根拠                                                                                                                                                                                                                           | 対応 |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 1. 目的と範囲         | **Pass** | Browser local Signer、Provider / privileged host / trusted UI / wallet-core の責任、Mobile / Relay / implementation の対象外が明確である。                                                                                     | なし |
| 2. 契約               | **Pass** | Public Account projection、Provider error boundary、four-condition state、Mainnet gate、result / delivery union および response correlation が確認できる。                                                                     | なし |
| 3. 処理と例外         | **Pass** | admission、inspection、approval、authentication、pre-sign、wallet-core invocation、lifecycle、timeout、cancellation、duplicate / replay、unknown outcome および no re-sign / fallback が一貫している。                         | なし |
| 4. 内部整合性         | **Pass** | §5、§7、§12、§18、§22、§27、§29、§31 の public / internal、four conditions、error、gate、result semantics に blocking contradiction はない。                                                                                   | なし |
| 5. 検証可能性         | **Pass** | Account leakage、internal selector authority、error layer、4条件の欠落、Mainnet gate case、known result / unknown / disposition および stale / cancellation を acceptance として独立に判定できる。                             | なし |
| 6. 安全性と相互運用性 | **Pass** | Origin、trust boundary、secret、chain / network、structured message、Aggregate / cosignature、wallet-core、result / delivery、Relay opaque 境界および fallback 禁止が上流契約と整合する。                                      | なし |
| 7. 上流整合性         | **Pass** | Requirements、Design、Interfaces、Signing Protocol、Handoff、SDK、Profile / Account、Chain Compatibility、Product、Relay と追跡できる。Product の古い method block と現行実装の旧 shape は target の blocking issue ではない。 | なし |

全ゲートが合格し、Critical / Major の未解消 finding がないため、Review Result は `READY` とする。

## 15. Remaining Risks and Open Decisions

- `OPEN-BEX-002`〜`OPEN-BEX-006` は残る。これらは capability negotiation、Browser-specific caller observation、permission / session recovery、authentication / UI / update compatibility、Aggregate / cosignature の公開 scope に関する未決事項であり、本文は安全側の下限を維持している。
- Product Specification §16.1 と現行 Provider / SDK / Handoff の method shape は横断同期が必要である。ただし target は current common contract を明示的に authority としており、この同期課題を Browser Extension Specification の finding にしない。
- Supplementary implementation evidence では、Provider package の internal Account field / selector、Provider-specific error および SDK の direct signed-result shape が現行仕様と一致しない。これは実装・実装レビューの残存リスクであり、Specification が READY であることは実装や release の完了を意味しない。
- `OPEN-001` の structured message expiry field、下位 Provider wire field、permission expiry / recovery API、cosignature public union 等は、本書が独自の alias、wire field、selector、error code または方式を発明せず、各 authority の判断を待つ。

## 16. Automatic Changes

なし。レビュー中に変更したファイルは本成果物だけであり、対象 Specification、Requirements、Design、関連 Specification、実装、tests、README、ADR および過去 review artifact は変更していない。

## 17. Final Decision

`READY`

- **SR-001:** `Resolved`。Public Account Identity と internal Account Reference の境界、selector authority および `OPEN-BEX-001` の扱いは一意である。
- **SR-002:** `Resolved`。Provider / RPC internal error、common logical error、Handoff / SDK public error および signing outcome は分離され、internal code は自動昇格されない。
- **SR-003:** `Resolved（target responsibility）`。Product §16.1 の同期課題は upstream follow-up であり、target は current common method contract と整合する。
- **SR-004:** `Resolved`。4条件は独立した必須 gate として admission の安全側境界、signing authorization、pre-sign、wallet-core invocation、lifecycle、cancellation、invariant、acceptance および traceability に適用される。
- **SR-005:** `Resolved`。Mainnet gate の trusted authority、非代替性、全 fail-closed 条件、no fallback、Testnet-only 継続および release detail の委譲が明確である。
- **SR-006:** `Resolved`。Known signed result、Signer-originated delivery disposition、`RESULT_UNKNOWN`、SDK wrapper、Relay ACK 分離、既存 result recovery および no automatic re-sign の意味が保持される。

Trust Boundary、Security、Mainnet gate に重大な未解決問題は確認しなかった。Specification phase boundary の逸脱も確認しなかった。したがって、本成果物における Browser Extension Specification の最終判定は `READY` である。これは implementation build、runtime E2E、実 wallet-core または Mainnet release evidence evaluator の検証済み判定ではない。
