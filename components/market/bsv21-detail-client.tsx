"use client";

import type { TokenDetailResponse } from "@1sat/types";
import { buildTokenLabel } from "@1sat/types";
import type { WalletAction } from "@bsv/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, ShoppingCart } from "lucide-react";
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
import { useSound } from "@/hooks/use-sound";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import type { Bsv21Listing } from "@/lib/wallet/bsv21-actions";
import {
	bsv21ActionFailureMessage,
	executeBsv21Buy,
	formatBsv21Amount,
	requireCurrentBsv21Listing,
	safeOverlayFee,
} from "@/lib/wallet/bsv21-actions";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface Bsv21BuyButtonProps {
	details: TokenDetailResponse;
	listing: Bsv21Listing;
}

function Bsv21BuyButton({ details, listing }: Bsv21BuyButtonProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { play } = useSound();
	const { oneSatContext, refreshBalance } = useWalletToolbox();
	const features = useStackFeatures();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [stale, setStale] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [txid, setTxid] = useState<string | null>(null);
	const overlayFee = safeOverlayFee(details);
	const decimals = Number.parseInt(details.token.dec ?? "0", 10);
	const stackReady =
		features.data?.features.bsv21 === true &&
		features.data.capabilities.has("market");
	const total =
		overlayFee !== null && Number.isSafeInteger(listing.price + overlayFee)
			? listing.price + overlayFee
			: null;

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["bsv21-market"] }),
			queryClient.invalidateQueries({ queryKey: ["market-flow"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	const buy = useCallback(async () => {
		if (!(oneSatContext?.services && stackReady && total !== null)) return;
		setBusy(true);
		setError(null);
		setStale(false);
		try {
			const current = await requireCurrentBsv21Listing(
				oneSatContext,
				details.tokenId,
				listing,
			);
			if (!current) {
				setStale(true);
				setError(
					"This listing is spent or its indexed price, token, or quantity changed. Refresh before continuing.",
				);
				return;
			}
			oneSatContext.services.bsv21.clearCache();
			const currentDetails = await oneSatContext.services.bsv21.getTokenDetails(
				details.tokenId,
			);
			if (
				!currentDetails.status?.is_active ||
				safeOverlayFee(currentDetails) !== overlayFee
			) {
				setStale(true);
				setError(
					"The token funding status or overlay fee changed. Refresh and review again.",
				);
				return;
			}
			const result = await executeBsv21Buy(
				oneSatContext,
				current,
				details.tokenId,
			);
			if (result.error) throw new Error(result.error);
			setTxid(result.txid ?? "submitted");
			setOpen(false);
			play("success");
			await refresh();
		} catch (cause) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "market.bsv21.buy",
				recoverable: true,
				context: { retryable: true },
			});
			setError(bsv21ActionFailureMessage(cause));
			play("error");
		} finally {
			setBusy(false);
		}
	}, [
		details.tokenId,
		listing,
		oneSatContext,
		overlayFee,
		play,
		refresh,
		stackReady,
		total,
	]);

	if (!oneSatContext) {
		return (
			<Button asChild variant="outline">
				<Link href="/wallet">Connect a wallet to buy</Link>
			</Button>
		);
	}

	if (txid) {
		return (
			<p className="text-sm text-primary" role="status">
				Purchase submitted{txid === "submitted" ? "." : `: ${txid}`}
			</p>
		);
	}

	const disabledReason = !stackReady
		? "The configured stack must advertise BSV21 and market capabilities."
		: !details.status?.is_active
			? "This token is inactive in the overlay."
			: total === null
				? "The indexed fee or price is not a safe integer quantity."
				: null;

	return (
		<>
			<Button
				disabled={disabledReason !== null}
				onClick={() => {
					setError(null);
					setStale(false);
					setOpen(true);
				}}
			>
				<ShoppingCart className="mr-2 size-4" /> Review purchase
			</Button>
			{disabledReason ? (
				<p className="max-w-sm text-xs text-destructive" role="status">
					{disabledReason}
				</p>
			) : null}
			<Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
				<DialogContent showCloseButton={!busy}>
					<DialogHeader>
						<DialogTitle>Review BSV21 purchase</DialogTitle>
						<DialogDescription>
							The market listing, overlay output, exact quantity, price, and fee
							are checked again before wallet authorization.
						</DialogDescription>
					</DialogHeader>
					<dl className="grid grid-cols-[auto_1fr] gap-2 rounded-md border p-3 text-sm">
						<dt>Amount</dt>
						<dd className="text-right font-mono">
							{formatBsv21Amount(listing.amount, decimals)} {details.token.sym}
						</dd>
						<dt>Atomic quantity</dt>
						<dd className="break-all text-right font-mono">{listing.amount}</dd>
						<dt>Seller payout</dt>
						<dd className="text-right font-mono">
							{listing.price.toLocaleString()} sats
						</dd>
						<dt>Marketplace fee</dt>
						<dd className="text-right font-mono">0 sats (none configured)</dd>
						<dt>Overlay fee</dt>
						<dd className="text-right font-mono">{overlayFee} sats</dd>
						<dt className="font-medium">Total before network fee</dt>
						<dd className="text-right font-mono font-medium">
							{total?.toLocaleString()} sats
						</dd>
						<dt>Network fee</dt>
						<dd className="text-right text-muted-foreground">
							Set by the wallet; not quoted here
						</dd>
					</dl>
					{error ? (
						<div className="space-y-2" role="alert">
							<p className="text-sm text-destructive">{error}</p>
							{stale ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => void refresh().then(() => setOpen(false))}
								>
									<RefreshCw className="mr-2 size-4" /> Refresh listing
								</Button>
							) : null}
						</div>
					) : null}
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
							{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
							{busy ? "Checking listing…" : "Authorize purchase"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

interface Bsv21DetailClientProps {
	details: TokenDetailResponse;
	listings: Bsv21Listing[];
}

export function Bsv21DetailClient({
	details,
	listings,
}: Bsv21DetailClientProps) {
	const { wallet, isInitialized } = useWalletToolbox();
	const [history, setHistory] = useState<WalletAction[] | null>(null);
	const [historyBusy, setHistoryBusy] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);

	const loadHistory = useCallback(async () => {
		if (!wallet || !isInitialized) return;
		setHistoryBusy(true);
		setHistoryError(null);
		try {
			const result = await wallet.listActions({
				labels: [buildTokenLabel(details.tokenId)],
				labelQueryMode: "all",
				includeLabels: true,
				limit: 100,
			});
			setHistory(result.actions);
		} catch {
			setHistoryError(
				"Wallet-labeled token history could not be loaded. No network-wide history claim is being made.",
			);
		} finally {
			setHistoryBusy(false);
		}
	}, [details.tokenId, isInitialized, wallet]);

	return (
		<div className="space-y-8">
			<section aria-labelledby="listings-title" className="space-y-4">
				<div>
					<h2 id="listings-title" className="text-xl font-semibold">
						Active listings
					</h2>
					<p className="text-sm text-muted-foreground">
						Up to 100 current market listings are cross-checked against this
						token overlay.
					</p>
				</div>
				{listings.length === 0 ? (
					<p className="rounded-md border p-4 text-sm text-muted-foreground">
						No active, overlay-validated listings were found.
					</p>
				) : (
					<div className="space-y-3">
						{listings.map((listing) => (
							<div
								key={listing.outpoint}
								className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="font-mono text-sm">
										{formatBsv21Amount(
											listing.amount,
											Number.parseInt(details.token.dec ?? "0", 10),
										)}{" "}
										{details.token.sym}
									</p>
									<p className="mt-1 break-all font-mono text-xs text-muted-foreground">
										{listing.outpoint}
									</p>
									<p className="mt-1 font-mono text-sm">
										{listing.price.toLocaleString()} sats
									</p>
								</div>
								<Bsv21BuyButton details={details} listing={listing} />
							</div>
						))}
					</div>
				)}
			</section>

			<section aria-labelledby="history-title" className="space-y-4">
				<div>
					<h2 id="history-title" className="text-xl font-semibold">
						Wallet history
					</h2>
					<p className="text-sm text-muted-foreground">
						Loads actions carrying this token's BRC-111 wallet label. This is
						wallet-local history, not a network-wide ledger.
					</p>
				</div>
				{!isInitialized ? (
					<Button asChild variant="outline">
						<Link href="/wallet">Connect a wallet</Link>
					</Button>
				) : history === null ? (
					<Button
						variant="outline"
						disabled={historyBusy}
						onClick={() => void loadHistory()}
					>
						{historyBusy ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : null}
						Load wallet history
					</Button>
				) : history.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No labeled actions found in this wallet.
					</p>
				) : (
					<ul className="divide-y rounded-md border">
						{history.map((action) => (
							<li key={action.txid} className="space-y-1 p-3 text-sm">
								<div className="flex items-center justify-between gap-3">
									<span>{action.description}</span>
									<span className="text-xs text-muted-foreground">
										{action.status}
									</span>
								</div>
								<p className="break-all font-mono text-xs text-muted-foreground">
									{action.txid}
								</p>
							</li>
						))}
					</ul>
				)}
				{historyError ? (
					<p className="text-sm text-destructive" role="alert">
						{historyError}
					</p>
				) : null}
			</section>
		</div>
	);
}
