# MosaicLynx Browser Extension Requirements 復元後フル再レビュー

## 1. Review Target

- 対象: [Browser Extension Requirements](../../requirements/browser-extension.md)
- 確認日: 2026-08-27
- レビュー成果物: `docs/reviews/requirements/browser-extension-review-004.md`
- 上位 Concept: [Concept Sheet](../../concept/concept-sheet.md)
- 上位 Common Requirements: [Common Requirements](../../requirements/requirements.md)
- 最新 Concept review: [concept-sheet-review-003](../concept/concept-sheet-review-003.md)
- 最新 Common Requirements review: [requirements-review-006](requirements-review-006.md)
- Common Requirements 指摘対応コミット: `6c05ae2cf3f5d70da7ae156d20e053e917b44062`
- 過去 Browser Extension review: [001](browser-extension-review-001.md)、[002](browser-extension-review-002.md)、[003](browser-extension-review-003.md)
- 使用 Skill: [requirements-review](../../../.agents/skills/requirements-review/SKILL.md)
- レビュー位置付け: 過去の `READY` を根拠にせず、復元後の現行 Skill による Browser Extension 要件の独立したフル再レビューを実施した。過去レビューは指摘履歴、再発、判断理由および ID 追跡だけに使用した。
- 変更範囲: 本レビュー成果物のみ。Source、他のレビュー、仕様、設計、ADR、release 資料、Skill および実装は変更していない。

## 2. Execution Audit

レビュー対象を Browser Extension 固有の `BR-001〜BR-013`、`BR-AC-001〜BR-AC-013`、Traceability および対象外範囲に限定し、Common Requirements の継承関係を確認した。

- Phase 0: 対象、上流根拠、過去指摘、必要な下流資料および Requirements / Design / Specification の境界を確定した。
- Phase 1 Reviewer A: 要求の明確性、完全性、責任主体、MUST / MUST NOT の強度、受け入れ可能性および traceability を確認した。
- Phase 1 Reviewer B: 一般ユーザーを第一対象とする価値、dApp 開発者の位置付け、Chrome 初回 milestone、scope、backup 非包含および release 境界を確認した。
- Phase 1 Reviewer C: Signer、SDK、Web page、page context、content script、Relay、wallet-core の Trust Boundary、認証・unlock・Account authorization の継承、lifecycle、入力、remote code、Mainnet gate を確認した。
- Phase 2: 上記観点を統合し、Common Requirements、Concept、下流資料および Chrome 公式一次資料との明白な矛盾を再確認した。過去 `READY` は判定根拠にしていない。
- Phase 3: 現行 Skill の正式な 8 Review Gates、finding taxonomy、判定規則、validation および変更範囲を適用した。

