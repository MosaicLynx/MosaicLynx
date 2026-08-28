# MosaicLynx 共通 Interface / Data Model Specification 再レビュー

## 1. Review Target

- 対象: [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)
- 対象 revision: `7f14f7f`（対象本文の SR-001〜SR-005 修正は `9295ec2`、公開 signing result / delivery disposition の追加修正は `7f14f7f`）
- 確認日: 2026-08-28
- 今回の成果物: `docs/reviews/specifications/interfaces-review-004.md`
- 前回レビュー: [`interfaces-review-003.md`](./interfaces-review-003.md)
- レビュー種別: 最新の `spec-review` Skill と共通 review framework に基づく独立 Specification Review
- レビュー範囲: 前回 `SR-001`〜`SR-005` の修正状態、`IS-001` の回帰、common four conditions、Profile-local security context、concurrent request isolation、公開 Account 境界、signing outcome / delivery disposition、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、公開 SDK result、Promise semantics、Handoff → SDK → dApp mapping、local / remote consistency、Relay ACK、known-result recovery、retry / fallback、Mainnet release / evidence gate、version / compatibility、既存 OPEN、関連 Specification との cross-document 整合性。
- 変更範囲: 新規レビュー成果物のみ。対象 Specification、Requirements、Design、関連 Specification、ADR、source、test および過去レビュー成果物は変更していない。
- 未確認範囲: source build、runtime、Mobile App runtime、Provider / Relay E2E、実機、release evidence の実行評価。下流の Browser Extension / Provider の旧 public contract は文書・公開型の整合性として確認したが、実装修正の妥当性は今回の対象外とした。

## 2. Execution Audit

サブエージェントは使用していない。Chair が Reviewer A〜C の観点を結論を混ぜずに別走査し、最後に反証・統合した。

| パス                             | 確認範囲                                                                                                                                                           | 結果                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: 契約の明確性と完全性 | `interfaces.md` の primitive、request / response union、common signing gate、Profile context、lifecycle、error、serialization、validation、public result への委譲  | SR-001〜SR-005 の完了条件が肯定形で確認でき、対象本文内の必須 field、排他関係、状態、禁止事項を一意に検証できる。                                                                                       |
| Reviewer B: 利用価値と運用適合性 | Requirements / Design、Signer・SDK・Relay の authority、dApp から観測される success / rejection / unknown、local / remote、Mainnet gate、既存 OPEN                 | upstream requirements / design と対象の追跡は整合。下流 Browser Extension / Provider の旧 result / error / selector は owner を分離して記録した。                                                       |
| Reviewer C: 安全性と相互運用性   | security boundary、four conditions、Profile / request isolation、Signer-only disposition、Relay opaque、Handoff / SDK / Signing Protocol、Chain / Network、version | `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の non-collapse、Relay ACK の非 authority、no re-sign / fallback、Mainnet fail-closed を確認。Signing Protocol の `AUTHORIZED` 表記は下流同期事項として記録した。 |
| Chair: 反証・統合                | 過去 finding の重複・再発、新要求の発明、phase boundary、upstream return、downstream delegation、gate / decision consistency                                       | `IS-001` と `SR-001`〜`SR-005` はすべて `Resolved`。対象 `interfaces.md` に対する新規 formal finding はなし。                                                                                           |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                              | 用途                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`interfaces.md`](../../specifications/interfaces.md)                                                                                                                                                                                                             | 対象本文。§5.3、§6.1〜§6.4、§7.4、§8.4〜§8.5、§9.6〜§9.7、§10.1〜§10.3、§12、§13.1、§15〜§19 の current contract、禁止事項、OPEN、責務、traceability を確認した。                                            |
| [`interfaces-review-003.md`](./interfaces-review-003.md)                                                                                                                                                                                                          | `IS-001`、`SR-001`〜`SR-005` の初出、前回の指摘内容、前回 Gate 2〜7 の Fail と今回の再確認対象を確認した。過去レビューの結論を根拠として機械的に継承していない。                                             |
| 修正コミット [`9295ec2`](https://github.com/MosaicLynx/MosaicLynx/commit/9295ec2a83a432fb3723b99240e35e8f026f3dd3) / [`7f14f7f`](https://github.com/MosaicLynx/MosaicLynx/commit/7f14f7fad5beed98a86c409f06a0a2179a35a6f8)                                        | 対象本文、Handoff、SDK、Signing Protocol の変更範囲と、公開 signing result / delivery disposition の追加範囲を確認した。コミット説明だけでは status を確定していない。                                       |
| [共通 Requirements](../../requirements/requirements.md)、[Browser Extension 要件](../../requirements/browser-extension.md)、[Mobile App 要件](../../requirements/mobile-app.md)、[Relay 要件](../../requirements/relay.md)、[SDK 要件](../../requirements/sdk.md) | `CR-016`、`CR-AC-017`、`CR-NFR-006`、`CR-NFR-008`〜`CR-NFR-012`、`SDK-FR-008`〜`SDK-FR-011`、`BR-013`、`MR-AC-009`、Relay の opaque / failure / recovery 要求との追跡を確認した。                            |
| [Architecture](../../design/architecture.md)、[Security Design](../../design/security-design.md)、[Signing Flow](../../design/signing-flow.md)、[Interfaces Design](../../design/interfaces.md)                                                                   | Signer / SDK / Relay / wallet-core の authority、common four conditions、Profile-local context、concurrent isolation、no automatic fallback、Mainnet release / evidence gate の upstream design を確認した。 |
| [Browser Extension Design](../../design/browser-extension.md)、[Mobile App Design](../../design/mobile-app.md)、[Relay Design](../../design/relay.md)、[SDK Design](../../design/sdk.md)                                                                          | platform 下流へ委譲された caller、Account、approval、delivery、transport、recovery、public result mapping の責務を確認した。                                                                                 |
| [Signing Protocol](../../specifications/signing-protocol.md)                                                                                                                                                                                                      | common state、approval / authentication、failure、delivery、retry、Signer authority との整合を確認した。`AUTHORIZED` の一部表記は下流同期事項として分離した。                                                |
| [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                     | §5.1、§5.2、§5.2.1、§6、§7.2、§9.6、§10、§14 の concrete API、Relay response union、公開 error authority、ACK、delivery disposition、Handoff → SDK mapping を重点確認した。                                  |
| [SDK Specification](../../specifications/sdk.md)                                                                                                                                                                                                                  | §5、§5.2〜§5.4、§8〜§13、§15〜§19 の `MosaicLynxSigningResult<T>`、Promise、local / remote semantics、transport failure、no fallback、version / OPEN を重点確認した。                                        |
| [Relay Specification](../../specifications/relay.md)、[Browser Extension Specification](../../specifications/browser-extension.md)                                                                                                                                | Relay の opaque / transport-only boundary、ACK / consumed state、Browser Provider の public projection、旧 result / error / selector の下流整合性を確認した。                                                |
| [Profile / Account Specification](../../specifications/profile-account-spec.md)                                                                                                                                                                                   | Profile / Account の内部モデル、署名時 `every-signature`、Public Account へ内部 ID を漏らさない境界を確認した。                                                                                              |
| [Chain Compatibility Specification](../../specifications/chain-compatibility-spec.md)、[Product Specification](../../specifications/product-spec.md)                                                                                                              | Symbol / NEM、Mainnet / Testnet、target / signer / Account、chain-specific validation、旧 Provider / `accountId` 記述との境界を確認した。                                                                    |
| [`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、reviewers、review-gates、output-format、[`review-common`](../../../.agents/skills/review-common/review-playbook.md)                                                                       | `SR` prefix、`Critical/Major/Minor`、finding status、7 Review Gate、Review Result、Final Decision、upstream return、downstream delegation、phase boundary、成果物の章構成を確認した。                        |
| [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)                                                                                                                                                            | 変更範囲、source of truth、secret、Chain / Network、Mobile 未実装、検証、Git 運用を確認した。                                                                                                                |

