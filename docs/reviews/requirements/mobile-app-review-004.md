# MosaicLynx Mobile App Requirements 復元後フル再レビュー

## 1. Review Target

- 対象: [Mobile App Requirements](../../requirements/mobile-app.md)
- 確認日: 2026-08-27
- レビュー成果物: `docs/reviews/requirements/mobile-app-review-004.md`
- 上位 Concept: [Concept Sheet](../../concept/concept-sheet.md)
- 上位 Common Requirements: [Common Requirements](../../requirements/requirements.md)
- 最新 Concept review: [concept-sheet-review-003](../concept/concept-sheet-review-003.md)
- 最新 Common Requirements review: [requirements-review-006](requirements-review-006.md)
- Common Requirements 指摘対応コミット: `6c05ae2cf3f5d70da7ae156d20e053e917b44062`
- 過去 Mobile App review: [001](mobile-app-review-001.md)、[002](mobile-app-review-002.md)、[003](mobile-app-review-003.md)
- 使用 Skill: [requirements-review](../../../.agents/skills/requirements-review/SKILL.md)
- レビュー位置付け: 過去の `READY` を正しさの根拠にせず、復元後の現行 Skill による Mobile App Requirements の独立したフル再レビューを実施した。過去レビューは finding の履歴、再発、判断理由および ID 追跡だけに使用した。
- 変更範囲: 本レビュー成果物のみ。Source、他レビュー、仕様、設計、ADR、Mobile 資料、release 資料、Skill および実装は変更していない。

## 2. Execution Audit

レビュー対象を Mobile 固有の `MR-001〜MR-013`、`MR-AC-001〜MR-AC-014`、`MR-OPEN-001〜MR-OPEN-008`、Traceability および対象外範囲に限定し、Common Requirements の継承関係を確認した。

- Phase 0: 対象、上流根拠、過去 finding、下流資料、Mobile 実装が未存在であることおよび Requirements / Design / Specification の境界を確定した。
- Phase 1 Reviewer A: 要求の明確性、完全性、責任主体、MUST / SHOULD の強度、MR-AC 対応、OPEN 追跡および内部整合性を確認した。
- Phase 1 Reviewer B: 一般ユーザーを第一対象とする価値、Android / iOS の個別 milestone、Browser → Android → iOS → Relay の順序、v1 境界、backup / migration および distribution scope を確認した。
- Phase 1 Reviewer C: Mobile Signer、SDK、dApp、Relay、外部 handoff、OS、wallet-core の Trust Boundary、認証・unlock・Account authorization、lifecycle、秘密情報、Mainnet gate および fail-closed を確認した。
- Phase 2: 観点を統合し、Concept、Common Requirements、下流資料および外部コンポーネント契約との明白な矛盾を確認した。過去 `READY` は判定根拠にしていない。
- Phase 3: 現行 Skill の finding taxonomy、8 Review Gates、判定規則、成果物形式および validation を適用した。

サブエージェントは使用していない。Apple / Android の具体 API、OS version support matrix、Store 審査手順、Mobile build、Relay integration および wallet-core Binding の実装検証は本レビューの範囲外とした。

## 3. Evidence Used

