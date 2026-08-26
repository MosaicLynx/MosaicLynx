# MosaicLynx SDK Specification Review

## レビュー情報

- 対象: [`docs/specifications/sdk.md`](../../specifications/sdk.md)
- 対象 revision: `1e651f9`
- 確認日: 2026-08-26
- レビュー種別: Specification Review
- 使用 Skill: `spec-review`
- 実施方法: `spec-review` Skill と `.agents/project-context.md` を適用した単独レビュー。SDK Requirements、SDK Design、Architecture、Security Design、Signing Flow、Interface Specification、Signing Protocol Specification、Web Transaction Handoff Specification、Chain Compatibility Specification、Profile / Account Specification および Product Specification を照合した。既存レビューは、解決済み指摘、責務分界および Specification への委譲事項の確認に限定して参照した。
- 変更範囲: 本レビュー成果物のみを新規作成した。対象 Specification、Concept、Requirements、Design、他の Specification、ADR および実装は変更していない。

## 総評

SDK Specification は、SDK を Web Application / dApp と trusted Signer の間にある非特権 integration layer として定義し、Provider discovery、capability / version、connection / permission、公開 Account、request construction、response correlation、concurrency、timeout / cancellation、local / remote handoff および error normalization の責務を具体化している。

SDK が Provider の存在・capability・connection・公開 Account・Relay delivery を approval や signing success とみなさないこと、SDK が Origin authority、permission authority、trusted presentation、authentication、raw signing または wallet-core の secret boundary を担わないことも明確である。Origin binding、Signer 側 validation、approval、signing lifecycle、結果不明、再署名禁止、Relay opaque boundary および sensitive error detail 非露出は上流契約と整合している。

また、公開 API、cosignature の optional / existing contract、capability identifier、version negotiation、permission lifecycle、timeout / cancellation の具体 policy、caller binding の concrete mechanism は、Handoff / Interface / Signing Protocol の authority または OPEN へ適切に委譲されている。今回確認した問題は、`isAvailable()` の可用性条件が文書内および Handoff の対応箇所で一意に定まらない点である。

## 判定

### REVISE SPECIFICATION

`isAvailable()` が Provider のない Mobile Relay 経路を利用可能と報告する条件と、Mobile Relay が release / feature flag により無効な場合の扱いが一意に定まっていない。公開 API の外部契約と transport 選択が食い違うため、修正後に次工程へ進める。

## 指摘一覧

| ID      | Severity | Status | 対象箇所                                                                     | 概要                                                                                                              |
| ------- | -------- | ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| SDK-001 | ERROR    | OPEN   | `docs/specifications/sdk.md` §5.1 行97、§6.2 行143、および Handoff §5.3 / §6 | `isAvailable()` の Provider なし・Mobile Relay 有効性・本番リリース無効条件が矛盾し、外部結果を一意に決められない |

### SDK-001

- **Severity:** `ERROR`
- **Status:** `OPEN`
- **対象箇所:** `docs/specifications/sdk.md` §5.1 の `isAvailable()` 定義、§6.2 の「対応 Provider が存在しない場合は `isAvailable()` を `false`」という規則。関連して [Web Transaction Handoff Specification §5.3](../../specifications/web-transaction-handoff-spec.md) と §6 の Mobile Relay 選択条件。
- **問題:** §5.1 は `isAvailable()` が「対応 Provider または既存の対応 handoff 条件」で `true` になると定め、Handoff §5.3 も Provider がなくても対応 mobile browser と必要 Web API / verified HTTPS App Link 条件があれば `true` と定めている。一方、対象 §6.2 は対応 Provider が存在しない場合に常に `false` とする。さらに対象 §6.2 / Handoff §6 は Mobile Relay 機能フラグおよび本番 v1.0.0 の受信アプリ公開前の無効条件を定めているが、これが `isAvailable()` の判定条件へ明示的に接続されていない。
- **根拠:** Handoff §5.3 の `isAvailable()` 条件、Handoff §6 の transport 自動選択、SDK Requirements `SDK-FR-001` / `SDK-PLAT-003` および対象 §5.1 / §6.2。Handoff は App のインストール済みを保証しない一方、選択可能な handoff 経路の条件を `true` の根拠としている。
- **リスク:** 実装者が、Provider のない mobile browser で `true` を返す実装と常に `false` を返す実装のいずれも選べる。前者では本番で無効な Mobile Relay を利用可能と誤報し、後者では有効化された remote handoff を利用不能と誤報する。これにより `isAvailable()` と実際の transport 選択、`UNAVAILABLE` の返却、SDK / dApp の UX および support matrix の意味が不一致になる。Provider がある場合の Extension 優先規則と、非対応 Provider を別経路へ silent fallback しない規則にも影響する。
- **推奨対応:** Handoff を authority として、`isAvailable()` が `true` になる条件を「対応 Provider が選択可能」または「対象 release で Mobile Relay が有効化され、対応 runtime / Web API / verified HTTPS App Link の条件を満たす」と一意に定義する。Mobile Relay の feature flag 無効、本番 release gate 未達または受信アプリ未提供時は、アプリのインストール有無を断定せず、選択可能な handoff 経路がないため `false` とするかどうかを Handoff 側で明示し、対象 §5.1 / §6.2 と一致させる。修正後も `isAvailable() = true` を connection、permission、approval、署名成功またはアプリのインストール済みの保証にしてはならない。
- **戻し先:** まず `docs/specifications/web-transaction-handoff-spec.md` §5.3 / §6 の可用性と release / feature flag の関係を確定し、その後 `docs/specifications/sdk.md` §5.1 / §6.2 を同期する。これは SDK 側だけで独自に決めるべき公開 policy ではない。

