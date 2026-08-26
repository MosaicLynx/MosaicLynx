# MosaicLynx Relay Specification 再レビュー

## レビュー情報

- 対象: [`docs/specifications/relay.md`](../../specifications/relay.md)
- 前回レビュー: [`relay-review-001.md`](./relay-review-001.md)
- 対象 revision: `fbfd2cd`（前回レビュー対象 `2760960` から ACK / cancel semantics を修正）
- 比較対象: [`web-transaction-handoff-spec.md §9.6`](../../specifications/web-transaction-handoff-spec.md#96-ack-と-cancel)
- 確認日: 2026-08-27
- レビュー種別: Specification Review（RLS-001 focused re-review）
- 使用 Skill: `spec-review`
- 実施方法: `spec-review` Skill と `.agents/project-context.md` を適用した単独レビュー。前回レビュー以降の `relay.md` の修正差分を起点に、Handoff §9.6 / §9.7、Relay Specification §5.2、§7.2、§8.2、§11.5、§13、§14.1、§15.1、§16.1、§20、§22 を照合した。前回レビュー済みの他領域は、RLS-001 の修正による矛盾・回帰の有無だけを確認した。
- 変更範囲: 本レビュー成果物のみを新規作成した。対象 Specification、Concept、Requirements、Design、他の Specification、ADR、実装、テストおよび前回レビューは変更していない。

## 総評

RLS-001 は解消されている。Relay Specification は Handoff §9.6 の endpoint-specific semantics を明示し、外形が妥当な ACK / cancel へ常に `204 No Content` を返す一方、state mutation は正しい endpoint-scope の `webToken` と対象 state / generation / lifecycle を確認できた場合だけ適用する契約へ更新されている。

wrong token、unknown session、purged / terminal / expired state、duplicate operation、generation mismatch および state loss / restart 後に対象 state を確認できない場合は、外形が妥当であれば同じ `204 No Content` の no-op となる。これにより token validity、session existence、terminal / purge state および state loss を HTTP response の差異から推測させない。`204` が signing success、signing cancellation success、未署名または application processing success を証明しないことも ACK / cancel ごとに明記されている。

確認した修正範囲に新しい `ERROR`、`WARN` または `NIT` はない。既存の OPEN 項目、具体的な storage / deployment、reconnect、retry mapping および運用 resource policy は今回の修正による回帰ではなく、前回レビューから継続する非 blocker である。

## 判定

### READY

RLS-001 が解消され、ACK / cancel の HTTP response semantics、state mutation 条件、existence hiding、duplicate / race、state loss / restart および Relay の security / trust boundary が Handoff と整合している。新規指摘はない。

**RELAY SPECIFICATION READY**

## 指摘一覧

| ID      | Severity | Status   | 結果                                                                  |
| ------- | -------- | -------- | --------------------------------------------------------------------- |
| RLS-001 | ERROR    | RESOLVED | Handoff §9.6 と競合していた ACK / cancel の response semantics を解消 |

新規指摘: なし（`ERROR 0 / WARN 0 / NIT 0`）

## RLS-001 の解消確認

前回指摘は、一般的な `404 Not Found` / authorization failure rule と、Handoff §9.6 の「外形が妥当な ACK / cancel は常に `204 No Content`、正しい Web token の場合だけ状態変更する」という個別契約が Relay Specification 内で競合していたことである。

今回の修正では、次を明示している。

- §5.2 の endpoint 表で ACK / cancel の valid request に対する常時 `204 No Content` と条件付き purge を定義した。
- §8.2 で Handoff §9.6 の endpoint-specific semantics を一般的な `404` rule より優先し、structural validation failure だけを例外とした。
- §11.5、§13.1、§13.2、§14.1、§15.1、§16.1 で token mismatch、unknown / purged / terminal state、race、state loss / restart の HTTP response と mutation を同期した。
- ACK は `response_available → consumed`、cancel は未完了の active session を `cancelled` として扱う場合に限って mutation / purge し、それ以外は no-op とした。

したがって、前回指摘の実装分岐（`404` を返すか、Handoff に従い `204` を返すか）は解消されている。

## ACK / cancel response matrix

「外形が妥当」とは Handoff §9.6 が endpoint request として扱う method、path、header、body、protocol その他の structural validation を満たすことを指す。外形不正の request はこの matrix の対象外で、既存の Handoff structural error contract に従う。

| Operation / condition                                                                                                                                                | HTTP response                        | State mutation                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| ACK: valid shape、正しい endpoint-scope `webToken`、対応 session が `response_available`、current generation / lifecycle が有効                                      | `204 No Content`                     | `response_available → consumed` を一度だけ適用し、適用可能な Relay state を purge              |
| ACK: wrong token、unknown session、purged / consumed / cancelled / expired、duplicate ACK、generation mismatch、state loss 後に対象 state を確認不能                 | `204 No Content`                     | no-op                                                                                          |
| cancel: valid shape、正しい endpoint-scope `webToken`、対応する active session、current lifecycle で cancellation が適用可能                                         | `204 No Content`                     | session を `cancelled` として扱い、適用可能な Relay state を purge                             |
| cancel: wrong token、unknown session、purged / cancelled / consumed / expired、duplicate cancel、generation mismatch、state loss / restart 後に対象 state を確認不能 | `204 No Content`                     | no-op                                                                                          |
| ACK / cancel: malformed、wrong method、invalid path / header / body / protocol 等の structural failure                                                               | Handoff の structural error contract | mutation なし                                                                                  |
| ACK / cancel の duplicate / race（ACK vs ACK、cancel vs cancel、ACK / cancel vs expiry / purge / state loss 等）                                                     | valid shape なら `204 No Content`    | 適用可能な logical transition は一度だけ。競合側は no-op とし、terminal state を再活性化しない |

この matrix は、HTTP response の status と state mutation の条件を分離し、Handoff §9.6 の response semantics を ACK / cancel の両 endpoint に一貫して適用している。

## 重点確認結果

### Handoff §9.6 との整合

適合。Handoff §9.6 の method、Bearer `webToken`、ACK の `response_available → consumed`、cancel の未完了 session terminal 処理、valid request への常時 `204 No Content`、正しい Web token の場合だけの状態変更および purge 後の冪等 / existence hiding を Relay Specification §5.2、§8.2、§13.1、§13.2 が維持している。

### ACK semantics

適合。ACK の mutation 条件は endpoint-scope、対象 session、`response_available`、current generation / lifecycle の全確認に限定されている。成功した mutation は一度だけ `consumed` へ遷移し、duplicate ACK、terminal / purged state、wrong token、unknown session および state loss では mutation しない。ACK 自体は response の E2E 検証成功を前提とするが、Relay はその検証を行わず、ACK / `consumed` を signing success として表明しない。

### Cancel semantics

適合。cancel の mutation 条件は endpoint-scope、対応する active session、current lifecycle および cancellation applicability の全確認に限定されている。valid shape の wrong token、unknown、terminal / purged、duplicate、generation mismatch および state loss / restart 後の未確認 state は `204` の no-op であり、`cancelled` / purge を適用しない。cancel は Relay object の削除・無効化に限られ、Signer の signing cancellation 完了や未署名を表明しない。

### `204` と state mutation の分離

適合。ACK / cancel とも、valid shape への `204` は mutation の成功、session の存在、token の正しさ、signing success、signing cancellation success、未署名または application processing success を証明しない。mutation は別の条件評価として規定され、確認不能時は no-op となる。

### Existence hiding

適合。wrong token、unknown session、terminal / purged / expired state、duplicate、generation mismatch および state loss は、valid shape であれば全て `204 No Content` に統一される。§8.2 と §14.1 は一般的な `404` / authorization failure rule が ACK / cancel の endpoint-specific rule を上書きしないことを明示している。structural failure のみがこの例外の対象外であり、token validity や session existence の判定結果そのものとは分離されている。

### Duplicate / race semantics

適合。§13.1 / §13.2 は duplicate ACK / cancel を no-op とし、§15.1 は ACK vs ACK、cancel vs cancel、ACK / cancel vs expiry / purge / response submission / state loss / restart の競合で適用可能な logical transition を一度だけとする。CAS、Lua、lock、queue 等の実装方式を固定せず、terminal state の再活性化、state rollback、double response および cross-session delivery を禁止する契約は維持されている。

### State loss / restart / generation change

適合。§16.1 は current generation への切替、旧 active state / credential / approval / signing authorization の非復元、old identity の再開禁止を維持する。対象 state を確認できない ACK / cancel は mutation せず、valid shape なら Handoff §9.6 に従って `204 No Content` を返す。旧 state を HTTP response から推測させず、fresh generation / identity / envelope / client-side validation / approval を要求するため、修正による externally observable semantics の回帰はない。

### 一般 `404` / authorization failure rule との関係

適合。§8.2 の一般則は「Handoff の共通 `404` / error body を使用する endpoint」に限定され、その直後に ACK / cancel の endpoint-specific exception が置かれている。§14.1 も authorization、not found、terminal、expired、consistency failure の各行で同じ優先関係を再確認している。ACK / cancel の valid shape に `404` を返す解釈は残っていない。

### `204` の意味境界

適合。§13.1 / §13.2 / §13.3 / §14.3 および §20 は、Relay の accepted、stored、delivered、acknowledged、consumed、cancelled、purge、`204` を signing approval、signing success、signing cancellation success、未署名、`RESULT_UNKNOWN` または `DELIVERY_UNKNOWN` と同一視しない。`204` は transport operation の外形応答に限定されている。

### Security / Trust Boundary

適合。今回の修正は既存の Relay の opaque / untrusted transport 境界を維持し、transaction / message の復号・意味解釈、approval、authentication、signing、wallet、Account / permission authority、E2E secret の受信・保持を追加していない。raw token、session secret、ciphertext、plaintext、不要な identity linkage の非露出、fail-closed、generation binding、terminal reuse 防止も維持されている。新しい endpoint、error code、error taxonomy、token model、signing result または trust authority は追加されていない。

## 新規指摘・回帰

- 新規 `ERROR`: なし
- 新規 `WARN`: なし
- 新規 `NIT`: なし
- RLS-001 の修正に起因する回帰: なし
- 既存 OPEN 項目: generation exact format、storage / deployment topology、reconnect / resume policy、retry / transport failure mapping、operational resource policy。今回の focused re-review の blocker ではない。

## 参照資料

- [`relay.md`](../../specifications/relay.md)
- [`relay-review-001.md`](./relay-review-001.md)
- [`web-transaction-handoff-spec.md §9.6`](../../specifications/web-transaction-handoff-spec.md#96-ack-と-cancel)
- [`web-transaction-handoff-spec.md §9.7`](../../specifications/web-transaction-handoff-spec.md#97-状態遷移と削除)
- [`relay.md §8.2`](../../specifications/relay.md#82-authorization-rules)
- [`relay.md §13.1`](../../specifications/relay.md#131-ack)
- [`relay.md §13.2`](../../specifications/relay.md#132-cancel)
- [`relay.md §14.1`](../../specifications/relay.md#141-failure-categories)
- [`relay.md §15.1`](../../specifications/relay.md#151-invariants)
- [`relay.md §16.1`](../../specifications/relay.md#161-restart--state-loss--reconnect)

## Validation

- Handoff §9.6 整合: Handoff §9.6 と Relay Specification §5.2、§8.2、§13.1、§13.2、§14.1、§15.1、§16.1 を照合し、valid shape の ACK / cancel は常に `204 No Content`、正しい Web token と対象 state の確認時だけ mutation となることを確認した。
- ACK / cancel response matrix: wrong token、unknown、purged、terminal、expired、duplicate、structural failure、state loss、restart および race の response / mutation を上表へ整理し、HTTP status と mutation を分離して確認した。
- state mutation 条件: ACK の `response_available → consumed`、cancel の active session → `cancelled` / purge、current generation / lifecycle、endpoint-scope token および no-op 条件を本文と照合した。
- existence hiding: valid shape の token mismatch、session 不在、terminal / purge、generation mismatch、state loss で同一 `204` となり、一般 `404` rule に ACK / cancel の例外が明記されていることを確認した。
- duplicate / race semantics: duplicate ACK / cancel は no-op、競合する logical transition は一度だけ、terminal reuse / rollback / double response が禁止されていることを §13.1、§13.2、§15.1 と照合した。
- state loss / restart semantics: generation change、old state / identity / credential / approval の非復元、valid shape の ACK / cancel の `204` no-op、fresh retry を §16.1 と Handoff §9.7 で照合した。
- 相対リンク: 本成果物の相対リンク先（対象仕様、前回レビュー、Handoff と各参照節）の存在を確認した。
- formatter: 本成果物に対する Prettier check を実施した。repository 全体 formatter の結果は下記のとおり分離して記録する。
- `git diff --check`: 本成果物を含む差分で実施した。
- 対象 Specification の非変更: `docs/specifications/relay.md` に今回のレビュー作業による差分がないことを確認した。

## 最終判定

- RLS-001: `RESOLVED`
- 指摘件数: `ERROR 0 / WARN 0 / NIT 0`
- 最終判定: **READY**
- **RELAY SPECIFICATION READY**: 可
