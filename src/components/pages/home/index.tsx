import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { API_HOST, OrdUtxo, useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Image from "next/image";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import * as S from "./styles";

import { getRandomInt } from "@/utils/number";
import { useLocalStorage } from "@/utils/storage";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const HomePage: React.FC<PageProps> = ({}) => {
  const [numMinted, setNumMinted] = useState<number>(0);
  const [artifact, setArtifact] = useLocalStorage<OrdUtxo | undefined>(
    "1sat-hpa"
  );
  const {
    setFetchInscriptionsStatus,
    fetchInscriptionsStatus,
    getArtifactByInscriptionId,
  } = useOrdinals();

  const [fetchCountStatus, setFetchCountStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [randomNumber, setRandomNumber] = useState<number>(
    getRandomInt(getRandomInt(0, 300000), numMinted)
  );

  useEffect(() => {
    if (!randomNumber) {
      setRandomNumber(getRandomInt(0, numMinted));
    }
  }, [randomNumber, numMinted, setRandomNumber]);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchCountStatus(FetchStatus.Loading);
        const resp = await fetch(`${API_HOST}/api/origins/count`);

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

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("This will be called every 12 seconds");
      if (numMinted) {
        setRandomNumber(getRandomInt(0, numMinted));
        setFetchInscriptionsStatus(FetchStatus.Idle);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [numMinted, setRandomNumber, setFetchInscriptionsStatus]);

  useEffect(() => {
    const fire = async (iid: number) => {
      const art = await getArtifactByInscriptionId(iid);

      if (art) {
        //         console.log("FILLING", { art });
        // const art2 = await fillContentType(art);
        setArtifact(art);
      }
    };
    if (
      fetchInscriptionsStatus === FetchStatus.Idle &&
      randomNumber !== artifact?.origin?.num
    ) {
      fire(randomNumber);
    }
  }, [
    fetchInscriptionsStatus,
    randomNumber,
    artifact,
    getArtifactByInscriptionId,
    setArtifact,
  ]);

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
      <Tabs currentTab={Tab.Overview} />

      <main className="px-4 flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center justify-between w-full h-full">
          <div className="w-full flex flex-col items-center justify-center ">
            <nav></nav>
            <h2
              style={{ fontFamily: "Ubuntu" }}
              className="mt-2 text-xl font-semibold text-purple-300"
            >
              1Sat Ordinals
            </h2>
            <S.Heading>
              {numMinted ? `${numMinted.toLocaleString()}` : ""}
            </S.Heading>
            <h2 className="mb-12 text-xl text-gray-600 font-sans">
              Inscriptions Made
            </h2>
            <div className="mx-auto max-w-5xl">
              {artifact && (
                <Artifact
                  num={artifact?.origin?.num}
                  origin={
                    artifact.origin?.outpoint ||
                    ` ${artifact?.txid}_${artifact?.vout}`
                  }
                  contentType={artifact.data?.insc?.file.type}
                  classNames={{
                    wrapper: "min-w-96",
                    media: "max-h-96 max-w-96",
                  }}
                  to={`/inscription/${artifact?.origin?.outpoint}`}
                  height={artifact.height}
                />
              )}
              {!artifact && (
                <div className="max-w-[600px] text-yellow-400 font-mono">
                  <div className="cursor-pointer mb-8 w-full">
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
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
