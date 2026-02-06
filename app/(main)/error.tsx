"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainError({
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
					<h2 className="text-lg font-semibold">Something went wrong</h2>
					<p className="text-sm text-muted-foreground">
						An error occurred while loading this page.
					</p>
					{error.digest && (
						<p className="font-mono text-xs text-muted-foreground">
							Error ID: {error.digest}
						</p>
					)}
				</div>
				<Button onClick={reset} variant="outline" size="sm">
					<RotateCcw className="mr-2 size-4" />
					Try again
				</Button>
			</div>
		</div>
	);
}
