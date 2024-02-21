import JDenticon from "@/components/JDenticon";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import { GetStaticPropsContext } from "next";
import Link from "next/link";
import React from "react";

interface Holder {
	address: string;
	amt: string;
	pct: number;
}
interface PageProps {
	holders: Holder[];
	details: BSV20;
	type: AssetType;
	id: string;
}

// const Page = async ({
// 	params,
// }: {
// 	params: { type: AssetType; id: string };
// }) => {
// 	const url =
// 		params.type === AssetType.BSV20
// 			? `${API_HOST}/api/bsv20/tick/${params.id}/holders`
// 			: `${API_HOST}/api/bsv20/id/${params.id}/holders`;
// 	const detailsUrl =
// 		params.type === AssetType.BSV20
// 			? `${API_HOST}/api/bsv20/tick/${params.id}`
// 			: `${API_HOST}/api/bsv20/id/${params.id}`;

// 	const { promise: promiseDetails } = http.customFetch<BSV20>(detailsUrl);
// 	const details = await promiseDetails;

// 	const { promise } = http.customFetch<Holder[]>(`${url}?limit=100`);
// 	console.log({ url: `${url}?limit=100` });
// 	const holders = (await promise)
// 		.sort((a, b) => {
// 			return parseInt(a.amt) > parseInt(b.amt) ? -1 : 1;
// 		})
// 		.map((h) => {
// 			const supply = details.supply || details.amt;
// 			return {
// 				...h,
// 				amt: parseInt(h.amt) / 10 ** (details.dec || 0),
// 				pct: supply ? (parseInt(h.amt) / parseInt(supply)) * 100 : 0,
// 			};
// 		});
// 	return (
// 		<div className="mx-auto flex flex-col max-w-5xl w-full">
// 			<h1 className="text-xl px-6">
// 				<Link href={`/market/${params.type}/${params.id}`}>{params.type === AssetType.BSV20 ? params.id : details.sym}</Link> Ownership
// 				Breakdown
// 			</h1>
// 			{params.type === AssetType.BSV21 && (
// 				<Link className="text-sm px-6" href={`/outpoint/${params.id}`}>ID: {params.id}</Link>
// 			)}
// 			<div className="divider" />
// 			<div className="w-full">
// 				<div className="grid grid-template-columns-3 p-6">
// 					<div className="">Address</div>
// 					<div className="w-24 text-right">Holdings</div>
// 					<div className="w-12 text-right">Ownership</div>
// 					<div className="divider col-span-3" />
// 					{(holders || []).map((h) => {
// 						const pctWidth = `${h.pct}%`;
// 						return (
// 							<React.Fragment key={`${params.id}-holder-${h.address}`}>
// 								<Link
// 									className="flex items-center text-sm flex-1"
// 									href={`/activity/${h.address}/ordinals`}
// 								>
// 									<JDenticon hashOrValue={h.address} className="w-8 h-8 mr-2" />
// 									<span className="hidden md:block">{h.address}</span>
// 								</Link>
// 								<div className="w-24 text-right">{h.amt}</div>
// 								<div className="w-24 text-right">{h.pct.toFixed(4)}%</div>
// 								<div className="flex items-center mb-2 relative col-span-3">
// 									<div
// 										className="w-full bg-warning/25 rounded h-1"
// 										style={{ width: pctWidth }}
// 									>
// 										&nbsp;
// 									</div>
// 								</div>
// 							</React.Fragment>
// 						);
// 					})}
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

const Page: React.FC<PageProps> = ({ holders, details, type, id }) => {
	return (
		<div className="mx-auto flex flex-col max-w-5xl w-full">
			<h1 className="text-xl px-6">
				<Link href={`/market/${type}/${id}`}>
					<a className="text-xl" href={`/market/${type}/${id}`}>
						{type === AssetType.BSV20 ? id : details.sym} Ownership Breakdown
					</a>
				</Link>
			</h1>
			{type === AssetType.BSV21 && (
				<Link href={`/outpoint/${id}`}>
					<a className="text-sm px-6">ID: {id}</a>
				</Link>
			)}
			<div className="divider" />
			<div className="w-full">
				<div className="grid grid-cols-3 p-6 gap-y-4">
					<div className="">Address</div>
					<div className="w-24 text-right">Holdings</div>
					<div className="w-24 text-right">Ownership</div>
					<div className="col-span-3 divider" />
					{holders.map((h) => (
						<React.Fragment key={`${id}-holder-${h.address}`}>
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
									style={{ width: `${h.pct}%` }}
								>
									&nbsp;
								</div>
							</div>
						</React.Fragment>
					))}
				</div>
			</div>
		</div>
	);
};

export async function getStaticProps(context: GetStaticPropsContext) {
  if (!context.params || typeof context.params.id !== 'string' || typeof context.params.type !== 'string') {
    return {
      notFound: true,
    };
  }
  const { params } = context;
  const { type, id } = params;

  const detailsUrl = `${API_HOST}/api/bsv20/${type === AssetType.BSV20 ? 'tick' : 'id'}/${id}`;
  const holdersUrl = `${detailsUrl}/holders?limit=100`;

  // Fetching details
  const { promise: detailsPromise } = http.customFetch<BSV20>(detailsUrl);
  const details = await detailsPromise;

  // Fetching holders
  const { promise: holdersPromise } = http.customFetch<Holder[]>(holdersUrl);
  const rawHolders = await holdersPromise;

  const holders = rawHolders.sort((a, b) => parseInt(b.amt) - parseInt(a.amt))
    .map(h => ({
      ...h,
      amt: parseInt(h.amt) / 10 ** (details.dec || 0),
      pct: details.supply ? (parseInt(h.amt) / parseInt(details.supply)) * 100 : 0,
    }));

  return {
    props: {
      holders,
      details,
      type,
      id,
    },
    revalidate: 60, // Revalidate at most once every minute
  };
}


export default Page;
