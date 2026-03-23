"use client";

import { getOpnsNames } from "@1sat/actions";
import { useQuery } from "@tanstack/react-query";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { getDisplayOutpoint, getName } from "@/lib/wallet/wallet-output-utils";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export default function WalletOpnsPage() {
	const { isWalletLocked } = useWallet();
	const { oneSatContext, isInitialized, isInitializing } = useWalletToolbox();

	const { data: opnsNames = [], isLoading } = useQuery({
		queryKey: ["opns-names", isInitialized],
		queryFn: async () => {
			if (!oneSatContext) return [];
			const result = await getOpnsNames.execute(oneSatContext, {});
			return result.outputs;
		},
		enabled: isInitialized && !!oneSatContext,
		staleTime: 30_000,
	});

	const loading = isInitializing || isLoading;

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4">
						{!isInitialized && !loading && isWalletLocked && (
							<p className="text-muted-foreground">
								Please unlock or create a wallet to view your OpNS names.
							</p>
						)}
						{loading && <p className="text-muted-foreground">Loading...</p>}
						{isInitialized && !loading && opnsNames.length === 0 && (
							<p className="text-muted-foreground">No OpNS names found.</p>
						)}
						{isInitialized && opnsNames.length > 0 && (
							<>
								<h2 className="text-lg font-semibold mb-3">
									{opnsNames.length} OpNS Name
									{opnsNames.length !== 1 ? "s" : ""}
								</h2>
								<div className="grid gap-2">
									{opnsNames.map((output) => {
										const outpoint = getDisplayOutpoint(output);
										const name = getName(output);
										return (
											<div
												key={outpoint}
												className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3"
											>
												<span className="font-mono text-sm font-medium">
													{name || outpoint}
												</span>
												<span className="text-xs text-muted-foreground font-mono">
													{outpoint.slice(0, 8)}...{outpoint.slice(-4)}
												</span>
											</div>
										);
									})}
								</div>
							</>
						)}
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
