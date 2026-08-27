# MosaicLynx SDK 基本設計 独立再レビュー 002

## 1. Review Target

- 対象: [`docs/design/sdk.md`](../../design/sdk.md)
- レビュー成果物: `docs/reviews/design/sdk-review-002.md`
- 確認日: 2026-08-28
- レビュー種別: 最新の `design-review` Skill に基づく SDK 基本設計の独立再レビュー
- 目的: 現在の SDK Design を、再レビュー済みの Architecture、Security Design、Signing Flow、Interfaces、Browser Extension、Mobile App および Relay Design と照合し、責務、authority、trust boundary、failure semantics、下流 handoff および Design phase boundary を再判定する。
- 過去成果物の扱い: [`sdk-review-001.md`](./sdk-review-001.md) は確認したが、2026-08-26 の `READY` は今回の判定へ継承しない。同成果物には今回の status tracking に使用できる正式 finding ID がないため、過去 ID は発行・補完しない。
- 変更範囲: 本成果物のみ。対象 Design、Requirements、Specification、ADR、source、test および既存レビューは変更しない。
- 設計フェーズ境界: concrete API、method / class、Promise / event shape、JSON / wire schema、暗号パラメータ、exact timeout、retry count、package export、browser / Relay implementation および UI layout は本レビューの不足としない。
- 未確認範囲: source code、runtime、未実装 Mobile App、実機および release tooling の実行検証は行っていない。

## 2. Execution Audit

`design-review` Skill、共通 review framework、reviewers、review-gates、output-format、`AGENTS.md` および `.agents/project-context.md` を全文確認した。サブエージェントは使用せず、Chair が同じ資料を混ぜない Reviewer A〜D の4つの独立パスを自己実施した。

