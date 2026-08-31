import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	DEFAULT_INSCRIPTION_STREAM_CHUNK,
	formatBytes,
	inscriptionFailureMessage,
	normalizeCollectionId,
	parseOptionalNonNegativeInteger,
	parsePositiveInteger,
	SINGLE_TX_INSCRIPTION_LIMIT,
	textByteLength,
	textToBase64,
	validateInscriptionDraft,
} from "@/lib/inscriptions";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const txid = "ab".repeat(32);

describe("inscription draft contracts", () => {
	it("uses the exact installed action limits and UTF-8 byte counts", () => {
		assert.equal(SINGLE_TX_INSCRIPTION_LIMIT, 50 * 1024 * 1024);
		assert.equal(DEFAULT_INSCRIPTION_STREAM_CHUNK, 1024 * 1024);
		assert.equal(textByteLength("hello"), 5);
		assert.equal(textByteLength("💩"), 4);
		assert.equal(textToBase64("💩"), "8J+SqQ==");
		assert.equal(formatBytes(SINGLE_TX_INSCRIPTION_LIMIT), "50.00 MiB");
	});

	it("requires streaming only above the single-transaction limit", () => {
		const base = {
			mode: "file" as const,
			contentType: "application/octet-stream",
			stream: false,
			signWithBap: false,
		};
		assert.equal(
			validateInscriptionDraft({
				...base,
				byteLength: SINGLE_TX_INSCRIPTION_LIMIT,
			}).valid,
			true,
		);
		assert.equal(
			validateInscriptionDraft({
				...base,
				byteLength: SINGLE_TX_INSCRIPTION_LIMIT + 1,
			}).valid,
			false,
		);
		assert.equal(
			validateInscriptionDraft({
				...base,
				byteLength: SINGLE_TX_INSCRIPTION_LIMIT + 1,
				stream: true,
			}).valid,
			true,
		);
		assert.match(
			validateInscriptionDraft({
				...base,
				byteLength: 1,
				stream: true,
				signWithBap: true,
			}).errors.join(" "),
			/BAP signing is not supported/,
		);
	});

	it("keeps collection mints single-transaction and validates canonical fields", () => {
		const collection = validateInscriptionDraft({
			mode: "collection",
			byteLength: SINGLE_TX_INSCRIPTION_LIMIT + 1,
			contentType: "image/png",
			stream: false,
			signWithBap: false,
			name: "Example",
			description: "A collection",
			quantity: "10",
		});
		assert.equal(collection.valid, false);
		assert.match(collection.errors.join(" "), /do not stream/);
		assert.equal(parsePositiveInteger("1"), 1);
		assert.equal(parsePositiveInteger("0"), null);
		assert.equal(parsePositiveInteger("9007199254740992"), null);
		assert.equal(parseOptionalNonNegativeInteger(""), undefined);
		assert.equal(parseOptionalNonNegativeInteger("0"), 0);
	});

	it("normalizes collection origins and rejects unsafe output indexes", () => {
		assert.equal(normalizeCollectionId(`${txid}.2`), `${txid}_2`);
		assert.equal(normalizeCollectionId(`${txid}_0`), `${txid}_0`);
		assert.equal(
			normalizeCollectionId(`${txid}_4294967295`),
			`${txid}_4294967295`,
		);
		assert.equal(normalizeCollectionId(`${txid}_4294967296`), null);
		assert.equal(normalizeCollectionId("not-an-outpoint"), null);
	});

	it("maps action failures without exposing provider payloads", () => {
		assert.match(inscriptionFailureMessage("permission denied"), /declined/);
		assert.match(inscriptionFailureMessage("insufficient funds"), /spendable/);
		assert.doesNotMatch(
			inscriptionFailureMessage({ seed: "never display this" }),
			/seed|never display/,
		);
	});

	it("uses provider-neutral actions and capability-gated typed ORDFS checks", () => {
		const source = read("components/inscriptions/inscription-studio.tsx");
		assert.match(source, /inscribe\.execute/);
		assert.match(source, /mintCollection\.execute/);
		assert.match(source, /mintCollectionItem\.execute/);
		assert.match(source, /\.execute\(oneSatContext/);
		assert.doesNotMatch(source, /createContext\(/);
		assert.match(source, /services\.ordfs\.getMetadata/);
		assert.match(source, /capabilities\.has\("ordfs"\)/);
		assert.match(source, /Network fee and total are not quoted/);
		assert.match(source, /BAP\/Sigma/);
		assert.doesNotMatch(
			source,
			/@\/lib\/wallet-(?:storage|backup|migration)|\bindexedDB\b|\bwalletKeys\b|\brootKey\b|\bPrivateKey\b/,
		);
		assert.doesNotMatch(source, /\/api\/(?:inscribe|mint|quote|index)/);
	});
});
