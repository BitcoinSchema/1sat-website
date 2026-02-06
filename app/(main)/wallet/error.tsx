"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WalletError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="mx-auto max-w-md space-y-6 text-center">
				<div className="flex justify-center">
					<AlertTriangle className="size-10 text-destructive" />
				</div>
				<div className="space-y-2">
					<h2 className="text-lg font-semibold">Wallet error</h2>
					<p className="text-sm text-muted-foreground">
						Something went wrong with your wallet. This may be a temporary
						issue.
					</p>
					{error.digest && (
						<p className="font-mono text-xs text-muted-foreground">
							Error ID: {error.digest}
						</p>
					)}
				</div>
				<div className="flex items-center justify-center gap-3">
					<Button onClick={reset} variant="outline" size="sm">
						<RotateCcw className="mr-2 size-4" />
						Try again
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link href="/wallet">Back to wallet</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
