# Implementation Review: Profile Chain 単一化

## Review Target

- 対象: `2bdaba9`、`3b2f32e`、`59ac1af` とその変更範囲（`packages/core`、`packages/profile-backup`、`apps/extension`）
- 確認日: 2026-09-20
- 範囲: Profile / Account の単一 Chain 境界、Vault 保存・読込、backup 検証、Provider / Approval / UI の Chain binding、関連テスト
- 対象外: `_snwc`、Mobile の未実装コード、Relay / SDK の無変更領域、外部 node / browser 実 runtime
- 成果物: 本レビュー

## Execution Audit

サブエージェントは使用せず、Review Board Chair が次の4パスを独立して実施した。

- Reviewer A（仕様適合性）: Profile.chain、Account.chain / identity、permission、旧 store の扱いを Requirements / Specification / Design と照合
- Reviewer B（Security）: Profile-local authorization、Vault / secret path、storage validation、Provider / Approval 境界を確認
- Reviewer C（相互運用性）: Symbol / NEM、Mainnet / Testnet、chain-specific identity、既存 chain adapter / backup 契約を確認
- Reviewer D（品質・テスト）: TypeScript、保存状態、malformed / wrong chain、関連 unit test と validation script を確認

## Evidence Used

- `docs/requirements/requirements.md` `CR-017`、`CR-AC-020`
- `docs/specifications/profile-account-spec.md` §3、§4、§11、§12、§26
- `docs/specifications/browser-extension.md` §10、§24、§25
- `docs/design/architecture.md` §3、§6.6、§6.8
- `docs/design/interfaces.md` §6、§8
- `docs/design/security-design.md` §6、§9、§16
- `packages/core/src/domain.ts`、`packages/core/src/use-cases.ts`、`packages/core/src/ports.ts`
- `packages/profile-backup/src/index.ts`
- `apps/extension/src/vault.ts`、`apps/extension/src/background/`、`apps/extension/src/approval/`、`apps/extension/src/popup/`
- 関連 unit test と package manifest / TypeScript 設定

## Review Result

`REVISE IMPLEMENTATION`

## Summary

Profile / Account、Vault、Provider、Approval、UI の通常経路は `Profile.chain` と単一 `Account.identity` に移行され、同一 Profile 内の Chain 切替および旧 mixed store の自動 migration も除去されている。一方、Core の `PermissionService.grant` が Profile の固定 Chain / Network を検証せず権限を保存できるため、Core の公開 domain service 単体では permission invariant が成立しない。

## Finding Status

| ID     | Severity | Status     | 初出レビュー | 状態根拠                                                                             |
| ------ | -------- | ---------- | ------------ | ------------------------------------------------------------------------------------ |
| IR-001 | HIGH     | New / Open | 2026-09-20   | `PermissionService.grant` が Profile を参照せず arbitrary scope を保存する実装を確認 |

## Required Changes

### IR-001: Core PermissionService が Profile の固定 Chain / Network を検証しない

- 対象: `packages/core/src/use-cases.ts:139-166`
- 発生条件 / 事実: `PermissionService.grant(origin, profileId, scope, accountIds)` は `profileId` に対応する Profile を取得せず、Profile が Symbol でも NEM scope、または異なる Network scope の `PermissionGrant` を保存できる。
- 根拠: `CR-017`、`CR-AC-020`、`docs/specifications/profile-account-spec.md` §3、§11、`docs/design/interfaces.md` §6 / §8 は Account / permission / authorization を Profile の固定 Chain / Network と一致させることを要求する。
- 問題: Core の公開 permission service が単一 Chain invariant を保証しない。現在の Extension 直接経路は `assertEnabledScope` と filter で防いでいるが、同じ Core service または repository を利用する Signer が grant を信頼すると、異なる Chain の authorization state が同一 Profile に関連付く。
- 影響: Profile-local permission の integrity / authorization 境界が破れ、downstream の誤った Account / Scope binding を誘発する。現在の実装で直ちに署名が成立することまでは確認していないため、影響は permission state の不正保存から downstream に波及する範囲に限定して評価した。
- Severity 根拠: 現実的な Core service 呼出しで Profile-local authorization state を cross-chain に汚染でき、単一 Chain の security invariant に直接影響するため `HIGH` とする。
- 必要な最小修正: `PermissionService` が Profile repository を参照し、Profile 未存在、scope.network 不一致、scope.chain 不一致を保存前に拒否する。拒否時に permission repository を変更しないこと。
- 完了条件 / 再確認: mismatch chain、mismatch network、missing Profile の各テストが保存されないことを確認し、既存の valid grant と Extension test が成功することを再実行する。

