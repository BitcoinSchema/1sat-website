"use client";

import { useEffect, useRef } from "react";
import {
	createCorrelationId,
	reportDiagnostic,
} from "@/lib/runtime-diagnostics";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const correlationId = useRef(createCorrelationId()).current;

	useEffect(() => {
		reportDiagnostic({
			category: "route",
			code: "route.unexpected",
			operation: "root-layout.render",
			correlationId,
			recoverable: true,
		});
	}, [correlationId]);

	return (
		<html lang="en">
			<body
				style={{
					background: "#09090b",
					color: "#fafafa",
					fontFamily: "system-ui, sans-serif",
					margin: 0,
				}}
			>
				<main
					style={{
						display: "grid",
						minHeight: "100vh",
						placeContent: "center",
						padding: 24,
						textAlign: "center",
					}}
				>
					<h1>1Sat Wallet could not load</h1>
					<p>Try again. If the problem continues, share this error ID.</p>
					<code>{correlationId}</code>
					<button
						type="button"
						onClick={reset}
						style={{ margin: "24px auto 0", padding: "10px 16px" }}
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
