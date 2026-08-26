# MosaicLynx Browser Extension Specification Review

## 1. Review Target

- **対象:** [`docs/specifications/browser-extension.md`](../../specifications/browser-extension.md)
- **対象 revision:** `8c5f3cd`（2026-08-27 時点）
- **確認日:** 2026-08-27
- **成果物:** 本ファイル
- **レビュー種別:** Specification Review
- **使用 Skill:** `spec-review`
- **確認範囲:** Browser Extension Requirements、共通 Requirements、SDK Requirements、Browser Extension / Architecture / Security / Interfaces / Signing Flow / SDK Design、Interfaces / Signing Protocol / SDK / Relay / Web Transaction Handoff / Profile-Account / Chain Compatibility / Product Specification、現行 `@mosaiclynx/provider-api` の公開型・実装・テスト、および解決済み指摘の状態。
- **未確認範囲:** Chrome 実環境での caller observation、Extension 実装の runtime 挙動、Mainnet release evidence の実値、wallet-core の具体契約および未確定 OPEN の実装方式。本レビューではこれらを推測して補完していない。
- **変更範囲:** 対象 Specification、Requirements、Design、他の Specification、ADR、実装および既存レビューは変更していない。対象外の変更を操作対象に含めず、レビュー成果物のみを追加した。

## 2. Execution Audit

`spec-review` Skill の Phase 0–3 とレビュー共通手順を適用し、次の3視点を同一レビュー内で独立に走査した。サブエージェントは使用していない。

| 視点                                  | 確認内容                                                                          | 結果                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Reviewer A: Contract clarity          | Provider、Account projection、selector、error、state、入力・出力の一意性          | **Pass ではない**。`SR-001`、`SR-002`、`SR-003` を検出                            |
| Reviewer B: Requirements / operation  | Requirements / Design からの追跡、正常系・失敗系・lifecycle・timeout              | **Pass**。下記の上流契約差分を除き、実装可能な処理規則を確認                      |
| Reviewer C: Safety / interoperability | trust boundary、Origin、approval、authentication、chain、result unknown、公開情報 | **Pass ではない**。Account / error の公開契約衝突が安全性・相互運用性ゲートに影響 |
| Chair / final gate                    | 指摘の重複排除、severity、upstream return、最終判定                               | 完了。`REVISE SPECIFICATION`                                                      |

既存レビューは一次根拠としてではなく、`IS-001`、`SDK-001` 等の解消状態と、責任分界・委譲事項の継続を確認する補助資料として使用した。

## 3. Evidence Used

### 3.1 Requirements / Design

- [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md): BR-001〜BR-013、特に Chrome 初回 milestone、trusted UI、browser-observed Origin、top-level / loopback の受付範囲、permission、毎回の明示承認、lifecycle loss、wallet-core、Mainnet gate。
- [`docs/requirements/requirements.md`](../../requirements/requirements.md): 共通の inspection、blind signing 禁止、Profile / Account / Chain / Network、caller / permission、replay、fail-closed、wallet-core 境界。
- [`docs/requirements/sdk.md`](../../requirements/sdk.md): SDK と Signer / Provider の責任分界、公開 Account、Origin authority、signData と transaction signing、cosignature、error の下流委譲。
- [`docs/design/browser-extension.md`](../../design/browser-extension.md): Extension の privileged host、browser context、permission、Account、trusted UI、wallet-core の境界と lifecycle。
- [`docs/design/architecture.md`](../../design/architecture.md): コンポーネント責務、依存方向、Extension / SDK / Relay / wallet-core の境界。
- [`docs/design/security-design.md`](../../design/security-design.md): threat model、trust boundary、秘密情報、毎回認証、fail-closed。
- [`docs/design/interfaces.md`](../../design/interfaces.md): Public Account Identity、Internal Account Reference、Origin / permission、共通 request / error の責務。
- [`docs/design/signing-flow.md`](../../design/signing-flow.md): signing lifecycle、inspection、approval、pre-sign revalidation、unknown outcome。
- [`docs/design/sdk.md`](../../design/sdk.md): SDK の Provider adapter、公開 identity、transport / error / lifecycle の境界。

