import WalletOrdinals from "@/components/Wallet/ordinals";
import { WalletTab } from "@/components/Wallet/tabs";
import WalletLayout from "@/components/Wallet/WalletLayout";

const WalletPage = () => {
	return (
		<WalletLayout tab={WalletTab.Ordinals}>
			<WalletOrdinals />
		</WalletLayout>
	);
};

export default WalletPage;

export async function generateMetadata() {
	return {
		title: `Wallet - 1SatOrdinals`,
		description: `Manage your Ordinals, BSV20 and BSV21 tokens in your Wallet on 1SatOrdinals.`,
		openGraph: {
			title: `Wallet - 1SatOrdinals`,
			description: `Manage your BSV20 and BSV21 tokens in your Wallet on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Wallet - 1SatOrdinals`,
			description: `Manage your BSV20 and BSV21 tokens in your Wallet on 1SatOrdinals.`,
		},
	};
}
