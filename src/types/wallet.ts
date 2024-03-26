export enum EncryptDecrypt {
	Encrypt,
	Decrypt,
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
	Create,
	Created,
	EnterPassphrase,
	ViewMnemonic,
	VerifyMnemonic,
	Fund,
}
