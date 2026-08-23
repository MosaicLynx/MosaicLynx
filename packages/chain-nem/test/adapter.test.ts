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

    expect(adapter.inspectTransaction('testnet', payload)).toMatchObject({
      schema: 'TransferTransactionV1',
      signerPublicKey: signer.publicKey.toString(),
      recipients: [recipient.address.toString()],
    });
    expect(() => adapter.signTransaction('testnet', payload, PrivateKey.random().toString())).toThrow(
      'signer mismatch'
    );
    const signed = adapter.signTransaction('testnet', payload, signer.keyPair.privateKey.toString());
    const decoded = models.TransactionFactory.deserialize(utils.hexToUint8(signed.payload));
    expect(facade.verifyTransaction(decoded, new Signature(decoded.signature.bytes))).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, signed)).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, { ...signed, hash: '00'.repeat(32) })).toBe(false);
  });

  it('cosigns a CosignatureV1 only when its complete signed Multisig parent matches', () => {
    const adapter = new NemChainAdapter();
    const facade = new NemFacade('testnet');
    const initiator = facade.createAccount(PrivateKey.random());
    const multisig = facade.createAccount(PrivateKey.random());
    const cosigner = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const inner = new models.NonVerifiableTransferTransactionV1();
    inner.signerPublicKey = new models.PublicKey(multisig.publicKey.bytes);
    inner.network = models.NetworkType.TESTNET;
    inner.recipientAddress = new models.Address(new TextEncoder().encode(recipient.address.toString()));
    inner.amount = new models.Amount(1n);
    inner.fee = new models.Amount(0n);
    inner.timestamp = new models.Timestamp(1);
    inner.deadline = new models.Timestamp(2);
    const parent = new models.MultisigTransactionV1();
    parent.signerPublicKey = new models.PublicKey(initiator.publicKey.bytes);
    parent.network = models.NetworkType.TESTNET;
    parent.fee = new models.Amount(0n);
    parent.timestamp = new models.Timestamp(1);
    parent.deadline = new models.Timestamp(2);
    parent.innerTransaction = inner;
    parent.cosignatures = [];
    parent.signature = new models.Signature(initiator.signTransaction(parent).bytes);
    const parentHash = facade.hashTransaction(parent);
    const cosignature = new models.CosignatureV1();
    cosignature.signerPublicKey = new models.PublicKey(cosigner.publicKey.bytes);
    cosignature.network = models.NetworkType.TESTNET;
    cosignature.fee = new models.Amount(0n);
    cosignature.timestamp = new models.Timestamp(1);
    cosignature.deadline = new models.Timestamp(2);
    cosignature.otherTransactionHash = new models.Hash256(parentHash.bytes);
    cosignature.multisigAccountAddress = new models.Address(new TextEncoder().encode(multisig.address.toString()));
    const result = adapter.cosignTransaction(
      'testnet',
      utils.uint8ToHex(cosignature.serialize()),
      utils.uint8ToHex(parent.serialize()),
      cosigner.keyPair.privateKey.toString()
    );
    const decoded = models.TransactionFactory.deserialize(utils.hexToUint8(result.payload));
    expect(decoded).toBeInstanceOf(models.CosignatureV1);
    expect(facade.verifyTransaction(decoded, new Signature(decoded.signature.bytes))).toBe(true);
  });
});
