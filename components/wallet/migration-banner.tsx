"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MigrationBannerProps {
	legacyPayAddress: string;
	legacyOrdAddress: string;
}

export function MigrationBanner({
	legacyPayAddress,
	legacyOrdAddress,
}: MigrationBannerProps) {
	return (
		<Card className="border-amber-500/50 bg-amber-500/5">
			<CardContent className="flex items-center justify-between gap-4 py-4">
				<div className="space-y-1">
					<p className="text-sm font-medium">Wallet Migration Available</p>
					<p className="text-xs text-muted-foreground">
						Your wallet uses a legacy key structure. Migrate to the new
						identity-key system and sweep assets from{" "}
						<span className="font-mono">{legacyPayAddress.slice(0, 8)}...</span>
						{legacyOrdAddress !== legacyPayAddress && (
							<>
								{" and "}
								<span className="font-mono">
									{legacyOrdAddress.slice(0, 8)}...
								</span>
							</>
						)}
					</p>
				</div>
				<Link href="/wallet/migrate">
					<Button variant="outline" size="sm">
						Migrate
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
