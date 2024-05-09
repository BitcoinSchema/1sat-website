"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import LRC20Listings from "@/components/LRC20Listings";
import OrdinalListings, { OrdViewMode } from "@/components/OrdinalListings";
import TokenListings from "@/components/TokenListings";
import { AssetType, FetchStatus, MARKET_API_HOST, ORDFS } from "@/constants";
import { searchLoading } from "@/signals/search";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import type { Autofill } from "@/types/search";
import * as http from "@/utils/httpClient";
import { useSignals } from "@preact/signals-react/runtime";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export interface SearchPageProps {
  imageListings?: OrdUtxo[];
  collections?: OrdUtxo[];
  tokenListingsv2?: BSV20TXO[];
  modelListings?: OrdUtxo[];
  lrc20Listings?: OrdUtxo[];
  lrc20Tokens?: OrdUtxo[];
  bsv20Matches?: string[];
  selectedAssetType?: AssetType;
  title?: string;
}

const SearchPage: React.FC<SearchPageProps> = (props) => {
  const { selectedAssetType } = props;
  useSignals();
  const pathname = usePathname();
  const termFromPath = pathname.split("/").pop();

  // use useQuery to fetch bsv20 matches for this search term
  const { data: bsv20Results, isLoading, isError } = useQuery({
    queryKey: ["autofill-bsv20", termFromPath],
    queryFn: async () => {
      const url = `${MARKET_API_HOST}/ticker/autofill/bsv20/${termFromPath}`;
      const { promise } = http.customFetch<Autofill[]>(url);
      const resp = await promise;
      searchLoading.value = FetchStatus.Success;
      return resp;
    },
  });

  const { data: bsv21Results, isLoading: isLoadingBsv21, isError: isErrorBsv21 } = useQuery({
    queryKey: ["autofill-bsv21", termFromPath],
    queryFn: async () => {
      const url = `${MARKET_API_HOST}/ticker/autofill/bsv21/${termFromPath}`;
      const { promise } = http.customFetch<Autofill[]>(url);
      return await promise;
    },
  });

  useEffect(() => {
    if (isLoading || isLoadingBsv21) {
      searchLoading.value = FetchStatus.Loading;
    } else if (isError || isErrorBsv21) {
      searchLoading.value = FetchStatus.Error;
    }
  }, [isLoading, isError, searchLoading, isLoadingBsv21, isErrorBsv21]);

  console.log({ bsv20Results, bsv21Results })
  const Listings = () => {
    switch (selectedAssetType) {
      case AssetType.Ordinals:
        return (
          <OrdinalListings
            term={termFromPath}
            mode={OrdViewMode.List}
          />
        );
      case AssetType.BSV20:
        return <TokenListings type={AssetType.BSV20} />;
      case AssetType.BSV21:
        return <TokenListings type={AssetType.BSV21} />;
      case AssetType.LRC20:
        return (
          <LRC20Listings
            listings={props.lrc20Listings!}
            tokens={props.lrc20Tokens!}
          />
        );
      default:
        return null;
    }
  };

  return (

    <div className="w-full max-w-5xl mx-auto">
      {props.title && (
        <div className="text-3xl font-bold mb-4">{props.title}</div>
      )}
      {bsv20Results && bsv20Results.length > 0 && (<div className="text-[#555] font-semibold text-lg mb-2">BSV20</div>)}
      {bsv20Results && bsv20Results.length > 0 && (
        <div className="w-full text-base-100 grid grid-cols-8 mb-4 gap-2">
          {bsv20Results?.map((match) => (
            <Link
              key={match.id}
              href={`/market/bsv20/${match.tick}`}
              className="btn btn-ghost btn-sm border-neutral/25 hover:text-neutral-content hover:bg-neutral/25 text-neutral"
            >
              {match.tick}
            </Link>
          ))}
        </div>
      )}
      {bsv21Results && bsv21Results.length > 0 && (
        <div className="text-[#555] font-semibold text-lg mb-2">
          BSV21
        </div>
      )}
      {/* // bsv21 results */}
      {bsv21Results && bsv21Results.length > 0 && (
        <div className="w-full text-base-100 grid grid-cols-8 mb-4 gap-2">
          {bsv21Results?.map((match) => (
            <Link
              key={match.id}
              href={`/market/bsv21/${match.id}`}
              className={`btn btn-sm hover:bg-neutral transition ${match.contract ? "" : match.contract === "pow-20" ? "bg-orange-800 hover:bg-orange-600" : ""}`}
            >
              <div className="flex items-center">

                {match.icon && <ImageWithFallback src={`${ORDFS}/${match.icon}`} alt={match.tick} width={15} height={15} className="mr-2" />}
                <div className="inline-flex">
                  {match.tick}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {bsv20Results && bsv20Results.length > 0 && (
        <div className="text-[#555] font-semibold text-lg mb-2">
          Ordinals
        </div>
      )}
      <div className="tab-content block bg-base-100 border-base-200 rounded-box p-2 md:p-6">
        <Listings />
      </div>
    </div>
  );
};

export default SearchPage;
