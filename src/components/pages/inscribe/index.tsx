import Inscribe from "@/components/pages/inscribe/inscribe";
import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";
import React from "react";

interface PageProps extends WithRouterProps {}

const InscribePage: React.FC<PageProps> = ({ router }) => {
  const { payPk, fundingUtxos } = useWallet();
  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Inscribe</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs currentTab={Tab.Inscribe} />
      {payPk && fundingUtxos && <Inscribe />}
      <div className="p-2 md:p-4">
        {(!payPk || !fundingUtxos) && (
          <div
            className="rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
            onClick={() => Router.push("./wallet")}
          >
            You need funds to inscribe. Check your wallet.
          </div>
        )}
      </div>
    </>
  );
};

export default InscribePage;