### 3.2 Specifications

- [`docs/specifications/interfaces.md`](../../specifications/interfaces.md): §5.3 の Public Account Identity、§8 の PermissionGrant、§9 の signing request、§10 の error authority、共通 lifecycle。
- [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md): `RECEIVED` から `SUCCEEDED` までの state、terminal outcome、approval、inspection、aggregate / cosignature、structured message、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`。
- [`docs/specifications/sdk.md`](../../specifications/sdk.md): SDK public API、Provider adapter、公開 identity、Account selector を含めない公開引数、error authority、cosignature の OPEN。
- [`docs/specifications/relay.md`](../../specifications/relay.md): Relay の opaque / transport boundary。Browser Extension の署名 authority へ拡張されていないことを確認。
- [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md): SDK / Extension handoff の public API、Provider adapter、`accountId` の公開禁止、concrete SDK error code、response semantics。
- [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md): Profile / Account の境界、lock、署名ごとの `every-signature` authentication。
- [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md): Symbol / NEM の別個の chain-specific validation、transaction allowlist、full parent、署名 bytes、cosignature。
- [`docs/specifications/product-spec.md`](../../specifications/product-spec.md): 接続 / permission、Account selector、署名、trusted UI、Provider の product-facing API。

### 3.3 Provider / implementation evidence

- [`packages/provider-api/src/index.ts`](../../packages/provider-api/src/index.ts): 現行 `MosaicAccount`、Provider method / event、RPC method、`ProviderErrorCode` の型と実装。
- [`packages/provider-api/package.json`](../../packages/provider-api/package.json): `@mosaiclynx/provider-api` が `private: true` であること、および公開型の package 配置。
- [`packages/provider-api/test/provider.test.ts`](../../packages/provider-api/test/provider.test.ts): Provider v2、scoped `getActiveAccount`、RPC method mapping。
- [`packages/sdk/test/sdk.test.ts`](../../packages/sdk/test/sdk.test.ts): SDK が Provider Account の `id` / `profileId` を公開 identity から除外すること、および Provider へ `accountId` を渡す現行挙動。
- [`packages/sdk/src/extension.ts`](../../packages/sdk/src/extension.ts): SDK の internal account selection と Provider `accountId` 呼び出し。
- [`packages/sdk/src/errors.ts`](../../packages/sdk/src/errors.ts): 現行実装の SDK error code 集合。これは仕様 authority ではなく、仕様との差分を確認する実装証拠として使用した。

### 3.4 Previous review evidence

- [`interfaces-review-002.md`](./interfaces-review-002.md): `IS-001` が Interfaces 側で解消され、Handoff §10 が concrete SDK error authority になったことの確認。
- [`sdk-review-002.md`](./sdk-review-002.md): `SDK-001` が解消され、Provider / Relay availability と SDK の責任分界が整合したことの確認。
- [`signing-protocol-review-001.md`](./signing-protocol-review-001.md): Signing Protocol の lifecycle、error authority、unknown outcome の前段レビュー状態。

## 4. Review Result

**REVISE SPECIFICATION**

`OPEN-BEX-001` と Provider error authority の衝突は、page-facing contract、selector、error mapping を一意に実装できず、上流の確定済み authority とも両立しない。さらに Product Specification の Provider method shape と現行 Provider / SDK / Handoff shape に差分がある。したがって、本 Specification を `BROWSER EXTENSION SPECIFICATION READY` として扱うことはできない。

一方、Origin / caller binding、trusted UI、connection / permission / approval / authentication の分離、trusted inspection、blind signing 禁止、wallet-core boundary、lifecycle invalidation、unknown outcome、Mainnet gate および scope boundary の安全条件には、追加の Critical 指摘は確認しなかった。

## 5. Summary

| 領域                                                | 評価       | 根拠 / 指摘                                                                                                                                                |
| --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements / Design 追跡                          | 適合       | BR-001〜BR-013 の Chrome、trusted UI、browser-observed context、permission、lifecycle、wallet-core、Mainnet gate を具体化している                          |
| Trust boundary                                      | 適合       | page / SDK / injected bridge / Content Script を untrusted、privileged host を caller・permission・UI authority、wallet-core を crypto boundary としている |
| Origin / caller                                     | 適合       | browser-observed top-level context を authority とし、page / SDK の Origin、iframe、unsupported scheme を authority にしていない                           |
| Connection / permission / approval / authentication | 適合       | connection、public disclosure、permission、unlock、毎回認証、approval、signing result を別状態としている                                                   |
| Account projection / selector                       | **不適合** | Provider package の page-facing型、Interfaces / Handoff の公開禁止、`accountId` の扱いが一意でない（`SR-001`）                                             |
| Provider method / event                             | 要上流整合 | 現行 package と対象文書は一致するが、Product §16 の `getActiveAccount()` / cosignature 記載が異なる（`SR-003`）                                            |
| Provider error                                      | **不適合** | `INVALID_MESSAGE` / `NONCE_REUSED` を含む現行集合と、Handoff / Interfaces の concrete authority が衝突（`SR-002`）                                         |
| Signing admission / state                           | 適合       | host-side revalidation、共通 state、explicit approval、pre-sign check を維持している                                                                       |
| Inspection / approval                               | 適合       | actual bytes / structured object、full parent、trusted UI、blind / hash-only / summary-only 禁止を定めている                                               |
| Lifecycle / concurrency / unknown                   | 適合       | document / tab / frame / worker / update / lock / permission 変更の invalidation、独立 request、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を定めている        |
| Chain / message                                     | 適合       | Symbol / NEM を分離し、structured message、aggregate、NEM multisig を共通化していない                                                                      |
| Mainnet / scope                                     | 適合       | gate 未達・判定不能時の Mainnet signing disabled と、Chrome / UI / storage / wallet-core の委譲を維持している                                              |

## 6. Finding Status

| ID       | Severity     | Status  | 初出レビュー | 状態根拠                                                                                                                                              |
| -------- | ------------ | ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SR-001` | **Critical** | **New** | 本レビュー   | `OPEN-BEX-001` は上流で解消すべき契約衝突であり、Browser Extension 内だけで安全に閉じられない                                                         |
| `SR-002` | **Critical** | **New** | 本レビュー   | Interfaces 側の `IS-001` は解消済みだが、Browser Extension Specification が Provider code 集合を再掲し、跨文書の error authority 衝突を再導入している |
| `SR-003` | **Major**    | **New** | 本レビュー   | Product Specification の Provider shape と現行 package / SDK / Handoff shape の差分。対象文書自身の選択は明確だが、上流契約の整合が必要               |