## 4. Review Result

`READY`

## 5. Summary

前回 `SR-001`〜`SR-005` の不足は、対象 `interfaces.md` の現行本文で解消されている。

- `Authentication`、`Signing-capable unlock`、`Account authorization`、`Explicit user approval` が、同一 request、caller / source、Profile-local context、Account、Chain / Network、operation、signing target、freshness に binding された独立必須 gate として §9.7、§12.1、§13、§15、§16 に定義されている。`AUTHORIZED` は4条件すべての成立を意味し、missing、stale、revoked、locked、unknown、mismatch では wallet-core call と success が禁止される。
- Profile は public field ではなく Signer-local security context とされ、request、session、permission、inspection、approval、authentication、unlock、Account authorization、wallet-core call / result、recipient / delivery まで同じ context に binding される。Profile / Account / Chain / Network / caller / permission / session / lifecycle の変更時の invalidation と、複数 request の独立性が明記されている。
- `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は二軸に分離され、前者は trusted Signer の signing generation outcome、後者は valid signed result に付随する Signer-side delivery disposition とされた。SDK、Provider、Relay、transport、timeout、outage、response absence、disconnect、recipient offline、lifecycle loss 等から生成・推測・確定しない。
- Handoff と SDK は `MosaicLynxSigningResult<T>`、`signTransaction()` / `signData()` の Promise resolve / reject、Handoff response mapping、local / remote 共通 semantics、ACK と Signer-side disposition の分離、`PENDING` / `DELIVERY_UNKNOWN` の result 保持、known-result recovery、no re-sign / fallback を具体化している。
- Mainnet signing capability は trusted Signer と current release / evidence gate に従属し、gate の missing、invalid、expired、inconsistent、unverifiable、unknown では disabled / unavailable となる。Scope、capability、Provider / SDK / Relay / OS / wallet-core state、test success、signed response は代替にならず、Testnet-only 継続は妨げない。

`IS-001` も、対象 `interfaces.md` と Handoff §10 の concrete public error authority、`INVALID_MESSAGE` / `NONCE_REUSED` の非許容、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の error taxonomy 外という条件を満たしており、`Resolved` を維持する。

下流には、[Browser Extension Specification](../../specifications/browser-extension.md) §5.2 が `SignedTransaction` / `SignedMessage` を返す旧 Provider shape、同 §5.1 の旧 Provider error code、`@mosaiclynx/provider-api` の内部 selector / `profileId` を含む型が残る。これは対象共通 contract の欠陥ではなく、Browser Extension / Provider contract と実装の owner に委譲する。対象 `interfaces.md` の `SR-001`〜`SR-005` を Reopen する根拠にはしない。

## 6. Finding Status

| ID       | Severity                           | Status   | 初出レビュー            | 今回の状態根拠                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IS-001` | Major（現行 Skill 尺度での再評価） | Resolved | `interfaces-review-001` | `interfaces.md` §6.3、§10.2 は Handoff §10 を concrete public error authority とし、`INVALID_MESSAGE` / `NONCE_REUSED` を公開 code として扱わない。§10.3、Handoff §7.2 / §10 は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を error code に含めない。                |
| `SR-001` | Critical                           | Resolved | `interfaces-review-003` | §9.7 は4条件を独立必須 gate とし、同一 context binding、非代替性、`AUTHORIZED` / `SIGNING` / `SUCCEEDED` の fail-closed、wallet-core call 禁止を定義。§15 invariant 3〜4 と §19 完了条件も一致する。                                                            |
| `SR-002` | Critical                           | Resolved | `interfaces-review-003` | §8.4 が Profile-local context、request〜delivery binding、全指定 lifecycle invalidation、古い状態の再割当て禁止を定義し、§8.5 が concurrent request の security / lifecycle unit 分離を定義。                                                                   |
| `SR-003` | Critical                           | Resolved | `interfaces-review-003` | §6.3、§10.3、§12.3、§13.1、§15、§16 が二軸 union、Signer-only authority、transport からの生成禁止、non-collapse、`SUCCEEDED + DELIVERY_UNKNOWN`、known-result recovery を定義。Handoff / SDK の concrete mapping も一致する。                                   |
| `SR-004` | Critical                           | Resolved | `interfaces-review-003` | §6.4、§13.1、§14.2、§15 が列挙された security / integrity / mismatch / unknown / delivery / transport failure 後の automatic retry、re-sign、alternate route fallback を禁止し、新規署名に fresh request / context / validation / 4条件 / approval を要求する。 |
| `SR-005` | Critical                           | Resolved | `interfaces-review-003` | §7.4、§12.2、§15〜§16 が trusted Signer + current release / evidence gate、代替不可、判定不能時の Mainnet disabled / unavailable、Testnet-only 継続、詳細方式の release authority 委譲を定義。                                                                  |

