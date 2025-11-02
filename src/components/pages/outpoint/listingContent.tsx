"use client";

import JDenticon from "@/components/JDenticon";
import CancelListingModal from "@/components/modal/cancelListing";
import { SCAM_LISTING_USER_BLACKLIST } from "@/constants";
import { usdRate } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa6";

const ListingContent = ({ artifact }: { artifact: OrdUtxo }) => {
  useSignals();
  const router = useRouter();
  const showCancelModal = useSignal(false);
  const isOwner = artifact.owner === ordAddress.value;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const priceContent = useMemo(() => {
    if (!ordAddress.value) {
      return null;
    }

    if (!mounted || usdRate.value === 0) {
      return null;
    }

    return <div>
      {artifact.data?.list ? (
        <div>
          <div>USD Price</div>
          <div>${artifact.data?.list?.price && usdRate.value > 0 ? (artifact.data?.list?.price / usdRate.value).toFixed(2) : 0}</div>
        </div>
      ) : (
        <div>
          <div>This item is not listed</div>
          {isOwner && !artifact.data?.bsv20 && <Link href={`/market/ordinals/new?outpoint=${artifact.outpoint}`}>
            <button type="button" className="btn">
              List
            </button>
          </Link>}
        </div>

      )}
    </div>
  }, [mounted, ordAddress.value, usdRate.value, artifact.data?.list, artifact.data?.bsv20, artifact.outpoint, isOwner]);

  const knownScammer = useMemo(() => {
    return artifact.owner &&  artifact.owner && SCAM_LISTING_USER_BLACKLIST.some((u) => u.address === artifact.owner)
  }, [artifact.owner]); 

  return (
    <div>
      <div>Owner</div>
      <div className="flex items-center mb-4">
        <JDenticon
          hashOrValue={artifact.owner}
          className="mr-2 w-10 h-10"
        />
        <div className="flex flex-col">
          <div className="text-lg">{artifact.owner}</div>
          <div className={`text-sm ${knownScammer ? "text-red-400" :"text-[#aaa]"}`}>
            {artifact.owner === ordAddress.value
              ? "You own this item"
              : knownScammer ? "Known Scammer" :"Random Ordinal Enjoyer"}
          </div>
        </div>
      </div>
      {priceContent}

      {/* // unlisted bsv20 */}
      {isOwner && !artifact.data?.list && artifact.data?.bsv20 && (
        <Link
          href={`/market/${artifact.data.bsv20.id ? "bsv21" : "bsv20"
            }/${artifact.data.bsv20.id || artifact.data.bsv20.tick}`}
        >
          <button type="button" className="btn">
            Sell
          </button>
        </Link>
      )}

      {/* // unlisted utxo */}
      {isOwner && artifact.data?.list && !artifact.data?.bsv20 && (
        <button
          disabled={!!artifact.spend && artifact.spend !== ""}
          type="button"
          className="btn disabled:text-gray-[#555]"
          onClick={() => {
            showCancelModal.value = true;
          }}
        >
          Cancel
        </button>
      )}

      {artifact && showCancelModal.value && (
        <CancelListingModal
          onClose={() => {
            showCancelModal.value = false;
          }}
          onCancelled={(newOutpoint) => {
            console.log("listing cancelled");
            showCancelModal.value = false;
            // we should navigate to the new inscription outpoint
            router.push(`/outpoint/${newOutpoint}`);
          }}
          listing={artifact as Listing}
        />
      )}
    </div>
  );
};

export default ListingContent;
