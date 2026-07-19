import { notFound } from "next/navigation";
import SignerPage from "@/components/pages/signer";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { isValidBase58Address } from "@/utils/validation";

const Signer = async ({ params }: { params: Promise<{ address: string }> }) => {
	const { address } = await params;
	// Reject junk like /signer/null before hitting the upstream API
	if (!isValidBase58Address(address)) {
		notFound();
	}

	let history: OrdUtxo[] = [];
	try {
		const { promise } = http.customFetch<OrdUtxo[]>(
			`${API_HOST}/api/txos/address/${address}/history`,
		);
		history = (await promise) || [];
	} catch (e) {
		console.error("Failed to fetch address history", e);
		notFound();
	}
	return <SignerPage address={address} history={history} />;
};

export default Signer;

export async function generateMetadata() {
	return {
		title: "Transaction History - 1SatOrdinals",
		description: "View your transaction history on 1SatOrdinals.",
		openGraph: {
			title: "Transaction History - 1SatOrdinals",
			description: "View your transaction history on 1SatOrdinals.",
			type: "website",
		},
		twitter: {
			card: "summary",
			title: "Transaction History - 1SatOrdinals",
			description: "View your transaction history on 1SatOrdinals.",
		},
	};
}
