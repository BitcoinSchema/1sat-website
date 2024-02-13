"use client";

import CreateWalletModal from "@/components/modal/createWallet";
import { bsvWasmReady, payPk } from "@/signals/wallet";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const CreateWalletPage = ({
  payPk: payPkProp,
	ordPk: ordPkProp,
}: { payPk: string; ordPk: string }) => {
  useSignals();
	const router = useRouter();
	const open = useSignal(true);
	const close = useCallback(
		(signedOut = false) => {
			open.value = false;
			if (signedOut) {
				router.push("/");
				return;
			}
			router.back();
		},
		[open, router],
	);

  if (!bsvWasmReady.value) {
    return <div>Loading</div>
  }
	if (payPk.value) {
		console.log({ payPk: payPk.value });
		return (
			<div>
				You already have a wallet! If you really want to make a new wallet, sign
				out first
			</div>
		);
	}

	return (
		<div className="mx-auto">
			<CreateWalletModal open={open.value} close={close} keys={{payPk: payPkProp, ordPk: ordPkProp}} />
		</div>
	);
};

export default CreateWalletPage;
