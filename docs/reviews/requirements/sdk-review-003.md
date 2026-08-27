# MosaicLynx SDK Requirements フル再レビュー

## 1. Review Target

- 対象: [`docs/requirements/sdk.md`](../../requirements/sdk.md)
- 成果物: `docs/reviews/requirements/sdk-review-003.md`
- 上位 Concept: [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- 上位 Common Requirements: [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- 最新 Concept review: [`docs/reviews/concept/concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)
- 最新 Common Requirements review: [`docs/reviews/requirements/requirements-review-006.md`](requirements-review-006.md)
- 過去 SDK review: `sdk-review-001.md`、`sdk-review-002.md`
- 使用 Skill: `.agents/skills/requirements-review/SKILL.md`
- 参照 playbook / reviewers / review-gates / output-format: 現行 Skill が参照する資料をすべて適用した。
- 今回の位置付け: 復元後 `requirements-review` Skill による、過去の `READY` 判定を前提としない独立した初回フル再レビュー。過去レビューは finding の履歴、再発および ID の追跡にのみ使用した。
- 対象範囲: SDK の目的、利用者、責任・非責任範囲、機能・Security・privacy・platform/runtime・compatibility・error・非機能要求、受入条件、未決事項、traceability および Requirements フェーズ境界。
- 未確認範囲: 本レビューでは要件書の品質を判定し、SDK / Provider / Relay / Mobile の実機連携、Mobile E2E、Relay Redis integration、Mainnet release evidence の生成・検証および実装適合性を判定していない。

## 2. Execution Audit

- Phase 0: 指定された SDK Requirements を対象として確定し、Concept、Common Requirements、最新レビューおよび下流資料の役割を分離した。成果物の次番号が `sdk-review-003.md` であり、既存成果物が存在しないことを確認した。
- Phase 1 Reviewer A 相当（明確性・完全性）: `SDK-FR-*`、`SDK-SEC-*`、`SDK-PRIV-*`、`SDK-PLAT-*`、`SDK-COMP-*`、`SDK-ERR-*`、`SDK-NFR-*`、`SDK-AC-*`、`SDK-OPEN-*` の ID、MUST / SHOULD、責任主体、受入条件、対象外および下流委譲を確認した。
- Phase 1 Reviewer B 相当（利用価値・スコープ）: 一般ユーザーの署名判断を中心とした Concept の価値、dApp / dApp 開発者への付随価値、SDK の dApp 側連携層としての位置付け、Browser / Mobile / Relay の milestone、transaction / message signing の v1 範囲、Symbol / NEM および Mainnet / Testnet の境界を確認した。
- Phase 1 Reviewer C 相当（成立性・安全性）: SDK / Signer / dApp / Relay の Trust Boundary、authentication / unlock / Account authorization / explicit approval の非迂回、Origin / caller binding、要求・結果 correlation、秘密情報・credential・payload・diagnostics、replay・lifecycle・failure・Mainnet gate および wallet-core 境界を確認した。
- サブエージェントは使用していない。上記 A / B / C の観点をメインエージェントが別パスとして独立に確認した。
- Phase 2: 各候補を上流根拠、対象範囲、Requirements レベルの影響、下流で決める事項および既存要求との重複・解消・再発の観点で反証した。新規 Formal finding は採用しなかった。
- Phase 3: 現行 Skill の8つの Review Gate、正式な `RR` taxonomy、成果物形式、リンク・見出し・ID・Source 非変更および差分検証を適用する。

## 3. Evidence Used

- [`docs/requirements/sdk.md`](../../requirements/sdk.md): 本レビューの主対象。SDK の責任境界、要求、受入条件、未決事項および traceability を確認した。
- [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md): 一般ユーザー中心の価値、Signer、SDK、Relay、秘密情報、明示的承認、v1 境界および保証範囲の上流根拠として確認した。
- [`docs/requirements/requirements.md`](../../requirements/requirements.md): `CR-015`、`CR-016`、`CR-NFR-013`、共通の署名操作、fail-closed、秘密情報分離、結果検証および platform 責任境界との整合を確認した。
- [`docs/reviews/concept/concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)、[`docs/reviews/requirements/requirements-review-006.md`](requirements-review-006.md): 前段の公開判定と未解決 Critical の有無を確認した。SDK 要件の正しさを過去判定で代替していない。
- `docs/reviews/requirements/sdk-review-001.md`、`sdk-review-002.md`: `RREQ1-001`〜`RREQ1-005` の履歴、解消内容および ID 追跡に使用した。
- [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)、[`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)、[`docs/requirements/relay.md`](../../requirements/relay.md): Signer、Mobile、Relay の責任と SDK との境界、Origin / handoff、承認、秘密情報、結果および lifecycle の整合確認に使用した。
- `docs/specifications/product-spec.md`、`docs/specifications/chain-compatibility-spec.md`、`docs/specifications/profile-account-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`: transaction / message、Chain / Network、Profile / Account、Provider / handoff、result / error、Origin および下流委譲の整合確認に使用した。
- `docs/design/architecture.md`: dApp、SDK、Signer、Mobile、Relay、Application、wallet-core の依存方向と Trust Boundary の整合確認に使用した。
- `packages/sdk/README.md`、`packages/sdk/package.json`、`packages/sdk/src/`、`packages/sdk/test/`: 現行公開境界・用語・下流実装の明白な矛盾がないかの確認に使用した。実装未反映だけを Requirements finding にはしていない。
- `_snwc` および `_sns` の参照資料: target が示す wallet-core / SNIF の責任境界と参照パスの確認に使用した。これらを SDK 要件の上流根拠とは扱っていない。

## 4. Review Result

**READY**

## 5. Summary

SDK は dApp 側の署名要求・結果の連携層であり、Signer ではないことが目的、主体表、Scope、責務境界および Out of Scope に一貫して定義されている。秘密情報の保管・復号・利用、署名、承認 UI および利用者の最終承認を SDK に移していない。

Common Requirements の `CR-015` に対しては、SDK を Signer の Trust Boundary 外とし、SDK 経由の入力を Signer が無条件に信頼しない境界が `SDK-FR-005`、`SDK-SEC-003`〜`SDK-SEC-005`、`SDK-PLAT-002`〜`003`、責務境界表および `SDK-AC-003` に追跡できる。`CR-016` に対しては、接続許可と署名承認を分離し、Profile / lock / unlock / 認証操作を外部アプリケーションへ移さず、Signer の署名前提を弱める記述はない。`CR-NFR-013` に対しても、SDK の保証を各 platform / Signer の検証結果を越えない範囲へ置き、管理境界外の入力、配布物、runtime および Relay を無条件に信頼しない要求になっている。

transaction signing と message signing は SDK v1 の必須 operation として区別され、未対応・未解析・表示不能・raw signing への暗黙 fallback を成功扱いしない。要求、operation、Signer、Account、Chain / Network、承認対象および結果の correlation、Success と失敗分類、result unknown、replay、lifecycle change および silent retry / downgrade 禁止は、要求と受入条件から外部判定可能である。

Browser の browser-observed Origin / browser context と、Mobile / Relay の handoff session / caller 検証を混同していない。Relay の配送成功や接続済み状態は署名成功・caller verified・最終承認の代替にならない。Symbol / NEM、Mainnet / Testnet、Mainnet gate、wallet-core と Application の責任も維持されている。

過去 `RREQ1-001`〜`RREQ1-005` の再発はなく、現行の Requirements レベルで採用すべき新規 finding もない。`SDK-OPEN-002`〜`SDK-OPEN-007` は、最低限の安全条件を固定したうえで API、transport、runtime、version および caller binding の具体化を下流へ委譲しており、未決であること自体は blocker ではない。

## 6. Finding Status

現行対象に対する `RR` Formal finding は 0 件である。Critical 0、Major 0、Minor 0 の active finding であり、New / Open / Reopened はない。

| ID        | 旧重大度 / 現行区分       | Status   | 初出レビュー   | 今回の状態根拠                                                                                                     |
| --------- | ------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| RREQ1-001 | Critical 相当（旧 ERROR） | Resolved | sdk-review-001 | message signing を v1 必須として `SDK-FR-007` / `SDK-AC-004` に確定し、未決項目から除去している。                  |
| RREQ1-002 | Critical 相当（旧 ERROR） | Resolved | sdk-review-001 | Browser と Mobile / Relay の最終 caller / Origin 検証主体、検証不能時の no-success を明記している。                |
| RREQ1-003 | Major 相当（旧 WARN）     | Resolved | sdk-review-001 | 失敗分類の下限、自動 retry / fallback 禁止、result unknown の非成功を `SDK-ERR-001` / AC に追跡している。          |
| RREQ1-004 | Major 相当（旧 WARN）     | Resolved | sdk-review-001 | transaction / message の正常な cross-transport 結果、correlation、独立検証を `SDK-AC-005` / `006` に明記している。 |
| RREQ1-005 | Minor 相当（旧 NIT）      | Resolved | sdk-review-001 | `SDK-AC-009` は SDK client-side と Relay server の境界を分け、過去の重複表現を含んでいない。                       |

## 7. Required Changes

なし。Critical または Major の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。Minor の New / Open / Reopened finding もない。要求追加や表現上の好みを理由に新規 finding は採番していない。

## 9. Resolved Findings

### RREQ1-001 — RESOLVED: message signing の v1 範囲

- 対象: `SDK-FR-007`、`SDK-AC-004`、`SDK-AC-005`、`SDK-AC-006`
- 確認事実: message signing は transaction signing と区別された SDK v1 の必須 operation とされ、内容・用途・Chain / Network / Account 文脈、表示可能性、実署名対象との一致および cross-transport の意味維持が要求されている。
- 完了条件 / 再確認: message signing を未決または別 operation として扱わず、未対応・raw bytes・表示不能を成功へ fallback しないことを確認した。条件を満たすため Resolved とする。

### RREQ1-002 — RESOLVED: Caller / Origin の検証主体と保証範囲

- 対象: `SDK-FR-005`、`SDK-SEC-004`、`SDK-PLAT-002`〜`003`、`SDK-AC-003`
- 確認事実: Browser は browser が観測した実 Origin / browser context を Browser Extension / browser platform が最終検証し、Mobile / Relay は handoff session と要求元の対応を Mobile App / platform が最終検証する。SDK は自己申告 Origin、binding 情報の存在、Relay 配送成功または接続済み状態を verified caller / verified Origin / success の根拠にしていない。
- 完了条件 / 再確認: 検証不能時の no-success と、SDK が platform の保証を超えない制約が要求・受入条件・責務表にあることを確認した。具体的 proof、browser API、OS API および credential format は下流委譲されており、条件を満たすため Resolved とする。

### RREQ1-003 — RESOLVED: error taxonomy の外部判定下限

- 対象: `SDK-FR-011`、`SDK-ERR-001`、`SDK-AC-007`〜`008`
- 確認事実: Success、User rejection、Unavailable、Connection / permission failure、Invalid request、Unsupported、Mismatch / integrity / caller / replay failure、Timeout / expired / cancelled、Relay / transport failure / result unknown、Internal failure を区別する下限が要求されている。拒否、検証失敗、result unknown および期限切れ後の古い承認再利用を安全側に扱う条件もある。
- 完了条件 / 再確認: 具体的 error code、例外型、文言および retry 回数を下流へ委ねたまま、外部アプリケーションが安全な終了・新規要求・再接続を選べる分類下限が直接判定できることを確認した。条件を満たすため Resolved とする。

### RREQ1-004 — RESOLVED: 正常な cross-transport 結果と独立検証

- 対象: `SDK-FR-008`、`SDK-FR-009`、`SDK-NFR-003`、`SDK-AC-005`〜`006`
- 確認事実: transaction signing と message signing の正常結果が、元要求、operation、Signer、Account、Chain / Network、correlation および Signer が確認・承認した対象に対応し、dApp / 外部アプリケーションが独立検証できることを要求している。提供開始前の Mobile / Relay を検証済みと報告しない制約もある。
- 完了条件 / 再確認: Browser Extension と、提供開始後の Mobile / Relay について、正常結果・拒否・未対応・検証失敗・transport failure の意味を個別検証できる受入条件を確認した。条件を満たすため Resolved とする。

### RREQ1-005 — RESOLVED: `SDK-AC-009` の重複表現

- 対象: `SDK-AC-009`
- 確認事実: SDK 自身の diagnostics / client-side temporary retention / external output と、Relay server の logging / retention / diagnostics / credential handling が分離して記載されている。過去に指摘された「SDK」の重複表現は現行文面にない。
- 完了条件 / 再確認: SDK が管理する情報境界と Relay Requirements へ委譲する server-side 境界を別々に判定できることを確認した。条件を満たすため Resolved とする。

過去レビューの `READY` は本レビューの根拠ではなく、上記は現行本文と承認済み上流・整合確認資料から独立に確認した結果である。

## 10. Deferred Findings

現行の SDK Requirements に対する Formal Deferred finding はない。以下は SDK Requirements が安全下限を定めたうえで下流へ引き継ぐ `SDK-OPEN-*` であり、未決であることだけを理由に blocker とはしない。

- `SDK-OPEN-002`: aggregate / multisig / cosignature の SDK 公開範囲。対応しない operation は capability 上 unavailable とし、通常の transaction signing や message signing へ変換しない。
- `SDK-OPEN-003`: Extension / Mobile / Relay の transport 選択、明示的代替経路、unavailable / timeout および第三者 transport の具体契約。User rejection、integrity / caller / replay failure、result unknown 後の自動 retry / fallback 禁止は確定済みである。
- `SDK-OPEN-004`: transaction construction helper の責務。SDK が node、announce または継続的 network state を担わない制約は確定済みである。
- `SDK-OPEN-005`: 正式対応 runtime、browser context、Node.js / SSR / Web Worker 等および配布形態の support matrix。宣言外の runtime を署名可能・caller verified と扱わない下限は確定済みである。
- `SDK-OPEN-006`: versioning、backward compatibility および deprecation policy。意味を維持できない組み合わせを別 operation の成功へ downgrade しない制約は確定済みである。
- `SDK-OPEN-007`: Browser Origin と Mobile / Relay handoff の具体的 caller binding。最終検証主体、保証上限および検証不能時の no-success は確定済みで、proof や API の方式を下流へ委譲している。

Common Requirements review に記録された `REQ4-001`〜`REQ4-003` 等の deferred 項目は上位レビューの管理対象であり、本レビューの SDK Formal finding へ重複計上していない。message signing、format / encoding、wallet-core 参照および UI 詳細の具体化は、Requirements の安全下限を弱めない範囲で下流へ引き継ぐ。

## 11. Scope and Traceability

| 確認対象                                               | SDK Requirements での追跡                                                                                                                                                                                                                      | 判定 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Concept の一般ユーザー中心価値と dApp 開発者の付随価値 | §2、§3、§5。SDK は連携差異を吸収するが、署名判断は MosaicLynx 側の利用者が担う。                                                                                                                                                               | PASS |
| Common `CR-015` SDK / Signer 境界                      | §1、§2.2、§3、`SDK-FR-005`、`SDK-SEC-001`〜`005`、`SDK-PLAT-002`〜`003`、§13、§16。SDK を dApp 側・Signer 外とし、秘密情報・署名・最終承認を担わせない。                                                                                       | PASS |
| Common `CR-016` 署名前提                               | `SDK-FR-002`〜`004`、§5、`SDK-AC-002`、`SDK-AC-007`。接続許可と要求ごとの承認を分離し、外部アプリケーションから Profile / lock / unlock / 認証操作を成立させない。共通要件の authentication、unlock、Account authorization の4条件を弱めない。 | PASS |
| Common `CR-NFR-013` 保証範囲                           | `SDK-SEC-*`、`SDK-PLAT-004`〜`005`、`SDK-NFR-001`、`SDK-NFR-004`、`SDK-AC-003`、`SDK-AC-009`〜`010`。SDK の保証を管理する連携・Signer 境界の要求へ限定し、外部入力・未対応 runtime・配布物・Relay を無条件に信頼しない。                       | PASS |
| Browser / Mobile / Relay Trust Boundary                | `SDK-FR-005`、`SDK-SEC-004`、`SDK-SEC-007`、`SDK-PLAT-002`〜`003`、責務境界表、`SDK-AC-003`。Browser-observed Origin と Mobile / Relay handoff を分離し、Relay を最終検証・承認・署名主体にしない。                                            | PASS |
| transaction / message signing                          | `SDK-FR-006`、`SDK-FR-007`、`SDK-AC-004`〜`006`。両方を v1 必須 operation とし、別 operation、raw signing、未対応形式への暗黙変換を禁止する。                                                                                                  | PASS |
| 要求・承認・結果の対応と失敗                           | `SDK-FR-008`〜`011`、`SDK-SEC-005`〜`006`、`SDK-ERR-001`、`SDK-AC-005`、`007`、`008`。correlation、独立検証、failure 分類、result unknown、replay、期限切れおよび no-success を追跡する。                                                      | PASS |
| Symbol / NEM、Mainnet / Testnet、Mainnet gate          | `SDK-FR-012`、§4、`SDK-PLAT-005`、`SDK-NFR-002`、`SDK-NFR-004`、`SDK-AC-010`、`012`。chain-specific 契約を SDK の独自規則に置換せず、gate 未達・判定不能を signable と扱わない。                                                               | PASS |
| wallet-core と Application / SDK                       | §2.2、§3.2、`SDK-SEC-001`、責務境界表、§16。鍵管理・Wallet Store・秘密情報処理・raw signing を wallet-core の責任とし、SDK / Application / dApp へ移さない。                                                                                   | PASS |
| Concept → Common → SDK → 下流                          | Common の SDK 境界、署名前提、Security guarantee boundary から本書の要求・受入条件へ接続し、Browser / Mobile / Relay、Design、Specification、Release / Test へ具体化を委譲している。                                                           | PASS |

## 12. Domain Checks

| 評価項目                                | 判定 | 根拠                                                                                                                                                                         |
| --------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 要求の完全性                            | PASS | 目的、利用者、Scope、責任、機能、Security、privacy、platform、compatibility、error、非機能、受入条件、OPEN、対象外および traceability が揃っている。                         |
| 責任・範囲                              | PASS | SDK、dApp、Browser Extension、Mobile App、Relay、Wallet Core、network の責任と非責任が表と本文で分離されている。                                                             |
| MUST / SHOULD の強度                    | PASS | 署名・秘密情報・承認・完全性・失敗境界は MUST、診断など任意性のある品質は SHOULD とされ、v1 の必須範囲と区別されている。                                                     |
| 受け入れ条件                            | PASS | Origin / handoff、接続許可、operation、correlation、失敗、秘密情報、runtime、version、Chain / Network、Mainnet gate を外部から確認できる。                                   |
| authentication / unlock / authorization | PASS | 共通 `CR-016` を弱めず、SDK / dApp が認証、unlock、Account authorization、explicit approval を成立・更新・迂回しない。未接続・許可撤回・古い承認・確認不能は成功にならない。 |
| Security / Trust Boundary               | PASS | SDK は Signer 外の連携層であり、Relay 配送、自己申告 Origin、接続済み状態、表示情報、未宣言 runtime を安全性・承認・署名成功の単独根拠にしない。                             |
| 秘密情報・credential・diagnostics       | PASS | 秘密鍵、Mnemonic、password、復号済み Vault、Relay credential、session secret、不要な payload、stack trace 等を外部出力・診断へ含めず、保持を目的越えに継続しない。           |
| 相互運用性                              | PASS | Browser / Mobile / Relay の transport 差異を同一の危険な意味へ変換せず、transaction / message、Symbol / NEM、Mainnet / Testnet の意味を保持する。                            |
| lifecycle / failure                     | PASS | cancel、timeout、期限切れ、context change、replay、duplicate、遅延、Relay failure、result unknown 後の古い要求・承認再利用と自動 fallback を禁止している。                   |
| Requirements フェーズ境界               | PASS | API、schema、wire format、crypto、timeout、retry algorithm、state machine、package、UI 等を確定せず、必要な外部可視条件と下流委譲だけを定めている。                          |
| OPEN の管理                             | PASS | `SDK-OPEN-002`〜`007` は具体方式・公開範囲・運用方針の決定事項として記録され、安全下限を未決に戻していない。                                                                 |

## 13. Validation Results

- review artifact Markdown format: `pnpm exec prettier --write docs/reviews/requirements/sdk-review-003.md` と `pnpm exec prettier --check docs/reviews/requirements/sdk-review-003.md` を実行し、いずれも PASS だった。
- repository 内リンク: 成果物内の相対リンク 13 件の存在を確認し、欠落は 0 件だった。fragment link は使用していないため、成果物からの未解決 anchor はない。
- heading / anchor: 17章の見出し順、重複見出しがないことおよび Markdown 見出し構造を確認し、PASS だった。
- finding ID 重複: 現行 `RR` Formal finding は 0 件。履歴 ID `RREQ1-001`〜`RREQ1-005` は Resolved Findings に一度ずつ記録し、新規 ID は採番していない。PASS だった。
- 既存レビュー非上書き: `sdk-review-001.md`、`sdk-review-002.md` を変更せず、新規 `sdk-review-003.md` のみを作成した。PASS だった。
- Source 非変更: `docs/requirements/sdk.md`、Concept、Common Requirements、下流資料、コードおよび既存レビューの差分はない。PASS だった。
- `git diff --check`: 成果物をステージした後に実行し、PASS だった。
- 未実行・未確認: repository-wide formatter、lint、typecheck、test、build、Mobile / Relay E2E、Redis integration および Mainnet release evidence 検証は本レビューの要件品質判定に不要なため実行していない。

## 14. Review Gates

| Gate                | 判定 | 根拠                                                                                                                                                                                  | 対応 finding |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1. 目的と課題       | PASS | SDK が dApp と MosaicLynx の提供形態差異を吸収し、一般ユーザーの安全な署名判断を支える連携層として目的・価値を説明している。                                                          | なし         |
| 2. 利用者と責任     | PASS | dApp / dApp 開発者、一般ユーザー、Signer、Relay、Wallet Core、network の利用関係と外部責任を区別している。                                                                            | なし         |
| 3. 対象範囲         | PASS | Browser / Mobile / Relay、transaction / message、Symbol / NEM、Mainnet / Testnet、公開情報・秘密情報、対象外および milestone を矛盾なく区別している。                                 | なし         |
| 4. 要件と制約       | PASS | MUST / SHOULD、署名前提、入力非信頼、Origin / caller、秘密情報、結果、failure、compatibility、Mainnet gate、wallet-core および下流委譲を識別できる。                                  | なし         |
| 5. 受け入れ条件     | PASS | 12件の `SDK-AC-*` が主要要求へ対応し、接続許可、署名承認、正常結果、失敗、correlation、秘密情報、runtime、version、chain / network を外部から判定できる。                             | なし         |
| 6. 内部整合性       | PASS | Scope、主体表、利用モデル、要求、責務境界、AC、OPEN、traceability の間に、SDK が Signer・承認主体・秘密情報主体になる矛盾はない。                                                     | なし         |
| 7. 不可欠な前提     | PASS | Browser / Mobile の最終検証、Signer の承認・署名、wallet-core、Relay の非署名 transport、chain compatibility、Mainnet release gate を未確認のまま SDK の責任へ混在させていない。      | なし         |
| 8. コンセプト整合性 | PASS | Concept と Common Requirements の一般ユーザー中心価値、SDK / Signer / Relay 境界、transaction / message、fail-closed、秘密情報分離、独立検証および Mainnet / Testnet を維持している。 | なし         |

FAIL Gate はなく、FAIL Gate に対応する正式 finding もない。

## 15. Remaining Risks and Open Decisions

- `SDK-OPEN-002`〜`007` の具体決定、下流仕様、実装、contract test および release evidence は残っている。ただし、未対応 operation の unavailable、安全側失敗、明示的承認、結果対応、秘密情報分離および caller 保証上限の最低条件は本要件で固定されている。
- Mobile / Relay の提供開始前には、実装済み・E2E 済み・対応済みと報告しない必要がある。提供開始後の cross-transport、caller binding、lifecycle、result unknown、replay および独立検証は下流の仕様・テストレビューで確認する。
- `packages/sdk` の現行実装・テストが将来の全 Mobile / Relay 契約を実装済みであるかは本レビューの判定対象ではない。Requirements の未実装を理由に本書を差し戻していない。
- Common Requirements の deferred 項目、wallet-core 参照、message format / encoding / canonicalization、UI 詳細および具体的な handoff 方式は、各下流工程で整合を確認する。これらは本 SDK Requirements の blocker ではない。
- 上記以外に、現行 SDK Requirements の active blocker、未解決 Critical または Common Requirements との重大な不整合は確認されなかった。

## 16. Automatic Changes

- レビュー中に Source、Concept、Common Requirements、下流資料、既存レビューおよび実装コードは変更していない。
- 作成した変更は、本レビュー成果物 `docs/reviews/requirements/sdk-review-003.md` のみである。

## 17. Final Decision

現行 SDK Requirements は、SDK を dApp 側の連携層かつ Signer の Trust Boundary 外として扱い、秘密情報・署名・最終承認を SDK に移さず、Browser / Mobile / Relay の caller 境界、transaction / message signing、correlation、failure、Symbol / NEM、Mainnet / Testnet、Mainnet gate および Requirements フェーズ境界を外部から判定できる。

過去 `RREQ1-001`〜`RREQ1-005` は Resolved、現行 `RR` Formal finding は 0 件、8つの Review Gate はすべて PASS である。したがって、SDK Requirements 単体の正式判定は次のとおりとする。

**READY**

この判定は SDK Requirements 単体の判定であり、下流 Design / Specification / Implementation の完了判定ではない。
