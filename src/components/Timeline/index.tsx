import Link from "next/link";
import { TbTag } from "react-icons/tb";
import { toBitcoin } from "satoshi-token";
import { default as JDenticon } from "@/components/JDenticon";
import type { OrdUtxo } from "@/types/ordinals";

interface Props {
	history: OrdUtxo[];
	listing: OrdUtxo;
	spends: OrdUtxo[];
}

const Timeline = ({ history, listing, spends }: Props) => {
	const events = [...history].reverse();

	if (!events.length) {
		return (
			<div className="mt-4 text-base text-muted-foreground">No history</div>
		);
	}

	return (
		<div className="relative pl-8">
			<div className="absolute left-3 top-1 bottom-1 w-px bg-border/60" />
			<ul className="space-y-4">
				{events.map((h) => {
					let text = <>Unknown</>;

					if (h.data?.list?.price) {
						text = (
							<Link
								href={`/outpoint/${h.outpoint}`}
								className="flex items-center gap-2 text-foreground transition hover:text-primary"
							>
								<JDenticon hashOrValue={listing.owner!} className="h-4 w-4" />
								<TbTag />
								{toBitcoin(h.data?.list?.price)} BSV
							</Link>
						);
					} else if (h.data?.insc?.file && !h.spend?.length) {
						text = (
							<>
								Minted by{" "}
								<Link
									href={`/signer/${listing.owner}`}
									className="inline-flex items-center gap-2 text-foreground transition hover:text-primary"
								>
									<JDenticon hashOrValue={listing.owner} className="h-4 w-4" />
								</Link>
							</>
						);
					} else if (h.spend?.length) {
						const spentListing = spends.find((s) => s.txid === h.spend);
						text = (
							<Link
								href={`https://whatsonchain.com/tx/${h.spend}`}
								target="_blank"
								className="text-foreground underline-offset-4 transition hover:text-primary"
							>
								{spentListing?.sale
									? "Bought"
									: spentListing?.data?.list
										? "cancelled"
										: "transferred"}
							</Link>
						);
					} else {
						text = (
							<Link
								href={`https://whatsonchain.com/tx/${h.txid}`}
								target="_blank"
								className="text-foreground underline-offset-4 transition hover:text-primary"
							>
								latest
							</Link>
						);
					}

					const linkUrl = `/outpoint/${h.outpoint}`;
					return (
						<li key={`${h.txid}-${h.vout}-${h.height}`} className="relative">
							<span
								className={`absolute left-3 top-5 h-3 w-3 -translate-x-1/2 rounded-full border border-border ${
									listing.outpoint === h.outpoint
										? "bg-primary text-primary-foreground ring-2 ring-ring/40"
										: "bg-card text-muted-foreground"
								}`}
							/>
							<div className="ml-6 rounded-lg border border-border bg-card/80 px-4 py-3 shadow-sm transition hover:border-primary/50">
								<div className="flex items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
									<Link
										href={linkUrl}
										className="inline-flex items-center gap-2 transition hover:text-foreground"
									>
										{h.height || "Unconfirmed"}
									</Link>
									<Link
										href={`https://whatsonchain.com/tx/${h.txid}`}
										target="_blank"
										className="text-xs transition hover:text-primary"
									>
										View tx
									</Link>
								</div>
								<div className="mt-2 text-sm text-foreground">{text}</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default Timeline;
