"use client";

import ListingsPage from "@/components/pages/listings";
import { API_HOST, AssetType } from "@/constants";
import { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";

const Listings = ({ params }: { params: { tab: AssetType } }) => {
	let url = "";
	let q = null;
	switch (params.tab) {
		case AssetType.Ordinals:
			url = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
			break;
		case AssetType.BSV21:
			url = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v2`;
			break;
		case AssetType.LRC20:
			q = {
				insc: {
					json: {
						p: "lrc-20",
					},
				},
			};

			url = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&q=${btoa(
				JSON.stringify(q)
			)}`;
			break;
		default:
			break;
	}

	const { data: listings, isLoading } = useQuery({
		queryKey: ["listings", params.tab],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo[]>(url);
			return promise;
		},
		enabled: !!url,
	});

	const lrc20TokenIds =
		listings
			?.filter((l) => !!l.origin?.data?.insc?.json?.id)
			.map((l) => l.origin?.data?.insc?.json?.id!) || [];

	const fetchLrc20Tokens = async () => {
		const urlLrc20Tokens = `${API_HOST}/api/txos/outpoints`;
		const { promise: promiseLrc20Tokens } = http.customFetch<OrdUtxo[]>(
			urlLrc20Tokens,
			{
				method: "POST",
				body: JSON.stringify(lrc20TokenIds),
			}
		);
		return await promiseLrc20Tokens;
	};

	const { data: lrc20Tokens, isLoading: lrc20TokensLoading } = useQuery({
		queryKey: ["lrc20Tokens", lrc20TokenIds],
		queryFn: fetchLrc20Tokens,
		enabled: params.tab === AssetType.LRC20 && !!lrc20TokenIds.length,
	});

	if (isLoading || lrc20TokensLoading) {
		return <div>Loading...</div>;
	}

	if (!listings) {
		return null;
	}

	switch (params.tab) {
		case AssetType.Ordinals:
			return (
				<ListingsPage
					imageListings={listings}
					selectedAssetType={AssetType.Ordinals}
				/>
			);
		case AssetType.BSV20:
			return <ListingsPage selectedAssetType={AssetType.BSV20} />;
		case AssetType.BSV21:
			return (
				<ListingsPage
					tokenListingsv2={listings as unknown as BSV20TXO[]}
					selectedAssetType={AssetType.BSV21}
				/>
			);
		case AssetType.LRC20:
			return (
				<ListingsPage
					lrc20Listings={listings}
					lrc20Tokens={lrc20Tokens}
					selectedAssetType={AssetType.LRC20}
				/>
			);
		default:
			return null;
	}
};
export default Listings;
