"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FaHashtag, FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetType, SortBy } from "@/constants";

const TableHeading = ({
	type,
	sortable,
}: {
	type: AssetType.BSV20 | AssetType.BSV21;
	sortable: boolean;
}) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const sort = searchParams.get("sort") as SortBy;
	const dir = searchParams.get("dir") as "asc" | "desc";

	const handleSort = useCallback(
		(column: SortBy) => {
			const newDir = dir === "asc" ? "desc" : "asc";
			router.push(`/market/${type}/?sort=${column}&dir=${newDir}`);
		},
		[router, type, dir],
	);

	const SortIcon = ({ column }: { column: SortBy }) => {
		if (!sortable) return null;
		return (
			<span
				className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === column ? "text-primary" : "text-muted-foreground/50"}`}
			>
				{sort === column ? (
					dir === "asc" ? (
						<FaSortUp />
					) : (
						<FaSortDown />
					)
				) : (
					<FaSort />
				)}
			</span>
		);
	};

	return (
		<TableHeader className="w-full border-b border-border bg-muted/30">
			<TableRow className="hover:bg-transparent">
				<TableHead
					className={`min-w-16 px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground ${sortable ? "cursor-pointer" : ""} group`}
				>
					<div className="flex items-center">
						{type === AssetType.BSV20 && (
							<div
								className="mr-2 hover:text-primary transition"
								onClick={() => handleSort(SortBy.Number)}
							>
								<FaHashtag />
							</div>
						)}
						<div
							className="flex items-center hover:text-primary transition"
							onClick={() => (sortable ? handleSort(SortBy.Ticker) : null)}
						>
							Ticker
							<SortIcon column={SortBy.Ticker} />
						</div>
					</div>
				</TableHead>
				<TableHead
					className={`w-1/2 px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground ${sortable ? "cursor-pointer" : ""} group hover:text-primary transition`}
					onClick={() => (sortable ? handleSort(SortBy.Price) : null)}
				>
					<div className="flex items-center">
						Recent Price
						<SortIcon column={SortBy.Price} />
					</div>
				</TableHead>
				<TableHead
					className={`px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground ${sortable ? "cursor-pointer" : ""} group hover:text-primary transition`}
					onClick={() => (sortable ? handleSort(SortBy.PctChange) : null)}
				>
					<div className="flex items-center">
						Pct Change
						<SortIcon column={SortBy.PctChange} />
					</div>
				</TableHead>
				<TableHead
					className={`px-4 py-3 text-right text-xs uppercase tracking-widest text-muted-foreground flex-1 ${sortable ? "cursor-pointer" : ""} group hover:text-primary transition`}
					onClick={() => sortable && handleSort(SortBy.MarketCap)}
				>
					<div className="flex items-center justify-end">
						Market Cap
						<SortIcon column={SortBy.MarketCap} />
					</div>
				</TableHead>
				{type === AssetType.BSV21 && (
					<TableHead className="px-4 py-3 text-center text-xs uppercase tracking-widest text-muted-foreground w-12">
						Contract
					</TableHead>
				)}
				<TableHead
					className={`${type === AssetType.BSV21 ? "w-48" : "w-96"} px-4 py-3 text-right text-xs uppercase tracking-widest text-muted-foreground ${sortable ? "cursor-pointer" : ""} group hover:text-primary transition`}
					onClick={() => (sortable ? handleSort(SortBy.Holders) : null)}
				>
					<div className="flex items-center justify-end">
						Holders
						<SortIcon column={SortBy.Holders} />
					</div>
				</TableHead>
			</TableRow>
		</TableHeader>
	);
};

export default TableHeading;
