import Deposit from "@/components/Wallet/deposit";

interface DespotModalProps {
	onClose: () => void;
}

const DepositModal: React.FC<DespotModalProps> = ({ onClose }) => {
	return (
		<div
			className="modal modal-backdrop backdrop-blur modal-open"
			onClick={() => onClose()}
		>
			<div
				className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="relative w-full h-full overflow-hidden mb-4">
					<Deposit />
				</div>

				<form onSubmit={onClose}>
					<div className="flex justify-end">
						<button className="btn">Done</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default DepositModal;
