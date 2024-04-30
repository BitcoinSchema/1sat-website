"use client";

import LRC20Listings from "@/components/LRC20Listings";
import OrdinalListings, { OrdViewMode } from "@/components/OrdinalListings";
import TokenListings from "@/components/TokenListings";
import { AssetType } from "@/constants";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import type { Autofill } from "@/types/search";
import * as http from "@/utils/httpClient";
import { useSignals } from "@preact/signals-react/runtime";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SearchPageProps {
	imageListings?: OrdUtxo[];
	collections?: OrdUtxo[];
	tokenListingsv2?: BSV20TXO[];
	modelListings?: OrdUtxo[];
	lrc20Listings?: OrdUtxo[];
	lrc20Tokens?: OrdUtxo[];
	bsv20Matches?: string[];
	selectedAssetType?: AssetType;
	title?: string;
}

const SearchPage: React.FC<SearchPageProps> = (props) => {
	const { selectedAssetType } = props;
	useSignals();
	const pathname = usePathname();
	const termFromPath = pathname.split("/").pop();

	// use useQuery to fetch bsv20 matches for this search term
	const { data: bsv20Results } = useQuery({
		queryKey: ["autofill", termFromPath],
		queryFn: async () => {
			const url = `https://1sat-api-production.up.railway.app/ticker/autofill/bsv20/${termFromPath}`;
			const { promise } = http.customFetch<Autofill[]>(url);
			return await promise;
		},
	});

	const Listings = () => {
		switch (selectedAssetType) {
			case AssetType.Ordinals:
				return (
					<OrdinalListings
						listings={props.imageListings}
						mode={OrdViewMode.List}
					/>
				);
			case AssetType.BSV20:
				return <TokenListings type={AssetType.BSV20} />;
			case AssetType.BSV21:
				return <TokenListings type={AssetType.BSV21} />;
			case AssetType.LRC20:
				return (
					<LRC20Listings
						listings={props.lrc20Listings!}
						tokens={props.lrc20Tokens!}
					/>
				);
			default:
				return null;
		}
	};

	return (
		// <TracingBeam className="">
		<div className="w-full max-w-5xl mx-auto">
			{props.title && (
				<div className="text-3xl font-bold mb-4">{props.title}</div>
			)}
			<div className="text-[#555] font-semibold text-lg mb-2">BSV20</div>
			{bsv20Results && bsv20Results.length > 0 && (
				<div className="w-full text-base-100 grid grid-cols-8 mb-4 gap-2">
					{bsv20Results?.map((match) => (
						<Link
							key={match.id}
							href={`/market/bsv20/${match.tick}`}
							className="btn btn-ghost btn-sm border-neutral/25 hover:text-neutral-content hover:bg-neutral/25 text-neutral"
						>
							{match.tick}
						</Link>
					))}
				</div>
			)}
			<div className="text-[#555] font-semibold text-lg mb-2">
				Ordinals
			</div>
			<div className="tab-content block bg-base-100 border-base-200 rounded-box p-2 md:p-6">
				<Listings />
			</div>
		</div>
		// </TracingBeam>
	);
};

export default SearchPage;
