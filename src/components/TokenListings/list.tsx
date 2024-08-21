import { API_HOST, AssetType } from "@/constants";
import type { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { ReturnTypes, toBitcoin } from "satoshi-token";

const List = async ({ type }: { type: AssetType.BSV20 | AssetType.BSV21 }) => {
	let listings: BSV20TXO[] = [];
	if (type === AssetType.BSV20) {
		const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
		const { promise: promiseBsv20 } =
			http.customFetch<BSV20TXO[]>(urlTokens);
		listings = await promiseBsv20;
	} else {
		const urlV2Tokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v2`;
		const { promise: promiseBsv21 } =
			http.customFetch<BSV20TXO[]>(urlV2Tokens);
		listings = await promiseBsv21;
	}

	return (
		<tbody className="overflow-auto">
			{listings
				// .sort((a, b) => {
				// 	return Number.parseFloat(a.pricePer) <
				// 		Number.parseFloat(b.pricePer)
				// 		? -1
				// 		: 1;
				// })
				.map((listing) => {
					return (
						<tr
							key={`${listing.txid}-${listing.vout}-${listing.height}`}
						>
							<th className="truncase text-ellipsis">
								{listingName(listing)}
							</th>
							<td>{listingAmount(listing)}</td>
							<td className="w-full text-right">
								{satsPerToken(listing)}
							</td>
							<td className="break-normal text-right w-96">
								{toBitcoin(
									listing.price || "0",
									ReturnTypes.String,
								)}{" "}
								BSV
							</td>
						</tr>
					);
				})}
		</tbody>
	);
};

export default List;

const listingName = (listing: BSV20TXO) => {
	return listing.id ? listing.sym : listing.tick;
};

const listingAmount = (listing: BSV20TXO) => {
	return listing.amt;
};

const satsPerToken = (listing: BSV20TXO) => {
	return Math.floor(Number.parseInt(listing.pricePer));
};