| パス                                   | 確認範囲                                                                                                                              | 結果                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: structure / responsibility | SDK、Web Application、Provider、Browser / Mobile Signer、Relay、wallet-core、Chain integration の責務、依存方向、データ所有           | §21 の `result unknown` 表現により、transport failure と Signer-side disposition の owner が一意でない候補を採用。その他の SDK non-Signer、依存方向および secret ownership は適合。 |
| Reviewer B: security / trust boundary  | Provider / capability、caller / Origin、4条件、semantic validation、Relay opaque、wallet-core、secret、Mainnet gate                   | `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の生成 authority を SDK に移せないことを確認。§21 の表現は最新共通 Design と衝突するため `DR-001` を採用。その他の trust boundary は適合。    |
| Reviewer C: flow / operations          | request lifecycle、timeout、cancellation、page loss、disconnect、concurrency、retry、redelivery、re-sign、local / remote failure      | Relay / timeout / response absence を signing disposition へ昇格し得る recovery ambiguity を確認。stale、duplicate、automatic fallback 禁止は適合。                                 |
| Reviewer D: traceability / downstream  | upstream requirement、共通 Design、Component Design、Relay review、Specification、wallet-core、owner、委譲範囲、Design phase boundary | §21 と §25 は transport category と Signer-originated disposition の引き渡し条件が不足。API 詳細ではなく、責務・failure semantics の設計不足として `DR-001` を採用。                |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                            | 用途                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                                                                                                     | 主対象。SDK の purpose、責務、Provider、permission、caller、request / response、lifecycle、local / remote、Relay、secret、failure、invariant、traceability を確認した。                                                         |
| [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)                                                                                                                                                                                                                                                                                          | 作業範囲、source of truth、秘密情報境界、Chain / Network 分離、Mobile 未実装、レビュー成果物および検証規則を確認した。                                                                                                          |
| [`design-review` Skill](../../../.agents/skills/design-review/SKILL.md)、review-common、reviewers、review-gates、output-format                                                                                                                                                                                                                                                                  | 4パス、finding severity / status、8 Review Gate、正式 output structure、Chair の採用基準および Design phase boundary の根拠。                                                                                                   |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)、[`sdk.md`](../../requirements/sdk.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)                                                                                                             | SDK non-Signer、4条件、caller、operation、failure、Relay、secret、Mainnet gate、acceptance condition および下流 owner を照合した。                                                                                              |
| [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                    | 共通 responsibility、trust boundary、Profile / Account binding、4条件、result / delivery disposition、retry / fallback および upstream consistency を照合した。                                                                 |
| [`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                 | Browser / Mobile の trusted Signer、Relay opaque boundary、lifecycle、Mainnet gate、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` および SDK との downstream handoff を照合した。                                                       |
| [`relay-review-004.md`](./relay-review-004.md)                                                                                                                                                                                                                                                                                                                                                  | 最新 Relay Design の再レビュー結果を確認した。Relay / SDK は transport category の公開と Signer-originated disposition の意味不変伝達だけを担い、両 disposition を生成・推測・確定しないことを cross-boundary evidence とした。 |
| [`interfaces.md` specification](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | 必要な責務整合、operation、result semantics、handoff、Profile / Account、Symbol / NEM、Mainnet / Testnet の downstream contract を確認した。具体 API / schema / wire / error code は判定へ逆流させていない。                    |
| [`_snwc/README.md`](../../../_snwc/README.md)、wallet-core requirements / specification、[`binding-implementation.md`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                                                                                                 | Wallet Store、secret、Profile password、cryptographic identity、raw signing、Binding および Application / Core の責任境界を確認した。                                                                                           |
| [`sdk-review-001.md`](./sdk-review-001.md)                                                                                                                                                                                                                                                                                                                                                      | 旧判定と formal finding ID の有無を確認しただけであり、旧 `READY` や旧評価を今回の evidence として継承していない。                                                                                                              |

## 4. Review Result

`REVISE DESIGN`

## 5. Summary

SDK の non-Signer、Provider discovery / capability、connection / permission、caller / Origin、4条件の Signer ownership、Profile / Account / Chain / Network の非権威的な搬送、transaction / `MESSAGE_SIGN` の operation 分離、correlation、timeout / cancellation、secret / wallet-core、local / remote の自動 fallback 禁止および Mainnet gate 非代替は、基本的に現在の共通 Design と整合する。

一方、[`sdk.md`](../../design/sdk.md) §21 行569は `Relay / remote handoff failure` を `transport failure / result unknown` とすると記載している。最新の Signing Flow、Interfaces および Relay Design が確定した `RESULT_UNKNOWN`（署名生成自体の成否不明）と `DELIVERY_UNKNOWN`（既知の signed result の配送 disposition 不明）は Signer-side の disposition であり、SDK / Relay の Provider、transport、timeout、response absence、disconnect、offline、state loss または delivery failure から生成・推測・確定してはならない。この authority が SDK Design 本文で明確に分離されておらず、`DELIVERY_UNKNOWN` の扱いも明記されていないため、下流実装者が transport failure を Signer-side disposition へ昇格させる余地が残る。

この1件は transport failure、signing outcome、delivery disposition、retry / redelivery / re-sign の安全境界を横断し、4つの Review Gate を不合格にするため Critical と判定する。正式 finding は今回新規の `DR-001` のみであり、旧 SDK review の ID は捏造していない。

## 6. Finding Status

| ID       | Severity | Status | 初出 | 判定根拠                                                                                                                                                                     |
| -------- | -------- | ------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | New    | 今回 | §21 の transport failure → `result unknown` という記述、および `DELIVERY_UNKNOWN` authority の欠落が、最新の Signing Flow / Interfaces / Relay Design の確定境界と衝突する。 |

### Finding List

今回の正式 finding は `DR-001` だけである。過去 `sdk-review-001.md` に正式 finding ID はないため、旧 finding の `Resolved` / `Reopened` status は作成しない。

## 7. Required Changes

### DR-001: Relay / transport failure と Signer-side disposition の authority 混同

- Severity: `Critical`
- Status: `New`
- Target: [`docs/design/sdk.md`](../../design/sdk.md) §15.1〜§15.2（行438、453）、§16.3（行482）、§17（行496）、§21（行569〜572）、§22（行589）、§25（行635）。中心は §21 行569。
- 確認できた事実: §21 は `Relay / remote handoff failure` の SDK 処理を `transport failure / result unknown とする` と記載する。§15 は SDK が `result unknown` を受け取ることを記載するが Signer-originated disposition として限定せず、§16.3 は page lifecycle loss を `unknown / failure` と外部へ伝えるとしている。SDK Design 全体に `DELIVERY_UNKNOWN` の owner、Signer-originated pass-through、または transport state からの生成禁止を明示した箇所はない。
- authoritative な対照: Signing Flow は `RESULT_UNKNOWN` を signing generation 自体の成否不明、`DELIVERY_UNKNOWN` を既知 result の配送不明として分離し、delivery failure を `RESULT_UNKNOWN` にしない。Interfaces は transport / Relay failure と両 disposition の相互変換を禁止する。最新 Relay Design §29 は SDK の責務を transport / Provider / Relay error normalization、transport-level failure category の公開、Signer-originated disposition の意味不変伝達に限定し、SDK / Relay に両 disposition の生成・推測・確定 authority を与えていない。
- 問題: 現行文言を単独で実装へ引き渡すと、Relay outage、remote handoff failure、timeout、response absence、Provider disconnect、page lifecycle loss、recipient offline、reconnect failure または delivery failure を、署名生成の成否不明である `RESULT_UNKNOWN`、または既知 signed result の配送不明である `DELIVERY_UNKNOWN` として SDK が確定する解釈が成立する。これは transport failure と Signer-side result / delivery disposition の authority を混同する。
- 影響: SDK が signing result correctness authority を持つことになり、known result の redelivery / retrieval と signing retry を誤って選択し、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` 後の再署名禁止または fresh request 条件を誤適用する。Relay / SDK の可用性や page lifecycle が署名結果の意味へ昇格し、Signer、dApp、利用者への結果伝達と cross-component recovery が不安全になる。
- 最小修正: §21 の該当行を transport / handoff / lifecycle failure のみとして扱うよう修正し、SDK は Provider / Relay / transport state、timeout、response absence、disconnect、offline、reconnect failure、delivery failure または page loss から `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測・確定しないことを明記する。`RESULT_UNKNOWN` は Signer が signing generation 自体を確定できない場合、`DELIVERY_UNKNOWN` は Signer が既知 signed result の配送 disposition を確定できない場合だけとし、Signer-originated disposition は SDK が意味を変更せず correlation して伝達する。既知 result の配送処理は resend / retrieval / lookup の候補に限り、再署名しない。§15、§16、§17、§22、§25 の関連記述もこの authority 分離と一貫するようにする。具体 API、error code、wire format、timeout 値および retry count は追加要求しない。
- 完了条件 / 再確認: SDK Design を単独で読んだとき、transport-level failure category と Signer-originated `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` が区別され、前者から後者を生成・推測・確定できないこと、Signer-originated disposition は意味不変に伝達するだけであること、known result の redelivery と re-sign が分離されることを確認する。§21 行569に transport failure → `result unknown` の直接対応が残らないことを再確認する。

## 8. Optional Improvements

なし。`DR-001` の修正に直接必要でない Minor finding は採用しない。Mainnet release gate は SDK / Relay に移されておらず、Architecture、trusted Signer Design および release evidence へ追跡可能であるため finding としない。

## 9. Resolved Findings

今回の対象に過去 formal finding はなく、`Resolved` とする finding はない。`sdk-review-001.md` の旧 `READY` は status table の根拠として扱っていない。

## 10. Deferred Findings

正式な Deferred finding はない。

以下は Design phase boundary 内で妥当に委譲されており、finding としない。

- concrete TypeScript API、class / function、Promise / event、Provider global object、export map、wire / JSON schema、error code、encryption parameter。
- exact timeout、retry interval / count、queue / single-flight、cache schema、Relay endpoint / Redis / DB、provider implementation、browser API、Mobile OS API。
- transaction / message の chain-specific serialization、署名 byte、暗号実装および下位 contract の具体 mapping。
- Mobile runtime、実機 process recreation、hardware matrix、release evidence tooling の実行確認。

これらを委譲しても、`DR-001` が要求する result disposition の authority、transport failure との分離、no automatic re-sign および no security fallback は委譲されない。

## 11. Scope and Traceability

| 責務単位                                                  | upstream / common evidence                                                   | SDK 本文                                      | owner / downstream handoff                                                                                                                 | 判定                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| SDK non-Signer / trust boundary                           | SDK Requirements、Architecture、Security Design                              | §1〜§4、§6、§20、§22                          | Browser / Mobile trusted Signer、wallet-core、下位 SDK contract                                                                            | Pass                                                    |
| Provider discovery / capability                           | SDK Requirements、Interfaces、Browser Design                                 | §5、§7、§22.3〜§22.4                          | Provider contract; detection / capability は availability / possibility のみ                                                               | Pass                                                    |
| connection / permission / account disclosure              | SDK Requirements、Interfaces、Profile / Account Design                       | §8、§10、§20、§22                             | Provider / Signer が permission / Account authority、SDK は client / public projection                                                     | Pass                                                    |
| caller / Origin authority                                 | Security Design、Browser / Mobile Design、Handoff Specification              | §6、§9、§20、§22                              | Browser platform / Extension または Mobile verified handoff / App が最終 owner                                                             | Pass                                                    |
| common four conditions                                    | Requirements CR-016 / CR-AC-017、Architecture、Signing Flow                  | §11、§15、§20、§22                            | Browser / Mobile trusted Signer が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を成立            | Pass                                                    |
| Profile / Account / Chain / Network binding               | Interfaces、Profile / Account Specification、Chain Compatibility             | §8、§10〜§13、§20、§22                        | Signer / chain integration が final validation / authorization。SDK は context construction / correlation                                  | Pass                                                    |
| transaction signing                                       | SDK Requirements、Signing Flow / Protocol、Chain Compatibility               | §3、§11、§13、§17、§22                        | Signer が semantic inspection、approval、wallet-core call、result correctness                                                              | Pass                                                    |
| structured `MESSAGE_SIGN`                                 | Security Design、Browser / Mobile Design、Signing Protocol                   | §3、§11、§13、§17、§22                        | Signer が domain、purpose、message、replay context、caller、Account、Chain / Network を検証・表示・承認                                    | Pass                                                    |
| request / response correlation                            | Interfaces、Signing Flow、Handoff Specification                              | §12〜§13、§16、§22.9〜§22.10                  | SDK coordinator / Provider contract。request context、operation、session / generation、target、expiry を分離                               | Pass                                                    |
| timeout / cancellation / lifecycle                        | SDK Requirements、Signing Flow、Browser / Mobile Design                      | §14、§16、§22.11〜§22.12                      | SDK が local wait / context lifecycle を管理。wallet-side outcome の証明ではない                                                           | Pass、ただし `DR-001` の disposition distinction が必要 |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` / transport failure | Signing Flow、Interfaces、Relay Design、Relay Review 004                     | §15、§17、§21、§22、§25                       | `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` は Signer-originated disposition。SDK / Relay は transport category と意味不変 pass-through のみ     | Fail: `DR-001`                                          |
| retry / redelivery / no re-sign                           | Signing Flow、Signing Protocol、Relay Design                                 | §14、§17、§21、§22.14                         | known result の resend / retrieval と signing retry を下流 contract へ handoff。security failure / unknown から automatic fallback 禁止    | Fail: `DR-001` の影響                                   |
| local / remote abstraction                                | Architecture、SDK Requirements、Relay / Mobile Design                        | §17、§20、§21                                 | local / remote は common application semantics を提供するが、latency、session、lifecycle、delivery を隠さない                              | Pass、disposition correction required                   |
| Relay boundary                                            | Relay Requirements、Relay Design、Relay Review 004                           | §6、§17、§20〜§22                             | Relay は opaque / untrusted transport。SDK は Relay health / delivery を approval、authorization、signing success としない                 | Fail: §21 の authority ambiguity（`DR-001`）            |
| secret / wallet-core boundary                             | Security Design、wallet-core requirements / specification / Binding decision | §4、§6、§10、§19、§20、§22                    | wallet-core が Store、secret、cryptographic identity、raw signing を所有。SDK は要求・保持・復号・導出しない                               | Pass                                                    |
| Mainnet release gate                                      | Architecture §17.1、Mainnet ADR / release evidence、Browser / Mobile Design  | SDK §7、§18、§20、§23 と cross-document owner | release evidence / trusted Signer 側。SDK / Relay connection、capability、health、test success、response は gate ではない                  | Pass                                                    |
| version / compatibility                                   | SDK Requirements、Interfaces / Signing Protocol                              | §7、§18、§22.13、§23                          | unknown / unsupported / incompatible は fail-closed。permission / Origin / semantic downgrade、raw fallback、alternate Provider を行わない | Pass                                                    |
| signing result correctness                                | Signing Flow、Interfaces、Chain Compatibility、SDK Requirements              | §11、§13、§15、§19、§20、§22                  | Signer / chain integration が correctness authority、dApp が独立検証。SDK は structure / correlation / public normalization                | Pass、`DR-001` により disposition の境界を修正要        |

