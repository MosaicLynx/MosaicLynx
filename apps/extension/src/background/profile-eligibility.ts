import type { MosaicScope } from '@mosaiclynx/provider-api';

import type { PublicAccount, PublicProfile } from '../vault.js';

export const isEnabledProfileScope = (profile: PublicProfile, scope: MosaicScope): boolean =>
  profile.network === scope.network && profile.enabledChains.includes(scope.chain);

export const isActiveAccountForProfile = (account: PublicAccount, profileId: string): boolean =>
  account.profileId === profileId && account.status === 'active';
