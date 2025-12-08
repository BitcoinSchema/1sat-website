"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet } from "lucide-react";

const tabs = [
  { value: "overview", label: "Wallet", href: "/wallet", icon: Wallet },
  { value: "ordinals", label: "Ordinals", href: "/wallet/ordinals" },
  { value: "bsv20", label: "BSV20", href: "/wallet/bsv20" },
  { value: "bsv21", label: "BSV21", href: "/wallet/bsv21" },
  { value: "history", label: "History", href: "/wallet/history" },
];

interface WalletTabsProps {
  children?: ReactNode;
}

export function WalletTabs({ children }: WalletTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sortedTabs = [...tabs].sort((a, b) => b.href.length - a.href.length);

  // Determine the active tab based on the current pathname
  const activeTab =
    sortedTabs.find((tab) => pathname.startsWith(tab.href))?.value || "overview";

  return (
    <>
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(value) => {
          const tab = tabs.find((t) => t.value === value);
          if (tab) {
            router.push(tab.href);
          }
        }}
        className="w-full"
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </>
  );
}