## Optional Improvements

なし。

## Resolved Findings

なし。

## Upstream Feedback

なし。単一 Chain の要求・設計・仕様は実装判定に必要な範囲で確定している。

## Deferred Findings

- Browser 実 runtime の UI 操作、Service Worker 再起動、Extension reload 後の storage 実挙動は local unit test の対象外であり、別途 E2E / release readiness で確認する。
- `_snwc` の native / WASM Binding は変更対象外のため、Binding 内部の実装レビューは行っていない。

## Scope and Traceability

`CR-017` / `CR-AC-020` → Profile / Account Specification §3 / §11 → Architecture §6.6 / Interfaces §6 / Security Design §6・§16 → Core domain / Extension Vault / Provider / Approval の変更を追跡した。Core の Profile / Account validation、Extension の Profile scope filter、single identity projection、backup plaintext validation は確認済みである。IR-001 はそのうち Core permission service の Profile binding 欠落に限定する。

## Domain Checks

- Specification Conformance: Profile / Account の単一 Chain、Profile 固定 Chain、旧 mixed store 非互換、UI 表示および Provider projection を確認。IR-001 は permission service の例外。
- Security: Profile / Account / permission binding、storage rejection、approval signer identity、Vault の secret path を確認。秘密情報のログ・例外漏えいは確認されなかった。wallet-core の内部鍵処理と Binding は対象外。
- Interoperability: `deriveSharedAccount` の既存 fixed vector を変更せず、保存する identity を Profile.chain に限定した。Symbol / NEM および Mainnet / Testnet の選択境界を確認。
- Error / abnormal paths: old schema、mixed account、wrong chain scope、backup identity mismatch、wrong network の既存テストと実装を確認。IR-001 の mismatch permission test は未実装。
- Test quality: Core、profile-backup、Extension の targeted test / typecheck は通過。ただし Core PermissionService の Profile scope mismatch test が不足している。

## Validation Results

- `pnpm --filter @mosaiclynx/core typecheck`: PASS
- `pnpm --filter @mosaiclynx/core test`: PASS（5 tests）
- `pnpm --filter @mosaiclynx/profile-backup typecheck`: PASS
- `pnpm --filter @mosaiclynx/profile-backup test`: PASS（3 tests）
- `pnpm --filter @mosaiclynx/extension typecheck`: PASS
- `pnpm --filter @mosaiclynx/extension test`: PASS（10 files / 29 tests）
- 対象変更ファイルの Prettier check: PASS
- `git diff --check`: PASS
- 未実行: root lint、root test / build、Extension build、Browser E2E、external node / Binding runtime。IR-001 修正後に必要範囲を再実行する。

## Review Gates

| Gate                     | 判定 | 根拠                                                                                         |
| ------------------------ | ---- | -------------------------------------------------------------------------------------------- |
| 仕様適合性               | FAIL | IR-001: Core permission service が Profile scope を固定しない                                |
| Security                 | FAIL | IR-001: Profile-local authorization state を cross-chain に保存可能                          |
| 相互運用性               | PASS | chain adapter の fixed vector と network / chain projection は変更せず、単一 identity を選択 |
| 異常系                   | FAIL | mismatch permission の保存拒否が Core service で未検証                                       |
| テスト十分性             | FAIL | IR-001 を独立検出する Core test がない                                                       |
| 実装品質・runtime safety | PASS | 型、依存方向、変更対象の storage / UI 境界に追加の blocking defect は確認なし                |

## Remaining Risks and Open Decisions

- IR-001 が解消されるまで、Core `PermissionService` を Profile permission の trusted writer として利用できない。
- Browser E2E、Extension lifecycle、release evidence は本レビューの targeted validation では未確認。

## Automatic Changes

なし。レビュー中はレビュー成果物以外を変更していない。

## Final Decision

`REVISE IMPLEMENTATION`
