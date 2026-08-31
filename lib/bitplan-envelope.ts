/**
 * Browser-safe BitPlan v1/v2 reader, kept in lockstep with
 * bitplan.dev/apps/web/src/lib/envelope.ts.
 */
import {
	Hash,
	PublicKey,
	SymmetricKey,
	Utils,
	type WalletInterface,
} from "@bsv/sdk";

const MAGIC = Uint8Array.from([0x42, 0x50, 0x4c, 0x4e]);
const MAX_HEADER_BYTES = 64 * 1024;
const MAX_SHARED_RECIPIENTS = 128;
const MIN_SYMMETRIC_CIPHERTEXT_BYTES = 48;
const CONTENT_KEY_BYTES = 32;

export type BitPlanAccessIssue =
	| "decrypt-refused"
	| "identity-unavailable"
	| "not-authorized";

export class BitPlanEnvelopeError extends Error {
	override readonly name = "BitPlanEnvelopeError";
}

export class BitPlanAccessError extends BitPlanEnvelopeError {
	constructor(
		readonly issue: BitPlanAccessIssue,
		message: string,
		cause?: unknown,
	) {
		super(message, cause === undefined ? undefined : { cause });
	}
}

interface PrivateHeader {
	v: 1;
	key: {
		mode: "brc2-self";
		protocolID: [2, "bitplan"];
		keyID: string;
	};
}

interface SharedSlot {
	identityKey: string;
	offset: number;
	length: number;
}

interface SharedHeader {
	v: 2;
	key: {
		mode: "brc2-multi";
		protocolID: [2, "bitplan"];
		keyID: string;
		payloadLength: number;
		senderIdentityKey: string;
		slots: SharedSlot[];
	};
}

export type BitPlanHeader = PrivateHeader | SharedHeader;

export interface BitPlanPlaintext {
	html: string;
	headerSha256?: string;
	meta?: {
		title?: string | null;
		description?: string | null;
		createdAt?: string;
		[key: string]: unknown;
	};
}

type BitPlanWallet = Pick<WalletInterface, "decrypt" | "getPublicKey">;

function fail(message: string): never {
	throw new BitPlanEnvelopeError(message);
}

function normalizeIdentityKey(value: unknown): string | null {
	if (typeof value !== "string" || !/^(02|03)[0-9a-f]{64}$/i.test(value)) {
		return null;
	}
	try {
		const normalized = value.toLowerCase();
		const canonical = PublicKey.fromString(normalized).toString().toLowerCase();
		return canonical === normalized ? canonical : null;
	} catch {
		return null;
	}
}

function parseHeader(value: unknown): BitPlanHeader {
	if (!value || typeof value !== "object")
		fail("BitPlan header is not an object.");
	const header = value as Record<string, unknown>;
	if (header.v !== 1 && header.v !== 2) fail("Unsupported BitPlan version.");
	if (!header.key || typeof header.key !== "object") {
		fail("BitPlan header has no key metadata.");
	}
	const key = header.key as Record<string, unknown>;
	if (
		!Array.isArray(key.protocolID) ||
		key.protocolID.length !== 2 ||
		key.protocolID[0] !== 2 ||
		key.protocolID[1] !== "bitplan"
	) {
		fail('BitPlan protocol must be [2, "bitplan"].');
	}
	if (typeof key.keyID !== "string" || !key.keyID) {
		fail("BitPlan key ID is missing.");
	}

	if (header.v === 1) {
		if (key.mode !== "brc2-self") fail("Unsupported private BitPlan key mode.");
		return {
			v: 1,
			key: {
				mode: "brc2-self",
				protocolID: [2, "bitplan"],
				keyID: key.keyID,
			},
		};
	}

	if (key.mode !== "brc2-multi") fail("Unsupported shared BitPlan key mode.");
	if (!Number.isSafeInteger(key.payloadLength)) {
		fail("Shared BitPlan payload length is invalid.");
	}
	const senderIdentityKey = normalizeIdentityKey(key.senderIdentityKey);
	if (!senderIdentityKey) fail("Shared BitPlan sender identity is invalid.");
	if (
		!Array.isArray(key.slots) ||
		key.slots.length === 0 ||
		key.slots.length > MAX_SHARED_RECIPIENTS + 1
	) {
		fail("Shared BitPlan reader list is invalid.");
	}
	const identities = new Set<string>();
	const slots = key.slots.map((value, index): SharedSlot => {
		if (!value || typeof value !== "object")
			fail(`BitPlan reader ${index} is invalid.`);
		const slot = value as Record<string, unknown>;
		const identityKey = normalizeIdentityKey(slot.identityKey);
		if (!identityKey || identities.has(identityKey)) {
			fail(`BitPlan reader ${index} has an invalid or duplicate identity.`);
		}
		identities.add(identityKey);
		if (!Number.isSafeInteger(slot.offset) || Number(slot.offset) < 0) {
			fail(`BitPlan reader ${index} offset is invalid.`);
		}
		if (!Number.isSafeInteger(slot.length) || Number(slot.length) <= 0) {
			fail(`BitPlan reader ${index} length is invalid.`);
		}
		return {
			identityKey,
			offset: Number(slot.offset),
			length: Number(slot.length),
		};
	});
	if (slots[0]?.identityKey !== senderIdentityKey) {
		fail("The first BitPlan reader must be the sender.");
	}
	return {
		v: 2,
		key: {
			mode: "brc2-multi",
			protocolID: [2, "bitplan"],
			keyID: key.keyID,
			payloadLength: Number(key.payloadLength),
			senderIdentityKey,
			slots,
		},
	};
}

