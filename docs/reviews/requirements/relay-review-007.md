# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `READY`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件、Architecture、Web Transaction Handoff Specification および Relay / SDK / protocol 実装との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-006` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行要件は仕様化へ進められる状態である。Relay と Signer の責任境界、transaction signing / message signing の必須範囲、opaque envelope、transport credential と E2E secret の分類、App Link の verified client-side handoff、bounded retention、安全側失敗、正常系 handoff、Traceability が一貫している。

前回の generation 指摘も、Relay が plaintext / opaque ciphertext の過去利用履歴を判定する責任を持たず、current generation に対する structural validation を担い、App が generation-bound AEAD / AAD validation に失敗した request を承認・署名・success へ進めない責任分担へ整理された。旧 ciphertext の一時保存を要件違反としないこと、ただし有効 handoff・署名・成功へ到達させないことが受け入れ条件へ明示されている。

## 指摘事項

重大度 `ERROR` / `WARN` / `NIT` の未解決指摘はない。

## 解消を確認した前回指摘

- `relay-review-005` の `RREQ5-001`: `appToken` は Relay endpoint authorization credential として E2E secret と分離され、verified client-side handoff と Relay-facing URL / HTTP request への非露出条件が明示されている。
- `relay-review-005` の `RREQ5-002`: state loss 後の旧 generation / identity の復活禁止と、旧 ciphertext の一時保存を許容しつつ App が署名前に拒否する境界が整理されている。
- `relay-review-005` の `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect`、`cosignTransaction` の Relay milestone 上の位置付けが明示されている。
- `relay-review-006` の `RREQ6-001`: Relay の structural rejection と App / End-to-End rejection が分離され、generation metadata 差し替え時の期待結果が受け入れ条件へ反映されている。
- `relay-review-006` の `RREQ6-002`: generation-aware API、schema、AAD、SDK、protocol、実装および fault injection を下流引継ぎへ明記し、現行実装を検証済み evidence としないことが要件本文に追記されている。

## 確認できた整合事項

- 上流根拠は Concept Sheet と共通要件に限定され、兄弟要件・Architecture・Product Specification と下流仕様・実装 evidence の役割が区別されている。
- `RR-001` / `RR-002` と `RR-AC-007`〜`RR-AC-010` は transaction signing と message signing の handoff、利用者承認、結果の request / signer / Account / Chain / Network / operation 対応を追跡できる。
- `RR-003`、`RR-AC-006` は Relay の structural / transport validation と Signer の semantic validation・表示・承認を区別し、Relay が plaintext を復号・解釈しない境界を維持している。
- `RR-006`、`RR-NFR-003`、`RR-AC-003`、`RR-AC-011` は generation loss、旧 identity、retry、fresh approval、bounded retention を、durable payload / ciphertext history を要求しない形で整合させている。
- `RR-008`、`RR-NFR-004`、`RR-AC-006` は signing secret、Relay endpoint authorization credential、E2E session secret / derived encryption material の分類と非露出条件を追跡できる。
- `RR-NFR-005`、`RR-OPEN-002`、`RR-AC-012` は失敗を成功と区別し、retry を新しい request / identity / approval とする最低保証を維持している。

## 下流引継ぎ・残存する非レビュー事項

- 現行の Relay server、`@mosaiclynx/relay-protocol`、SDK 実装には generation-aware endpoint、schema、AAD および state-loss fault injection がまだ反映されていない。要件書自身がこれを検証済み evidence としないことを定めているため、要件レビューの阻害指摘とはしない。実装・仕様レビューでは、generation contract の実装完了とテスト evidence を別途確認する必要がある。
- `RR-OPEN-001` / `RR-OPEN-002` に残る wire contract、error code、retry の粒度、milestone 詳細条件は、本文の最低保証を弱めない範囲で下流仕様へ引き継ぐ。

## Validation

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-007.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-007.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

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
- `docs/architecture/architecture.md`
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
- `docs/reviews/requirements/relay-review-006.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
