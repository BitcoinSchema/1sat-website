import { LocalWalletOnly } from "@/components/wallet/local-wallet-only";
import { ImportWalletProvider } from "./provider";

export default function ImportLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<LocalWalletOnly requireEmpty>
			<ImportWalletProvider>{children}</ImportWalletProvider>
		</LocalWalletOnly>
	);
}
