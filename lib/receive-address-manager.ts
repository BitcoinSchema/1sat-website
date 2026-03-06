"use client";

import {
	type AddressDerivation,
	AddressManager,
	BRC29_PROTOCOL_ID,
} from "@1sat/wallet-remote";
import { PublicKey, Utils, type WalletInterface } from "@bsv/sdk";
import type { ReceiveAddressState } from "@/lib/receive-address-state";

export const RECEIVE_ADDRESS_PREFIX = "1sat";
export const RECEIVE_ADDRESS_WINDOW = 5;

interface DeriveAddressArgs {
	wallet: WalletInterface;
	identityKey: string;
	index: number;
	prefix?: string;
	originator?: string;
}

interface BuildManagerArgs {
	wallet: WalletInterface;
	identityKey: string;
	state: ReceiveAddressState;
	prefix?: string;
	originator?: string;
}

interface AdvanceManagerArgs {
	wallet: WalletInterface;
	identityKey: string;
	state: ReceiveAddressState;
	addressManager: AddressManager;
	rotationOutpoint: string;
	prefix?: string;
	originator?: string;
}

interface AdvanceManagerResult {
	addressManager: AddressManager;
	state: ReceiveAddressState;
	depositAddress: string;
	appended: AddressDerivation[];
}

export interface ReceiveManagerInitResult {
	addressManager: AddressManager;
	state: ReceiveAddressState;
	depositAddress: string;
}

function toBase64Prefix(prefix: string): string {
	const encoded = new TextEncoder().encode(prefix);
	return Utils.toBase64(Array.from(encoded));
}

function toBase64Suffix(index: number): string {
	if (!Number.isInteger(index) || index < 0 || index > 0xffff_ffff) {
		throw new Error(
			`Unsupported receive index ${index}. Must be an integer between 0 and 4294967295.`,
		);
	}
	const bytes = [
		(index >>> 24) & 0xff,
		(index >>> 16) & 0xff,
		(index >>> 8) & 0xff,
		index & 0xff,
	];
	return Utils.toBase64(bytes);
}

async function callGetPublicKey(
	wallet: WalletInterface,
	args: {
		protocolID: typeof BRC29_PROTOCOL_ID;
		keyID: string;
		forSelf: boolean;
	},
	originator?: string,
): Promise<{ publicKey: string }> {
	if (originator) {
		return (await wallet.getPublicKey(args, originator)) as {
			publicKey: string;
		};
	}
	return (await wallet.getPublicKey(args)) as { publicKey: string };
}

export async function deriveReceiveAddress({
	wallet,
	identityKey,
	index,
	prefix = RECEIVE_ADDRESS_PREFIX,
	originator,
}: DeriveAddressArgs): Promise<AddressDerivation> {
	const derivationPrefix = toBase64Prefix(prefix);
	const derivationSuffix = toBase64Suffix(index);
	const keyID = `${derivationPrefix} ${derivationSuffix}`;
	const result = await callGetPublicKey(
		wallet,
		{
			protocolID: BRC29_PROTOCOL_ID,
			keyID,
			forSelf: true,
		},
		originator,
	);
	const address = PublicKey.fromString(result.publicKey).toAddress().toString();

	return {
		address,
		index,
		derivationPrefix,
		derivationSuffix,
		senderIdentityKey: identityKey,
		publicKey: result.publicKey,
	};
}

export function getDepositAddress(
	addressManager: AddressManager,
	state: ReceiveAddressState,
): string {
	const current = addressManager.getAddressAtIndex(state.currentIndex);
	if (current?.address) {
		return current.address;
	}
	return addressManager.getPrimaryAddress() ?? "";
}

export function getActiveReceiveAddresses(
	addressManager: AddressManager,
	state: ReceiveAddressState,
): string[] {
	const addresses: string[] = [];
	const lastIndex = state.currentIndex + state.windowSize - 1;

	for (let index = state.currentIndex; index <= lastIndex; index++) {
		const derivation = addressManager.getAddressAtIndex(index);
		if (derivation?.address) {
			addresses.push(derivation.address);
		}
	}

	return addresses;
}

export async function buildReceiveAddressManager({
	wallet,
	identityKey,
	state,
	prefix = RECEIVE_ADDRESS_PREFIX,
	originator,
}: BuildManagerArgs): Promise<ReceiveManagerInitResult> {
	const derivations: AddressDerivation[] = [];
	for (let i = 0; i <= state.maxDerivedIndex; i++) {
		derivations.push(
			await deriveReceiveAddress({
				wallet,
				identityKey,
				index: i,
				prefix,
				originator,
			}),
		);
	}

	const addressManager = new AddressManager(derivations);
	return {
		addressManager,
		state,
		depositAddress: getDepositAddress(addressManager, state),
	};
}

export async function advanceReceiveAddress({
	wallet,
	identityKey,
	state,
	addressManager,
	rotationOutpoint,
	prefix = RECEIVE_ADDRESS_PREFIX,
	originator,
}: AdvanceManagerArgs): Promise<AdvanceManagerResult> {
	const nextState: ReceiveAddressState = {
		...state,
		currentIndex: state.currentIndex + 1,
		lastRotationOutpoint: rotationOutpoint,
		updatedAt: Date.now(),
	};
	const targetMax = Math.max(
		state.maxDerivedIndex,
		nextState.currentIndex + state.windowSize - 1,
	);

	const appended: AddressDerivation[] = [];
	for (let i = state.maxDerivedIndex + 1; i <= targetMax; i++) {
		const derivation = await deriveReceiveAddress({
			wallet,
			identityKey,
			index: i,
			prefix,
			originator,
		});
		addressManager.addAddress(derivation);
		appended.push(derivation);
	}

	nextState.maxDerivedIndex = targetMax;

	return {
		addressManager,
		state: nextState,
		depositAddress: getDepositAddress(addressManager, nextState),
		appended,
	};
}
