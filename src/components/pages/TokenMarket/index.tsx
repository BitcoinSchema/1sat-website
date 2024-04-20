import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import { AssetType } from "@/constants";
import { Suspense } from "react";
import List from "./list";

interface TokenMarketProps {
	type: AssetType.BSV20 | AssetType.BSV21;
	id?: string;
}

const TokenMarket: React.FC<TokenMarketProps> = async ({ type, id }) => {
	return (
		<div className="w-full overflow-x-auto">
			<table className="table font-mono">
				<thead>
					<tr>
						<th className="min-w-16">Ticker</th>
						<th className="w-1/2">Recent Price</th>
						<th className="">Pct Change</th>
						<th className="text-right flex-1">Market Cap</th>
						{type === AssetType.BSV21 && (
							<th className="text-center w-12">Contract</th>
						)}
						<th
							className={`${
								type === AssetType.BSV21 ? "w-48" : "w-96"
							} text-right`}
						>
							Holders
						</th>
					</tr>
				</thead>
				<Suspense fallback={<TokenListingSkeleton />}>
					<List type={type} id={id} />
				</Suspense>
			</table>
		</div>
	);
};

export default TokenMarket;
