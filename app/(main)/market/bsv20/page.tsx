import { getBsv20Tickers } from "@/lib/market-data";

// ISR: shared feed, revalidated in the background
export const revalidate = 60;

export default async function MarketBSV20Page() {
	const tickers = await getBsv20Tickers();

	return (
		<div className="p-4 mx-auto w-full max-w-5xl">
			<h1 className="text-2xl font-bold mb-6">Market: BSV20</h1>
			{tickers.length === 0 ? (
				<p className="text-muted-foreground">No tokens found.</p>
			) : (
				<div className="overflow-x-auto rounded-md border border-border">
					<table className="w-full text-sm font-mono">
						<thead>
							<tr className="border-b border-border text-left text-muted-foreground">
								<th className="p-3">Ticker</th>
								<th className="p-3 text-right">Supply</th>
								<th className="p-3 text-right">Max</th>
								<th className="p-3 text-right">Minted</th>
							</tr>
						</thead>
						<tbody>
							{tickers.map((t) => (
								<tr
									key={t.txid}
									className="border-b border-border/50 hover:bg-muted/40"
								>
									<td className="p-3 font-bold">{t.tick}</td>
									<td className="p-3 text-right">{t.supply}</td>
									<td className="p-3 text-right">{t.max}</td>
									<td className="p-3 text-right">
										{t.pctMinted ? `${t.pctMinted}%` : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export const metadata = {
	title: "BSV20 Market - 1Sat",
	description: "Browse BSV20 tokens on 1Sat.",
};
