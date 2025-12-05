"use client";

import { API_HOST, resultsPerPage } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { ordUtxos } from "@/signals/wallet";
import {
	clearSelection,
	isThemeToken,
	searchQuery,
} from "@/signals/wallet/selection";
import type { OrdUtxo } from "@/types/ordinals";
import { useLocalStorage } from "@/utils/storage";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactType, artifactTypeMap } from "../artifact";
import { selectedType } from "./filter";
import BatchActionsBar from "./BatchActionsBar";
import OrdinalCard from "./OrdinalCard";
import SAFU from "./safu";

interface WalletOrdinalsProps {
	address?: string;
	onClick?: (outpoint: string) => Promise<void>;
	onCountsChange?: (counts: Record<string, number>, outpoints: string[]) => void;
}

const WalletOrdinals = ({ address: addressProp, onClick, onCountsChange }: WalletOrdinalsProps) => {
	useSignals();
	const ref = useRef(null);
	const isInView = useInView(ref);
	const listings = useSignal<OrdUtxo[]>([]);
	const [mounted, setMounted] = useState(false);

	const [encryptedBackup] = useLocalStorage<string | undefined>(
		"encryptedBackup",
		undefined,
	);

	const [selectedArtifactType, setSelectedArtifactType] =
		useLocalStorage<ArtifactType>("1ssartt", ArtifactType.All);

	// Wait for client hydration before showing conditional content
	useEffect(() => {
		setMounted(true);
	}, []);

	// Initialize filter from localStorage
	useEffect(() => {
		if (!selectedType.value && selectedArtifactType) {
			selectedType.value = selectedArtifactType;
		}
	}, [selectedArtifactType]);

	const locked = computed(() => !ordAddress.value && !!encryptedBackup);
	const address = addressProp || ordAddress.value || "";

	// Data fetching with infinite scroll
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["ordinals", address, selectedType.value],
		queryFn: ({ pageParam }) =>
			getWalletOrdUtxos({
				address,
				pageParam,
				selectedType: selectedType.value,
			}),
		getNextPageParam: (lastPage, _pages, lastPageParam) => {
			if (lastPage?.length === resultsPerPage) {
				return lastPageParam + 1;
			}
			return undefined;
		},
		initialPageParam: 0,
		enabled: !!address,
	});

	// Update listings when data changes
	useEffect(() => {
		if (data) {
			const pageData = data.pages[data.pages.length - 1];
			if (pageData !== undefined) {
				const u = data.pages.reduce(
					(acc, val) => (acc || []).concat(val || []),
					[] as OrdUtxo[],
				);
				if (u) {
					ordUtxos.value = u;
					listings.value = u;
				}
			}
		}
	}, [data, listings]);

	// Infinite scroll trigger
	useEffect(() => {
		const newPageData = data?.pages[data.pages.length - 1];
		if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
			fetchNextPage();
		}
	}, [isInView, data, isFetchingNextPage, hasNextPage, fetchNextPage]);

	// Filter listings by search query and special types
	const filteredListings = useMemo(() => {
		let results = listings.value;

		// Filter by theme if selected
		if (selectedType.value === ("theme" as ArtifactType)) {
			results = results.filter((ord) => isThemeToken(ord));
		}

		// Filter by search query
		const query = searchQuery.value.toLowerCase();
		if (query) {
			results = results.filter(
				(ord) =>
					ord.txid.toLowerCase().includes(query) ||
					ord.origin?.outpoint?.toLowerCase().includes(query) ||
					ord.origin?.num?.toString().includes(query),
			);
		}

		return results;
	}, [listings.value, searchQuery.value, selectedType.value]);

	// Get all outpoints for select all functionality
	const allOutpoints = useMemo(() => {
		return filteredListings.map((ord) => ord.outpoint);
	}, [filteredListings]);

	// Calculate counts for filter sidebar
	const counts = useMemo(() => {
		const c: Record<string, number> = {
			total: filteredListings.length,
			theme: 0,
		};

		for (const ord of listings.value) {
			if (isThemeToken(ord)) c.theme++;
		}

		return c;
	}, [listings.value, filteredListings.length]);

	// Notify parent of counts change for sidebar
	useEffect(() => {
		onCountsChange?.(counts, allOutpoints);
	}, [counts, allOutpoints, onCountsChange]);

	// Handle theme application
	const handleApplyTheme = useCallback(async (ord: OrdUtxo) => {
		// TODO: Integrate with @theme-token/sdk
		console.log("Apply theme:", ord.origin?.outpoint);
	}, []);

	// Handle batch send
	const handleBatchSend = useCallback((outpoints: string[]) => {
		console.log("Batch send:", outpoints);
		// TODO: Open send modal with selected ordinals
	}, []);

	// Handle batch list
	const handleBatchList = useCallback((outpoints: string[]) => {
		console.log("Batch list:", outpoints);
		// TODO: Open list modal with selected ordinals
	}, []);

	// Clear selection when filter changes
	useEffect(() => {
		clearSelection();
	}, [selectedType.value]);

	// Show loading state until client is mounted to avoid hydration mismatch
	if (!mounted) {
		return (
			<div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 text-primary animate-spin" />
			</div>
		);
	}

	if (locked.value) {
		return <SAFU />;
	}

	if (!ordAddress.value && !addressProp) {
		return (
			<div className="w-full flex-1 flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 text-primary animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
				<h1 className="font-mono text-sm uppercase tracking-widest text-foreground">
					WALLET_INVENTORY
				</h1>
				<span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
					{counts.total || 0} ARTIFACTS
				</span>
			</div>

			{/* Grid Area */}
			<div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
				{filteredListings.length === 0 && !isFetching ? (
					<div className="flex flex-col items-center justify-center py-24 text-muted-foreground font-mono">
						<div className="text-6xl mb-6 opacity-20">/</div>
						<p className="uppercase tracking-widest text-sm">NO ARTIFACTS FOUND</p>
						<p className="text-xs text-muted-foreground mt-2">
							{searchQuery.value ? "Try a different search term" : "Your wallet is empty"}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
						{filteredListings.map((ord) => (
							<OrdinalCard
								key={ord.outpoint}
								ord={ord}
								onApplyTheme={handleApplyTheme}
								onClick={onClick ? (op) => onClick(op) : undefined}
							/>
						))}
					</div>
				)}

				{/* Infinite scroll trigger */}
				<div ref={ref} className="flex justify-center py-12">
					{hasNextPage || isFetching ? (
						<div className="flex items-center gap-3 text-primary font-mono text-sm animate-pulse">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span className="uppercase tracking-wider">LOADING_DATA...</span>
						</div>
					) : filteredListings.length > 0 ? (
						<span className="text-muted-foreground text-xs uppercase tracking-widest">
							[ END OF DATA ]
						</span>
					) : null}
				</div>
			</div>

			{/* Batch Actions Floating Bar */}
			<BatchActionsBar onSend={handleBatchSend} onList={handleBatchList} />
		</div>
	);
};

export default WalletOrdinals;

// Data fetching function
export const getWalletOrdUtxos = async ({
	address,
	pageParam,
	selectedType,
}: {
	address: string;
	pageParam: number;
	selectedType: ArtifactType | null;
}): Promise<OrdUtxo[] | undefined> => {
	if (!address) return;

	const offset = resultsPerPage * pageParam;
	let url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;

	// Don't add type filter for special types like "theme"
	if (selectedType && selectedType !== ArtifactType.All && selectedType !== ("theme" as ArtifactType)) {
		url += `&type=${artifactTypeMap.get(selectedType)}`;
	}

	const res = await fetch(url);
	const result = (await res.json()) as OrdUtxo[];

	// Client-side filter for type
	const final =
		selectedType && selectedType !== ArtifactType.All && selectedType !== ("theme" as ArtifactType)
			? result.filter((o) =>
					o.origin?.data?.insc?.file.type?.startsWith(
						artifactTypeMap.get(selectedType) as string,
					),
				)
			: result;

	return final;
};
