import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "1sat-permissions";
const DB_VERSION = 1;
const STORE_NAME = "permissions";

export interface LocalPermission {
	key: string;
	type: "protocol" | "basket" | "certificate" | "spending";
	originator: string;
	expiry: number;
	grantedAt: number;
	details: Record<string, unknown>;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function openPermissionStore(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: "key" });
				}
			},
		});
	}
	return dbPromise;
}

export async function saveLocalPermission(
	permission: LocalPermission,
): Promise<void> {
	const db = await openPermissionStore();
	await db.put(STORE_NAME, permission);
}

export async function loadLocalPermissions(): Promise<LocalPermission[]> {
	const db = await openPermissionStore();
	return db.getAll(STORE_NAME);
}

export async function removeLocalPermission(key: string): Promise<void> {
	const db = await openPermissionStore();
	await db.delete(STORE_NAME, key);
}

export async function clearLocalPermissions(): Promise<void> {
	const db = await openPermissionStore();
	await db.clear(STORE_NAME);
}
