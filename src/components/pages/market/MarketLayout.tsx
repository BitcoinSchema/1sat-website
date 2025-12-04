"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
				{/* Mobile Header with Sheet trigger */}
				<div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="rounded-md text-muted-foreground hover:text-foreground"
							>
								<Menu className="w-5 h-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-[280px]">
							<MarketFilterSidebar />
						</SheetContent>
					</Sheet>
					<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
						ORDINALS_MARKET
					</span>
					<div className="w-8" />
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
}
