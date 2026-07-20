"use client";

import {
	type ScanProgress,
	type ScanResult,
	scanAddresses,
	type TokenBalance,
} from "@1sat/actions";
import { OneSatServices } from "@1sat/client";
import type { IndexedOutput } from "@1sat/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { STACK_URL, stackContentUrl } from "@/lib/stack";

export type { TokenBalance };

// IndexedOutput enriched with display metadata resolved from its events
export interface EnrichedOrdinal extends IndexedOutput {
	origin?: string;
	contentType?: string;
	name?: string;
	contentUrl: string;
}

export interface LegacyAssets {
	loading: boolean;
	error: string | null;
	funding: IndexedOutput[];
	ordinals: EnrichedOrdinal[];
	opnsNames: EnrichedOrdinal[];
	bsv21Tokens: TokenBalance[];
	bsv20Tokens: IndexedOutput[];
	locked: IndexedOutput[];
	run: IndexedOutput[];
	totalBsv: number;
	rescan: () => void;
}

const getEvent = (events: string[], prefix: string): string | undefined => {
	const e = events.find((ev) => ev.startsWith(prefix));
	return e ? e.slice(prefix.length) : undefined;
};

const enrichOrdinal = (out: IndexedOutput): EnrichedOrdinal => {
	const events = out.events ?? [];
	const origin = getEvent(events, "origin:");
	const types = events
		.filter((e) => e.startsWith("type:"))
		.map((e) => e.slice(5));
	const contentType = types.find((t) => t.includes("/")) ?? types[0];
	const name = getEvent(events, "name:");
	const contentUrl = stackContentUrl(origin ?? out.outpoint);
	return { ...out, origin, contentType, name, contentUrl };
};

const resolveIconUrl = (tokenId: string, icon?: string): string => {
	if (!icon) return "";
	let outpoint = icon;
	if (icon.startsWith("_")) {
		outpoint = `${tokenId.split("_")[0]}${icon}`;
	}
	return stackContentUrl(outpoint);
};

/**
 * Scan legacy addresses via the 1sat stack (@1sat/actions scanAddresses):
 * forced indexer re-sync, event-tag categorization (funding vs ordinals vs
 * OPNS vs BSV-21 vs locked vs RUN), and overlay-validated BSV-21 amounts —
 * the same scan the yours-wallet sweep tool uses.
 */
export function useLegacyAssets(
	legacyPayAddress: string | null,
	legacyOrdAddress: string | null,
	legacyIdentityAddress?: string | null,
	onScanProgress?: (p: ScanProgress) => void,
): LegacyAssets {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<ScanResult | null>(null);

	// Scanning needs services only (no wallet) — a standalone instance so the
	// banner works even when the BRC-100 wallet failed to initialize
	const servicesRef = useRef<OneSatServices | null>(null);
	if (!servicesRef.current) {
		servicesRef.current = new OneSatServices("main", STACK_URL);
	}

	const [scanTrigger, setScanTrigger] = useState(0);
	const rescan = useCallback(() => {
		setScanTrigger((prev) => prev + 1);
	}, []);

	const progressRef = useRef(onScanProgress);
	progressRef.current = onScanProgress;

	// biome-ignore lint/correctness/useExhaustiveDependencies: scanTrigger is an intentional rescan signal
	useEffect(() => {
		if (!legacyPayAddress && !legacyOrdAddress && !legacyIdentityAddress) {
			return;
		}

		let cancelled = false;

		async function scan() {
			setLoading(true);
			setError(null);
			try {
				const addresses = [
					...new Set(
						[legacyPayAddress, legacyOrdAddress, legacyIdentityAddress].filter(
							(a): a is string => !!a,
						),
					),
				];
				const services = servicesRef.current;
				if (!services) return;
				const scanResult = await scanAddresses(services, addresses, (p) =>
					progressRef.current?.(p),
				);
				if (cancelled) return;
				setResult(scanResult);
			} catch (err) {
				if (cancelled) return;
				setError(
					err instanceof Error
						? err.message
						: "Failed to scan legacy addresses",
				);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		scan();
		return () => {
			cancelled = true;
		};
	}, [legacyPayAddress, legacyOrdAddress, legacyIdentityAddress, scanTrigger]);

	return {
		loading,
		error,
		funding: result?.funding ?? [],
		ordinals: (result?.ordinals ?? []).map(enrichOrdinal),
		opnsNames: (result?.opnsNames ?? []).map(enrichOrdinal),
		bsv21Tokens: (result?.bsv21Tokens ?? []).map((t) => ({
			...t,
			icon: resolveIconUrl(t.tokenId, t.icon),
		})),
		bsv20Tokens: result?.bsv20Tokens ?? [],
		locked: result?.locked ?? [],
		run: result?.run ?? [],
		totalBsv: result?.totalFundingSats ?? 0,
		rescan,
	};
}
