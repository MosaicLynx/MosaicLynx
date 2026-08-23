---
name: implement-author
description: MosaicLynx の TypeScript app / package を、承認済み仕様・要件・ADR に従って実装または修正する。Symbol、NEM、署名、暗号化、Relay、backup、Provider、Extension 境界を含む変更に使用する。
---

# Implementation Author

作業前に `/home/harvestasya/workspace/mosaiclynx/.agents/project-context.md` と対象機能の仕様・ADRを読み、対象 package / app、変更ファイル、外部可視動作を確定する。

## 根拠と範囲

優先順位は、ユーザーの依頼、承認済み仕様、承認済み要件、適用可能な ADR、対象 package の公開契約、公式資料、既存コード・テストの順とする。既存コードや SDK の便利 API が存在するだけでは仕様の根拠にならない。

仕様に対象動作がない場合は、一般的なウォレット慣行や「便利だから」を理由に実装しない。公開 API、RPC、backup / Relay 形式、署名 byte 列、エラー、capability を変更する必要がある場合は、仕様更新または判断が必要な点として報告する。

## 実装上の注意

- 入力、Chrome message、Provider RPC、Relay body、backup envelope を検証してから使用する。
- 秘密鍵、Mnemonic、Profile password、Vault plaintext、Relay credential をログ、例外、debug 出力へ含めない。
- Symbol / NEM と Mainnet / Testnet の処理を暗黙に共通化しない。
- 署名対象の exact bytes、canonical serialization、byte order、hex / raw bytes、数量の整数性を仕様と fixture で確認する。
- KDF、AEAD、salt、nonce、鍵長、SDK version を独自変更しない。暗号化方式は既存依存を優先する。
- Relay は opaque な暗号文を解釈せず、Extension の承認 UI は完全に解析できない署名要求を推測で許可しない。

## テストと検証

変更した外部可視動作には、対象 package の Vitest / Node test を追加または更新する。正常系に加え、malformed data、境界値、wrong chain / network、認証失敗、truncated input、duplicate、deterministic output、secret leakage のうち該当するものを確認する。

変更後、可能な範囲で `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、対象 package の test、`pnpm test`、`pnpm build` を実行する。Redis integration は別枠である。実行できなかったものは成功と扱わず、最終報告の `Not validated` に記録する。
