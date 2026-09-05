"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, storeAuthData } from "@/lib/auth-client";

function CallbackContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const result = await authClient.sigma.handleCallback(searchParams);
				storeAuthData(result);
				router.push("/");
			} catch (err: unknown) {
				if (typeof window !== "undefined") {
					authClient.sigma.redirectToError(err);
					return;
				}
				setError(
					err &&
						typeof err === "object" &&
						"message" in err &&
						typeof err.message === "string"
						? err.message
						: "Authentication failed",
				);
			}
		};

		handleCallback();
	}, [searchParams, router]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="max-w-md text-center">
					<h2 className="font-semibold text-destructive text-xl">
						Authentication Failed
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">{error}</p>
					<Button
						className="mt-4"
						onClick={() => router.push("/")}
						type="button"
					>
						Return Home
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
				<h2 className="mt-4 font-semibold text-xl">Completing sign in...</h2>
				<p className="mt-2 text-muted-foreground text-sm">Please wait</p>
			</div>
		</div>
	);
}

export default function CallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<CallbackContent />
		</Suspense>
	);
}
