"use client";

import { MARKET_API_HOST, ORDFS } from "@/constants";
import type { Collection } from "@/types/collection";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import FeaturedCollections from "./featured";
import Artifact from "../artifact";
import { useSignals } from "@preact/signals-react/runtime";
import { collectionSearch, collectionView } from "./CollectionSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Layers } from "lucide-react";

const Collections = () => {
	useSignals();

	const { data, isLoading } = useQuery<Collection[]>({
		queryKey: ["collections"],
		queryFn: async () =>
			await fetch(`${MARKET_API_HOST}/collection/`).then((res) => res.json()),
	});

	// Filter collections based on search
	const filteredCollections = data?.filter((c) => {
		if (!c.outpoint || typeof c.outpoint !== "string") return false;
		if (!collectionSearch.value) return true;
		const name = c.data?.map?.name?.toLowerCase() || "";
		return name.includes(collectionSearch.value.toLowerCase());
	});

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
				<div className="flex items-center gap-2 mb-6">
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
