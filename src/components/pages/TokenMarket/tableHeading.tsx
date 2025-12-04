"use client";

import { AssetType, SortBy } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FaSort, FaSortUp, FaSortDown, FaHashtag } from "react-icons/fa";

const TableHeading = ({
	type,
  sortable,
}: { type: AssetType.BSV20 | AssetType.BSV21, sortable: boolean }) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const sort = searchParams.get("sort") as SortBy;
	const dir = searchParams.get("dir") as "asc" | "desc";

	const handleSort = useCallback((column: SortBy) => {
		const newDir = dir === "asc" ? "desc" : "asc";
		router.push(`/market/${type}/?sort=${column}&dir=${newDir}`);
	}, [router, type, dir]);

	return (
		<thead className="w-full border-b border-zinc-800 bg-zinc-900/50">
			<tr>
				<th className={`min-w-16 px-4 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 ${sortable ? "cursor-pointer" : ""} group`}>
					<div className="flex items-center">
						{type === AssetType.BSV20 && (
							// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
							<div className="mr-2 hover:text-green-400 transition" onClick={() => handleSort(SortBy.Number)}>
								<FaHashtag />
							</div>
						)}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
						<div
							className="flex items-center hover:text-green-400 transition"
							onClick={() => sortable ? handleSort(SortBy.Ticker) : null}
						>
							Ticker
							{sortable && <span
								className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Ticker ? "text-green-400" : "text-zinc-600"}`}
							>
								{sort === SortBy.Ticker ? (
									dir === "asc" ? (
										<FaSortUp />
									) : (
										<FaSortDown />
									)
								) : (
									<FaSort />
								)}
							</span>}
						</div>
					</div>
				</th>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<th
					className={`w-1/2 px-4 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 ${sortable ? "cursor-pointer" : ""} group hover:text-green-400 transition`}
					onClick={() => sortable ? handleSort(SortBy.Price) : null}
				>
					<div className="flex items-center">
						Recent Price
						{sortable && <span
							className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Price ? "text-green-400" : "text-zinc-600"}`}
						>
							{sort === SortBy.Price ? (
								dir === "asc" ? (
									<FaSortUp />
								) : (
									<FaSortDown />
								)
							) : (
								<FaSort />
							)}
						</span>}
					</div>
				</th>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<th
					className={`px-4 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 ${sortable ? "cursor-pointer" : ""} group hover:text-green-400 transition`}
					onClick={() => sortable ? handleSort(SortBy.PctChange) : null}
				>
					<div className="flex items-center">
						Pct Change
						{sortable && <span
							className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.PctChange ? "text-green-400" : "text-zinc-600"}`}
						>
							{sort === SortBy.PctChange ? (
								dir === "asc" ? (
									<FaSortUp />
								) : (
									<FaSortDown />
								)
							) : (
								<FaSort />
							)}
						</span>}
					</div>
				</th>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<th
					className={`px-4 py-3 text-right text-xs uppercase tracking-widest text-zinc-500 flex-1 ${sortable ? "cursor-pointer" : ""} group hover:text-green-400 transition`}
					onClick={() => sortable && handleSort(SortBy.MarketCap)}
				>
					<div className="flex items-center justify-end">
						Market Cap
						{sortable && <span
							className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.MarketCap ? "text-green-400" : "text-zinc-600"}`}
						>
							{sort === SortBy.MarketCap ? (
								dir === "asc" ? (
									<FaSortUp />
								) : (
									<FaSortDown />
								)
							) : (
								<FaSort />
							)}
						</span>}
					</div>
				</th>
				{type === AssetType.BSV21 && (
					<th className="px-4 py-3 text-center text-xs uppercase tracking-widest text-zinc-500 w-12">Contract</th>
				)}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<th
					className={`${type === AssetType.BSV21 ? "w-48" : "w-96"} px-4 py-3 text-right text-xs uppercase tracking-widest text-zinc-500 ${sortable ? "cursor-pointer" : ""} group hover:text-green-400 transition`}
					onClick={() => sortable ? handleSort(SortBy.Holders) : null}
				>
					<div className="flex items-center justify-end">
						Holders
						{sortable && <span
							className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Holders ? "text-green-400" : "text-zinc-600"}`}
						>
							{sort === SortBy.Holders ? (
								dir === "asc" ? (
									<FaSortUp />
								) : (
									<FaSortDown />
								)
							) : (
								<FaSort />
							)}
						</span>}
					</div>
				</th>
			</tr>
		</thead>
	);
};

export default TableHeading;
