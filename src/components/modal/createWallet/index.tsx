"use client";

import { backupKeys } from "@/components/Wallet/menu";
import { showDepositModal } from "@/signals/wallet";
import { clearKeys, setOrdPk, setPayPk } from "@/signals/wallet/client";
import { useRouter } from "next/navigation";
import { useEffectOnce } from "usehooks-ts";

const CreateWalletModal = ({
	open,
	close,
	keys,
}: {
	open: boolean;
	close: (signOut?: boolean) => void;
	keys: { payPk: string; ordPk: string };
}) => {
	const router = useRouter();

	const backup = () => {
		setPayPk(keys.payPk);
		setOrdPk(keys.ordPk);
		backupKeys();
		router.push("/wallet/ordinals");
    showDepositModal.value = true
	};

	useEffectOnce(() => {
	});

	return (
		<dialog
			id="delete_wallet_modal"
			className={`modal ${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Create New Wallet</h3>
				<div className="p-2 rounded my-2">
					Secure your wallet backup file to get started.
				</div>
				<form method="dialog">
					<div className="modal-action">
						<button
							className="btn"
							type="button"
							onClick={() => {
								clearKeys();
								router.back();
							}}
						>
							Cancel
						</button>
						<button
							className="btn btn-secondary"
							type="button"
							onClick={backup}
						>
							Save Wallet
						</button>
					</div>
				</form>
			</div>
		</dialog>
	);
};

export default CreateWalletModal;
