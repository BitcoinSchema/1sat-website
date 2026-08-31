import {
	type AbortActionArgs,
	type AbortActionResult,
	Beef,
	type CreateActionArgs,
	type CreateActionResult,
	type InternalizeActionArgs,
	type InternalizeActionResult,
	type ListActionsArgs,
	type ListActionsResult,
	type ListOutputsArgs,
	type ListOutputsResult,
	LockingScript,
	type RelinquishOutputArgs,
	type RelinquishOutputResult,
	type SignActionArgs,
	type SignActionResult,
	Transaction,
	Validation,
	type WalletInterface,
} from "@bsv/sdk";
import { makeBrc153ReferenceLabel } from "@bsv/wallet-toolbox-client";

export const ACTION_METHODS = [
	"createAction",
	"signAction",
	"abortAction",
	"listActions",
	"internalizeAction",
	"listOutputs",
	"relinquishOutput",
] as const;

export type ActionMethod = (typeof ACTION_METHODS)[number];

export interface ActionVector {
	id: string;
	method: ActionMethod;
	args: object;
	result: object;
	standards: string[];
}

const TXID_A = "11".repeat(32);
const TXID_B = "22".repeat(32);
const REFERENCE = "AQID";
const ORIGIN_OUTPOINT = `${TXID_A}.0`;

const atomicFixture = (): Uint8Array => {
	const transaction = new Transaction();
	transaction.addOutput({
		satoshis: 1,
		lockingScript: LockingScript.fromHex("51"),
	});
	const beef = new Beef();
	beef.mergeTransaction(transaction);
	return Uint8Array.from(beef.toBinaryAtomic(transaction.id("hex")));
};

const ATOMIC_BEEF = atomicFixture();

