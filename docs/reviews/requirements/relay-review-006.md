# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、追跡可能性、未決事項、共通要件、アーキテクチャ、Web トランザクション受け渡し仕様および Relay / SDK / プロトコル実装との整合
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、モバイル / ブラウザ拡張機能要件、アーキテクチャ、プロダクト仕様、Web トランザクション受け渡し仕様、Relay プロトコル / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-005` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューの `appToken` と App Link フラグメントの認証情報境界、および `connect` / `refreshActiveAccount` / `disconnect` / `cosignTransaction` の Relay マイルストーン範囲は、現行要件と下流文書で明確化されている。状態消失対策についても Relay 世代文脈、世代結び付け、新鮮な再試行、障害注入の要求が追加され、前回より追跡可能になった。

ただし、現状は仕様化へ進めない。現行の世代設計は、Relay が内容を解釈しない暗号文を復号しないまま旧作成要求を拒否するための検証可能な結び付けを定義していない。旧作成要求の `generationId` だけを現在の値へ差し替えて再送すると、現行 Relay の作成処理は世代を検証しないうえエンベロープの外形だけを検査するため、同じ旧暗号文を現在のセッションとして保存できる。アプリ側の AEAD 失敗によって署名を防げる可能性はあるが、要件・受け入れ条件が要求する「再登録・再処理しない」「メタデータの単純な差し替えを受理しない」とは一致しない。

また、世代契約は下流仕様へ追加されたものの、現行の Relay サーバー、プロトコル型、SDK の暗号化・登録処理にはまだ反映されていない。これは要件本文の上流欠陥とは区別すべきだが、下流引継ぎと実装根拠が一致していないため、受け入れ条件を実行可能な状態にはできていない。

## 指摘事項

### RREQ6-001 — `ERROR` — 世代メタデータの差し替えを Relay が拒否できず、旧暗号文の再登録禁止と不整合

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:113-119,191,241,244`、`docs/specifications/web-transaction-handoff-spec.md:231-237,553-586,646-648`、`apps/relay/src/app.ts:116-147`、`apps/relay/src/types.ts:10-18`
- 根拠: `RR-006`、`RR-NFR-003` および `RR-AC-003` は、旧世代の作成要求、識別情報、暗号文を現在の世代の受け渡しとして再登録・再処理してはならず、世代メタデータの単純な差し替えも受理してはならないと定める。下流仕様は `generationId` を作成メタデータと要求 / 応答の AAD に含め、Relay は現在の世代との一致とエンベロープ外形だけを検証する設計である。Relay は要求 / 応答平文を復号しないため、旧作成本文の `generationId` を現在の値へ変更し、旧暗号文をそのまま再送する操作を、現行の設計だけでは識別できない。現行 `apps/relay` の作成パスも `generationId` を受け付けず、セッション鍵の存在・期限・エンベロープ外形だけで登録する。
- 影響: 旧暗号文はアプリ側で AAD / 世代不一致として署名前に拒否できるとしても、Relay には現在の世代のセッションとして保存され得る。これは「旧暗号文を現在の受け渡しとして再登録しない」「世代メタデータの単純差し替えを受理しない」という外部要求と、`RR-AC-003` / `RR-AC-006` の拒否条件を満たしたと判定できない。Relay が拒否すべき範囲と、アプリが署名を拒否すれば十分な範囲も分離されていない。
- 必要な修正: 内容を解釈しない暗号文を復号せずに旧世代結び付けを検証できる主体と契約を確定する。例えば、Relay が検証可能な世代に結び付いた証明 / commitment を作成メタデータに要求する、または Relay の責任を「旧暗号文の保存自体は起こり得るが、現在の世代の有効な受け渡し・署名へ進まない」と明示的に限定するなど、`RR-006` の「再登録禁止」の意味を要件・下流仕様・受け入れ条件で統一する。証明値を追加する場合も、要求平文、暗号鍵、署名秘密情報を Relay に渡す方式にしてはならない。旧作成要求、世代メタデータ差し替え、旧暗号文再送を含む障害注入の判定対象を、Relay の拒否とアプリの署名前拒否に分けて定義する。

### RREQ6-002 — `WARN` — 世代契約が下流仕様と現行 Relay / SDK / プロトコル実装で未整合

