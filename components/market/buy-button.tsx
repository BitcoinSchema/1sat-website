"use client";

import { buyOrdinal } from "@1sat/actions";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { requireCurrentListing } from "@/lib/ordinal-marketplace";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { toStackOutpoint } from "@/lib/stack";
import { ordinalActionFailureMessage } from "@/lib/wallet/ordinal-actions";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface BuyButtonProps {
	outpoint: string;
	price: number;
	contentType?: string;
	origin?: string;
	name?: string;
}

export default function BuyButton({
	outpoint,
	price,
	contentType,
	origin,
	name,
}: BuyButtonProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { oneSatContext, ordinals, refreshBalance } = useWalletToolbox();
	const { play } = useSound();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stale, setStale] = useState(false);
	const [txid, setTxid] = useState<string | null>(null);

	const owned = ordinals.some(
		(output) => toStackOutpoint(output.outpoint) === toStackOutpoint(outpoint),
	);
	const canReview = !!oneSatContext?.services?.market && !!origin && !owned;

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["market-flow"] }),
			queryClient.invalidateQueries({ queryKey: ["market-my-listings"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	const buy = useCallback(async () => {
		if (!oneSatContext?.services?.market || !origin || owned) return;
		setBusy(true);
		setError(null);
		setStale(false);
		try {
			const current = await requireCurrentListing(
				oneSatContext.services.market,
				{ outpoint, origin, price },
			);
			if (!current) {
				setStale(true);
				setError(
					"This listing is no longer active at the reviewed price. Refresh before continuing.",
				);
				return;
			}
			const result = await buyOrdinal.execute(oneSatContext, {
				outpoint,
				contentType,
				origin,
				name,
			});
			if (result.error) throw new Error(result.error);
			setTxid(result.txid ?? "submitted");
			play("success");
			setOpen(false);
			await refresh();
		} catch (cause) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "market.ordinal.buy",
				recoverable: true,
				context: { retryable: true },
			});
			setError(ordinalActionFailureMessage(cause));
			play("error");
		} finally {
			setBusy(false);
		}
	}, [
		contentType,
		name,
		oneSatContext,
		origin,
		outpoint,
		owned,
		play,
		price,
		refresh,
	]);

	if (!oneSatContext) {
		return (
			<Button asChild variant="outline">
				<Link href="/wallet">Connect a wallet to buy</Link>
			</Button>
		);
	}

	if (owned) {
		return (
			<div className="text-sm text-muted-foreground" role="status">
				This listing belongs to the active wallet. Manage it in{" "}
				<Link className="underline" href="/market/ordinals/my-listings">
					My Listings
				</Link>
				.
			</div>
		);
	}

	if (txid) {
		return (
			<div className="text-sm text-primary" role="status">
				Purchase submitted{txid === "submitted" ? "." : `: ${txid}`}
			</div>
		);
	}

	return (
		<>
			<Button
				disabled={!canReview}
				onClick={() => {
					setError(null);
					setStale(false);
					setOpen(true);
				}}
			>
				Review purchase
			</Button>
			{!origin && (
				<p className="text-xs text-destructive" role="alert">
					This listing has no indexed origin and cannot be safely revalidated.
				</p>
			)}

			<Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
				<DialogContent showCloseButton={!busy}>
					<DialogHeader>
						<DialogTitle>Review ordinal purchase</DialogTitle>
						<DialogDescription>
							The active listing and exact price are checked again before the
							wallet authorization request.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div>
							<p className="font-medium">{name ?? "Ordinal"}</p>
							<p className="break-all font-mono text-xs text-muted-foreground">
								{outpoint}
							</p>
						</div>
						<dl className="grid grid-cols-[1fr_auto] gap-2 rounded-md border p-3 text-sm">
							<dt>Listing price</dt>
							<dd className="font-mono">
								{price.toLocaleString()} sats ({formatSatoshisAsBsv(price)} BSV)
							</dd>
							<dt>Marketplace fee</dt>
							<dd className="font-mono">0 sats (none configured)</dd>
							<dt className="font-medium">Total before network fee</dt>
							<dd className="font-mono font-medium">
								{price.toLocaleString()} sats
							</dd>
							<dt>Network fee</dt>
							<dd className="text-right text-muted-foreground">
								Set by the wallet; not quoted by this action
							</dd>
						</dl>
					</div>

					{error && (
						<div className="space-y-2" role="alert">
							<p className="text-sm text-destructive">{error}</p>
							{stale && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										void refresh().then(() => setOpen(false));
									}}
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
