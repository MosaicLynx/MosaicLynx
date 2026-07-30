import type { MobilePersistedState } from './model';

/** Converts persisted v1 variants to the profile-owned chain model. */
export const normalizeMobileState = (stored: MobilePersistedState): MobilePersistedState => {
  const profiles = stored.profiles.map((profile) => ({
    ...profile,
    enabledChains: profile.enabledChains ?? ['symbol', 'nem'],
    hdAccountIds:
      profile.hdAccountIds ??
      stored.accounts
        .filter((account) => account.profileId === profile.id && account.source.kind === 'mnemonicDerived')
        .map((account) => account.id),
  }));
  const activeProfile = profiles.find((profile) => profile.id === stored.settings.activeProfileId) ?? profiles[0];
  return {
    ...stored,
    profiles,
    accounts: stored.accounts.map((account) => ({
      ...account,
      status: account.status ?? 'active',
      source:
        account.source.kind === 'importedPrivateKey'
          ? { kind: 'importedPrivateKey' as const, secretRef: account.source.secretRef }
          : account.source,
    })),
    settings: {
      ...stored.settings,
      activeChain:
        activeProfile && !activeProfile.enabledChains.includes(stored.settings.activeChain)
          ? activeProfile.enabledChains[0]!
          : stored.settings.activeChain,
    },
  };
};
