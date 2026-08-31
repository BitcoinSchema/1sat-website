import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { toBitcoin } from "satoshi-token";
import Artifact from "@/components/artifact";
import BuyButton from "@/components/market/buy-button";
import {
	fetchStackCapabilities,
	listingFromOutput,
	marketClient,
	ordfsClient,
	toStackOutpoint,
	txoClient,
} from "@/lib/stack";
import type { OrdUtxo } from "@/lib/types/ordinals";
import { isValidOutpoint } from "@/lib/validation";

// Detail metadata may be cached briefly. The client buy review independently
// revalidates the active origin listing immediately before wallet authorization.
export const revalidate = 30;

export async function generateStaticParams() {
	return [];
}

interface HistoryEntry {
	outpoint: string;
	score: number;
	spend?: string;
	events?: string[];
}

const getDetails = async (
	outpoint: string,
	capabilities: Awaited<ReturnType<typeof fetchStackCapabilities>>,
) => {
	const available = new Set(capabilities);
	const [metadata, txo, directListing] = await Promise.all([
		available.has("ordfs")
			? ordfsClient.getMetadata(outpoint).catch(() => null)
			: null,
		available.has("txo") ? txoClient.get(outpoint).catch(() => null) : null,
		available.has("market")
			? marketClient.getListing(outpoint).catch(() => null)
			: null,
	]);
	if (!metadata && !txo && !directListing) return null;

	// Prefer the origin recorded on the listing itself — ordfs metadata can
	// lack the origin for listing (OrdLock) outpoints
	const origin =
		(directListing && listingFromOutput(directListing).origin) ||
		metadata?.origin ||
		outpoint;

	const [originListing, historyRaw] = await Promise.all([
		available.has("market")
			? marketClient.getListingByOrigin(origin).catch(() => null)
			: null,
		available.has("txo")
			? txoClient
					.search(`ev:origin:${origin}`, { limit: 50, rev: true })
					.catch(() => null)
			: null,
	]);
	// A direct lookup proves what a historical outpoint contained. Only the
	// active-by-origin lookup proves which listing, if any, may still be bought.
	const listing = originListing;

	// the stack returns null (Go nil slice) for empty result sets
	const history: HistoryEntry[] = historyRaw ?? [];

	return { metadata, txo, origin, listing, history, available };
};

