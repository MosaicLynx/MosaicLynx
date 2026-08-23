import type { MosaicLynxProvider, SignMessageParams } from '@mosaiclynx/provider-api';
import { PrivateKey, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, models as nemModels } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade, models } from '@nemnesia/symbol-sdk/symbol';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createStructuredMessage, structuredMessageDigest } from '../../core/src/structured-message.js';
import { MosaicLynxSDKError, createMosaicLynxSDK } from '../src/index.js';
import { verifySignedTransaction } from '../src/transaction.js';

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

const setWindowProvider = (provider: unknown): void => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { mosaicLynx: provider, location: { origin: 'https://dapp.example' } },
  });
};

describe('MosaicLynx SDK', () => {
  it('rejects unsupported Provider majors without transport downgrade', async () => {
    setWindowProvider({ apiVersion: '1.0.0', getAccounts() {}, connect() {}, signTransaction() {} });
    await expect(
      createMosaicLynxSDK().signTransaction({
        chain: 'symbol',
        network: 'testnet',
        payload: '00',
      })
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' satisfies MosaicLynxSDKError['code'] });
  });

  it('connects, lists, and disconnects without exposing Provider account IDs', async () => {
    const account = {
      id: 'internal-account',
      profileId: 'internal-profile',
      name: 'Shared account',
      address: 'T'.repeat(39),
      publicKey: 'ab'.repeat(32),
      scope: { chain: 'symbol', network: 'testnet' } as const,
    };
    const connect = vi.fn(async () => [account]);
    const disconnect = vi.fn(async () => undefined);
    const provider: MosaicLynxProvider = {
      version: '0.1.0',
      apiVersion: '2.0.0',
      connect,
      disconnect,
      getAccounts: async () => [account],
      getActiveAccount: async () => account,
      signMessage: async () => {
        throw new Error('unused');
      },
      signTransaction: async () => {
        throw new Error('unused');
      },
      cosignTransaction: async () => {
        throw new Error('unused');
      },
      on: () => undefined,
      removeListener: () => undefined,
    };
    setWindowProvider(provider);
    const sdk = createMosaicLynxSDK();
    const expected = {
      chain: account.scope.chain,
      network: account.scope.network,
      address: account.address,
      publicKey: account.publicKey.toUpperCase(),
    };

    await expect(sdk.connect(account.scope)).resolves.toEqual(expected);
    expect(sdk.getActiveAccount(account.scope)).toEqual(expected);
    await expect(sdk.disconnect()).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledWith(account.scope);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('requires an existing connection before extension signing', async () => {
    setWindowProvider({
      apiVersion: '2.0.0',
      getAccounts: async () => [],
      connect: async () => [],
      getActiveAccount: async () => undefined,
      signMessage: vi.fn(),
      signTransaction: vi.fn(),
      cosignTransaction: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    });
    await expect(
      createMosaicLynxSDK().signTransaction({ chain: 'symbol', network: 'testnet', payload: '00' })
    ).rejects.toMatchObject({ code: 'NOT_CONNECTED' });
  });

  it('uses a v2 Provider, selects the expected account, and verifies the signed result', async () => {
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
    const payload = utils.uint8ToHex(transaction.serialize());
    const signature = signer.signTransaction(transaction);
    transaction.signature = new models.Signature(signature.bytes);
    const signed = {
      payload: utils.uint8ToHex(transaction.serialize()),
      hash: facade.hashTransaction(transaction).toString(),
      signerPublicKey: signer.publicKey.toString(),
    };
    const signTransaction = vi.fn(async () => signed);
    const provider: MosaicLynxProvider = {
      version: '0.1.0',
      apiVersion: '2.0.0',
      connect: async () => {
        throw new Error('already connected');
      },
      disconnect: async () => undefined,
      getAccounts: async () => [
        {
          id: 'account-1',
          profileId: 'profile-1',
          name: 'Signer',
          address: signer.address.toString(),
          publicKey: signer.publicKey.toString(),
          scope: { chain: 'symbol', network: 'testnet' },
        },
      ],
      getActiveAccount: async () => ({
        id: 'account-1',
        profileId: 'profile-1',
        name: 'Signer',
        address: signer.address.toString(),
        publicKey: signer.publicKey.toString(),
        scope: { chain: 'symbol', network: 'testnet' },
      }),
      signMessage: async () => {
        throw new Error('unused');
      },
      signTransaction,
      cosignTransaction: async () => {
        throw new Error('unused');
      },
      on: () => undefined,
      removeListener: () => undefined,
    };
    setWindowProvider(provider);

    await expect(
      createMosaicLynxSDK().signTransaction({
        chain: 'symbol',
        network: 'testnet',
        payload,
        expectedSignerPublicKey: signer.publicKey.toString().toLowerCase(),
      })
    ).resolves.toEqual({
      ...signed,
      payload: signed.payload.toUpperCase(),
      hash: signed.hash.toUpperCase(),
      signerPublicKey: signed.signerPublicKey.toUpperCase(),
    });
    expect(signTransaction).toHaveBeenCalledWith({
      chain: 'symbol',
      network: 'testnet',
      payload,
      accountId: 'account-1',
    });
  });

  it('verifies NEM transactions through the NEM-specific validator', () => {
    const facade = new NemFacade('testnet');
    const signer = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const transaction = new nemModels.TransferTransactionV1();
    transaction.signerPublicKey = new nemModels.PublicKey(signer.publicKey.bytes);
    transaction.network = nemModels.NetworkType.TESTNET;
    transaction.recipientAddress = new nemModels.Address(new TextEncoder().encode(recipient.address.toString()));
    transaction.amount = new nemModels.Amount(1n);
    transaction.fee = new nemModels.Amount(0n);
    transaction.timestamp = new nemModels.Timestamp(1);
    transaction.deadline = new nemModels.Timestamp(2);
    const payload = utils.uint8ToHex(transaction.serialize());
    transaction.signature = new nemModels.Signature(signer.signTransaction(transaction).bytes);
    const signed = {
      payload: utils.uint8ToHex(transaction.serialize()),
      hash: facade.hashTransaction(transaction).toString(),
      signerPublicKey: signer.publicKey.toString(),
    };

    expect(
      verifySignedTransaction(
        { chain: 'nem', network: 'testnet', payload, expectedSignerPublicKey: signer.publicKey.toString() },
        signed
      )
    ).toEqual({ ...signed, hash: signed.hash.toUpperCase(), signerPublicKey: signed.signerPublicKey.toUpperCase() });
  });

  it('generates nonce and expiry and verifies a domain-separated data signature', async () => {
    const signer = new SymbolFacade('testnet').createAccount(PrivateKey.random());
    const account = {
      id: 'account-1',
      profileId: 'profile-1',
      name: 'Signer',
      address: signer.address.toString(),
      publicKey: signer.publicKey.toString(),
      scope: { chain: 'symbol', network: 'testnet' } as const,
    };
    const signMessage = vi.fn(async (input: SignMessageParams) => {
      const structured = createStructuredMessage('https://dapp.example', input);
      return {
        signature: signer.keyPair.sign(structured.signingBytes).toString(),
        signerPublicKey: signer.publicKey.toString(),
        signingDigest: await structuredMessageDigest(structured.signingBytes),
        message: structured.message,
      };
    });
    const provider: MosaicLynxProvider = {
      version: '0.1.0',
      apiVersion: '2.0.0',
      connect: async () => [account],
      disconnect: async () => undefined,
      getAccounts: async () => [account],
      getActiveAccount: async () => account,
      signMessage,
      signTransaction: vi.fn(),
      cosignTransaction: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    setWindowProvider(provider);
    const result = await createMosaicLynxSDK().signData({
      chain: 'symbol',
      network: 'testnet',
      purpose: 'example.login',
      data: { encoding: 'utf8', value: '署名対象' },
      expectedSignerPublicKey: signer.publicKey.toString(),
    });
    expect(result.message.domain).toBe('mosaiclynx.message.v1');
    expect(result.message.origin).toBe('https://dapp.example');
    expect(result.message.nonce).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(Date.parse(result.message.expiresAt) - Date.parse(result.message.issuedAt)).toBe(300_000);
    expect(signMessage).toHaveBeenCalledOnce();
  });

  it('keeps diagnostics callback failures out of the signing result', async () => {
    const events: string[] = [];
    const sdk = createMosaicLynxSDK({
      diagnostics: {
        enabled: true,
        onEvent: (event) => {
          events.push(event.phase);
          throw new Error('diagnostic consumer failure');
        },
      },
    });
    await expect(sdk.signTransaction({ chain: 'nem', network: 'testnet', payload: '0' })).rejects.toMatchObject({
      code: 'INVALID_PARAMS',
    });
    expect(events).toEqual(['failed']);
  });
});
