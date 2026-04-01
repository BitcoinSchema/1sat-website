"use client";

import {
	type WalletOutput,
	getOpnsNames,
	opnsDeregister,
	opnsRegister,
} from "@1sat/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

function isPublished(output: WalletOutput): boolean {
	return output.tags?.includes("opns:published") ?? false;
}

export default function WalletOpnsPage() {
	const { isWalletLocked } = useWallet();
	const { oneSatContext, isInitialized, isInitializing } = useWalletToolbox();
	const queryClient = useQueryClient();
	const [busyOutpoint, setBusyOutpoint] = useState<string | null>(null);

	const {
		data: opnsData,
		isLoading,
	} = useQuery({
		queryKey: ["opns-names", isInitialized],
		queryFn: async () => {
			if (!oneSatContext) return { outputs: [], BEEF: undefined };
			return getOpnsNames.execute(oneSatContext, {});
		},
		enabled: isInitialized && !!oneSatContext,
		staleTime: 30_000,
	});

	const opnsNames = opnsData?.outputs ?? [];
	const beef = opnsData?.BEEF;

	const loading = isInitializing || isLoading;

	async function togglePublish(output: WalletOutput) {
		if (!oneSatContext || !beef) return;
		setBusyOutpoint(output.outpoint);
		try {
			const action = isPublished(output) ? opnsDeregister : opnsRegister;
			const result = await action.execute(oneSatContext, {
				ordinal: output,
				inputBEEF: Array.from(beef),
			});
			if (result.error) {
				console.error("[opns toggle]", result.error);
			}
			queryClient.invalidateQueries({ queryKey: ["opns-names"] });
		} catch (err) {
			console.error("[opns toggle]", err);
		} finally {
			setBusyOutpoint(null);
		}
	}

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
										const published = isPublished(output);
										const busy = busyOutpoint === output.outpoint;
										return (
											<div
												key={outpoint}
												className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3"
											>
												<div className="flex items-center gap-3">
													<span className="font-mono text-sm font-medium">
														{name || outpoint}
													</span>
													<span className="text-xs text-muted-foreground font-mono">
														{outpoint.slice(0, 8)}...{outpoint.slice(-4)}
													</span>
												</div>
												<button
													type="button"
													disabled={busy}
													onClick={() => togglePublish(output)}
													className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
														published
															? "bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400"
															: "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
													} disabled:opacity-50 disabled:cursor-not-allowed`}
												>
													{busy
														? "..."
														: published
															? "Published"
															: "Unpublished"}
												</button>
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
