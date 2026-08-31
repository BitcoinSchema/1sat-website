import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	BitPlanEnvelopeError,
	openBitPlanEnvelope,
	parseBitPlanEnvelope,
} from "../lib/bitplan-envelope";

const encoder = new TextEncoder();

function privateEnvelope(keyID: string, ciphertext: number[]): Uint8Array {
	const header = encoder.encode(
		JSON.stringify({
			v: 1,
			key: { mode: "brc2-self", protocolID: [2, "bitplan"], keyID },
		}),
	);
	const bytes = new Uint8Array(9 + header.length + ciphertext.length);
	bytes.set([0x42, 0x50, 0x4c, 0x4e, 1], 0);
	new DataView(bytes.buffer).setUint32(5, header.length, true);
	bytes.set(header, 9);
	bytes.set(ciphertext, 9 + header.length);
	return bytes;
}

describe("BitPlan browser envelope reader", () => {
	test("opens a private document through the exact BitPlan BRC-2 protocol", async () => {
		const envelope = privateEnvelope("document-key", [7, 8, 9]);
		let request: unknown;
		const wallet = {
			decrypt: async (args: unknown) => {
				request = args;
				return {
					plaintext: Array.from(
						encoder.encode(
							JSON.stringify({
								html: "<main>Private plan</main>",
								meta: { title: "Private plan" },
							}),
						),
					),
				};
			},
			getPublicKey: async () => ({ publicKey: "" }),
		};

		const opened = await openBitPlanEnvelope(wallet, envelope);

		assert.deepEqual(request, {
			protocolID: [2, "bitplan"],
			keyID: "document-key",
			counterparty: "self",
			ciphertext: [7, 8, 9],
		});
		assert.equal(opened.header.v, 1);
		assert.equal(opened.plaintext.html, "<main>Private plan</main>");
		assert.equal(opened.plaintext.meta?.title, "Private plan");
	});

	test("rejects bytes that are not a BPLN envelope", () => {
		assert.throws(
			() => parseBitPlanEnvelope(Uint8Array.from([0, 1, 2, 3, 1, 0, 0, 0, 0])),
			(error: unknown) =>
				error instanceof BitPlanEnvelopeError &&
				error.message === "BitPlan envelope is missing BPLN magic.",
		);
	});
});
