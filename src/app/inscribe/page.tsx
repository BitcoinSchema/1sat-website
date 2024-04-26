import InscribePage from "@/components/pages/inscribe";
import { Suspense } from "react";

const Inscribe = () => {
	return (
		<Suspense>
			<InscribePage />
		</Suspense>
	);
};
export default Inscribe;

export async function generateMetadata() {
	return {
		title: `Inscribe BSV20 and BSV21 Tokens - 1SatOrdinals`,
		description: `Inscribe your BSV20 and BSV21 tokens on 1SatOrdinals.`,
		openGraph: {
			title: `Inscribe BSV20 and BSV21 Tokens - 1SatOrdinals`,
			description: `Inscribe your BSV20 and BSV21 tokens on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `Inscribe BSV20 and BSV21 Tokens - 1SatOrdinals`,
			description: `Inscribe your BSV20 and BSV21 tokens on 1SatOrdinals.`,
		},
	};
}
