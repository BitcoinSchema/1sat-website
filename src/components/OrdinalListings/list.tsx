"use client";

import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { resultsPerPage, SCAM_ITEM_BLACKLIST, SCAM_LISTING_USER_BLACKLIST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { getOutpoints } from "@/utils/address";
import { getMarketListings } from "@/utils/artifact";
import { useLocalStorage } from "@/utils/storage";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { toBitcoin } from "satoshi-token";
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
	term?: string;
	address?: string;
	onClick?: (outpoint: string) => Promise<void>;
}

const List = ({ term, address, onClick }: Props) => {
	useSignals();
	const ref = useRef(null);
	const isInView = useInView(ref);

	const listings = useSignal<OrdUtxo[]>([]);

	const [selectedArtifactType, setSelectedArtifactType] =
		useLocalStorage<ArtifactType>("1ssmartt", ArtifactType.All);

	useEffect(() => {
		if (!selectedType.value && !!selectedArtifactType) {
			selectedType.value = selectedArtifactType || null;
		}
	}, [selectedArtifactType, selectedType.value]);

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
			getMarketListings({ pageParam, selectedType: selectedType.value, term }),
		getNextPageParam: (lastPage, pages, lastPageParam) => {
			if (lastPage?.length === resultsPerPage) {
				return lastPageParam + 1;
			}
			return undefined;
		},
		initialPageParam: 0,
	});

	useEffect(() => {
		if (data) {
			console.log("data", data);
			const pageData = data.pages[data.pages.length - 1];
			if (pageData !== undefined) {
				const u = data.pages.reduce(
					(acc, val) => (acc || []).concat(val || []),
					[],
				);
				if (u) {
					listings.value = u || [];
				}
			}
		}
		// eslint-disable-next-line react-hooks-signals/exhaustive-deps-signals
	}, [data, listings, data?.pages[data.pages.length - 1]]);

	useEffect(() => {
		const newPageData = data?.pages[data.pages.length - 1];
		if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
			fetchNextPage();
		}
		// eslint-disable-next-line react-hooks-signals/exhaustive-deps-signals
	}, [isInView]);

	const collectionIds = computed(() =>
		listings.value?.reduce((i, v) => {
			const cid = v.origin?.data?.map?.subTypeData?.collectionId;
			if (cid && checkOutpointFormat(cid)) {
				i.push(cid);
			}
			return i;
		}, [] as string[]),
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

	return (
		listings.value && (
			<TableBody>
				{listings.value.map((listing) => {
					const scamListing = !!listing.origin?.outpoint && SCAM_ITEM_BLACKLIST.includes(listing.origin.outpoint);
					const knownScammer = listing.owner && SCAM_LISTING_USER_BLACKLIST.some((u) => u.address === listing.owner);
					const size = 80;
					const collection = listingCollection(listing, collectionData || []);
					const priceValue = toBitcoin(listing?.data?.list?.price || "0");

					return (
						listing && (
							<TableRow
								key={`k-${listing?.txid}-${listing?.vout}-${listing?.height}`}
								className="border-border hover:bg-muted/50 group"
							>
								{/* Asset Thumbnail */}
								<TableCell className="py-3 px-4">
									<div className="w-16 h-16 rounded-md border border-border bg-muted overflow-hidden group-hover:border-primary/50 transition-colors">
										<Artifact
											classNames={{
												wrapper: "bg-transparent",
												media: "bg-muted text-center p-0 h-full w-full object-cover",
											}}
											artifact={listing}
											size={size}
											sizes={"100vw"}
											showFooter={false}
											to={`/outpoint/${listing?.outpoint}/listing`}
										/>
									</div>
								</TableCell>

								{/* Inscription Details */}
								<TableCell className="py-3 px-4">
									<div className="flex flex-col gap-1">
										<Link
											className="text-sm text-foreground font-medium group-hover:text-primary transition-colors truncate max-w-[200px] md:max-w-[300px]"
											href={`/outpoint/${listing?.outpoint}/listing`}
										>
											{listingName(listing)}
										</Link>
										{collection && (
											<Link
												href={`/collection/${listing?.origin?.data?.map?.subTypeData?.collectionId}`}
												className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
											>
												{collection.name} {mintNumber(listing, collection)}
											</Link>
										)}
										<span className="text-[10px] text-muted-foreground/70">
											#{listing?.origin?.num}
										</span>
										{/* Mobile price */}
										<div className="md:hidden text-xs mt-1">
											<span className="text-primary font-medium">{priceValue}</span>
											<span className="text-muted-foreground ml-1">BSV</span>
										</div>
									</div>
								</TableCell>

								{/* Seller */}
								<TableCell className="py-3 px-4 hidden md:table-cell">
									<Link href={`/signer/${listing?.owner}`} className="block">
										<div
											className="w-10 h-10 rounded-md border border-border bg-muted overflow-hidden group-hover:border-primary/50 transition-colors"
											title={listing?.data?.sigma?.length ? listing?.data.sigma[0].address : listing?.owner}
										>
											<JDenticon className="w-full h-full" hashOrValue={listing?.owner} />
										</div>
									</Link>
								</TableCell>

								{/* Price */}
								<TableCell className="py-3 px-4 text-right hidden md:table-cell">
									{scamListing ? (
										<span className="inline-flex items-center gap-1.5 text-destructive text-xs uppercase font-medium">
											<AlertTriangle className="w-3.5 h-3.5" />
											Flagged
										</span>
									) : knownScammer ? (
										<span className="inline-flex items-center gap-1.5 text-destructive text-xs uppercase font-medium">
											<AlertTriangle className="w-3.5 h-3.5" />
											Scammer
										</span>
									) : (
										<div className="text-sm">
											<span className="text-primary font-semibold">{priceValue}</span>
											<span className="text-muted-foreground ml-1 text-xs">BSV</span>
										</div>
									)}
								</TableCell>

								{/* Action */}
								<TableCell className="py-3 px-4 text-right">
									{!scamListing && !knownScammer && listing?.data?.list?.price ? (
										<BuyBtn
											satoshis={BigInt(listing.data.list.price)}
											listing={listing}
										/>
									) : !scamListing && !knownScammer ? (
										<Button
											variant="outline"
											size="sm"
											asChild
											className="rounded-md border-border text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all font-mono uppercase text-[10px] tracking-widest h-8"
										>
											<Link href={`/outpoint/${listing?.outpoint}/listing`}>
												View
												<ChevronRight className="w-3 h-3 ml-1" />
											</Link>
										</Button>
									) : null}
								</TableCell>
							</TableRow>
						)
					);
				})}
				{listings.value.length === 0 && (
					<TableRow>
						<TableCell colSpan={5} className="py-16 text-center">
							<div className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
								No listings found
							</div>
						</TableCell>
					</TableRow>
				)}
				<TableRow className="hover:bg-transparent border-0">
					<TableCell colSpan={5} className="py-8">
						<div ref={ref} className="flex items-center justify-center">
							{isFetching && (
								<div className="flex items-center gap-3 text-muted-foreground text-xs">
									<Loader2 className="w-4 h-4 animate-spin text-primary" />
									<span className="uppercase tracking-wider">Loading...</span>
								</div>
							)}
						</div>
					</TableCell>
				</TableRow>
			</TableBody>
		)
	);
};

export default List;
