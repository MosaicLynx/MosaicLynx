# MosaicLynx Signing Protocol Specification Review

## レビュー情報

- 対象: [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)
- 対象 revision: `e675ec3`（レビュー開始時点）
- 確認日: 2026-08-26
- レビュー種別: Specification Review
- 使用 Skill: `spec-review`
- 実施方法: Signing Protocol と指定された上流 Design / Specification / Requirements を照合する単独観点別レビュー。前回 Interface Specification 再レビュー等は、解決済み責任分界と error authority の確認に限定して参照した。
- 変更範囲: 本レビュー成果物のみ。対象 Specification、Concept、Requirements、Design、他の Specification、実装および既存レビューは変更していない。

## 総評

Signing Protocol Specification は、[Signing Flow 基本設計](../../design/signing-flow.md) の lifecycle、authorization binding、target mutation 防止、Aggregate / cosignature / Partial / NEM multisig の責任分界、`RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` の分離を、実装可能な protocol semantics として一貫して具体化している。

共通 field、identifier、Scope、Origin、request / response、serialization、validation および error authority は [Interface / Data Model Specification](../../specifications/interfaces.md) を参照し、Handoff 固有の concrete error code は [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md) §10 を参照している。独自の公開 error code、wire error、message schema、chain byte rule、wallet-core API、Browser / Mobile / Relay transport を追加していない。

指定された state set、terminal state の reopen 禁止、署名前再検証、explicit approval と `every-signature` authentication の分離、opaque Relay boundary、secret isolation、fail-closed 方針はいずれも上流根拠と整合する。上流で未決の capability、version matrix、permission expiry、公開 Aggregate / cosignature scope、transport failure policy、wallet-core binding は OPEN のまま保持されている。

## 判定

### SIGNING PROTOCOL SPECIFICATION READY

新規 `ERROR` / `WARN` はなく、次工程へ進められる。

## 指摘一覧

新規指摘はない。

| Severity | 件数 |
| -------- | ---: |
| ERROR    |    0 |
| WARN     |    0 |
| NIT      |    0 |

## 重点確認結果

### 1. Design → Specification の整合

適合。[signing-flow.md](../../design/signing-flow.md) §5〜§7 の request context、operation、state machine、authorization、lifecycle loss、result disposition が、対象 §5〜§6、§19、§20 へ適切に具体化されている。Signer が最終 authority であり、Relay / SDK / Provider / dApp / Node の自己申告を最終判断に使わない境界も維持されている。

### 2. State Machine

適合。対象 §6 は上流と同じ次の state set を使用している。

```text
RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED

terminal:
REJECTED | FAILED | EXPIRED | CANCELLED | INVALIDATED | RESULT_UNKNOWN
```

- `AUTHORIZED → SIGNING` は target、context、approval、authentication、permission revision、capability および expiry の署名前再検証を必須としている。
- `SIGNING` 中に署名生成の成否を確定できない場合は `RESULT_UNKNOWN` とし、配送不明は `DELIVERY_UNKNOWN` に分離している。
- lifecycle loss、generation change、context change は古い Authorization を復元せず `INVALIDATED` とする。
- terminal state の reopen、同じ request / target の再署名、自動再試行を禁止している。
- `REJECTED` は明示的な利用者拒否、`FAILED` は確定した失敗、`EXPIRED` / `CANCELLED` / `INVALIDATED` / `RESULT_UNKNOWN` はそれぞれの意味に限定されている。

### 3. Approval / Authentication / Signing の分離

適合。§8 は request received、valid、permission exists、inspected、user reviewed、user approved、authentication succeeded、signing succeeded、response delivered を独立した事実として扱っている。connection、session、permission、`UNLOCKED`、過去の approval / authentication、Relay delivery success を署名ごとの明示承認または `every-signature` authentication の代替にしていない。

### 4. Authorization Binding

適合。§5.3、§8.4、§9.3 は、caller / Origin、session / generation、operation、Account、Chain / Network、permission scope / revision、Profile、protocol / capability、target、transaction context、inspection result、signer role、existing signature / cosignature、freshness / expiry を適用範囲に応じて binding している。request identity だけを authorization の根拠にせず、各 context の変更時に Authorization を失効させる。

### 5. Interface Specification との整合

適合。対象 §5.1、§7、§9、§15、§16、§17 は、`interfaces.md` の identifier、Scope、Account identity、Origin、request / response envelope、timestamp / expiry、serialization、common validation、message model、state および error model を再定義せず参照している。`requestId`、payload、`expectedSignerPublicKey`、`parentPayload`、`SignedTransaction` 等の operation-specific contract も Interface Specification と一致する。

### 6. Error Authority

適合。対象 §16.2 は logical failure category を `interfaces.md` §10.1 から、SDK / Web Handoff の concrete code と mapping を Handoff §10 から取得している。Handoff 固有 error code の union、numeric code、wire error、alias および新しい taxonomy を Signing Protocol 側で定義していない。

`permission_denied`、`invalid_request`、`inspection_failed`、`unsupported`、`duplicate_or_replay`、`cancelled`、`expired` および `RESULT_UNKNOWN` は、既存 logical category / state の意味として使用され、公開 code authority と混同されていない。`RELAY_REQUEST_REJECTED` も Relay HTTP の structural rejection として SDK 公開 error / signing outcome から分離されている。

### 7. Aggregate / cosignature / Partial / NEM Multisig

適合。

