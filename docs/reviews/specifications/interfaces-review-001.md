# MosaicLynx Interface / Data Model Specification Review

## レビュー情報

- 対象: [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)
- 対象 revision: `88a84f9`（レビュー開始時点）
- 確認日: 2026-08-26
- レビュー種別: Specification Review
- 使用 Skill: `spec-review`
- 変更範囲: 本レビュー成果物のみ。対象 Specification、Concept、Requirements、Design、ADR、実装および既存レビューは変更していない。

## 総評

本 Specification は、共通データモデルと component boundary を、実装可能な契約粒度まで具体化できている。`requestId`、`sessionId`、`requestDigest`、時刻表現、Relay handoff の期限、structured message nonce、Mainnet Mobile の Origin proof および DNS / HTTPS 制約は、既存の [Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md) と [Product Specification](../../specifications/product-spec.md) に根拠がある。共通 signing state、approval binding、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、Relay の opaque boundary も [signing-flow.md](../../design/signing-flow.md)、[security-design.md](../../design/security-design.md) および既存 IF 指摘の解決内容と整合する。

ただし、SDK 公開 error code の一部が既存 handoff と一致しない。対象 Specification は `INVALID_MESSAGE` と `NONCE_REUSED` を「既存 handoff で確定している」としているが、handoff の `MosaicLynxSDKErrorCode` union には両方がない。このままでは共通 response の `errorCode` の許容集合が component 間で一意に定まらず、Specification として確定できない。

## 判定

### REVISE SPECIFICATION

`ERROR` 1件を解決するまで、次工程へ確定的に進めない。

## 指摘一覧

| ID     | Severity | Status | 対象箇所                                                                                                                        | 問題                                                                                                                                                                                                                                                  |
| ------ | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IS-001 | ERROR    | OPEN   | `interfaces.md` §10.2、§6.3 / [web-transaction-handoff-spec.md](../../specifications/web-transaction-handoff-spec.md) §7.2、§10 | `MosaicLynxSDKErrorCode` の共通契約が不一致。対象 Specification は `INVALID_MESSAGE` と `NONCE_REUSED` を含めるが、既存 handoff の同名 union と error mapping には含まれない。対象本文の「既存 handoff で確定している」という根拠記述とも一致しない。 |

### IS-001: SDK error code の cross-spec 不整合

- **問題:** `interfaces.md` §10.2 の公開 code union は `INVALID_MESSAGE` と `NONCE_REUSED` を定義している。一方、既存 handoff §10 の `MosaicLynxSDKErrorCode` はこれらを定義せず、`signData` の schema / replay 関連失敗も既存の `INVALID_PARAMS`、`REQUEST_EXPIRED`、`INTERNAL_ERROR` 等へ整理されている。また handoff §7.2 の Relay response は同じ union を参照しているため、SDK、Relay handoff、共通 Interface の error domain が一致しない。
- **根拠:** 共通 error code は [web-transaction-handoff-spec.md](../../specifications/web-transaction-handoff-spec.md) §7.2、§10 で既存契約として定義され、対象 Specification §10.2 はその契約を参照すると記載している。Structured message の nonce / expiry / replay 要件自体は [product-spec.md](../../specifications/product-spec.md) §16〜§17 と [signing-flow.md](../../design/signing-flow.md) §14 に根拠があるが、それだけでは新しい公開 error code の追加根拠にはならない。
- **リスク:** 実装者が対象 Specification に従えば handoff と異なる code を返し、handoff に従えば対象 Specification の response union と異なる code を返す。`INVALID_MESSAGE` / `NONCE_REUSED` を受信側が unsupported code として拒否する可能性、user-visible error の分類不一致、Relay response の相互運用不能が生じる。error code の差異を silent fallback で吸収すると、validation failure や replay failure の意味が失われる。
- **推奨対応:** まず [web-transaction-handoff-spec.md](../../specifications/web-transaction-handoff-spec.md) と [docs/requirements/sdk.md](../../requirements/sdk.md) に戻し、structured message validation / nonce replay の公開 error category と code 集合を承認する。その決定に合わせて `interfaces.md` §10.2、handoff §7.2 / §10、必要な SDK contract test を同じ変更として更新し、対象 Specification には「既存 handoff で確定」と書ける根拠を残す。新規 code を採用しない場合は対象 Specification から両 code を除き、既存 code への分類規則を明示する。いずれの場合も unknown code の unsafe fallback は行わない。
- **上流へ戻す必要:** あり。公開 error code の authority と cross-component contract の決定が必要。
- **Specification 内で修正可能:** 上流で code 集合を確定した後、`interfaces.md` の union、根拠リンク、error mapping を同期する。

