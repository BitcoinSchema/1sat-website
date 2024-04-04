import { createWalletStep } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";

interface Props {}

export function CreatedStep({}: Props) {
	function handleSecureWallet() {
		createWalletStep.value = CreateWalletStep.EnterPassphrase;
	}

	return (
		<>
			<div className="rounded my-2">
				Wallet created! Secure your wallet backup file to get started.
			</div>
			<div className="modal-action">
				<button
					className="btn btn-primary"
					type="button"
					onClick={handleSecureWallet}
				>
					Secure Wallet
				</button>
			</div>
		</>
	);
}
