"use client";

import { useThemeTokenContext } from "@theme-token/sdk/react";
import { Check, Loader2, Paintbrush, RotateCcw } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useOrdinalMetadata } from "@/hooks/use-ordinal-metadata";
import { getOwnedThemeTokens } from "@/lib/wallet/theme-tokens";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function ThemeTokenPicker() {
	const { ordinals, identityKey, isInitialized } = useWalletToolbox();
	const { metadataQuery } = useOrdinalMetadata(
		ordinals,
		identityKey,
		isInitialized,
	);
	const { activeOrigin, loadTheme, resetTheme, isLoading, error } =
		useThemeTokenContext();
	const themes = getOwnedThemeTokens(ordinals, metadataQuery.data);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Paintbrush className="size-5 text-primary" />
					<CardTitle>Theme Tokens</CardTitle>
				</div>
				<CardDescription>
					Apply a Theme Token held by the active wallet.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isInitialized ? (
					<p className="text-sm text-muted-foreground">
						Connect or unlock a wallet to see its themes.
					</p>
				) : metadataQuery.isError ? (
					<div className="space-y-3" role="alert">
						<p className="text-destructive text-sm">
							Owned themes could not be loaded.
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void metadataQuery.refetch()}
						>
							Retry
						</Button>
					</div>
				) : ordinals.length > 0 && metadataQuery.isPending ? (
					<div
						className="flex items-center gap-2 text-sm text-muted-foreground"
						role="status"
					>
						<Loader2 className="size-4 animate-spin" />
						Loading owned themes…
					</div>
				) : themes.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No Theme Tokens found in this wallet.
					</p>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						{themes.map((theme) => {
							const active = activeOrigin === theme.origin;
							return (
								<div
									key={theme.origin}
									className="flex items-center gap-3 rounded-lg border p-3"
								>
									<Image
										src={theme.artworkUrl}
										alt=""
										width={64}
										height={64}
										className="size-16 rounded-md object-cover"
										unoptimized
									/>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{theme.name}</p>
										<p className="truncate font-mono text-muted-foreground text-xs">
											{theme.origin}
										</p>
									</div>
									<Button
										type="button"
										size="sm"
										variant={active ? "secondary" : "outline"}
										disabled={isLoading || active}
										onClick={() => void loadTheme(theme.origin)}
									>
										{active ? (
											<>
												<Check data-icon="inline-start" />
												Active
											</>
										) : isLoading ? (
											<>
												<Loader2
													data-icon="inline-start"
													className="animate-spin"
												/>
												Applying
											</>
										) : (
											"Apply"
										)}
									</Button>
								</div>
							);
						})}
					</div>
				)}

				{error && (
					<p className="text-destructive text-sm" role="alert">
						That Theme Token could not be applied. Try again or use the default
						theme.
					</p>
				)}

				{activeOrigin && (
					<Button
						type="button"
						variant="ghost"
						onClick={resetTheme}
						disabled={isLoading}
					>
						<RotateCcw data-icon="inline-start" />
						Use default theme
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
