import Tabs from "@/components/tabs";
import { OrdUtxo, useOrdinals } from "@/context/ordinals";
import { fillContentType } from "@/utils/artifact";
import { head, last } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Ordinal from "../ordinals/single";

interface PageProps extends WithRouterProps {}

const TxPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<OrdUtxo[]>([]);
  const { outpoint } = router.query;

  const txid = head((outpoint as string | undefined)?.split("_"));
  const vout = outpoint?.includes("_")
    ? last((outpoint as string | undefined)?.split("_"))
    : undefined;

  const { getArtifactsByTxId, getArtifactsByOrigin } = useOrdinals();

  useEffect(() => {
    console.log({ vout });
    const fire = async (t: string) => {
      let art: OrdUtxo[] = [];
      if (vout) {
        art = await getArtifactsByOrigin(outpoint as string);
      } else {
        art = await getArtifactsByTxId(t);
      }

      let arts = [];
      for (let a of art) {
        if (a.origin?.split("_")[0] === a.txid) {
          const art2 = await fillContentType(a);
          arts.push(art2);
        } else {
          console.log("other", a);
        }
      }
      setArtifacts(arts);
    };
    if (txid) {
      fire(txid);
    }
  }, [outpoint, getArtifactsByOrigin, vout, getArtifactsByTxId, txid]);

  console.log({ artifacts });
  return (
    <>
      <Head>
        <title>1SatOrdinals.com - {txid}</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs currentTab={undefined} />
      <div className="p-4 flex w-full md:flex-row flex-col mx-auto max-w-6xl">
        {artifacts?.map((a) => {
          return <Ordinal key={a.txid} artifact={a} />;
        })}
      </div>
    </>
  );
};

export default TxPage;
