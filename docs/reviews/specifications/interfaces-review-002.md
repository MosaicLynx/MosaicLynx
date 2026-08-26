# MosaicLynx Interface / Data Model Specification 再レビュー

## レビュー情報

- 対象: [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)
- 対象 revision: `d864d3b`（IS-001 修正コミット）
- 前回レビュー: [`interfaces-review-001.md`](./interfaces-review-001.md)
- 確認日: 2026-08-26
- レビュー種別: Specification Review（再レビュー）
- 使用 Skill: `spec-review`
- レビュー範囲: 前回指摘 `IS-001` の修正結果、error code authority、修正による回帰、関連する security / trust boundary のみ。
- 変更範囲: 本レビュー成果物のみ。対象 Specification、Concept、Requirements、Design、他の Specification、実装および既存レビューは変更していない。

## 総評

前回指摘 `IS-001` は解消されている。`interfaces.md` は `MosaicLynxSDKErrorCode` と `MosaicLynxSDKError` の定義を削除し、[Web Transaction Handoff Specification](../../specifications/web-transaction-handoff-spec.md) §10 を authority として参照している。`RelayResponse.errorCode` も同じ型を参照し、Handoff §10 に含まれない値を受け付けないことが明記された。

`INVALID_MESSAGE` と `NONCE_REUSED` は Interface Specification の SDK 公開 code として再定義されていない。Handoff §10 の既存 union にも含まれず、対象 Specification では非許容値として明示されている。error mapping、sensitive error detail 非露出、fail-closed、Relay opaque boundary および既存の責任分界に、今回の修正による回帰は確認されなかった。

## 判定

### INTERFACES SPECIFICATION READY

前回指摘は解消され、新規 `ERROR` / `WARN` はない。次工程へ進められる。

## 前回指摘の確認

| ID     | 前回 Severity | Status       | 確認結果                                                                                                                                   |
| ------ | ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| IS-001 | ERROR         | **RESOLVED** | Interface Specification の独自 error code union と `INVALID_MESSAGE` / `NONCE_REUSED` の定義が削除され、Handoff §10 参照へ変更されている。 |

### 確認根拠

- `interfaces.md` §6.3 は `RelayResponse.errorCode` を Handoff §10 の `MosaicLynxSDKErrorCode` への参照とし、Handoff にない値を拒否する。
- `interfaces.md` §10.2 は code 集合、error mapping、error 型を再定義しないと明記している。
- `interfaces.md` §10.2 は `INVALID_MESSAGE` / `NONCE_REUSED` を公開 code として扱わないことを明記している。
- `web-transaction-handoff-spec.md` §10 の union は `USER_REJECTED`、`UNAVAILABLE`、`NOT_CONNECTED`、`APP_NOT_INSTALLED`、`VAULT_LOCKED`、`REQUEST_EXPIRED`、`INVALID_PARAMS`、`INVALID_TRANSACTION`、`UNSUPPORTED_TRANSACTION`、`CHAIN_MISMATCH`、`NETWORK_MISMATCH`、`SIGNER_MISMATCH`、`CONTEXT_CHANGED`、`INVALID_RESPONSE`、`INTERNAL_ERROR` であり、`INVALID_MESSAGE` / `NONCE_REUSED` を含まない。
- 対象 Specification に残る `INVALID_MESSAGE` / `NONCE_REUSED` の記述は、公開 code から除外するための明示であり、型・alias・mapping の追加定義ではない。

## 新規指摘・回帰

### 新規指摘

新規 `ERROR`、`WARN`、`NIT` は確認されなかった。

### 回帰確認

- **error code authority:** Handoff §10 に一元化され、Interface Specification と Handoff の code 集合が一致している。
- **重複定義:** `interfaces.md` に `MosaicLynxSDKErrorCode` の型定義、`MosaicLynxSDKError` の型定義、`INVALID_MESSAGE` / `NONCE_REUSED` の alias または追加 mapping はない。
- **taxonomy:** 新しい error code、error category、retry rule は追加されていない。既存の logical error category と Handoff の公開 code の責務分離が維持されている。
- **response contract:** `rejected` / `failed` の `errorCode` 必須、成功 result との排他的関係、Relay HTTP の `RELAY_REQUEST_REJECTED` と SDK 公開 code の非同一視が維持されている。
- **fail-closed:** Handoff にない code を受け付けず、unknown / unsupported value を fallback しない方針が維持されている。
- **sensitive error detail:** HTTP status、URL、token、暗号 library error、内部例外、stack trace、parser dump、Vault detail、wallet-core secret を公開 error に含めない方針が維持されている。
- **Relay opaque boundary:** Relay は error code の authority や signing authorization にならず、opaque envelope、transport rejection、client-side semantic validation の責任分界が変わっていない。
- **security / trust boundary:** Origin、permission、session、Account、Scope、request binding、approval、wallet-core および `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の境界に修正による変更はない。

## Security / Trust Boundary 評価

適合。今回の変更は error code の参照先を明確化するものに限られ、Web Application / SDK、Browser Extension / Mobile App、Relay、wallet-core の trust boundary を変更していない。Relay delivery や error code を approval / signing authorization とみなす経路も追加されていない。

`INVALID_MESSAGE` / `NONCE_REUSED` を独自公開 code として受け付けないことは、unknown code の安全側拒否と、Handoff の単一 authority を補強している。Structured message の validation / replay 要件そのものを緩和している記述もない。

## 基本設計粒度・未決事項

前回レビューで確認した共通 model、validation、serialization、lifecycle、component responsibility および traceability は、今回の修正で過度に再定義されていない。Handoff 固有の SDK error code を共通 Interface が複製せず、参照だけに留めたことで責任分界が明確になった。

今回の修正は、前回から未決事項を追加確定していない。既存の `OPEN-001`〜`OPEN-006` は引き続き対象 Specification に保持されている。

## 最終判定

- `IS-001`: **RESOLVED**
- 新規指摘: なし
- 回帰: なし
- 指摘件数: `ERROR 0 / WARN 0 / NIT 0`
- 最終判定: **READY**
- **INTERFACES SPECIFICATION READY**

## Validation

- Markdown formatting: 作成後に対象レビュー成果物へ Prettier check を実施。
- 相対リンク: 対象 Specification、前回レビュー、Handoff Specification の参照先を確認。
- 指摘 ID: 新規指摘なし。前回 ID `IS-001` の status を `RESOLVED` として記録。
- Severity 表記: Skill の `ERROR` / `WARN` / `NIT` を使用し、件数はすべて 0。
- error code 確認: Handoff §10 の union と Interface Specification の参照関係、`INVALID_MESSAGE` / `NONCE_REUSED` の非許容扱いを確認。
- 対象取り違え: 対象は `docs/specifications/interfaces.md`。対象本文および前回レビューは変更していない。
- 差分: `git diff --check` を実施し、既存の `_nem` / `_symbol` の変更とは分離して確認する。
- リポジトリ全体の formatter / lint / typecheck / test / build は、レビュー成果物のみの変更であるため実施対象外。
