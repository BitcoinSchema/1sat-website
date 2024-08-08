interface Place {
	name?: string;
	"@type": "Place";
}

export interface IdentityResult {
	identity: Identity;
	addresses: Address[];
	block: number;
	currentAddress: string;
	firstSeen: number;
	rootAddress: string;
	timestamp: number;
	valid: boolean;
	idKey: string;
}

export interface Identity {
	"@context"?: string;
	"@type"?: string;
	alternateName?: string;
	description?: string;
	homeLocation?: Place;
	url?: string;
	banner?: string;
	logo?: string;
	image?: string;
	email?: string;
	paymail?: string;
	address?: string;
	bitcoinAddress?: string;
}

export interface Address {
	block: number;
	address: string;
	txId: string;
}

export interface IdentityAddressResult {
	idKey: string;
	addresses: Address[];
	firstSeen: number;
	currentAddress: string;
	rootAddress: string;
	timestamp: number;
}

export interface ResultObj {
	status: string;
	result: IdentityAddressResult | IdentityResult;
}

export type ProfileFromJson = {
	xprv: string;
	ids: string | string[];
};

export interface EncryptedIdentityJson {
	encryptedIdentity?: string;
	pubKey?: string;
}
