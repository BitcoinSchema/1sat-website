"use client";

import { DiagnosticErrorFallback } from "@/components/diagnostic-error-fallback";

export default function WalletError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<DiagnosticErrorFallback
			error={error}
			reset={reset}
			category="provider"
			operation="wallet.render"
			title="Wallet error"
			description="Something went wrong with your wallet. This may be a temporary issue."
			backHref="/wallet"
			backLabel="Back to wallet"
		/>
	);
}