## 7. Required Changes

なし。現行の `Critical` / `Major` の `New`、`Open`、`Reopened` はない。

## 8. Optional Improvements

なし。対象 `interfaces.md` に対して現在必要な `Minor` の `New`、`Open`、`Reopened` はない。

## 9. Resolved Findings

### `IS-001`: Resolved — Handoff §10 の concrete public error authority

- **Severity:** `Major`（現行 Skill 尺度による再評価）
- **初出:** `interfaces-review-001`
- **現在の確認:** `interfaces.md` §6.3 の `RelayResponse.errorCode` は Handoff §10 の `MosaicLynxSDKErrorCode` を参照し、Handoff にない値を受け付けない。§10.2 は code 集合、mapping、error 型を再定義せず、`INVALID_MESSAGE` / `NONCE_REUSED` を公開 code として扱わないと明記する。§10.3 は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を error taxonomy 外として扱う。
- **回帰判定:** Handoff §10 は現行でも `USER_REJECTED`、`UNAVAILABLE`、`NOT_CONNECTED`、`APP_NOT_INSTALLED`、`VAULT_LOCKED`、`REQUEST_EXPIRED`、`INVALID_PARAMS`、`INVALID_TRANSACTION`、`UNSUPPORTED_TRANSACTION`、`CHAIN_MISMATCH`、`NETWORK_MISMATCH`、`SIGNER_MISMATCH`、`CONTEXT_CHANGED`、`INVALID_RESPONSE`、`INTERNAL_ERROR` の集合を持ち、上記4値を含まない。対象と Handoff の authority は一致する。
- **完了条件:** Handoff §10 を concrete public error authority とし、対象が独自 code / alias を追加せず、unknown code を安全側に扱うこと。今回確認できるため `Resolved` を維持する。
- **下流注記:** Browser Extension / Provider の旧 `ProviderErrorCode` に `INVALID_MESSAGE` / `NONCE_REUSED` が残るが、これは既存の下流 contract 整合課題であり、対象 `interfaces.md` が Handoff authority を再発明した事実ではない。

### `SR-001`: Resolved — Common four conditions

- **Severity:** `Critical`
- **初出:** `interfaces-review-003`
- **現在の確認:** §9.7 が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を独立した必須条件として定義し、同一 request、caller / source、Profile-local context、Account、Chain / Network、operation、target、freshness への binding と pre-sign 再確認を要求する。connection、permission、Account disclosure、capability、Provider availability、session、ordinary `UNLOCKED`、過去 Authentication、wallet-core password / Store validation、Relay delivery、SDK / Provider state は代替不可である。
- **完了条件:** 4条件のいずれかが missing、stale、revoked、locked、unknown、mismatch の場合、`AUTHORIZED`、`SIGNING`、`SUCCEEDED` および wallet-core call を禁止することを §9.7、§12.1、§13、§15、§16 から独立検証できる。満たすため `Resolved` とする。

