import { describe, expect, it } from 'vitest';

import { activeChainForEnabledChains } from '../src/profile-state.js';

describe('profile active chain', () => {
  it('keeps the preferred chain when it remains enabled', () => {
    expect(activeChainForEnabledChains(['symbol', 'nem'], 'nem')).toBe('nem');
  });

  it('uses the first enabled chain when the preferred chain is disabled', () => {
    expect(activeChainForEnabledChains(['nem'], 'symbol')).toBe('nem');
  });

  it('rejects profiles without an enabled chain', () => {
    expect(() => activeChainForEnabledChains([], 'symbol')).toThrow('at least one chain');
  });
});
