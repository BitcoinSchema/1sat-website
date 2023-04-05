import Artifact from "@/components/artifact";
import OrdAddress from "@/components/ordAddress";
import { useWallet } from "@/context/wallet";
import { API_HOST } from "@/pages/_app";
import { head } from "lodash";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { toastErrorProps } from "..";

type OrdinalProps = {
  txid: string;
  vout: number;
};

const Ordinal: React.FC<OrdinalProps> = ({ txid, vout }) => {
  const { ordAddress, ordUtxos, transfer, fundingUtxos } = useWallet();

  const ord = useMemo(
    () => head(ordUtxos?.filter((a) => a.txid === txid && a.vout === vout)),
    [txid, vout, ordUtxos]
  );

  const fundingUtxo = useMemo(() => {
    return fundingUtxos?.sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1));
  }, [fundingUtxos]);

  useEffect(() => console.log({ ord, ordUtxos }), [ord, ordUtxos]);

  const adminControls = useMemo(() => {
    return (
      ord && (
        <div className="md:mt-0 mt-8 w-full">
          {ordAddress && <OrdAddress className="mb-4" />}
          <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col">
            <div className="flex justify-between items-center">
              <div>Transfer Ownership</div>
              <div
                className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
                onClick={async () => {
                  console.log("click send");
                  const address = prompt(
                    "Enter the Bitcoin address to send this ordinal to. MAKE SURE THE WALLET ADDRESS YOU'RE SENDNG TO UNDERSTANDS ORDINALS, AND EXPECTS TORECIEVE 1SAT ORDINALS AT THIS ADDRESS!"
                  );

                  if (address) {
                    console.log(
                      "transferring",
                      { ord },
                      "to",
                      { address },
                      "funded by",
                      { fundingUtxos }
                    );

                    try {
                      await transfer(ord, address);
                    } catch (e) {
                      toast.error("Something went wrong" + e, toastErrorProps);
                    }
                  }
                }}
              >
                Send
              </div>
            </div>
            {/* <div className="flex justify-between items-center mt-4">
        <div>Re-Inscribe</div>
        <div className="rounded bg-[#222] p-2" onClick={async () => {}}>
          SoonTm
        </div>
      </div> */}
          </div>
        </div>
      )
    );
  }, [ord, fundingUtxo, transfer, ordUtxos]);

  return (
    <div className="flex md:flex-row flex-col justify-between items-start w-full">
      <Artifact
        to={ord ? `/inscription/${ord.id}` : "#"}
        outPoint={ord ? `${ord.txid}_${ord.vout}` : undefined}
        src={ord ? `${API_HOST}/api/files/inscriptions/${ord.origin}` : ""}
        id={ord?.id}
        contentType={ord?.type}
      />
      <div className="ml-0 md:ml-4 w-full max-w-sm">{adminControls}</div>
    </div>
  );
};

export default Ordinal;
