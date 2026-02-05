"use client";

import { PrivateKey } from "@bsv/sdk";
import type { Keys } from "@/lib/types";

export type MigrationStatus =
	| { status: "migrated" }
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
	if (keys.identityPk) return { status: "migrated" };

	if (keys.payPk && keys.ordPk) {
		return {
			status: "legacy",
			legacyPayWif: keys.payPk,
			legacyOrdWif: keys.ordPk,
			legacyPayAddress: PrivateKey.fromWif(keys.payPk).toAddress(),
			legacyOrdAddress: PrivateKey.fromWif(keys.ordPk).toAddress(),
		};
	}

	return { status: "unmigrateable" };
}
