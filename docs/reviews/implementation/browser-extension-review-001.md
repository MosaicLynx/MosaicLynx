# Browser Extension Implementation Review 001

## 1. Review Target

- 対象: 初回 Chrome Extension milestone の今回の実装差分
- 確認日: 2026-09-20
- 成果物: `docs/reviews/implementation/browser-extension-review-001.md`
- レビュー範囲:
  - caller Origin の許可境界
  - approval と tab / document lifecycle の binding
  - permission / Profile 切替時の Provider event
  - 最後の Account 削除防止
  - Testnet-only backup import の network 境界
  - 上記に対応するテスト、型、format、build evidence
- 未確認範囲:
  - 実 Chrome runtime 上の navigation、tab close、side panel、Provider event の E2E 動作
  - Chrome Web Store 配布、release evidence の実運用
  - 外部 wallet-core / Native / WASM Binding
  - 今回変更していない既存の SDK、Relay、chain parser の全体適合性

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が次の4パスを独立に実施した。

| Pass                                 | 確認結果                                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: 仕様適合性               | Browser Extension の Origin、lifecycle、permission event、Account 最低数、Testnet backup 制約を仕様・設計と照合し、今回の変更は既存契約に沿っている。                                                                        |
| Reviewer B: Security                 | Web caller、trusted approval UI、Profile / Permission revision、tab generation、Vault revision および Account 削除経路を追跡した。今回の差分に private key の新しい外部露出、署名対象の緩和、cross-network fallback はない。 |
| Reviewer C: 相互運用性               | HTTPS / loopback HTTP の Origin canonicalization、Profile Network と Permission Scope、Testnet backup、Core Account model の境界を確認した。Symbol / NEM の byte 列や署名計算は今回の差分対象外である。                      |
| Reviewer D: ソフトウェア品質・テスト | 追加テスト、型検査、format、diff whitespace を確認した。Chrome event listener の実 runtime 確認は未実行として残した。                                                                                                        |

## 3. Evidence Used

| 資料 / 実装                                                                                                                     | 確認目的                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `docs/specifications/browser-extension.md` §7.2、§8.3、§9.2、§18、§20                                                           | HTTPS / loopback Origin、navigation / document lifecycle、permission revoke / event、fail-closed の根拠 |
| `docs/specifications/product-spec.md` §10、§11、§12、§17、§18                                                                   | Account 最低数、Profile / Network 分離、approval、Origin 制約、MVP 受け入れ条件                         |
| `docs/design/browser-extension.md` §7、§8、§9、§17、§18、§20                                                                    | browser-observed caller、approval binding、permission event、lifecycle invalidation、security invariant |
| `apps/extension/src/background/index.ts`                                                                                        | privileged host の Origin、approval、tab generation、permission event、Account projection               |
| `apps/extension/src/background/page-origin.ts`                                                                                  | HTTPS / loopback HTTP の canonical Origin 判定                                                          |
| `apps/extension/src/background/profile-eligibility.ts`、`apps/extension/src/popup/main.tsx`                                     | active Account と削除可能性の判定                                                                       |
| `apps/extension/src/vault.ts`                                                                                                   | Testnet-only backup import 境界                                                                         |
| `packages/core/src/use-cases.ts`                                                                                                | Core AccountService の最後の Account 削除防止                                                           |
| `apps/extension/test/page-origin.test.ts`、`apps/extension/test/profile-eligibility.test.ts`、`packages/core/test/core.test.ts` | 追加した Origin、Account 最低数、imported Account の異常系検証                                          |

## 4. Review Result

`READY`

## 5. Summary

今回の実装は、初回 Chrome milestone の明確な実装差分を解消している。任意の HTTP Origin を許可せず、HTTPS と loopback の HTTP だけを受け付ける。approval は tab generation と現在の tab Origin に binding され、navigation / reload / tab close 後に古い approval を継続しない。permission または active Profile の変更時には、現在の公開状態に応じて `accountsChanged` または `disconnect` を通知する。

Account 削除では imported Account だけが残る Profile でも最後の Account を削除できず、Core と Extension UI の判定が一致する。backup import では current build の Testnet-only 境界を再確認し、Mainnet / Testnet の混在を通さない。今回の差分に CRITICAL / HIGH の未解決 finding は確認しなかった。

## 6. Finding Status

| ID   | Severity | Status | 初出レビュー / 今回の状態根拠                               |
| ---- | -------- | ------ | ----------------------------------------------------------- |
| なし | —        | —      | 今回のレビュー対象に New / Open / Reopened finding はない。 |

## 7. Required Changes

なし。CRITICAL / HIGH の New / Open / Reopened finding は確認されなかった。

## 8. Optional Improvements

なし。今回の対象範囲で MEDIUM / LOW の formal finding も作成していない。

## 9. Resolved Findings

今回の実装レビューで追跡する過去の Implementation finding はない。今回の変更は、既存仕様・設計レビューで確定済みの caller、lifecycle、permission、Account 境界を実装へ反映したものである。

## 10. Upstream Feedback

なし。今回の対象を安全に評価するための Specification、Design、Requirements に不足・矛盾は確認されなかった。

## 11. Deferred Findings

- 実 Chrome runtime での navigation、reload、tab close、side panel close および Provider event delivery は、ブラウザ E2E harness または手動 runtime 検証で再確認する。
- Extension build は、現在のローカル依存環境で `@crxjs/vite-plugin` が `src/content/index.ts` の `fileName` を解決できず失敗した。実装の型検査・単体テストとは独立した既存の bundler / installed dependency compatibility の確認事項として残す。
- Mainnet capability は release evidence gate の対象であり、今回の Testnet 実装変更から有効化しない。

