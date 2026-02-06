"use client";

// TODO(cwi): Migrate off internal wallet-toolbox import when stable public exports are available.
import type { PermissionToken } from "@bsv/wallet-toolbox/out/src/index.client";
import { ArrowLeft, Key, Loader2, Shield, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { buildPermissionCacheKey } from "@/lib/cwi/permission-keys";
import {
	type LocalPermission,
	loadLocalPermissions,
	type PermissionScope,
	removeLocalPermission,
} from "@/lib/cwi/permission-store";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type TokenCategory = "protocol" | "basket" | "certificate" | "spending";

interface CategorizedToken {
	category: TokenCategory;
	token: PermissionToken;
	source: "onchain" | "local";
	cacheKey?: string;
	localKey?: string;
}

function tokenLabel(token: CategorizedToken): string {
	switch (token.category) {
		case "protocol":
			return token.token.protocol ?? "Unknown protocol";
		case "basket":
			return token.token.basketName ?? "Unknown basket";
		case "certificate":
			return token.token.certType ?? "Unknown certificate";
		case "spending":
			return `${(token.token.authorizedAmount ?? 0).toLocaleString()} sat/mo`;
	}
}

function categoryIcon(category: TokenCategory) {
	switch (category) {
		case "protocol":
			return <Key className="h-4 w-4" />;
		case "basket":
			return <Wallet className="h-4 w-4" />;
		case "certificate":
			return <Shield className="h-4 w-4" />;
		case "spending":
			return <Wallet className="h-4 w-4" />;
	}
}

function categoryBadgeVariant(
	category: TokenCategory,
): "default" | "secondary" | "destructive" | "outline" {
	switch (category) {
		case "spending":
			return "destructive";
		case "protocol":
			return "default";
		case "basket":
			return "secondary";
		case "certificate":
			return "outline";
	}
}

function buildOnchainCacheKey(
	category: TokenCategory,
	token: PermissionToken,
): string | undefined {
	switch (category) {
		case "protocol":
			if (token.securityLevel === undefined || !token.protocol)
				return undefined;
			return buildPermissionCacheKey({
				type: "protocol",
				originator: token.originator,
				privileged: !!token.privileged,
				protocolID: [token.securityLevel, token.protocol],
				counterparty: token.counterparty,
			});
		case "basket":
			if (!token.basketName) return undefined;
			return buildPermissionCacheKey({
				type: "basket",
				originator: token.originator,
				basket: token.basketName,
			});
		case "certificate":
			if (!token.verifier || !token.certType) return undefined;
			return buildPermissionCacheKey({
				type: "certificate",
				originator: token.originator,
				privileged: !!token.privileged,
				certificate: {
					verifier: token.verifier,
					certType: token.certType,
					fields: token.certFields ?? [],
				},
			});
		case "spending":
			if (token.authorizedAmount === undefined) return undefined;
			return buildPermissionCacheKey({
				type: "spending",
				originator: token.originator,
				spending: {
					satoshis: token.authorizedAmount,
				},
			});
	}
}

export default function PermissionsPage() {
	const { permissionsManager, isInitialized, identityKey, chain } =
		useWalletToolbox();
	const [tokens, setTokens] = useState<CategorizedToken[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasLoadedPermissions, setHasLoadedPermissions] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [revoking, setRevoking] = useState<string | null>(null);

	const scope: PermissionScope | null =
		identityKey === null ? null : { identityKey, chain };

	const loadTokens = useCallback(async () => {
		if (!permissionsManager || !scope) {
			setTokens([]);
			setLoadError(null);
			setIsLoading(false);
			setHasLoadedPermissions(false);
			return;
		}

		setIsLoading(true);
		setLoadError(null);

		try {
			const [protocols, baskets, certs, spending, localPerms] =
				await Promise.all([
					permissionsManager.listProtocolPermissions({}),
					permissionsManager.listBasketAccess({}),
					permissionsManager.listCertificateAccess({}),
					permissionsManager.listSpendingAuthorizations({}),
					loadLocalPermissions(scope).catch(() => [] as LocalPermission[]),
				]);

			const all: CategorizedToken[] = [
				...protocols.map((token) => ({
					category: "protocol" as const,
					token,
					source: "onchain" as const,
					cacheKey: buildOnchainCacheKey("protocol", token),
				})),
				...baskets.map((token) => ({
					category: "basket" as const,
					token,
					source: "onchain" as const,
					cacheKey: buildOnchainCacheKey("basket", token),
				})),
				...certs.map((token) => ({
					category: "certificate" as const,
					token,
					source: "onchain" as const,
					cacheKey: buildOnchainCacheKey("certificate", token),
				})),
				...spending.map((token) => ({
					category: "spending" as const,
					token,
					source: "onchain" as const,
					cacheKey: buildOnchainCacheKey("spending", token),
				})),
			];

			const onchainKeys = new Set(
				all
					.filter((token) => token.source === "onchain" && token.cacheKey)
					.map((token) => token.cacheKey),
			);

			for (const local of localPerms) {
				if (onchainKeys.has(local.key)) continue;

				all.push({
					category: local.type,
					token: {
						txid: "",
						tx: [],
						outputIndex: 0,
						outputScript: "",
						satoshis: 0,
						originator: local.originator,
						expiry: local.expiry,
					} as PermissionToken,
					source: "local",
					cacheKey: local.key,
					localKey: local.key,
				});
			}

			all.sort((a, b) => a.token.originator.localeCompare(b.token.originator));
			setTokens(all);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to load permissions";
			setTokens([]);
			setLoadError(message);
		} finally {
			setIsLoading(false);
			setHasLoadedPermissions(true);
		}
	}, [permissionsManager, scope]);

	useEffect(() => {
		if (!isInitialized) {
			setHasLoadedPermissions(false);
			return;
		}
		if (!permissionsManager || !scope) {
			setTokens([]);
			setLoadError(null);
			setIsLoading(false);
			setHasLoadedPermissions(false);
			return;
		}
		setHasLoadedPermissions(false);
		void loadTokens();
	}, [isInitialized, permissionsManager, scope, loadTokens]);

	const handleRevoke = async (token: CategorizedToken) => {
		if (!permissionsManager || !scope) return;
		const key =
			token.source === "local" && token.localKey
				? token.localKey
				: `${token.token.txid}:${token.token.outputIndex}`;
		setRevoking(key);
		try {
			if (token.source === "local" && token.localKey) {
				await removeLocalPermission(scope, token.localKey);
				const internals = permissionsManager as unknown as {
					permissionCache?: Map<string, { expiry: number; cachedAt: number }>;
					recentGrants?: Map<string, number>;
				};
				internals.permissionCache?.delete(token.localKey);
				internals.recentGrants?.delete(token.localKey);
			} else {
				await permissionsManager.revokePermission(token.token);
			}
			await loadTokens();
		} catch (err) {
			console.error("Failed to revoke permission:", err);
		} finally {
			setRevoking(null);
		}
	};

	const grouped = tokens.reduce<Record<string, CategorizedToken[]>>(
		(acc, token) => {
			const key = token.token.originator;
			if (!acc[key]) acc[key] = [];
			acc[key].push(token);
			return acc;
		},
		{},
	);

	return (
		<Page>
			<PageHeader className="gap-2 justify-start">
				<Button variant="ghost" size="icon" asChild className="-ml-2">
					<Link href="/wallet/settings">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<PageTitle>Connected Apps</PageTitle>
			</PageHeader>
			<PageContent>
				{!isInitialized ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : !permissionsManager ? (
					<Card>
						<CardHeader className="text-center">
							<Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
							<CardTitle className="text-lg">
								Unlock Wallet To Manage Apps
							</CardTitle>
							<CardDescription>
								Connected app permissions are available after your wallet is
								unlocked.
							</CardDescription>
						</CardHeader>
					</Card>
				) : isLoading || !hasLoadedPermissions ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : loadError ? (
					<Card>
						<CardHeader className="text-center">
							<Shield className="h-10 w-10 mx-auto text-destructive mb-2" />
							<CardTitle className="text-lg">
								Failed To Load Permissions
							</CardTitle>
							<CardDescription>{loadError}</CardDescription>
						</CardHeader>
					</Card>
				) : tokens.length === 0 ? (
					<Card>
						<CardHeader className="text-center">
							<Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
							<CardTitle className="text-lg">No Permissions Granted</CardTitle>
							<CardDescription>
								When dApps request access via CWI, their permissions will appear
								here.
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="space-y-4">
						{Object.entries(grouped).map(([originator, originTokens]) => (
							<Card key={originator}>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-mono truncate">
										{originator}
									</CardTitle>
									<CardDescription>
										{originTokens.length} permission
										{originTokens.length !== 1 ? "s" : ""}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{originTokens.map((ct) => {
										const key =
											ct.source === "local" && ct.localKey
												? ct.localKey
												: `${ct.token.txid}:${ct.token.outputIndex}`;
										const isExpired =
											ct.token.expiry > 0 &&
											ct.token.expiry < Date.now() / 1000;
										return (
											<div
												key={key}
												className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
											>
												<div className="flex items-center gap-2 min-w-0">
													{categoryIcon(ct.category)}
													<Badge
														variant={categoryBadgeVariant(ct.category)}
														className="text-xs"
													>
														{ct.category}
													</Badge>
													<span className="text-sm truncate">
														{tokenLabel(ct)}
													</span>
													{ct.source === "local" && (
														<Badge
															variant="outline"
															className="text-xs text-muted-foreground"
														>
															local
														</Badge>
													)}
													{isExpired && (
														<Badge
															variant="outline"
															className="text-xs text-destructive"
														>
															Expired
														</Badge>
													)}
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="shrink-0 text-destructive hover:text-destructive"
													disabled={revoking === key}
													onClick={() => handleRevoke(ct)}
												>
													{revoking === key ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Trash2 className="h-4 w-4" />
													)}
												</Button>
											</div>
										);
									})}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</PageContent>
		</Page>
	);
}
