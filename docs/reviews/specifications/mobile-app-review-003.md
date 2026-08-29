# MosaicLynx Mobile App Specification 修正後再レビュー

## 1. Review Target

| 項目                 | 内容                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対象 Specification   | [`docs/specifications/mobile-app.md`](../../specifications/mobile-app.md)                                                                                                                                                     |
| 対象 revision        | `cca14ceed2bd04b1cce169329296ff58921cb6d5`                                                                                                                                                                                    |
| 前回レビュー         | [`mobile-app-review-002.md`](./mobile-app-review-002.md)                                                                                                                                                                      |
| 今回のレビュー成果物 | `docs/reviews/specifications/mobile-app-review-003.md`                                                                                                                                                                        |
| 確認日               | 2026-08-29                                                                                                                                                                                                                    |
| レビュー範囲         | 現行 Mobile App Specification 全文、MSR-001〜MSR-004 の completion condition、Requirements → Design → common Specification → Mobile-specific contract の追跡、security / interoperability / lifecycle / OPEN / phase boundary |
| 対象外               | Mobile App、Relay、SDK の runtime、実機、release evaluator の実行検証。今回の変更対象はレビュー成果物だけである。                                                                                                             |

対象 revision はレビュー開始時点の `main` の HEAD と一致していた。前回 revision `436ebf2b6649ed39b9f9a0d35bc89bab29158a04` との差分は、対象 Specification の `§18 Security Invariants` item 17 の payload 境界修正である。差分だけで判定せず、現行本文全体と normative source を再照合した。

## 2. Execution Audit

| 観点                                     | 実施内容                                                                                                                                                                                                      | 状態 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Chair / Phase 0                          | 対象 revision、変更範囲、artifact 衝突、repository instructions、Source of Truth、前回 finding history を確認した。                                                                                           | 完了 |
| Reviewer A: Contract の明確性と完全性    | scope、authority、input / output、response union、validation、serialization、error、state、OPEN、acceptance、phase boundary を現行本文と common Specification へ照合した。                                    | 完了 |
| Reviewer B: Semantics と運用適合性       | Requirements / Design traceability、Mobile host / Signer / UI / wallet-core / OS / SDK / Relay / dApp / release authority、lifecycle、failure、recovery、Mainnet / Testnet、OPEN を照合した。                 | 完了 |
| Reviewer C: Security と interoperability | Four Conditions、trusted inspection、TOCTOU、replay、state loss、secret boundary、E2E Relay boundary、`RESULT_UNKNOWN`、`deliveryDisposition`、serialization、Chain / Network 境界を adversarial に確認した。 | 完了 |
| Phase 2 / Chair synthesis                | MSR-004 の修正を反証し、MSR-001〜MSR-003 の回帰、修正に起因する新規 contradiction、field / state mismatch、security / interoperability regression を確認した。                                                | 完了 |
| Phase 3                                  | generic Review Gates と repository の docs-only validation policy を適用した。                                                                                                                                | 完了 |
| Sub-agent                                | 使用していない。上記3観点をメインエージェントが別々の確認パスとして実施した。                                                                                                                                 | —    |

## 3. Evidence Used

今回の判定は、前回レビューの結論を再利用せず、以下の現行資料を直接確認した。

