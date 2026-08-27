# MosaicLynx 共通 Data Model / Interface 基本設計レビュー 003

## 1. Review Target

- 対象: [`docs/design/interfaces.md`](../../design/interfaces.md)
- 確認日: 2026-08-27
- レビュー成果物: `docs/reviews/design/interfaces-review-003.md`
- レビュー範囲: 共通 Data Model / Interface 基本設計の目的、責務境界、trust boundary、request / response / result context、Profile / Account、Chain / Network、operation、failure、lifecycle、correlation、permission / capability、SDK、Relay、wallet-core、traceability および OPEN 項目の独立評価。
- 設計フェーズ境界: API signature、JSON / DTO schema、field type、wire encoding、exact error code、timeout / retry 数、DB / Redis schema、暗号方式、byte serialization、実装 class、UI layout は評価対象の不足としない。
- 未確認範囲: 本レビューでは source code、runtime 挙動および未実装 Mobile App の実装検証を行っていない。これらは本書の基本設計レビュー対象外である。
- 指定された [`docs/reviews/design/signing-flow-review-004.md`](./signing-flow-review-004.md) と `signing-flow-review-003.md` を関連資料として確認した。Signing Flow review 004 の `READY` およびその他の上位 review の判定は今回へ自動継承していない。

## 2. Execution Audit

`design-review` Skill、共通 review playbook、reviewers、review gates、output format、[`AGENTS.md`](../../../AGENTS.md) および [`.agents/project-context.md`](../../../.agents/project-context.md) を確認した。サブエージェントは使用せず、Chair が次の4観点を別走査で実施した。

