import { PrivateKey, utils } from "@nemnesia/symbol-sdk";
import {
  NemFacade,
  TransactionFactory,
  models,
} from "@nemnesia/symbol-sdk/nem";
import type {
  ChainAdapterPort,
  ChainScope,
  GeneratedAccountMaterial,
  TransactionInspection,
} from "@mosaic-lynx/core";

const bytesFor = (payload: string): Uint8Array => {
  if (!payload || payload.length % 2 || !utils.isHexString(payload))
    throw new Error("INVALID_TRANSACTION: payload must be even-length hexadecimal");
  const bytes = utils.hexToUint8(payload);
  if (bytes.length > 256 * 1024) throw new Error("INVALID_TRANSACTION: payload exceeds 256 KiB");
  return bytes;
};

const equal = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((byte, index) => byte === right[index]);

const networkIdentifier = (network: ChainScope["network"]): number =>
  network === "mainnet" ? 0x68 : 0x98;

type AnyNemTransfer =
  | models.TransferTransactionV1
  | models.TransferTransactionV2
  | models.NonVerifiableTransferTransactionV1
  | models.NonVerifiableTransferTransactionV2;

const assertTransfer = (transaction: AnyNemTransfer, network: ChainScope["network"]): string => {
  if ((transaction.version !== 1 && transaction.version !== 2)
    || transaction.type.value !== 257 || transaction.network.value !== networkIdentifier(network))
    throw new Error("UNSUPPORTED_TRANSACTION: only NEM Transfer v1/v2 is allowed");
  if (transaction instanceof models.TransferTransactionV2
    || transaction instanceof models.NonVerifiableTransferTransactionV2) {
    let previous = "";
    for (const mosaic of transaction.mosaics as Array<{ mosaicId: { toString(): string } }>) {
      const id = mosaic.mosaicId.toString();
      if (id <= previous) throw new Error("INVALID_TRANSACTION: duplicate or non-canonical mosaic ordering");
      previous = id;
    }
  }
  const recipient = new TextDecoder("ascii", { fatal: true }).decode(transaction.recipientAddress.bytes);
  if (!new NemFacade(network).network.isValidAddressString(recipient))
    throw new Error("INVALID_TRANSACTION: recipient address is invalid for the requested network");
  return recipient;
};

const inspect = (
  network: ChainScope["network"],
  payload: string,
  expectedSignerPublicKey: string,
): { transaction: models.Transaction; inspection: TransactionInspection } => {
  const bytes = bytesFor(payload);
  let transaction: models.Transaction;
  try { transaction = TransactionFactory.deserialize(bytes); }
  catch { throw new Error("INVALID_TRANSACTION: NEM payload cannot be decoded"); }
  if (!equal(transaction.serialize(), bytes)) throw new Error("INVALID_TRANSACTION: payload is not canonical");
  if (transaction.network.value !== networkIdentifier(network)) throw new Error("NETWORK_MISMATCH");
  const signer = transaction.signerPublicKey.toString().toUpperCase();
  if (signer !== expectedSignerPublicKey.toUpperCase()) throw new Error("INVALID_TRANSACTION: signer mismatch");
  const recipients: string[] = [];
  let schema: string;
  if (transaction instanceof models.TransferTransactionV1 || transaction instanceof models.TransferTransactionV2) {
    schema = transaction instanceof models.TransferTransactionV1
      ? "TransferTransactionV1" : "TransferTransactionV2";
    recipients.push(assertTransfer(transaction, network));
  } else if (transaction instanceof models.MultisigTransactionV1) {
    schema = "MultisigTransactionV1";
    if (transaction.cosignatures.length !== 0)
      throw new Error("INVALID_TRANSACTION: a new NEM multisig request must not contain cosignatures");
    const inner = transaction.innerTransaction;
    if (!(inner instanceof models.NonVerifiableTransferTransactionV1)
      && !(inner instanceof models.NonVerifiableTransferTransactionV2))
      throw new Error("UNSUPPORTED_TRANSACTION: NEM multisig inner transaction must be Transfer v1/v2");
    recipients.push(assertTransfer(inner, network));
  } else if (transaction instanceof models.CosignatureV1) {
    throw new Error("UNSUPPORTED_TRANSACTION: a NEM cosignature requires its complete parent multisig payload");
  } else {
    throw new Error("UNSUPPORTED_TRANSACTION: NEM transaction type or version is not allowlisted");
  }
  return {
    transaction,
    inspection: {
      fixtureContractVersion: "1",
      chain: "nem",
      network,
      schema,
      numericType: transaction.type.value,
      version: transaction.version,
      signerPublicKey: signer,
      recipients,
      warnings: [],
      externalStateUnverified: ["chain state", "mosaic metadata", "balance", "multisig membership"],
      canonicalPayload: utils.uint8ToHex(bytes),
    },
  };
};

const createMaterial = (
  network: ChainScope["network"],
  privateKey: PrivateKey,
): GeneratedAccountMaterial => {
  const account = new NemFacade(network).createAccount(privateKey);
  return {
    address: account.address.toString(),
    publicKey: account.publicKey.toString(),
    privateKey: account.keyPair.privateKey.toString(),
  };
};

export class NemChainAdapter implements ChainAdapterPort {
  public readonly chain = "nem" as const;

  public createAccount(network: ChainScope["network"]): GeneratedAccountMaterial {
    return createMaterial(network, PrivateKey.random());
  }

  public importAccount(network: ChainScope["network"], privateKey: string): GeneratedAccountMaterial {
    return createMaterial(network, new PrivateKey(privateKey));
  }

  public inspectTransaction(
    network: ChainScope["network"],
    payload: string,
    expectedSignerPublicKey: string,
  ): TransactionInspection {
    return inspect(network, payload, expectedSignerPublicKey).inspection;
  }

  public signTransaction(
    network: ChainScope["network"],
    payload: string,
    privateKeyHex: string,
  ): { readonly payload: string; readonly hash: string; readonly signerPublicKey: string } {
    const facade = new NemFacade(network);
    const account = facade.createAccount(new PrivateKey(privateKeyHex));
    const { transaction } = inspect(network, payload, account.publicKey.toString());
    if (!transaction.signature.bytes.every((byte) => byte === 0))
      throw new Error("INVALID_TRANSACTION: outer transaction is already signed");
    const signature = account.signTransaction(transaction);
    transaction.signature = new models.Signature(signature.bytes);
    if (!facade.verifyTransaction(transaction, signature)) throw new Error("INTERNAL_ERROR: signature verification failed");
    return {
      payload: utils.uint8ToHex(transaction.serialize()),
      hash: facade.hashTransaction(transaction).toString(),
      signerPublicKey: account.publicKey.toString(),
    };
  }

  public verifySignedTransaction(
    network: ChainScope["network"],
    unsignedPayload: string,
    result: { readonly payload: string; readonly hash: string; readonly signerPublicKey: string },
  ): boolean {
    try {
      const facade = new NemFacade(network);
      const unsigned = inspect(network, unsignedPayload, result.signerPublicKey).transaction;
      const signed = inspect(network, result.payload, result.signerPublicKey).transaction;
      const signature = new models.Signature(signed.signature.bytes);
      return equal(facade.extractSigningPayload(unsigned), facade.extractSigningPayload(signed))
        && facade.verifyTransaction(signed, signature)
        && facade.hashTransaction(signed).toString().toUpperCase() === result.hash.toUpperCase();
    } catch { return false; }
  }
}
