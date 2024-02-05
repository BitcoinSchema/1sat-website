import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { AssetType } from "@/constants";

const WalletPage = async ({ params }: { params: { tab: AssetType } }) => {
  return (
    <div className="mx-auto">
      {params.tab === AssetType.BSV20 || params.tab === AssetType.BSV21 ? <WalletBsv20 type={params.tab} /> : <WalletOrdinals />}
    </div>
  );

};

export default WalletPage;
