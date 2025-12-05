import { showDepositModal } from "@/signals/wallet";
import { Button } from "@/components/ui/button";

interface Props {
	onClose: () => void;
}

export function FundStep({ onClose }: Props) {
	function handleFundWallet() {
		onClose();
		showDepositModal.value = true;
	}

	return (
		<>
			<div>You successfully created a wallet!</div>

			<div className="">
				You will need to fund your wallet in order to use it.
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button variant="outline" type="button" onClick={onClose}>
					Not Now
				</Button>
				<Button
					type="button"
					onClick={handleFundWallet}
				>
					Fund Wallet
				</Button>
			</div>
		</>
	);
}