const Outpoint = async ({
	params,
}: {
	params: Promise<{ outpoint: string }>;
}) => {
	const { outpoint: rawOutpoint } = await params;
	if (!isValidOutpoint(rawOutpoint)) {
		notFound();
	}
	const outpoint = toStackOutpoint(rawOutpoint);
	let capabilities: Awaited<ReturnType<typeof fetchStackCapabilities>>;
	try {
		capabilities = await fetchStackCapabilities();
	} catch {
		return (
			<div className="mx-auto w-full max-w-5xl p-4">
				<h1 className="text-2xl font-bold">Outpoint explorer</h1>
				<p className="mt-4 text-destructive" role="alert">
					The stack capability manifest could not be loaded.
				</p>
			</div>
		);
	}
	if (
		!capabilities.includes("txo") &&
		!capabilities.includes("ordfs") &&
		!capabilities.includes("market")
	) {
		return (
			<div className="mx-auto w-full max-w-5xl p-4">
				<h1 className="text-2xl font-bold">Outpoint explorer</h1>
				<p className="mt-4 text-muted-foreground" role="status">
					Outpoint exploration is disabled because TXO, ORDFS, and Market
					capabilities are unavailable.
				</p>
			</div>
		);
	}

	const details = await getDetails(outpoint, capabilities);
	if (!details) {
		notFound();
	}

	const { available, metadata, origin, listing, history } = details;
	const contentType = metadata?.contentType;
	const mapName =
		(metadata?.map?.name as string | undefined) ||
		(metadata?.map?.subTypeData as { name?: string } | undefined)?.name;

	const activeListing =
		listing && !listingFromOutput(listing).spend_txid
			? listingFromOutput(listing)
			: null;

	// Minimal OrdUtxo shape for the artifact renderer
	const [txid, voutStr] = outpoint.split(".");
	const artifact: Partial<OrdUtxo> = {
		txid,
		vout: Number.parseInt(voutStr || "0", 10),
		outpoint,
		origin: {
			outpoint: origin,
			data: {
				insc: contentType
					? { file: { type: contentType, size: metadata?.contentLength ?? 0 } }
					: undefined,
				map: metadata?.map as Record<string, string> | undefined,
			},
		} as OrdUtxo["origin"],
	};

	return (
		<div className="mx-auto w-full max-w-5xl p-4">
			<div className="grid gap-8 md:grid-cols-2">
				<div className="rounded-md border border-border bg-muted/30 overflow-hidden">
					{available.has("ordfs") ? (
						<Suspense
							fallback={
								<div className="flex items-center justify-center h-64">
									<Loader2 className="w-6 h-6 animate-spin" />
								</div>
							}
						>
							<Artifact
								artifact={artifact}
								showFooter={false}
								disableLink
								clickToZoom
							/>
						</Suspense>
					) : (
						<p className="p-6 text-muted-foreground" role="status">
							Content preview is disabled because ORDFS is unavailable.
						</p>
					)}
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<h1 className="text-2xl font-bold break-all">
							{mapName || contentType || "Inscription"}
						</h1>
						<p className="text-xs text-muted-foreground font-mono break-all mt-1">
							{outpoint}
						</p>
					</div>

					<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
						{contentType && (
							<>
								<dt className="text-muted-foreground">Type</dt>
								<dd className="font-mono">{contentType}</dd>
							</>
						)}
						<dt className="text-muted-foreground">Origin</dt>
						<dd className="font-mono break-all">{origin}</dd>
						{activeListing?.seller && (
							<>
								<dt className="text-muted-foreground">Seller</dt>
								<dd className="font-mono break-all">{activeListing.seller}</dd>
							</>
						)}
					</dl>

					{!available.has("market") ? (
						<div className="text-sm text-muted-foreground" role="status">
							Listing status is disabled because Market capability is
							unavailable.
						</div>
					) : activeListing?.price ? (
						<div className="rounded-md border border-primary/40 p-4 flex flex-col gap-3">
							<div className="text-lg">
								Listed for{" "}
								<span className="text-primary font-bold">
									{toBitcoin(activeListing.price)} BSV
								</span>
							</div>
							<BuyButton
								outpoint={activeListing.outpoint}
								price={activeListing.price}
								contentType={contentType}
								origin={origin}
								name={mapName}
							/>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							Not currently listed for sale.
						</div>
					)}
				</div>
			</div>

			{!available.has("txo") ? (
				<p className="mt-10 text-muted-foreground text-sm" role="status">
					Timeline is disabled because TXO capability is unavailable.
				</p>
			) : (
				history.length > 0 && (
					<div className="mt-10">
						<h2 className="text-lg font-bold mb-3">Timeline</h2>
						<ul className="flex flex-col gap-1 text-sm font-mono">
							{history.map((h) => (
								<li
									key={h.outpoint}
									className="flex items-center gap-3 border-b border-border/50 py-1.5"
								>
									<span className="break-all">{h.outpoint}</span>
									<span className="text-muted-foreground text-xs ml-auto shrink-0">
										{h.spend ? "spent" : "unspent"}
									</span>
								</li>
							))}
						</ul>
					</div>
				)
			)}
		</div>
	);
};

export default Outpoint;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ outpoint: string }>;
}) {
	const { outpoint: rawOutpoint } = await params;
	const outpoint = toStackOutpoint(rawOutpoint);
	const fallbackMetadata = {
		title: "Outpoint - 1Sat",
		description: "Explore item details on 1Sat.",
	};
	if (!isValidOutpoint(rawOutpoint)) {
		return fallbackMetadata;
	}
	try {
		const metadata = await ordfsClient.getMetadata(outpoint);
		const name =
			(metadata?.map?.name as string | undefined) ||
			metadata?.contentType ||
			"Inscription";
		return {
			title: `${name} - 1Sat`,
			description: `Explore item details for ${name} on 1Sat.`,
		};
	} catch {
		return fallbackMetadata;
	}
}
