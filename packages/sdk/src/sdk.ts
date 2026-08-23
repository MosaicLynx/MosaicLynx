import { AccountCache, isScope } from './account-cache.js';
import { hasMobilePlatform, providerState } from './availability.js';
import { createDataSigningRequest } from './data-signing.js';
import { MosaicLynxSDKError, fail } from './errors.js';
import {
  activeAccountWithExtension,
  connectWithExtension,
  cosignWithExtension,
  disconnectWithExtension,
  signDataWithExtension,
  signWithExtension,
} from './extension.js';
import {
  connectWithMobileRelay,
  cosignWithMobileRelay,
  disconnectWithMobileRelay,
  refreshActiveAccountWithMobileRelay,
  signDataWithMobileRelay,
  signWithMobileRelay,
} from './mobile-relay.js';
import { normalizePublicKey, validateHexPayload } from './transaction.js';
import type { MosaicLynxCosignature, SignedData, SignedTransaction } from './types.js';
import type {
  MosaicLynxActiveAccount,
  MosaicLynxCosignTransactionParams,
  MosaicLynxDiagnosticEvent,
  MosaicLynxSDK,
  MosaicLynxSDKErrorCode,
  MosaicLynxSDKOptions,
  MosaicLynxScope,
  MosaicLynxSignDataParams,
  MosaicLynxSignTransactionParams,
} from './types.js';

const SDK_VERSION = '1.0.0' as const;

/** transport選択と公開アカウントcacheを管理するSDK実装。 */
class DefaultMosaicLynxSDK implements MosaicLynxSDK {
  public readonly version = SDK_VERSION;
  private readonly accountCache = new AccountCache();

  public constructor(private readonly options: MosaicLynxSDKOptions) {}

  private get mobileRelayEnabled(): boolean {
    return this.options.mobileRelay?.enabled === true;
  }

  public async isAvailable(): Promise<boolean> {
    const state = providerState();
    if (state !== 'none') return state === 'supported';
    return this.mobileRelayEnabled && hasMobilePlatform();
  }

