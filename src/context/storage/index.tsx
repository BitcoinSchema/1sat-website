import { AES, AESAlgorithms } from "bsv-wasm";
import { Hash, KDF, PBKDF2Hashes } from "bsv-wasm-web";
import crypto from "crypto";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ContextValue = {
  setEncryptionKey: (key: Uint8Array) => void;
  getItem: (key: string, decrypt?: boolean) => Promise<string | null>;
  setItem: (
    key: string,
    value: string,
    isEncrypted?: boolean
  ) => Promise<string>;
  ready: boolean;
  encryptionKey: Uint8Array | null;
  generateEncryptionKey: (
    passphrase: string,
    publicKey: Uint8Array
  ) => Uint8Array;
  decryptData: (encryptedData: Uint8Array, key: Uint8Array) => Uint8Array;
  encryptData: (
    data: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array
  ) => Uint8Array;
  removeItem: (key: string) => Promise<void>;
  setEncryptionKeyFromPassphrase: (passphrase: string) => Promise<void>;
};

const StorageContext = createContext<ContextValue | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = (props) => {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [db, setDb] = useState<IDBDatabase | undefined>();
  const [ready, setReady] = useState<boolean>(false);
  const storeName = "keystore";
  const dbName = "onesat";
  const encryptionPrefix = "ENC:";

  useEffect(() => {
    const openDBRequest = indexedDB.open(dbName);
    openDBRequest.onupgradeneeded = () => {
      const d = openDBRequest.result;
      if (!d.objectStoreNames.contains(storeName)) {
        d.createObjectStore(storeName);
      }
    };

    openDBRequest.onsuccess = () => {
      setDb(openDBRequest.result);
      setReady(true);
    };

    openDBRequest.onerror = () => {
      console.error("Error opening IndexedDB:", openDBRequest.error);
    };
  }, [setDb]);

  const encryptData = (
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

  const decryptData = (
    encryptedData: Uint8Array,
    key: Uint8Array
  ): Uint8Array => {
    const iv = encryptedData.slice(0, 16);
    const encryptedContent = encryptedData.slice(16);
    return AES.decrypt(key, iv, encryptedContent, AESAlgorithms.AES256_CBC);
  };

  const getItem = useCallback(
    async (key: string, decrypt: boolean = true): Promise<string | null> => {
      if (!db) {
        throw new Error("Database not initialized");
      }
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const objectStore = transaction.objectStore(storeName);
        const getRequest = objectStore.get(key);

        getRequest.onsuccess = () => {
          const storedData = getRequest.result;
          if (
            storedData &&
            storedData.startsWith(encryptionPrefix) &&
            encryptionKey
          ) {
            if (decrypt) {
              const encryptedData = storedData.slice(encryptionPrefix.length);
              const decryptedData = decryptData(encryptedData, encryptionKey);
              const decryptedString = new TextDecoder().decode(decryptedData);
              resolve(decryptedString);
            } else {
              resolve(storedData.slice(encryptionPrefix.length));
            }
          } else if (storedData) {
            resolve(storedData);
          } else {
            resolve(null);
          }
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      });
    },
    [encryptionKey, db]
  );

  const removeItem = useCallback(
    async (key: string): Promise<void> => {
      if (!db) {
        throw new Error("Database not initialized");
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const deleteRequest = objectStore.delete(key);

        deleteRequest.onsuccess = () => {
          resolve();
        };

        deleteRequest.onerror = () => {
          reject(deleteRequest.error);
        };
      });
    },
    [db]
  );

  const setItem = useCallback(
    async (
      key: string,
      value: string,
      isEncrypted: boolean = false
    ): Promise<string> => {
      if (!db) {
        throw new Error("Database not initialized");
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const objectStore = transaction.objectStore(storeName);

        let dataToStore = value;
        if (isEncrypted && encryptionKey) {
          const iv = new Uint8Array(crypto.randomBytes(16).buffer);
          const encryptedData = encryptData(
            new TextEncoder().encode(value),
            encryptionKey,
            iv
          );
          dataToStore =
            encryptionPrefix +
            Buffer.concat([iv, encryptedData]).toString("base64");
        }

        const putRequest = objectStore.put(dataToStore, key);

        putRequest.onsuccess = () => {
          resolve(dataToStore);
        };

        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      });
    },
    [encryptionKey, db]
  );

  const generateEncryptionKey = (passphrase: string, publicKey: Uint8Array) => {
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

  const setEncryptionKeyFromPassphrase = useCallback(
    async (passphrase: string) => {
      const storedPublicKey = await getItem("publicKey", false);
      if (!storedPublicKey) {
        alert("No public key found. Unable to decrypt.");
        return;
      }

      const pubKeyBytes = new Uint8Array(
        Buffer.from(storedPublicKey, "base64").buffer
      );

      if (!passphrase || passphrase.length < 6) {
        alert("Invalid phrase. Too short.");
        return;
      }

      const ec = generateEncryptionKey(passphrase, pubKeyBytes);
      setEncryptionKey(ec);
    },
    [setEncryptionKey, generateEncryptionKey, getItem]
  );

  // TODO: we can move encryptData and decryptData into utils
  const value = useMemo(
    () => ({
      generateEncryptionKey,
      setEncryptionKey,
      encryptionKey,
      getItem,
      setItem,
      ready,
      encryptData,
      decryptData,
      removeItem,
      setEncryptionKeyFromPassphrase,
    }),
    [
      generateEncryptionKey,
      encryptionKey,
      setEncryptionKey,
      getItem,
      setItem,
      ready,
      encryptData,
      decryptData,
      removeItem,
      setEncryptionKeyFromPassphrase,
    ]
  );

  return <StorageContext.Provider value={value} {...props} />;
};

export const useStorage = (): ContextValue => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error("useStorage must be used within an StorageProvider");
  }
  return context;
};
