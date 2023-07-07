import { useWallet } from "@/context/wallet";
import { QRCodeSVG } from "qrcode.react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { toastProps } from "../pages";
import Tooltip from "../tooltip";

type OrdAddressProps = {
  className?: string;
};

const OrdAddress: React.FC<OrdAddressProps> = ({ className }) => {
  const { ordAddress } = useWallet();

  return (
    <div className="relative w-full">
      <CopyToClipboard
        text={ordAddress || ""}
        onCopy={() => {
          toast.success("Copied. Send ordinals only!", toastProps);
        }}
      >
        <button
          disabled={!ordAddress}
          className={`w-full relative flex rounded p-2 transition bg-[#111] hover:bg-[#222] justify-between mx-auto items-center text-gray-600 max-w-lg ${
            className ? className : ""
          }`}
        >
          <Tooltip
            className="w-full justify-between items-center rounded"
            message={
              ordAddress && (
                <div>
                  <div className="p-2 w-64">SEND ORDINALS ONLY!</div>
                  <QRCodeSVG
                    value={ordAddress}
                    className="w-full h-full rounded"
                    includeMargin={true}
                  />
                </div>
              )
            }
          >
            <div className="flex w-full flex-col text-left text-sm">
              <div>My Ordinal Address:</div>
              <div className="text-orange-400">{ordAddress}</div>
            </div>
            <div className="w-12 h-[2rem] text-gray-600 flex items-center justify-center h-full">
              <FiCopy className="mx-auto" />
            </div>
          </Tooltip>
        </button>
      </CopyToClipboard>
    </div>
  );
};

export default OrdAddress;
