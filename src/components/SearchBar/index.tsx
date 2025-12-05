"use client";

import { effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { FaHashtag } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { AssetType, FetchStatus, MARKET_API_HOST, ORDFS } from "@/constants";
import { autofillValues, searchLoading } from "@/signals/search";
import type { Autofill } from "@/types/search";
import * as http from "@/utils/httpClient";
import ImageWithFallback from "../ImageWithFallback";

const SearchBar: React.FC = () => {
	useSignals();
	const router = useRouter();
	const searchTerm = useSignal("");
	const lastTerm = useSignal("");
	const isOpen = useSignal(false);

	// Keyboard shortcut: Cmd+K or Ctrl+K
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				isOpen.value = !isOpen.value;
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	// Autofill effect - fetch results as user types
	effect(() => {
		const fire = async (term: string) => {
			searchLoading.value = FetchStatus.Loading;
			try {
				const url = `${MARKET_API_HOST}/ticker/autofill/bsv20/${term}`;
				const { promise } = http.customFetch<Autofill[]>(url);
				const response = await promise;

				const url2 = `${MARKET_API_HOST}/ticker/autofill/bsv21/${term}`;
				const { promise: promise2 } = http.customFetch<Autofill[]>(url2);
				const response2 = await promise2;

				autofillValues.value = response.concat(response2);
			} finally {
				searchLoading.value = FetchStatus.Idle;
			}
		};

		if (searchTerm.value.length > 0 && lastTerm.value !== searchTerm.value) {
			lastTerm.value = searchTerm.value;
			fire(searchTerm.value);
		}
	});

	// Clear state when dialog closes
	const handleOpenChange = useCallback(
		(open: boolean) => {
			isOpen.value = open;
			if (!open) {
				searchTerm.value = "";
				autofillValues.value = null;
				searchLoading.value = FetchStatus.Idle;
			}
		},
		[isOpen, searchTerm],
	);

	// Navigate to token page
	const handleSelect = useCallback(
		(path: string) => {
			isOpen.value = false;
			searchTerm.value = "";
			autofillValues.value = null;
			router.push(path);
		},
		[router, isOpen, searchTerm],
	);

	// Search the market
	const handleSearchSubmit = useCallback(() => {
		if (!searchTerm.value) return;
		const url = `/listings/search/${searchTerm.value}`;
		isOpen.value = false;
		searchTerm.value = "";
		autofillValues.value = null;
		searchLoading.value = FetchStatus.Loading;
		router.push(url);
	}, [router, isOpen, searchTerm]);

	return (
		<>
			{/* Trigger Button - Terminal Style */}
			<Button
				variant="outline"
				onClick={() => (isOpen.value = true)}
				aria-label="Open search"
				className="relative h-10 w-full p-0 justify-start text-sm text-muted-foreground sm:h-9 sm:w-full sm:justify-start sm:px-3 sm:pr-12 md:w-64 lg:w-80 bg-card border-border rounded-none hover:bg-muted hover:text-primary hover:border-primary/50 font-mono transition-colors"
			>
				<span className="inline-flex items-center w-full gap-2 px-3 sm:px-0">
					<Search className="h-4 w-4" />
					<span className="hidden sm:inline uppercase tracking-wider text-xs">
						Search...
					</span>
				</span>
				<kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			{/* Command Palette Dialog */}
			<CommandDialog open={isOpen.value} onOpenChange={handleOpenChange}>
				<div className="bg-zinc-950 border-zinc-800 font-mono h-full flex flex-col sm:rounded-lg">
					<div className="relative">
						<CommandInput
							placeholder="SEARCH BSV20, BSV21, TICKERS..."
							value={searchTerm.value}
							onValueChange={(v) => (searchTerm.value = v)}
							className="border-none focus:ring-0 font-mono text-zinc-100 placeholder:text-zinc-600 h-12 pr-10"
							onKeyDown={(e) => {
								if (e.key === "Enter" && !autofillValues.value?.length) {
									handleSearchSubmit();
								}
							}}
						/>
						{searchLoading.value === FetchStatus.Loading && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
						)}
					</div>

					<CommandList className="bg-zinc-950 flex-1 min-h-[50vh] sm:min-h-[300px] sm:max-h-[400px]">

						{/* Empty State */}
						{searchLoading.value !== FetchStatus.Loading &&
							autofillValues.value?.length === 0 &&
							searchTerm.value && (
								<CommandEmpty className="py-8 text-center text-xs text-zinc-500 font-mono uppercase tracking-wider">
									NO TOKENS FOUND
									<br />
									<span className="text-zinc-600">
										Press ENTER to search market
									</span>
								</CommandEmpty>
							)}

						{/* Search Action */}
						{searchTerm.value && (
							<CommandGroup
								heading="ACTIONS"
								className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest"
							>
								<CommandItem
									onSelect={handleSearchSubmit}
									className="data-[selected=true]:bg-zinc-900 data-[selected=true]:text-green-400 rounded-none cursor-pointer font-mono"
								>
									<Search className="mr-2 h-4 w-4" />
									<span className="uppercase text-xs tracking-wider">
										Search market for "{searchTerm.value}"
									</span>
								</CommandItem>
							</CommandGroup>
						)}

						{searchTerm.value && <CommandSeparator className="bg-zinc-800" />}

						{/* Autocomplete Results */}
						{autofillValues.value && autofillValues.value.length > 0 && (
							<CommandGroup
								heading="TOKENS"
								className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest"
							>
								{autofillValues.value.map((t) => {
									const isBsv20 = t.type === AssetType.BSV20;
									const path = isBsv20
										? `/market/bsv20/${t.tick}`
										: `/market/bsv21/${t.id}`;

									return (
										<CommandItem
											key={t.id}
											value={`${t.tick || ""} ${t.id}`}
											onSelect={() => handleSelect(path)}
											className="data-[selected=true]:bg-zinc-900 data-[selected=true]:text-green-400 rounded-none cursor-pointer py-3"
										>
											<div className="flex items-center w-full gap-3">
												{/* Icon */}
												<div className="relative h-8 w-8 shrink-0 overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
													{t.icon ? (
														<ImageWithFallback
															src={`${ORDFS}/${t.icon}`}
															alt={t.tick || ""}
															width={32}
															height={32}
															className="h-full w-full object-cover"
														/>
													) : (
														<FaHashtag className="text-zinc-600 w-3 h-3" />
													)}
												</div>

												{/* Info */}
												<div className="flex flex-col flex-1 min-w-0">
													<span className="truncate text-zinc-200 font-bold tracking-tight font-mono">
														{t.tick || "Unknown"}
													</span>
													<span className="truncate text-[10px] text-zinc-600 font-mono">
														{isBsv20
															? `#${t.num || t.id.slice(0, 8)}`
															: `${t.id.slice(0, 12)}...`}
													</span>
												</div>

												{/* Type Badge */}
												<Badge
													variant="outline"
													className={`rounded-none border-zinc-700 font-mono text-[10px] uppercase ${
														isBsv20 ? "text-orange-400" : "text-purple-400"
													}`}
												>
													{t.type}
												</Badge>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
				</div>
			</CommandDialog>
		</>
	);
};

export default SearchBar;
