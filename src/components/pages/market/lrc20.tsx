'use client';

import { API_HOST, AssetType } from "@/constants";
import * as http from "@/utils/httpClient";
import { OrdUtxo } from "@/types/ordinals";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import MarketPage from ".";

export function Lrc20MarketPage() {
	const { data: lrc20Listings } = useQuery({
		queryKey: ["market", "lrc20", "listings"],
		queryFn: async () => {
			const q = {
				insc: {
					json: {
						p: "lrc-20",
					},
				},
			};

			const urlLrc20 = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&q=${btoa(
				JSON.stringify(q)
			)}`;

			const { promise: promiseLrc20 } =
				http.customFetch<OrdUtxo[]>(urlLrc20);
			return promiseLrc20;
		},
	});

	const lrc20TokenIds = useMemo(() => {
		if (!lrc20Listings) {
			return [];
		}

		return lrc20Listings
			.filter((l) => !!l.origin?.data?.insc?.json?.id)
			.map((l) => l.origin?.data?.insc?.json?.id!);
	}, [lrc20Listings]);

	const { data: lrc20Tokens } = useQuery({
		queryKey: ["market", "lrc20", "tokens", lrc20TokenIds],
		queryFn: async () => {
			const urlLrc20Tokens = `${API_HOST}/api/txos/outpoints`;
			const { promise: promiseLrc20Tokens } = http.customFetch<OrdUtxo[]>(
				urlLrc20Tokens,
				{
					method: "POST",
					body: JSON.stringify(lrc20TokenIds),
				}
			);

			return promiseLrc20Tokens;
		},
		enabled: !!lrc20TokenIds.length,
	});

	return (
		<MarketPage
			lrc20Listings={lrc20Listings}
			lrc20Tokens={lrc20Tokens}
			selectedAssetType={AssetType.LRC20}
		/>
	);
}
