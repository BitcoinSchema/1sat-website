import Artifact from "@/components/artifact";
import BuyArtifactModal from "@/components/modal/buyArtifact";
import Tabs from "@/components/tabs";
import Tooltip from "@/components/tooltip";
import { MAP, useBitcoinSchema } from "@/context/bitcoinschema";
import { API_HOST, OrdUtxo, SIGMA, useOrdinals } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { customFetch } from "@/utils/httpClient";
import { head } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { FaSignature } from "react-icons/fa";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { FetchStatus, toastErrorProps } from "..";
import { Collection } from "./collection";
import CollectionItem from "./collectionItem";

interface PageProps extends WithRouterProps {}

export type CollectionStats = {
  count: number;
  highestMintNum: number;
  MAP: Collection;
  SIGMA?: SIGMA[];
};

enum SubType {
  Collection = "collection",
  CollectionItem = "collectionItem",
}

const InscriptionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifact, setArtifact] = useState<OrdUtxo | undefined>();
  const [ordListing, setOrdListing] = useState<OrdUtxo | undefined>(undefined);
  const [fetchListingStatus, setFetchListingStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchDataStatus, setFetchDataStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [showBuy, setShowBuy] = useState<boolean>(false);
  const { fundingUtxos, transfer, ordUtxos, fetchOrdinalUtxosStatus } =
    useWallet();

  const searchParams = useSearchParams();
  const inscriptionId = decodeURIComponent(
    searchParams.get("inscriptionId") || ""
  );

  const { getBmapTxById } = useBitcoinSchema();
  const {
    getArtifactByInscriptionId,
    fetchInscriptionsStatus,
    buyArtifact,
    cancelListing,
  } = useOrdinals();

  useEffect(() => {
    console.log({ inscriptionId });
    const fire = async (iid: string) => {
      try {
        setFetchDataStatus(FetchStatus.Loading);
        const art = await getArtifactByInscriptionId(iid);
        if (art) {
          // const art2 = await fillContentType(art);

          // const bmapTx = await getBmapTxById(art.txid);
          setFetchDataStatus(FetchStatus.Success);

          // console.log({ bmapTx });

          // if (bmapTx.MAP) {
          //   // TODO: This assumes the AMP index is the same as vout
          //   // thile this may work in most cases it is a bad assumption
          //   // should update the library to return the vout on each MAP element
          //   art2.MAP = bmapTx.MAP[art2.vout];
          // }
          console.log("setting", art);

          setArtifact(art);
        }
      } catch (e) {
        setFetchDataStatus(FetchStatus.Error);
      }
    };
    if (inscriptionId && typeof inscriptionId === "string") {
      if (inscriptionId.length > 0) {
        fire(inscriptionId);
      }
    }
  }, [getBmapTxById, inscriptionId, getArtifactByInscriptionId]);

  // use the endpoint to fetch the market listings (type OrdUtxo) for this inscription
  // `${API_HOST}/api/market/${outpoint}`,
  useEffect(() => {
    const fire = async (origin: string) => {
      try {
        setFetchListingStatus(FetchStatus.Loading);
        const { promise } = customFetch<OrdUtxo>(
          `${API_HOST}/api/inscriptions/${origin}/latest`
        );

        const listing = await promise;
        setFetchListingStatus(FetchStatus.Success);
        // if this is a listing, set the listing
        if (!!listing.data?.list) {
          setOrdListing(listing);
        } else {
          setOrdListing(undefined);
        }
      } catch (e) {
        setFetchListingStatus(FetchStatus.Error);
      }
    };
    if (
      inscriptionId &&
      artifact?.origin &&
      fetchListingStatus === FetchStatus.Idle
    ) {
      fire(artifact.origin.outpoint);
    }
  }, [
    inscriptionId,
    artifact?.origin,
    artifact?.origin?.num,
    fetchListingStatus,
    setOrdListing,
  ]);

  useEffect(() => {
    if (artifact && ordListing && artifact?.origin !== ordListing?.origin) {
      setOrdListing(undefined);
      setFetchListingStatus(FetchStatus.Idle);
    }
  }, [ordListing, artifact]);

  const ordUtxo = useMemo(() => {
    return ordUtxos?.find(
      (o) => o.origin?.num === parseInt(inscriptionId as string)
    );
  }, [inscriptionId, ordUtxos]);

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
              fetchListingStatus === FetchStatus.Success &&
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
    fetchListingStatus,
    fetchOrdinalUtxosStatus,
    router,
    artifact,
    fetchInscriptionsStatus,
    inscriptionId,
  ]);

  const isBsv20 = useMemo(() => {
    if (artifact) {
      // console.log(
      //   { artifact },
      //   (artifact.height || 0) > 793000,
      //   head(artifact.file!.type.split(";"))
      // );
      if (
        (head(artifact.origin?.data?.insc?.file!.type.split(";")) ===
          "text/plain" &&
          (artifact.height || 0) > 793000) ||
        head(artifact.origin?.data?.insc?.file!.type.split(";")) ===
          "application/bsv-20"
      ) {
        return true;
      }
      return;
    } else {
      return false;
    }
  }, [artifact]);

  useEffect(() => {
    console.log({ isBsv20 });
  }, [isBsv20]);

  // TODO: Collection support
  const [collectionStats, setCollectionStats] = useState<
    CollectionStats | undefined
  >();

  const [fetchCollectionStatus, setFetchCollectionStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  useEffect(() => {
    const fire = async (id: string) => {
      setFetchCollectionStatus(FetchStatus.Loading);
      try {
        const { promise } = customFetch<CollectionStats>(
          `${API_HOST}/api/collections/${id}/stats`
        );
        const collection = await promise;
        setFetchCollectionStatus(FetchStatus.Success);
        setCollectionStats(collection);
      } catch (e) {
        setFetchCollectionStatus(FetchStatus.Error);
      }
    };
    // if this is a collectionItem, look up the collection
    if (artifact?.data?.map?.subType === SubType.CollectionItem) {
      const collectionId = (artifact?.data.map?.subTypeData as any)
        ?.collectionId;
      if (collectionId) {
        fire(collectionId);

        return () => {
          setCollectionStats(undefined);
          setFetchCollectionStatus(FetchStatus.Idle);
        };
      }
    }
  }, [artifact]);

  const renderSubTypeItem = useCallback(
    (mapData: MAP) => {
      const subType: SubType = mapData.subType;
      switch (subType) {
        case SubType.Collection:
        //return <Collection {...value} />;
        case SubType.CollectionItem:
          try {
            return (
              collectionStats && (
                <CollectionItem map={mapData} stats={collectionStats} />
              )
            );
          } catch (e) {
            console.log(e);
          }
      }
      return <div></div>;
    },
    [collectionStats]
  );

  const renderSubType = useCallback((k: string, v: string) => {
    return (
      <div
        className={`${k === "subTypeData" ? "w-full" : ""} ${
          k === "audio" || k === "stats" || k === "subTypeData"
            ? "w-full"
            : "text-right"
        } `}
      >
        {k === "stats" ? (
          Object.entries(JSON.parse(v)).map(([ks, vs]) => (
            <div key={ks} className="w-full flex items-center justify-between">
              <div className="">{ks}</div>
              <div>{vs as string}</div>
            </div>
          ))
        ) : k === "audio" ? (
          <audio
            className="w-full h-8 mt-2"
            src={`https://b.map.sv/tx/${v?.split("b://")[1]}/file`}
            controls
          />
        ) : (
          v
        )}
      </div>
    );
  }, []);

  useEffect(() => {
    console.log({ ordUtxo, artifact });
  }, [artifact, ordUtxo]);

  const ownsInscription = useMemo(() => {
    return (
      artifact &&
      ordUtxos?.some((o) => o.origin?.outpoint === artifact.origin?.outpoint)
    );
  }, [artifact, ordUtxos]);

  const collectionSigMatches = useMemo(() => {
    if (
      collectionStats &&
      artifact &&
      collectionStats.SIGMA &&
      artifact.data?.sigma
    ) {
      const collectionAddress = head(collectionStats.SIGMA)?.address;
      const artifactAddress = head(artifact.data?.sigma)?.address;
      return (
        !!collectionAddress &&
        !!artifactAddress &&
        collectionAddress === artifactAddress
      );
    }
    return false;
  }, [collectionStats, artifact]);

  const content = useMemo(() => {
    if (!artifact) {
      return;
    }
    return (
      <Artifact
        key={ordListing?.txid || artifact.txid}
        classNames={{
          wrapper: `max-w-5xl w-full h-full`,
          media: `max-h-[calc(100vh-20em)]`,
        }}
        contentType={artifact.origin?.data?.insc?.file?.type}
        origin={artifact.origin?.outpoint || ""}
        num={artifact.origin?.num}
        height={artifact.height}
        clickToZoom={true}
      />
    );
  }, [ordListing, artifact]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Inscription</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs currentTab={undefined} />
      <div className="p-4 flex flex-col w-full justify-center items-center mx-auto max-w-6xl">
        {pagination}

        <div className="p-4 flex w-full md:flex-row flex-col mx-auto max-w-6xl justify-center">
          <div className="text-center h-full flex flex-row items-center justify-center">
            {artifact && !artifact.origin?.data?.insc?.file?.type && (
              <div
                key={artifact.txid}
                className="bg-[#111] rounded p-2 w-72 h-73 flex items-center justify-center font-mono"
              >
                {`This inscription is malformed and can't be rendered. Sad :(`}
              </div>
            )}

            {artifact && content}
          </div>
          <div className="md:ml-4 w-full max-w-sm">
            {fetchDataStatus === FetchStatus.Success && !artifact && (
              <div className="bg-[#111] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4">
                <div>No ordinal matching that ID</div>
              </div>
            )}
            <div className="bg-[#111] mx-auto rounded max-w-2xl break-words text-sm p-2 my-4 md:my-0 md:mb-2">
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
            {artifact?.data?.sigma &&
              artifact?.data.sigma?.length > 0 &&
              !artifact.data.sigma[0]?.valid && (
                <div className="my-2 bg-red-800 text-white p-2 rounded">
                  Invalid Signature
                </div>
              )}
            {artifact?.data?.map?.subType &&
              artifact?.data.map?.subTypeData && (
                <div
                  className="bg-[#111] mx-auto rounded max-w-2xl break-words text-sm p-2 my-4 md:my-0 md:mb-2 cursor-pointer hover:bg-[#222]"
                  onClick={() =>
                    Router.push(
                      `/collection/${
                        (artifact?.data?.map?.subTypeData as any).collectionId
                      }`
                    )
                  }
                >
                  {renderSubTypeItem(artifact?.data.map)}
                </div>
              )}
            {collectionStats?.SIGMA && collectionSigMatches && (
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 md:my-2 w-full">
                <div className="flex items-center mb-2">
                  <Tooltip
                    message={`This item's signature matches the parent collection.`}
                  >
                    <FaSignature className="mr-2" />
                  </Tooltip>{" "}
                  Signed Collection Item
                </div>
                <div className="p-2 rounded bg-black">
                  {head(collectionStats?.SIGMA)?.address}
                </div>
              </div>
            )}
            {!ownsInscription && ordListing && (
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-2">
                <h2 className="text-xl text-center font-semibold mb-2">
                  For Sale
                </h2>

                <div className="flex justify-between items-center mb-2">
                  <div>Price</div>
                  <div>{toBitcoin(ordListing?.data?.list?.price || 0)} BSV</div>
                </div>
                <div className="flex items-center mb-2">
                  <div
                    className="rounded bg-emerald-600 cursor-pointer p-2 hover:bg-emerald-500 transition text-white w-full text-center"
                    onClick={async () => {
                      if (!artifact?.origin) {
                        return;
                      }
                      console.log("click buy");
                      setShowBuy(true);
                      // buyArtifact(artifact.origin);
                    }}
                  >
                    Buy
                  </div>
                </div>
              </div>
            )}
            {ownsInscription && (
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-2">
                <h2 className="text-xl text-center font-semibold mb-2">
                  You Own This Item
                </h2>
                <div className="flex justify-between items-center mb-2">
                  <div>Transfer Ownership</div>
                  <button
                    disabled={!!ordListing}
                    className={`rounded disabled:text-[#444] bg-[#222] cursor-pointer disabled:cursor-default p-2 disabled:hover:bg-[#222] hover:bg-[#333] transition text-white`}
                    onClick={async () => {
                      if (!artifact || ordListing) {
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
                          "from",
                          { ordUtxo },
                          "to",
                          { address },
                          "funded by",
                          { fundingUtxos }
                        );

                        try {
                          if (ordUtxo) {
                            await transfer(ordUtxo, address);
                          } else {
                            toast.error(
                              "No ordinal utxo found.",
                              toastErrorProps
                            );
                          }
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
                  </button>
                </div>
                {ordUtxo && !ordUtxo.data?.list && (
                  <div className="flex justify-between items-center mt-4">
                    <div>List for Sale</div>
                    <div
                      className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
                      onClick={async () => {
                        Router.push(`/market/new/${ordUtxo?.origin}`);
                      }}
                    >
                      List
                    </div>
                  </div>
                )}
                {ordUtxo && !!ordUtxo.data?.list && (
                  <div className="flex justify-between items-center mt-4">
                    <div>Cancel Listing</div>
                    <div
                      className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
                      onClick={async () => {
                        await cancelListing(ordUtxo);
                      }}
                    >
                      Cancel
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* // TODO: Show collection signature vs item signatuer */}
            {
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-2">
                <div className="flex justify-between items-center">
                  <div className="whitespace-nowrap mr-8">Tx ID</div>
                  <div className="truncate">
                    <a
                      href={`https://whatsonchain.com/tx/${artifact?.txid}`}
                      target="_blank"
                    >
                      {artifact?.txid}
                    </a>
                  </div>
                </div>
              </div>
            }
            {artifact?.data?.map &&
              Object.entries(artifact.data.map)
                .filter(
                  ([k, v]) =>
                    k !== "cmd" &&
                    k !== "type" &&
                    k !== "subType" &&
                    k !== "subTypeData"
                )
                .map(([k, v]) => {
                  return (
                    <div
                      className={`${
                        k === "collection" ||
                        k === "collectionId" ||
                        (v as any)?.collectionId
                          ? "cursor-pointer hover:bg-[#222]"
                          : ""
                      } bg-[#111] mx-auto rounded max-w-2xl break-words text-sm p-4 my-4 md:my-0 md:mb-2`}
                      key={k}
                      onClick={() => {
                        if (
                          k === "collection" ||
                          k === "collectionId" ||
                          (v as any)?.collectionId
                        ) {
                          router.push(`/collection/${(v as any).collectionId}`);
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
                        {k !== "subType" && k !== "subTypeData" ? (
                          <div
                            className={`${
                              k === "audio" || k === "stats"
                                ? "text-center"
                                : "text-left"
                            } `}
                          >
                            {k}
                          </div>
                        ) : null}
                        {k &&
                          !!v &&
                          typeof v === "string" &&
                          renderSubType(k, v)}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      {ordListing?.outpoint &&
        showBuy &&
        ordListing?.data?.list?.price !== undefined && (
          <BuyArtifactModal
            outPoint={ordListing.outpoint}
            onClose={() => setShowBuy(false)}
            price={ordListing?.data?.list?.price}
            content={content}
          />
        )}
    </>
  );
};

export default InscriptionPage;
