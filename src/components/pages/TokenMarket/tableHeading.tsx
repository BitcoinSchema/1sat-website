"use client";

import { AssetType, SortBy } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

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
        <th className="min-w-16 cursor-pointer group" onClick={() => handleSort(SortBy.Ticker)}>
          <div className="flex items-center">
            Ticker
            <span className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Ticker ? '' : 'text-[#555]'}`}>
              {sort === SortBy.Ticker ? (dir === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
            </span>
          </div>
        </th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th className="w-1/2 cursor-pointer group" onClick={() => handleSort(SortBy.Price)}>
          <div className="flex items-center">
            Recent Price
            <span className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Price ? '' : 'text-[#555]'}`}>
              {sort === SortBy.Price ? (dir === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
            </span>
          </div>
        </th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th className="cursor-pointer group" onClick={() => handleSort(SortBy.PctChange)}>
          <div className="flex items-center">
            Pct Change
            <span className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.PctChange ? '' : 'text-[#555]'}`}>
              {sort === SortBy.PctChange ? (dir === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
            </span>
          </div>
        </th>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th className="text-right flex-1 cursor-pointer group" onClick={() => handleSort(SortBy.MarketCap)}>
          <div className="flex items-center justify-end">
            Market Cap
            <span className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.MarketCap ? '' : 'text-[#555]'}`}>
              {sort === SortBy.MarketCap ? (dir === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
            </span>
          </div>
        </th>
        {type === AssetType.BSV21 && <th className="text-center w-12">Contract</th>}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <th
          className={`${type === AssetType.BSV21 ? "w-48" : "w-96"} text-right cursor-pointer group`}
          onClick={() => handleSort(SortBy.Holders)}
        >
          <div className="flex items-center justify-end">
            Holders
            <span className={`w-6 ml-1 md:invisible md:group-hover:visible ${sort === SortBy.Holders ? '' : 'text-[#555]'}`}>
              {sort === SortBy.Holders ? (dir === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
            </span>
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default TableHeading;