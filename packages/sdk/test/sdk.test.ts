import type { MosaicLynxProvider } from '@mosaiclynx/provider-api';
import { PrivateKey, utils } from '@nemnesia/symbol-sdk';
import { SymbolFacade, models } from '@nemnesia/symbol-sdk/symbol';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MosaicLynxSDKError, createMosaicLynxSDK } from '../src/index.js';

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

const setWindowProvider = (provider: unknown): void => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { mosaicLynx: provider },
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
      getActiveAccount: async () => undefined,
      signMessage: async () => {
        throw new Error('unused');
      },
      signTransaction,
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
