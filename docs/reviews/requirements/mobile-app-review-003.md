# MosaicLynx モバイルアプリ要件定義書再レビュー

## レビュー情報

- 対象: `docs/requirements/mobile-app.md`
- 確認日: 2026-08-24
- 対象コミット: `6b7a0c1`（`docs: モバイルアプリ要件の再レビュー指摘を反映しました`）
- 判定: `READY`
- 対象範囲: モバイル固有要求 `MR-001`〜`MR-013`、受け入れ条件 `MR-AC-001`〜`MR-AC-014`、追跡可能性、未決事項、共通要件および責任境界
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。前回レビュー、コンセプトシート、共通要件、Relay / プロファイル関連資料、モバイル資料、下流仕様および外部 wallet-core 契約を照合した。下流資料は要求の根拠ではなく、整合確認または後続引継ぎとして扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行版は仕様化へ進められる。Android / iOS の個別マイルストーン、外部要求の検証、秘密情報分離、アプリ管理下の確認・承認、OS ライフサイクル後の再検証、明示的な再認証、wallet-core と OS 保護の責任分担、端末移行・紛失時の説明責任、Relay の責任境界、配布・Mainnet 判定条件・更新互換性が、要求と外部確認可能な受け入れ条件へ追跡されている。

前回レビューの残存指摘も解消されている。`MR-AC-005` はロック解除・署名前再認証の明示操作と認証失敗時の安全側終了を確認し、`MR-AC-002` は送信者、チェーン / ネットワーク / アカウント、許可状態、要求内容の完全性を列挙している。`MR-012` はモバイル側の復号・検証・表示・承認・署名責任まで `MR-AC-002`、`MR-AC-003`、`MR-AC-005`、`MR-AC-013` へ追跡し、`MR-013` は公開審査・サポート情報・Mainnet 判定条件とバックアップの更新互換性を `MR-AC-009`、`MR-AC-014` へ追跡している。

仕様化を阻害する `ERROR`、`WARN`、`NIT` は確認されなかった。

## 指摘事項

| 指摘 ID | 重大度 | 状態     | 根拠                                                                            | 影響                         | 必要な修正 |
| ------- | ------ | -------- | ------------------------------------------------------------------------------- | ---------------------------- | ---------- |
| —       | —      | 該当なし | 全 `MR-*` と `MR-AC-*` の対応、上流根拠、責任境界、未決事項への引継ぎを確認済み | 仕様化を阻害する残存指摘なし | なし       |

## 前回レビュー指摘の対応状況

- `MREQ2-001`（`MR-006` の明示操作要求が受け入れ条件で判定できない）: **解消**。`MR-AC-005` が、ロック解除・署名前再認証の明示操作、古い認証状態からの自動復帰禁止、認証不能・失敗時の署名拒否を明記している。
- `MREQ2-002`（`MR-002` の検証対象・完全性の追跡可能性が弱い）: **解消**。`MR-AC-002` が検証対象を列挙し、`MR-002` の上流根拠に `CR-NFR-009` が追加されている。
- `MREQ2-003`（`MR-012` のモバイル側責任が個別受け入れ条件へ追跡されていない）: **解消**。`MR-012` の追跡可能性がモバイル側の検証・表示・承認・認証・署名を複数の受け入れ条件へ明示的に対応付け、`MR-AC-013` にもモバイル側責任が記載されている。
- `MREQ2-004`（`MR-013` の配布条件・バックアップ更新互換性の追跡不足）: **解消**。`MR-AC-009` が公開審査条件と owner-controlled サポート情報を含み、`MR-AC-014` がバックアップを提供する場合の更新互換性を含んでいる。

## 確認できた整合事項

- `MR-001` と `MR-AC-001` は、コンセプトシートおよび共通要件の Android / iOS 個別マイルストーンと実施順序に整合する。現在のワークスペースにモバイル実装がないことを、実装済み機能として扱っていない。
- `MR-002`〜`MR-006` と対応する受け入れ条件は、外部入力を信頼しないこと、確認領域での明示承認、要求と承認の一致、ライフサイクル後の再検証、認証不能時の安全側終了を方式非依存で定めている。
- `MR-007` は wallet-core の正本範囲とモバイルアプリケーションの処理の調整 / UI / プロファイル責任を分離している。`_snwc` 資料も上流根拠ではなく外部コンポーネント契約として区分されている。
- `MR-009` はバックアップ / 復元を提供する場合の説明責任だけを定め、v1 共通 MUST または共通完了条件へバックアップを追加していない。これは共通要件 `CR-014` と整合する。
- `MR-012` は Relay を署名対象の意味解釈、署名、秘密情報処理、アナウンスの主体にせず、モバイルが受信要求を処理する責任境界を維持している。Relay 固有の API や暗号形式は下流へ委ねている。
- `MR-013` と `MR-AC-009` は、Mainnet 判定条件が成立しない場合に Mainnet 対応能力を有効化・公開しない共通方針へ追跡されている。ストアの詳細、OS 対応範囲、ロールバックは未決事項・リリース設計へ適切に引き継がれている。
- API、スキーマ、OS API、バインディング、KDF / AEAD、保存領域、Relay プロトコル、画面遷移および移行 / ロールバックの具体方式を、本要件で新たに固定していない。

## 未決定事項・引継ぎ

1. `MR-OPEN-001`〜`MR-OPEN-008` は、OS 対応、要求受信方式、OS 保護と wallet-core バインディング、認証、ライフサイクル、バックアップ / 移行、画面露出、ストア / リリース条件として明示的に管理されている。各決定時には、対応する `MR-*` と `MR-AC-*` を更新する。
2. `docs/specifications/web-transaction-handoff-spec.md`、`docs/specifications/profile-account-spec.md`、`docs/mobile/*` およびリリース資料は、現行要件を具体化・運用化する下流資料である。既存の下流契約にある具体判断を変更する場合は、モバイル要件だけでなく該当仕様・受け入れ条件も同時に整合させる。
3. メッセージ署名と Web 受け渡し仕様の範囲については、共通要件レビューで記録された下流整合課題として扱う。本モバイル要件の上流根拠を下流仕様へ置き換える必要はない。

## 検証

- `pnpm exec prettier --check docs/requirements/mobile-app.md docs/reviews/requirements/mobile-app-review-003.md`: 成功。
- `git diff --check`: 成功。
- `pnpm format:check`: 終了 130。既存の `_nem`、`_sns`、`_snwc`、`_symbol` サブモジュール内に大量の既存形式警告と HTML 構文エラーがあり、対象外の全体走査を停止した。成功とは扱わない。

## 未検証

- 文書レビューのため、モバイル実装、iOS / Android ビルド、ストア配布、OS Keychain / Keystore、wallet-core バインディング、Relay 統合、Mainnet リリース証跡の生成・署名・検証は実行していない。
- iOS / Android の最新 OS / ストア仕様を新しい要求の根拠として採用する調査は行っていない。対象文書は具体的プラットフォーム API と配布条件を未決事項・下流設計へ委ねている。
- 全体 `pnpm format:check` は、対象文書・レビュー成果物以外の既存サブモジュールの問題により完了していない。

## 参照資料

- `docs/requirements/mobile-app.md`
- `docs/requirements/requirements.md`
- `docs/requirements/relay.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/design/architecture.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `docs/mobile/mobile-store-release.md`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `docs/reviews/requirements/mobile-app-review-001.md`
- `docs/reviews/requirements/mobile-app-review-002.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
