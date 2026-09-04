# Architecture Design Review 005

## 1. Review Target

- 対象: [Architecture Design](../../design/architecture.md)
- 確認日: 2026-09-04
- 成果物: `docs/reviews/design/architecture-review-005.md`
- レビュー種別: 復元後の `design-review` Skill による初回レビュー相当の fresh full review
- 対象範囲: Architecture の目的・範囲、システム境界、主要コンポーネント、責務とデータ所有、依存方向・layering、privileged / unprivileged context、trust boundary、秘密情報・署名権限、主要な request / signing / handoff / result / failure flow、Browser Extension・Mobile App・SDK の platform 分離、Relay・外部 Node・wallet-core / Binding・chain integration の境界、Requirements traceability、関連 Design との整合、下流委譲の実装可能性。
- 補助範囲: Concept、完了済み Requirements、関連 Design、ADR、仕様、外部 `wallet-core` 契約および過去の Architecture review artifact を、整合性・回帰・continuity の確認に限って参照した。
- 未確認範囲: Architecture で下流へ委譲された API、schema、wire format、暗号パラメータ、具体的 error code、parser、UI / OS API、memory / zeroization、ABI の実装正しさ、Mobile 実装の存在・完成度。現在 workspace に Mobile App 実装がないことは Architecture の実装済み主張とは扱っていない。
- 過去の `READY` 判定は今回の gate の根拠として継承せず、本文全体を独立に再評価した。

## 2. Execution Audit

`AGENTS.md`、`.agents/project-context.md`、`design-review/SKILL.md` と同 Skill の reviewers / security checklist / review gates / output format、および review-common の playbook / output format を確認した。Phase Context の repository 登録はないため、project-context stub を正式根拠として使用していない。サブエージェントは使用せず、次の4つの独立 self-review pass を実施した。

| Pass            | 確認観点                                                                                                                                                                         | 結論                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A 相当 | 目的・範囲、context、component responsibility、data ownership、dependency direction、layering、責任の重複・空白                                                                  | 主要責務と依存方向は Architecture 本文で一意に読める。Browser / Mobile が Signer、SDK が非特権連携、Relay が opaque transport、wallet-core が秘密情報・raw signing の主体として分離されている。                                        |
| Reviewer B 相当 | protected asset、trust boundary、secret lifecycle、authentication / authorization、signing authority、fail-closed、attacker-controlled input、Binding 境界、chain / network 分離 | Web / SDK / Provider / content / Relay / Node を最終 authority とせず、Signer の privileged / trusted host に共通4条件と承認を置く構造が確認できる。wallet-core の Binding が runtime isolation ではないことも明示されている。         |
| Reviewer C 相当 | request / response、signing、permission、handoff、result、network、failure / cancellation / timeout、retry、restart、duplicate、result correspondence                            | §10 の10段階 flow と §11–§12 の platform / Relay failure boundary により、正常系と安全側の失敗責任が理解できる。具体的な API・状態遷移・retry 契約は適切に下流委譲されている。                                                         |
| Reviewer D 相当 | Concept / Requirements traceability、関連 Design の責任分界、ADR、下流 handoff、implementation handoff                                                                           | Common / Browser / Mobile / Relay / SDK Requirements と主要 Design の対応を確認した。Architecture で必要な判断は §17.1 の追跡表へ引き渡されている。後続仕様で解消済みの Message signing 契約に関する open 記述だけを `DR-003` とした。 |

各候補は、Architecture で決める責務・境界・lifecycle・invariant か、下流詳細かを反証した。下流詳細の不足を Architecture finding にはしていない。

## 3. Evidence Used

