import OrdAddress from "@/components/ordAddress";
import Tabs, { Tab } from "@/components/tabs";
import { EncryptDecrypt, useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import React, { useCallback, useState } from "react";
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
    encryptedBackup,
    setShowEnterPassphrase,
  } = useWallet();

  const [sort, setSort] = useState<boolean>(false);

  const toggleSort = useCallback(() => setSort(!sort), [sort]);

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
              className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] text-[#aaa] cursor-pointer mx-auto p-4 md:p-8"
              onClick={() => {
                if (encryptedBackup) {
                  setShowEnterPassphrase(EncryptDecrypt.Decrypt);
                }
                Router.push("./wallet");
              }}
            >
              {encryptedBackup
                ? "Your wallet is encrypted. Enter your passphrase to unlock it."
                : "You need a wallet first."}
            </div>
          )}

        {ordAddress && <OrdAddress />}

        <div
          className={`${"my-12"} max-w-7xl mx-auto w-[calc(100vw-4rem)] min-h-[300px]`}
        >
          {
            <div className="my-2 text-lg flex justify-between items-center">
              <div>{ordUtxos?.length} Ordinals</div>
              <div
                className="flex items-center cursor-pointer"
                onClick={toggleSort}
              >
                {sort ? (
                  <FiArrowDown className="mr-2" />
                ) : (
                  <FiArrowUp className="mr-2" />
                )}{" "}
                Sort
              </div>
            </div>
          }
          {fetchOrdinalUtxosStatus === FetchStatus.Success &&
            ordUtxos?.length === 0 &&
            payPk &&
            ordPk && (
              <div className="max-w-md rounded bg-[#222] cursor-pointer mx-auto p-8 my-8">
                You, sadly, have no artifacts.
              </div>
            )}
          <Ordinals sort={sort} />
        </div>
      </div>
    </>
  );
};

export default OrdinalsPage;
