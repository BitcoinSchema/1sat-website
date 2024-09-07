"use client";

import { BAP } from "bsv-bap";
import { encryptionPrefix } from "@/constants";
import {
	decryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/utils/encryption";
import type {
	ResultObj,
	IdentityResult,
	ProfileFromJson,
	EncryptedIdentityJson,
} from "@/types/identity";
import {
	identitiesLoading,
	bapIdentityRaw,
	bapIdentities,
	bapIdEncryptionKey,
	activeBapIdentity,
	selectedBapIdentity,
	hasIdentityBackup,
	availableIdentities,
} from "./index";
import { HD } from "@bsv/sdk";
import { identityPk } from "../wallet";

export const setBapIdentity = (importedProfile: ProfileFromJson) => {
	identitiesLoading.value = true;
	bapIdentityRaw.value = importedProfile;
	extractIdentities();
};

const getIdentityAddress = async (idKey: string) => {
	const resp = fetch("/api/identity/get", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ idKey: idKey }),
	});
	return (await resp).json();
};

const getIdentityByAddress = async (resultObj: ResultObj) => {
	const resp = fetch("/api/identity/validByAddress", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			address: resultObj?.result?.currentAddress,
		}),
	});
	return (await resp).json();
};

export const extractIdentities = async () => {
	if (!bapIdentityRaw.value) return;
debugger
	const bapIdRaw = bapIdentityRaw.value;
	const bapId = new BAP(bapIdRaw.xprv);
	bapId.importEncryptedIds(bapIdRaw.ids as string);
	// const path = bapId.lastIdPath;
	// const key = HD.fromString(bapIdRaw.xprv).derive(path);
	// identityPk.value = key.privKey.toWif();
	// const addressFromLastPath = key.privKey.toAddress();

	const ids = bapId.listIds();
	if (!ids.length) {
		identitiesLoading.value = false;
		return;
	}

	const resultsWithAddresses = await Promise.all(
		ids.map((id: string) => getIdentityAddress(id)),
	);
	if (!resultsWithAddresses.length) {
		identitiesLoading.value = false;
		return;
	}

	const resultsWithIdentities = await Promise.all(
		resultsWithAddresses.map((resultObj: ResultObj) =>
			getIdentityByAddress(resultObj),
		),
	);

	if (!resultsWithIdentities.length) {
		identitiesLoading.value = false;
		return;
	}

	// TODO: check that the address from the last path is the same as the address from the identity
	bapIdentities.value = resultsWithIdentities.filter((resultObj: ResultObj) => {
		return resultObj.status === "OK";
	}).map((id) => id.result) as IdentityResult[];

  console.log({bapIdentities: bapIdentities.value})
	identitiesLoading.value = false;
};

export const loadIdentityFromSessionStorage = () => {
	const activeId = sessionStorage.getItem("activeIdentity");
	if (activeId) {
		activeBapIdentity.value = JSON.parse(activeId);
	}

	const availableId = sessionStorage.getItem("availableIdentities");
	if (availableId) {
		availableIdentities.value = JSON.parse(availableId);
	}
	return {
		activeId: activeBapIdentity.value,
		availableIDs: availableIdentities.value,
	};
};

export const removeIdentity = () => {
	bapIdEncryptionKey.value = null;
	bapIdentityRaw.value = null;
	bapIdentities.value = null;
	identitiesLoading.value = false;
	activeBapIdentity.value = null;
	selectedBapIdentity.value = null;
	hasIdentityBackup.value = false;
	availableIdentities.value = null;

	localStorage.removeItem("encryptedIdentity");
	sessionStorage.removeItem("activeIdentity");
	localStorage.removeItem("encryptedAllIdentities");
	sessionStorage.removeItem("availableIdentities");
};

export const loadAvailableIdentitiesFromEncryptedStorage = async (
	passphrase: string,
) => {
	const allIdentitiesStr = localStorage.getItem("encryptedAllIdentities");
	if (!allIdentitiesStr) {
		return false;
	}
	const encryptedIdentitiesParts = JSON.parse(allIdentitiesStr);
	if (
		!encryptedIdentitiesParts.pubKey ||
		!encryptedIdentitiesParts.encryptedAllIdentities
	) {
		throw new Error(
			"Load identity error - No public key or encryptedIdentities props found in encrypted backup",
		);
	}

	const encryptionKey = await generateEncryptionKeyFromPassphrase(
		passphrase,
		encryptedIdentitiesParts.pubKey,
	);

	if (!encryptionKey) {
		throw new Error("No encryption key found. Unable to decrypt.");
	}

	let decryptedBackupBin: Uint8Array;

	try {
		decryptedBackupBin = await decryptData(
			Buffer.from(
				encryptedIdentitiesParts.encryptedAllIdentities.replace(
					encryptionPrefix,
					"",
				),
				"base64",
			),
			encryptionKey,
		);
	} catch (error) {
		console.log(error);
		return false;
	}

	const decryptedBackupStr = Buffer.from(decryptedBackupBin).toString("utf-8");

	const { allBapIdentities: availableIdentitiesBackup } =
		JSON.parse(decryptedBackupStr);

	availableIdentities.value = availableIdentitiesBackup;
	setIdentitySessionStorage(availableIdentitiesBackup);

	return true;
};

export const loadIdentityFromEncryptedStorage = async (passphrase: string) => {
	const encryptedIdentityStr = localStorage.getItem("encryptedIdentity");

	if (!encryptedIdentityStr) {
		return false;
	}
	const encryptedIdentityParts = JSON.parse(
		encryptedIdentityStr,
	) as EncryptedIdentityJson;

	if (
		!encryptedIdentityParts.pubKey ||
		!encryptedIdentityParts.encryptedIdentity
	) {
		throw new Error(
			"Load identity error - No public key or encryptedIdentity props found in encrypted backup",
		);
	}

	const encryptionKey = await generateEncryptionKeyFromPassphrase(
		passphrase,
		encryptedIdentityParts.pubKey,
	);

	if (!encryptionKey) {
		throw new Error("No encryption key found. Unable to decrypt.");
	}

	let decryptedBackupBin: Uint8Array;

	try {
		decryptedBackupBin = await decryptData(
			Buffer.from(
				encryptedIdentityParts.encryptedIdentity.replace(encryptionPrefix, ""),
				"base64",
			),
			encryptionKey,
		);
	} catch (error) {
		console.log(error);
		return false;
	}

	const decryptedBackupStr = Buffer.from(decryptedBackupBin).toString("utf-8");

	const { activeBapIdentity: activeIdentityBackup } =
		JSON.parse(decryptedBackupStr);

	if (!activeIdentityBackup?.identity) {
		return false;
	}

	activeBapIdentity.value = activeIdentityBackup;
	setIdentitySessionStorage(activeIdentityBackup);

	return true;
};

export const setIdentitySessionStorage = (
	identity: IdentityResult | IdentityResult[],
) => {
	console.log({ identity });
	if (!identity) return;
	if (Array.isArray(identity)) {
		const availablIdentitiesString = JSON.stringify(identity);
		sessionStorage.setItem("availableIdentities", availablIdentitiesString);
	} else {
		const activeIdentityString = JSON.stringify(identity);
		sessionStorage.setItem("activeIdentity", activeIdentityString);
	}
};
