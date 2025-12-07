"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { useCreateWallet } from "../provider";

export default function ConfirmWalletPage() {
	const router = useRouter();
	const { mnemonic } = useCreateWallet();
	const [isVerified, setIsVerified] = useState(false);

	if (!mnemonic) {
		if (typeof window !== "undefined") router.replace("/wallet/create");
		return null;
	}

	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>Create New Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>Confirm Seed Phrase</CardTitle>
						<CardDescription>
							Please verify your seed phrase by selecting the words in correct
							order.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<MnemonicGrid
							mode="prove"
							mnemonic={mnemonic}
							onVerify={(isValid) => setIsVerified(isValid)}
						/>
						<div className="flex gap-2 mt-4 justify-end">
							<Button variant="ghost" onClick={() => router.back()}>
								Back
							</Button>
							<Button
								onClick={() => router.push("/wallet/create/encrypt")}
								disabled={!isVerified}
							>
								Confirm & Continue
							</Button>
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
