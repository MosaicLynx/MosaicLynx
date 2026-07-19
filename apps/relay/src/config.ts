export interface RelayConfig {
  readonly host: string;
  readonly port: number;
  readonly redisUrl: string;
  readonly hmacKey: Buffer;
  readonly trustProxyHops: number;
  readonly createCountLimit: number;
  readonly createByteLimit: number;
  readonly redisPrefix: string;
}

const positiveInteger = (name: string, value: string | undefined, fallback: number, allowZero = false): number => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < (allowZero ? 0 : 1)) throw new Error(`invalid_config:${name}`);
  return parsed;
};

const hmacKey = (value: string | undefined): Buffer => {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_config:RATE_LIMIT_HMAC_KEY');
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.byteLength < 32 || decoded.toString('base64url') !== value)
    throw new Error('invalid_config:RATE_LIMIT_HMAC_KEY');
  return decoded;
};

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): RelayConfig => {
  if (!environment.REDIS_URL) throw new Error('invalid_config:REDIS_URL');
  return {
    host: environment.HOST ?? '0.0.0.0',
    port: positiveInteger('PORT', environment.PORT, 8787),
    redisUrl: environment.REDIS_URL,
    hmacKey: hmacKey(environment.RATE_LIMIT_HMAC_KEY),
    trustProxyHops: positiveInteger('TRUST_PROXY_HOPS', environment.TRUST_PROXY_HOPS, 1, true),
    createCountLimit: positiveInteger('CREATE_RATE_COUNT', environment.CREATE_RATE_COUNT, 10),
    createByteLimit: positiveInteger('CREATE_RATE_BYTES', environment.CREATE_RATE_BYTES, 4 * 1024 * 1024),
    redisPrefix: environment.REDIS_PREFIX ?? 'mosaiclynx:relay:v1',
  };
};
