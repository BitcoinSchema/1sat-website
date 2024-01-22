"use client";

import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { IoMdSearch } from "react-icons/io";

// signal has to be in a React.FC
const SearchBar: React.FC = () => {
  useSignals();
  const searchTerm = useSignal("");
  const router = useRouter();

  const knownTickers = ["FIRE", "PEPE", "LOVE"]
  const subForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.value.length > 0) {

      if (knownTickers.includes(searchTerm.value.toLocaleUpperCase())) {
        router.push(`/market/bsv20/${searchTerm.value.toLocaleUpperCase()}`);
        return
      }
      router.push(`/search/${searchTerm.value}`);
    }
  };

 const autofillValues = computed(() => {
    if (searchTerm.value.length > 2) {
      return knownTickers.filter(t => t.toLocaleUpperCase().startsWith(searchTerm.value.toLocaleUpperCase()))
    }
    return null
  })

  return (
    <form className="navbar-center relative" onSubmit={subForm}>
      <div className="group gap-2 w-72 md:w-96 relative">
        <input
          type="text"
          placeholder={"Search Listings"}
          className="w-full input input-ghost hover:input-bordered pr-8"
          onChange={(e) => (searchTerm.value = e.target.value)}
        />
        <IoMdSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary/25 group-hover:text-secondary-content transition w-5 h-5" />
      </div>
      {autofillValues && searchTerm.value.length > 2 && <div className="absolute border border-primary right-0 top-0 mt-12 h-full text-white bg-base-100 rounded w-full flex items-center justify-center z-20">
        {autofillValues.value?.map(t => <Link href={`/market/bsv20/${t}`} key={t} className="hover:bg-base-200 w-full h-full p-2 flex items-center justify-center">{t}</Link>)}
      </div>}
    </form>
  );
};

export default SearchBar;