| 資料                                                                                                                                                                      | 確認目的                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [Architecture Design](../../design/architecture.md)                                                                                                                       | レビュー対象本文。特に §1–§3、§4–§6、§6.8–§6.9、§7–§17.1、§18 を確認。                                                                       |
| [Concept Sheet](../../concept/concept-sheet.md)                                                                                                                           | v1 の Signer、Relay、明示承認、秘密情報分離、chain / network 境界および対象外の追跡。                                                        |
| [Common Requirements](../../requirements/requirements.md)                                                                                                                 | CR-001〜CR-016、CR-NFR、CR-AC、共通4条件、fail-closed、wallet-core / Application 境界の追跡。                                                |
| [Browser Extension Requirements](../../requirements/browser-extension.md)                                                                                                 | Browser の caller / Origin、Permission、trusted UI、lifecycle、Mainnet gate、wallet-core 境界の追跡。                                        |
| [Mobile App Requirements](../../requirements/mobile-app.md)                                                                                                               | Mobile の handoff、認証、Profile / Account、OS lifecycle、Signer 責務および未実装範囲の追跡。                                                |
| [Relay Requirements](../../requirements/relay.md)                                                                                                                         | Relay の opaque transport、構造検証、短期状態、stale / duplicate / state loss、安全側処理の追跡。                                            |
| [SDK Requirements](../../requirements/sdk.md)                                                                                                                             | SDK の非 Signer 責務、transaction / message signing、correlation、failure、fallback、caller binding の追跡。                                 |
| [Security Design](../../design/security-design.md)                                                                                                                        | security architecture、secret lifecycle、four-condition gate、trust boundary、failure safety の責任分界。                                    |
| [Signing Flow Design](../../design/signing-flow.md)                                                                                                                       | signing lifecycle、target binding、pre-sign recheck、result unknown / delivery unknown、再起動・重複・再試行の委譲。                         |
| [Interfaces Design](../../design/interfaces.md)                                                                                                                           | 共通概念モデル、境界検証、Profile-local context、Application / wallet-core ownership の確認。                                                |
| [Browser Extension Design](../../design/browser-extension.md)                                                                                                             | Browser privileged layer、observed caller、trusted UI、permission、lifecycle、core adapter の platform 分離。                                |
| [Mobile App Design](../../design/mobile-app.md)                                                                                                                           | Mobile trusted host、handoff source、OS lifecycle、認証、承認、core orchestration の platform 分離。                                         |
| [Relay Design](../../design/relay.md)                                                                                                                                     | Relay の非署名・非意味解釈責務、session / generation / storage / delivery failure の境界。                                                   |
| [SDK Design](../../design/sdk.md)                                                                                                                                         | SDK の request construction / dispatch / correlation / transport abstraction と非特権境界。                                                  |
| [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md)                                                                             | 下流補助確認。transaction / message の scope、`signData`、`SignedData`、result mapping、Extension / Mobile Relay 共通 semantics の現行契約。 |
| [Chain Compatibility Specification](../../specifications/chain-compatibility-spec.md)                                                                                     | Symbol / NEM、Mainnet / Testnet、chain-specific bytes / inspection の下流委譲境界。                                                          |
| [Profile / Account Specification](../../specifications/profile-account-spec.md)                                                                                           | Application Profile / Account、authorization、backup / restore の ownership と v1 共通非包含。                                               |
| [Mainnet Evidence Lite ADR](../../adr/0001-mainnet-evidence-lite.md)                                                                                                      | Mainnet capability と release evidence の fail-closed 判断。                                                                                 |
| [`wallet-core` external specification](../../../_snwc/docs/specifications/specification.md) / [binding decision](../../../_snwc/docs/decisions/binding-implementation.md) | 鍵、Store、秘密情報、raw signing、固定 v1 Binding と host adapter の境界。                                                                   |
| [Architecture review 001](./architecture-review-001.md)、[002](./architecture-review-002.md)、[003](./architecture-review-003.md)、[004](./architecture-review-004.md)    | 過去 finding の continuity 確認のみ。過去の gate / 判定は今回の判定根拠に継承していない。                                                    |

## 4. Review Result

`READY`

Critical はなく、Architecture Gate を不合格にする根本欠陥は確認されなかった。Minor の `DR-003` は、後続仕様で確定済みの Message signing 契約に対する Architecture の未決事項記述の同期漏れであり、Skill の gate 規則上 `READY` を維持する。

## 5. Summary

Architecture は、Browser Extension と Mobile App を署名権限を持つ Signer、SDK を非特権の連携境界、Relay を opaque な短期 transport、wallet-core を鍵・秘密情報・raw signing の中核として定義している。責任の重複や空白は、Application の Profile / Account・Permission・承認、chain integration の意味検査、host の caller / lifecycle / approval、wallet-core の秘密処理を分ける記述により解消されている。

