"use client";

import { useEffect } from "react";
import { initWalletBridge } from "@/lib/walletBridge";
import BridgePromptModal from "@/components/Wallet/BridgePromptModal";

type Props = {
	children: React.ReactNode;
};

const WalletBridgeProvider = ({ children }: Props) => {
	useEffect(() => {
		initWalletBridge();
	}, []);

	return (
		<>
			{children}
			<BridgePromptModal />
		</>
	);
};

export default WalletBridgeProvider;

