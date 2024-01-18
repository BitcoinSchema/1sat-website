import { fundingAddress } from "@/signals/wallet/address";
import { QRCodeSVG } from "qrcode.react";

const Deposit = () => {
  return (
    <div className="">
      <h1 className="font-semibold text-lg">Deposit</h1>
      <p className="p-2 rounded text-sm">Address: {fundingAddress}</p>
      <QRCodeSVG
        value={fundingAddress.value || ""}
        className="w-full  h-full mx-auto"
        includeMargin={true}
      />
    </div>
  );
};

export default Deposit;