| 資料                                                                                                                                                                                                                              | 使用目的                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Mobile App Requirements](../../requirements/mobile-app.md)                                                                                                                                                                       | MR / MR-AC / MR-OPEN、Mobile Signer、外部入力、OS、lifecycle、Relay、backup、distribution および local traceability の正本                                                                |
| [Common Requirements](../../requirements/requirements.md)                                                                                                                                                                         | Signer の共通責任、transaction / message signing、CR-015 SDK 境界、CR-016 署名前提、CR-NFR-013 security guarantee、fail-closed、wallet-core、backup 非包含および milestone 境界の上流根拠 |
| [Concept Sheet](../../concept/concept-sheet.md)                                                                                                                                                                                   | 一般ユーザー中心の価値、Android / iOS / Relay の順序、Relay 非署名、v1 全体境界、security 原則および OPEN の扱い                                                                          |
| [Concept review 003](../concept/concept-sheet-review-003.md)                                                                                                                                                                      | Concept が READY 済みであることと上流判断の確認                                                                                                                                           |
| [Common Requirements review 006](requirements-review-006.md)                                                                                                                                                                      | Common Requirements の対応後状態と RR-001〜RR-004 の履歴確認。Mobile の READY 判定の代替根拠にはしていない                                                                                |
| [SDK Requirements](../../requirements/sdk.md)、[Relay Requirements](../../requirements/relay.md)                                                                                                                                  | SDK / dApp / Relay と Mobile Signer の責任、handoff、秘密情報、結果および announce 境界の用語確認                                                                                         |
| [Product Specification](../../specifications/product-spec.md)、[Profile / Account Specification](../../specifications/profile-account-spec.md)                                                                                    | Mobile の外部可視範囲、Profile / Account、backup / restore、失敗および利用者表示の整合確認                                                                                                |
| [Architecture](../../design/architecture.md)、[Web transaction handoff specification](../../specifications/web-transaction-handoff-spec.md)                                                                                       | Mobile host、OS、wallet-core、handoff、Relay および下流委譲の責任方向確認。具体設計を要件の不足へ逆流させていないか確認                                                                   |
| [Mobile privacy](../../mobile/mobile-privacy.md)、[Mobile support](../../mobile/mobile-support.md)、[Mobile store release](../../mobile/mobile-store-release.md)                                                                  | Mobile 固有の privacy、support、配布および Testnet / Mainnet の整合確認。下流資料を上流要求の代替にはしていない                                                                           |
| [Mainnet release evidence](../../release/mainnet-release-evidence.md)、[release process](../../release/release-process.md)、[threat model](../../release/threat-model.md)、[evidence policy](../../evidence/evidence-policy.json) | Mainnet gate、配布、evidence および compromise 保証範囲の下流責任確認                                                                                                                     |
| `_snwc` の公開契約資料                                                                                                                                                                                                            | wallet-core の責任境界確認に限定して使用。製品要求の上流根拠または Mobile 実装済みの証拠にはしていない                                                                                    |
| [Mobile review 001](mobile-app-review-001.md)、[002](mobile-app-review-002.md)、[003](mobile-app-review-003.md)                                                                                                                   | 過去 finding の解消、再発、legacy ID および判断理由の追跡                                                                                                                                 |
| [requirements-review Skill](../../../.agents/skills/requirements-review/SKILL.md)、project context、review-common playbook / reviewers / gates / output format                                                                    | 現行の実行手順、taxonomy、8 Gates、判定および成果物形式                                                                                                                                   |

Apple / Android の具体 API、support matrix および Store policy は、現行要件がそれらを固定せず `MR-OPEN-*` と下流設計へ委譲しているため、新しい上流根拠としては採用していない。

## 4. Review Result

`READY`

現行 Requirements の仕様・設計への引継ぎを阻害する Critical の New / Open / Reopened finding はない。8 Review Gates はすべて PASS であり、`RR-005` は受け入れ条件の明示性に関する Minor の任意改善である。

## 5. Summary

Mobile App Requirements は、Common Requirements を iOS / Android の Mobile Signer 固有の制約へ適切に具体化している。Android と iOS を別 milestone とし、Browser → Android → iOS → Relay の順序および Relay 完了を v1 全体完了とする上位境界を弱めていない。

外部アプリ、スマホブラウザ、OS inter-app handoff、Deep Link / Universal Link / App Link、Intent、通知、共有データおよび Relay を検証前の外部入力として扱い、アプリ管理下の確認・承認、秘密情報分離、OS lifecycle 後の再検証、app lock / 再認証、wallet-core / OS 保護の責任分離、Relay 非署名、端末喪失、配布・更新・Mainnet gate を要求と MR-AC へ追跡している。

Common の `CR-015`（SDK 境界）、`CR-016`（認証・unlock・Account authorization・明示承認の署名前提）および `CR-NFR-013`（security guarantee boundary）は Mobile 文書へ重複して再定義する必要はない。Mobile の要求はこれらを弱めず、外部要求、lifecycle、app lock、Relay、OS および配布境界を補足している。

現行の明確な改善点は `RR-005` の1件だけである。`MR-011` の「OS が防止できない範囲を完全に防止できると表示しない」という境界を `MR-AC-012` で直接判定できるようにすることを推奨する。これは Minor であり、現在の判定を差し戻さない。

## 6. Finding Status

### Current findings

| ID     | Severity | Status | 対象                  | 今回の状態根拠                                                                                                             |
| ------ | -------- | ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| RR-005 | Minor    | New    | `MR-011`、`MR-AC-012` | OS の防止能力を越えた完全防止表示の禁止が MR-011 にあるが、MR-AC-012 では露出リスク評価・policy 定義までで直接判定できない |

現行 finding の内訳は Critical 0、Major 0、Minor 1、New 1、Open 0、Reopened 0 である。

### Historical findings

