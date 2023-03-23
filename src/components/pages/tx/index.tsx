import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { head, last } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface PageProps extends WithRouterProps {}

const TxPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<OrdUtxo[]>([]);
  const { outpoint } = router.query;

  const txid = head((outpoint as string | undefined)?.split("_"));
  const vout = outpoint?.includes("_")
    ? last((outpoint as string | undefined)?.split("_"))
    : undefined;

  const { getUTXOs, changeAddress, getArtifactsByTxId } = useWallet();

  useEffect(() => {
    console.log({ vout });
    const fire = async (t: string) => {
      const art = await getArtifactsByTxId(t);
      let arts = [];
      for (let a of art) {
        console.log("filline", a);
        const art2 = await fillContentType(a);
        arts.push(art2);
      }
      console.log("setting", arts);
      setArtifacts(arts);
    };
    if (txid) {
      fire(txid);
    }
  }, [vout, getArtifactsByTxId, txid]);

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
      <Tabs currentTab={undefined} />
      <div className="bg-[#222] mx-auto rounded mb-8 max-w-xl text-sm p-4">
        Transaction ID: {txid}
        {vout !== undefined ? (
          <>
            <br />
            {"Output #" + vout}
          </>
        ) : (
          ""
        )}
      </div>
      <div className="text-center">
        {artifacts.map((artifact) => {
          return (
            <Artifact
              key={artifact.txid}
              className="max-w-2xl"
              contentType={artifact.type}
              outPoint={`${artifact.txid}_${artifact.vout}`}
            />
          );
        })}
      </div>
    </>
  );
};

export default TxPage;
