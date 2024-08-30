import { signal } from "@preact/signals-react";

import type {
	IdentityResult,
	ProfileFromJson,
} from "@/types/identity";

export enum ImportProfileFromBackupJsonStep {
	SelectFile = 1,
	ChooseIdentity = 2,
	EnterPassphrase = 3,
	Done = 4,
}

// signals
export const importProfileFromBackupJsonStep =
	signal<ImportProfileFromBackupJsonStep>(
		ImportProfileFromBackupJsonStep.SelectFile
	);
export const bapIdEncryptionKey = signal<Uint8Array | null>(null);
export const bapIdentityRaw = signal<ProfileFromJson | null>(null);
export const bapIdentities = signal<IdentityResult[] | null>(null);
export const identitiesLoading = signal<boolean>(false);
export const activeBapIdentity = signal<IdentityResult | null>(null);
export const selectedBapIdentity = signal<IdentityResult | null>(null);
export const hasIdentityBackup = signal<boolean>(false);
export const availableIdentities = signal<IdentityResult[] | null>(null);
