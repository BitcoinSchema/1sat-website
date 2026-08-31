"use client";

import { Button } from "@/components/ui/button";

export default function Bsv21DetailError({ reset }: { reset: () => void }) {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-4 p-6" role="alert">
			<h1 className="text-2xl font-bold">BSV21 token data is unavailable</h1>
			<p className="text-muted-foreground">
				The token detail or current listing validation could not be loaded from
				the configured 1Sat Stack. No empty-market claim is being made.
			</p>
			<Button type="button" onClick={reset}>
				Try again
			</Button>
		</div>
	);
}
