import Tabs, { Tab } from "@/components/tabs";
import Wallet from "@/components/wallet";
import { useBitsocket } from "@/context/bitsocket";
import { useWallet } from "@/context/wallet";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useEffect, useMemo } from "react";
import { ConnectionStatus } from "..";

interface PageProps extends WithRouterProps {}

const WalletPage: React.FC<PageProps> = ({ router }) => {
  const { ordPk, initialized } = useWallet();
  const { connectionStatus, connect, ordAddress } = useBitsocket();

  const oAddress = useMemo(() => {
    if (initialized && ordPk) {
      const wif = PrivateKey.from_wif(ordPk);
      const pk = PublicKey.from_private_key(wif);
      return wif && pk && P2PKHAddress.from_pubkey(pk).to_string();
    }
  }, [initialized, ordPk]);

  useEffect(() => {
    if (
      oAddress &&
      connectionStatus !== ConnectionStatus.CONNECTING &&
      (!ordAddress ||
        ordAddress !== oAddress ||
        connectionStatus === ConnectionStatus.IDLE)
    ) {
      connect(oAddress);
    }
  }, [oAddress, connect, connectionStatus]);

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
      <Wallet />
    </>
  );
};

export default WalletPage;
