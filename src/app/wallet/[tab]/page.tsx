import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletHistory from "@/components/Wallet/history";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { WalletTab } from "@/components/Wallet/tabs";

import { getCapitalizedAssetType } from "@/utils/assetType";

// Wallet pages are client-rendered — build them statically and 404 anything
// that isn't a known tab (e.g. /wallet/[object Object]) without invoking a
// serverless function
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(WalletTab).map((tab) => ({ tab }));
}

const WalletPage = async ({ params }: { params: { tab: WalletTab } }) => {
  return (
    <div className="mx-auto">
      {params.tab === WalletTab.BSV20 ||
        params.tab === WalletTab.BSV21 ? (
        <WalletBsv20 type={params.tab} />
      ) : params.tab === WalletTab.Ordinals ? (
        <WalletOrdinals />
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
  params: { tab: WalletTab };
}) {
  const { tab } = params;
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
