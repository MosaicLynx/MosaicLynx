import { describe, expect, it } from "vitest";
import {
  getActiveAddress,
  getActiveName,
  getActiveNetworkType,
  getActivePublicKey,
  installSssAdapter,
  isAllowedSSS,
  requestSSS,
  type SssWindow,
} from "../src/index.js";
import type { MosaicLynxProvider } from "@mosaic-lynx/provider-api";

const account = {
  id: "account-1",
  profileId: "profile-1",
  name: "Personal",
  address: "NAXYZ",
  publicKey: "A".repeat(64),
  scope: { chain: "symbol" as const, network: "mainnet" as const },
};

describe("SSS 1.0.4 safe subset", () => {
  it("binds staged requests, uses legacy-only RPC and rejects unsafe APIs", async () => {
    const provider: MosaicLynxProvider & {
      isSssAllowed(): Promise<boolean>;
      signLegacyMessage(): Promise<string>;
    } = {
      version: "0.1.0",
      apiVersion: "2.0.0",
      connect: async () => [],
      disconnect: async () => undefined,
      getAccounts: async () => [account],
      getActiveAccount: async () => account,
      signMessage: async () => { throw new Error("normal structured API must not be used"); },
      signTransaction: async ({ payload }) => ({ payload, hash: "hash", signerPublicKey: account.publicKey }),
      on: () => undefined,
      removeListener: () => undefined,
      isSssAllowed: async () => true,
      signLegacyMessage: async () => "legacy-signature",
    };
    const target = {} as SssWindow;
    installSssAdapter(target, provider);
    await Promise.resolve();
    await Promise.resolve();

    expect(isAllowedSSS(target)).toBe(true);
    expect(requestSSS(target)).toBe(true);
    expect(getActiveAddress(target)).toBe(account.address);
    expect(getActiveName(target)).toBe(account.name);
    expect(getActivePublicKey(target)).toBe(account.publicKey);
    expect(getActiveNetworkType(target)).toBe(104);

    target.SSS.setTransactionByPayload("ABCC");
    await expect(target.SSS.requestSign()).resolves.toMatchObject({ payload: "ABCC" });
    await expect(target.SSS.requestSign()).rejects.toMatchObject({ code: "CONTEXT_CHANGED" });

    target.SSS.setMessage("hello", "B".repeat(64));
    await expect(target.SSS.requestSignEncription()).resolves.toBe("legacy-signature");
    await expect(target.SSS.requestSignWithCosignatories([])).rejects.toMatchObject({
      code: "UNSUPPORTED_TRANSACTION",
    });
    await expect(target.SSS.getActiveAccountToken("B".repeat(64))).rejects.toMatchObject({
      code: "UNSUPPORTED_TRANSACTION",
    });
  });
});
