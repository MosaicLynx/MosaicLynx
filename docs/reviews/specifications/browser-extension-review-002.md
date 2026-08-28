# MosaicLynx Browser Extension Specification 独立再レビュー

## 1. Review Target

- **対象:** [`docs/specifications/browser-extension.md`](../../specifications/browser-extension.md)
- **対象 revision:** `c14a2decc42f4ec0393e6975b1595ab5b2eb3150`（current `main` / `origin/main`）。対象本文の最終変更は `8c5f3cd`。
- **確認日:** 2026-08-29
- **今回の成果物:** `docs/reviews/specifications/browser-extension-review-002.md`
- **前回レビュー:** [`browser-extension-review-001.md`](./browser-extension-review-001.md)
- **レビュー種別:** 最新の `spec-review` Skill、`review-common` playbook、reviewers、review-gates、output-format に基づく独立 Specification Review
- **変更範囲:** 本成果物のみ。対象 Specification、Requirements、Design、関連 Specification、Provider implementation、test および前回レビューは変更しない。
- **レビュー対象の責務:** Browser Extension の page-facing Provider、browser-observed caller / Origin、permission、Account、inspection、trusted approval、local signing orchestration、result correlation、lifecycle および secret boundary。
- **対象外:** SDK / Provider 実装、Relay HTTP / storage / encryption、Mobile 実装、wallet-core 内部、Chrome API の具体呼出し、UI framework / layout、storage schema、queue / mutex、exact timeout、暗号実装、release evaluator 実装。ただし、外部可視契約の一意性、責任境界および委譲の妥当性はレビュー対象とした。

前回レビューは finding history と比較材料としてのみ使用した。今回の判定は、現行 main の Requirements、Design、共通 Specification、SDK / Handoff および必要な実装 evidence を直接確認して行った。

## 2. Execution Audit

サブエージェントは使用していない。Chair が Phase 0 の scope / authority を確定し、Reviewer A〜C の観点を独立した走査として実施した後、Phase 2 で反証、重複、owner、Specification phase boundary および previous finding の再判定を統合した。

| Phase   | Reviewer / 活動                            | 実施内容と結果                                                                                                                                                                                                                                                                                                                              |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 | Chair                                      | current `main`、対象 revision、変更制約、previous review の非 normative な扱い、Requirements / Design / Specification の authority および review artifact の保存先を確認した。開始時 worktree は clean で `origin/main` と同一だった。                                                                                                      |
| Phase 1 | Reviewer A — Contract Clarity              | Provider method / result、Public Account Identity、internal selector、error、state、four conditions、Mainnet gate、result / delivery、OPEN、acceptance および traceability を全文走査した。SR-001 / SR-002 の部分解消を確認し、SR-004〜SR-006 を候補化した。                                                                                |
| Phase 1 | Reviewer B — Value / Operational Alignment | Browser Extension Requirements、Product、Browser Extension Design、Architecture、SDK / Handoff の責任分担、local Provider route、Profile / Account、lifecycle、release gate を照合した。SR-003 は対象責任外の upstream synchronization と判定した。                                                                                         |
| Phase 1 | Reviewer C — Safety / Interoperability     | Browser trust boundary、observed Origin、TOCTOU、common four conditions、secret、Symbol / NEM、MESSAGE_SIGN、Aggregate / cosignature、unknown result、delivery、retry / fallback を adversarial に確認した。四条件の operational state への未反映と result contract の欠落を確認した。                                                      |
| Phase 2 | Chair — Counterargument / Integration      | 「上流を参照しているだけで十分か」「Provider の direct result は SDK の内部 representation として許容されるか」「Product の古い記載を Browser finding にすべきか」「OPEN を不用意に閉じていないか」を反証した。SR-001、SR-002、SR-004〜SR-006 は対象本文の外部契約または安全性に影響するため採用し、SR-003 は target finding としなかった。 |
| Phase 3 | Chair — Gates / Artifact                   | Finding status、Required / Optional / Deferred、7 Review Gates、Validation、Final Decision の整合を確認し、本成果物のみを作成する。                                                                                                                                                                                                         |

## 3. Evidence Used

