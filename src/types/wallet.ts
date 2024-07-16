export enum EncryptDecrypt {
	Encrypt = 0,
	Decrypt = 1,
}

export interface EncryptedBackupJson {
	encryptedBackup?: string;
	pubKey?: string;
	//   fundingChildKey: number;
	//   ordChildKey: number;
}

export interface DecryptedBackupJson {
	ordPk?: string;
	payPk?: string;
	// mnemonic?: string;
}

export enum CreateWalletStep {
	Create = 0,
	Created = 1,
	EnterPassphrase = 2,
	ViewMnemonic = 3,
	VerifyMnemonic = 4,
	Fund = 5,
}

export type Keys = {
  payPk: string;
  ordPk: string;
  mnemonic?: string;
  changeAddressPath?: number;
  ordAddressPath?: number;
}