import { removeNullKeys } from "@/lib/utils";
import {
	changeAddressPath,
	identityAddressPath,
	identityPk,
	mnemonic,
	ordAddressPath,
	ordPk,
	payPk,
} from "@/signals/wallet";

export const getBalanceText = (balance: number, numDecimals: number) => {
	return balance > 1000000000
		? `${(balance / 1000000000).toFixed(2)}B`
		: balance > 1000000
		? `${(balance / 1000000).toFixed(2)}M`
		: numDecimals > 0
		? balance.toFixed(2)
		: balance.toString();
};

export const backupKeys = () => {
	let payPkDerivationPath = changeAddressPath.value;
	let ordPkDerivationPath = ordAddressPath.value;

	if (typeof changeAddressPath.value === "number") {
		payPkDerivationPath = `m/${changeAddressPath.value}`;
	}

	if (typeof ordAddressPath.value === "number") {
		ordPkDerivationPath = `m/${ordAddressPath.value}`;
	}

	const identityDerivationPath = !identityAddressPath.value || typeof identityAddressPath.value === "number"
		? payPkDerivationPath
		: identityAddressPath.value;

	const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
		JSON.stringify(removeNullKeys({
			mnemonic: mnemonic.value,
			payPk: payPk.value,
			payDerivationPath: payPkDerivationPath,
			ordPk: ordPk.value,
			ordDerivationPath: ordPkDerivationPath,
			identityPk: identityPk.value ?? payPk.value,
			identityDerivationPath: identityDerivationPath,
		}))
	)}`;

	const clicker = document.createElement("a");
	clicker.setAttribute("href", dataStr);
	clicker.setAttribute("download", "1sat.json");
	clicker.click();
};
