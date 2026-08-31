import Link from "next/link";
import { notFound } from "next/navigation";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { classifyExplorerSearch, searchExplorer } from "@/lib/explorer-search";
import { fetchStackCapabilities, toUrlOutpoint } from "@/lib/stack";

export const revalidate = 30;

export default async function TransactionPage({
	params,
}: {
	params: Promise<{ txid: string }>;
}) {
	const { txid: rawTxid } = await params;
	const txid = rawTxid.toLowerCase();
	if (classifyExplorerSearch(txid) !== "transaction") notFound();

	let capabilities: Awaited<ReturnType<typeof fetchStackCapabilities>>;
	try {
		capabilities = await fetchStackCapabilities();
	} catch {
		return (
			<Page>
				<PageHeader>
					<PageTitle>Transaction</PageTitle>
				</PageHeader>
				<PageContent>
					<p className="text-destructive" role="alert">
						The stack capability manifest could not be loaded.
					</p>
				</PageContent>
			</Page>
		);
	}

	const result = await searchExplorer(txid, capabilities);
	const exact = result.exact;

	return (
		<Page>
			<PageHeader>
				<div>
					<PageTitle>Transaction</PageTitle>
					<p className="mt-1 break-all font-mono text-muted-foreground text-xs">
						{txid}
					</p>
				</div>
			</PageHeader>
			<PageContent>
				{exact.status === "ready" ? (
					<section className="space-y-3" aria-labelledby="transaction-outputs">
						<h2 className="font-semibold text-lg" id="transaction-outputs">
							Indexed outputs ({exact.data.outputs.length})
						</h2>
						<ul className="divide-y rounded-lg border">
							{exact.data.outputs.map((output) => (
								<li className="space-y-2 p-4" key={output.outpoint}>
									<Link
										className="break-all font-mono text-primary text-sm underline-offset-4 hover:underline"
										href={`/outpoint/${toUrlOutpoint(output.outpoint)}`}
									>
										{output.outpoint}
									</Link>
									<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
										{output.satoshis !== undefined && (
											<span>{output.satoshis} sats</span>
										)}
										{output.blockHeight !== undefined && (
											<span>Block {output.blockHeight}</span>
										)}
										<span>{output.spend ? "Spent" : "Unspent"}</span>
									</div>
									{output.events && output.events.length > 0 && (
										<p className="break-words font-mono text-muted-foreground text-xs">
											{output.events.join(" · ")}
										</p>
									)}
								</li>
							))}
						</ul>
					</section>
				) : exact.status === "unavailable" ? (
					<p className="text-muted-foreground" role="status">
						Transaction exploration is disabled because the stack did not
						advertise TXO capability.
					</p>
				) : exact.status === "error" ? (
					<p className="text-destructive" role="alert">
						Transaction outputs could not be loaded. Try again.
					</p>
				) : (
					<p className="text-muted-foreground">No indexed outputs found.</p>
				)}
			</PageContent>
		</Page>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ txid: string }>;
}) {
	const { txid } = await params;
	return {
		title: `${txid.slice(0, 12)}… - 1Sat Transaction`,
		description: "Inspect transaction outputs indexed by the 1Sat Stack.",
	};
}
