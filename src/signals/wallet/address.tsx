import { PrivateKey } from "@bsv/sdk";
import { computed } from "@preact/signals-react";
import { ordPk, payPk } from ".";

export const fundingAddress = computed(() => {
	const wif = payPk.value;
	if (!wif) {
		return null;
	}

	return PrivateKey.fromWif(wif).toAddress();
});

export const ordAddress = computed(() => {
	const wif = ordPk.value;
	if (!wif) {
		return null;
	}
	return PrivateKey.fromWif(wif).toAddress();
});
