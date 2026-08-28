# MosaicLynx SDK 基本設計 再レビュー 003

## 1. Review Target

- 対象: [`docs/design/sdk.md`](../../design/sdk.md)
- 前回レビュー: [`sdk-review-002.md`](./sdk-review-002.md)
- 修正コミット: `175ba0be786e59eafd9cd6ad906185c7fcc0e981`
- レビュー成果物: `docs/reviews/design/sdk-review-003.md`
- 確認日: 2026-08-28
- レビュー種別: 最新の `design-review` Skill に基づく DR-001 修正後の再レビュー
- 目的: 前回 `DR-001 Critical` の解消確認、および修正による SDK の主要責務、trust boundary、security invariant、failure semantics、retry / fallback、下流 handoff の回帰確認。
- 判定方針: 修正コミットの説明や前回の `REVISE DESIGN` を自動的に信用せず、現在の対象本文と authoritative な Requirements、共通 Design、Component Design、Specification、Relay review、wallet-core 資料から独立判定した。
- 変更範囲: 本成果物のみ。対象 Design、Requirements、他の Design、Specification、ADR、source、test、`sdk-review-001.md` および `sdk-review-002.md` は変更しない。
- 設計フェーズ境界: concrete TypeScript API、method / class、Promise / event shape、JSON / wire schema、exact enum / error code、encryption parameter、exact timeout、retry count、Relay endpoint、Redis / DB、Provider implementation、browser / Mobile OS API および result retrieval API の具体形は不足 finding としない。
- 未確認範囲: source code、runtime、未実装 Mobile App、実機、hardware matrix および release tooling の実行検証は行っていない。

## 2. Execution Audit

`design-review` Skill、共通 review framework、reviewers、review-gates、output-format、`AGENTS.md` および `.agents/project-context.md` を全文確認した。サブエージェントは使用せず、Chair が Reviewer A〜D の4つの独立パスを自己実施した。

