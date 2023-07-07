export type WocUtxo = {
  height: number;
  tx_hash: string;
  tx_pos: number;
  value: number;
};

export interface EncryptedBackupJson {
  encryptedBackup?: string;
  pubKey?: string;
  fundingChildKey: number;
  ordChildKey: number;
}

export interface DecryptedBackupJson {
  ordPk?: string;
  payPk?: string;
}

export enum EncryptDecrypt {
  Encrypt,
  Decrypt,
}
