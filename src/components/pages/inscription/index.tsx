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

  const { getArtifactsByInscriptionId, fetchInscriptionsStatus } = useWallet();

  useEffect(() => {
    console.log({ inscriptionId });
    const fire = async (iid: number) => {
      const art = await getArtifactsByInscriptionId(iid);
      let arts = [];
      for (let a of art) {
        console.log("filline", a);
        const art2 = await fillContentType(a);
        arts.push(art2);
      }
      console.log("setting", arts);
      setArtifacts(arts);
    };
    if (inscriptionId && typeof inscriptionId === "string") {
      const id = parseInt(inscriptionId);
      if (id >= 0) {
        fire(id);
      }
    }
  }, [inscriptionId, getArtifactsByInscriptionId]);

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

      <div className="text-center">
        {artifacts.map((artifact) => {
          return (
            <Artifact
              key={artifact.txid}
              className="max-w-2xl"
              contentType={artifact.type}
              outPoint={artifact.origin || ""}
              id={artifact.id}
              to={`https://ordinals.gorillapool.io/api/files/inscriptions/${artifact.origin}`}
            />
          );
        })}
      </div>
      <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl text-sm p-4 my-4">
        Inscription #{inscriptionId}
        {fetchInscriptionsStatus === FetchStatus.Success &&
          artifacts.length === 0 && <div>No artifacts matching that ID</div>}
      </div>
    </>
  );
};

export default InscriptionPage;
