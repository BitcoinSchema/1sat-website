import Tabs, { Tab } from "@/components/tabs";
import Wallet from "@/components/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import React from "react";
import WalletTabs, { WalletTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const WalletPage: React.FC<PageProps> = ({}) => {
  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Wallet</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs currentTab={Tab.Wallet} />
      <WalletTabs currentTab={WalletTab.Bitcoin} />
      <Wallet />
    </>
  );
};

export default WalletPage;
