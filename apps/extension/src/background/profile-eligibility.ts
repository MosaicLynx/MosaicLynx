import type { MosaicScope } from '@mosaiclynx/provider-api';

import type { PublicAccount, PublicProfile } from '../vault.js';

export const isEnabledProfileScope = (profile: PublicProfile, scope: MosaicScope): boolean =>
  profile.network === scope.network && profile.chain === scope.chain;

export const isActiveAccountForProfile = (account: PublicAccount, profileId: string): boolean =>
  account.profileId === profileId && account.status === 'active';

export const hasRemainingActiveAccount = (
  accounts: readonly PublicAccount[],
  profileId: string,
  removedAccountId: string
): boolean =>
  accounts.some(
    (account) => account.profileId === profileId && account.status === 'active' && account.id !== removedAccountId
  );