Trust Boundary は、Web page / Provider / content / SDK / Relay / 外部 Node を最終 authority とせず、Browser の privileged layer または Mobile の trusted host が caller、source、Permission、Chain / Network / Account、認証、signing-capable unlock、Account authorization、明示承認を成立させる構造である。Relay と Node は trusted signer と誤認されず、wallet-core も Application-level の承認を担わない。WASM Binding が実行時分離や秘密保護を自動的に意味しないこと、host lifecycle と core 内部の secret lifecycle を分けることも明示されている。

主要 flow は、要求受信、context / Permission 検証、chain-specific inspection、trusted UI 承認、署名前の共通4条件再検証、wallet-core 呼出し、result binding、dApp の独立検証という形で追跡できる。restart、stale、duplicate、timeout、handoff / delivery failure、result unknown では古い承認を再利用せず、安全側に終了する責任が Signer / Relay / SDK の境界ごとに定義されている。外部 Node は announce / state の責任を持つが、署名前の inspection や approval の authority ではない。

Browser、Mobile、SDK の共通性は request / permission / lifecycle / approval の意味と security invariant に限定され、caller context、OS / browser lifecycle、handoff、UI、storage、host integration は platform-specific に分離されている。Symbol / NEM と Mainnet / Testnet も implicit に共通化されていない。Requirements の Common、Browser、Mobile、Relay、SDK の要求は Architecture の該当節と §17.1 の下流追跡へ対応し、関連 Design 間の責任分界も整合している。

唯一の新規 finding は、Architecture §17 の Message signing 契約を「後続仕様で解消する」とする記述が、後続の正式 Web Transaction Handoff Specification の現行内容と同期していない点である。これは責務・trust boundary・signing authority を不成立にするものではなく、詳細 API / wire を Architecture に複製することも求めない。

## 6. Finding Status

