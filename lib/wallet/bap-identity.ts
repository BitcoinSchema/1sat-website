import type { BapIdentity } from "@1sat/types";
import { Hash, Utils } from "@bsv/sdk";

export const BAP_DISCOVERY_PAGE_SIZE = 20;

export interface BapProfileDraft {
	name: string;
	alternateName: string;
	description: string;
	image: string;
	email: string;
	paymail: string;
}

export const EMPTY_BAP_PROFILE: BapProfileDraft = {
	name: "",
	alternateName: "",
	description: "",
	image: "",
	email: "",
	paymail: "",
};

const FIELD_LIMITS: Record<keyof BapProfileDraft, number> = {
	name: 100,
	alternateName: 100,
	description: 500,
	image: 2_048,
	email: 254,
	paymail: 254,
};

const EMAILISH = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYMAIL = /^[^\s@]+@[^\s@]+$/;
const ATTRIBUTE_URN = /^urn:bap:id:([^:]{1,100}):(.{1,1000}):([^:]{1,256})$/;

export interface ValidatedBapProfile {
	profile: Record<string, string>;
	errors: Partial<Record<keyof BapProfileDraft, string>>;
}

const hasControlCharacter = (value: string): boolean =>
	[...value].some((character) => {
		const code = character.charCodeAt(0);
		return code < 32 || code === 127;
	});

export function profileDraftFromRecord(
	profile: Record<string, unknown> | undefined,
): BapProfileDraft {
	const stringField = (field: keyof BapProfileDraft) => {
		const value = profile?.[field];
		return typeof value === "string" ? value : "";
	};
	return {
		name: stringField("name"),
		alternateName: stringField("alternateName"),
		description: stringField("description"),
		image: stringField("image"),
		email: stringField("email"),
		paymail: stringField("paymail"),
	};
}

export function isSafePublicImageUrl(value: string): boolean {
	if (value.startsWith("ord://")) {
		return /^ord:\/\/[a-fA-F0-9]{64}(?:[._]\d+)?$/.test(value);
	}
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}

export function validateBapProfile(
	draft: BapProfileDraft,
): ValidatedBapProfile {
	const errors: ValidatedBapProfile["errors"] = {};
	const profile: Record<string, string> = { "@type": "Person" };

	for (const field of Object.keys(FIELD_LIMITS) as (keyof BapProfileDraft)[]) {
		const value = draft[field].trim();
		if (!value) continue;
		if (value.length > FIELD_LIMITS[field]) {
			errors[field] = `Must be ${FIELD_LIMITS[field]} characters or fewer.`;
			continue;
		}
		if (hasControlCharacter(value)) {
			errors[field] = "Control characters are not allowed.";
			continue;
		}
		if (field === "image" && !isSafePublicImageUrl(value)) {
			errors[field] = "Use an https:// or ord:// image URL.";
			continue;
		}
		if (field === "email" && !EMAILISH.test(value)) {
			errors[field] = "Enter a valid email address.";
			continue;
		}
		if (field === "paymail" && !PAYMAIL.test(value)) {
			errors[field] = "Enter a valid Paymail address.";
			continue;
		}
		profile[field] = value;
	}

	return { profile, errors };
}

export function hasProfileErrors(
	errors: ValidatedBapProfile["errors"],
): boolean {
	return Object.keys(errors).length > 0;
}

export interface BapAttestationReview {
	subject: string;
	attributeName: string;
	attributeValue: string;
	attributeUrn: string;
	attributeHash: string;
	attestationUrn: string;
	attestationHash: string;
	counter: string;
}

const sha256Hex = (value: string) => Utils.toHex(Hash.sha256(value, "utf8"));

export function buildBapAttestationReview(input: {
	subject: string;
	attributeUrn: string;
	counter?: string;
}): BapAttestationReview {
	const subject = input.subject.trim();
	if (!/^[a-zA-Z0-9]{8,128}$/.test(subject)) {
		throw new Error("Enter a valid BAP subject identity key.");
	}

	const attributeUrn = input.attributeUrn.trim();
	if (hasControlCharacter(attributeUrn)) {
		throw new Error("The attribute URN contains control characters.");
	}
	const match = ATTRIBUTE_URN.exec(attributeUrn);
	if (!match) {
		throw new Error(
			"Use the full urn:bap:id:attribute:value:nonce attribute claim.",
		);
	}

	const counter = (input.counter ?? "0").trim();
	if (!/^(0|[1-9]\d{0,9})$/.test(counter)) {
		throw new Error("The sequence must be a non-negative decimal integer.");
	}

	const attributeHash = sha256Hex(attributeUrn);
	// Match bsv-bap MasterID.getAttestation: this preimage intentionally has
	// no `urn:` prefix, despite contradictory examples in PROTOCOL.md.
	const attestationUrn = `bap:attest:${attributeHash}:${subject}`;
	return {
		subject,
		attributeName: match[1],
		attributeValue: match[2],
		attributeUrn,
		attributeHash,
		attestationUrn,
		attestationHash: sha256Hex(attestationUrn),
		counter,
	};
}

export interface SafeBapDiscoveryIdentity {
	idKey: string;
	currentAddress?: string;
	firstSeen?: number;
	name?: string;
	alternateName?: string;
	description?: string;
	image?: string;
}

const safePublicText = (value: unknown, limit: number): string | undefined => {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (!trimmed || hasControlCharacter(trimmed)) return undefined;
	return trimmed.slice(0, limit);
};

export function normalizeBapDiscovery(
	value: unknown,
): SafeBapDiscoveryIdentity[] {
	if (!Array.isArray(value)) return [];
	const results: SafeBapDiscoveryIdentity[] = [];
	for (const candidate of value) {
		if (!candidate || typeof candidate !== "object") continue;
		const identity = candidate as Partial<BapIdentity>;
		const idKey = safePublicText(identity.idKey, 128);
		if (!idKey || !/^[a-zA-Z0-9]{8,128}$/.test(idKey)) continue;
		const publicProfile =
			identity.identity && typeof identity.identity === "object"
				? identity.identity
				: {};
		const image = safePublicText(publicProfile.image, 2_048);
		results.push({
			idKey,
			currentAddress: safePublicText(identity.currentAddress, 128),
			firstSeen:
				typeof identity.firstSeen === "number" &&
				Number.isSafeInteger(identity.firstSeen) &&
				identity.firstSeen >= 0
					? identity.firstSeen
					: undefined,
			name: safePublicText(publicProfile.name, 100),
			alternateName: safePublicText(publicProfile.alternateName, 100),
			description: safePublicText(publicProfile.description, 240),
			image: image && isSafePublicImageUrl(image) ? image : undefined,
		});
	}
	return results;
}

export function identityActionMessage(
	operation: "profile" | "publish" | "rotate" | "attest",
	error: unknown,
): string {
	const message = error instanceof Error ? error.message : String(error ?? "");
	if (/denied|declin|reject|cancel/i.test(message)) {
		return "The wallet did not authorize this request. Nothing was changed.";
	}
	if (/insufficient|fund/i.test(message)) {
		return "The wallet does not have enough spendable BSV for this transaction.";
	}
	if (/identity-exists/i.test(message)) {
		return "This wallet identity is already published. Refresh and try again.";
	}
	if (/no-identity|not published/i.test(message)) {
		return "Publish this wallet identity before using that action.";
	}
	const labels = {
		profile: "profile update",
		publish: "identity publication",
		rotate: "signing-key rotation",
		attest: "attestation",
	};
	return `The ${labels[operation]} failed. No success was recorded; refresh before retrying.`;
}
