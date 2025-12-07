"use client";

import { Mnemonic } from "@bsv/sdk";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MnemonicGrid } from "@/components/wallet/mnemonic-grid";
import { useWallet } from "@/providers/wallet-provider";
import { useCreateWallet } from "./provider";

export default function GenerateWalletPage() {
	const router = useRouter();
	const { mnemonic, setMnemonic } = useCreateWallet();
	const { hasWallet } = useWallet();

	useEffect(() => {
		if (hasWallet) {
			router.push("/wallet");
			return;
		}
		if (!mnemonic) {
			setMnemonic(Mnemonic.fromRandom(128).toString());
		}
	}, [mnemonic, setMnemonic, hasWallet, router]);

	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>Create New Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>Your New Seed Phrase</CardTitle>
						<CardDescription>
							Write down these 12 words in order and store them safely.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{mnemonic ? (
							<MnemonicGrid mode="view" mnemonic={mnemonic} />
						) : (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
							</div>
						)}
						<div className="mt-6 flex justify-end">
							<Button
								onClick={() => router.push("/wallet/create/confirm")}
								disabled={!mnemonic}
							>
								I have saved my seed phrase
							</Button>
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
