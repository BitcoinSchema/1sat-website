import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	isBsv21TokenId,
	normalizeBsv21TokenId,
} from "@/lib/wallet/bsv21-actions";

interface MarketBsv21PageProps {
	searchParams: Promise<{ tokenId?: string }>;
}

export default async function MarketBSV21Page({
	searchParams,
}: MarketBsv21PageProps) {
	const { tokenId } = await searchParams;
	if (tokenId && isBsv21TokenId(tokenId)) {
		redirect(`/market/bsv21/${normalizeBsv21TokenId(tokenId)}`);
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 p-4">
			<div>
				<h1 className="text-2xl font-bold">Market: BSV21</h1>
				<p className="mt-2 text-muted-foreground">
					Open a known token to review its typed stack details and
					overlay-validated OrdLock listings.
				</p>
			</div>
			<form className="space-y-3 rounded-md border p-4" method="get">
				<Label htmlFor="tokenId">Token ID</Label>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						id="tokenId"
						name="tokenId"
						pattern="[0-9a-fA-F]{64}_[0-9]+"
						placeholder="64-character txid_0"
						required
						title="Enter a 64-character transaction ID, an underscore, and an output index"
					/>
					<Button type="submit">Open token</Button>
				</div>
				{tokenId ? (
					<p className="text-sm text-destructive" role="alert">
						Enter a token deploy outpoint in txid_vout format.
					</p>
				) : null}
			</form>
			<div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
				<p className="font-medium">
					Registry browsing is temporarily unavailable
				</p>
				<p className="mt-1 text-muted-foreground">
					The installed typed BSV21 client has detail and validation queries but
					no token-registry method. This site does not fall back to a
					handwritten endpoint. Tokens already held by the active wallet remain
					available in{" "}
					<Link className="underline" href="/wallet/bsv21">
						Wallet → BSV21
					</Link>
					.
				</p>
			</div>
		</div>
	);
}

export const metadata = {
	title: "BSV21 Market - 1Sat",
	description: "Review BSV21 token details and validated listings on 1Sat.",
};
