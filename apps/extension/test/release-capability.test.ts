import { describe, expect, it } from 'vitest';

import { MAINNET_SIGNING_ENABLED } from '../src/release-capabilities.js';

describe('release capability', () => {
  it('is fail-closed in the test and development build configuration', () => {
    expect(MAINNET_SIGNING_ENABLED).toBe(false);
  });
});
