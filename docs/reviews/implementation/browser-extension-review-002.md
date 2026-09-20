# Browser Extension Implementation Review 002

## 1. Review Target

- 対象: `browser-extension-review-001` で未検証だった lint / Extension build と、その解消に伴う lint toolchain 差分
- 確認日: 2026-09-20
- 成果物: `docs/reviews/implementation/browser-extension-review-002.md`
- レビュー範囲: Oxlint 設定、TypeScript 7、Extension / Core / SDK の関連差分、workspace typecheck / test、Extension production build
- 未確認範囲: 実 Chrome runtime の E2E、Chrome Web Store 配布、外部 wallet-core / Native / WASM Binding

## 2. Execution Audit

サブエージェントは使用せず、Review Board Chair が4パスを独立に確認した。

| Pass                                 | 確認結果                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A: 仕様適合性               | lint toolchain の置換は製品契約を変更せず、Extension 実装差分は前回確認した仕様境界を維持している。                           |
| Reviewer B: Security                 | 秘密鍵の無効な上書きを局所スコープ化し、SDK の意図的な error 正規化は内部 cause を外部公開しないまま維持した。                |
| Reviewer C: 相互運用性               | TypeScript / lint / build の変更に Symbol / NEM の serialization、signing bytes、network 判定の変更はない。                   |
| Reviewer D: ソフトウェア品質・テスト | Oxlint の correctness、unused、無効代入、caught error 規則を確認し、全体 typecheck / test と正規 Extension build を実行した。 |

## 3. Evidence Used

| 資料 / 実装                                                                      | 確認目的                                                  |
| -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `docs/reviews/implementation/browser-extension-review-001.md`                    | 前回の未検証項目と対象境界                                |
| `package.json`、`.oxlintrc.json`、`pnpm-lock.yaml`                               | lint command、TypeScript 7、Oxlint の依存・規則・除外対象 |
| `apps/test-dapp/src/vite-env.d.ts`                                               | TypeScript 7 での Vite CSS side-effect import 型宣言      |
| `apps/extension/src/approval/main.tsx`、`apps/extension/src/background/index.ts` | lint 指摘の解消と既存署名処理の維持                       |
| `packages/sdk/src/transaction.ts`                                                | chain SDK error を外部へ露出しない既存 error 正規化       |
| workspace tests / typecheck / Extension build                                    | lint toolchain 置換後の回帰と配布 bundle の成立性         |

## 4. Review Result

`READY`

## 5. Summary

前回未検証だった `pnpm lint` と `pnpm build:extension` はともに成功した。lint は TypeScript compiler API を必要とする ESLint / typescript-eslint から Oxlint へ置換し、TypeScript は 7.0.2 を単独使用する。正規の Extension build は package-local Vite 7.3.6 で完了し、前回の Vite 8 を直接実行した結果は build failure の根拠ではなかった。CRITICAL / HIGH を含む新規 finding はない。

## 6. Finding Status

| ID   | Severity | Status | 初出レビュー / 今回の状態根拠          |
| ---- | -------- | ------ | -------------------------------------- |
| なし | —        | —      | New / Open / Reopened finding はない。 |

## 7. Required Changes

なし。

## 8. Optional Improvements

なし。

## 9. Resolved Findings

formal finding の追跡対象はない。`browser-extension-review-001` の Deferred Findings のうち、lint toolchain 非互換と Extension build は解消済みである。

## 10. Upstream Feedback

なし。

## 11. Deferred Findings

- 実 Chrome runtime での navigation、reload、tab close、side panel close、Provider event delivery は、ブラウザ E2E harness または手動 runtime 検証で確認する。
- Mainnet capability と配布時の release evidence は release gate で確認する。

## 12. Scope and Traceability

lint toolchain は repository の静的検査だけを変更し、Provider API、Relay wire format、chain adapter、backup format、署名 byte 列を変更していない。Extension 実装差分の仕様追跡は `browser-extension-review-001` を継承し、今回の再確認では lint、TypeScript 7、production build の成立性を追加した。

## 13. Domain Checks

### Specification Conformance

Pass。toolchain 差分に外部可視動作の追加・緩和はない。

### Security

Pass。秘密鍵文字列は必要な署名分岐内へスコープを限定した。JavaScript string の上書きを消去保証として扱っていない。SDK の caught error は untrusted transaction details を cause として外部公開しない。暗号 primitive、KDF、AEAD、Native / WASM ownership は変更対象外である。

### 相互運用性

Pass。Symbol / NEM、Mainnet / Testnet、canonical bytes に変更はない。

### 異常系

Pass。署名検証器の生成・実行時例外は従来どおり Provider error へ fail-closed で変換される。

### テスト評価

Pass。全12 workspace project の test、全体 typecheck、Extension production build、lint が成功した。

### 型・依存・公開互換性

Pass。TypeScript 7.0.2 を維持し、typescript-eslint の TypeScript 6 API 制約を Oxlint への置換で除去した。公開 package export の変更はない。

## 14. Validation Results

| 検証                                    | 結果                                      |
| --------------------------------------- | ----------------------------------------- |
| `pnpm lint`                             | PASS: Oxlint 1.83.0、warning なし         |
| `pnpm typecheck`                        | PASS: 12 / 13 workspace projects          |
| `pnpm test`                             | PASS: workspace 全 test script            |
| `pnpm build:extension`                  | PASS: Vite 7.3.6、692 modules transformed |
| `pnpm exec prettier --check <変更対象>` | PASS                                      |
| `git diff --check`                      | PASS                                      |

## 15. Review Gates

| Gate                        | 判定 | 根拠                                                                    |
| --------------------------- | ---- | ----------------------------------------------------------------------- |
| 1. 仕様適合性               | Pass | toolchain 置換は製品契約を変更しない。                                  |
| 2. セキュリティ             | Pass | secret scope と fail-closed error mapping を維持した。                  |
| 3. 相互運用性               | Pass | chain / network / wire format に変更がない。                            |
| 4. 異常系                   | Pass | lint 指摘解消で例外経路を緩和していない。                               |
| 5. テスト十分性             | Pass | lint、全体 typecheck / test、正規 Extension build が成功した。          |
| 6. 実装品質・runtime safety | Pass | TypeScript 7、Oxlint、Vite 7 の repository-defined command が成立した。 |

## 16. Remaining Risks and Open Decisions

実ブラウザ E2E と release gate は今回のローカル静的・単体・build 検証の対象外である。lint / Extension build に未検証項目は残っていない。

## 17. Automatic Changes

レビュー中に変更したのは、この新規レビュー成果物のみである。

## 18. Final Decision

**`READY` — `BROWSER EXTENSION IMPLEMENTATION READY`**