- 対象本文: Mobile App Specification `§1.1`、`§4`、`§6`〜`§21`。特に `§12` の response union、`§15`〜`§18` の secret / observability / Relay 境界、`§19.3` の OPEN、`§20`〜`§21` の acceptance / traceability。
- 前回レビュー: [`mobile-app-review-002.md`](./mobile-app-review-002.md) は MSR-001〜MSR-004 の ID、finding history、completion condition の追跡に限定して参照した。前回の判定内容は今回の correctness の根拠にしていない。
- Requirements: [共通要件](../../requirements/requirements.md) `CR-001`〜`CR-016`、`CR-NFR-001`〜`CR-NFR-013`、共通 acceptance、[Mobile App 要件](../../requirements/mobile-app.md) `MR-001`〜`MR-013` / `MR-AC-*` / `MR-OPEN-*`、[Relay 要件](../../requirements/relay.md)、[SDK 要件](../../requirements/sdk.md)。Browser Extension requirements は共通 Signer / Interface / Security contract の整合確認に限って参照した。
- Design: [Architecture](../../design/architecture.md)、[Security Design](../../design/security-design.md)、[Signing Flow](../../design/signing-flow.md)、[Interfaces Design](../../design/interfaces.md)、[Mobile App Design](../../design/mobile-app.md)、[Relay Design](../../design/relay.md)、[SDK Design](../../design/sdk.md)。
- Common / related Specifications: [Interfaces](../../specifications/interfaces.md) `§6.3`、`§9.4`〜`§9.7`、`§10.3`、`§11`〜`§13`、[Signing Protocol](../../specifications/signing-protocol.md) `§7`〜`§13`、`§19`〜`§20`、[Profile / Account](../../specifications/profile-account-spec.md)、[Chain Compatibility](../../specifications/chain-compatibility-spec.md)、[Web Transaction Handoff](../../specifications/web-transaction-handoff-spec.md) `§5`、`§7`〜`§13`、[SDK](../../specifications/sdk.md)、[Relay](../../specifications/relay.md)、[Browser Extension](../../specifications/browser-extension.md)。
- Release / platform references: [ADR 0001](../../adr/0001-mainnet-evidence-lite.md)、[Mainnet release evidence](../../release/mainnet-release-evidence.md)、[Mobile store release](../../mobile/mobile-store-release.md)、[Mobile support](../../mobile/mobile-support.md)、[Mobile privacy](../../mobile/mobile-privacy.md)、`docs/evidence/evidence-policy.json`。
- Repository / review policy: [`AGENTS.md`](../../../AGENTS.md)、[`project-context.md`](../../../.agents/project-context.md)、最新の `spec-review`、`review-common`、reviewers、review-gates、output-format。これらは作業規約・review method・artifact policy として適用し、製品仕様の normative authority にはしていない。

直接確認した主要な共通契約は次のとおりである。

- Interfaces `§6.3` の `signed` / `dataSigned` / `resultUnknown` / `rejected` / `failed` union、`SignedTransaction { payload, hash, signerPublicKey }`、共通 exact state set、4条件、`RESULT_UNKNOWN`、`deliveryDisposition`。
- Handoff `§5.1` / `§5.2.1` / `§7.2` の SDK public result と Relay response の mapping、`§7.5` の Mobile Mainnet conditions、`§8` の E2E encryption、`§12` の diagnostics allowlist。
- Requirements / Signing Protocol / Relay Specification の secret non-exposure、Relay opaque boundary、trusted Signer-only result semantics、known-result recovery と re-sign の分離。

## 4. Review Result

`READY`

## 5. Summary

`§18 Security Invariants` item 17 は、前回の無限定な `raw payload` 禁止を、署名前の unsigned / untrusted request payload、内部処理用 raw bytes / payload、解析途中 buffer とその複製の不要な露出禁止へ限定した。同時に、common Specification が正常 response として要求・許可する public signed result は、既存 Handoff contract に従う normative response として SDK / dApp へ伝達できることを明記している。Relay への伝送は E2E encrypted response に限定され、Relay plaintext exposure も禁止されている。

現行 `§12`、`§15`、`§16`、`§18` と Interfaces / Handoff の直接照合により、public signed result を禁止せず、secret と observability / auxiliary output の複製は引き続き禁止する response boundary が成立している。`signed`、`dataSigned`、`resultUnknown`、`rejected`、`failed` の union、required public result、`deliveryDisposition` の関係も崩れていない。

MSR-001〜MSR-004 はすべて Resolved であり、新規 Critical / Major / Minor finding はない。Four Conditions、trusted inspection、Relay non-authority、`RESULT_UNKNOWN`、`deliveryDisposition`、known-result recovery、lifecycle invalidation、wallet-core / secret boundary、Mainnet fail-closed、Testnet-only continuation、OPEN および specification phase boundary に回帰は確認されなかった。

## 6. Finding Status

