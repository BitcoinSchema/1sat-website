"use client";

import { Utils } from "@bsv/sdk";

const getKey = async (key: Uint8Array): Promise<CryptoKey> => {
	return await crypto.subtle.importKey(
		"raw",
		key as BufferSource,
		{ name: "AES-CBC" },
		false,
		["encrypt", "decrypt"],
	);
};

export const encryptData = async (
	data: Uint8Array,
	key: Uint8Array,
	iv: Uint8Array,
): Promise<Uint8Array> => {
	const cryptoKey = await getKey(key);
	const encryptedContent = await crypto.subtle.encrypt(
		{ name: "AES-CBC", iv: iv as BufferSource },
		cryptoKey,
		data as BufferSource,
	);

	// Combine IV and encrypted content
	// const result = new Uint8Array(iv.length + encryptedContent.byteLength);
	// result.set(iv);
	// result.set(new Uint8Array(encryptedContent), iv.length);

	// They are already combined
	return new Uint8Array(encryptedContent);
};

export const decryptData = async (
	encryptedData: Uint8Array,
	key: Uint8Array,
): Promise<Uint8Array> => {
	const cryptoKey = await getKey(key);
	const iv = encryptedData.slice(0, 16);
	const encryptedContent = encryptedData.slice(16);

	const decryptedContent = await crypto.subtle.decrypt(
		{ name: "AES-CBC", iv: iv },
		cryptoKey,
		encryptedContent as BufferSource,
	);
	return new Uint8Array(decryptedContent);
};

export const generateEncryptionKey = async (
	passphrase: string,
	publicKey: Uint8Array,
): Promise<Uint8Array> => {
	const encoder = new TextEncoder();
	const salt = await crypto.subtle.digest("SHA-256", publicKey as BufferSource);

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(passphrase) as BufferSource,
		{ name: "PBKDF2" },
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: 1000,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);

	return new Uint8Array(derivedBits);
};

export const generateEncryptionKeyFromPassphrase = async (
	passphrase: string,
	pubKey: string,
): Promise<Uint8Array | undefined> => {
	if (!pubKey) {
		console.error("No public key found. Unable to decrypt.");
		return;
	}

	if (!passphrase || passphrase.length < 6) {
		console.error("Invalid phrase. Too short.");
		return;
	}

	// Decode base64 to bytes using BSV SDK Utils (Legacy behavior)
	const pubKeyArray = Utils.toArray(pubKey, "base64");
	const pubKeyBytes = new Uint8Array(pubKeyArray);

	return await generateEncryptionKey(passphrase, pubKeyBytes);
};
