"use client";

import type { OneSatContext } from "@1sat/actions";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

/**
 * Get the OneSatContext for calling @1sat/actions.
 * Returns null when the wallet isn't initialized.
 */
export function useOneSatContext(): OneSatContext | null {
	return useWalletToolbox().oneSatContext;
}
