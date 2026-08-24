# MosaicLynx モバイルアプリ要件定義書 再レビュー

## レビュー情報

- 対象: `docs/requirements/mobile-app.md`
- 確認日: 2026-08-24
- 対象コミット: `9c72ff7`（`docs: モバイルアプリ要件のレビュー指摘を反映しました`）
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: Mobile 固有要求 `MR-001`〜`MR-013`、受け入れ条件 `MR-AC-001`〜`MR-AC-014`、Traceability、前回レビュー指摘の対応、共通要件および下流資料との責任境界
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。前回レビュー、Concept Sheet、共通要件、関連仕様、Mobile 資料、外部 wallet-core 資料を照合し、要求の上流根拠、受け入れ条件の判定可能性、下流資料の役割を確認した。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回の `MREQ1-001`（wallet-core 資料の根拠扱い）、`MREQ1-002`（Traceability 欠落）、`MREQ1-004`（iOS / Android 差異の分類）は、現行版で概ね解消されている。`MR-007` は Concept Sheet / 共通要件を上流根拠とし、`_snwc` 資料を外部コンポーネント契約へ分離した。`MR-*` と `MR-AC-*` の対応表、`MR-OPEN-*` の追跡表も追加され、前回の `MREQ1-003` で求めたライフサイクル、Wallet Store、端末喪失、Relay、更新および画面露出の受け入れ条件も追加されている。

一方、仕様化へ進めるには、受け入れ条件と Traceability の残りを修正する必要がある。`MR-006` の「利用者の明示操作なしにロック解除・再認証を完了しない」というセキュリティ要求が `MR-AC-005` で判定できない。また、`MR-002` の送信元・対象・許可状態・完全性の検証が `MR-AC-002` では一括表現に留まり、完全性に対応する共通要求 `CR-NFR-009` が Traceability に現れない。`MR-012` と `MR-013` にも、要求本文の責任・配布条件を受け入れ時に直接確認する対応が不足している。

## 指摘事項

### MREQ2-001: MR-006 の明示操作要求が受け入れ条件で判定できない

- 重大度: `ERROR`
- 状態: `Open`
- 根拠: `docs/requirements/mobile-app.md:60-64` の `MR-006` は、ロック解除および署名前の再認証を利用者の明示的操作なしに完了してはならないと定める。一方、`MR-AC-005`（`docs/requirements/mobile-app.md:158`）は、ロック、認証失敗、wallet-core 失敗、OS 保護状態喪失時に署名しないことだけを確認し、自動的な unlock / re-authentication の禁止を確認しない。
- 影響: 自動再認証後に署名へ進む実装を、現行の受け入れ条件だけでは不適合として判定できない。利用者の明示的承認とは別の認証状態の安全境界が抜ける。
- 必要な修正: `MR-AC-005` または独立した受け入れ条件に、ロック解除・署名前再認証が利用者の明示操作なしに完了しないこと、および認証不能・失敗時に署名しないことを明記する。PIN、OS credential、生体認証の具体方式は固定しない。

### MREQ2-002: MR-002 の検証対象と完全性の Traceability / 受け入れ条件が弱い

- 重大度: `WARN`
- 状態: `Open`
- 根拠: `MR-002`（`docs/requirements/mobile-app.md:34-38`）は送信元、対象、許可状態、署名要求の完全性を確認する MUST である。しかし `MR-AC-002`（`docs/requirements/mobile-app.md:155`）は「要求が検証されるまで進まない」とのみ記載し、検証対象を列挙していない。さらに Traceability の `MR-002` 行（`docs/requirements/mobile-app.md:221`）は `CR-NFR-001` と `CR-NFR-008` までで、署名要求内容の完全性に対応する `CR-NFR-009` を含めていない。
- 影響: 送信元・許可範囲の検証と、要求内容の改ざん・差し替え検証を同じ曖昧な「検証」として扱えるため、要求本文にあるセキュリティ境界を受け入れ時に個別判定できない。
- 必要な修正: `MR-AC-002` に送信元、対象 Chain / Network / Account、許可状態、要求内容の完全性を確認できない場合の拒否を明記し、`MR-002` の上流根拠に `CR-NFR-009`（必要に応じて `CR-005`）を追加する。URL、Intent、Relay の具体 schema や認証方式は決めない。

### MREQ2-003: MR-012 のアプリ側責任が個別受け入れ条件へ追跡されていない

- 重大度: `WARN`
- 状態: `Open`
- 根拠: `MR-012`（`docs/requirements/mobile-app.md:100-104`）は、スマホアプリが要求を復号・検証・表示・承認・署名する責任と、Relay がそれらを担わない責任を同時に定める。`MR-AC-013`（`docs/requirements/mobile-app.md:166`）が直接確認するのは Relay の非解釈・非署名・秘密情報非処理・非 announce だけで、アプリ側の責任は同表の `MR-012` 行（`docs/requirements/mobile-app.md:231`）から直接判定できない。Section 4.2 の横断表は `MR-AC-002`、`MR-AC-003` 等を挙げるが、要求別 Traceability では `MR-012` に `MR-AC-013` しか対応付けていない。
- 影響: Relay が署名しないことだけを確認して、アプリが受信要求を復号・検証し、確認領域で承認を経て署名する責任を満たしたと誤って判定する余地がある。
- 必要な修正: `MR-012` の Traceability と受け入れ条件に、アプリ側の復号後検証、確認領域での表示・承認、署名責任を、既存 `MR-AC-002`、`MR-AC-003`、`MR-AC-005` 等への明示追跡として追加する。Relay の暗号方式・API・状態遷移は固定しない。

### MREQ2-004: MR-013 の配布条件の一部が受け入れ条件へ追跡されていない

