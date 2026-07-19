import Link from "next/link";
import { notFound } from "next/navigation";
import { toBitcoin } from "satoshi-token";
import { STACK_URL, toUrlOutpoint } from "@/lib/stack";
import { isValidBase58Address } from "@/lib/validation";

// ISR: cache rendered pages at the CDN, revalidate in the background
export const revalidate = 60;

export async function generateStaticParams() {
	return [];
}

interface OwnedTxo {
	outpoint: string;
	score: number;
	spend?: string;
	satoshis?: number;
}

const getOwnerData = async (address: string) => {
	const [balanceRes, txosRes] = await Promise.all([
		fetch(`${STACK_URL}/1sat/owner/${address}/balance`, {
			next: { revalidate: 60 },
		}).catch(() => null),
		fetch(
			`${STACK_URL}/1sat/txo/search?key=${encodeURIComponent(`ev:own:${address}`)}&limit=60&rev=true`,
			{ next: { revalidate: 60 } },
		).catch(() => null),
	]);

	const balance =
		balanceRes?.ok === true
			? ((await balanceRes.json()) as { balance: number; count: number })
			: null;
	const txos =
		txosRes?.ok === true
			? (((await txosRes.json()) as OwnedTxo[] | null) ?? [])
			: [];

	return { balance, txos };
};

const Signer = async ({
	params,
}: {
	params: Promise<{ address: string }>;
}) => {
	const { address } = await params;
	// Reject junk like /signer/null before hitting the upstream API
	if (!isValidBase58Address(address)) {
		notFound();
	}

	const { balance, txos } = await getOwnerData(address);

	return (
		<div className="mx-auto w-full max-w-4xl p-4">
			<h1 className="text-xl font-bold break-all font-mono">{address}</h1>
			{balance && (
				<p className="mt-1 text-sm text-muted-foreground">
					Balance:{" "}
					<span className="text-primary font-mono">
						{toBitcoin(balance.balance)} BSV
					</span>{" "}
					across {balance.count} output{balance.count === 1 ? "" : "s"}
				</p>
			)}

			<h2 className="mt-8 mb-3 text-lg font-bold">Activity</h2>
			{txos.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No indexed activity for this address.
				</p>
			) : (
				<ul className="flex flex-col divide-y divide-border/60 text-sm font-mono">
					{txos.map((t) => (
						<li
							key={t.outpoint}
							className="py-2 flex items-center gap-3 flex-wrap"
						>
							<Link
								href={`/outpoint/${toUrlOutpoint(t.outpoint)}`}
								className="break-all hover:text-primary"
							>
								{t.outpoint}
							</Link>
							<span className="ml-auto shrink-0 text-xs text-muted-foreground">
								{t.spend ? "spent" : "unspent"}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default Signer;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ address: string }>;
}) {
	const { address } = await params;
	return {
		title: `${isValidBase58Address(address) ? address : "Address"} - 1Sat`,
		description: `Activity and holdings for ${address} on 1Sat.`,
	};
}
