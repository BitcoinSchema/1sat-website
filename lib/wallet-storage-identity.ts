type Chain = "main" | "test";

const INSTALLATION_ID_KEY = "1sat-wallet-storage-installation-id";
const INSTALLATION_ID_PREFIX = "1sat-web-";
const INSTALLATION_ID =
	/^1sat-web-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_PUBLIC_KEY = /^(02|03)[0-9a-f]{64}$/i;

type IdentityRecord = {
	storageIdentityKey: string;
	updated_at?: Date;
	[key: string]: unknown;
};

type UserRecord = {
	activeStorage?: string;
	updated_at?: Date;
	[key: string]: unknown;
};

export interface WalletStorageIdentityDependencies {
	storage: Pick<Storage, "getItem" | "setItem">;
	randomUUID: () => string;
	readDatabaseIdentity: (chain: Chain) => Promise<string | null>;
	migrateDatabaseIdentity: (
		chain: Chain,
		legacyIdentity: string,
		nextIdentity: string,
	) => Promise<string>;
}

function databaseName(chain: Chain): string {
	return `wallet-toolbox-${chain}net`;
}

function isInstallationIdentity(value: string | null): value is string {
	return value !== null && INSTALLATION_ID.test(value);
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onabort = () =>
			reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
		transaction.onerror = () =>
			reject(transaction.error ?? new Error("IndexedDB transaction failed"));
	});
}

async function openExistingDatabase(chain: Chain): Promise<IDBDatabase | null> {
	const name = databaseName(chain);
	if (typeof indexedDB.databases === "function") {
		const databases = await indexedDB.databases();
		if (!databases.some((database) => database.name === name)) return null;
	}

	return await new Promise((resolve, reject) => {
		const request = indexedDB.open(name);
		let created = false;

		request.onupgradeneeded = () => {
			created = true;
			request.transaction?.abort();
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => {
			if (created && request.error?.name === "AbortError") {
				resolve(null);
				return;
			}
			reject(request.error);
		};
	});
}

async function readDatabaseIdentity(chain: Chain): Promise<string | null> {
	const database = await openExistingDatabase(chain);
	if (!database) return null;

	try {
		if (!database.objectStoreNames.contains("settings")) {
			throw new Error("Existing wallet database has no settings store");
		}
		const transaction = database.transaction("settings", "readonly");
		const records = await requestResult<IdentityRecord[]>(
			transaction.objectStore("settings").getAll(),
		);
		if (records.length !== 1) {
			throw new Error(
				`Expected one wallet storage identity, found ${records.length}`,
			);
		}
		return records[0].storageIdentityKey;
	} finally {
		database.close();
	}
}

async function updateUsers(
	store: IDBObjectStore,
	legacyIdentity: string,
	nextIdentity: string,
): Promise<void> {
	await new Promise((resolve, reject) => {
		const request = store.openCursor();
		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const cursor = request.result;
			if (!cursor) {
				resolve(undefined);
				return;
			}
			const user = cursor.value as UserRecord;
			if (user.activeStorage === legacyIdentity) {
				cursor.update({
					...user,
					activeStorage: nextIdentity,
					updated_at: new Date(),
				});
			}
			cursor.continue();
		};
	});
}

async function migrateDatabaseIdentity(
	chain: Chain,
	legacyIdentity: string,
	nextIdentity: string,
): Promise<string> {
	const database = await openExistingDatabase(chain);
	if (!database) {
		throw new Error("Legacy wallet database disappeared during migration");
	}

	try {
		const stores = ["settings"];
		if (database.objectStoreNames.contains("users")) stores.push("users");
		const transaction = database.transaction(stores, "readwrite");
		const complete = transactionComplete(transaction);
		try {
			const settings = transaction.objectStore("settings");
			const records = await requestResult<IdentityRecord[]>(settings.getAll());
			if (records.length !== 1) {
				throw new Error(
					`Expected one wallet storage identity, found ${records.length}`,
				);
			}

			const current = records[0];
			if (current.storageIdentityKey !== legacyIdentity) {
				await complete;
				return current.storageIdentityKey;
			}

			await requestResult(settings.delete(legacyIdentity));
			await requestResult(
				settings.add({
					...current,
					storageIdentityKey: nextIdentity,
					updated_at: new Date(),
				}),
			);
			if (stores.includes("users")) {
				await updateUsers(
					transaction.objectStore("users"),
					legacyIdentity,
					nextIdentity,
				);
			}
			await complete;
			return nextIdentity;
		} catch (error) {
			try {
				transaction.abort();
			} catch {
				// The transaction may already have rolled back.
			}
			await complete.catch(() => undefined);
			throw error;
		}
	} finally {
		database.close();
	}
}

function browserDependencies(): WalletStorageIdentityDependencies {
	return {
		storage: window.localStorage,
		randomUUID: () => crypto.randomUUID(),
		readDatabaseIdentity,
		migrateDatabaseIdentity,
	};
}

function readPersistedIdentity(
	storage: WalletStorageIdentityDependencies["storage"],
): string | null {
	try {
		return storage.getItem(INSTALLATION_ID_KEY);
	} catch {
		return null;
	}
}

function persistIdentity(
	storage: WalletStorageIdentityDependencies["storage"],
	identity: string,
): void {
	try {
		storage.setItem(INSTALLATION_ID_KEY, identity);
	} catch {
		// IndexedDB remains authoritative when localStorage is unavailable.
	}
}

export async function loadOrCreateWalletStorageIdentity(
	chain: Chain,
	dependencies: WalletStorageIdentityDependencies = browserDependencies(),
): Promise<string> {
	const persisted = readPersistedIdentity(dependencies.storage);
	const databaseIdentity = await dependencies.readDatabaseIdentity(chain);

	if (databaseIdentity) {
		if (LEGACY_PUBLIC_KEY.test(databaseIdentity)) {
			const candidate = isInstallationIdentity(persisted)
				? persisted
				: `${INSTALLATION_ID_PREFIX}${dependencies.randomUUID()}`;
			const migrated = await dependencies.migrateDatabaseIdentity(
				chain,
				databaseIdentity,
				candidate,
			);
			persistIdentity(dependencies.storage, migrated);
			return migrated;
		}

		// The database is the durable source of truth after first creation.
		persistIdentity(dependencies.storage, databaseIdentity);
		return databaseIdentity;
	}

	const identity = isInstallationIdentity(persisted)
		? persisted
		: `${INSTALLATION_ID_PREFIX}${dependencies.randomUUID()}`;
	persistIdentity(dependencies.storage, identity);
	return identity;
}
