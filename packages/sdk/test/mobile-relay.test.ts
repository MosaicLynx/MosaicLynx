import { PrivateKey, utils } from '@nemnesia/symbol-sdk';
import { SymbolFacade, models } from '@nemnesia/symbol-sdk/symbol';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHash } from 'node:crypto';

import { canonicalize } from '../src/canonical.js';
import { base64UrlDecode, decryptJson, deriveRelayKeys, encryptJson, hex, sha256, utf8 } from '../src/crypto.js';
import { createMosaicLynxSDK } from '../src/index.js';
import { validateHexPayload } from '../src/transaction.js';

const PROTOCOL = 'mosaiclynx.relay.v1' as const;

interface BrowserHarness {
  readonly appLink: () => string;
  connect(publicKey: string): void;
}

const installMobileBrowser = (): BrowserHarness => {
  let openedAppLink = '';
  const storage = new Map<string, string>();
  const anchor = {
    href: '',
    rel: '',
    style: { display: '' },
    click() {
      openedAppLink = this.href;
    },
    remove() {},
  };
  const windowValue: Record<string, unknown> = {
    location: { origin: 'https://dapp.example', protocol: 'https:' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  windowValue.top = windowValue;
  vi.stubGlobal('window', windowValue);
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    createElement: () => anchor,
    documentElement: { append: vi.fn() },
  });
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 16) Mobile' });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  return {
    appLink: () => openedAppLink,
    connect(publicKey) {
      storage.set(
        'mosaiclynx.sdk.connections.v1',
        JSON.stringify([
          {
            chain: 'symbol',
            network: 'testnet',
            address: 'T'.repeat(39),
            publicKey,
          },
        ])
      );
    },
  };
};

const hashToken = (value: string): string => createHash('sha256').update(Buffer.from(value, 'base64url')).digest('hex');

