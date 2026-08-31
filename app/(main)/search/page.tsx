import Link from "next/link";
import { toBitcoin } from "satoshi-token";
import ImageWithFallback from "@/components/image-with-fallback";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	parseSearchCursor,
	type SearchState,
	searchExplorer,
} from "@/lib/explorer-search";
import {
	fetchStackCapabilities,
	stackContentUrl,
	toUrlOutpoint,
} from "@/lib/stack";

export const metadata = {
	title: "Search - 1Sat",
	description:
		"Search indexed transactions, outputs, OpNS names, and listings.",
};

function first(value: string | string[] | undefined): string {
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function StateMessage({
	state,
	label,
}: {
	state: SearchState<unknown>;
	label: string;
}) {
	if (state.status === "unavailable") {
		return (
			<p className="text-muted-foreground text-sm" role="status">
				{label} is disabled because the stack did not advertise its required
				capability.
			</p>
		);
	}
	if (state.status === "error") {
		return (
			<p className="text-destructive text-sm" role="alert">
				{label} could not be queried. Try again.
			</p>
		);
	}
	if (state.status === "not-found") {
		return <p className="text-muted-foreground text-sm">No {label} found.</p>;
	}
	return null;
}

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const query = first(params.q).trim();
	const cursor = parseSearchCursor(first(params.from) || undefined);

	let capabilities: Awaited<ReturnType<typeof fetchStackCapabilities>>;
	try {
		capabilities = await fetchStackCapabilities();
	} catch {
		return (
			<Page>
				<PageHeader>
					<PageTitle>Search</PageTitle>
				</PageHeader>
				<PageContent>
					<p className="text-destructive" role="alert">
						Search is unavailable because the stack capability manifest could
						not be loaded.
					</p>
				</PageContent>
			</Page>
		);
	}

	const tooLong = query.length > 200;
	const result =
		query && !tooLong
			? await searchExplorer(query, capabilities, cursor)
			: null;
	const canPreview = capabilities.includes("ordfs");

	return (
		<Page>
			<PageHeader>
				<div>
					<PageTitle>Search</PageTitle>
					<p className="text-muted-foreground text-sm">
						Find an outpoint, transaction ID, OpNS name, or active listing.
					</p>
				</div>
			</PageHeader>
			<PageContent className="space-y-8">
				<form action="/search" className="flex max-w-2xl gap-2" method="get">
					<Input
						aria-label="Search query"
						defaultValue={query}
						maxLength={200}
						name="q"
						placeholder="Outpoint, txid, OpNS name, or listing name"
						required
					/>
					<Button type="submit">Search</Button>
				</form>

				{tooLong && (
					<p className="text-destructive" role="alert">
						Search queries may be at most 200 characters.
					</p>
				)}

				{!query && (
					<p className="text-muted-foreground">
						Enter a 64-character transaction ID, a transaction ID with an output
						index, or a name prefix.
					</p>
				)}

				{result?.kind !== "name" && result && (
					<section className="space-y-3" aria-labelledby="exact-result">
						<h2 className="font-semibold text-lg" id="exact-result">
							Exact result
						</h2>
						{result.exact.status === "ready" ? (
							<div className="rounded-lg border p-4">
								<Link
									className="break-all font-mono text-primary text-sm underline-offset-4 hover:underline"
									href={result.exact.data.href}
								>
									{result.query}
								</Link>
								<p className="mt-2 text-muted-foreground text-sm">
									{result.exact.data.outputs.length} indexed output
									{result.exact.data.outputs.length === 1 ? "" : "s"}
								</p>
							</div>
						) : (
							<StateMessage label={result.kind} state={result.exact} />
						)}
					</section>
				)}

				{result?.kind === "name" && (
					<>
						<section className="space-y-3" aria-labelledby="opns-result">
							<h2 className="font-semibold text-lg" id="opns-result">
								OpNS
							</h2>
							{result.opns.status === "ready" ? (
								<Link
									className="block rounded-lg border p-4 hover:border-primary/50"
									href={`/outpoint/${toUrlOutpoint(result.opns.data.outpoint)}`}
								>
									<span className="font-medium">{result.opns.data.name}</span>
									<span className="mt-1 block break-all font-mono text-muted-foreground text-xs">
										{result.opns.data.outpoint}
									</span>
								</Link>
							) : (
								<StateMessage label="OpNS name" state={result.opns} />
							)}
						</section>

						<section className="space-y-3" aria-labelledby="listing-results">
							<h2 className="font-semibold text-lg" id="listing-results">
								Active listings
							</h2>
							{result.listings.status === "ready" ? (
								result.listings.data.items.length ? (
									<>
										<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
											{result.listings.data.items.map((listing) => (
												<Link
													className="overflow-hidden rounded-lg border hover:border-primary/50"
													href={`/outpoint/${toUrlOutpoint(listing.outpoint)}`}
													key={listing.outpoint}
												>
													<div className="aspect-square bg-muted">
														{canPreview &&
														listing.content_type?.startsWith("image/") ? (
															<ImageWithFallback
																alt={listing.name ?? listing.outpoint}
																className="h-full w-full object-cover"
																height={300}
																src={stackContentUrl(
																	listing.origin ?? listing.outpoint,
																)}
																width={300}
															/>
														) : (
															<div className="flex h-full items-center justify-center p-3 text-center text-muted-foreground text-xs">
																{canPreview
																	? (listing.content_type ?? "No preview")
																	: "ORDFS preview unavailable"}
															</div>
														)}
													</div>
													<div className="space-y-1 p-3">
														<p className="truncate text-sm">
															{listing.name ?? "Unnamed listing"}
														</p>
														{listing.price !== undefined && (
															<p className="font-mono text-primary text-xs">
																{toBitcoin(listing.price)} BSV
															</p>
														)}
													</div>
												</Link>
											))}
										</div>
										{result.listings.data.nextCursor !== null && (
											<Button asChild variant="outline">
												<Link
													href={`/search?q=${encodeURIComponent(result.query)}&from=${result.listings.data.nextCursor}`}
												>
													More results
												</Link>
											</Button>
										)}
									</>
								) : (
									<p className="text-muted-foreground text-sm">
										No active listings found.
									</p>
								)
							) : (
								<StateMessage
									label="market listing search"
									state={result.listings}
								/>
							)}
						</section>
					</>
				)}
			</PageContent>
		</Page>
	);
}
