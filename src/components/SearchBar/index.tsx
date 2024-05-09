"use client";

import { AssetType, FetchStatus, MARKET_API_HOST, ORDFS } from "@/constants";
import { autofillValues, searchLoading } from "@/signals/search";
import type { Autofill } from "@/types/search";
import * as http from "@/utils/httpClient";
import { effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useMemo, useRef } from "react";
import { FaHashtag, FaSpinner } from "react-icons/fa6";
import { IoMdClose, IoMdSearch } from "react-icons/io";
import ImageWithFallback from "../ImageWithFallback";

// signal has to be in a React.FC
const SearchBar: React.FC = () => {
  useSignals();
  const searchTerm = useSignal("");
  const router = useRouter();
  const searchParam = usePathname().split("/").pop() || "";
  const lastTerm = useSignal(searchParam);
  const focused = useSignal(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.value.length > 0) {
      if (searchTerm.value.length <= 4) {
        if (autofillValues.value) {
          const found = autofillValues.value.find(
            (t) => t.tick === searchTerm.value.trim()
          );
          if (found) {
            searchTerm.value = "";
            autofillValues.value = null;
            focused.value = false;
            e.currentTarget.blur();
            router.push(`/market/${found.type}/${found.tick}`);
            return;
          }
        }
      }

      e.currentTarget.blur();
      focused.value = false;
      const url = `/listings/search/${searchTerm.value}`;
      searchTerm.value = "";
      router.push(url);
    }
  }, [searchTerm, focused, router, autofillValues]);

  effect(() => {
    const fire = async (term: string) => {
      const url = `${MARKET_API_HOST}/ticker/autofill/bsv20/${term}`;
      const { promise } = http.customFetch<Autofill[]>(url);
      const response = await promise;
      console.log({ response });

      const url2 = `${MARKET_API_HOST}/ticker/autofill/bsv21/${term}`;
      const { promise: promise2 } = http.customFetch<Autofill[]>(url2);
      const response2 = await promise2;
      console.log({ response2 });

      autofillValues.value = response.concat(response2);

    };
    if (
      searchTerm.value.length > 0 &&
      lastTerm.value !== searchTerm.value
    ) {
      lastTerm.value = searchTerm.value;
      fire(searchTerm.value);
    }
  });

  const searchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      searchTerm.value = "";
      autofillValues.value = null;
      focused.value = false;
      e.currentTarget.blur();
    }
  }, [searchTerm, focused]);

  const clearSearch = useCallback(() => {
    searchTerm.value = "";
    autofillValues.value = null;
    focused.value = false;
    inputRef.current?.blur();
  }, [searchTerm, focused]);

  const handleSearchClick = useCallback(() => {
    if (searchTerm.value.length > 0) {
      subForm(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>);
    } else {
      inputRef.current?.focus();
    }
  }, [searchTerm, subForm]);

  const icon = useMemo(() => {
    return searchLoading.value === FetchStatus.Loading ? (
      <FaSpinner className="absolute right-2 text-primary/25 animate-spin" />
    ) : (
      <IoMdSearch
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary/25 group-hover:text-secondary-content transition w-5 h-5 cursor-pointer"
        onClick={handleSearchClick}
      />
    )
  }, [searchLoading.value, handleSearchClick]);

  const autofill = useMemo(() => {
    return autofillValues.value &&
      autofillValues.value.length > 0 &&
      (searchTerm.value !== searchParam || searchTerm.value === "") &&
      (<div className="flex-col text-left right-0 
      top-0 mt-2 h-full text-white rounded w-full 
      flex z-20 overflow-hidden overflow-y-scroll">
        {autofillValues.value.map((t) => (
          <Link
            onClick={() => {
              searchTerm.value = "";
              autofillValues.value = null;
            }}
            href={t.type === AssetType.BSV20 ? `/market/bsv20/${t.tick}` : `/market/bsv21/${t.id}`}
            key={t.id}
            className="hover:bg-base-200 flex items-center justify-between w-full h-fit p-2 "
          >
            <div className="flex items-center justify-start gap-2">
              {t.type === AssetType.BSV21 && (<ImageWithFallback src={`${ORDFS}/${t.icon}`} alt={t.tick} width={30} height={30} />)}
              {t.type === AssetType.BSV20 ? <div className="flex items-center text-[#555]"><FaHashtag className="w-8 " />{t.num}</div> : ""}{t.tick}
            </div>
            <div className="flex items-center gap-2">

              {t.type === AssetType.BSV21 && t.contract ? <div className="text-yellow-500/50">{t.contract}</div> : ""}
              <div className="text-[#555]">
                {t.type}
              </div>
            </div>
          </Link>
        ))}
      </div>)
  }, [autofillValues.value, searchTerm.value, searchParam]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div className={`px-2 md:px-0 justify-center items-center ${focused.value ?
      'absolute top-0 left:0 mt-2 md:mt-auto md:left-auto md:top-auto md:modal-backdrop md:backdrop-blur w-full md:h-screen' :
      'w-fit mx-auto'}`}
      onClick={(e) => {
        searchTerm.value = "";
        autofillValues.value = null;
        focused.value = false;
        searchLoading.value = FetchStatus.Idle;
      }}>
      <div className={`${focused.value ? ' border border-yellow-200/25 w-full bg-[#111] rounded-box md:w-[50vw] max-w-xl h-[50vh] flex flex-col items-center justify-start p-3 z-20' : ''}`}>
        <form className="w-full navbar-center relative flex flex-col h-full" onSubmit={subForm}>
          <div className={"w-full group gap-2 relative flex items-center"}>
            <input
              ref={inputRef}
              type="text"
              placeholder={"Search"}
              className="w-full input input-ghost hover:input-bordered pr-16"
              value={searchTerm.value}
              onChange={(e) => {
                searchTerm.value = e.target.value
                if (!focused.value) focused.value = true
              }}
              onClick={() => {
                focused.value = true;
                searchTerm.value = "";
              }}
              onFocus={() => {
                focused.value = true;
              }}
              onKeyDown={searchKeyDown}
            />
            {focused.value && searchTerm.value.length > 0 && (
              <IoMdClose
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-primary/25 hover:text-secondary-content transition w-5 h-5 cursor-pointer"
                onClick={clearSearch}
              />
            )}
            {icon}
          </div>
          {autofill}
        </form>
      </div>
    </div>
  );
};

export default SearchBar;