import type {
  ChainAdapterPort,
  ConnectionScope,
  GeneratedAccountMaterial,
  SharedAccountMaterial,
  TransactionInspection,
} from '@mosaiclynx/core';
import { Bip32, PrivateKey, utils } from '@nemnesia/symbol-sdk';
import { NemFacade } from '@nemnesia/symbol-sdk/nem';
import { Address, SymbolFacade, SymbolTransactionFactory, isMosaicAlias, models } from '@nemnesia/symbol-sdk/symbol';

const MAX_PAYLOAD_BYTES = 256 * 1024;

const bytesFor = (payload: string): Uint8Array => {
  if (!payload || payload.length % 2 || !utils.isHexString(payload))
    throw new Error('INVALID_TRANSACTION: payload must be even-length hexadecimal');
  const bytes = utils.hexToUint8(payload);
  if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error('INVALID_TRANSACTION: payload exceeds 256 KiB');
  return bytes;
};

const equal = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((byte, index) => byte === right[index]);

const networkIdentifier = (network: ConnectionScope['network']): number => (network === 'mainnet' ? 0x68 : 0x98);

const assertTransfer = (
  transaction: models.TransferTransactionV1 | models.EmbeddedTransferTransactionV1,
  network: ConnectionScope['network']
): TransactionInspection['transfers'][number] => {
  if (
    transaction.version !== 1 ||
    transaction.type.value !== 16724 ||
    transaction.network.value !== networkIdentifier(network)
  )
    throw new Error('UNSUPPORTED_TRANSACTION: only Symbol Transfer v1 is allowed');
  const recipient = new Address(transaction.recipientAddress.bytes);
  if (recipient.isAlias()) throw new Error('INVALID_TRANSACTION: unresolved address aliases are not allowed');
  let previous = -1n;
  for (const mosaic of transaction.mosaics as Array<{ mosaicId: { value: bigint } }>) {
    const id = mosaic.mosaicId.value;
    if (isMosaicAlias(id) || id <= previous)
      throw new Error('INVALID_TRANSACTION: mosaic aliases, duplicates or non-canonical ordering are not allowed');
    previous = id;
  }
  return {
    signerPublicKey: transaction.signerPublicKey.toString().toUpperCase(),
    recipient: recipient.toString(),
    assets: (transaction.mosaics as Array<{ mosaicId: { value: bigint }; amount: { value: bigint } }>).map(
      (mosaic) => ({ id: mosaic.mosaicId.value.toString(), amount: mosaic.amount.value.toString() })
    ),
    messageHex: utils.uint8ToHex(transaction.message),
  };
};

const inspect = (
  network: ConnectionScope['network'],
  payload: string
): { transaction: models.Transaction; inspection: TransactionInspection } => {
  const bytes = bytesFor(payload);
  let transaction: models.Transaction;
  try {
    transaction = SymbolTransactionFactory.deserialize(bytes);
  } catch {
    throw new Error('INVALID_TRANSACTION: Symbol payload cannot be decoded');
  }
  if (!equal(transaction.serialize(), bytes)) throw new Error('INVALID_TRANSACTION: payload is not canonical');
  if (transaction.network.value !== networkIdentifier(network)) throw new Error('NETWORK_MISMATCH');
  const signer = transaction.signerPublicKey.toString().toUpperCase();
  const recipients: string[] = [];
  const transfers: TransactionInspection['transfers'][number][] = [];
  let schema: string;
  if (transaction instanceof models.TransferTransactionV1) {
    schema = 'TransferTransactionV1';
    const transfer = assertTransfer(transaction, network);
    recipients.push(transfer.recipient);
    transfers.push(transfer);
  } else if (
    transaction instanceof models.AggregateCompleteTransactionV2 ||
    transaction instanceof models.AggregateBondedTransactionV2
  ) {
    schema =
      transaction instanceof models.AggregateCompleteTransactionV2
        ? 'AggregateCompleteTransactionV2'
        : 'AggregateBondedTransactionV2';
    if (transaction.transactions.length < 1 || transaction.transactions.length > 100)
      throw new Error('INVALID_TRANSACTION: aggregate must contain 1 to 100 embedded transfers');
    for (const embedded of transaction.transactions) {
      if (!(embedded instanceof models.EmbeddedTransferTransactionV1))
        throw new Error('UNSUPPORTED_TRANSACTION: aggregate contains a non-transfer transaction');
      const transfer = assertTransfer(embedded, network);
      recipients.push(transfer.recipient);
      transfers.push(transfer);
    }
    const calculated = SymbolFacade.hashEmbeddedTransactions(transaction.transactions);
    if (calculated.toString() !== transaction.transactionsHash.toString())
      throw new Error('INVALID_TRANSACTION: aggregate transactions hash mismatch');
    const cosigners = new Set<string>();
    for (const cosignature of transaction.cosignatures as Array<{
      version: bigint;
      signerPublicKey: { toString(): string };
    }>) {
      const key = cosignature.signerPublicKey.toString();
      if (cosignature.version !== 0n || cosigners.has(key))
        throw new Error('INVALID_TRANSACTION: invalid or duplicate aggregate cosignature');
      cosigners.add(key);
    }
  } else {
    throw new Error('UNSUPPORTED_TRANSACTION: Symbol transaction type or version is not allowlisted');
  }
  return {
    transaction,
    inspection: {
      fixtureContractVersion: '1',
      chain: 'symbol',
      network,
      schema,
      numericType: transaction.type.value,
      version: transaction.version,
      signerPublicKey: signer,
      recipients,
      fee: transaction.fee.value.toString(),
      transfers,
      warnings: [],
      externalStateUnverified: ['chain state', 'mosaic metadata', 'balance'],
      canonicalPayload: utils.uint8ToHex(bytes),
    },
  };
};

