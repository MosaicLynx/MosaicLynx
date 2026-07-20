import { NemChainAdapter } from '@mosaiclynx/chain-nem';
import { SymbolChainAdapter, deriveSharedAccount } from '@mosaiclynx/chain-symbol';
import type { Account, PermissionGrant } from '@mosaiclynx/core';
import { exportProfileBackup, importProfileBackup, serializeProfileBackup } from '@mosaiclynx/profile-backup';
import type { RelaySigningRequest, SignedTransaction } from '@mosaiclynx/relay-protocol';
import { PrivateKey } from '@nemnesia/symbol-sdk';
import { randomUUID } from 'expo-crypto';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

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

const symbol = new SymbolChainAdapter();
const nem = new NemChainAdapter();

const privateKeyIdentities = (privateKey: string) => {
  new PrivateKey(privateKey);
  const symbolAccount = symbol.importAccount('testnet', privateKey);
  const nemAccount = nem.importAccount('testnet', privateKey);
  return {
    symbol: { address: symbolAccount.address, publicKey: symbolAccount.publicKey },
    nem: { address: nemAccount.address, publicKey: nemAccount.publicKey },
  };
};

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
  createProfile(input: { name: string; password: string; passwordHint?: string; mnemonic: string }): Promise<string>;
  touch(): void;
  selectProfile(profileId: string): Promise<void>;
  selectChain(chain: 'symbol' | 'nem'): Promise<void>;
  selectAccount(profileId: string, accountId: string): Promise<void>;
  addDerivedAccount(profileId: string, name: string): Promise<void>;
  importPrivateKey(profileId: string, name: string, privateKey: string): Promise<void>;
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
    async (input: { name: string; password: string; passwordHint?: string; mnemonic: string }) => {
      if (!state || !input.name.trim()) throw new Error('INVALID_PROFILE');
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
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const profile: MobileProfile = {
        id: profileId,
        network: 'testnet',
        name: input.name.trim(),
        accountIds: [accountId],
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
        importedPrivateKeys: {},
      });
      await commit({
        ...state,
        profiles: [...state.profiles, profile],
        accounts: [...state.accounts, account],
        vaults: [...state.vaults, vault],
        settings: { ...state.settings, activeProfileId: profileId },
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
      if (!state || !state.profiles.some((profile) => profile.id === profileId)) throw new Error('PROFILE_NOT_FOUND');
      await commit({ ...state, settings: { ...state.settings, activeProfileId: profileId } });
    },
    [commit, state]
  );

  const selectChain = useCallback(
    async (chain: 'symbol' | 'nem') => {
      if (!state) return;
      await commit({ ...state, settings: { ...state.settings, activeChain: chain } });
    },
    [commit, state]
  );

  const selectAccount = useCallback(
    async (profileId: string, accountId: string) => {
      if (!state || !state.accounts.some((account) => account.id === accountId && account.profileId === profileId))
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
      let material: ReturnType<typeof deriveSharedAccount>;
      try {
        if (!contents.mnemonic) throw new Error('SECRET_NOT_FOUND');
        material = deriveSharedAccount('testnet', contents.mnemonic, profile.nextAccountIndex);
      } finally {
        destroyVaultContents(contents);
      }
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
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      await commit({
        ...state,
        accounts: [...state.accounts, account],
        profiles: state.profiles.map((item) =>
          item.id === profileId
            ? {
                ...item,
                accountIds: [...item.accountIds, id],
                defaultAccountId: id,
                nextAccountIndex: item.nextAccountIndex + 1,
                revision: item.revision + 1,
                updatedAt: now,
              }
            : item
        ),
      });
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
        identities: privateKeyIdentities(normalized),
        source: { kind: 'importedPrivateKey', secretRef: `vault:${profileId}:private:${id}` },
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

  const deleteAccount = useCallback(
    async (profileId: string, accountId: string) => {
      if (!state) return;
      const profile = state.profiles.find((item) => item.id === profileId);
      if (!profile || profile.accountIds.length <= 1) throw new Error('LAST_ACCOUNT');
      const account = state.accounts.find((item) => item.id === accountId && item.profileId === profileId);
      if (!account) throw new Error('ACCOUNT_NOT_FOUND');
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
      const remaining = profile.accountIds.filter((id) => id !== accountId);
      const now = new Date().toISOString();
      await commit({
        ...state,
        vaults,
        accounts: state.accounts.filter((item) => item.id !== accountId),
        permissions: state.permissions
          .map((grant) => ({ ...grant, accountIds: grant.accountIds.filter((id) => id !== accountId) }))
          .filter((grant) => grant.accountIds.length),
        profiles: state.profiles.map((item) =>
          item.id === profileId
            ? {
                ...item,
                accountIds: remaining,
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
      if (!session || !envelope || !account) throw new Error('VAULT_LOCKED');
      const contents = await readUnlockedVault(envelope, session);
      let privateKey = '';
      try {
        if (account.source.kind === 'importedPrivateKey') {
          privateKey = contents.importedPrivateKeys[account.id] ?? '';
        } else if (contents.mnemonic) {
          privateKey = deriveSharedAccount('testnet', contents.mnemonic, account.source.accountIndex).privateKey;
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
      const accountIds = new Map(restored.accounts.map((account) => [account.id, randomUUID()]));
      for (const account of restored.accounts) {
        const expected =
          account.source.kind === 'mnemonicDerived'
            ? deriveSharedAccount('testnet', restored.vault.mnemonic ?? '', account.source.accountIndex).identities
            : privateKeyIdentities(restored.vault.importedPrivateKeys[account.id] ?? '');
        if (!sameIdentity(account.identities, expected)) throw new Error('BACKUP_IDENTITY_MISMATCH');
      }
      const now = new Date().toISOString();
      const accounts: Account[] = restored.accounts.map((account) => {
        const id = accountIds.get(account.id)!;
        const source =
          account.source.kind === 'mnemonicDerived'
            ? { ...account.source, secretRef: `vault:${newProfileId}:mnemonic:${account.source.accountIndex}` }
            : { ...account.source, secretRef: `vault:${newProfileId}:private:${id}` };
        return { ...account, id, profileId: newProfileId, source, revision: 1, createdAt: now, updatedAt: now };
      });
      const profile: MobileProfile = {
        ...restored.profile,
        id: newProfileId,
        accountIds: restored.profile.accountIds.map((id) => accountIds.get(id)!),
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
      const vault = await createVault(newProfileId, password, { ...restored.vault, importedPrivateKeys });
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
        settings: { ...state.settings, activeProfileId: newProfileId },
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
