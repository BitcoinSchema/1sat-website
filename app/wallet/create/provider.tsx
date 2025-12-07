"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

interface CreateWalletContextType {
	mnemonic: string | null;
	setMnemonic: (mnemonic: string | null) => void;
}

const CreateWalletContext = createContext<CreateWalletContextType | undefined>(
	undefined,
);

export function CreateWalletProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [mnemonic, setMnemonic] = useState<string | null>(null);

	return (
		<CreateWalletContext.Provider value={{ mnemonic, setMnemonic }}>
			{children}
		</CreateWalletContext.Provider>
	);
}

export function useCreateWallet() {
	const context = useContext(CreateWalletContext);
	if (!context) {
		throw new Error(
			"useCreateWallet must be used within a CreateWalletProvider",
		);
	}
	return context;
}
