"use client";

import { MARKET_API_HOST, type SortBy, type AssetType } from "@/constants";
import TickerHeading from "./heading";
import { useQuery } from "@tanstack/react-query";
import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import TickerContent from "./content";
import type { TxoData } from "@/types/ordinals";

export interface Holder {
	address: string;
	amt: string;
}

export interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export interface CombinedHolder {
	address: string;
	totalWeightedAmt: number;
	tokens: { [tokenTick: string]: { amt: number; weightedAmt: number } };
}

export type MarketData = {
	accounts: number;
	tick?: string;
	id: string;
	sym?: string;
	price: number;
	marketCap: number;
	holders: Holder[];
	dec: number;
  data: TxoData;
	pctChange: number;
	fundAddress: string;
	fundTotal: string;
	fundUsed: string;
	fundBalance: string;
	included: boolean;
	pendingOps: number;
	icon?: string;
	supply?: string;
	max?: string;
	txid: string;
	vout: number;
	amt?: string;
	num: number;
	contract?: "pow-20" | "LockToMintBsv20" | undefined;
	difficulty?: string | undefined;
	startingreward?: string | undefined;
};

// https://ordinals.gorillapool.io/api/bsv20/id/8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1_0?refresh=false
// example response:

// {
//   "txid": "8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1",
//   "vout": 0,
//   "height": 821854,
//   "idx": "8418",
//   "id": "8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1_0",
//   "sym": "VIBES",
//   "icon": "87f1d0785cf9b4951e75e8cf9353d63a49f98e9b6b255bcd6a986db929a00472_0",
//   "amt": "2100000000000000",
//   "dec": 8,
//   "accounts": "105",
//   "pending": "6",
//   "fundAddress": "1FtQS5rc4d9Sr8euV9XQ744WGKBbngx3on",
//   "fundTotal": "1296634",
//   "fundUsed": "751000",
//   "fundBalance": "545634"
// }

// {
//   "chain": "main",
//   "blocks": 635302,
//   "headers": 635299,
//   "bestblockhash": "000000000000000002a40d7410a6c08109521c14f4cf354e7b352b4eab8aa4ea",
//   "difficulty": 287310033717.7086,
//   "mediantime": 1589703256,
//   "verificationprogress": 0.9999754124031851,
//   "pruned": false,
//   "chainwork": "0000000000000000000000000000000000000000010969f724913e0fe59377f4"
// }

const List = ({
	type,
	id,
	sort,
	dir,
	ticker,
}: {
	type: AssetType.BSV20 | AssetType.BSV21;
	id?: string;
	sort?: SortBy;
	dir?: "asc" | "desc";
	ticker?: MarketData;
}) => {
	const {
		data: marketData,
		isLoading,
		error,
	} = useQuery<MarketData[]>({
		queryKey: ["marketData", type, id, sort, dir],
		queryFn: async () => {
			const url = `${MARKET_API_HOST}/market/${type}${id ? `/${id}` : ""}?sort=${sort}&dir=${dir}&limit=100`;
			const response = await fetch(url);
			return response.json();
		},
	});

	if (isLoading) {
		return <TokenListingSkeleton type={type} />;
	}

	if (error) {
		console.error(error);
		return <div>Error occurred while fetching market data.</div>;
	}

	return (
		<tbody className="overflow-auto">
			{marketData?.map((ticker, idx) => (
				<TickerHeading
					key={`${ticker.tick}-${idx}`}
					ticker={ticker}
					id={id}
					type={type}
				/>
			))}
			<tr>
				<td colSpan={6} className="p-0">
					{ticker && <TickerContent ticker={ticker} show={true} type={type} />}
				</td>
			</tr>
		</tbody>
	);
};

export default List;

// const getMarketData = async (
//   req: NextRequest,
//   type: AssetType,
//   id?: string,
//   sort?: SortBy,
//   dir?: "asc" | "desc"
// ) => {
//   // Clone the original request URL and add the search parameters
//   const url = new URL(req.url);
//   if (sort) url.searchParams.set("sort", sort);
//   if (dir) url.searchParams.set("dir", dir);

//   // Create a new request object with the modified URL
//   const modifiedRequest = new NextRequest(url.toString(), req);

//   const res = await import("../../../app/market/[tab]/list/route");
//   const json = await (
//     await res.POST(modifiedRequest, {
//       params: {
//         type,
//         id,
//       },
//     })
//   ).json();

//   return (json || []) as MarketData[];
// };
