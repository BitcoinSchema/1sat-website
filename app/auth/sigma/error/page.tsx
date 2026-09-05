"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function ErrorContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const parsed = {
		error: searchParams.get("error") || "Unknown Error",
		errorDescription:
			searchParams.get("error_description") || "An unknown error occurred.",
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="max-w-md text-center">
				<AlertCircle className="mx-auto h-12 w-12 text-destructive" />
				<h2 className="mt-4 font-semibold text-xl">
					{parsed?.error || "Unknown Error"}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{parsed?.errorDescription || "An unknown error occurred."}
				</p>
				<div className="mt-6 flex justify-center gap-3">
					<Button onClick={() => router.push("/")} type="button">
						Return Home
					</Button>
					<Button
						onClick={() => router.back()}
						type="button"
						variant="secondary"
					>
						Go Back
					</Button>
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