export const ACTION_VECTORS: readonly ActionVector[] = [
	{
		id: "create/no-input",
		method: "createAction",
		args: {
			description: "Create conformance output",
			outputs: [
				{
					lockingScript: "51",
					satoshis: 1,
					outputDescription: "Conformance output",
				},
			],
		} satisfies CreateActionArgs,
		result: {
			txid: TXID_A,
			tx: new Uint8Array([0, 1, 254, 255]),
		} satisfies CreateActionResult,
		standards: ["BRC-100", "BRC-95"],
	},
	{
		id: "create/no-send",
		method: "createAction",
		args: {
			description: "Create no send output",
			outputs: [
				{
					lockingScript: "51",
					satoshis: 1,
					outputDescription: "No send output",
				},
			],
			options: { noSend: true, randomizeOutputs: false },
		} satisfies CreateActionArgs,
		result: {
			txid: TXID_A,
			tx: new Uint8Array([1, 2, 255]),
			noSendChange: [`${TXID_A}.1`],
		} satisfies CreateActionResult,
		standards: ["BRC-100", "BRC-95"],
	},
	{
		id: "create/send-with",
		method: "createAction",
		args: {
			description: "Send prior action batch",
			outputs: [
				{
					lockingScript: "51",
					satoshis: 1,
					outputDescription: "Batch output",
				},
			],
			options: { sendWith: [TXID_A], returnTXIDOnly: true },
		} satisfies CreateActionArgs,
		result: {
			txid: TXID_B,
			sendWithResults: [{ txid: TXID_A, status: "sending" }],
		} satisfies CreateActionResult,
		standards: ["BRC-100"],
	},
	{
		id: "create/input-beef-signable",
		method: "createAction",
		args: {
			description: "Spend external input",
			inputBEEF: new Uint8Array([1, 2, 255]),
			inputs: [
				{
					outpoint: ORIGIN_OUTPOINT,
					inputDescription: "External input",
					unlockingScriptLength: 1,
				},
			],
			outputs: [
				{
					lockingScript: "51",
					satoshis: 1,
					outputDescription: "Spend output",
				},
			],
			options: { signAndProcess: false },
		} satisfies CreateActionArgs,
		result: {
			signableTransaction: {
				tx: new Uint8Array([3, 2, 1, 0]),
				reference: REFERENCE,
			},
		} satisfies CreateActionResult,
		standards: ["BRC-62", "BRC-95", "BRC-100", "BRC-153"],
	},
	{
		id: "sign/no-send",
		method: "signAction",
		args: {
			reference: REFERENCE,
			spends: { 0: { unlockingScript: "51" } },
			options: { noSend: true },
		} satisfies SignActionArgs,
		result: {
			txid: TXID_A,
			tx: new Uint8Array([4, 5, 255]),
		} satisfies SignActionResult,
		standards: ["BRC-95", "BRC-100", "BRC-153"],
	},
	{
		id: "abort/reference",
		method: "abortAction",
		args: { reference: REFERENCE } satisfies AbortActionArgs,
		result: { aborted: true } satisfies AbortActionResult,
		standards: ["BRC-100", "BRC-153"],
	},
	{
		id: "list-actions/time-and-reference",
		method: "listActions",
		args: {
			labels: [
				"action time from 1700000000000",
				"action time to 1800000000000",
				"conformance",
			],
			includeLabels: true,
			includeOutputs: true,
		} satisfies ListActionsArgs,
		result: {
			totalActions: 1,
			actions: [
				{
					txid: TXID_A,
					satoshis: 1,
					status: "unsigned",
					isOutgoing: true,
					description: "Conformance action",
					labels: [
						"conformance",
						"action time 1750000000000",
						makeBrc153ReferenceLabel(REFERENCE),
					],
					version: 1,
					lockTime: 0,
				},
			],
		} satisfies ListActionsResult,
		standards: ["BRC-100", "BRC-114", "BRC-153"],
	},
	{
		id: "internalize/basket-id",
		method: "internalizeAction",
		args: {
			tx: ATOMIC_BEEF,
			outputs: [
				{
					outputIndex: 0,
					protocol: "basket insertion",
					insertionRemittance: {
						basket: "conformance outputs",
						tags: ["id:fixture-1"],
					},
				},
			],
			description: "Internalize test action",
			labels: ["conformance"],
		} satisfies InternalizeActionArgs,
		result: { accepted: true } satisfies InternalizeActionResult,
		standards: ["BRC-95", "BRC-100", "BRC-164"],
	},
	{
		id: "list-outputs/id-tag",
		method: "listOutputs",
		args: {
			basket: "conformance outputs",
			tags: ["id:fixture-1"],
			include: "entire transactions",
			includeTags: true,
		} satisfies ListOutputsArgs,
		result: {
			totalOutputs: 1,
			BEEF: new Uint8Array([0, 127, 255]),
			outputs: [
				{
					satoshis: 1,
					spendable: true,
					outpoint: ORIGIN_OUTPOINT,
					tags: ["id:fixture-1"],
				},
			],
		} satisfies ListOutputsResult,
		standards: ["BRC-62", "BRC-100", "BRC-164"],
	},
	{
		id: "list-outputs/balance",
		method: "listOutputs",
		args: {
			basket: "balance conformance outputs",
			tags: ["id:fixture-1"],
			limit: 1,
			offset: 5,
		} satisfies ListOutputsArgs,
		result: { totalOutputs: 42, outputs: [] } satisfies ListOutputsResult,
		standards: ["BRC-100", "BRC-112", "BRC-164"],
	},
	{
		id: "relinquish/output",
		method: "relinquishOutput",
		args: {
			basket: "conformance outputs",
			output: ORIGIN_OUTPOINT,
		} satisfies RelinquishOutputArgs,
		result: { relinquished: true } satisfies RelinquishOutputResult,
		standards: ["BRC-100"],
	},
];

export const validateActionArgs = (
	method: ActionMethod,
	args: object,
): object => {
	switch (method) {
		case "createAction":
			return Validation.validateCreateActionArgs(args as CreateActionArgs);
		case "signAction":
			return Validation.validateSignActionArgs(args as SignActionArgs);
		case "abortAction":
			return Validation.validateAbortActionArgs(args as AbortActionArgs);
		case "listActions":
			return Validation.validateListActionsArgs(args as ListActionsArgs);
		case "internalizeAction":
			return Validation.validateInternalizeActionArgs(
				args as InternalizeActionArgs,
			);
		case "listOutputs":
			return Validation.validateListOutputsArgs(args as ListOutputsArgs);
		case "relinquishOutput":
			return Validation.validateRelinquishOutputArgs(
				args as RelinquishOutputArgs,
			);
	}
};

export type ActionWallet = Pick<WalletInterface, ActionMethod>;
