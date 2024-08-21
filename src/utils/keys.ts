import { createWalletIterations } from '@/signals/wallet';
import { HD, Mnemonic } from '@bsv/sdk';

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
		const seed = Mnemonic.fromString(mnemonic).toSeed();
  		const masterNode = HD.fromSeed(seed);
		
		// const xprivWasm = ExtendedPrivateKey.from_mnemonic(
		// 	Buffer.from(mnemonic, "utf8")
		// );

		const payPrivKey = masterNode.derive('m/0');
		const payPk = payPrivKey.privKey.toWif();

		let ordPk;
		let ordPrivKey;
		let ordAddress;

		const timeoutMs = 100000;
		const ts = new Date().getTime();
		let found = false;

		const searchForAddress = (i: number) => {
			console.log(`Searching for ord address with child key ${i}.`);
      createWalletIterations.value = i;
			if (new Date().getTime() - ts > timeoutMs && !found) {
				reject(
					new Error(
						"Timeout while searching for the desired address prefix."
					)
				);
				return;
			}

			ordPrivKey = masterNode.derive(`m/${i}`);
			ordAddress = ordPrivKey.privKey.toAddress();

			if (ordAddress.startsWith("1s")) {
				ordPk = ordPrivKey.privKey.toWif();
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
			}
      setTimeout(() => searchForAddress(i + 1), 0);
		};

		if (!found) {
			searchForAddress(1);
		}
	});
};

export const randomMnemonic: () => Promise<WalletKeys> = () => {
	return findKeysFromMnemonic(Mnemonic.fromRandom(128).toString());
};