## 12. Scope and Traceability

今回の差分は `apps/extension` と `packages/core` の内部実装・テストに限定され、Provider API の公開型、Relay wire format、chain-specific serialization、wallet-core contract は変更していない。

| 実装                                                   | 上流根拠                                                                    | 確認内容                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `pageOrigin` と `requirePageOrigin`                    | Browser Extension Specification §7.2、Product Specification §17.1           | browser-observed sender の scheme / host 境界を最終検証し、通常 HTTP を拒否する。 |
| `tabGenerations`、tab event、approval context 再検証   | Browser Extension Specification §7.2、§8.3、§18、§20                        | navigation、reload、tab close 後の stale approval を fail-closed にする。         |
| permission storage change と event projection          | Browser Extension Specification §8.3、§9.2                                  | permission / active Profile の変更を現在の public Account projection に反映する。 |
| `hasRemainingActiveAccount` と `AccountService.remove` | Product Specification §10.1                                                 | source kind に依存せず Profile の最後の active Account を保護する。               |
| Testnet backup import guard                            | Profile backup package の Testnet-only contract、Product Specification §9.1 | 現行 build が Mainnet backup を処理するように見えないよう再検証する。             |

## 13. Domain Checks

### Specification Conformance

Pass。任意 HTTP の拒否、top-level caller の current Origin binding、lifecycle invalidation、permission event、最後の Account 保護および Testnet-only backup 境界が、確認した仕様・設計と整合する。

### Security

Pass。適用した観点は browser privileged boundary、caller / Origin binding、approval lifecycle、permission revision、Profile / Account authorization、network separation、failure fail-closed である。今回の差分は暗号 primitive、KDF、AEAD、private key derivation、raw signing を変更していないため、custom cryptographic arithmetic、Native / WASM ownership、nonce / tag 計算は適用外である。秘密情報をログ、error、Provider event に追加していない。

### 相互運用性

Pass。Origin の canonical output、Permission の Profile Network、backup の Testnet 制約を混同していない。Symbol / NEM transaction byte 列および署名計算は変更していない。

### 異常系

Pass。非 loopback HTTP、`file:`、`data:`、不正 URL、最後の imported Account の削除を追加テストで拒否する。tab が消失または current Origin が不一致になった場合は approval を継続しない。

### テスト評価

Pass。Extension の 11 test files / 31 tests、Core の 1 test file / 5 tests、対象型検査、対象 format check、`git diff --check` が成功した。Browser API event の実 runtime 検証は Deferred として明示した。

### 型・依存・公開互換性

Pass。変更は internal Extension helper と Core use-case の範囲に留まり、Provider API の型、SDK の公開契約、workspace dependency は変更していない。

## 14. Validation Results

| 検証                                              | 結果                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @mosaiclynx/extension test`        | PASS: 11 files / 31 tests                                                                                                                                                                                                                                            |
| `pnpm --filter @mosaiclynx/extension typecheck`   | PASS                                                                                                                                                                                                                                                                 |
| `pnpm --filter @mosaiclynx/core test`             | PASS: 1 file / 5 tests                                                                                                                                                                                                                                               |
| `pnpm --filter @mosaiclynx/core typecheck`        | PASS                                                                                                                                                                                                                                                                 |
| `./node_modules/.bin/prettier --check <変更対象>` | PASS                                                                                                                                                                                                                                                                 |
| `git diff --check`                                | PASS                                                                                                                                                                                                                                                                 |
| `pnpm lint`                                       | Not validated: installed `typescript@7.0.2` を `typescript-eslint@8.68.0` が未対応として終了した。                                                                                                                                                                   |
| `pnpm build:extension`                            | Not validated: pnpm 経由では無出力のまま停止したため中断。依存 build を分解して `release-evidence` の `tsc` と `embed.mjs` は実行できたが、local `vite build` は `@crxjs/vite-plugin` の `Content script fileName is undefined: "src/content/index.ts"` で失敗した。 |

## 15. Review Gates

| Gate                        | 判定 | 根拠                                                                                                                                             |
| --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. 仕様適合性               | Pass | Origin、lifecycle、permission event、Account 最低数、Testnet backup の既存契約に追跡できる。                                                     |
| 2. セキュリティ             | Pass | stale approval、wrong current Origin、wrong network、最後の Account 削除を fail-closed にした。秘密情報・署名 primitive の境界を拡張していない。 |
| 3. 相互運用性               | Pass | Chain / Network と Origin の境界を保持し、chain-specific bytes を変更していない。                                                                |
| 4. 異常系                   | Pass | malformed / unsupported Origin、tab lifecycle loss、最後の Account、Testnet-only 境界を処理する。                                                |
| 5. テスト十分性             | Pass | 追加した境界テストと対象 package の既存テスト・typecheck が成功した。Browser runtime は未確認として切り分けた。                                  |
| 6. 実装品質・runtime safety | Pass | tab generation、current tab 再確認、型付き internal helper、Core と UI の削除判定一致を確認した。                                                |

## 16. Remaining Risks and Open Decisions

実 Chrome runtime の event delivery と CRX build toolchain の互換性は残存確認事項である。Mainnet release evidence、Mobile、Relay、wallet-core Binding および今回変更していない chain parser の全体検証は本レビューの対象外である。

## 17. Automatic Changes

実装レビュー中に変更したのは、この新規レビュー成果物のみである。レビュー対象の実装、仕様、要件、設計、既存テストはレビュー判定のために変更していない。

## 18. Final Decision

**`READY` — `BROWSER EXTENSION IMPLEMENTATION READY`**