### `SR-002`: Resolved — Profile-local security context / concurrent isolation

- **Severity:** `Critical`
- **初出:** `interfaces-review-003`
- **現在の確認:** §8.4 は Profile を public field ではない Signer-local context とし、request、caller / source、session、permission、Account、Scope、operation、target、inspection、approval、Authentication、Signing-capable unlock、Account authorization、wallet-core call / result、response recipient / delivery を binding する。Profile switch / lock、association、Account、Chain / Network、caller、permission revision、session、context / process / lifecycle loss で active request、Authorization、approval、authentication、Account authorization、delivery context を失効させる。§8.5 は active request 間の context、approval、auth、authorization、result、delivery state の共有・統合・流用を禁止する。
- **完了条件:** 古い approval / auth / authorization / result を別 Profile、request、Account、caller、recipient に流用できず、複数 request が独立 unit であることを確認できる。満たすため `Resolved` とする。

### `SR-003`: Resolved — Result / Delivery semantics

- **Severity:** `Critical`
- **初出:** `interfaces-review-003`
- **現在の確認:** §6.3 の concrete `RelayResponse` は signed / dataSigned の `SUCCEEDED` と signed result / `deliveryDisposition`、resultUnknown の `RESULT_UNKNOWN` を排他的に定義する。§10.3 は `RESULT_UNKNOWN` を trusted Signer が signing generation 自体を確定できない場合だけ、`DELIVERY_UNKNOWN` を valid signed result を保持する Signer の delivery uncertainty と定義する。SDK / Provider / Relay / transport の生成・推測・確定、error / transport / user rejection / signing failure への変換を禁止し、`SUCCEEDED + DELIVERY_UNKNOWN` の result 保持と resend / redelivery / retrieval / lookup 限定 recovery を定義する。
- **関連 concrete contract:** Handoff §5.1、§5.2.1、§7.2、§10 および SDK §5.1〜§5.4、§12.1、§13.3 が同じ union、Promise、mapping、authority を定義する。`RESULT_UNKNOWN` は resolve の `outcome: 'resultUnknown'`、通常 failure は Handoff §10 による reject、known signed result は `outcome: 'succeeded'` である。
- **完了条件:** timeout、Relay outage、network failure、response absence、Provider disconnect、recipient offline、reconnect failure、response delivery failure、page / SDK / Relay lifecycle loss から両 disposition を生成・推測しないこと、Signer-originated value を意味不変に pass-through すること、known-result recovery が新規 signature を生成しないことを確認できる。満たすため `Resolved` とする。

### `SR-004`: Resolved — Retry / fallback

- **Severity:** `Critical`
- **初出:** `interfaces-review-003`
- **現在の確認:** §13.1 は user rejection、Authentication / unlock / Account authorization failure、permission denial / revocation、caller / Origin mismatch、integrity、replay / duplicate、inspection、Chain / Network mismatch、context mismatch、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport / delivery failure 後の automatic signing retry / re-sign / alternate route を禁止する。local ↔ remote、Provider A ↔ B、Signer A ↔ B、Relay failure → local signing、Provider failure → remote signing も禁止する。
- **完了条件:** 新しい署名は利用者が明示的に開始する new request、fresh context、fresh validation、fresh inspection、fresh Authentication、fresh Signing-capable unlock、fresh Account authorization、fresh Explicit user approval でのみ成立し、known result の recovery と signing retry が分離されること。§13.1、§15 および関連 SDK / Handoff から確認できるため `Resolved` とする。

### `SR-005`: Resolved — Mainnet release / evidence gate

- **Severity:** `Critical`
- **初出:** `interfaces-review-003`
- **現在の確認:** §7.4 は current release / evidence policy を満たした trusted Signer だけが Mainnet signing capability を有効化できると定義する。Scope、network、capability、Provider state、connection、permission、Account disclosure、SDK / Relay / OS / wallet-core capability、test success、delivery success、signed response は代替にならない。gate が missing、invalid、expired、inconsistent、unverifiable、unknown なら Mainnet disabled / unavailable とし、Testnet-only 継続を妨げない。
- **完了条件:** gate の具体 evidence schema、evaluator、trusted key、build embedding 等を対象へ逆流させず、release / evidence authority へ委譲したまま、判定不能を fail-closed として実装・検証できること。§7.4、§15、§16 と Requirements / Design の追跡が一致するため `Resolved` とする。

## 10. Deferred Findings

Formal な `Deferred` finding はない。次の事項は既存 OPEN または下流 owner への確認事項であり、今回の対象に対する新規 finding ID は付与しない。

