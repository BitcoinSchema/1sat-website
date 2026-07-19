"use client";

import type { WalletOutput } from "@1sat/actions";
import { Loader2, Tag, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
	isListed,
	ListOrdinalDialog,
} from "@/components/market/list-ordinal-dialog";
import { Button } from "@/components/ui/button";
import { ORDFS } from "@/lib/constants";
import {
	getDisplayOutpoint,
	getOriginOutpoint,
} from "@/lib/wallet/wallet-output-utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function OrdinalsGrid() {
	const { ordinals, isInitialized, isInitializing } = useWalletToolbox();
	const [dialogOrdinal, setDialogOrdinal] = useState<WalletOutput | null>(
		null,
	);

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading wallet...</span>
			</div>
		);
	}

	if (!isInitialized) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				Please unlock or create a wallet to view your ordinals.
			</div>
		);
	}

	if (ordinals.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				No ordinals found in your wallet.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-medium">
					{ordinals.length} Ordinal{ordinals.length !== 1 ? "s" : ""}
				</h3>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
				{ordinals.map((ordinal) => {
					const outpoint = getDisplayOutpoint(ordinal);
					const originOutpoint = getOriginOutpoint(ordinal);
					return (
						<div
							key={outpoint}
							className="group relative aspect-square overflow-hidden rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-all"
						>
							<a
								href={`${ORDFS}/content/${originOutpoint}`}
								target="_blank"
								rel="noopener noreferrer"
								className="block w-full h-full"
							>
								<Image
									src={`${ORDFS}/content/${originOutpoint}`}
									alt={`Ordinal ${outpoint.slice(0, 8)}...`}
									fill
									className="object-cover transition-transform group-hover:scale-105"
									sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
									unoptimized
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
								<div className="absolute bottom-0 left-0 right-0 p-2 text-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="truncate font-mono">
										{outpoint.slice(0, 16)}...
									</div>
									<div className="text-foreground/70">
										{ordinal.satoshis} sat
									</div>
								</div>
							</a>
							{isListed(ordinal) && (
								<span className="absolute top-1.5 left-1.5 rounded bg-primary/90 text-primary-foreground text-[10px] font-medium px-1.5 py-0.5">
									Listed
								</span>
							)}
							<Button
								size="sm"
								variant="secondary"
								className="absolute top-1.5 right-1.5 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={(e) => {
									e.preventDefault();
									setDialogOrdinal(ordinal);
								}}
							>
								{isListed(ordinal) ? (
									<X className="w-3.5 h-3.5" />
								) : (
									<Tag className="w-3.5 h-3.5" />
								)}
							</Button>
						</div>
					);
				})}
			</div>
			{dialogOrdinal && (
				<ListOrdinalDialog
					ordinal={dialogOrdinal}
					open={!!dialogOrdinal}
					onOpenChange={(open) => {
						if (!open) setDialogOrdinal(null);
					}}
				/>
			)}
		</div>
	);
}
