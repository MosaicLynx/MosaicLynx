# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `READY`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、追跡可能性、未決事項、共通要件、アーキテクチャ、Web トランザクション受け渡し仕様および Relay / SDK / プロトコル実装との整合
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、モバイル / ブラウザ拡張機能要件、アーキテクチャ、プロダクト仕様、Web トランザクション受け渡し仕様、Relay プロトコル / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-006` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行要件は仕様化へ進められる状態である。Relay と署名主体の責任境界、トランザクション署名 / メッセージ署名の必須範囲、内容を解釈しないエンベロープ、通信経路認証情報と E2E 秘密情報の分類、App Link の検証済みクライアント側の受け渡し、上限のある保持、安全側失敗、正常系受け渡し、追跡可能性が一貫している。

前回の世代指摘も、Relay が平文 / 内容を解釈しない暗号文の過去利用履歴を判定する責任を持たず、現在の世代に対する構造上の検証を担い、アプリが世代に結び付いた AEAD / AAD 検証に失敗した要求を承認・署名・成功へ進めない責任分担へ整理された。旧暗号文の一時保存を要件違反としないこと、ただし有効受け渡し・署名・成功へ到達させないことが受け入れ条件へ明示されている。

## 指摘事項

重大度 `ERROR` / `WARN` / `NIT` の未解決指摘はない。

## 解消を確認した前回指摘

- `relay-review-005` の `RREQ5-001`: `appToken` は Relay エンドポイント認可認証情報として E2E 秘密情報と分離され、検証済みクライアント側の受け渡しと Relay に公開する URL / HTTP 要求への非露出条件が明示されている。
- `relay-review-005` の `RREQ5-002`: 状態消失後の旧世代 / 識別情報の復活禁止と、旧暗号文の一時保存を許容しつつアプリが署名前に拒否する境界が整理されている。
- `relay-review-005` の `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect`、`cosignTransaction` の Relay マイルストーン上の位置付けが明示されている。
- `relay-review-006` の `RREQ6-001`: Relay の構造上の拒否とアプリ / エンドツーエンド拒否が分離され、世代メタデータ差し替え時の期待結果が受け入れ条件へ反映されている。
- `relay-review-006` の `RREQ6-002`: 世代を考慮した API、スキーマ、AAD、SDK、プロトコル、実装および障害注入を下流引継ぎへ明記し、現行実装を検証済み根拠としないことが要件本文に追記されている。

## 確認できた整合事項

- 上流根拠はコンセプトシートと共通要件に限定され、兄弟要件・アーキテクチャ・プロダクト仕様と下流仕様・実装根拠の役割が区別されている。
- `RR-001` / `RR-002` と `RR-AC-007`〜`RR-AC-010` はトランザクション署名とメッセージ署名の受け渡し、利用者承認、結果の要求 / 署名主体 / アカウント / チェーン / ネットワーク / 操作対応を追跡できる。
- `RR-003`、`RR-AC-006` は Relay の構造上の / 通信経路検証と署名主体の意味上の検証・表示・承認を区別し、Relay が平文を復号・解釈しない境界を維持している。
- `RR-006`、`RR-NFR-003`、`RR-AC-003`、`RR-AC-011` は世代消失、旧識別情報、再試行、新鮮な承認、上限のある保持を、永続的なペイロード / 暗号文履歴を要求しない形で整合させている。
- `RR-008`、`RR-NFR-004`、`RR-AC-006` は署名秘密情報、Relay エンドポイント認可認証情報、E2E セッション秘密情報 / 導出された暗号化資料の分類と非露出条件を追跡できる。
- `RR-NFR-005`、`RR-OPEN-002`、`RR-AC-012` は失敗を成功と区別し、再試行を新しい要求 / 識別情報 / 承認とする最低保証を維持している。

## 下流引継ぎ・残存する非レビュー事項

- 現行の Relay サーバー、`@mosaiclynx/relay-protocol`、SDK 実装には世代を考慮したエンドポイント、スキーマ、AAD および状態消失障害注入がまだ反映されていない。要件書自身がこれを検証済み根拠としないことを定めているため、要件レビューの阻害指摘とはしない。実装・仕様レビューでは、世代契約の実装完了とテスト根拠を別途確認する必要がある。
- `RR-OPEN-001` / `RR-OPEN-002` に残る通信上の契約、エラーコード、再試行の粒度、マイルストーン詳細条件は、本文の最低保証を弱めない範囲で下流仕様へ引き継ぐ。

## 検証

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-007.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-007.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

## 未検証

- 要件レビューのため、モバイルアプリ、Relay 本番環境配置、iOS / Android App Link、wallet-core バインディング、Mainnet リリース証跡の生成・署名・検証は実行していない。
- Redis 統合テストは要件の整合判定に不要なため実行していない。
- 本成果物では要件本文、下流仕様、アーキテクチャ、実装およびテストを修正していない。

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
- `docs/reviews/requirements/relay-review-006.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
