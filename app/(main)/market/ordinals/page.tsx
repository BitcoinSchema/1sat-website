import { Search } from "lucide-react";
import Link from "next/link";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSatoshisAsBsv } from "@/components/wallet/wallet-home-utils";
import {
	marketSearchHref,
	parseMarketFilters,
	searchActiveOrdinalListings,
} from "@/lib/ordinal-marketplace";
import { marketClient, stackContentUrl, toUrlOutpoint } from "@/lib/stack";

export const metadata = {
	title: "Ordinals Market - 1Sat",
	description: "Browse active 1Sat Ordinals listings.",
};

export default async function MarketOrdinalsPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string | string[];
		type?: string | string[];
		from?: string | string[];
	}>;
}) {
	const filters = parseMarketFilters(await searchParams);
	const result = await searchActiveOrdinalListings(marketClient, filters).catch(
		() => null,
	);

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Ordinal marketplace</h1>
					<p className="text-sm text-muted-foreground">
						Active OrdLock listings from the 1Sat market index.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/market/ordinals/my-listings">My Listings</Link>
				</Button>
			</div>

			<form className="mb-6 grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
				<Input
					name="q"
					defaultValue={filters.q}
					placeholder="Filter by name"
					maxLength={80}
					aria-label="Filter listings by name"
				/>
				<Input
					name="type"
					defaultValue={filters.type}
					placeholder="Content type, e.g. image/png"
					maxLength={80}
					aria-label="Filter listings by content type"
				/>
				<Button type="submit">
					<Search className="size-4" data-icon="inline-start" />
					Filter
				</Button>
			</form>

			{!result ? (
				<div
					className="rounded-md border border-destructive/50 p-4"
					role="alert"
				>
					<p className="text-sm text-destructive">
						Active listings could not be loaded.
					</p>
					<Button asChild className="mt-3" size="sm" variant="outline">
						<Link href={marketSearchHref(filters)}>Try again</Link>
					</Button>
				</div>
			) : result.listings.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					No active listings match these filters.
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{result.listings.map((listing) => (
							<Link
								key={listing.outpoint}
								href={`/outpoint/${toUrlOutpoint(listing.outpoint)}`}
								className="group overflow-hidden rounded-md border border-border bg-muted/30 transition-colors hover:border-primary/50"
							>
								<div className="aspect-square overflow-hidden bg-muted">
									{listing.content_type?.startsWith("image/") ? (
										<ImageWithFallback
											src={stackContentUrl(listing.origin ?? listing.outpoint)}
											alt={listing.name ?? listing.outpoint}
											width={300}
											height={300}
											className="size-full object-cover transition-transform group-hover:scale-105"
										/>
									) : (
										<div className="flex size-full items-center justify-center break-all p-2 text-center font-mono text-xs text-muted-foreground">
											{listing.content_type ?? "unknown content"}
										</div>
									)}
								</div>
								<div className="flex flex-col gap-0.5 p-2">
									<span className="truncate text-sm">
										{listing.name ?? listing.content_type ?? "Inscription"}
									</span>
									<span className="font-mono text-xs text-primary">
										{formatSatoshisAsBsv(listing.price ?? 0)} BSV
									</span>
								</div>
							</Link>
						))}
					</div>

					{result.nextCursor !== null && (
						<div className="mt-6 flex justify-center">
							<Button asChild variant="outline">
								<Link
									href={marketSearchHref({
										...filters,
										from: result.nextCursor,
									})}
								>
									Next listings
								</Link>
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
