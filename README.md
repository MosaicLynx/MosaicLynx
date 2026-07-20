# MosaicLynx

Symbol / NEM dApp 向けの Chrome Manifest V3 署名拡張機能、Testnet専用iOS / Android署名アプリ、transport非依存のMosaicLynx SDKです。

## 開発

```sh
pnpm install --offline
pnpm typecheck
pnpm test
pnpm build
```

Chrome の「パッケージ化されていない拡張機能を読み込む」から `apps/extension/dist` を指定します。

### Mobile Testnet

MobileアプリはExpo SDK 57 development buildを使用します。Expo GoはUniversal Links / Android App Linksの検証対象外です。

```sh
pnpm --filter @mosaiclynx/mobile native:prebuild
pnpm --filter @mosaiclynx/mobile android
# macOSでは: pnpm --filter @mosaiclynx/mobile ios
```

JavaScript成果物とrelease evidenceは次で生成します。

```sh
pnpm --filter @mosaiclynx/mobile build
pnpm evidence:mobile
```

アプリはSymbol / NEM Testnetの署名だけを行い、残高・履歴・node接続・transaction announceには対応しません。Mainnet capabilityとproduction OTA updateはbuild時に固定で無効です。Store公開前のdomain、署名証明書、実機試験については[Mobile release guide](./docs/mobile-store-release.md)を参照してください。

### Transfer テストページ

拡張機能を読み込んだ Chrome で、Symbol / NEM の Transfer 作成と署名フローを確認できます。

```sh
pnpm --filter @mosaiclynx/test-dapp dev
```

表示された `http://127.0.0.1:5173` を開き、拡張機能に接続して recipient、amount、message を入力します。テストページは署名済み payload を表示しますが、ネットワークへの announce は行いません。

### Relay

自己ホスト型Mobile Relayは`apps/relay`にあります。Node.js、Redis、Docker Composeによる起動方法とreverse proxy要件は[Relay README](./apps/relay/README.md)を参照してください。通常のunit testはRedis不要で、実Redis integration testだけを専用commandで実行します。

## MosaicLynx SDK

```ts
import { createMosaicLynxSDK } from '@mosaiclynx/sdk';

const mosaicLynx = createMosaicLynxSDK();
const signed = await mosaicLynx.signTransaction({
  chain: 'symbol',
  network: 'testnet',
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
- Mobile Testnet版はMainnet要求／Mainnet backupを`UNAVAILABLE`相当で拒否し、network切替やfallbackを行いません。
- Chrome Extension は Software Vault であり、ハードウェアウォレット、コールドウォレット、企業カストディ相当ではありません。