## 7. Required Changes

### SR-001 — Provider Account projection と `accountId` selector の authority が一意でない

- **対象箇所:** Browser Extension Specification §5.1–§5.2（Provider Account record と operation shape）、§10.1（Public Account identity と `id` / `profileId` 境界）、§32 `OPEN-BEX-001`。
- **既存要求・制約との関係:** Browser Extension Requirements BR-004 / BR-006、SDK Requirements SDK-FR-003 / SDK-FR-005、Interfaces §5.3 / §8 / §9.2、SDK §5 / §7 / §9、Handoff §5.2 / §6.1 は、page-facing public identity に internal Profile / Account ID を含めず、公開引数に extension `accountId` を含めない境界を要求している。一方 Product §11 は permission 内部の `accountIds` と request の `accountId` を記載し、Handoff §6.1 は SDK 内部 adapter が Provider に `accountId` を渡す手順を記載している。
- **問題:** 現行 `MosaicAccount` は `id`、`profileId`、`name`、`address`、`publicKey`、`scope` を持ち、`MosaicLynxProvider.connect()` / `getAccounts()` / `getActiveAccount()` はその型を返す。対象 Specification §5.2 は既存 Provider Account record を使うとしながら、§10.1 は `id` / `profileId` を page に公開してはならないとするため、宣言された Provider 型をそのまま返す実装と公開禁止の両方を満たせない。また、`accountId` が page-facing な selector なのか、SDK / privileged host 間だけの internal routing reference なのかが、Provider API、Interfaces、SDK、Handoff、Product の間で確定していない。
- `@mosaiclynx/provider-api` は現時点で `private` package であり、現行実装の存在だけで上流仕様を上書きできる normative authority とは扱わない。ただし、対象 Specification がこの package を既存 page-facing contract として参照しているため、実装上の衝突を解消しない限り安全な下位仕様にはならない。
- **影響:** `getAccounts()` / `getActiveAccount()` の返却型、`signMessage()` / `signTransaction()` / `cosignTransaction()` の selector、permission の Account binding、expected signer の解決、Profile 間の enumeration / correlation 境界を実装者が一意に決められない。誤って `id` / `profileId` を page に返すか、page が与えた selector を鍵選択・authorization の authority とする余地が残る。
- **必要な修正:** Browser Extension Specification だけで opaque handle の shape を発明せず、Interfaces §5.3 / §8、SDK §5 / §6、Handoff §5 / §6、Product §11、および Provider API contract へ返却し、次を同一 authority として確定する。
  1. page-facing Provider Account projection の exact field と、補助的な display label の扱い。
  2. `accountId` を page-facing input として許可するか、privileged host / SDK adapter 内部だけに限定するか。
  3. 公開 selector とする場合の opaque 性、scope、permission revision、Profile / Account binding、失効、誤指定時の公開結果。内部 reference とする場合の Provider adapter との境界。
  4. Provider package、Interfaces、SDK、Handoff、Product、Browser Extension の型・例・テストの相互整合。
