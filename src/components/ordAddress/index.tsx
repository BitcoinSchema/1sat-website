import { useWallet } from "@/context/wallet";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { toastProps } from "../pages";

type OrdAddressProps = {
  className?: string;
};

const OrdAddress: React.FC<OrdAddressProps> = ({ className }) => {
  const { ordAddress } = useWallet();

  return (
    <CopyToClipboard
      text={ordAddress || ""}
      onCopy={() => {
        toast.success("Copied. Send ordinals only!", toastProps);
      }}
    >
      <button
        disabled={!ordAddress}
        className={`w-full flex rounded p-2 transition bg-[#111] hover:bg-[#222] justify-between mx-auto items-center text-gray-600 max-w-lg ${
          className ? className : ""
        }`}
      >
        <div className="flex w-full flex-col text-left text-sm">
          <div>My Ordinal Address:</div>
          <div className="text-orange-400">{ordAddress}</div>
        </div>
        <div className="w-12 h-[2rem] text-gray-600 flex items-center justify-center h-full">
          <FiCopy className="mx-auto" />
        </div>
      </button>
    </CopyToClipboard>
  );
};

export default OrdAddress;
