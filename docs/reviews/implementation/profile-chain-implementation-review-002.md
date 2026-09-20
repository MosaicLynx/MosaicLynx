# Implementation Review: Profile Chain 単一化（再レビュー）

## Review Target

- 対象: `2bdaba9`、`3b2f32e`、`59ac1af`、`9d79f46`、`8f5c1c5` とその変更範囲（`packages/core`、`packages/profile-backup`、`apps/extension`）
- 確認日: 2026-09-20
- 範囲: Profile / Account の単一 Chain 境界、Vault 保存・読込、permission binding、backup 検証、Provider / Approval / UI の Chain binding、関連テスト
- 対象外: `_snwc`、Mobile の未実装コード、Relay / SDK の無変更領域、外部 node / browser 実 runtime
- 成果物: 本レビュー。前回レビュー [profile-chain-implementation-review-001](./profile-chain-implementation-review-001.md) の IR-001 を再確認した。

## Execution Audit

サブエージェントは使用せず、Review Board Chair が次の4パスを独立して実施した。

- Reviewer A（仕様適合性）: Profile.chain、Account.chain / identity、permission、旧 store の扱いを Requirements / Specification / Design と照合
- Reviewer B（Security）: Profile-local authorization、Vault / secret path、storage validation、Provider / Approval 境界を確認
- Reviewer C（相互運用性）: Symbol / NEM、Mainnet / Testnet、chain-specific identity、既存 chain adapter / backup 契約を確認
- Reviewer D（品質・テスト）: TypeScript、保存状態、malformed / wrong chain、関連 unit test と workspace validation を確認

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
- 関連 unit test、package manifest、TypeScript 設定、workspace validation 結果

## Review Result

`READY`

## Summary

Profile は `chain` を作成時に固定し、Account は `chain` と単一 `identity` を持つ構成へ移行されている。Extension の Vault、Provider、Approval、Account 管理、作成・管理 UI、backup verification は Profile.chain に一致するデータだけを扱う。旧 V1/V2 mixed store の自動 migration は行わず、V3 store の Profile、Account、permission の Chain / Network 不一致は fail-closed で拒否する。

前回 IR-001 の Core permission scope 検証不足は、`PermissionService` が Profile repository を参照し、存在・Chain・Network の不一致を保存前に拒否する実装とテストで解消された。

## Finding Status

| ID     | Severity | Status   | 初出レビュー                              | 今回の状態根拠                                                                             |
| ------ | -------- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| IR-001 | HIGH     | Resolved | `profile-chain-implementation-review-001` | `PermissionService.grant` の Profile scope 検証、cross-chain reject test、保存前拒否を確認 |

## Required Changes

なし。

## Optional Improvements

なし。

## Resolved Findings

### IR-001: Core PermissionService が Profile の固定 Chain / Network を検証しない

- 解消内容: `packages/core/src/use-cases.ts` の `PermissionService` に `ProfileRepository` を追加し、Profile 未存在、scope.network 不一致、scope.chain 不一致を permission repository の保存前に拒否するよう変更した。
- 確認テスト: `packages/core/test/core.test.ts` で valid grant、cross-chain mismatch、wrong network の境界を確認した。
- 追加確認: `apps/extension/src/vault.ts` の V3 store 読込でも permission の Profile.chain / network 不一致を拒否し、`apps/extension/test/vault-storage.test.ts` で mixed permission state を検証した。
- 再確認結果: permission integrity の残存 blocking defect は確認されなかった。

## Upstream Feedback

なし。単一 Chain の要求・設計・仕様は実装判定に必要な範囲で確定している。

## Deferred Findings

- Browser 実 runtime の UI 操作、Service Worker 再起動、Extension reload 後の storage 実挙動は local unit test の対象外であり、別途 E2E / release readiness で確認する。
- `_snwc` の native / WASM Binding は変更対象外のため、Binding 内部の実装レビューは行っていない。
- Relay integration、external node、Mainnet release evidence は今回の変更範囲に直接含まれず、該当工程で確認する。

## Scope and Traceability

`CR-017` / `CR-AC-020` → Profile / Account Specification §3 / §11 → Architecture §6.6 / Interfaces §6 / Security Design §6・§16 → Core domain / Core use cases / Extension Vault / Provider / Approval の変更を追跡した。permission writer と persisted store reader の双方で Profile-local Chain / Network binding を確認し、Extension の公開 projection は Account.identity 単体から生成されることを確認した。