## 重点確認結果

### Public API / Provider / capability / version

`createMosaicLynxSDK`、`MosaicLynxSDKOptions`、`isAvailable()`、connection / account API、`signTransaction()`、`signData()` および `cosignTransaction()` の型と Promise semantics は Handoff §5.1 を参照している。`cosignTransaction()` は既存公開 contract の範囲として記述され、SDK v1 の必須 capability、Symbol / NEM 共通 capability または chain-specific scope として確定されていない。複数 Provider の選択 policy、capability identifier、version negotiation の exact representation も OPEN に残っている。

Provider discovery は global object の存在、自己申告 name / version / Origin または表示情報を trust anchor にせず、fake / malformed / conflicting / incompatible Provider を安全側に扱う。Provider detection、capability、connection、permission および approval の混同は確認されなかった。`SDK-001` はこの評価を変更するものではなく、availability の定義と実際の transport 選択条件の接続に限定される。

### Connection / Permission / Approval

connection、account/address disclosure、signing request、user approval、authentication および signing を分離している。SDK は permission authority ではなく、公開 Account cache や connection state を署名承認の代替にしていない。`connect()` の成功、`isConnected()`、`getActiveAccount()` および capability は signing approval や Account ownership の証明ではない。

### Signing / Interface / Signing Protocol 整合

