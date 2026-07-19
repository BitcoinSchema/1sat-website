"use client";

import { createContext, purchaseOrdinal } from "@1sat/actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toBitcoin } from "satoshi-token";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface BuyButtonProps {
	outpoint: string;
	price: number;
	contentType?: string;
	origin?: string;
	name?: string;
}

const BuyButton = ({
	outpoint,
	price,
	contentType,
	origin,
	name,
}: BuyButtonProps) => {
	const { wallet, services, chain, refreshBalance } = useWalletToolbox();
	const { play } = useSound();
	const [status, setStatus] = useState<
		"idle" | "buying" | "success" | "error"
	>("idle");
	const [result, setResult] = useState<string>("");

	const handleBuy = useCallback(async () => {
		if (!wallet) return;
		setStatus("buying");
		setResult("");
		try {
			const ctx = createContext(wallet, {
				services: services ?? undefined,
				chain,
			});
			const res = await purchaseOrdinal.execute(ctx, {
				outpoint,
				contentType,
				origin,
				name,
			});
			if (res.error) {
				setStatus("error");
				setResult(res.error);
				play("error");
			} else {
				setStatus("success");
				setResult(res.txid || "");
				play("success");
				refreshBalance?.();
			}
		} catch (error) {
			setStatus("error");
			setResult(error instanceof Error ? error.message : String(error));
			play("error");
		}
	}, [
		wallet,
		services,
		chain,
		outpoint,
		contentType,
		origin,
		name,
		play,
		refreshBalance,
	]);

	if (!wallet) {
		return (
			<Button asChild variant="outline">
				<Link href="/wallet">Unlock wallet to buy</Link>
			</Button>
		);
	}

	if (status === "success") {
		return (
			<div className="text-sm text-primary font-mono break-all">
				Purchased! txid: {result}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Button onClick={handleBuy} disabled={status === "buying"}>
				{status === "buying" ? (
					<>
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						Buying...
					</>
				) : (
					`Buy for ${toBitcoin(price)} BSV`
				)}
			</Button>
			{status === "error" && (
				<p className="text-xs text-destructive break-all">{result}</p>
			)}
		</div>
	);
};

export default BuyButton;
