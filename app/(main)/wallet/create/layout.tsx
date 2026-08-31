import { LocalWalletOnly } from "@/components/wallet/local-wallet-only";
import { CreateWalletProvider } from "./provider";

export default function CreateWalletLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<LocalWalletOnly requireEmpty>
			<CreateWalletProvider>{children}</CreateWalletProvider>
		</LocalWalletOnly>
	);
}
