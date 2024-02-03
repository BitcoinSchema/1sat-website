import { Listing } from "@/types/bsv20";

interface CancelListingModalProps {
  onClose: () => void;
  listing: Listing;
  indexerAddress: string;
  className?: string;
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({
  onClose,
  listing,
  indexerAddress,
  className,
}) => {
  return (
    <div className={`w-full max-w-3xl mx-auto ${className ? className : ""}`}>
      <div className="text-3xl font-bold mb-4">Cancel Listing</div>
      <div className="text-lg mb-4">
        Are you sure you want to cancel the listing for {listing.tick}?
      </div>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-md bg-gray-200 text-gray-800 px-4 py-2 mr-2"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            console.log("cancel listing");
          }}
          className="rounded-md bg-red-500 text-white px-4 py-2"
        >
          Cancel Listing
        </button>
      </div>
    </div>
  );
}

export default CancelListingModal;