過去の legacy ID は、現行 Skill の正式 ID として再採番していない。

| 過去 ID   | 過去の重大度 | 現在の状態 | 確認結果                                                                                             |
| --------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| MREQ1-001 | 旧 ERROR     | Resolved   | `MR-007` の上流根拠と `_snwc` 外部コンポーネント契約が分離されている                                 |
| MREQ1-002 | 旧 ERROR     | Resolved   | MR-* ごとの上流・整合確認・下流・外部契約 Traceability がある                                        |
| MREQ1-003 | 旧 ERROR     | Resolved   | MR-005 / 006 / 007 / 010 / 011 / 012 / 013 の要求が MR-AC へ追跡されている                           |
| MREQ1-004 | 旧 WARN      | Resolved   | iOS / Android 差異が前提、既存要求および MR-OPEN-* に分類されている                                  |
| MREQ2-001 | 旧 ERROR     | Resolved   | MR-AC-005 が明示操作なしの unlock / 再認証、古い認証状態の自動復帰禁止、失敗時 no-sign を確認する    |
| MREQ2-002 | 旧 WARN      | Resolved   | MR-AC-002 が sender、対象、許可状態、要求内容の完全性を列挙し、MR-002 が CR-NFR-009 へ追跡されている |
| MREQ2-003 | 旧 WARN      | Resolved   | MR-012 が Mobile 側の復号・検証・表示・承認・署名責任を MR-AC-002 / 003 / 005 / 013 へ追跡している   |
| MREQ2-004 | 旧 WARN      | Resolved   | MR-AC-009 が配布条件、support、gate を、MR-AC-014 が conditional backup 更新互換性を確認する         |

## 7. Required Changes

なし。Critical / Major の New / Open / Reopened finding はなく、必須修正はない。

## 8. Optional Improvements

### RR-005: MR-011 の非保証表示が MR-AC-012 で直接判定できない

- Severity: `Minor`
- Status: `New`
- 対象箇所: `docs/requirements/mobile-app.md:90-94`（`MR-011`）、`docs/requirements/mobile-app.md:152`（`MR-AC-012`）
- 確認できた事実: `MR-011` は露出リスクの評価と platform policy の定義を SHOULD とし、OS が防止できない範囲を完全に防止できると表示しない制約も定めている。`MR-AC-012` はリスク評価と policy の存在を確認するが、完全防止と表示しない条件を明示していない。
- 既存の根拠: Common `CR-NFR-013` / `CR-AC-019` の security guarantee boundary、Mobile `MR-008` の capability 表示制約および `MR-011` 本文。
- 問題: platform policy が存在していても、OS の制約範囲を越えた完全防止表示を適合扱いにでき、要求本文の非保証境界を MR-AC だけで直接判定できない。
- 影響: 秘密情報、署名対象または承認画面の露出について、利用者が Mobile App の保護能力を過大に認識する余地が残る。Common の guarantee boundary と外部表示の検証可能性が弱くなる。
- Requirements レベルで必要な最小修正: `MR-AC-012` に、OS / platform が防止できない露出を完全に防止できる保証として表示しないことを追加し、`MR-011` との対応を明示する。Screenshot flag、対象画面、OS API および具体的 policy は固定しない。
- 下位フェーズへ委譲する事項: iOS / Android の screenshot、recording、recent-apps、notification の具体制御、対象画面、OS API、Store policy および UI は `MR-OPEN-007` と下流設計・仕様へ委譲する。
- 完了条件 / 再確認方法: `MR-AC-012` から、リスク評価・必要な policy・OS が防止できない範囲の非保証表示を外部から判定でき、`MR-011` へ追跡できることを確認する。

## 9. Resolved Findings

過去 finding の解消を、今回の独立評価でも次のとおり確認した。

