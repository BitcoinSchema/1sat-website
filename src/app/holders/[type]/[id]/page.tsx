// app/holders/[type]/[id]/page.server.tsx
import JDenticon from "@/components/JDenticon";
import { Holder } from "@/components/pages/TokenMarket/list";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import { GetStaticPropsContext } from "next";
import Link from "next/link";
import React from "react";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

async function fetchData(
	type: AssetType,
	id: string,
): Promise<{ details: BSV20; holders: TickHolder[] }> {
	const detailsUrl = `${API_HOST}/api/bsv20/${
		type === AssetType.BSV20 ? "tick" : "id"
	}/${id}`;
	const holdersUrl = `${API_HOST}/api/bsv20/${
		type === AssetType.BSV20 ? "tick" : "id"
	}/${id}/holders?limit=100`;

	// Correctly using customFetch according to your specification
	const { promise: detailsPromise } = http.customFetch<BSV20>(detailsUrl);
	const details = await detailsPromise;

	const { promise: holdersPromise } = http.customFetch<Holder[]>(holdersUrl);
	const rawHolders = await holdersPromise;

	// Assuming the need to process holders' data, e.g., calculating percentages
	const holders: TickHolder[] = rawHolders
		.sort((a, b) => parseInt(b.amt) - parseInt(a.amt))
		.map((holder) => ({
			...holder,
			amt: parseInt(holder.amt) / 10 ** (details.dec || 0),
			pct: details.supply
				? (parseInt(holder.amt) / parseInt(details.supply)) * 100
				: 0,
		}));

	return { details, holders };
}

export default async function Page({ params }: GetStaticPropsContext<{ type: AssetType; id: string }>) {
	if (!params) {
		return { notFound: true };
	}
	const { type, id } = params;
	const { details, holders } = await fetchData(type, id);

	return (
    <div className="mx-auto flex flex-col max-w-5xl w-full">
    <h1 className="text-xl px-6">
      <Link href={`/market/${params.type}/${params.id}`}>{params.type === AssetType.BSV20 ? params.id : details.sym}</Link> Ownership
      Breakdown
    </h1>
    {params.type === AssetType.BSV21 && (
      <Link className="text-sm px-6" href={`/outpoint/${params.id}`}>ID: {params.id}</Link>
    )}
    <div className="divider" />
    <div className="w-full">
      <div className="grid grid-template-columns-3 p-6">
        <div className="">Address</div>
        <div className="w-24 text-right">Holdings</div>
        <div className="w-12 text-right">Ownership</div>
        <div className="divider col-span-3" />
        {(holders || []).map((h) => {
          const pctWidth = `${h.pct}%`;
          return (
            <React.Fragment key={`${params.id}-holder-${h.address}`}>
              <Link
                className="flex items-center text-sm flex-1"
                href={`/activity/${h.address}/ordinals`}
              >
                <JDenticon hashOrValue={h.address} className="w-8 h-8 mr-2" />
                <span className="hidden md:block">{h.address}</span>
              </Link>
              <div className="w-24 text-right">{h.amt}</div>
              <div className="w-24 text-right">{h.pct.toFixed(4)}%</div>
              <div className="flex items-center mb-2 relative col-span-3">
                <div
                  className="w-full bg-warning/25 rounded h-1"
                  style={{ width: pctWidth }}
                >
                  &nbsp;
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </div>
	);
}
