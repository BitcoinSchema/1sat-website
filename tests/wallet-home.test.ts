import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PrivateKey } from "@bsv/sdk";
import {
	formatSatoshisAsBsv,
	isP2pkhAddressForChain,
	parseBsvAmount,
	sendFailureMessage,
} from "@/components/wallet/wallet-home-utils";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("wallet home amount parsing", () => {
	it("accepts exact BSV amounts and rejects unsafe inputs", () => {
		assert.equal(parseBsvAmount("0.00000001"), 1);
		assert.equal(parseBsvAmount("1.25"), 125_000_000);
		assert.equal(parseBsvAmount(" 2 "), 200_000_000);
		assert.equal(parseBsvAmount("0"), null);
		assert.equal(parseBsvAmount("1.000000001"), null);
		assert.equal(parseBsvAmount("1e-8"), null);
		assert.equal(parseBsvAmount("90071992.54740991"), Number.MAX_SAFE_INTEGER);
		assert.equal(parseBsvAmount("90071992.54740992"), null);
		assert.equal(
			formatSatoshisAsBsv(Number.MAX_SAFE_INTEGER),
			"90071992.54740991",
		);
	});

	it("accepts only P2PKH addresses for the active chain", () => {
		const publicKey = PrivateKey.fromHex("01".repeat(32)).toPublicKey();
		const mainnet = publicKey.toAddress("mainnet");
		const testnet = publicKey.toAddress("testnet");

		assert.equal(isP2pkhAddressForChain(mainnet, "main"), true);
		assert.equal(isP2pkhAddressForChain(mainnet, "test"), false);
		assert.equal(isP2pkhAddressForChain(testnet, "test"), true);
		assert.equal(isP2pkhAddressForChain(testnet, "main"), false);
		assert.equal(isP2pkhAddressForChain("not-an-address", "main"), false);
	});

	it("maps wallet failures without exposing provider payloads", () => {
		assert.match(sendFailureMessage("user rejected request"), /declined/);
		assert.match(sendFailureMessage("insufficient funds"), /enough spendable/);
		assert.match(
			sendFailureMessage({ secret: "do not display" }),
			/connection/,
		);
		assert.doesNotMatch(
			sendFailureMessage({ secret: "do not display" }),
			/secret|do not display/,
		);
	});

	it("keeps the provider-neutral action path isolated and invalidates history", () => {
		const source = read("components/wallet/wallet-home-actions.tsx");
		assert.doesNotMatch(
			source,
			/@\/providers\/wallet-provider|@\/lib\/wallet-(?:storage|backup|migration)|\bindexedDB\b|\bwalletKeys\b|\brootKey\b/,
		);
		assert.match(source, /sendBsv\.execute\(oneSatContext/);
		assert.match(source, /queryKey: \["wallet-actions"\]/);
		assert.match(source, /refreshBalance\(\)/);
		assert.match(source, /OPL-4014/);
		assert.match(source, /OPL-4015/);
	});
});
