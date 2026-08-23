# MosaicLynx SDK

`@mosaiclynx/sdk`は、WebページからMosaicLynxへ接続し、Symbol / NEMの公開アカウント取得と署名承認を要求するESM専用SDKです。秘密鍵やProvider内部のaccount ID、profile IDは公開しません。

## インストール

```sh
pnpm add @mosaiclynx/sdk
```

## 接続とアクティブアカウント

接続はchain/network単位です。`connect()`はユーザー操作から呼び出してください。

```ts
import { MosaicLynxSDKError, createMosaicLynxSDK } from '@mosaiclynx/sdk';

const mosaicLynx = createMosaicLynxSDK();
const scope = { chain: 'symbol', network: 'testnet' } as const;

connectButton.addEventListener('click', async () => {
  const account = await mosaicLynx.connect(scope);
  console.log(account.address, account.publicKey, account.chain, account.network);
});
```

`isConnected()`は承認画面を開かず、接続許可とアクティブアカウントが存在するか確認します。Vaultがアンロック済みかは公開せず、ロック中は署名承認画面で解除します。

```ts
if (await mosaicLynx.isConnected(scope)) {
  const latest = await mosaicLynx.refreshActiveAccount(scope);
  console.log(latest);
}

// 通信せず、同じSDKインスタンスの現在値を参照します。
const cached = mosaicLynx.getActiveAccount(scope);
```

`disconnect()`は現在のOriginに対する全scopeの許可とSDKキャッシュを削除します。

## トランザクション署名

取得した公開鍵をsignerへ設定した未署名payloadを渡します。SDKは署名済みpayload、hash、署名者と元payloadの対応を検証します。ネットワークへのannounceはdAppの責務です。

```ts
const account = mosaicLynx.getActiveAccount(scope);
if (!account) throw new Error('MosaicLynxへ接続してください');

const signed = await mosaicLynx.signTransaction({
  ...scope,
  payload: unsignedTransactionPayload,
  expectedSignerPublicKey: account.publicKey,
});

await announceToYourNode(signed.payload);
```

## データ署名

`signData()`はraw bytesを直接署名しません。SDKが24-byteの暗号学的乱数nonce、発行時刻、5分後の有効期限を生成します。

```ts
const signedData = await mosaicLynx.signData({
  ...scope,
  purpose: 'example.login',
  data: { encoding: 'utf8', value: 'ログイン要求' },
  expectedSignerPublicKey: account.publicKey,
});
```

実際の署名対象は、固定prefix `MOSAICLYNX\0MESSAGE\0V1\0`と、Origin・chain・network・purpose・nonce・期限・payloadを含むJCS正規化JSONの連結です。prefixによるドメイン分離は、通常データの署名をトランザクションや別プロトコルの承認として転用されることを防ぎます。

SDKは返却時に署名とdigestを検証しますが、検証先サービスも次を確認してください。

- `message.origin`、chain、network、purposeが期待値と一致する
- `expiresAt`を過ぎていない
- 同じ署名者とnonceの組み合わせを一度しか受理しない
- UTF-8 payloadはNFC、hex payloadはlowercaseで、いずれも16 KiB以下である

Wallet側のnonce cacheだけでは、取得済み署名が検証先へ再送される攻撃を防げません。

## 連署

内容を確認できないhashだけの連署は受け付けません。

```ts
const symbolCosignature = await mosaicLynx.cosignTransaction({
  chain: 'symbol',
  network: 'testnet',
  parentPayload: signedAggregatePayload,
  detached: true,
  expectedSignerPublicKey: account.publicKey,
});

const nemCosignature = await mosaicLynx.cosignTransaction({
  chain: 'nem',
  network: 'testnet',
  payload: unsignedCosignatureV1Payload,
  parentPayload: signedMultisigTransactionV1Payload,
  expectedSignerPublicKey: nemAccount.publicKey,
});
```

Symbolは署名済みAggregate v2全体、NEMは未署名CosignatureV1と署名済みMultisigTransactionV1全体を検証します。オンチェーンのmultisig構成や既存announce状態は照合しません。

## Mobile Relay

SDKと`mosaiclynx.relay.v1`には、接続、更新、切断、トランザクション署名、データ署名、連署の共通契約があります。ただし受信アプリはReact Native CLIで再構築予定のため、v1.0.0の本番設定ではMobile Relayを無効にしています。拡張機能がない環境では`isAvailable()`は`false`、操作APIは`UNAVAILABLE`になります。

`mobileRelay: { enabled: true }`はモック受信アプリを使う開発試験専用です。本番dAppで有効にしないでください。

## エラー処理

```ts
try {
  await mosaicLynx.signTransaction(request);
} catch (error) {
  if (error instanceof MosaicLynxSDKError) console.error(error.code);
}
```

代表的なコードは`USER_REJECTED`、`UNAVAILABLE`、`NOT_CONNECTED`、`VAULT_LOCKED`、`INVALID_MESSAGE`、`NONCE_REUSED`、`INVALID_TRANSACTION`、`SIGNER_MISMATCH`、`REQUEST_EXPIRED`、`CONTEXT_CHANGED`です。表示文言ではなく`code`で分岐してください。
