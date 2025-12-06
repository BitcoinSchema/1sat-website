import { Suspense } from "react";
import type { AssetType } from "@/constants";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
} from "@/components/ui/table";
import TokenListingSkeleton from "../skeletons/listing/Token";
import List from "./list";

interface TokenListingsProps {
	type: AssetType.BSV20 | AssetType.BSV21;
}

const TokenListings: React.FC<TokenListingsProps> = async ({ type }) => {
	return (
		<Table className="font-mono">
			<TableHeader>
				<TableRow>
					<TableHead className="min-w-16">Ticker</TableHead>
					<TableHead className="">Amount</TableHead>
					<TableHead className="text-right w-full">Sats / Token</TableHead>
					<TableHead className="text-right min-w-48">Total Price</TableHead>
				</TableRow>
			</TableHeader>
			<Suspense fallback={<TokenListingSkeleton type={type} />}>
				<List type={type} />
			</Suspense>
		</Table>
	);
};

export default TokenListings;
