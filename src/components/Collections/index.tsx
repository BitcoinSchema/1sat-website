"use client";

import { MARKET_API_HOST, } from "@/constants";
import type { Collection } from "@/types/collection";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import FeaturedCollections from "./featured";
import Artifact from "../artifact";
import { useSignals } from "@preact/signals-react/runtime";
import {
	collectionSearch,
	collectionView,
	collectionSort,
	collectionStatus,
	collectionSize,
	type SortOption,
	type StatusFilter,
	type SizeFilter,
} from "./CollectionSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Layers, Filter } from "lucide-react";
import { useMemo } from "react";

// Helper to check if collection is complete
const isComplete = (c: Collection) => {
	if (!c.stats) return false;
	return c.stats.max > 0 && c.stats.count >= c.stats.max;
};

// Helper to get item count
const getCount = (c: Collection) => c.stats?.count || 0;

// Helper to sort collections
const sortCollections = (collections: Collection[], sort: SortOption) => {
	const sorted = [...collections];
	switch (sort) {
		case "newest":
			return sorted.sort((a, b) => (b.height || 0) - (a.height || 0));
		case "oldest":
			return sorted.sort((a, b) => (a.height || 0) - (b.height || 0));
		case "name_asc":
			return sorted.sort((a, b) => {
				const nameA = a.data?.map?.name?.toLowerCase() || "";
				const nameB = b.data?.map?.name?.toLowerCase() || "";
				return nameA.localeCompare(nameB);
			});
		case "name_desc":
			return sorted.sort((a, b) => {
				const nameA = a.data?.map?.name?.toLowerCase() || "";
				const nameB = b.data?.map?.name?.toLowerCase() || "";
				return nameB.localeCompare(nameA);
			});
		case "size_desc":
			return sorted.sort((a, b) => getCount(b) - getCount(a));
		case "size_asc":
			return sorted.sort((a, b) => getCount(a) - getCount(b));
		default:
			return sorted;
	}
};

// Helper to filter by status
const filterByStatus = (c: Collection, status: StatusFilter) => {
	if (status === "all") return true;
	if (status === "complete") return isComplete(c);
	if (status === "open") return !isComplete(c);
	return true;
};

// Helper to filter by size
const filterBySize = (c: Collection, size: SizeFilter) => {
	const count = getCount(c);
	switch (size) {
		case "small":
			return count > 0 && count < 100;
		case "medium":
			return count >= 100 && count < 1000;
		case "large":
			return count >= 1000;
		default:
			return true;
	}
};

