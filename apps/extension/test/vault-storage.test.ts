import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEGACY_STORAGE_KEY, loadStore, STORAGE_KEYS } from "../src/vault.js";

describe("extension store migration", () => {
  let values: Record<string, unknown>;

  beforeEach(() => {
    values = {};
    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ ...values })),
          set: vi.fn(async (next: Record<string, unknown>) => { Object.assign(values, next); }),
          remove: vi.fn(async (key: string) => { delete values[key]; }),
        },
      },
    } as unknown as typeof chrome;
  });

  it("separates accounts from legacy profiles before removing the V1 key", async () => {
    const account = {
      id: "account-1",
      profileId: "profile-1",
      name: "Account 1",
      identities: {},
      source: {},
      revision: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    values[LEGACY_STORAGE_KEY] = {
      schemaVersion: 1,
      profiles: [{
        id: "profile-1",
        name: "Test",
        network: "testnet",
        accounts: [account],
        defaultAccountId: account.id,
        nextAccountIndex: 1,
        revision: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }],
      vaults: [],
      permissions: [],
      usedMessageNonces: [],
      settings: { activeProfileId: "profile-1", activeChain: "symbol", language: "ja", theme: "light", autoLockMinutes: 15 },
    };

    const migrated = await loadStore();

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.accounts).toEqual([account]);
    expect(migrated.profiles[0]).not.toHaveProperty("accounts");
    expect(values[STORAGE_KEYS.profiles]).toEqual(migrated.profiles);
    expect(values[STORAGE_KEYS.accounts]).toEqual([account]);
    expect(values).not.toHaveProperty(LEGACY_STORAGE_KEY);
  });

  it("keeps the V1 key when the V2 commit fails", async () => {
    values[LEGACY_STORAGE_KEY] = {
      schemaVersion: 1,
      profiles: [],
      vaults: [],
      permissions: [],
      usedMessageNonces: [],
      settings: { activeChain: "symbol", language: "ja", theme: "light", autoLockMinutes: 15 },
    };
    vi.mocked(chrome.storage.local.set).mockRejectedValueOnce(new Error("storage full"));

    await expect(loadStore()).rejects.toThrow("storage full");

    expect(values).toHaveProperty(LEGACY_STORAGE_KEY);
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
  });
});
