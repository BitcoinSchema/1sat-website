import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import { useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast, { LoaderIcon } from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const OrdinalsPage: React.FC<PageProps> = ({ router }) => {
  const {
    ordAddress,
    fetchOrdinalUtxosStatus,
    setFetchOrdinalUtxosStatus,
    payPk,
    ordPk,
    ordUtxos,
    getOrdinalUTXOs,
    getArtifactsByTxId,
  } = useWallet();

  // const ordinals = useMemo(() => {
  //   return ordUtxos?.filter((a) => !a.type);
  // }, [ordUtxos]);
  const [ordinals, setOrdinals] = useState<OrdUtxo[] | undefined>();

  useEffect(() => {
    const fire = async (ords: OrdUtxo[]) => {
      for (let o of ords) {
        console.log({ o });
        if (o.origin) {
          const art = await getArtifactsByTxId(o.origin);
          console.log("art", art);
          let ords: OrdUtxo[] = [];
          for (let u of art) {
            console.log("filling", u);
            let filledU = await fillContentType(u);
            if (filledU.type) {
              ords.push(filledU);
            }
          }
          console.log({ ords });
          setOrdinals(ords);
        }
      }
    };
    console.log({ ordUtxos });
    const typeLess = ordUtxos?.filter((a) => !a.type);
    if (typeLess && typeLess?.length > 0) {
      // look them up
      fire(typeLess);
    }
  }, [ordUtxos, setOrdinals, getArtifactsByTxId]);

  const artifacts = useMemo(() => {
    {
      const ordinalArtifacts =
        ordinals?.map((a) => {
          return (
            <Artifact
              //key={`${a.txid}_${a.vout}`}
              //outPoint={`${a.txid}_${a.vout}`}
              key={a.origin || `${a.txid}_${a.vout}`}
              outPoint={a.origin || `${a.txid}_${a.vout}`}
              contentType={a.type}
              id={a.id}
              to={
                a.id !== undefined
                  ? `/inscription/${a.id}`
                  : `/tx/${a.origin}` || `/tx/${a.txid}_${a.vout}`
              }
              classNames={{ wrapper: "max-w-72 max-h-72 overflow-hidden mb-2" }}
            />
          );
        }) || [];

      return (
        ordUtxos
          ?.filter((a) => !!a.type)
          .map((a) => {
            return (
              <Artifact
                key={a.origin || `${a.txid}_${a.vout}`}
                outPoint={a.origin || `${a.txid}_${a.vout}`}
                contentType={a.type}
                id={a.id}
                to={
                  a.id !== undefined
                    ? `/inscription/${a.id}`
                    : `/tx/${a.origin}` || `/tx/${a.txid}_${a.vout}`
                }
                classNames={{
                  wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
                }}
              />
            );
          }) || []
      ).concat(ordinalArtifacts);
    }
  }, [ordinals, ordUtxos]);

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
        {fetchOrdinalUtxosStatus === FetchStatus.Loading && (
          <div className="w-full my-12 max-w-4xl mx-auto text-center">
            <LoaderIcon className="mx-auto" />
          </div>
        )}

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

        {ordAddress && (
          <CopyToClipboard
            text={ordAddress}
            onCopy={() => {
              toast.success("Copied. Send ordinals only!", {
                style: {
                  background: "#333",
                  color: "#fff",
                },
              });
            }}
          >
            <button className="w-full flex rounded p-2 transition bg-[#111] hover:bg-[#222] justify-between items-center text-gray-600 max-w-lg ">
              <div className="flex w-full flex-col text-left text-sm">
                <div>Ordinal Address:</div>
                <div className="text-orange-400">{ordAddress}</div>
              </div>
              <div className="w-12 h-[2rem] text-gray-600 flex items-center justify-center h-full">
                <FiCopy className="mx-auto" />
              </div>
            </button>
          </CopyToClipboard>
        )}

        <div className="w-full my-12 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto w-[calc(100vw-4rem)] min-h-[300px]">
          {artifacts}
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
