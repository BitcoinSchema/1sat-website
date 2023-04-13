import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { useBitcoinSchema } from "@/context/bitcoinschema";
import { OrdUtxo, useOrdinals } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { FetchStatus, toastErrorProps } from "..";

interface PageProps extends WithRouterProps {}

const InscriptionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifact, setArtifact] = useState<OrdUtxo | undefined>();
  const [fetchDataStatus, setFetchDataStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const { fundingUtxos, transfer, ordUtxos, fetchOrdinalUtxosStatus } =
    useWallet();
  const { inscriptionId } = router.query;
  const { getBmapTxById } = useBitcoinSchema();
  const { getArtifactByInscriptionId, fetchInscriptionsStatus } = useOrdinals();

  useEffect(() => {
    console.log({ inscriptionId });
    const fire = async (iid: number) => {
      try {
        setFetchDataStatus(FetchStatus.Loading);
        const art = await getArtifactByInscriptionId(iid);
        if (art) {
          const art2 = await fillContentType(art);

          const bmapTx = await getBmapTxById(art.txid);
          setFetchDataStatus(FetchStatus.Success);

          console.log({ bmapTx });
          if (bmapTx.MAP) {
            // TODO: This assumes the AMP index is the same as vout
            // thile this may work in most cases it is a bad assumption
            // should update the library to return the vout on each MAP element
            art2.MAP = bmapTx.MAP[art2.vout];
          }
          console.log("setting", art2);

          setArtifact(art2);
        }
      } catch (e) {
        setFetchDataStatus(FetchStatus.Error);
      }
    };
    if (inscriptionId && typeof inscriptionId === "string") {
      const id = parseInt(inscriptionId);
      if (id >= 0) {
        fire(id);
      }
    }
  }, [getBmapTxById, inscriptionId, getArtifactByInscriptionId]);

  const pagination = useMemo(() => {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div className="flex items-center justify-between max-w-2xl">
          <div className="">
            {parseInt(inscriptionId as string) > 100 && (
              <button
                className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4 mr-4"
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
                className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
                onClick={() =>
                  router.push(`${parseInt(inscriptionId as string) - 1}`)
                }
              >
                Prev
              </button>
            )}
          </div>
          <div className="bg-[#111] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            <span className="hidden md:block">Inscription </span>&nbsp; #
            {inscriptionId}
            {fetchInscriptionsStatus === FetchStatus.Success &&
              fetchOrdinalUtxosStatus === FetchStatus.Success &&
              !artifact && <div>No match for #{inscriptionId}</div>}
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(`${parseInt(inscriptionId as string) + 1}`)
              }
            >
              Next
            </button>
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4 ml-4"
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
  }, [
    fetchOrdinalUtxosStatus,
    router,
    artifact,
    fetchInscriptionsStatus,
    inscriptionId,
  ]);

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
            {artifact && !artifact.type && (
              <div
                key={artifact.txid}
                className="bg-[#111] rounded p-2 w-72 h-73 flex items-center justify-center font-mono"
              >
                {`This inscription is malformed and can't be rendered. Sad :(`}
              </div>
            )}

            {artifact && (
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
            )}
          </div>
          <div className="md:ml-4 w-full max-w-sm">
            {fetchDataStatus === FetchStatus.Success && !artifact && (
              <div className="bg-[#111] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 mb-4">
                <div>No ordinal matching that ID</div>
              </div>
            )}
            <div className="bg-[#111] mx-auto rounded max-w-2xl break-words text-sm p-2 mx-4 my-4 md:my-0 md:mb-2">
              {fetchDataStatus === FetchStatus.Loading && (
                <div className="p-2">
                  <LoaderIcon className="mx-auto" />
                </div>
              )}

              {fetchDataStatus === FetchStatus.Success && (
                <div className="flex items-center justify-center font-semibold text-xl">
                  Inscription #{inscriptionId}
                </div>
              )}
            </div>
            {ordUtxos?.some(
              (o) => o.id === parseInt(inscriptionId as string)
            ) && (
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-2">
                <div className="flex justify-between items-center">
                  <div>Transfer Ownership</div>
                  <div
                    className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
                    onClick={async () => {
                      if (!artifact) {
                        return;
                      }
                      console.log("click send");
                      const address = prompt(
                        "Enter the Bitcoin address to send this ordinal to. MAKE SURE THE WALLET ADDRESS YOU'RE SENDNG TO UNDERSTANDS ORDINALS, AND EXPECTS TORECIEVE 1SAT ORDINALS AT THIS ADDRESS!"
                      );

                      if (address) {
                        console.log(
                          "transferring",
                          { artifact },
                          "to",
                          { address },
                          "funded by",
                          { fundingUtxos }
                        );

                        try {
                          await transfer(artifact, address);
                        } catch (e) {
                          toast.error(
                            "Something went wrong" + e,
                            toastErrorProps
                          );
                        }
                      }
                    }}
                  >
                    Send
                  </div>
                </div>
              </div>
            )}

            {artifact?.MAP &&
              Object.entries(artifact.MAP)
                .filter(([k, v]) => k !== "cmd" && k !== "type" && k !== "type")
                .map(([k, v]) => (
                  <div
                    className={`${
                      k === "collection" ? "cursor-pointer hover:bg-[#222]" : ""
                    } bg-[#111] mx-auto rounded max-w-2xl break-words text-sm p-4 mx-4 my-4 md:my-0 md:mb-2`}
                    key={k}
                    onClick={() => {
                      if (k === "collection") {
                        router.push(
                          `/collection/${encodeURIComponent(v as string)}`
                        );
                      }
                    }}
                  >
                    <div
                      className={`flex items-center overflow-auto ${
                        k === "audio" || k === "stats"
                          ? "flex-col"
                          : "flex-row justify-between"
                      }`}
                    >
                      <div
                        className={`${
                          k === "audio" || k === "stats"
                            ? "text-center"
                            : "text-left"
                        } `}
                      >
                        {k}
                      </div>
                      <div
                        className={`${
                          k === "audio" || k === "stats"
                            ? "w-full"
                            : "text-right"
                        } `}
                      >
                        {k === "stats" ? (
                          Object.entries(JSON.parse(v as string)).map(
                            ([ks, vs]) => (
                              <div
                                key={ks}
                                className="w-full flex items-center justify-between"
                              >
                                <div className="">{ks}</div>
                                <div>{vs as string}</div>
                              </div>
                            )
                          )
                        ) : k === "audio" ? (
                          <audio
                            className="w-full h-8 mt-2"
                            src={`https://b.map.sv/tx/${
                              (v as string)?.split("b://")[1]
                            }/file`}
                            controls
                          />
                        ) : (
                          v
                        )}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default InscriptionPage;
