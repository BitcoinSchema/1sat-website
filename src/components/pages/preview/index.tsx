import Tabs, { Tab } from "@/components/tabs";
import { BroadcastResponsePayload, useWallet } from "@/context/wallet";
import { formatBytes } from "@/utils/bytes";
import { useLocalStorage } from "@/utils/storage";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy, FiDownload } from "react-icons/fi";
import { RxReset } from "react-icons/rx";
import { TbBroadcast } from "react-icons/tb";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { FetchStatus, toastErrorProps, toastProps } from "../../pages";

interface PageProps extends WithRouterProps {}

const PreviewPage: React.FC<PageProps> = ({}) => {
  const {
    pendingTransaction,
    fundingUtxos,
    getUTXOs,
    changeAddress,
    downloadPendingTx,
    usdRate,
    broadcastCache,
    setBroadcastCache,
    createdUtxos,
    setCreatedUtxos,
    setFundingUtxos,
    broadcastPendingTx,
    broadcastStatus,
  } = useWallet();

  const [broadcastResponsePayload, setBroadcastResponsePayload] =
    useLocalStorage<BroadcastResponsePayload>("1satbrs", undefined);

  const router = useRouter();

  useEffect(() => {
    const fire = async (a: string) => {
      try {
        await getUTXOs(a);
      } catch (e) {
        console.error({ e });
        toast.error("Error fetching UTXOs", toastErrorProps);
      }
    };

    if (changeAddress && broadcastStatus === FetchStatus.Success) {
      setTimeout(() => fire(changeAddress), 3000);
    }
  }, [getUTXOs, broadcastStatus, changeAddress]);

  const handleClickBroadcast = useCallback(async () => {
    if (pendingTransaction) {
      try {
        const response = await broadcastPendingTx(pendingTransaction);
        if (response) {
          console.log({ response });
          setBroadcastResponsePayload(response);
        }
      } catch (e) {
        console.error({ e });
        toast.error("Error broadcasting transaction", toastErrorProps);
      }
    }
  }, [pendingTransaction, broadcastPendingTx, setBroadcastResponsePayload]);

  const feeUsd = useMemo(() => {
    return usdRate && pendingTransaction
      ? `$${(pendingTransaction.fee / usdRate).toFixed(2)}`
      : undefined;
  }, [usdRate, pendingTransaction]);

  const totalUsd = useMemo(() => {
    return usdRate && pendingTransaction
      ? `$${(
          (pendingTransaction.fee +
            (pendingTransaction.marketFee || 0) +
            (pendingTransaction.price || 0)) /
          usdRate
        ).toFixed(2)}`
      : undefined;
  }, [usdRate, pendingTransaction]);

  useEffect(() => {
    if (!pendingTransaction) {
      router.push("/inscribe");
    }
  }, [router, pendingTransaction]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Tabs currentTab={Tab.Wallet} />

      {pendingTransaction && (
        <div>
          <h1 className="text-center text-2xl">
            {`${
              pendingTransaction.numOutputs === 1
                ? "Refund"
                : pendingTransaction.numOutputs === 2 &&
                  pendingTransaction.numInputs === 2
                ? "Transfer"
                : "Inscription"
            }
            Preview`}
          </h1>
          <div className="text-center text-[#aaa] mt-2">
            Broadcast to finalize.
          </div>

          <div className="w-full max-w-lg mx-auto h-[260px] whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs text-ellipsis overflow-hidden p-2 text-teal-700 mt-4 mb-8 relative">
            <span className="opacity-50 select-none">
              {pendingTransaction.rawTx?.slice(0, 888)}
            </span>
            <div className="p-2 md:p-6 absolute w-full text-white bg-transparent bottom-0 left-0 bg-gradient-to-t from-black from-60% to-transparent">
              <div className="font-semibold text-center text-sm text-[#aaa] mb-2 py-2">
                Transaction ID
              </div>
              <div className="rounded-full bg-[#222] border flex items-center justify-center text-center text-[9px] md:text-[11px] text-[#aaa] border-[#333] my-2 py-2">
                {pendingTransaction.txid}
              </div>
              <div className="px-2">
                <div className="flex justify-between mt-4">
                  <div>{pendingTransaction.numInputs} Inputs</div>
                  <div>{pendingTransaction.numOutputs} Outputs</div>
                </div>
                <div className="flex justify-between">
                  <div>Size</div>
                  <div>{formatBytes(pendingTransaction.rawTx.length / 2)}</div>
                </div>
                {(pendingTransaction.price || 0) > 0 && (
                  <div className="flex justify-between">
                    <div>Market Price</div>
                    <div>{toBitcoin(pendingTransaction.price || 0)} BSV</div>
                  </div>
                )}
                {pendingTransaction?.marketFee ? (
                  <div className="flex justify-between">
                    <div>Market Fee (4%)</div>
                    <div>
                      {pendingTransaction.marketFee <= 50000
                        ? `${pendingTransaction.marketFee.toLocaleString()} Satoshis`
                        : `${toBitcoin(pendingTransaction.marketFee)} BSV`}
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <div>Network Fee</div>
                  <div>{pendingTransaction.fee.toLocaleString()} Satoshis</div>
                </div>
                <div className="flex justify-between">
                  <div>Network Fee USD</div>
                  <div>{feeUsd}</div>
                </div>
                {pendingTransaction.fee && (
                  <div className="flex justify-between">
                    <div>Fee Rate</div>
                    <div>
                      {(
                        pendingTransaction.fee /
                        (pendingTransaction.rawTx?.length / 2)
                      ).toFixed(5)}{" "}
                      sat/B
                    </div>
                  </div>
                )}
                {pendingTransaction.iterations &&
                  pendingTransaction.iterations > 1 && (
                    <div className="flex justify-between">
                      <div>Iterations</div>{" "}
                      <div>{pendingTransaction.iterations}</div>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <div className="px-6 md:p-0 max-w-md mx-auto">
            <button
              onClick={handleClickBroadcast}
              className="w-full p-2 text-lg disabled:bg-[#333] text-black hover:bg-yellow-400 bg-yellow-500 rounded mb-4 font-semibold transition"
              disabled={broadcastStatus === FetchStatus.Loading}
            >
              <div className="mx-auto flex items-center justify-center">
                <TbBroadcast className="w-10" />
                <div>Broadcast {totalUsd}</div>
              </div>
            </button>

            <div className="flex items-center my-2">
              <CopyToClipboard
                text={pendingTransaction?.rawTx}
                onCopy={() => toast.success("Copied Raw Tx", toastProps)}
              >
                <button className="w-full p-1 hover:bg-[#444] bg-[#333] rounded hover:text-white text-sm flex items-center mr-1 transition">
                  <div className="mx-auto flex items-center justify-center">
                    <FiCopy className="w-10" />
                    <div>Copy Raw Tx</div>
                  </div>
                </button>
              </CopyToClipboard>

              <button
                className="w-full ml-1 p-1 hover:bg-[#444] bg-[#333] rounded hover:text-white text-sm flex items-center transition"
                onClick={downloadPendingTx}
              >
                <div className="mx-auto flex items-center justify-center">
                  <FiDownload className="w-10" />
                  <div>Download</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                // reset();
                // setShowInscribe(false);
                // // setShowWallet(false);
                Router.push("/inscribe");
              }}
              className="w-full p-2 text-lg hover:bg-[#333] bg-[#222] rounded my-4 font-semibold text-[#777] hover:text-white transition"
            >
              <div className="mx-auto flex items-center justify-center">
                <RxReset className="w-10" />
                <div>Start Over</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewPage;
