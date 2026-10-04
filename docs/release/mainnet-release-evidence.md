# Mainnet リリース証跡

Mainnet 対応能力は、各プラットフォームで安全条件を満たす場合にのみ有効になる。リリースビルド時の判定で署名付き証跡マニフェストの検証に成功した場合に限り、ビルドへ `true` を埋め込む。証跡が欠けている場合、拡張機能は必ず Testnet 専用となる。

## Lite ポリシー

リポジトリに保存された `docs/evidence/evidence-policy.json` をポリシーの正本とする。Lite では、未コミットの変更がないタグ付きコミット、ソースアーカイブ、拡張機能の成果物、ロックファイル、SBOM、Symbol SDK の完全性、互換性の対象バージョン、成功した単体・統合・E2E テストの報告書、および1件のリリース承認を必要とする。マニフェストとすべての必須証跡の有効期間は30日とする。任意の監査、再現可能ビルド、差分テスト、ファズテストの証跡がない場合、該当項目を `not-required` と明記しなければならない。

ポリシーの `trustedKeys` は、鍵 ID と base64 で表現した DER/SPKI 形式の Ed25519 公開鍵を対応付ける。PKCS#8 PEM 形式の署名用秘密鍵は、このリポジトリに保存しない。

## コマンド

```sh
pnpm evidence:collect --version 0.1.0
pnpm build:extension
pnpm evidence:manifest --version 0.1.0 --key-id release-2026
# マニフェストを編集してリリース承認を追加する
pnpm evidence:sign --version 0.1.0 --key /offline/release-2026.pem
pnpm evidence:verify --version 0.1.0 --platform extension
pnpm evidence:gate --version 0.1.0 --platform mobile
```

`collect` は署名用秘密鍵を読み取らない。`sign` は base64 形式の分離署名のみを出力する。`gate` は失敗時にもプラットフォーム別の報告書を書き出し、Mainnet が無効な場合はゼロ以外の終了コードを返す。

## 調査と復旧

個々の失敗理由は、`extension/extension-capability-report.json` または `mobile/mobile-capability-report.json` で確認する。期限切れのテスト・成果物の証跡は再生成し、新しいマニフェストに署名する。既存のダイジェストを直接編集してはならない。リリース鍵を紛失した場合、または漏えいが疑われる場合は、直ちにポリシーからその鍵 ID を削除する。必要に応じて Testnet 専用ビルドを配布し、オフラインで代替鍵を作成して公開鍵一覧を更新し、次のリリースに代替鍵で署名する。旧鍵は失効したものとして扱う。

## Strict ポリシーへの移行

`mode` を `strict` に変更し、リリース承認とセキュリティ承認を各1件必要とする。`minimumDistinctApprovers` を2、`allowSameApproverMultipleRoles` を `false` に設定する。ポリシーを変更する前に、リリース手順が要求する監査、再現可能ビルド、ファズテスト、差分テストの証跡を用意する。
