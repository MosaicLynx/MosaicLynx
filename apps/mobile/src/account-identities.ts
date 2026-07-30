import { NemChainAdapter } from '@mosaiclynx/chain-nem';
import { SymbolChainAdapter } from '@mosaiclynx/chain-symbol';
import type { Account } from '@mosaiclynx/core';
import { PrivateKey } from '@nemnesia/symbol-sdk';

const symbol = new SymbolChainAdapter();
const nem = new NemChainAdapter();

export const identitiesForPrivateKey = (privateKey: string): Account['identities'] => {
  new PrivateKey(privateKey);
  const symbolAccount = symbol.importAccount('testnet', privateKey);
  const nemAccount = nem.importAccount('testnet', privateKey);
  return {
    symbol: { address: symbolAccount.address, publicKey: symbolAccount.publicKey },
    nem: { address: nemAccount.address, publicKey: nemAccount.publicKey },
  };
};
