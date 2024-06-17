"use client";

import { AssetType, SortBy } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";

const TableHeading = ({ type }: { type: AssetType.BSV20 | AssetType.BSV21 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") as SortBy;
  const dir = searchParams.get("dir") as "asc" | "desc";

  const handleSort = (column: SortBy) => {
    const newDir = dir === "asc" ? "desc" : "asc";
    router.push(`/market/${type}/?sort=${column}&dir=${newDir}`);
  };

  return (
    <thead>
      <tr>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th className="min-w-16 cursor-pointer"  onClick={() => handleSort(SortBy.Ticker)}>Ticker</th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th
          className="w-1/2 cursor-pointer"
          onClick={() => handleSort(SortBy.Price)}
        >
          Recent Price {sort === SortBy.Price && <span>{dir === "asc" ? "▲" : "▼"}</span>}
        </th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th
          className="cursor-pointer"
          onClick={() => handleSort(SortBy.PctChange)}
        >
          Pct Change {sort === SortBy.PctChange && <span>{dir === "asc" ? "▲" : "▼"}</span>}
        </th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th
          className="text-right flex-1 cursor-pointer"
          onClick={() => handleSort(SortBy.MarketCap)}
        >
          Market Cap {sort === SortBy.MarketCap && <span>{dir === "asc" ? "▲" : "▼"}</span>}
        </th>
        {type === AssetType.BSV21 && (
          <th className="text-center w-12">Contract</th>
        )}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th
          className={`${type === AssetType.BSV21 ? "w-48" : "w-96"} text-right cursor-pointer`}
          onClick={() => handleSort(SortBy.Holders)}
        >
          Holders {sort === SortBy.Holders && <span>{dir === "asc" ? "▲" : "▼"}</span>}
        </th>
      </tr>
    </thead>
  );
};

export default TableHeading;