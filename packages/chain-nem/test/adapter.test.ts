import { PrivateKey, Signature, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, models } from '@nemnesia/symbol-sdk/nem';
import { describe, expect, it } from 'vitest';

import { NemChainAdapter } from '../src/index.js';

describe('NemChainAdapter', () => {
  it('creates a testnet account and imports the same private key deterministically', () => {
    const adapter = new NemChainAdapter();
    const created = adapter.createAccount('testnet');
    const imported = adapter.importAccount('testnet', created.privateKey);

    expect(created.privateKey).toMatch(/^[0-9A-F]{64}$/);
    expect(imported.publicKey).toBe(created.publicKey);
    expect(imported.address).toBe(created.address);
  });

  it('strictly inspects, signs, and independently verifies a NEM Transfer v1', () => {
    const adapter = new NemChainAdapter();
    const facade = new NemFacade('testnet');
    const signer = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const transaction = new models.TransferTransactionV1();
    transaction.signerPublicKey = new models.PublicKey(signer.publicKey.bytes);
    transaction.network = models.NetworkType.TESTNET;
    transaction.recipientAddress = new models.Address(new TextEncoder().encode(recipient.address.toString()));
    transaction.amount = new models.Amount(1n);
    transaction.fee = new models.Amount(0n);
    transaction.timestamp = new models.Timestamp(1);
    transaction.deadline = new models.Timestamp(2);
    const payload = utils.uint8ToHex(transaction.serialize());

    expect(adapter.inspectTransaction('testnet', payload, signer.publicKey.toString())).toMatchObject({
      schema: 'TransferTransactionV1',
      recipients: [recipient.address.toString()],
    });
    const signed = adapter.signTransaction('testnet', payload, signer.keyPair.privateKey.toString());
    const decoded = models.TransactionFactory.deserialize(utils.hexToUint8(signed.payload));
    expect(facade.verifyTransaction(decoded, new Signature(decoded.signature.bytes))).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, signed)).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, { ...signed, hash: '00'.repeat(32) })).toBe(false);
  });
});