## 重点確認結果

| 確認項目                        | 評価         | 根拠・確認結果                                                                                                                                                                                                                            |
| ------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design → Specification の具体化 | 条件付き適合 | Design が委譲した具体的な field、encoding、validation、compatibility を下位 Specification として定義している。error code の既存契約参照だけ不一致。                                                                                       |
| 新しい Requirement の混入       | 1件の疑義    | 指定された request / Origin / nonce / expiry の値は既存 Specification に根拠がある。`INVALID_MESSAGE` / `NONCE_REUSED` の公開 code 追加だけは、対象本文が既存確定事項と誤認している。                                                     |
| requestId / sessionId           | 適合         | 128-bit CSPRNG、padding なし base64url、session の handoff binding は handoff §7 に一致。                                                                                                                                                 |
| requestDigest                   | 適合         | `SHA-256(JCS(RelayRequest))` lowercase hex は handoff §7.1 に一致。                                                                                                                                                                       |
| timestamp / expiry              | 適合         | UTC RFC 3339、秒精度、fraction なし、Relay request 5分は handoff に一致。message expiry は request expiry と分離し、field 名差異を OPEN に保持している。                                                                                  |
| structured message nonce        | 適合         | Product Specification の 16〜32 byte、padding なし base64url、Origin + Account 単位の replay 防止と一致。                                                                                                                                 |
| Mainnet Mobile handoff          | 適合         | HTTPS / default port 443、public DNS、private / reserved / loopback 等の拒否、redirect / DNS rebinding 防止、Mainnet originProof 必須は handoff に一致。                                                                                  |
| capability / permission         | 適合         | capability の identifier / negotiation は OPEN-002、version matrix は OPEN-003、permission expiry / independent revocation は OPEN-004 として未確定を維持している。PermissionGrant の field は Product Specification の保存モデルと一致。 |
| validation / serialization      | 適合         | strict JSON、duplicate / unknown field、JCS を適用箇所限定、hex / base64url、operation union、pre-sign revalidation、fail-closed が明示されている。                                                                                       |
| compatibility                   | 適合         | unsupported version / operation / capability を安全に reject し、permission bypass、blind fallback、unknown interpretation を許さない。                                                                                                   |

## Security / Trust Boundary 評価

