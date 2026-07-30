import { describe, expect, it } from 'vitest';

import { isActiveAccountForProfile, isEnabledProfileScope } from '../src/background/profile-eligibility.js';
import type { PublicAccount, PublicProfile } from '../src/vault.js';

const profile = {
  id: 'profile-1',
  name: 'Symbol only',
  network: 'testnet',
  enabledChains: ['symbol'],
  defaultAccountId: 'account-1',
  nextAccountIndex: 1,
  hdAccountIds: ['account-1'],
  revision: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} satisfies PublicProfile;

const account = (status: PublicAccount['status']): PublicAccount => ({
  id: 'account-1',
  profileId: profile.id,
  name: 'Account 1',
  identities: {
    symbol: { address: 'TACCOUNT', publicKey: 'A'.repeat(64) },
    nem: { address: 'NACCOUNT', publicKey: 'B'.repeat(64) },
  },
  source: {
    kind: 'mnemonicDerived',
    secretRef: 'vault:profile-1:mnemonic:0',
    accountIndex: 0,
    derivationPath: "44'/4343'/0'/0'/0'",
  },
  status,
  revision: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('profile signing eligibility', () => {
  it('allows only an enabled chain for the profile network', () => {
    expect(isEnabledProfileScope(profile, { chain: 'symbol', network: 'testnet' })).toBe(true);
    expect(isEnabledProfileScope(profile, { chain: 'nem', network: 'testnet' })).toBe(false);
    expect(isEnabledProfileScope(profile, { chain: 'symbol', network: 'mainnet' })).toBe(false);
  });

  it('does not offer excluded accounts for a profile', () => {
    expect(isActiveAccountForProfile(account('active'), profile.id)).toBe(true);
    expect(isActiveAccountForProfile(account('excluded'), profile.id)).toBe(false);
    expect(isActiveAccountForProfile(account('active'), 'another-profile')).toBe(false);
  });
});