- **完了条件:** Public Account Identity と Provider の page-facing result に `profileId` / internal `accountId` が含まれず、Provider method の入力にも internal ID を公開する曖昧さがない。Account 選択は current browser caller、permission、revision、Profile、Scope、expected signer と再検証され、selector の知識だけで signing authority にならない。SDK / Handoff の公開 API に extension `accountId` がなく、internal routing が必要な場合だけその境界が一意に定義される。

#### `OPEN-BEX-001` の明示判定

`OPEN-BEX-001` は、**READY のまま残せる OPEN ではない**。**Browser Extension Specification 内だけで修正可能な下位 OPEN でもない**。**Interfaces / SDK / Handoff / Product / Provider API contract へ返却して解消すべき、実装開始を止める Critical 相当の ERROR** である。現在の仕様の安全原則（internal ID を page に出さない、selector を authority にしない）は維持すべきだが、具体的な公開型・入力型・adapter 境界を上流が確定するまで、Provider 実装を開始してはならない。

### SR-002 — Provider error code と Handoff / Interfaces error authority が衝突している

- **対象箇所:** Browser Extension Specification §5.4、§27、および `packages/provider-api/src/index.ts` の `ProviderErrorCode`。
- **既存要求・制約との関係:** Interfaces §10.2 と Handoff §10 が concrete SDK / Handoff error code の authority を定め、`INVALID_MESSAGE` と `NONCE_REUSED` を公開 code に含めないことを明記している。SDK Specification §13.1–§13.2 も Handoff にない concrete code、alias、独自 taxonomy を追加しないとしている。前段の `IS-001` はこの authority へ統一する修正で解消済みである。
- **問題:** 対象 Specification §5.4 は「新しい code / taxonomy / alias を追加しない」としながら、現行 Provider package の `ProviderErrorCode` として `INVALID_MESSAGE`、`NONCE_REUSED`、`UNAUTHORIZED_ORIGIN`、`ACCOUNT_NOT_FOUND`、`UNSUPPORTED_CHAIN`、`RESOURCE_LIMIT` 等を列挙し、Handoff / SDK authority と併記している。Handoff §10 の集合にはこれらがなく、Provider code を page-facing concrete code として残すのか Handoff code へ変換するのか、変換の authority と unknown code の扱いが対象 Specification から決まらない。
- **影響:** dApp / SDK が受け取る code 集合と mapping が契約ごとに変わり、`INVALID_MESSAGE` / `NONCE_REUSED` のように確定済み authority が非公開とした code を page または SDK へ漏らす可能性がある。利用者拒否、permission denial、invalid、unsupported、expiry、context change、unknown outcome の区別も、実装者の独自 mapping に依存する。
- **必要な修正:** Provider API、Handoff §10、Interfaces §10、SDK §13 の上流で、Provider の concrete public error authority と Handoff への mapping を一つに確定する。現行 Provider code を page-facing に維持するのか、Provider 内部 code として分類して Handoff の code へ変換するのかを明示し、`INVALID_MESSAGE` / `NONCE_REUSED` の公開可否を Handoff / Interfaces と一致させる。Browser Extension Specification は新しい alias や都合のよい mapping を追加せず、確定した authority を参照する。
- **完了条件:** Provider / SDK / Handoff / Interfaces の public code 集合、mapping、unknown code の fail-closed 規則が一致し、Handoff §10 にない `INVALID_MESSAGE` / `NONCE_REUSED` が SDK / Handoff public error として返らない。Browser Extension の page-facing error はその authority の一意の契約に従い、internal Provider / wallet-core detail、stack、path、secret、ID を含まない。

