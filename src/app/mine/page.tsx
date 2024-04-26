import MinePage from "@/components/pages/mine";

const Mine = async () => {
	return <MinePage />;
};
export default Mine;

export async function generateMetadata() {
	return {
		title: `Download POW20 Miner (Beta) - 1SatOrdinals`,
		description: `Download the beta version of our POW20 miner on 1SatOrdinals.`,
		openGraph: {
			title: `Download POW20 Miner (Beta) - 1SatOrdinals`,
			description: `Download the beta version of our POW20 miner on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Download POW20 Miner (Beta) - 1SatOrdinals`,
			description: `Download the beta version of our POW20 miner on 1SatOrdinals.`,
		},
	};
}
