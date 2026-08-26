"use client";

import { PrivateKey } from "@bsv/sdk";
import type { Keys } from "@/lib/types";

/** Set when the user chooses Migrate Later. Cleared after a successful migration. */
export const MIGRATION_DEFERRED_KEY = "legacy_migration_deferred_v1";

export type MigrationStatus =
	| {
			status: "migrated";
			legacyPayWif?: string;
			legacyOrdWif?: string;
			legacyPayAddress?: string;
			legacyOrdAddress?: string;
			legacyIdentityWif?: string;
			legacyIdentityAddress?: string;
	  }
	| {
			status: "legacy";
			legacyPayWif: string;
			legacyOrdWif: string;
			legacyPayAddress: string;
			legacyOrdAddress: string;
	  }
	| { status: "unmigrateable" };

/**
 * Detect whether a wallet needs migration from legacy (payPk root) to
 * identity-key-rooted BRC-100.
 */
export function detectMigrationStatus(keys: Keys): MigrationStatus {
	if (keys.identityPk) {
		if (keys.payPk && keys.ordPk) {
			try {
				return {
					status: "migrated",
					legacyPayWif: keys.payPk,
					legacyOrdWif: keys.ordPk,
					legacyPayAddress: PrivateKey.fromWif(keys.payPk)
						.toAddress()
						.toString(),
					legacyOrdAddress: PrivateKey.fromWif(keys.ordPk)
						.toAddress()
						.toString(),
					legacyIdentityWif: keys.identityPk,
					legacyIdentityAddress: PrivateKey.fromWif(keys.identityPk)
						.toAddress()
						.toString(),
				};
			} catch (error) {
				console.warn(
					"[MigrationStatus] Failed to derive legacy addresses for migrated wallet:",
					error,
				);
			}
		}
		return { status: "migrated" };
	}

	if (keys.payPk && keys.ordPk) {
		return {
			status: "legacy",
			legacyPayWif: keys.payPk,
			legacyOrdWif: keys.ordPk,
			legacyPayAddress: PrivateKey.fromWif(keys.payPk).toAddress().toString(),
			legacyOrdAddress: PrivateKey.fromWif(keys.ordPk).toAddress().toString(),
		};
	}

	return { status: "unmigrateable" };
}
