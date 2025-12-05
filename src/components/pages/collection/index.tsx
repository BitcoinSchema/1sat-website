"use client";

import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CollectionList } from "./CollectionList";
import { CollectionNavigation } from "./CollectionNavigation";
import Traits, { type Collection } from "./Traits";
import { Badge } from "@/components/ui/badge";

interface Props {
	stats: CollectionStats;
	collection: OrdUtxo;
	bannerImage?: string;
}

const CollectionPage = ({ stats, collection, bannerImage }: Props) => {
	const collectionName = collection.origin?.data?.map?.name || "Collection";

	return (
		<div className="flex-1">
			{/* Header */}
			<div className="px-4 md:px-6 py-4 border-b border-border bg-background">
				<div className="flex items-center justify-between">
					<Link
						href="/collection"
						className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-serif italic"
					>
						<ChevronLeft className="w-5 h-5" />
						<h1 className="text-xl">{collectionName}</h1>
					</Link>
					<div className="flex items-center gap-3">
						<Badge
							variant="outline"
							className="rounded-md border-border text-muted-foreground font-mono text-xs"
						>
							{stats.count} items
						</Badge>
						{stats.count === stats.max && (
							<Badge className="rounded-md bg-primary/20 text-primary border-primary/50 font-mono text-xs">
								Minted Out
							</Badge>
						)}
					</div>
				</div>
			</div>

			{/* Banner Image (if available) */}
			{bannerImage && (
				<div className="w-full max-h-[300px] overflow-hidden border-b border-border">
					<Image
						className="w-full h-full object-cover"
						height={300}
						width={980}
						alt={`${collectionName} banner`}
						src={bannerImage}
					/>
				</div>
			)}

			{/* Navigation Tabs */}
			<div className="border-b border-border">
				<CollectionNavigation />
			</div>

			{/* Traits Section */}
			{collection.origin?.data?.map && (
				<div className="px-4 md:px-6 py-6 border-b border-border">
					<Traits collection={collection.origin.data.map as Collection} />
				</div>
			)}

			{/* Collection Items */}
			<div className="px-4 md:px-6 py-6">
				<CollectionList collectionId={collection.outpoint} />
			</div>
		</div>
	);
};

export default CollectionPage;
