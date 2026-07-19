import { buildRelayApp } from './app.js';
import { loadConfig } from './config.js';
import { RedisRelayStore } from './redis-store.js';

const main = async (): Promise<void> => {
  const config = loadConfig();
  const store = new RedisRelayStore(config.redisUrl, config.redisPrefix);
  await store.connect();
  const app = buildRelayApp({
    store,
    hmacKey: config.hmacKey,
    trustProxyHops: config.trustProxyHops,
    createCountLimit: config.createCountLimit,
    createByteLimit: config.createByteLimit,
  });
  const shutdown = async (): Promise<void> => {
    console.info('relay_stopping');
    await app.close();
    await store.close();
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  await app.listen({ host: config.host, port: config.port });
  console.info('relay_started');
};

main().catch(() => {
  console.error('relay_start_failed');
  process.exitCode = 1;
});
