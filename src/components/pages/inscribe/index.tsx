import Inscribe from "@/components/inscriptions/inscribe";
import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Router from "next/router";

interface PageProps extends WithRouterProps {}

const InscribePage: React.FC<PageProps> = ({ router }) => {
  const { payPk, fundingUtxos } = useWallet();
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
      <Tabs currentTab={Tab.Inscribe} />
      {(!payPk || !fundingUtxos) && (
        <div
          className="rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8"
          onClick={() => Router.push("./wallet")}
        >
          You need funds to inscribe. Check your wallet.
        </div>
      )}
      {payPk && fundingUtxos && (
        <Inscribe
          inscribedCallback={(inscription) => {
            Router.push("/preview");
          }}
        />
      )}
    </>
  );
};

export default InscribePage;
