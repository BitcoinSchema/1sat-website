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
      id={`cancel-listing-modal-${listing.tick}`}
      className="modal backdrop-blur"
      open={open}
      onClick={() => onClose()}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">Listing {ticker.tick || ticker.sym}</h3>
        <ListingForm
          initialPrice={listing.pricePer}
          ticker={ticker}
          onClose={() => {
            console.log("close");
            // showListingForm.value = false;
          }}
        />
        {/* <form method="dialog">
          <div className="modal-action">          
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              disabled={creating.value}
              className="btn btn-error disabled:btn-disabled"
              onClick={async (e) => {
                console.log({ listing });


              }}
            >
              Cancel Listing
            </button>
          </div>
        </form> */}
      </div>
    </dialog>
  );
};

export default CreateTokenListingModal;
