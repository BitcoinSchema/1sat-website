"use client";

import { resultsPerPage } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { getOutpoints } from "@/utils/address";
import { getMarketListings } from "@/utils/artifact";
import { useLocalStorage } from "@/utils/storage";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { FiLoader } from "react-icons/fi";
import { toBitcoin } from "satoshi-bitcoin-ts";
import JDenticon from "../JDenticon";
import { selectedType } from "../Wallet/filter";
import Artifact, { ArtifactType } from "../artifact";
import BuyBtn from "./buy";
import {
	checkOutpointFormat,
	listingCollection,
	listingName,
	mintNumber,
} from "./helpers";
interface Props {
	listings?: OrdUtxo[];
	address?: string;
	onClick?: (outpoint: string) => Promise<void>;
}

const List = ({ listings: listingsProp, address, onClick }: Props) => {
	useSignals();
	const ref = useRef(null);
	const isInView = useInView(ref);

	const listings = useSignal<OrdUtxo[]>(listingsProp || []);

	const [selectedArtifactType, setSelectedArtifactType] =
		useLocalStorage<ArtifactType>("1ssmartt", ArtifactType.All);

	// TODO: hook up address and onClick

	useEffect(() => {
		// init from localStorage when available and not already set
		if (!selectedType.value && !!selectedArtifactType) {
			selectedType.value = selectedArtifactType || null;
		}
	}, [selectedArtifactType, selectedType]);

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = useInfiniteQuery({
		queryKey: ["ordinals", selectedType.value],
		queryFn: ({ pageParam }) =>
			getMarketListings({ pageParam, selectedType: selectedType.value }),
		getNextPageParam: (lastPage, pages, lastPageParam) => {
			if (lastPage?.length === resultsPerPage) {
				return lastPageParam + 1;
			}
			return undefined;
		},
		initialPageParam: 0,
	});

	// set the ord utxos
	useEffect(() => {
		if (data) {
			console.log("data", data);
			const pageData = data.pages[data.pages.length - 1];
			if (pageData !== undefined) {
				const u = data.pages.reduce(
					(acc, val) => (acc || []).concat(val || []),
					[]
				);
				if (u) {
					listings.value = u || [];
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, listings, data?.pages[data.pages.length - 1]]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const newPageData = data?.pages[data.pages.length - 1];
		if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
			fetchNextPage();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInView]);

	const collectionIds = computed(() =>
		listings.value?.reduce((i, v) => {
			const cid = v.origin?.data?.map?.subTypeData?.collectionId;
			if (cid && checkOutpointFormat(cid)) {
				i.push(cid);
			}
			return i;
		}, [] as string[])
	);

	const cids = useMemo(() => {
		return collectionIds.value;
	}, [collectionIds.value]);

	const {
		data: collectionData,
		error: collectionsErr,
		isFetching: isFetchingCollections,
	} = useQuery({
		queryKey: ["collections", cids],
		queryFn: () => getOutpoints(cids, false),
	});

	// const collections = useSignal(collectionData || []);
	console.log({
		collectionIds: collectionIds.value,
		// collections: collections.value,
		collectionData,
		cids,
		isFetchingCollections,
		collectionsErr,
	});

	return (
		listings.value && (
			<tbody className="h-full">
				{listings.value.map((listing, idx) => {
					const size = 100;
					const collection = listingCollection(
						listing,
						collectionData || []
					);
					const price = `${toBitcoin(
						listing?.data?.list?.price || "0",
						true
					).toString()} BSV`;
					return (
						listing && (
							<tr
								key={`k-${listing?.txid}-${listing?.vout}-${listing?.height}`}
							>
								<td width={100} height={120} className="p-0">
									<Artifact
										classNames={{
											wrapper: "bg-transparent",
											media: "rounded bg-[#111] text-center p-0 h-[100px] mr-2",
										}}
										artifact={listing}
										size={size}
										sizes={"100vw"}
										showFooter={false}
										priority={false}
										to={`/outpoint/${listing?.outpoint}/listing`}
									/>
								</td>

								<td className="flex flex-col h-[100px] p-0 pl-4">
									<div className="my-auto max-w-64">
										<Link
											className="text-lg truncate overflow-hidden text-ellipses"
											href={`/outpoint/${listing?.outpoint}/listing`}
										>
											{listingName(listing)}
										</Link>
										{collection && (
											<div className="flex items-center gap-4">
												<Link
													href={`/collection/${listing?.origin?.data?.map?.subTypeData?.collectionId}`}
													className="text-blue-400 hover:text-blue-500"
												>
													{collection.name}{" "}
													{mintNumber(
														listing,
														collection
													)}
												</Link>
											</div>
										)}
										<div
											className="flex items-center gap-4 text-neutral-content/25 tooltip"
											data-tip="Block Number : Position in Block : Transaction Output"
										>
											{listing?.origin?.num}
										</div>
										<div className={"block md:hidden"}>
											{price}
										</div>
									</div>
								</td>
								<td className={"p-0 hidden md:table-cell w-10"}>
									<Link href={`/signer/${listing?.owner}`}>
										<div
											className="tooltip"
											data-tip={
												listing?.data?.sigma?.length
													? listing?.data.sigma[0]
															.address
													: listing?.owner
											}
										>
											<JDenticon
												className="w-8"
												hashOrValue={listing?.owner}
											/>
										</div>
									</Link>
								</td>
								<td className="p-0 text-xs md:text-sm hidden md:table-cell">
									{listing?.data?.list?.price ? (
										<BuyBtn
											satoshis={BigInt(
												listing.data.list.price
											)}
											listing={listing}
										/>
									) : (
										""
									)}
								</td>
								<td className="p-0 md:table-cell hidden text-center w-8">
									<Link
										className="text-sm"
										href={`/outpoint/${listing?.outpoint}/listing`}
									>
										<FaChevronRight className="w-6 h-6" />
									</Link>
								</td>
							</tr>
						)
					);
				})}
				<tr>
					<td className="text-center" colSpan={5}>
						<div
							ref={ref}
							className="flex items-center justify-center"
						>
							{isFetching && (
								<FiLoader className="animate animate-spin" />
							)}
						</div>
					</td>
				</tr>
			</tbody>
		)
	);
};

export default List;
