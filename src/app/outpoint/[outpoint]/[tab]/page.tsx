import dynamic from 'next/dynamic';
import Head from "next/head";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FaSpinner } from "react-icons/fa";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import { isValidOutpoint } from "@/utils/validation";

// Cache rendered pages at the CDN and revalidate in the background so
// repeat/crawler traffic doesn't invoke a serverless render every time.
// The empty generateStaticParams opts the route into ISR — pages render on
// demand and are cached for the revalidate window.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

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



const Outpoint = async ({ params }: { params: OutpointParams }) => {
  if (
    !isValidOutpoint(params.outpoint) ||
    !Object.values(OutpointTab).includes(params.tab as OutpointTab)
  ) {
    notFound();
  }

  // get tx details
  const parts = params.outpoint.split("_");
  const txid = parts[0];
  const vout = parts.length > 1 ? parts[1] : "0";

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
        <div className="max-w-6xl mx-auto w-full">
          {<TxDetails txid={txid} vout={Number.parseInt(vout)} />}
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
  const fallbackMetadata = {
    title: "Outpoint - 1SatOrdinals",
    description: "Explore item details on 1SatOrdinals.",
  };

  if (!isValidOutpoint(params.outpoint)) {
    return fallbackMetadata;
  }

  let details: OrdUtxo;
  try {
    const res = await fetch(`${API_HOST}/api/inscriptions/${params.outpoint}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return fallbackMetadata;
    }
    details = (await res.json()) as OrdUtxo;
  } catch (e) {
    return fallbackMetadata;
  }

  const isImageInscription =
    details.origin?.data?.insc?.file?.type?.startsWith("image");

  const name =
    details.origin?.data?.map?.name ||
    details.origin?.data?.bsv20?.tick ||
    details.origin?.data?.bsv20?.sym ||
    details.origin?.data?.insc?.json?.tick ||
    details.origin?.data?.insc?.json?.p ||
    details.origin?.data?.insc?.file?.type ||
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
