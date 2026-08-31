import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { WalletOutput } from "@1sat/actions";
import { getOrdinalPresentation } from "../lib/wallet/ordinal-presentation";
import {
	classifyContent,
	getDisplayOutpoint,
	getOriginOutpoint,
} from "../lib/wallet/wallet-output-utils";

const txid = "ab".repeat(32);

function output(outpoint: string, tags: string[]): WalletOutput {
	return { outpoint, tags } as WalletOutput;
}

describe("wallet ordinal display metadata", () => {
	test("accepts both outpoint separators and emits underscore display URLs", () => {
		assert.equal(getDisplayOutpoint(output(`${txid}.3`, [])), `${txid}_3`);
		assert.equal(getDisplayOutpoint(output(`${txid}_3`, [])), `${txid}_3`);
		assert.equal(
			getOriginOutpoint(output(`${txid}.3`, [`origin:${txid}.1`])),
			`${txid}_1`,
		);
	});

	test("does not classify opaque application payloads as images", () => {
		assert.equal(
			classifyContent(output(`${txid}.0`, ["type:application/x-bitplan"])),
			"other",
		);
		assert.equal(
			classifyContent(output(`${txid}.0`, ["type:image/png"])),
			"image",
		);
		assert.equal(classifyContent(output(`${txid}.0`, [])), "other");
	});

	test("labels BitPlan payloads as documents", () => {
		const presentation = getOrdinalPresentation(
			output(`${txid}.0`, ["type:application/x-bitplan"]),
		);
		assert.equal(presentation.kind, "bitplan");
		assert.equal(presentation.name, "BitPlan Document");
		assert.equal(presentation.contentLabel, "BitPlan Document");
		assert.equal(presentation.contentType, "application/x-bitplan");
		assert.equal(presentation.href, `https://bitplan.dev/d/${txid}_0`);
		assert.equal(presentation.artworkUrl, undefined);
	});

	test("uses indexed package metadata for Theme Tokens", () => {
		const presentation = getOrdinalPresentation(output(`${txid}.1`, []), {
			outpoint: `${txid}.1`,
			origin: `${txid}.1`,
			sequence: 0,
			contentType: "ord-fs/json",
			contentLength: 19,
			map: { app: "theme-token", name: "Nightrider" },
		});
		assert.equal(presentation.kind, "theme-token");
		assert.equal(presentation.name, "Nightrider");
		assert.equal(presentation.contentType, "ord-fs/json");
		assert.equal(
			presentation.artworkUrl,
			`https://themetoken.dev/og/${txid}_1.png?v=2`,
		);
		assert.equal(presentation.href, `https://themetoken.dev/preview/${txid}_1`);
	});
});
