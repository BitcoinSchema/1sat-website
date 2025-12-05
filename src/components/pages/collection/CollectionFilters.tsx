"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { signal, computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
	Filter,
	X,
	ArrowUpDown,
	DollarSign,
	Sparkles,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { ItemSort, MarketSort } from "@/utils/fetchCollectionData";

// Signals for collection item filters
export const selectedTraits = signal<Map<string, string>>(new Map());
export const itemSort = signal<ItemSort>("recent");
export const marketSort = signal<MarketSort>("price_asc");
export const minPrice = signal<string>("");
export const maxPrice = signal<string>("");

// Computed string for API
export const traitsParam = computed(() => {
	const entries = Array.from(selectedTraits.value.entries());
	if (entries.length === 0) return "";
	return entries.map(([k, v]) => `${k}:${v}`).join(",");
});

// Check if any filters are active
export const hasActiveFilters = computed(() => {
	return (
		selectedTraits.value.size > 0 ||
		minPrice.value !== "" ||
		maxPrice.value !== ""
	);
});

// Clear all filters
export const clearFilters = () => {
	selectedTraits.value = new Map();
	minPrice.value = "";
	maxPrice.value = "";
	itemSort.value = "recent";
	marketSort.value = "price_asc";
};

// Toggle a trait value
export const toggleTrait = (traitName: string, value: string) => {
	const current = new Map(selectedTraits.value);
	if (current.get(traitName) === value) {
		current.delete(traitName);
	} else {
		current.set(traitName, value);
	}
	selectedTraits.value = current;
};

export interface TraitData {
	name: string;
	values: string[];
	counts?: number[];
}

interface CollectionFiltersProps {
	isMarketTab: boolean;
	traits?: TraitData[];
	onFilterChange?: () => void;
}

const ITEM_SORT_OPTIONS: { id: ItemSort; label: string }[] = [
	{ id: "recent", label: "Most Recent" },
	{ id: "mint_number", label: "Mint Number" },
	{ id: "rarity", label: "Rarity" },
];

const MARKET_SORT_OPTIONS: { id: MarketSort; label: string }[] = [
	{ id: "price_asc", label: "Price: Low → High" },
	{ id: "price_desc", label: "Price: High → Low" },
	{ id: "mint_number", label: "Mint Number" },
	{ id: "rarity", label: "Rarity" },
];