- 状態: `OPEN / 下流実装へ引継ぎ`
- 対象: `docs/specifications/web-transaction-handoff-spec.md:249-256,525-531,553-586`、`apps/relay/src/app.ts:105-147`、`apps/relay/src/types.ts:10-18`、`packages/relay-protocol/src/index.ts:119-124,174-180`、`packages/sdk/src/mobile-relay.ts:133-163,176-205`
- 根拠: 下流仕様は `GET /v1/generation`、`CreateHandoffRequest.generationId`、`RelayRequestBase.generationId`、`RelayAAD.generationId`、現在の世代の取得と世代に結び付いた暗号化を要求する。一方、現行 Relay サーバーに `/v1/generation` と作成要求の `generationId` 検証はなく、Relay プロトコルの `CreateHandoffRequest` にも generationId がない。`relayAad` はプロトコル、sessionId、方向、expiresAt だけを認証対象とし、SDK は世代文脈を取得せずに暗号化・登録している。
- 影響: 現行実装は下流仕様で必須化された世代を考慮した要求を受け付けず、SDK / アプリ間の AAD も一致しない。`RR-AC-003`、`RR-AC-006`、`RR-AC-011` の障害注入と固定ベクターを、現行の実装根拠で検証できない。要件レビューの対象外であるコード修正を本レビューで行うべきではないが、仕様化完了・実装完了・受け入れ済みを混同するリスクがある。
- 必要な修正: 世代契約を実装へ反映する下流タスクとして、Relay エンドポイント、スキーマ、SDK の現在の世代取得、要求 / 応答 AAD、プロトコル型、Relay / SDK / プロトコルテスト、Redis 再起動 / 状態消失障害注入を追跡する。実装が完了するまで、現行コード・テストを世代要件の検証済み根拠として扱わない。世代の再登録禁止責任が RREQ6-001 で確定してから実装を開始する。

## 解消を確認できた前回指摘

- `relay-review-005` の `RREQ5-001`: `appToken` は Relay エンドポイント認可認証情報と明示され、検証済みクライアント側の受け渡しに限定して許容される条件が要件・Web 受け渡し・アーキテクチャで整合している。
- `relay-review-005` の `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect` は SDK / モバイル契約、`cosignTransaction` は任意 / 既存の契約として Relay マイルストーン阻害要因外へ整理されている。
- `relay-review-005` の `RREQ5-002` は世代文脈の追加により方向性が具体化された。ただし、旧暗号文の作成メタデータ差し替えを Relay が拒否できる契約は RREQ6-001 として残る。
- `RR-AC-006` は世代不一致、世代メタデータ改ざんおよびその他の構造上の検証を、平文復号・意味上の解釈なしに安全側へ拒否する条件へ追跡している。

## 確認できた整合事項

- Relay がトランザクション署名とメッセージ署名の意味を解釈せず、モバイルが復号・検証・表示・承認・署名し、dApp が結果を独立検証する責任境界は維持されている。
- `RR-008` は署名秘密情報、Relay エンドポイント認可認証情報、E2E セッション秘密情報 / 導出された暗号化資料を別分類し、`appToken` の検証済みクライアント側の受け渡しと Relay に公開する URL / HTTP 要求の非露出条件を区別している。
- `RR-003` は平文の復号・意味解釈と、エンベロープ外形・サイズ・期限・認可・ライフサイクル等の通信経路 / 構造上の検証を区別している。
- `RR-AC-009` / `RR-AC-010` はトランザクション署名とメッセージ署名の正常受け渡しを要求、Signer、アカウント、チェーン、ネットワークおよび操作の対応まで確認する。
- 現在のワークスペースにはモバイルアプリ実装は存在しない。下流モバイル受け渡しの記述を実装済み機能・検証済み受け入れ結果として扱っていない。

## 未決事項・引継ぎ

1. `RREQ6-001`: 世代に結び付いた証明 / commitment を誰が検証するか、または旧暗号文の保存を許容して署名前拒否へ責任を限定するかを決定し、要件・Web 受け渡し・受け入れ条件を統一する。
2. `RREQ6-002`: 世代を考慮した API、スキーマ、AAD、SDK、プロトコル、Relay 実装および障害注入テストを下流工程へ引き継ぐ。現行実装を検証済み根拠としない。
3. RREQ6-001 解消後、旧作成要求、世代メタデータ差し替え、旧識別情報、旧暗号文、遅延配送、Relay 再起動 / Redis 状態消失の拒否境界を再レビューする。

## 検証

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-006.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-006.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

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
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
