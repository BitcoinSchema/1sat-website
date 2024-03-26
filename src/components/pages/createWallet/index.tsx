"use client";

import CreateWalletModal from "@/components/modal/createWallet";
import { useSignal } from "@preact/signals-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const CreateWalletPage = () => {
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
		[open, router]
	);

	return <CreateWalletModal open={open.value} close={close} />;
};

export default CreateWalletPage;