const Collections = () => {
	useSignals();

	const { data, isLoading } = useQuery<Collection[]>({
		queryKey: ["collections"],
		queryFn: async () =>
			await fetch(`${MARKET_API_HOST}/collection/`).then((res) => res.json()),
	});

	// Get current filter values (access during render for reactivity)
	const searchVal = collectionSearch.value;
	const statusVal = collectionStatus.value;
	const sizeVal = collectionSize.value;
	const sortVal = collectionSort.value;

	// Filter and sort collections
	const filteredCollections = useMemo(() => {
		if (!data) return [];

		let result = data.filter((c) => {
			if (!c.outpoint || typeof c.outpoint !== "string") return false;

			// Search filter
			if (searchVal) {
				const name = c.data?.map?.name?.toLowerCase() || "";
				if (!name.includes(searchVal.toLowerCase())) return false;
			}

			// Status filter
			if (!filterByStatus(c, statusVal)) return false;

			// Size filter
			if (!filterBySize(c, sizeVal)) return false;

			return true;
		});

		// Apply sorting
		result = sortCollections(result, sortVal);

		return result;
	}, [data, searchVal, statusVal, sizeVal, sortVal]);

	// Check if any filters are active
	const hasActiveFilters = searchVal ||
		statusVal !== "all" ||
		sizeVal !== "all" ||
		sortVal !== "newest";

	return (
		<div className="flex-1">
			{/* Featured Section */}
			{collectionView.value === "featured" && (
				<section className="px-4 md:px-6 py-6 border-b border-border">
					<div className="flex items-center gap-2 mb-4">
						<Sparkles className="w-5 h-5 text-primary" />
						<h2 className="font-serif italic text-lg text-foreground">
							Featured Collections
						</h2>
					</div>
					<FeaturedCollections />
				</section>
			)}

			{/* Current Hype / All Collections Section */}
			<section className="px-4 md:px-6 py-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						{collectionView.value === "featured" ? (
							<>
								<TrendingUp className="w-5 h-5 text-primary" />
								<h2 className="font-serif italic text-lg text-foreground">
									Current Hype
								</h2>
							</>
						) : (
							<>
								<Layers className="w-5 h-5 text-primary" />
								<h2 className="font-serif italic text-lg text-foreground">
									All Collections
								</h2>
							</>
						)}
						{filteredCollections && (
							<Badge
								variant="outline"
								className="ml-2 rounded-md border-border text-muted-foreground font-mono text-[10px]"
							>
								{filteredCollections.length}
							</Badge>
						)}
					</div>

					{/* Active filters indicator */}
					{hasActiveFilters && (
						<button
							type="button"
							onClick={() => {
								collectionSearch.value = "";
								collectionStatus.value = "all";
								collectionSize.value = "all";
								collectionSort.value = "newest";
							}}
							className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-mono uppercase tracking-wider transition-colors"
						>
							<Filter className="w-3 h-3" />
							Clear Filters
						</button>
					)}
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{[...Array(8)].map((_, i) => (
							<Card key={i} className="bg-card border-border overflow-hidden">
								<Skeleton className="aspect-square w-full" />
								<CardContent className="p-3">
									<Skeleton className="h-4 w-3/4 mb-2" />
									<Skeleton className="h-3 w-1/2" />
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Collections Grid */}
				{!isLoading && filteredCollections && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{filteredCollections.map((c) => (
							<Link
								key={c.outpoint}
								href={`/collection/${c.outpoint}`}
								className="group"
							>
								<Card className="bg-card border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
									<div className="relative aspect-square overflow-hidden bg-muted">
										<Artifact
											classNames={{
												wrapper: "bg-transparent",
												media:
													"rounded-none bg-card text-center p-0 h-full w-full object-cover",
											}}
											artifact={c}
											size={300}
											sizes={"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
											showFooter={false}
											disableLink={true}
										/>
										{/* Gradient overlay */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
								<CardContent className="p-3 bg-card">
									<h3 className="font-mono text-sm text-foreground truncate group-hover:text-primary transition-colors">
										{c.data?.map?.name || "Unnamed Collection"}
									</h3>
									<div className="flex items-center justify-between mt-2">
										<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
											Block #{c.height}
										</span>
										<div className="flex items-center gap-1.5">
											{c.stats && c.stats.max > 0 && (
												<Badge
													variant={isComplete(c) ? "default" : "outline"}
													className={`rounded-md font-mono text-[10px] px-1.5 py-0 ${
														isComplete(c)
															? "bg-green-500/10 text-green-500 border-green-500/30"
															: "text-muted-foreground"
													}`}
												>
													{isComplete(c) ? "✓" : "○"}
												</Badge>
											)}
											{c.stats && (
												<Badge
													variant="secondary"
													className="rounded-md font-mono text-[10px] px-1.5 py-0"
												>
													{c.stats.count}
													{c.stats.max ? `/${c.stats.max}` : ""}
												</Badge>
											)}
										</div>
									</div>
								</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}

				{/* Empty State */}
				{!isLoading && filteredCollections?.length === 0 && (
					<div className="text-center py-12">
						<Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
							No Collections Found
						</h3>
						<p className="text-xs text-muted-foreground mt-2">
							Try adjusting your search query
						</p>
					</div>
				)}
			</section>
		</div>
	);
};

export default Collections;
