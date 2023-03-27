import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const InscriptionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<OrdUtxo[]>([]);
  const { inscriptionId } = router.query;

  const { getArtifactByInscriptionId, fetchInscriptionsStatus } = useWallet();

  useEffect(() => {
    console.log({ inscriptionId });
    const fire = async (iid: number) => {
      const art = await getArtifactByInscriptionId(iid);
      if (art) {
        const art2 = await fillContentType(art);
        console.log("setting", art2);
        setArtifacts([art2]);
      }
    };
    if (inscriptionId && typeof inscriptionId === "string") {
      const id = parseInt(inscriptionId);
      if (id >= 0) {
        fire(id);
      }
    }
  }, [inscriptionId, getArtifactByInscriptionId]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Inscription #{inscriptionId}</title>
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
      <Tabs currentTab={undefined} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="">
            {parseInt(inscriptionId as string) > 100 && (
              <button
                className="bg-[#222] rounded mb-8 text-sm p-2 md:p-4 my-4 mr-4"
                onClick={() =>
                  router.push(`${parseInt(inscriptionId as string) - 100}`)
                }
              >
                -100
              </button>
            )}
          </div>
          <div className="">
            {parseInt(inscriptionId as string) > 0 && (
              <button
                className="bg-[#222] rounded mb-8 text-sm p-2 md:p-4 my-4"
                onClick={() =>
                  router.push(`${parseInt(inscriptionId as string) - 1}`)
                }
              >
                Prev
              </button>
            )}
          </div>
          <div className="bg-[#222] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            <span className="hidden md:block">Inscription </span>&nbsp; #
            {inscriptionId}
            {fetchInscriptionsStatus === FetchStatus.Success &&
              artifacts.length === 0 && (
                <div>No artifacts matching that ID</div>
              )}
          </div>
          <div className="">
            <button
              className="bg-[#222] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(`${parseInt(inscriptionId as string) + 1}`)
              }
            >
              Next
            </button>
          </div>
          <div className="">
            <button
              className="bg-[#222] rounded mb-8 text-sm p-2 md:p-4 my-4 ml-4"
              onClick={() =>
                router.push(`${parseInt(inscriptionId as string) + 100}`)
              }
            >
              +100
            </button>
          </div>
        </div>
        <div className="text-center w-full h-full flex items-center justify-center">
          {artifacts?.map((artifact) => {
            if (!artifact.type) {
              return (
                <div
                  key={artifact.txid}
                  className="bg-[#111] rounded p-2 w-72 h-73 flex items-center justify-center font-mono"
                >
                  {`This inscription is malformed and can't be rendered. Sad :(`}
                </div>
              );
            }
            return (
              <Artifact
                key={artifact.txid}
                classNames={{
                  wrapper: "max-w-4xl w-full h-full",
                  media: `max-h-[calc(100vh-30em)]`,
                }}
                contentType={artifact.type}
                outPoint={artifact.origin || ""}
                id={artifact.id}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default InscriptionPage;
