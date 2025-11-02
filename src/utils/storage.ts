// import { useCallback, useEffect, useMemo, useState } from "react";

// type StorageType = "localStorage" | "sessionStorage";

// export const lsTest = () => {
//   var test = "test";
//   try {
//     localStorage.setItem(test, test);
//     localStorage.removeItem(test);
//     return true;
//   } catch (e) {
//     return false;
//   }
// };

// const replacer = (key: string, value: any) => {
//   if (value instanceof Map) {
//     return {
//       dataType: "Map",
//       value: Array.from(value.entries()), // or with spread: value: [...originalObject]
//     };
//   }
//   return value;
// };

// const reviver = (key: string, value: any) => {
//   if (typeof value === "object" && value !== null) {
//     if (value.dataType === "Map") {
//       return new Map(value.value);
//     }
//   }
//   return value;
// };

// const getStorage = (storageType: StorageType): Storage | undefined => {
//   let storage: Storage | undefined;

//   if (typeof window !== "undefined") {
//     switch (storageType) {
//       case "localStorage":
//         return window.localStorage;
//       case "sessionStorage":
//         return window.sessionStorage;
//     }
//   }

//   return storage;
// };

// const saveInStorage = (
//   storageType: StorageType,
//   storageKey: string,
//   data: unknown | undefined
// ): void => {
//   const storage = getStorage(storageType);

//   try {
//     if (storage) {
//       if (data != null && data !== undefined) {
//         storage.setItem(storageKey, JSON.stringify(data, replacer));
//       } else {
//         storage.removeItem(storageKey);
//       }
//     }
//   } catch (e) {
//     // TODO: showError toast
//     console.log("ERROR", "Could not access browser local/session storage");
//   }
// };

// const loadFromStorage = <T>(
//   storageType: StorageType,
//   localStorageKey: string
// ): T | undefined => {
//   const storage = getStorage(storageType);

//   try {
//     if (storage) {
//       const dataStr = storage.getItem(localStorageKey);
//       return dataStr ? JSON.parse(dataStr, reviver) : undefined;
//     }
//   } catch (e) {
//     // TODO: showError toast
//     console.log("ERROR", "Could not access browser local/session storage");
//   }

//   return undefined;
// };

// export const saveInLocalStorage = (
//   storageKey: string,
//   data: unknown | undefined
// ) => saveInStorage("localStorage", storageKey, data);

// export const loadFromLocalStorage = <T>(storageKey: string): T | undefined =>
//   loadFromStorage("localStorage", storageKey) || undefined;

// export const saveInSessionStorage = (
//   storageKey: string,
//   data: unknown | undefined
// ) => saveInStorage("sessionStorage", storageKey, data);

// export const loadFromSessionStorage = <T>(storageKey: string): T | undefined =>
//   loadFromStorage("sessionStorage", storageKey) || undefined;

// // Hooks

// const useStorage = <T>(
//   storageType: StorageType,
//   storageKey: string,
//   initialValue: T
// ): [T, (value: T) => void] => {
//   const [storedValue, setStoredValue] = useState<T>(() => {
//     try {
//       return loadFromStorage<T>(storageType, storageKey) || initialValue;
//     } catch (e) {
//       console.error(e);
//       return initialValue;
//     }
//   });

//   const setValue = useCallback(
//     (value: any) => {
//       try {
//         setStoredValue(value);
//         saveInStorage(storageType, storageKey, value);
//       } catch (e) {
//         console.error(e);
//       }
//     },
//     [storageKey, storageType]
//   );

//   // Listen to changes in local storage in order to adapt to actions from other browser tabs
//   useEffect(() => {
//     const handleChange = () => {
//       setStoredValue(
//         loadFromStorage<T>(storageType, storageKey) || initialValue
//       );
//     };

//     window.addEventListener("storage", handleChange, false);
//     return () => {
//       window.removeEventListener("storage", handleChange);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [initialValue, storageKey, storageType]);

//   const value = useMemo(() => [storedValue, setValue], [storedValue, setValue]);

//   return value as [T, (value: T) => void];
// };

// export const useLocalStorage = <T>(storageKey: string, initialValue?: T) =>
//   useStorage("localStorage", storageKey, initialValue);

// export const useSessionStorage = <T>(storageKey: string, initialValue?: T) =>
//   useStorage("sessionStorage", storageKey, initialValue);


// storageHelper.tsx

import { useCallback, useEffect, useState } from "react";

// Types
type StorageType = "localStorage" | "sessionStorage";

// JSON Serialization Helpers
const replacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  }
  return value;
};

const reviver = (key: string, value: any) => {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
};