| 観点                                   | 独立確認                                                                                                                                                     | 候補の扱い                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: structure / responsibility | dApp、SDK、Provider / Content Script、Browser / Mobile Signer、Relay、wallet-core、Application Profile / Account、依存方向を確認                             | `DR-001`、`DR-002`、`DR-003`、`DR-005` を採用。大枠の依存方向と secret boundary は適合。                              |
| Reviewer B: security / trust boundary  | Authentication、signing-capable unlock、Account authorization、explicit approval、caller、target、Chain / Network、Relay、wallet-core、secret leakage を確認 | `DR-001`、`DR-002`、`DR-003` を採用。Relay / SDK / wallet-core が gate authority になる記述は確認されなかった。       |
| Reviewer C: flow / operations          | request lifecycle、response、result unknown、delivery unknown、concurrent request、replay、freshness、failure、fallback、lifecycle loss を確認               | `DR-001`、`DR-004`、`DR-005` を採用。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` と automatic fallback prohibition は適合。 |
| Reviewer D: traceability / downstream  | Requirements、上位 Design、platform / SDK / Relay Design、Specification、wallet-core、ADR、OPEN と下流の実装判断の境界を確認                                 | `DR-001`〜`DR-005` を採用。exact schema / API / wire 詳細は finding にしなかった。                                    |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                                  | 用途                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                                                                                                                             | 今回の主対象。現在の本文、責任表、論理モデル、validation、security、委譲、OPEN を直接確認した。                               |
| [`docs/reviews/design/interfaces-review-001.md`](./interfaces-review-001.md)、[`interfaces-review-002.md`](./interfaces-review-002.md)                                                                                                                                                                                                                                                                | 過去の `IF-001`〜`IF-003` の ID と現在状態の再確認だけに使用した。過去の READY 判定は継承していない。                         |
| [`docs/design/architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)                                                                                                                                                                                                                             | authoritative な上位 Design として責務、4条件の共通署名 gate、Profile / Account、結果、lifecycle、fallback を照合した。       |
| [`docs/reviews/design/architecture-review-004.md`](./architecture-review-004.md)、[`security-design-review-004.md`](./security-design-review-004.md)、[`signing-flow-review-003.md`](./signing-flow-review-003.md)、[`signing-flow-review-004.md`](./signing-flow-review-004.md)                                                                                                                      | 関連 review の存在と指摘・判定の境界を確認した。今回の判定は各 review の READY / REVISE を自動継承していない。                |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                                                                                                     | Product の責任境界と信頼モデルの上流根拠を確認した。                                                                          |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)                                                                                                                   | CR-013、CR-015、CR-016、CR-NFR-008〜012、CR-AC-017〜019 と各主体の要求を確認した。                                            |
| [`docs/design/browser-extension.md`](../../design/browser-extension.md)、[`mobile-app.md`](../../design/mobile-app.md)、[`relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                          | Browser / Mobile caller context、Profile / Account invalidation、SDK / Relay の責務、concurrency、result binding を照合した。 |
| [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | 下流で既に具体化された意味の区別と binding を確認した。ただし exact schema / field / encoding は本設計へ逆流させていない。    |
| [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)                                                                                                                                                                                                                                                                                                                   | Mainnet capability / release gate の owner と、Interface Design がそれを無断で緩和していないことを確認した。                  |
| `_snwc/README.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`                                                                                                                                                                                                                                          | wallet-core の Wallet Store、secret processing、public identity、raw signing、Binding の責務と Application 側責務を確認した。 |
| `design-review` Skill 一式、共通 playbook、project context、`AGENTS.md`                                                                                                                                                                                                                                                                                                                               | レビュー手順、正式 ID、重大度、gate、出力順、変更範囲および検証規則を確認した。                                               |

## 4. Review Result

`REVISE DESIGN`

## 5. Summary

現在の本文は、dApp / SDK / Provider / Content Script を untrusted とし、Browser / Mobile を Signer、Relay を opaque transport、wallet-core を secret processing / raw signing の owner とする大枠を保持している。Chain と Network の分離、chain-specific operation、secret isolation、target-derived summary、wallet-core result の直接転送禁止、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の区別および automatic fallback 禁止も確認できる。

ただし、上位で確定した安全条件を共通 interface の全 lifecycle へ引き渡す基本設計として、次の問題がある。

- `DR-001`（Critical）: Profile は公開 request field として必要ではないが、Signer-local な Profile / Profile Network context として request、approval、authentication、signing、result、delivery に binding され、Profile switch で失効する条件が明示されていない。
- `DR-002`（Major）: Application の Account identity / Profile association と wallet-core の Software Key public identity の authoritative source が、共通 Account model 上で二重に解釈できる。
- `DR-003`（Critical）: Authentication、signing-capable unlock、Account authorization、explicit user approval の4条件を全て満たすことが Signer の署名・success の前提であること、および capability がその代替でないことが肯定形の共通 invariant として不足している。
- `DR-004`（Major）: Error model が広いカテゴリへ集約され、invalid、cancelled、expired、authentication failure、Account authorization failure、locked、replay / duplicate、wallet-core failure、transport failure の意味上の区別を実装者へ十分に伝えない。
- `DR-005`（Critical）: 複数の Browser tab / frame または Mobile handoff request を、caller、Profile / Account、approval / authentication、target、result ごとに独立させる共通 invariant がない。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー            | 今回の状態根拠                                                                                                |
| -------- | -------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | New      | 今回                    | Profile-local context の request / approval / result binding が本文の共通モデルに不足している。               |
| `DR-002` | Major    | New      | 今回                    | Account の Application authority と wallet-core identity authority の境界が本文で一意に固定されていない。     |
| `DR-003` | Critical | New      | 今回                    | 共通4条件と capability の非代替性が、署名 gate の肯定形 invariant として不足している。                        |
| `DR-004` | Major    | New      | 今回                    | Error の概念カテゴリが安全な failure branching に必要な意味区分を十分に表していない。                         |
| `DR-005` | Critical | New      | 今回                    | Concurrent request の context、approval、authentication、result を混線させない高位 invariant が不足している。 |
| `IF-001` | —        | Resolved | `interfaces-review-001` | Public account identity と Internal account reference の分離が現在本文で確認できる。                          |
| `IF-002` | —        | Resolved | `interfaces-review-001` | `failed`、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` の意味と自動再署名禁止が現在本文で確認できる。                 |
| `IF-003` | —        | Resolved | `interfaces-review-001` | Relay / node は Network authority ではなく untrusted source であることが現在本文で明記されている。            |

過去 `IF-001`〜`IF-003` は全て `RESOLVED` であり、今回 `REOPENED` となるものはない。過去 `READY` は今回の Review Gate 判定へ継承していない。

## 7. Required Changes

### DR-001: Profile-local context の request / result binding が不足している

- ID: `DR-001`
- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.1〜§6.4、§7〜§9（特に request の概念列挙、response の対応付け、validation、context change の扱い）

#### Facts / conditions

`SigningRequest` の binding 対象は request identity、caller、session、operation、Account、Chain / Network、target 等として列挙されているが、Application Profile は独立した Signer-local context として列挙されていない。Profile は Network / Account との照合対象、または Internal account reference を解決する現在 context として断片的に登場するだけである。`SigningResponse` の success 対応も request identity、operation、signer、Account、Chain / Network、target が中心で、同じ Profile context と元 caller / browser context / Mobile source へ安全に返す条件が明記されていない。

#### Evidence

- 上位 Architecture §6.6、§6.9 は Application Profile / Account association と、Profile / Chain / Network / Account authorization を Signer 側 gate の context として扱う。
- [Profile / Account specification](../../specifications/profile-account-spec.md) §2 は Network を Profile 単位で固定し、§20 は unlock と signing authentication を分離する。
- Browser Extension Design の authorization tuple、result binding、Profile / Account / Chain / Network change の invalidation は、public Profile field の追加ではなく trusted host 内部 context の再利用禁止を要求している。
- 対象本文 §6.2、§6.3、§6.4、§8、§9（現行行 147〜217、306〜334）は Profile を Account / payload の補助照合に留めている。

#### Problem

実装者が、request 受信時の Profile、approval / authentication 時の active Profile、署名時の current Profile、result delivery 時の Profile を同一であることを確認せずに扱える。Profile ID を公開 request / response に追加しない場合でも、Profile-local binding とその失効条件を共通設計で明示しなければ、同じ request identity や public Account だけで異なる Profile context を結び付ける余地が残る。

#### Impact

Profile Network、chain-specific Account、permission、approval、署名結果の帰属が異なる Profile 間で混線し、wrong Profile / Account への署名または別 caller への結果 delivery を安全に拒否できない解釈が生じる。これは data ownership、trust boundary、result safety および上位の共通署名 gate を損なう。

#### Minimum correction

Application Profile とその固定された Profile Network を、public request field ではない Signer-local security context として定義する。wallet-core の Profile / Store と同一視せず、Application が Profile / Account association、permission、active context を所有し、Signer が request、approval、authentication、pre-sign revalidation、wallet-core call、result validation、delivery recipient の同一 context binding を確認することを明記する。Profile switch、active context loss、permission revoke、Account / Chain / Network change が影響する pending request、approval、authentication、result delivery を invalid にすることも定める。Profile ID の外部公開は必須化しない。

#### Reconfirmation criteria

本文に、Profile / Profile Network が Signer-local context であり、公開 request field ではないこと、同一 Profile context が request から result delivery まで維持されること、context change 後に古い authorization / result を再利用しないことが明記されている。Browser の tab / frame / document、Mobile の handoff source とも結び付く同一 caller context の検証条件が確認できる。

### DR-002: Account identity の authoritative source が二重に解釈できる

- ID: `DR-002`
- Severity: `Major`
- Target: [`interfaces.md`](../../design/interfaces.md) §4.1、§5.1、§6.2、§8（特に Account producer / validator と public identity の記述）

#### Facts / conditions

境界表は wallet-core を `key identity` の authority とし、Account 節は Signer が address / public key を「検証・導出」すると記述する。また validation table は Chain / Network / Account の主な責任主体を Signer と chain-specific integration としている。Application の Profile / Account association、permission、選択と、wallet-core の Software Key / public identity のどちらが Account のどの部分の正本かは明示的に分かれていない。

#### Evidence

- Architecture §6.6、§6.8、§6.9 は Application が Profile / Account association、選択、permission を所有し、wallet-core が key identity、public identity、Store、raw signing を所有すると分けている。
- `_snwc` の wallet-core contract は Software Key の public key / address の取得と raw signing を wallet-core 側の責務とし、host に transaction meaning や approval を委譲しない。
- 対象本文 §4.1、§6.2、§8（現行行 77〜84、135〜170、306〜320）は両方の authority を示すが、Account の source-of-truth と checked projection の関係を固定していない。

#### Problem

実装者が Application の public Account を独自に生成・更新し、wallet-core の key identity と異なる Account を選択できる、または逆に wallet-core の key reference を Application-level authorization の根拠として扱える。外部 requester の Account self-declaration も、どの authority と照合すべきかが一意でない。

#### Impact

Account authorization、expected signer、address / public key、Profile / Chain / Network の対応が崩れ、利用者が承認した Account と wallet-core が署名する key identity が異なる可能性がある。Symbol / NEM の chain-specific identity を共通 Account へ誤って統合する危険も残る。

#### Minimum correction

wallet-core が Software Key に対応する cryptographic public identity の source-of-truth であること、Application / Signer が Application Profile における Account の選択、表示、association、permission および authorization の source-of-truth であることを明記する。chain-specific integration は target、expected signer、address / public key と wallet-core identity の整合を検証する。共通 `Account` はこれらを検証済みで対応付けた public projection とし、外部 Account self-declaration、internal key reference または wallet-core の成功だけを authorization としない。具体的な key schema は決めない。

#### Reconfirmation criteria

本文の Account / validation / wallet-core sections で、Application Account と wallet-core Software Key identity の owner が分離され、Signer が両者の対応を検証すること、外部 Account は authority ではないことが一意に読める。Symbol / NEM ごとの identity を共通秘密鍵として扱わない条件も維持されている。

### DR-003: 共通署名 gate の4条件と capability の非代替性が不足している

- ID: `DR-003`
- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §4.1、§6.3、§7、§9、§10（特に producer / validator、permission、capability、署名前提）

#### Facts / conditions

対象本文は Signer の caller / permission / target / Account / Chain / Network validation、trusted UI の approval、署名ごとの authentication を記載し、connection permission、session、`UNLOCKED`、過去の認証を代替にしないと否定している。しかし、Authentication、signing-capable unlock、対象 Profile / Chain / Network / Account の Account authorization、explicit user approval の4条件が全て成立した場合に限り wallet-core を呼び success を返す、という肯定形の共通 gate は示されていない。Capability も version / support context としては列挙されるが、authentication、unlock、Account authorization、approval、signing authority のいずれも意味しないことが明示されていない。

#### Evidence

- Architecture §6.9 と Requirements `CR-016` / `CR-AC-017` は4条件を全て必須とし、dApp、SDK、Relay、wallet-core が成立・更新・迂回できないと定めている。
- Security Design §7〜§9 は unlock、署名時 authentication、permission、Account authorization を別の条件として扱う。
- Signing Flow §4、§16 は approval / authorization tuple を定めるが、対象本文の §9（現行行 325〜334）は主に代替禁止の否定表現に留まる。
- SDK Design は capability を「できる可能性」とし、個別 authorization、Account permission、approval、unlock、success と区別している。

#### Problem

受信側実装が `permission`、capability、通常の unlocked state、wallet-core の password / Store 成功または transport session の有効性を、4条件の一部または全ての代替と解釈できる。拒否条件の列挙だけでは、Signer's trusted authority がどの条件をいつ成立させ、どの条件を再確認してから raw signing / success に進めるかを一意に伝えられない。

#### Impact

認証済みでも signing-capable unlock でない状態、Account authorization がない状態、または explicit approval がない状態から署名・成功結果へ到達する責任逆流が起こり得る。SDK、Relay、dApp、Provider、Content Script または wallet-core が gate authority と誤認されると、共通 trust boundary の重大な弱体化になる。

#### Minimum correction

Signer が次の4条件を全て成立・再確認した場合に限り、承認済み target を wallet-core へ渡し、対応する success result を生成する共通 invariant を明記する: (1) Authentication、(2) signing-capable unlock、(3) Profile / Chain / Network / Account に対する Account authorization、(4) explicit user approval。各条件の authority は Signer / Application host とし、permission、capability、connection、session、wallet-core result、Relay metadata、dApp / SDK self-declaration は代替にならないと定める。公開 request に自己申告 gate field を追加する必要はない。

#### Reconfirmation criteria

本文の共通 security invariant、request validation、pre-sign validation、result validation に4条件が肯定形で現れ、全条件が同一 caller / Profile / Account / Chain / Network / operation / target / freshness context に binding されている。capability negotiation は support / availability に限定され、gate authority と明確に分離されている。

### DR-004: Error の意味上の区別が不十分である

- ID: `DR-004`
- Severity: `Major`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.4、§6.6、§7.6、§9、§11（特に Error category と下位委譲）

#### Facts / conditions

Error model は validation、protocol、unsupported、user rejection、security rejection、signing、network、relay、internal に集約されている。`USER_REJECTED` と `SIGNING_FAILED`、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` は区別できるが、invalid、cancelled、expired、authentication failure、Account authorization failure、locked、replay / duplicate、wallet-core failure、transport failure を共通 interface の意味として個別に識別する責任が明示されていない。

#### Evidence

- Signing Flow §22 は invalid request、unsupported、permission denied、authentication failed、expired、cancelled、duplicate / replay、signing failed、transport unavailable / timeout、result unknown を意味上区別している。
- Requirements `CR-012`、`CR-NFR-010`、`CR-NFR-011` は安全な失敗、freshness、replay / duplicate の異なる扱いを要求している。
- 下流 [Interfaces Specification](../../specifications/interfaces.md) §10 は具体的 code へ落とす前の意味カテゴリを既に分けているが、対象本文 §6.6（現行行 238〜254）は広い分類へまとめている。

#### Problem

下位実装が、locked / authentication failure / Account authorization failure を validation または security rejection に、cancelled / expired を user rejection または generic signing error に、wallet-core failure を internal error に、transport failure を network / relay error に自由に畳み込める。結果として SDK / dApp は再試行、利用者案内、状態保持、再署名禁止を意味安全に判断できない。

#### Impact

確定失敗、利用者キャンセル、期限切れ、認証不成立、配送失敗および結果不明が混同され、同一 request の誤った再試行や `RESULT_UNKNOWN` への誤変換が起こり得る。`DELIVERY_UNKNOWN` と result outcome を分ける現在の安全境界も、広い error mapping により下流で失われる。

#### Minimum correction

具体的な error code / JSON shape を定めず、共通 Error の semantic contract として少なくとも invalid、unsupported、user rejected、cancelled、expired、authentication failure、Account authorization / permission failure、locked / signing-capable unlock failure、replay / duplicate、wallet-core / signing failure、transport / relay failure、internal failure、result unknown の責任と意味を区別する。確定 failure と result / delivery unknown は別の概念であり、automatic re-sign の根拠にしないことを維持する。具体的 code、番号、retryability 表現は下位仕様へ委譲する。

#### Reconfirmation criteria

本文の Error model が上記の意味区分を実装者の推測なしに示し、各区分が Signer、SDK / adapter、Relay、wallet-core のどの責任境界から生じるかを追跡できる。具体的 code、schema、timeout、retry 数を本書で決めていないことも維持されている。

### DR-005: Concurrent request の context isolation が共通モデルにない

- ID: `DR-005`
- Severity: `Critical`
- Target: [`interfaces.md`](../../design/interfaces.md) §6.3〜§6.4、§7、§8、§9（request identity / correlation、response、lifecycle、validation）

#### Facts / conditions

対象本文には request identity / correlation、caller context、session、freshness、duplicate / replay、別 request への result 流用禁止の概念がある。しかし、複数 request が同時に存在する場合に、各 request が独立した caller、Browser tab / frame / document または Mobile handoff source、Profile / Account、permission revision、operation、target、approval、authentication、wallet-core call、result、delivery recipient を持ち、他 request の context を組み合わせてはならないという共通 invariant はない。

#### Evidence

- Security Design §10.2 は concurrent request ごとの request identity、caller、Profile / Account、Chain / Network、承認・認証・result の分離を要求する。
- Browser Extension Design §7.2〜§7.3 は tab / frame / document context と response binding を request ごとに扱う。
- Mobile Design の request lifecycle と SDK 要件は、複数 handoff / request を独立 identity、session、context、result として扱う。
- 対象本文の `rg` 確認では、`concurrent`、`同時`、複数 request の独立性を直接定める記述はなく、§6.3〜§6.4 の一般的な correlation と重複禁止だけである。

#### Problem

requestId や transport session の相関だけを実装した場合、別 request の caller / Account / Profile / approval / authentication / target を同一 request の response として合成する解釈が残る。Browser の複数 tab / frame と Mobile の複数 handoff では、同じ SDK instance、Relay session または signer UI が存在しても、承認・署名・結果を共有してはならない。

#### Impact

承認済み target と異なる target、Account、Chain / Network または caller へ署名結果が対応付けられ、誤った request への success delivery、authorization reuse、または wrong-context signing が起き得る。これは request correlation を transport / SDK instance の存在だけに依存させずに守るという要件に反する。

#### Minimum correction

各 SigningRequest を独立した security / lifecycle unit とし、request identity だけでなく caller context、session、permission context、Application Profile、Account、Chain / Network、operation、target、freshness、approval、authentication、wallet-core result、response recipient を同一 request の context として扱う invariant を追加する。並行 request 間で context、approval、authentication、result、delivery status を共有・合成・流用せず、late / stale result は元 request 以外へ返さない。具体的な queue、lock、state machine は下位設計へ委譲する。

#### Reconfirmation criteria

本文に Browser の複数 tab / frame、Mobile の複数 handoff を含む concurrent request isolation が明記され、request ごとの approval / authentication / result / recipient binding と cross-request reuse 禁止が確認できる。requestId 単独、transport session、Relay generation または SDK instance が security authority の代替になっていない。

## 8. Optional Improvements

なし。現時点で採用できる Minor finding はない。traceability の表示強化は有用だが、現在の本文は関連資料と責任表を持っており、今回の重大な不足とは分離した。

## 9. Resolved Findings

| 過去 ID  | Status     | 現在の解消根拠                                                                                                                                                                            |
| -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IF-001` | `RESOLVED` | §6.2（現行行 147〜170）が Public account identity と Internal account reference を分離し、内部 reference を外部 requester の capability / authority と扱わない。                          |
| `IF-002` | `RESOLVED` | §6.4、§6.6、§9（現行行 194〜217、238〜254、325〜334）が確定 failure、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` を分け、同一 request の自動再署名・推測再送を禁止する。                         |
| `IF-003` | `RESOLVED` | §4.1、§4.2、§6.1（現行行 88、95、98、133）が Relay / node を Network metadata の untrusted source とし、Signer / chain-specific integration を local context の検証・確定主体としている。 |

いずれも今回の新規 `DR-*` と同一問題の再発とは判定しない。ただし `IF-001` の内部 reference 分離だけでは `DR-001` の Profile-local lifecycle binding を満たさず、`IF-002` の unknown 区分だけでは `DR-004` の全 failure semantics を満たさない。

## 10. Deferred Findings

正式な Deferred finding はない。次の事項は設計本文の適切な委譲であり、今回の gate failure の理由ではない。

- API 名、function signature、公開 DTO / JSON schema、field type、wire encoding、protocol envelope。
- Symbol / NEM の transaction schema、canonical serialization、署名 byte、aggregate / multisig / cosignature の chain-specific 詳細。
- message の domain separator、nonce format、serialization、完全な inspection / display 規則。
- Browser API、Mobile OS handoff、wallet-core Binding、secret lifecycle、Relay HTTP / Redis schema、TTL、exact retry / lookup 契約。
- Error code、番号体系、公開文言、timeout、retry count。
- Mainnet capability / release evidence の gate。これは [`ADR 0001`](../../adr/0001-mainnet-evidence-lite.md) と release 資料の owner であり、Interface Design が緩和していないことを確認した。

対象本文 §13 の SDK、Mobile、wallet-core、Relay、Chain / NEM の OPEN は、上位で確定した trust boundary を変更しない範囲では未決でよい。Profile-local binding、4条件 gate、concurrent isolation、failure semantics は既に上位で決まった責任・安全条件であり、OPEN へ戻すべき事項ではない。

## 11. Scope and Traceability

本レビューは共通概念の責任、依存、trust、所有、主要フローおよび下流へ渡す最低条件を評価した。具体的な API / schema / wire / crypto は要求していない。

| Interface responsibility                              | 上流根拠                                                                                                      | 対象本文との追跡           | 判定                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Signer が最終判断、SDK / Relay / dApp が非署名境界    | Architecture §6.5、§6.9、Requirements `CR-015`、SDK / Relay Design                                            | §4、§7、§8                 | 大枠は適合。                                                                                        |
| 4条件の共通署名 gate                                  | Architecture §6.9、Requirements `CR-016` / `CR-AC-017`、Security §7〜§9、Signing Flow §4 / §16                | §6.3、§7、§9               | 不足。`DR-003`。                                                                                    |
| Application Profile / Account と wallet-core identity | Requirements `CR-013`、Architecture §6.6 / §6.8 / §6.9、Profile / Account Specification、wallet-core contract | §4、§6.1〜§6.3、§8         | 部分適合。`DR-001`、`DR-002`。                                                                      |
| request / approval / result の context binding        | Requirements `CR-NFR-008`〜`CR-NFR-012`、Security §10、Signing Flow §5 / §16 / §20                            | §6.3〜§6.4、§8〜§9         | 不足。`DR-001`、`DR-005`。                                                                          |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` と再署名禁止    | Signing Flow §7 / §20 / §21、Interfaces Specification §10.3                                                   | §6.4、§9、§11              | 適合。過去 `IF-002` は Resolved。                                                                   |
| Browser / Mobile caller authority                     | Browser / Mobile Requirements、Browser / Mobile Design、SDK Design §9                                         | §4.1、§5.1、§7             | 大枠は適合。Browser observed context / Mobile handoff の最終検証を Signer に置いている。            |
| Relay opaque transport                                | Relay Requirements / Design、web handoff specification                                                        | §4.1、§4.2、§7.3           | 適合。Relay metadata は trusted interface value ではない。                                          |
| wallet-core raw signing / secret owner                | Requirements `CR-013`、wallet-core documents、Architecture §6.8                                               | §3.4、§4.1、§7.4〜§7.5、§8 | 大枠は適合。Account identity source の明確化は `DR-002`。                                           |
| Chain / Network と Symbol / NEM の分離                | Chain Compatibility Specification、Profile / Account Specification、Architecture §6.7                         | §3.3、§6.1〜§6.3、§6.5     | 適合。具体 schema は下流委譲。                                                                      |
| Error / failure responsibility                        | Requirements `CR-012`、Signing Flow §22、Interfaces Specification §10                                         | §6.4、§6.6、§7.6、§9       | 部分適合。`DR-004`。                                                                                |
| OPEN / design boundary                                | Architecture §17.1、対象本文 §11〜§13、ADR 0001                                                               | §11〜§13                   | exact detail の委譲は適切。ただし確定済み gate / Profile / concurrency を OPEN に戻してはならない。 |

責任主体の二重化は、Relay、SDK、Browser / Mobile Signer、wallet-core の大枠では確認されなかった。残る問題は、Signer-local context の不足（`DR-001`、`DR-003`、`DR-005`）と Account identity source の表現（`DR-002`）である。

## 12. Domain Checks

| 評価項目                                      | 判定    | 根拠 / finding                                                                                                                                                                             |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| システムコンテキストと目的・範囲              | Pass    | transport-independent な共通概念であり、Mobile が未実装であること、下位委譲範囲も明示されている。                                                                                          |
| dApp / SDK / Provider / Content Script の責務 | Pass    | request construction、correlation、transport / bridge に限定し、Signer authority を代替していない。                                                                                        |
| Browser / Mobile が Signer であること         | Pass    | trusted UI、caller / target validation、approval、authentication、orchestration を Browser / Mobile に置いている。                                                                         |
| Relay boundary                                | Pass    | opaque transport、structural validation、short-lived state に限定され、署名・意味解釈・approval authority を持たない。                                                                     |
| wallet-core boundary                          | Partial | Store、secret processing、key identity、raw signing の owner は明確だが、Account public identity の source-of-truth が `DR-002` のとおり曖昧。                                             |
| untrusted input / trusted authority           | Partial | Browser observed context と Mobile handoff は Signer 検証、Relay / node metadata は untrusted。Profile-local gate context の不足が `DR-001`、`DR-003`。                                    |
| Profile / Account binding                     | Fail    | Profile が public field ではなく Signer-local context として request〜result lifecycle に binding されず、Account authority も二重解釈可能（`DR-001`、`DR-002`）。                         |
| Chain / Network                               | Pass    | Symbol / NEM、Mainnet / Testnet、payload / Account / Profile の照合と Relay / node 非authority が明確。                                                                                    |
| SigningRequest model                          | Partial | request identity、caller、session、operation、Account、Chain / Network、target、freshness はあるが Profile-local context と concurrent isolation が不足（`DR-001`、`DR-005`）。            |
| SigningResponse / result                      | Partial | wallet-core result の直接転送禁止、target / Account / Chain / Network / correlation 検証はあるが、Profile / caller / concurrent recipient binding が不足（`DR-001`、`DR-005`）。           |
| 共通署名 gate                                 | Fail    | 4条件の肯定形 invariant と capability の非代替性が不足（`DR-003`）。                                                                                                                       |
| Operation model                               | Pass    | transaction、message、cosignature を共通の意味と chain-specific detail に分離し、aggregate / multisig の具体化を委譲している。                                                             |
| Aggregate / multisig / cosignature            | Pass    | target、parent、embedded / inner、signer identity、result correspondence を概念上扱い、byte / schema は Chain Compatibility / Specification へ委譲。                                       |
| Message signing                               | Pass    | caller、Account、Chain / Network、operation、purpose / domain / nonce、freshness、result context を概念上扱い、具体 serialization は委譲。                                                 |
| Correlation                                   | Partial | request identity は transport、Relay session、SDK instance 単独に依存しないが、Profile / concurrent recipient binding の不足が `DR-001`、`DR-005`。                                        |
| `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`         | Pass    | result outcome と delivery disposition を区別し、delivery failure / unknown を再署名の根拠にしない。                                                                                       |
| Error / failure boundary                      | Partial | rejection / signing failure / unknown は区別されるが、cancelled、expired、authentication、locked、authorization、replay / duplicate、wallet-core、transport の意味分離が不足（`DR-004`）。 |
| Replay / freshness / duplicate                | Pass    | freshness、expiry、nonce / generation、duplicate / replay、fail-closed と自動再署名禁止が定義されている。                                                                                  |
| Permission / capability                       | Fail    | permission、session、UNLOCKED を approval / authentication の代替にしないが、4条件の全成立と capability の非authority が肯定形で不足（`DR-003`）。                                         |
| Concurrent requests                           | Fail    | 複数 tab / frame / Mobile handoff の request、approval、authentication、result、recipient の独立性がない（`DR-005`）。                                                                     |
| Lifecycle / invalidation                      | Partial | lifecycle loss、context change、old authorization の再利用禁止はあるが、Profile-local context と concurrent request の失効範囲が不足（`DR-001`、`DR-005`）。                               |
| Sensitive data                                | Pass    | private key、mnemonic、decrypted Store、password-derived secret を request / response / error / diagnostic へ出さない。                                                                    |
| Automatic fallback                            | Pass    | unknown、version / capability mismatch、security failure 後の別 operation / raw signing / 別 transport fallback を禁止している。                                                           |
| Traceability                                  | Partial | 関連資料、委譲先、責任表はある。上位の4条件・Profile・concurrency の全 lifecycle binding が不足するため追跡は条件付き（`DR-001`、`DR-003`、`DR-005`）。                                    |
| OPEN 項目                                     | Pass    | API / wire / platform / binding / chain-specific detail は未決でよい。確定済みの trust boundary を OPEN に戻す記述は、今回の4条件等とは分離して修正対象とする。                            |
| Design フェーズ境界                           | Pass    | JSON schema、exact error code、crypto、byte、UI、DB / Redis schema への逆流を finding にしていない。                                                                                       |

## 13. Validation Results

- Prettier / Markdown format: `pnpm exec prettier --write docs/reviews/design/interfaces-review-003.md` と `pnpm exec prettier --check docs/reviews/design/interfaces-review-003.md` — `PASS`。
- Git whitespace: `git diff --check` および staged artifact に対する `git diff --cached --check` — `PASS`。
- Markdown link: review artifact 内の相対リンク 38件を存在確認 — `PASS`。
- Finding ID duplicate: `DR-001`〜`DR-005` と過去 `IF-001`〜`IF-003` の重複および finding heading の重複なし — `PASS`。
- Review section order: 17章が指定順序で存在 — `PASS`。
- Review Gate / finding status consistency: `REVISE DESIGN`、Critical 3件 / Major 2件 / Minor 0件、Required Changes、gate failure の対応を確認 — `PASS`。
- Changed files: `git status --short` と staged diff で review artifact 1件だけを確認 — `PASS`。
- Source lint / typecheck / test / build: Source code を変更しないため実行しない。`Not validated` とする。

## 14. Review Gates

| Gate                                         | 判定 | 根拠                                                                                                                                                      | 対応 ID                      |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1. Purpose / scope                           | Pass | 共通概念、Mobile 未実装、下位委譲、Design phase boundary が明確。                                                                                         | —                            |
| 2. Context / responsibility / trust boundary | Fail | Signer-local Profile context と4条件 gate の成立責任が全 lifecycle で不足。                                                                               | `DR-001`、`DR-003`           |
| 3. Dependency direction                      | Pass | SDK / Relay / dApp / Provider は Signer / wallet-core の authority を逆流させず、wallet-core も Application approval を担わない。                         | —                            |
| 4. Major flows / failure / concurrency       | Fail | 複数 request の独立性、Profile-bound result、各 gate context の流れが共通 model に不足。                                                                  | `DR-001`、`DR-003`、`DR-005` |
| 5. Data ownership                            | Fail | Application Profile / Account、wallet-core Software Key identity、Signer-local approval context の所有境界が一意でない。                                  | `DR-001`、`DR-002`           |
| 6. Security / interoperability               | Fail | 4条件 gate と Profile / Account context の必須 binding が不足する。Chain / Network、Relay、Symbol / NEM の大枠は適合。                                    | `DR-001`、`DR-003`           |
| 7. Upstream consistency                      | Fail | `CR-016`、Architecture §6.9、Security Design、Signing Flow が要求する4条件・Profile-bound authorization・concurrency invariant を完全に引き継いでいない。 | `DR-001`、`DR-003`、`DR-005` |
| 8. Downstream implementability               | Fail | 下位実装が Profile context、4条件 gate、concurrent isolation、Account source-of-truth を推測して実装する余地がある。                                      | `DR-001`〜`DR-005`           |

Gate 不合格は `Critical` の `DR-001`、`DR-003`、`DR-005` に対応付けている。`DR-002` と `DR-004` は現在範囲の有意な Major correction だが、単独で gate failure の根拠にはしていない。

## 15. Remaining Risks and Open Decisions

- `DR-001`、`DR-003`、`DR-005` が解消されるまで、同じ public request / response shape を採用しても Profile、gate、concurrent context の authority を実装者が推測する残存リスクがある。
- `DR-002` が解消されるまで、Application Account の公開 projection と wallet-core Software Key identity の対応に関する実装解釈が分岐し得る。
- `DR-004` が解消されるまで、SDK / Provider / Relay adapter の failure mapping が安全な再試行・再署名禁止を弱める可能性がある。
- `interfaces.md` の既存 OPEN は、SDK transport / caller の具体 API、Mobile receiving / OS / lifecycle、Relay query / redelivery、wallet-core integration、Symbol / NEM supported scope の後工程判断として維持できる。ただし上位で確定した trust boundary、4条件、Profile binding、concurrent isolation を OPEN のままにしてはならない。
- Signing Flow review 004 は確認済みであり、同 review の `READY` は本レビューへ継承していない。共通 interface の対象本文が上位で強化された Signing Flow の条件を反映しているかを独立に判定した。

## 16. Automatic Changes

なし。`docs/design/interfaces.md`、その他の設計本文、仕様、source code、test、設定は変更していない。今回作成する変更は本 review artifact のみである。

## 17. Final Decision

`REVISE DESIGN`

`DR-001`、`DR-003`、`DR-005` の Critical findings により、共通 interface が Profile-local context、4条件の共通署名 gate、concurrent request isolation を推測なしに引き渡せる状態ではない。`DR-002` と `DR-004` もあわせて修正し、再レビューで全 Review Gate の合格を確認するまで Interfaces Design を `READY` と判断できない。
