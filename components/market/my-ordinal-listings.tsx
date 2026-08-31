"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { OrdinalActionDialog } from "@/components/wallet/ordinal-action-dialog";
import { formatSatoshisAsBsv } from "@/components/wallet/wallet-home-utils";
import { matchWalletListings } from "@/lib/ordinal-marketplace";
import { toStackOutpoint, toUrlOutpoint } from "@/lib/stack";
import { isOrdinalListed, ordinalAssetId } from "@/lib/wallet/ordinal-actions";
import { getName, getOriginOutpoint } from "@/lib/wallet/wallet-output-utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function MyOrdinalListings() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		oneSatContext,
		ordinals,
		identityKey,
		isInitialized,
		isInitializing,
		refreshBalance,
	} = useWalletToolbox();
	const [cancelOutpoint, setCancelOutpoint] = useState<string | null>(null);
	const identityScopeRef = useRef(identityKey);

	useEffect(() => {
		if (identityScopeRef.current === identityKey) return;
		identityScopeRef.current = identityKey;
		setCancelOutpoint(null);
	}, [identityKey]);

	const owned = useMemo(
		() =>
			ordinals
				.filter((output) => isOrdinalListed(output) && !!ordinalAssetId(output))
				.map((output) => ({
					output,
					origin: toStackOutpoint(getOriginOutpoint(output)),
				})),
		[ordinals],
	);
	const originsKey = owned
		.map(({ origin }) => origin)
		.sort()
		.join(",");
	const listingsQuery = useQuery({
		queryKey: ["market-my-listings", identityKey, originsKey],
		queryFn: async () => {
			if (!oneSatContext?.services?.market || owned.length === 0) return {};
			return oneSatContext.services.market.getListingsByOrigins(
				owned.map(({ origin }) => origin),
			);
		},
		enabled: isInitialized && !!oneSatContext?.services?.market,
		staleTime: 15_000,
	});
	const verified = useMemo(
		() => matchWalletListings(owned, listingsQuery.data ?? {}),
		[owned, listingsQuery.data],
	);
	const verifiedOutpoints = new Set(
		verified.map(({ output }) => output.outpoint),
	);
	const unconfirmed = owned.filter(
		({ output }) => !verifiedOutpoints.has(output.outpoint),
	);
	const cancelOrdinal = owned.find(
		({ output }) => output.outpoint === cancelOutpoint,
	)?.output;

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["market-flow"] }),
			queryClient.invalidateQueries({ queryKey: ["market-my-listings"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center py-12 text-muted-foreground">
				<Loader2 className="mr-2 size-5 animate-spin" />
				Loading wallet…
			</div>
		);
	}

	if (!isInitialized || !oneSatContext) {
		return (
			<div className="rounded-md border p-8 text-center">
				<p className="text-muted-foreground">
					Connect a wallet to reconcile its OrdLock outputs with the market.
				</p>
				<Button asChild className="mt-4" variant="outline">
					<Link href="/wallet">Connect wallet</Link>
				</Button>
			</div>
		);
	}

	if (!oneSatContext.services?.market) {
		return (
			<p className="rounded-md border p-6 text-muted-foreground" role="status">
				My Listings is unavailable because the active context has no market
				service.
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Button
					variant="outline"
					disabled={listingsQuery.isFetching}
					onClick={() => void refresh()}
				>
					<RefreshCw
						className={`mr-2 size-4 ${listingsQuery.isFetching ? "animate-spin" : ""}`}
					/>
					Refresh
				</Button>
			</div>

			{listingsQuery.isLoading ? (
				<div className="flex items-center justify-center py-10 text-muted-foreground">
					<Loader2 className="mr-2 size-5 animate-spin" />
					Reconciling wallet outputs with the market…
				</div>
			) : listingsQuery.isError ? (
				<p
					className="rounded-md border border-destructive/50 p-4 text-sm text-destructive"
					role="alert"
				>
					The market could not verify the wallet's listings. Nothing has been
					classified as active; retry the refresh.
				</p>
			) : verified.length === 0 && unconfirmed.length === 0 ? (
				<p className="rounded-md border p-8 text-center text-muted-foreground">
					The active wallet has no OrdLock outputs.
				</p>
			) : (
				<>
					<section className="space-y-3">
						<h2 className="text-lg font-semibold">Market-confirmed listings</h2>
						{verified.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No wallet-owned OrdLock output is currently confirmed by the
								market.
							</p>
						) : (
							<div className="divide-y rounded-md border">
								{verified.map(({ output, listing }) => (
									<div
										key={output.outpoint}
										className="flex flex-wrap items-center gap-3 p-3"
									>
										<div className="min-w-0 flex-1">
											<Link
												href={`/outpoint/${toUrlOutpoint(listing.outpoint)}`}
												className="font-medium hover:underline"
											>
												{listing.name ?? getName(output) ?? "Ordinal"}
											</Link>
											<p className="truncate font-mono text-xs text-muted-foreground">
												{listing.outpoint}
											</p>
										</div>
										<span className="font-mono text-sm text-primary">
											{formatSatoshisAsBsv(listing.price ?? 0)} BSV
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCancelOutpoint(output.outpoint)}
										>
											<X className="mr-2 size-4" />
											Cancel listing
										</Button>
									</div>
								))}
							</div>
						)}
					</section>

					{unconfirmed.length > 0 && (
						<section className="space-y-3">
							<h2 className="text-lg font-semibold">
								Wallet OrdLock outputs awaiting confirmation
							</h2>
							<p className="text-sm text-muted-foreground">
								These are wallet-owned OrdLock outputs, but the market did not
								return the same active outpoint. They are not presented as
								active listings.
							</p>
							<div className="divide-y rounded-md border">
								{unconfirmed.map(({ output }) => (
									<div
										key={output.outpoint}
										className="flex flex-wrap items-center gap-3 p-3"
									>
										<p className="min-w-0 flex-1 break-all font-mono text-xs">
											{output.outpoint}
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCancelOutpoint(output.outpoint)}
										>
											Cancel wallet OrdLock
										</Button>
									</div>
								))}
							</div>
						</section>
					)}
				</>
			)}

			{cancelOrdinal && (
				<OrdinalActionDialog
					kind="cancel"
					ordinals={[cancelOrdinal]}
					open
					onOpenChange={(open) => {
						if (!open) setCancelOutpoint(null);
					}}
					onSuccess={async () => {
						setCancelOutpoint(null);
						await refresh();
					}}
				/>
			)}
		</div>
	);
}
