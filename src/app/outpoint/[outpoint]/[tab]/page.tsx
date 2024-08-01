import dynamic from 'next/dynamic';
import Head from "next/head";
import { Suspense } from "react";
import { FaSpinner } from "react-icons/fa";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";

const TxDetails = dynamic(() => import("@/components/transaction"));
const OutpointTimeline = dynamic(() => import("@/components/pages/outpoint/timeline"));
const OutpointInscription = dynamic(() => import("@/components/pages/outpoint/inscription"));
const OutpointToken = dynamic(() => import("@/components/pages/outpoint/token"));
const OutpointListing = dynamic(() => import("@/components/pages/outpoint/listing"));
const OutpointCollection = dynamic(() => import("@/components/pages/outpoint/collection"));
const OutpointOwner = dynamic(() => import("@/components/pages/outpoint/owner"));


type OutpointParams = {
  outpoint: string;
  tab: string;
};

export type IODisplay = {
  address?: string;
  script?: string;
  index: number;
  txid: string;
  amount: number;
};

export type InputOutpoint = {
  script: string;
  satoshis: bigint;
  txid: string;
  vout: number;
};



const Outpoint = async ({ params, searchParams }: { params: OutpointParams, searchParams: { [key: string]: string | string[] | undefined } }) => {
  // get tx details
  const parts = params.outpoint.split("_");
  const txid = parts[0];
  const vout = parts.length > 1 ? parts[1] : "0";
  const details = searchParams.details === "true";

  // try {
  // 	const spendResponse = await fetch(
  // 		`https://junglebus.gorillapool.io/v1/txo/spend/${txid}_${vout}`,
  // 		{
  // 			headers: {
  // 				Accept: "application/octet-stream",
  // 			},
  // 		}
  // 	);
  // 	// if spendTxid is empty here, this is not spent. if its populated, its a binary txid where it was spent
  // 	const buffer = await spendResponse.arrayBuffer();
  // 	if (!buffer.byteLength) {
  // 		console.log("not spent");
  // 	}
  // 	const spendTxid = Buffer.from(buffer).toString("hex");
  // 	console.log({ spendTxid });
  // } catch (e) {
  // 	console.error(e);
  // }

  const content = () => {
    const outpoint = `${txid}_${vout}`;
    const tab = params.tab as OutpointTab;
    switch (tab as OutpointTab) {
      case OutpointTab.Timeline:
        return <OutpointTimeline outpoint={outpoint} />;
      case OutpointTab.Inscription:
        return <OutpointInscription outpoint={outpoint} />;
      case OutpointTab.Token:
        return <OutpointToken outpoint={outpoint} />;
      case OutpointTab.Listing:
        return <OutpointListing outpoint={outpoint} />;
      case OutpointTab.Collection:
        return <OutpointCollection outpoint={outpoint} />;
      case OutpointTab.Owner:
        return <OutpointOwner outpoint={outpoint} />;
    }
  };

  // console.log({ rawTx, inputOutpoints, outputSpends });

  return (
    <>
      <Head>
        <meta property="og:image" content="<generated>" />
        <meta
          property="og:image:alt"
          content={`Outpoint ${txid}_${vout}`}
        />
      </Head>
      <Suspense
        fallback={
          <div className="mx-auto h-full">
            <FaSpinner className="animate-spin" />
          </div>
        }
      >
        <div className="max-w-6xl mx-auto w-full h-full">
          {<TxDetails txid={txid} vout={Number.parseInt(vout)} showing={details} />}
          {content()}
        </div>
      </Suspense>
    </>
  );
};

export default Outpoint;

export async function generateMetadata({
  params,
}: {
  params: { outpoint: string; tab: string };
}) {
  const details = await fetch(
    `${API_HOST}/api/inscriptions/${params.outpoint}`
  ).then((res) => res.json() as Promise<OrdUtxo>);

  const isImageInscription =
    details.origin?.data?.insc?.file.type?.startsWith("image");

  const name =
    details.origin?.data?.map?.name ||
    details.origin?.data?.bsv20?.tick ||
    details.origin?.data?.bsv20?.sym ||
    details.origin?.data?.insc?.json?.tick ||
    details.origin?.data?.insc?.json?.p ||
    details.origin?.data?.insc?.file.type ||
    "Mystery Outpoint";

  const title = `${details.data?.list && (!details.spend || details.spend?.length === 0) ? "Buy " : ""}${name} - 1SatOrdinals`

  // TODO: Make listing metadata better - show price, collection, etc
  return {
    title,
    description: `Explore item details for ${isImageInscription ? "image" : name
      } on 1SatOrdinals.`,
    openGraph: {
      title,
      description: `Explore item details for ${isImageInscription ? `image ${params.outpoint}` : name
        } on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Explore item details for ${isImageInscription ? "image" : name
        } on 1SatOrdinals.`,
    },
  };
}
