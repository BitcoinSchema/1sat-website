"use client";

import type { IndexedOutput } from "@1sat/types";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MigrationOrdinalCard } from "@/components/wallet/migration-ordinal-card";
import type {
	EnrichedOrdinal,
	TokenBalance,
} from "@/lib/hooks/use-legacy-assets";
import type { SweepStepState } from "@/lib/sweep-migration";

const ORDINALS_PER_PAGE = 20;

export function formatSats(sats: number): string {
	return sats.toLocaleString();
}

export function formatTokenAmount(
	rawAmount: string | bigint,
	decimals: number,
): string {
	const raw = rawAmount.toString();
	if (decimals === 0) return raw;
	const padded = raw.padStart(decimals + 1, "0");
	const intPart = padded.slice(0, -decimals) || "0";
	const decPart = padded.slice(-decimals).replace(/0+$/, "");
	return decPart ? `${intPart}.${decPart}` : intPart;
}

export function FundingSection({
	funding,
	totalBsv,
}: {
	funding: IndexedOutput[];
	totalBsv: number;
}) {
	if (funding.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-2/5 to-transparent border border-chart-2/20 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-chart-2" />
				<span className="text-sm font-semibold text-chart-2">BSV Funding</span>
			</div>

			<div className="flex items-baseline justify-between">
				<div>
					<div className="text-2xl font-bold text-chart-2">
						{formatSats(totalBsv)} sats
					</div>
					<div className="text-xs text-muted-foreground">
						{(totalBsv / 100_000_000).toFixed(8)} BSV
					</div>
				</div>
				<Badge variant="secondary" className="text-xs">
					{funding.length} UTXO{funding.length !== 1 ? "s" : ""}
				</Badge>
			</div>
		</div>
	);
}