const createMaterial = (network: ConnectionScope['network'], privateKey: PrivateKey): GeneratedAccountMaterial => {
  const account = new SymbolFacade(network).createAccount(privateKey);
  return {
    address: account.address.toString(),
    publicKey: account.publicKey.toString(),
    privateKey: account.keyPair.privateKey.toString(),
  };
};

export const generateMnemonic = (): string => {
  const bip32 = new Bip32(SymbolFacade.BIP32_CURVE_NAME, 'english');
  const mnemonic = bip32.random();
  if (mnemonic.trim().split(/\s+/).length !== 24) throw new Error('Generated mnemonic is invalid.');
  bip32.fromMnemonic(mnemonic, '');
  return mnemonic;
};

export const deriveSharedAccount = (
  network: ConnectionScope['network'],
  mnemonic: string,
  accountIndex: number
): SharedAccountMaterial & { readonly derivationPath: string } => {
  if (!Number.isInteger(accountIndex) || accountIndex < 0 || accountIndex >= 2 ** 31)
    throw new RangeError('Account index must be a 31-bit unsigned integer.');
  const bip32 = new Bip32(SymbolFacade.BIP32_CURVE_NAME, 'english');
  const root = bip32.fromMnemonic(mnemonic, '');
  const symbolFacade = new SymbolFacade(network);
  const path = symbolFacade.bip32Path(accountIndex);
  const privateKey = root.derivePath(path).privateKey;
  if (privateKey.bytes.every((byte) => byte === 0)) throw new Error('Derived private key is invalid.');
  const symbol = symbolFacade.createAccount(privateKey);
  const nem = new NemFacade(network).createAccount(privateKey);
  return {
    privateKey: privateKey.toString(),
    derivationPath: path.join('/'),
    identities: {
      symbol: { address: symbol.address.toString(), publicKey: symbol.publicKey.toString() },
      nem: { address: nem.address.toString(), publicKey: nem.publicKey.toString() },
    },
  };
};

export class SymbolChainAdapter implements ChainAdapterPort {
  public readonly chain = 'symbol' as const;

  public createAccount(network: ConnectionScope['network']): GeneratedAccountMaterial {
    return createMaterial(network, PrivateKey.random());
  }

  public importAccount(network: ConnectionScope['network'], privateKey: string): GeneratedAccountMaterial {
    return createMaterial(network, new PrivateKey(privateKey));
  }

  public inspectTransaction(network: ConnectionScope['network'], payload: string): TransactionInspection {
    return inspect(network, payload).inspection;
  }

  public signTransaction(
    network: ConnectionScope['network'],
    payload: string,
    privateKeyHex: string
  ): { readonly payload: string; readonly hash: string; readonly signerPublicKey: string } {
    const facade = new SymbolFacade(network);
    const account = facade.createAccount(new PrivateKey(privateKeyHex));
    const { transaction, inspection } = inspect(network, payload);
    if (inspection.signerPublicKey !== account.publicKey.toString().toUpperCase())
      throw new Error('INVALID_TRANSACTION: signer mismatch');
    if (!transaction.signature.bytes.every((byte) => byte === 0))
      throw new Error('INVALID_TRANSACTION: outer transaction is already signed');
    const signature = account.signTransaction(transaction);
    transaction.signature = new models.Signature(signature.bytes);
    if (!facade.verifyTransaction(transaction, signature))
      throw new Error('INTERNAL_ERROR: signature verification failed');
    return {
      payload: utils.uint8ToHex(transaction.serialize()),
      hash: facade.hashTransaction(transaction).toString(),
      signerPublicKey: account.publicKey.toString(),
    };
  }

  public verifySignedTransaction(
    network: ConnectionScope['network'],
    unsignedPayload: string,
    result: { readonly payload: string; readonly hash: string; readonly signerPublicKey: string }
  ): boolean {
    try {
      const facade = new SymbolFacade(network);
      const unsignedInspection = inspect(network, unsignedPayload);
      const signedInspection = inspect(network, result.payload);
      if (
        unsignedInspection.inspection.signerPublicKey !== result.signerPublicKey.toUpperCase() ||
        signedInspection.inspection.signerPublicKey !== result.signerPublicKey.toUpperCase()
      )
        return false;
      const unsigned = unsignedInspection.transaction;
      const signed = signedInspection.transaction;
      const signature = new models.Signature(signed.signature.bytes);
      return (
        equal(facade.extractSigningPayload(unsigned), facade.extractSigningPayload(signed)) &&
        facade.verifyTransaction(signed, signature) &&
        facade.hashTransaction(signed).toString().toUpperCase() === result.hash.toUpperCase()
      );
    } catch {
      return false;
    }
  }
}
