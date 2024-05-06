import OutpointCollection from "@/components/pages/outpoint/collection";
import OutpointHeading from "@/components/pages/outpoint/heading";
import OutpointInscription from "@/components/pages/outpoint/inscription";
import OutpointListing from "@/components/pages/outpoint/listing";
import OutpointOwner from "@/components/pages/outpoint/owner";
import OutpointTimeline from "@/components/pages/outpoint/timeline";
import OutpointToken from "@/components/pages/outpoint/token";
import DisplayIO from "@/components/transaction";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import { Transaction } from "bsv-wasm";
import Head from "next/head";
import { Suspense } from "react";
import { FaSpinner } from "react-icons/fa";

type OutpointParams = {
  outpoint: string;
  tab: string;
};

export type IODisplay = {
  address?: string;
  script?: string;
  index: number;
  txid: string;
  amount: bigint;
};

export type InputOutpoint = {
  script: string;
  satoshis: bigint;
  txid: string;
  vout: number;
};

const Outpoint = async ({ params }: { params: OutpointParams }) => {
  // get tx details
  const parts = params.outpoint.split("_");
  const txid = parts[0];
  const vout = parts.length > 1 ? parts[1] : "0";

  let rawTx: string | undefined; // raw tx hex
  let inputOutpoints: InputOutpoint[] = [];
  let outputSpends: string[] = [];

  // TODO: 4db870f0993ef20f7d4cfe8e5dc9b041841c5acef153d9530d7abeaa7665b250_1 fails
  try {
    const response = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    );
    rawTx = await response.text();
    /* TODO: fetch the connected inputs because getting satoshis will fail otherwise */

    // parse the raw tx
    const tx = Transaction.from_hex(rawTx);
    inputOutpoints = [];
    const numInputs = tx.get_ninputs();
    for (let i = 0; i < numInputs; i++) {
      const input = tx.get_input(i);
      const txid = input?.get_prev_tx_id_hex()!;
      const vout = input?.get_vout()!;
      // fetch each one
      const url = `https://junglebus.gorillapool.io/v1/txo/get/${txid}_${vout}`;
      const spentOutpointResponse = await fetch(url, {
        headers: {
          Accept: "application/octet-stream",
        },
      });
      const res = await spentOutpointResponse.arrayBuffer();
      const { script, satoshis } = parseOutput(res);

      // const s = Script.fromHex(script).toASM();
      inputOutpoints.push({ script, satoshis, txid, vout });
    }

    const outputOutpoints: string[] = [];
    const numOutputs = tx.get_noutputs();
    for (let i = 0; i < numOutputs; i++) {
      outputOutpoints.push(`${txid}_${i}`);
    }

    // check if outputs are spent
    const outputSpendsResponse = await fetch(`${API_HOST}/api/spends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Accept: "application/json",
      },
      body: JSON.stringify(outputOutpoints),
    });

    outputSpends = ((await outputSpendsResponse.json()) || []).filter(
      (s: string) => s && s !== ""
    );
    // console.log({ outputOutpoints, outputSpends });
  } catch (e) {
    console.error(e);
  }

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
          <div className="flex">
            <OutpointHeading outpoint={`${txid}_${vout}`} />
          </div>
          {rawTx && inputOutpoints && outputSpends && (
            <DisplayIO
              rawtx={rawTx}
              inputOutpoints={inputOutpoints}
              outputSpends={outputSpends}
              vout={Number.parseInt(vout)}
            />
          )}

          {content()}
        </div>
      </Suspense>
    </>
  );
};

export default Outpoint;

function parseVarInt(hex: string): [number, string] {
  let len = 1;
  let value = Number.parseInt(hex.substring(0, 2), 16);

  if (value < 0xfd) {
    return [value, hex.substring(2)];
  }
  if (value === 0xfd) {
    len = 3;
  } else if (value === 0xfe) {
    len = 5;
  } else {
    len = 9;
  }

  value = Number.parseInt(hex.substring(2, len * 2), 16);
  return [value, hex.substring(len * 2)];
}

function parseOutput(output: ArrayBuffer): {
  satoshis: bigint;
  script: string;
} {
  // Extract the amount (8 bytes) and convert from little-endian format
  const view = new DataView(output);
  const satoshis = view.getBigUint64(0, true); // true for little-endian

  // Convert the rest of the buffer to hex and extract the script
  const hex = Buffer.from(output.slice(8)).toString("hex");
  const [scriptLength, remainingHex] = parseVarInt(hex);
  const script = remainingHex.substring(0, scriptLength * 2);

  return {
    satoshis: satoshis,
    script: script,
  };
}

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

  return {
    title: "Item details - 1SatOrdinals",
    description: `Explore item details for ${isImageInscription ? "image" : name
      } on 1SatOrdinals.`,
    openGraph: {
      title: "Item details - 1SatOrdinals",
      description: `Explore item details for ${isImageInscription ? `image ${params.outpoint}` : name
        } on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Item details - 1SatOrdinals",
      description: `Explore item details for ${isImageInscription ? "image" : name
        } on 1SatOrdinals.`,
    },
  };
}