- `interfaces.md` の `OPEN-001`〜`OPEN-006`（message expiry field、common capability identifier、common version field、permission expiry / revocation identifier、Browser / Mobile caller context、aggregate / multisig / cosignature public scope）は、今回も不用意に閉じられていない。
- Browser Extension / Provider の旧 contract は下流 owner である。`docs/specifications/browser-extension.md` §5.2（現行行120〜122）は Provider `signTransaction` / `signMessage` の成功結果を `SignedTransaction` / `SignedMessage` とし、Handoff / SDK の `MosaicLynxSigningResult<T>` と一致しない。同 §5.1（現行行142）は `INVALID_MESSAGE` / `NONCE_REUSED` を含む旧 Provider error code 集合を保持する。さらに `packages/provider-api` の `MosaicAccount` は `id` / `profileId` を持ち、Provider の selector boundary は `OPEN-BEX-001` の既存 OPEN である。修正 owner は Browser Extension / Provider contract と、その後の implementation follow-up であり、共通 `interfaces.md` ではない。
- `docs/specifications/signing-protocol.md` §6.1 の `AUTHORIZED` state 説明と §6.2 の `AWAITING_USER → AUTHORIZED` 条件は、Explicit approval と署名ごとの authentication を短縮記載しており、対象 `interfaces.md` §9.7 および最新 Signing Flow Design が定義する Signing-capable unlock / Account authorization を同じ肯定形で列挙していない。これは related downstream Specification の同期課題として `signing-protocol.md` owner へ戻す。対象の common contract 自体は一意であり、SR-001〜SR-005 を Reopen する根拠ではない。
- `docs/specifications/product-spec.md` の旧 Provider `accountId` / Provider shape と、現在の `packages/sdk` / `packages/provider-api` の旧実装型は、今回の仕様レビュー対象ではない。source を変更せず、implementation review / downstream contract synchronization へ委譲する。
- `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` 後の具体 lookup endpoint、retry interval、queue / mutex、Provider selector shape、permission expiry / revocation identifier、cosignature public scope、release evaluator の実装方式は、既存 OPEN または下位仕様へ委譲されたままである。

## 11. Scope and Traceability

| 上流要求・設計境界                                                                        | 対象 / 関連仕様での具体化                                                                                                                                                                                    | 判定                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| `CR-016`、`CR-AC-017`、Architecture §6.9、Signing Flow §4 / §16 / §23                     | `interfaces.md` §9.7、§12.1、§13、§15〜§16 が common four conditions、同一 context binding、非代替性、fail-closed を定義。                                                                                   | Pass（`SR-001` Resolved） |
| `CR-NFR-008`〜`CR-NFR-011`、Security Design §10.2、Signing Flow §5 / §7 / §16             | `interfaces.md` §8.4〜§8.5、§12、§13、§15 が Profile-local context、lifecycle invalidation、concurrent isolation、late / stale response 分離を定義。                                                         | Pass（`SR-002` Resolved） |
| `CR-012`、`CR-NFR-012`、RR-NFR-002、RR-NFR-005、Signing Flow §7.4 / §19〜§23              | `interfaces.md` §6.3、§10.3、§13.1、§15〜§16、Handoff §7.2、SDK §5.2〜§5.4 / §12〜§15 が二軸、Signer authority、non-collapse、recovery を定義。                                                              | Pass（`SR-003` Resolved） |
| `SDK-FR-009`〜`SDK-FR-011`、Architecture §5.2、Signing Flow §21 / §23                     | `interfaces.md` §6.4、§13.1、§14.2、§15 と SDK §12.3 / §15、Handoff §6 が automatic retry / re-sign / alternate route fallback を禁止。                                                                      | Pass（`SR-004` Resolved） |
| `CR-NFR-006`、`CR-AC-008`、BR-013、Mobile Design §23.1、ADR 0001                          | `interfaces.md` §7.4、§12.2、§15〜§16 が trusted Signer + release / evidence gate、判定不能時 disabled / unavailable、Testnet-only 継続、下位 authority 委譲を定義。                                         | Pass（`SR-005` Resolved） |
| `CR-006`、`CR-NFR-009`、`CR-NFR-012`、Handoff §5.2.1 / §7.2、SDK §5.4                     | Handoff `signed` / `dataSigned` → public succeeded、`resultUnknown` → public resultUnknown、`rejected` / `failed` → Handoff §10 reject の一意な mapping。                                                    | Pass                      |
| `CR-008`、`CR-013`、Security Design、Profile / Account Specification、Chain Compatibility | `interfaces.md` §5.3、§11.3、§15〜§16 が Public Account Identity、Internal Account Reference、wallet-core secret / raw signing boundary、Symbol / NEM 分離を維持。                                           | Pass                      |
| `CR-015`、SDK Requirements、SDK Design、Relay Requirements / Design                       | SDK は non-Signer、Relay は opaque / transport-only、Browser Extension / Mobile App は trusted Signer、wallet-core は secret / raw signing boundary として整理。                                             | Pass                      |
| Handoff §9.6、Relay §9 / §13〜§14                                                         | `Relay ACK / response_available / consumed` は Relay storage / consumption lifecycle。`deliveryDisposition` は Signer-side であり、SDK ACK で PENDING → DELIVERED としない。                                 | Pass                      |
| Version / compatibility Requirements、Handoff §4、SDK §18                                 | SDK API `1.0.0` と `MosaicLynxSigningResult<T>` を現行 v1 contract とし、v2、v1.1、legacy API、deprecated package を追加せず、immutable artifact migration / major 判断を既存 OPEN / release policy へ委譲。 | Pass                      |
| Specification phase boundary                                                              | class、source file、React / Vue、Chrome / Mobile OS API、DB / Redis、queue / mutex、retry interval、UI layout、test framework、具体 evidence implementation を対象へ追加していない。                         | Pass                      |

