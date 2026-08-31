"use client";

import { useQuery } from "@tanstack/react-query";
import { FileWarning, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	BitPlanAccessError,
	BitPlanEnvelopeError,
	type BitPlanPlaintext,
	openBitPlanEnvelope,
	parseBitPlanEnvelope,
} from "@/lib/bitplan-envelope";
import { stackContentUrl } from "@/lib/stack";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type ViewState =
	| { phase: "encrypted" }
	| { phase: "decrypting" }
	| { phase: "decrypted"; plaintext: BitPlanPlaintext; version: 1 | 2 }
	| { phase: "error"; message: string };

function accessMessage(error: unknown): string {
	if (error instanceof BitPlanAccessError) {
		switch (error.issue) {
			case "not-authorized":
				return "This wallet identity is not authorized to read this document.";
			case "identity-unavailable":
				return "The wallet could not provide the identity needed for this shared document.";
			case "decrypt-refused":
				return "This wallet could not decrypt the document. It may have been encrypted by a different wallet identity, or the request was declined.";
		}
	}
	if (error instanceof BitPlanEnvelopeError) return error.message;
	return "This BitPlan document could not be decrypted.";
}

export function BitPlanArtifact({ origin }: { origin: string }) {
	const { wallet } = useWalletToolbox();
	const [view, setView] = useState<ViewState>({ phase: "encrypted" });
	const envelopeQuery = useQuery({
		queryKey: ["bitplan-envelope", origin],
		queryFn: async () => {
			const response = await fetch(stackContentUrl(origin));
			if (!response.ok) {
				throw new Error("The encrypted document could not be loaded.");
			}
			const bytes = new Uint8Array(await response.arrayBuffer());
			const { header } = parseBitPlanEnvelope(bytes);
			return { bytes, version: header.v };
		},
		staleTime: Number.POSITIVE_INFINITY,
	});

	const decrypt = async () => {
		if (view.phase !== "encrypted" || !envelopeQuery.data) return;
		if (!wallet) {
			setView({
				phase: "error",
				message:
					"Connect or unlock a BRC-100 wallet before decrypting this document.",
			});
			return;
		}
		const { bytes, version } = envelopeQuery.data;
		setView({ phase: "decrypting" });
		try {
			const { plaintext } = await openBitPlanEnvelope(wallet, bytes);
			setView({ phase: "decrypted", plaintext, version });
		} catch (error) {
			setView({ phase: "error", message: accessMessage(error) });
		}
	};

	if (view.phase === "decrypted") {
		return (
			<div className="flex size-full min-h-0 flex-col">
				<div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-sm">
					<p className="truncate font-medium">
						{view.plaintext.meta?.title || "BitPlan Document"}
					</p>
					<span className="text-muted-foreground">BPLN v{view.version}</span>
				</div>
				<iframe
					className="min-h-0 w-full flex-1 border-0 bg-background"
					sandbox=""
					srcDoc={view.plaintext.html}
					title={view.plaintext.meta?.title || "BitPlan Document"}
				/>
			</div>
		);
	}

	return (
		<div className="flex size-full items-center justify-center p-8">
			<div className="w-full max-w-md space-y-5 text-center">
				{envelopeQuery.isPending || view.phase === "decrypting" ? (
					<Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
				) : envelopeQuery.isError || view.phase === "error" ? (
					<FileWarning className="mx-auto size-8 text-destructive" />
				) : (
					<LockKeyhole className="mx-auto size-8 text-muted-foreground" />
				)}
				<div aria-live="polite">
					<h3 className="font-semibold text-lg">Encrypted BitPlan document</h3>
					<p
						className="mt-1 text-muted-foreground text-sm"
						role={
							envelopeQuery.isError || view.phase === "error"
								? "alert"
								: "status"
						}
					>
						{envelopeQuery.isPending
							? "Loading encrypted content…"
							: view.phase === "decrypting"
								? "Waiting for the wallet…"
								: envelopeQuery.isError
									? envelopeQuery.error instanceof BitPlanEnvelopeError
										? envelopeQuery.error.message
										: "The encrypted document could not be loaded."
									: view.phase === "error"
										? view.message
										: `BPLN v${envelopeQuery.data?.version} · plaintext stays in this browser.`}
					</p>
				</div>
				{view.phase === "encrypted" && envelopeQuery.data && (
					<Button onClick={() => void decrypt()}>Decrypt with wallet</Button>
				)}
				{view.phase === "error" && envelopeQuery.data && (
					<Button
						variant="outline"
						onClick={() => setView({ phase: "encrypted" })}
					>
						Try again
					</Button>
				)}
				{envelopeQuery.isError && (
					<Button
						variant="outline"
						onClick={() => void envelopeQuery.refetch()}
					>
						Retry loading
					</Button>
				)}
			</div>
		</div>
	);
}
