import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";

import { head } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";
interface PageProps extends WithRouterProps {}

const InscriptionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<OrdUtxo[]>([]);
  const { inscriptionId } = router.query;
  const { getBmapTxById } = useWallet();
  const { getArtifactByInscriptionId, fetchInscriptionsStatus } = useWallet();

  useEffect(() => {
    console.log({ inscriptionId });
    const fire = async (iid: number) => {
      const art = await getArtifactByInscriptionId(iid);
      if (art) {
        const art2 = await fillContentType(art);

        const bmapTx = await getBmapTxById(art.txid);

        console.log({ bmapTx });
        if (bmapTx.MAP) {
          art2.MAP = head(bmapTx.MAP);
        }
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

  const pagination = useMemo(() => {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div className="flex items-center justify-between max-w-2xl">
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
            {fetchInscriptionsStatus !== FetchStatus.Loading &&
              artifacts.length === 0 && (
                <div>No match for #{inscriptionId}</div>
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
      </div>
    );
  }, [artifacts, fetchInscriptionsStatus, inscriptionId]);

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
      <div className="p-4 flex flex-col w-full justify-center items-center mx-auto max-w-6xl">
        {pagination}

        <div className="p-4 flex w-full md:flex-row flex-col mx-auto max-w-6xl justify-center">
          <div className="text-center h-full flex flex-row items-center justify-center">
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
                    wrapper: `max-w-5xl w-full h-full`,
                    media: `max-h-[calc(100vh-20em)]`,
                  }}
                  contentType={artifact.type}
                  outPoint={artifact.origin || ""}
                  id={artifact.id}
                />
              );
            })}
          </div>
          <div className="md:ml-4 w-full max-w-sm">
            {fetchInscriptionsStatus === FetchStatus.Success &&
              artifacts.length === 0 && (
                <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 mb-4">
                  <div>No ordinals matching that ID</div>
                </div>
              )}
            <div className="bg-[#222] mx-auto rounded max-w-2xl break-words text-sm p-4 mx-4 my-4 md:my-0">
              <div>Inscription #{inscriptionId}</div>
            </div>

            {/* {artifacts?.some((a) => a.id === inscriptionId) && (
              <>
                <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-4">
                  <div className="flex justify-between items-center">
                    <div>Transfer Ownership</div>
                    <div
                      className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
                      onClick={async () => {
                        console.log("click send");
                        // const address = prompt(
                        //   "Enter the Bitcoin address to send this ordinal to. MAKE SURE THE WALLET ADDRESS YOU'RE SENDNG TO UNDERSTANDS ORDINALS, AND EXPECTS TORECIEVE 1SAT ORDINALS AT THIS ADDRESS!"
                        // );

                        // if (address) {
                        //   console.log(
                        //     "transferring",
                        //     { ordinalUtxo },
                        //     "to",
                        //     { address },
                        //     "funded by",
                        //     { fundingUtxos }
                        //   );

                        //   await transfer(ordinalUtxo, address);
                        // }
                      }}
                    >
                      Send
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                <div>Re-Inscribe</div>
                <div className="rounded bg-[#222] p-2" onClick={async () => {}}>
                  SoonTm
                </div>
              </div>
                </div>
              </>
            )} */}
          </div>
        </div>
      </div>
    </>
  );
};

export default InscriptionPage;
