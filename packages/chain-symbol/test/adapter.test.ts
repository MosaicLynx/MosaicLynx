import { PrivateKey, Signature, utils } from '@nemnesia/symbol-sdk';
import { SymbolFacade, models } from '@nemnesia/symbol-sdk/symbol';
import { describe, expect, it } from 'vitest';

import { SymbolChainAdapter, deriveSharedAccount } from '../src/index.js';

describe('SymbolChainAdapter', () => {
  it('creates a testnet account and imports the same private key deterministically', () => {
    const adapter = new SymbolChainAdapter();
    const created = adapter.createAccount('testnet');
    const imported = adapter.importAccount('testnet', created.privateKey);

    expect(created.privateKey).toMatch(/^[0-9A-F]{64}$/);
    expect(imported.publicKey).toBe(created.publicKey);
    expect(imported.address).toBe(created.address);
  });

  it('reproduces the fixed shared Symbol/NEM BIP32 vector', () => {
    const mnemonic = [...Array(23).fill('abandon'), 'art'].join(' ');
    expect(deriveSharedAccount('testnet', mnemonic, 0)).toEqual({
      privateKey: '99DA0B339E5C3E3DDDD59678B52A7C7E5F9E02BD07AF4E220CD69228766BCDDB',
      derivationPath: '44/1/0/0/0',
      identities: {
        symbol: {
          address: 'TAPS6PH4GZNA6GQ26S7T44S4BYM3Z2CHUJ53HGA',
          publicKey: '811B322F9C28877BF9F543A8E8DB1F3C4FD45A6CCC6CADF315499893D49B8299',
        },
        nem: {
          address: 'TCKUCPJPOSUD6L572UDDGKLBHB2HKEXYUHMT7JCO',
          publicKey: 'F3A6530BB810DFCE3F18DAC30B90A8B8A97501AE57E3B2F27BC6C034CF6655AB',
        },
      },
    });
  });

  it('strictly inspects, signs, and verifies a canonical Transfer v1', () => {
    const adapter = new SymbolChainAdapter();
    const signer = new SymbolFacade('testnet').createAccount(PrivateKey.random());
    const recipient = new SymbolFacade('testnet').createAccount(PrivateKey.random());
    const transaction = new models.TransferTransactionV1();
    transaction.signerPublicKey = new models.PublicKey(signer.publicKey.bytes);
    transaction.network = models.NetworkType.TESTNET;
    transaction.recipientAddress = new models.UnresolvedAddress(recipient.address.bytes);
    transaction.mosaics = [];
    transaction.message = new TextEncoder().encode('hello');
    transaction.fee = new models.Amount(0n);
    transaction.deadline = new models.Timestamp(1n);
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
    const signedTransaction = models.TransactionFactory.deserialize(utils.hexToUint8(signed.payload));
    expect(
      new SymbolFacade('testnet').verifyTransaction(signedTransaction, new Signature(signedTransaction.signature.bytes))
    ).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, signed)).toBe(true);
    expect(adapter.verifySignedTransaction('testnet', payload, { ...signed, hash: '00'.repeat(32) })).toBe(false);
    expect(signed.signerPublicKey).toBe(signer.publicKey.toString());
  });

  it('cosigns only a complete signed Aggregate v2 parent', () => {
    const adapter = new SymbolChainAdapter();
    const facade = new SymbolFacade('testnet');
    const initiator = facade.createAccount(PrivateKey.random());
    const cosigner = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const embedded = new models.EmbeddedTransferTransactionV1();
    embedded.signerPublicKey = new models.PublicKey(cosigner.publicKey.bytes);
    embedded.network = models.NetworkType.TESTNET;
    embedded.recipientAddress = new models.UnresolvedAddress(recipient.address.bytes);
    embedded.mosaics = [];
    embedded.message = new Uint8Array();
    const aggregate = new models.AggregateCompleteTransactionV2();
    aggregate.signerPublicKey = new models.PublicKey(initiator.publicKey.bytes);
    aggregate.network = models.NetworkType.TESTNET;
    aggregate.fee = new models.Amount(0n);
    aggregate.deadline = new models.Timestamp(1n);
    aggregate.transactions = [embedded];
    aggregate.transactionsHash = new models.Hash256(facade.static.hashEmbeddedTransactions([embedded]).bytes);
    aggregate.cosignatures = [];
    aggregate.signature = new models.Signature(initiator.signTransaction(aggregate).bytes);
    const parentPayload = utils.uint8ToHex(aggregate.serialize());
    const result = adapter.cosignTransaction('testnet', parentPayload, cosigner.keyPair.privateKey.toString(), true);
    const decoded = models.DetachedCosignature.deserialize(utils.hexToUint8(result.payload));
    expect(result.parentHash).toBe(facade.hashTransaction(aggregate).toString());
    expect(decoded.signerPublicKey.toString()).toBe(cosigner.publicKey.toString());
    expect(
      new facade.static.Verifier(cosigner.publicKey).verify(facade.hashTransaction(aggregate).bytes, decoded.signature)
    ).toBe(true);
  });
});
