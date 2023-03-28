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
    getArtifactsByTxId,
    fetchInscriptionsStatus,
    transfer,
    fundingUtxos,
  } = useWallet();

  const ordinalUtxo = useMemo(() => {
    return (
      (find(
        ordUtxos,
        (ou) => ou.origin && ou.origin === outpoint
      ) as OrdUtxo) || undefined
    );
  }, [ordUtxos, outpoint]);

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
      <div className="p-4 w-full">
        <div className="text-center w-full h-full flex items-center justify-center">
          {artifacts?.map((artifact) => {
            return (
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
            );
          })}
        </div>
        {fetchInscriptionsStatus === FetchStatus.Success &&
          artifacts.length === 0 && (
            <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 m-4">
              <div>No artifacts matching that ID</div>
            </div>
          )}

        <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 m-4">
          <div className="flex justify-between items-center">
            <div>Transaction ID:</div>
            <div>{txid}</div>
            {vout !== undefined ? (
              <>
                <br />
              </>
            ) : (
              ""
            )}
          </div>
          {vout !== undefined && (
            <div className="flex justify-between items-center">
              <div>Output Index</div>
              <div>#{vout}</div>
            </div>
          )}
        </div>

        {ordUtxos?.some((ou) => ou.origin === outpoint) && (
          <>
            <h1 className="mx-auto rounded max-w-2xl break-words text-sm p-4 mx-4 flex justify-center items-center text-center">
              Owner Controls
            </h1>
            <div className="bg-[#111] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 m-4 flex flex-col">
              <div className="flex justify-between items-center">
                <div>Transfer Ownership</div>
                <div
                  className="rounded bg-[#222] p-2"
                  onClick={async () => {
                    console.log("click send");
                    const address = prompt(
                      "Enter the Bitcoin address to send this ordinal to. MAKE SURE THE WALLET ADDRESS YOU'RE SENDNG TO UNDERSTANDS ORDINALS, AND EXPECTS TORECIEVE 1SAT ORDINALS AT THIS ADDRESS!"
                    );

                    if (address) {
                      console.log(
                        "transferring",
                        { ordinalUtxo },
                        "to",
                        { address },
                        "funded by",
                        { fundingUtxos }
                      );

                      await transfer(ordinalUtxo, address);
                    }
                  }}
                >
                  Send
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>Re-Inscribe</div>
                <div className="rounded bg-[#222] p-2" onClick={async () => {}}>
                  SoonTm
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TxPage;
