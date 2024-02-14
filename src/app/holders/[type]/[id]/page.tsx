import JDenticon from "@/components/JDenticon";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import Link from "next/link";
import React from "react";

interface Holder {
	address: string;
	amt: string;
}
const Page = async ({
	params,
}: {
	params: { type: AssetType; id: string };
}) => {
	const url =
		params.type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${params.id}/holders`
			: `${API_HOST}/api/bsv20/id/${params.id}/holders`;
	const detailsUrl =
		params.type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${params.id}`
			: `${API_HOST}/api/bsv20/id/${params.id}`;

	const { promise: promiseDetails } = http.customFetch<BSV20>(detailsUrl);
	const details = await promiseDetails;

	const { promise } = http.customFetch<Holder[]>(`${url}?limit=100`);
	console.log({ url: `${url}?limit=100` });
	const holders = (await promise)
		.sort((a, b) => {
			return parseInt(a.amt) > parseInt(b.amt) ? -1 : 1;
		})
		.map((h) => {
      const supply = details.supply|| details.amt;
			return {
				...h,
				amt: parseInt(h.amt) / 10 ** (details.dec || 0),
				pct: supply
					? (parseInt(h.amt) / parseInt(supply)) * 100
					: 0,
			};
		});
	return (
		<div className="mx-auto flex flex-col max-w-5xl w-full">
			<h1 className="text-xl px-6">{params.id} Ownership Breakdown</h1>
			<div className="divider" />
			<div className="w-full">
				<div className="grid grid-template-columns-3 p-6">
					<div className="">Address</div>
					<div className="w-24 text-right">Holdings</div>
					<div className="w-12 text-right">Ownership</div>
					<div className="divider col-span-3" />
					{(holders || []).map((h) => {
						const pctWidth = `${h.pct}%`;
						return (
							<React.Fragment key={`${params.id}-holder-${h.address}`}>
								<Link
									className="flex items-center text-sm flex-1"
									href={`/activity/${h.address}/ordinals`}
								>
									<JDenticon hashOrValue={h.address} className="w-8 h-8 mr-2" />
									<span className="hidden md:block">{h.address}</span>
								</Link>
								<div className="w-24 text-right">{h.amt}</div>
								<div className="w-24 text-right">{h.pct.toFixed(4)}%</div>
								<div className="flex items-center mb-2 relative col-span-3">
									<div
										className="w-full bg-warning/25 rounded h-1"
										style={{ width: pctWidth }}
									>
										&nbsp;
									</div>
								</div>
							</React.Fragment>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default Page;