## 12. Domain Checks

| 評価項目                                             | 判定                 | 確認内容                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Account Identity / Internal Account Reference | Pass                 | `PublicAccountIdentity` は Scope、address、publicKey。profileId、internal accountId、Wallet Store identifier、key slot、opaque routing handle、secret-derived value は page / SDK / Provider / Relay-facing field に追加されていない。内部 reference は Signer / Application 内部で補助的に解決し、単独で authorization / key selection authority にならない。 |
| Common four conditions                               | Pass                 | Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件が独立し、同一 request / caller / Profile-local context / Account / Scope / operation / target / freshness に binding。非代替性と fail-closed が §9.7、§12.1、§15 にある。                                                                                        |
| Profile-local security context                       | Pass                 | Profile は public field ではなく Signer-local context。request、caller / source、session、permission、Account、Scope、operation、target、inspection、approval、authentication、unlock、authorization、wallet-core call / result、recipient / delivery を同じ context に binding。                                                                              |
| Concurrent request isolation                         | Pass                 | 各 request が独立 security / lifecycle unit。context、approval、auth、Account authorization、result、recipient、delivery state を共有・統合・流用しない。                                                                                                                                                                                                      |
| Invalidation                                         | Pass                 | Profile switch / lock / association、Account / association、Chain / Network、caller / Origin / source、permission / revision、session、context / process / lifecycle loss で影響 request と delivery context を invalidated。                                                                                                                                  |
| `RESULT_UNKNOWN` authority                           | Pass                 | trusted Signer が signing generation 自体を安全に確定できない場合だけ成立。SDK / Provider / Relay / transport / timeout / outage / response absence / disconnect / recipient offline / lifecycle loss から生成・推測・確定しない。`resultUnknown` は error reject ではない。                                                                                   |
| `DELIVERY_UNKNOWN` authority                         | Pass                 | trusted Signer が valid signed result を保持し、delivery disposition を安全に確定できない場合だけ成立。known result、`SUCCEEDED`、`DELIVERY_UNKNOWN` を保持し、signing failure / `RESULT_UNKNOWN` / error に変換しない。                                                                                                                                       |
| Public `MosaicLynxSigningResult<T>`                  | Pass                 | Handoff / SDK §5.1 が `succeeded + result + deliveryDisposition` と `resultUnknown` の discriminated union を定義。`signTransaction` は `Promise<MosaicLynxSigningResult<SignedTransaction>>`、`signData` は `Promise<MosaicLynxSigningResult<SignedData>>`。                                                                                                  |
| Promise resolve / reject                             | Pass                 | known result は `outcome: 'succeeded'` で resolve、Signer `RESULT_UNKNOWN` は `outcome: 'resultUnknown'` で resolve、rejected / failed / normal failure は Handoff §10 の code で reject。resultUnknown branch に result、disposition、normal errorCode はない。                                                                                               |
| Handoff → SDK → dApp mapping                         | Pass                 | transaction: `signed + SUCCEEDED + signedTransaction + disposition` → succeeded / SignedTransaction。同様に message は SignedData。`resultUnknown + RESULT_UNKNOWN` → resultUnknown。`rejected / failed + errorCode` → Promise reject。                                                                                                                        |
| Local / remote public semantics                      | Pass（下流同期注記） | Handoff / SDK は Extension Provider path と Mobile Relay path を同じ public `MosaicLynxSigningResult<T>` semantics に統一。Browser Provider の現行文書・型が旧 shape のため、実際の下流同期 owner は Browser Extension / Provider。共通 contract の誤りではない。                                                                                              |
| `PENDING`                                            | Pass                 | Signer が known signed result を生成したが delivery completion 未確定の初期 disposition。現行 Mobile Relay v1 は App response 登録時に原則 `PENDING`。                                                                                                                                                                                                         |
| `DELIVERED`                                          | Pass                 | Signer 自身の trusted delivery / acknowledgement contract で完了を安全に確定した場合だけ成立。current Mobile Relay v1 に reverse ACK がないため SDK ACK から生成しない。                                                                                                                                                                                       |
| Relay ACK / consumed separation                      | Pass                 | Relay `response_available → consumed` と SDK ACK は storage / consumption lifecycle。signing outcome authority、Signer delivery authority、`DELIVERED` 生成根拠ではない。                                                                                                                                                                                      |
| SDK transport success                                | Pass                 | SDK の response 取得・decrypt / validate・ACK 成功でも Signer-originated `PENDING` を `DELIVERED` に変更しない。SDK は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成しない。                                                                                                                                                                                    |
| Known-result recovery / re-sign                      | Pass                 | `SUCCEEDED + DELIVERY_UNKNOWN` の recovery は既存 result の resend / redelivery / retrieval / lookup に限定。result を破棄せず、`SIGNING` に戻らず、新しい signature を生成しない。                                                                                                                                                                            |
| Retry / automatic fallback                           | Pass                 | 指定された user rejection、Authentication / unlock / Account authorization failure、permission、caller、integrity、replay、inspection、Chain / Network、context、両 unknown、transport / delivery failure の全てから automatic re-sign / alternate route を禁止。                                                                                              |
| Handoff §10 error authority                          | Pass                 | concrete public code は Handoff §10。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` は error taxonomy 外。`INVALID_MESSAGE` / `NONCE_REUSED` は対象と Handoff の public SDK code に戻っていない。                                                                                                                                                                       |
| Mainnet release / evidence gate                      | Pass                 | trusted Signer + current release / evidence gate に従属。missing、invalid、expired、inconsistent、unverifiable、unknown は Mainnet unavailable / disabled。Scope、capability、Provider / SDK / Relay / OS / wallet-core state、test、signed response は代替でない。                                                                                            |
| Version / compatibility                              | Pass                 | SDK API `1.0.0` が current v1 contract。v2、v1.1、legacy API、deprecated package を追加せず、既存 immutable artifact の migration / major 判断は OPEN / release policy に委譲。                                                                                                                                                                                |
| Existing OPEN                                        | Pass                 | `OPEN-001`〜`OPEN-006` を不用意に閉じず、message expiry、capability / version negotiation、permission expiry / revocation、caller context、cosignature public scope を継続。                                                                                                                                                                                   |
| Security boundary                                    | Pass                 | SDK は four-condition / semantic approval / disposition / secret authority なし。Relay は opaque / transport-only / non-Signer。Browser Extension / Mobile App は trusted Signer。wallet-core は secret / Wallet Store / raw signing / crypto boundary。                                                                                                       |
| Specification phase boundary                         | Pass                 | implementation class、source file、framework、Chrome exact API、Mobile OS API、DB / Redis、scheduling、retry interval、queue / mutex、UI layout、test frameworkを要求していない。                                                                                                                                                                              |

### Case-based review

| Case                                           | 判定 | 確認結果                                                                                                                                                                             |
| ---------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. successful transaction                      | Pass | known signed transaction + Signer `PENDING` は public `outcome: 'succeeded'`、`result: SignedTransaction`、`deliveryDisposition: 'PENDING'`。SDK ACK 後も `DELIVERED` へ変更しない。 |
| 2. successful transaction + `DELIVERY_UNKNOWN` | Pass | public succeeded branch に known result と `DELIVERY_UNKNOWN` を保持し、破棄・signing failure 化・re-sign をしない。                                                                 |
| 3. `RESULT_UNKNOWN`                            | Pass | public `outcome: 'resultUnknown'` で resolve。signed result、deliveryDisposition、normal errorCode を持たない。                                                                      |
| 4. user rejection                              | Pass | `rejected` / `USER_REJECTED` は Handoff §10 の Promise reject。`resultUnknown` へ変換しない。                                                                                        |
| 5. SDK timeout only                            | Pass | SDK local timeout / failure。SDK は `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成しない。                                                                                             |
| 6. Relay outage                                | Pass | transport failure。Relay outage から unknown disposition を推測しない。                                                                                                              |
| 7. SDK response取得 + ACK成功                  | Pass | Signer response が `SUCCEEDED + PENDING` なら public result も PENDING のまま。ACK で DELIVERED 化しない。                                                                           |
| 8. Profile switch during request               | Pass | active context を invalidated。古い approval、auth、Account authorization、result を流用しない。                                                                                     |
| 9. `RESULT_UNKNOWN` 後の別 route               | Pass | Provider / Signer / local / remote の automatic fallback なし。新規署名は fresh request と全4条件を必要とする。                                                                      |
| 10. Mainnet gate unknown                       | Pass | Mainnet signing unavailable / disabled。Testnet-only は不要に停止しない。                                                                                                            |

