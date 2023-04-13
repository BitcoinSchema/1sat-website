import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { useBitcoinSchema } from "@/context/bitcoinschema";
import { OrdUtxo, useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const CollectionPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifact, setArtifact] = useState<OrdUtxo | undefined>();

  const { collectionId } = router.query;
  const { getBmapTxById } = useBitcoinSchema();
  const { fetchInscriptionsStatus, getArtifactByInscriptionId } = useOrdinals();
  const { getArtifactsByCollectionId, collection, fetchCollectionStatus } =
    useBitcoinSchema();
  useEffect(() => {
    console.log({ collectionId });
    const fire = async (iid: string) => {
      await getArtifactsByCollectionId(iid);
    };
    if (collectionId && typeof collectionId === "string") {
      fire(collectionId);
    }
  }, [
    getArtifactsByCollectionId,
    getBmapTxById,
    collectionId,
    getArtifactByInscriptionId,
  ]);

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
      <div className="p-4 flex flex-col w-full justify-center items-center mx-auto max-w-6xl">
        <div className="p-4 flex w-full md:flex-row flex-col mx-auto max-w-6xl justify-center">
          <div className="text-center h-full flex flex-row items-center justify-center">
            {collection?.map((artifact) => {
              return (
                <div key={artifact.tx.h}>
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
              );
            })}
          </div>
          <div className="md:ml-4 w-full max-w-sm">
            {fetchCollectionStatus === FetchStatus.Loading && (
              <div>
                <LoaderIcon className="mx-auto" />
              </div>
            )}
            {fetchCollectionStatus === FetchStatus.Success && !artifact && (
              <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 mb-4">
                <div>No collection matching that ID</div>
              </div>
            )}
            <div className="bg-[#222] mx-auto rounded max-w-2xl break-words text-sm p-4 mx-4 my-4 md:my-0 md:mb-2">
              <div>{collectionId}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionPage;
