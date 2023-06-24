import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import Tooltip from "@/components/tooltip";
import { API_HOST } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { find, head } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { GiHolyGrail } from "react-icons/gi";
import { FetchStatus } from "..";
import CollectionItem from "../inscription/collectionItem";
import { Collection, ancientCollections } from "../market/featured";
import MarketTabs, { MarketTab } from "../market/tabs";

interface PageProps extends WithRouterProps {}

type Item = {
  id: number;
  num: number;
  txid: string;
  vout: number;
  outpoint: string;
  file: {
    hash: string;
    size: number;
    type: string;
  };
  origin: string;
  height: number;
  idx: number;
  lock: string;
  spend: string;
  MAP: CollectionItem;
  B: {
    hash: string;
    size: number;
    type: string;
  };
  SIGMA: string[];
  listing: boolean;
  price: number;
  payout: string;
  script: string;
  bsv20: boolean;
};

const CollectionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { name: queryName } = router.query;
  const [collection, setCollection] = useState<Item[] | undefined>();
  const [isAncient, setIsAncient] = useState<boolean>(false);

  const { collectionId } = router.query;
  const [fetchCollectionStatus, setFetchCollectionStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const setCollectionFromCollectionId = useCallback(
    async (keyName: string = "ColectionId", collectionId: string) => {
      try {
        setFetchCollectionStatus(FetchStatus.Loading);
        const { promise } = customFetch<Item[]>(
          `${API_HOST}/api/inscriptions/search/map`,
          {
            method: "POST",
            body: JSON.stringify({
              query: {
                [keyName]: collectionId,
              },
            }),
          }
        );
        const c = await promise;
        console.log({ collectionItems: c });

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

  useEffect(() => {
    console.log({ collectionId });
    const fire = async (cid: string) => {
      try {
        setFetchCollectionStatus(FetchStatus.Loading);
        const { promise } = customFetch<Item[]>(
          `${API_HOST}/api/collections/${cid}/items`
        );
        const c = await promise;
        console.log({ collectionItems: c });
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
          if (c?.MAP.collectionID) {
            setCollectionFromCollectionId("collectionID", c.MAP.collectionID);

            // TODO: Handle other ancient collection schema variations
            // setCollection((c as Collection).items as Item[]);
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
      fire(collectionId);
    }
  }, [
    setIsAncient,
    fetchCollectionStatus,
    collectionId,
    setCollectionFromCollectionId,
  ]);

  const collectionName = useMemo(() => {
    const c = head(collection);
    return !!c && c.MAP.collectionID?.length > 0
      ? c.MAP.collectionID
      : !!c && c.MAP.name?.length > 0
      ? c.MAP.name
      : queryName;
  }, [collection, queryName]);

  useEffect(() => {
    console.log({ collectionName, collection });
  }, [collectionName, collection]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com - Collection {collectionId}</title>
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
          {collection?.map((artifact) => {
            return (
              <div key={artifact.origin}>
                {artifact && !artifact.file.type && (
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
                    contentType={artifact.file.type}
                    origin={artifact.origin || ""}
                    num={artifact.num}
                    height={artifact.height}
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
