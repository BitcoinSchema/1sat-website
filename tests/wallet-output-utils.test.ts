import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { WalletOutput } from "@1sat/actions";
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
});
