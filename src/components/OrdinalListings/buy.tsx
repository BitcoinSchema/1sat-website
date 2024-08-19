"use client";

import type { OrdUtxo } from "@/types/ordinals";
import { useSignal } from "@preact/signals-react";
import { useCallback } from "react";
import { toBitcoin } from "satoshi-token";
import Artifact from "../artifact";
import BuyArtifactModal from "../modal/buyArtifact";

interface Props {
  satoshis: bigint;
  listing: OrdUtxo;
}

const BuyBtn = ({ satoshis = 0n, listing }: Props) => {
  const showBuy = useSignal(false);

  const clickBuy = useCallback(() => {
    showBuy.value = true;
  }, [showBuy]);

  const content = (
    <Artifact
      classNames={{
        wrapper: "bg-transparent",
        media: "rounded bg-[#111] text-center p-0 w-full mr-2",
      }}
      artifact={listing}
      sizes={"100vw"}
      showFooter={false}
      priority={false}
      showListingTag={false}
      to={`/outpoint/${listing?.outpoint}`}
    />
  );

  const close = useCallback(() => {
    showBuy.value = false;
  }, [showBuy]);

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={clickBuy}>
        {toBitcoin(satoshis.toString())} BSV
      </button>
      {showBuy.value && (
        <BuyArtifactModal
          listing={listing}
          price={satoshis}
          onClose={close}
          content={content}
          showLicense={false}
        />
      )}
    </>
  );
};

export default BuyBtn;
