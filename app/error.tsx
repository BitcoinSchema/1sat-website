"use client";

import { DiagnosticErrorFallback } from "@/components/diagnostic-error-fallback";

export default function RootError({
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
			category="route"
			operation="app.render"
			title="Something went wrong"
			description="An unexpected error occurred. Please try again."
			fullScreen
		/>
	);
}
