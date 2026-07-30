import { deriveSharedAccount } from '@mosaiclynx/chain-symbol';
import type { Account, PermissionGrant } from '@mosaiclynx/core';
import { exportProfileBackup, importProfileBackup, serializeProfileBackup } from '@mosaiclynx/profile-backup';
import type { RelaySigningRequest, SignedTransaction } from '@mosaiclynx/relay-protocol';
import { randomUUID } from 'expo-crypto';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { identitiesForPrivateKey } from './account-identities';
import { mobileCryptoDriver } from './crypto';
import type { MobilePersistedState, MobileProfile, MobileVaultEnvelope, VaultContents } from './model';
import type { MobileVaultPort } from './ports';
import { MobileRepository } from './repository';
import { signTestnetRequest } from './signing';
import {
  type UnlockedVault,
  createVault,
  destroyUnlockedVault,
  destroyVaultContents,
  readUnlockedVault,
  unlockVault,
  updateUnlockedVault,
} from './vault';

const sameIdentity = (left: Account['identities'], right: Account['identities']): boolean =>
  (['symbol', 'nem'] as const).every(
    (chain) =>
      left[chain].address === right[chain].address &&
      left[chain].publicKey.toUpperCase() === right[chain].publicKey.toUpperCase()
  );

interface StoreApi extends MobileVaultPort {
  readonly ready: boolean;
  readonly state: MobilePersistedState | undefined;
  readonly unlockedProfileIds: ReadonlySet<string>;
  createProfile(input: {
    name: string;
    password: string;
    passwordHint?: string;
    mnemonic: string;
    enabledChains?: readonly ('symbol' | 'nem')[];
  }): Promise<string>;
  touch(): void;
  selectProfile(profileId: string): Promise<void>;
  selectChain(chain: 'symbol' | 'nem'): Promise<void>;
  selectAccount(profileId: string, accountId: string): Promise<void>;
  addDerivedAccount(profileId: string, name: string): Promise<void>;
  importPrivateKey(profileId: string, name: string, privateKey: string): Promise<void>;
  restoreHdAccount(profileId: string, accountId: string): Promise<void>;
  renameAccount(accountId: string, name: string): Promise<void>;
  deleteAccount(profileId: string, accountId: string): Promise<void>;
  exportBackup(profileId: string, password: string): Promise<string>;
  importBackup(serialized: string, password: string): Promise<string>;
  setLanguage(language: 'ja' | 'en'): Promise<void>;
  setTheme(theme: 'system' | 'light' | 'dark'): Promise<void>;
}

const StoreContext = createContext<StoreApi | undefined>(undefined);

