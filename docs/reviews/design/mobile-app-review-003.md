# MosaicLynx Mobile App 基本設計レビュー 003

## Review Target

- 対象: [`docs/design/mobile-app.md`](../../design/mobile-app.md)
- 確認日: 2026-08-28
- 成果物: `docs/reviews/design/mobile-app-review-003.md`
- レビュー種別: `design-review` の再レビュー
- 主目的: [`mobile-app-review-002.md`](./mobile-app-review-002.md) の `DR-001`〜`DR-005` の修正確認
- 判定根拠: 過去レビューの判定を継承せず、現行の Mobile App 基本設計と上流・共通・下流資料を再確認した。
- 変更範囲: レビュー成果物の新規作成のみ。設計本文、仕様、実装、既存レビューは変更していない。
- 対象境界: Mobile trusted host / Signer、handoff、4 条件署名ゲート、structured `MESSAGE_SIGN`、result binding、lifecycle、同時実行、wallet-core、backup / migration、Mainnet release gate、責務 traceability。
- Design フェーズ境界: exact Deep Link schema、Universal Link / App Link 設定、OS API、Keychain / Keystore API、notification API、DTO / JSON schema、exact message field / nonce / expiry、timeout / retry count、concrete state enum、storage schema、cryptographic parameter、concurrency algorithm、implementation class、exact UI layout は不足 finding の対象外とした。
- 未確認範囲: Mobile の実装、実機 OS 統合、実行時 enforcement、hardware matrix、release tooling の実装検証は行っていない。これらは現行設計が下位仕様・実装・運用へ委譲している範囲であり、今回の Design Gate の不足とは判定していない。
- `docs/specifications/mobile-app.md` は存在しない。Mobile 固有の不在仕様を finding にはせず、既存の共通 / handoff / Profile / Chain / wallet-core / release contract への委譲と追跡を確認した。

## Execution Audit

- 以下を読み、最新版を適用した。
  - `.agents/skills/design-review/SKILL.md`
  - `.agents/skills/review-common/review-playbook.md`
  - `.agents/skills/design-review/reviewers.md`
  - `.agents/skills/design-review/review-gates.md`
  - `.agents/skills/review-common/output-format.md`
  - `.agents/skills/design-review/output-format.md`
  - `.agents/project-context.md`
  - `AGENTS.md`
- サブエージェントは使用していない。Chair による以下 4 つの独立 self-review pass を実施した。
  - Pass A — 構造・責務・authority: trusted host、Signer authority、handoff source、Profile / Account、Relay / SDK / wallet-core の境界。
  - Pass B — security invariant: 4 条件ゲート、structured `MESSAGE_SIGN`、inspection、replay、pre-sign、result binding、fail-closed。
  - Pass C — flow・lifecycle・運用: process recreation、device lock、concurrent request、unknown result / delivery、fallback、Mainnet gate。
  - Pass D — traceability・下流委譲: requirements / common Design / ADR から Mobile 本文、downstream owner、detail delegation boundary までの直接対応。
- READY 済み共通 Design の過去 Review Gate は今回へ自動継承していない。各 Design 本文、要求、仕様、ADR、release contract と現行 Mobile 本文の整合を個別に確認した。

## Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                                                                                                  | 用途                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                                                                                                             | 現行 Mobile 基本設計、各修正箇所、§28 の責務 traceability を確認                                                             |
| [`docs/reviews/design/mobile-app-review-002.md`](./mobile-app-review-002.md)                                                                                                                                                                                                                                                                                                                          | `DR-001`〜`DR-005` の初出、要求内容、今回の status 対応を確認。判定は再利用していない                                        |
| [`docs/design/architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`browser-extension.md`](../../design/browser-extension.md)                                                                                                                 | 共通の authority、trust boundary、4 条件、signing flow、result、message、責務方向との整合を確認                              |
| `docs/reviews/design/architecture-review-004.md`、`security-design-review-004.md`、`signing-flow-review-004.md`、`interfaces-review-004.md`、`browser-extension-review-003.md`                                                                                                                                                                                                                        | 共通 Design の確認対象を特定するため参照。Review Gate は自動継承していない                                                   |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                      | Mobile、共通 signing、Relay、SDK の upstream requirement と acceptance を確認                                                |
| [`docs/design/relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                                                                      | Relay opaque boundary、SDK non-Signer、handoff / response / concurrency の owner を確認                                      |
| [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md) | structured message、署名 context、Profile / Account、handoff、Chain / Network、result / replay の downstream contract を確認 |
| [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)、[`docs/mobile/mobile-store-release.md`](../../mobile/mobile-store-release.md)、[`docs/release/mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)                                                                                                                                           | Mainnet release evidence gate、Testnet-only の現行運用、trust source と fail-closed を確認                                   |
| `wallet-core` の requirements / specification / Binding decision                                                                                                                                                                                                                                                                                                                                      | Store、password、Profile network、secret、raw signing、Binding の責務境界を確認                                              |
| `.agents/skills/*`、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`AGENTS.md`](../../../AGENTS.md)                                                                                                                                                                                                                                                                            | review procedure、phase boundary、repository の変更・検証・報告規約を確認                                                    |

## Review Result

`READY`

## Summary

現行の [`docs/design/mobile-app.md`](../../design/mobile-app.md) では、前回の `DR-001`〜`DR-005` に対応する高位設計判断が明記されている。Mobile trusted host が Signer-side orchestration の唯一の owner とされ、4 条件は独立した必須条件として同一 context に binding され、pre-sign と success result の双方で再確認される。

structured `MESSAGE_SIGN` は Mobile Signer 自身の inspection と trusted structured message model を中心に定義され、raw fallback、cross-source / cross-Origin、cross-domain、cross-purpose、expired / duplicate / replay を fail-closed で拒否する。Result は original request、verified handoff、signer identity、Profile / Account、Chain / Network、exact target、signing-time の 4 条件、approval / inspection、freshness、recipient / disposition に binding され、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN`、resend / lookup と re-sign が分離されている。

Mainnet capability は適用中の release policy / evidence gate 成立時だけ有効で、evidence の missing / mismatch / invalid / expired、signature verification failure、trusted key / source 不備、policy 判定不能、status unknown で無効化される。Testnet-only 継続も許容される。§28 は指定された責務単位を直接対応する traceability table として補強している。

新規 Critical / Major finding、重大な回帰、責務の逆流は確認されなかった。

## Finding Status

| ID     | Severity | Status   | 初出レビュー            | 今回の状態根拠                                                                                                                                    |
| ------ | -------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| DR-001 | Critical | RESOLVED | `mobile-app-review-002` | §4.1、§5.5、§12.3、§24 が Mobile host の唯一の orchestration ownership、独立した 4 条件、binding、pre-sign、fail-closed、result validation を明記 |
| DR-002 | Critical | RESOLVED | `mobile-app-review-002` | §5.6.1、§12.2.1 が structured `MESSAGE_SIGN`、同一 model、inspection、context binding、replay 防止、raw fallback 禁止を明記                       |
| DR-003 | Major    | RESOLVED | `mobile-app-review-002` | §8.3、§12.3、§14〜§15 が success result の全 binding、signing-time 4 条件、unknown / delivery、再署名禁止を明記                                   |
| DR-004 | Major    | RESOLVED | `mobile-app-review-002` | §3.3、§23.1、§24、§27 が Mainnet evidence gate の成立条件、無効化条件、Testnet-only、下位 detail 委譲を明記                                       |
| DR-005 | Minor    | RESOLVED | `mobile-app-review-002` | §28 が指定 17 責務について upstream、Mobile section、downstream contract / owner、detail delegation boundary を直接対応                           |

新規 finding: なし。今回の確認範囲で New / Open / Reopened の Critical / Major / Minor はない。

## Required Changes

なし。Critical または Major の New / Open / Reopened finding はない。

## Optional Improvements

なし。今回の修正確認範囲で Minor の New / Open / Reopened finding はない。

## Resolved Findings

### DR-001: RESOLVED

- 対象箇所: `docs/design/mobile-app.md` §4.1、§5.5、§12.3、§14、§16、§24〜§25。
- 確認事実: Mobile trusted host が唯一の Signer-side orchestration owner であり、`Authentication`、`Signing-capable unlock`、Profile / Chain / Network / Account に対する `Account authorization`、`Explicit user approval` の 4 条件を独立した必須条件として定義している。
- 各条件は同一 request / source status / verified handoff / session-generation / Profile / Account / Chain / Network / operation / exact target or trusted digest / freshness / inspection・approval context に binding される。どの条件も他の条件を含意せず、connection、permission、pairing、capability、session、ordinary `UNLOCKED`、previous authentication、OS / device unlock、biometric のみ、Account selection、SDK / Relay state、handoff metadata、wallet-core の password / Store validation / signing success などを代替にしていない。
- Mobile host が pre-sign で 4 条件を request ごとに再確認し、missing / stale / revoked / locked / unknown / mismatch なら wallet-core を呼ばず fail-closed とする。success result も signing-time の 4 条件を含む context validation 後だけ成立する。
- SDK、Relay、external app、OS metadata / adapter、wallet-core は gate を成立・変更・免除・迂回できない。これにより前回の authority、TOCTOU、fail-closed の不足は解消された。

### DR-002: RESOLVED

- 対象箇所: `docs/design/mobile-app.md` §5.6.1、§12.2.1、§16、§24。
- 確認事実: Mobile v1 の `MESSAGE_SIGN` は structured operation として扱い、Mobile Signer 自身が message を inspection する。trusted UI の表示内容と wallet-core signing input は同一の trusted structured message model から導出する。
- verified / unverified source status、verified handoff context、Profile、Account、Chain / Network、`operation = MESSAGE_SIGN`、domain、purpose、message content、nonce、issued / expiry、request freshness、message replay state、4 条件、approval context、inspection result、exact target / trusted digest が同じ context に binding される。
- parse failure、unknown、uninspectable、expired、duplicate、replay、cross-source / cross-Origin、cross-domain、cross-purpose は署名せず、arbitrary raw bytes、raw fallback、automatic operation upgrade、transport conversion を許さない。request-level と message-level の replay をともに検査し、pre-sign revalidation と result binding を適用する。
- exact schema、nonce format、serialization、expiry duration は Specification detail への委譲であり、今回の Design Gate の不足ではない。これにより前回の structured message、inspection、replay、blind/raw fallback の不足は解消された。

### DR-003: RESOLVED

- 対象箇所: `docs/design/mobile-app.md` §8.3、§12.3、§14〜§15、§22、§24。
- 確認事実: success は original request、request correlation、verified source / handoff context、signer identity、Profile、Account、Chain / Network、operation、exact target / trusted digest、signing-time の 4 条件、approval context、inspection result、freshness、result recipient / disposition を Mobile trusted host が安全に確認できる場合に限定される。
- context loss、stale、revoked、locked、source / signer / Profile / Account / Chain / Network / target mismatch、signing-time gate context unknown、result disposition unknown は success にしない。wallet-core password / Store / signing success だけでは Mobile success としない。
- known result の delivery failure は `DELIVERY_UNKNOWN` として resend / lookup の対象に限り、`RESULT_UNKNOWN` は署名結果自体が不明な状態として扱う。delivery failure を再署名の根拠にせず、既知 result の resend / lookup と re-sign を分離し、old request の自動再実行も禁止する。
- これにより前回の result binding、wallet-core success の過信、unknown / delivery の混同、自動再署名の不足は解消された。

### DR-004: RESOLVED

- 対象箇所: `docs/design/mobile-app.md` §3.3、§23.1、§24、§27、§28。
- 確認事実: Mainnet signing capability は、適用中の release policy / evidence gate が成立した場合にだけ有効化される。required evidence の missing / mismatch / invalid / expired、signature verification failure、trusted key / trust source の不備、policy 判定不能、gate status unknown では Mainnet signing を無効化する。
- OS unlock、biometric、hardware-backed capability、secure storage capability、App Store / Play Store 配布成功、App 起動成功、Relay connection、wallet-core signing success は Mainnet gate の代替ではない。gate 未成立時は安全な範囲で Testnet-only を継続できる。
- exact evidence format、runtime enforcement、OS integration、hardware matrix、release tooling は下位 detail へ委譲されているが、Mainnet gate の存在、失敗時の無効化、unknown 時の fail-closed は OPEN ではない。現行の公開 Mobile release が Testnet-only であることとも矛盾しない。
- これにより前回の Mainnet gate の高位判断と OPEN 境界の不足は解消された。

### DR-005: RESOLVED

- 対象箇所: `docs/design/mobile-app.md` §28。表は Mobile trusted host / Signer authority、verified handoff source authority、external app / SDK / Relay / OS metadata non-authority、4 条件 gate、Profile / Account authority、Account authorization、structured `MESSAGE_SIGN`、Chain / Network inspection、Aggregate / cosignature、lifecycle invalidation、concurrent request isolation、result binding、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、automatic fallback prohibition、wallet-core raw signing / secret boundary、backup / migration、Mainnet gate の 17 行を持つ。
- 確認事実: 各行に upstream requirement / common Design、Mobile 本文 section、downstream contract / owner、detail delegation boundary が直接記載されている。単なる資料リンク一覧ではなく、責務、security invariant、owner、下流委譲を一行単位で対応させている。
- Mobile 固有仕様の不在は finding にせず、既存の common / handoff / Profile / Chain / wallet-core / release contract へ下流責務を割り当てていることを確認した。
- これにより前回の broad link list による traceability 不足は解消された。

## Deferred Findings

正式な Deferred finding はなし。

現行設計が下位工程へ委譲している exact schema、OS API / secure storage integration、notification、DTO、exact nonce / expiry、timeout / retry、storage schema、cryptographic parameter、concurrency algorithm、implementation class、UI layout、hardware matrix、release tooling は、設計 invariant と owner が明確であるため今回の Required / Optional finding にはしない。Mainnet gate の有無、失敗時無効化、fail-closed は委譲せず現行設計で確定している。

## Scope and Traceability

Mobile 本文 §28 の直接 traceability table を再確認した。以下はその対応の要約であり、各責務の詳細な行は `docs/design/mobile-app.md` §28 を正本とする。

| 責務単位                                                                              | upstream requirement / common Design                                                     | Mobile 本文                      | downstream contract / owner                                                                                                          | detail delegation boundary                                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Mobile trusted host / Signer authority、verified handoff source authority             | CR-011、CR-016、MR-001〜MR-003、common Architecture / Signing Flow                       | §4、§4.1、§5.5、§7〜§8、§24〜§25 | Mobile trusted host; handoff spec / Profile-Account contract                                                                         | handoff field detail と OS invocation detail                         |
| external app / SDK / Relay / OS metadata non-authority                                | CR-011、CR-015、MR-001、Relay / SDK Design                                               | §3、§4.1、§7〜§8、§24〜§25       | Mobile host; Relay opaque owner; SDK non-Signer                                                                                      | transport / platform API detail                                      |
| 共通 4 条件 gate、Profile / Account authority、Account authorization                  | CR-016、CR-AC-017〜019、Profile-Account Design                                           | §4.1、§9〜§10、§12.3、§16、§24   | Mobile host; Profile / Account contract; wallet-core only key / Store owner                                                          | authentication / OS adapter / account persistence detail             |
| structured `MESSAGE_SIGN`、Chain / Network inspection、Aggregate / cosignature        | CR-007-MSG、CR-NFR-005、chain requirements / compatibility spec                          | §5.6、§5.6.1、§12.2.1、§20、§24  | Mobile Signer; Interfaces / signing protocol; Symbol / NEM adapters                                                                  | exact message schema / chain serialization / cryptographic parameter |
| lifecycle invalidation、concurrent request isolation                                  | MR-005〜MR-006、CR-NFR-003、common Signing Flow / Interfaces                             | §10、§14〜§15、§21〜§22、§24     | Mobile host; request / handoff contracts                                                                                             | state enum、storage schema、concurrency algorithm                    |
| result binding、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、automatic fallback prohibition | CR-NFR-008〜012、Relay / SDK requirements and Design                                     | §8.3、§12.3、§14〜§15、§22、§24  | Mobile host; handoff / Interfaces / Relay / SDK response owners                                                                      | DTO、retry count、concrete delivery mechanism                        |
| wallet-core raw signing / secret boundary、backup / migration responsibility          | CR-013〜014、MR-007〜MR-010、wallet-core requirements / specification / Binding decision | §5.7、§18〜§19、§24〜§25         | wallet-core owns Store / password / key / secret / raw signing; Mobile owns meaning / approval / orchestration; Profile backup owner | Binding conversion、backup envelope、storage / migration detail      |
| Mainnet gate                                                                          | CR-NFR-006、MR-013、ADR-0001、release evidence contract                                  | §3.3、§23.1、§24、§27            | release / evidence policy owner; Mobile capability gate enforcement                                                                  | evidence format、runtime / OS / hardware / tooling detail            |

この対応により、責務・security invariant・owner・下流委譲のいずれも資料リンクだけに依存せず追跡できる。関連する共通 Design の Review Gate はこのレビューの判定へ自動継承していない。

## Domain Checks

| 評価項目                                   | 結果 | 確認内容                                                                                                                                                                                  |
| ------------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| システムコンテキスト                       | PASS | Mobile は local trusted host / Signer、external app / Web / SDK / Relay / OS metadata は untrusted。Relay は opaque boundary。                                                            |
| 責務と依存方向                             | PASS | Mobile host が Signer-side orchestration owner。SDK / Relay / external app / OS / wallet-core から gate や approval への責務逆流なし。                                                    |
| 4 条件署名 gate                            | PASS | 4 条件を独立必須とし、同一 context binding、pre-sign 再確認、result validation、missing / stale / revoked / locked / unknown / mismatch の fail-closed を確認。                           |
| verified handoff と source authority       | PASS | verified handoff context を Mobile host が検証し、unverified source / metadata / self-declaration は authority にならない。                                                               |
| Profile / Account / Chain / Network        | PASS | Profile / Account authority と wallet-core identity を分離し、Chain / Network を inspection・表示・署名対象へ binding。Symbol / NEM、Mainnet / Testnet を混在させない。                   |
| structured `MESSAGE_SIGN` と blind signing | PASS | Mobile Signer の semantic inspection、同一 model からの UI / input 導出、raw / uninspectable fallback 禁止を確認。                                                                        |
| replay / duplicate / cross-context         | PASS | request-level / message-level replay、duplicate、expired、cross-source / Origin、cross-domain、cross-purpose を拒否し、freshness を再確認。                                               |
| Aggregate / cosignature                    | PASS | Aggregate / parent / embedded / cosignature と NEM-specific inspection を signer-side で扱い、hash-only / partial blind signing を許さない。                                              |
| lifecycle / process recreation             | PASS | background、device lock、process death、restart、cold start、session-generation 変更で旧 approval / authorization / context を再利用せず fail-closed。                                    |
| trusted UI / sensitive UI / secure storage | PASS | trusted foreground UI と semantic inspection を Mobile host の責務とし、secret / sensitive UI exposure、secure storage / OS protection の責任を混同しない。                               |
| wallet-core boundary                       | PASS | wallet-core は Store / password / key / secret / raw signing を所有し、UI、source、permission、device auth、meaning、approval、orchestration を所有しない。                               |
| concurrent request isolation               | PASS | request ごとに identity、source、session、expiry、Profile / Account、Chain / Network、operation、target、inspection、response channel を分離し、merge / reuse / overwrite しない。        |
| result binding / unknown state             | PASS | original request、correlation、signer、target、signing-time 4 条件、approval / inspection、freshness、recipient / disposition を binding。`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を分離。 |
| automatic fallback / re-sign               | PASS | old approval / auto-sign / auto-retry / automatic fallback を禁止し、known result の resend / lookup と re-sign を分離。                                                                  |
| backup / migration                         | PASS | backup / migration を common signing authority や wallet-core secret boundaryへ逆流させず、Profile / backup owner と Mobile lifecycle を分離。                                            |
| Mainnet / Testnet release operation        | PASS | evidence gate 成立時のみ Mainnet capability。指定された evidence / trust / policy failure と unknown で無効化し、Testnet-only 継続を許す。                                                |
| traceability / Design phase                | PASS | §28 の 17 責務行で直接追跡でき、下位 detail を設計不足とせず、設計本文に新しい API / schema / implementation を発明していない。                                                           |

## Validation Results

| 検証                                                                      | 結果          | 備考                                                                   |
| ------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `pnpm exec prettier --write docs/reviews/design/mobile-app-review-003.md` | PASS          | 成果物のみを整形                                                       |
| `pnpm exec prettier --check docs/reviews/design/mobile-app-review-003.md` | PASS          | 成果物の Markdown format を確認                                        |
| `git diff --check`                                                        | PASS          | whitespace error なし                                                  |
| Markdown link check                                                       | PASS          | 成果物内の repository-relative link の存在先を確認                     |
| finding ID 重複確認                                                       | PASS          | `DR-001`〜`DR-005` を一意に管理し、新規 ID なし                        |
| Review Gate と finding status の整合                                      | PASS          | 8 gate がすべて PASS、既存 5 finding がすべて RESOLVED、最終判定 READY |
| 変更ファイル範囲                                                          | PASS          | レビュー成果物以外の変更なし                                           |
| lint / typecheck / test / build                                           | Not validated | Source code を変更していないため、依頼条件に従い実行していない         |
| Mobile 実装 / runtime / 実機 OS / hardware matrix / release tooling       | Not validated | 現行 workspace に Mobile 実装はなく、Design が下位工程へ委譲する範囲   |

## Review Gates

| Gate                        | 結果 | 根拠                                                                                                                          | 対応 ID                |
| --------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1. 目的と範囲               | PASS | Mobile の Signer 範囲、対象外、Testnet / Mainnet 条件、下位 detail の phase boundary が明確                                   | なし                   |
| 2. コンテキストと責任       | PASS | trusted host、external / SDK / Relay / OS / wallet-core、secret、handoff、trusted UI の境界が明確                             | DR-001、DR-005         |
| 3. 依存方向                 | PASS | Mobile host が orchestration owner で、Relay / SDK / wallet-core から approval / gate への逆流がない                          | DR-001、DR-005         |
| 4. 主要フロー               | PASS | pre-sign、success、failure、replay、restart、duplicate、unknown、resend / lookup、re-sign の責任が明確                        | DR-001、DR-002、DR-003 |
| 5. データ所有               | PASS | Profile / Account、request context、secret、wallet-core Store、result、backup / migration の所有が分離                        | DR-001、DR-003、DR-005 |
| 6. セキュリティと相互運用性 | PASS | 4 条件、semantic inspection、blind signing 禁止、replay 防止、Symbol / NEM、Mainnet / Testnet、Relay / wallet-core 境界を維持 | DR-001、DR-002、DR-004 |
| 7. 上流整合性               | PASS | requirements、common Design、handoff / Profile / Chain contract、ADR、release evidence と重大な矛盾なし                       | DR-001〜DR-005         |
| 8. 下流実装可能性           | PASS | 各 invariant と owner を確定し、exact schema / OS / runtime / tooling 等は妥当な下位 boundary へ委譲                          | DR-002、DR-004、DR-005 |

## Remaining Risks and Open Decisions

- Mobile 実装、実機の process recreation / device lock、OS protected storage、hardware matrix、runtime enforcement、release tooling の実装・E2E 検証は未実施である。後工程では §24 の MUST invariant と §28 の owner を満たすことを確認する必要がある。
- exact handoff / message schema、nonce / expiry、storage、timeout / retry、OS API、cryptographic parameter、concurrency algorithm、UI layout は既存の specification / 下位工程の責務である。今回の Design Gate では高位 invariant と委譲境界のみを判定した。
- 現行公開 Mobile release は Testnet-only であり、将来 Mainnet を有効化する場合は適用中 release policy / signed evidence gate と trusted key / source の検証が必要である。gate 自体は OPEN ではない。
- 上記は残存する実装・運用リスクまたは下位決定であり、今回の修正による Critical / Major の設計不備ではない。

## Automatic Changes

なし。設計本文、仕様、実装、既存レビューは変更せず、本レビュー成果物のみ新規作成した。

## Final Decision

`READY`

`DR-001`〜`DR-005` はすべて `RESOLVED`。新規 Critical / Major finding、重大な回帰、Relay / SDK / wallet-core への責務逆流、lifecycle / concurrent isolation / result unknown / fallback の回帰は確認されないため、Mobile App Design を READY と判断する。
