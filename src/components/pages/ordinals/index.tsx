import OrdAddress from "@/components/ordAddress";
import Tabs, { Tab } from "@/components/tabs";
import { useOrdinals } from "@/context/ordinals";
import { ORDS_PER_PAGE, useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { FetchStatus } from "..";
import Ordinals from "./list";

interface PageProps extends WithRouterProps {}

const OrdinalsPage: React.FC<PageProps> = ({}) => {
  const {
    ordAddress,
    payPk,
    ordPk,
    ordUtxos,
    fetchOrdinalUtxosStatus,
    setFetchOrdinalUtxosStatus,
  } = useWallet();
  const { stats, fetchStatsStatus } = useOrdinals();
  const router = useRouter();
  const { page, sort } = router.query;

  const currentPage = useMemo(() => {
    return typeof page === "string" ? parseInt(page) : 1;
  }, [page]);

  const currentSort = useMemo(() => {
    return typeof sort === "string" ? parseInt(sort) : 0;
  }, [sort]);

  const from = useMemo(() => {
    return (currentPage - 1) * ORDS_PER_PAGE + 1;
  }, [currentPage]);

  const to = useMemo(() => {
    return from + (ordUtxos?.length ? ordUtxos.length - 1 : 0);
  }, [ordUtxos, from]);

  const toggleSort = useCallback(() => {
    Router.push(`/ordinals/?sort=${currentSort === 1 ? 0 : 1}`);
  }, [currentSort]);

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

        {ordAddress && <OrdAddress />}

        <div
          className={`${"my-12"} max-w-7xl mx-auto w-[calc(100vw-4rem)] min-h-[300px]`}
        >
          {
            <div className="my-2 text-lg flex justify-between items-center">
              <div>
                Ordinals {ordUtxos?.length || 0 > 0 ? `${from} - ${to}` : ``}
              </div>
              <div
                className="flex items-center cursor-pointer"
                onClick={toggleSort}
              >
                {currentSort === 0 ? (
                  <FiArrowDown className="mr-2" />
                ) : (
                  <FiArrowUp className="mr-2" />
                )}{" "}
                Sort
              </div>
            </div>
          }

          <Ordinals currentPage={currentPage} />
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
