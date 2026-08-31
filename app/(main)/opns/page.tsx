import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSatoshisAsBsv } from "@/components/wallet/wallet-home-utils";
import {
	normalizeOpnsName,
	opnsSearchHref,
	parseOpnsCursor,
	searchOpnsListings,
} from "@/lib/opns";
import { fetchStackCapabilities, marketClient } from "@/lib/stack";

export const metadata = {
	title: "OpNS Names - 1Sat",
	description: "Resolve OpNS origins and browse active name listings.",
};

export default async function OpnsPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string | string[];
		from?: string | string[];
	}>;
}) {
	const params = await searchParams;
	const rawQuery = typeof params.q === "string" ? params.q : "";
	const query = rawQuery ? normalizeOpnsName(rawQuery) : null;
	const cursor = parseOpnsCursor(params.from);
	const capabilities = await fetchStackCapabilities().catch(() => null);
	const listings = capabilities
		? await searchOpnsListings(
				capabilities,
				marketClient,
				query ?? undefined,
				cursor,
			)
		: null;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">OpNS</h1>
					<p className="text-sm text-muted-foreground">
						Resolve registered names and browse typed active listings.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/wallet/opns">My names</Link>
				</Button>
			</div>

			<form className="grid gap-2 sm:grid-cols-[1fr_auto]">
				<Input
					name="q"
					defaultValue={rawQuery}
					placeholder="Exact OpNS name or market prefix"
					maxLength={64}
					aria-label="Find an OpNS name"
				/>
				<Button type="submit">
					<Search className="size-4" data-icon="inline-start" />
					Find name
				</Button>
			</form>

			{rawQuery && !query && (
				<p
					className="rounded-md border border-destructive/50 p-4 text-sm text-destructive"
					role="alert"
				>
					Enter a non-empty name no longer than 64 UTF-8 bytes.
				</p>
			)}
			{query && capabilities?.includes("opns") && (
				<div className="rounded-md border p-4">
					<p className="font-medium">Exact name</p>
					<p className="mb-3 font-mono text-sm text-muted-foreground">
						{query}
					</p>
					<Button asChild size="sm">
						<Link href={`/opns/${encodeURIComponent(query)}`}>
							Resolve details
						</Link>
					</Button>
				</div>
			)}

			{!capabilities ? (
				<p
					className="rounded-md border border-destructive/50 p-4 text-sm text-destructive"
					role="alert"
				>
					The stack capability manifest could not be loaded. Name and market
					discovery are disabled.
				</p>
			) : !capabilities.includes("opns") ? (
				<p
					className="rounded-md border p-4 text-sm text-muted-foreground"
					role="status"
				>
					Exact name resolution is disabled because OpNS capability is
					unavailable.
				</p>
			) : null}

			<section className="space-y-3" aria-labelledby="opns-listings-heading">
				<h2 id="opns-listings-heading" className="text-lg font-semibold">
					Active name listings
				</h2>
				{!listings ? null : listings.status === "unavailable" ? (
					<p
						className="rounded-md border p-4 text-sm text-muted-foreground"
						role="status"
					>
						{listings.reason}
					</p>
				) : listings.status === "error" ? (
					<div
						className="rounded-md border border-destructive/50 p-4"
						role="alert"
					>
						<p className="text-sm text-destructive">
							Active OpNS listings could not be loaded.
						</p>
						<Button asChild className="mt-3" size="sm" variant="outline">
							<Link href={opnsSearchHref(query ?? undefined, cursor)}>
								Try again
							</Link>
						</Button>
					</div>
				) : listings.status === "ready" &&
					listings.data.listings.length === 0 ? (
					<p className="rounded-md border p-8 text-center text-muted-foreground">
						No active OpNS listings match this search.
					</p>
				) : listings.status === "ready" ? (
					<>
						<div className="divide-y rounded-md border">
							{listings.data.listings.map((listing) => (
								<Link
									key={listing.outpoint}
									href={
										listing.name
											? `/opns/${encodeURIComponent(listing.name)}`
											: `/outpoint/${listing.outpoint.replace(".", "_")}`
									}
									className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/40"
								>
									<div className="min-w-0">
										<p className="font-medium">
											{listing.name ?? "Unnamed OpNS output"}
										</p>
										<p className="truncate font-mono text-xs text-muted-foreground">
											{listing.outpoint}
										</p>
									</div>
									<span className="font-mono text-sm text-primary">
										{formatSatoshisAsBsv(listing.price ?? 0)} BSV
									</span>
								</Link>
							))}
						</div>
						{listings.data.nextCursor !== null && (
							<div className="flex justify-center">
								<Button asChild variant="outline">
									<Link
										href={opnsSearchHref(
											query ?? undefined,
											listings.data.nextCursor,
										)}
									>
										Next listings
									</Link>
								</Button>
							</div>
						)}
					</>
				) : null}
			</section>

			<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
				Direct mining/claim is intentionally hidden. The typed `getMine` result
				does not provide the AtomicBEEF and derivation data required by
				`internalizeOpns`, so the website cannot safely resume or recover a
				claim.
			</div>
		</div>
	);
}