export const MobileStoreProvider = ({ children }: { readonly children: ReactNode }) => {
  const repository = useRef(new MobileRepository()).current;
  const sessions = useRef(new Map<string, UnlockedVault>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState<MobilePersistedState>();
  const [sessionRevision, setSessionRevision] = useState(0);

  useEffect(() => {
    void repository.load(Intl.DateTimeFormat().resolvedOptions().locale.startsWith('ja') ? 'ja' : 'en').then(setState);
  }, [repository]);

  const lockAll = useCallback(() => {
    for (const session of sessions.current.values()) destroyUnlockedVault(session);
    sessions.current.clear();
    if (timer.current) clearTimeout(timer.current);
    setSessionRevision((value) => value + 1);
  }, []);

  const touch = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (sessions.current.size) timer.current = setTimeout(lockAll, 15 * 60_000);
  }, [lockAll]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') lockAll();
    });
    return () => subscription.remove();
  }, [lockAll]);

  const commit = useCallback(
    async (next: MobilePersistedState) => {
      await repository.save(next);
      setState(next);
      touch();
    },
    [repository, touch]
  );

  const createProfile = useCallback(
    async (input: {
      name: string;
      password: string;
      passwordHint?: string;
      mnemonic: string;
      enabledChains?: readonly ('symbol' | 'nem')[];
    }) => {
      if (!state || !input.name.trim()) throw new Error('INVALID_PROFILE');
      const enabledChains: ('symbol' | 'nem')[] = [...new Set(input.enabledChains ?? (['symbol', 'nem'] as const))];
      if (!enabledChains.length) throw new Error('INVALID_PROFILE');
      const profileId = randomUUID();
      const accountId = randomUUID();
      const now = new Date().toISOString();
      const material = deriveSharedAccount('testnet', input.mnemonic.trim().replace(/\s+/g, ' '), 0);
      const account: Account = {
        id: accountId,
        profileId,
        name: 'Account 1',
        identities: material.identities,
        source: {
          kind: 'mnemonicDerived',
          secretRef: `vault:${profileId}:mnemonic:0`,
          accountIndex: 0,
          derivationPath: material.derivationPath,
        },
        status: 'active',
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const profile: MobileProfile = {
        id: profileId,
        network: 'testnet',
        enabledChains,
        name: input.name.trim(),
        accountIds: [accountId],
        hdAccountIds: [accountId],
        defaultAccountId: accountId,
        nextAccountIndex: 1,
        vaultRef: `vault:${profileId}`,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        ...(input.passwordHint?.trim() ? { passwordHint: input.passwordHint.trim() } : {}),
      };
      const vault = await createVault(profileId, input.password, {
        mnemonic: input.mnemonic.trim().replace(/\s+/g, ' '),
        hdPrivateKeys: { [accountId]: material.privateKey },
        importedPrivateKeys: {},
      });
      await commit({
        ...state,
        profiles: [...state.profiles, profile],
        accounts: [...state.accounts, account],
        vaults: [...state.vaults, vault],
        settings: { ...state.settings, activeProfileId: profileId, activeChain: enabledChains[0]! },
      });
      return profileId;
    },
    [commit, state]
  );

  const unlock = useCallback(
    async (profileId: string, password: string) => {
      if (!state) throw new Error('NOT_READY');
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      if (!envelope) throw new Error('PROFILE_NOT_FOUND');
      const previous = sessions.current.get(profileId);
      if (previous) destroyUnlockedVault(previous);
      sessions.current.set(profileId, await unlockVault(envelope, password));
      setSessionRevision((value) => value + 1);
      touch();
    },
    [state, touch]
  );

  const lock = useCallback((profileId: string) => {
    const session = sessions.current.get(profileId);
    if (session) destroyUnlockedVault(session);
    sessions.current.delete(profileId);
    setSessionRevision((value) => value + 1);
  }, []);

  const selectProfile = useCallback(
    async (profileId: string) => {
      if (!state) throw new Error('PROFILE_NOT_FOUND');
      const profile = state.profiles.find((item) => item.id === profileId);
      if (!profile) throw new Error('PROFILE_NOT_FOUND');
      await commit({
        ...state,
        settings: {
          ...state.settings,
          activeProfileId: profileId,
          activeChain: profile.enabledChains.includes(state.settings.activeChain)
            ? state.settings.activeChain
            : profile.enabledChains[0]!,
        },
      });
    },
    [commit, state]
  );

  const selectChain = useCallback(
    async (chain: 'symbol' | 'nem') => {
      if (!state) return;
      const profile = state.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state.profiles[0];
      if (!profile || !profile.enabledChains.includes(chain)) throw new Error('CHAIN_DISABLED');
      await commit({ ...state, settings: { ...state.settings, activeChain: chain } });
    },
    [commit, state]
  );

  const selectAccount = useCallback(
    async (profileId: string, accountId: string) => {
      if (
        !state ||
        !state.accounts.some(
          (account) => account.id === accountId && account.profileId === profileId && account.status === 'active'
        )
      )
        throw new Error('ACCOUNT_NOT_FOUND');
      const now = new Date().toISOString();
      await commit({
        ...state,
        profiles: state.profiles.map((profile) =>
          profile.id === profileId
            ? { ...profile, defaultAccountId: accountId, revision: profile.revision + 1, updatedAt: now }
            : profile
        ),
      });
    },
    [commit, state]
  );

  const addDerivedAccount = useCallback(
    async (profileId: string, name: string) => {
      if (!state || !name.trim()) throw new Error('INVALID_ACCOUNT');
      const profile = state.profiles.find((item) => item.id === profileId);
      const session = sessions.current.get(profileId);
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      if (!profile || !session || !envelope) throw new Error('VAULT_LOCKED');
      const contents = await readUnlockedVault(envelope, session);
      try {
        if (!contents.mnemonic) throw new Error('SECRET_NOT_FOUND');
        const material = deriveSharedAccount('testnet', contents.mnemonic, profile.nextAccountIndex);
        const id = randomUUID();
        const now = new Date().toISOString();
        const account: Account = {
          id,
          profileId,
          name: name.trim(),
          identities: material.identities,
          source: {
            kind: 'mnemonicDerived',
            secretRef: `vault:${profileId}:mnemonic:${profile.nextAccountIndex}`,
            accountIndex: profile.nextAccountIndex,
            derivationPath: material.derivationPath,
          },
          status: 'active',
          revision: 1,
          createdAt: now,
          updatedAt: now,
        };
        const vault = await updateUnlockedVault(envelope, session, {
          ...contents,
          hdPrivateKeys: { ...contents.hdPrivateKeys, [id]: material.privateKey },
        });
        await commit({
          ...state,
          accounts: [...state.accounts, account],
          vaults: state.vaults.map((item) => (item.profileId === profileId ? vault : item)),
          profiles: state.profiles.map((item) =>
            item.id === profileId
              ? {
                  ...item,
                  accountIds: [...item.accountIds, id],
                  hdAccountIds: [...item.hdAccountIds, id],
                  defaultAccountId: id,
                  nextAccountIndex: item.nextAccountIndex + 1,
                  revision: item.revision + 1,
                  updatedAt: now,
                }
              : item
          ),
        });
      } finally {
        destroyVaultContents(contents);
      }
    },
    [commit, state]
  );

  const importPrivateKey = useCallback(
    async (profileId: string, name: string, privateKey: string) => {
      if (!state || !name.trim()) throw new Error('INVALID_ACCOUNT');
      const profile = state.profiles.find((item) => item.id === profileId);
      const session = sessions.current.get(profileId);
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      if (!profile || !session || !envelope) throw new Error('VAULT_LOCKED');
      const normalized = privateKey.trim().toUpperCase();
      let identities: Account['identities'];
      try {
        identities = identitiesForPrivateKey(normalized);
      } catch {
        throw new Error('INVALID_PRIVATE_KEY');
      }
      const id = randomUUID();
      const now = new Date().toISOString();
      const currentContents = await readUnlockedVault(envelope, session);
      const contents: VaultContents = {
        ...currentContents,
        importedPrivateKeys: { ...currentContents.importedPrivateKeys, [id]: normalized },
      };
      let vault: MobileVaultEnvelope;
      try {
        vault = await updateUnlockedVault(envelope, session, contents);
      } finally {
        destroyVaultContents(currentContents);
        destroyVaultContents(contents);
      }
      const account: Account = {
        id,
        profileId,
        name: name.trim(),
        identities,
        source: { kind: 'importedPrivateKey', secretRef: `vault:${profileId}:private:${id}` },
        status: 'active',
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      await commit({
        ...state,
        accounts: [...state.accounts, account],
        vaults: state.vaults.map((item) => (item.profileId === profileId ? vault : item)),
        profiles: state.profiles.map((item) =>
          item.id === profileId
            ? {
                ...item,
                accountIds: [...item.accountIds, id],
                defaultAccountId: id,
                revision: item.revision + 1,
                updatedAt: now,
              }
            : item
        ),
      });
    },
    [commit, state]
  );

  const renameAccount = useCallback(
    async (accountId: string, name: string) => {
      if (!state || !name.trim()) throw new Error('INVALID_ACCOUNT');
      const now = new Date().toISOString();
      await commit({
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === accountId
            ? { ...account, name: name.trim(), revision: account.revision + 1, updatedAt: now }
            : account
        ),
      });
    },
    [commit, state]
  );

  const restoreHdAccount = useCallback(
    async (profileId: string, accountId: string) => {
      if (!state) throw new Error('NOT_READY');
      const profile = state.profiles.find((item) => item.id === profileId);
      const account = state.accounts.find((item) => item.id === accountId && item.profileId === profileId);
      const session = sessions.current.get(profileId);
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      if (!profile || !account || account.source.kind !== 'mnemonicDerived' || account.status !== 'excluded')
        throw new Error('ACCOUNT_NOT_FOUND');
      if (!session || !envelope) throw new Error('VAULT_LOCKED');
      const contents = await readUnlockedVault(envelope, session);
      try {
        if (!contents.mnemonic) throw new Error('SECRET_NOT_FOUND');
        const material = deriveSharedAccount('testnet', contents.mnemonic, account.source.accountIndex);
        if (!sameIdentity(account.identities, material.identities)) throw new Error('ACCOUNT_IDENTITY_MISMATCH');
        const vault = await updateUnlockedVault(envelope, session, {
          ...contents,
          hdPrivateKeys: { ...contents.hdPrivateKeys, [accountId]: material.privateKey },
        });
        const now = new Date().toISOString();
        await commit({
          ...state,
          vaults: state.vaults.map((item) => (item.profileId === profileId ? vault : item)),
          accounts: state.accounts.map((item) => {
            if (item.id !== accountId) return item;
            const { excludedAt: _excludedAt, ...restored } = item;
            return { ...restored, status: 'active' as const, revision: item.revision + 1, updatedAt: now };
          }),
          profiles: state.profiles.map((item) =>
            item.id === profileId
              ? {
                  ...item,
                  accountIds: [...item.accountIds, accountId],
                  hdAccountIds: [...item.hdAccountIds, accountId],
                  revision: item.revision + 1,
                  updatedAt: now,
                }
              : item
          ),
        });
      } finally {
        destroyVaultContents(contents);
      }
    },
    [commit, state]
  );

  const deleteAccount = useCallback(
    async (profileId: string, accountId: string) => {
      if (!state) return;
      const profile = state.profiles.find((item) => item.id === profileId);
      if (!profile) throw new Error('PROFILE_NOT_FOUND');
      const account = state.accounts.find((item) => item.id === accountId && item.profileId === profileId);
      if (!account) throw new Error('ACCOUNT_NOT_FOUND');
      if (account.source.kind === 'mnemonicDerived' && profile.hdAccountIds.length <= 1)
        throw new Error('LAST_ACCOUNT');
      let vaults = state.vaults;
      if (account.source.kind === 'importedPrivateKey') {
        const session = sessions.current.get(profileId);
        const envelope = state.vaults.find((item) => item.profileId === profileId);
        if (!session || !envelope) throw new Error('VAULT_LOCKED');
        const currentContents = await readUnlockedVault(envelope, session);
        const importedPrivateKeys = { ...currentContents.importedPrivateKeys };
        delete importedPrivateKeys[accountId];
        const contents = { ...currentContents, importedPrivateKeys };
        let vault: MobileVaultEnvelope;
        try {
          vault = await updateUnlockedVault(envelope, session, contents);
        } finally {
          destroyVaultContents(currentContents);
          destroyVaultContents(contents);
        }
        vaults = state.vaults.map((item) => (item.profileId === profileId ? vault : item));
      }
      if (account.source.kind === 'mnemonicDerived') {
        const session = sessions.current.get(profileId);
        const envelope = state.vaults.find((item) => item.profileId === profileId);
        if (!session || !envelope) throw new Error('VAULT_LOCKED');
        const currentContents = await readUnlockedVault(envelope, session);
        const hdPrivateKeys = { ...currentContents.hdPrivateKeys };
        delete hdPrivateKeys[accountId];
        const contents = { ...currentContents, hdPrivateKeys };
        let vault: MobileVaultEnvelope;
        try {
          vault = await updateUnlockedVault(envelope, session, contents);
        } finally {
          destroyVaultContents(currentContents);
          destroyVaultContents(contents);
        }
        vaults = state.vaults.map((item) => (item.profileId === profileId ? vault : item));
      }
      const remaining = profile.accountIds.filter((id) => id !== accountId);
      const now = new Date().toISOString();
      await commit({
        ...state,
        vaults,
        accounts: state.accounts
          .map((item) =>
            item.id === accountId && item.source.kind === 'mnemonicDerived'
              ? { ...item, status: 'excluded', excludedAt: now, revision: item.revision + 1, updatedAt: now }
              : item.id === accountId
                ? undefined
                : item
          )
          .filter((item): item is Account => Boolean(item)),
        permissions: state.permissions
          .map((grant) => ({ ...grant, accountIds: grant.accountIds.filter((id) => id !== accountId) }))
          .filter((grant) => grant.accountIds.length),
        profiles: state.profiles.map((item) =>
          item.id === profileId
            ? {
                ...item,
                accountIds: remaining,
                hdAccountIds: item.hdAccountIds.filter((id) => id !== accountId),
                defaultAccountId: item.defaultAccountId === accountId ? remaining[0]! : item.defaultAccountId,
                revision: item.revision + 1,
                updatedAt: now,
              }
            : item
        ),
      });
    },
    [commit, state]
  );

  const signRelayRequest = useCallback(
    async (profileId: string, accountId: string, request: RelaySigningRequest): Promise<SignedTransaction> => {
      if (!state) throw new Error('NOT_READY');
      const session = sessions.current.get(profileId);
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      const account = state.accounts.find((item) => item.id === accountId && item.profileId === profileId);
      const profile = state.profiles.find((item) => item.id === profileId);
      if (!session || !envelope || !account || !profile) throw new Error('VAULT_LOCKED');
      if (account.status !== 'active' || !profile.enabledChains.includes(request.chain))
        throw new Error('CHAIN_DISABLED');
      const contents = await readUnlockedVault(envelope, session);
      let privateKey = '';
      try {
        if (account.source.kind === 'importedPrivateKey') {
          privateKey = contents.importedPrivateKeys[account.id] ?? '';
        } else {
          privateKey = contents.hdPrivateKeys[account.id] ?? '';
        }
        if (!privateKey) throw new Error('SECRET_NOT_FOUND');
        return signTestnetRequest(request, privateKey);
      } finally {
        privateKey = '';
        destroyVaultContents(contents);
      }
    },
    [state]
  );

  const exportBackup = useCallback(
    async (profileId: string, password: string) => {
      if (!state) throw new Error('NOT_READY');
      const profile = state.profiles.find((item) => item.id === profileId);
      const envelope = state.vaults.find((item) => item.profileId === profileId);
      if (!profile || !envelope) throw new Error('PROFILE_NOT_FOUND');
      const unlocked = await unlockVault(envelope, password);
      const contents = await readUnlockedVault(envelope, unlocked);
      try {
        const backup = await exportProfileBackup(
          mobileCryptoDriver,
          {
            profile,
            accounts: state.accounts.filter((account) => account.profileId === profileId),
            permissions: state.permissions.filter((grant) => grant.profileId === profileId),
            vault: contents,
          },
          password
        );
        return serializeProfileBackup(backup);
      } finally {
        destroyVaultContents(contents);
        destroyUnlockedVault(unlocked);
      }
    },
    [state]
  );

  const importBackupFile = useCallback(
    async (serialized: string, password: string) => {
      if (!state) throw new Error('NOT_READY');
      const restored = await importProfileBackup(mobileCryptoDriver, serialized, password);
      const newProfileId = randomUUID();
      const restoredEnabledChains = restored.profile.enabledChains ?? (['symbol', 'nem'] as const);
      const restoredHdAccountIds =
        restored.profile.hdAccountIds ??
        restored.accounts.filter((account) => account.source.kind === 'mnemonicDerived').map((account) => account.id);
      const accountIds = new Map(restored.accounts.map((account) => [account.id, randomUUID()]));
      for (const account of restored.accounts) {
        const expected =
          account.source.kind === 'mnemonicDerived'
            ? deriveSharedAccount('testnet', restored.vault.mnemonic ?? '', account.source.accountIndex).identities
            : identitiesForPrivateKey(restored.vault.importedPrivateKeys[account.id] ?? '');
        if (!sameIdentity(account.identities, expected)) throw new Error('BACKUP_IDENTITY_MISMATCH');
      }
      const now = new Date().toISOString();
      const accounts: Account[] = restored.accounts.map((account) => {
        const id = accountIds.get(account.id)!;
        const source =
          account.source.kind === 'mnemonicDerived'
            ? { ...account.source, secretRef: `vault:${newProfileId}:mnemonic:${account.source.accountIndex}` }
            : {
                kind: 'importedPrivateKey' as const,
                secretRef: `vault:${newProfileId}:private:${id}`,
              };
        return {
          ...account,
          id,
          profileId: newProfileId,
          source,
          status: account.status ?? 'active',
          revision: 1,
          createdAt: now,
          updatedAt: now,
        };
      });
      const profile: MobileProfile = {
        ...restored.profile,
        id: newProfileId,
        enabledChains: restoredEnabledChains,
        accountIds: restored.profile.accountIds.map((id) => accountIds.get(id)!),
        hdAccountIds: restoredHdAccountIds.map((id) => accountIds.get(id)!).filter(Boolean),
        defaultAccountId: accountIds.get(restored.profile.defaultAccountId)!,
        vaultRef: `vault:${newProfileId}`,
        name: `${restored.profile.name} (restored)`,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const importedPrivateKeys = Object.fromEntries(
        Object.entries(restored.vault.importedPrivateKeys).map(([id, key]) => [accountIds.get(id)!, key])
      );
      const hdPrivateKeys = Object.fromEntries(
        Object.entries(restored.vault.hdPrivateKeys ?? {}).map(([id, key]) => [accountIds.get(id)!, key])
      );
      const vault = await createVault(newProfileId, password, {
        ...restored.vault,
        hdPrivateKeys,
        importedPrivateKeys,
      });
      const permissions: PermissionGrant[] = restored.permissions
        .map((grant) => ({
          ...grant,
          profileId: newProfileId,
          accountIds: grant.accountIds.map((id) => accountIds.get(id)!).filter(Boolean),
          revision: 1,
          createdAt: now,
          updatedAt: now,
        }))
        .filter((grant) => grant.accountIds.length);
      await commit({
        ...state,
        profiles: [...state.profiles, profile],
        accounts: [...state.accounts, ...accounts],
        vaults: [...state.vaults, vault],
        permissions: [...state.permissions, ...permissions],
        settings: { ...state.settings, activeProfileId: newProfileId, activeChain: restoredEnabledChains[0]! },
      });
      return newProfileId;
    },
    [commit, state]
  );

  const setLanguage = useCallback(
    async (language: 'ja' | 'en') => {
      if (state) await commit({ ...state, settings: { ...state.settings, language } });
    },
    [commit, state]
  );
  const setTheme = useCallback(
    async (theme: 'system' | 'light' | 'dark') => {
      if (state) await commit({ ...state, settings: { ...state.settings, theme } });
    },
    [commit, state]
  );

  const value = useMemo<StoreApi>(
    () => ({
      ready: !!state,
      state,
      unlockedProfileIds: new Set(sessions.current.keys()),
      createProfile,
      unlock,
      lock,
      lockAll,
      touch,
      selectProfile,
      selectChain,
      selectAccount,
      addDerivedAccount,
      importPrivateKey,
      restoreHdAccount,
      renameAccount,
      deleteAccount,
      signRelayRequest,
      exportBackup,
      importBackup: importBackupFile,
      setLanguage,
      setTheme,
    }),
    [
      state,
      sessionRevision,
      createProfile,
      unlock,
      lock,
      lockAll,
      touch,
      selectProfile,
      selectChain,
      selectAccount,
      addDerivedAccount,
      importPrivateKey,
      restoreHdAccount,
      renameAccount,
      deleteAccount,
      signRelayRequest,
      exportBackup,
      importBackupFile,
      setLanguage,
      setTheme,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useMobileStore = (): StoreApi => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('MobileStoreProvider is missing.');
  return value;
};
