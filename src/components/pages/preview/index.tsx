import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { MAPI_HOST, WOC_HOST } from "@/pages/_app";
import { formatBytes } from "@/utils/bytes";
import { customFetch } from "@/utils/httpClient";
import { useLocalStorage } from "@/utils/storage";
import { P2PKHAddress, Transaction } from "bsv-wasm-web";
import { Utxo } from "js-1sat-ord";
import { uniq } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy, FiDownload } from "react-icons/fi";
import { RxReset } from "react-icons/rx";
import { TbBroadcast } from "react-icons/tb";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { FetchStatus, toastErrorProps, toastProps } from "../../pages";

type BroadcastResponse = {
  encoding: string;
  mimeType: string;
  payload: string;
  publicKey: string;
  signature: string;
  code?: number;
  status?: number;
  error?: string;
};

type BroadcastResponsePayload = {
  apiVersion: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  minerId: string;
  resultDescription: string;
  returnResult: string;
  timestamp: string;
  txSecondMempoolExpiry: number;
  txid: string;
};

type WocResult = {};
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
  } = useWallet();

  const [broadcastResponsePayload, setBroadcastResponsePayload] =
    useLocalStorage<BroadcastResponsePayload>("1satbrs", undefined);
  const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
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
    if (!fundingUtxos) {
      return;
    }
    console.log("click broadcast");
    if (!pendingTransaction?.rawTx) {
      return;
    }

    console.log({ pendingTransaction });
    setBroadcastStatus(FetchStatus.Loading);
    const body = Buffer.from(pendingTransaction.rawTx, "hex");
    const response = await fetch(`${MAPI_HOST}/mapi/tx`, {
      method: "POST",
      headers: {
        "Content-type": "application/octet-stream",
      },
      body,
    });

    try {
      const { promise } = customFetch<WocResult>(
        `${WOC_HOST}/v1/bsv/main/tx/raw`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            txhex: pendingTransaction.rawTx,
          }),
        }
      );
      const wocResponse = await promise;
      console.log("woc broadcast", wocResponse);
    } catch (e) {
      console.error("woc broadcast error", e);
    }
    const data: BroadcastResponse = await response.json();
    console.log({ data });

    if (data && data.payload) {
      const respData = JSON.parse(
        data.payload || "{}"
      ) as BroadcastResponsePayload;
      if (respData?.returnResult === "success") {
        toast.success("Broadcasted", toastProps);
        setBroadcastCache(
          uniq([...(broadcastCache || []), pendingTransaction.inputTxid]).slice(
            0,
            10
          )
        );

        setBroadcastStatus(FetchStatus.Success);
        setBroadcastResponsePayload(respData);

        if (changeAddress) {
          // keep the utxo created
          // we assume the last output is change and make a utxo from it
          const pendingTx = Transaction.from_hex(pendingTransaction.rawTx);
          const changeOut = pendingTx.get_output(pendingTx.get_noutputs() - 1);
          const address = P2PKHAddress.from_string(changeAddress).to_string();
          const createdUtxo = {
            satoshis: Number(changeOut?.get_satoshis()),
            vout: pendingTx.get_noutputs() - 1,
            txid: pendingTx.get_id_hex(),
            script: P2PKHAddress.from_string(address)
              .get_locking_script()
              .to_asm_string(),
          } as Utxo;
          console.log({ createdUtxo });
          const cu = [
            ...createdUtxos.filter(
              (u) => u.txid === pendingTransaction.inputTxid
            ),
            createdUtxo,
          ];

          setCreatedUtxos(cu);
          setFundingUtxos([
            ...fundingUtxos.filter((u) => {
              if (u.txid === pendingTransaction.inputTxid) {
                return false;
              }
              return true;
            }),
            createdUtxo,
          ]);
        }

        // setOrdUtxos([...(ordUtxos || []), pendingOrdUtxo]);
        if (pendingTransaction.contentType !== "application/bsv-20") {
          Router.push("/bsv20");
        } else {
          Router.push("/ordinals");
        }
        return;
      } else {
        toast.error(
          "Failed to broadcast " + respData.resultDescription,
          toastErrorProps
        );
      }
      if (
        changeAddress &&
        respData.resultDescription === "ERROR: 258: txn-mempool-conflict"
      ) {
        console.log("adding to broadcast cache", pendingTransaction.txid);
        // todo add input tx not this txid!!
        setBroadcastCache(
          uniq([...(broadcastCache || []), pendingTransaction.inputTxid]).slice(
            0,
            10
          )
        );
      }
      setBroadcastStatus(FetchStatus.Error);
    } else if (data && data.error) {
      toast("Failed to broadcast: " + data.error, toastErrorProps);
      setBroadcastStatus(FetchStatus.Error);
    }
  }, [
    //pendingOrdUtxo,
    // ordUtxos,
    changeAddress,
    setBroadcastCache,
    pendingTransaction,
    setBroadcastResponsePayload,
    fundingUtxos,
    broadcastCache,
    setCreatedUtxos,
    createdUtxos,
    setFundingUtxos,
  ]);

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
                {pendingTransaction.price && (
                  <div className="flex justify-between">
                    <div>Market Price</div>
                    <div>{toBitcoin(pendingTransaction.price || 0)} BSV</div>
                  </div>
                )}
                {pendingTransaction.marketFee && (
                  <div className="flex justify-between">
                    <div>Market Fee (4%)</div>
                    <div>
                      {pendingTransaction.marketFee <= 50000
                        ? `${pendingTransaction.marketFee.toLocaleString()} Satoshis`
                        : `${toBitcoin(pendingTransaction.marketFee || 0)} BSV`}
                    </div>
                  </div>
                )}
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