`deriveSharedAccount` が chain adapter の fixed vector 契約として両 chain の導出 material を返す実装は維持されているが、Profile / Account / Vault / Provider が保存・公開するのは Profile.chain に対応する一つの identity に限定される。これは low-level adapter compatibility と Application Profile の責務を分離する既存境界に合致する。

## Domain Checks

- Specification Conformance: PASS。Profile 固定 Chain、single identity、別 Profile による Symbol / NEM 分離、旧 mixed state 非互換、UI / Provider / Approval の scope binding を確認。
- Security: PASS。Profile / Account / permission binding、storage rejection、approval signer identity、Vault secret path、wrong Chain / Network failure path を確認。秘密情報のログ・例外漏えいは確認されなかった。wallet-core の内部鍵処理と Binding は対象外。
- Interoperability: PASS。`deriveSharedAccount` の fixed vector を変更せず、selected Profile.chain の identity のみを account projection / backup verification に利用することを確認。Symbol / NEM、Mainnet / Testnet の境界を確認。
- Error / abnormal paths: PASS。old schema、mixed Profile / Account / permission、wrong chain scope、backup identity mismatch、wrong network、duplicate mnemonic の関連 path を確認。
- Test quality: PASS。Core、profile-backup、Extension の targeted test と全 workspace test / typecheck / build が成功し、IR-001 の保存前拒否を独立テストした。
- 型・依存・公開互換性: PASS。Core の PermissionService constructor 変更箇所を workspace test / typecheck で追跡し、無関係な package の公開 contract は変更していない。

## Validation Results

- `pnpm lint`: PASS（最終変更前の root run）。
- `./node_modules/.bin/oxlint --deny-warnings`: PASS（最終変更後の repository-local direct validation）。
- `pnpm typecheck`: PASS（12 workspace projects）。
- `pnpm test`: PASS（12 workspace projects。Extension 10 files / 30 tests、Core 5 tests、profile-backup 3 tests を含む）。
- `pnpm build`: PASS（Extension、test-dapp、SDK、Relay、全 workspace build）。Vite の chunk size warning は表示されたが build は成功した。
- `pnpm --filter @mosaiclynx/core typecheck && pnpm --filter @mosaiclynx/core test`: PASS。
- `pnpm --filter @mosaiclynx/profile-backup typecheck && pnpm --filter @mosaiclynx/profile-backup test`: PASS。
- `pnpm --filter @mosaiclynx/extension typecheck && pnpm --filter @mosaiclynx/extension test`: PASS。最終追加後は direct `tsc` / `vitest` でも PASS。
- 対象変更ファイルの Prettier check: PASS。
- `git diff --check`: PASS。
- 未確認: Browser 実 runtime、Service Worker restart / reload E2E、external node、native / WASM Binding runtime、Relay Redis integration。これらは今回の対象変更外または別工程で確認する。

## Review Gates

| Gate                     | 判定 | 根拠                                                                                              |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------------- |
| 仕様適合性               | PASS | Profile / Account / permission の単一 Chain invariant と旧 mixed state 非互換を実装・テストで確認 |
| Security                 | PASS | Core permission writer と Extension store reader が Profile Chain / Network を fail-closed に検証 |
| 相互運用性               | PASS | chain adapter fixed vector、selected identity、Chain / Network の境界を維持                       |
| 異常系                   | PASS | malformed store、mixed permission、wrong chain / network、backup mismatch、duplicate の拒否を確認 |
| テスト十分性             | PASS | IR-001 の再発を含む targeted / workspace test、typecheck、build が成功                            |
| 実装品質・runtime safety | PASS | strict TypeScript、workspace dependency、storage replacement、公開 projection の整合を確認        |

## Remaining Risks and Open Decisions

- Browser 実 runtime と lifecycle / E2E は未確認であり、公開前の release readiness で別途確認が必要。
- Profile backup capability 自体は仕様上 future capability のため、現行 milestone の必須 release gate としては判定していない。
- `deriveSharedAccount` の low-level shared material 契約は Chain Compatibility の既存 vector として残るが、Application の mixed Profile を許可するものではない。

## Automatic Changes

なし。再レビュー中はレビュー成果物以外を変更していない。

## Final Decision

`READY`
