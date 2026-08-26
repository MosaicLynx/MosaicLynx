# MosaicLynx SDK Specification 再レビュー

## レビュー情報

- 対象: [`docs/specifications/sdk.md`](../../specifications/sdk.md)
- 対象 revision: `3800293`
- 前回レビュー: [`sdk-review-001.md`](./sdk-review-001.md)
- 確認日: 2026-08-26
- レビュー種別: Specification 再レビュー
- 使用 Skill: `spec-review`
- 実施方法: `spec-review` Skill と `.agents/project-context.md` を適用した単独再レビュー。前回指摘 `SDK-001` の修正差分を中心に、Web Transaction Handoff Specification §5.3 / §6、SDK Requirements、SDK Design、Interface Specification、Signing Protocol Specification および Security Design を照合した。前回レビュー済みの範囲は、修正による回帰の有無と責任境界の維持を確認する目的に限定して再確認した。
- 変更範囲: 本レビュー成果物のみを新規作成する。対象 Specification、Handoff Specification、Concept、Requirements、Design、他の Specification、ADR および実装は変更していない。

## 総評

前回 `SDK-001` は解消されている。`isAvailable()` は、Handoff §5.3 の local Provider route または Mobile Relay route の選択可能性の論理和として定義され、Provider が存在しないことだけで `false` にはならない。一方、Mobile Relay は current release、feature flag、release / product gate、受信 App の提供、runtime、Web API および verified HTTPS App Link の条件を満たす場合だけ選択可能とされ、現行 production `1.0.0` では受信 App 公開前に無効であることも明示された。

SDK §5.1 / §6.2 と Handoff §5.3 / §6 の availability / transport selection の authority が一致し、`isAvailable()`、`UNAVAILABLE` および silent fallback の意味を実装者が追加判断なしに決定できる状態になっている。

修正差分は route availability と traceability に限定され、Provider 非信頼モデル、connection / permission / approval 分離、Origin authority、request / response correlation、timeout / cancellation、error authority、Relay opaque boundary、secret isolation および fail-closed の契約に回帰は確認されなかった。

## 判定

### READY

前回指摘が解消され、新規 `ERROR` / `WARN` はない。SDK Specification は実装または下位仕様策定へ進められる。

## 前回指摘の再確認

### SDK-001 — RESOLVED

- **前回 Severity:** `ERROR`
- **前回 Status:** `OPEN`
- **対象:** `isAvailable()` と Mobile Relay route availability の整合。
- **確認結果:** 解消。
- **確認根拠:**
  - SDK §5.1 は、Handoff §5.3 の選択可能な local Provider route または Mobile Relay route の存在を `isAvailable() = true` の条件としている。
  - SDK §6.2 は、Provider 不在時でも Handoff が認める Mobile Relay route を `isAvailable()` の根拠にできるとし、route 条件を満たさない場合だけ `false` としている。
  - Handoff §5.3 は `local_provider_route_available OR mobile_relay_route_available` を明示し、Mobile Relay の release / feature flag / product gate /受信 App 提供 / runtime / Web API 条件を定義している。
  - Handoff §6 は §5.3 の route availability を transport selection の正本とし、選択可能な route がない場合だけ `UNAVAILABLE` としている。
- **残存問題:** なし。

## 新規指摘

新規 `ERROR`、`WARN`、`NIT` は確認されなかった。問題がない領域に形式的な指摘 ID は発行していない。

| Severity | 件数 |
| -------- | ---: |
| ERROR    |    0 |
| WARN     |    0 |
| NIT      |    0 |

## 回帰確認

### Public API / Provider / capability / version

Public API の型、Promise semantics、diagnostics option、cosignature の existing / optional scope は Handoff §5.1 と整合したままである。`isAvailable()` の明確化により、transport selector、Relay URL、credential、内部 Account identifier などの新しい公開 API は追加されていない。

Provider が存在する場合の Extension route 優先、malformed / incompatible / conflicting Provider の非信頼扱い、非対応 Provider からの Mobile Relay への silent fallback 禁止も維持されている。capability は authorization や approval を意味せず、capability identifier / version negotiation の OPEN も閉じられていない。

### Connection / Permission / Approval

availability と connection、permission、Account disclosure、user approval、authentication、signing success は引き続き分離されている。route が available であることや `isAvailable() = true` が、接続済み、App インストール済み、permission 付与済みまたは署名可能であることを意味しない。

### Request / Response / Lifecycle

requestId、operation、Provider / session、Origin / caller、Scope、Account、target、digest、expiry および response freshness の binding、duplicate / stale / replay response の破棄、concurrent request の独立処理、timeout / cancellation と `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の分離に変更はない。自動 re-sign、古い approval の再利用、別 transport への無断 fallback も引き続き禁止されている。

### Error authority / Security

common logical error は Interfaces、signing outcome は Signing Protocol、concrete SDK / Handoff error code は Handoff §10 が authority のままである。新しい error code / taxonomy は追加されていない。

SDK は非特権 context に留まり、SDK / Provider / Relay が Origin authority、approval authority、signing authority または secret boundary になることはない。Relay opaque boundary、sensitive error detail 非露出、unsupported / malformed / mismatch / replay 時の fail-closed も維持されている。

## 上流整合性と新規仕様混入

前回 `SDK-001` の修正は、SDK Specification が独自に Mobile Relay の公開条件を発明するのではなく、Handoff §5.3 / §6 を availability / transport selection の正本として参照する形になっている。SDK Requirements `SDK-FR-001`、`SDK-PLAT-003`、SDK Design の Provider / transport 境界および Handoff の route availability と traceability も更新されている。

今回の修正で、新しい Public API、Provider selection policy、capability taxonomy、error code、timeout / cancellation semantics、Relay trust decision または signing authorization は追加されていない。既存の `OPEN-SDK-001`〜`005` も、複数 Provider 選択、capability / version negotiation、timeout / cancellation / transport failure、cosignature public scope、runtime / caller binding / release compatibility の未決事項として妥当である。

## 基本設計・仕様粒度の評価

修正後も、SDK Specification は外部 API、route availability、responsibility boundary、validation、correlation、lifecycle、error および security invariant を実装可能な粒度で定義している。Provider object の内部実装、Browser API、Mobile OS API、Relay storage、wallet-core API、wire schema の追加設計へ逸脱していない。

## 最終判定

- 前回 `SDK-001`: **RESOLVED**
- 新規指摘: なし
- 回帰: なし
- 指摘件数: `ERROR 0 / WARN 0 / NIT 0`
- 最終判定: **READY**
- **SDK SPECIFICATION READY**

SDK Specification は次工程へ進めてよい。

## Validation

- 前回差分の確認: `SDK-001` の修正箇所と Handoff §5.3 / §6 の整合を確認した。
- 上流 traceability: SDK Requirements / Design、Interface Specification、Signing Protocol Specification、Web Transaction Handoff Specification および Security Design を再確認した。
- 相対リンク: 対象 Specification、前回レビューおよび Handoff への参照先を確認した。
- review ID: 本再レビューでは新規指摘なし。前回 `SDK-001` の重複発行なし。
- 対象本文: `docs/specifications/sdk.md` はレビュー中に変更していない。
- Markdown / formatter: `pnpm exec prettier --check docs/reviews/specifications/sdk-review-002.md` を実施し、成功した。
- `git diff --check`: 実施し、成果物由来の whitespace error はなかった。
- repository 全体の formatter / lint / typecheck / test / build: レビュー成果物のみの変更であるため実装検証としては実施対象外とする。