// Local and Session Storage Functions
const getStorage = (storageType: StorageType): Storage | undefined => {
  if (typeof window !== "undefined") {
    switch (storageType) {
      case "localStorage":
        return window.localStorage;
      case "sessionStorage":
        return window.sessionStorage;
    }
  }
  return undefined;
};

const saveInStorage = (
  storageType: StorageType,
  storageKey: string,
  data: unknown | undefined
): void => {
  const storage = getStorage(storageType);

  try {
    if (storage) {
      if (data != null && data !== undefined) {
        storage.setItem(storageKey, JSON.stringify(data, replacer));
      } else {
        storage.removeItem(storageKey);
      }
    }
  } catch (e) {
    console.error("ERROR: Could not access browser local/session storage", e);
  }
};

const loadFromStorage = <T>(
  storageType: StorageType,
  storageKey: string
): T | undefined => {
  const storage = getStorage(storageType);

  try {
    if (storage) {
      const dataStr = storage.getItem(storageKey);
      if (!dataStr) return undefined;

      try {
        return JSON.parse(dataStr, reviver);
      } catch (parseError) {
        // If JSON.parse fails, the value might be a raw string (e.g., WIF key)
        // Return it as-is
        console.warn(`Failed to parse JSON for key "${storageKey}", returning raw value`);
        return dataStr as T;
      }
    }
  } catch (e) {
    console.error("ERROR: Could not access browser local/session storage", e);
  }

  return undefined;
};

export const saveInLocalStorage = (
  storageKey: string,
  data: unknown | undefined
) => saveInStorage("localStorage", storageKey, data);

export const loadFromLocalStorage = <T>(storageKey: string): T | undefined =>
  loadFromStorage("localStorage", storageKey);

export const saveInSessionStorage = (
  storageKey: string,
  data: unknown | undefined
) => saveInStorage("sessionStorage", storageKey, data);

export const loadFromSessionStorage = <T>(storageKey: string): T | undefined =>
  loadFromStorage("sessionStorage", storageKey);

// Hooks for Local and Session Storage
const useStorage = <T>(
  storageType: StorageType,
  storageKey: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      return loadFromStorage<T>(storageType, storageKey) || initialValue;
    } catch (e) {
      console.error(e);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        saveInStorage(storageType, storageKey, value);
      } catch (e) {
        console.error(e);
      }
    },
    [storageKey, storageType]
  );

  // Listen to changes in storage for cross-tab synchronization
  useEffect(() => {
    const handleChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setStoredValue(
          event.newValue ? JSON.parse(event.newValue, reviver) : initialValue
        );
      }
    };

    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
    };
  }, [initialValue, storageKey]);

  return [storedValue, setValue];
};

export const useLocalStorage = <T>(storageKey: string, initialValue: T) =>
  useStorage("localStorage", storageKey, initialValue);

export const useSessionStorage = <T>(storageKey: string, initialValue: T) =>
  useStorage("sessionStorage", storageKey, initialValue);

// IndexedDB Constants
const DB_NAME = "app_storage";
const STORE_NAME = "key_value_store";
const DB_VERSION = 1;

// IndexedDB Helper Functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

const saveInIDB = async (key: string, data: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const loadFromIDB = async <T>(key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const deleteFromIDB = async (key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// BroadcastChannel for Cross-Tab Synchronization
// Check for both window and BroadcastChannel availability to avoid Edge Runtime errors
const broadcastChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("idb_storage_sync")
    : null;

// useIDBStorage Hook
export const useIDBStorage = <T>(
  storageKey: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial value from IndexedDB
  useEffect(() => {
    let isMounted = true;

    const loadInitialValue = async () => {
      try {
        const value = await loadFromIDB<T>(storageKey);
        if (isMounted) {
          if (value !== undefined) {
            setStoredValue(value);
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error loading from IndexedDB:", error);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    loadInitialValue();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Set value and save to IndexedDB
  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value);
        if (value !== null && value !== undefined) {
          await saveInIDB(storageKey, value);
        } else {
          await deleteFromIDB(storageKey);
        }

        // Broadcast the change to other tabs
        if (broadcastChannel) {
          broadcastChannel.postMessage({ key: storageKey, value });
        }
      } catch (error) {
        console.error("Error saving to IndexedDB:", error);
      }
    },
    [storageKey]
  );

  // Listen for messages from other tabs
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const { key, value } = event.data;
      if (key === storageKey) {
        setStoredValue(value);
      }
    };

    broadcastChannel.addEventListener("message", handleMessage);

    return () => {
      broadcastChannel.removeEventListener("message", handleMessage);
    };
  }, [storageKey]);

  // Don't return until we've at least attempted to load the stored value
  if (!isInitialized) {
    return [initialValue, setValue];
  }

  return [storedValue, setValue];
};