"use client";

import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/components/ui/sidebar";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { FetchStatus, ORDFS } from "@/lib/constants";

// Autofill result type
interface Autofill {
	id: string;
	tick: string;
	icon?: string;
	type: "BSV20" | "BSV21";
	num?: number;
}

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [autofillResults, setAutofillResults] = useState<Autofill[]>([]);
	const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.Idle);

	// Keyboard shortcut: Cmd+K or Ctrl+K
	useHotkeys("k", () => setOpen((open) => !open));

	// Check for #search fragment on mount and hash changes
	useEffect(() => {
		const checkFragment = () => {
			if (window.location.hash === "#search") {
				setOpen(true);
			}
		};
		checkFragment();
		window.addEventListener("hashchange", checkFragment);
		return () => window.removeEventListener("hashchange", checkFragment);
	}, []);

	// Fetch autofill results as user types
	useEffect(() => {
		if (!searchTerm || searchTerm.length < 2) {
			setAutofillResults([]);
			setFetchStatus(FetchStatus.Idle);
			return;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(async () => {
			setFetchStatus(FetchStatus.Loading);
			try {
				// Use local API route to avoid CORS issues
				const response = await fetch(
					`/api/autofill?term=${encodeURIComponent(searchTerm)}`,
					{
						signal: controller.signal,
					},
				);

				if (response.ok) {
					const results = await response.json();
					setAutofillResults(results || []);
				} else {
					setAutofillResults([]);
				}
				setFetchStatus(FetchStatus.Success);
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					console.error("Autofill fetch error:", error);
					setFetchStatus(FetchStatus.Error);
				}
			}
		}, 300); // Debounce 300ms

		return () => {
			controller.abort();
			clearTimeout(timeoutId);
		};
	}, [searchTerm]);

	// Handle open/close with fragment management
	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Clear search state
			setSearchTerm("");
			setAutofillResults([]);
			setFetchStatus(FetchStatus.Idle);
			// Clear fragment if present
			if (window.location.hash === "#search") {
				history.replaceState(
					null,
					"",
					window.location.pathname + window.location.search,
				);
			}
		}
	}, []);

	// Navigate to token page
	const handleTokenSelect = useCallback(
		(token: Autofill) => {
			const path =
				token.type === "BSV20"
					? `/market/bsv20/${token.tick}`
					: `/market/bsv21/${token.id}`;
			handleOpenChange(false);
			router.push(path);
		},
		[router, handleOpenChange],
	);

	// Search the market
	const handleSearchSubmit = useCallback(() => {
		if (!searchTerm) return;
		const path = `/market/search/${encodeURIComponent(searchTerm)}`;
		handleOpenChange(false);
		router.push(path);
	}, [searchTerm, router, handleOpenChange]);

	return (
		<>
			<form {...props} onSubmit={(e) => e.preventDefault()}>
				<SidebarGroup className="py-0">
					<SidebarGroupContent className="relative">
						<Label htmlFor="search" className="sr-only">
							Search
						</Label>
						<SidebarInput
							id="search"
							placeholder="Search market..."
							className="pl-8 cursor-pointer"
							onClick={() => setOpen(true)}
							readOnly
						/>
						<Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
						<kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
							<span className="text-xs">⌘</span>K
						</kbd>
					</SidebarGroupContent>
				</SidebarGroup>
			</form>
			<CommandDialog open={open} onOpenChange={handleOpenChange}>
				<CommandInput
					placeholder="Search tokens, collections, or ordinals..."
					value={searchTerm}
					onValueChange={setSearchTerm}
				/>
				<CommandList>
					<CommandEmpty>
						{fetchStatus === FetchStatus.Loading ? (
							<div className="flex items-center justify-center py-6">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : (
							"No results found."
						)}
					</CommandEmpty>

					{/* Search Market Option */}
					{searchTerm && (
						<CommandGroup heading="Actions">
							<CommandItem onSelect={handleSearchSubmit}>
								<Search className="mr-2 h-4 w-4" />
								<span>Search market for "{searchTerm}"</span>
							</CommandItem>
						</CommandGroup>
					)}

					{searchTerm && autofillResults.length > 0 && <CommandSeparator />}

					{/* Autocomplete Results - BSV21 first, then BSV20 */}
					{autofillResults.length > 0 && (
						<CommandGroup heading="Tokens">
							{[...autofillResults]
								.sort((a, b) => {
									// BSV21 comes before BSV20
									if (a.type === "BSV21" && b.type === "BSV20") return -1;
									if (a.type === "BSV20" && b.type === "BSV21") return 1;
									return 0;
								})
								.map((token) => {
									const isBsv20 = token.type === "BSV20";
									return (
										<CommandItem
											key={token.id}
											value={`${token.tick || ""} ${token.id}`}
											onSelect={() => handleTokenSelect(token)}
											className="py-3"
										>
											<div className="flex items-center w-full gap-3">
												{/* Icon */}
												<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-border bg-muted flex items-center justify-center">
													{token.icon ? (
														<Image
															src={`${ORDFS}/${token.icon}`}
															alt={token.tick || ""}
															width={32}
															height={32}
															className="h-full w-full object-cover"
														/>
													) : (
														<span className="text-xs text-muted-foreground">
															#
														</span>
													)}
												</div>

												{/* Info */}
												<div className="flex flex-col flex-1 min-w-0">
													<span className="truncate font-medium">
														{token.tick || "Unknown"}
													</span>
													<span className="truncate text-xs text-muted-foreground font-mono">
														{isBsv20
															? `#${token.num || token.id.slice(0, 8)}`
															: `${token.id.slice(0, 12)}...`}
													</span>
												</div>

												{/* Type Badge */}
												<Badge
													variant="outline"
													className={`text-xs ${
														isBsv20
															? "text-orange-400 border-orange-400/30"
															: "text-purple-400 border-purple-400/30"
													}`}
												>
													{token.type}
												</Badge>
											</div>
										</CommandItem>
									);
								})}
						</CommandGroup>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
