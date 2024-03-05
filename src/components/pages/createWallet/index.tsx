"use client";

import CreateWalletModal from "@/components/modal/createWallet";
import { bsvWasmReady, ordPk, payPk } from "@/signals/wallet";
import { WalletKeys } from "@/utils/keys";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import init, { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const CreateWalletPage = () => {
	useSignals();
const alreadyHasKey = useSignal<boolean | undefined>(undefined);

  useEffect(() => {
    alreadyHasKey.value = !!payPk.value;
  }, [alreadyHasKey]);

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

	useEffect(() => {
		if (!alreadyHasKey.value) {
			randomKeys().then((keys) => {
				payPk.value = keys.payPk;
				ordPk.value = keys.ordPk;
			});
		}
	}, [alreadyHasKey]);

	if (!bsvWasmReady.value) {
		return <div>Loading</div>;
	}
	if (alreadyHasKey.value) {
		console.log({ payPk: payPk.value });
		return (
			<div>
				You already have a wallet! If you really want to make a new wallet, sign
				out first
			</div>
		);
	}

	return payPk.value && ordPk.value && (
		<div className="mx-auto">
			<CreateWalletModal
				open={open.value}
				close={close}
				keys={{ payPk: payPk.value, ordPk: ordPk.value }}
			/>
		</div>
	);
};

export default CreateWalletPage;

const randomKeys: () => Promise<WalletKeys> = async () => {
  await init()
  return new Promise<WalletKeys>((resolve, reject) => {
    const payPk = PrivateKey.from_random().to_wif();
    let ordPk = PrivateKey.from_random();
    const timeoutMs = 100000;
    // TODO: This needs to be done in the backend
    // and transmitted securely to do 1sat addresses
    // TODO: Estimate remaining time
    // TODO: cancel
    // TODO: gpu acceleration?
    // TODO: 1sat is too slow
    // TODO: escape w timeout
    const ts = new Date().getTime();
    while (!addressForPrivakeKey(ordPk).startsWith("1s")) {
      ordPk = PrivateKey.from_random();
      if (new Date().getTime() - ts > timeoutMs) {
        reject({});
      }
    }
    resolve({ payPk, ordPk: ordPk.to_wif() } as WalletKeys);
  });
};

const addressForPrivakeKey = (ordPk: PrivateKey) => P2PKHAddress.from_pubkey(PublicKey.from_private_key(ordPk)).to_string();
