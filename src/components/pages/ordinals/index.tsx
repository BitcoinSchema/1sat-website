import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
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

  useEffect(() => {
    const fire = async (a: string) => {
      await getOrdinalUTXOs(a);
    };
    if (ordAddress && fetchOrdinalUtxosStatus === FetchStatus.Idle) {
      fire(ordAddress);
    }
  }, [getOrdinalUTXOs, ordAddress, fetchOrdinalUtxosStatus]);

  // const ordinals = useMemo(() => {
  //   return ordUtxos?.filter((a) => !a.type);
  // }, [ordUtxos]);
  const [ordinals, setOrdinals] = useState<OrdUtxo[] | undefined>();

  useEffect(() => {
    const fire = async (ords: OrdUtxo[]) => {
      for (let o of ords) {
        if (o.origin) {
          const art = await getArtifactsByTxId(o.origin);
          let ords: OrdUtxo[] = [];
          for (let u of art) {
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
              key={`${a.txid}_${a.vout}`}
              outPoint={`${a.txid}_${a.vout}`}
              contentType={a.type}
              classNames={{ wrapper: "max-w-72 max-h-72 overflow-hidden" }}
            />
          );
        }) || [];

      return ordUtxos
        ?.filter((a) => !!a.type)
        .map((a) => {
          return (
            <Artifact
              key={`${a.txid}_${a.vout}`}
              outPoint={`${a.txid}_${a.vout}`}
              contentType={a.type}
              classNames={{ wrapper: "max-w-72 max-h-72 overflow-hidden" }}
            />
          );
        })
        .concat(ordinalArtifacts);
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

      <div>
        {fetchOrdinalUtxosStatus === FetchStatus.Loading && (
          <div className="w-full my-12 max-w-4xl mx-auto text-center">
            <LoaderIcon className="mx-auto" />
          </div>
        )}

        {fetchOrdinalUtxosStatus !== FetchStatus.Loading &&
          (!payPk || !ordPk) && (
            <div
              className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8"
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

        <div className="p-2 w-full my-12 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
          {artifacts}
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
