import Artifact from "@/components/artifact";
import Tabs from "@/components/tabs";
import { OrdUtxo, useWallet } from "@/context/wallet";
import { fillContentType } from "@/utils/artifact";
import { find, head, last } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
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
    getArtifactsByOrigin,
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

  const singleStyle = `w-full text-center h-full flex items-center justify-center`;
  const collectionStyle = `grid grid-rows-4 h-full`;

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

      <div className="p-4 flex w-full md:flex-row flex-col mx-auto max-w-6xl">
        <div className={singleStyle}>
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
        <div className="md:ml-4 w-full max-w-sm">
          {fetchInscriptionsStatus === FetchStatus.Success &&
            artifacts.length === 0 && (
              <div className="bg-[#222] mx-auto rounded mb-8 max-w-2xl break-words text-sm p-4 mb-4">
                <div>No ordinals matching that ID</div>
              </div>
            )}
          <div className="bg-[#222] mx-auto rounded max-w-2xl break-words text-sm p-4 mx-4 my-4 md:my-0">
            <div className="flex flex-col justify-between mb-1">
              <div className="mb-1">Transaction ID</div>
              <div className="text-xs">{txid}</div>
            </div>
            {vout !== undefined && (
              <div className="flex justify-between items-center">
                <div>Output Index</div>
                <div>{vout}</div>
              </div>
            )}
          </div>

          {ordUtxos?.some((ou) => ou.origin === outpoint) && (
            <>
              <div className="bg-[#111] rounded max-w-2xl break-words text-sm p-4 flex flex-col md:my-4">
                <div className="flex justify-between items-center">
                  <div>Transfer Ownership</div>
                  <div
                    className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
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
                {/* <div className="flex justify-between items-center mt-4">
                <div>Re-Inscribe</div>
                <div className="rounded bg-[#222] p-2" onClick={async () => {}}>
                  SoonTm
                </div>
              </div> */}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TxPage;
