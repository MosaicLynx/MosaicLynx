# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件、Architecture、Web Transaction Handoff Specification および Relay / SDK / protocol 実装との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-005` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューの `appToken` と App Link fragment の credential 境界、および `connect` / `refreshActiveAccount` / `disconnect` / `cosignTransaction` の Relay milestone 範囲は、現行要件と下流文書で明確化されている。state loss 対策についても Relay generation context、generation binding、fresh retry、fault injection の要求が追加され、前回より追跡可能になった。

ただし、現状は仕様化へ進めない。現行の generation 設計は、Relay が opaque ciphertext を復号しないまま旧 create request を拒否するための検証可能な binding を定義していない。旧 create request の `generationId` だけを current 値へ差し替えて再送すると、現行 Relay の create 処理は generation を検証しないうえ envelope の外形だけを検査するため、同じ旧 ciphertext を current session として保存できる。App 側の AEAD 失敗によって署名を防げる可能性はあるが、要件・受け入れ条件が要求する「再登録・再処理しない」「metadata の単純な差し替えを受理しない」とは一致しない。

また、generation 契約は下流仕様へ追加されたものの、現行の Relay server、protocol 型、SDK の暗号化・登録処理にはまだ反映されていない。これは要件本文の上流欠陥とは区別すべきだが、下流引継ぎと実装 evidence が一致していないため、受け入れ条件を実行可能な状態にはできていない。

## 指摘事項

