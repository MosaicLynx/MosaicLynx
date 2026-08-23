import { type MosaicLynxProvider, isSupportedApiVersion } from '@mosaiclynx/provider-api';

/** 注入値をそのまま信用せず、署名に必要な Provider の最小契約を確認します。 */
const isProviderShape = (value: unknown): value is MosaicLynxProvider => {
  const provider = value as Partial<MosaicLynxProvider> | undefined;
  return (
    typeof provider?.apiVersion === 'string' &&
    typeof provider.getAccounts === 'function' &&
    typeof provider.getActiveAccount === 'function' &&
    typeof provider.connect === 'function' &&
    typeof provider.signMessage === 'function' &&
    typeof provider.signTransaction === 'function' &&
    typeof provider.cosignTransaction === 'function'
  );
};

/**
 * 拡張機能 Provider の状態を返します。
 * 未対応の Provider が存在するときは、意図しないモバイル Relay へのフォールバックを防ぎます。
 */
export const providerState = (): 'none' | 'supported' | 'unsupported' => {
  if (typeof window === 'undefined' || window.mosaicLynx === undefined) return 'none';
  return isProviderShape(window.mosaicLynx) && isSupportedApiVersion(window.mosaicLynx.apiVersion)
    ? 'supported'
    : 'unsupported';
};

/** モバイル Relay に必要なブラウザー機能とモバイル UA を満たすか確認します。 */
export const hasMobilePlatform = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!globalThis.crypto?.subtle || typeof fetch !== 'function' || typeof document.visibilityState !== 'string')
    return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
