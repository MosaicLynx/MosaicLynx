import type { RelayCryptoDriver } from '@mosaiclynx/relay-protocol';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomValues } from 'expo-crypto';

export const mobileCryptoDriver: RelayCryptoDriver = {
  randomBytes(length) {
    return getRandomValues(new Uint8Array(length));
  },
  async encryptAesGcm(key, plaintext, nonce, aad) {
    const imported = await AESEncryptionKey.import(key);
    const sealed = await aesEncryptAsync(plaintext, imported, {
      nonce: { bytes: nonce },
      additionalData: aad,
      tagLength: 16,
    });
    return (await sealed.ciphertext({ encoding: 'bytes', includeTag: true })) as Uint8Array;
  },
  async decryptAesGcm(key, ciphertextAndTag, nonce, aad) {
    const imported = await AESEncryptionKey.import(key);
    const sealed = AESSealedData.fromParts(nonce, ciphertextAndTag, 16);
    return (await aesDecryptAsync(sealed, imported, { additionalData: aad, output: 'bytes' })) as Uint8Array;
  },
};