export function OrdinalsSection({
	ordinals,
	selectedOrdinals,
	onToggle,
	onSelectAll,
	onDeselectAll,
	ordinalPage,
	onPageChange,
}: {
	ordinals: EnrichedOrdinal[];
	selectedOrdinals: Set<string>;
	onToggle: (outpoint: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	ordinalPage: number;
	onPageChange: (page: number) => void;
}) {
	if (ordinals.length === 0) return null;

	const totalPages = Math.ceil(ordinals.length / ORDINALS_PER_PAGE);
	const start = ordinalPage * ORDINALS_PER_PAGE;
	const pageItems = ordinals.slice(start, start + ORDINALS_PER_PAGE);
	const selectedCount = selectedOrdinals.size;

	return (
		<div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 p-5">
			<div className="flex items-start justify-between mb-4">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<span className="h-2 w-2 bg-primary" />
						<span className="text-sm font-semibold text-primary">Ordinals</span>
					</div>
					<div className="text-xs text-muted-foreground">
						{ordinals.length} inscription
						{ordinals.length !== 1 ? "s" : ""} found
						{selectedCount > 0 && (
							<span className="text-primary ml-1">
								({selectedCount} selected)
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-[11px]"
						onClick={onSelectAll}
					>
						Select All
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-[11px]"
						onClick={onDeselectAll}
						disabled={selectedCount === 0}
					>
						Deselect
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 mb-4">
				{pageItems.map((ordinal) => (
					<MigrationOrdinalCard
						key={ordinal.outpoint}
						ordinal={ordinal}
						isSelected={selectedOrdinals.has(ordinal.outpoint)}
						onToggle={() => onToggle(ordinal.outpoint)}
					/>
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-xs"
						onClick={() => onPageChange(ordinalPage - 1)}
						disabled={ordinalPage === 0}
					>
						Prev
					</Button>
					<span className="text-xs text-muted-foreground">
						Page {ordinalPage + 1} of {totalPages}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-xs"
						onClick={() => onPageChange(ordinalPage + 1)}
						disabled={ordinalPage >= totalPages - 1}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

export function OpnsSection({ opnsNames }: { opnsNames: EnrichedOrdinal[] }) {
	if (opnsNames.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-3/5 to-transparent border border-chart-3/20 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-chart-3" />
				<span className="text-sm font-semibold text-chart-3">OpNS Names</span>
				<Badge variant="secondary" className="text-xs ml-auto">
					{opnsNames.length} domain{opnsNames.length !== 1 ? "s" : ""}
				</Badge>
			</div>
			<div className="flex flex-wrap gap-2">
				{opnsNames.map((item) => (
					<Badge key={item.outpoint} variant="outline" className="text-xs">
						{item.name || item.outpoint.slice(0, 12)}
					</Badge>
				))}
			</div>
			<p className="text-xs text-muted-foreground mt-3">
				OpNS domains are swept along with your ordinals.
			</p>
		</div>
	);
}

export function TokensSection({ tokens }: { tokens: TokenBalance[] }) {
	if (tokens.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-4/5 to-transparent border border-chart-4/20 p-5">
			<div className="flex items-center gap-2 mb-4">
				<span className="h-2 w-2 bg-chart-4" />
				<span className="text-sm font-semibold text-chart-4">
					BSV-21 Tokens
				</span>
			</div>

			<div className="space-y-3">
				{tokens.map((tb) => (
					<div
						key={tb.tokenId}
						className="flex items-center justify-between border border-chart-4/10 bg-black/10 p-3"
					>
						<div className="flex items-center gap-3">
							{tb.icon ? (
								<img
									src={tb.icon}
									alt={tb.symbol || "Token"}
									className="h-8 w-8 object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							) : (
								<div className="flex h-8 w-8 items-center justify-center bg-chart-4/20 text-chart-4 text-sm">
									T
								</div>
							)}
							<div>
								<div className="font-medium text-foreground">
									{tb.symbol || tb.tokenId.slice(0, 8)}
								</div>
								<div className="text-xs text-muted-foreground">
									{formatTokenAmount(tb.totalAmount, tb.decimals)}{" "}
									{tb.symbol || ""}
									{!tb.isActive && (
										<span className="text-destructive ml-1">
											(not validated — will be skipped)
										</span>
									)}
								</div>
							</div>
						</div>
						<Badge variant="secondary" className="text-xs">
							{tb.outputs.length} output
							{tb.outputs.length !== 1 ? "s" : ""}
						</Badge>
					</div>
				))}
			</div>
		</div>
	);
}

export function Bsv20Section({ tokens }: { tokens: IndexedOutput[] }) {
	if (tokens.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-muted/20 to-transparent border border-muted/30 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-muted-foreground" />
				<span className="text-sm font-semibold text-muted-foreground">
					BSV-20 Tokens
				</span>
				<Badge variant="secondary" className="text-xs ml-auto">
					{tokens.length} output{tokens.length !== 1 ? "s" : ""}
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground">
				BSV-20 is deprecated and cannot be swept. These outputs will remain at
				your legacy address.
			</p>
		</div>
	);
}

export function MneeSection({ mneeBalance }: { mneeBalance: number }) {
	if (mneeBalance <= 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-5/5 to-transparent border border-chart-5/20 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-chart-5" />
				<span className="text-sm font-semibold text-chart-5">MNEE</span>
			</div>
			<div className="flex items-baseline justify-between">
				<div className="text-2xl font-bold text-chart-5">
					{mneeBalance.toLocaleString(undefined, {
						maximumFractionDigits: 5,
					})}{" "}
					MNEE
				</div>
				<Badge variant="secondary" className="text-xs">
					via cosigner
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground mt-2">
				Swept through the MNEE cosigner API (a small MNEE fee applies).
			</p>
		</div>
	);
}

export function LockedSection({ locked }: { locked: IndexedOutput[] }) {
	if (locked.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-muted/20 to-transparent border border-muted/30 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-muted-foreground" />
				<span className="text-sm font-semibold text-muted-foreground">
					Time-Locked Outputs
				</span>
				<Badge variant="secondary" className="text-xs ml-auto">
					{locked.length} output{locked.length !== 1 ? "s" : ""}
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground">
				These coins are time-locked on chain and cannot be swept until they
				unlock. Sweep them later once the lock height passes.
			</p>
		</div>
	);
}

function StepIcon({ status }: { status: SweepStepState["status"] }) {
	switch (status) {
		case "done":
			return <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-2" />;
		case "error":
			return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
		case "active":
			return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />;
		default:
			return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />;
	}
}

/** Live per-stage sweep progress: one row per asset category / token. */
export function SweepStepsList({ steps }: { steps: SweepStepState[] }) {
	if (steps.length === 0) return null;

	return (
		<div className="space-y-2 text-left">
			{steps.map((step) => (
				<div
					key={step.id}
					className="flex items-start gap-2.5 border border-border/40 bg-muted/10 px-3 py-2"
				>
					<div className="mt-0.5">
						<StepIcon status={step.status} />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-baseline justify-between gap-2">
							<span
								className={
									step.status === "pending"
										? "text-sm text-muted-foreground"
										: "text-sm font-medium"
								}
							>
								{step.label}
							</span>
							{step.txids.length > 0 && (
								<span className="text-[10px] text-muted-foreground shrink-0">
									{step.txids.length} tx{step.txids.length !== 1 ? "s" : ""}
								</span>
							)}
						</div>
						{step.detail && (
							<p className="truncate text-xs text-muted-foreground animate-pulse">
								{step.detail}
							</p>
						)}
						{step.error && (
							<p className="text-xs text-destructive/90">{step.error}</p>
						)}
						{step.txids.map((txid) => (
							<code
								key={txid}
								className="block truncate font-mono text-[10px] text-muted-foreground"
							>
								{txid}
							</code>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

export function RunSection({ run }: { run: IndexedOutput[] }) {
	if (run.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-destructive/5 to-transparent border border-destructive/20 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-destructive" />
				<span className="text-sm font-semibold text-destructive">
					RUN Protocol Outputs
				</span>
				<Badge variant="secondary" className="text-xs ml-auto">
					{run.length} output{run.length !== 1 ? "s" : ""}
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground">
				These outputs belong to RUN protocol transactions and are quarantined
				from the BSV sweep so token state is not destroyed as fees.
			</p>
		</div>
	);
}
