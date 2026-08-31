import type {
	ListActionsResult,
	WalletAction,
	WalletInterface,
} from "@bsv/sdk";
import {
	isBrc153ReferenceLabel,
	parseBrc153ReferenceLabel,
} from "@bsv/wallet-toolbox-client";

export const ACTION_HISTORY_PAGE_SIZE = 25;

export interface ActionHistoryState {
	identityKey: string | null;
	actions: WalletAction[] | null;
	totalActions: number;
	error: string | null;
}

export function actionHistoryForIdentity(
	history: ActionHistoryState,
	identityKey: string | null,
): ActionHistoryState {
	return history.identityKey === identityKey
		? history
		: { identityKey, actions: null, totalActions: 0, error: null };
}

export function listActionHistoryPage(
	wallet: Pick<WalletInterface, "listActions">,
	offset: number,
): Promise<ListActionsResult> {
	return wallet.listActions({
		labels: [],
		labelQueryMode: "any",
		includeLabels: true,
		limit: ACTION_HISTORY_PAGE_SIZE,
		offset,
	});
}

export function actionReferenceLabel(action: WalletAction): string | undefined {
	return action.labels?.find(
		(label) =>
			isBrc153ReferenceLabel(label) &&
			parseBrc153ReferenceLabel(label) !== undefined,
	);
}

export function ordinaryActionLabels(action: WalletAction): string[] {
	return action.labels?.filter((label) => !isBrc153ReferenceLabel(label)) ?? [];
}

export function actionExplorerUrl(
	txid: string,
	chain: "main" | "test",
): string | undefined {
	if (!/^[0-9a-f]{64}$/i.test(txid)) return undefined;
	const host = chain === "test" ? "test.whatsonchain.com" : "whatsonchain.com";
	return `https://${host}/tx/${txid}`;
}