この表は exact API、schema または error mapping を要求するものではなく、責務 owner と downstream handoff の追跡だけを評価する。`DR-001` はこの traceability のうち result disposition と transport failure の authority handoff を阻害する。

## 12. Domain Checks

| 評価項目                                 | 結果                 | 確認内容                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SDK non-Signer / trust anchor            | PASS                 | SDK は non-Signer、non-wallet、non-trust-anchor。Signer、trusted UI、wallet-core raw signing、secret、final caller authority を持たない。                                                                                                                          |
| Provider discovery / capability          | PASS                 | existence、name、version、self-declared metadata、capability、event、response を trust anchor とせず、fake / malformed / stale / conflicting / incompatible Provider を unavailable / fail-closed とする。                                                         |
| connection / permission / public Account | PASS                 | availability、connection、permission、Account disclosure、authorization、signing capability を分離し、cache / previous session / connected を current authorization の証明としない。                                                                               |
| caller / Origin                          | PASS                 | SDK-observed URL、host、referrer、Origin、label、icon、self-declaration は final authority でなく、Browser / Mobile trusted context が最終検証する。                                                                                                               |
| common four conditions                   | PASS                 | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は Signer-side の独立条件。SDK、Provider、Relay、cache、response、transport state は代替でない。                                                                             |
| Profile / Account / Chain / Network      | PASS                 | SDK は request construction / correlation に context を使用できるが、Profile-local association、Account authorization、signer identity、Chain / Network の最終 validation は Signer / chain integration に残る。Symbol / NEM、Mainnet / Testnet を暗黙変換しない。 |
| transaction / `MESSAGE_SIGN`             | PASS                 | v1 の transaction signing と message signing を別 operation とし、structured message の domain、purpose、content、replay context、caller、Account、Chain / Network の semantic authority を SDK に移さない。                                                       |
| request / response correlation           | PASS                 | request identity、operation、Provider / transport context、session / generation、Account、Chain / Network、target、signer、response identity、expiry、lifecycle を分離し、stale / duplicate / wrong context を適用しない。                                         |
| timeout / cancellation / lifecycle       | FAIL (`DR-001`)      | timeout、cancellation、response absence、page lifecycle loss は outcome を確定しない点は明記されるが、page loss の `unknown` と §21 の `result unknown` が Signer disposition と明確に区別されない。                                                               |
| `RESULT_UNKNOWN` authority               | FAIL (`DR-001`)      | §21 行569が Relay / handoff failure から `result unknown` とする読みを許し、Signer-originated の限定が不足する。                                                                                                                                                   |
| `DELIVERY_UNKNOWN` authority             | FAIL (`DR-001`)      | SDK Design に `DELIVERY_UNKNOWN` の authority、known result、delivery-only semantics、SDK / Relay の生成禁止が明示されていない。                                                                                                                                   |
| transport / Relay failure                | FAIL (`DR-001`)      | transport / Provider / Relay failure を application-facing category として扱う責任はあるが、Signer-side result disposition へ昇格させない境界が §21 で崩れている。                                                                                                 |
| retry / redelivery / no re-sign          | FAIL (`DR-001`)      | automatic fallback / retry 禁止はあるが、failure が `result unknown` に分類されると redelivery と signing retry の downstream choice が混同され得る。                                                                                                              |
| local / remote abstraction               | PASS with correction | local / remote の latency、availability、session、lifecycle、timeout、cancellation、delivery 差異を隠さない。result disposition authority の明記だけが必要。                                                                                                       |
| Relay boundary                           | FAIL (`DR-001`)      | Relay を opaque / untrusted とする境界は適合するが、Relay failure から Signer-side disposition を作れる §21 の表現が矛盾する。                                                                                                                                     |
| secret / wallet-core                     | PASS                 | SDK は private key、Mnemonic、password、Wallet Store、decrypted secret、device auth material、E2E secret、raw signing interface を要求・保持・出力しない。                                                                                                         |
| Mainnet release gate                     | PASS                 | Mainnet capability / release gate は trusted Signer と release evidence policy の責任であり、SDK / Relay availability、capability、health、test success、response を gate としない。                                                                               |
| version / compatibility                  | PASS                 | unknown / unsupported / incompatible を安全側に終了し、permission bypass、Origin bypass、semantic downgrade、operation conversion、raw fallback、automatic alternate Provider を行わない。                                                                         |
| traceability                             | FAIL (`DR-001`)      | 大半の owner / handoff は追跡できるが、result / delivery disposition と transport failure の authority handoff が現在の SDK 本文で一意でない。                                                                                                                     |
| Design phase boundary                    | PASS                 | finding は責務、authority、trust boundary、failure semantics の不足に限定し、具体 API / schema / implementation の追加を要求していない。                                                                                                                           |

