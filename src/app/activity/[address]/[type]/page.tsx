import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { AssetType } from "@/constants";

const AddressPage = ({ params }: { params: { address: string, type: AssetType } }) => {
  return (
    <div className="mx-auto">
      <h1 className="text-3xl font-bold mb-4">Address: {params.address}</h1>
      {params.type === AssetType.BSV20 || params.type === AssetType.BSV20V2 ? <WalletBsv20 address={params.address} type={params.type} /> : <WalletOrdinals address={params.address} />}
    </div>
  );
};

export default AddressPage;
