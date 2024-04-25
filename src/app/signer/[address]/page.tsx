import SignerPage from "@/components/pages/signer";
import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Signer = async ({ params }: { params: { address: string } }) => {
	const { promise } = http.customFetch<OrdUtxo[]>(
		`${API_HOST}/api/txos/address/${params.address}/history`
	);
	const history = await promise;
	return <SignerPage {...params} history={history} />;
};

export default Signer;

export async function generateMetadata() {
	return {
		title: `Transaction History - 1SatOrdinals`,
		description: `View your transaction history on 1SatOrdinals.`,
		openGraph: {
			title: `Transaction History - 1SatOrdinals`,
			description: `View your transaction history on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Transaction History - 1SatOrdinals`,
			description: `View your transaction history on 1SatOrdinals.`,
		},
	};
}
