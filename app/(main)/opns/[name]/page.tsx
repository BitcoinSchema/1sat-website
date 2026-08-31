import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpnsBuyButton } from "@/components/opns/opns-buy-button";
import { Button } from "@/components/ui/button";
import { formatSatoshisAsBsv } from "@/components/wallet/wallet-home-utils";
import { normalizeOpnsName, resolveOpnsDetail } from "@/lib/opns";
import {
	fetchStackCapabilities,
	stackServices,
	toUrlOutpoint,
} from "@/lib/stack";

export const revalidate = 30;

export async function generateStaticParams() {
	return [];
}

export default async function OpnsDetailPage({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name: rawName } = await params;
	const name = normalizeOpnsName(rawName);
	if (!name) notFound();

	const capabilities = await fetchStackCapabilities().catch(() => null);
	const detail = capabilities
		? await resolveOpnsDetail(name, capabilities, {
				opns: stackServices.opns,
				market: stackServices.market,
				ordfs: stackServices.ordfs,
			})
		: null;
	if (capabilities && !detail) notFound();

	return (
		<div className="mx-auto w-full max-w-4xl space-y-6 p-4">
			<Button asChild size="sm" variant="ghost">
				<Link href="/opns">
					<ArrowLeft className="size-4" data-icon="inline-start" />
					OpNS discovery
				</Link>
			</Button>

			<div>
				<h1 className="break-all text-2xl font-bold">{name}</h1>
				<p className="text-sm text-muted-foreground">
					Typed origin, content, ownership availability, and active listing
					state.
				</p>
			</div>

			{!capabilities || !detail ? (
				<p
					className="rounded-md border border-destructive/50 p-4 text-sm text-destructive"
					role="alert"
				>
					The stack capability manifest could not be loaded. Resolution and
					purchase are disabled.
				</p>
			) : (
				<>
					<section className="space-y-3 rounded-md border p-4">
						<h2 className="font-semibold">Registration</h2>
						{detail.origin.status === "ready" ? (
							<dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
								<dt className="text-muted-foreground">Status</dt>
								<dd>Registered</dd>
								<dt className="text-muted-foreground">Origin</dt>
								<dd className="min-w-0 break-all font-mono">
									<Link
										className="text-primary hover:underline"
										href={`/outpoint/${toUrlOutpoint(detail.origin.data.outpoint)}`}
									>
										{detail.origin.data.outpoint}
									</Link>
								</dd>
							</dl>
						) : detail.origin.status === "not-found" ? (
							<div className="space-y-3 text-sm">
								<p>This exact name is not currently registered.</p>
								{detail.mine.status === "ready" && (
									<p className="text-muted-foreground">
										The typed mining lookup found prefix{" "}
										{detail.mine.data.domain} at{" "}
										<span className="break-all font-mono">
											{detail.mine.data.outpoint}
										</span>
										.
									</p>
								)}
								<Button disabled>Direct claim unavailable</Button>
								<p className="text-muted-foreground">
									The installed <code>getMine</code> result exposes only an
									outpoint and domain. <code>internalizeOpns</code> requires
									AtomicBEEF and derivation data, so a recoverable claim cannot
									be authorized here.
								</p>
							</div>
						) : detail.origin.status === "unavailable" ? (
							<p className="text-sm text-muted-foreground" role="status">
								{detail.origin.reason}
							</p>
						) : (
							<p className="text-sm text-destructive" role="alert">
								Origin resolution failed. Retry without changing providers.
							</p>
						)}
					</section>

					<section className="space-y-3 rounded-md border p-4">
						<h2 className="font-semibold">Published profile</h2>
						<p className="text-sm text-muted-foreground" role="status">
							{detail.profile.status === "unavailable"
								? detail.profile.reason
								: "No typed profile result is available."}
						</p>
					</section>

					<section className="space-y-3 rounded-md border p-4">
						<h2 className="font-semibold">Indexed content</h2>
						{detail.metadata.status === "ready" ? (
							<dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
								<dt className="text-muted-foreground">Content type</dt>
								<dd className="font-mono">
									{detail.metadata.data.contentType}
								</dd>
								<dt className="text-muted-foreground">Bytes</dt>
								<dd>{detail.metadata.data.contentLength.toLocaleString()}</dd>
								<dt className="text-muted-foreground">Sequence</dt>
								<dd>{detail.metadata.data.sequence}</dd>
							</dl>
						) : detail.metadata.status === "unavailable" ? (
							<p className="text-sm text-muted-foreground" role="status">
								{detail.metadata.reason}
							</p>
						) : detail.metadata.status === "error" ? (
							<p className="text-sm text-destructive" role="alert">
								Indexed content metadata could not be loaded.
							</p>
						) : (
							<p className="text-sm text-muted-foreground">
								No indexed content metadata.
							</p>
						)}
					</section>

					<section className="space-y-3 rounded-md border p-4">
						<h2 className="font-semibold">Active listing</h2>
						{detail.listing.status === "ready" ? (
							<div className="space-y-3">
								<dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
									<dt className="text-muted-foreground">Listing outpoint</dt>
									<dd className="break-all font-mono">
										{detail.listing.data.outpoint}
									</dd>
									<dt className="text-muted-foreground">Price</dt>
									<dd className="font-mono">
										{detail.listing.data.price?.toLocaleString()} sats ({" "}
										{formatSatoshisAsBsv(detail.listing.data.price ?? 0)} BSV)
									</dd>
								</dl>
								<OpnsBuyButton listing={detail.listing.data} />
							</div>
						) : detail.listing.status === "unavailable" ? (
							<p className="text-sm text-muted-foreground" role="status">
								{detail.listing.reason}
							</p>
						) : detail.listing.status === "error" ? (
							<p className="text-sm text-destructive" role="alert">
								Active listing status could not be loaded; purchase is disabled.
							</p>
						) : (
							<p className="text-sm text-muted-foreground">
								This name is not actively listed.
							</p>
						)}
					</section>
				</>
			)}
		</div>
	);
}
