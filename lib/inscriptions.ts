import {
	DEFAULT_STREAM_CHUNK_SIZE,
	MAX_INSCRIPTION_BYTES,
} from "@1sat/actions";

export const SINGLE_TX_INSCRIPTION_LIMIT = MAX_INSCRIPTION_BYTES;
export const DEFAULT_INSCRIPTION_STREAM_CHUNK = DEFAULT_STREAM_CHUNK_SIZE;

export type InscriptionMode =
	| "file"
	| "text"
	| "collection"
	| "collection-item";

export interface InscriptionDraft {
	mode: InscriptionMode;
	byteLength: number;
	contentType: string;
	stream: boolean;
	signWithBap: boolean;
	name?: string;
	description?: string;
	quantity?: string;
	collectionId?: string;
	mintNumber?: string;
	rank?: string;
}

export interface DraftValidation {
	valid: boolean;
	errors: string[];
}

const TXID_PATTERN = /^[0-9a-f]{64}$/i;

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

export function textByteLength(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

export function normalizeCollectionId(value: string): string | null {
	const trimmed = value.trim();
	const match = trimmed.match(/^([^._]+)[._](\d+)$/);
	if (!match || !TXID_PATTERN.test(match[1])) return null;
	const vout = Number(match[2]);
	if (!Number.isSafeInteger(vout) || vout < 0 || vout > 0xffffffff) {
		return null;
	}
	return `${match[1].toLowerCase()}_${vout}`;
}

export function parsePositiveInteger(value: string): number | null {
	if (!/^[1-9]\d*$/.test(value.trim())) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseOptionalNonNegativeInteger(
	value: string,
): number | undefined | null {
	if (value.trim() === "") return undefined;
	if (!/^\d+$/.test(value.trim())) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

export function validateInscriptionDraft(
	draft: InscriptionDraft,
): DraftValidation {
	const errors: string[] = [];
	if (draft.byteLength < 1) errors.push("Content cannot be empty.");
	if (!draft.contentType.trim()) errors.push("A content type is required.");

	const collectionMode =
		draft.mode === "collection" || draft.mode === "collection-item";
	if (collectionMode && draft.byteLength > SINGLE_TX_INSCRIPTION_LIMIT) {
		errors.push(
			`Collection artwork must be ${formatBytes(SINGLE_TX_INSCRIPTION_LIMIT)} or smaller. The installed collection actions do not stream.`,
		);
	}
	if (
		!collectionMode &&
		!draft.stream &&
		draft.byteLength > SINGLE_TX_INSCRIPTION_LIMIT
	) {
		errors.push(
			`Content over ${formatBytes(SINGLE_TX_INSCRIPTION_LIMIT)} must use OrdFS streaming.`,
		);
	}
	if (!collectionMode && draft.stream && draft.signWithBap) {
		errors.push("BAP signing is not supported for streamed inscriptions.");
	}

	if (collectionMode && !draft.name?.trim()) {
		errors.push("A name is required.");
	}
	if (draft.mode === "collection") {
		if (!draft.description?.trim()) {
			errors.push("A collection description is required.");
		}
		if (parsePositiveInteger(draft.quantity ?? "") === null) {
			errors.push("Quantity must be a positive whole number.");
		}
	}
	if (draft.mode === "collection-item") {
		if (!normalizeCollectionId(draft.collectionId ?? "")) {
			errors.push("Collection ID must be a txid and output index.");
		}
		if (parseOptionalNonNegativeInteger(draft.mintNumber ?? "") === null) {
			errors.push("Mint number must be a non-negative whole number.");
		}
		if (parseOptionalNonNegativeInteger(draft.rank ?? "") === null) {
			errors.push("Rank must be a non-negative whole number.");
		}
	}

	return { valid: errors.length === 0, errors };
}

export async function fileToBase64(file: File): Promise<string> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	let binary = "";
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(
			...bytes.subarray(offset, offset + chunkSize),
		);
	}
	return btoa(binary);
}

export function textToBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(
			...bytes.subarray(offset, offset + chunkSize),
		);
	}
	return btoa(binary);
}

export function inscriptionFailureMessage(value: unknown): string {
	const code = typeof value === "string" ? value.toLowerCase() : "";
	if (/denied|declin|reject|permission/.test(code)) {
		return "The wallet declined the requested permission. Your draft is unchanged.";
	}
	if (/insufficient|fund/.test(code)) {
		return "The wallet does not have enough spendable BSV for this transaction.";
	}
	if (/too large|size|stream/.test(code)) {
		return "The selected content is not valid for this inscription mode. Review the size and streaming options.";
	}
	return "The wallet could not complete the inscription. Your draft is unchanged, so you can retry.";
}
