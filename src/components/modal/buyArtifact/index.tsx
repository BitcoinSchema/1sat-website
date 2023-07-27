import { useOrdinals } from "@/context/ordinals";
import { IoMdWarning } from "react-icons/io";
import { toBitcoin } from "satoshi-bitcoin-ts";

interface BuyArtifactModalProps {
  onClose: () => void;
  outPoint: string;
  price: number;
  content: React.ReactNode;
}

const BuyArtifactModal: React.FC<BuyArtifactModalProps> = ({
  onClose,
  outPoint,
  price,
  content,
}) => {
  const { buyArtifact } = useOrdinals();

  return (
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-96">{content}</div>
        <div className="rounded mb-4 p-2 text-xs text-[#777]">
          <h1>License</h1>
          <IoMdWarning className="inline-block mr-2" />
          You are about to purchase this inscription, granting you ownership and
          control of the associated token. This purchase does not include a
          license to any artwork or IP that may be depicted here and no rights
          are transferred to the purchaser unless specified explicitly within
          the transaction itself.
        </div>

        <button
          className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white"
          onClick={() => outPoint && buyArtifact(outPoint)}
        >
          Buy - {price && price > 0 ? toBitcoin(price) : 0} BSV
        </button>
      </div>
    </div>
  );
};

export default BuyArtifactModal;
