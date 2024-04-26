import CreateWalletPage from "@/components/pages/createWallet";

const WalletPage = async () => {
	return <CreateWalletPage />;
};

export default WalletPage;

export async function generateMetadata() {
	return {
		title: `Create Wallet - 1SatOrdinals`,
		description: `Create your own wallet on 1SatOrdinals.`,
		openGraph: {
			title: `Create Wallet - 1SatOrdinals`,
			description: `Create your own wallet on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Create Wallet - 1SatOrdinals`,
			description: `Create your own wallet on 1SatOrdinals.`,
		},
	};
}
