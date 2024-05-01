"use client";

import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { useCallback, useMemo } from "react";

const Menu = () => {
	useSignals();
	const hoveredItem = useSignal<string | null>(null);

	const mouseEnter = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			hoveredItem.value = e.currentTarget.id;
		},
		[hoveredItem]
	);

	const mouseLeave = useCallback(() => {
		hoveredItem.value = null;
	}, [hoveredItem]);

	const baseClass =
		"absolute top-0 left-0 right-0 w-full p-2 text-lg text-center text-sm text-warning/75 font-mono transition duration-1000 opacity-0";

	const hoverBsv20Class = useMemo(() => {
		return `${baseClass} ${
			hoveredItem.value === "bsv20-btn" ? "opacity-100" : ""
		}`;
	}, [hoveredItem.value]);

	const hoverBsv21Class = useMemo(() => {
		return `${baseClass} ${
			hoveredItem.value === "bsv21-btn" ? "opacity-100" : ""
		}`;
	}, [hoveredItem.value]);

	const hoverOrdClass = useMemo(() => {
		return `${baseClass} ${
			hoveredItem.value === "ord-btn" ? "opacity-100" : ""
		}`;
	}, [hoveredItem.value]);

	return (
		<div className="relative">
			<div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center">
				<div className={hoverBsv20Class}>
					first is first fungible tokens
				</div>
				<div className={hoverBsv21Class}>
					token contracts like LTM and POW20
				</div>
				<div className={hoverOrdClass}>
					digital paintings, generative art, kittens
				</div>
			</div>
			<div className="flex mx-auto max-w-fit gap-4 mt-16">
				<Link
					id="ord-btn"
					href="/market/ordinals"
					className="font-mono flex flex-col btn md:btn-lg md:btn-ghost border-neutral/75 hover:border-warning/25 font-bold mb-4 transition group"
					onMouseEnter={mouseEnter}
					onMouseLeave={mouseLeave}
				>
					Ordinals
					<span className="font-normal text-xs text-warning/50 md:opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
						Art NFTs
					</span>
				</Link>
				<Link
					id="bsv20-btn"
					href="/market/bsv20"
					className="font-mono flex flex-col btn md:btn-lg md:btn-ghost border-neutral/75 hover:border-warning/25 font-bold mb-4 transition group"
					onMouseEnter={mouseEnter}
					onMouseLeave={mouseLeave}
				>
					BSV20
					<span className="font-normal text-xs text-warning/50 md:opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
						Degen FTs
					</span>
				</Link>
				<Link
					id="bsv21-btn"
					href="/market/bsv21"
					className="font-mono flex flex-col btn md:btn-lg md:btn-ghost border-neutral/75 hover:border-warning/25 font-bold mb-4 transition group"
					onMouseEnter={mouseEnter}
					onMouseLeave={mouseLeave}
				>
					BSV21
					<span className="font-normal text-xs text-warning/50 md:opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
						Pro FTs
					</span>
				</Link>
			</div>
		</div>
	);
};

export default Menu;
