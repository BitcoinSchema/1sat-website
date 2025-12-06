"use client";

import { SlidersHorizontal } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MarketFilterSidebar from "./FilterSidebar";

interface MarketLayoutProps {
	children: React.ReactNode;
}

export default function MarketLayout({ children }: MarketLayoutProps) {
	return (
		<div className="flex w-full bg-background font-mono h-full">
			{/* Desktop Sidebar - Fixed height, own scroll */}
			<div className="hidden lg:flex flex-shrink-0 h-full overflow-y-auto border-r border-border">
				<MarketFilterSidebar />
			</div>

			{/* Main Content - Scrolls independently */}
			<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
				{/* Mobile Filter + Search Bar */}
				<div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-background z-30 flex-shrink-0">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground"
							>
								<SlidersHorizontal className="w-4 h-4" />
								<span className="text-xs uppercase tracking-wider">
									Filters
								</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-screen max-w-none h-[100dvh]">
							<MarketFilterSidebar />
						</SheetContent>
					</Sheet>
					<div className="flex-1 sm:hidden">
						<SearchBar />
					</div>
				</div>

				{/* Content - This is the scrolling area */}
				<div className="flex-1 overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
