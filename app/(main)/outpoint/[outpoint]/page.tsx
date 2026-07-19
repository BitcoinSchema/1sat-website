import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { toBitcoin } from "satoshi-token";
import Artifact from "@/components/artifact";
import BuyButton from "@/components/market/buy-button";
import {
	listingFromOutput,
	marketClient,
	ordfsClient,
	toStackOutpoint,
	txoClient,
} from "@/lib/stack";
import type { OrdUtxo } from "@/lib/types/ordinals";
import { isValidOutpoint } from "@/lib/validation";

// ISR: cache rendered pages at the CDN, revalidate in the background so
// crawler/repeat traffic doesn't invoke a serverless render every time
export const revalidate = 60;

export async function generateStaticParams() {
	return [];
}

interface HistoryEntry {
	outpoint: string;
	score: number;
	spend?: string;
	events?: string[];
}

const getDetails = async (outpoint: string) => {
	const [metadata, txo, directListing] = await Promise.all([
		ordfsClient.getMetadata(outpoint).catch(() => null),
		txoClient.get(outpoint).catch(() => null),
		marketClient.getListing(outpoint).catch(() => null),
	]);
	if (!metadata && !txo && !directListing) return null;

	// Prefer the origin recorded on the listing itself — ordfs metadata can
	// lack the origin for listing (OrdLock) outpoints
	const origin =
		(directListing && listingFromOutput(directListing).origin) ||
		metadata?.origin ||
		outpoint;

	const [originListing, historyRaw] = await Promise.all([
		directListing
			? Promise.resolve(null)
			: marketClient.getListingByOrigin(origin).catch(() => null),
		txoClient
			.search(`ev:origin:${origin}`, { limit: 50, rev: true })
			.catch(() => null),
	]);
	const listing = directListing ?? originListing;

	// the stack returns null (Go nil slice) for empty result sets
	const history: HistoryEntry[] = historyRaw ?? [];

	return { metadata, txo, origin, listing, history };
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

	const details = await getDetails(outpoint);
	if (!details) {
		notFound();
	}

	const { metadata, origin, listing, history } = details;
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

					{activeListing?.price ? (
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

			{history.length > 0 && (
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
