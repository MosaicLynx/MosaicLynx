# MosaicLynx Signing Flow Design Review 003

## 1. Review Target

- 対象: [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- Review ID: `signing-flow-review-003`
- 確認日: 2026-08-27
- Review Result: `REVISE DESIGN`
- 変更範囲: 本レビュー成果物のみ。対象設計、要件、仕様、ADR、実装および過去レビューは変更していない。
- レビュー目的: 過去の Review Gate を継承せず、現在の Signing Flow 基本設計全体を `design-review` Skill の観点で独立評価する。
- 主な確認範囲: Signer の責任境界、共通4条件、要求 ingress、lifecycle、request / approval / authentication / signing / result binding、semantic inspection、trusted UI、TOCTOU、wallet-core、SDK、Relay、replay、duplicate、concurrent request、cancellation、expiry、failure semantics、message signing、Aggregate / cosignature、fail-closed、security invariant、traceability および OPEN 項目。
- Design フェーズ境界: API、wire schema、DTO、exact state enum、exact timeout / retry、DB / Redis schema、暗号パラメータ、byte serialization、OS API、実装クラスおよび UI layout の不足は finding としていない。
- 未確認範囲: ソースコードの実装適合性、実行時の cryptographic correctness、Mobile 未実装部分の実装品質および下位仕様の具体契約。これらは本レビューの Design Gate の判断材料として、責任境界・用語・flow invariant・lifecycle・traceability・明白な矛盾の確認に限って参照した。

## 2. Execution Audit

最新の `design-review` Skill、共通 review playbook、reviewers、review gates、output format、`.agents/project-context.md` および `AGENTS.md` を確認した。サブエージェントは使用せず、playbook の Reviewer A〜D を独立した走査として実施した。過去の `READY` は今回の判定へ継承していない。

| Reviewer                      | 独立した確認観点                                                                                                                                   | 結果                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: structure / responsibility | Signer、Application、wallet-core、SDK、Relay、Browser、Mobile、Chain integration の責務、依存方向、Profile / Account のデータ所有                  | Signer / SDK / Relay / wallet-core の大枠は成立。ただし共通ゲートと Profile binding の本文反映に不足（`DR-SF-001`、`DR-SF-002`）。                       |
| B: security / trust boundary  | Authentication、signing-capable unlock、Account authorization、explicit approval、trusted UI、semantic inspection、TOCTOU、secret、fail-closed     | inspection、approval、raw signing boundary は成立。4条件の独立成立条件と Profile context の binding が不足（`DR-SF-001`、`DR-SF-002`）。                 |
| C: flow / operations          | lifecycle、再起動・background・state loss、result unknown、expiry、replay、duplicate、concurrent request、cancel、fallback、結果返却               | 主要 lifecycle と再署名禁止は成立。結果返却時のゲート、同時要求分離、security failure 後の自動 fallback 禁止が不足（`DR-SF-003`〜`DR-SF-005`）。         |
| D: traceability / downstream  | Requirements、Architecture、Security Design、Interfaces、Browser / Mobile / Relay / SDK、Specification、wallet-core、ADR、OPEN の owner と委譲境界 | 下流への委譲は概ね明確。ただし `SDK-OPEN-007` の caller / Origin binding の記述が、上位で固定済みの Signer authority と区別されていない（`DR-SF-006`）。 |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 使用目的                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)                                                                                                                                                                                                                                                                                                                                                   | 変更範囲、Source of Truth、検証、文書・レビュー成果物およびプロジェクト固有の境界を確認                                                          |
| [`design-review SKILL.md`](../../../.agents/skills/design-review/SKILL.md)、[review playbook](../../../.agents/skills/review-common/review-playbook.md)、[reviewers](../../../.agents/skills/design-review/reviewers.md)、[review gates](../../../.agents/skills/design-review/review-gates.md)、[output format](../../../.agents/skills/design-review/output-format.md)、[common output format](../../../.agents/skills/review-common/output-format.md) | 今回の独立走査、finding の重大度、Gate、status および成果物構成を確定                                                                            |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                                                                                                                                                        | Signer、Relay、認証、unlock、Account authorization、明示承認および安全側の上流方針を確認                                                         |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)                                                                                                                                                                                                                                                                                                                                                                                | `CR-010`、`CR-011`、`CR-015`、`CR-016`、`CR-AC-017`〜`CR-AC-019`、wallet-core / SDK / Relay 境界を確認                                           |
| [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                                                                                                                                                                                      | Browser observed caller、Profile / Account / Chain / Network、permission、trusted UI、lifecycle、再認証および結果対応を確認                      |
| [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)                                                                                                                                                                                                                                                                                                                                                                                    | Mobile trusted host、lock / authentication、handoff、Profile / Account、OS lifecycle、concurrent request および failure recovery を確認          |
| [`docs/requirements/relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                                                                                                                                                              | Relay の opaque delivery、structural validation、stale / duplicate / state loss および Signer 非担当範囲を確認                                   |
| [`docs/requirements/sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                                                                                                                                                                                                                                  | SDK の非特権境界、correlation、transport fallback 禁止、結果対応および公開範囲の OPEN を確認                                                     |
| [`docs/design/architecture.md`](../../design/architecture.md)                                                                                                                                                                                                                                                                                                                                                                                            | Signer owner、wallet-core boundary、§6.9 の共通4条件、主要 signing flow、result gate および traceability owner を確認                            |
| [`docs/design/security-design.md`](../../design/security-design.md)                                                                                                                                                                                                                                                                                                                                                                                      | Trust Boundary、Lock / Authentication、Signing Authorization、Profile / Account binding、replay / concurrent isolation および fail-closed を確認 |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                                                                                                                                                                                | request / response の概念 binding、Signer authority、Profile の内部境界、result validation および下流委譲を確認                                  |
| [`docs/design/browser-extension.md`](../../design/browser-extension.md)                                                                                                                                                                                                                                                                                                                                                                                  | Browser privileged layer、observed caller、Profile / Account、approval、lifecycle および複数 request の境界を確認                                |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                                                                                                                                                                | Mobile trusted host、Profile / Account、authentication、concurrent request、lifecycle loss および fail-closed を確認                             |
| [`docs/design/relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                                                                                                                                                                          | Relay の opaque boundary、delivery failure、state loss、stale / duplicate および再承認境界を確認                                                 |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                                                                                                                                                              | SDK の transport / correlation、Signer 非代替、fallback、retry、result unknown および OPEN の境界を確認                                          |
| [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)                                                                                                                                                                                                                                                                                                                                                                    | 下流の用語、binding、lifecycle、result unknown、message、cosignature および Profile 変更時の失効を確認                                           |
| [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                                                                                                                                                                                            | Browser / Mobile / Relay handoff、transport selection、fallback 禁止、同時 request および retry の意味を確認                                     |
| [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)                                                                                                                                                                                                                                                                                                                                                                                | 公開 request / response の概念範囲、Profile を公開 envelope に含めない境界、capability と approval の非同一性を確認                              |
| [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)                                                                                                                                                                                                                                                                                                                                                            | Profile 固定 Network、Chain-specific Account identity、`profileId`、every-signature authentication および unlock 分離を確認                      |
| [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)                                                                                                                                                                                                                                                                                                                                                    | Symbol / NEM、Mainnet / Testnet、chain-specific inspection、署名対象と lower owner の境界を確認                                                  |
| [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)                                                                                                                                                                                                                                                                                                                                                                      | Mainnet capability / release evidence の既存境界と、署名フローからの責任逆流がないことを確認                                                     |
| [`wallet-core requirements`](../../../_snwc/docs/requirements/requirements.md)、[`wallet-core specification`](../../../_snwc/docs/specifications/specification.md)、[`Binding decision`](../../../_snwc/docs/decisions/binding-implementation.md)                                                                                                                                                                                                        | wallet-core の Store、password、secret processing、raw signing、Binding の固定範囲と Application-level responsibility 非担当を確認               |
| [`architecture-review-004.md`](./architecture-review-004.md)、[`security-design-review-004.md`](./security-design-review-004.md)                                                                                                                                                                                                                                                                                                                         | 上位 Design の現行内容と READY 判定の対象範囲を確認。ただし今回の Review Gate は継承していない                                                   |
| [`signing-flow-review-001.md`](./signing-flow-review-001.md)、[`signing-flow-review-002.md`](./signing-flow-review-002.md)                                                                                                                                                                                                                                                                                                                               | 過去 `SDR-001`〜`SDR-004` の finding と解消状態を再発確認のためだけに確認                                                                        |

## 4. Review Result

**Review Gate: `REVISE DESIGN`**

現在の本文は、Browser Extension privileged layer / Mobile App trusted host が Signer であり、dApp / SDK / Provider / Content Script / Relay / wallet-core が Signer ではないこと、Signer 自身による semantic inspection、trusted UI、explicit approval、署名前再検証、wallet-core の raw signing、Relay の opaque 性、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の分離および過去 finding の修正を概ね維持している。

しかし、上位 Architecture / Requirements で確定している Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件が、Signing Flow の `Authorization` 定義、`AUTHORIZED` 遷移、署名前再検証および成功結果返却の必須条件として揃っていない。また、Profile が request / approval / authentication / signing / result の binding から抜けている。さらに、同時要求の request isolation と security failure 後の自動 transport fallback 禁止が本文の共通 invariant として明示されず、結果返却時の共通ゲート適用も確認できない。

このため、現在の `signing-flow.md` を独立して READY と判定することはできない。

## 5. Summary

- Signer の大枠の責任分界は適切である。Browser Extension の privileged layer と Mobile App が最終判断主体であり、SDK / Provider / Content Script / dApp / Relay は最終判断を代替せず、wallet-core は Store・秘密情報処理・raw signing に限定されている。
- Request ingress、caller / permission / session、Chain / Network / Account、freshness、semantic inspection、trusted UI、target binding、署名前再検証、Relay state loss、duplicate / replay、cancel、message、Aggregate / cosignature、NEM の chain-specific 境界は高位設計として概ね成立している。
- `SDR-001`〜`SDR-004` は再発していない。permission / capability context、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、一回限りの signing operation、cosignature の全体 inspection は現行本文へ反映されている。
- `DR-SF-001` は、4条件を列挙している上位設計と、署名フロー本文が実際に成立させる条件との不一致である。`UNLOCKED` が代替でないという否定だけでは、signing-capable unlock と Account authorization を必須条件として成立させたことにならない。
- `DR-SF-002` は、公開 request に Profile を追加すべきという wire 要求ではない。Signer 内部の Profile / Account association を authorization、approval、再検証、結果対応および Profile switch の失効条件に含めるべきという責任・binding の不足である。
- `DR-SF-003`〜`DR-SF-005` は、結果返却、同時要求、transport fallback が共通 signing gate の安全な運用条件として下位実装へ一意に伝わらない問題である。
- `DR-SF-006` は、`SDK-OPEN-007` の open scope が Signer の verified caller authority まで未決に見えることによる traceability / responsibility ambiguity である。

## 6. Finding Status

| ID          | Severity | Status | 初出レビュー | 今回の状態根拠                                                                                                                                                      |
| ----------- | -------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-SF-001` | Critical | New    | 今回         | 上位で確定した4条件が、`Authorization` と `AUTHORIZED → SIGNING` の成立条件に独立して現れていない。                                                                 |
| `DR-SF-002` | Critical | New    | 今回         | Profile が request / approval / authentication / signing / result binding と context-change invalidation に明示されていない。                                       |
| `DR-SF-003` | Major    | New    | 今回         | 成功結果の validation は target / identity / correlation 中心で、共通署名ゲートとその signing context の結果返却条件を明示していない。                              |
| `DR-SF-004` | Major    | New    | 今回         | 同時に存在する Browser の複数 tab / frame および Mobile の複数 handoff request を独立状態として扱う高位 invariant がない。                                          |
| `DR-SF-005` | Major    | New    | 今回         | security failure、user rejection、locked、caller / integrity / replay failure 後の自動 alternate transport / provider fallback 禁止が共通 Flow に固定されていない。 |
| `DR-SF-006` | Major    | New    | 今回         | `SDK-OPEN-007` の caller / Origin binding が、固定済みの Signer observed-context authority と SDK の公開伝播詳細に分離されていない。                                |

Finding ID の新規採番は `DR-SF-*` とし、過去の `SDR-*` および他対象の `DR-*` と衝突しない target-scoped 名を使用した。

## 7. Required Changes

### DR-SF-001: 共通署名ゲートの4条件が署名成立条件として統合されていない

- Severity: `Critical`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§3` line 71、`§7` lines 153–175、`§9` lines 240–247、`§16` lines 426–435、`§17` lines 439–455

#### Facts / conditions

`Authorization` は「利用者の明示的な承認」と「署名ごとの認証」だけで定義されている（line 71）。`AUTHORIZED` state と `AWAITING_USER → AUTHORIZED` の条件も同じ2要素であり（lines 156、173）、Transaction flow の Authentication も署名ごとの認証だけを記述している（line 245）。署名前再検証は target、context、permission、Account、Chain / Network、operation、capability および authentication を確認するが、signing-capable unlock と Account authorization を独立した必須条件としていない（lines 426–435）。

本文は `UNLOCKED`、permission、session、直前の認証が承認・認証の代替でないと述べている（line 83、245）。これは代替禁止の否定であって、署名可能 unlock と Account authorization が全4条件の一つとして成立していることの確認ではない。Wallet Core の password / Store 処理だけでは Application-level の4条件を代替しないという明示もない。

#### Evidence

- [`architecture.md`](../../design/architecture.md) §6.9 lines 212–221 は、Browser privileged layer と Mobile trusted host が Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件を全て対象 request / target / Profile / Account / Chain / Network に対して成立させる owner であり、署名前再確認と結果返却にも適用すると固定している。
- [`requirements.md`](../../requirements/requirements.md) `CR-016` lines 260–271 は、4条件が全て成立した場合だけ秘密情報を使用し署名結果を返せること、いずれかが未成立なら署名も結果返却もしないことを MUST としている。
- [`security-design.md`](../../design/security-design.md) §7.1 lines 156–162 および §8 lines 181–185 は、lock / unlock と署名ごとの認証を分離し、trusted UI と approval を必須としている。
- [`profile-account-spec.md`](../../specifications/profile-account-spec.md) §20 lines 484–494 は `UNLOCKED` と signing authentication を分離し、every-signature authentication を定めている。

#### Problem

Signing Flow の下流実装は、明示承認と署名ごとの認証、現在の permission / capability、または wallet-core の password / Store 成功を満たせば `AUTHORIZED` / `SIGNING` に進めると解釈できる。Signer が4条件を成立させる唯一の owner であり、SDK / Relay / dApp が条件を作成・変更・免除できず、wallet-core が Application authentication / signing-capable unlock / Account authorization / UI approval を代替しないという共通ゲートが、Flow の成立条件に固定されていない。

#### Impact

Authentication、signing-capable unlock、対象 Profile / Chain / Network / Account に対する authorization のいずれかがない状態で署名へ到達し得る。これは connection / permission、`UNLOCKED`、wallet-core password / Store validation または下流 transport が署名可否を実質的に成立させる余地を残し、共通署名ゲートと fail-closed invariant に反する。

#### Minimum correction

署名フロー基本設計に、4条件を独立した必須条件として追加し、Browser privileged layer と Mobile trusted host がその成立を管理することを明示する。`AWAITING_USER → AUTHORIZED`、`AUTHORIZED → SIGNING` の直前再確認および成功結果返却に、Authentication、Signing-capable unlock、Profile / Chain / Network に対する Account authorization、Explicit user approval を全て適用する。connection / permission、単なる `UNLOCKED`、既存 session / 認証、wallet-core password / Store 成功および Relay delivery success を代替にしないこと、dApp / SDK / Relay が成立・更新・免除できないことも固定する。具体 API、state enum、認証方式、unlock 実装は下位へ委譲する。

#### Reconfirmation criteria

本文の `Authorization` 定義、主要 flow、`AUTHORIZED` 遷移、署名前再検証、結果成功条件および fail-closed invariant を確認し、4条件が全て同じ Signer-owned binding に現れることを確認する。いずれかが未成立、locked、unknown、stale、revoked または mismatch の場合に signing と success result の双方を拒否し、wallet-core が4条件を代替しないことを確認する。

### DR-SF-002: Profile が request / authorization / result binding から欠落している

- Severity: `Critical`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§3` lines 66、79、90–106、`§7` lines 153–164、`§15` lines 399–405、`§16` lines 412–433、`§19` line 506、`§20` lines 514–536、`§23` lines 580–605

#### Facts / conditions

Signing request の論理組は caller、session、operation、Account、Chain、Network および target であり、Profile を含まない（line 66）。Authorization tuple、approval record、`VALIDATED` / `AUTHORIZED` の意味、Confirmation model の invalidation、署名前再検証および security invariant も Profile を列挙していない（lines 79、106、153–164、399–405、415–433、582）。Transaction flow の line 241 にある `Profile Network` は Network の関係を述べるだけで、Profile identity / Profile-bound Account association を binding していない。成功結果と Mobile の再検証も Profile を明示していない（lines 506、514–536）。

公開 interface で Profile を外部 field として公開しないこと自体は下流設計と矛盾しない。しかし、Signer 内部で Profile と Account / Wallet Core context を関連付け、Profile switch を未完了 authorization の失効条件にする責務が本文から確認できない。

#### Evidence

- [`architecture.md`](../../design/architecture.md) §6.9 lines 212–221 は共通署名ゲートの対象に Profile を含め、§6.6 lines 170–174、§13 line 356、§17.1 line 413 は Application が Profile / Account association と Account authorization を所有するとしている。
- [`security-design.md`](../../design/security-design.md) §6.1 lines 135–146、§9 lines 214–220、§10.2 lines 230–238 は Profile、Account、Chain / Network、caller、permission および session の binding と切替時の状態失効を要求している。
- [`browser-extension.md`](../../design/browser-extension.md) §5.4 lines 124–128 および §8.1 lines 231–241 は permission を Profile、Account、Chain、Network に結び付け、Profile 変更時に未完了 authorization を失効させる。
- [`profile-account-spec.md`](../../specifications/profile-account-spec.md) lines 225–242 は `ChainAccount.profileId` と Profile 固定 Network を Account / Key Identity の関係として定めている。

#### Problem

同じ caller、session、permission、Account、Chain / Network に見える複数の Application Profile を、Signer の authorization context として区別する条件がない。`Account` に内部的な Profile 解決があるとしても、それが immutable Profile binding であり、approval、authentication、署名前再検証、result および Profile switch に適用されることは本文から導けない。

#### Impact

Profile A で得た Account authorization、approval、authentication または result が、同じ Network の Profile B、別の Wallet Core Store または別の Profile-scoped permission context に誤って適用される余地がある。Profile change が line 399 の invalidation 対象から漏れるため、選択した Account の公開 identity が一致していても、署名主体と承認主体の対応が切れる可能性がある。

#### Minimum correction

Profile を Signer 内部の request / approval / authentication / signing / result binding と context-change invalidation の必須文脈として明示する。公開 SigningRequest、SDK API または Relay envelope に Profile ID を追加する必要はない。公開 field を持たない場合は、Account の Signer-local resolution が Profile、Profile Network、Chain-specific Account / Key Identity を一意かつ不変に決めることを明示し、Profile switch、Profile lock、Profile association change が既存 authorization を失効させる条件に含まれることを固定する。

#### Reconfirmation criteria

request model、Authorization tuple、confirmation invalidation、`AUTHORIZED → SIGNING` 前再検証、Browser / Mobile ingress、result validation および security invariant に Profile context が明示されることを確認する。Profile を公開 wire field とすることなく、Profile A / B の切替や Profile-scoped Account / Store の mismatch が必ず fail-closed になることを確認する。

### DR-SF-003: 成功結果返却時の共通署名ゲートと signing context の再確認が不足している

- Severity: `Major`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§7` lines 158、175、`§20` lines 514–544

#### Facts / conditions

`SIGNING → SUCCEEDED` は Wallet Core の成功結果と、signature / target / signer / Account / Chain / Network / request 対応の検証だけを条件としている（line 175）。成功結果の validation も target 対応、signer、Account、Chain、Network、operation、aggregate / message context および correlation を確認するが（lines 528–536）、Authentication、signing-capable unlock、Account authorization、Explicit approval、Profile または signing 時点の共通 gate context を条件としていない。

本文は検証不能または `RESULT_UNKNOWN` なら success を返さないとする一方、署名時の共通 gate context が result return 時に継続して帰属可能か、context loss / revoke / lock 後に確定済み result を success として返せるかを定めていない。

#### Evidence

- [`architecture.md`](../../design/architecture.md) §6.9 line 219 は共通4条件を結果返却にも適用し、§10 lines 320–323 は署名時に成立した共通ゲートの文脈を Signer が結果とともに確認できない場合、success result を返さないとしている。
- [`interfaces.md`](../../design/interfaces.md) §6.4 lines 196–217 は success を承認済み target、Account、Chain / Network、operation、correlation との対応が検証できた状態に限定し、Signer が wallet-core return をそのまま転送しないとしている。
- [`security-design.md`](../../design/security-design.md) §15.1 lines 328–339 は authentication、Account、caller、permission、session、target 対応および wallet-core / result validation が確認できない場合に success としない。

#### Problem

下流実装が cryptographic result と target の対応だけを確認し、署名を開始した時点の authorization / approval / authentication / unlock / Profile context を安全に帰属できないまま success response を返す余地がある。`RESULT_UNKNOWN` と delivery disposition の分離はできているが、gate context を満たさない既知 result の返却意味が未定義である。

#### Impact

revoke、lock、Profile / Account switch、session loss または authorization context change の後に、元 caller へ署名成功を通知することで、署名成功と利用者が許可した条件の対応を誤って表現する可能性がある。response correlation 自体が正しくても、共通署名 gate の保証が失われる。

#### Minimum correction

成功 result の条件に、元 request の signer / Profile / Account / Chain / Network / operation / target との対応だけでなく、署名時に成立した4条件と approval context を Signer が安全に帰属・検証できることを追加する。結果返却時に gate context が失われ、revoked、locked、unknown または mismatch なら success とせず安全側の結果にすることを明示する。既知 result の保管・再配送、具体的な error / delivery state は下位仕様へ委譲する。

#### Reconfirmation criteria

`SIGNING → SUCCEEDED`、`Result validation`、`Response` および `DELIVERY_UNKNOWN` の関係を再確認し、target correspondence と共通4条件の signing context attribution の双方が success の前提になっていることを確認する。context を確認できない場合に success response または自動再署名へ進まないことを確認する。

### DR-SF-004: Concurrent request の独立性が共通 Signing Flow に固定されていない

- Severity: `Major`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§4` lines 82–86、`§16` lines 422–435、`§18` lines 459–479、`§19` lines 481–508、`§21` lines 546–554

#### Facts / conditions

本文は同じ permission / session でも別 target、Account、Chain、Network、caller、capability へ Authorization を流用しないこと、同じ request identity の duplicate で追加署名しないことを定めている（lines 422、548）。しかし、複数の request が同時に存在する場合に、request、source context、Profile / Account、approval、authentication、target、result channel を独立させること、複数 request を approval / batch として統合しないこと、Browser の複数 tab / frame と Mobile の複数 Relay / Deep Link を分離することは明示されていない。

`1 request = 1 confirmation = 1 authentication = 1 signing operation` は一回の対応を定めるが、同時に存在する複数 request の UI / auth / result isolation や foreground approval の対象を定めるものではない。

#### Evidence

- [`security-design.md`](../../design/security-design.md) §10.2 lines 228–238 は request ごとの独立状態、confirmation UI の request 単位表示、承認・認証・署名結果の流用禁止、Browser 複数 tab と Mobile 複数 handoff の分離を MUST としている。
- [`mobile-app.md`](../../design/mobile-app.md) §21 lines 541–551 は各 request の Profile / Account、target、inspection、response channel、foreground approval の単位、Deep Link / Relay の非統合および Account / Network / Profile 切替時の active approval invalidation を定めている。
- [`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) §5.3 line 178 は同一 SDK instance の concurrent request を許容しつつ、request ID / Relay session ごとの独立性を要求している。

#### Problem

Signer ごとの下位実装が同時 request を queue、single foreground UI、parallel UI または別方式で扱う際、request substitution、approval confusion、Account substitution、response misdelivery を防ぐ共通の最低条件が本文から一意に導けない。重複拒否と cross-target authorization reuse 禁止だけでは、まだ承認中の A と B を誤って表示・認証・返却する問題を閉じられない。

#### Impact

Browser の複数 tab / frame、または Mobile の複数 handoff が同時に存在するとき、request A の caller / Account / target に対する user approval / authentication が request B に適用される、あるいは result が別 request channel へ返る余地がある。これは explicit approval と request binding の実効性を損なう。

#### Minimum correction

各 active request が request identity、caller / source、session、Profile / Account、Chain / Network、operation、target、inspection、approval、authentication および result channel を独立して持つこと、同時 request を暗黙に統合・batch 化しないことを共通 invariant に追加する。Browser の複数 tab / frame、Mobile の複数 Relay / Deep Link、Account / Network / Profile 切替時の approval invalidation を含める。queue、排他、fairness、UI 通知、上限などの具体 algorithm は下位へ委譲する。

#### Reconfirmation criteria

同時 request の各 request が独立 identity / state / approval / authentication / result binding を持ち、UI の確認対象と response channel が混線しないことを確認する。1 request の approval / auth / result を別 request に流用せず、追加 request を同一 approve 操作へ暗黙にまとめないことを確認する。

### DR-SF-005: security failure 後の自動 transport / Provider fallback 禁止が不足している

- Severity: `Major`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§2.3` lines 45–47、`§21` lines 548–554、`§22` lines 560–574

#### Facts / conditions

SDK を Signer としないこと、unsupported の場合に fallback を行わないことは定められている（lines 47、564）。また、user rejection、inspection failure、authentication failure、Relay state loss および transport timeout の再試行は古い identity、session、ciphertext、Authorization、target および承認を再利用しない新しい request とされている（line 551）。しかし、user rejection、locked、permission / authorization failure、caller / integrity / replay failure、result unknown または security failure の後に、同じ要求を別 transport / Provider へ自動 fallback することを共通 Flow として禁止していない。新しい request が自動生成され得るか、user activation と新しい承認を必須とするかも本文では固定されていない。

#### Evidence

- [`architecture.md`](../../design/architecture.md) §5.5 line 109 は user rejection、integrity / caller / replay failure および result unknown の後の別 transport への自動 fallback を禁止している。
- [`requirements/sdk.md`](../../requirements/sdk.md) line 185、§11 lines 413–425 は user rejection、mismatch / integrity / caller / replay failure、result unknown および transport failure を自動 retry / fallback で迂回しないことを確定している。
- [`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md) §6 lines 226–234 は transport 選択後の切替禁止、locked / validation failure / timeout 後の自動 fallback 禁止、新しい user activation と request / approval を要求している。

#### Problem

Signing Flow は transport retry と signing retry の分離を述べるが、security decision が拒否・失敗・不明となった後の自動 alternate route を禁止する共通 security boundary を持たない。下位 SDK が「新しい request」として別 Provider / Relay / local route を自動選択すれば、元の rejection、caller mismatch、locked または replay failure が利用者の新しい意図なしに別経路へ持ち越され得る。

#### Impact

署名拒否・認証失敗・caller / integrity mismatch・replay・result unknown を可用性向上のために迂回でき、Signer ごとの route 差によって同じ要求の安全条件が変わる。user approval、authentication および request freshness の境界が transport fallback によって弱体化する。

#### Minimum correction

Signing Flow の共通原則に、user rejection、locked、authentication / Account authorization / permission failure、caller / integrity / replay failure、inspection failure、result unknown および security-relevant mismatch の後に自動 alternate transport / Provider fallback を行わないことを追加する。利用者が明示的に再試行を開始する場合だけ、fresh request、fresh validation、fresh approval、fresh authentication の新しい境界で扱うことを固定し、選択順序や API は下位へ委譲する。

#### Reconfirmation criteria

Signing Flow、SDK boundary、Retry / Failure semantics に同じ禁止条件があり、上位 Architecture / SDK Requirements / handoff specification の fallback policy と一致することを確認する。reject / locked / mismatch / replay / result unknown から自動的に別 Signer・別 transport・別 Provider で署名へ進まないことを確認する。

### DR-SF-006: `SDK-OPEN-007` が Signer の caller authority まで未決に見える

- Severity: `Major`
- Status: `New`
- Target: [`signing-flow.md`](../../design/signing-flow.md) `§2.3` lines 45–47、`§5` lines 90–106、`§9` line 240、`§18` lines 468–479、`§26` lines 619–630

#### Facts / conditions

本文は Signer が caller / Origin を検証し、SDK / Provider / dApp の自己申告を最終根拠にしないことを固定している（lines 29、84、96、240、477）。一方、OPEN では `SDK-OPEN-007` の一部として「caller / Origin binding」を、transport、version、公開 API と同列の未決事項として記載している（line 623）。この表現には、SDK が caller context をどう伝播するかという下流詳細と、Signer が Browser observed context / Mobile verified handoff を最終 authority とすることの区別がない。

#### Evidence

- [`architecture.md`](../../design/architecture.md) §6.9 lines 221、§10 lines 317–323 は、caller validation の最終責任が Browser privileged layer / Mobile trusted host にあり、SDK / dApp / Relay が共通ゲートを成立・更新・免除できないことを固定している。
- [`requirements/requirements.md`](../../requirements/requirements.md) `CR-011` lines 213–218 および `CR-015` lines 252–258 は SDK / dApp / Relay の非 Signer 性と、Signer の caller verification / authorization / unlock を迂回しないことを確定している。
- [`requirements/sdk.md`](../../requirements/sdk.md) line 185 と `docs/design/sdk.md` §11 lines 368–378 は、SDK の caller binding / correlation の具体契約を未決にしつつ、Signer の最終 caller verification を代替しない境界を維持している。

#### Problem

下流設計者が `SDK-OPEN-007` を「caller / Origin の verified 性そのものが未決」と解釈でき、SDK が提供する caller string や別 transport metadata を Signer の観測事実と同等に扱う余地が残る。これはすでに上位で確定した trust anchor と、公開 API / context propagation の未決範囲を混同させる。

#### Impact

Provider、Content Script、SDK、Relay または Mobile handoff metadata が caller authority になり、caller mismatch / Origin confusion を検出すべき Signer の trust boundary が実装ごとに揺れる可能性がある。OPEN が security invariant を弱める根拠として誤用され得る。

#### Minimum correction

OPEN の記述を、SDK が caller / Origin context を要求・伝播・correlate する公開契約、version policy および transport-specific detail に限定する。Signer が Browser observed context または Mobile が検証した handoff context を最終 authority とし、外部自己申告値を trusted caller としないこと、またこの責任境界は OPEN ではないことを明示する。

#### Reconfirmation criteria

`SDK-OPEN-007` の scope と `§2`、`§9`、Browser / Mobile flow の authority が一貫し、下流 API / wire 未決を残したままでも caller / Origin verification owner が一意に読めることを確認する。

## 8. Optional Improvements

なし。Minor 相当の表現改善は、Critical / Major finding の最小修正と混同しないため追加していない。

## 9. Resolved Findings

過去の `signing-flow-review-001.md` / `signing-flow-review-002.md` に記録された finding は、今回の判定を READY とする根拠にはせず、再発確認だけを行った。

| 過去 ID   | 過去 Severity | 今回の状態 | 再発確認                                                                                                                                                                    |
| --------- | ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SDR-001` | Medium        | `Resolved` | permission scope / revision と protocol / capability context は現行の Authorization tuple、approval record、署名前再検証および失効条件に反映されており、再発なし。          |
| `SDR-002` | Medium        | `Resolved` | `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` が lifecycle / delivery disposition / retry で分離され、確定済み result の再署名が禁止されており、再発なし。                         |
| `SDR-003` | Medium        | `Resolved` | logical signing target に対する Authorization の一回限りの消費と、内部 API call / verification / delivery / resend の非 signing operation 化が維持され、再発なし。          |
| `SDR-004` | Low           | `Resolved` | cosignature で parent 全体、security-relevant field、hash / parent binding および全体 inspection を要求し、hash-only / summary / external lookup を拒否しており、再発なし。 |

## 10. Deferred Findings

以下は本書が明示的に下位へ委譲しており、今回の Signing Flow Design finding ではない。上記の共通安全条件を弱めないことを前提に引き継ぐ。

- API 名、公開 operation、request / response schema、wire encoding、correlation field、具体 error code。
- exact state enum、queue / 排他 algorithm、timeout 値、retry count、result lookup / resend の具体契約。
- Browser message、Provider contract、Storage、Service Worker の具体実装、Mobile OS API、Deep Link / App Link、Binding host integration。
- Relay HTTP / Redis / TTL / generation / storage schema と、transport-specific authentication / credential 契約。
- Symbol / NEM の transaction type / version、Aggregate / multisig / cosignature の公開範囲、schema、serialization、hash / signature bytes。
- Message の具体 encoding、nonce format、domain separator、serialized message format。
- wallet-core の Rust / Binding API、KDF / AEAD / key derivation、Store format、secret byte lifecycle、error mapping および migration。
- Platform confirmation model の acceptance criteria、Sensitive UI の具体表示、Profile 全体 backup / restore の platform 提供範囲。

## 11. Scope and Traceability

| 主要責務 / 不変条件                                                                      | 上流根拠                                                                                 | `signing-flow.md` の対応                     | 評価                                                                                                                            |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Signer が Browser privileged layer / Mobile trusted host であること                      | Concept、`CR-011`、Architecture §6.3–§6.4                                                | `§2.1` lines 27–37、`§18`、`§19`             | 適合。dApp、SDK、Provider、Content Script、Relay、wallet-core を Signer としていない。                                          |
| Authentication、signing-capable unlock、Account authorization、explicit approval の4条件 | `CR-016`、Architecture §6.9、Security Design §7–§8                                       | `§3`、`§7`、`§9`、`§16`、`§17`               | 不適合。`DR-SF-001`。承認・署名ごとの認証はあるが、4条件の独立 gate がない。                                                    |
| Profile / Account / Chain / Network の binding                                           | Architecture §6.9 / §13 / §17.1、Security Design §9–§10、Profile / Account specification | `§3`、`§5`、`§9`、`§15`、`§16`、`§20`、`§23` | 不適合。`DR-SF-002`。Profile identity / Profile-bound Account が tuple と失効条件にない。                                       |
| Request ingress と observed caller authority                                             | Browser / Mobile requirements、Architecture §10、Interfaces §6.3                         | `§2`、`§5`、`§9`、`§18`、`§19`               | 概ね適合。Signer の最終検証は明確だが、OPEN の scope 表現に `DR-SF-006` がある。                                                |
| Semantic inspection、trusted UI、blind signing 禁止                                      | Requirements CR-002 / CR-004 / CR-007、Security Design §8、Chain Compatibility           | `§4`、`§10`–`§15`、`§23`                     | 適合。unknown / unsupported / parse / display failure は fail-closed。                                                          |
| Request / approval / authentication / target の TOCTOU binding                           | Architecture §10、Security Design §8 / §10、Interfaces §6.3–§6.4                         | `§4`、`§7`、`§15`、`§16`                     | 部分適合。target / permission / capability は強いが、Profile と4条件の結果帰属が不足（`DR-SF-001`、`DR-SF-002`、`DR-SF-003`）。 |
| Lifecycle、restart、background、state loss、stale、result unknown                        | Security Design §7 / §10 / §15、handoff specification                                    | `§7`、`§8`、`§21`                            | 概ね適合。old Authorization の再利用と signing retry は禁止されている。                                                         |
| Concurrent request isolation                                                             | Security Design §10.2、Mobile Design §21、handoff specification                          | `§4`、`§16`、`§18`、`§19`、`§21`             | 不適合。`DR-SF-004`。重複・流用禁止だけでは同時 request の混線を閉じない。                                                      |
| Result validation / response safety                                                      | Architecture §6.9 / §10、Interfaces §6.4、Security Design §15                            | `§7.4`、`§20`、`§21`                         | 不適合。target / correlation はあるが、成功返却時の common gate context がない（`DR-SF-003`）。                                 |
| SDK / Relay / wallet-core boundary                                                       | Architecture §6.5 / §6.8–§6.9、SDK / Relay requirements、wallet-core contract            | `§2`、`§17`、`§19`、`§25`                    | 責任分界は適合。SDK fallback の共通禁止と OPEN scope の明確化に不足（`DR-SF-005`、`DR-SF-006`）。                               |
| Symbol / NEM、transaction / message、Aggregate / cosignature                             | Chain Compatibility、signing protocol、Requirements                                      | `§6`、`§10`–§14、`§24`                       | 適合。chain-specific semantics を共通 model で上書きしていない。共通 gate / Profile binding の修正後に再確認する。              |

Authoritative owner は、最終署名判断・4条件・approval・result safety を Signer、Profile / Account association と Account authorization を Application / host、semantic inspection を chain integration と Signer、raw signing / secret processing を wallet-core、request construction / correlation / transport を SDK、opaque delivery を Relay とする。現在の本文はこれらの大枠を示すが、`DR-SF-001`〜`DR-SF-003` により共通 gate の owner と Profile context の binding が signing lifecycle の全段階で一意に追跡できない。

## 12. Domain Checks

| 確認項目                                       | 判定    | 根拠 / finding                                                                                                                                                                                                                                                                               |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Signer boundary                             | Pass    | Browser Extension privileged layer / Mobile App を Signer とし、SDK、dApp、Provider、Content Script、Relay、wallet-core を最終判断主体としていない。4条件の不足は `DR-SF-001`。                                                                                                              |
| 2. Common signing gate                         | Fail    | Authentication、signing-capable unlock、Account authorization、explicit approval の4条件が全て必須として本文に統合されていない（`DR-SF-001`）。                                                                                                                                              |
| 3. Request ingress                             | Partial | caller / Origin、session、permission、request identity、freshness、Chain、Network、Account、operation は確認対象。ただし Profile が欠落し、OPEN scope に authority ambiguity がある（`DR-SF-002`、`DR-SF-006`）。                                                                            |
| 4. Lifecycle                                   | Partial | received / validation / inspection / user interaction / approval / signing / result / terminal failure の意味、reload / restart / background / Relay state loss、old authorization invalidation は概ね明確。gate context の失効と同時 request isolation は不足（`DR-SF-001`、`DR-SF-004`）。 |
| 5. Request / Approval / Authentication binding | Fail    | target、caller、session、permission、capability、Account、Chain、Network は強く binding されるが、Profile と4条件の独立 state がない（`DR-SF-001`、`DR-SF-002`）。                                                                                                                           |
| 6. Semantic inspection                         | Pass    | unknown type、unsupported version、parse / validation / display failure、unsupported operation、Chain / Network mismatch を blind signing に変換しない。                                                                                                                                     |
| 7. Trusted UI / explicit approval              | Pass    | Signer が target から confirmation model を生成し、外部 description / HTML / Markdown / Relay metadata を最終根拠にせず、explicit approval と target binding を要求する。                                                                                                                    |
| 8. TOCTOU / pre-sign revalidation              | Partial | payload、caller、session、permission revision、Account、Chain / Network、operation、target、capability を署名前に再確認する。Profile、signing-capable unlock、Account authorization が不足（`DR-SF-001`、`DR-SF-002`）。                                                                     |
| 9. wallet-core boundary                        | Pass    | Signer が caller / inspection / approval / target revalidation を担い、wallet-core へ approved raw target だけを渡す。MosaicLynx は private key operation、KDF、AEAD、raw algorithm を再実装していない。4条件の明示不足は別 finding。                                                        |
| 10. Result handling                            | Fail    | target / signer / Account / Chain / Network / operation / correlation の validation はあるが、結果返却時の common gate context と Profile attribution がない（`DR-SF-003`）。                                                                                                                |
| 11. SDK boundary                               | Partial | SDK は correlation / context / transport を担い、auth / unlock / approval / semantic inspection / signing を代替しない。security failure 後の automatic fallback 禁止が不足（`DR-SF-005`）。                                                                                                 |
| 12. Relay boundary                             | Pass    | Relay は opaque delivery / temporary state / structural validation に限定され、semantic interpretation、authorization、approval、signing を担わない。state loss / stale / duplicate は旧 approval を復元しない。                                                                             |
| 13. Replay / duplicate                         | Pass    | freshness、同一 identity の duplicate、内容差異、stale、used、result unknown、delivery unknown、再署名禁止が定義されている。                                                                                                                                                                 |
| 14. Concurrent requests                        | Fail    | cross-target authorization reuse は禁止されるが、Browser 複数 tab / frame、Mobile 複数 handoff の request / UI / auth / result isolation がない（`DR-SF-004`）。                                                                                                                             |
| 15. Cancellation / rejection                   | Pass    | reject / cancel / UI close / lifecycle interruption は signing success、retry、background signing、automatic fallback に変換されず、terminal / safe result として扱われる。Fallback の共通禁止は `DR-SF-005`。                                                                               |
| 16. Timeout / expiry                           | Partial | request freshness、message-level expiry、short-lived authorization、session separation、Relay generation / state loss は示される。具体値は不要だが、`DR-SF-001` と result context の不足が validity binding に影響する。                                                                     |
| 17. Failure semantics                          | Partial | invalid、unsupported、rejected、cancelled、expired、authentication failure、permission failure、signing failure、transport failure、result unknown を概念上区別する。locked / Account authorization failure / delivery disposition の共通 gate への明示は不足（`DR-SF-001`、`DR-SF-003`）。  |
| 18. Message signing                            | Pass    | caller / Origin、Account、Chain / Network、purpose、contents、freshness、nonce、domain、request expiry / message replay を分離し、transaction への unsafe fallback を禁止する。共通 gate / Profile は横断 finding の対象。                                                                   |
| 19. Aggregate / cosignature                    | Pass    | signer identity、parent / embedded context、expected role、approval、target、partial / aggregate lifecycle、full inspection および no blind signing を保持する。過去 `SDR-004` の再発なし。                                                                                                  |
| 20. Fail-closed                                | Partial | parse / validation / caller / permission / target / stale / replay / duplicate / Relay / wallet-core / result unknown に安全側処理がある。4条件、Profile、結果返却時の gate を追加すべき（`DR-SF-001`〜`DR-SF-003`）。                                                                       |
| 21. Security invariants                        | Fail    | target binding、one-time authorization、secret boundary、Relay 非信頼、old authorization 非再利用はあるが、共通4条件、Profile、concurrent isolation、fallback prohibition が一つの invariant 集合になっていない（`DR-SF-001`、`DR-SF-002`、`DR-SF-004`、`DR-SF-005`）。                      |
| 22. Traceability / authoritative owner         | Partial | 関連資料と下位委譲はある。上位の4条件・Profile binding・result gate の flow-level mapping、および `SDK-OPEN-007` の fixed / open scope の分離が不足（`DR-SF-001`、`DR-SF-002`、`DR-SF-003`、`DR-SF-006`）。                                                                                  |
| 23. OPEN / design boundary                     | Partial | API / wire / timeout / UI / crypto / chain schema を適切に OPEN / defer している。`SDK-OPEN-007` の caller authority は既に確定した責務を OPEN に戻さないよう修正が必要（`DR-SF-006`）。                                                                                                     |

## 13. Validation Results

次の検証を実行し、全て PASS となった。

- Markdown formatter / format check: `pnpm exec prettier --check docs/reviews/design/signing-flow-review-003.md` — PASS
- Markdown link check: 成果物内の相対 Markdown link 61件を read-only で確認 — PASS
- Diff whitespace: `git diff --check` および `git diff --cached --check` — PASS
- Finding ID duplicate: `DR-SF-*` の finding heading 6件を確認し、重複なし — PASS
- Review Gate / finding status consistency: `REVISE DESIGN`、Critical 2件 / Major 4件の New、Required Changes、全 Gate の対応を確認 — PASS
- Change scope: `git status --short` と `git diff --cached --name-only` を確認し、変更対象は `docs/reviews/design/signing-flow-review-003.md` のみ — PASS
- Source code validation: 実施しない。ソースコードを変更していないため、lint / typecheck / test / build は対象外。

## 14. Review Gates

| Gate                           | 判定 | 根拠                                                                                                                                             | 対応 ID                                            |
| ------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 1. Purpose / scope             | Pass | Signing Flow の目的、共通 Browser / Mobile scope、non-goal および Design フェーズ境界は明確。                                                    | なし                                               |
| 2. Context / responsibility    | Fail | Signer owner は明確だが、4条件の owner /成立条件と Profile-bound Account authorization が lifecycle に現れない。                                 | `DR-SF-001`、`DR-SF-002`                           |
| 3. Dependency / boundary       | Pass | SDK / Relay / wallet-core / Node / chain integration の依存方向と意味上の境界は概ね一意。                                                        | なし                                               |
| 4. Major flows                 | Fail | pre-sign gate、result gate、concurrent isolation、security failure 後の fallback 禁止が flow の必須条件として不足。                              | `DR-SF-001`、`DR-SF-003`、`DR-SF-004`、`DR-SF-005` |
| 5. Data ownership              | Fail | Profile / Account association が request / approval / result の Signer-local security context として所有・追跡されていない。                     | `DR-SF-002`                                        |
| 6. Security / interoperability | Fail | Architecture / Requirements の共通4条件、Profile / Network / Account binding、result safety および fallback invariant を完全には継承していない。 | `DR-SF-001`、`DR-SF-002`、`DR-SF-003`、`DR-SF-005` |
| 7. Upstream consistency        | Fail | 上位 READY Design の gate は4条件と Profile を要求するが、対象本文は approval / authentication と Account / Chain / Network に縮退している。     | `DR-SF-001`、`DR-SF-002`、`DR-SF-006`              |
| 8. Downstream implementability | Fail | 下流実装が gate、Profile context、result safety、concurrency、fallback の最低条件を複数解釈できる。                                              | `DR-SF-001`〜`DR-SF-006`                           |

Critical finding が残っているため、Design Gate は `READY` とできない。

## 15. Remaining Risks and Open Decisions

- `SDK-OPEN-002`、`003`、`004`、`006`、`007` の公開 operation、transaction construction、transport 選択、version policy、caller context の具体 API は未決でよい。ただし `SDK-OPEN-007` は `DR-SF-006` のとおり、Signer の verified caller authority を未決に戻さない形へ限定する必要がある。
- `MR-OPEN-002`、`003`、`005`、`006` の Mobile 受信経路、OS protection、Binding host integration、具体 lifecycle、backup / migration は未決でよい。共通4条件、Profile binding、concurrent isolation、fail-closed は OPEN を理由に弱められない。
- `CR-OPEN-001`、`CR-OPEN-002` の wallet-core Binding host integration、秘密 byte lifecycle、OS protection、error mapping、migration は未決でよい。wallet-core が Application authentication、signing-capable unlock、Account authorization、approval を担当することにはならない。
- Aggregate / Partial / cosignature / NEM の公開範囲、result lookup / resend、Platform confirmation model、message wire contract は下流へ委譲してよい。いずれも Profile / four-gate / no-blind-signing / no-auto-fallback の共通条件を維持する必要がある。
- `DR-SF-003` に関係して、署名生成後に current gate context が失われた場合の具体的な安全側 result / delivery 契約は未決でよい。ただし success として返してよい条件だけは基本設計で固定する必要がある。

## 16. Automatic Changes

なし。対象の `docs/design/signing-flow.md` は変更していない。レビュー成果物 `docs/reviews/design/signing-flow-review-003.md` のみを作成した。

## 17. Final Decision

**`REVISE DESIGN`**

新規 finding は Critical 2件、Major 4件、Minor 0件である。過去 `SDR-001`〜`SDR-004` の再発はないが、過去 READY は今回の根拠に継承していない。

共通署名ゲートの4条件、Profile を含む request / approval / authentication / signing / result binding、成功結果返却時のゲート context、同時要求分離、security failure 後の自動 transport fallback 禁止および `SDK-OPEN-007` の authority scope を本文へ反映した後に、Signing Flow 全体を再レビューする必要がある。
