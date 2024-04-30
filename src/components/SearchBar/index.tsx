"use client";

import { API_HOST } from "@/constants";
import { autofillValues } from "@/signals/search";
import { Autofill } from "@/types/search";
import * as http from "@/utils/httpClient";
import { effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { IoMdSearch } from "react-icons/io";

// signal has to be in a React.FC
const SearchBar: React.FC = () => {
	useSignals();
	const searchTerm = useSignal("");
	// this is router from next/navigation it does not have search.query or search.pathname
	const router = useRouter();

	// search param is part of the path 1satordinals.com/listings/search/[TERM]
	const searchParam = usePathname().split("/").pop() || "";

	const lastTerm = useSignal("");

	const subForm = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (searchTerm.value.length > 0) {
			if (searchTerm.value.length <= 4) {
				// if (knownV1Tickers.value.includes(searchTerm.value.toLocaleUpperCase())) {
				//   router.push(`/market/bsv20/${searchTerm.value.toLocaleUpperCase()}`);
				//   return;
				// }
				// if (knownV2Tickers.value.includes(searchTerm.value.toLocaleUpperCase())) {
				//   router.push(`/market/bsv21/${searchTerm.value.toLocaleUpperCase()}`);
				//   return;
				// }
				if (autofillValues.value) {
					const found = autofillValues.value.find(
						(t) => t.tick === searchTerm.value.trim()
					);
					if (found) {
						searchTerm.value = "";
						autofillValues.value = null;
						router.push(`/market/${found.type}/${found.tick}`);
						return;
					}
				}
			}
			router.push(`/listings/search/${searchTerm.value}`);
		}
	};

	effect(() => {
		const fire = async (term: string) => {
			const url = `https://1sat-api-production.up.railway.app/ticker/autofill/bsv20/${term}`;
			const { promise } = http.customFetch<Autofill[]>(url);
			const response = await promise;
			console.log({ response });
			autofillValues.value = response;
		};
		if (
			searchTerm.value.length > 0 &&
			lastTerm.value !== searchTerm.value
		) {
			lastTerm.value = searchTerm.value;
			fire(searchTerm.value);

			// return knownV1Tickers.value.filter((t) =>
			//   !!t && t.toLocaleUpperCase().startsWith(searchTerm.value.toLocaleUpperCase())
			// );
		}
	});

	// searchTerm.subscribe(async (v) => {
	//   if (v.length > 2) {
	//     await findBsv20Ticker(v);
	//   }
	// });

	const findBsv20Ticker = async (tick: string) => {
		const resp = await fetch(`${API_HOST}/api/bsv20/tick/${tick}`);
		if (resp.status === 200) {
			router.push(`/market/bsv20/${tick}`);
		} else if (resp.status === 404) {
			alert("Ticker not found");
		}
	};

	const tickerKeyDown = (e: any) => {
		if (e.key === "Enter") {
			findBsv20Ticker(e.target.value);
		}
	};

	return (
		<form className="navbar-center relative" onSubmit={subForm}>
			<div className="group gap-2 w-48 md:w-96 relative">
				<input
					type="text"
					placeholder={"Search"}
					className="w-full input input-ghost hover:input-bordered pr-8"
					onChange={(e) => (searchTerm.value = e.target.value)}
				/>
				<IoMdSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary/25 group-hover:text-secondary-content transition w-5 h-5" />
			</div>
			{autofillValues.value &&
				autofillValues.value.length > 0 &&
				searchTerm.value.length > 0 &&
				searchTerm.value !== searchParam && (
					<div className="flex-col absolute text-left border border-[#222] right-0 top-0 mt-12 h-100vh max-h-48  text-white bg-base-100 rounded w-full flex z-20 overflow-hidden overflow-y-scroll">
						{autofillValues.value.map((t) => (
							<Link
								onClick={() => {
									searchTerm.value = "";
								}}
								href={`/market/bsv20/${t.tick}`}
								key={t.id}
								className="hover:bg-base-200 w-full h-full p-2 flex items-center justify-center"
							>
								{t.tick}
							</Link>
						))}
					</div>
				)}
		</form>
	);
};

export default SearchBar;
