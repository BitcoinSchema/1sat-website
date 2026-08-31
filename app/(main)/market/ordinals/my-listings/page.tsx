import Link from "next/link";
import { MyOrdinalListings } from "@/components/market/my-ordinal-listings";
import { Button } from "@/components/ui/button";

export const metadata = {
	title: "My Ordinal Listings - 1Sat",
	description: "Reconcile and manage the active wallet's ordinal listings.",
};

export default function MyListingsPage() {
	return (
		<div className="mx-auto w-full max-w-5xl p-4">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">My Listings</h1>
					<p className="text-sm text-muted-foreground">
						Wallet-owned OrdLock outputs reconciled with the active market
						index.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/market/ordinals">Browse market</Link>
				</Button>
			</div>
			<MyOrdinalListings />
		</div>
	);
}
