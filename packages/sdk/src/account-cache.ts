import type { MosaicLynxActiveAccount, MosaicLynxScope } from './types.js';

const STORAGE_KEY = 'mosaiclynx.sdk.connections.v1';

export const isScope = (value: unknown): value is MosaicLynxScope => {
  const scope = value as Partial<MosaicLynxScope> | undefined;
  return (
    (scope?.chain === 'symbol' || scope?.chain === 'nem') &&
    (scope.network === 'mainnet' || scope.network === 'testnet')
  );
};

/** 永続キャッシュから読み込める公開アカウントschemaかを検証します。 */
export const isActiveAccount = (value: unknown): value is MosaicLynxActiveAccount => {
  const account = value as Partial<MosaicLynxActiveAccount> | undefined;
  return (
    Boolean(account) &&
    isScope(value) &&
    typeof account!.address === 'string' &&
    account!.address.length > 0 &&
    typeof account!.publicKey === 'string' &&
    /^[0-9A-Fa-f]{64}$/.test(account!.publicKey)
  );
};

const sameScope = (left: MosaicLynxScope, right: MosaicLynxScope): boolean =>
  left.chain === right.chain && left.network === right.network;

/** Origin内の公開アカウントだけを保存するcache。認可判断の正にはしません。 */
export class AccountCache {
  private memory: readonly MosaicLynxActiveAccount[] = [];

  public read(scope: MosaicLynxScope): MosaicLynxActiveAccount | undefined {
    this.load();
    return this.memory.find((account) => sameScope(account, scope));
  }

  public replace(account: MosaicLynxActiveAccount): void {
    this.load();
    this.write([...this.memory.filter((item) => !sameScope(item, account)), account]);
  }

  public remove(scope: MosaicLynxScope): void {
    this.load();
    this.write(this.memory.filter((account) => !sameScope(account, scope)));
  }

  public clear(): void {
    this.memory = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storageが利用できない場合もメモリ上の情報は必ず消去する。
    }
  }

  private load(): void {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed) || !parsed.every(isActiveAccount)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      this.memory = parsed.map((account) => ({ ...account, publicKey: account.publicKey.toUpperCase() }));
    } catch {
      // storage不能時は同一SDKインスタンスのメモリを維持する。
    }
  }

  private write(accounts: readonly MosaicLynxActiveAccount[]): void {
    this.memory = accounts;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // 永続化不能でも現在のページでは公開情報を利用できる。
    }
  }
}
