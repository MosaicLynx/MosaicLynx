# MosaicLynx プロジェクトコンテキスト

このファイルは `.agents/skills/` が参照するリポジトリ固有の補助資料であり、プロダクト仕様の代替ではない。

## 実際のワークスペース

- パッケージ管理: `pnpm@11.13.0`
- Node.js: `mise.toml` の `node = "26"`
- 言語: strict TypeScript、ESM、NodeNext
- ビルド: `tsc`、Vite、Chrome MV3
- テスト: Vitest、Node test、Relay の Redis integration test
- アプリ: `extension`、`relay`、`link-fallback`、`test-dapp`
- パッケージ: `core`、`chain-symbol`、`chain-nem`、`provider-api`、`relay-protocol`、`profile-backup`、`sdk`、`release-evidence`

`apps/mobile` や `@mosaiclynx/mobile` は現在のワークスペースには存在しない。既存の仕様・README にある Mobile は将来マイルストーンとして扱い、実装済み機能・検証済みコマンドとして記載しない。

## ドキュメントの対応

| 目的                           | 正本または既定の作成先                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| プロダクト範囲・受け入れ条件   | `docs/specifications/product-spec.md`                                                                         |
| アーキテクチャ・責務・依存方向 | `docs/architecture/architecture.md`                                                                           |
| Symbol / NEM 互換性            | `docs/specifications/chain-compatibility-spec.md`                                                             |
| SDK / Relay handoff            | `docs/specifications/web-transaction-handoff-spec.md`                                                         |
| Profile / Account / backup     | `docs/specifications/profile-account-spec.md`                                                                 |
| リリース運用・証跡             | `docs/release/release-process.md`, `docs/release/mainnet-release-evidence.md`, `docs/release/threat-model.md` |
| Mobile 資料                    | `docs/mobile/`                                                                                                |
| Evidence policy                | `docs/evidence/evidence-policy.json`                                                                          |
| 設計判断                       | `docs/adr/`                                                                                                   |
| 新しいコンセプト               | `docs/concept/<topic>.md`                                                                                     |
| 新しい要件                     | `docs/requirements/<topic>.md`                                                                                |
| 新しい仕様                     | `docs/specifications/<topic>.md`                                                                              |
| コンセプトレビュー             | `docs/reviews/concept/<base>-review-NNN.md`                                                                   |
| 要件レビュー                   | `docs/reviews/requirements/<base>-review-NNN.md`                                                              |
| 仕様レビュー                   | `docs/reviews/specifications/<base>-review-NNN.md`                                                            |
| 実装レビュー                   | `docs/reviews/implementation/<base>-review-NNN.md`                                                            |

新しい文書は、既存文書の更新依頼でない限り、上書きしない。複数の既存候補がある場合は自動選択しない。必要な種別ディレクトリと `docs/reviews/` 以下のレビュー種別ディレクトリは、成果物作成時に作成する。

## 固定して扱う重要事項

- Symbol と NEM は同じ秘密鍵を共有する設計箇所があるが、導出、network、address、transaction、署名の処理はチェーン別に確認する。
- `@nemnesia/symbol-sdk` は `3.3.2-pure.2` に固定されている。SDK の便利 API とプロトコル仕様を同一視しない。
- Mainnet / Testnet は Profile と署名 capability の境界である。開発 build の Mainnet signing gate や Testnet-only backup を無断で緩和しない。
- Extension は署名前に transaction を decode、allowlist 検証、canonical 再シリアライズし、署名後に検証する仕様を持つ。対象範囲外や完全に解析できない payload を推測で許可しない。
- Relay は E2E 暗号文を扱い、transaction の意味を解析しない。Relay の保存・期限・サイズ・認証の仕様を確認する。
- SDK の transport、Relay credential、Extension account ID は dApp が任意指定する設計ではない。公開 API を変えるときは `docs/specifications/web-transaction-handoff-spec.md` と SDK README を確認する。
- Vault、Mnemonic、Profile password、秘密鍵、backup plaintext をログやエラーへ出力しない。

## 代表的な検証コマンド

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Redis integration は別枠であり、通常の `pnpm test` に含まれない。実行した場合だけ結果に含める。
