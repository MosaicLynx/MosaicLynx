import type { ChainKind } from '@mosaiclynx/core';

export const activeChainForEnabledChains = (
  enabledChains: readonly ChainKind[],
  preferredChain: ChainKind
): ChainKind => {
  if (enabledChains.includes(preferredChain)) return preferredChain;
  const fallback = enabledChains[0];
  if (!fallback) throw new Error('A profile must enable at least one chain.');
  return fallback;
};