### Cross-document owner classification

- `interfaces.md` §6.3 / §10.3 と Handoff §7.2 / §10、SDK §5.1〜§5.4 / §13.3 は current common result / error contract として相互に整合している。
- Browser Extension / Provider の旧 `SignedTransaction` / `SignedMessage` result shape、旧 Provider error code、internal selector / `profileId` は下流 owner。共通 `PublicAccountIdentity`、Handoff result model、SDK public union が矛盾しているわけではないため、`SR-001`〜`SR-005` の Reopen にはしない。
- Signing Protocol の `AUTHORIZED` 状態表現の短縮は related downstream Specification の同期事項。対象の common contract と最新 Design / Requirements の判定を変更しない。

## 13. Validation Results

- `pnpm exec prettier --check docs/specifications/interfaces.md`: PASS。
- `pnpm exec prettier --check docs/specifications/sdk.md`: PASS。
- `pnpm exec prettier --check docs/specifications/signing-protocol.md`: PASS。
- `pnpm exec prettier --check docs/specifications/web-transaction-handoff-spec.md`: PASS。
- `pnpm exec prettier --write docs/reviews/specifications/interfaces-review-004.md`: PASS。実行後の成果物を確認した。
- `pnpm exec prettier --check docs/reviews/specifications/interfaces-review-004.md`: PASS。
- `git diff --check`: PASS。
- Markdown link / path check: PASS。成果物内の相対リンクの存在を確認した。
- TypeScript code block syntax: PASS。対象4仕様と成果物の TypeScript fence 26個を TypeScript 5.9.3 の `transpileModule` で構文確認した。
- Finding status consistency: PASS。`IS-001`、`SR-001`〜`SR-005` を status table、Resolved Findings、Required Changes に一貫して反映した。
- Review Gate / Final Decision consistency: PASS。全 Gate を Pass、Required Changes をなし、`Review Result` / `Final Decision` を `READY` とした。
- Changed files: PASS。作業前は clean で、レビュー中の変更は新規成果物のみである。
- source lint / typecheck / test / build: `Not validated`。source code を変更しない Specification Review のため実行しない。

