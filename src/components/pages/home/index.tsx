import oneSatLogo from "@/assets/images/icon.svg";
import Tabs, { Tab } from "@/components/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Image from "next/image";
import Router from "next/router";
import { useEffect, useState } from "react";
import { FetchStatus } from "..";

export type CallbackData = {
  numInputs: number;
  numOutputs: number;
  fee: number;
  rawTx: string;
};

interface PageProps extends WithRouterProps {}

const HomePage: React.FC<PageProps> = ({}) => {
  const [numMinted, setNumMinted] = useState<number>(0);
  const [fetchCountStatus, setFetchCountStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchCountStatus(FetchStatus.Loading);
        const resp = await fetch(
          `https://ordinals.gorillapool.io/api/inscriptions/count`
        );

        const { count } = await resp.json();
        setNumMinted(count);
        setFetchCountStatus(FetchStatus.Success);
      } catch (e) {
        console.error({ e });
        setFetchCountStatus(FetchStatus.Error);
      }
    };

    if (!numMinted && fetchCountStatus === FetchStatus.Idle) {
      fire();
    }
  }, [numMinted, fetchCountStatus]);

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

      <main className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center justify-between w-full h-full">
          <div className="w-full flex flex-col items-center justify-center ">
            <div className="max-w-[600px] text-yellow-400 font-mono">
              <div className="cursor-pointer my-8 w-full">
                <Image
                  style={{
                    boxShadow: "0 0 0 0 rgba(0, 0, 0, 1)",
                    transform: "scale(1)",
                    animation: "pulse 2s infinite",
                    width: "12rem",
                    height: "12rem",
                  }}
                  src={oneSatLogo}
                  onClick={() => Router?.push("/wallet")}
                  alt={"1Sat Ordinals"}
                  className="cursor-pointer mx-auto rounded"
                />
              </div>
            </div>
            <nav>
              <Tabs currentTab={Tab.Overview} />
            </nav>
            <h1>
              {numMinted ? `${numMinted.toLocaleString()} Inscribeds Made` : ""}
            </h1>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
