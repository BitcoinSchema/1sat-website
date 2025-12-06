import { Button } from "@/components/ui/button";
import { createWalletStep } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";

type Props = {};

export function CreatedStep({}: Props) {
	function handleSecureWallet() {
		createWalletStep.value = CreateWalletStep.EnterPassphrase;
	}

	return (
		<>
			<div className="rounded my-2">
				Wallet created! Secure your wallet backup file to get started.
			</div>
			<div className="flex justify-end gap-2 mt-4">
				<Button type="button" onClick={handleSecureWallet}>
					Secure Wallet
				</Button>
			</div>
		</>
	);
}