| ID       | Severity      | Status   | 初出レビュー                                            | 今回の状態根拠                                                                                                                                                                 |
| -------- | ------------- | -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AR-001` | Legacy MEDIUM | Resolved | [architecture-review-001](./architecture-review-001.md) | §6.8、§15、§17、§17.1 で固定 v1 Binding と host integration の未決境界を分離している。                                                                                         |
| `AR-002` | Legacy MEDIUM | Resolved | [architecture-review-001](./architecture-review-001.md) | §6.8、§8、§9、§17.1 で Binding の logical / API 境界と runtime / process / hardware isolation の非同一性を明示している。                                                       |
| `DR-001` | Critical      | Resolved | [architecture-review-003](./architecture-review-003.md) | §6.9 と §10 step 6 に Authentication、signing-capable unlock、Account authorization、explicit approval の4条件と pre-sign recheck を明示している。                             |
| `DR-002` | Major         | Resolved | [architecture-review-003](./architecture-review-003.md) | §17.1 が責務・invariant・正本下流設計 / 仕様・責任主体・委譲境界を表で追跡している。                                                                                           |
| `DR-003` | Minor         | Open     | 本レビュー                                              | §17.1 の Message signing に関する未決記述が、現行の [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md) の確定内容と同期していない。 |

## 7. Required Changes

なし。`Critical` の New / Open / Reopened finding はない。

## 8. Optional Improvements

### DR-003 — Message signing の Architecture open item を現行仕様へ同期

- Severity: `Minor`
- Status: `Open`
- Location: `docs/design/architecture.md` §17、特に line 395 の Message signing 未決事項
- Problem: Architecture は message signing の具体的 format、公開 operation 名、結果・error・handoff 契約を「後続仕様で解消する」と記録している。しかし、後続の [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md) §2、§5.2、§5.2.1 は、v1 の `signData`、`SignedData`、operation 対応、Extension / Mobile Relay 共通の result mapping と failure semantics を既に定義している。
- Why it matters: Architecture の open decision と正式な下流 source of truth の状態がずれると、実装者が既に確定した契約を未決として扱ったり、別の契約を作ったりする traceability drift が生じる。これは security boundary の欠落ではなく、設計から下流への引継ぎ状態の正確性に関する問題である。
- Evidence: Architecture §17.1 は未決事項を正本となる下流設計 / 仕様へ引き継ぐ構造を定める。現行 handoff specification §1、§2.1–§2.3、§5.2、§5.2.1 は message signing を v1 scope とし、`signData` と signed result、両 transport の共通 semantics を明示する。
- Required correction: Architecture の抽象度を保ったまま、§17 の未決事項を現行 handoff specification と整合する状態へ更新し、必要なら §17.1 の追跡先に handoff specification を明示する。API、wire field、crypto detail を Architecture に複製したり、新しい capability を追加したりしないこと。
- Scope boundary: exact API、schema、wire、error、encoding、operation implementation の正しさは Web Transaction Handoff Specification / SDK・platform 下流レビューの範囲であり、本 finding はそれらの詳細を再レビューするものではない。
- Completion / reconfirmation: §17 の Message signing open item が、確定済み handoff 契約と残存する下流 open item を区別していること、および Architecture から参照すべき正本が一意であることを再確認する。

## 9. Resolved Findings

### AR-001 — Resolved

- Location: 旧レビュー指摘。現行確認箇所は Architecture §6.8、§15、§17、§17.1。
- Problem: 固定 v1 Binding の方式と、各 host における integration の未決事項が混在すると、Binding 方式を再選択する余地が残る。
- Evidence / resolution: 現行本文は Rust Core と WASM / Native の固定 Binding を明記し、変換・ownership・ID / DTO / error の adapter 責務を分けている。React Native、host integration、temporary lifecycle、OS protection、error mapping は未決の下流事項として残している。
- Reconfirmation: §6.8 と §17.1 が、固定方式そのものと host integration の未決境界を再定義していないことを確認した。

### AR-002 — Resolved

- Location: 旧レビュー指摘。現行確認箇所は Architecture §6.8、§8、§9、§17.1。
- Problem: wallet-core Binding の logical / API boundary と、WASM が提供しない runtime / process / hardware isolation の関係が曖昧だと、host の secret lifecycle を誤って保護済みと扱う可能性がある。
- Evidence / resolution: 現行本文は WASM が同一 JS context で動き Binding は runtime isolation ではないこと、JS input / linear memory / glue copy の自動消去を仮定しないこと、core temporary secret と host input / output / lifecycle を分けることを明記する。
- Reconfirmation: §8 の trust boundary、§9 の secret table、§6.8 の Binding 節が同じ logical / runtime 境界を示しており、再発はない。

### DR-001 — Resolved

- Location: 旧レビュー指摘。現行確認箇所は Architecture §6.9、§10 step 6–9、§16。
- Problem: signer が認証、signing-capable unlock、Account authorization、explicit approval の全条件を target request に結び付けて成立させることが、共通 Architecture の invariant として不足していた。
- Evidence / resolution: §6.9 が4条件を列挙し、target request / Profile / Account / Chain / Network への binding、missing / stale / revoked / mismatch 時の no-sign / no-success、pre-sign と result の再検証、SDK / dApp / Relay による bypass 禁止を定めている。
- Reconfirmation: Browser privileged layer と Mobile trusted host が owner であり、wallet-core は raw signing のみを担うことを §6.3–§6.4、§6.9、§8、§17.1 で確認した。

### DR-002 — Resolved

- Location: 旧レビュー指摘。現行確認箇所は Architecture §17.1。
- Problem: Architecture の判断が downstream Design / Specification のどこへ、誰の責任として、どの境界を越えて引き継がれるかが不足していた。
- Evidence / resolution: §17.1 に、共通 security、signing lifecycle、interfaces、Browser、Mobile、Relay、SDK、chain compatibility、Profile / Account、wallet-core、Mainnet evidence の正本、責任主体、委譲境界がある。
- Reconfirmation: 各リンク先の責任記述と照合し、Architecture の責任再定義、下流への丸投げ、主要 security invariant の未引継ぎは確認されなかった。

## 10. Upstream Feedback

なし。Concept と Common / Browser / Mobile / Relay / SDK Requirements は、Architecture の安全な評価に必要な目的、責務、security property、platform boundary、v1 scope を提供している。現時点で Requirements の不足・曖昧さ・矛盾が Architecture の成立を妨げるものは確認されなかった。

## 11. Deferred Findings

- API、schema、DTO、wire format、具体的 error、timeout / retry の protocol、暗号方式・パラメータ、parser、Binding の ABI / memory / zeroization、UI / OS API、React Native integration は、Architecture が責務・invariant・委譲先を示したうえで下流へ委譲されている。
- `CR-OPEN-001` / `CR-OPEN-002`、Mobile の host integration / OS protection / lifecycle / backup、Relay の protocol / retention / resource policy、SDK の transport / version / caller binding / construction / public scope、chain の supported type / version、Profile-wide backup は、それぞれ §17.1 の正本へ引き継がれる既存 open item である。これらを本レビューで勝手に確定しない。
- `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN`、cancellation、timeout、再取得・再配送などの具体的外部契約は下流の signing-flow / handoff / SDK / Relay 設計・仕様で検証する。Architecture は同一 request の自動再署名や、拒否・integrity failure 後の自動 fallback を許していないため、Architecture Gate の不足とはしない。
- 現在の workspace に `apps/mobile` がないこと、既存 chain package に実装上の移行対象があることは、Architecture が Mobile 実装済みまたは chain integration 完了と主張していないため、実装レビューへ defer する。
- `DR-003` に関連する exact message signing contract 自体は現行 handoff specification の下流範囲であり、本レビューではその本文の存在と Architecture の責務分界との整合だけを確認した。

## 12. Scope and Traceability

| 上流要求・判断                                               | Architecture の対応                                              | 評価                                                                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concept、Common Requirements CR-001〜CR-016 / CR-NFR / CR-AC | §1–§3、§5–§6、§8–§10、§13、§16、§17.1                            | Pass。Signer、明示承認、秘密情報分離、chain / network、結果対応、fail-closed、共通4条件を追跡できる。                                                             |
| Browser Extension Requirements BR-001〜BR-013                | §5.1、§6.3、§8、§11、§15–§17.1                                   | Pass。observed caller / Origin、Permission、trusted UI、Browser lifecycle、core boundary を privileged layer に集約し、Chrome API / UI 詳細を下流へ委譲している。 |
| Mobile App Requirements MR-*                                 | §5.2、§6.4、§8、§12、§17.1                                       | Pass。Mobile trusted host が handoff source、Profile / Account、認証、承認、OS lifecycle、core orchestration を担い、未実装を実装済みと扱わない。                 |
| Relay Requirements RR-*                                      | §5.2、§6.5、§8、§12、§17.1                                       | Pass。Relay は opaque / structural transport に限定され、秘密、意味検査、approval、signing、announce / node authority を持たない。                                |
| SDK Requirements SDK-*                                       | §4–§7、§10、§13、§17.1                                           | Pass。SDK は request / result / correlation / transport boundary を担うが Signer、approval、semantic final inspection、secret、raw sign を担わない。              |
| Security Design / Signing Flow / Interfaces                  | §3、§6.9、§8–§10、§13、§16、§17.1                                | Pass。trust boundary、4条件、target binding、pre-sign recheck、restart / duplicate / result safety が対応する正本へ渡る。                                         |
| Chain Compatibility / Profile-Account                        | §2、§6.6–§6.7、§9、§13–§15、§17.1                                | Pass。Symbol / NEM、Mainnet / Testnet、Application Profile / Account と wallet-core Profile / Software Key / Store を混同しない。                                 |
| wallet-core 外部契約 / Binding decision                      | §6.8、§8–§9、§15、§17.1                                          | Pass。secret / Store / key derivation / raw sign は core、Application-level meaning / approval / host lifecycle は MosaicLynx と分離される。                      |
| Mainnet Evidence Lite ADR                                    | §16、§17.1                                                       | Pass。evidence 不足時の Mainnet capability fail-closed を release / operation へ委譲している。                                                                    |
| Web Transaction Handoff Specification                        | §4–§5、§10、§12、§18、および §17.1 の signing / SDK / Relay 追跡 | Pass。transaction / message の現行 handoff scope と Architecture の opaque Relay・Signer authority は整合する。§17 の open 状態同期のみ `DR-003`。                |

Architecture の traceability は、下流 API や仕様の全文を複製せず、要求された責任・不変条件・委譲先を特定する粒度で成立している。新しい要求・capability・暗号契約を Architecture に追加していない。

## 13. Domain Checks

| Domain                                                         | 確認結果                                                                                                                                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture scope / system boundary                           | Pass。目的、v1 対象、対象外、現在 workspace にない Mobile 実装を含む実装主張の否定、下流詳細の境界が §1–§2 にある。                                                                                                        |
| Component responsibility / ownership                           | Pass。dApp、SDK、Browser、Mobile、Relay、Application / domain、chain integration、wallet-core、external Node の責任、重複禁止、空白が §6–§7 にある。                                                                       |
| Dependency direction / layering                                | Pass。domain は Browser / OS / DOM / Relay / storage / core internals に依存せず、SDK / Provider / Relay が privileged または core secret に逆流せず、chain inspection が raw signing を再実装しない。                     |
| Privileged / unprivileged context                              | Pass。page / Provider / content / SDK は untrusted / non-privileged、Browser privileged layer と Mobile trusted host が Signer-side authority と明示されている。                                                           |
| Protected assets                                               | Pass。Mnemonic、private key、Profile password、Wallet Store、decrypted secret、signing authority、Account association、pending approval / result binding を保護対象として扱っている。                                      |
| Trust boundaries                                               | Pass。Web、SDK、content、Relay、network、external Node、OS input、host privileged layer、Binding、wallet-core logical/API boundary を区別し、Relay / Node を signer と誤認しない。                                         |
| Secret ownership / lifecycle                                   | Pass。wallet-core が key / Store / raw signing を所有し、host が UI・lifecycle・binding adapter を担う。Browser / Mobile / Relay / SDK / logs へ秘密を公開しない。WASM の非分離性も明示される。                            |
| Authentication / authorization / signing authority             | Pass。Signer が Authentication、signing-capable unlock、Profile / Chain / Network に対する Account authorization、explicit approval の共通4条件を同一 target context に binding し、pre-sign / result を再確認する。       |
| Untrusted input / fail-closed                                  | Pass。caller、handoff、request、Store / Binding value、chain / network / result を boundary ごとに検証し、missing / stale / revoked / mismatch / unknown では sign / success へ進めない。                                  |
| Data / control flow                                            | Pass。request → SDK / handoff → Signer validation → semantic inspection → trusted UI → gate recheck → wallet-core → result binding → dApp independent verification の10段階 flow がある。                                  |
| Permission / handoff / network access                          | Pass。Permission は Application / Signer 側、Relay は短期 opaque delivery、Node access / announce は dApp 等の外部 network layer と整理され、Relay delivery success を approval / success としない。                       |
| Failure / cancellation / timeout / retry / restart / duplicate | Pass at Architecture level。safe failure、no automatic fallback / re-sign、restart / generation loss / stale / duplicate の責任を示し、具体的契約は downstream に委譲する。                                                |
| Platform separation                                            | Pass。Browser の observed browser context / content bridge / SW lifecycle、Mobile の external handoff / OS lifecycle / trusted host、SDK の common non-privileged boundary を分離し、共通化は意味と invariant に限定する。 |
| wallet-core integration                                        | Pass。core の secret / Store / key derivation / public identity / raw signing と MosaicLynx の application semantics / approval / host adapter を分離し、Binding の Native / WASM 方式を再設計しない。                     |
| Chain / network interoperability                               | Pass。Symbol / NEM と Mainnet / Testnet を分離し、chain-specific parse / inspect / supported scope / signed bytes を下流へ一意に委譲する。                                                                                 |
| Related Design boundaries                                      | Pass。Security、Signing Flow、Interfaces、Browser、Mobile、Relay、SDK の各 Design と §17.1 の ownership / delegation が整合し、Architecture が下位 API を過剰複製していない。                                              |
| Downstream implementability                                    | Pass。主要判断、責任主体、trust invariant、failure responsibility、正本資料、委譲範囲が §17.1 にあり、下流が Architecture の責務を推測で補う必要はない。                                                                   |

## 14. Validation Results

| 検証                                                                                  | 結果                                                                                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --write docs/reviews/design/architecture-review-005.md`           | `unable to open database file` で失敗。pnpm launcher の environment error。                       |
| `./node_modules/.bin/prettier --write docs/reviews/design/architecture-review-005.md` | PASS。上記の代替として formatter を実行。                                                         |
| `pnpm exec prettier --check docs/reviews/design/architecture-review-005.md`           | `unable to open database file` で失敗。pnpm launcher の environment error。                       |
| `./node_modules/.bin/prettier --check docs/reviews/design/architecture-review-005.md` | PASS。代替 validation として全体を code style 準拠と確認。                                        |
| Internal link checker                                                                 | PASS。artifact 内の相対リンク 31 件の target path を確認。                                        |
| Finding ID consistency checker                                                        | PASS。`AR-001`、`AR-002`、`DR-001`、`DR-002`、`DR-003` の status table / detail への対応を確認。  |
| Review gate / finding consistency checker                                             | PASS。`READY`、Critical 0、`DR-003` が Minor / Open かつ Optional Improvements にあることを確認。 |
| Change scope (`git status --short`、`git diff --name-only`)                           | PASS。status は `?? docs/reviews/design/architecture-review-005.md` のみで、tracked diff は空。   |
| `git diff --check` / staged diff check                                                | PASS。staged / unstaged diff に whitespace error はない。                                         |

