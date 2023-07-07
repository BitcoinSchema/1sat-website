import { AES, AESAlgorithms, Hash, KDF, PBKDF2Hashes } from "bsv-wasm-web";

export const encryptData = (
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Uint8Array => {
  const ivUint8Array = new Uint8Array(iv);
  const dataUint8Array = new Uint8Array(data);
  const keyUint8Array = new Uint8Array(key);

  return AES.encrypt(
    keyUint8Array,
    ivUint8Array,
    dataUint8Array,
    AESAlgorithms.AES256_CBC
  );
};

export const decryptData = (
  encryptedData: Uint8Array,
  key: Uint8Array
): Uint8Array => {
  const iv = encryptedData.slice(0, 16);
  const encryptedContent = encryptedData.slice(16);
  return AES.decrypt(key, iv, encryptedContent, AESAlgorithms.AES256_CBC);
};

export const generateEncryptionKey = (
  passphrase: string,
  publicKey: Uint8Array
) => {
  // Derive a unique salt from the user's public key using a hash function
  const salt = Hash.sha_256(publicKey);
  const keySize = 256 / 8; // 256-bit key
  const iterations = 1000;

  const key = KDF.pbkdf2(
    new TextEncoder().encode(passphrase),
    salt.to_bytes(),
    PBKDF2Hashes.SHA256,
    iterations,
    keySize
  );

  return key.get_hash().to_bytes();
};
