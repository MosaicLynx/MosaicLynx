# Architecture Design Review 003

## 1. Review Target

- 対象: [`docs/design/architecture.md`](../../design/architecture.md)
- Review ID: `architecture-review-003`
- 実施日: 2026-08-27
- 種別: `design-review` Skill 復元後の独立した Architecture 全体再レビュー
- 変更範囲: レビュー成果物のみ。Source、要件、Architecture、ADR、個別 Design、仕様、実装、テストは変更していない。

本レビューでは、Concept / Requirements から Architecture への追跡、システム責務と trust boundary、主要フロー、秘密情報 lifecycle、chain / network 境界、Relay / SDK / wallet-core 境界、Mainnet release gate、個別 Design への委譲、Architecture と Specification / Implementation のフェーズ境界を確認した。過去レビューの READY 判定は今回の判定根拠にせず、AR-001 / AR-002 の再発確認にのみ使用した。

## 2. Execution Audit

`design-review` Skill の指定に従い、次の 4 つの独立した観点を、サブエージェントを使わず本レビュー内で分離して実施した。

| Path                          | 確認内容                                                                               | 結果                                      |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| A: structure / responsibility | Context、責務、依存方向、個別 Design への委譲                                          | `DR-002` を除き、主要な責務境界は成立     |
| B: security / trust boundary  | Signer TB、外部 untrusted context、secret、auth、unlock、authorization、fail-closed    | `DR-001` を検出                           |
| C: flow / operations          | transaction / message、approval、lifecycle、restart、stale、duplicate、retry、結果対応 | `DR-001` を検出。その他の高位フローは成立 |
| D: traceability / downstream  | Concept / Requirements、ADR、下流 Design への高位追跡とフェーズ境界                    | `DR-002` を検出                           |

サブエージェント、並列レビュー担当、外部レビュー結果は使用していない。下流 Design / 実装は、用語、責任境界、traceability、明白な矛盾の確認に限定し、API、schema、具体 state machine、暗号方式、実装構造を Architecture の不足として評価していない。

## 3. Evidence Used