export function parseBitPlanEnvelope(bytes: Uint8Array): {
	header: BitPlanHeader;
	body: Uint8Array;
} {
	const prefixLength = MAGIC.length + 1 + 4;
	if (bytes.length < prefixLength) fail("BitPlan envelope is too short.");
	for (let index = 0; index < MAGIC.length; index += 1) {
		if (bytes[index] !== MAGIC[index])
			fail("BitPlan envelope is missing BPLN magic.");
	}
	const version = bytes[MAGIC.length];
	if (version !== 1 && version !== 2)
		fail("Unsupported BitPlan envelope version.");
	const headerLength = new DataView(
		bytes.buffer,
		bytes.byteOffset,
		bytes.byteLength,
	).getUint32(MAGIC.length + 1, true);
	if (!headerLength || headerLength > MAX_HEADER_BYTES) {
		fail("BitPlan header length is invalid.");
	}
	if (bytes.length < prefixLength + headerLength)
		fail("BitPlan header is truncated.");
	let decoded: unknown;
	try {
		decoded = JSON.parse(
			new TextDecoder().decode(
				bytes.subarray(prefixLength, prefixLength + headerLength),
			),
		);
	} catch (error) {
		throw new BitPlanEnvelopeError("BitPlan header is not valid JSON.", {
			cause: error,
		});
	}
	const header = parseHeader(decoded);
	if (header.v !== version) fail("BitPlan binary and header versions differ.");
	const body = bytes.subarray(prefixLength + headerLength);
	if (body.length === 0) fail("BitPlan ciphertext is missing.");
	if (header.v === 2) {
		if (
			header.key.payloadLength < MIN_SYMMETRIC_CIPHERTEXT_BYTES ||
			header.key.payloadLength >= body.length
		) {
			fail("Shared BitPlan payload length is invalid.");
		}
		let expectedOffset = header.key.payloadLength;
		for (const slot of header.key.slots) {
			if (slot.offset !== expectedOffset)
				fail("BitPlan reader slots are not contiguous.");
			expectedOffset += slot.length;
		}
		if (expectedOffset !== body.length)
			fail("BitPlan reader slots do not cover the body.");
	}
	return { header, body };
}

function canonicalJson(value: unknown): string {
	return JSON.stringify(value, (_key, item) =>
		item && typeof item === "object" && !Array.isArray(item)
			? Object.fromEntries(
					Object.entries(item).sort(([left], [right]) =>
						left < right ? -1 : left > right ? 1 : 0,
					),
				)
			: item,
	);
}

function headerSha256(header: BitPlanHeader): string {
	return Utils.toHex(
		Hash.sha256(Array.from(new TextEncoder().encode(canonicalJson(header)))),
	);
}

export async function openBitPlanEnvelope(
	wallet: BitPlanWallet,
	bytes: Uint8Array,
): Promise<{ header: BitPlanHeader; plaintext: BitPlanPlaintext }> {
	const { header, body } = parseBitPlanEnvelope(bytes);
	let counterparty = "self";
	let ciphertext = body;
	if (header.v === 2) {
		let identityKey: string | null;
		try {
			identityKey = normalizeIdentityKey(
				(await wallet.getPublicKey({ identityKey: true })).publicKey,
			);
		} catch (error) {
			throw new BitPlanAccessError(
				"identity-unavailable",
				"The wallet could not provide its identity key.",
				error,
			);
		}
		if (!identityKey) fail("The wallet returned an invalid identity key.");
		const slot = header.key.slots.find(
			(item) => item.identityKey === identityKey,
		);
		if (!slot) {
			throw new BitPlanAccessError(
				"not-authorized",
				"This wallet identity is not authorized to read this BitPlan document.",
			);
		}
		counterparty =
			identityKey === header.key.senderIdentityKey
				? "self"
				: header.key.senderIdentityKey;
		ciphertext = body.subarray(slot.offset, slot.offset + slot.length);
	}

	let decrypted: Awaited<ReturnType<BitPlanWallet["decrypt"]>>;
	try {
		decrypted = await wallet.decrypt({
			protocolID: [2, "bitplan"],
			keyID: header.key.keyID,
			counterparty,
			ciphertext: Array.from(ciphertext),
		});
	} catch (error) {
		throw new BitPlanAccessError(
			"decrypt-refused",
			"The wallet declined to decrypt this BitPlan document.",
			error,
		);
	}

	let plaintextBytes = decrypted.plaintext;
	if (header.v === 2) {
		if (plaintextBytes.length !== CONTENT_KEY_BYTES) {
			fail("The decrypted BitPlan content key has the wrong length.");
		}
		try {
			plaintextBytes = new SymmetricKey(plaintextBytes).decrypt(
				Array.from(body.subarray(0, header.key.payloadLength)),
			) as number[];
		} catch (error) {
			throw new BitPlanEnvelopeError(
				"The shared BitPlan payload failed authentication.",
				{ cause: error },
			);
		}
	}

	let decoded: unknown;
	try {
		decoded = JSON.parse(
			new TextDecoder().decode(Uint8Array.from(plaintextBytes)),
		);
	} catch (error) {
		throw new BitPlanEnvelopeError(
			"The decrypted BitPlan document is not valid JSON.",
			{ cause: error },
		);
	}
	if (
		!decoded ||
		typeof decoded !== "object" ||
		typeof (decoded as BitPlanPlaintext).html !== "string"
	) {
		fail("The decrypted BitPlan document has no HTML body.");
	}
	const plaintext = decoded as BitPlanPlaintext;
	if (header.v === 2 && plaintext.headerSha256 !== headerSha256(header)) {
		fail("The BitPlan header does not match its authenticated payload.");
	}
	const { headerSha256: _binding, ...document } = plaintext;
	return { header, plaintext: document };
}
