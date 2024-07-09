import { ExtendedPrivateKey, P2PKHAddress } from "bsv-wasm";
import { generateMnemonic } from "./mnemonic";
import { DecryptedBackupJson } from "@/types/wallet";

export type WalletKeys = {
	ordPk: string;
	payPk: string;
	mnemonic?: string;
	changeAddressPath?: number | string;
	ordAddressPath?: number | string;
	identityPk?: string;
	identityAddressPath?: number | string;
};

export const findKeysFromMnemonic = async (mnemonic: string) => {
	return new Promise<WalletKeys>((resolve, reject) => {
		const xprivWasm = ExtendedPrivateKey.from_mnemonic(
			Buffer.from(mnemonic, "utf8")
		);

		const payPrivKey = xprivWasm.derive(0);
		const payPk = payPrivKey.get_private_key().to_wif();

		let ordPk;
		let ordPrivKey;
		let ordAddress;

		const timeoutMs = 100000;
		const ts = new Date().getTime();
		let found = false;

		const searchForAddress = (i: number) => {
			// console.log(`Searching for ord address with child key ${i}.`);

			if (new Date().getTime() - ts > timeoutMs && !found) {
				reject(
					new Error(
						"Timeout while searching for the desired address prefix."
					)
				);
				return;
			}

			ordPrivKey = xprivWasm.derive(i);
			ordAddress = P2PKHAddress.from_pubkey(
				ordPrivKey.get_private_key().to_public_key()
			);

			if (ordAddress.to_string().startsWith("1s")) {
				ordPk = ordPrivKey.get_private_key().to_wif();
				found = true;
				console.log(
					`Ord address found! Using child key ${i} for ordinals.`
				);

				resolve({
					mnemonic,
					payPk,
					ordPk,
					changeAddressPath: 0,
					ordAddressPath: i,
				} as WalletKeys);

				return;
			} else {
				setTimeout(() => searchForAddress(i + 1), 0);
			}
		};

		if (!found) {
			searchForAddress(1);
		}
	});
};

export const randomMnemonic: () => Promise<WalletKeys> = () => {
	const mnemonic = generateMnemonic(128);
	return findKeysFromMnemonic(mnemonic);
};
