"use client";

import {
	AtSign,
	CircleDollarSign,
	Fingerprint,
	Gem,
	History,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSound } from "@/hooks/use-sound";

const tabs = [
	{ value: "overview", label: "Wallet", href: "/wallet", icon: Wallet },
	{ value: "ordinals", label: "Ordinals", href: "/wallet/ordinals", icon: Gem },
	{ value: "opns", label: "OpNS", href: "/wallet/opns", icon: AtSign },
	{
		value: "identity",
		label: "Identity",
		href: "/wallet/identity",
		icon: Fingerprint,
	},
	{
		value: "certificates",
		label: "Certificates",
		href: "/wallet/certificates",
		icon: ShieldCheck,
	},
	{
		value: "bsv21",
		label: "BSV21",
		href: "/wallet/bsv21",
		icon: CircleDollarSign,
	},
	{
		value: "history",
		label: "History",
		href: "/wallet/history",
		icon: History,
	},
];

interface WalletTabsProps {
	children?: ReactNode;
}

export function WalletTabs({ children }: WalletTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { play } = useSound();

	const sortedTabs = [...tabs].sort((a, b) => b.href.length - a.href.length);

	// Determine the active tab based on the current pathname
	const activeTab =
		sortedTabs.find((tab) => pathname.startsWith(tab.href))?.value ||
		"overview";

	return (
		<>
			<Tabs
				defaultValue={activeTab}
				value={activeTab}
				onValueChange={(value) => {
					const tab = tabs.find((t) => t.value === value);
					if (tab) {
						play("click");
						router.push(tab.href);
					}
				}}
				className="w-full"
			>
				<TabsList>
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="flex items-center gap-1.5"
							title={tab.label}
							aria-label={tab.label}
						>
							{tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
							{/* icon-only on mobile so the tab row fits the viewport */}
							<span className="hidden sm:inline">{tab.label}</span>
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			{children}
		</>
	);
}
