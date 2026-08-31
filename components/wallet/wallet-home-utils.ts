import { Utils } from "@bsv/sdk";

const BSV_AMOUNT = /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/;
const SATOSHIS_PER_BSV = 100_000_000n;

export function parseBsvAmount(value: string): number | null {
	const normalized = value.trim();
	if (!BSV_AMOUNT.test(normalized)) return null;

	try {
		const [whole, fraction = ""] = normalized.split(".");
		const satoshis =
			BigInt(whole) * SATOSHIS_PER_BSV + BigInt(fraction.padEnd(8, "0"));
		if (satoshis <= 0n || satoshis > BigInt(Number.MAX_SAFE_INTEGER)) {
			return null;
		}
		return Number(satoshis);
	} catch {
		return null;
	}
}

export function formatSatoshisAsBsv(satoshis: number): string {
	const value = BigInt(satoshis);
	const whole = value / SATOSHIS_PER_BSV;
	const fraction = (value % SATOSHIS_PER_BSV).toString().padStart(8, "0");
	return `${whole}.${fraction}`;
}

export function sendFailureMessage(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	const normalized = message.toLowerCase();
	if (
		normalized.includes("denied") ||
		normalized.includes("reject") ||
		normalized.includes("cancel") ||
		normalized.includes("declined")
	) {
		return "The wallet declined this payment. Your send details were kept.";
	}
	if (
		normalized.includes("insufficient") ||
		normalized.includes("not enough")
	) {
		return "The wallet does not have enough spendable BSV for this amount and its fee.";
	}
	return "The payment could not be sent. Check the wallet connection and try again.";
}

export function isP2pkhAddressForChain(
	value: string,
	chain: "main" | "test",
): boolean {
	try {
		const { data, prefix } = Utils.fromBase58Check(value);
		return (
			data.length === 20 &&
			prefix.length === 1 &&
			prefix[0] === (chain === "main" ? 0x00 : 0x6f)
		);
	} catch {
		return false;
	}
}
