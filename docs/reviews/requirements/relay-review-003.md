# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件および下流 Web handoff 仕様との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001` / `relay-review-002` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューの主要指摘は概ね反映されている。message signing は Relay v1 の必須 handoff として Web Transaction Handoff Specification に追加され、E2E opaque envelope、平文 payload の非露出、state loss 後の旧 identity / ciphertext 再利用禁止、MAY の適用範囲および Relay milestone の最低条件も要件へ追記されている。`RR-008`、`RR-NFR-003`、`RR-NFR-005`、受け入れ条件および Traceability による責任境界も明確である。

ただし、現状は仕様化へ進めない。opaque envelope の「内容を検証してはならない」という要件が、下流仕様が必要とする envelope 外形、サイズ、期限、algorithm 等の安全な構造検証まで禁止するように読め、要件内部および下流仕様との間に実装上の矛盾が残っている。また、下流仕様の message signing 対象化後も、Relay 要件の参照資料に古い「message signing v1 対象外」の注記が残っている。

## 指摘事項

### RREQ3-001 — `ERROR` — opaque envelope の内容検証禁止が、必要な構造検証まで禁止する

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:70-78,214-226`、`docs/specifications/web-transaction-handoff-spec.md:498-498,519-536,615-620`
- 根拠: Relay 要件 `RR-003` は「Relay は envelope の内容を復号、解析、意味解釈、表示または検証してはならない」と定め、対象外の説明でも request / response envelope の「内容解析」を禁止している。一方、同じ要件の `RR-001`、`RR-005`、`RR-006`、`RR-007`、`RR-AC-002`、`RR-AC-003` は要求の完全性、対応関係、期限、重複および分離を Relay 経由で安全に検証できることを要求する。下流 Web handoff 仕様は、Relay が暗号文を復号しない一方で、session ID、期限、body size、algorithm、nonce、envelope の外形を検証し、適切な token / state transition を処理することを明記している。したがって「検証してはならない」は、禁止対象を plaintext の意味検証・署名対象の解釈に限定しない限り、下流仕様と両立しない。
- 影響: envelope の外形、サイズ、期限、許可された algorithm、session / direction などの AAD に対応する metadata を Relay が検証する実装が、Relay 要件違反と解釈され得る。逆に、外形検証まで行わない実装を `RR-003` の opaque 要求に適合扱いでき、malformed input、過大 body、期限不正および未知 algorithm の拒否責任が曖昧になる。
- 必要な修正: `RR-003` および `RR-AC-006` の禁止対象を「request / response の plaintext の復号、operation・message・transaction の意味解釈、署名対象の semantic validation、Signer 表示内容の検証」に限定する。Relay が handoff に必要な外形・サイズ・期限・許可された envelope metadata・credential authorization・状態遷移を検証できることを明記し、これらの検証結果から plaintext を復元・解釈できる metadata へ拡大してはならないと定める。暗号アルゴリズム、nonce、具体 schema または HTTP status を要件段階で追加固定する必要はない。

### RREQ3-002 — `NIT` — message signing 対象化後も古い下流注記が残っている

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:295-298`
- 根拠: `RR-OPEN-001`、下流工程への引継ぎ `6` および Web Transaction Handoff Specification の対応範囲は、transaction signing と message signing の両方を v1 対象として扱うよう更新されている。しかし参照資料の `docs/specifications/web-transaction-handoff-spec.md` の説明には、「message signing v1 対象外の記述は、本要件との整合課題として下流で修正する」と過去状態の注記が残っている。現行仕様には v1 対象外の記載がなく、この参照注記は現在の文書状態と一致しない。
- 影響: 今後のレビューや仕様化担当者が、message signing の対象範囲が未解決であると誤認し、既に確定した `RR-001`、`RR-002`、`RR-AC-010` の範囲を再び弱める可能性がある。要求の根拠・整合確認資料と下流引継ぎの区分も読みにくくなる。
- 必要な修正: 参照資料の注記を、message signing が v1 対象へ整合済みである旨へ更新するか削除する。仕様や要件の operation 範囲を変更する必要はない。

## 確認できた整合事項

- 共通要件 `CR-007` / `CR-007-MSG` と `RR-001` / `RR-002` / `RR-AC-009` / `RR-AC-010` の間で、transaction signing と message signing の v1 handoff 範囲が一致している。
- Relay は E2E opaque envelope の受け渡しだけを担い、平文 transaction / message / request / response を API、storage、backup、log、diagnostics、analytics、telemetry へ出さない責任境界が明記されている。
- `RR-006`、`RR-NFR-003`、`RR-AC-003`、`RR-AC-011` により、restart / state loss 後の旧 request identity、旧 session identity、同一 ciphertext の再登録・再処理を禁止し、retry に新しい identity と利用者承認を要求している。
- `MAY` が MUST、security boundary、受け入れ条件および Relay milestone 完了条件を弱めないこと、ならびに milestone の最低条件が `RR-OPEN-001` に追跡されている。
- transport credential と署名秘密情報の分離、bounded retention、安全側失敗分類、正常系 handoff、要求・結果の対応および Traceability は前回指摘を反映している。

## 未決事項

- opaque envelope に対して許容する構造検証と、禁止する plaintext / semantic 検証の境界を要件文言として確定すること。
- message signing 対象化済みの下流仕様に合わせ、参照資料の古い注記を整理すること。
- 上記を反映した後、Relay milestone の最低条件と Web handoff / implementation evidence の再確認を行うこと。

## 参照資料

- `docs/concept/concept-sheet.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/relay.md`
- `docs/architecture/architecture.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `apps/relay/README.md`
- `apps/relay/src/app.ts`
- `apps/relay/src/types.ts`
- `apps/relay/src/memory-store.ts`
- `apps/relay/src/redis-store.ts`
- `apps/relay/test/app.test.ts`
- `apps/relay/test/redis.integration.test.ts`
- `packages/relay-protocol/src/index.ts`
- `packages/relay-protocol/test/protocol.test.ts`
- `packages/sdk/src/mobile-relay.ts`
- `packages/sdk/test/mobile-relay.test.ts`
- `docs/reviews/requirements/relay-review-001.md`
- `docs/reviews/requirements/relay-review-002.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
