import { useEffect, useState } from "react";

export interface ActivityItem {
	id: string;
	txid: string;
	type: "ordinal-transfer" | "bsv20-transfer" | "mint" | "list";
	timestamp: number;
	data: {
		ticker?: string;
		amount?: string;
		inscriptionId?: string;
		price?: number;
	};
}

const MOCK_ACTIVITIES: ActivityItem[] = Array.from({ length: 50 }).map(
	(_, i) => ({
		id: `activity-${i}`,
		txid: `txid-${Math.random().toString(36).substr(2, 9)}`,
		type: ["ordinal-transfer", "bsv20-transfer", "mint", "list"][
			Math.floor(Math.random() * 4)
		] as any,
		timestamp: Date.now() - i * 1000 * 60 * 5, // Decreasing timestamps
		data: {
			ticker: Math.random() > 0.5 ? "PEPE" : "ORDI",
			amount: (Math.random() * 1000).toFixed(2),
			inscriptionId: `${Math.random().toString(36).substr(2, 10)}i0`,
			price: Math.floor(Math.random() * 10000),
		},
	}),
);

export async function fetchActivity({
	pageParam = 0,
}: {
	pageParam?: number;
}): Promise<{
	data: ActivityItem[];
	nextCursor: number | undefined;
}> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	const pageSize = 10;
	const start = pageParam * pageSize;
	const end = start + pageSize;
	const data = MOCK_ACTIVITIES.slice(start, end);

	return {
		data,
		nextCursor: end < MOCK_ACTIVITIES.length ? pageParam + 1 : undefined,
	};
}
