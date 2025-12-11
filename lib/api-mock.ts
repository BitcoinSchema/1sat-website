// Mock API for activity feed

export interface ActivityItem {
	id: string;
	txid: string;
	type: "ordinal-transfer" | "bsv20-transfer" | "mint" | "list";
	timestamp: number;
	data: {
		amount?: number;
		ticker?: string;
		price?: number;
	};
}

interface ActivityPage {
	data: ActivityItem[];
	nextCursor: number | null;
}

function generateMockActivity(page: number): ActivityItem[] {
	const types: ActivityItem["type"][] = [
		"ordinal-transfer",
		"bsv20-transfer",
		"mint",
		"list",
	];
	const tickers = ["ORDI", "PEPE", "MEME", "1SAT"];

	return Array.from({ length: 10 }, (_, i) => {
		const type = types[Math.floor(Math.random() * types.length)];
		return {
			id: `${page}-${i}`,
			txid: `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
			type,
			timestamp: Date.now() - (page * 10 + i) * 60000 * Math.random() * 10,
			data: {
				amount:
					type === "bsv20-transfer"
						? Math.floor(Math.random() * 10000)
						: undefined,
				ticker:
					type === "bsv20-transfer"
						? tickers[Math.floor(Math.random() * tickers.length)]
						: undefined,
				price: type === "list" ? Math.floor(Math.random() * 100000) : undefined,
			},
		};
	});
}

export async function fetchActivity({
	pageParam = 0,
}: {
	pageParam?: number;
}): Promise<ActivityPage> {
	await new Promise((resolve) => setTimeout(resolve, 500));
	const data = generateMockActivity(pageParam);
	const nextCursor = pageParam < 5 ? pageParam + 1 : null;
	return { data, nextCursor };
}
