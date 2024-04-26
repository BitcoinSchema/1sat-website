import type { AssetType } from "@/constants";
import { Suspense } from "react";
import TokenListingSkeleton from "../skeletons/listing/Token";
import Bsv20List from "./bsv20List";

interface WalletBsv20Props {
	type: AssetType.BSV20 | AssetType.BSV21;
	address?: string;
}

export type NumResults = {
	num: any;
	autofill: any;
};

const WalletBsv20 = async ({ type, address }: WalletBsv20Props) => {
	return (
		<div className="flex flex-col items-center justify-center w-full h-full">
			<div className="w-full">
				<Suspense
					fallback={
						<table width={"100%"}>
							<TokenListingSkeleton />
						</table>
					}
				>
					<Bsv20List type={type} address={address} />
				</Suspense>
			</div>
		</div>
	);
};

export default WalletBsv20;
