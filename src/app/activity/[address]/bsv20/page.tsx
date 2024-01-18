import WalletBsv20 from "@/components/Wallet/bsv20";

const AddressBsv20Page = ({ params }: { params: { address: string } }) => {
  return (
    <div className="mx-auto">
      <WalletBsv20 address={params.address} />
    </div>
  );
};

export default AddressBsv20Page;
