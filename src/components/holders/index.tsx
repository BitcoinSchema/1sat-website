"use client";
import { Fragment, useRef, useEffect, useState } from "react";
import JDenticon from "@/components/JDenticon";
import type { AssetType } from "@/constants";
import { getBalanceText } from "@/utils/wallet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import Link from "next/link";
import { getHolders, resultsPerPage } from "@/utils/getHolders";
import type { Holder, TickHolder } from "../pages/TokenMarket/details";
import { FiLoader } from "react-icons/fi";
import { Separator } from "@/components/ui/separator";

type Props = {
	type: AssetType;
	id: string;
	details: any;
};

const HoldersTable = ({ type, id, details }: Props) => {
	const ref = useRef(null);
	const isInView = useInView(ref);
	const [holders, setHolders] = useState<Holder[] | TickHolder[]>([]);
	const numHolders = (holders || []).length > 0 ? holders.length : 0;

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = useInfiniteQuery({
		queryKey: ["holders"],
		queryFn: ({ pageParam }) =>
			getHolders({ type, id, pageParam, details }),
		initialPageParam: 0,
		getNextPageParam: (lastPage, _pages, lastPageParam) => {
			if (lastPage?.length === resultsPerPage) {
				return lastPageParam + 1;
			}
			return undefined;
		},
	});

	useEffect(() => {
		if (data) {
			const pageData = data.pages[data.pages.length - 1];
			if (pageData !== undefined) {
				const u = data.pages.reduce(
					(acc, val) => (acc || []).concat(val || []),
					[]
				);
				setHolders(u);
			}
		}
	}, [data, data?.pages[data.pages.length - 1]]);

	useEffect(() => {
		const newPageData = data?.pages[data.pages.length - 1];

		if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
			fetchNextPage();
		}
	}, [isInView]);

	const processHolder = (h: Holder | TickHolder) => {
		const pctWidth = `${h.pct}%`;
		const balance = Number.parseFloat(h?.amt);
		const numDecimals = details.dec || 0;

		const balanceText = getBalanceText(balance, numDecimals);
		const tooltip =
			balance.toString() !== balanceText.trim()
				? balance.toLocaleString()
				: "";

		return (
			<Fragment key={`${id}-holder-${h.address}`}>
				<Link
					className="flex items-center text-sm flex-1"
					href={`/activity/${h.address}/ordinals`}
				>
					<JDenticon
						hashOrValue={h.address}
						className="w-8 h-8 mr-2"
					/>
					<span className="hidden md:block">{h.address}</span>
				</Link>
				<div className="w-24 text-right tooltip" data-tip={tooltip}>
					{balanceText}
				</div>
				<div className="w-24 text-right">{h?.pct?.toFixed(4)}%</div>
				<div className="flex items-center mb-2 relative col-span-3">
					<div
						className="w-full bg-amber-500/25 rounded h-1"
						style={{ width: pctWidth }}
					>
						&nbsp;
					</div>
				</div>
			</Fragment>
		);
	};

	return (
		<div className="w-full">
			{status === "pending" && (
				<p className="text-center py-10">Loading...</p>
			)}
			{!!holders?.length && (
				<div className="w-full">
					<div className="grid grid-template-columns-3 p-6">
						<div className="">
							Address ({numHolders === 100 ? "100+" : numHolders})
						</div>
						<div className="w-24 text-right">Holdings</div>
						<div className="w-12 text-right">Ownership</div>
						<Separator className="col-span-3 my-2" />
						{holders?.map((h) => processHolder(h))}
					</div>
				</div>
			)}

			<div ref={ref} className="flex items-center justify-center h-6">
				{isFetching && <FiLoader className="animate animate-spin" />}
			</div>
		</div>
	);
};

export default HoldersTable;
