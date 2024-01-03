import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import Tooltip from "@/components/tooltip";
import { API_HOST, OrdUtxo } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { find, head } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { GiHolyGrail } from "react-icons/gi";
import { FetchStatus } from "..";
import { CollectionStats } from "../inscription";
import { Collection, ancientCollections } from "../market/featured";
import MarketTabs, { MarketTab } from "../market/tabs";

interface PageProps extends WithRouterProps {}

type Item = OrdUtxo;

const CollectionPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();

  const queryName = searchParams.get("name");
  const collectionId = searchParams.get("collectionId");
  const router = useRouter();
  const [collection, setCollection] = useState<Item[] | undefined>();
  const [isAncient, setIsAncient] = useState<boolean>(false);

  const [fetchCollectionStatus, setFetchCollectionStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  // TODO: Implement infinite scroll
  const setCollectionFromCollectionId = useCallback(
    async (keyName: string = "ColectionId", collectionId: string) => {
      try {
        setFetchCollectionStatus(FetchStatus.Loading);
        // 2 diff views
        // one is what is listed for sale
        // the other is everything
        const { promise } = customFetch<Item[]>(
          `${API_HOST}/api/inscriptions/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              map: {
                [keyName]: collectionId,
              },
            }),
          }
        );

        const c = await promise;
        setCollection(c);
        setFetchCollectionStatus(FetchStatus.Success);
      } catch (error) {
        console.log(error);
        setFetchCollectionStatus(FetchStatus.Error);
      }
      //
    },
    [setCollection, setFetchCollectionStatus]
  );

  const [collectionStats, setCollectionStats] = useState<
    CollectionStats | undefined
  >();
  const [fetchCollectionStatsStatus, setFetchCollectionStatsStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  useEffect(() => {
    const fire = async (id: string) => {
      setFetchCollectionStatsStatus(FetchStatus.Loading);
      try {
        const { promise } = customFetch<CollectionStats>(
          `${API_HOST}/api/collections/${id}/stats`
        );
        const collection = await promise;
        setFetchCollectionStatsStatus(FetchStatus.Success);
        setCollectionStats(collection);
      } catch (e) {
        setFetchCollectionStatsStatus(FetchStatus.Error);
      }
    };
    // if this is a collectionItem, look up the collection
    if (collectionId && fetchCollectionStatsStatus === FetchStatus.Idle) {
      fire(collectionId as string);
    }
  }, [collectionId, fetchCollectionStatsStatus]);

  useEffect(() => {
    const fire = async (cid: string) => {
      try {
        setFetchCollectionStatus(FetchStatus.Loading);
        const { promise } = customFetch<Item[]>(
          `${API_HOST}/api/inscriptions/search?q=${Buffer.from(
            JSON.stringify({
              map: { subTypeData: { collectionId: cid } },
            })
          ).toString("base64")}`
        );
        const c = await promise;
        if (c.length > 0) {
          setCollection(c);
        } else if (
          c.length === 0 &&
          ancientCollections.some((c) => c.origin === collectionId)
        ) {
          const c = find(ancientCollections, { origin: collectionId }) as
            | Collection
            | undefined;

          setIsAncient(true);
          console.log("!!!!", { c });
          if (c?.MAP.collectionID) {
            await setCollectionFromCollectionId(
              "collectionID",
              c.MAP.collectionID
            );

            // TODO: Handle other ancient collection schema variations
            // setCollection((c as Collection).items as Item[]);
          } else if (c?.MAP.collection) {
            await setCollectionFromCollectionId("collection", c.MAP.collection);
          } else if (c?.MAP.monType === "mask") {
            await setCollectionFromCollectionId("monType", c.MAP.monType);
          }
        }
        setFetchCollectionStatus(FetchStatus.Success);
      } catch (error) {
        console.log(error);
        setFetchCollectionStatus(FetchStatus.Error);
      }
    };
    if (
      collectionId &&
      typeof collectionId === "string" &&
      fetchCollectionStatus === FetchStatus.Idle
    ) {
      console.log("FIRE", collectionId);
      fire(collectionId);
    }
  }, [
    setIsAncient,
    fetchCollectionStatus,
    collectionId,
    setCollectionFromCollectionId,
  ]);

  const collectionName = useMemo(() => {
    if (collectionStats?.MAP) {
      return collectionStats.MAP.name;
    }
    const c = head(collection);
    return !!c && c.data?.map?.collectionID?.length > 0
      ? c.data?.map?.collectionID
      : !!c && c.data?.map?.name?.length > 0
      ? c.data?.map?.name
      : queryName;
  }, [collection, collectionStats, queryName]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Collection</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs currentTab={Tab.Market} />
      <MarketTabs currentTab={MarketTab.Collections} />
      <div className="p-4 flex flex-col w-full justify-center items-center mx-auto max-w-7xl">
        <div className="w-full my-4 text-xl font-semibold flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer text-[#555] hover:text-blue-500 transition"
            onClick={() => {
              router.push("/market");
            }}
          >
            <FiArrowLeft className="inline-block mr-2" /> Back
          </div>
          {isAncient && (
            <Tooltip message={"Minted before collection standards."}>
              <div className="flex items-center justify-center font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600 cursor-default relative">
                <GiHolyGrail className="-mt-1 w-8 h-8 mr-2 text-orange-600" />{" "}
                Ancient{" "}
              </div>{" "}
            </Tooltip>
          )}
          <div>{collectionName}</div>
        </div>
        <div className="p-4 grid w-full mx-auto justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collection
            ?.sort((a, b) => {
              if (
                a.data?.map?.subTypeData?.mintNumber &&
                a.data?.map?.subTypeData?.mintNumber
              ) {
                return a.data?.map?.subTypeData?.mintNumber <
                  b.data?.map?.subTypeData?.mintNumber
                  ? -1
                  : 1;
              }
              return (a.origin?.num || 0) < (b?.origin?.num || 0) ? -1 : 1;
            })
            .map((artifact) => {
              return (
                <div key={artifact.origin?.outpoint}>
                  {artifact && !artifact.origin?.data?.insc?.file.type && (
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
                      contentType={artifact.origin?.data?.insc?.file.type}
                      origin={artifact.origin?.outpoint || ""}
                      num={artifact.origin?.num}
                      height={artifact.height}
                      to={`/inscription/${encodeURIComponent(
                        artifact.origin?.num || ""
                      )}`}
                      clickToZoom={false}
                      price={
                        artifact.data?.list
                          ? artifact.data.list.price
                          : undefined
                      }
                      isListing={!!artifact.data?.list}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default CollectionPage;
