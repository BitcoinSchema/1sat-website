"use client";

import { Suspense } from "react";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import OrdinalListingSkeleton from "../skeletons/listing/Ordinal";
import View from "./view";

export enum OrdViewMode {
	Grid = "grid",
	List = "list",
}

interface OrdinalListingsProps {
	term?: string;
	address?: string;
	mode: OrdViewMode;
	onClick?: (outpoint: string) => Promise<void>;
}

const OrdinalListings: React.FC<OrdinalListingsProps> = ({
	term,
	address,
	mode,
	onClick,
}: OrdinalListingsProps) => {
	return (
		<div className="w-full h-full p-4 md:p-6">
			<div className="border border-border rounded-md overflow-hidden">
				<Table className="font-mono">
					{mode === OrdViewMode.List && (
						<TableHeader>
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="h-12 px-4 text-[10px] uppercase text-muted-foreground font-medium tracking-widest w-[100px]">
									Asset
								</TableHead>
								<TableHead className="h-12 px-4 text-[10px] uppercase text-muted-foreground font-medium tracking-widest">
									Inscription
								</TableHead>
								<TableHead className="h-12 px-4 text-[10px] uppercase text-muted-foreground font-medium tracking-widest hidden md:table-cell">
									Seller
								</TableHead>
								<TableHead className="h-12 px-4 text-right text-[10px] uppercase text-muted-foreground font-medium tracking-widest hidden md:table-cell w-36">
									Price
								</TableHead>
								<TableHead className="h-12 px-4 text-right text-[10px] uppercase text-muted-foreground font-medium tracking-widest w-[140px]">
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
					)}
					<Suspense fallback={<OrdinalListingSkeleton iterations={30} />}>
						<View term={term} address={address} mode={mode} onClick={onClick} />
					</Suspense>
				</Table>
			</div>
		</div>
	);
};

export default OrdinalListings;
