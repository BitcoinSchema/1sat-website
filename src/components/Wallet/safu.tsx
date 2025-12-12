"use client";

import { showUnlockWalletModal } from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { BsShieldLockFill } from "react-icons/bs";

const SAFU = () => {
	useSignals();

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			className="mx-auto w-fit flex flex-col items-center justify-center cursor-pointer min-h-[70vh]"
			onClick={() => {
				showUnlockWalletModal.value = true;
			}}
		>
			<div
				className="flex items-center text-2xl text-[#555] my-4 font-serif italic"
			>
				<BsShieldLockFill className="w-6 h-6 text-[#555] mr-2" />
				Funds are SAFU
			</div>

			<div className="btn btn-primary mt-4 btn-neutral">
				Unlock Wallet
			</div>
		</div>
	);
};

export default SAFU;
