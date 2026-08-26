# MosaicLynx Relay Specification Review

## レビュー情報

- 対象: [`docs/specifications/relay.md`](../../specifications/relay.md)
- 対象 revision: `2760960`
- 確認日: 2026-08-26
- レビュー種別: Specification Review
- 使用 Skill: `spec-review`
- 実施方法: `spec-review` Skill と `.agents/project-context.md` を適用した単独レビュー。Relay Requirements、Relay Design、Interfaces Design、Signing Flow Design、Security Design、Interface Specification、Signing Protocol Specification、SDK Specification、Web Transaction Handoff Specification、Product Specification および関連する既存レビューを照合した。既存レビューは、解決済み指摘、責任分界および Specification への委譲事項の確認に限定して参照した。
- 変更範囲: 本レビュー成果物のみを新規作成した。対象 Specification、Concept、Requirements、Design、他の Specification、ADR、実装および既存レビューは変更していない。

## 総評

Relay Specification は、Relay を opaque / untrusted transport に限定し、transaction / message の解釈、approval、authentication、signing、wallet-core、Account authority および signing outcome の判断を Relay から分離している。generation、session、participant、direction、credential scope、expiry、request / response identity を用いた routing、短期 retention、terminal purge、duplicate / replay、concurrency、restart / state loss、resource control、observability および fail-closed の契約も、Requirements、Relay Design および Handoff と概ね整合している。

ただし、ACK / cancel endpoint の認証失敗時・purge 後の HTTP 応答が Handoff §9.6 と一致していない。Handoff は「外形が妥当な ACK / cancel には常に `204 No Content` を返し、正しい Web token の場合だけ状態を変更する」と定めている。一方、本 Specification §8.2 は credential mismatch 等を共通 `404 Not Found` とする一般則を置き、§13.1 / §13.2 は対象 webToken を検証した場合の `204` を記述している。この競合は server implementation と client の存在秘匿・冪等性の解釈を一意にできないため、修正が必要である。

## 判定

### REVISE SPECIFICATION

ACK / cancel の HTTP response semantics を Handoff §9.6 と同期する `ERROR` 1件を解決するまで、次工程へ確定的に進めない。

## 指摘一覧

| ID      | Severity | Status | 対象箇所                                            | 概要                                                                 |
| ------- | -------- | ------ | --------------------------------------------------- | -------------------------------------------------------------------- |
| RLS-001 | ERROR    | OPEN   | `relay.md` §8.2、§13.1、§13.2、§14.1 / Handoff §9.6 | ACK / cancel の認証失敗時・purge 後の HTTP 応答が Handoff と競合する |

### RLS-001: ACK / cancel の response semantics 不整合

