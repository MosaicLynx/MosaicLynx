import { describe, expect, it } from 'vitest';

import { identitiesForPrivateKey } from '../src/account-identities.js';

describe('private-key identities', () => {
  it('derives both chain identities from a valid key', () => {
    const identities = identitiesForPrivateKey('A'.repeat(64));

    expect(identities.symbol.address).not.toBe('');
    expect(identities.nem.address).not.toBe('');
  });

  it.each(['', 'A'.repeat(63), `${'A'.repeat(63)}G`])('rejects an invalid key: %s', (privateKey) => {
    expect(() => identitiesForPrivateKey(privateKey)).toThrow();
  });
});