### SR-003 — Product Specification と現行 Provider / SDK / Handoff の method shape が一致しない

- **対象箇所:** Browser Extension Specification §5.1–§5.2、Product Specification §16.1、`packages/provider-api/src/index.ts`、Handoff §5.1 / §6.1、SDK §5.1 / §9.3。
- **既存要求・制約との関係:** Browser Extension Specification は既存 Provider API に従い、新しい method / event を追加しないとしている。現行 package、SDK、Handoff は scoped `getActiveAccount(scope)` と existing / optional `cosignTransaction()` を持つ。一方 Product Specification §16.1 の公開 API 記載は `getActiveAccount()` に Scope 引数がなく、`cosignTransaction()` を列挙していない。
- **問題:** Product-facing Provider contract が現行 package / SDK / Handoff と同じ method set・signature を意味するのかが明記されていない。対象 Specification の `getActiveAccount(scope)` / `cosignTransaction()` は現行 package には適合するが、Product Specification の Provider API block を厳密な全量契約と読むと、scope の有無と cosignature method の扱いが衝突する。
- **影響:** Provider v2 の TypeScript interface、page adapter、capability 判定、cosignature の optional / required 範囲、Product acceptance を複数の解釈で実装できる。対象 Specification が Provider method を新規追加したのか、Product Specification の記載が省略なのかも判定できない。
- **必要な修正:** Product Specification、Provider API contract、SDK / Handoff の責任分界を一度上流で照合し、`getActiveAccount` の Scope 引数、`cosignTransaction` の存在と optional / required、API v2 の全 method / event 集合を確定する。Browser Extension Specification はその確定契約を参照し、Product と異なる method shape を独自に選択しない。
- **完了条件:** Provider v2 の method、argument、result、event、optional / required capability が Product、Provider package、SDK、Handoff、Browser Extension で同じ意味になり、Provider discovery / capability 判定と contract test がその集合を検証できる。なお、現行 package と対象 Specification の一致だけでは upstream discrepancy の解消とはみなさない。

## 8. Optional Improvements

Minor の新規指摘はない。UI framework、Chrome API の exact method、Manifest、storage engine、state management、file layout、test framework、formatting などの選択肢は、対象 Specification の scope boundary に従い指摘対象外とした。

## 9. Resolved Findings

- `IS-001`（Interfaces Specification の独自 error code と Handoff §10 の不一致）は、Interfaces §10.2 が Handoff §10 を authority とし、`INVALID_MESSAGE` / `NONCE_REUSED` を公開 code として扱わない形で解消済みである。本レビューの `SR-002` は、その解消済み authority を Browser Extension Specification が再び曖昧化した跨文書の新規指摘である。
- `SDK-001`（SDK availability と Mobile Relay route の意味）は SDK / Handoff の route authority に統一されており、Browser Extension の local Provider route について回帰は確認しなかった。
- Signing Protocol の common state、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、full inspection、approval、pre-sign revalidation および error authority の前段レビュー状態に対する回帰は確認しなかった。

## 10. Deferred Findings

次の Browser Extension OPEN は、対象 Specification が上流未決事項を独自確定せず、安全側の不変条件を固定しているため、実装前または対応する上流仕様で継続してよい。ただし、これらは `SR-001` / `SR-002` の解消を代替しない。