## 13. Validation Results

| 検証                                                               | 結果          | 備考                                                                           |
| ------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| `pnpm exec prettier --check docs/design/sdk.md`                    | PASS          | 対象 Design の明示パスを確認し、Prettier code style に適合した。               |
| `pnpm exec prettier --write docs/reviews/design/sdk-review-002.md` | PASS          | 新規レビュー成果物の明示パスだけを整形した。                                   |
| `pnpm exec prettier --check docs/reviews/design/sdk-review-002.md` | PASS          | 整形後の成果物を確認した。                                                     |
| `git diff --check`                                                 | PASS          | stage 済み成果物に whitespace error がないことを確認した。                     |
| Markdown link / path check                                         | PASS          | 成果物の repository-relative link と参照先を確認した。                         |
| finding ID consistency                                             | PASS          | `DR-001` は一意であり、旧 SDK review ID を新規 status table に混入していない。 |
| severity / status / gate / decision consistency                    | PASS          | `Critical / New`、Required Changes、8 Gate、`REVISE DESIGN` の整合を確認した。 |
| changed files                                                      | PASS          | `git status` と diff stat で成果物のみであることを確認した。                   |
| lint / typecheck / test / build                                    | Not validated | source code を変更しない doc-only review のため実行しない。                    |

lint / typecheck / test / build は source code を変更しないため実行していない。未実行を成功とは扱わない。