- **Severity:** `ERROR`
- **Status:** `OPEN`
- **対象箇所:** [Relay Specification §8.2](../../specifications/relay.md#82-authorization-rules)、[§13.1](../../specifications/relay.md#131-ack)、[§13.2](../../specifications/relay.md#132-cancel)、[§14.1](../../specifications/relay.md#141-failure-categories)。比較対象は [Web Transaction Handoff Specification §9.6](../../specifications/web-transaction-handoff-spec.md#96-ack-と-cancel)。
- **問題:** Handoff §9.6 は、ACK / cancel について「外形が妥当な要求へ常に `204 No Content` を返し、正しい Web token の場合だけ状態を変更する」と定め、purge 後の再試行でも session の存在や token 一致を判別できない semantics を要求している。一方、Relay Specification §8.2 は credential mismatch、session 不在、terminal state または expiry を Handoff の共通 `404 Not Found` で同一化する一般則を ACK / cancel にも適用し得る記述になっている。さらに §13.1 は「対象 webToken」が正しい場合の `204` を成功条件として記載し、§13.2 も webToken を検証して未完了 session を変更する構造であるため、不正 token・purge 後・state loss 時に `204`（状態変更なし）なのか `404`／reject なのかが一意に定まらない。§15.1、§16.1 の state inconsistency 時の ACK / cancel 停止・拒否も、この Handoff の endpoint-specific semantics との関係が明示されていない。
- **根拠:** Handoff §9.6 は ACK / cancel の status と token validity に応じた状態変更を明示している。Relay Specification §5.1 は Handoff §9 を endpoint、method、status、body、credential の正本として参照し、§2.2 と §14.2 も Handoff contract を再定義しないとしているため、Relay 側の一般的な 404 規則が ACK / cancel の個別契約を上書きしてはならない。
- **リスク:** 実装者が、不正 token や purge 済み session について `404` を返す実装と、Handoff に従って外形が妥当なら `204` を返す実装に分岐する。前者は token validity、session existence、terminal state の差分を応答から推測可能にし、後者を想定する SDK の冪等 ACK / cancel と相互運用できない。state loss や concurrent cancel / ACK でも response semantics が不一致になり、transport disposition と signing outcome の境界をクライアントが誤解するおそれがある。
- **推奨対応:** Handoff §9.6 を ACK / cancel の endpoint-specific authority として明示する。外形が不正な要求だけは Handoff が許す structural error とし、外形が妥当な ACK / cancel は token、session の存在、terminal 状態または purge 済みかどうかを外部へ区別せず `204 No Content` とする。その場合も、正しい scope の webToken と現行 state が確認できたときだけ、ACK の `response_available → consumed` または cancel の terminal purge を適用する。§8.2 の共通 404 規則、§13.1 / §13.2 の条件付き表現、§14.1 の failure table、§15.1 / §16.1 の state-loss 文言をこの例外と矛盾しないよう同期し、HTTP response と state transition を明確に分離する。
- **上流へ戻す必要:** なし。Handoff §9.6 が既に endpoint semantics を確定しているため、Relay Specification 内の一般則・説明を Handoff に合わせて修正すべきである。
- **Specification 内で修正可能:** あり。ACK / cancel の response matrix と state-loss / race 時の扱いを対象節へ反映する。

## 重点確認結果

### Design → Specification / 責任分界

Relay の責務は session / participant / generation lifecycle、routing、temporary retention、endpoint admission、structural validation、delivery、ACK / cancel、expiry、resource control、observability に限定されている。transaction / message parse、semantic validation、summary、permission、approval、authentication、signing、wallet-core および signing outcome の推測は明示的に禁止され、Relay Design と Requirements の責任境界を維持している。

Handoff の endpoint、field、credential、envelope、generation、TTL、HTTP status、polling、ACK / cancel は参照扱いであり、Relay 独自の public SDK API、signing operation、error taxonomy、WebSocket、push、federated Relay、long-term storage または自動 fallback は追加されていない。DB / Redis schema、queue、lock、broker、cluster topology、deployment の具体実装を OPEN としていることも、今回のレビュー範囲で要求された Specification / implementation 境界に適合する。

### Relay Trust Boundary / Opaque Transport

適合。Relay は Internet-facing input、SDK / Browser Extension、Mobile App、persistence および operator を trust anchor とせず、encrypted envelope を復号・改変・意味解釈しない。routing に使用する outer metadata と server-side state、client / Signer が最終検証する inner correlation、AEAD、Origin、Account、permission、approval および signing semantics が分離されている。

Relay の accepted / stored / delivered / ACK / consumed を Signer の `VALIDATED`、`AUTHORIZED`、`SUCCEEDED` または user rejection と解釈しない。Relay compromise 単独で private key acquisition、E2E decryption、approval bypass、signing authorization または無断署名へ到達しない境界も維持されている。

### Session / Generation / Credential

適合。`sessionId`、`requestId`、`generationId`、request / response identity、participant role、direction および transport credential が別の意味として定義され、identifier knowledge 単独で session join、message retrieval、response injection または cross-session access が成立しない。generation は非秘密の state-continuity context であり、restart、state loss、persistence corruption、instance / cluster continuity loss または運用上の invalidation で旧 state を current state として復元しない。generation の exact format、storage backend、reconnect API、retry timing および operational resource policy は OPEN に留められている。

`appToken` / `webToken` は endpoint authorization、`sessionSecret` は E2E secret と分離され、raw credential、session secret、derived key、private key、Mnemonic、Wallet Store および plaintext が Relay の API、log、diagnostics、backup、telemetry または admin view へ露出しない。

### Routing / Retention / TTL

適合。session、role、direction、generation、request / response identity、credential scope、expiry および lifecycle の組み合わせで routing context を分離し、cross-session / cross-recipient lookup と terminal state reuse を禁止している。Handoff の 5 分 expiry、512 KiB encrypted HTTP body、create rate、long polling、temporary retention、terminal purge、最大 24 時間の最小 tombstone を参照しており、message history、backup、分析用長期保存または retry queue として Relay を利用しない。

Handoff §9.9 の自己ホスト MVP の具体的インフラ記述は、今回の Relay server-side contract の authority（endpoint、field、credential、TTL、HTTP status 等）とは分けて扱った。Relay Specification は storage engine や Redis schema を独自に再定義していない。

### Duplicate / Replay / Concurrency

適合。duplicate create、same / conflicting response、repeated retrieval / polling、duplicate ACK、cancel race、expiry race、old credential、stale generation、late delivery、restart / state loss を transport-level state と client-side correlation / integrity validation に分担している。Relay は exactly-once delivery または application processing を保証せず、同一 response の競合上書き、terminal state の再活性化、state rollback、cross-session delivery を防止する論理 invariant を要求している。

### Failure / Delivery Semantics

`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、signing success、user rejection、未署名および delivery disposition を混同しない方針は適合している。malformed、authorization failure、not found、expired、stale generation、storage failure、network timeout、delivery failure、duplicate / conflict の分類も、Relay が signing outcome を生成しない責任分界と整合する。ただし、RLS-001 の ACK / cancel endpoint 応答だけは Handoff 個別契約との同期が必要である。

### Error Authority

適合。common logical category は Interface Specification、signing outcome と `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` は Signing Protocol、SDK / Handoff の concrete code と mapping は Handoff §10、Relay HTTP structural rejection body は `RELAY_REQUEST_REJECTED` とする authority 分担を維持している。Relay Specification は新しい public SDK error code、signing outcome または taxonomy を追加していない。

### Security Invariants

RLS-001 を除き、次の Invariant は本文と整合する。

- Relay は signing authority、wallet、transaction validator、Account / permission authority、approval engine または trust anchor ではない。
- Relay authentication、session admission、storage、delivery、ACK、availability は approval、authentication、signing success または transaction safety を意味しない。
- private key、Mnemonic、Profile password、Wallet Store、sessionSecret、derived key、signing secret、raw credential、plaintext および不要な sensitive metadata を Relay 境界から露出しない。
- expired、consumed、cancelled、replayed、duplicate、stale、invalidated または old generation の object を有効な handoff として再利用しない。
- cross-session / cross-recipient leakage、response substitution、terminal state reuse および state-loss 後の stale state 復元を許さない。
- structural validation、generation consistency、routing integrity または shared-state consistency を確認できない場合は fail-closed とする。

### Traceability / OPEN Issues

Relay Requirements `RR-001`〜`RR-011`、`RR-NFR-*`、Relay Design の責務・session・generation・opaque boundary・scaling・failure 方針、および Handoff §7〜§9 の concrete handoff contract への traceability は確認できた。`OPEN-RELAY-001`〜`OPEN-RELAY-005` も generation format、storage / deployment、reconnect、retry mapping、運用 resource policy に限定され、上流で未決の事項を勝手に確定していない。

### 基本設計・Specification 粒度

Relay 実装者が追加判断せずに必要な server-side transport contract を実装できるよう、endpoint responsibility、admission、routing isolation、lifecycle、retention、duplicate / replay、concurrency、failure、resource control、privacy および acceptance invariant が定義されている。反面、具体的な storage API、Redis key、queue algorithm、cluster topology、deployment、retry interval、metric 名または rate-limit の追加値を固定しておらず、実装詳細への過剰な踏み込みも確認されなかった。RLS-001 を解消すれば、下位実装・contract test へ進められる粒度である。

## 最終判定

- 指摘件数: `ERROR 1 / WARN 0 / NIT 0`
- 主要指摘: `RLS-001` — ACK / cancel の HTTP response semantics が Handoff §9.6 と不一致。
- Specification 内で修正可能な指摘: `RLS-001`。ACK / cancel の endpoint-specific response matrix、一般 404 規則との例外、state-loss / race 時の state transition を同期する。
- 上流へ戻す必要がある指摘: なし。Handoff §9.6 は既に authority として確定している。
- 最終判定: **REVISE SPECIFICATION**
- **RELAY SPECIFICATION READY: 不可**。`RLS-001` 解消後に再レビューする。

## Validation

- Requirement → Design → Handoff / Common Specification → Relay Specification の traceability: Relay Requirements、Relay Design、Interface Specification、Signing Protocol Specification、SDK Specification および Handoff §7〜§9 を照合した。
- Handoff endpoint / field / credential / TTL / ACK / cancel: Handoff §9.1〜§9.7 と対象 §5〜§13 を照合し、RLS-001 を確認した。
- 相対リンク: レビュー成果物から参照する対象 Specification、Requirements、Design、Handoff および関連 Specification のリンク先を確認した。
- review ID 重複: `RLS-001` は本レビュー内で一意であり、既存の `docs/reviews/specifications/` 成果物を上書きしていない。
- 対象本文: `docs/specifications/relay.md` はレビュー中に変更していない。
- Markdown / formatter: `pnpm exec prettier --check docs/reviews/specifications/relay-review-001.md` を実施し、成功した。
- `git diff --check`: 実施し、今回の成果物由来の whitespace error はなかった。未追跡段階の成果物についても `git diff --no-index --check /dev/null docs/reviews/specifications/relay-review-001.md` で確認した。
- repository 全体 `pnpm format:check`: 既存の `_nem`、`_sns`、`_snwc`、`_symbol` 配下に多数の format warning があり、さらに既存 HTML の構文エラー（`_nem/.../cddl + gplv2 with classpath exception - cddl+gpl.html`、`_sns/.../symbol-qr-library/examples/index.html`）で失敗した。今回のレビュー成果物は個別 Prettier check に成功しており、全体 formatter の失敗は今回の変更起因とは判定しない。
- lint / typecheck / test / build: レビュー成果物のみの変更であるため、実装検証としては実施対象外とする。