export const CollectionFilters = ({
	isMarketTab,
	traits = [],
	onFilterChange,
}: CollectionFiltersProps) => {
	useSignals();
	const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());

	const toggleExpanded = (traitName: string) => {
		const newExpanded = new Set(expandedTraits);
		if (newExpanded.has(traitName)) {
			newExpanded.delete(traitName);
		} else {
			newExpanded.add(traitName);
		}
		setExpandedTraits(newExpanded);
	};

	const handleTraitClick = (traitName: string, value: string) => {
		toggleTrait(traitName, value);
		onFilterChange?.();
	};

	const handleSortChange = (value: string) => {
		if (isMarketTab) {
			marketSort.value = value as MarketSort;
		} else {
			itemSort.value = value as ItemSort;
		}
		onFilterChange?.();
	};

	const handlePriceChange = () => {
		onFilterChange?.();
	};

	const sortOptions = isMarketTab ? MARKET_SORT_OPTIONS : ITEM_SORT_OPTIONS;
	const currentSort = isMarketTab ? marketSort.value : itemSort.value;

	return (
		<div className="space-y-4">
			{/* Header with clear button */}
			<div className="flex items-center justify-between">
				<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
					<Filter className="w-3 h-3" />
					FILTERS
				</h3>
				{hasActiveFilters.value && (
					<button
						type="button"
						onClick={() => {
							clearFilters();
							onFilterChange?.();
						}}
						className="text-xs text-primary hover:text-primary/80 font-mono uppercase tracking-wider transition-colors"
					>
						Clear All
					</button>
				)}
			</div>

			{/* Sort Section */}
			<div className="space-y-2">
				<h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
					<ArrowUpDown className="w-3 h-3" />
					SORT_BY
				</h4>
				<select
					value={currentSort}
					onChange={(e) => handleSortChange(e.target.value)}
					className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 font-mono text-xs text-foreground focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
				>
					{sortOptions.map((opt) => (
						<option key={opt.id} value={opt.id}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{/* Price Range (Market tab only) */}
			{isMarketTab && (
				<div className="space-y-2">
					<h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
						<DollarSign className="w-3 h-3" />
						PRICE_RANGE
					</h4>
					<div className="flex gap-2 items-center">
						<Input
							type="number"
							placeholder="Min"
							value={minPrice.value}
							onChange={(e) => {
								minPrice.value = e.target.value;
								handlePriceChange();
							}}
							className="bg-muted/50 border-border rounded-md font-mono text-xs h-8"
						/>
						<span className="text-muted-foreground text-xs">—</span>
						<Input
							type="number"
							placeholder="Max"
							value={maxPrice.value}
							onChange={(e) => {
								maxPrice.value = e.target.value;
								handlePriceChange();
							}}
							className="bg-muted/50 border-border rounded-md font-mono text-xs h-8"
						/>
					</div>
					<p className="text-[10px] text-muted-foreground">in satoshis</p>
				</div>
			)}

			{/* Traits Section */}
			{traits.length > 0 && (
				<div className="space-y-2">
					<h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
						<Sparkles className="w-3 h-3" />
						TRAITS
					</h4>
					<div className="space-y-2">
						{traits.map((trait) => {
							const isExpanded = expandedTraits.has(trait.name);
							const selectedValue = selectedTraits.value.get(trait.name);
							const visibleValues = isExpanded
								? trait.values
								: trait.values.slice(0, 5);

							return (
								<div
									key={trait.name}
									className="border border-border rounded-md overflow-hidden"
								>
									<button
										type="button"
										onClick={() => toggleExpanded(trait.name)}
										className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
									>
										<span className="font-mono text-xs uppercase tracking-wider text-foreground">
											{trait.name}
										</span>
										<div className="flex items-center gap-2">
											{selectedValue && (
												<Badge
													variant="secondary"
													className="rounded-md font-mono text-[10px] px-1.5 py-0"
												>
													{selectedValue}
												</Badge>
											)}
											{isExpanded ? (
												<ChevronUp className="w-4 h-4 text-muted-foreground" />
											) : (
												<ChevronDown className="w-4 h-4 text-muted-foreground" />
											)}
										</div>
									</button>
									{isExpanded && (
										<div className="p-2 space-y-1 bg-background">
											{visibleValues.map((value, idx) => {
												const isSelected = selectedValue === value;
												return (
													<button
														key={value}
														type="button"
														onClick={() => handleTraitClick(trait.name, value)}
														className={cn(
															"w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-all",
															isSelected
																? "bg-primary/10 text-primary"
																: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
														)}
													>
														<span className="font-mono">{value}</span>
														{trait.counts?.[idx] && (
															<span className="text-[10px] opacity-60">
																{trait.counts[idx]}
															</span>
														)}
													</button>
												);
											})}
											{trait.values.length > 5 && !isExpanded && (
												<p className="text-[10px] text-muted-foreground text-center py-1">
													+{trait.values.length - 5} more
												</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Active Filters Summary */}
			{hasActiveFilters.value && (
				<div className="pt-2 border-t border-border">
					<div className="flex flex-wrap gap-1">
						{Array.from(selectedTraits.value.entries()).map(([name, value]) => (
							<Badge
								key={name}
								variant="outline"
								className="rounded-md font-mono text-[10px] px-2 py-0.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
								onClick={() => handleTraitClick(name, value)}
							>
								{name}: {value}
								<X className="w-3 h-3 ml-1" />
							</Badge>
						))}
						{minPrice.value && (
							<Badge
								variant="outline"
								className="rounded-md font-mono text-[10px] px-2 py-0.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
								onClick={() => {
									minPrice.value = "";
									onFilterChange?.();
								}}
							>
								Min: {minPrice.value}
								<X className="w-3 h-3 ml-1" />
							</Badge>
						)}
						{maxPrice.value && (
							<Badge
								variant="outline"
								className="rounded-md font-mono text-[10px] px-2 py-0.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
								onClick={() => {
									maxPrice.value = "";
									onFilterChange?.();
								}}
							>
								Max: {maxPrice.value}
								<X className="w-3 h-3 ml-1" />
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CollectionFilters;

