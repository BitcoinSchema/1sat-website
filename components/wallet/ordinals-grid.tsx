"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { ORDFS } from "@/lib/constants";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface OrdinalCardProps {
	txid: string;
	vout: number;
	satoshis: number;
}

function OrdinalCard({ txid, vout, satoshis }: OrdinalCardProps) {
	const outpoint = `${txid}_${vout}`;
	const imageUrl = `${ORDFS}/${outpoint}`;

	return (
		<div className="group relative aspect-square overflow-hidden rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-all">
			<a
				href={`https://ordfs.network/${outpoint}`}
				target="_blank"
				rel="noopener noreferrer"
				className="block w-full h-full"
			>
				<Image
					src={imageUrl}
					alt={`Ordinal ${outpoint.slice(0, 8)}...`}
					fill
					className="object-cover transition-transform group-hover:scale-105"
					sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
					unoptimized
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
				<div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
					<div className="truncate font-mono">{outpoint.slice(0, 16)}...</div>
					<div className="text-white/70">{satoshis} sat</div>
				</div>
			</a>
		</div>
	);
}

export function OrdinalsGrid() {
	const { ordinals, isInitialized, isInitializing } = useWalletToolbox();

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
				{ordinals.map((ordinal) => (
					<OrdinalCard
						key={`${ordinal.txid}_${ordinal.vout}`}
						txid={ordinal.txid}
						vout={ordinal.vout}
						satoshis={ordinal.satoshis}
					/>
				))}
			</div>
		</div>
	);
}
