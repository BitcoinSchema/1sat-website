"use client";

import { Activity, Book, Coins, Hammer, Pickaxe, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

// Custom 1Sat Icon in Lucide style
const OneSatIcon = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<title>1Sat Icon</title>
		<circle cx="12" cy="12" r="10" />
		<circle cx="12" cy="12" r="6" />
		<circle cx="12" cy="12" r="2" />
	</svg>
);

const navData = [
	{
		title: "Application",

		items: [
			{
				title: "Activity",

				url: "/activity",

				icon: Activity,

				shortcut: "g a",
			},
		],
	},

	{
		title: "Market",

		items: [
			{
				title: "Ordinals",

				url: "/market/ordinals",

				icon: OneSatIcon,

				shortcut: "g m",
			},

			{
				title: "BSV20",

				url: "/market/bsv20",

				icon: Coins,

				shortcut: "g b",
			},

			{
				title: "BSV21",

				url: "/market/bsv21",

				icon: Coins,

				shortcut: "g v",
			},
		],
	},

	{
		title: "Services",

		items: [
			{
				title: "Inscribe",

				url: "/inscribe",

				icon: Hammer,

				shortcut: "g i",
			},

			{
				title: "Mine",

				url: "/mine",

				icon: Pickaxe,

				shortcut: "g e",
			},
		],
	},

	{
		title: "System",

		items: [
			{
				title: "Documentation",

				url: "/docs",

				icon: Book,

				shortcut: "g d",
			},

			{
				title: "Settings",

				url: "/settings",

				icon: Settings,

				shortcut: "g s",
			},
		],
	},
];

export function LeftSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
									<Image
										src="/oneSatLogoDark.svg"
										alt="1Sat"
										width={24}
										height={24}
									/>
								</div>

								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">1Sat Ordinals</span>

									<span className="truncate text-xs">Marketplace</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{navData.map((group) => (
					<SidebarGroup key={group.title}>
						<SidebarGroupLabel>{group.title}</SidebarGroupLabel>

						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild tooltip={item.title}>
											<Link href={item.url}>
												<item.icon className="h-4 w-4" />

												<span>{item.title}</span>

												{item.shortcut && (
													<span className="ml-auto text-xs tracking-widest text-muted-foreground group-data-[collapsible=icon]:hidden hidden md:block">
														{item.shortcut}
													</span>
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarRail />
		</Sidebar>
	);
}