| 資料                                                                                                                                                                                                         | 使用目的                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                            | 背景、対象利用者、提供価値、v1 範囲、成功条件、責任境界の上位追跡                                                                     |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)                                                                                                                                    | 共通機能・非機能・security・acceptance・open item の正本確認。特に CR-010、CR-011、CR-013、CR-015、CR-016、CR-NFR-013、CR-AC-017〜019 |
| [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                          | Browser Extension の page / Provider / Content Script / privileged context、permission、lifecycle、Mainnet gate                       |
| [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)                                                                                                                                        | Mobile host / OS / wallet-core、auth / lock / lifecycle、handoff、backup の責任境界                                                   |
| [`docs/requirements/relay.md`](../../requirements/relay.md)                                                                                                                                                  | Relay の opaque transport、非承認・非署名・非 semantic interpretation、retry / stale / duplicate                                      |
| [`docs/requirements/sdk.md`](../../requirements/sdk.md)                                                                                                                                                      | dApp-side SDK の責務、Signer 非該当、transport / correlation / failure、Signer の auth / authorization / unlock を迂回しない条件      |
| [`docs/design/architecture.md`](../../design/architecture.md)                                                                                                                                                | Review target。§1〜§18 の目的、Context、責務、TB、secret、主要 flow、open item、委譲を評価                                            |
| [`docs/adr/0001-wallet-core-binding.md`](../../adr/0001-wallet-core-binding.md)                                                                                                                              | wallet-core Binding の固定判断と host / core 境界の確認                                                                               |
| `_snwc` の Binding / runtime 関連資料                                                                                                                                                                        | WASM / native Binding と runtime isolation を混同していないことの確認                                                                 |
| [`docs/design/security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、Browser / Mobile / Relay / SDK Design | 下流で使用される用語、責務、Architecture との明白な矛盾、委譲先の確認に限定して使用                                                   |
| `docs/reviews/design/architecture-review-001.md`、`architecture-review-002.md`                                                                                                                               | AR-001 / AR-002 の修正内容と再発有無の確認。過去の READY は今回の判定に継承していない                                                 |

## 4. Review Result

**Review Gate: `REVISE DESIGN`**

Architecture は、dApp / SDK / Browser Extension / Mobile / Relay / wallet-core の大枠、Signer trust boundary、secret を通常の公開経路から分離する方針、Relay の opaque handoff、SDK の dApp-side 境界、Symbol / NEM および Mainnet / Testnet の分離、Binding と runtime isolation の区別を概ね正しく定義している。

一方、共通 Requirements が明示する「user authentication condition、signer の signing-capable unlock、対象 Profile / Chain / Network / Account の signing authorization、explicit approval」の 4 条件を、Browser と Mobile に共通する Signer の必須 gate として責任主体・主要フローへ一貫して配置していない。この欠落は、署名可否を決める trust / security boundary の Architecture-level 欠落であるため、`REVISE DESIGN` とする。

## 5. Summary

- `DR-001`（Critical）: CR-016 の 4 つの署名前提条件のうち、authentication、signing-capable unlock、Account authorization を共通 Signer の責務・フローへ明示的に割り当てていない。Mobile の個別記述に auth / lock はあるが、共通の署名 gate と Browser / Mobile 双方の owner にはなっていない。
- `DR-002`（Major）: Architecture-level の責任・制約・open item を、個別 Design ごとの authoritative owner へ渡す traceability 表がない。大枠の実装可能性はあるが、cross-cutting な security / signing flow / interfaces と各 platform / Relay / SDK の重複責務を Architecture だけから一意に確認できない。
- AR-001（Binding method の固定）と AR-002（Binding と runtime isolation の区別）は再発していない。
- Relay は非署名・非承認・非 semantic interpretation の handoff 基盤、SDK は Signer ではない dApp-side integration layer として整理されており、これらの責任逆流は見つからなかった。
- Mainnet release gate は、`release-evidence` 境界と fail-closed 方針を Architecture に置き、詳細な build / evidence 運用を下流へ委譲している。現時点で Architecture-level の責任逆流は見つからなかった。

## 6. Finding Status

| ID       | Severity | Status | 判定                                           |
| -------- | -------- | ------ | ---------------------------------------------- |
| `DR-001` | Critical | New    | 未対応。Review Gate を阻害する                 |
| `DR-002` | Major    | New    | 未対応。高位の委譲・追跡性を改善する必要がある |

## 7. Required Changes

### DR-001 — 共通 Signer の認証・unlock・Account authorization gate が Architecture に未配置

- **Target**: `docs/design/architecture.md` §6.3、§6.6、§10、§12（特に L131-L142、L166-L170、L294-L305、L319-L325）
- **Facts / conditions**: Browser Extension の責務には permission、context、chain / network / account、semantic inspection、explicit approval、raw payload correspondence は記載されているが、user authentication condition、signing-capable unlock、対象 Profile / Chain / Network / Account の signing authorization が必須条件として列挙されていない。共通 domain も Permission / approval policy までである。主要フローも Permission / Account の確認と explicit approval は含むが、4 条件を揃える gate がない。Mobile には auth / lock の記述があるものの、共通 Signer contract として Browser / Mobile の両方へ適用される位置づけがない。
- **Evidence**: `docs/requirements/requirements.md` の CR-010、CR-011、CR-015、CR-016、CR-AC-017。CR-016 は、署名・結果返却に必要な条件として authentication、signing-capable unlock、Profile / Chain / Network / Account authorization、explicit approval の全てを要求し、dApp / SDK / Relay による確立・更新・迂回を禁止している。`architecture.md` §10 は最初の 3 条件を明示的な共通 gate として表現していない。
- **Problem**: 下流実装が「Permission と explicit approval が通れば core を呼べる」と解釈し、wallet-core の password / Store 処理だけを user authentication や Application-level unlock / Account authorization の代替として扱う余地が残る。これにより Browser と Mobile の Signer が異なる署名可否を持ち、stale unlock / authorization を含む未認証・未承認署名を Architecture-level に排除できない。
- **Impact**: Signer trust boundary の必須条件が欠落し、CR-016 の security requirement、CR-AC-017 の受け入れ条件、fail-closed の判定対象を共通 flow から検証できない。外部 untrusted context がそれらを作成・更新・迂回できないという責務も、SDK / Relay / dApp に対して共通に固定されない。
- **Minimum correction**: Architecture の共通 Signer 責務と主要 flow に、4 条件が全て成立した場合に限り approval 済み raw payload を core へ渡し、いずれかが absent / locked / unknown / stale / 不整合なら署名も成功結果も返さない gate を追加する。Browser の privileged host と Mobile App の trusted host を、user authentication、signing-capable unlock、Profile / Chain / Network / Account authorization、approval の owner として明示する。wallet-core の password / Store / secret processing と Application-level の auth・unlock・Account signing authorization を別責務として記述し、SDK / Relay / dApp が gate を設定・更新・迂回できないことを明記する。認証方式、API、error code、具体 state machine は下流へ委譲する。
- **Reconfirmation**: CR-016 / CR-AC-017 が Architecture の共通 Signer gate と Browser / Mobile の両方の責務へ一意に追跡でき、署名前再確認・lifecycle invalidation・結果返却条件にも同じ 4 条件が適用されること。

### DR-002 — 個別 Design への Architecture-level responsibility / traceability が一意でない

- **Target**: `docs/design/architecture.md` §17〜§18（L367-L403）、および §6〜§16 の横断責務。
- **Facts / conditions**: §18 は上位資料、ADR、wallet-core 関連資料を列挙しているが、security-design、signing-flow、interfaces、Browser Extension、Mobile App、Relay、SDK などの個別 Design を、どの責務・不変条件・open item の authoritative owner とするかを表にしていない。§17 の open item 列挙も、Architecture-level の handoff 対象を全て下流 Design へ一意に割り当てる形式ではない。
- **Evidence**: `docs/requirements/requirements.md` の CR-011、CR-013、CR-015、CR-016、CR-OPEN-001、CR-OPEN-002、および Browser / Mobile / Relay / SDK Requirements の各 handoff。`architecture.md` §7 は package / app の依存方向を示し、§18 は関連資料を示すが、Design 成果物単位の responsibility matrix にはなっていない。
- **Problem**: 共通 security / signing flow / interface と、Browser / Mobile / Relay / SDK の各 Design が、どの invariant を所有し、どの open item を解消するかを Architecture だけから機械的に確認できない。個別 Design が READY でも、同じ横断条件を別々に解釈した場合に差分を検出する authoritative な handoff が残らない。
- **Impact**: 上位 Requirements の traceability と Design phase の完了条件を確認する際、責任の重複・未割当・仕様への逆流を見落としやすい。特に `DR-001` のような共通署名 gate、stale / lifecycle、Mainnet capability、Relay opaque 性の維持を platform 別に分岐させるリスクがある。
- **Minimum correction**: Architecture に、Architecture responsibility / invariant / open item、authoritative downstream Design または Specification、owner、下流へ委譲する境界を示す高位の traceability 表を追加する。少なくとも security-design、signing-flow、interfaces、Browser Extension、Mobile App、Relay、SDK、chain / Profile / wallet-core、release-evidence の責務を対象にし、下流だけで扱う API / schema / crypto parameter / concrete state machine は詳細化しない。
- **Reconfirmation**: Architecture-level の各責務・不変条件・open item に一つの authoritative な委譲先があり、下流資料が API や暗号詳細を発明せず、Architecture の責務境界を再定義していないこと。

## 8. Optional Improvements

なし。Minor 相当の改善は、`DR-002` の traceability 表に含めるべき高位品質改善として扱う。

## 9. Resolved Findings

| 過去 ID  | 状態     | 今回の確認                                                                                                                                                                                                                                                                                                    |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AR-001` | Resolved | §6.8 / §15 / §17 で v1 Binding method を WASM `wasm-bindgen`、native C ABI と固定し、host integration、OS、RN、temp lifecycle、error mapping、migration を未決事項として分離している。Binding method を open のまま扱う再発はない。                                                                           |
| `AR-002` | Resolved | §8 / §15 で Binding は API / data ownership boundary であり、runtime / process / hardware の secret isolation ではないと明記している。WASM の JS runtime 同居、host input / output lifecycle、Browser page / Content Script からの分離も区別されている。Binding と runtime isolation の混同は再発していない。 |

## 10. Deferred Findings

次の事項は Architecture が明示的に下流へ委譲しており、今回の Architecture finding にはしていない。

- Provider API、wire format、schema、version、correlation、timeout、具体 error、concrete state machine。
- Symbol / NEM の transaction type、aggregate、message format、hash / signature bytes、chain-specific parser と verification の詳細。
- KDF、AEAD、salt、nonce、memory clearing、Binding method の API 詳細、host integration、OS secure storage、Mobile runtime の具体方式。
- Relay の HTTP / Redis、TTL、session / generation record、rate limit、認証形式、サイズ制限の詳細。
- Browser / Mobile の UI layout、auth method、PIN / biometric / OS session、backup / migration の具体方式。
- Mainnet release evidence の収集・署名・trusted key・build embedding・runtime capability の運用詳細。

これらは対応する Specification / Implementation / release 資料で扱う。ただし `DR-001` の 4 条件と `DR-002` の委譲先を定める高位責務は Architecture に残す必要がある。

## 11. Scope and Traceability

| Architecture 領域                                         | 上位要求との対応                                                                                                               | 判定                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| §1〜§3 purpose / scope / principles                       | Concept の対象・価値・v1 境界、common Requirements の CR-001〜CR-016、CR-NFR-001〜CR-NFR-013                                   | 概ね追跡可能。CR-016 の共通 gate 配置は `DR-001`                                                      |
| §4〜§7 Context / components / dependency                  | CR-011、CR-013、CR-015、Browser / Mobile / Relay / SDK Requirements                                                            | dApp、SDK、Extension、Mobile、Relay、core の大枠は追跡可能                                            |
| §8〜§9 Trust boundary / secrets                           | CR-008〜CR-010、CR-NFR-001〜CR-NFR-004、CR-NFR-013、BR-006、MR-003 / MR-007、RR-003 / RR-008、SDK security requirements        | Signer TB と secret 非露出は追跡可能。auth / unlock / Account authorization の共通 gate は `DR-001`   |
| §10〜§12 major flow / Browser / Mobile / Relay boundary   | CR-001〜CR-012、CR-016、CR-AC-001〜CR-AC-018、BR-002〜BR-009、MR-002〜MR-006、RR-001〜RR-009、SDK flow / security requirements | approval、integrity、stale、retry、result correspondence は追跡可能。署名前 4 条件の一体化は `DR-001` |
| §13〜§16 chain / offline / external dependency / security | CR-005、CR-006、CR-NFR-005 / CR-NFR-006、Chain Compatibility、ADR-0001、release requirements                                   | Symbol / NEM、Mainnet / Testnet、local signing、Mainnet gate の高位境界は追跡可能                     |
| §17〜§18 open / related materials                         | CR-OPEN-001 / 002、platform / Relay / SDK open items、各 Design / Specification                                                | 資料列挙はあるが、authoritative downstream owner の一意な表が不足し `DR-002`                          |

## 12. Domain Checks

| Check                                                  | 判定                        | 根拠                                                                                                                                                                     |
| ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose / scope                                        | Pass                        | Browser Extension、Mobile、Relay、SDK、wallet-core の v1 境界と out-of-scope が明確                                                                                      |
| dApp / SDK                                             | Pass                        | SDK は dApp-side integration layer であり、secret、semantic approval、signing、Relay server を持たない                                                                   |
| Browser contexts                                       | Pass                        | page / Provider / Content Script を untrusted とし、privileged Extension context が caller、permission、integrity、approval、result を扱う                               |
| Mobile host / OS / core                                | Pass                        | Mobile App が Profile / Account、UI、auth / lock、lifecycle、OS integration、orchestration を担い、core は key / Store / secret crypto / raw sign を担う                 |
| Signer authorization gate                              | Fail                        | `DR-001`: 共通 Architecture flow に authentication、signing-capable unlock、Account authorization、approval の全条件が配置されていない                                   |
| Binding / runtime isolation                            | Pass                        | `AR-002` の修正が維持され、Binding を security isolation として過大評価していない                                                                                        |
| Secret lifecycle / raw signing                         | Pass                        | core を key / Store / secret crypto / raw signing source とし、host は必要時の boundary、page / SDK / Relay には secret を出さない                                       |
| Transaction / message                                  | Pass                        | 共通 request / approval / result flow と chain-specific inspection / display / bytes の責任分離がある                                                                    |
| Symbol / NEM、Mainnet / Testnet                        | Pass                        | chain-specific Account / Key Identity と network context を分離し、cross-chain implicit key sharing を禁止                                                               |
| Relay                                                  | Pass                        | opaque handoff、構造検証、TTL / generation / duplicate / stale の安全方針はある。semantic interpretation、approval、auth、signing は持たない                             |
| Lifecycle / fail-closed                                | Pass with DR-001 dependency | restart、tab / document change、stale、duplicate、unknown result、fallback の安全方針はある。auth / unlock / authorization も同じ invalidation gate に統合する必要がある |
| Mainnet release gate                                   | Pass                        | `packages/release-evidence` を capability / evidence boundary とし、evidence 不足時は Mainnet capability を有効化しない。詳細運用は release 資料へ委譲                   |
| Responsibility / downstream traceability               | Needs correction            | `DR-002`: 大枠は実装可能だが、個別 Design の authoritative owner と invariant の対応表がない                                                                             |
| Architecture / Specification / Implementation boundary | Pass                        | API、schema、crypto parameter、具体 state machine、実装構造は下流へ委譲し、Architecture は境界と責務に留めている                                                         |

## 13. Validation Results

対象ファイルだけを formatter / format check の対象として検証した。Source の formatter、lint、typecheck、test、build は実施対象外であり、Source 変更もない。

- `pnpm exec prettier --write docs/reviews/design/architecture-review-003.md` — PASS
- `pnpm exec prettier --check docs/reviews/design/architecture-review-003.md` — PASS
- `git diff --check -- docs/reviews/design/architecture-review-003.md` — PASS
- `Not validated`: `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。レビューのみで Source を変更していないため対象外。

## 14. Review Gates

| Gate                                                   | 判定               | 根拠                                                                                                                           |
| ------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1. Purpose / scope                                     | Pass               | v1、対象 app / package、out-of-scope が明確                                                                                    |
| 2. Context / responsibility / trust boundary / secrets | Fail — `DR-001`    | Signer の認証・unlock・Account authorization の共通 owner / gate が不十分                                                      |
| 3. Dependency direction                                | Pass               | page / SDK / Relay / chain adapter / app / core の依存方向が定義されている                                                     |
| 4. Major flows and failure                             | Fail — `DR-001`    | approval 前後の integrity / stale / duplicate はあるが、4 条件を揃える署名前 gate がない                                       |
| 5. Data ownership / retention / destruction            | Pass               | secret、opaque Store、E2E secret、Relay retention、host / core lifecycle の高位境界がある                                      |
| 6. Security / interoperability                         | Fail — `DR-001`    | external context の迂回禁止はあるが、認証・unlock・Account authorization を共通署名条件として閉じていない                      |
| 7. Upstream consistency                                | Fail — `DR-001`    | CR-016 / CR-AC-017 の必須条件を Architecture flow へ完全には写像できない                                                       |
| 8. Downstream implementability                         | Pass with `DR-002` | 高位責務は実装可能。個別 Design の authoritative handoff 表は追加必須だが、詳細 API 等を Architecture に逆流させる問題ではない |

## 15. Remaining Risks and Open Decisions

- `DR-001` が未修正の間は、Browser と Mobile の Signer が同じ署名可否条件を持つことを Architecture から保証できない。
- `DR-002` が未修正の間は、cross-cutting な security / signing flow / interfaces と platform / Relay / SDK の責任・不変条件の追跡をレビューごとに資料横断で再構成する必要がある。
- wallet-core の host integration、OS protection、temporary secret lifecycle、error mapping、migration、Mobile host の具体方式は引き続き open であり、詳細を Architecture で決めるべきではない。
- Symbol / NEM の具体 supported transaction、message、aggregate、bytes、parser、verification は下流 Specification の責任である。
- Mainnet capability の release evidence / policy / build / runtime enforcement は、Architecture の高位 gate を維持したまま release 資料と実装レビューで確認する。
- この判定は Architecture のものに限る。Security、Signing Flow、Interfaces、Browser Extension、Mobile App、Relay、SDK の復元後レビューが残っており、Design フェーズ全体は閉じない。

## 16. Automatic Changes

なし。今回作成するレビュー成果物以外の自動変更、Source の修正、既存レビューの上書きは行っていない。

## 17. Final Decision

**`REVISE DESIGN`**

`DR-001` は Signer trust boundary と共通署名可否条件に関わる Critical finding であり、下流 Design だけへの委譲では解消できない。Architecture に共通 gate と Browser / Mobile の owner を追加し、`DR-002` の高位 traceability 表を追加した後、Architecture review を再実施すること。

AR-001 / AR-002 の再発はない。Trust Boundary、Security、責任分界について、Relay が Signer になる、SDK が Signer になる、wallet-core が approval を担う、Binding が runtime isolation になる、といった重大な逆流は確認していない。ただし `DR-001` のため、現時点で「重大問題なし」とは判定しない。