  public async connect(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount> {
    this.validateScope(scope);
    const state = providerState();
    let account: MosaicLynxActiveAccount;
    if (state === 'supported') account = await connectWithExtension(window.mosaicLynx!, scope);
    else {
      if (state === 'unsupported' || !this.mobileRelayEnabled || !hasMobilePlatform()) throw fail('UNAVAILABLE');
      account = await connectWithMobileRelay(scope);
    }
    this.accountCache.replace(account);
    return account;
  }

  public async isConnected(scope: MosaicLynxScope): Promise<boolean> {
    this.validateScope(scope);
    const state = providerState();
    if (state === 'supported') {
      const account = await activeAccountWithExtension(window.mosaicLynx!, scope);
      if (account) this.accountCache.replace(account);
      else this.accountCache.remove(scope);
      return Boolean(account);
    }
    if (state === 'unsupported' || !this.mobileRelayEnabled || !hasMobilePlatform()) return false;
    return Boolean(this.accountCache.read(scope));
  }

  public getActiveAccount(scope: MosaicLynxScope): MosaicLynxActiveAccount | undefined {
    this.validateScope(scope);
    return this.accountCache.read(scope);
  }

  public async refreshActiveAccount(scope: MosaicLynxScope): Promise<MosaicLynxActiveAccount | undefined> {
    this.validateScope(scope);
    const state = providerState();
    let account: MosaicLynxActiveAccount | undefined;
    if (state === 'supported') account = await activeAccountWithExtension(window.mosaicLynx!, scope);
    else {
      if (state === 'unsupported' || !this.mobileRelayEnabled || !hasMobilePlatform()) throw fail('UNAVAILABLE');
      account = await refreshActiveAccountWithMobileRelay(scope);
    }
    if (account) this.accountCache.replace(account);
    else this.accountCache.remove(scope);
    return account;
  }

  public async disconnect(): Promise<void> {
    const state = providerState();
    if (state === 'supported') await disconnectWithExtension(window.mosaicLynx!);
    else {
      if (state === 'unsupported' || !this.mobileRelayEnabled || !hasMobilePlatform()) throw fail('UNAVAILABLE');
      await disconnectWithMobileRelay();
    }
    this.accountCache.clear();
  }

  public signTransaction(params: MosaicLynxSignTransactionParams): Promise<SignedTransaction> {
    try {
      this.validateScope(params);
      validateHexPayload(params.payload);
      if (params.expectedSignerPublicKey) normalizePublicKey(params.expectedSignerPublicKey);
    } catch {
      this.emit('failed', 'extension', 'INVALID_PARAMS');
      return Promise.reject(fail('INVALID_PARAMS'));
    }
    return this.runSigning(params, (transport) =>
      transport === 'extension' ? signWithExtension(window.mosaicLynx!, params) : signWithMobileRelay(params)
    );
  }

  public signData(params: MosaicLynxSignDataParams): Promise<SignedData> {
    let request;
    try {
      this.validateScope(params);
      request = createDataSigningRequest(params);
    } catch (error) {
      const failure = error instanceof MosaicLynxSDKError ? error : fail('INVALID_PARAMS');
      this.emit('failed', 'extension', failure.code);
      return Promise.reject(failure);
    }
    return this.runSigning(params, (transport) =>
      transport === 'extension'
        ? signDataWithExtension(window.mosaicLynx!, params, request, window.location.origin)
        : signDataWithMobileRelay(params, request)
    );
  }

  public cosignTransaction(params: MosaicLynxCosignTransactionParams): Promise<MosaicLynxCosignature> {
    try {
      this.validateScope(params);
      validateHexPayload(params.parentPayload);
      if (params.chain === 'nem') validateHexPayload(params.payload);
      if (params.expectedSignerPublicKey) normalizePublicKey(params.expectedSignerPublicKey);
    } catch {
      this.emit('failed', 'extension', 'INVALID_PARAMS');
      return Promise.reject(fail('INVALID_PARAMS'));
    }
    return this.runSigning(params, (transport) =>
      transport === 'extension' ? cosignWithExtension(window.mosaicLynx!, params) : cosignWithMobileRelay(params)
    );
  }

  private async runSigning<TResult>(
    scope: MosaicLynxScope,
    action: (transport: MosaicLynxDiagnosticEvent['transport']) => Promise<TResult>
  ): Promise<TResult> {
    let transport: MosaicLynxDiagnosticEvent['transport'] = 'extension';
    try {
      const state = providerState();
      if (state === 'unsupported') throw fail('UNAVAILABLE');
      if (state === 'supported') {
        const account = await activeAccountWithExtension(window.mosaicLynx!, scope);
        if (!account) throw fail('NOT_CONNECTED');
        this.accountCache.replace(account);
      } else {
        if (!this.mobileRelayEnabled || !hasMobilePlatform()) throw fail('UNAVAILABLE');
        transport = 'mobile-relay';
        if (!this.accountCache.read(scope)) throw fail('NOT_CONNECTED');
      }
      this.emit('transport_selected', transport);
      this.emit('approval_requested', transport);
      const result = await action(transport);
      this.emit('response_received', transport);
      this.emit('completed', transport);
      return result;
    } catch (error) {
      const normalized =
        error instanceof MosaicLynxSDKError
          ? error
          : error instanceof TypeError
            ? fail('INVALID_PARAMS')
            : fail('INTERNAL_ERROR');
      this.emit('failed', transport, normalized.code);
      throw normalized;
    }
  }

  private validateScope(scope: MosaicLynxScope): void {
    if (!isScope(scope)) throw fail('INVALID_PARAMS');
  }

  private emit(
    phase: MosaicLynxDiagnosticEvent['phase'],
    transport: MosaicLynxDiagnosticEvent['transport'],
    errorCode?: MosaicLynxSDKErrorCode
  ): void {
    if (!this.options.diagnostics?.enabled) return;
    try {
      this.options.diagnostics.onEvent?.({
        phase,
        transport,
        timestamp: new Date().toISOString(),
        ...(errorCode ? { errorCode } : {}),
      });
    } catch {
      // 診断callbackの失敗を署名処理へ伝播させない。
    }
  }
}

/** MosaicLynx SDK v1インスタンスを作成します。 */
export const createMosaicLynxSDK = (options: MosaicLynxSDKOptions = {}): MosaicLynxSDK =>
  new DefaultMosaicLynxSDK(options);
