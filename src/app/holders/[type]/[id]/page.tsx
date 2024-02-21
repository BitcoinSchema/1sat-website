import JDenticon from "@/components/JDenticon";
import { AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import Link from "next/link";
import React from "react";

interface Holder {
	address: string;
	amt: string;
	pct: number;
}

const Page = async ({
	params,
}: {
	params: { type: AssetType; id: string };
}) => {
	const { id, type, details, holders } = await getData(params.type, params.id);
	return (
		<div className="mx-auto flex flex-col max-w-5xl w-full">
			<h1 className="text-xl px-6">
				<Link href={`/market/${type}/${id}`}>
					{type === AssetType.BSV20 ? id : details.sym}
				</Link>{" "}
				Ownership Breakdown
			</h1>
			{type === AssetType.BSV21 && (
				<Link className="text-sm px-6" href={`/outpoint/${id}`}>
					ID: {id}
				</Link>
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
							<React.Fragment key={`${id}-holder-${h.address}`}>
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
};

export default Page;

const getData = async (type: AssetType, id: string) => {
	const res = await import("./data/route");

	const json = await (
		await res.GET(undefined, {
			params: {
				type,
				id,
			},
		})
	).json();

	return json as {
		holders: Holder[];
		details: BSV20;
		type: AssetType;
		id: string;
	};
}
