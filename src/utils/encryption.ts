import randomBytes from "randombytes";

const getKey = async (key: Uint8Array): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export const encryptData = async (
  data: Uint8Array,
  key: Uint8Array,
): Promise<string> => {
  const iv = new Uint8Array(randomBytes(16).buffer);
  const cryptoKey = await getKey(key);
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    data
  );
  
  return Buffer.concat([iv, new Uint8Array(encryptedContent)]).toString("base64");
}

export const decryptData = async(
  encryptedData: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> => {
  const iv = encryptedData.slice(0, 16);
  const cryptoKey = await getKey(key);
  const encryptedContent = encryptedData.slice(16);

  const decryptedContent = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    encryptedContent
  );
  return new Uint8Array(decryptedContent);
}

export const generateEncryptionKey = async (
  passphrase: string,
  publicKey: Uint8Array
): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const salt = await crypto.subtle.digest("SHA-256", publicKey);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  return new Uint8Array(derivedBits);
}

export const generateEncryptionKeyFromPassphrase = async (
  passphrase: string,
  pubKey: string
): Promise<Uint8Array | undefined> => {
  if (!pubKey) {
    console.error("No public key found. Unable to decrypt.");
    return;
  }

  if (!passphrase || passphrase.length < 6) {
    console.error("Invalid phrase. Too short.");
    return;
  }

  const pubKeyBytes = new Uint8Array(Buffer.from(pubKey, "base64").buffer);
  return await generateEncryptionKey(passphrase, pubKeyBytes);
}