const unsignedTransfer = () => {
  const facade = new SymbolFacade('testnet');
  const signer = facade.createAccount(PrivateKey.random());
  const recipient = facade.createAccount(PrivateKey.random());
  const transaction = new models.TransferTransactionV1();
  transaction.signerPublicKey = new models.PublicKey(signer.publicKey.bytes);
  transaction.network = models.NetworkType.TESTNET;
  transaction.recipientAddress = new models.UnresolvedAddress(recipient.address.bytes);
  transaction.mosaics = [];
  transaction.message = new Uint8Array();
  transaction.fee = new models.Amount(0n);
  transaction.deadline = new models.Timestamp(1n);
  return { facade, signer, transaction, payload: utils.uint8ToHex(transaction.serialize()) };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MosaicLynx SDK mobile Relay transport', () => {
  it('enforces the decoded transaction limit before Relay encryption', () => {
    expect(validateHexPayload('00'.repeat(256 * 1024))).toHaveLength(256 * 1024);
    expect(() => validateHexPayload('00'.repeat(256 * 1024 + 1))).toThrow('Transaction payload exceeds 256 KiB.');
  });

  it('connects, caches public accounts, and disconnects through Mobile Relay', async () => {
    const browser = installMobileBrowser();
    let createBody: Record<string, unknown> | undefined;
    const account = {
      chain: 'symbol' as const,
      network: 'testnet' as const,
      address: 'T'.repeat(39),
      publicKey: '12'.repeat(32).toUpperCase(),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
        const url = String(input);
        const method = init.method ?? 'GET';
        if (method === 'POST' && url.endsWith('/v1/handoffs')) {
          createBody = JSON.parse(String(init.body)) as Record<string, unknown>;
          return new Response(null, { status: 201 });
        }
        if (method === 'GET' && url.includes('/response?wait=25')) {
          const appLink = new URL(browser.appLink());
          const fragment = new URLSearchParams(appLink.hash.slice(1));
          const sessionId = String(createBody?.sessionId);
          const expiresAt = String(createBody?.expiresAt);
          const keys = await deriveRelayKeys(base64UrlDecode(fragment.get('s')!), sessionId);
          const aad = { protocol: PROTOCOL, sessionId, direction: 'request', expiresAt } as const;
          const request = (await decryptJson(
            keys.requestKey,
            createBody?.request as Parameters<typeof decryptJson>[1],
            aad
          )) as { readonly operation: string; readonly requestId: string };
          const response = await encryptJson(
            keys.responseKey,
            {
              protocol: PROTOCOL,
              requestId: request.requestId,
              requestDigest: hex(sha256(utf8(canonicalize(request)))),
              ...(request.operation === 'connect' ? { outcome: 'connected', account } : { outcome: 'disconnected' }),
              completedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
            },
            { protocol: PROTOCOL, sessionId, direction: 'response', expiresAt }
          );
          return new Response(JSON.stringify(response), { status: 200 });
        }
        if (method === 'POST' && url.endsWith('/ack')) return new Response(null, { status: 204 });
        throw new Error(`unexpected request: ${method} ${url}`);
      })
    );
    const sdk = createMosaicLynxSDK({ mobileRelay: { enabled: true } });

    const scope = { chain: account.chain, network: account.network } as const;
    await expect(sdk.connect(scope)).resolves.toEqual(account);
    expect(sdk.getActiveAccount(scope)).toEqual(account);
    await expect(sdk.disconnect()).resolves.toBeUndefined();
    expect(sdk.getActiveAccount(scope)).toBeUndefined();
  });

  it('keeps credentials out of the create request, decrypts a response, and ACKs it', async () => {
    const browser = installMobileBrowser();
    const fixture = unsignedTransfer();
    browser.connect(fixture.signer.publicKey.toString());
    let createBody: Record<string, unknown> | undefined;
    const calls: Array<{ readonly url: string; readonly method: string; readonly authorization?: string }> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const url = String(input);
      const method = init.method ?? 'GET';
      const headers = new Headers(init.headers);
      calls.push({
        url,
        method,
        ...(headers.get('Authorization') ? { authorization: headers.get('Authorization')! } : {}),
      });
      if (method === 'POST' && url.endsWith('/v1/handoffs')) {
        createBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({}), { status: 201 });
      }
      if (method === 'GET' && url.includes('/response?wait=25')) {
        if (!createBody) throw new Error('create request missing');
        const appLink = new URL(browser.appLink());
        const fragment = new URLSearchParams(appLink.hash.slice(1));
        const sessionId = String(createBody.sessionId);
        const expiresAt = String(createBody.expiresAt);
        const secret = base64UrlDecode(fragment.get('s')!);
        const keys = await deriveRelayKeys(secret, sessionId);
        const aad = { protocol: PROTOCOL, sessionId, direction: 'request', expiresAt } as const;
        const logicalRequest = await decryptJson(
          keys.requestKey,
          createBody.request as Parameters<typeof decryptJson>[1],
          aad
        );
        const request = logicalRequest as { readonly requestId: string };
        const requestDigest = hex(sha256(utf8(canonicalize(logicalRequest))));

        const signature = fixture.signer.signTransaction(fixture.transaction);
        fixture.transaction.signature = new models.Signature(signature.bytes);
        const signedTransaction = {
          payload: utils.uint8ToHex(fixture.transaction.serialize()),
          hash: fixture.facade.hashTransaction(fixture.transaction).toString(),
          signerPublicKey: fixture.signer.publicKey.toString(),
        };
        const response = await encryptJson(
          keys.responseKey,
          {
            protocol: PROTOCOL,
            requestId: request.requestId,
            requestDigest,
            outcome: 'signed',
            signedTransaction,
            completedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
          },
          { protocol: PROTOCOL, sessionId, direction: 'response', expiresAt }
        );
        return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (method === 'POST' && url.endsWith('/ack')) return new Response(null, { status: 204 });
      throw new Error(`unexpected request: ${method}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const signed = await createMosaicLynxSDK({ mobileRelay: { enabled: true } }).signTransaction({
      chain: 'symbol',
      network: 'testnet',
      payload: fixture.payload,
      expectedSignerPublicKey: fixture.signer.publicKey.toString(),
    });
    expect(signed.signerPublicKey).toBe(fixture.signer.publicKey.toString());
    expect(calls.map(({ method, url }) => `${method} ${new URL(url).pathname}`)).toEqual([
      'POST /v1/handoffs',
      `GET /v1/handoffs/${String(createBody?.sessionId)}/response`,
      `POST /v1/handoffs/${String(createBody?.sessionId)}/ack`,
    ]);

    const link = new URL(browser.appLink());
    const fragment = new URLSearchParams(link.hash.slice(1));
    const appToken = fragment.get('a')!;
    const sessionSecret = fragment.get('s')!;
    expect(link.search).toBe('');
    expect(String(createBody?.appTokenHash)).toBe(hashToken(appToken));
    const pollAuthorization = calls.find((call) => call.method === 'GET')?.authorization;
    expect(pollAuthorization).toMatch(/^Bearer [A-Za-z0-9_-]{43}$/);
    expect(String(createBody?.webTokenHash)).toBe(hashToken(pollAuthorization!.slice('Bearer '.length)));
    expect(JSON.stringify(createBody)).not.toContain(appToken);
    expect(JSON.stringify(createBody)).not.toContain(sessionSecret);
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
  });

  it('cancels the handoff without transport fallback after a Relay failure', async () => {
    const browser = installMobileBrowser();
    const fixture = unsignedTransfer();
    browser.connect(fixture.signer.publicKey.toString());
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const url = String(input);
      const method = init.method ?? 'GET';
      calls.push(`${method} ${new URL(url).pathname}`);
      if (method === 'POST' && url.endsWith('/v1/handoffs')) return new Response(null, { status: 201 });
      if (method === 'GET' && url.includes('/response?wait=25')) return new Response(null, { status: 500 });
      if (method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error('unexpected request');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createMosaicLynxSDK({ mobileRelay: { enabled: true } }).signTransaction({
        chain: 'symbol',
        network: 'testnet',
        payload: fixture.payload,
      })
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(browser.appLink()).toContain('https://link.mosaiclynx.app/v1/handoff/');
    expect(calls.filter((call) => call.startsWith('POST /v1/handoffs'))).toHaveLength(1);
    expect(calls.some((call) => call.startsWith('DELETE /v1/handoffs/'))).toBe(true);
  });
});