- 重大度: `WARN`
- 状態: `Open`
- 根拠: `MR-013`（`docs/requirements/mobile-app.md:106-110`）は、公開審査、release evidence、Mainnet gate、サポート情報に従う capability 制御と、backup を提供する場合の更新互換性を MUST とする。`MR-AC-009`（`docs/requirements/mobile-app.md:162`）は Mainnet gate と release evidence のみ、`MR-AC-014`（`docs/requirements/mobile-app.md:167`）は Profile metadata、Account、dApp 権限、opaque Wallet Store の破壊・置換のみを確認する。公開審査・サポート情報および backup の更新互換性を直接判定する条件がない。
- 影響: Mainnet capability の gate は確認できても、配布 build に必要な公開・サポート情報や backup 互換性の欠落を、Mobile 要件の受け入れ失敗として判定できない。
- 必要な修正: `MR-AC-009` または配布専用の受け入れ条件に、対象 platform の公開審査と owner-controlled support 情報の確認を追加する。backup を提供する場合は、`MR-AC-014` に更新互換性を追加するか、別の条件へ追跡する。Store の具体的審査項目、OS version、rollback 手順は `MR-OPEN-001`、`MR-OPEN-008` と下流 release 設計へ委ねる。

## 前回レビュー指摘の対応状況

- `MREQ1-001`（`MR-007` が `_snwc` 資料を製品要求の根拠として扱う）: **解消**。`MR-007` は Concept Sheet / 共通要件を上流根拠とし、`_snwc` 資料を外部コンポーネント契約として分離した。
- `MREQ1-002`（上流・下流・外部契約の区分と MR-* ごとの Traceability がない）: **解消**。Section 8 の `MR-*` / `MR-AC-*` 表、`MR-OPEN-*` 表、Section 9 の資料区分が追加された。
- `MREQ1-003`（MUST / SHOULD と受け入れ条件の対応不足）: **一部解消**。ライフサイクル、Wallet Store、端末喪失、Relay、画面露出、更新の条件は追加されたが、上記 `MREQ2-001`〜`MREQ2-004` が残る。
- `MREQ1-004`（iOS / Android 差異の要求・前提・未決事項の分類不足）: **解消**。Section 4 が独立 `MR-*` を追加しない前提、既存要求への適用、`MR-OPEN-*` への引継ぎとして整理された。

## 確認できた整合事項

- `MR-007` の上流根拠は `docs/concept/concept-sheet.md` と `docs/requirements/requirements.md` に置かれ、`_snwc` の README / requirements / specification / binding decision は外部コンポーネント契約として扱われている。
- `MR-001` の Android / iOS 個別 milestone と実施順序は Concept Sheet、共通要件 `OPEN-003` および現在 Mobile 実装を前提としないプロジェクトコンテキストと整合する。
- `MR-003`、`MR-004`、`MR-005`、`MR-008`、`MR-009`、`MR-011` の中心要求は、それぞれ対応する `MR-AC-*` と下流引継ぎへ追跡されている。
- `MR-009` は backup / restore を提供する場合の説明責任だけを要求し、v1 共通 MUST や共通完了条件へ backup を追加していない。共通要件 `CR-014` および Profile 仕様の適用範囲と整合する。
- `MR-012` の Relay 非解釈・非署名・秘密情報非処理・非 announce は、共通要件 `CR-011`、Relay 要件および E2E handoff の責任境界と整合する。ただし、アプリ側責任の直接追跡は `MREQ2-003` の対象である。
- `MR-013` の Mainnet fail-closed の方向性は、共通要件 `CR-NFR-006`、`CR-AC-008` および release evidence 資料と整合する。具体的な評価時点や運用方式を本要件で固定していない点は適切である。
- API、schema、OS API、Binding、KDF / AEAD、保存 key、画面遷移、Relay protocol の具体値を、今回の要件修正で新規に固定していない。

## 未決定事項・引継ぎ

1. `MR-OPEN-001`〜`MR-OPEN-008` の具体的な OS 対応、外部要求受信、OS 保護と wallet-core Binding、認証、lifecycle、backup / migration、画面露出、Store release 条件は、要求上の未決定事項として維持できる。ただし、各決定後は本レビューで残った受け入れ条件と Traceability の欠落を埋める必要がある。
2. `_snwc` の Wallet Store、秘密情報処理、raw signing、Binding は、`CR-013` と `MR-007` の責任境界を確認する外部契約であり、Mobile 固有の新しい上流要求をそこから導出しない。
3. `docs/specifications/product-spec.md`、`docs/architecture/architecture.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/*` は、Mobile 要件を具体化・運用化する下流または整合確認資料である。これらにのみ存在する具体的判断は、必要に応じて下流仕様・設計で扱う。

## Validation

- `pnpm exec prettier --check docs/requirements/mobile-app.md docs/reviews/requirements/mobile-app-review-002.md`: 成果物作成後に実行する。
- `git diff --check`: 成果物作成後に実行する。

## Not validated

- 文書レビューのため、Mobile 実装、iOS / Android build、Store 配布、OS Keychain / Keystore、wallet-core Binding、Relay integration、Mainnet release evidence の生成・検証は実行していない。
- iOS / Android の最新 OS / Store 仕様を新たな要求の根拠として採用する調査は行っていない。現行要件は具体的な platform API や配布条件を下流へ委ねているため、必要な時点で公式資料を確認する。

## 参照資料

- `docs/requirements/mobile-app.md`
- `docs/requirements/requirements.md`
- `docs/requirements/relay.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/architecture/architecture.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `docs/mobile/mobile-store-release.md`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `docs/reviews/requirements/mobile-app-review-001.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
