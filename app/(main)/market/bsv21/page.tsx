import ImageWithFallback from "@/components/image-with-fallback";
import { getBsv21Tokens } from "@/lib/market-data";
import { stackContentUrl } from "@/lib/stack";
import { isValidOutpoint } from "@/lib/validation";

// ISR: shared feed, revalidated in the background
export const revalidate = 60;

export default async function MarketBSV21Page() {
	const tokens = (await getBsv21Tokens()).filter((t) => t.symbol);

	return (
		<div className="p-4 mx-auto w-full max-w-5xl">
			<h1 className="text-2xl font-bold mb-6">Market: BSV21</h1>
			{tokens.length === 0 ? (
				<p className="text-muted-foreground">No tokens found.</p>
			) : (
				<div className="overflow-x-auto rounded-md border border-border">
					<table className="w-full text-sm font-mono">
						<thead>
							<tr className="border-b border-border text-left text-muted-foreground">
								<th className="p-3">Token</th>
								<th className="p-3">Id</th>
								<th className="p-3 text-right">Status</th>
							</tr>
						</thead>
						<tbody>
							{tokens.map((t) => (
								<tr
									key={t.token_id}
									className="border-b border-border/50 hover:bg-muted/40"
								>
									<td className="p-3">
										<div className="flex items-center gap-2">
											{t.icon && isValidOutpoint(t.icon) && (
												<ImageWithFallback
													src={stackContentUrl(t.icon)}
													alt={t.symbol || ""}
													width={24}
													height={24}
													className="w-6 h-6 rounded"
												/>
											)}
											<span className="font-bold">{t.symbol}</span>
										</div>
									</td>
									<td className="p-3 text-xs text-muted-foreground break-all">
										{t.token_id}
									</td>
									<td className="p-3 text-right">
										{t.is_active ? (
											<span className="text-primary">active</span>
										) : (
											<span className="text-muted-foreground">inactive</span>
										)}
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
	title: "BSV21 Market - 1Sat",
	description: "Browse BSV21 tokens on 1Sat.",
};
