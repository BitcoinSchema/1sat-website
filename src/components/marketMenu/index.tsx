"use client";

import { bsvWasmReady, exchangeRate } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { effect } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import init from "bsv-wasm-web";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { FaStore } from "react-icons/fa";
let initAttempted = false;

const MarketMenu: React.FC = () => {
	useSignals();
	const address = ordAddress.value;

	effect(() => {
		const fire = async () => {
			await init();
			bsvWasmReady.value = true;
		};
		if (!initAttempted && bsvWasmReady.value === false) {
			initAttempted = true;
			fire();
		}
	});

	return (
		<>
			<div className="hidden md:block dropdown dropdown-end">
				{exchangeRate.value > 0 && (
					<div className="relative rounded bg-[#111] px-1 mr-2 text-sm text-[#555] pointer-events-none">
						1 BSV ={" "}
						<span className="text-emerald-300/50">
							${exchangeRate.value.toFixed(2)}
						</span>
					</div>
				)}
				{address && !exchangeRate.value && (
					<div className="relative rounded bg-[#111] px-1 mr-2 text-sm text-[#555] pointer-events-none">
						<CgSpinner className="animate-spin" />
					</div>
				)}
			</div>
			<div className="dropdown dropdown-end">
				<div
					className="btn btn-ghost m-1 rounded relative"
					tabIndex={0}
					role="button"
				>
					<FaStore />
				</div>

				<ul
					// biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
					tabIndex={0}
					className="dropdown-content z-[20] menu shadow bg-base-100 rounded-box w-64 border border-yellow-200/25 "
				>
					<li>
						<Link href="/market/ordinals">Ordinals</Link>
					</li>
					<li>
						<Link href="/market/bsv20">BSV20</Link>
					</li>
					<li>
						<Link href="/market/bsv21">BSV21</Link>
					</li>
				</ul>
			</div>
		</>
	);
};

export default MarketMenu;
