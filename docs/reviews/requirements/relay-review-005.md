# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件、Architecture、Web Transaction Handoff Specification および Relay 実装との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-004` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューまでの指摘である、opaque envelope の構造検証境界、message signing の v1 対象化、state loss 後の旧 identity 再利用禁止、transport credential と E2E session secret の分類、bounded retention、安全側失敗分類、正常系受け入れ条件および Traceability は現行要件へ反映されている。Relay が署名対象を意味解釈・表示・承認・署名せず、Mobile が復号・検証・承認・署名し、dApp が結果を独立検証する責任境界も概ね適切である。

ただし、現状は仕様化へ進めない。下流 Web handoff 仕様では `appToken` が Relay endpoint authorization credential として App Link の URL fragment に渡される一方、現行要件は URL fragment への raw authorization credential の露出を禁止する書き方になっている。E2E session secret の一時 handoff だけを許容する補足では `appToken` を解決できない。また、Relay state loss 後の旧 identity / ciphertext の再登録禁止を MUST としているが、下流仕様と現行 Redis 実装は揮発性 state の消失後に同じ identity を判別できる仕組みを示していない。

## 指摘事項

### RREQ5-001 — `ERROR` — `appToken` の分類と App Link fragment の許否が要件・下流仕様で未整合

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:125-131,227`、`docs/specifications/web-transaction-handoff-spec.md:426-437,531-537,562-580,698-705`、`docs/design/architecture.md:209`
- 根拠: Relay 要件 `RR-008` は Relay endpoint authorization credential を raw 値の URL query / fragment、ログ、診断等へ露出しないと定める。続く記述は URL fragment 等の一時 handoff を E2E session secret のための client-side handoff として扱い、「Relay credential transport ではない」としている。しかし下流仕様は App Link を `#s={sessionSecret}&a={appToken}` とし、`appToken` を `Authorization: Bearer {appToken}` として request 取得・response 登録に使用する Relay endpoint authorization credential と定義している。Architecture も App Link fragment から session secret と App capability を受け取ると記載している。
- 影響: 現行 App Link を実装すると、`appToken` を URL fragment へ載せることが `RR-008` の禁止対象か、E2E secret handoff の例外として許容されるのかを判定できない。Relay credential を fragment に渡す場合の fallback、browser context、DOM、履歴、clipboard、診断情報への残存条件も、E2E session secret の条件だけでは閉じない。逆に fragment を禁止すると現行 Web handoff の App による Relay request 取得が成立しない。
- 必要な修正: `appToken` を Relay endpoint authorization credential と明示し、E2E session secret / derived encryption material と区別する。そのうえで、(1) App Link fragment に raw `appToken` を載せない方式へ下流仕様を変更するか、(2) verified App Link への一時的な client-side credential handoff として明示的に許容し、Relay credential transport ではないと扱える根拠、正規 App 以外・fallback・browser history・DOM・clipboard・diagnostics への非露出、処理後の除去および継続保持禁止を要件・共通要件・下流仕様で統一する。どちらを選ぶ場合も、`RR-AC-006` で `appToken` の扱いを判定できるようにする。具体的な token 形式や暗号方式は本要件で固定する必要はない。