| OPEN                                                          | 判定            | 継続できる理由                                                                                            | 必須の安全側条件                                                                                                |
| ------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `OPEN-BEX-002` Provider discovery / multiple Provider         | 妥当な deferred | selection policy、capability identifier、compatibility matrix は SDK / Interfaces OPEN に委譲している     | API major 2、malformed / incompatible の fail-closed、自動 fallback 禁止                                        |
| `OPEN-BEX-003` frame / caller proof / Origin canonicalization | 妥当な deferred | 初回は top-level とし、exact Browser observation method を独自固定していない                              | browser-observed caller、iframe 拒否、一意に binding できない場合の拒否                                         |
| `OPEN-BEX-004` permission expiry / recovery                   | 妥当な deferred | expiry、persistence、recovery の方式を上流 OPEN に残している                                              | old approval / authentication / session の推測復元と automatic re-sign 禁止                                     |
| `OPEN-BEX-005` authentication / UI / update compatibility     | 妥当な deferred | every-signature、trusted UI、fail-closed だけを固定し、OS API / UI framework / migration を固定していない | `UNLOCKED`、connection、過去の authentication を署名承認とみなさない                                            |
| `OPEN-BEX-006` public aggregate / cosignature scope           | 妥当な deferred | Provider / SDK の required / optional scope と result field を上流へ委譲している                          | full parent、embedded / inner、role の inspection。Partial / hash-only / summary-only / chain conversion の禁止 |

`OPEN-BEX-001` はこの表には含めない。前節のとおり、同項目は deferred ではなく upstream blocking issue である。

## 11. Review Gates

| Gate                  | 判定     | 根拠                                                                                                                                       | 対応                                                            |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1. 目的と範囲         | **Pass** | Chrome Extension の利用者、trusted host、対象外（SDK implementation、Relay、Mobile、wallet-core internals、Chrome exact API 等）が明確     | なし                                                            |
| 2. 契約               | **Fail** | Provider Account projection / selector と concrete error authority が一意でない                                                            | `SR-001`、`SR-002`                                              |
| 3. 処理と例外         | **Pass** | admission、inspection、approval、authentication、pre-sign revalidation、terminal state、timeout / cancel、unknown outcome が定義されている | なし                                                            |
| 4. 内部整合性         | **Fail** | page-facing Provider 型と internal ID 禁止、Provider code と Handoff code の記載が同時成立しない                                           | `SR-001`、`SR-002`                                              |
| 5. 検証可能性         | **Fail** | Account の返却型 / selector visibility、Provider error の期待 code を一つの contract test にできない                                       | `SR-001`、`SR-002`                                              |
| 6. 安全性と相互運用性 | **Fail** | ID leakage 防止と error authority の実装判定が上流契約なしに確定しない                                                                     | `SR-001`、`SR-002`                                              |
| 7. 上流整合性         | **Fail** | Interfaces / Handoff の確定 authority、および Product / Provider package / SDK / Handoff の method shape と未整合                          | `SR-001`、`SR-002`。`SR-003` は non-blocking upstream follow-up |

## 12. Conformance and Remaining Risks

### 12.1 要件・trust boundary・caller

- **Chrome 初回 milestone:** BR-001 と整合。対象 Specification は Chrome を初回とし、具体的な最低バージョン・Manifest を固定していない。
- **Trusted Extension UI / anti-phishing:** BR-002 / BR-005、Security Design と整合。Origin、Account、Chain / Network、operation、target、signer role、impact を Extension 管理 UI で表示し、dApp title / favicon / label を authority にしていない。新しい branding requirement も導入していない。
- **Browser-observed caller / Origin:** BR-003 / BR-004、Interfaces §5.5、SDK Requirements と整合。page supplied Origin、SDK の `window.location.origin`、page proof、callback を最終 authority にせず、top-level browser context、tab / frame / document / generation と canonical Origin を binding している。
- **Origin allowlist:** HTTPS を基本とし、`localhost`、`127.0.0.1`、`[::1]` の loopback HTTP を開発用途として任意 port で許可し、通常 HTTP、`file:`、`data:`、opaque、browser internal、他の extension、iframe / child frame を拒否する。Requirements と整合し、Chrome API の exact method は固定していない。
- **Trust boundary:** page / SDK / injected bridge / Content Script は untrusted。Content Script は signer ではなく、privileged host が permission、inspection、approval、authentication、lifecycle、response authority を持つ。wallet-core は cryptographic boundary だが caller / permission / UI authority ではない。

