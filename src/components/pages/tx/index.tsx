import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { find, head, last } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const TxPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<OrdUtxo[]>([]);
  const { outpoint } = router.query;

  const txid = head((outpoint as string | undefined)?.split("_"));
  const vout = outpoint?.includes("_")
    ? last((outpoint as string | undefined)?.split("_"))
    : undefined;

  const {
    ordUtxos,
    getUTXOs,
    getOrdinalUTXOs,
    changeAddress,
    getArtifactsByTxId,
    fetchInscriptionsStatus,
    transfer,
  } = useWallet();

  const ordinalUtxo = useMemo(() => {
    return (
      (find(ordUtxos, (ou) => ou.txid && ou.txid === txid) as OrdUtxo) ||
      undefined
    );
  }, [ordUtxos, txid]);

  useEffect(() => {
    console.log({ vout });
    const fire = async (t: string) => {
      const art = await getArtifactsByTxId(t);
      let arts = [];
      for (let a of art) {
        if (a.origin?.split("_")[0] === a.txid) {
          const art2 = await fillContentType(a);
          arts.push(art2);
        } else {
          console.log("other", a);
        }
      }
      console.log("setting", arts);
      setArtifacts(arts);
    };
    if (txid) {
      fire(txid);
    }
  }, [vout, getArtifactsByTxId, txid]);

  // useEffect(() => {
  //   console.log({ vout });
  //   const fire = async (t: string) => {
  //     const art = await getOrdinalUTXOs(t);
  //     let arts = [];
  //     for (let a of art) {
  //       if (a.origin?.split("_")[0] === a.txid) {
  //         const art2 = await fillContentType(a);
  //         arts.push(art2);
  //       } else {
  //         console.log("other", a);
  //       }
  //     }
  //     console.log("setting", arts);
  //     setArtifacts(arts);
  //   };
  //   if (txid) {
  //     fire(txid);
  //   }
  // }, [vout, getArtifactsByTxId, txid]);

  // console.log({ artifacts });

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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Tabs currentTab={undefined} />

      <div className="text-center w-full h-full flex items-center justify-center">
        {artifacts?.map((artifact) => {
          return (
            <Artifact
              key={artifact.txid}
              classNames={{ wrapper: `max-w-5xl w-full h-full` }}
              contentType={artifact.type}
              outPoint={artifact.origin || ""}
              id={artifact.id}
            />
          );
        })}
      </div>
      <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl text-sm p-4 my-4">
        Transaction ID: {txid}
        {fetchInscriptionsStatus === FetchStatus.Success &&
          artifacts.length === 0 && <div>No artifacts matching that ID</div>}
        {vout !== undefined ? (
          <>
            <br />
            {"Output #" + vout}
          </>
        ) : (
          ""
        )}
        {ordUtxos?.some((ou) => ou.txid === txid) && (
          <div
            className="rounded bg-[#222]"
            onClick={async () => {
              console.log("click send");
              const address = prompt(
                "Enter the Bitcoin address to send this ordinal to. MAKE SURE THE WALLET ADDRESS YOU'RE SENDNG TO UNDERSTANDS ORDINALS, AND EXPECTS TORECIEVE 1SAT ORDINALS AT THIS ADDRESS!"
              );

              if (address) {
                console.log("transferring", { ordinalUtxo }, "to", { address });

                await transfer(ordinalUtxo, address);
              }
            }}
          >
            Send
          </div>
        )}
      </div>
    </>
  );
};

export default TxPage;
