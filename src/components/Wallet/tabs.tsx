import type { AssetType } from "@/constants";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";
import Filter from "./filter";

export enum WalletTab {
	Ordinals = "ordinals",
	BSV20 = "bsv20",
	BSV21 = "bsv21",
	History = "History",
}

const WalletTabs = ({
	type,
	address,
}: {
	type: WalletTab | AssetType;
	address?: string;
}) => {
	return (
		<div className="navbar min-h-0 py-0 px-4">
			<div className="flex-1">
				<div
					role="tablist"
					className={"tabs md:tabs-lg max-w-[300px] tabs-lifted"}
				>
					<Link
						role="tab"
						href={
							address
								? `/activity/${address}/ordinals`
								: "/wallet/ordinals"
						}
						className={`tab border-base-200 ${
							type === WalletTab.Ordinals ? "tab-active" : ""
						}`}
					>
						Ordinals
					</Link>
					<Link
						role="tab"
						href={
							address
								? `/activity/${address}/bsv20`
								: "/wallet/bsv20"
						}
						className={`tab border-base-200 ${
							type === WalletTab.BSV20 ? "tab-active" : ""
						}`}
					>
						BSV20
					</Link>
					<Link
						href={
							address
								? `/activity/${address}/bsv21`
								: "/wallet/bsv21"
						}
						role="tab"
						className={`tab border-base-200 ${
							type === WalletTab.BSV21 ? "tab-active" : ""
						}`}
					>
						BSV21
					</Link>

					{/* <Link
						href={
							address ? `/activity/${address}` : "/wallet/history"
						}
						role="tab"
						className={`tab border-base-200 ${
							type === WalletTab.History ? "tab-active" : ""
						}`}
					>
						History
					</Link> */}
				</div>
			</div>
			<div className="flex-none">
				{type === WalletTab.Ordinals && <Filter />}
				<Link
					className="btn md:btn-xs md:relative absolute bottom-0 right-0 md:mr-0 mr-4 mb-4 md:mb-0 z-10 md:z-0 md:border-0 border border-yellow-200/25"
					href={`/inscribe?tab=${
						type === WalletTab.Ordinals ? "image" : type
					}`}
				>
					<div className="flex items-center">
						<FaPlus />
						<div className="ml-2">Mint</div>
					</div>
				</Link>
			</div>
		</div>
	);
};

export default WalletTabs;
