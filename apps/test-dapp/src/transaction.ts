import { utils } from '@nemnesia/symbol-sdk';
import { Address as NemAddress, NemFacade, models as nem } from '@nemnesia/symbol-sdk/nem';
import { Address as SymbolAddress, SymbolFacade, models as symbol } from '@nemnesia/symbol-sdk/symbol';

export type Chain = 'symbol' | 'nem';
export type Network = 'mainnet' | 'testnet';

export interface TransferInput {
  readonly chain: Chain;
  readonly network: Network;
  readonly signerPublicKey: string;
  readonly recipient: string;
  readonly amount: string;
  readonly message: string;
}

const SYMBOL_CURRENCY_ID: Record<Network, bigint> = {
  mainnet: 0x6bed913fa20223f8n,
  testnet: 0x72c0212e67a08bcen,
};

const networkIdentifier = (network: Network): number => (network === 'mainnet' ? 0x68 : 0x98);

const parseAmount = (value: string): bigint => {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(value.trim());
  if (!match) throw new Error('Amount は小数点以下6桁までの正数で入力してください。');
  const whole = match[1];
  if (!whole) throw new Error('Amount が不正です。');
  const amount = BigInt(whole) * 1_000_000n + BigInt((match[2] ?? '').padEnd(6, '0'));
  if (amount <= 0n || amount > 0xffff_ffff_ffff_ffffn) throw new Error('Amount が範囲外です。');
  return amount;
};

const publicKeyBytes = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('署名アカウントの公開鍵が不正です。');
  return Uint8Array.from(utils.hexToUint8(value));
};

const createSymbolTransfer = (input: TransferInput, amount: bigint): string => {
  const facade = new SymbolFacade(input.network);
  if (!facade.network.isValidAddressString(input.recipient))
    throw new Error('Recipient は選択した Symbol network のアドレスではありません。');

  const transaction = new symbol.TransferTransactionV1();
  transaction.signerPublicKey = new symbol.PublicKey(publicKeyBytes(input.signerPublicKey));
  transaction.network = new symbol.NetworkType(networkIdentifier(input.network));
  transaction.recipientAddress = new symbol.UnresolvedAddress(new SymbolAddress(input.recipient).bytes);
  const mosaic = new symbol.UnresolvedMosaic();
  mosaic.mosaicId = new symbol.UnresolvedMosaicId(SYMBOL_CURRENCY_ID[input.network]);
  mosaic.amount = new symbol.Amount(amount);
  transaction.mosaics = [mosaic];
  transaction.message = new TextEncoder().encode(input.message);
  transaction.deadline = new symbol.Timestamp(facade.now().addHours(2).timestamp);
  transaction.fee = new symbol.Amount(BigInt(transaction.size) * 100n);
  return utils.uint8ToHex(transaction.serialize());
};

const createNemTransfer = (input: TransferInput, amount: bigint): string => {
  const facade = new NemFacade(input.network);
  if (!facade.network.isValidAddressString(input.recipient))
    throw new Error('Recipient は選択した NEM network のアドレスではありません。');

  const now = facade.now();
  const transaction = new nem.TransferTransactionV1();
  transaction.signerPublicKey = new nem.PublicKey(publicKeyBytes(input.signerPublicKey));
  transaction.network = new nem.NetworkType(networkIdentifier(input.network));
  transaction.recipientAddress = new nem.Address(new TextEncoder().encode(new NemAddress(input.recipient).toString()));
  transaction.amount = new nem.Amount(amount);
  if (input.message) {
    const message = new nem.Message();
    message.messageType = nem.MessageType.PLAIN;
    message.message = new TextEncoder().encode(input.message);
    transaction.message = message;
  }
  transaction.timestamp = new nem.Timestamp(Number(now.timestamp));
  transaction.deadline = new nem.Timestamp(Number(now.addHours(2).timestamp));
  transaction.fee = new nem.Amount(50_000n);
  return utils.uint8ToHex(transaction.serialize());
};

export const createTransferPayload = (input: TransferInput): string => {
  const amount = parseAmount(input.amount);
  return input.chain === 'symbol' ? createSymbolTransfer(input, amount) : createNemTransfer(input, amount);
};
