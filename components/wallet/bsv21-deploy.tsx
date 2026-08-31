"use client";

import { deployBsv21Mint } from "@1sat/actions";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSound } from "@/hooks/use-sound";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import {
	bsv21ActionFailureMessage,
	formatBsv21Amount,
	parseBsv21Amount,
} from "@/lib/wallet/bsv21-actions";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

const VALID_SYMBOL = /^[^\p{Cc}\p{Cs}]{1,32}$/u;

export function Bsv21Deploy() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { play } = useSound();
	const { oneSatContext, refreshBalance } = useWalletToolbox();
	const features = useStackFeatures();
	const [open, setOpen] = useState(false);
	const [symbol, setSymbol] = useState("");
	const [amount, setAmount] = useState("");
	const [decimalsText, setDecimalsText] = useState("0");
	const [reviewAmount, setReviewAmount] = useState<bigint | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdTokenId, setCreatedTokenId] = useState<string | null>(null);
	const bsv21Available = features.data?.features.bsv21 === true;
	const decimals = /^\d+$/.test(decimalsText)
		? Number.parseInt(decimalsText, 10)
		: Number.NaN;

	const prepareReview = useCallback(() => {
		setError(null);
		const normalizedSymbol = symbol.trim();
		if (!VALID_SYMBOL.test(normalizedSymbol)) {
			setError("Enter a printable symbol between 1 and 32 characters.");
			return;
		}
		if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
			setError("Decimals must be a whole number from 0 through 18.");
			return;
		}
		const atomic = parseBsv21Amount(amount, decimals);
		if (!atomic) {
			setError(
				`Enter a positive fixed supply with at most ${decimals} decimals.`,
			);
			return;
		}
		setReviewAmount(atomic);
	}, [amount, decimals, symbol]);

	const deploy = useCallback(async () => {
		if (!(oneSatContext && reviewAmount && bsv21Available)) return;
		setBusy(true);
		setError(null);
		try {
			const atomic = parseBsv21Amount(amount, decimals);
			if (
				atomic !== reviewAmount ||
				!VALID_SYMBOL.test(symbol.trim()) ||
				!Number.isInteger(decimals)
			) {
				setReviewAmount(null);
				throw new Error("Review details changed. Review the deployment again.");
			}
			const capabilities = await features.refetch();
			if (capabilities.data?.features.bsv21 !== true) {
				setReviewAmount(null);
				throw new Error("The BSV21 stack capability is no longer available.");
			}
			const result = await deployBsv21Mint.execute(oneSatContext, {
				symbol: symbol.trim(),
				amount: atomic,
				decimals,
				destination: { counterparty: "self" },
			});
			if (result.error) throw new Error(result.error);
			setCreatedTokenId(result.tokenId ?? null);
			setReviewAmount(null);
			setOpen(false);
			play("success");
			refreshBalance();
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
				queryClient.invalidateQueries({ queryKey: ["bsv21-market"] }),
			]);
			router.refresh();
		} catch (cause) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.bsv21.deploy-fixed",
				recoverable: true,
				context: { retryable: true },
			});
			setError(bsv21ActionFailureMessage(cause));
			play("error");
		} finally {
			setBusy(false);
		}
	}, [
		amount,
		bsv21Available,
		decimals,
		features,
		oneSatContext,
		play,
		queryClient,
		refreshBalance,
		reviewAmount,
		router,
		symbol,
	]);

	return (
		<section
			aria-labelledby="deploy-bsv21-title"
			className="space-y-4 rounded-lg border p-4"
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 id="deploy-bsv21-title" className="text-lg font-semibold">
						Create a BSV21 token
					</h2>
					<p className="text-sm text-muted-foreground">
						Fixed supply is available through the canonical wallet action. The
						supply cannot be increased later.
					</p>
				</div>
				<Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
					<DialogTrigger asChild>
						<Button disabled={!oneSatContext || !bsv21Available}>
							<Plus className="mr-2 size-4" /> Deploy fixed supply
						</Button>
					</DialogTrigger>
					<DialogContent showCloseButton={!busy}>
						<DialogHeader>
							<DialogTitle>Deploy fixed-supply BSV21</DialogTitle>
							<DialogDescription>
								All supply is created once and sent to this wallet. Deployment
								is irreversible.
							</DialogDescription>
						</DialogHeader>
						{reviewAmount ? (
							<div className="space-y-4">
								<dl className="grid grid-cols-[auto_1fr] gap-2 rounded-md border p-3 text-sm">
									<dt>Symbol</dt>
									<dd className="text-right font-mono">{symbol.trim()}</dd>
									<dt>Supply</dt>
									<dd className="break-all text-right font-mono">
										{formatBsv21Amount(reviewAmount, decimals)}
									</dd>
									<dt>Atomic supply</dt>
									<dd className="break-all text-right font-mono">
										{reviewAmount.toString()}
									</dd>
									<dt>Decimals</dt>
									<dd className="text-right font-mono">{decimals}</dd>
									<dt>Token output</dt>
									<dd className="text-right font-mono">1 sat</dd>
									<dt>Network fee</dt>
									<dd className="text-right text-muted-foreground">
										Set by the wallet; not quoted here
									</dd>
								</dl>
								<div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
									<AlertTriangle className="mt-0.5 size-4 shrink-0" />
									<p>
										This creates the entire supply permanently. There is no mint
										authority or undo action.
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="bsv21-symbol">Symbol</Label>
									<Input
										id="bsv21-symbol"
										maxLength={32}
										value={symbol}
										onChange={(event) => setSymbol(event.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bsv21-decimals">Decimals</Label>
									<Input
										id="bsv21-decimals"
										inputMode="numeric"
										value={decimalsText}
										onChange={(event) => setDecimalsText(event.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="bsv21-supply">Fixed supply</Label>
									<Input
										id="bsv21-supply"
										inputMode="decimal"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
									/>
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
								disabled={busy}
								onClick={() => void (reviewAmount ? deploy() : prepareReview())}
							>
								{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
								{reviewAmount
									? "Authorize irreversible deployment"
									: "Review deployment"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
			{createdTokenId ? (
				<p className="text-sm text-primary" role="status">
					Deployment submitted. Indexing is not yet confirmed.{" "}
					<Link className="underline" href={`/market/bsv21/${createdTokenId}`}>
						Open token {createdTokenId}
					</Link>
				</p>
			) : null}
			{!bsv21Available ? (
				<p className="text-sm text-destructive" role="status">
					Fixed deployment is disabled until the configured stack advertises
					BSV21.
				</p>
			) : null}
			<div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
				<p className="font-medium">Mint authority is temporarily disabled</p>
				<p className="mt-1 text-muted-foreground">
					The installed action release cannot safely select a newly deployed
					genesis authority and can undercount one overlay-fee path. Authority
					deployment, minting, transfer, and permanent termination stay
					unavailable until the corrected action is installed and verified.
				</p>
			</div>
		</section>
	);
}
