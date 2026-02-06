import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "1sat-permissions";
const DB_VERSION = 2;
const STORE_NAME = "permissions";

export interface PermissionScope {
	identityKey: string;
	chain: string;
}

export interface LocalPermission {
	id: string;
	scope: string;
	key: string;
	identityKey: string;
	chain: string;
	type: "protocol" | "basket" | "certificate" | "spending";
	originator: string;
	expiry: number;
	grantedAt: number;
	details: Record<string, unknown>;
}

export interface SaveLocalPermissionInput {
	key: string;
	type: "protocol" | "basket" | "certificate" | "spending";
	originator: string;
	expiry: number;
	grantedAt: number;
	details: Record<string, unknown>;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function buildScopeKey(scope: PermissionScope): string {
	return `${scope.chain}:${scope.identityKey}`;
}

function buildScopedPermissionId(scope: PermissionScope, key: string): string {
	return `${buildScopeKey(scope)}:${key}`;
}

function openPermissionStore(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db, oldVersion) {
				// v1 used keyPath=key and had no wallet scope. Drop and recreate
				// to prevent cross-wallet permission leakage.
				if (oldVersion < 2 && db.objectStoreNames.contains(STORE_NAME)) {
					db.deleteObjectStore(STORE_NAME);
				}

				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
					store.createIndex("scope", "scope", { unique: false });
				}
			},
		});
	}
	return dbPromise;
}

export async function saveLocalPermission(
	scope: PermissionScope,
	permission: SaveLocalPermissionInput,
): Promise<void> {
	const db = await openPermissionStore();
	const scopeKey = buildScopeKey(scope);
	await db.put(STORE_NAME, {
		...permission,
		id: buildScopedPermissionId(scope, permission.key),
		scope: scopeKey,
		identityKey: scope.identityKey,
		chain: scope.chain,
	} satisfies LocalPermission);
}

export async function loadLocalPermissions(
	scope: PermissionScope,
): Promise<LocalPermission[]> {
	const db = await openPermissionStore();

	try {
		return db.getAllFromIndex(STORE_NAME, "scope", buildScopeKey(scope));
	} catch {
		const all = (await db.getAll(STORE_NAME)) as LocalPermission[];
		return all.filter(
			(permission) =>
				permission.identityKey === scope.identityKey &&
				permission.chain === scope.chain,
		);
	}
}

export async function removeLocalPermission(
	scope: PermissionScope,
	key: string,
): Promise<void> {
	const db = await openPermissionStore();
	await db.delete(STORE_NAME, buildScopedPermissionId(scope, key));
}

export async function clearLocalPermissions(
	scope?: PermissionScope,
): Promise<void> {
	const db = await openPermissionStore();

	if (!scope) {
		await db.clear(STORE_NAME);
		return;
	}

	const scopedPermissions = await loadLocalPermissions(scope);
	await Promise.all(
		scopedPermissions.map((permission) => db.delete(STORE_NAME, permission.id)),
	);
}
