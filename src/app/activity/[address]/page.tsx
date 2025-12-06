import Link from "next/link";
import { toBitcoin } from "satoshi-token";
import { Button } from "@/components/ui/button";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const AddressPage = async ({
	params,
}: {
	params: Promise<{ address: string }>;
}) => {
	const { address } = await params;
	const balanceUrl = `${API_HOST}/api/txos/address/${address}/balance`;
	const { promise: balancePromise } = http.customFetch<string>(balanceUrl);
	const balance = Number.parseInt((await balancePromise) || "0", 10);

	// fetch address history
	const historyUrl = `${API_HOST}/api/txos/address/${address}/history`;
	const { promise } = http.customFetch<OrdUtxo[]>(historyUrl);
	const history = await promise;

	return (
		<div className="mx-auto">
			<h1 className="text-3xl font-bold mb-4">Address Details</h1>
			<h2>
				{address} - {toBitcoin(balance)} BSV
			</h2>
			<div className="my-8 mx-auto w-fit">
				<Button asChild size="lg" className="mr-2">
					<Link href={`/activity/${address}/ordinals`}>Ordinals</Link>
				</Button>
				<Button asChild size="lg" className="mr-2">
					<Link href={`/activity/${address}/bsv20`}>BSV20</Link>
				</Button>
				<Button asChild size="lg">
					<Link href={`/activity/${address}/bsv21`}>BSV21</Link>
				</Button>
			</div>
			<div>
				<h2 className="font-bold text-xl">History</h2>
				<ul>
					{history.map((txo) => (
						<li key={txo.txid}>
							<Link href={`/outpoint/${txo.outpoint}`}>{txo.outpoint}</Link>
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
	params: Promise<{ address: string }>;
}) {
	const { address } = await params;
	return {
		title: `Activity for address ${address}`,
		description: `View the activity for the address ${address} on 1satordinals.`,
		openGraph: {
			title: `Activity for address ${address}`,
			description: `View the activity for the address ${address} on 1satordinals.`,
		},
		twitter: {
			card: "summary_large_image",
			title: `Activity for address ${address}`,
			description: `View the activity for the address ${address} on 1satordinals.`,
		},
	};
}
