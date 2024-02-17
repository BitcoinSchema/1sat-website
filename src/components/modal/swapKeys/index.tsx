"use client";

import { swapKeys } from "@/components/Wallet/menu";

const SwapKeysModal = ({
	open,
	close,
}: {
	open: boolean;
	close: (cancel?: boolean) => void;
}) => {

  const executeSwap = () => {
    swapKeys();
    close(true);
  }
	return (
		<dialog
			id="delete_wallet_modal"
			className={`modal ${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Warning: Read First</h3>
				<p className="py-4 text-warning">
					This will swap your ordinals key with your payment key. This is useful
					for recovering BSV or tokens sent to the wrong address for your key. You can potentially spend tokens that you didn&apos;t mean
					to spend with this tool. Be careful and remember to swap back when
					your recovery is complete!
				</p>
				<form method="dialog">
					<div className="modal-action">
						<button
							className="btn"
							type="button"
							onClick={() => {
								close(true);
							}}
						>
							Cancel
						</button>
						<button
							className="btn btn-secondary"
							type="button"
							onClick={executeSwap}
						>
							Swap Keys
						</button>
					</div>
				</form>
			</div>
		</dialog>
	);
};

export default SwapKeysModal;