- `MREQ1-001`: `MR-007` は Concept / Common を上流根拠とし、`_snwc` は外部コンポーネント契約として分離されている。wallet-core の設計詳細を製品要求へ逆輸入していない。
- `MREQ1-002`: Section 8 の MR-* / MR-AC-* 表が上流根拠、整合確認資料、下流引継ぎ、外部契約および Acceptance Criteria を区分している。
- `MREQ1-003`: MR-005 / 006 の lifecycle・認証、MR-007 の wallet-core、MR-010 の端末喪失、MR-011 の露出 policy、MR-012 の Relay、MR-013 の更新・配布が MR-AC へ対応している。`RR-005` はそのうち非保証表示の直接性だけを任意改善として残す。
- `MREQ1-004`: Section 4 が iOS / Android 差異を独立 MR-* ではなく既存要求、前提および MR-OPEN-* へ分類している。
- `MREQ2-001`: `MR-AC-005` がロック解除・署名前再認証の利用者明示操作、古い認証状態からの自動復帰禁止、認証不能・失敗時の no-sign を明記している。
- `MREQ2-002`: `MR-AC-002` が sender、Chain / Network / Account、許可状態、要求内容の完全性を列挙し、MR-002 の Traceability に `CR-NFR-009` がある。
- `MREQ2-003`: `MR-012` の Traceability と `MR-AC-013` が、Relay ではなく Mobile が復号・検証・表示・承認・認証条件確認・署名する責任を直接示している。
- `MREQ2-004`: `MR-AC-009` が公開審査・support・Mainnet gate・evidence を、`MR-AC-014` が conditional backup の更新互換性を確認している。

## 10. Deferred Findings

- `MR-OPEN-001`（OS / version / distribution）、`MR-OPEN-002`（受信方式）、`MR-OPEN-003`（OS 保護 / wallet-core Binding）、`MR-OPEN-004`（認証方式）、`MR-OPEN-005`（lifecycle）、`MR-OPEN-006`（backup / migration）、`MR-OPEN-007`（screen exposure policy）および `MR-OPEN-008`（release evidence / Store 条件）は、Requirements が安全条件と責任を定めたうえで、具体方式を下流へ委譲する未決事項である。未決であることだけでは blocker ではない。
- Common review の `REQ4-001`〜`REQ4-003` は Common / 下流整合に関する Deferred / non-blocking 事項であり、Mobile の finding として再分類しない。wallet-core 固定参照、message signing handoff / format、UI 詳細を Mobile READY の blocker に昇格させない。
- `RR-005` は現行の Optional Improvements に留める。具体的な OS 防止 API、screen flag、policy 値は後工程へ委譲する。

## 11. Scope and Traceability

| 流れ                                                   | 確認結果                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concept → Common Requirements                          | 一般ユーザー中心の署名価値、3 Signer、Relay 非署名、Browser → Android → iOS → Relay、Relay 完了による v1 境界、明示承認、秘密情報分離および外部 compromise 非保証が継承されている                                                                                                     |
| Common Requirements → Mobile                           | Android / iOS は Signer として transaction / message signing、確認・承認・拒否、fail-closed を共通継承する。`CR-015`、`CR-016`、`CR-NFR-013` は重複記載せず、Mobile の外部 handoff、app lock、lifecycle、OS、Relay および distribution 境界で弱められていないことを確認した           |
| SDK / dApp → Mobile Signer                             | SDK は dApp 側の連携接点で Signer 外部、秘密情報・署名・最終承認を担わない。Mobile は SDK / dApp を信頼主体にせず、外部要求を検証してアプリ管理下の確認へ渡す。SDK 固有要求を Mobile に重複定義していない                                                                             |
| External handoff → Mobile App                          | mobile browser、external app、OS inter-app handoff、URL、Intent、notification、share、Relay 等は外部入力であり、sender、context、Chain / Network / Account、content、permission / authorization、freshness / validity を検証しないまま署名へ進めない                                  |
| Mobile App ↔ Relay                                     | Mobile が復号・検証・意味解釈・表示・明示承認・署名を担い、Relay は非署名・非解釈・秘密情報非処理・非 announce。Relay unavailable / fallback の方式を固定しなくても、安全条件の迂回を許す要求はない                                                                                   |
| Mobile App ↔ OS / wallet-core                          | wallet-core は key management、Wallet Store、secret-dependent crypto、raw signing の正本。Mobile は Profile / Account / UI / orchestration / platform integration、OS は platform capability の境界であり、wallet-core が Secure Enclave / StrongBox 等を自動提供するとは扱っていない |
| Mobile Requirements → Design / Specification / Release | API、Deep Link / Universal Link / App Link / Intent schema、Relay protocol、KDF / AEAD / wrapping、Keychain / Keystore format、exact OS API、state machine、UI、Store detail、rollback、evidence timing は下流へ委譲されている                                                        |

Authentication、unlock、Account authorization および explicit approval は Common `CR-016` / `CR-AC-017` が全 Signer 共通に適用される。Mobile の `MR-005` / `MR-006`、`MR-AC-004` / `MR-AC-005` は background、termination、restart、lock、再認証および再表示による古い条件の無条件再利用を許さない。Deep Link、Relay または OS authentication の結果だけで署名承認を成立させる記述はない。

