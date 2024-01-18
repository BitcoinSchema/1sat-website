import Deposit from "@/components/Wallet/deposit";

interface DespotModalProps {
  onClose: () => void;
}

const DepositModal: React.FC<DespotModalProps> = ({
  onClose,
}) => {
 
  return (
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
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
          <button className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white">
            Done
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
