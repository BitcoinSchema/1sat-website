import { createWalletIterations, identityPk } from "@/signals/wallet";
import { HD, Mnemonic, type PrivateKey } from "@bsv/sdk";

export type WalletKeys = {
	ordPk: string;
	payPk: string;
	mnemonic?: string;
	changeAddressPath?: number | string;
	ordAddressPath?: number | string;
	identityPk?: string;
	identityAddressPath?: number | string;
};

export const derivePathFromMnemonic = ( 
  mnemonic: string,
  path: string,
): PrivateKey => {
  const seed = Mnemonic.fromString(mnemonic).toSeed();
  const masterNode = HD.fromSeed(seed);
  const privKey = masterNode.derive(path);
  return privKey.privKey;
}

export const getKeysFromMnemonicAndPaths = (
	mnemonic: string,
	paths: {
		changeAddressPath: string;
		ordAddressPath: string;
		identityAddressPath?: string;
	},
): WalletKeys => {
	const seed = Mnemonic.fromString(mnemonic).toSeed();
	const masterNode = HD.fromSeed(seed);

  const changeAddressPath = paths.changeAddressPath.startsWith('m/') ? paths.changeAddressPath : `m/${paths.changeAddressPath}`;
	const payPrivKey = masterNode.derive(changeAddressPath);
	const payPk = payPrivKey.privKey.toWif();

  const ordAddressPath = paths.ordAddressPath.startsWith('m/') ? paths.ordAddressPath : `m/${paths.ordAddressPath}`;
	const ordPrivKey = paths.ordAddressPath === "m" ? masterNode : masterNode.derive(ordAddressPath);
	const ordPk = ordPrivKey.privKey.toWif();

  let identityPk: string | null = null;
	if (paths.identityAddressPath) {
	  const identityPrivKey = paths.identityAddressPath
	  ? masterNode.derive(`m/${paths.identityAddressPath}`)
	  : null;
	  identityPk = identityPrivKey ? identityPrivKey.privKey.toWif() : null;
	}

	const keys = {
		mnemonic,
		payPk,
		ordPk,
		changeAddressPath: paths.changeAddressPath,
		ordAddressPath: paths.ordAddressPath,
	} as WalletKeys;

  if (identityPk) {
    keys.identityPk = identityPk;
    keys.identityAddressPath = paths.identityAddressPath;
  }

  return keys;
};

export const findKeysFromMnemonic = async (mnemonic: string) => {
	return new Promise<WalletKeys>((resolve, reject) => {
		const seed = Mnemonic.fromString(mnemonic).toSeed();
		const masterNode = HD.fromSeed(seed);

		// const xprivWasm = ExtendedPrivateKey.from_mnemonic(
		// 	Buffer.from(mnemonic, "utf8")
		// );

		const payPrivKey = masterNode.derive("m/0");
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
					new Error("Timeout while searching for the desired address prefix."),
				);
				return;
			}

			ordPrivKey = masterNode.derive(`m/${i}`);
			ordAddress = ordPrivKey.privKey.toAddress();

			if (ordAddress.startsWith("1s")) {
				ordPk = ordPrivKey.privKey.toWif();
				found = true;
				console.log(`Ord address found! Using child key ${i} for ordinals.`);

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