| 区分                            | 確認した本文                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 用途                                                                                                                                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skill / repository              | [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、reviewers、review-gates、output-format、[`review-common/review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)、[`review-common/output-format.md`](../../../.agents/skills/review-common/output-format.md)                                                                                                                 | current review phase、formal finding status、severity、7 gates、phase boundary、artifact format および git 運用を確認した。                                                                                                                                  |
| Target / history                | [`browser-extension.md`](../../specifications/browser-extension.md)、[`browser-extension-review-001.md`](./browser-extension-review-001.md)                                                                                                                                                                                                                                                                                                                                                                                        | 現行全文、対象本文の既存 OPEN、前回 SR-001〜SR-003 の事実と判定を確認した。前回 review は authority として使用していない。                                                                                                                                   |
| Requirements                    | [`requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`sdk.md`](../../requirements/sdk.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                                  | CR-016 の common four conditions、CR-NFR-006 の Mainnet gate、BR の Origin / lifecycle / secret 要求、SDK / Relay の責任と共通 failure を確認した。                                                                                                          |
| Design                          | [`architecture.md`](../../design/architecture.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`security-design.md`](../../design/security-design.md)、[`interfaces.md`](../../design/interfaces.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                         | Browser privileged host の唯一の Signer-side orchestration owner、Profile-local context、four conditions、trust boundary、wallet-core 境界、lifecycle および result authority を確認した。                                                                   |
| Common / related Specification  | [`interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`sdk.md`](../../specifications/sdk.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`product-spec.md`](../../specifications/product-spec.md)、[`relay.md`](../../specifications/relay.md) | Public / internal Account boundary、logical error、Handoff concrete error、`MosaicLynxSigningResult<T>`、signing outcome、delivery disposition、transaction / message / cosignature、Profile、Product method shape および Relay opaque boundary を確認した。 |
| Provider evidence               | [`packages/provider-api/src/index.ts`](../../../packages/provider-api/src/index.ts)、[`packages/sdk/src/extension.ts`](../../../packages/sdk/src/extension.ts)、[`packages/sdk/src/types.ts`](../../../packages/sdk/src/types.ts)                                                                                                                                                                                                                                                                                                  | Provider の現状 method / type、internal `accountId` routing、Provider error set、SDK mapping の現状を supplementary evidence として確認した。実装を normative authority として使用していない。                                                               |
| Review history / related review | [`sdk-review-004.md`](./sdk-review-004.md)、[`signing-protocol-review-002.md`](./signing-protocol-review-002.md)、[`interfaces-review-004.md`](./interfaces-review-004.md)                                                                                                                                                                                                                                                                                                                                                         | 最新 downstream review の status と、common contract の更新後に previous conclusion を機械的に継承しないことを確認した。                                                                                                                                     |

## 4. Review Result

`REVISE SPECIFICATION`

現行本文には、Critical の `Open` / `New` finding が 3 件、Major の `New` finding が 2 件ある。SR-003 は Browser Extension Specification の責任としては解消済みだが、Product Specification と Provider / SDK / Handoff の同期課題は残る。Critical または Major の未解消 finding があるため、Review Gate 2、3、4、5、6、7 の一部を Pass とできず、`READY` にはできない。

## 5. Summary

現行本文は、browser-observed top-level Origin、page / Content Script / privileged host の trust boundary、secret isolation、full inspection、Symbol / NEM の分離、navigation / restart / update / duplicate / replay、automatic re-sign / fallback 禁止、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の区別を広く定義している。これらは今回の再レビューで回帰を確認しなかった。

一方、次が実装を一意に拘束していない。

- Public Account Identity は上流で `Scope + address + publicKey` に確定し、internal `profileId` / `accountId` / opaque handle は page-facing Provider field に追加できない。対象本文はこの公開禁止を記載する一方、Provider method の optional selector と Provider-native Account record を残し、`OPEN-BEX-001` を未解決としている。page-facing Provider と SDK / privileged routing の境界が target 内で確定していない。
- Provider error は Provider package の集合と Handoff §10 を併記するが、`INVALID_MESSAGE` / `NONCE_REUSED` 等が Provider internal / RPC code なのか page-facing public code なのか、Handoff concrete error へどう対応するのかを確定していない。
- `AUTHORIZED`、wallet-core 呼出し前、security invariant、acceptance および traceability が、最新共通契約の Authentication、Signing-capable unlock、Account authorization、Explicit user approval の四条件を同時に operational contract として要求していない。§7.2 に四条件の名前はあるが、後続の状態・呼出し条件が explicit approval + `every-signature` authentication に縮退している。
- Mainnet gate は「gate 未達成または判定不能なら利用可能と報告しない」とするが、gate authority、非代替性、missing / invalid / expired / inconsistent / unverifiable / unknown の全 fail-closed 条件、および Testnet-only 継続を共通契約どおり明示していない。
- Browser Provider の direct `SignedTransaction` / `SignedMessage` result と SDK の `MosaicLynxSigningResult<T>` の間で、Signer-originated `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` と `RESULT_UNKNOWN` をどう意味不変に通過させるかが対象本文から検証できない。

## 6. Finding Status

`Status` は current Skill の formal disposition（`New` / `Open` / `Resolved` / `Deferred` / `Reopened`）を使用し、別欄の「再評価判定」でユーザー指定の `Resolved` / `Partially Resolved` / `Unresolved` を示す。

| ID       | Severity | Status     | 再評価判定                            | 結論                                                                                                                                                                         |
| -------- | -------- | ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SR-001` | Critical | `Open`     | **Partially Resolved**                | 上流は public identity と internal routing の原則を明確化したが、対象本文の page-facing Provider selector / Account record の境界は未確定。                                  |
| `SR-002` | Critical | `Open`     | **Unresolved**                        | Handoff §10 と Interfaces / SDK は `INVALID_MESSAGE` / `NONCE_REUSED` を public SDK code に含めないが、対象本文は Provider code 集合との層分離・mapping を定義していない。   |
| `SR-003` | Major    | `Resolved` | **Resolved（target responsibility）** | target の scoped `getActiveAccount` / existing `cosignTransaction` は現行 SDK / Handoff / Provider shape に合う。Product §16.1 の古い記載は upstream synchronization issue。 |
| `SR-004` | Critical | `New`      | —                                     | Common four conditions が state、pre-sign、wallet-core invocation、invariant、acceptance に一貫して適用されていない。                                                        |
| `SR-005` | Major    | `New`      | —                                     | Mainnet release / evidence gate の非代替性、fail-closed の全条件、Testnet-only 継続および authority の外部契約が不十分。                                                     |
| `SR-006` | Major    | `New`      | —                                     | `MosaicLynxSigningResult<T>` と `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` の Provider route mapping が不十分。                                                            |

## 7. Required Changes

### SR-001 — Account projection と selector authority（Critical / Open）

- **対象:** target §5.1〜§5.2、§10.1、`OPEN-BEX-001`。特に §5.2 の「optional Account selector」「Provider Account record」と、§10.1 の `id` / `profileId` 境界未確定の記述。
- **確認事実:** Interfaces §5.3 は page-facing Provider を含め、`profileId`、internal `accountId`、Wallet Store ID、key slot、opaque handle を SDK、Provider、Relay、Web page、dApp の field に追加しないと明記する。SDK §5 / §7 と Handoff §5.2 は公開引数・返却値に internal ID を含めず、Handoff §6.1 だけが Extension Adapter 内部の routing reference として `accountId` を扱う。これは page identity と privileged / SDK internal routing を区別する上流契約である。
- **問題:** target は公開 Account を `PublicAccountIdentity` に制限する一方、page-facing Provider method shape に optional selector を残し、Provider-native record の selector / field を §10 projection へ委ね、`OPEN-BEX-001` で最終分離を未確定としている。selector が privileged host / SDK adapter 内だけの routing reference なのか、page Provider の入力・返却へ現れる既存 API なのかを target から一意に決められない。
- **影響:** 実装者が `id` / `profileId` を page に返す、page supplied selector を key selection / authorization に使う、または public Account と internal Account record を同じ型として公開する余地がある。Provider、SDK、Handoff の routing が異なる場合、Account disclosure、expected signer、signer identity および authorization が混線する。
- **最低限の修正:** target §5.2 と §10.1 を current Interfaces / SDK / Handoff に合わせ、page-facing Account record と method field は `PublicAccountIdentity`（`Scope`、`address`、`publicKey`）に限定する。`accountId` / opaque selector を使う場合は privileged / SDK adapter の internal routing reference と明示し、page input、page return、permission authority、ownership proof、key selection authority にしない。Product §11.3 の accountId との責任分界は upstream owner と照合し、`OPEN-BEX-001` を安全条件付きで更新または close する。
- **完了 / 再確認:** public Provider schema、`getAccounts` / `getActiveAccount` / signing request、SDK adapter routing、expected signer、permission および diagnostics について、internal ID が page-facing field に現れず、selector が public authorization authority でないことを contract test で一意に検証できること。

### SR-002 — Provider error authority（Critical / Open）

- **対象:** target §5.4、§27。`ProviderErrorCode` の列挙と「Handoff / SDK の concrete error authority」の併記。
- **確認事実:** Interfaces §10.1 / Signing Protocol §16 は logical error category と signing outcome を分離し、Handoff §10 を concrete SDK public error authority とする。現行 Handoff §10 の `MosaicLynxSDKErrorCode` は `INVALID_MESSAGE`、`NONCE_REUSED`、`UNAUTHORIZED_ORIGIN`、`ACCOUNT_NOT_FOUND`、`UNSUPPORTED_CHAIN`、`RESOURCE_LIMIT` を含まない。Interfaces §10.2 と SDK §13.1 も `INVALID_MESSAGE` / `NONCE_REUSED` を独自 public code として追加しないと明記する。一方、Provider package evidence にはこれらを含む `ProviderErrorCode` がある。
- **問題:** target は Provider package の code 集合を「既存 contract」として列挙するが、それが page-facing Provider の concrete public code か、privileged / RPC 内部 code かを定めず、各 Provider code の Handoff §10 mapping も定めていない。ページが `INVALID_MESSAGE` / `NONCE_REUSED` を受け取る読み方と、Handoff public SDK では受け取らない読み方が併存する。§27 の「既存 Provider API contract」参照だけでは public / internal boundary を解決できない。
- **影響:** dApp / SDK が期待する error union と Provider が返す code が不一致になり、common logical error、Handoff concrete error、Provider transport / RPC error、wallet-core internal error の層が混ざる。error を見た caller が誤った retry / fallback を行うこと、または内部状態を過剰に推測できることにつながる。
- **最低限の修正:** target は Handoff §10 の concrete public SDK code を再定義せず、Provider-specific code を internal / transport / RPC 層に限定するのか、page-facing Provider の既存 public contract として維持するのかを明示する。page-facing code とする場合は Handoff への既存 mapping を upstream Provider / Handoff contract で確定する。`INVALID_MESSAGE` / `NONCE_REUSED` を Handoff / SDK の public code として再導入しない。Relay HTTP structural error、wallet-core internal error、common logical category、signing outcome も別層として保持する。
- **完了 / 再確認:** page Provider、privileged RPC、SDK、Handoff の各境界について、公開 error code の集合、mapping、unknown code の fail-closed、secret / stack / internal detail 非露出を表と contract test で一意に検証できること。

### SR-004 — Common four conditions の operational contract 欠落（Critical / New）

- **対象:** target §7.2、§9.1〜§9.3、§11.1〜§12.2、§17.2、§18.1〜§18.2、§29、§31、§33。
- **確認事実:** target §7.2 の authorization tuple には Authentication、Signing-capable unlock、Account authorization、Explicit user approval が列挙され、四条件を独立した必須条件とする文もある。しかし、target §12.1 の `AUTHORIZED` は「explicit approval と `every-signature` authentication」のみを成立条件とし、§18.2 と §29.9 は wallet-core 呼出し前に trusted validation、inspection、approval、required authentication を要求するだけで、Signing-capable unlock と独立した Account authorization を要求しない。§11.1 は通常の Profile lock / unlock、permission、選択 Account を列挙するが、これらを独立条件として定義しない。
- **上流根拠:** CR-016 / CR-AC-017、Interfaces §9.7 / §15、Signing Protocol §8 / §9.1、Architecture §6.9、現行 Browser Extension Design §4 / §5.3 は、同一 Signer-owned Profile-local context で四条件をすべて成立・再確認し、connection、permission、ordinary `UNLOCKED`、Account selection、過去の authentication、wallet-core validation 等を代替にしないとする。
- **問題:** target 内で「四条件を tuple に binding する契約」と「`AUTHORIZED` / wallet-core call を approval + authentication で成立させる契約」が異なる。通常の `UNLOCKED`、permission、selected Account、`every-signature` authentication だけで signing-capable unlock または Account authorization を代替できるかが一意でない。
- **影響:** Signer が利用者認証済み・通常 unlock 済み・接続 permission あり・Account 選択済みであることを、署名可能 unlock と Account authorization と誤認して wallet-core を呼び出す余地がある。要求、caller、Profile、Account、Chain / Network、operation、exact target、freshness と同じ context における独立 gate が検証不能になり、Gate 2、4、5、6、7 に影響する。
- **最低限の修正:** target §12.1 の `AUTHORIZED`、§11 / §17 / §18 の approval flow、§29 invariants、§31 acceptance、§33 traceability を、Authentication、Signing-capable unlock、Account authorization、Explicit user approval の四条件が同じ Profile-local context に対して独立して成立した場合だけ `AUTHORIZED` / `SIGNING` / `SUCCEEDED` へ進める契約へ整合する。各条件が missing、stale、revoked、locked、unknown、mismatch の場合は wallet-core を呼ばず fail-closed とする。認証方式、unlock 実装、UI、mutex 等は決定しない。
- **完了 / 再確認:** 四条件を個別に欠くケース、permission / ordinary `UNLOCKED` / Account selection / previous authentication を代替にするケース、context 変更後の pre-sign 再確認を、target の state / acceptance から一意に判定できること。

### SR-005 — Mainnet release / evidence gate の契約不足（Major / New）

- **対象:** target §2.3、§18.1、§26、§31.15、§33 の `BR-013` traceability。
- **確認事実:** target は Mainnet signing を ADR 0001 と release gate を満たす build に限定し、gate 未達成または判定不能なら Mainnet signing を利用可能と報告しない。しかし、current Interfaces §7.4、CR-NFR-006、Signing Protocol §21.1 が明示する gate の非代替性（Scope、availability、Provider capability、connection、permission、wallet-core capability、test success、response / delivery success 等）、missing / invalid / expired / inconsistent / unverifiable / unknown の全 fail-closed 条件、Testnet-only 継続、および release / evidence authority の関係が target の normative contract と acceptance に揃っていない。
- **問題:** §18.1 の `Mainnet release capability` と §31.15 の「gate と一致」だけでは、実装が Provider capability、connection、permission、wallet-core capability または response success を gate の代替にすることを対象本文から排除できない。また、Mainnet gate 不成立時に Testnet-only を安全に継続できることが明記されていない。
- **影響:** gate evaluator / release evidence の判定を Browser Provider の availability や runtime capability に誤って移し、Mainnet signing が fail-open になる、または gate failure が Testnet-only capability まで不要に停止する可能性がある。
- **最低限の修正:** current common contract を参照するだけでなく、target §2.3、§18、§26、§31.15、§33 に、Mainnet capability は current release / evidence gate を満たす trusted Signer だけが有効化し、上記の availability / capability / connection / permission / wallet-core / response 等は代替でなく、gate の missing / invalid / expired / inconsistent / unverifiable / unknown は disabled / unavailable とすることを明示する。Testnet-only の安全な継続を不必要に阻害しないこと、gate evaluator / release authority は release policy 側にあることも trace する。evaluator の実装方式は固定しない。
- **完了 / 再確認:** Mainnet route の gate pass / fail / unknown と Testnet-only route、Provider availability / capability、connection / permission、wallet-core result、response delivery を分離する conformance case を target から検証できること。

### SR-006 — Result / delivery semantics の Provider route mapping 不足（Major / New）

- **対象:** target §5.2、§12.1、§20.2、§22.1〜§22.2、§31.10〜§31.13。
- **確認事実:** target は Provider の successful result を direct `SignedTransaction` / `SignedMessage` とし、state から `DELIVERY_UNKNOWN` を除外し、`RESULT_UNKNOWN` と `SUCCEEDED + DELIVERY_UNKNOWN` を記載する。しかし `PENDING`、`DELIVERED`、`deliveryDisposition`、`signingOutcome: 'SUCCEEDED'` および SDK public `MosaicLynxSigningResult<T>` への mapping は定義していない。Handoff §5.1 / §5.2.1 / §7.2 と SDK §5.1 / §5.4 は、known result、Signer-originated `RESULT_UNKNOWN`、`PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` の意味不変な mapping を要求する。Handoff は Provider の内部 representation 自体は異なり得るとしているが、target は page-facing Provider と internal representation の関係を明示していない。
- **問題:** local Provider の Promise resolve、response delivery、event emission または direct signed result を、Signer-originated result / delivery disposition とどう相関するかが一意でない。Provider が `RESULT_UNKNOWN` を error に縮退する、`DELIVERY_UNKNOWN` を `RESULT_UNKNOWN` / failure に変換する、または SDK が Provider route だけ disposition を生成する解釈を対象本文から排除できない。
- **影響:** Extension Provider route と Mobile Relay route の SDK 公開 semantics が分岐し、結果不確実性の後の automatic re-sign、delivery uncertainty の誤った failure 化、または transport completion による誤った `DELIVERED` 推定が起こり得る。
- **最低限の修正:** target は Handoff §5.2.1 / §7.2 を concrete mapping authority として参照し、Provider の internal direct result representation と SDK public `MosaicLynxSigningResult<T>` を分離する。Signer-originated `RESULT_UNKNOWN` は `resultUnknown`、known signed result は `outcome: 'succeeded'` と `deliveryDisposition`（`PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN`）を意味不変に伝達し、Provider / SDK / transport / Promise settlement は disposition を生成・推測・確定しないことを明示する。cosignature の open scope は既存 OPEN のままとし、未確定の union を独自追加しない。
- **完了 / 再確認:** known success、Signer-originated `RESULT_UNKNOWN`、各 delivery disposition、Provider response loss、SDK timeout、Relay ACK / consumed state、page lifecycle loss の mapping と automatic re-sign 禁止を、local Provider と remote route の両方で一意に判定できること。

## 8. Optional Improvements

Minor の新規 formal finding はない。UI pixel / layout、Chrome API の具体順、Manifest、storage engine、queue / mutex、exact timeout、framework、test framework、release evaluator 実装は Specification phase boundary 外であり、今回の required change にしていない。

## 9. Resolved Findings

### SR-003 — Product Specification と Provider / SDK / Handoff method shape

target §5.1〜§5.2 の `getActiveAccount(scope)`、`cosignTransaction()`、Scope 付き connection / signing shape は、現行 Provider package evidence、Handoff §5.1 / §6.1 および SDK §5.1 / §9 に一致する。Product Specification §16.1 は `getActiveAccount()` の Scope を省略し、`cosignTransaction()` を列挙していないため、Product / Provider contract の upstream synchronization issue は残る。

ただし target §2.2 は SDK / Provider method authority を SDK、Handoff、Interfaces に置き、Product Specification を transaction / message bytes の authority として扱っている。したがって、この不一致だけを理由に target が古い Product の method shape へ戻る必要はない。owner は Product Specification と Provider / SDK / Handoff の契約同期であり、今回の Browser target finding としては `Resolved` とする。Product 側の最終 authority が変更される場合は、後続の cross-document review と Provider contract 更新が必要である。

## 10. Deferred Findings

対象本文が上流の未決事項を独自に閉じず、安全側の条件を保持しているため、次の既存 OPEN は deferred とした。SR-001、SR-002、SR-004〜SR-006 の required change を代替しない。

| OPEN                                                              | 判定            | 継続できる理由                                                                                          | 維持すべき安全側条件                                                                                  |
| ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `OPEN-BEX-002` Provider discovery / multiple Provider             | 妥当な deferred | selection policy、capability identifier、compatibility matrix は SDK / Interfaces OPEN に委譲されている | API major 2、malformed / incompatible の fail-closed、自動 fallback 禁止                              |
| `OPEN-BEX-003` frame / caller proof / Origin canonicalization     | 妥当な deferred | 初回は top-level とし、Browser observation の exact method を独自固定していない                         | browser-observed caller、iframe 拒否、caller を一意に binding できない場合の拒否                      |
| `OPEN-BEX-004` permission expiry / session persistence / recovery | 妥当な deferred | expiry、persistence、recovery の方式を upstream OPEN に残している                                       | old approval / authentication / session の推測復元、automatic re-sign の禁止                          |
| `OPEN-BEX-005` authentication / UI / update compatibility         | 妥当な deferred | UI framework、OS API、migration を固定せず、四条件の security invariant だけを固定できる                | ordinary `UNLOCKED`、connection、過去の authentication を signing gate としない                       |
| `OPEN-BEX-006` public Aggregate / cosignature scope               | 妥当な deferred | Provider / SDK の required / optional scope と public result field は上流 OPEN に残る                   | full parent、embedded / inner、role の inspection、hash-only / summary-only / chain conversion の禁止 |

`OPEN-BEX-001` は SR-001 の対象であり、現状のまま deferred として扱わない。public / internal Account boundary を確定した後に再判定する。

## 11. Cross-document Consistency

| 領域                              | 現行 target                                                                                                             | 最新上流との比較                                                                                                                                                | 判定 / owner                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Account / internal Account | §10.1 は public identity と internal ID を区別するが、§5.2 の selector と Provider Account record を未確定とする        | Interfaces §5.3、SDK §5 / §7、Handoff §5.2 は page-facing に internal ID / opaque handle を禁止。Handoff §6.1 は SDK adapter 内部の `accountId` routing を許容  | `SR-001`。target は page/internal routing の境界を反映して確定する必要がある。Product §11.3 の public `accountId` は upstream owner を要確認 |
| Error authority                   | §5.4 は ProviderErrorCode 集合と Handoff / SDK concrete authority を併記                                                | Handoff §10 が concrete SDK public authority。Interfaces §10.2 / SDK §13.1 は Handoff にない `INVALID_MESSAGE` / `NONCE_REUSED` を public SDK code に追加しない | `SR-002`。Provider API / Handoff の layer mapping owner が必要                                                                               |
| Provider method shape             | scoped `getActiveAccount`、`cosignTransaction` を記載                                                                   | SDK / Handoff / Provider evidence と一致。Product §16.1 が古い                                                                                                  | `SR-003` は target 側 `Resolved`。Product / Provider contract synchronization が non-blocking follow-up                                      |
| Common four conditions            | §7.2 に列挙するが、`AUTHORIZED` / wallet-core call / invariant は approval + authentication 中心                        | Interfaces §9.7、Signing Protocol §8、Browser Extension Design §4 / §5.3 は四条件を独立必須 gate として operational に適用                                      | `SR-004`。Browser target owner                                                                                                               |
| Mainnet release / evidence gate   | §2.3 / §31.15 は gate 未達成・判定不能を unavailable とする                                                             | Interfaces §7.4、CR-NFR-006、Signing Protocol §21.1 は非代替性、全 fail-closed 条件、Testnet-only 継続、release authority を明示                                | `SR-005`。Browser target は common contract を明示的に取り込む                                                                               |
| Result / delivery                 | §12、§20、§22 は `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を区別するが、三つの delivery disposition と SDK mapping がない | Handoff §5.1 / §5.2.1 / §7.2、SDK §5.1 / §5.4 が public wrapper と mapping を確定                                                                               | `SR-006`。Browser Provider / SDK boundary owner                                                                                              |

## 12. Scope and Traceability

対象本文の scope boundary は概ね適切である。SDK implementation、Relay protocol、Mobile、wallet-core internals、Chrome API、UI layout、storage、queue / mutex、exact timeout、cryptographic implementation、release evaluator implementation を直接固定していない。今回の finding は、これらの実装方式ではなく、外部で観測される Provider / SDK contract、Signer gate、error / result semantics および Mainnet capability の authority が一意でないことに限定した。

| 上流要求 / 契約                                                                                   | 対象本文の対応                           | 評価                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| BR-001〜BR-012、BR-004 / BR-005 / BR-007 / BR-008                                                 | §2、§6〜§9、§13、§17、§19〜§26、§29〜§31 | Chrome scope、observed Origin、trusted UI、inspection、lifecycle、secret、fallback 禁止は追跡可能。                            |
| BR-013、CR-NFR-006、Interfaces §7.4、Signing Protocol §21.1                                       | §2.3、§18.1、§26、§31.15、§33            | gate の存在は追跡可能だが、非代替性・全 fail-closed 条件・Testnet-only・authority の明示不足が `SR-005`。                      |
| CR-016、CR-AC-017、Browser Extension Design §4 / §5.3、Signing Protocol §8 / §9.1                 | §7.2、§17.2、§18、§29、§31               | §7.2 に四条件があるが、`AUTHORIZED`、wallet-core invocation、invariant、acceptance が四条件を完全に引き継がないため `SR-004`。 |
| Interfaces §5.3、SDK §5 / §7、Handoff §5 / §6.1                                                   | §5.1〜§5.2、§10.1、§32 `OPEN-BEX-001`    | public identity の原則は追跡可能だが、page selector と internal routing の境界が未確定で `SR-001`。                            |
| Interfaces §10、Signing Protocol §16、Handoff §10、SDK §13                                        | §5.4、§27、§33                           | logical / signing outcome / concrete code の authority は追跡可能だが、Provider code の層と mapping が不明で `SR-002`。        |
| Interfaces §6.3 / §10.3、Signing Protocol §6 / §19、Handoff §5.1 / §5.2.1 / §7.2、SDK §5.1 / §5.4 | §12、§20、§22、§31                       | unknown / delivery の安全側原則は追跡可能だが、Provider route の public mapping が不足し `SR-006`。                            |
| Product §16.1、Provider API、SDK §5、Handoff §5.1 / §6.1                                          | §5.1〜§5.2                               | target は current downstream shape を選択しており、Product の古い method block は `SR-003` の cross-document owner。           |

## 13. Regression Review / Domain Checks

### 13.1 Previous finding regression

- `SR-001`: Public Account Identity の normative shape と internal routing の原則は上流で明確化され、前回より改善した。ただし target の selector / Provider-native record boundary が残るため `Partially Resolved` / formal `Open`。
- `SR-002`: Handoff §10、Interfaces §10.2、SDK §13.1 は前回の error authority を維持している。target §5.4 / §27 の Provider code 列挙と layer mapping は変わらず、`Unresolved` / formal `Open`。
- `SR-003`: current SDK / Handoff / Provider shape に対する target の選択は適合する。Product §16.1 の同期課題は target の責任ではないため `Resolved（target responsibility）`。

### 13.2 Security / lifecycle / interoperability checks

| Check                                           | 判定            | 根拠                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser Trust Boundary / Origin authority       | Pass            | page、SDK、injected bridge、Content Script は untrusted。target §7 は browser-observed top-level Origin、sender、tab / frame / document を authority とし、page self-declared Origin、iframe / child frame、unsupported scheme を signing authority にしていない。                            |
| Profile-local security context                  | Fail — `SR-004` | request、caller、Profile、Account、Chain / Network、permission、capability、target、inspection は binding されるが、四条件を同じ context の独立 gate として `AUTHORIZED` / wallet-core call に一貫して要求していない。                                                                        |
| Common four conditions                          | Fail — `SR-004` | §7.2 の列挙はあるが、Authentication、Signing-capable unlock、Account authorization、Explicit user approval の全てを operational state / pre-sign 条件として明示していない。                                                                                                                   |
| Public / internal Account boundary              | Fail — `SR-001` | public field の禁止はあるが、Provider selector / Account record の page visibility と internal routing が一意でない。                                                                                                                                                                         |
| Error authority                                 | Fail — `SR-002` | Handoff concrete code と ProviderErrorCode の層および mapping が未確定。`INVALID_MESSAGE` / `NONCE_REUSED` の public / internal 解釈が分岐する。                                                                                                                                              |
| Transaction / message / Aggregate / cosignature | Pass            | §14〜§16 は Chain Compatibility、full inspection、Symbol / NEM の分離、structured `MESSAGE_SIGN`、full parent / embedded / inner、hash-only / raw fallback 禁止を維持する。公開 cosignature scope は existing OPEN として扱う。                                                               |
| Result / delivery semantics                     | Fail — `SR-006` | `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の区別はあるが、`PENDING` / `DELIVERED` と SDK public wrapper への local Provider mapping がない。                                                                                                                                                     |
| Retry / fallback                                | Pass            | rejection、auth / lock、permission、mismatch、integrity、replay、inspection、Mainnet gate、unknown、delivery uncertainty、transport failure の automatic re-sign / route fallback を禁止している。                                                                                            |
| Mainnet release / evidence gate                 | Fail — `SR-005` | gate 未達成 / 判定不能の拒否はあるが、common gate の非代替性、全 fail-closed 条件、Testnet-only 継続および evaluator authority の target contract が不足する。                                                                                                                                |
| Lifecycle / concurrency                         | Pass            | navigation、reload、tab / frame change、Provider / Content replacement、Service Worker restart、update、lock、Profile / Account / permission change、timeout、cancellation、duplicate / replay、concurrent isolation を列挙し stale approval / response の再利用を禁止する。                  |
| Secret / wallet-core boundary                   | Pass            | private key、Mnemonic、password、decrypted Wallet Store、credential、internal ID、不要な full payload、stack / path を page / SDK / Provider / diagnostics 等へ出さず、wallet-core の crypto / Store / raw signing を再定義していない。SR-004 の gate不足はこの boundary の別問題として扱う。 |
| Specification phase boundary                    | Pass            | formal finding は observable contract、authority、security invariant、mapping の不足に限定した。source layout、Chrome call order、React、mutex、exact timeout、DB schema、crypto / evaluator implementation を要求していない。                                                                |

### 13.3 Automatic changes / implementation evidence

現行 `packages/provider-api` は `MosaicAccount.id` / `profileId`、Provider `accountId` selector、旧 ProviderErrorCode を持ち、`packages/sdk` は direct signed result と一部旧 error mapping を持つ。これは SR-001、SR-002、SR-006 のリスクを具体化する supplementary evidence だが、実装を normative authority として Specification の不足を埋めていない。レビュー中に実装を自動修正しなかった。

## 14. Validation Results

| Validation                                                                  | 結果                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target Markdown formatter                                                   | `pnpm exec prettier --check docs/specifications/browser-extension.md` を実行し、成功。                                                                                                                              |
| Review artifact formatter                                                   | 作成後に `pnpm exec prettier --write docs/reviews/specifications/browser-extension-review-002.md`、続けて `pnpm exec prettier --check docs/reviews/specifications/browser-extension-review-002.md` を実行し、成功。 |
| Whitespace                                                                  | `git diff --check` を実行し、成果物の whitespace error なし。                                                                                                                                                       |
| Markdown local link / path                                                  | artifact、target および evidence に記載した repository-relative path を確認する script を実行し、missing local target なし。                                                                                        |
| Markdown table structure                                                    | artifact の pipe table の delimiter / row column 数を確認する script を実行し、構造 error なし。                                                                                                                    |
| TypeScript code block syntax                                                | target の fenced TypeScript block を Prettier / fence pairing で確認し、syntax / fence error なし。review artifact に TypeScript code block はない。                                                                |
| Provider API shape consistency                                              | target §5.1〜§5.2、Handoff §5.1 / §6.1、SDK §5、Product §16.1、Provider package を manual comparison し、SR-003 と cross-document owner を判定。                                                                    |
| Public Account / internal Account boundary                                  | target §10.1、Interfaces §5.3、SDK §7、Handoff §5.2 / §6.1、Provider evidence を manual comparison し、SR-001 を判定。                                                                                              |
| Error authority                                                             | Interfaces §10、Signing Protocol §16、Handoff §10、SDK §13、target §5.4 / §27、Provider error set を manual comparison し、SR-002 を判定。                                                                          |
| SDK result semantics                                                        | Handoff §5.1 / §5.2.1 / §7.2、SDK §5.1 / §5.4 と target §12 / §20 / §22 を manual comparison し、SR-006 を判定。                                                                                                    |
| Four conditions                                                             | Requirements CR-016、Interfaces §9.7、Signing Protocol §8 / §9.1、Browser Extension Design §4 / §5.3 と target §7 / §12 / §17 / §18 / §29 / §31 を manual comparison し、SR-004 を判定。                            |
| Mainnet gate                                                                | CR-NFR-006、Interfaces §7.4、Signing Protocol §21.1、SDK §6 と target §2.3 / §18 / §26 / §31.15 を manual comparison し、SR-005 を判定。                                                                            |
| lifecycle / concurrency                                                     | target §20〜§25、Signing Protocol、Browser Extension Design、SDK / Handoff を manual comparison し、Pass。                                                                                                          |
| Trust Boundary / secret                                                     | target §6〜§7、§18〜§19、§28〜§29 と Security / Architecture / Browser Design を manual comparison し、Trust Boundary と secret leakage の回帰なし。                                                                |
| Previous finding status                                                     | SR-001〜SR-003 を current upstream と再比較し、Finding Status、Required / Deferred、Gate、Final Decision の参照整合を確認。                                                                                         |
| Review Gate / Final Decision consistency                                    | Gate 2〜7 の Fail を SR-001、SR-002、SR-004〜SR-006 に対応付け、`REVISE SPECIFICATION` と整合することを確認。                                                                                                       |
| Source build / Chrome runtime / real wallet-core / Mainnet release evidence | **Not validated**。今回の Specification Review 範囲外であり、source build、Chrome runtime、実 wallet-core、Mainnet release evidence の実行はしていない。                                                            |

## 15. Review Gates

| Gate                  | 判定     | 根拠                                                                                                                                                                                                                                                                                 | 対応                                             |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1. 目的と範囲         | **Pass** | Browser local Signer の対象、Provider / privileged host / UI / wallet-core の境界、Mobile / Relay / implementation の対象外が明確。                                                                                                                                                  | なし                                             |
| 2. 契約               | **Fail** | `SR-001` の Account projection / selector、`SR-002` の Provider / Handoff error authority、`SR-006` の result mapping が page / SDK / Provider 契約を一意にできない。                                                                                                                | `SR-001`、`SR-002`、`SR-006`                     |
| 3. 処理と例外         | **Fail** | admission、inspection、approval、lifecycle、retry / fallback は明確だが、`SR-004` の四条件を満たさない `AUTHORIZED` / wallet-core call と、`SR-006` の unknown / delivery mapping が残る。                                                                                           | `SR-004`、`SR-006`                               |
| 4. 内部整合性         | **Fail** | §7.2 は四条件を必須とする一方、§12 / §18 / §29 は approval + authentication を実 operational condition とし、Account selector / Provider code / result representation の層も混在する。                                                                                               | `SR-001`、`SR-002`、`SR-004`、`SR-006`           |
| 5. 検証可能性         | **Fail** | public Account schema / selector visibility、Provider code mapping、four-condition gate、Mainnet gate case、Provider-to-SDK result disposition を target から一意に contract-test 化できない。                                                                                       | `SR-001`、`SR-002`、`SR-004`、`SR-005`、`SR-006` |
| 6. 安全性と相互運用性 | **Fail** | Origin、secret、inspection、chain separation、no fallback は Pass。ただし四条件、Mainnet fail-closed、error authority、result / delivery semantics の不足は signing safety / cross-transport interoperability に影響する。                                                           | `SR-001`、`SR-002`、`SR-004`、`SR-005`、`SR-006` |
| 7. 上流整合性         | **Fail** | Interfaces / Signing Protocol / Browser Design の four-condition contract、Interfaces / Handoff / SDK の Account / result contract、CR-NFR-006 の Mainnet gate を target が完全には追随していない。Product method mismatch は target finding ではなく SR-003 の upstream follow-up。 | `SR-001`、`SR-002`、`SR-004`、`SR-005`、`SR-006` |

Gate 1 は Pass だが、Gate 2〜7 のいずれかが Fail であるため、Skill の判定規則により Review Result は `REVISE SPECIFICATION` とする。

## 16. Remaining Risks and Open Decisions

- SR-001 が残る間、page-facing Account projection、Provider selector、SDK adapter routing、expected signer および permission authorization の境界を実装者が独自解釈するリスクがある。
- SR-002 が残る間、Provider package の error code と Handoff public SDK error の相互 mapping が不明で、`INVALID_MESSAGE` / `NONCE_REUSED` の public exposure が common contract と衝突するリスクがある。
- SR-004 が残る間、ordinary `UNLOCKED`、permission、Account selection または `every-signature` authentication が、Signing-capable unlock / Account authorization の代替として扱われるリスクがある。
- SR-005 が残る間、Mainnet gate の evaluator / release authority と Provider capability / availability が結び付く、または gate failure が Testnet-only を不要に停止するリスクがある。
- SR-006 が残る間、local Provider が SDK public result wrapper、Signer-originated unknown、delivery disposition を remote route と異なる意味へ変換するリスクがある。
- `OPEN-BEX-002`〜`OPEN-BEX-006` は継続する。特に capability negotiation、permission expiry / recovery、Browser caller proof、authentication / update compatibility、cosignature public scope は、既存の安全側条件を維持した上で対応する上流 owner が決定する。
- Product §16.1 と current Provider / SDK / Handoff の method shape synchronization は owner 未確定のまま残る。SR-003 の `Resolved（target responsibility）` は Product の最終 authority を確定したことを意味しない。
- Provider API / SDK implementation は current common Specification と不一致する evidence があるが、実装修正、source build、runtime E2E、real wallet-core、Mainnet release evidence は今回実施していない。

## 17. Automatic Changes

レビュー中に自動変更は行っていない。変更したファイルは本 review artifact のみであり、target、Requirements、Design、common Specification、Product、Provider implementation、SDK implementation、test および previous review は変更していない。

## 18. Final Decision

`REVISE SPECIFICATION`

- `SR-001`: **Partially Resolved / formal Open / Critical**。上流の public / internal 原則は改善したが、target の Provider selector / Account record 境界が未確定。
- `SR-002`: **Unresolved / formal Open / Critical**。ProviderErrorCode と Handoff concrete public error の層および mapping が未確定。
- `SR-003`: **Resolved（target responsibility）**。Product §16.1 の method shape は upstream synchronization issue として owner に返す。
- `SR-004`: **New / Critical**。common four conditions を `AUTHORIZED`、pre-sign、wallet-core invocation、acceptance へ一貫して適用する必要がある。
- `SR-005`: **New / Major**。Mainnet release / evidence gate の authority、非代替性、fail-closed、Testnet-only 継続を明示する必要がある。
- `SR-006`: **New / Major**。Provider route と SDK `MosaicLynxSigningResult<T>` の result / delivery mapping を明示する必要がある。

Trust Boundary、Origin authority、secret boundary、lifecycle / concurrency、full inspection、Symbol / NEM separation および automatic fallback 禁止に重大な回帰は確認しなかった。しかし、四条件、Account / selector、error authority、Mainnet gate、result / delivery contract は署名前の安全性または downstream interoperability を直接拘束するため、current target を `BROWSER EXTENSION SPECIFICATION READY` として扱わない。Required Changes の完了後に再レビューする。
