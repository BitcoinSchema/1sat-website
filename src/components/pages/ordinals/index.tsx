import OrdAddress from "@/components/ordAddress";
import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import React from "react";
import { FetchStatus } from "..";
import Ordinals from "./list";
import Ordinal from "./single";

interface PageProps extends WithRouterProps {}

const OrdinalsPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { location } = router.query;
  const parts = (location as string)?.split("_");
  const txid = parts?.length ? parts[0] : undefined;
  const vout = parts?.length == 2 && parts[1] ? parseInt(parts[1]) : 0;

  const {
    ordAddress,
    payPk,
    ordPk,
    ordUtxos,
    fetchOrdinalUtxosStatus,
    setFetchOrdinalUtxosStatus,
  } = useWallet();

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
      <Tabs
        currentTab={Tab.Ordinals}
        onClickSelected={() =>
          fetchOrdinalUtxosStatus === FetchStatus.Loading
            ? () => {}
            : setFetchOrdinalUtxosStatus(FetchStatus.Idle)
        }
        showIndicator={fetchOrdinalUtxosStatus !== FetchStatus.Loading}
      />

      <div className="p-4">
        {fetchOrdinalUtxosStatus !== FetchStatus.Loading &&
          (!payPk || !ordPk) && (
            <div
              className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
              onClick={() => Router.push("./wallet")}
            >
              You need a wallet first.
            </div>
          )}
        {fetchOrdinalUtxosStatus === FetchStatus.Success &&
          ordUtxos?.length === 0 &&
          payPk &&
          ordPk && (
            <div className="max-w-md rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8 my-8">
              You, sadly, have no artifacts.
            </div>
          )}
        {/* 

<button className="w-full p-2 text-lg bg-orange-400 rounded my-4 text-black font-semibold flex items-center">
                <div className="mx-auto flex items-center justify-center">
                  <FiCopy className="w-10" />
                  <div>Copy BSV Address</div>
                </div>
              </button>
               */}

        {!txid && ordAddress && <OrdAddress />}

        <div
          className={`${
            txid ? "" : "my-12"
          } max-w-7xl mx-auto w-[calc(100vw-4rem)] min-h-[300px]`}
        >
          {txid ? <Ordinal txid={txid} vout={vout} /> : <Ordinals />}
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
