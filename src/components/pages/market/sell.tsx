import Modal from "@/components/modal";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { TbSelect } from "react-icons/tb";
import sb from "satoshi-bitcoin";
import tw from "twin.macro";
import Ordinals from "../ordinals/list";
import MarketTabs from "./tabs/tabs";

interface PageProps extends WithRouterProps {}

const SellPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;
  const [price, setPrice] = useState<number>(0);
  const { usdRate } = useWallet();
  const [showSelectItem, setShowSelectItem] = useState<boolean>();
  const [selectedItem, setSelectedItem] = useState<string>(outPoint as string);
  const submit = useCallback(() => {
    console.log("create listing");
    // createListing()
  }, []);

  const clickSelectItem = useCallback(() => {
    setShowSelectItem(true);
  }, []);

  const clickOrdinal = useCallback((ordinal: any) => {
    console.log("Clicked", ordinal);
    setShowSelectItem(false);
    setSelectedItem(ordinal);
  }, []);

  const Label = tw.div`flex flex-col`;

  const Input = tw.input`p-2 text-white font-mono rounded my-2`;

  return (
    <div>
      <MarketTabs currentTab={undefined} />
      <div onClick={() => router.push("/wallet")}>Back to wallet</div>
      <div className="mx-auto w-full max-w-2xl">
        <div className="cusror-pointer" onClick={clickSelectItem}>
          {selectedItem ? (
            selectedItem
          ) : (
            <div className="hover:bg-[#222] cursor-pointer rounded p-2 flex items-center justify-between">
              Select and Item
              <TbSelect className="mr-2" />
            </div>
          )}
        </div>
        <div className="my-2">
          <Label>
            Price (BSV)
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
          </Label>
        </div>
        {/* <div>
          <label>
            Price<input type="number" />
            </label>

        </div>
        <div>
          <label>
            Price<input type="number" />
            </label>

        </div> */}
        <div className="my-2 flex justify-end">
          <button
            disabled={!usdRate}
            onClick={submit}
            className="p-2 rounded bg-teal-500 text-white"
          >
            List for {usdRate ? sb.toBitcoin(usdRate * price) : ""} BSV
          </button>
        </div>
      </div>
      {showSelectItem && (
        <Modal onClose={() => setShowSelectItem(false)}>
          <Ordinals onClick={clickOrdinal} sort={false} />
        </Modal>
      )}
    </div>
  );
};

export default SellPage;