Not validated: docs-only review artifact のため、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` および package / app 実装検証は実行対象外とした。pnpm の database access error については local executable を使用し、formatter validation を継続した。whitespace は `git diff --check` と staged diff check で PASS を確認した。

## 15. Review Gates

| Gate                        | 判定 | 根拠                                                                                                                                                                               | 対応 ID  |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1. 目的と範囲               | Pass | §1–§3 が Architecture の目的、適用範囲、対象外、設計原則を定める。                                                                                                                 | なし     |
| 2. コンテキストと責任       | Pass | §4、§6、§8、§9 が主要外部主体、Signer、Relay、wallet-core、secret owner、trust boundary を定める。                                                                                 | なし     |
| 3. 依存方向                 | Pass | §7 の dependency diagram / rules が domain、SDK、Provider / content、Relay、chain integration、core の逆流を禁止する。                                                             | なし     |
| 4. 主要フロー               | Pass | §5、§10–§12 が request、approval、sign、result、handoff、restart、stale、duplicate、failure の責任を示す。                                                                         | なし     |
| 5. データ所有               | Pass | §6、§8–§9、§15 が Application state、Permission、secret、Store、public result、Relay opaque state の所有と保持境界を示す。                                                         | なし     |
| 6. セキュリティと相互運用性 | Pass | §3、§6.7–§6.9、§8–§10、§13、§16 が4条件、fail-closed、chain / network 分離、wallet-core / Binding、Node / Relay 非権威を定める。                                                   | なし     |
| 7. 上流整合性               | Pass | Concept、Common / Browser / Mobile / Relay / SDK Requirements、ADR と §12 の traceability が重大な矛盾なく対応する。                                                               | なし     |
| 8. 下流実装可能性           | Pass | §17–§17.1 が downstream source of truth、責任主体、invariant、委譲境界を一意に示す。§17 の Message signing status drift は `DR-003` として引継ぎ可能であり gate failure ではない。 | `DR-003` |

全8 Gate は Pass。`DR-003` は Minor であり、design-review Skill の規則に従い Gate を不合格にしない。

## 16. Remaining Risks and Open Decisions

- Mobile App は current workspace に未実装であり、Mobile milestone の受信経路、OS protection、host Binding integration、lifecycle、backup / migration は downstream open item のままである。
- SDK の transport / version / caller binding / transaction construction、Relay の protocol / TTL / resource / retention、chain の supported transaction scope、Profile-wide backup / restore は §17.1 の委譲先で確定・検証する必要がある。
- Browser / Mobile の認証方式、credential storage、trusted UI、Binding host integration、secret byte lifecycle は Architecture が owner と fail-safe invariant を定め、具体方式を下流へ委譲している。方式未確定自体は Architecture blocker ではない。
- Message signing の exact contract は downstream specification に存在するため、Architecture の open item 状態を同期する必要がある（`DR-003`）。この残存リスクは traceability drift であり、signing authority / trust boundary の欠落ではない。
- Current implementation、tests、fixtures が Architecture の全 milestone を満たすかは本レビューの対象外であり、Implementation / Release readiness review で確認する。

## 17. Automatic Changes

レビュー中に Architecture、Requirements、Specification、実装コード、テスト、README は変更していない。変更は本 review artifact の新規作成のみである。

## 18. Final Decision

`READY`

`ARCHITECTURE DESIGN READY`

新規 formal finding は `Minor` 1件（`DR-003`、Open）。Critical 0、Major 0、再オープン 0。過去の `AR-001`、`AR-002`、`DR-001`、`DR-002` は本文上 Resolved であり、Architecture の目的、責務境界、Trust Boundary、Requirements traceability、関連 Design の責任分界および下流実装可能性は READY と判断できる。
