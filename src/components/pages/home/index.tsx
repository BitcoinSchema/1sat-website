import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { API_HOST, OrdUtxo, useOrdinals } from "@/context/ordinals";
import { fillContentType } from "@/utils/artifact";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import Image from "next/image";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import * as S from "./styles";

import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const rando = getRandomInt(0, 300000);

const HomePage: React.FC<PageProps> = ({}) => {
  const [numMinted, setNumMinted] = useState<number>(0);
  const [artifact, setArtifact] = useState<OrdUtxo | undefined>();
  const {
    setFetchInscriptionsStatus,
    fetchInscriptionsStatus,
    getArtifactByInscriptionId,
  } = useOrdinals();
  const [fetchCountStatus, setFetchCountStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [randomNumber, setRandomNumber] = useState<number>(
    getRandomInt(rando, numMinted)
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
        const resp = await fetch(`${API_HOST}/api/inscriptions/count`);

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
        const art2 = await fillContentType(art);
        setArtifact(art2);
      }
    };
    if (
      fetchInscriptionsStatus === FetchStatus.Idle &&
      randomNumber !== artifact?.num
    ) {
      fire(randomNumber);
    }
  }, [
    fetchInscriptionsStatus,
    randomNumber,
    artifact,
    getArtifactByInscriptionId,
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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="px-4 flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center justify-between w-full h-full">
          <div className="w-full flex flex-col items-center justify-center ">
            <nav>
              <Tabs currentTab={Tab.Overview} />
            </nav>
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
                  num={artifact?.num}
                  origin={
                    artifact.origin || ` ${artifact?.txid}_${artifact?.vout}`
                  }
                  contentType={artifact.file?.type}
                  classNames={{
                    wrapper: "min-w-96",
                    media: "max-h-96 max-w-96",
                  }}
                  to={`/inscription/${artifact?.num}`}
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

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