### 12.2 Connection / permission / approval / authentication

- Provider availability、connection、public Account disclosure、permission、Profile `UNLOCKED`、request-specific authentication、approval、signing authorization、signing success を別状態としている。
- 未許可だが検証可能な request は connection request としてだけ扱い、connection / permission / unlock / authentication を signing approval としていない。
- Permission は Origin、Profile、Account set、Scope、Chain、Network、revision に binding され、revoke / revision / Profile / Account / Chain change 時に stale request / approval / authentication を無効化する。expiry / persistent recovery の exact policy を独自確定していない。
- `every-signature` は Profile Specification §20 と整合。Browser-specific biometric / WebAuthn の exact implementation は `OPEN-BEX-005` に残している。

### 12.3 Signing admission / state / inspection / approval

- Trusted host は requestId、operation、caller、Origin、document、Scope、Profile、Account、Chain / Network、permission revision、capability、expiry、payload、signer expectation、duplicate / replay、freshness を再検証する。SDK / dApp validation を authority にしていない。
- Signing Protocol の `RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` と terminal states を維持し、Browser operational state が common signing state を置換していない。
- Transaction / message bytes、Symbol Aggregate の parent と embedded / inner、NEM multisig の wrapper / inner / parent context を signer 自身が parse / validate / inspect し、同じ authoritative object を trusted UI に表示する。page summary、Node / Relay lookup、hash-only、summary-only、raw / blind fallback はない。
- Approval は caller / Origin、document、request、operation、Scope、Profile、Account、target / digest、signer role、expiry、permission revision、capability、inspection result へ bind され single-use。`AUTHORIZED → SIGNING` 直前にも caller、permission、Account、payload、approval、authentication、response recipient を再検証する。

### 12.4 Wallet-core / secret boundary

- wallet-core には raw page request を渡さず、trusted inspection、explicit approval、every-signature authentication、pre-sign revalidation 後の approved target と internal key reference だけを渡す責務境界になっている。
- Extension は wallet-core の crypto、KDF、key format、Wallet Store internals を再定義していない。wallet-core に caller、permission、approval UI の authority を移していない。
- private key、Mnemonic、password、Wallet Store plaintext、derived key、auth secret、wallet-core handle、credential、secret metadata は page / Provider / SDK / Content Script、URL、clipboard、logs、telemetry、error、diagnostics に出さない。stack trace、path、Profile ID、Account ID、raw approval、unnecessary full payload も page-facing error / diagnostics に出さない。

### 12.5 Aggregate / cosignature / structured message

- Symbol Aggregate の initial signing と cosignature を分離し、parent 全体と embedded / inner を確認する。NEM Multisig / Cosignature は Symbol Aggregate と変換していない。
- Partial を第三の common operation に追加せず、unsupported / incomplete parent を fail-closed にしている。`OPEN-BEX-006` の public scope は適切に deferred だが、scope 確定前に capability を enabled としてはならない。
- Provider `signMessage` と SDK `signData` を混同せず、`mosaiclynx.message.v1`、browser-observed Origin、Account、Chain / Network、purpose、nonce、issuedAt、expiry、request freshness、payload bytes を同じ authoritative structured message に binding している。raw arbitrary message fallback はない。

### 12.6 Lifecycle / navigation / worker / concurrency / response

- same-Origin reload でも document generation を変化として扱い、cross-Origin navigation、tab close / replacement、frame replacement、Provider / Content Script replacement、Profile / Account / permission / lock / Chain change で old approval を移送しない。
- Service Worker restart、Extension reload / update、browser restart 後に pending approval、authentication success、`SIGNING`、result、delivery correlation を推測復元しない。safe reconstruction 不能時は invalidation、signing outcome 不明時は `RESULT_UNKNOWN`、result 確定後 delivery 不明時は `SUCCEEDED + DELIVERY_UNKNOWN` としている。
- request は Origin / tab / document / account / permission が異なっても独立し、global approval、ambiguous batch、duplicate response による二重 resolve / signing を導入していない。response は requestId だけでなく operation、caller / document、session / lifecycle、Scope、Account、signer、role、target / digest、expiry と相関する。