### RREQ6-001 — `ERROR` — generation metadata の差し替えを Relay が拒否できず、旧 ciphertext の再登録禁止と不整合

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:113-119,191,241,244`、`docs/specifications/web-transaction-handoff-spec.md:231-237,553-586,646-648`、`apps/relay/src/app.ts:116-147`、`apps/relay/src/types.ts:10-18`
- 根拠: `RR-006`、`RR-NFR-003` および `RR-AC-003` は、旧 generation の create request、identity、ciphertext を current generation の handoff として再登録・再処理してはならず、generation metadata の単純な差し替えも受理してはならないと定める。下流仕様は `generationId` を create metadata と request / response の AAD に含め、Relay は current generation との一致と envelope 外形だけを検証する設計である。Relay は request / response plaintext を復号しないため、旧 create body の `generationId` を current 値へ変更し、旧 ciphertext をそのまま再送する操作を、現行の設計だけでは識別できない。現行 `apps/relay` の create path も `generationId` を受け付けず、session key の存在・期限・envelope 外形だけで登録する。
- 影響: 旧 ciphertext は App 側で AAD / generation mismatch として署名前に拒否できるとしても、Relay には current generation の session として保存され得る。これは「旧 ciphertext を current handoff として再登録しない」「generation metadata の単純差し替えを受理しない」という外部要求と、`RR-AC-003` / `RR-AC-006` の拒否条件を満たしたと判定できない。Relay が拒否すべき範囲と、App が署名を拒否すれば十分な範囲も分離されていない。
- 必要な修正: opaque ciphertext を復号せずに旧 generation binding を検証できる主体と契約を確定する。例えば、Relay が検証可能な generation-bound proof / commitment を create metadata に要求する、または Relay の責任を「旧 ciphertext の保存自体は起こり得るが、current generation の有効な handoff・署名へ進まない」と明示的に限定するなど、`RR-006` の「再登録禁止」の意味を要件・下流仕様・受け入れ条件で統一する。証明値を追加する場合も、request plaintext、暗号鍵、署名秘密情報を Relay に渡す方式にしてはならない。旧 create request、generation metadata 差し替え、旧 ciphertext 再送を含む fault injection の判定対象を、Relay の拒否と App の署名前拒否に分けて定義する。

### RREQ6-002 — `WARN` — generation 契約が下流仕様と現行 Relay / SDK / protocol 実装で未整合

- 状態: `OPEN / 下流実装へ引継ぎ`
- 対象: `docs/specifications/web-transaction-handoff-spec.md:249-256,525-531,553-586`、`apps/relay/src/app.ts:105-147`、`apps/relay/src/types.ts:10-18`、`packages/relay-protocol/src/index.ts:119-124,174-180`、`packages/sdk/src/mobile-relay.ts:133-163,176-205`
- 根拠: 下流仕様は `GET /v1/generation`、`CreateHandoffRequest.generationId`、`RelayRequestBase.generationId`、`RelayAAD.generationId`、current generation の取得と generation-bound encryption を要求する。一方、現行 Relay server に `/v1/generation` と create request の `generationId` 検証はなく、Relay protocol の `CreateHandoffRequest` にも generationId がない。`relayAad` は protocol、sessionId、direction、expiresAt だけを認証対象とし、SDK は generation context を取得せずに暗号化・登録している。
- 影響: 現行実装は下流仕様で必須化された generation-aware request を受け付けず、SDK / App 間の AAD も一致しない。`RR-AC-003`、`RR-AC-006`、`RR-AC-011` の fault injection と固定 vector を、現行の実装 evidence で検証できない。要件レビューの対象外であるコード修正を本レビューで行うべきではないが、仕様化完了・実装完了・受け入れ済みを混同するリスクがある。
- 必要な修正: generation 契約を実装へ反映する下流タスクとして、Relay endpoint、schema、SDK の current generation 取得、request / response AAD、protocol 型、Relay / SDK / protocol test、Redis restart / state loss fault injection を追跡する。実装が完了するまで、現行コード・テストを generation 要件の検証済み evidence として扱わない。generation の再登録禁止責任が RREQ6-001 で確定してから実装を開始する。

## 解消を確認できた前回指摘

- `relay-review-005` の `RREQ5-001`: `appToken` は Relay endpoint authorization credential と明示され、verified client-side handoff に限定して許容される条件が要件・Web handoff・Architecture で整合している。
- `relay-review-005` の `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect` は SDK / Mobile 契約、`cosignTransaction` は optional / existing contract として Relay milestone blocker 外へ整理されている。
- `relay-review-005` の `RREQ5-002` は generation context の追加により方向性が具体化された。ただし、旧 ciphertext の create metadata 差し替えを Relay が拒否できる契約は RREQ6-001 として残る。
- `RR-AC-006` は generation mismatch、generation metadata 改ざんおよびその他の structural validation を、plaintext 復号・semantic interpretation なしに安全側へ拒否する条件へ追跡している。

## 確認できた整合事項

- Relay が transaction signing と message signing の意味を解釈せず、Mobile が復号・検証・表示・承認・署名し、dApp が結果を独立検証する責任境界は維持されている。
- `RR-008` は signing secret、Relay endpoint authorization credential、E2E session secret / derived encryption material を別分類し、`appToken` の verified client-side handoff と Relay-facing URL / HTTP request の非露出条件を区別している。
- `RR-003` は plaintext の復号・意味解釈と、envelope 外形・サイズ・期限・authorization・lifecycle 等の transport / structural validation を区別している。
- `RR-AC-009` / `RR-AC-010` は transaction signing と message signing の正常 handoff を request、signer、Account、Chain、Network および operation の対応まで確認する。
- 現在のワークスペースには Mobile アプリ実装は存在しない。下流 Mobile handoff の記述を実装済み機能・検証済み受け入れ結果として扱っていない。

## 未決事項・引継ぎ

1. `RREQ6-001`: generation-bound proof / commitment を誰が検証するか、または旧 ciphertext の保存を許容して署名前拒否へ責任を限定するかを決定し、要件・Web handoff・受け入れ条件を統一する。
2. `RREQ6-002`: generation-aware API、schema、AAD、SDK、protocol、Relay 実装および fault injection test を下流工程へ引き継ぐ。現行実装を検証済み evidence としない。
3. RREQ6-001 解消後、旧 create request、generation metadata 差し替え、旧 identity、旧 ciphertext、遅延配送、Relay restart / Redis state loss の拒否境界を再レビューする。

## Validation

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-006.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-006.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

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
- `apps/relay/src/app.ts`
- `apps/relay/src/types.ts`
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
- `docs/reviews/requirements/relay-review-005.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
