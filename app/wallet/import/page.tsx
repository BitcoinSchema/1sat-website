"use client";

import { FileUp, Key } from "lucide-react";
import Link from "next/link";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function ImportSelectPage() {
	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>Import Wallet</PageTitle>
			</PageHeader>
			<PageContent className="grid gap-6 md:grid-cols-2">
				<Link href="/wallet/import/json" className="block">
					<Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/50 h-full">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
								<FileUp className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Backup JSON</CardTitle>
							<CardDescription>Import from a file</CardDescription>
						</CardHeader>
						<CardContent className="text-center text-sm text-muted-foreground pb-6">
							Upload your exported wallet backup file to restore your keys.
						</CardContent>
					</Card>
				</Link>

				<Link href="/wallet/import/mnemonic" className="block">
					<Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/50 h-full">
						<CardHeader className="text-center pb-2">
							<div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
								<Key className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>Mnemonic Phrase</CardTitle>
							<CardDescription>Import from 12 words</CardDescription>
						</CardHeader>
						<CardContent className="text-center text-sm text-muted-foreground pb-6">
							Enter your 12-word recovery phrase to restore your wallet.
						</CardContent>
					</Card>
				</Link>
			</PageContent>
		</Page>
	);
}
