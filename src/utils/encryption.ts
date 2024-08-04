async function getKey(key: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await getKey(key);
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted content
  const result = new Uint8Array(iv.length + encryptedContent.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedContent), iv.length);
  
  return result;
}

export async function decryptData(
  encryptedData: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  const iv = encryptedData.slice(0, 16);
  const encryptedContent = encryptedData.slice(16);
  
  const cryptoKey = await getKey(key);
  const decryptedContent = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    encryptedContent
  );
  
  return new Uint8Array(decryptedContent);
}

export async function generateEncryptionKey(
  passphrase: string,
  publicKey: Uint8Array
): Promise<Uint8Array> {
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

export async function generateEncryptionKeyFromPassphrase(
  passphrase: string,
  pubKey: string
): Promise<Uint8Array | undefined> {
  if (!pubKey) {
    console.error("No public key found. Unable to decrypt.");
    return;
  }

  if (!passphrase || passphrase.length < 6) {
    console.error("Invalid phrase. Too short.");
    return;
  }

  const pubKeyBytes = new Uint8Array(Buffer.from(pubKey, "base64").buffer);

  const ec = await generateEncryptionKey(passphrase, pubKeyBytes);

  return ec;
}