## 14. Review Gates

| Gate                        | 判定 | 根拠                                                                                                                                                                                        | 対応 ID  |
| --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1. 目的と範囲               | Pass | SDK の non-Signer integration scope、対象外、v1 transaction / message、local / remote、Design phase boundary が明確。                                                                       | —        |
| 2. コンテキストと責任       | Fail | §21 が Relay / transport failure と Signer-side `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の authority を一意に分けていない。                                                                   | `DR-001` |
| 3. 依存方向                 | Pass | SDK は Provider / Relay / Signer の privileged responsibility へ直接依存・逆流せず、wallet-core secret boundary も維持する。                                                                | —        |
| 4. 主要フロー               | Fail | timeout、response absence、handoff failure、page loss、known-result delivery failure と signing generation unknown の recovery semantics が一意でない。                                     | `DR-001` |
| 5. データ所有               | Pass | public Account / Network、request context、cache、secret、Wallet Store、signed result の ownership は概ね分離されている。Disposition authority の問題は Gate 2 / 4 / 6 / 7 / 8 に集約する。 | —        |
| 6. セキュリティと相互運用性 | Fail | transport / Relay state が signing result meaning へ昇格し得る。Signer-originated disposition、Relay opaque、no re-sign の共通 invariant を弱める。                                         | `DR-001` |
| 7. 上流整合性               | Fail | 現行 SDK §21 の `transport failure / result unknown` は、最新 Signing Flow、Interfaces および Relay Design の「SDK / Relay は生成・推測・確定しない」と衝突する。                           | `DR-001` |
| 8. 下流実装可能性           | Fail | exact API が未決でも、transport category、Signer disposition pass-through、known-result redelivery、no re-sign の owner が確定していなければ安全な実装判断を引き渡せない。                  | `DR-001` |

1つ以上の Gate が不合格であるため、Review Gate の判定は `REVISE DESIGN` とする。Critical finding は `DR-001` だけであり、API、schema、暗号パラメータ等の未決定を理由にしたものではない。

## 15. Remaining Risks and Open Decisions

- `DR-001` が解消されるまで、Relay / remote handoff failure、timeout、page lifecycle loss、response absence および delivery failure の application-facing分類を、Signer-side disposition と同一視して実装してはならない。
- Provider discovery policy、具体的な cancellation protocol、transport selection、runtime support、compatibility matrix、exact timeout / retry、error code、handoff schema、result retrieval API は既存の Requirements / Specification の OPEN または下位委譲に残る。ただし `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味、transport failure との分離、no automatic re-sign / fallback は既決であり、OPEN に戻らない。
- Mainnet release evidence の収集、署名、trusted key、build embedding、runtime enforcement および release operation は別の owner で確認する。SDK / Relay health は Mainnet gate ではないという責務境界は追跡可能である。
- Mobile 実装、実機 lifecycle、OS protected storage、source runtime、chain-specific implementation、E2E、release tooling は未確認である。これは本基本設計の詳細不足 finding ではない。

## 16. Automatic Changes

なし。対象の `docs/design/sdk.md`、Requirements、他の Design、Specification、ADR、source、test および `sdk-review-001.md` は変更していない。レビュー中の自動修正も行っていない。

## 17. Final Decision

`REVISE DESIGN`

`DR-001` は、Relay / Provider / transport failure と Signer-originated `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の authority を SDK Design が明確に分離できていないという Critical finding である。したがって、SDK 基本設計は最新共通 Design と整合するよう §15〜§25 の関連記述を補正するまで、次の Design / implementation handoff へ進めない。

finding 集計: `Critical 1 / Major 0 / Minor 0`。旧 SDK review の `READY` は継承していない。
