"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";
import type { Keys } from "@/lib/types";
import type { DetectedWalletBackup } from "@/lib/wallet-backup";

interface ImportWalletContextType {
	walletKeys: Keys | null;
	setWalletKeys: (keys: Keys | null) => void;
	encryptedBackup: DetectedWalletBackup | null;
	setEncryptedBackup: (backup: DetectedWalletBackup | null) => void;
}

const ImportWalletContext = createContext<ImportWalletContextType | undefined>(
	undefined,
);

export function ImportWalletProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [walletKeys, setWalletKeys] = useState<Keys | null>(null);
	const [encryptedBackup, setEncryptedBackup] =
		useState<DetectedWalletBackup | null>(null);

	return (
		<ImportWalletContext.Provider
			value={{
				walletKeys,
				setWalletKeys,
				encryptedBackup,
				setEncryptedBackup,
			}}
		>
			{children}
		</ImportWalletContext.Provider>
	);
}

export function useImportWallet() {
	const context = useContext(ImportWalletContext);
	if (!context) {
		throw new Error(
			"useImportWallet must be used within a ImportWalletProvider",
		);
	}
	return context;
}
