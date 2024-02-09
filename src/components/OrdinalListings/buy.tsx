"use client";

import { OrdUtxo } from "@/types/ordinals";
import { useSignal } from "@preact/signals-react";
import Artifact from "../artifact";
import BuyArtifactModal from "../modal/buyArtifact";

interface Props {
  price: string;
  listing: OrdUtxo;
}

const BuyBtn = ({ price, listing }: Props) => {
  const showBuy = useSignal(false);

  const clickBuy = () => {
    showBuy.value = true;
  };

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

  const close = () => {
    showBuy.value = false;
  };
  
  return (
    <>
      <button type="button" className="btn" onClick={clickBuy}>
        {price}
      </button>
      {showBuy.value && <BuyArtifactModal
        listing={listing}
        price={parseInt(price)}
        onClose={close}
        content={content}
        showLicense={false}
      />}
    </>
  );
};

export default BuyBtn;
