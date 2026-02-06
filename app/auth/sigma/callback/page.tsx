"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
				console.error("OAuth callback error:", err);
				if (
					err &&
					typeof err === "object" &&
					"message" in err &&
					typeof (err as { message: unknown }).message === "string"
				) {
					setError((err as { message: string }).message);
				} else {
					setError("Authentication failed");
				}
			}
		};

		handleCallback();
	}, [searchParams, router]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center max-w-md">
					<h2 className="text-xl font-semibold text-destructive">
						Authentication Failed
					</h2>
					<p className="mt-2 text-sm text-muted-foreground">{error}</p>
					<button
						type="button"
						onClick={() => router.push("/")}
						className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
					>
						Return Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
				<h2 className="text-xl font-semibold mt-4">Completing sign in...</h2>
				<p className="mt-2 text-sm text-muted-foreground">Please wait</p>
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
