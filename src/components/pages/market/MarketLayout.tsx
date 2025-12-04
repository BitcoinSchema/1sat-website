"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import MarketFilterSidebar from "./FilterSidebar";

interface MarketLayoutProps {
	children: React.ReactNode;
}

export default function MarketLayout({ children }: MarketLayoutProps) {
	return (
		<div className="flex h-full w-full bg-background font-mono overflow-hidden">
			{/* Desktop Sidebar */}
			<div className="hidden lg:block h-full">
				<MarketFilterSidebar />
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Mobile Filter Bar */}
				<div className="lg:hidden flex items-center px-4 py-2 border-b border-border">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground"
							>
								<SlidersHorizontal className="w-4 h-4" />
								<span className="text-xs uppercase tracking-wider">Filters</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-[280px]">
							<MarketFilterSidebar />
						</SheetContent>
					</Sheet>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
}
