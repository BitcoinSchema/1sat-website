"use client";

import { useSignal } from "@preact/signals-react";
import { useRouter } from "next/navigation";
import React from "react";
import { IoMdSearch } from "react-icons/io";

// signal has to be in a React.FC
const SearchBar: React.FC = () => {
  const searchTerm = useSignal("");
  const router = useRouter();

  const subForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.value.length > 0)
      router.push(`/listings/search/${searchTerm.value}`);
  };

  return (
    <form className="navbar-center" onSubmit={subForm}>
      <div className="group gap-2 w-72 md:w-96 relative">
        <input
          type="text"
          placeholder={"Search Listings"}
          className="w-full input input-ghost hover:input-bordered pr-8"
          onChange={(e) => (searchTerm.value = e.target.value)}
        />
        <IoMdSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary/25 group-hover:text-secondary-content transition w-5 h-5" />
      </div>
    </form>
  );
};

export default SearchBar;
