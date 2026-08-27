# Architecture Design Review 004

## 1. Review Target

- 対象: [`docs/design/architecture.md`](../../design/architecture.md)
- 前回レビュー: [`architecture-review-003.md`](./architecture-review-003.md)
- Review ID: `architecture-review-004`
- 確認日: 2026-08-27
- 種別: `design-review` Skill による Architecture 再レビュー
- 変更範囲: 本レビュー成果物のみ。Architecture、要件、仕様、ADR、個別 Design、wallet-core、実装およびテストは変更していない。
- 主目的: 前回 `DR-001` / `DR-002` の修正確認、`AR-001` / `AR-002` の再発確認、および修正に伴う Critical / Major の重大回帰確認。

下流資料は Architecture の責務、用語、traceability および明白な矛盾の確認に限定して参照した。API、wire format、schema、concrete state machine、暗号パラメータ、DB / Redis schema、UI layout、platform API および実装構造の不足は、本レビューの Architecture finding としていない。

## 2. Execution Audit

最新の `design-review` Skill、共通 review playbook、reviewers、review gates、output format および `.agents/project-context.md` を確認した。サブエージェントは使用せず、playbook の Reviewer A〜D を独立した走査として実施した。

| Path                          | 確認内容                                                                                                     | 結果                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| A: structure / responsibility | Context、コンポーネント責務、依存方向、データ所有、Browser / Mobile / Relay / SDK / wallet-core の境界       | 主要責務と依存方向は成立。SDK / Relay / wallet-core の責任逆流なし        |
| B: security / trust boundary  | 共通署名ゲート、認証、unlock、Account authorization、explicit approval、secret、fail-closed、chain / network | `DR-001` の修正を確認。4条件は Browser / Mobile に共通適用される          |
| C: flow / operations          | 署名前再確認、approval / target binding、lifecycle、stale、失効、result unknown、結果返却、再起動・再試行    | 主要フローと安全側の結果条件は成立                                        |
| D: traceability / downstream  | Concept / Requirements、ADR、§17.1 の authoritative downstream、owner、委譲境界、open item                   | `DR-002` の修正を確認。各 Architecture-level 責務に一意の下流委譲先がある |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                             | 使用目的                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/architecture.md`](../../design/architecture.md)                                                                                                                                                                                                                                    | Review target。§1〜§18 の目的、範囲、Context、責務、trust boundary、secret、主要フロー、open item、§17.1 traceability を確認                       |
| [`docs/reviews/design/architecture-review-003.md`](./architecture-review-003.md)                                                                                                                                                                                                                 | `DR-001` / `DR-002` の初出内容と、今回の status 判定対象を確認。前回の Review Gate は今回の判定根拠に継承していない                                |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                | 目的、対象利用者、v1 milestone、Signer / Relay の責任境界、認証・Account authorization・明示承認の上流方針を確認                                   |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)                                                                                                                                                                                                                        | `CR-010`、`CR-011`、`CR-013`、`CR-015`、`CR-016`、`CR-NFR-003`、`CR-NFR-004`、`CR-NFR-013`、`CR-AC-017`〜`CR-AC-019`、`CR-OPEN-001` / `002` を確認 |
| [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                              | Browser caller context、privileged layer、permission、approval、lifecycle、wallet-core 境界および Mainnet gate を確認                              |
| [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)                                                                                                                                                                                                                            | Mobile host、auth / lock、handoff、Profile / Account、OS lifecycle、backup と wallet-core の責任境界を確認                                         |
| [`docs/requirements/relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                      | Relay の opaque transport、structural validation、stale / duplicate / state loss および `RR-OPEN-001` / `002` を確認                               |
| [`docs/requirements/sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                                                                          | SDK の非特権境界、Signer 非該当、auth / authorization / unlock の非代替、結果対応および SDK open item を確認                                       |
| [`docs/design/security-design.md`](../../design/security-design.md)                                                                                                                                                                                                                              | 共通 Trust Boundary、Lock / Authentication、Signing Authorization、Fail-Closed、Security Invariants と委譲先を確認                                 |
| [`docs/design/signing-flow.md`](../../design/signing-flow.md)                                                                                                                                                                                                                                    | Signing lifecycle、authorization / target binding、署名前再検証、結果検証および flow invariant を確認                                              |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                        | request / response の概念責務、各境界の validator / trusted authority、wallet-core / Relay / Signer の役割を確認                                   |
| [`docs/design/browser-extension.md`](../../design/browser-extension.md)                                                                                                                                                                                                                          | Browser Extension の privileged host、trusted UI、permission、lifecycle、wallet-core 境界を確認                                                    |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                        | Mobile trusted host、device authentication、OS lifecycle、handoff、wallet-core 境界および下流委譲を確認                                            |
| [`docs/design/relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                  | Relay の opaque / untrusted transport、structural validation、state loss、open item、下流委譲を確認                                                |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                      | SDK の非特権 integration、transport / correlation、Signer 非代替、open item、下流委譲を確認                                                        |
| [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)                                                                                                                                                                                            | Symbol / NEM、Mainnet / Testnet、chain-specific inspection、署名対象 bytes の正本と Architecture の境界を確認                                      |
| [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)                                                                                                                                                                                                    | Application Profile / Account、Network、署名時認証、backup / restore の具体化先を確認                                                              |
| [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                                    | SDK / Extension / Mobile / Relay handoff の下流責務、結果対応および具体契約の委譲先を確認                                                          |
| [`docs/specifications/product-spec.md`](../../specifications/product-spec.md)                                                                                                                                                                                                                    | Browser Extension の署名、Provider、chain / network、Mainnet gate の整合を確認                                                                     |
| [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)                                                                                                                                                                                                              | Mainnet release evidence の Lite gate と fail-closed 方針を確認                                                                                    |
| [`_snwc/README.md`](../../../_snwc/README.md)、[`wallet-core requirements`](../../../_snwc/docs/requirements/requirements.md)、[`wallet-core specification`](../../../_snwc/docs/specifications/specification.md)、[`Binding decision`](../../../_snwc/docs/decisions/binding-implementation.md) | wallet-core の Wallet Store、password、raw signing、固定 Binding、WASM / Native の境界、Application-level approval / authentication 非担当を確認   |
| [`Mainnet release evidence`](../../release/mainnet-release-evidence.md)                                                                                                                                                                                                                          | Architecture §17.1 の release evidence 委譲先、Mainnet capability の fail-closed と運用詳細の境界を確認                                            |

## 4. Review Result

**Review Gate: `READY`**

前回の `DR-001` / `DR-002` は、現在の Architecture 本文に基づき、それぞれ `RESOLVED` と判定する。共通 Signer gate は Browser Extension の privileged layer と Mobile App の trusted host に共通適用され、署名前の必須条件、再確認、fail-closed、結果返却時の安全側確認および外部主体による迂回禁止が Architecture-level に成立している。§17.1 は Architecture-level の責務・不変条件・open item を authoritative downstream、owner、委譲境界へ対応付けている。

新規 Critical / Major finding、`AR-001` / `AR-002` の再発、Trust Boundary・Security・責任分界の重大な逆流および Design フェーズ逸脱は確認されなかった。

## 5. Summary

- `DR-001`: `RESOLVED`。§6.9 に Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件を共通署名 gate として定義し、Browser / Mobile の owner、署名前再確認、fail-closed、結果返却条件、connection / permission の非代替、wallet-core の非担当範囲、dApp / SDK / Relay の迂回禁止を確認できる。
- `DR-002`: `RESOLVED`。§17.1 に共通 Security / Trust Boundary、共通署名 gate、Signing Flow、Interfaces、Browser Extension、Mobile App、Relay、SDK、Chain Compatibility、Profile / Account、wallet-core、Mainnet release evidence の authoritative downstream、owner、Architecture から委譲する詳細境界がある。
- `CR-016` と `CR-AC-017`〜`CR-AC-019` は、4条件の列挙と fail-closed を定める §6.9、Trust Boundary の §8、主要フローの §10、主要 Security 原則の §16、下流の共通 Security Design への委譲を通じて、共通署名 gate へ一意に追跡できる。
- `CR-OPEN-001` / `CR-OPEN-002` は、§17 の未決事項、§17.1 の Profile / Account 行および wallet-core 行へ追跡できる。Profile / Account 行は対応を担当し、隣接する wallet-core 行は `CR-OPEN-001` / `002` の host integration を除外しているため、責任境界は矛盾しない。
- Mobile、Relay、SDK の Architecture-level open item / responsibility は §17 と §17.1 の各 platform 行に対応付けられ、詳細な OS、transport、runtime、API、protocol、retry、UI および release 運用は下流へ委譲されている。
- `AR-001` / `AR-002` の再発はない。固定済み Binding method と host integration の未決範囲は分離され、Binding の API / data ownership boundary と WASM / host runtime の secret isolation も混同されていない。
- SDK は Signer ではなく、Relay は opaque transport であり、wallet-core は Wallet Store、秘密情報処理および raw signing の正本である。Browser Extension / Mobile App が Signer であり、dApp / SDK / Relay は trusted wallet context の外側にある責任分界を維持している。

## 6. Finding Status

| ID       | Severity | Status   | 初出レビュー              | 今回の判定                                                                                          |
| -------- | -------- | -------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `DR-001` | Critical | Resolved | `architecture-review-003` | `RESOLVED`。共通4条件、両 Signer owner、署名前再確認、fail-closed、結果返却条件および迂回禁止を確認 |
| `DR-002` | Major    | Resolved | `architecture-review-003` | `RESOLVED`。§17.1 の authoritative downstream / owner / delegation matrix と open item の対応を確認 |

今回初出の正式 finding はない。Finding ID の重複はない。

## 7. Required Changes

なし。Critical / Major の New、Open または Reopened finding はない。

## 8. Optional Improvements

なし。今回の範囲で、Minor 相当の新規探索を目的とする改善提案は追加していない。

## 9. Resolved Findings

| 過去 ID  | 状態       | 今回の確認                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DR-001` | `RESOLVED` | §6.3、§6.4、§6.9、§8、§10、§16 により、Browser Extension privileged layer と Mobile App trusted host の双方が、Authentication、Signing-capable unlock、Account authorization、Explicit user approval を署名前に再確認する共通 gate を管理する。未成立、locked、unknown、stale、失効または不整合では署名・成功結果返却を行わず、connection / permission、wallet-core password / Store 処理、外部主体の表示・配送成功を代替根拠にしない。 |
| `DR-002` | `RESOLVED` | §17.1 は、共通 Security / Trust Boundary、Signing Flow、Interfaces、Browser、Mobile、Relay、SDK、Chain Compatibility、Profile / Account、wallet-core、Mainnet release evidence をそれぞれ対応する downstream Design / Specification へ割り当て、owner と委譲境界を併記する。`CR-OPEN-001` / `002` の Profile / Account 対応と、wallet-core の host integration を除く境界も明示されている。                                             |

## 10. Deferred Findings

Architecture が明示的に下流へ委譲しており、今回の Architecture finding としない事項は次のとおりである。

- Provider API、公開 function signature、JSON / DTO / schema、wire format、version field、correlation identifier、具体的 error code、timeout および concrete state machine。
- Symbol / NEM の transaction type、aggregate、message format、canonical serialization、hash / signature bytes、parser および fixture の詳細。
- Authentication / unlock method、credential 保存、PIN / biometric / OS session、UI layout、Browser / Mobile platform API および host lifecycle の具体実装。
- Relay の HTTP / Redis、TTL、session / generation record、認証形式、storage、rate limit、retry と result retrieval の詳細。
- SDK の runtime support matrix、transport 選択、caller binding、version policy、transaction construction および公開 operation の詳細。
- wallet-core の Rust / Binding API、暗号処理、鍵導出、秘密情報の一時 lifecycle、ownership、error mapping および host integration の詳細。ただし v1 Binding method の固定判断と Application-level approval / authentication の責任境界は Architecture で維持されている。
- Mainnet release evidence の収集、署名、trusted key、build embedding、runtime enforcement、release checklist および strict policy 移行の運用詳細。

これらは未決または下流詳細であるが、共通署名 gate、secret isolation、Relay の opaque 性、SDK の非特権性、wallet-core の正本性および fail-closed を弱める根拠にはならない。

## 11. Scope and Traceability

| Architecture 領域                                                     | 上流・整合根拠                                                                                               | authoritative downstream / owner                                                                                                                                                                                           | 判定                                                                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| §1〜§3 purpose / scope / principles                                   | Concept の目的・v1 境界、`CR-001`〜`CR-016`、`CR-NFR-*`                                                      | Architecture 自身の高位原則。詳細は各 platform / common Design                                                                                                                                                             | Pass。Browser / Mobile / Relay / SDK / wallet-core の対象と対象外が明確                                                                          |
| §4〜§7 Context / components / dependency                              | `CR-011`、`CR-013`、`CR-015`、Browser / Mobile / Relay / SDK Requirements                                    | 各 platform Design、Interfaces、wallet-core external contract                                                                                                                                                              | Pass。Signer、SDK、Relay、dApp、wallet-core の依存方向と責任逆流の禁止が追跡可能                                                                 |
| §6.3、§6.4、§6.9、§8、§10、§16 共通署名 gate                          | `CR-010`、`CR-011`、`CR-015`、`CR-016`、`CR-NFR-003`、`CR-NFR-004`、`CR-NFR-013`、`CR-AC-017`〜`CR-AC-019`   | [`security-design.md`](../../design/security-design.md) §5、§7〜§8、§15、§17。Owner: Browser Extension privileged layer / Mobile App trusted host                                                                          | Pass。4条件、両 Signer 適用、署名前再確認、fail-closed、result 条件および外部主体の非権限を一意に追跡可能                                        |
| §6.3〜§6.9、§10〜§12                                                  | `CR-002`〜`CR-012`、Browser / Mobile / Relay / SDK Requirements                                              | [`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)。Owner: Signer と各 boundary owner                                                                                        | Pass。lifecycle、approval / target binding、request / response、結果対応の詳細委譲が成立                                                         |
| §13〜§16 Symbol / NEM、Mainnet / Testnet、local signing、release gate | `CR-005`、`CR-006`、`CR-NFR-005`、`CR-NFR-006`、ADR 0001                                                     | [`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)。Owner: chain integration / wallet-core、Release / Operation | Pass。chain / network の分離と Mainnet evidence gate を具体詳細へ安全に委譲                                                                      |
| §17、§17.1 CR-OPEN-001 / 002、Profile / Account                       | `CR-013`、`CR-014`、`CR-OPEN-001`、`CR-OPEN-002`、Mobile / Profile Requirements                              | [`profile-account-spec.md`](../../specifications/profile-account-spec.md)。Owner: MosaicLynx Application（host が適用）                                                                                                    | Pass。Profile / Account 対応、署名 Account authorization、backup の共通非包含を Application 側へ割り当て、wallet-core host integration と分離    |
| §17、§17.1 Mobile open item / responsibility                          | Mobile Requirements の `MR-OPEN-*`、`CR-010`、`CR-013`、`CR-NFR-006`                                         | [`mobile-app.md`](../../design/mobile-app.md)。Owner: Mobile App trusted host                                                                                                                                              | Pass。受信、auth、Profile / Account、trusted UI、OS lifecycle、Binding integration および platform 固有 open を下流へ委譲                        |
| §17、§17.1 Relay open item / responsibility                           | Relay Requirements の `RR-OPEN-001` / `002`、`CR-011`、`CR-NFR-*`                                            | [`relay.md`](../../design/relay.md)。Owner: Relay service                                                                                                                                                                  | Pass。opaque delivery、structural validation、short-lived state、stale / duplicate / state loss の高位責務を維持                                 |
| §17、§17.1 SDK open item / responsibility                             | SDK Requirements の `SDK-OPEN-*`、`CR-015`、`CR-011`                                                         | [`sdk.md`](../../design/sdk.md)。Owner: SDK / dApp-side integration layer                                                                                                                                                  | Pass。SDK を Signer にせず、request construction、correlation、transport abstraction、gate 非代替を下流へ委譲                                    |
| §17.1 wallet-core                                                     | `CR-013`、`CR-NFR-002`、`CR-NFR-004`、`CR-OPEN-001` / `002`、wallet-core external contract、Binding decision | [`_snwc/docs/specifications/specification.md`](../../../_snwc/docs/specifications/specification.md)。Owner: wallet-core（secret processing） / host adapter（integration）                                                 | Pass。Profile / Account の Application 対応を除き、Wallet Store、key、secret processing、raw signing、固定 Binding を wallet-core 側へ割り当てる |

§17.1 の各行は、Architecture-level の responsibility / invariant / open item について、下流の正本、owner、委譲境界を一つの表で確認できる。下流資料の API / schema / concrete state machine / cryptographic detail は Architecture の責務へ逆流していない。

## 12. Domain Checks

| Check                                                  | 判定 | 根拠                                                                                                                                                                 |
| ------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose / scope                                        | Pass | §1〜§3 が Browser Extension、Mobile、Relay、SDK、wallet-core の v1 構成、対象外および現在の Mobile 未実装状態を明示                                                  |
| Common Signer gate                                     | Pass | §6.9 が4条件を列挙し、Browser privileged layer / Mobile trusted host の共通 gate として定義                                                                          |
| Authentication / unlock / authorization separation     | Pass | §6.9、§8、§16 が Application-level authentication、signing-capable unlock、Account authorization、explicit approval と wallet-core password / Store 処理を分離       |
| Pre-sign revalidation / result safety                  | Pass | §6.9、§10 step 6〜9 が署名前再確認、target binding、wallet-core 呼び出し、結果対応確認および確認不能時の成功結果不返却を定義                                         |
| Fail-closed / lifecycle                                | Pass | locked、unknown、stale、失効、不整合、期限切れ、replay、duplicate、result unknown、restart / context loss を署名不可・旧承認不再利用へ接続                           |
| Trust Boundary / secret lifecycle                      | Pass | §8〜§9 が dApp、SDK、Provider、Content Script、Relay を外部・untrusted とし、wallet-core の論理 / API 境界と host runtime isolation の限界を分離                     |
| Browser Extension                                      | Pass | privileged layer が caller、permission、inspection、approval、gate、lifecycle、result を担い、Provider / Content Script に秘密情報を渡さない                         |
| Mobile App                                             | Pass | trusted host が handoff、Profile / Account、auth / lock、approval、gate、OS lifecycle、wallet-core orchestration を担う。Mobile 未実装を実装済みと扱っていない       |
| SDK                                                    | Pass | SDK は dApp 側の非特権 integration layer であり、署名、最終承認、Application auth / authorization、secret processing を担わない                                      |
| Relay                                                  | Pass | Relay は opaque transport / structural validation に留まり、semantic validation、approval、authentication、signing、announce を担わない                              |
| wallet-core                                            | Pass | Wallet Store、鍵管理、秘密情報処理、chain-specific key、raw signing の正本。UI、permission、Application-level auth / approval、transaction meaning は担わない        |
| Symbol / NEM、Mainnet / Testnet                        | Pass | §13 と §17.1 が chain-specific inspection、Chain / Network、Profile / Account、wallet-core contract、Mainnet evidence の境界を分離                                   |
| Binding / runtime isolation                            | Pass | §6.8、§8、§9、§15 が WASM `wasm-bindgen` / Native C ABI の固定と、WASM / JavaScript 同一 runtime の isolation 非保証を明記                                           |
| Downstream traceability                                | Pass | §17.1 が common security、signing flow、interfaces、platform、chain、Profile、wallet-core、release evidence を各 downstream owner へ対応付け                         |
| Architecture / Specification / Implementation boundary | Pass | API、schema、cryptographic parameter、concrete state machine、UI、platform API は下流へ委譲され、高位の gate / responsibility / invariant だけが Architecture に残る |

## 13. Validation Results

レビュー成果物の明示的なパスだけを formatter / format check の対象とした。Source 変更はないため、lint、typecheck、test、build は実施対象外とした。

- `pnpm exec prettier --write docs/reviews/design/architecture-review-004.md` — PASS
- `pnpm exec prettier --check docs/reviews/design/architecture-review-004.md` — PASS
- `git diff --check -- docs/reviews/design/architecture-review-004.md` — PASS
- Review 内のローカルリンク検証 — PASS。対象、前回レビュー、指定された downstream Design / Specification、wallet-core contract、ADR、release evidence の参照先が存在する。
- Finding ID 重複確認 — PASS。正式 finding は `DR-001` / `DR-002` の追跡のみで、新規 ID はない。
- Review Gate と finding status の整合確認 — PASS。`DR-001` / `DR-002` は Resolved、Required Changes はなし、Review Gate は `READY`。
- 変更範囲確認 — PASS。レビュー成果物以外の差分はない。
- `Not validated`: `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。レビュー成果物のみの変更で、Source の品質検証は対象外であるため。

## 14. Review Gates

| Gate                                                   | 判定 | 根拠                                                                                                            |
| ------------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------- |
| 1. Purpose / scope                                     | Pass | v1 の対象、対象外、現在の Mobile 未実装状態、Architecture と下流仕様の境界が明確                                |
| 2. Context / responsibility / trust boundary / secrets | Pass | §4、§6、§8、§9、§17.1 が外部主体、Signer、Relay、SDK、wallet-core、secret 境界を分離                            |
| 3. Dependency direction                                | Pass | §7 が domain、SDK、Extension、Mobile、Relay、chain integration、wallet-core の依存方向と逆流禁止を定義          |
| 4. Major flows and failure                             | Pass | §10〜§12 が受信、検証、inspection、approval、4条件 gate、署名、結果対応、stale / restart / unknown の責任を定義 |
| 5. Data ownership / retention / destruction            | Pass | §8〜§9、§12、§16 が opaque Store、秘密情報、session、Relay retention、host lifecycle の高位境界を定義           |
| 6. Security / interoperability                         | Pass | 共通 gate、fail-closed、Relay opaque、wallet-core 正本、Symbol / NEM および Mainnet / Testnet の分離を維持      |
| 7. Upstream consistency                                | Pass | `CR-016` / `CR-AC-017`〜`019` と §6.9 / §10 / §16、各 platform 要件および Security Design の対応を確認          |
| 8. Downstream implementability                         | Pass | §17.1 に authoritative downstream、owner、委譲境界があり、下位工程の詳細を Architecture に逆流させていない      |

## 15. Remaining Risks and Open Decisions

- `CR-OPEN-001` / `CR-OPEN-002` の wallet-core host integration、React Native 連携、秘密 byte の一時 lifecycle、OS 保護、error mapping および migration は下流設計の未決事項として残る。
- Mobile の受信方式、OS protection、認証方式、lifecycle、backup / migration、画面露出および platform release の詳細は、Mobile 要件・Design・release 資料で確定する。現在の workspace に Mobile 実装がないことは変わらない。
- Relay の handoff 契約、外部可視 failure 分類、retry / result retrieval、generation、retention、運用方式は Relay Design / Specification で確定する。
- SDK の aggregate / cosignature 公開範囲、transport 選択、transaction construction、runtime / distribution、version policy、caller binding は SDK Design / Specification で確定する。
- Symbol / NEM の対応 type、message、aggregate / multisig / cosignature、parser、serialization および固定 vector は Chain Compatibility Specification と下流実装レビューで確認する。
- Mainnet release evidence の収集、署名、trusted key、build embedding、runtime enforcement および strict policy への移行は release / operation で確認する。

これらは残存する下流決定または運用確認であり、今回の Architecture Review Gate を阻害する問題ではない。共通署名 gate、secret isolation、外部主体の非権限性、Relay の opaque 性、wallet-core の正本性および AR-001 / AR-002 の境界は維持されている。

## 16. Automatic Changes

なし。`docs/reviews/design/architecture-review-004.md` のみを新規作成し、Architecture 本文、要件、仕様、ADR、個別 Design、wallet-core、Source、テストおよび既存レビューを変更していない。

## 17. Final Decision

**`READY`**

`DR-001` / `DR-002` は現在の Architecture 本文に基づき `RESOLVED` と判定する。`AR-001` / `AR-002` の再発はなく、Trust Boundary、Security、責任分界の Critical / Major 問題および Design フェーズ逸脱も確認されなかった。Architecture Design は、指定された下流設計・仕様・release evidence へ進められる状態である。
