# MosaicLynx Relay

E2E暗号化済みのhandoffだけを最大5分間保持する自己ホスト型Relayです。transactionの復号、解析、署名、broadcastは行いません。

## ローカル起動

32 byte以上のランダム値をpaddingなしbase64urlで生成し、`.env`へ設定します。

```sh
cd apps/relay
cp .env.example .env
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
docker compose up --build -d
curl http://127.0.0.1:8787/readyz
```

Relayはホストの`127.0.0.1:8787`だけへ公開され、Redis portは公開されません。`.env`をrepositoryへcommitしないでください。

## 設定

| 環境変数              | 必須 | 既定値                          | 用途                                                 |
| --------------------- | ---- | ------------------------------- | ---------------------------------------------------- |
| `REDIS_URL`           | yes  | Composeでは`redis://redis:6379` | 専用Redisへの接続                                    |
| `RATE_LIMIT_HMAC_KEY` | yes  | なし                            | IPとsession IDをRedis key用にdomain-separated HMAC化 |
| `HOST` / `PORT`       | no   | `0.0.0.0` / `8787`              | container内のlisten先                                |
| `TRUST_PROXY_HOPS`    | no   | `1`                             | 信頼するreverse proxy hop数。直接公開時は`0`         |
| `CREATE_RATE_COUNT`   | no   | `10`                            | IPごとの1分間のsession作成上限                       |
| `CREATE_RATE_BYTES`   | no   | `4194304`                       | IPごとの1分間の作成body byte上限                     |
| `REDIS_PREFIX`        | no   | `mosaiclynx:relay:v1`           | 専用Redis内のkey prefix                              |

`RATE_LIMIT_HMAC_KEY`をrotateすると既存sessionへ到達できなくなります。安全側のtimeoutになりますが、通常運用中にはrotateしません。

## Reverse proxy

Node processでTLSを終端しません。`relay.mosaiclynx.app`のreverse proxyは次を必須とします。

- TLS 1.2以上、HSTS、`client_max_body_size 512k`
- upstream read timeoutを25秒より長くする
- access logを無効化し、Authorization、path、query、bodyをWAF/APMへ保存しない
- 外部からの`X-Forwarded-For`を破棄し、接続元IPだけで上書きする
- upstreamを`127.0.0.1:8787`に限定し、Relay portとRedisを外部公開しない

Nginxのlocation部分は次の形を使用できます。証明書設定はサーバー側で管理します。

```nginx
access_log off;
client_max_body_size 512k;
ssl_protocols TLSv1.2 TLSv1.3;

location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_read_timeout 30s;
    proxy_buffering off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

## Storageと障害時動作

ComposeのRedisはRDB/AOFとvolumeを持たない専用の一時storageです。snapshot、backup、command logging、APM payload captureを有効にしないでください。Redis/Relay再起動時は処理中sessionを失い、SDK側でtimeoutまたは共通errorになります。暗号文を永続化して復旧するより安全側へ失敗させます。

`noeviction`を使用するため、容量不足時は新規作成または応答保存が失敗します。memory、503/429率、health checkを識別子なしの集計値として監視し、余裕を持ってRedis memoryを割り当てます。

## テスト

通常のテストはRedisを必要としません。実Redis試験だけを明示的に起動します。

```sh
pnpm --filter @mosaiclynx/relay test
RATE_LIMIT_HMAC_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
  docker compose -f apps/relay/compose.yaml -f apps/relay/compose.test.yaml up -d redis
RELAY_TEST_REDIS_URL=redis://127.0.0.1:6379 \
  pnpm --filter @mosaiclynx/relay test:integration
```
