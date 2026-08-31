"use client";

import { type Bsv21Balance, getBsv21Balances } from "@1sat/actions";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Loader2, RefreshCw, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	SoundDialog,
} from "@/components/ui/sound-dialog";
import { useSound } from "@/hooks/use-sound";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import {
	bsv21ActionFailureMessage,
	executeBsv21Send,
	formatBsv21Amount,
	parseBsv21Amount,
	parseBsv21Destination,
} from "@/lib/wallet/bsv21-actions";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface TokenCardProps {
	token: Bsv21Balance;
	bsv21Available: boolean;
}

function TokenCard({ token, bsv21Available }: TokenCardProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { play } = useSound();
	const { chain, oneSatContext, refreshBalance } = useWalletToolbox();
	const [open, setOpen] = useState(false);
	const [recipient, setRecipient] = useState("");
	const [sendAmount, setSendAmount] = useState("");
	const [reviewAmount, setReviewAmount] = useState<bigint | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [txid, setTxid] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const ticker = token.sym || token.id.slice(0, 8);
	const balance = BigInt(token.amt);

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["bsv21-market"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	const prepareReview = useCallback(async () => {
		if (!oneSatContext?.services || !bsv21Available) return;
		setBusy(true);
		setError(null);
		try {
			const amount = parseBsv21Amount(sendAmount, token.dec);
			if (!amount) {
				throw new Error(
					`Enter a positive amount with at most ${token.dec} decimals.`,
				);
			}
			if (!parseBsv21Destination(recipient, chain)) {
				throw new Error(
					"Enter a valid address for this network or a compressed identity key.",
				);
			}
			oneSatContext.services.bsv21.clearCache();
			const [details, balances] = await Promise.all([
				oneSatContext.services.bsv21.getTokenDetails(token.id),
				getBsv21Balances.execute(oneSatContext, {}),
			]);
			const current = balances.find((item) => item.id === token.id);
			if (!details.status?.is_active) {
				throw new Error("This token is not active in the overlay.");
			}
			if (!current || BigInt(current.amt) < amount) {
				throw new Error("The wallet no longer has enough spendable tokens.");
			}
			setReviewAmount(amount);
		} catch (cause) {
			setReviewAmount(null);
			setError(
				cause instanceof Error && cause.message.startsWith("Enter")
					? cause.message
					: bsv21ActionFailureMessage(cause),
			);
		} finally {
			setBusy(false);
		}
	}, [
		bsv21Available,
		chain,
		oneSatContext,
		recipient,
		sendAmount,
		token.dec,
		token.id,
	]);

	const authorize = useCallback(async () => {
		if (!(oneSatContext?.services && reviewAmount && bsv21Available)) return;
		setBusy(true);
		setError(null);
		try {
			const destination = parseBsv21Destination(recipient, chain);
			const amount = parseBsv21Amount(sendAmount, token.dec);
			if (!destination || amount !== reviewAmount) {
				setReviewAmount(null);
				throw new Error("Review details changed. Review the transfer again.");
			}
			oneSatContext.services.bsv21.clearCache();
			const [details, balances] = await Promise.all([
				oneSatContext.services.bsv21.getTokenDetails(token.id),
				getBsv21Balances.execute(oneSatContext, {}),
			]);
			const current = balances.find((item) => item.id === token.id);
			if (
				!details.status?.is_active ||
				!current ||
				BigInt(current.amt) < amount
			) {
				setReviewAmount(null);
				throw new Error(
					"The indexed token balance changed. Refresh and review again.",
				);
			}
			const result = await executeBsv21Send(oneSatContext, {
				tokenId: token.id,
				amount,
				destination,
			});
			if (result.error) throw new Error(result.error);
			setTxid(result.txid ?? "submitted");
			setReviewAmount(null);
			setRecipient("");
			setSendAmount("");
			setOpen(false);
			play("success");
			await refresh();
		} catch (cause) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.bsv21.send",
				recoverable: true,
				context: { retryable: true },
			});
			setError(bsv21ActionFailureMessage(cause));
			play("error");
		} finally {
			setBusy(false);
		}
	}, [
		bsv21Available,
		chain,
		oneSatContext,
		play,
		recipient,
		refresh,
		reviewAmount,
		sendAmount,
		token.dec,
		token.id,
	]);

	return (
		<div className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50">
			<div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
				<Image
					src={token.icon || getOrdinalThumbnail(token.id, 100)}
					alt=""
					fill
					sizes="48px"
					className="object-cover"
					unoptimized
				/>
			</div>
			<Link
				className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				href={`/market/bsv21/${token.id}`}
				onClick={() => play("click")}
			>
				<div className="flex items-center gap-2">
					<span className="font-semibold text-foreground">{ticker}</span>
					<span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs uppercase">
						BSV21
					</span>
				</div>
				<div className="truncate text-muted-foreground text-sm">
					{formatBsv21Amount(token.amt, token.dec)} tokens
				</div>
			</Link>
			<div className="hidden max-w-24 truncate font-mono text-muted-foreground text-xs sm:block">
				{token.id.slice(0, 8)}…
			</div>
			<SoundDialog
				open={open}
				onOpenChange={(next) => {
					if (busy) return;
					setOpen(next);
					if (!next) {
						setReviewAmount(null);
						setError(null);
					}
				}}
			>
				<DialogTrigger asChild>
					<Button size="sm" variant="outline" disabled={!bsv21Available}>
						<Send className="mr-2 size-4" /> Send
					</Button>
				</DialogTrigger>
				<DialogContent showCloseButton={!busy}>
					<DialogHeader>
						<DialogTitle>Send {ticker}</DialogTitle>
						<DialogDescription>
							Review the exact token quantity and destination before asking the
							active wallet to authorize it.
						</DialogDescription>
					</DialogHeader>
					{reviewAmount ? (
						<div className="space-y-4">
							<dl className="grid grid-cols-[auto_1fr] gap-2 rounded-md border p-3 text-sm">
								<dt>Amount</dt>
								<dd className="text-right font-mono">
									{formatBsv21Amount(reviewAmount, token.dec)} {ticker}
								</dd>
								<dt>Atomic quantity</dt>
								<dd className="break-all text-right font-mono">
									{reviewAmount.toString()}
								</dd>
								<dt>Destination</dt>
								<dd className="break-all text-right font-mono text-xs">
									{recipient.trim()}
								</dd>
								<dt>Overlay fee</dt>
								<dd className="text-right text-muted-foreground">
									Per-output fee is reloaded by the action
								</dd>
								<dt>Network fee</dt>
								<dd className="text-right text-muted-foreground">
									Set by the wallet; not quoted here
								</dd>
							</dl>
							<p className="text-xs text-muted-foreground">
								The balance and active overlay status are checked again
								immediately before authorization.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`recipient-${token.id}`}>Recipient</Label>
								<Input
									id={`recipient-${token.id}`}
									onChange={(event) => setRecipient(event.target.value)}
									placeholder="Address or compressed identity key"
									value={recipient}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`amount-${token.id}`}>Amount</Label>
								<Input
									id={`amount-${token.id}`}
									inputMode="decimal"
									onChange={(event) => setSendAmount(event.target.value)}
									placeholder="0"
									value={sendAmount}
								/>
								<p className="text-xs text-muted-foreground">
									Available: {formatBsv21Amount(balance, token.dec)} {ticker}
								</p>
							</div>
						</div>
					)}
					{error ? (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={() =>
								reviewAmount ? setReviewAmount(null) : setOpen(false)
							}
						>
							{reviewAmount ? "Edit" : "Cancel"}
						</Button>
						<Button
							type="button"
							disabled={busy || !recipient.trim() || !sendAmount.trim()}
							onClick={() =>
								void (reviewAmount ? authorize() : prepareReview())
							}
						>
							{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
							{reviewAmount ? "Authorize transfer" : "Review transfer"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</SoundDialog>
			{txid ? (
				<span className="sr-only" role="status">
					Transfer submitted: {txid}
				</span>
			) : null}
		</div>
	);
}

interface TokenGridProps {
	className?: string;
}

export default function TokenGrid({ className = "" }: TokenGridProps) {
	const {
		bsv21Tokens: tokens,
		isInitialized,
		isInitializing,
	} = useWalletToolbox();
	const features = useStackFeatures();
	const bsv21Available = features.data?.features.bsv21 === true;

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading wallet…</span>
			</div>
		);
	}

	if (!isInitialized) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				Please unlock or connect a wallet to view your BSV21 tokens.
			</div>
		);
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{!bsv21Available ? (
				<div
					className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
					role="status"
				>
					<RefreshCw className="mt-0.5 size-4 shrink-0" />
					<p>
						{features.isLoading
							? "Checking BSV21 stack capability…"
							: "The configured stack is not advertising BSV21. Token actions are disabled until capability checks recover."}
					</p>
				</div>
			) : null}
			{tokens.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<Coins className="mb-4 size-12 opacity-50" />
					<p>No BSV21 tokens found in your wallet.</p>
				</div>
			) : (
				<>
					<h2 className="text-lg font-medium">
						{tokens.length} BSV21 token{tokens.length === 1 ? "" : "s"}
					</h2>
					<div className="space-y-2">
						{tokens.map((token) => (
							<TokenCard
								key={token.id}
								token={token}
								bsv21Available={bsv21Available}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
