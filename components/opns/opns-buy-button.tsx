"use client";

import { listOpns } from "@1sat/actions";
import type { Capability } from "@1sat/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatSatoshisAsBsv } from "@/components/wallet/wallet-home-utils";
import { useSound } from "@/hooks/use-sound";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { buyCurrentOpnsListing, opnsFailureMessage } from "@/lib/opns";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { type ListingData, toStackOutpoint } from "@/lib/stack";
import { getOriginOutpoint } from "@/lib/wallet/wallet-output-utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function OpnsBuyButton({ listing }: { listing: ListingData }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const stackFeatures = useStackFeatures();
	const { oneSatContext, identityKey, refreshBalance } = useWalletToolbox();
	const { play } = useSound();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [stale, setStale] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [txid, setTxid] = useState<string | null>(null);
	const identityRef = useRef(identityKey);

	useEffect(() => {
		if (identityRef.current === identityKey) return;
		identityRef.current = identityKey;
		setOpen(false);
		setBusy(false);
		setStale(false);
		setError(null);
		setTxid(null);
	}, [identityKey]);

	const ownedQuery = useQuery({
		queryKey: ["opns-buy-owned", identityKey, listing.name, listing.origin],
		queryFn: async () => {
			if (!oneSatContext || !listing.name) return false;
			const owned = await listOpns.execute(oneSatContext, {
				names: [listing.name],
				limit: 10,
			});
			return owned.outputs.some(
				(output) =>
					toStackOutpoint(getOriginOutpoint(output)) ===
					toStackOutpoint(listing.origin ?? ""),
			);
		},
		enabled: !!oneSatContext && !!listing.name && !!listing.origin,
		staleTime: 10_000,
	});

	const available = stackFeatures.data?.capabilities;
	const requiredCapabilities: Capability[] = ["market", "ordfs", "beef"];
	const missingCapability = requiredCapabilities.find(
		(capability) => !available?.has(capability),
	);
	const owned = ownedQuery.data ?? false;

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["opns-names"] }),
			queryClient.invalidateQueries({ queryKey: ["opns-buy-owned"] }),
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["opns-listings"] }),
			queryClient.invalidateQueries({ queryKey: ["market-flow"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	const buy = useCallback(async () => {
		if (!oneSatContext || missingCapability || owned) return;
		setBusy(true);
		setStale(false);
		setError(null);
		try {
			const result = await buyCurrentOpnsListing(oneSatContext, listing);
			if (!result) {
				setStale(true);
				setError(
					"This listing is no longer active at the reviewed outpoint and price.",
				);
				return;
			}
			if (result.error) throw new Error(result.error);
			setTxid(result.txid ?? "submitted");
			setOpen(false);
			play("success");
			await refresh();
		} catch (cause) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "market.opns.buy",
				recoverable: true,
				context: { retryable: true },
			});
			setError(opnsFailureMessage(cause));
			play("error");
		} finally {
			setBusy(false);
		}
	}, [listing, missingCapability, oneSatContext, owned, play, refresh]);

	if (!oneSatContext) {
		return (
			<Button asChild variant="outline">
				<Link href="/wallet">Connect a wallet to buy</Link>
			</Button>
		);
	}
	if (ownedQuery.isLoading) {
		return (
			<Button disabled>
				<Loader2 className="mr-2 size-4 animate-spin" />
				Checking ownership…
			</Button>
		);
	}
	if (owned) {
		return (
			<p className="text-sm text-muted-foreground" role="status">
				This name is already in the active wallet.
			</p>
		);
	}
	if (txid) {
		return (
			<p className="break-all text-sm text-primary" role="status">
				Purchase submitted{txid === "submitted" ? "." : `: ${txid}`}
			</p>
		);
	}

	return (
		<>
			<Button
				disabled={!!missingCapability || ownedQuery.isError}
				onClick={() => {
					setError(null);
					setStale(false);
					setOpen(true);
				}}
			>
				Review purchase
			</Button>
			{missingCapability && !stackFeatures.isPending && (
				<p className="text-xs text-muted-foreground" role="status">
					Purchase is disabled because {missingCapability} capability is
					unavailable.
				</p>
			)}
			{ownedQuery.isError && (
				<p className="text-xs text-destructive" role="alert">
					Wallet ownership could not be checked. Refresh before buying.
				</p>
			)}

			<Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
				<DialogContent showCloseButton={!busy}>
					<DialogHeader>
						<DialogTitle>Review OpNS purchase</DialogTitle>
						<DialogDescription>
							The active origin listing and exact price are checked again before
							wallet authorization.
						</DialogDescription>
					</DialogHeader>
					<div>
						<p className="font-medium">{listing.name ?? "OpNS name"}</p>
						<p className="break-all font-mono text-xs text-muted-foreground">
							{listing.outpoint}
						</p>
					</div>
					<dl className="grid grid-cols-[1fr_auto] gap-2 rounded-md border p-3 text-sm">
						<dt>Listing price</dt>
						<dd className="font-mono">
							{listing.price?.toLocaleString()} sats (
							{formatSatoshisAsBsv(listing.price ?? 0)} BSV)
						</dd>
						<dt>Marketplace fee</dt>
						<dd className="font-mono">0 sats (none configured)</dd>
						<dt className="font-medium">Total before network fee</dt>
						<dd className="font-mono font-medium">
							{listing.price?.toLocaleString()} sats
						</dd>
						<dt>Network fee</dt>
						<dd className="text-right text-muted-foreground">
							Set by the wallet; not quoted by this action
						</dd>
					</dl>
					{error && (
						<div className="space-y-2" role="alert">
							<p className="text-sm text-destructive">{error}</p>
							{stale && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => void refresh().then(() => setOpen(false))}
								>
									<RefreshCw className="mr-2 size-4" />
									Refresh listing
								</Button>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={busy || stale}
							onClick={() => void buy()}
						>
							{busy && <Loader2 className="mr-2 size-4 animate-spin" />}
							{busy ? "Checking listing…" : "Authorize purchase"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
