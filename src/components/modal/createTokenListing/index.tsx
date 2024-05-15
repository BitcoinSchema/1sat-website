import type { MarketData } from "@/components/pages/TokenMarket/list";
import ListingForm from "@/components/pages/TokenMarket/listingForm";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";

interface CreateTokenListingModalProps {
  onClose: () => void;
  ticker: Partial<MarketData>;
  initialPrice?: string;
  open: boolean;
}

const CreateTokenListingModal: React.FC<CreateTokenListingModalProps> = ({
  onClose,
  ticker,
  initialPrice,
  open
}) => {
  useSignals();
  const creating = useSignal(false);

  const listing = {
    tick: "tick",
    pricePer: initialPrice || "0",
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <dialog
      id={`create-token-listing-modal-${listing.tick}`}
      className="modal backdrop-blur"
      open={open}
      onClick={() => onClose()}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">Listing {ticker.tick || ticker.sym}</h3>
        <ListingForm
          initialPrice={listing.pricePer}
          ticker={ticker}
        />
      </div>
    </dialog>
  );
};

export default CreateTokenListingModal;
