"use client"

import { toastProps } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { computed } from "@preact/signals-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { useCopyToClipboard } from 'usehooks-ts';
import Tooltip from "../tooltip";

type OrdAddressProps = {
  className?: string;
};

const OrdAddress: React.FC<OrdAddressProps> = ({ className }) => {

  const [value, copy] = useCopyToClipboard()

  return computed(() => (
    <div className="relative w-full">
      <div
        onClick={async () => {
          await copy(ordAddress.value || "")
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
                    value={ordAddress.value!}
                    className="w-full h-full rounded"
                    includeMargin={true}
                  />
                </div>
              )
            }
          >
            <div className="flex w-full flex-col text-left text-sm">
              <div>My Ordinal Address:</div>
              <div className="text-orange-400">{ordAddress.value}</div>
            </div>
            <div className="w-12 h-[2rem] text-gray-600 flex items-center justify-center">
              <FiCopy className="mx-auto" />
            </div>
          </Tooltip>
        </button>
      </div>
    </div>
  ));
};

export default OrdAddress;
