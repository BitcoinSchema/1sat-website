"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WalletTabs({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	// Determine active tab from URL
	const segment = pathname?.split("/").pop();
	// If path is /wallet, segment is 'wallet', default to 'overview'
	const currentTab = segment === "wallet" ? "overview" : segment;

	const handleTabChange = (value: string) => {
		if (value === "overview") {
			router.push("/wallet");
		} else {
			router.push(`/wallet/${value}`);
		}
	};

	return (
		<Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="ordinals">Ordinals</TabsTrigger>
				<TabsTrigger value="bsv20">BSV20</TabsTrigger>
				<TabsTrigger value="bsv21">BSV21</TabsTrigger>
			</TabsList>
			<div className="mt-4">{children}</div>
		</Tabs>
	);
}