Security guarantee は Common `CR-NFR-013` / `CR-AC-019` のとおり、MosaicLynx が管理する Mobile Signer / 承認境界の正常動作範囲に限定される。OS 全体、device 全体、external app、browser、dApp、distribution artifact、App Store / Play 全体の完全 compromise まで防御する無条件保証は Mobile Requirements にない。

## 12. Domain Checks

| 観点                                    | 結果             | 根拠                                                                                                                                                                |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 要件完全性・目的                        | PASS             | Mobile Signer の目的、外部要求受信、確認・承認、OS / Relay / lifecycle / distribution の固有要求が MR-001〜MR-013 にある                                            |
| 利用者と責任                            | PASS             | 一般ユーザー、Mobile Signer、外部 app / browser、SDK / dApp、Relay、OS、wallet-core の責任が区別されている                                                          |
| Milestone / scope                       | PASS             | Android / iOS の個別判定、Browser → Android → iOS → Relay、片方の完了を v1 とみなさないこと、Relay 非署名、backup 条件付きが明確                                    |
| External input / trust boundary         | PASS             | sender、context、target、permission、integrity、freshness を検証前に信頼せず、URL / Intent / notification / Relay metadata を承認の唯一根拠にしていない             |
| SDK / dApp / Relay boundary             | PASS             | SDK は Signer 外部、Relay は受け渡しのみで、authentication、unlock、authorization、approval、署名条件を成立・更新・迂回しない境界を継承している                     |
| Authentication / unlock / authorization | PASS             | Common の四条件を継承し、lock / reauthentication、古い認証状態の自動復帰禁止、認証不能・wallet-core / OS failure の no-sign を MR-006 / MR-AC-005 で確認できる      |
| Confirmation / approval                 | PASS             | App-managed confirmation で対象、Chain、Network、Account、影響を確認し要求ごとに approve / reject。外部表示や handoff 情報だけを承認証拠にしていない                |
| Lifecycle / request integrity           | PASS             | background、停止、termination、restart、再表示後に sender / request / Chain / Network / Account / expiry / approval を再確認し、古い承認の自動再利用を禁止している  |
| Secret / wallet-core / OS               | PASS             | Wallet Store、Software Key、secret-dependent crypto、raw signing と Application / OS responsibility を分離し、Binding / storage / wrapping の具体方式は委譲している |
| OS protection claims                    | PASS             | 実行時に確認できた capability を越えて表示せず、iOS / Android 差異を相互に推測しない。Secure Enclave / StrongBox 等を wallet-core の自動保証としていない            |
| Backup / restore / migration            | PASS             | 提供する場合の復元対象・能力・保護状態の説明だけを要求し、v1 共通 MUST や Mobile 必須 capability に昇格させていない。端末固有鍵喪失時の過剰復旧保証もない           |
| Device loss / deletion / custody        | PASS             | 署名・復元能力の変化を誤認なく示し、管理者・運用者・MosaicLynx の secret 再発行・遠隔復旧・custody を v1 共通要求へ追加していない                                   |
| Screenshot / recording / notification   | PASS with RR-005 | SHOULD と platform policy の要求、完全防止を表示しない境界はある。後者の MR-AC 直接性を Minor 任意改善として記録した                                                |
| Distribution / update / Mainnet         | PASS             | Store / support、release evidence、Mainnet gate、Profile metadata、Account、dApp permission、opaque Wallet Store の更新保護が MR-013 / MR-AC-009 / 014 にある       |
| Acceptance Criteria                     | PASS with RR-005 | MR-AC-001〜014 が主要 MR の外部判定を可能にする。MR-011 の非保証表示だけ明示化を推奨するが、品質 gate を阻害しない                                                  |
| Interoperability / chain boundary       | PASS             | Common の Symbol / NEM、Mainnet / Testnet、transaction / message signing、blind signing 禁止、dApp 独立検証、announce 非担当を Mobile が弱めていない                |
| Requirements phase boundary             | PASS             | API、schema、crypto、OS API、Binding、storage、state machine、UI、Store procedure、test implementation を要求へ過剰転記していない                                   |
| Security guarantee boundary             | PASS             | 管理下 Mobile Signer / approval boundary の正常動作を中心とし、OS / device / external app / distribution の full compromise を無条件保証していない                  |

## 13. Validation Results