| ID        | Severity | Status   | 初出レビュー               | 今回の状態根拠                                                                                                                                                                                                                                                                                                                    |
| --------- | -------- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MSR-001` | Major    | Resolved | `mobile-app-review-001.md` | `§1.1` が文書順位ではなく contract ownership を authority の基準とし、common contract、Mobile-specific additional constraint、conflict 時の common authority、OPEN / cross-document issue の扱いを一意に定めている。`§12`、`§13`、`§17`、`§19`、`§21` もこの境界を維持している。                                                  |
| `MSR-002` | Major    | Resolved | `mobile-app-review-001.md` | `§16` が log / warning / exception / diagnostics / analytics / telemetry / crash report / support output / Relay metadata 等の auxiliary output と normative Handoff response を分離し、common public result を正常 response に含められる一方、observability への複製を禁止している。                                             |
| `MSR-003` | Minor    | Resolved | `mobile-app-review-001.md` | `§9.3`、`§13.1` が `AUTHENTICATING` を Mobile App 内部だけの local UI / authentication substep とし、common state、public / wire / response field、Relay、SDK、persistent common state、common transition から除外している。Authentication は Four Conditions の一つとして維持される。                                            |
| `MSR-004` | Major    | Resolved | `mobile-app-review-002.md` | `§18` item 17 が secret、不要な public identity、unsigned / intermediate raw representation と normative public signed result を分離し、common field / shape は common Specification に委譲した。正常 public result の SDK / dApp 伝達、observability 複製禁止、Relay E2E encrypted response / plaintext 禁止を同時に確認できる。 |

新規 finding はない。したがって `MSR-005` 以降の ID は発行していない。

## 7. Required Changes

なし。現行本文に未解消の `Critical` または `Major` finding はない。

## 8. Optional Improvements

なし。今回の全文再レビューで、gate を阻害する `Minor` / `Nit` finding も採用していない。

## 9. Resolved Findings

### `MSR-001`: authority precedence の自己矛盾 — Resolved

現行 `§1.1` は、authority を文書全体の順位ではなく contract ownership で決める。共通 request / response、common field / state、error、signing result、`RESULT_UNKNOWN`、`deliveryDisposition`、serialization、Chain / Network semantics、Profile / Account semantics、Handoff、version / capability、release / evidence は、それぞれを所有する common Specification / policy が authority である。Mobile は Mobile-specific lifecycle、trusted host、platform boundary、validation、trusted UI、additional restriction、fail-closed condition を common contract と両立する追加制約として定めるだけで、override しない。

`§1.1` は conflict 時に Mobile 側で選択・上書きせず、common Specification を authority とし、未解決の conflict を OPEN / cross-document issue として扱い、解消まで独自 field / state / error / version / capability を追加しないと定める。`§12` は common response union、`§13.1` は common exact state set、`§17` は release authority、`§19` は error mapping / delegation / OPEN、`§21` は Requirements → Design → existing Specification の traceability を維持している。completion condition を満たす。

### `MSR-002`: diagnostics 禁止が normative response を禁止 — Resolved

現行 `§16` は禁止対象を observability / auxiliary output と定義し、normative Handoff response と SDK / dApp へ伝える public result をその禁止対象から除外する。既存 contract が要求・許可する場合に限り、request correlation、signed transaction / signed data、signature、hash、signer public key、public Account identity、`deliveryDisposition` 等を正常 response に含められる。一方、同じ public result を log、diagnostics、telemetry、crash report、support output 等へ複製することは禁止される。

`§12.1` は `signed` / `dataSigned` / `resultUnknown` / `rejected` / `failed` を既存 Handoff union に限定し、`§15.1` と `§16` は response に secret を含めない。Interfaces `§6.3` / `§9.6` および Handoff `§5.2.1` / `§7.2` の required public result と同時に成立するため、completion condition を満たす。

### `MSR-003`: `AUTHENTICATING` の Mobile local substep 境界 — Resolved

`§9.3` は request / signing lifecycle の表から `AUTHENTICATING` を除外し、`§13.1` は common exact state diagram を `RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` と明示する。`AUTHENTICATING` は `AWAITING_USER` と `AUTHORIZED` の間の Mobile local UI / device authentication / user-presence substep であり、common state、public state、wire state、response field、Relay state、SDK contract、persistent common state に serialize / expose しない。

local authentication が失敗、stale、revoked、locked または context mismatch となった場合は common failure / terminal semantics に従い、old Authentication / authorization を再利用しない。Authentication 自体は `§7.1` の Four Conditions の独立条件であり、completion condition を満たす。

### `MSR-004`: `§18` の `raw payload` 禁止と normative signed response の境界 — Resolved

現行 `§18` item 17 は、Mnemonic、private key、derived secret key、Profile password、decrypted Wallet Store、E2E secret、transport secret / credential、internal key reference、secret-bearing intermediate buffer、authorization secret、不要な public identity を external channel、Relay、SDK、log、diagnostics、persistent plain storage へ漏らさないと定める。これは共通 Requirements の secret boundary と一致する。

同 item は、署名前の unsigned / untrusted request payload、内部処理用の intermediate raw bytes / payload、解析途中 buffer とその複製を、normative response に必要な public signed result でない限り、external channel、SDK、Relay、log、diagnostics、telemetry、crash report、support output、persistent plaintext storage へ不要に露出しないと限定する。そのうえで、common Specification が正常 response として要求・許可する public signed result は、既存 Handoff response contract に従う normative response として SDK / dApp へ伝達でき、具体的な field 名、必須性、shape は common Specification が authority で本書は新しい response field を追加しないと定める。

この exception は §16 の observability 許可ではない。`§16` は normative response の全体または signed payload、transaction、hash、public key、address、requestId 等を observability / auxiliary output へ複製することを禁止する。さらに `§18` item 17 は Relay への伝送を既存 Handoff の E2E encrypted response に限定し、Relay に plaintext の transaction、message、signed result を公開しないと定める。

直接照合した Interfaces `§6.3` / `§9.6`、Handoff `§5.1` / `§5.2.1` / `§7.2` により、`signed` は `signedTransaction`、`dataSigned` は `signedData`、`resultUnknown` は signed result / `deliveryDisposition` なし、`rejected` / `failed` は success result なしという union が成立する。よって MSR-004 の completion condition を満たし、Major finding は解消した。

## 10. Deferred Findings

正式な未解消 finding はない。`§19.3` の既存 OPEN は、今回の対象本文の defect ではなく、別 authority または下位仕様で決定すべき未決事項として Deferred のまま保持されている。

現行 `§19.3` は、前回レビュー対象から OPEN を追加・削除・close・意味変更していない。保持されている主な項目は次のとおりである。

- `MOB-OPEN-001`〜`008` / `MR-OPEN-001`〜`008`: platform support / distribution、追加 Deep Link・source proof、wallet-core Binding / OS wrapping、authentication policy、pending / reconnect / recovery、backup / migration、privacy policy、Mobile release evidence matrix。
- `MOB-OPEN-009`、common `OPEN-006`、`OPEN-SDK-004`: Aggregate / Partial / Symbol / NEM cosignature の公開 operation、supported scope、result contract、SDK capability。
- common Interfaces `OPEN-001`〜`OPEN-005`、`OPEN-RELAY-003` / `OPEN-RELAY-004`、SDK / Handoff の対応 OPEN: message expiry field、capability / version negotiation、permission expiry / revocation identifier、caller context、reconnect / retry mapping 等。

これらは既存 Requirements / Design / Specification で未決または下位 authority へ委譲されており、Mobile Specification が独自 field、state、error、version、capability、blind signing、approval 省略、old authorization reuse、Relay authority または fail-open recovery を導入する理由にはなっていない。

## 11. Scope and Traceability

### Authority / responsibility

`§1.1` と `§4` は、Application / UI、Mobile trusted host / Signer、trusted approval UI、chain integration、wallet-core、OS / platform、SDK、Relay、dApp / Web page、release authority を区別している。Mobile trusted host は Mobile 経路の request validation、Profile / Account、trusted UI、Four Conditions、lifecycle、wallet-core orchestration、result validation の authority だが、common response / state / error / serialization / release contract を上書きしない。

`§9` は Relay を opaque / untrusted transport とし、Relay の structural validation と Mobile の E2E、Origin、semantic、Account、approval、署名検証を分離する。`§12`、`§14`、`§17` は、それぞれ Signer-originated result / disposition、lifecycle recovery、release gate の authority を Relay / SDK / OS / wallet-core と混同しない。

### Requirements → Design → Specification

`§21` の traceability table は、scope / responsibility、trust boundary / Relay、Profile / Account / Network binding、Four Conditions、inspection、handoff、result / delivery、lifecycle / state loss、secret / wallet-core、Mainnet gate を Requirements、Design、existing Specification へ対応付けている。MSR-004 の修正も `§21` の「共通 schema、公開 API、error code、Chain-specific byte 列、Relay endpoint を独自再定義しない」という境界と整合する。

Browser Extension Specification は共通 Signer / Interface / Security contract の整合確認に限って扱われ、Browser 固有の caller、Chrome API、Provider UI、storage 契約を Mobile に要求していない。

### Phase boundary

`§1`〜`§2` は source code、class / file 構造、framework / library / database 選定、CI/CD、deployment procedure、test implementation を対象外とする。`§19.2` は UI layout、OS API call、Native / WASM host integration、buffer ownership、zeroization、secure storage adapter、database / storage library、queue algorithm、lifecycle hook、error presentation を implementation choice / 下位仕様へ委譲する。

本仕様が固定するのは、実装・検証・相互運用に必要な state、transition、validation、failure semantics、lifecycle、request / response mapping、security invariant、acceptance criteria と、既存 Handoff / Chain / release contract の Mobile 適用である。React Native / Expo 等の framework、database / library、class / module / file、CI/CD、deployment、test implementation を固定していないため、phase boundary の逸脱はない。

## 12. Domain Checks

| Check                                               | 判定                | 根拠                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose / scope / phase boundary                    | **Pass**            | `§1`〜`§2`、`§19.2` が Mobile 固有の external behavior と必要な security / lifecycle contract を定め、source / framework / database / CI/CD / deployment / test implementation を対象外または委譲している。                                                                                                                                                                                                               |
| Authority / responsibility boundary                 | **Pass**            | `§1.1` が contract ownership を authority とし、common contract は既存 Specification / policy、Mobile は追加制約と定める。`§4` が Application / UI、trusted host / UI、wallet-core、OS、SDK、Relay、dApp、release authority を分離している。                                                                                                                                                                              |
| Request / response contract                         | **Pass**            | `§12.1` は既存 union に限定し、Interfaces `§6.3` / `§9.6`、Handoff `§5.1` / `§5.2.1` / `§7.2` の required public result、correlation、success / error の依存関係と整合する。                                                                                                                                                                                                                                              |
| MSR-004 secret / public signed result boundary      | **Pass**            | `§15.1`、`§16`、`§18` item 17 が secret、unsigned / intermediate representation、normative public signed result、observability replication、Relay plaintext を別々に扱う。                                                                                                                                                                                                                                                |
| Four signing conditions                             | **Pass**            | `§7.1`、`§11.2`、`§18` items 3〜5、`§20` criterion 4 が Authentication、Signing-capable unlock、Account authorization、Explicit user approval を独立条件として同一 request / target / Profile / Account / Chain / Network context に bind し、一つでも欠ければ wallet-core / success を禁止する。                                                                                                                         |
| Trusted inspection                                  | **Pass**            | `§10`〜`§11`、`§18` items 6〜8、`§20` criterion 5 が trusted Mobile foreground UI による full target inspection を要求し、external summary、notification、URL、Relay metadata、hash-only、Node lookup、dApp description、warning-only / raw fallback を代替にしていない。 Symbol Aggregate、NEM multisig / cosignature、embedded / inner context も表示不能時に拒否する。                                                 |
| Input validation / canonicalization / serialization | **Pass**            | `§8`、`§10`、`§11`、`§18` items 1、4、9、21 が bounded input、unknown / duplicate / malformed、identity、integrity、expiry、Chain-specific parse、canonicalization、pre-sign revalidation、fail-closed を定め、exact encoding / field shape は common / Chain Specification に委譲している。                                                                                                                              |
| Relay opaque boundary                               | **Pass**            | `§4.1`、`§9`、`§18` item 19、`§20` criterion 11 が Relay の structural / transport responsibility と Mobile / Signer の semantic、approval、signing、result、`RESULT_UNKNOWN`、`deliveryDisposition`、Mainnet gate authority を分離する。`§18` item 17 は Relay plaintext を明示的に禁止する。                                                                                                                            |
| `RESULT_UNKNOWN`                                    | **Pass**            | `§12.2`、`§14.2`〜`§14.3`、`§18` item 12、`§19.1` は trusted Signer が signing generation 自体の成否を確定できない場合だけに限定し、network、Relay、ACK、HTTP、response absence、timeout、recipient offline、delivery failure から生成・推測しない。自動 re-sign / fallback もない。                                                                                                                                      |
| `deliveryDisposition`                               | **Pass**            | `§12.3`、`§14.5`、`§18` items 13〜14、`§20` criterion 9 が known signed result に対する `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` を Signer-side semantics とし、Relay state、retrieval、ACK、`consumed`、HTTP 2xx、purge から生成・推測・書換えしない。                                                                                                                                                               |
| Recovery / re-sign boundary                         | **Pass**            | `§12.4`、`§14.2`〜`§14.5`、`§18` items 15〜16、`§20` criterion 10 が known result の resend / redelivery / retrieval / lookup と新しい signing generation を分離し、別 Account / Signer / Provider / transport への automatic fallback を禁止する。                                                                                                                                                                       |
| Lifecycle / state loss / concurrency                | **Pass**            | `§6`、`§9.3`〜`§9.4`、`§13`〜`§14`、`§18` items 10〜11、`§20` criteria 2、7、12 が background、suspend、resume、device lock、process termination、OS kill、crash、network / Relay failure、generation / Profile / Account / permission change、duplicate、replay、timeout、cancellation、local / remote mismatch を扱う。 stale approval / Authentication / unlock / authorization / target / secret を自動再利用しない。 |
| Common state set / `AUTHENTICATING`                 | **Pass**            | `§9.3`、`§13.1` が Interfaces / Signing Protocol の common exact state setを拡張せず、`AUTHENTICATING` を non-common、non-public、non-wire、non-Relay、non-SDK、non-persistent local substep と明記している。                                                                                                                                                                                                             |
| Wallet-core / secret boundary                       | **Pass**            | `§2.2`、`§15`、`§18` items 17〜18、`§20` criteria 13〜14 が Mnemonic、private key、derived key、Profile password、decrypted Store、E2E / transport secret、credential、internal key reference、secret-bearing buffer の外部 / SDK / Relay / log / diagnostics / persistent plaintext への漏洩を禁止し、KDF / AEAD / Wallet Store encryption / raw signing を wallet-core 外で再実装しない。                               |
| Mainnet gate / Testnet-only                         | **Pass**            | `§17`、`§18` item 20、`§20` criterion 15 が release authority の evidence gate と platform conditions の missing / invalid / expired / unknown で Mainnet signing を fail-closed にし、Mainnet failure によって安全な Testnet-only operation を不必要に停止しない。現行公開 Mobile build が Testnet-only であることも release docs と整合する。                                                                           |
| Existing OPEN                                       | **Pass — deferred** | `§19.3` の MOB / MR / common / Relay / SDK OPEN は current normative source に残る未決事項を委譲し、今回の修正で追加・削除・close・意味変更されていない。OPEN は安全下限を弱める根拠になっていない。                                                                                                                                                                                                                      |
| Interoperability / traceability / verifiability     | **Pass**            | `§20` criteria 4、8〜11、16 と `§21` が common result / delivery / state / security / release contract を追跡可能にする。MSR-004 解消後、common public signed result と observability prohibition を同時に検証できる。                                                                                                                                                                                                    |

Adversarial check では、malicious dApp、forged external invocation、stale / tampered Relay response、request substitution、Account / Chain / Network substitution、Profile switch、resume after approval、process / state loss、duplicate / replay、delayed response、Relay compromise、misleading notification、OS lifecycle interruptionを確認した。現行本文は、fresh validation、同一 context binding、trusted UI、fail-closed、no automatic re-sign / fallback、Relay non-authority、secret isolation を維持している。

## 13. Validation Results

| Validation                                                    | 結果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target revision / worktree / changed-file audit               | **Pass**。`HEAD` と対象 revision `cca14ceed2bd04b1cce169329296ff58921cb6d5` が一致し、レビュー開始時点の worktree は clean だった。成果物作成後は review artifact だけを変更対象とする。                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Review artifact Markdown formatter                            | `pnpm exec prettier --write docs/reviews/specifications/mobile-app-review-003.md` と `pnpm exec prettier --check docs/reviews/specifications/mobile-app-review-003.md` は、いずれも `[ERROR] unable to open database file` で失敗した。repository policy に従い `./node_modules/.bin/prettier --write docs/reviews/specifications/mobile-app-review-003.md` と `./node_modules/.bin/prettier --check docs/reviews/specifications/mobile-app-review-003.md` を実行し、いずれも **Pass**。同じ repository-local Prettier executable と同じ artifact path を対象にしたため formatter の代替確認はできたが、pnpm launcher 自体の database access は未検証のままである。 |
| Whitespace / staged diff                                      | **Pass**。artifact だけを stage した状態で `git diff --cached --check` を実行し、whitespace error はなかった。`git diff --cached --name-status` も review artifact の追加だけであることを確認した。                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Referenced paths                                              | **Pass**。本文、Requirements、Design、common / related Specification、ADR、release / mobile reference、review resources、repository instructions の参照先を確認した。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Lint / typecheck / test / build / runtime / E2E / real-device | **Not validated**。今回の変更対象は review Markdown のみであり、Mobile runtime、source、package、Relay E2E、実機、release evaluator は対象外で実行していない。未実行を PASS とは扱わない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## 14. Review Gates

| Gate                           | 判定     | 根拠                                                                                                                                                                                                   | 対応 |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 1. Purpose / scope             | **Pass** | Mobile の対象、非責務、actor、platform / release boundary、common contract との関係を `§1`〜`§4`、`§19.2` で確認できる。                                                                               | —    |
| 2. Contract                    | **Pass** | `§12` の既存 response union、`§18` item 17 の public signed result exception、secret / intermediate / observability / Relay plaintext boundary、common field authority が矛盾なく確認できる。          | —    |
| 3. Processing / failure        | **Pass** | validation ordering、trusted inspection、Four Conditions、failure、unknown、delivery、recovery、retry / re-sign separation、duplicate / replay、lifecycle failure を `§8`〜`§14`、`§19` で確認できる。 | —    |
| 4. Internal consistency        | **Pass** | MSR-001〜MSR-003 の authority / response / local state 境界と MSR-004 の payload boundary が、`§1.1`、`§9.3`、`§12`、`§13.1`、`§16`、`§18` の間で整合する。                                            | —    |
| 5. Verifiability               | **Pass** | common Specification の required field / exact state / result semantics を authority として参照し、Mobile-specific acceptance / lifecycle / security invariant を `§20`〜`§21` で検証可能にしている。  | —    |
| 6. Security / interoperability | **Pass** | secret boundary、trusted UI、Four Conditions、TOCTOU / replay、E2E opaque Relay、Signer-only unknown / disposition、public signed response の伝達と observability 非複製を確認できる。                 | —    |
| 7. Upstream consistency        | **Pass** | Requirements、Design、Interfaces、Signing Protocol、Handoff、Profile / Account、Chain Compatibility、SDK、Relay、release policy と矛盾しない。Browser Extension 固有契約は Mobile へ持ち込んでいない。 | —    |

すべての applicable generic gate を評価し、blocking failure、confirmation required 条件、未解消 Critical / Major finding はない。したがって Review Gate は `READY` である。

## 15. Remaining Risks and Open Decisions

- 現行 Mobile App は workspace に実装されていない将来 milestone である。本文の runtime 遵守、実機 OS capability、Relay E2E、release evidence evaluator の実行結果は今回確認していない。
- `MOB-OPEN-*`、`MR-OPEN-*`、Interfaces / Handoff / Relay / SDK の既存 OPEN は残っている。これらは §19.3 の safe lower bound を弱めず、独自 contract を発明しない条件で下位 authority へ引き継ぐ必要がある。
- 現行公開 Mobile build が Testnet-only であることは release / mobile policy と整合する。Mainnet は release authority の current evidence と platform conditions が揃うまで unavailable でなければならない。
- `§18` item 17 の public signed result exception は common Handoff response に限定され、observability / auxiliary output または Relay plaintext の許可ではない。この境界を実装・運用資料で別表現にする場合も、common field / shape と E2E boundary を維持する必要がある。

## 16. Automatic Changes

なし。対象 Specification、Requirements、Design、他の Specification、ADR、source、test および過去の review artifact は変更していない。変更対象は本レビュー成果物だけである。

## 17. Final Decision

`READY`

MSR-001、MSR-002、MSR-003、MSR-004 はすべて `Resolved`。新規 finding はなく、security / interoperability regression、cross-document inconsistency、Specification phase boundary の逸脱も確認されなかった。既存 OPEN は §19.3 のとおり Deferred のまま妥当であり、次工程へ進めるための Review Gate を満たす。
