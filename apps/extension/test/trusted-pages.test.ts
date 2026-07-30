import { describe, expect, it } from 'vitest';

import { revokeTrustedPage, trustedPagesForProfile } from '../src/trusted-pages.js';
import type { ExtensionStore, PermissionGrant } from '../src/vault.js';

const grant = (origin: string, chain: PermissionGrant['chain'], accountIds: readonly string[]): PermissionGrant => ({
  origin,
  profileId: 'profile-1',
  chain,
  network: 'testnet',
  accountIds,
  revision: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('trusted page management', () => {
  it('groups chain permissions by trusted page and deduplicates accounts', () => {
    const pages = trustedPagesForProfile(
      [
        grant('https://app.example', 'symbol', ['account-1']),
        grant('https://app.example', 'nem', ['account-1', 'account-2']),
      ],
      'profile-1'
    );

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ origin: 'https://app.example', accountCount: 2 });
    expect(pages[0]!.grants).toHaveLength(2);
  });

  it('revokes every permission for the page in the selected profile only', () => {
    const store = {
      permissions: [
        grant('https://app.example', 'symbol', ['account-1']),
        grant('https://app.example', 'nem', ['account-1']),
        { ...grant('https://app.example', 'symbol', ['account-2']), profileId: 'profile-2' },
        grant('https://keep.example', 'symbol', ['account-1']),
      ],
    } as ExtensionStore;

    const next = revokeTrustedPage(store, 'profile-1', 'https://app.example');

    expect(next.permissions).toHaveLength(2);
    expect(next.permissions.map((item) => `${item.profileId}:${item.origin}`)).toEqual([
      'profile-2:https://app.example',
      'profile-1:https://keep.example',
    ]);
  });
});