### RREQ5-002 — `ERROR` — state loss 後の旧 identity / ciphertext 再登録禁止を実現する責任と状態保持が下流設計で未解決

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:109-113,170-174,224,232`、`docs/specifications/web-transaction-handoff-spec.md:603-620,739-748`、`apps/relay/src/redis-store.ts:6-20,107-115`、`apps/relay/src/memory-store.ts:31-37`
- 根拠: `RR-006`、`RR-NFR-003` および `RR-AC-003` は、Relay restart、state loss または storage loss の後に旧 request identity、旧 session identity または同一 ciphertext を新しい handoff として再登録・再処理してはならないと定める。下流仕様は tombstone の保持を必要に応じて最大24時間許容する一方、自己ホスト MVP では RDB / AOF / volume / backup を無効にした非永続 Redis を使用し、再起動時に進行中 session を失うとしており、replay 防止方式は後続設計へ委ねている。現行の Redis `create` 処理と Memory store は session key が存在しなければ作成するだけで、state loss 後の旧 identity / ciphertext を識別する tombstone、epoch または同等の外部状態を示していない。
- 影響: Relay state が完全に失われた直後、旧 create request を同じ session identity で再送すると、現行の保存モデルでは新規 session として登録できる。旧 ciphertext が再処理される経路も要求上は禁止されているため、単に SDK が通常 retry で新しい identity を生成するだけでは `RR-006` と `RR-AC-003` の保証を満たしたことにならない。再起動・障害時の安全側 timeout と、攻撃者による旧 request の再登録拒否の責任主体も未確定である。
- 必要な修正: state loss 後にも旧 identity / ciphertext を拒否できる durable tombstone、epoch / key rotation または同等の仕組みを設けるのか、Relay が保持しない場合に SDK / App 側の認証済み transport context がどのように旧 request を再登録不能にするのかを確定する。少なくとも「正規 retry は新しい identity と承認を使う」だけでなく、fault injection で Relay restart、Redis state loss、旧 create request の再送、同一 ciphertext の再送、遅延配送を確認できる責任境界を下流仕様へ定義する。非永続 Redis を維持するなら、要求を満たすための state を Redis 外で持つか、要件の適用対象・脅威モデルを明確に変更する必要がある。

### RREQ5-003 — `WARN` — Relay v1 の operation 範囲が下流 handoff 契約と完全には対応していない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:23-25,56-68,228-231,260-266`、`docs/specifications/web-transaction-handoff-spec.md:13-21,42-51`、`docs/design/architecture.md:198-209`
- 根拠: Relay 要件は transaction signing と message signing の request / result を v1 の必須範囲として定め、正常系受け入れ条件もこの二つの operation に限定している。一方、Web handoff 仕様の v1 operation 対応表は `connect`、`refreshActiveAccount`、`disconnect`、`signTransaction`、`signData`、`cosignTransaction` を対象とし、Architecture も Relay session と App Link をこれらの SDK / Mobile handoff に使用する責務を記載している。
- 影響: `connect` 等の非署名 operation と `cosignTransaction` が Relay milestone の対象なのか、別の Mobile / SDK 要件でのみ保証するのかを、Relay milestone の完了判定から再現できない。対象である場合は、正常な受け渡し、結果の対応、利用者拒否・切断・未対応・結果不明の安全側失敗を Relay 固有 acceptance で確認できない。対象外である場合は、下流仕様が Relay v1 の提供物として記載する範囲と衝突する。
- 必要な修正: Relay v1 が transport として保証する operation の境界を明示する。非署名 operation を含めるなら、署名 operation と混同しない result / failure、要求元・Account・session の対応および正常系・安全側失敗の受け入れ条件を追加し、`RR-OPEN-001` と Traceability に追跡する。含めないなら、Web handoff 仕様・Architecture・milestone 表で Relay の対象外または別責任であることを明記する。`CR-007` の transaction signing / message signing の必須範囲を弱める変更は行わない。

## 確認できた整合事項

- `RR-003` は plaintext の復号・意味解釈と、envelope 外形・サイズ・期限・authorization・lifecycle 等の transport / structural validation を区別している。
- `RR-008` は signing secret、Relay endpoint authorization credential、E2E session secret / derived encryption material を別分類し、Relay が E2E envelope を復号できない境界を定めている。ただし `appToken` の URL handoff については RREQ5-001 の未解決が残る。
- `RR-NFR-003`、`RR-AC-011` は終端後の bounded retention、再利用不能、履歴・分析・ユーザーアカウントサービス化の禁止を MUST として追跡している。
- `RR-AC-006` は malformed envelope、oversized input、invalid lifetime、unsupported protocol / version、unauthorized credential、correlation / lifecycle 不正、duplicate / replay / stale state を、plaintext 復号なしに安全側へ拒否する条件へ具体化している。
- `RR-AC-009` / `RR-AC-010` は transaction signing と message signing の正常 handoff を、request、signer、Account、Chain、Network および operation の対応まで確認する。
- 現在のワークスペースには Mobile アプリ実装は存在しない。下流 Mobile handoff の記述を実装済み機能や検証済みの受け入れ結果として扱っていない。

## 未決事項・引継ぎ

1. `RREQ5-001`: `appToken` の Relay endpoint authorization credential としての分類、App Link fragment の許否、fallback / browser context の非露出条件を要件・共通要件・Web handoff 仕様で統一する。
2. `RREQ5-002`: volatile Relay state loss 後の旧 identity / ciphertext 再登録を、どの主体のどの状態で拒否するかを確定し、fault injection の受け入れ条件へ引き継ぐ。
3. `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect`、`cosignTransaction` を Relay milestone の対象に含めるか、含めない場合の責任主体と下流文書の境界を確定する。
4. 上記が解決した後、Relay milestone の最低条件、Web handoff、Architecture、Relay protocol / SDK / server 実装および integration test の整合を再確認する。

## Validation

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-005.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-005.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

## Not validated

- 要件レビューのため、Mobile アプリ、Relay production deployment、iOS / Android App Link、wallet-core Binding、Mainnet release evidence の生成・署名・検証は実行していない。
- Redis integration test は要件の整合判定に不要なため実行していない。
- 本成果物では要件本文、下流仕様、Architecture、実装およびテストを修正していない。

## 参照資料

- `docs/requirements/relay.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/design/architecture.md`
- `apps/relay/src/redis-store.ts`
- `apps/relay/src/memory-store.ts`
- `apps/relay/test/app.test.ts`
- `apps/relay/test/redis.integration.test.ts`
- `packages/relay-protocol/src/index.ts`
- `packages/sdk/src/mobile-relay.ts`
- `docs/reviews/requirements/relay-review-001.md`
- `docs/reviews/requirements/relay-review-002.md`
- `docs/reviews/requirements/relay-review-003.md`
- `docs/reviews/requirements/relay-review-004.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
