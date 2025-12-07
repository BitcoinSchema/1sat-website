"use client";

import { useRouter } from "next/navigation";
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
import type { Keys } from "@/lib/types";
import { useImportWallet } from "../provider";

export default function ImportMnemonicPage() {
	const router = useRouter();
	const { setWalletKeys } = useImportWallet();

	const handleMnemonicSubmit = (keys: Keys) => {
		setWalletKeys(keys);
		router.push("/wallet/import/passphrase");
	};

	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>Import Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>Enter Mnemonic Seed</CardTitle>
						<CardDescription>
							Enter your 12-word recovery phrase to import your wallet.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<MnemonicGrid onSubmit={handleMnemonicSubmit} />
						<div className="mt-4 flex justify-start">
							<Button variant="ghost" onClick={() => router.back()}>
								Back
							</Button>
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
