import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { API_HOST } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { head } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { FetchStatus } from "..";
import CollectionItem from "../inscription/collectionItem";

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

  const { collectionId } = router.query;
  const [fetchCollectionStatus, setFetchCollectionStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  useEffect(() => {
    console.log({ collectionId });
    const fire = async (cid: string) => {
      try {
        setFetchCollectionStatus(FetchStatus.Loading);
        const { promise } = customFetch<Item[]>(
          `${API_HOST}/api/collections/${cid}/items`
        );
        const c = await promise;
        console.log({ c });
        setCollection(c);
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
  }, [collectionId]);

  const collectionName = useMemo(() => {
    const c = head(collection);
    return !!c && c.MAP.name?.length > 0 ? c.MAP.name : queryName;
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
      <Tabs currentTab={undefined} />
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
