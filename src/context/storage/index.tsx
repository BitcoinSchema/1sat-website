import {
  decryptData,
  encryptData,
  generateEncryptionKey,
} from "@/utils/encryption";
import { base64UrlToUint8Array } from "@/utils/uint8array";
import randomBytes from "randombytes";
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
  removeItem: (key: string) => Promise<void>;
  setEncryptionKeyFromPassphrase: (
    passphrase: string,
    pubKey?: string
  ) => Promise<void>;
};

const StorageContext = createContext<ContextValue | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const encryptionPrefix = "ENC:";
export const StorageProvider: React.FC<StorageProviderProps> = (props) => {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [db, setDb] = useState<IDBDatabase | undefined>();
  const [ready, setReady] = useState<boolean>(false);
  const storeName = "keystore";
  const dbName = "onesat";

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
  }, [setDb, setReady]);

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
              const str = base64UrlToUint8Array(encryptedData);
              const decryptedData = decryptData(str, encryptionKey);
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
          const iv = new Uint8Array(randomBytes(16).buffer);
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

  const setEncryptionKeyFromPassphrase = useCallback(
    async (passphrase: string, pubKey?: string) => {
      const storedPublicKey = pubKey || (await getItem("publicKey", false));
      if (!storedPublicKey) {
        debugger;
        console.error("No public key found. Unable to decrypt.");
        return;
      }

      if (!passphrase || passphrase.length < 6) {
        console.error("Invalid phrase. Too short.");
        return;
      }

      const pubKeyBytes = new Uint8Array(
        Buffer.from(storedPublicKey, "base64").buffer
      );

      const ec = generateEncryptionKey(passphrase, pubKeyBytes);
      setEncryptionKey(ec);
    },
    [setEncryptionKey, getItem]
  );

  const value = useMemo(
    () => ({
      setEncryptionKey,
      encryptionKey,
      getItem,
      setItem,
      ready,
      removeItem,
      setEncryptionKeyFromPassphrase,
    }),
    [
      encryptionKey,
      setEncryptionKey,
      getItem,
      setItem,
      ready,
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
