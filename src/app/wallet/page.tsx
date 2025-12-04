import WalletHome from "@/components/Wallet/home";

const WalletPage = () => {
	return (
		<div className="w-full flex-1 flex flex-col px-4 md:px-6 lg:px-8">
			<WalletHome />
		</div>
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
