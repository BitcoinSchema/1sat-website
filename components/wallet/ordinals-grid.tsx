"use client";

import type { WalletOutput } from "@1sat/actions";
import { useQueryClient } from "@tanstack/react-query";
import {
	FileQuestion,
	Flame,
	Loader2,
	RefreshCw,
	Send,
	Tag,
	X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	OrdinalActionDialog,
	type OrdinalActionKind,
} from "@/components/wallet/ordinal-action-dialog";
import { stackContentUrl } from "@/lib/stack";
import { isOrdinalListed, ordinalAssetId } from "@/lib/wallet/ordinal-actions";
import {
	classifyContent,
	getContentType,
	getDisplayOutpoint,
	getName,
	getOriginOutpoint,
} from "@/lib/wallet/wallet-output-utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function OrdinalsGrid() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		ordinals,
		isInitialized,
		isInitializing,
		identityKey,
		refreshBalance,
	} = useWalletToolbox();
	const [selectedOutpoints, setSelectedOutpoints] = useState<Set<string>>(
		new Set(),
	);
	const [dialogKind, setDialogKind] = useState<OrdinalActionKind | null>(null);
	const identityScopeRef = useRef(identityKey);

	useEffect(() => {
		if (identityScopeRef.current === identityKey) return;
		identityScopeRef.current = identityKey;
		setSelectedOutpoints(new Set());
		setDialogKind(null);
	}, [identityKey]);

	const selectedOrdinals = useMemo(
		() => ordinals.filter((ordinal) => selectedOutpoints.has(ordinal.outpoint)),
		[ordinals, selectedOutpoints],
	);
	const selectionIsCurrent =
		selectedOrdinals.length === selectedOutpoints.size &&
		selectedOrdinals.every((ordinal) => ordinalAssetId(ordinal));
	const selectedListed = selectedOrdinals.filter(isOrdinalListed);
	const selectedUnlisted = selectedOrdinals.filter(
		(ordinal) => !isOrdinalListed(ordinal),
	);
	const onlyUnlisted =
		selectionIsCurrent &&
		selectedOrdinals.length > 0 &&
		selectedUnlisted.length === selectedOrdinals.length;
	const oneListed =
		selectionIsCurrent &&
		selectedOrdinals.length === 1 &&
		selectedListed.length === 1;
	const oneUnlisted = onlyUnlisted && selectedOrdinals.length === 1;

	const toggleSelection = useCallback((outpoint: string) => {
		setSelectedOutpoints((previous) => {
			const next = new Set(previous);
			if (next.has(outpoint)) next.delete(outpoint);
			else next.add(outpoint);
			return next;
		});
	}, []);

	const refresh = useCallback(async () => {
		refreshBalance();
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
			queryClient.invalidateQueries({ queryKey: ["market-flow"] }),
		]);
		router.refresh();
	}, [queryClient, refreshBalance, router]);

	const actionSucceeded = useCallback(async () => {
		setSelectedOutpoints(new Set());
		await refresh();
	}, [refresh]);

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading wallet…</span>
			</div>
		);
	}

	if (!isInitialized) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				Please unlock or connect a wallet to manage your ordinals.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-lg font-medium">
						{ordinals.length} Ordinal{ordinals.length === 1 ? "" : "s"}
					</h3>
					<p className="text-sm text-muted-foreground">
						{selectedOutpoints.size === 0
							? "Select one or more items to manage them."
							: `${selectedOutpoints.size} selected`}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" onClick={() => void refresh()}>
						<RefreshCw className="mr-2 size-4" />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!onlyUnlisted}
						onClick={() => setDialogKind("send")}
					>
						<Send className="mr-2 size-4" />
						Send
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!oneUnlisted}
						onClick={() => setDialogKind("sell")}
					>
						<Tag className="mr-2 size-4" />
						List
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!oneListed}
						onClick={() => setDialogKind("cancel")}
					>
						<X className="mr-2 size-4" />
						Cancel listing
					</Button>
					<Button
						variant="destructive"
						size="sm"
						disabled={!onlyUnlisted}
						onClick={() => setDialogKind("burn")}
					>
						<Flame className="mr-2 size-4" />
						Burn
					</Button>
				</div>
			</div>

			{selectedOutpoints.size > 0 && !selectionIsCurrent && (
				<div
					className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
					role="alert"
				>
					The wallet changed after this selection was made. Refresh and select
					the items again; no action has been submitted.
				</div>
			)}

			{selectedListed.length > 0 && selectedUnlisted.length > 0 && (
				<p className="text-sm text-muted-foreground">
					Listed and unlisted ordinals cannot be submitted together. Cancel a
					listing before sending or burning it.
				</p>
			)}

			{ordinals.length === 0 ? (
				<div className="py-16 text-center text-muted-foreground">
					No ordinals found in the active wallet.
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
					{ordinals.map((ordinal: WalletOutput) => {
						const outpoint = getDisplayOutpoint(ordinal);
						const originOutpoint = getOriginOutpoint(ordinal);
						const contentType = getContentType(ordinal);
						const contentClass = classifyContent(ordinal);
						const selected = selectedOutpoints.has(ordinal.outpoint);
						const actionable = !!ordinalAssetId(ordinal);
						return (
							<div
								key={ordinal.outpoint}
								className={`group relative aspect-square overflow-hidden rounded-lg border bg-muted/50 transition-all ${selected ? "border-primary ring-2 ring-primary/40" : "border-border/50 hover:border-primary/50"}`}
							>
								<a
									href={stackContentUrl(originOutpoint)}
									target="_blank"
									rel="noopener noreferrer"
									className="block size-full"
								>
									{contentClass === "image" ? (
										<Image
											src={stackContentUrl(originOutpoint)}
											alt={
												getName(ordinal) ?? `Ordinal ${outpoint.slice(0, 8)}`
											}
											fill
											className="object-cover transition-transform group-hover:scale-105"
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
											unoptimized
										/>
									) : (
										<div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
											<FileQuestion className="size-10" />
											<span className="max-w-full truncate text-xs">
												{contentType || "Unknown content type"}
											</span>
										</div>
									)}
									<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
									<div className="absolute inset-x-0 bottom-0 p-2 text-xs text-white">
										<div className="truncate font-medium">
											{getName(ordinal) ?? "Ordinal"}
										</div>
										<div className="truncate font-mono text-white/70">
											{outpoint}
										</div>
									</div>
								</a>
								<label className="absolute left-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-md bg-background/90 shadow-sm">
									<input
										type="checkbox"
										className="size-4 accent-primary"
										checked={selected}
										disabled={!actionable}
										onChange={() => toggleSelection(ordinal.outpoint)}
									/>
									<span className="sr-only">
										Select {getName(ordinal) ?? outpoint}
									</span>
								</label>
								{isOrdinalListed(ordinal) && (
									<span className="absolute right-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
										Listed
									</span>
								)}
								{!actionable && (
									<span className="absolute right-2 top-2 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
										Refresh required
									</span>
								)}
							</div>
						);
					})}
				</div>
			)}

			{dialogKind && (
				<OrdinalActionDialog
					kind={dialogKind}
					ordinals={selectedOrdinals}
					open
					onOpenChange={(open) => {
						if (!open) setDialogKind(null);
					}}
					onSuccess={actionSucceeded}
				/>
			)}
		</div>
	);
}