- Symbol Aggregate Complete / Bonded は outer と embedded transaction 全体を一つの transaction context として扱い、summary / transactions hash のみで署名しない。
- Aggregate 本体署名と既存 parent への cosignature を `TRANSACTION_SIGN` / `COSIGNATURE_SIGN` として分離し、Aggregate を新しい共通 operation にしていない。
- cosignature target は detached bytes 単体でなく、完全な parent context と selected cosigner / role の組である。hash-only、summary、Node / Relay / dApp lookup による parent 補完を拒否する方針は [Chain Compatibility Specification](../../specifications/chain-compatibility-spec.md) §4、[Product Specification](../../specifications/product-spec.md) §12 および Signing Flow §11 と整合する。
- Partial は第三の共通 signing operation ではなく、`TRANSACTION_SIGN` / `COSIGNATURE_SIGN` の chain-specific context として扱われる。
- NEM multisig は Symbol Aggregate と同一化せず、wrapper、inner transaction、role、hash、address、signing bytes および cosignature semantics を Chain Compatibility / wallet-core 下位契約へ委譲している。

### 8. Structured Message Signing

適合。対象 §15 は `interfaces.md` §9.4 を正本として参照し、message schema、JCS、encoding および `SignedData` を再定義していない。Origin、Account、Chain / Network、domain、purpose、nonce、issuedAt、message expiry、request-level freshness を binding し、request-level replay protection と signed-message-level nonce / expiry / domain protection を分離している。表示用 confirmation model と signing bytes は同じ structured message から生成され、raw / blind signing への fallback はない。

`expiresAt` と Handoff の `messageExpiresAt` の差異は `OPEN-001` として保持され、Signing Protocol が alias、変換、優先順位を独自確定していない。

### 9. Replay / Duplicate / Expiry / Cancellation

適合。duplicate request、conflicting request、replay、late delivery、expired request、stale generation、cancel、transport retry、result resend / retrieval を区別し、同じ Authorization の再利用、自動 re-sign、delivery success と signing success の混同を禁止している。`RESULT_UNKNOWN` 後は署名を推測して再実行せず、`SUCCEEDED + DELIVERY_UNKNOWN` では既存 result の再配送・照会だけを候補としている。

### 10. Security / Trust Boundary

適合。Signer が最終 authority とされ、untrusted input の再検証、explicit approval、`every-signature` authentication、target mutation / TOCTOU 防止、Origin / Account / Scope binding、replay resistance、fail-closed、secret non-exposure、Relay opaque boundary が維持されている。Node、dApp、SDK、Provider、Relay、外部 API の自己申告を署名判断の authority としていない。

### 11. Scope 境界

適合。Browser transport、Mobile Deep Link / OS lifecycle、Relay endpoint / storage、SDK public API、wallet-core 内部 API / cryptography、UI layout および実装 class / source layout は下位仕様へ委譲されている。一方で、共通 signing semantics、binding、state、result、failure、replay および approval boundary は後続仕様が再解釈しなくてよい粒度で定義されている。

### 12. OPEN Issues

`OPEN-001`〜`OPEN-007` は、Interface / Requirements / transport / platform / wallet-core の判断が必要な事項に限定されている。特に capability identifier、version matrix、permission expiry / revocation、公開 Aggregate / cosignature scope、transport failure policy、wallet-core binding は独自確定されていない。OPEN を理由に security invariant、explicit approval、fail-closed または secret isolation を緩和していない。

## Traceability 評価

主要な一次根拠は次のとおりであり、対象本文の §23 もこの関係を追跡可能にしている。

- lifecycle、authorization、target binding、Aggregate / cosignature / Partial、result disposition: [signing-flow.md](../../design/signing-flow.md)
- 共通 field、state、validation、serialization、logical error category: [interfaces.md](../../specifications/interfaces.md)
- concrete SDK / Handoff error code、Relay response、message handoff: [web-transaction-handoff-spec.md](../../specifications/web-transaction-handoff-spec.md)
- Symbol / NEM allowlist、parent、canonicality、signing bytes: [chain-compatibility-spec.md](../../specifications/chain-compatibility-spec.md)
- message signing、approval、transaction inspection、secret / lifecycle acceptance: [product-spec.md](../../specifications/product-spec.md)
- Profile lock と `every-signature`: [profile-account-spec.md](../../specifications/profile-account-spec.md)
- Trust Boundary、secret isolation、explicit approval、fail-closed: [security-design.md](../../design/security-design.md)

レビュー資料は一次根拠としてではなく、既存の責任分界と解決済み事項の確認に限定して扱われている。

## 基本設計粒度の評価

Signing Protocol Specification は、protocol-independent な signing semantics と chain-specific boundary を適切に分離している。実装者が state、transition、approval binding、result disposition、failure semantics、Aggregate / cosignature / Partial の扱いを推測する必要がなく、同時に transport endpoint、OS API、SDK method、wallet-core 内部 API、暗号実装および UI layout を固定していない。

上流で未決の事項は OPEN として残り、Interface Specification や Handoff の authority を複製していないため、下位仕様・実装へ進める契約粒度に達している。

## 最終判定

- 指摘件数: `ERROR 0 / WARN 0 / NIT 0`
- 主要指摘: なし
- Specification 内で修正可能な指摘: なし
- 上流へ戻す必要がある指摘: なし。既存 OPEN は対象上流で引き続き管理する。
- 最終判定: **READY**
- **SIGNING PROTOCOL SPECIFICATION READY**

## Validation

- 上流資料との traceability: Signing Flow、Interface、Security、Handoff、Chain Compatibility、Profile / Account、Product の該当節を照合。
- 相対リンク: レビュー成果物から参照する対象 Specification、上流 Design、Requirements、関連 Specification および既存レビューの存在を確認。
- review ID: 新規指摘なし。重複 ID なし。
- 対象本文: `docs/specifications/signing-protocol.md` に差分がないことを確認。
- formatter: 作成後に対象レビュー成果物へ Prettier check を実施。
- `git diff --check`: 実施。
- リポジトリ全体の formatter / lint / typecheck / test / build: レビュー成果物のみの変更であるため実施対象外。
