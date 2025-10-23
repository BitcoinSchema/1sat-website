import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletHistory from "@/components/Wallet/history";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { WalletTab } from "@/components/Wallet/tabs";
import { getCapitalizedAssetType } from "@/utils/assetType";
import { Noto_Serif } from "next/font/google";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const AddressPage = async ({
  params,
}: {
  params: Promise<{ address: string; type: WalletTab }>;
}) => {
  const { address, type } = await params;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <h1 className={`text-lg md:text-3xl font-bold md:mb-4 ${notoSerif.className}`}>
        Address
      </h1>
      <h2 className="text-sm md:text-xl font-semibold mb-4 md:mb-8">
        {address}
      </h2>
      {type === WalletTab.BSV20 ||
        type === WalletTab.BSV21 ? (
        <WalletBsv20 address={address} type={type} />
      ) : type === WalletTab.Ordinals ? (
        <WalletOrdinals address={address} />
      ) : (
        <WalletHistory address={address} />
      )}
    </div>
  );
};

export default AddressPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string; type: WalletTab }>;
}) {
  const { address, type } = await params;
  const assetType = getCapitalizedAssetType(type);

  return {
    title: `${assetType} activity for address ${address}`,
    description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
    openGraph: {
      title: `${assetType} activity for address ${address}`,
      description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${assetType} activity for address ${address}`,
      description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
    },
  };
}