`interfaces.md` の identifier、Scope、Account Identity、Origin、request / response、timestamp / expiry、serialization、validation および common error model を再定義せず参照している。`signing-protocol.md` の signer authority、state、approval binding、署名前再検証、terminal state、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN`、replay / duplicate および自動再署名禁止も維持されている。

`signData()` は既存の structured message / `SignedData` 契約を利用し、`messageExpiresAt` と `expiresAt` の未決差異を OPEN として保持している。Aggregate / cosignature / Partial / NEM multisig は共通 operation や共通 payload shape に独自統合されていない。

### Request / Response / Concurrency / Failure

requestId、operation、Provider / session context、Origin / caller、Scope、Account、signer、target、digest、protocol / generation、expiry および freshness を response correlation に使用し、stale / duplicate / replay / late / 別 request の response を成功適用しない。複数 request、Provider replacement、disconnect、page lifecycle、timeout、local cancellation、transport failure、result unknown および delivery unknown を区別し、自動 re-sign、古い approval の再利用、別 transport への silent fallback を禁止している。

`SDK-001` を除き、実装時に意味が一意に定まらない request / response、timeout / cancellation、error normalization の矛盾は確認されなかった。

### Error authority / sensitive detail

common logical category は `interfaces.md`、signing failure / result disposition は `signing-protocol.md`、concrete SDK / Handoff error code は Handoff §10 を authority としている。`INVALID_MESSAGE`、`NONCE_REUSED` 等の新規 public error code、独自 alias または taxonomy を追加していない。Relay HTTP structural rejection と SDK public error も分離されている。内部 stack trace、credential、secret、token、URL、parser / OS / crypto library 詳細を公開 error や diagnostics へ露出しない契約になっている。

## Trust Boundary / Security 評価

適合。SDK は Web Application / dApp と同じ非特権 context にあり、Provider response、Relay delivery、dApp display metadata、self-declared / SDK-observed Origin を trusted authority としない。Browser Extension / Mobile App が trusted caller context、permission、target inspection、trusted UI、approval、authentication および signing の最終 authority を保持する。

SDK compromise 単独で private key、Mnemonic、Wallet Store、device authentication data、session secret、Relay credential または wallet-core signing API へ到達できない。Relay は opaque transport のままであり、SDK は Relay を authorization、semantic validator、approval または result authority としない。unsupported、malformed、mismatch、replay、context loss および incompatible version は fail-closed で扱われる。

## 新規仕様混入の評価

主要な具体化は既存 authority との整合を確認した。

- requestId の 128-bit CSPRNG / base64url、sessionId、requestDigest、timestamp / expiry、structured message nonce は `interfaces.md` および Handoff の既存契約に基づく。
- Mainnet Mobile の HTTPS / 443、originProof、DNS rebinding / private / reserved address rejection は Handoff / Interface の既存契約に基づく。
- capability / permission の意味分離、common validation、compatibility および error authority は `interfaces.md`、`signing-protocol.md`、Handoff および上流 Design に基づく。
- `cosignTransaction()` の公開存在は Handoff の existing contract を参照し、必須 capability・対応 chain・milestone を本書で確定していない。

したがって、`SDK-001` 以外に、上流で未決の事項を SDK Specification 側だけで新規確定した混入は確認されなかった。

## Specification / Implementation 境界の評価

公開型・Promise semantics、responsibility boundary、validation、correlation、lifecycle、error authority および fail-closed 条件は実装可能な契約粒度にある。一方、Provider selection policy の exact shape、capability / version matrix、permission lifecycle、caller binding の concrete mechanism、cosignature public scope および timeout / cancellation の具体 policy は OPEN として適切に委譲されている。

`SDK-001` を解消すれば、実装者が `isAvailable()` の結果と Mobile Relay 選択条件について追加の公開 policy を推測する必要はなくなる。

## 未決事項の評価

対象 §21 の OPEN-SDK-001〜005 は、複数 Provider 選択、capability / version negotiation、timeout / cancellation / transport failure、cosignature public scope、runtime / caller binding / release compatibility に限定されている。これらを理由に connection を approval とみなすこと、Origin authority を SDK に移すこと、raw / blind signing、秘密情報 API または新規 error code を追加してはならないという制約も維持されている。

`SDK-001` は既存 OPEN の単なる implementation detail ではなく、公開 `isAvailable()` の意味を確定するために Handoff / release policy へ戻す必要がある論点である。

## 最終判定

- 指摘件数: `ERROR 1 / WARN 0 / NIT 0`
- 主要指摘: `SDK-001` — `isAvailable()` の Provider なし・Mobile Relay 有効化・本番 release 無効条件の不整合。
- Specification 内で修正可能な指摘: `SDK-001` の対象節の同期修正。ただし、先に Handoff §5.3 / §6 の authority を確定する必要がある。
- 上流へ戻す必要がある指摘: `SDK-001`。Handoff の availability と feature flag / release availability の関係を確定する。
- 最終判定: **REVISE SPECIFICATION**
- **SDK SPECIFICATION READY:** 不可。`SDK-001` 解消後に再レビューする。

## Validation

- 上流 traceability: SDK Requirements / Design、Architecture、Security Design、Signing Flow、Interface Specification、Signing Protocol Specification、Web Transaction Handoff Specification、Chain Compatibility Specification、Profile / Account Specification、Product Specification を照合した。
- 相対リンク: レビュー成果物から参照する対象 Specification、Handoff、Interfaces、Signing Protocol および上流文書のリンク先を確認対象とした。
- review ID: `SDK-001` は本レビュー内で一意であり、重複はない。
- 対象本文: `docs/specifications/sdk.md` はレビュー中に変更していない。
- Markdown / formatter: `pnpm exec prettier --check docs/reviews/specifications/sdk-review-001.md` を実施し、成功した。
- `git diff --check`: 実施し、成果物由来の whitespace error はなかった。
- repository 全体の formatter / lint / typecheck / test / build: レビュー成果物のみの変更であるため実装検証としては実施対象外とする。
