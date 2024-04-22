"use client";

import JDenticon from "@/components/JDenticon";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import { customFetch } from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { NextRequest } from "next/server";
import React from "react";
import { FaSpinner } from "react-icons/fa";

interface Holder {
	address: string;
	amt: string;
	pct: number;
}

const Page = ({ params }: { params: { type: AssetType; id: string } }) => {
	const type = params.type;
	const id = params.id;

	const { data: details, isLoading: detailsLoading } = useQuery({
		queryKey: ["details", type, id],
		queryFn: async () => {
			const { promise } = customFetch<BSV20>(
				`/holders/${type}/${id}/details`,
				{
					method: "GET",
				}
			);

			return promise;
		},
	});

	const { data: holders, isLoading: holdersLoading } = useQuery({
		queryKey: ["holders", type, id, details],
		queryFn: () => {
			if (!details) {
				return [];
			}

			const { promise } = customFetch<Holder[]>(
				`/holders/${type}/${id}/holders`,
				{
					method: "POST",
					body: JSON.stringify({ details }),
				}
			);

			return promise;
		},
		enabled: !!details,
	});

	const numHolders = (holders || []).length > 0 ? holders?.length : 0;

	if (detailsLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="mx-auto flex flex-col max-w-5xl w-full">
			<h1 className="text-xl px-6">
				<Link href={`/market/${type}/${id}`}>
					{type === AssetType.BSV20 ? id : details?.sym}
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
					<div className="">
						Address ({numHolders === 100 ? "100+" : numHolders})
					</div>
					<div className="w-24 text-right">Holdings</div>
					<div className="w-12 text-right">Ownership</div>

					<div className="divider col-span-3" />

					{holdersLoading && (
						<div className="divider col-span-3">
							<FaSpinner className="animate-spin" />
						</div>
					)}

					{((holders || []) as Holder[]).map((h) => {
						const pctWidth = `${h.pct}%`;
						return (
							<React.Fragment key={`${id}-holder-${h.address}`}>
								<Link
									className="flex items-center text-sm flex-1"
									href={`/activity/${h.address}/ordinals`}
								>
									<JDenticon
										hashOrValue={h.address}
										className="w-8 h-8 mr-2"
									/>
									<span className="hidden md:block">
										{h.address}
									</span>
								</Link>
								<div className="w-24 text-right">{h.amt}</div>
								<div className="w-24 text-right">
									{h.pct.toFixed(4)}%
								</div>
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
