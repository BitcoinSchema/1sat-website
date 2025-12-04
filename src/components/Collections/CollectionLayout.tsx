"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import CollectionSidebar from "./CollectionSidebar";

interface CollectionLayoutProps {
	children: React.ReactNode;
	showBackLink?: boolean;
	collectionName?: string;
}

export default function CollectionLayout({ 
	children,
	showBackLink,
	collectionName,
}: CollectionLayoutProps) {
	return (
		<div className="flex w-full bg-background font-mono h-[calc(100vh-3.5rem)]">
			{/* Desktop Sidebar - Fixed height, own scroll */}
			<div className="hidden lg:flex flex-shrink-0 h-full overflow-y-auto border-r border-border">
				<CollectionSidebar 
					showBackLink={showBackLink}
					collectionName={collectionName}
				/>
			</div>

			{/* Main Content - Scrolls independently */}
			<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
				{/* Mobile Header */}
				<div className="lg:hidden flex items-center px-4 py-3 border-b border-border bg-background z-30 flex-shrink-0">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground"
							>
								<Menu className="w-4 h-4" />
								<span className="text-xs uppercase tracking-wider">Collections</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-[280px]">
							<CollectionSidebar 
								showBackLink={showBackLink}
								collectionName={collectionName}
							/>
						</SheetContent>
					</Sheet>
				</div>

				{/* Content - This is the scrolling area */}
				<div className="flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
}