| パス                                   | 確認範囲                                                                                                                   | 結果                                                                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: structure / responsibility | SDK、Web Application、Provider、Browser / Mobile Signer、Relay、wallet-core、依存方向、data ownership                      | §4、§15、§20〜§22、§25 が SDK の normalization / correlation と Signer / Relay / wallet-core の責務を分離している。前回 `DR-001` の責務逆流は再発していない。                    |
| Reviewer B: security / trust boundary  | non-Signer、Provider / capability、caller / Origin、4条件、semantic safety、Relay opaque、secret、Mainnet gate             | `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の owner は Signer、SDK / Relay / transport state は authority ではないことを確認した。secret、Origin、approval、Mainnet gate の回帰なし。 |
| Reviewer C: flow / operations          | response、timeout、cancellation、page lifecycle、known result、retry、redelivery、re-sign、local / remote、failure cases   | transport failure、Signer-originated disposition、known-result recovery、fresh signing の分離を §14、§16、§17、§21、§22 で確認した。9ケースの期待結果と一致する。                |
| Reviewer D: traceability / downstream  | upstream requirement、共通 Design、Component Design、Relay review、Specification、wallet-core、owner、委譲、phase boundary | §25 から transport category、両 disposition、pass-through、known-result recovery、no re-sign を owner と下流責務へ追跡できる。新規 finding なし。                                |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                            | 用途                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                                                                                                     | 主対象。現在の §4、§14〜§17、§20〜§22、§25 および全体の責務・境界・lifecycle・failure を確認した。                                                                                                                    |
| [`sdk-review-002.md`](./sdk-review-002.md)                                                                                                                                                                                                                                                                                                                                                      | 前回 `DR-001` の formal ID、Severity、Status および再確認条件の status tracking に使用した。前回の判定本文を今回の根拠として継承していない。                                                                          |
| `175ba0be786e59eafd9cd6ad906185c7fcc0e981`                                                                                                                                                                                                                                                                                                                                                      | 修正箇所の確認に使用した。コミットメッセージではなく、現在の対象本文を最終根拠とした。                                                                                                                                |
| [`design-review` Skill](../../../.agents/skills/design-review/SKILL.md)、`reviewers.md`、`review-gates.md`、`output-format.md`、`review-common/review-playbook.md`、`review-common/output-format.md`                                                                                                                                                                                            | 独立4パス、finding severity / status、8 Review Gate、成果物構成、Chair の反証基準および Design phase boundary の根拠。                                                                                                |
| [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)                                                                                                                                                                                                                                                                                          | 作業範囲、source of truth、Mobile 未実装、Chain / Network、Relay、secret 境界、検証および Git 運用を確認した。                                                                                                        |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)、[`sdk.md`](../../requirements/sdk.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)                                                                                                             | SDK non-Signer、共通4条件、transaction / message、failure、retry、secret、Relay、Mainnet gate および acceptance condition を照合した。Browser / Mobile の caller、Signer、lifecycle の整合も確認した。                |
| [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                    | 共通の trusted Signer、Profile / Account binding、4条件、caller、result / delivery disposition、retry / fallback、secret および依存方向を照合した。                                                                   |
| [`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                 | local / remote Signer、Browser / Mobile trusted context、Relay opaque transport、lifecycle、known result recovery、Mainnet gate および SDK handoff を照合した。                                                       |
| [`relay-review-004.md`](./relay-review-004.md)                                                                                                                                                                                                                                                                                                                                                  | 最新 Relay Design の再レビューで確定した、SDK / Relay の transport normalization、Signer-originated disposition の意味不変伝達、両 disposition の生成・推測・確定禁止を確認した。                                     |
| [`interfaces.md` specification](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | 責務整合、operation、structured message、Profile / Account、Chain / Network、response、unknown、retry および handoff の downstream contract を確認した。具体 API / schema / error code は基本設計へ逆流させていない。 |
| [`_snwc/README.md`](../../../_snwc/README.md)、wallet-core requirements / specification、[`binding-implementation.md`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                                                                                                 | Wallet Store、secret、Profile password、cryptographic identity、raw signing、Binding および Application / Core の responsibility boundary を確認した。                                                                |

## 4. Review Result

`READY`

## 5. Summary

前回 `DR-001` の問題であった `Relay / remote handoff failure → result unknown` という直接対応は現在の SDK Design から除去されている。§15 は transport / Relay を transport-level error category とし、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を error category ではない Signer-side disposition として分離している。§21 は Relay / Provider / transport failure だけでは両 disposition が成立しないこと、SDK は取得済みの Signer-originated disposition を correlation 後に意味不変で伝達するだけであることを明記している。

`RESULT_UNKNOWN` は Signer が signing generation 自体の結果を確定できない場合、`DELIVERY_UNKNOWN` は Signer が既知の signed result の配送 disposition を確定できない場合に限定されている。Provider failure、Relay failure、network / transport failure、timeout、response absence、disconnect、recipient offline、reconnect failure、delivery failure、page lifecycle loss および SDK internal state から SDK が両 disposition を生成・推測・確定する余地は、§4、§15〜§17、§21〜§22 で閉じられている。

Known result の redelivery / resend / retrieval / lookup は signing retry と分離され、transport failure、known result delivery failure、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、user rejection、security / permission / authorization failure からの automatic re-sign / fallback も禁止されている。新しい signing operation には new request と共通4条件が必要である。

修正による前回 Pass 項目の回帰、明確な新規 Critical / Major / Minor finding、Design phase boundary 逸脱は確認されなかった。`DR-001` は `Resolved`、新規 finding はなし、全8 Review Gate は Pass と判定する。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー     | 今回の状態根拠                                                                                                                                      |
| -------- | -------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | Resolved | `sdk-review-002` | §4、§15〜§17、§21〜§22、§25 が transport failure と Signer-side disposition を分離し、SDK / Relay の両 disposition 生成・推測・確定を禁止している。 |

今回の新規 finding はない。`sdk-review-001.md` には正式 finding ID がないため、存在しない過去 ID は status tracking に追加していない。

## 7. Required Changes

なし。Critical / Major の New、Open または Reopened finding はない。

## 8. Optional Improvements

なし。今回の中心である DR-001 の解消と回帰確認に関係しない Minor finding は採用していない。

## 9. Resolved Findings

### DR-001: RESOLVED — Relay / transport failure と Signer-side disposition の authority 分離

- Severity: `Critical`
- Status: `Resolved`
- Target: [`docs/design/sdk.md`](../../design/sdk.md) §4.1〜§4.2、§14.2、§15.1〜§15.2、§16.3、§17、§21、§22、§25。前回中心箇所は旧 §21 行569、現行中心箇所は §21 行577〜586。
- 前回の確認条件: Relay / remote handoff failure を `transport failure / result unknown` とする直接対応があり、SDK が transport state から Signer-side `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を生成・推測・確定する余地があった。
- 現在確認できた事実: §4.1 行81は Provider / Relay / transport / client failure の normalization が signing generation result または Signer-side delivery disposition の確定を意味しないと定める。§4.2 行94〜95は SDK が signing generation result、known signed result の delivery disposition、および指定された Provider / Relay / timeout / response absence / lifecycle 等からの両 disposition の生成・推測・確定を担わないと定める。
- 現在の response / error 境界: §15.1 行440〜442は SDK が受け取るのは Signer-originated `RESULT_UNKNOWN` と Signer-side `DELIVERY_UNKNOWN` であり、request / response correlation 後に意味不変で伝達するだけであること、両者の成立条件と transport state からの生成禁止を明記する。§15.2 行457、462は transport / Relay を transport-level category とし、両 disposition を transport / error category から分離する。
- 現在の lifecycle / abstraction 境界: §16.3 行488は page lifecycle loss を context lost / transport failure category とし、signing outcome または delivery disposition の証明にしない。§17 行502〜506は local / remote の transport 差異、Relay unavailable、known-result recovery を両 disposition の生成と分離する。
- 現在の failure / recovery 境界: §21 行577〜586は Relay / remote handoff failure を transport / handoff failure category として終了し、Signer-originated `RESULT_UNKNOWN` / Signer-side `DELIVERY_UNKNOWN` は correlation 後に意味不変で伝達する別行としている。transport failure、known result delivery failure、両 disposition、permission / authorization failure から automatic re-sign / fallback を行わず、新しい signing operation には new request、Authentication、Signing-capable unlock、Account authorization、Explicit user approval が必要である。
- 現在の invariant / traceability: §22 行591、600、603〜605は SDK を signing-result correctness / disposition authority とせず、timeout / cancellation / page lifecycle loss、response absence、Provider / Relay / transport state を outcome の根拠とせず、Signer-originated disposition を意味不変に伝達することを固定する。§25 行647〜653は transport normalization、両 disposition の分離、pass-through、known-result recovery、no re-sign をそれぞれ owner と下流 handoff へ追跡する。
- 問題・影響の再確認: 旧 §21 の直接対応はなく、現行本文を単独で読んでも transport failure が `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` に昇格しない。Signer-side disposition と transport category の意味が維持されるため、known result の redelivery と signing retry、Signer-originated unknown の伝達と SDK local failure、security failure と transport retry を誤って統合する downstream risk は解消されている。
- 最小修正の確認: 前回指摘が要求した authority 分離、transport-level normalization、Signer-originated pass-through、page lifecycle の非証明性、known result recovery、no automatic re-sign、no automatic fallback、4条件の fresh signing および §25 traceability が、具体 API / error code / wire schema を追加せずに実現されている。
- 完了条件 / 再確認: (1) 旧直接対応が残っていない、(2) transport failure が category として扱われる、(3) SDK が `RESULT_UNKNOWN` を生成・推測・確定しない、(4) SDK が `DELIVERY_UNKNOWN` を生成・推測・確定しない、(5) `RESULT_UNKNOWN` owner が Signer、(6) `DELIVERY_UNKNOWN` owner が Signer、(7) pass-through が意味不変、(8) timeout / cancellation / page loss が outcome を確定しない、(9) known result recovery と re-sign が分離、(10) automatic re-sign / fallback 禁止、(11) transport retry と signing retry 分離、(12) 詳細仕様を逆流させない、の全条件を確認した。`DR-001` は `Resolved` とする。

## 10. Deferred Findings

正式な Deferred finding はない。

以下は既存の下位委譲または未実装範囲であり、DR-001 の解消を弱めないため finding としない。

- TypeScript API、class / method、Promise / event、Provider global object、public export、JSON / wire schema、error code、暗号パラメータ。
- exact timeout、retry timing / count、queue / single-flight、cache / retention schema、Relay endpoint / Redis / DB、Provider implementation、browser API、Mobile OS API、result retrieval API。
- transaction / message の chain-specific serialization、署名 byte、具体的な error mapping および transport selection。
- Mobile runtime、実機 process recreation、OS protected storage、hardware matrix、contract test、E2E および release evidence tooling。

これらの詳細が未決でも、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味、Signer owner、transport failure との分離、known-result recovery、no re-sign、no security fallback は既決である。

## 11. Scope and Traceability

| 責務単位                                    | upstream / common evidence                                                   | SDK 本文                                      | owner / downstream handoff                                                                                           | 判定 |
| ------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| SDK non-Signer / trust boundary             | SDK Requirements、Architecture、Security Design、Signing Flow                | §1〜§4、§6、§20、§22                          | Browser / Mobile trusted Signer、wallet-core、SDK contract                                                           | Pass |
| Provider discovery / capability             | SDK Requirements、Interfaces、Browser Design                                 | §5、§7、§22.3〜§22.4                          | Provider contract。detection / capability は availability / possibility のみ                                         | Pass |
| connection / permission / public Account    | SDK Requirements、Interfaces、Profile / Account                              | §8、§10、§20、§22                             | Provider / Signer が permission / Account authority。cache / connection は代替でない                                 | Pass |
| caller / Origin authority                   | Security Design、Browser / Mobile Design、Handoff Specification              | §6、§9、§20、§22                              | Browser platform / Extension または Mobile verified handoff / App が最終 owner                                       | Pass |
| common four conditions                      | Requirements CR-016 / CR-AC-017、Architecture、Signing Flow                  | §11、§15、§20、§22                            | Signer が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を成立               | Pass |
| Profile / Account / Chain / Network binding | Interfaces、Profile / Account Specification、Chain Compatibility             | §8、§10〜§13、§20、§22                        | Signer / chain integration が final validation / authorization。SDK は construction / correlation                    | Pass |
| transaction signing                         | Signing Flow / Protocol、Chain Compatibility、SDK Requirements               | §3、§11、§13、§17、§22                        | Signer が semantic inspection、approval、wallet-core call、result correctness                                        | Pass |
| structured `MESSAGE_SIGN`                   | Security Design、Browser / Mobile Design、Signing Protocol                   | §3、§11、§13、§17、§22                        | Signer が domain、purpose、message、replay context、caller、Account、Chain / Network を検証・表示・承認              | Pass |
| request / response correlation              | Interfaces、Signing Flow、Handoff Specification                              | §12〜§13、§16、§22.9〜§22.10                  | SDK coordinator / Provider contract。request、operation、session / generation、target、expiry、response を分離       | Pass |
| timeout / cancellation / page lifecycle     | SDK Requirements、Signing Flow、Browser / Mobile Design                      | §14、§16、§21、§22.11                         | SDK は local wait / context lifecycle を管理し、outcome / disposition を証明しない                                   | Pass |
| Provider / Relay / transport failure        | SDK Requirements、Relay Design、Relay Review 004                             | §4、§15、§17、§21、§22、§25                   | SDK は transport-level category を normalize。Relay / Provider / transport state は disposition owner でない         | Pass |
| `RESULT_UNKNOWN`                            | Signing Flow、Interfaces、Relay Design                                       | §4、§15、§21、§22、§25                        | Signer。SDK は correlation と意味不変 pass-through のみ                                                              | Pass |
| `DELIVERY_UNKNOWN`                          | Signing Flow、Interfaces、Relay Design                                       | §4、§15、§17、§21、§22、§25                   | Signer。SDK / Relay / transport state から生成・推測・確定しない                                                     | Pass |
| Signer-originated disposition               | Signing Flow、Relay Design、Relay Review 004                                 | §15、§17、§21、§22、§25                       | Signer が成立させ、SDK は correlation 後に意味不変伝達                                                               | Pass |
| known result recovery                       | Signing Flow、Signing Protocol、Relay Design                                 | §17、§21、§22、§25                            | redelivery / resend / retrieval / lookup。signing retry と分離                                                       | Pass |
| re-sign / fresh signing                     | Requirements、Signing Flow、Signing Protocol                                 | §14、§17、§21、§22                            | transport / delivery failure、unknown、security failure から automatic re-sign しない。new request + 4条件           | Pass |
| retry / fallback                            | Architecture、Signing Flow、Relay Design、SDK Requirements                   | §14、§17、§21、§22                            | transport retry と signing retry を分離。local / remote、Provider A / B、Signer route の automatic fallback 禁止     | Pass |
| local / remote abstraction                  | Architecture、SDK Requirements、Mobile / Relay Design                        | §17、§20、§21                                 | transport / latency / session / lifecycle / delivery 差異を維持し、disposition の意味を変更しない                    | Pass |
| Relay boundary                              | Relay Requirements、Relay Design、Relay Review 004                           | §6、§17、§20〜§22、§25                        | opaque / untrusted transport。approval、authorization、signing success、両 disposition の authority でない           | Pass |
| secret / wallet-core                        | Security Design、wallet-core requirements / specification / Binding decision | §4、§6、§10、§19、§20、§22                    | wallet-core が Store、secret、cryptographic identity、raw signing。SDK は要求・保持・復号・導出しない                | Pass |
| Mainnet release gate                        | Architecture §17.1、Mainnet ADR / release evidence、Browser / Mobile Design  | §7、§18、§20、§23 および cross-document owner | release evidence / trusted Signer。SDK / Relay availability、connection、capability、health、response は gate でない | Pass |
| version / compatibility                     | SDK Requirements、Interfaces / Signing Protocol                              | §7、§18、§22.13、§23                          | unknown / unsupported / incompatible は fail-closed。downgrade / raw / insecure fallback なし                        | Pass |

責務 owner、下流 handoff および DR-001 の再確認条件は追跡可能である。具体 API、wire、error code、timeout、retry count の不在は本レビューの不足ではない。

## 12. Domain Checks

| 評価項目                                     | 結果 | 確認内容                                                                                                                                                                                                                                                  |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK non-Signer / correctness authority       | PASS | SDK は integration / orchestration layer であり、signing-result correctness / disposition authority、Signer、trusted presentation、semantic safety、raw signing、secret handling を持たない。                                                             |
| Provider discovery / capability / permission | PASS | Provider detection ≠ permission、capability ≠ authorization、connection ≠ signable、Account disclosure ≠ Account authorization を維持する。fake / conflicting / malformed / stale / incompatible Provider は安全側に扱う。                                |
| caller / Origin                              | PASS | SDK-observed Origin / caller、URL、host、referrer、label、self-declaration は final authority でなく、Browser / Mobile trusted context が最終検証する。                                                                                                   |
| common four conditions                       | PASS | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は Signer-side の独立条件。connection、permission、capability、cache、previous session、response、transport state は代替でない。                                    |
| Profile / Account / Chain / Network          | PASS | SDK は request construction / correlation に利用するだけで、Profile-local association、Account authorization、signer identity、Chain / Network の最終 validation は Signer / chain integration に残る。Symbol / NEM、Mainnet / Testnet を暗黙変換しない。 |
| transaction / structured `MESSAGE_SIGN`      | PASS | 両 operation を分離し、domain、purpose、message、replay context、caller、Account、Chain / Network の semantic validation authority を SDK に移していない。                                                                                                |
| request / response correlation               | PASS | request identity、operation、Provider / transport、session / generation、Account、Chain / Network、target、signer、response、expiry、lifecycle を分離し、stale / duplicate / wrong context を適用しない。                                                 |
| `RESULT_UNKNOWN` authority                   | PASS | Signer が signing generation 自体の結果を確定できない場合だけ成立し、SDK / Provider / Relay / transport state は生成・推測・確定 authority でない。                                                                                                       |
| `DELIVERY_UNKNOWN` authority                 | PASS | Signer が既知 signed result の配送 disposition を確定できない場合だけ成立し、SDK / Relay / transport state から生成・推測・確定しない。                                                                                                                   |
| transport failure                            | PASS | Provider unavailable、Relay unavailable、network / handoff failure、timeout、response absence、disconnect、offline、reconnect failure、delivery / lifecycle loss は transport / context category として扱い、両 disposition に昇格しない。                |
| page lifecycle / timeout / cancellation      | PASS | local wait / context を終了するが、unsigned、signed、signing failed、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、wallet-side cancellation completion を証明しない。                                                                                             |
| known result / recovery                      | PASS | known result の配送問題は redelivery、resend、retrieval、lookup の候補であり、signing retry / re-sign と分離する。                                                                                                                                        |
| retry / re-sign / fallback                   | PASS | transport failure、known result delivery failure、両 unknown、user rejection、security / integrity / replay / caller / permission / authorization failure から automatic re-sign / fallback しない。                                                      |
| local / remote                               | PASS | transport 差異を維持し、Relay unavailable を signing success、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` に変換しない。Signer-originated disposition の意味も変更しない。                                                                                       |
| Relay boundary                               | PASS | Relay は opaque / untrusted / non-Signer transport。delivery、session、health、connection、acknowledgement は approval、authorization、signing success、disposition authority でない。                                                                    |
| secret / wallet-core                         | PASS | private key、Mnemonic、Profile password、Wallet Store、device authentication、E2E secret、raw signing interface は SDK に渡らない。                                                                                                                       |
| Mainnet release gate                         | PASS | release evidence / trusted Signer の gate に従い、SDK / Relay availability、connection、capability、health、response を Mainnet signing capability の authority としない。                                                                                |
| security invariants / traceability           | PASS | §22 と §25 に non-Signer、non-authority、no conversion、pass-through、no re-sign、no fallback、secret isolation、transport / signing retry separation が明記されている。                                                                                  |
| Design phase boundary                        | PASS | 具体 API、schema、error code、timeout、retry count、implementation detail を要求していない。                                                                                                                                                              |

### DR-001 Completion Criteria

| #   | 条件                                                                         | 判定 |
| --- | ---------------------------------------------------------------------------- | ---- |
| 1   | Relay / remote handoff failure → `result unknown` の直接対応が残っていない   | PASS |
| 2   | transport / Provider / Relay failure は transport-level category として扱う  | PASS |
| 3   | SDK は `RESULT_UNKNOWN` を生成・推測・確定しない                             | PASS |
| 4   | SDK は `DELIVERY_UNKNOWN` を生成・推測・確定しない                           | PASS |
| 5   | `RESULT_UNKNOWN` の owner が Signer と明確                                   | PASS |
| 6   | `DELIVERY_UNKNOWN` の owner が Signer と明確                                 | PASS |
| 7   | SDK は Signer-originated disposition を意味不変に伝達する                    | PASS |
| 8   | timeout / cancellation / page lifecycle loss は signing outcome を確定しない | PASS |
| 9   | known result recovery と re-sign が分離されている                            | PASS |
| 10  | automatic re-sign / unsafe fallback が禁止されている                         | PASS |
| 11  | transport retry と signing retry が分離されている                            | PASS |
| 12  | exact API / error code / wire schema を基本設計へ逆流させていない            | PASS |

### Case-based Check

| Case | 条件                                                              | SDK の期待動作                                                                   | 判定 |
| ---- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| 1    | Relay unavailable before request delivery                         | transport / handoff failure。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` ではない      | PASS |
| 2    | Relay fails after request delivery but before Signer result       | transport failure として扱い、signing outcome を推測しない                       | PASS |
| 3    | Signer process loss during wallet-core signing generation         | Signer が `RESULT_UNKNOWN` を成立させ得る。SDK は correlation と意味不変伝達のみ | PASS |
| 4    | Signer has known signed result but response delivery is uncertain | Signer-side `DELIVERY_UNKNOWN`。SDK / Relay が transport state から生成しない    | PASS |
| 5    | Known signed result delivery failure                              | redelivery / resend / retrieval / lookup。re-sign しない                         | PASS |
| 6    | SDK timeout                                                       | local wait 終了。unsigned / signed / 両 unknown を推測しない                     | PASS |
| 7    | page reload / navigation                                          | context lost / lifecycle failure。signing outcome を推測しない                   | PASS |
| 8    | remote signing failure                                            | local signing へ automatic fallback しない                                       | PASS |
| 9    | Provider A failure                                                | Provider B signing へ automatic fallback しない                                  | PASS |

## 13. Validation Results

| 検証                                                               | 結果          | 備考                                                                                   |
| ------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `pnpm exec prettier --check docs/design/sdk.md`                    | PASS          | 対象 Design の明示パスを確認する。                                                     |
| `pnpm exec prettier --write docs/reviews/design/sdk-review-003.md` | PASS          | 新規成果物の明示パスだけを対象に実行した。                                             |
| `pnpm exec prettier --check docs/reviews/design/sdk-review-003.md` | PASS          | 整形後に同じ成果物を確認した。                                                         |
| `git diff --check`                                                 | PASS          | stage 後の変更について確認した。                                                       |
| Markdown link / path check                                         | PASS          | 成果物内の repository-relative link と参照先を確認した。                               |
| finding ID / status consistency                                    | PASS          | `DR-001` の Resolved tracking、新規 finding 不在、旧レビューの正式 ID 不在を確認した。 |
| severity / Gate / Final Decision consistency                       | PASS          | Critical finding が Resolved、全 Gate Pass、`READY` の整合を確認した。                 |
| changed files                                                      | PASS          | 対象成果物のみの変更であることを確認した。                                             |
| build / typecheck / source lint / runtime test                     | Not validated | source code を変更しない doc-only review のため実行しない。                            |

## 14. Review Gates

| Gate                        | 判定 | 根拠                                                                                                                                                                                           | 対応 ID            |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1. 目的と範囲               | Pass | SDK の non-Signer integration scope、v1 transaction / message、local / remote、対象外および Design phase boundary が明確。                                                                     | —                  |
| 2. コンテキストと責任       | Pass | SDK、Provider、Browser / Mobile Signer、Relay、wallet-core、secret、Origin、approval、disposition authority の境界が明確。                                                                     | `DR-001: Resolved` |
| 3. 依存方向                 | Pass | SDK は Provider / Relay を orchestration boundary として利用し、Signer / wallet-core の privileged responsibility へ逆流しない。                                                               | —                  |
| 4. 主要フロー               | Pass | request、response、timeout、cancellation、lifecycle、transport failure、Signer disposition、known-result recovery、retry、re-sign、fallback が分離されている。                                 | `DR-001: Resolved` |
| 5. データ所有               | Pass | public Account / Network、request context、cache、signed result、secret、Wallet Store、delivery disposition の ownership が分離されている。                                                    | —                  |
| 6. セキュリティと相互運用性 | Pass | non-Signer、4条件、caller / Origin、Profile / Account、Symbol / NEM、Mainnet / Testnet、Relay opaque、両 disposition、secret isolation を維持する。                                            | `DR-001: Resolved` |
| 7. 上流整合性               | Pass | Requirements、Architecture、Security Design、Signing Flow、Interfaces、Component Design、Relay Review 004 と矛盾しない。                                                                       | `DR-001: Resolved` |
| 8. 下流実装可能性           | Pass | transport category、Signer owner、pass-through、known-result recovery、no re-sign、fresh 4条件および fallback prohibition を推測なしに下流へ渡せる。詳細 API / schema は適切に委譲されている。 | `DR-001: Resolved` |

全8 Gate が Pass であり、Critical / Major の New、Open または Reopened finding はないため、Review Gate は `READY` とする。

## 15. Remaining Risks and Open Decisions

- `SDK-OPEN-*`、transport selection、Provider discovery policy、cancellation protocol、compatibility matrix、exact timeout / retry、error mapping、handoff schema、result retrieval API は既存の下位仕様・OPEN・実装工程へ委譲される。
- Mobile App の実装、実機 lifecycle、OS protected storage、hardware matrix、E2E、runtime enforcement および release tooling は未確認である。現在の workspace に Mobile 実装がないことを実装済みとは扱っていない。
- Mainnet release evidence の収集、trusted key、build embedding、runtime enforcement および release operation は release owner が確認する。SDK / Relay health は Mainnet gate ではない。
- 上記は未決定または未検証の下位事項であるが、Signer owner、transport failure との disposition 分離、no automatic re-sign、no automatic fallback、secret isolation および SDK non-Signer を OPEN に戻すものではない。

## 16. Automatic Changes

なし。`docs/design/sdk.md`、Requirements、他の Design、Specification、ADR、source、test、`sdk-review-001.md` および `sdk-review-002.md` は変更していない。レビュー中の自動修正も行っていない。

## 17. Final Decision

`READY`

`DR-001` は `Resolved`。現在の SDK Design は、transport-level failure と Signer-side `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を分離し、SDK に両 disposition の authority を与えず、Signer-originated disposition の correlation / 意味不変伝達だけを定めている。known result recovery と re-sign、transport retry と signing retry、local / remote failure と automatic fallback も分離され、前回 Pass 項目の重大な回帰は確認されない。全8 Review Gate が Pass で、新規 finding もないため、SDK 基本設計を `READY` と判断する。
