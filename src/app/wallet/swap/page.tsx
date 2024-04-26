import SwapKeysPage from "@/components/pages/swapKeys";

const SwapKeys = () => {
	return <SwapKeysPage />;
};

export default SwapKeys;

export async function generateMetadata() {
	return {
		title: `Swap Wallets - 1SatOrdinals`,
		description: `Swap your Ordinal and BSV wallets on 1SatOrdinals.`,
		openGraph: {
			title: `Swap Wallets - 1SatOrdinals`,
			description: `Swap your Ordinal and BSV wallets on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Swap Wallets - 1SatOrdinals`,
			description: `Swap your Ordinal and BSV wallets on 1SatOrdinals.`,
		},
	};
}