サブエージェントは使用していない。実装テスト、Chrome E2E、Manifest の具体値、API、wire format、wallet-core binding の実装検証は本レビューの範囲外とした。

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 使用目的                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Browser Extension Requirements](../../requirements/browser-extension.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | BR / BR-AC、scope、Trust Boundary、lifecycle、Mainnet gate および local traceability の正本                                                                 |
| [Common Requirements](../../requirements/requirements.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Signer の共通責任、transaction / message signing、auth / unlock / Account authorization、SDK 境界、fail-closed、security guarantee、backup 非包含の上流根拠 |
| [Concept Sheet](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 一般ユーザー中心の価値、Browser 初回 milestone、Relay 非署名、announce 非包含、v1 境界および security 原則                                                  |
| [Concept review 003](../concept/concept-sheet-review-003.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Concept が READY 済みであることと上流判断の確認                                                                                                             |
| [Common Requirements review 006](requirements-review-006.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Common Requirements の対応後状態と RR-001〜RR-004 の履歴確認。Browser の READY 判定の代替根拠にはしていない                                                 |
| [SDK Requirements](../../requirements/sdk.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | SDK が dApp 側の連携接点であり Signer、秘密情報、署名、最終承認を担わないことの用語・責任確認                                                               |
| [Product Specification](../../specifications/product-spec.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Browser 初回範囲、一般ユーザー、backup の個別 platform / release 扱いの整合確認                                                                             |
| [Profile / Account Specification](../../specifications/profile-account-spec.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Profile / Account と秘密情報責任の境界確認                                                                                                                  |
| [Architecture](../../design/architecture.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Browser host、Provider / Content Script、wallet-core、Signer と Relay の責任方向の整合確認                                                                  |
| [Mainnet release evidence](../../release/mainnet-release-evidence.md)、[release process](../../release/release-process.md)、[evidence policy](../../evidence/evidence-policy.json)、[Mainnet Evidence Lite ADR](../../adr/0001-mainnet-evidence-lite.md)                                                                                                                                                                                                                                                                                                                                                                                                              | Mainnet gate の下流委譲と運用責任の確認                                                                                                                     |
| [Browser Extension review 001](browser-extension-review-001.md)、[002](browser-extension-review-002.md)、[003](browser-extension-review-003.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 過去指摘の再発、解消状態および legacy finding ID の追跡                                                                                                     |
| [requirements-review Skill](../../../.agents/skills/requirements-review/SKILL.md)、project context、review-common playbook / reviewers / gates / output format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 現行の実行手順、taxonomy、8 Gates、判定および成果物形式                                                                                                     |
| [Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)、[service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)、[security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)、[permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)、[remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/) | Browser context、frame、lifecycle、権限および remote code に関する外部 platform 制約の照合。MosaicLynx 固有の要求や実装をこれらから新規発明していない       |

## 4. Review Result

`READY`

現行 Requirements の仕様・設計への引継ぎを阻害する Critical の New / Open / Reopened finding はなく、8 Review Gates はすべて PASS である。Major / Minor の現行 finding もない。

## 5. Summary

Browser Extension は、Common Requirements を Chrome Browser Extension 固有の制約へ適切に具体化している。特に、拡張機能管理下の確認領域、browser-observed top-level Origin、接続許可と要求ごとの署名承認の分離、Origin / Profile / Account / Chain / Network の scope、Web page / page context / content script の非署名境界、lifecycle 変化時の承認再利用禁止、wallet-core 境界、最小権限、remote code 非依存、更新時の fail-closed および Mainnet gate が MUST と外部から判定可能な Acceptance Criteria に対応している。

Common の `CR-015`（SDK 境界）、`CR-016`（署名可能状態の共通前提）および `CR-NFR-013`（security guarantee boundary）は Browser 文書へ重複して再定義する必要はない。Common が Browser を含む全 Signer へ適用し、Browser 側の `BR-003`、`BR-004`、`BR-006`、`BR-007`、`BR-008`、`BR-011` および各 BR-AC が外部側からの迂回・再利用を禁止しているため、継承関係は回復している。

過去の Browser 指摘は再発していない。backup / restore は v1 Common MUST ではなく、初回 Browser milestone へ不要な要求を逆流させていない。transaction signing、message signing、blind signing 禁止、dApp の独立検証、announce 非包含、Symbol / NEM、Mainnet / Testnet、Relay 非署名、wallet-core 境界および一般ユーザー中心の価値にも回帰はない。

## 6. Finding Status

### Current findings

現行 Skill の正式 taxonomy による finding はない。

| 区分                          | Critical | Major | Minor | New / Open / Reopened |
| ----------------------------- | -------: | ----: | ----: | --------------------: |
| 現行 Browser Extension review |        0 |     0 |     0 |                     0 |

### Historical findings

過去レビューの legacy ID は、現行 Skill の新規 finding ID として再採番していない。

| 過去 ID   | 過去の重大度 | 現在の状態                      | 確認結果                                                                                                              |
| --------- | ------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| BREQ5-001 | 旧 ERROR     | Resolved                        | BR-010 / BR-011 と BR-AC-008 / BR-AC-009 が受け入れ条件へ追跡されている                                               |
| BREQ5-002 | 旧 ERROR     | Resolved                        | BR-012 と BR-AC-006 が更新後の安全側継続禁止を定めている                                                              |
| BREQ5-003 | 旧 WARN      | Resolved                        | BR-003 / BR-004 と BR-AC-010 / BR-AC-011 が接続要求と署名要求を分離している                                           |
| BREQ5-004 | 旧 WARN      | Resolved                        | BR-004 と BR-AC-012 が Origin、top-level、frame および loopback の範囲を定めている                                    |
| BREQ6-001 | 旧 ERROR     | Resolved                        | Common `CR-014` により初回 Browser milestone の backup 下流追跡を行わないことが明示されている                         |
| BREQ6-002 | 旧 ERROR     | Resolved                        | BR-AC-001、BR-AC-004、BR-AC-011 が Profile binding、permission 操作および旧 permission 再利用禁止を検証可能にしている |
| BREQ6-003 | 旧 ERROR     | Resolved                        | BR-011 / BR-AC-009 が remote fetched executable code への署名処理依存を禁止している                                   |
| BREQ6-004 | 旧 WARN      | Resolved                        | BR-001 と BR-AC-013 が初回 milestone の Chrome 限定を対応付けている                                                   |
| BREQ6-005 | 旧 WARN      | Resolved / lower-phase deferred | BR-013 が evidence の時点・失効等を release operation / evidence policy へ明示的に委譲している                        |

## 7. Required Changes

なし。現行 Requirements に Critical / Major の New / Open / Reopened finding はなく、判定を `REVISE REQUIREMENTS` へ変更する必須修正はない。

## 8. Optional Improvements

なし。現行 Requirements に Minor の New / Open / Reopened finding はない。UI layout、Manifest permission 名、CSP の具体値、API、schema、internal message、state machine および test implementation の追加は、本レビューの改善要求にはしない。

## 9. Resolved Findings

過去の指摘について、現行文書で次を確認した。

- `BREQ5-001` / `BREQ6-003`: 未検証入力、XSS、injection および remote code が確認表示、承認、署名権限または秘密情報を変更できないこと、remote fetched executable code に署名処理を依存させないことが `BR-011`、`BR-AC-009` にある。防御方式は下流へ委譲されている。
- `BREQ5-002`: 更新後に既存 Profile、Account、permission または Wallet Store を無断で別対象へ置換せず、安全性・互換性・wallet-core 境界を確認できない場合に署名可能状態を継続しないことが `BR-012`、`BR-AC-006` にある。
- `BREQ5-003`: 未許可 Origin の接続要求、利用者の明示操作による permission 作成および接続後も要求ごとに承認が必要であることが `BR-003`、`BR-004`、`BR-AC-010`、`BR-AC-011` にある。
- `BREQ5-004`: browser-observed Origin の保証範囲、top-level browsing context、HTTPS / loopback、iframe / child frame および不透明な Origin の扱いが `BR-004`、`BR-AC-012` にある。
- `BREQ6-001`: backup / restore を初回 Browser milestone の Common MUST として追加せず、将来の個別 platform / release に委譲する Common `CR-014` と Product Specification に整合している。
- `BREQ6-002`: permission scope の Profile / Account / Chain / Network binding、Profile A / B の分離、作成・変更・撤回および stale / uncertain permission の不使用が `BR-004`、`BR-AC-001`、`BR-AC-004`、`BR-AC-011` にある。
- `BREQ6-004`: 初回 Browser Extension milestone の提供・サポート対象が Chrome のみであることが `BR-001`、`BR-AC-013` にある。最低バージョン等は下流へ委譲されている。
- `BREQ6-005`: Mainnet gate の評価時点、公開後の evidence 期限切れ・失効・検証不能および build-time / runtime の詳細を `BR-013` が release operation / Mainnet evidence policy へ引き継いでいる。これは Browser Requirements の blocker ではない。

## 10. Deferred Findings

- Browser Extension に残る現行 finding はない。
- `BREQ6-005` の operational detail は lower phase（release operation / evidence policy）へ委譲されているが、Browser 要件上の責任境界と fail-closed 条件は解消済みである。運用詳細を Browser Requirements の blocker に戻さない。
- Common review で別管理される下流向けの message format / encoding / canonicalization、wallet-core 固定参照、UI 詳細等は、Common / Browser Requirements の READY 判定に必要な欠陥として扱っていない。

## 11. Scope and Traceability

| 流れ                                                         | 確認結果                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Concept → Common Requirements                                | 一般ユーザーを第一対象とする署名価値、Browser / Mobile Signer、Relay 非署名、明示承認、blind signing 禁止、秘密情報分離、announce 非包含、Mainnet gate および security boundary が Common へ継承されている                                                                                 |
| Common Requirements → Browser Extension                      | Signer としての確認・承認・拒否・署名・fail-closed、transaction / message signing、Chain / Network / Account、CR-015 / CR-016 / CR-NFR-013 が共通適用され、Browser は Chrome、Web context、Origin、permission、lifecycle、update、wallet-core、最小権限および Mainnet 公開へ具体化している |
| SDK / dApp → Browser Signer                                  | SDK は dApp 側の連携接点で Signer 外部、秘密情報・署名・最終承認を担わない。Browser は SDK を信頼主体にせず、BR-003 の要求検証、BR-004 の browser-observed Origin / permission、BR-006 の Web 側非署名境界、BR-011 の未検証入力境界を維持する。SDK 固有要求の重複はない                    |
| Web page / page context / content script → Extension context | BR-002、BR-006、BR-007、BR-008、BR-011 と BR-AC-002、004、009 により、表示・承認・秘密情報・permission・Wallet Store の直接操作、承認の自動再利用および lifecycle をまたぐ自動署名を許さない                                                                                               |
| Browser Requirements → Design / Specification                | API、schema、Manifest、CSP、Storage、内部通信、Chrome API、UI layout、state machine、wallet-core binding、migration / rollback、versioning および release operation は、要求を満たす下流資料へ委譲されている                                                                               |

特に Authentication / unlock / Account authorization は Common `CR-016` / `CR-AC-017` の全 Signer 共通前提を Browser に適用する。Browser の接続 permission は署名許可ではなく、Web 側、SDK、page context、content script または browser lifecycle が認証・unlock・Account authorization を成立、更新または迂回できる記述はない。確認不能時の no-sign / no-success は Common `CR-010`、`CR-012`、`CR-016` と Browser の fail-closed 要求の組合せで成立する。

Origin は browser-observed request context と許可 scope の対応を示すだけであり、サイト運営者の本人確認、dApp の善性・非侵害または暗号学的 identity を保証しない。この保証境界は Common `CR-NFR-013` と `BR-004` / `BR-AC-012` で整合している。MosaicLynx 管理下の Signer / 承認境界が正常に動作する範囲を超えて、OS、device、Browser 全体、Web page / dApp または distribution artifact の完全 compromise を防御する要求にはなっていない。

## 12. Domain Checks

| 観点                                            | 結果 | 根拠                                                                                                                                                                                       |
| ----------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 要件完全性・目的                                | PASS | 一般ユーザーの確認可能な署名、Chrome 初回範囲、Signer 固有の browser boundary が BR-001〜BR-013 にある                                                                                     |
| 利用者と責任                                    | PASS | Extension が Signer、Web / page / content script が外部側、SDK が Signer 外部、Relay が非署名であることを Common と BR-002 / 006 が整合している                                            |
| Scope / milestone                               | PASS | Chrome only、Browser 初回 milestone、backup 非包含、announce / node / network state 非包含が Concept、Common、Product Specification と一致している                                         |
| Signer / SDK / Relay boundary                   | PASS | SDK の秘密情報・署名・最終承認非担当、Signer の検証・承認・署名条件の非迂回を継承し、Browser 固有の Web 境界を追加している                                                                 |
| Authentication / unlock / Account authorization | PASS | Common `CR-016` / `CR-AC-017` の四条件（認証、unlock、対象 authorization、要求ごとの明示承認）を Browser が弱めず、permission や lifecycle が代替しない                                    |
| Origin / permission                             | PASS | browser-observed top-level Origin、HTTPS / loopback、invalid / opaque / internal / extension / frame の拒否、scope、作成・変更・撤回、stale 再利用禁止、接続と署名承認の分離が外部判定可能 |
| Confirmation / request integrity                | PASS | Extension-managed confirmation、対象・Chain / Network・Account・影響の確認、要求ごとの approve / reject、入力非信頼、対象不一致 no-sign が BR-002 / 005 / 011 と AC にある                 |
| Lifecycle / update / fail-closed                | PASS | execution context 停止・再生成、navigation、tab / frame、Origin、Profile、Account、Chain、Network、target、update で旧承認・旧状態を別要求へ再利用せず、確認不能時に署名を継続しない       |
| Secret / wallet-core                            | PASS | Wallet Store、秘密情報を使う暗号処理、raw signing を wallet-core の責任境界とし、Application の Profile / Account / permission と混同していない                                            |
| Least privilege / remote code                   | PASS | 必要範囲の権限、未検証入力・XSS / injection の影響抑止、remote fetched executable code 非依存を要求し、Manifest / CSP の具体値は下流へ委譲している                                         |
| Mainnet gate                                    | PASS | evidence / gate 未達成または判定不能の build を Mainnet-signable で公開しない。運用時点等は release policy へ委譲している                                                                  |
| Interoperability / regression                   | PASS | Symbol / NEM、Mainnet / Testnet、transaction / message signing、blind signing 禁止、dApp 独立検証、announce 非担当、Relay 非署名、wallet-core 正本を弱めていない                           |
| Acceptance Criteria                             | PASS | Origin binding、permission、explicit approval、lifecycle、update、wallet-core、least privilege、remote code、Mainnet gate、Chrome scope が BR-AC-001〜013 で外部判定可能                   |
| Requirements phase boundary                     | PASS | endpoint、API signature、schema、JSON / CBOR、Storage、CSP 値、Chrome API、crypto、WASM、library、UI layout、exact state machine を要求へ逆流させていない                                  |
| Security guarantee boundary                     | PASS | 管理下 Signer / 承認境界の正常動作を要求し、外部の full compromise や Origin の site identity を保証していない                                                                             |

## 13. Validation Results

- Markdown formatter: `pnpm exec prettier --write docs/reviews/requirements/browser-extension-review-004.md` — 成功。
- Markdown format check: `pnpm exec prettier --check docs/reviews/requirements/browser-extension-review-004.md` — 成功。
- Repository 内リンク: 本文で参照した相対リンクの対象存在を確認 — 成功。
- Heading / anchor: 17 の正式セクション見出し、見出し階層および内部参照を確認 — 成功。
- Finding ID 重複: 現行 `RR-*` finding なし、履歴 `BREQ5-*` / `BREQ6-*` の重複なし — 成功。
- 既存レビュー非上書き: `browser-extension-review-001.md`〜`003.md` を保持し、新規 `004.md` を作成 — 成功。
- Source 非変更: `docs/requirements/browser-extension.md`、Common / Concept、下流資料、Skill、実装に差分なし — 成功。
- `git diff --check`: 成功。
- Repository-wide lint / typecheck / test / build / formatter: Not validated。レビュー成果物以外を変更しておらず、現行 Skill が要求する対象外のため実行していない。

## 14. Review Gates

| Gate                | 判定 | finding ID / 根拠                                                                                                                                                     |
| ------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 目的と課題       | PASS | 一般ユーザーが確認して署名を承認・拒否する Chrome Signer の目的が BR-001、Concept、Common と一致。FAIL finding なし                                                   |
| 2. 利用者と責任     | PASS | Extension、一般ユーザー、dApp / SDK、Web context、Relay、wallet-core の責任が分離。FAIL finding なし                                                                  |
| 3. 対象範囲         | PASS | Chrome 初回 milestone、top-level Origin、loopback、frame 等の境界、backup / announce 非包含が明確。FAIL finding なし                                                  |
| 4. 要件と制約       | PASS | MUST / MUST NOT、Origin / permission、lifecycle、secret、wallet-core、least privilege、remote code、Mainnet gate が要求として定義されている。FAIL finding なし        |
| 5. 受け入れ条件     | PASS | BR-AC-001〜013 が Browser 固有の境界、failure、approval、update、gate、Chrome scope を外部から判定可能にしている。FAIL finding なし                                   |
| 6. 内部整合性       | PASS | BR、BR-AC、Scope、Traceability の間で SDK / Signer、permission / approval、Origin guarantee、wallet-core、backup および Mainnet の矛盾なし。FAIL finding なし         |
| 7. 不可欠な前提     | PASS | Common の auth / unlock / Account authorization、wallet-core、release evidence、Chrome external constraints を前提として明示的に継承・委譲している。FAIL finding なし |
| 8. コンセプト整合性 | PASS | Concept の一般ユーザー中心、Signer / Relay 分離、v1 境界、blind signing 禁止、announce 非包含、security boundary と一致。FAIL finding なし                            |

すべての Gate が PASS であり、FAIL Gate に対応する finding ID はない。

## 15. Remaining Risks and Open Decisions

- 下流で、Manifest / permission の具体値、CSP、API / schema / RPC、内部通信、UI layout、Chrome API、lifecycle の実装方式、wallet-core binding、Storage、migration / rollback / versioning を決定する必要がある。これらは Requirements の不足ではない。
- Mainnet evidence の評価時点、期限切れ・失効・検証不能時の運用、build-time / runtime 境界は release operation / evidence policy の責任である。
- Origin は site identity、dApp の善性または cryptographic identity を保証しない。外部 Web page / dApp、OS、device、Browser 全体、配布 artifact の完全 compromise は Common security guarantee の対象外である。
- backup / restore は Common v1 および初回 Browser milestone の必須能力ではない。将来提供する場合のみ、個別 platform / release の要件・仕様で扱う。
- Mobile App、Relay、SDK の復元後レビューが残る場合でも、本成果物の Browser Extension 判定をそれらへ拡張しない。

現行の Browser Extension Requirements に blocking risk または未解決の Requirements-level open decision はない。

## 16. Automatic Changes

Source への自動変更はない。変更したファイルは本レビュー成果物 `docs/reviews/requirements/browser-extension-review-004.md` のみである。

## 17. Final Decision

`READY`

Browser Extension Requirements は、Common Requirements を Chrome Browser Extension 固有の制約へ具体化し、明示承認、認証・unlock・Account authorization の共通前提、Origin / permission、Web / Extension Trust Boundary、lifecycle、秘密情報・wallet-core 境界、least privilege、remote code、Mainnet gate および fail-closed を外部から検証可能な Requirements として下流へ引き継げる状態にある。

本判定は Browser Extension Requirements に限定され、Requirements フェーズ全体、Mobile App、Relay、SDK のレビュー完了を意味しない。
