"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import WalletSidebar from "./WalletSidebar";
import { WalletTab } from "./tabs";

interface WalletLayoutProps {
	children: React.ReactNode;
	tab: WalletTab;
	address?: string;
	// For ordinals - pass counts and outpoints for filter
	filterProps?: {
		counts?: Record<string, number>;
		ordinalOutpoints?: string[];
	};
}

export default function WalletLayout({ 
	children, 
	tab, 
	address,
	filterProps 
}: WalletLayoutProps) {
	return (
		<div className="flex w-full bg-background font-mono" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
			{/* Desktop Sidebar - Sticky */}
			<div className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] flex-shrink-0">
				<WalletSidebar 
					tab={tab} 
					address={address} 
					counts={filterProps?.counts}
					ordinalOutpoints={filterProps?.ordinalOutpoints}
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile Header */}
				<div className="lg:hidden flex items-center px-4 py-3 border-b border-border sticky top-14 bg-background z-30">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground"
							>
								<Menu className="w-4 h-4" />
								<span className="text-xs uppercase tracking-wider">Menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-[280px]">
							<WalletSidebar 
								tab={tab} 
								address={address}
								counts={filterProps?.counts}
								ordinalOutpoints={filterProps?.ordinalOutpoints}
							/>
						</SheetContent>
					</Sheet>
				</div>

				{/* Content */}
				<div className="flex-1">
					{children}
				</div>
			</div>
		</div>
	);
}

