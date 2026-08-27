# Relay 基本設計 最終再レビュー

## 1. Review Target

- 対象: [`relay.md`](../../design/relay.md)
- 対象 revision: 修正コミット `ebe5557035d14aa24a80cec98a4c2d0ab37ddb7f`
- 確認日: 2026-08-28
- 今回の成果物: `docs/reviews/design/relay-review-004.md`
- 前回レビュー: [`relay-review-003.md`](./relay-review-003.md)
- レビュー範囲: 前回の新規 `DR-005` の修正確認、および修正箇所による `DR-001`〜`DR-004` の再発、SDK / Relay / Signer の authority、result disposition、retry / fallback、共通4条件、Mainnet gate および Design phase boundary の影響確認。
- 未確認範囲: Mobile runtime、Relay runtime、SDK runtime および実装・テストの挙動。今回は設計本文の再レビューであり、source code は変更しない。
- 前回の `READY` と修正コミットの説明は今回の判定根拠へ自動継承せず、現在の本文と承認済み資料を照合した。

## 2. Execution Audit

サブエージェントは使用していない。Chair が同一資料を混ぜない自己レビューの4パスとして実施した。

| Review pass                        | 確認範囲                                                                                                                                  | 結果                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: 構造と責務             | §29 の4主体、SDK / Relay / Signer / wallet-core の責務、依存方向、修正差分の影響                                                          | SDK の許可責任と禁止責任が分離され、責務逆流なし。DR-005 の完了条件を満たす。                                          |
| Reviewer B: セキュリティと信頼境界 | `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、共通4条件、source / caller、secret、Profile / Account、Chain / Network、MESSAGE_SIGN、Mainnet gate | SDK / Relay が Signer authority を取得していない。DR-001、DR-003 の再発なし。                                          |
| Reviewer C: フローと運用           | timeout、response absence、Provider / Relay failure、known result、retry / redelivery、state loss、fallback                               | transport normalization と Signer-side disposition が分離され、再署名・自動 fallback の禁止を維持。DR-001 の再発なし。 |
| Reviewer D: 追跡と下流実装可能性   | §29 の単独可読性、traceability、RR-OPEN-001 / 002、下位仕様への委譲、実装者の誤読余地                                                     | §29 だけでも SDK の非生成・非再解釈が読め、既決境界と下位委譲を維持。DR-004 の再発なし。                               |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                            | 用途                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`relay.md`](../../design/relay.md) §10、§15、§20、§25〜§32                                                                                                                                                                                                                                                                                                                                     | 現在の Relay の result、failure、責任、security invariant、OPEN、traceability を確認。特に §29 行609 を修正対象とした。                                              |
| [`relay-review-003.md`](./relay-review-003.md)                                                                                                                                                                                                                                                                                                                                                  | `DR-001`〜`DR-005` の初出、severity、修正条件および今回の status 追跡を確認。前回の Gate 判定は今回へ継承していない。                                                |
| 修正コミット `ebe5557035d14aa24a80cec98a4c2d0ab37ddb7f`                                                                                                                                                                                                                                                                                                                                         | §29 の変更範囲と、対象設計以外を変更していないことを確認。コミット説明自体は根拠にしていない。                                                                       |
| [`relay.md` Requirements](../../requirements/relay.md) RR-001〜RR-011、RR-NFR、RR-OPEN                                                                                                                                                                                                                                                                                                          | transaction / message の v1 scope、opaque transport、generation、retry、secret、DoS、OPEN の上流根拠を確認。                                                         |
| [`sdk.md` Requirements](../../requirements/sdk.md) SDK-ERR-001、SDK-AC-007〜011、SDK-OPEN-003                                                                                                                                                                                                                                                                                                   | SDK の error normalization、safe category、no fallback、non-Signer boundary を確認。                                                                                 |
| [`requirements.md` Requirements](../../requirements/requirements.md) CR-011、CR-012、CR-013、CR-015、CR-016、CR-NFR-001〜006、CR-NFR-008〜011                                                                                                                                                                                                                                                   | 共通4条件、SDK / Relay / Signer、secret、binding、Mainnet gate および fail-closed を確認。                                                                           |
| [`mobile-app.md` Requirements](../../requirements/mobile-app.md) MR-AC-013                                                                                                                                                                                                                                                                                                                      | Mobile が Relay input を検証し、表示・承認・認証・署名を担う境界を確認。                                                                                             |
| [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                    | 共通の責務、trust boundary、4条件、result / delivery disposition、retry / fallback を確認。                                                                          |
| [`sdk.md`](../../design/sdk.md)、[`browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                     | SDK non-Signer、Browser local Signer、Mobile remote Signer および Relay の downstream boundary を確認。                                                              |
| [`interfaces.md` Specification](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | result disposition、retry、opaque handoff、Profile / Account、Chain / Network、MESSAGE_SIGN の責務境界を確認。詳細仕様を Relay Design の不足補完には使用していない。 |
| [`wallet-store-format-v1.md`](../../../_snwc/docs/specifications/wallet-store-format-v1.md)、[`specification.md`](../../../_snwc/docs/specifications/specification.md)、[`binding-implementation.md`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                  | Wallet Store、secret、raw signing、wallet-core / Binding の責任が Relay / SDK へ移らないことを確認。                                                                 |
| [`0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)、[`evidence-policy.json`](../../evidence/evidence-policy.json)、[`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)                                                                                                                                                                           | Mainnet capability が release / evidence gate の責任であり、Relay health / delivery の authority でないことを確認。                                                  |

## 4. Review Result

`READY`

## 5. Summary

今回の修正により、前回の `DR-005` は `Resolved` である。§29 の SDK responsibility row は、SDK が担うものを Web Application integration、transport / Provider orchestration、correlation、handoff context、transport / Provider / Relay error normalization、transport-level failure category の公開、および Signer-originated result / disposition の意味不変伝達に限定している。同じ row の非責任欄は、SDK に signing generation result、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、transport failure 由来の result disposition、signing result correctness authority、semantic validation、共通4条件、signing、secret または final caller / source authority を与えていない。

`RESULT_UNKNOWN` は Signer が signing generation 自体の成否を確定できない場合、`DELIVERY_UNKNOWN` は既知の signed result の配送 disposition を確定できない場合に限られる。SDK / Relay はこれらを生成・推測・確定せず、Signer-originated disposition を意味不変に伝達する。Relay / SDK transport failure、timeout、response absence、recipient offline、state loss、reconnect failure、delivery failure、Provider failure または SDK transport state は signing-result authority にならない。

`DR-001`〜`DR-004` の境界も再発していない。opaque structural validation と Signer semantic validation、SDK / Browser / Mobile / Relay の trust boundary、RR-OPEN-001 / 002、traceability、retry / redelivery と signing retry、automatic re-sign / fallback prohibition、共通4条件および Mainnet release / evidence gate は維持されている。新規 Critical / Major finding はない。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー                                   | 今回の状態根拠                                                                                                                                                                                                                  |
| -------- | -------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | Resolved | [`relay-review-002.md`](./relay-review-002.md) | §10.1、§25、§26、§28 が Signer-side の `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` と Relay transport disposition を分離し、§29 が SDK にもこれらの生成・推測・確定 authority を与えていない。                                        |
| `DR-002` | Critical | Resolved | [`relay-review-002.md`](./relay-review-002.md) | §3.1、§8、§25、§27、§28〜§29 が outer structural validation を Relay、operation / transaction / message / `MESSAGE_SIGN` semantics を Signer として維持している。                                                               |
| `DR-003` | Minor    | Resolved | [`relay-review-002.md`](./relay-review-002.md) | §5、§15、§29 が SDK non-Signer、Browser local Signer、Relay opaque transport、Mobile remote Signer を分離し、Browser local path に Relay を挿入していない。                                                                     |
| `DR-004` | Minor    | Resolved | [`relay-review-002.md`](./relay-review-002.md) | §31 の既決 operation scope / result boundary と §32 の責務単位 traceability が維持され、OPEN に既決事項を戻していない。                                                                                                         |
| `DR-005` | Minor    | Resolved | [`relay-review-003.md`](./relay-review-003.md) | 修正後 §29 行609 が SDK の normalization / transport-level category と Signer-originated disposition の意味不変伝達を明記し、両 disposition の生成・推測・確定と transport failure の signing-result 化を明示的に禁止している。 |

`DR-001`〜`DR-005` に `Reopened` はない。過去 finding を言い換えた新規 finding は発行していない。今回の新規 finding は 0 件である。

## 7. Required Changes

なし。Critical / Major の New、Open または Reopened finding はない。

## 8. Optional Improvements

なし。前回の `DR-005` は修正確認済みであり、今回の対象範囲に追加の正式 Minor finding はない。

## 9. Resolved Findings

### DR-005: RESOLVED

- Severity: `Minor`
- Status: `Resolved`
- Target: [`relay.md`](../../design/relay.md) §29 行605〜616、特に SDK responsibility row の行609。
- Previous condition: SDK の「安全側の結果分類」が、transport / error normalization と Signer-originated `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の authority を表だけでは区別しきれず、SDK が Relay failure 等から signer-side disposition を作る余地があった。
- Confirmation facts: 行609 の SDK responsibility は、transport / Provider / Relay error normalization、transport-level failure category の公開、および Signer-originated result / disposition の意味を変更しない受け渡しに限定される。非責任欄は signing generation result の確定、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の生成・推測・確定、Relay outage・timeout・response absence・recipient offline・state loss・reconnect failure・delivery failure からの result disposition 生成、transport failure の signing result への昇格・再解釈および signing result correctness authority を明記的に除外する。
- Evidence: [`signing-flow.md`](../../design/signing-flow.md) §7.3〜§7.4、§20〜§21、[`docs/design/sdk.md`](../../design/sdk.md) §1、§15、§20〜§22、[`docs/requirements/sdk.md`](../../requirements/sdk.md) SDK-ERR-001、SDK-AC-007〜011、[`interfaces.md` Specification](../../specifications/interfaces.md) §10.2〜§10.3。これらは Signer-side disposition、SDK の error normalization、safe category、no fallback および意味不変の result handling を分離している。
- Problem after correction: §29 の単独読解でも、SDK が transport / Provider / Relay failure を公開 category へ normalize できることと、signing generation / known-result delivery の disposition authority を持たないことが区別できる。Provider failure、SDK transport state、response absence、timeout または delivery failure を `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` へ昇格する読み方は、行609 の明示的禁止と §10.1 / §28 の共通 invariant に反する。
- Impact: SDK 実装者が Relay / Provider / SDK の状態を Signer の result correctness、署名生成結果または known-result delivery authority と誤認する経路が閉じられ、known result の resend / retrieval / lookup と re-sign、transport retry と signing retry、security failure と fallback を分離して downstream へ引き継げる。
- Minimum correction confirmed: §29 の SDK row に、許可される normalization / transport-level category / 意味不変伝達と、禁止される両 disposition の生成・推測・確定、transport failure の signing-result 化、result correctness authority を同じ責任表で明記した。
- Reconfirmation: §29 だけを起点に、SDK は non-Signer、Signer-originated disposition は意味不変に伝達するだけであり、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を transport / Provider / Relay / SDK state から生成しないことを確認した。`DR-005` は `Resolved` とする。

### DR-001〜DR-004: 非再発確認

- `DR-001`: §10.1 は `RESULT_UNKNOWN` を signing generation の不明、`DELIVERY_UNKNOWN` を既知 result の配送不明に限定し、Relay transport state からの生成・推測・確定を禁止する。§29 の SDK row にも同じ禁止が追加され、SDK / Relay の authority 取得はない。
- `DR-002`: §3.1、§8、§25、§27、§28 は unknown outer transport version / kind / structure を Relay が fail-closed とし、unknown signing operation、transaction / message format、`MESSAGE_SIGN`、Chain / Network、Account、approval および target semantics を Signer に残す。§29 の修正はこの境界を変更していない。
- `DR-003`: §5 の図と §29 の責任表は SDK、Browser Extension、Relay、Mobile App を別主体として維持する。SDK は four gate、semantic validation、signing、secret、final source authority を持たず、Browser local signing に Relay は入らない。
- `DR-004`: §31 は transaction signing / message signing を v1 の既決 scope とし、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味、transport failure 分離、delivery retry / signing retry 分離、automatic re-sign / fallback prohibition を OPEN に戻していない。§32 の責務単位 traceability も維持されている。

## 10. Deferred Findings

正式な Deferred finding はない。error code、public API 名、exact result enum、JSON / wire schema、timeout、retry contract、storage、transport implementation、deployment および wallet-core Binding の詳細は、現行 Design phase boundary に従い下位仕様・実装・運用へ委譲されている。

これらの委譲は、SDK / Relay が Signer-side result disposition、semantic validation、共通4条件、secret、Profile / Account、Chain / Network、MESSAGE_SIGN、Mainnet gate または result correctness authority を担うことを許可しない。関連 SDK 資料の外部向け safe category の具体 mapping も、§29 の authority separation と `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味を変更しない範囲で下位契約へ委譲される。

## 11. Scope and Traceability

| 責務・設計判断                                                                                                 | 上流・関連根拠                                                                            | downstream owner                                                                                                     | 対象本文                                    | 判定                             |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| SDK non-Signer、transport / Provider / Relay error normalization、Signer-originated disposition の意味不変伝達 | CR-011、CR-015、SDK-ERR-001、SDK-AC-007〜011、Security §3.2、SDK Design §1、§15、§20〜§22 | SDK は orchestration / normalization のみ。Signer が result correctness と disposition authority を持つ              | §15、§29                                    | 適合。DR-005 解消。              |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` と transport failure の分離                                              | RR-004、Signing Flow §7.3〜§7.4、Interfaces Specification §10.3                           | Signer が signing generation / known-result delivery disposition を確定。Relay / SDK は生成・推測・確定しない        | §10、§14、§20、§25〜§29                     | 適合。DR-001 非再発。            |
| opaque / structural validation と Signer semantic validation                                                   | RR-003、Architecture §6.5〜§6.7、Interfaces §7〜§8、Mobile §8、Browser §10                | Relay は outer transport、Browser / Mobile Signer は operation、target、意味および approval                          | §3、§8、§16、§25、§27〜§29                  | 適合。DR-002 非再発。            |
| SDK / Browser / Mobile / Relay trust boundary                                                                  | CR-011、CR-015、Architecture §6.2〜§6.5、Browser §4 / §21、Mobile §25                     | SDK non-Signer、Browser local Signer、Mobile remote Signer、Relay opaque transport                                   | §5、§15〜§16、§29                           | 適合。DR-003 非再発。            |
| retry / redelivery / resend / lookup、no re-sign、automatic fallback prohibition                               | RR-004、RR-006、SDK-OPEN-003、Signing Flow §20〜§23、Signing Protocol §19                 | Relay は delivery、client / Signer は known result の回収。new signing は fresh request、4条件、approval             | §10、§12、§14、§20、§25〜§26、§29、§31〜§32 | 適合。                           |
| RR-OPEN-001 / 002 と traceability                                                                              | Relay Requirements RR-OPEN-001 / 002、common Requirements、ADR-0001                       | operation scope と disposition meaning は既決。具体 code / mapping / timing / retry は下位へ委譲                     | §31〜§32                                    | 適合。DR-004 非再発。            |
| four-condition gate、source / caller、Profile / Account、Chain / Network、MESSAGE_SIGN                         | CR-016、CR-NFR-008〜011、Security、Browser、Mobile、Chain Compatibility                   | Browser / Mobile trusted Signer、wallet-core、release policy                                                         | §5〜§8、§15〜§17、§27〜§29                  | 適合。SDK / Relay は代替しない。 |
| secret / wallet-core / E2E boundary                                                                            | RR-008 / RR-009、CR-013、wallet-core specification / Binding decision                     | wallet-core は Wallet Store / raw signing、Signer host は approval / orchestration。SDK / Relay は secret を扱わない | §3.3、§13、§21〜§24、§28〜§29               | 適合。                           |
| Mainnet release / evidence gate                                                                                | CR-NFR-006、ADR-0001、evidence policy、mainnet release evidence                           | release / evidence policy と Signer。Relay health / connection / delivery は authority でない                        | §20、§28〜§29、§32                          | 適合。                           |

## 12. Domain Checks

| 評価項目                                              | 判定 | 根拠                                                                                                                                                                                 |
| ----------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SDK transport / error normalization                   | Pass | §29 行609 は transport / Provider / Relay error normalization と transport-level failure category の公開を許可し、signing-result authority を禁止する。                              |
| `RESULT_UNKNOWN` authority                            | Pass | signing generation 自体の成否不明を Signer-side に限定し、SDK / Relay の生成・推測・確定を禁止する（§10.1、§25、§28〜§29）。                                                         |
| `DELIVERY_UNKNOWN` authority                          | Pass | 既知 signed result の配送不明を Signer-side disposition とし、response absence、timeout、Relay unavailable、delivery failure から SDK / Relay が生成しない（§10.1、§25、§28〜§29）。 |
| transport failure との分離                            | Pass | Relay / Provider / SDK state は transport / error category として扱い、Signer-originated disposition の意味を変更しない伝達だけを許可する。                                          |
| DR-001〜DR-004 の回帰                                 | Pass | result / delivery、opaque validation、4主体、OPEN / traceability の既決境界に変更なし。                                                                                              |
| retry / re-sign / fallback                            | Pass | known result は redelivery / resend / retrieval / lookup、unknown / transport / security failure から automatic re-sign / fallback なし（§10、§12、§25〜§26、§29）。                 |
| 共通4条件                                             | Pass | Authentication、Signing-capable unlock、Account authorization、Explicit user approval は Browser / Mobile Signer の責任で、SDK / Relay は代替しない（§7、§15〜§16、§28〜§29）。      |
| source / caller / Profile / Account / Chain / Network | Pass | Relay metadata、SDK correlation、session、Provider state は最終 authority ではなく、Signer が binding を検証する（§5〜§8、§15〜§17）。                                               |
| MESSAGE_SIGN / semantic authority                     | Pass | domain、purpose、message semantics、operation、target、approval は Signer authority。Relay / SDK は opaque / orchestration に留まる（§3.1、§8、§27〜§29）。                          |
| secret / E2E / wallet-core                            | Pass | plaintext signing target、Wallet Store、private key、Mnemonic、session secret、signing-capable secret は Relay / SDK に渡らない（§3.3、§13、§28〜§29）。                             |
| replay / duplicate / correlation                      | Pass | session / request / response / generation / recipient の相関と client-side integrity / replay validation を維持し、ID 単独を authority にしない（§6、§11、§17〜§19、§28）。          |
| retention / logging / DoS                             | Pass | bounded short-lived opaque state、minimum telemetry、resource / abuse control、fail-closed を維持する。具体値は要求していない（§4、§12〜§13、§21〜§24、§28）。                       |
| Mainnet release / evidence gate                       | Pass | Relay availability / connection / delivery / health は Mainnet capability または release evidence の根拠にならない（§20、§28〜§29）。                                                |
| Design phase boundary                                 | Pass | SDK API、error code、enum、schema、timeout、retry count、storage、deployment、implementation class を本文へ逆流させていない。                                                        |

## 13. Validation Results

- `pnpm exec prettier --check docs/design/relay.md`: `PASS`。
- `pnpm exec prettier --write docs/reviews/design/relay-review-004.md`: `PASS`。
- `pnpm exec prettier --check docs/reviews/design/relay-review-004.md`: `PASS`。
- `git diff --check`: `PASS`。
- Markdown link / path check: 成果物内の相対 Markdown link を実在 path へ解決し、`PASS`。
- Finding ID / status consistency: `DR-001`〜`DR-005` を status table と Resolved Findings で対応付け、重複する新規 ID なし。`PASS`。
- Review Result / Review Gate / Final Decision consistency: すべて `READY`、全8 Gate `Pass`、Required Changes はなし。`PASS`。
- 変更範囲: 修正コミットは `docs/design/relay.md` のみ。今回の作業では `docs/design/relay.md`、Requirements、Design、Specifications、ADR、source code、tests を変更せず、新規 review artifact のみを作成する。`PASS`。
- source lint / typecheck / test / build: source code を変更しないため未実行。`Not validated` として扱い、成功とはしていない。

## 14. Review Gates

| Gate                        | 判定 | 根拠                                                                                                                                    | 対応 finding                           |
| --------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1. 目的と範囲               | Pass | Relay v1 の transaction signing / message signing handoff と、SDK / Relay の transport boundary が維持されている。                      | なし                                   |
| 2. コンテキストと責任       | Pass | §5、§15〜§16、§29 が SDK、Relay、Browser、Mobile、wallet-core、Signer の境界を明示する。                                                | `DR-001`〜`DR-003`: Resolved           |
| 3. 依存方向                 | Pass | SDK / Relay は Signer、wallet-core、Profile / Account authority、release / evidence authority を代替しない。                            | `DR-003`: Resolved                     |
| 4. 主要フロー               | Pass | result / delivery、transport failure、retry / redelivery、known result、state loss、fresh handoff、fallback を分離する。                | `DR-001`: Resolved                     |
| 5. データ所有               | Pass | Relay は opaque short-lived state、SDK は orchestration / normalization、Signer / wallet-core は result / secret authority を所有する。 | `DR-001`、`DR-005`: Resolved           |
| 6. セキュリティと相互運用性 | Pass | opaque boundary、semantic validation、共通4条件、MESSAGE_SIGN、Chain / Network、secret isolation、Mainnet gate を弱めていない。         | `DR-001`、`DR-002`、`DR-003`: Resolved |
| 7. 上流整合性               | Pass | Requirements、common / client Design、Specifications、wallet-core 資料、ADR / release policy と重大な矛盾がない。                       | `DR-001`〜`DR-004`: Resolved           |
| 8. 下流実装可能性           | Pass | §29 だけから SDK の normalization と Signer-side disposition authority の違いを読み取れ、具体 API / schema は適切に委譲されている。     | `DR-005`: Resolved                     |

全8 Gate が `Pass` であり、Critical / Major の New、Open または Reopened finding はない。Minor の `DR-005` も `Resolved` である。

## 15. Remaining Risks and Open Decisions

- `RR-OPEN-001`: transaction signing と message signing は Relay v1 の既決 operation scope。未決は external handoff contract、milestone completion condition および SDK / Mobile boundary の残余詳細であり、scope を OPEN に戻していない。
- `RR-OPEN-002`: concrete error code、failure mapping、timing、retry contract は未決でよい。ただし `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の意味、transport failure との分離、delivery retry / signing retry の分離、automatic re-sign / fallback prohibition は既決のままである。
- SDK の公開 safe category と下位 error mapping の具体形式は後続仕様の責任である。`docs/design/relay.md` §29 の「transport-level failure category」と Signer-originated disposition の意味不変伝達を維持することが前提である。
- Mobile App は現在の workspace に実装されていないため、runtime の再検証は別工程で必要だが、今回の設計 Gate の未確認範囲であり finding にはしていない。

## 16. Automatic Changes

なし。`docs/design/relay.md`、Requirements、他の Design、Specifications、ADR、source code、tests は変更していない。変更したのは本レビュー成果物のみである。

## 17. Final Decision

`READY`

`DR-005` は、§29 の SDK responsibility row によって Resolved である。SDK は transport / Provider / Relay error の normalization と transport-level category の公開、および Signer-originated disposition の意味不変伝達だけを担い、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の生成・推測・確定、transport failure の signing-result 化、signing result correctness authority を持たない。`DR-001`〜`DR-004` の opaque / non-Signer、semantic validation、trust boundary、OPEN / traceability、retry / fallback の境界も再発していない。全8 Review Gate が Pass で、新規 Critical / Major finding はないため、Relay Design を `READY` と判断する。
