"use client";

import { DiagnosticErrorFallback } from "@/components/diagnostic-error-fallback";

export default function MainError({
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
			operation="main.render"
			title="Something went wrong"
			description="An error occurred while loading this page."
		/>
	);
}
