"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
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

  // Determine the active tab based on the current pathname
  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.href))?.value || "ordinals";

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
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </>
  );
}

