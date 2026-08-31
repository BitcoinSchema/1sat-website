"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useWallet } from "@/providers/wallet-provider";
import {
	useWalletToolbox,
	WALLET_CONNECTION_MODE_KEY,
} from "@/providers/wallet-toolbox-provider";

export function LocalWalletOnly({
	children,
	requireEmpty = false,
}: {
	children: React.ReactNode;
	requireEmpty?: boolean;
}) {
	const { connectionMode } = useWalletToolbox();
	const { hasWallet } = useWallet();
	const [externalRequested, setExternalRequested] = useState<boolean | null>(
		null,
	);

	useEffect(() => {
		setExternalRequested(
			localStorage.getItem(WALLET_CONNECTION_MODE_KEY) === "external",
		);
	}, []);

	if (externalRequested === null) return null;
	if (
		connectionMode !== "external" &&
		!externalRequested &&
		(!requireEmpty || !hasWallet)
	)
		return children;

	const external = connectionMode === "external" || externalRequested;

	return (
		<Card className="mx-auto mt-12 max-w-lg">
			<CardHeader>
				<CardTitle>
					{external ? "External wallet connected" : "Wallet already exists"}
				</CardTitle>
				<CardDescription>
					{external
						? "Seed, import, migration, and deletion controls are available only for the wallet built into this browser."
						: "Back up and remove the current built-in wallet before creating or restoring another one."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button asChild>
					<Link href="/wallet">Back to wallet</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
