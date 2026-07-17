/** Build-time value written only by tools/evidence/embed.mjs after a fail-closed gate. */
declare const __MOSAICLYNX_MAINNET_ENABLED__: boolean;
export const MAINNET_SIGNING_ENABLED =
  typeof __MOSAICLYNX_MAINNET_ENABLED__ === 'boolean' && __MOSAICLYNX_MAINNET_ENABLED__;