- Markdown formatter: `pnpm exec prettier --write docs/reviews/requirements/mobile-app-review-004.md` — 成功。
- Markdown format check: `pnpm exec prettier --check docs/reviews/requirements/mobile-app-review-004.md` — 成功。
- Repository 内リンク: 本文で参照した相対リンクの対象存在を確認 — 成功。
- Heading / anchor: 17 の正式セクション見出し、見出し階層および内部参照を確認 — 成功。
- Finding ID 重複: 現行 `RR-005` の宣言は一意。Common review の `RR-001〜RR-004` および過去の `MREQ*` は履歴参照として区別 — 成功。
- 既存レビュー非上書き: `mobile-app-review-001.md`〜`003.md` を保持し、新規 `004.md` を作成 — 成功。
- Source 非変更: `docs/requirements/mobile-app.md`、Common / Concept、下流資料、Skill、実装に差分なし — 成功。
- `git diff --check`: 成功。
- Repository-wide lint / typecheck / test / build: Not validated。Mobile 実装がなく、現行 Skill が要求していないため実行していない。

## 14. Review Gates

| Gate                | 判定 | 根拠                                                                                                                                                          | 対応 finding                     |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1. 目的と課題       | PASS | Mobile Signer が一般ユーザーの確認・承認可能な署名を提供し、Browser 後の Android / iOS milestone として位置付けられている                                     | なし                             |
| 2. 利用者と責任     | PASS | Mobile、外部 app / browser、SDK / dApp、Relay、OS、wallet-core の責任が分離されている                                                                         | なし                             |
| 3. 対象範囲         | PASS | Android / iOS 個別 milestone、外部 handoff、backup conditional、Relay / distribution 境界および対象外が明確                                                   | なし                             |
| 4. 要件と制約       | PASS | 外部入力、秘密情報、lifecycle、app lock、OS protection、wallet-core、Relay、Mainnet gate の MUST / SHOULD と OPEN が識別できる                                | なし                             |
| 5. 受け入れ条件     | PASS | MR-AC-001〜014 が milestone、入力検証、承認、再認証、secret、OS、backup、device loss、Relay、配布・更新を外部判定可能にしている。RR-005 は Minor の直接性改善 | RR-005 は任意改善で Gate は PASS |
| 6. 内部整合性       | PASS | MR、MR-AC、MR-OPEN、Traceability、対象外および Common / Concept の間に blocker となる矛盾がない                                                               | なし                             |
| 7. 不可欠な前提     | PASS | Common の署名前提、wallet-core、OS capability、Relay、release evidence を適切に継承・委譲し、未決事項も OPEN として管理している                               | なし                             |
| 8. コンセプト整合性 | PASS | 一般ユーザー中心、Signer / Relay 分離、Android / iOS 個別化、v1 境界、明示承認、秘密情報分離、announce 非包含と整合                                           | なし                             |

すべての Gate は PASS である。FAIL Gate はなく、Critical finding への対応付けもない。

## 15. Remaining Risks and Open Decisions

- `MR-OPEN-001〜008` は OS 対応、受信方式、OS / wallet-core Binding、認証、lifecycle、backup / migration、画面露出、Store / release 条件として管理されている。各決定時に、既存 MR / MR-AC の安全境界と traceability を維持する必要がある。
- Mainnet evidence の評価時点、期限切れ・失効・検証不能、Store 審査手順、OS version、rollback、配布 channel は下流 release / platform 設計の責任である。
- backup / restore / migration は提供を決めた場合のみ個別 platform / release の要件・仕様へ進み、端末固有鍵、復元対象、署名能力および OS protection を利用者へ誤認させない必要がある。
- `RR-005` の非保証表示は optional improvement であり、OS API や具体的 screen policy を本レビューから新規固定しない。
- Common review の `REQ4-001〜003` は Deferred / non-blocking として維持し、Mobile Requirements の blocker にはしない。
- Mobile App、Relay、SDK の復元後レビューは相互に独立しており、今回の判定を Requirements フェーズ全体の完了とは扱わない。

## 16. Automatic Changes

Source への自動変更はない。変更対象は本レビュー成果物 `docs/reviews/requirements/mobile-app-review-004.md` のみである。

## 17. Final Decision

`READY`

Mobile App Requirements は、Common Requirements を iOS / Android Mobile Signer 固有の責任、外部 handoff、OS protection、lifecycle、backup conditional、device loss、Relay、distribution および Mainnet gate へ具体化し、仕様・設計へ進められる品質である。`RR-005` は Minor の任意改善として記録する。

本判定は Mobile App Requirements に限定され、Requirements フェーズ全体、Relay、SDK または他の platform のレビュー完了を意味しない。
