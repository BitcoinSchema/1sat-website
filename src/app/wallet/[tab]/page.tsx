import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletHistory from "@/components/Wallet/history";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { WalletTab } from "@/components/Wallet/tabs";

import { getCapitalizedAssetType } from "@/utils/assetType";

const WalletPage = async ({ params }: { params: Promise<{ tab: WalletTab }> }) => {
  const { tab } = await params;

  // Ordinals has its own sidebar layout - no wrapper padding needed
  if (tab === WalletTab.Ordinals) {
    return <WalletOrdinals />;
  }

  return (
    <div className="w-full flex-1 flex flex-col px-4 md:px-6 lg:px-8">
      {tab === WalletTab.BSV20 || tab === WalletTab.BSV21 ? (
        <WalletBsv20 type={tab} />
      ) : (
        <WalletHistory />
      )}
    </div>
  );
};

export default WalletPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tab: WalletTab }>;
}) {
  const { tab } = await params;
  const assetType = getCapitalizedAssetType(tab);

  return {
    title: `Manage ${assetType} Wallet - 1SatOrdinals`,
    description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
    openGraph: {
      title: `Manage ${assetType} Wallet - 1SatOrdinals`,
      description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Manage ${assetType} Wallet - 1SatOrdinals`,
      description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
    },
  };
}
