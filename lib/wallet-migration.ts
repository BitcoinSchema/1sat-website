"use client";

import { PrivateKey } from "@bsv/sdk";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import type { Keys } from "@/lib/types";

/** Identity-scoped so deferring one imported wallet cannot hide another. */
export function migrationDeferredKey(keys: Keys): string {
	if (!keys.payPk)
		throw new Error("Cannot scope migration without a payment key");
	return `legacy_migration_deferred_v1:${PrivateKey.fromWif(keys.payPk).toAddress().toString()}`;
}

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
			} catch {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.migration.inspect",
					recoverable: true,
				});
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
