"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const error = searchParams.get("error") || "Unknown Error";
	const description =
		searchParams.get("error_description") || "An unknown error occurred.";

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center max-w-md">
				<AlertCircle className="h-12 w-12 text-destructive mx-auto" />
				<h2 className="text-xl font-semibold mt-4">{error}</h2>
				<p className="mt-2 text-sm text-muted-foreground">{description}</p>
				<div className="mt-6 flex gap-3 justify-center">
					<button
						type="button"
						onClick={() => router.push("/")}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
					>
						Return Home
					</button>
					<button
						type="button"
						onClick={() => router.back()}
						className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm"
					>
						Go Back
					</button>
				</div>
			</div>
		</div>
	);
}

export default function ErrorPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			}
		>
			<ErrorContent />
		</Suspense>
	);
}
