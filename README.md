# MosaicLynx

Symbol / NEM dApp 向けの Chrome Manifest V3 署名拡張機能と、transport 非依存の MosaicLynx SDK です。

## 開発

```sh
pnpm install --offline
pnpm typecheck
pnpm test
pnpm build
```

Chrome の「パッケージ化されていない拡張機能を読み込む」から `apps/extension/dist` を指定します。

### Transfer テストページ

拡張機能を読み込んだ Chrome で、Symbol / NEM の Transfer 作成と署名フローを確認できます。

```sh
pnpm --filter @mosaiclynx/test-dapp dev
```

表示された `http://127.0.0.1:5173` を開き、拡張機能に接続して recipient、amount、message を入力します。テストページは署名済み payload を表示しますが、ネットワークへの announce は行いません。

## MosaicLynx SDK

```ts
import { createMosaicLynxSDK } from "@mosaiclynx/sdk";

const mosaicLynx = createMosaicLynxSDK();
const signed = await mosaicLynx.signTransaction({
  chain: "symbol",
  network: "testnet",
  payload,
  expectedSignerPublicKey,
});
```

SDK は Provider API v2 の拡張機能を優先し、対応モバイル環境では E2E 暗号化 Relay v1 を選択します。dApp から transport、Relay credential、Extension の account ID は指定できません。

## セキュリティ状態

- Vault は Argon2id（64 MiB、3 iterations、parallelism 1）と AES-256-GCM を使用します。
- 秘密情報の復号と署名は、ユーザーが操作する承認ページ内でだけ行います。Service Worker と Web ページへパスワード／秘密鍵を渡しません。
- transaction は固定版 `@nemnesia/symbol-sdk 3.3.2-pure.2` で decode、allowlist 検証、canonical 再シリアライズ、署名、署名後検証します。
- Mainnet 署名は `docs/product-spec.md` 19章の release evidence が未導入のため、開発 build では fail-closed で無効です。
- Chrome Extension は Software Vault であり、ハードウェアウォレット、コールドウォレット、企業カストディ相当ではありません。