### 12.7 Timeout / cancellation / error / release

- SDK timeout、Provider expiry、explicit rejection、UI close、cancellation、lifecycle loss、wallet-core crash、result unknown、delivery unknown を区別している。UI close / timeout を自動的に user rejection とせず、signing 中の不確実性を `RESULT_UNKNOWN` としている。
- `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を Signing Protocol の意味どおり分離し、不確実な結果で automatic re-sign をしない。
- Error authority 以外の領域は Interfaces（logical）、Signing Protocol（outcome）、Handoff（SDK / concrete）、Chain Compatibility（chain-specific）、wallet-core contract（internal）へ責務を返している。ただし Provider concrete code の衝突は `SR-002` でブロックしている。
- Mainnet gate 未達成または判定不能の build が Mainnet signing capability を提供しないことを定め、release implementation / evidence の exact mechanism を独自確定していない。

### 12.8 Scope boundary / new specification contamination

対象 Specification は SDK implementation、Relay implementation、Mobile、wallet-core internals、Chrome API exact calls、Manifest exact JSON、storage engine、UI framework、bundler、state management、file layout、test frameworkを確定していない。新しい Provider method / event / field、error taxonomy、signing primitive、secret API、raw signing fallback も意図としては追加していない。

ただし、現行 Provider code の集合を §5.4 で列挙したことが Handoff / Interfaces の concrete error authority と衝突し、Provider Account record を §5.2 で参照したことが page-facing ID 禁止と衝突している。これは「新規仕様を作らない」という宣言だけでは解消しない。

## 13. Final Decision

- **最終判定:** `REVISE SPECIFICATION`
- **指摘件数:** Critical 2、Major 1、Minor 0
- **主なブロッカー:** `SR-001`（`OPEN-BEX-001` の Account projection / selector authority）、`SR-002`（Provider error authority）
- **`OPEN-BEX-001` 判定:** READY のまま残せない。Browser Extension Specification 内修正だけでは不十分で、Interfaces / SDK / Handoff / Product / Provider API contract への上流返却が必要な、実装開始を止める Critical 相当の ERROR。
- **`SR-003` 判定:** 現行 package / SDK / Handoff と対象文書の選択は整合するが、Product Specification の method shape を上流で明示的に解消する Major follow-up。
- **結論:** `BROWSER EXTENSION SPECIFICATION READY` としては扱えない。SR-001 / SR-002 の upstream contract 修正、SR-003 の Provider method shape 整合後に再レビューする。

## 14. Validation

- 対象 revision、対象ファイル、関連 Requirements / Design / Specification、Provider package / source / test の存在と参照を確認した。
- Reviewer A / B / C の独立視点走査と、Chair による finding 重複・severity・gate の再確認を実施した。
- 既存レビュー（`IS-001`、`SDK-001`、Signing Protocol review）の解消状態と、対象 Specification の回帰を確認した。
- 対象 Specification、上流資料、Provider package、実装および既存レビューはレビュー中に変更していない。
- Markdown formatter: `pnpm exec prettier --write docs/reviews/specifications/browser-extension-review-001.md` 後に `pnpm exec prettier --check docs/reviews/specifications/browser-extension-review-001.md` を実施し、成功した。
- repository formatter: `pnpm format:check` を試行したが、リポジトリ全体（既存の `_nem` / `_sns` / `_symbol` / `_snwc` を含む）の大量の既存 warning と HTML syntax error が出力され、30 秒の実行枠内に完了結果を取得できなかった。対象成果物の個別 formatter check は成功している。
- whitespace check: `git diff --cached --check` を実施し、成果物由来の whitespace error はなかった。
- repository 全体の lint / typecheck / test / build: レビュー成果物のみの変更であり、Specification Review の実装検証対象ではないため実施しない。
- Chrome 実環境、Extension runtime、Mainnet release evidence、wallet-core integration の動作検証: **Not validated**。仕様の境界・委譲・fail-closed 規則のみを確認した。