## 14. Review Gates

前回 Fail だった Gate 2〜7 は、修正後の current contract を独立に再確認した結果、すべて Pass と判定する。

| Gate                  | 判定 | 根拠                                                                                                                                                                                                                                                  | 対応 ID                                |
| --------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1. 目的と範囲         | Pass | §1〜§3 が共通 Interface / Data Model の対象・対象外、Signer / SDK / Relay / wallet-core の責任、下位仕様と release authority への委譲を示す。                                                                                                         | —                                      |
| 2. 契約               | Pass | §6.3、§8.4〜§8.5、§9.7、§10.3、§13.1、§15〜§16、Handoff / SDK が、4条件、Profile context、二軸 result、error / state 排他、authority、Mainnet gate、禁止事項を具体化する。前回 `SR-001`、`SR-002`、`SR-003`、`SR-005` は Resolved。                   | `SR-001`、`SR-002`、`SR-003`、`SR-005` |
| 3. 処理と例外         | Pass | `RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、timeout / outage / delivery failure、user rejection、fresh recovery、no re-sign / no fallback、Profile invalidation を正常 / 失敗 / 境界 case として区別できる。前回 `SR-001`、`SR-003`、`SR-004` は Resolved。 | `SR-001`、`SR-003`、`SR-004`           |
| 4. 内部整合性         | Pass | 対象 `RelayResponse` union、§10.3 の二軸、§13 state / retry、§15 invariants、Handoff / SDK concrete mapping に矛盾がない。Browser Provider と Signing Protocol の下流旧表現は owner を分離した同期事項であり、対象本文の意味を不定にしない。          | —                                      |
| 5. 検証可能性         | Pass | Case 1〜10、`MosaicLynxSigningResult<T>`、Handoff mapping、Signer-only authority、ACK separation、freshness / invalidation、Mainnet gate を仕様の肯定形・禁止形から独立検証できる。前回 `SR-001`〜`SR-005` は Resolved。                              | `SR-001`〜`SR-005`                     |
| 6. 安全性と相互運用性 | Pass | secret / wallet-core boundary、Public / Internal Account boundary、Symbol / NEM、Mainnet / Testnet、Relay opaque、unknown non-collapse、no automatic fallback、Handoff §10 authority が維持される。                                                   | `IS-001`、`SR-001`〜`SR-005`           |
| 7. 上流整合性         | Pass | Requirements / Design が確定した common four conditions、Profile-local binding、Signer authority、known-result recovery、no automatic fallback、Mainnet release / evidence gate が対象へ反映されている。既存 OPEN は不用意に閉じていない。            | `SR-001`〜`SR-005`                     |

## 15. Remaining Risks and Open Decisions

- Browser Extension / Provider の public contract は、現行 Handoff / SDK の `MosaicLynxSigningResult<T>`、Signer-originated disposition、Handoff §10 error authority、Public Account Identity 境界へ同期する必要がある。owner は Browser Extension / Provider contract と implementation follow-up であり、本レビューの `interfaces.md` ではない。
- `signing-protocol.md` §6.1 / §6.2 の `AUTHORIZED` 記述は、最新の four conditions を対象本文と同じ粒度で明示していない。owner は Signing Protocol Specification の同期であり、対象共通 contract の blocking finding ではない。
- `interfaces.md` `OPEN-001`〜`OPEN-006` は未解決のまま維持される。特に message expiry field、capability / version negotiation、permission expiry / revocation、caller context、cosignature public scope を今回の result contract 変更から推測して閉じない。
- Mobile App は current workspace に実装がない。Mobile に関する Pass は Design / Specification contract の評価であり、runtime 実装の成立を意味しない。
- source package が現行仕様へ追随していること、Provider / SDK / Relay の runtime が Signer authority と disposition pass-through を満たすこと、release evidence が実際に検証可能であることは今回未確認であり、後続 implementation / release review に委譲する。

## 16. Automatic Changes

なし。レビュー中に変更したのは新規 [`interfaces-review-004.md`](./interfaces-review-004.md) のみであり、対象 Specification、Requirements、Design、関連 Specification、ADR、source、test および過去レビュー成果物は変更していない。

## 17. Final Decision

`READY`

`IS-001` は Resolved を維持し、`SR-001`〜`SR-005` はすべて Resolved。対象 `interfaces.md` の common four conditions、Profile-local context / concurrent isolation、Signer-only result / delivery authority、public `MosaicLynxSigningResult<T>` への downstream mapping、no automatic re-sign / fallback、Handoff §10 error authority、Mainnet release / evidence gate が Requirements / Design と整合し、Gate 1〜7 はすべて Pass である。新規 blocking finding はないため、対象 Specification は `READY` と判定する。
