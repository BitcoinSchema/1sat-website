import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageWithFallback from "@/components/image-with-fallback";
import { Bsv21DetailClient } from "@/components/market/bsv21-detail-client";
import { createStackServices, stackContentUrl } from "@/lib/stack";
import { isValidOutpoint } from "@/lib/validation";
import {
	formatBsv21Amount,
	getBsv21Listings,
	isBsv21TokenId,
	safeOverlayFee,
} from "@/lib/wallet/bsv21-actions";

interface Bsv21DetailPageProps {
	params: Promise<{ tokenId: string }>;
}

export default async function Bsv21DetailPage({
	params,
}: Bsv21DetailPageProps) {
	const { tokenId } = await params;
	if (!isBsv21TokenId(tokenId)) notFound();

	const services = createStackServices();
	const [details, listings] = await Promise.all([
		services.bsv21.getTokenDetails(tokenId),
		getBsv21Listings({ services }, tokenId),
	]);
	const decimals = Number.parseInt(details.token.dec ?? "0", 10);
	const symbol = details.token.sym || tokenId.slice(0, 8);
	const overlayFee = safeOverlayFee(details);

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 p-4">
			<Link
				className="inline-flex items-center rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				href="/market/bsv21"
			>
				<ArrowLeft className="mr-2 size-4" /> Back to BSV21 tokens
			</Link>
			<header className="flex flex-col gap-5 sm:flex-row sm:items-start">
				{details.token.icon && isValidOutpoint(details.token.icon) ? (
					<ImageWithFallback
						src={stackContentUrl(details.token.icon)}
						alt=""
						width={80}
						height={80}
						className="size-20 rounded-lg border object-cover"
					/>
				) : null}
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-3xl font-bold">{symbol}</h1>
						<span className="rounded bg-muted px-2 py-1 text-xs uppercase">
							BSV21
						</span>
						<span
							className={
								details.status?.is_active
									? "text-sm text-primary"
									: "text-sm text-destructive"
							}
						>
							{details.status?.is_active ? "active" : "inactive"}
						</span>
					</div>
					<p className="break-all font-mono text-xs text-muted-foreground">
						{tokenId}
					</p>
				</div>
			</header>
			<dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<dt className="text-xs text-muted-foreground">Deploy amount</dt>
					<dd className="mt-1 break-all font-mono">
						{formatBsv21Amount(details.token.amt, decimals)}
					</dd>
				</div>
				<div>
					<dt className="text-xs text-muted-foreground">Decimals</dt>
					<dd className="mt-1 font-mono">{decimals}</dd>
				</div>
				<div>
					<dt className="text-xs text-muted-foreground">Indexed outputs</dt>
					<dd className="mt-1 font-mono">
						{details.status?.output_count ?? "unavailable"}
					</dd>
				</div>
				<div>
					<dt className="text-xs text-muted-foreground">
						Overlay fee per token output
					</dt>
					<dd className="mt-1 font-mono">
						{overlayFee === null ? "invalid/unavailable" : `${overlayFee} sats`}
					</dd>
				</div>
			</dl>
			<Bsv21DetailClient details={details} listings={listings} />
		</div>
	);
}

export async function generateMetadata({
	params,
}: Bsv21DetailPageProps): Promise<Metadata> {
	const { tokenId } = await params;
	if (!isBsv21TokenId(tokenId)) return { title: "BSV21 token - 1Sat" };
	try {
		const details = await createStackServices().bsv21.getTokenDetails(tokenId);
		return {
			title: `${details.token.sym || tokenId.slice(0, 8)} BSV21 - 1Sat`,
			description: `Review the indexed BSV21 token and active listings for ${tokenId}.`,
		};
	} catch {
		return { title: "BSV21 token - 1Sat" };
	}
}
