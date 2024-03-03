"use client";

import Filter from "@/components/Wallet/filter";
import { AssetType } from "@/constants";
import Link from "next/link";
import { FaPlus } from "react-icons/fa";

const MarketTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
	return (
		<div className="flex w-full items-center justify-between">
			<div role="tablist" className="tabs tabs-lg tabs-lifted ml-4 gap-2 w-64">
				<Link
					href={`/market/${AssetType.Ordinals}`}
					role="tab"
					className={`tab ${
						selectedTab === AssetType.Ordinals ? "tab-active" : ""
					}`}
					aria-label="Ordinals"
				>
					Ordinals
				</Link>

				<Link
					href={`/market/${AssetType.BSV20}`}
					role="tab"
					className={`tab ${
						selectedTab === AssetType.BSV20 ? "tab-active" : ""
					}`}
					aria-label="BSV20"
				>
					BSV20
				</Link>

				<Link
					href={`/market/${AssetType.BSV21}`}
					role="tab"
					className={`tab ${
						selectedTab === AssetType.BSV21 ? "tab-active" : ""
					}`}
					aria-label="BSV21"
				>
					BSV21
				</Link>
			</div>
			<div className="flex-none">
				{selectedTab === AssetType.Ordinals && <Filter />}
				{selectedTab === AssetType.Ordinals && (
					<Link
						className="btn btn-sm btn-square btn-ghost"
						href={`/market/${selectedTab}/new`}
					>
						<FaPlus />
					</Link>
				)}
			</div>
		</div>
	);
};

export default MarketTabs;
