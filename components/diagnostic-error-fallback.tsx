"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	createCorrelationId,
	type DiagnosticCategory,
	reportDiagnostic,
} from "@/lib/runtime-diagnostics";

interface DiagnosticErrorFallbackProps {
	error: Error & { digest?: string };
	reset: () => void;
	category: DiagnosticCategory;
	operation: string;
	title: string;
	description: string;
	backHref?: string;
	backLabel?: string;
	fullScreen?: boolean;
}

export function DiagnosticErrorFallback({
	reset,
	category,
	operation,
	title,
	description,
	backHref,
	backLabel,
	fullScreen = false,
}: DiagnosticErrorFallbackProps) {
	const correlationId = useRef(createCorrelationId()).current;

	useEffect(() => {
		reportDiagnostic({
			category,
			code: category === "provider" ? "provider.failed" : "route.unexpected",
			operation,
			correlationId,
			recoverable: true,
		});
	}, [category, correlationId, operation]);

	const retry = () => {
		reportDiagnostic({
			category: "action",
			code: "action.requested",
			operation: `${operation}.retry`,
			correlationId,
			recoverable: true,
		});
		reset();
	};

	return (
		<div
			className={`flex items-center justify-center p-6 ${fullScreen ? "min-h-screen" : "flex-1"}`}
		>
			<div className="mx-auto max-w-md space-y-6 text-center">
				<AlertTriangle className="mx-auto size-10 text-destructive" />
				<div className="space-y-2">
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
					<p className="font-mono text-xs text-muted-foreground">
						Error ID: {correlationId}
					</p>
				</div>
				<div className="flex items-center justify-center gap-3">
					<Button onClick={retry} variant="outline" size="sm">
						<RotateCcw className="mr-2 size-4" data-icon="inline-start" />
						Try again
					</Button>
					{backHref && backLabel && (
						<Button variant="ghost" size="sm" asChild>
							<Link href={backHref}>{backLabel}</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
