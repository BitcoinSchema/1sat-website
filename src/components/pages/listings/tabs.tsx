"use client";

import { AssetType } from "@/constants";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

const ListingsTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
  const router = useRouter();

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => router.push(`/listings/${value}`)}
    >
      <TabsList className="ml-4">
        <TabsTrigger value={AssetType.Ordinals}>Ordinals</TabsTrigger>
        <TabsTrigger value={AssetType.BSV20}>BSV20</TabsTrigger>
        <TabsTrigger value={AssetType.LRC20}>LRC20</TabsTrigger>
        <TabsTrigger value={AssetType.BSV21}>BSV21</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ListingsTabs;
