import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import Link from "next/link";
import { toBitcoin } from "satoshi-bitcoin-ts";

const AddressPage = async ({ params }: { params: { address: string } }) => {
	const balanceUrl = `${API_HOST}/api/txos/address/${params.address}/balance`;
	const { promise: balancePromise } = http.customFetch<string>(balanceUrl);
	const balance = parseInt((await balancePromise) || "0");

	// fetch address history
	const historyUrl = `${API_HOST}/api/txos/address/${params.address}/history`;
	const { promise } = http.customFetch<OrdUtxo[]>(historyUrl);
	const history = await promise;

	return (
		<div className="mx-auto">
			<h1 className="text-3xl font-bold mb-4">Address Details</h1>
			<h2>
				{params.address} - {toBitcoin(balance)} BSV
			</h2>
			<div className="my-8 mx-auto w-fit">
				<Link
					href={`/activity/${params.address}/ordinals`}
					className="btn btn-lg mr-2"
				>
					Ordinals
				</Link>
				<Link
					href={`/activity/${params.address}/bsv20`}
					className="btn btn-lg mr-2"
				>
					BSV20
				</Link>
				<Link
					href={`/activity/${params.address}/bsv21`}
					className="btn btn-lg"
				>
					BSV21
				</Link>
			</div>
			<div>
				<h2 className="font-bold text-xl">History</h2>
				<ul>
					{history.map((txo) => (
						<li key={txo.txid}>
							<Link href={`/outpoint/${txo.outpoint}`}>
								{txo.outpoint}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default AddressPage;

export async function generateMetadata({
	params,
}: {
	params: { address: string };
}) {
	return {
		title: `Activity for address ${params.address}`,
		description: `View the activity for the address ${params.address} on 1satordinals.`,
		openGraph: {
			title: `Activity for address ${params.address}`,
			description: `View the activity for the address ${params.address} on 1satordinals.`,
		},
		twitter: {
			card: "summary_large_image",
			title: `Activity for address ${params.address}`,
			description: `View the activity for the address ${params.address} on 1satordinals.`,
		},
	};
}
