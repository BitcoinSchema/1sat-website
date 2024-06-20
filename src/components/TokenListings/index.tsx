import type { AssetType } from "@/constants";
import { Suspense } from "react";
import TokenListingSkeleton from "../skeletons/listing/Token";
import List from "./list";

interface TokenListingsProps {
	type: AssetType.BSV20 | AssetType.BSV21;
}

const TokenListings: React.FC<TokenListingsProps> = async ({ type }) => {
	return (
		<div className="w-full">
			<table className="table font-mono">
				<thead>
					<tr>
						<th className="min-w-16">Ticker</th>
						<th className="">Amount</th>
						<th className="text-right w-full">Sats / Token</th>
						<th className="text-right min-w-48">Total Price</th>
					</tr>
				</thead>
				<Suspense fallback={<TokenListingSkeleton type={type} />}>
					<List type={type} />
				</Suspense>
			</table>
		</div>
	);
};

export default TokenListings;
