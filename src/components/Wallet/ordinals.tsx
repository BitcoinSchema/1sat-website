"use client";

import { AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { useSignals } from "@preact/signals-react/runtime";
import { FaSpinner } from "react-icons/fa";
import OrdinalListings, { OrdViewMode } from "../OrdinalListings";
import WalletTabs from "./tabs";

const WalletOrdinals = ({
	address: addressProp,
	onClick,
}: {
	address?: string;
	onClick?: (outpoint: string) => Promise<void>;
}) => {
	useSignals();
	if (!ordAddress.value) {
		return (
			<div className="mx-auto animate-spin w-fit">
				<FaSpinner />
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
				<div className="flex flex-col items-center justify-center w-full h-full max-w-5xl">
					<WalletTabs
						type={AssetType.Ordinals}
						address={addressProp}
					/>
					<div className="w-full md:w-[64rem] min-h-[80vh] tab-content bg-base-100 border-base-200 rounded-box p-2 md:p-6 flex flex-col md:flex-row">
						<OrdinalListings
							address={addressProp || ordAddress.value}
							mode={OrdViewMode.Grid}
							onClick={onClick}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WalletOrdinals;
