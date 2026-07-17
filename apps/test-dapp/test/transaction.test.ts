import { PrivateKey, utils } from '@nemnesia/symbol-sdk';
import { NemFacade, TransactionFactory as NemTransactionFactory, models as nem } from '@nemnesia/symbol-sdk/nem';
import { SymbolFacade, SymbolTransactionFactory, models as symbol } from '@nemnesia/symbol-sdk/symbol';
import { describe, expect, it } from 'vitest';

import { createTransferPayload } from '../src/transaction.js';

describe('createTransferPayload', () => {
  it('creates a canonical Symbol testnet native-currency transfer', () => {
    const facade = new SymbolFacade('testnet');
    const signer = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const payload = createTransferPayload({
      chain: 'symbol',
      network: 'testnet',
      signerPublicKey: signer.publicKey.toString(),
      recipient: recipient.address.toString(),
      amount: '1.25',
      message: 'symbol test',
    });

    const transaction = SymbolTransactionFactory.deserialize(utils.hexToUint8(payload));
    expect(transaction).toBeInstanceOf(symbol.TransferTransactionV1);
    const transfer = transaction as symbol.TransferTransactionV1;
    expect(transfer.signerPublicKey.toString()).toBe(signer.publicKey.toString());
    expect(transfer.network.value).toBe(0x98);
    expect(transfer.mosaics[0]?.mosaicId.value).toBe(0x72c0212e67a08bcen);
    expect(transfer.mosaics[0]?.amount.value).toBe(1_250_000n);
    expect(utils.uint8ToHex(transaction.serialize())).toBe(payload);
  });

  it('creates a canonical NEM testnet transfer', () => {
    const facade = new NemFacade('testnet');
    const signer = facade.createAccount(PrivateKey.random());
    const recipient = facade.createAccount(PrivateKey.random());
    const payload = createTransferPayload({
      chain: 'nem',
      network: 'testnet',
      signerPublicKey: signer.publicKey.toString(),
      recipient: recipient.address.toString(),
      amount: '2.5',
      message: 'nem test',
    });

    const transaction = NemTransactionFactory.deserialize(utils.hexToUint8(payload));
    expect(transaction).toBeInstanceOf(nem.TransferTransactionV1);
    const transfer = transaction as nem.TransferTransactionV1;
    expect(transfer.signerPublicKey.toString()).toBe(signer.publicKey.toString());
    expect(transfer.network.value).toBe(0x98);
    expect(transfer.amount.value).toBe(2_500_000n);
    expect(utils.uint8ToHex(transaction.serialize())).toBe(payload);
  });
});