- Web Application / SDK の自己申告を Origin authority とせず、Browser-observed context または Mobile handoff の検証済み context を最終 binding としている。
- Permission、session、Profile、Account、Scope、Chain / Network、operation、capability、target、request identity を binding し、`requestId` 単独を authorization としていない。
- Relay は opaque transport として扱われ、復号、semantic inspection、approval、signing、wallet-core の責務を持たない。
- signer 側の inspection、trusted UI、明示 approval、署名前の再検証、wallet-core result の対応確認が共通 validation 順序に含まれる。
- `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を分離し、terminal state の reopen、stale approval、duplicate signing、自動再署名を禁止している。
- secret material、private key、mnemonic、wallet unlock secret を共通外部 Interface に公開しない責任分界が維持されている。

上記の Security / Trust Boundary は適合している。IS-001 は error taxonomy の相互運用性問題であり、現時点で secret leakage や approval bypass を直接生じさせる記述ではないが、fail-closed な公開契約を一意にできないため `ERROR` とする。

## Component responsibility / cross-component contract 評価

§16 の責任表は、SDK、Browser Extension、Mobile App、Relay、wallet-core を適切に分離している。SDK は request construction、dispatch、correlation、error normalization に限定され、Browser / Mobile が Origin、permission、inspection、approval、認証および lifecycle を担い、Relay は opaque delivery、wallet-core は秘密情報と cryptographic processing を担う。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の境界も [interfaces-review-002](../design/interfaces-review-002.md) の解決内容と一致する。

共通 capability の具体的 negotiation、permission expiry、caller context および Aggregate / multisig の public scope は OPEN に残されている。未決事項を SDK、Relay または各 host が独自に確定する構造にはなっていない。

## Traceability 評価

§17 は、要求・Design・本 Specification の主要契約を追跡可能にしている。参照された IF-001〜IF-003 は [interfaces-review-001](../design/interfaces-review-001.md) で指摘され、[interfaces-review-002](../design/interfaces-review-002.md) で解決確認されているため、レビュー資料を製品要求の一次根拠として扱っているわけではない。一次根拠は Concept、Requirements、Design および既存 Specification に置かれている。

指定された具体値については、以下を一次根拠として確認した。

- request / session / digest / timestamp / 5分期限 / Mainnet Origin proof: [web-transaction-handoff-spec.md](../../specifications/web-transaction-handoff-spec.md) §7
- structured message nonce / expiry / replay: [product-spec.md](../../specifications/product-spec.md) §16、§17、および [signing-flow.md](../../design/signing-flow.md) §14
- PermissionGrant の profile / scope / accountIds / revision: [product-spec.md](../../specifications/product-spec.md) §15
- trust boundary / responsibility / fail-closed: [architecture.md](../../design/architecture.md)、[security-design.md](../../design/security-design.md)、[signing-flow.md](../../design/signing-flow.md)

## OPEN / 上流返却要否

- `OPEN-001`〜`OPEN-006` は、既存 Design が未確定としている事項を本 Specification でも保持している。これらを独自に確定していない点は適切。
- `IS-001` は OPEN のまま次工程へ持ち越すべきではない。公開 error code の authority を上流で決定し、handoff と本 Specification を同期する必要がある。
- その他に、上流へ戻すべき未決事項、または Specification 内だけで修正すべき追加指摘は確認されなかった。

## 基本設計粒度の評価

Interface / Data Model Specification として、共通型の意味、必須性、cross-component binding、validation 順序、serialization、error semantics、compatibility、lifecycle および traceability が実装可能な粒度で定義されている。Browser API、Mobile OS API、Relay の DB / queue、SDK の具体 class、wallet-core 内部 cryptography、chain-specific parser 実装を不要に再定義していない。

また、`OPEN-001`〜`OPEN-006` によって、message expiry field、capability negotiation、common version matrix、permission expiry / revocation、caller context、Aggregate / multisig scope を適切な上流・下位契約へ委譲している。`IS-001` を解消すれば、下位実装・contract test へ進める粒度に達している。

## 最終判定

- 指摘件数: `ERROR 1 / WARN 0 / NIT 0`
- 上流へ戻す指摘: `IS-001`（公開 error code の authority と handoff との同期）
- Specification 内で修正可能な指摘: `IS-001` の上流決定後に union / mapping / 根拠を同期
- 最終判定: **REVISE SPECIFICATION**
- **INTERFACES SPECIFICATION READY: NO**（`IS-001` 解決後に再判定）

## Validation

- Markdown formatting: 作成後に対象レビュー成果物へ Prettier check を実施。
- 相対リンク: レビュー成果物から参照する対象 Specification、上流資料、既存レビューの存在を確認。
- 指摘 ID 重複: `IS-001` の一意性を確認。
- Severity 表記: Skill の `ERROR` / `WARN` / `NIT` を使用。
- 対象取り違え: 対象は `docs/specifications/interfaces.md` とし、対象本文は変更していない。
- 差分: `git diff --check` を実施し、既存の `_nem` / `_symbol` の変更とは分離して確認。
- リポジトリ全体の `pnpm format:check` は実施したが、今回の変更対象外である `_nem/infra/package/3rd-party-licenses/cddl + gplv2 with classpath exception - cddl+gpl.html` の既存 HTML 構文エラーで失敗した。対象レビュー成果物の個別 Prettier check は通過している。
- lint / typecheck / test / build は、レビュー成果物のみの変更で実施対象外。
