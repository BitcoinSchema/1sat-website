"use client";

import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { ChevronDown, Filter as FilterIcon, Terminal } from "lucide-react";
import toast from "react-hot-toast";
import { ArtifactType, artifactTypeMap } from "@/components/artifact";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Filter = () => {
	useSignals();

	return (
		<div className="flex items-center gap-2">
			<span className="text-[10px] uppercase text-muted-foreground tracking-widest font-mono hidden md:inline">
				Filter:
			</span>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 bg-background border border-border hover:border-primary hover:text-primary transition-colors rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring group">
					<FilterIcon className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
					<span className="text-xs font-mono uppercase tracking-wider text-foreground group-hover:text-primary">
						{selectedType.value || "All"}
					</span>
					<ChevronDown className="w-3 h-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="w-48 bg-popover border border-border rounded-none p-0 shadow-lg"
				>
					{Object.values(ArtifactType)
						.filter((value) => !excludeTypes.includes(value as ArtifactType))
						.map((value) => (
							<DropdownMenuItem
								key={`filter-${value}`}
								onClick={() => changeFilter(value as ArtifactType)}
								className="rounded-none focus:bg-primary/20 focus:text-primary text-muted-foreground text-xs uppercase font-mono tracking-wider cursor-pointer py-3 border-l-2 border-transparent focus:border-primary"
							>
								<Terminal className="w-3 h-3 mr-2 opacity-50" />
								{value}
							</DropdownMenuItem>
						))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default Filter;

export const selectedType = new Signal<ArtifactType | null>(null);
export const changeFilter = (type: ArtifactType) => {
	const str = artifactTypeMap.get(type);
	toast.success(`Filtering by ${type} ${str ? str : ""}`);
	selectedType.value = type;
};

const excludeTypes = [ArtifactType.BSV20];
