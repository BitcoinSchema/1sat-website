import Link from "next/link";
import { toBitcoin } from "satoshi-token";
import ImageWithFallback from "@/components/image-with-fallback";
import {
	listingFromOutput,
	marketClient,
	stackContentUrl,
	toUrlOutpoint,
} from "@/lib/stack";

// ISR: the listings feed is shared across all visitors
export const revalidate = 30;

const MarketOrdinalsPage = async () => {
	const outputs = await marketClient
		.searchListings({ status: "active", limit: 48, rev: true })
		.catch(() => null);
	// the stack returns null (Go nil slice) for empty result sets
	const listings = (outputs ?? [])
		.map(listingFromOutput)
		.filter((l) => l.price && !l.spend_txid);

	return (
		<div className="p-4 mx-auto w-full max-w-7xl">
			<h1 className="text-2xl font-bold mb-6">Market: Ordinals</h1>
			{listings.length === 0 ? (
				<p className="text-muted-foreground">No active listings found.</p>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
					{listings.map((l) => (
						<Link
							key={l.outpoint}
							href={`/outpoint/${toUrlOutpoint(l.outpoint)}`}
							className="group rounded-md border border-border bg-muted/30 overflow-hidden hover:border-primary/50 transition-colors"
						>
							<div className="aspect-square overflow-hidden bg-muted">
								{l.content_type?.startsWith("image") ? (
									<ImageWithFallback
										src={stackContentUrl(l.origin || l.outpoint)}
										alt={l.name || l.outpoint}
										width={300}
										height={300}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform"
									/>
								) : (
									<div className="flex items-center justify-center h-full text-xs text-muted-foreground font-mono p-2 text-center break-all">
										{l.content_type || "unknown"}
									</div>
								)}
							</div>
							<div className="p-2 flex flex-col gap-0.5">
								<span className="text-sm truncate">
									{l.name || l.content_type || "Inscription"}
								</span>
								<span className="text-xs text-primary font-mono">
									{toBitcoin(l.price ?? 0)} BSV
								</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
};

export default MarketOrdinalsPage;

export const metadata = {
	title: "Ordinals Market - 1Sat",
	description: "Browse 1Sat Ordinals listed for sale.",
};
