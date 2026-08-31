"use client";

import { sendBsv } from "@1sat/actions";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Check, Copy, Loader2, Send, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useCopyWithSound } from "@/hooks/use-copy-with-sound";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";
import {
	formatSatoshisAsBsv,
	isP2pkhAddressForChain,
	parseBsvAmount,
	sendFailureMessage,
} from "./wallet-home-utils";

interface ReviewedSend {
	destination: string;
	satoshis: number;
}

type SendState =
	| { status: "idle" }
	| ({ status: "review" | "sending" } & ReviewedSend)
	| { status: "success"; txid: string }
	| { status: "error"; message: string };

export function WalletHomeActions() {
	const {
		chain,
		connectionMode,
		depositAddress,
		oneSatContext,
		refreshBalance,
	} = useWalletToolbox();
	const queryClient = useQueryClient();
	const [, copy] = useCopyWithSound();
	const inFlightRef = useRef(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [sendState, setSendState] = useState<SendState>({ status: "idle" });

	const reviewSend = () => {
		const satoshis = parseBsvAmount(amount);
		if (!satoshis) {
			setSendState({
				status: "error",
				message: "Enter a positive BSV amount with no more than 8 decimals.",
			});
			return;
		}

		const destination = recipient.trim();
		if (!destination) return;
		if (destination.includes("@")) {
			setSendState({
				status: "error",
				message:
					"Paymail sends are blocked on OPL-4014 and OPL-4015 while payment outputs and delivery failures are hardened.",
			});
			return;
		}
		if (!isP2pkhAddressForChain(destination, chain)) {
			setSendState({
				status: "error",
				message: `Enter a valid ${chain === "main" ? "mainnet" : "testnet"} P2PKH address.`,
			});
			return;
		}
		setSendState({ status: "review", destination, satoshis });
	};

	const handleSend = async () => {
		if (
			!oneSatContext ||
			inFlightRef.current ||
			sendState.status !== "review"
		) {
			return;
		}
		const { destination, satoshis } = sendState;
		inFlightRef.current = true;
		setSendState({ status: "sending", destination, satoshis });

		try {
			const result = await sendBsv.execute(oneSatContext, {
				requests: [{ address: destination, satoshis }],
			});
			if (result.error || !result.txid) {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.bsv.send",
					recoverable: true,
					context: { retryable: true },
				});
				setSendState({
					status: "error",
					message: sendFailureMessage(result.error ?? "missing transaction id"),
				});
				return;
			}

			setSendState({
				status: "success",
				txid: result.txid,
			});
			refreshBalance();
			void queryClient.invalidateQueries({ queryKey: ["wallet-actions"] });
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.bsv.send",
				recoverable: true,
				context: { retryable: true },
			});
			setSendState({
				status: "error",
				message: sendFailureMessage(error),
			});
		} finally {
			inFlightRef.current = false;
		}
	};
	const receiveAvailable = !!depositAddress;

	return (
		<div className="grid grid-cols-2 gap-2 sm:flex">
			<SoundDialog>
				<DialogTrigger asChild>
					<Button disabled={!receiveAvailable} size="lg">
						<ArrowDownToLine /> Receive
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Receive BSV</DialogTitle>
						<DialogDescription>
							{connectionMode === "built-in"
								? "This address rotates after an incoming payment is detected."
								: "This address is derived through the connected wallet; that provider controls discovery and rotation."}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-2">
						<div
							aria-label="QR code for the wallet deposit address"
							className="rounded-lg bg-white p-4"
							role="img"
						>
							{depositAddress && (
								<QRCodeSVG size={192} value={depositAddress} />
							)}
						</div>
						<div className="flex w-full gap-2">
							<Input
								aria-label="Deposit address"
								className="font-mono text-xs"
								readOnly
								value={depositAddress ?? "Unavailable"}
							/>
							<Button
								aria-label="Copy deposit address"
								disabled={!depositAddress}
								onClick={() => depositAddress && void copy(depositAddress)}
								size="icon"
								variant="outline"
							>
								<Copy />
							</Button>
						</div>
					</div>
				</DialogContent>
			</SoundDialog>

			<SoundDialog
				onOpenChange={(open) => {
					if (!open && inFlightRef.current) return;
					setSendOpen(open);
					if (!open && sendState.status === "success") {
						setRecipient("");
						setAmount("");
						setSendState({ status: "idle" });
					}
				}}
				open={sendOpen}
			>
				<DialogTrigger asChild>
					<Button disabled={!oneSatContext} size="lg" variant="outline">
						<Send /> Send
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Send BSV</DialogTitle>
						<DialogDescription>
							Enter a BSV address and the amount to send.
						</DialogDescription>
					</DialogHeader>
					{sendState.status === "success" ? (
						<div className="space-y-3 py-4 text-center" role="status">
							<Check className="mx-auto size-8 text-emerald-500" />
							<p className="font-medium">Transaction sent</p>
							<p className="break-all font-mono text-muted-foreground text-xs">
								{sendState.txid}
							</p>
						</div>
					) : sendState.status === "review" ||
						sendState.status === "sending" ? (
						<div className="space-y-4">
							<dl className="space-y-3 rounded-lg border p-4 text-sm">
								<div className="space-y-1">
									<dt className="text-muted-foreground">Destination</dt>
									<dd className="break-all font-mono">
										{sendState.destination}
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Amount</dt>
									<dd className="font-mono">
										{formatSatoshisAsBsv(sendState.satoshis)} BSV
									</dd>
								</div>
								<div className="flex justify-between gap-4">
									<dt className="text-muted-foreground">Network fee</dt>
									<dd>Calculated by wallet</dd>
								</div>
								<div className="flex justify-between gap-4 border-t pt-3 font-medium">
									<dt>Total</dt>
									<dd className="text-right font-mono">
										{formatSatoshisAsBsv(sendState.satoshis)} BSV + fee
									</dd>
								</div>
							</dl>
							<p className="text-muted-foreground text-xs">
								The installed standard payment action does not expose a fee
								quote before it broadcasts.
							</p>
							<div className="grid grid-cols-2 gap-2">
								<Button
									disabled={sendState.status === "sending"}
									onClick={() => setSendState({ status: "idle" })}
									variant="outline"
								>
									Back
								</Button>
								<Button
									disabled={sendState.status === "sending"}
									onClick={() => void handleSend()}
								>
									{sendState.status === "sending" && (
										<Loader2 className="animate-spin" />
									)}
									{sendState.status === "sending"
										? "Sending…"
										: "Confirm and send"}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="wallet-home-recipient">Recipient</Label>
								<Input
									autoComplete="off"
									id="wallet-home-recipient"
									onChange={(event) => setRecipient(event.target.value)}
									placeholder="1A1z…"
									value={recipient}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="wallet-home-amount">Amount (BSV)</Label>
								<Input
									id="wallet-home-amount"
									inputMode="decimal"
									onChange={(event) => setAmount(event.target.value)}
									placeholder="0.00000000"
									type="text"
									value={amount}
								/>
							</div>
							{sendState.status === "error" && (
								<div
									className="flex gap-2 text-destructive text-sm"
									role="alert"
								>
									<X className="mt-0.5 size-4 shrink-0" />
									<span className="break-all">{sendState.message}</span>
								</div>
							)}
							<p className="text-muted-foreground text-xs">
								P2PKH addresses only. Paymail is blocked on OPL-4014 and
								OPL-4015; the installed SDK has no identity-to-payment
								resolution contract.
							</p>
							<Button
								className="w-full"
								disabled={!recipient.trim() || !amount.trim()}
								onClick={reviewSend}
							>
								Review payment
							</Button>
						</div>
					)}
				</DialogContent>
			</SoundDialog>
		</div>
	);
}
