import type { ExtensionStore, PermissionGrant } from './vault.js';

export interface TrustedPage {
  readonly origin: string;
  readonly grants: readonly PermissionGrant[];
  readonly accountCount: number;
}

export const trustedPagesForProfile = (
  permissions: readonly PermissionGrant[],
  profileId: string
): readonly TrustedPage[] => {
  const grantsByOrigin = new Map<string, PermissionGrant[]>();
  for (const grant of permissions) {
    if (grant.profileId !== profileId) continue;
    const grants = grantsByOrigin.get(grant.origin);
    if (grants) grants.push(grant);
    else grantsByOrigin.set(grant.origin, [grant]);
  }
  return [...grantsByOrigin.entries()].map(([origin, grants]) => ({
    origin,
    grants,
    accountCount: new Set(grants.flatMap((grant) => grant.accountIds)).size,
  }));
};

export const revokeTrustedPage = (store: ExtensionStore, profileId: string, origin: string): ExtensionStore => ({
  ...store,
  permissions: store.permissions.filter((grant) => grant.profileId !== profileId || grant.origin !== origin),
});
