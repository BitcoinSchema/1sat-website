import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import sb from "satoshi-bitcoin";
import Ordinals from "../ordinals/list";

interface PageProps extends WithRouterProps {}

const NewListingPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;
  const [price, setPrice] = useState<number>(0);
  const { usdRate } = useWallet();
  const [showSelectItem, setShowSelectItem] = useState<boolean>();

  const submit = useCallback(() => {
    console.log("create listing");
    // createListing()
  }, []);

  const clickSelectItem = useCallback(() => {
    setShowSelectItem(true);
  }, []);

  const clickOrdinal = useCallback((ordinal: any) => {
    console.log("Clicked", ordinal);
  }, []);

  return (
    <div>
      <h1>New Listing</h1>
      <div>
        <div>
          {outPoint ? (
            outPoint
          ) : (
            <div onClick={clickSelectItem}>Select and Item</div>
          )}
        </div>
        <div className="my-2">
          <label>
            Price (BSV)
            <input
              type="number"
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
          </label>
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
        <div className="my-2">
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
        <div>
          <Ordinals onClick={clickOrdinal} sort={false} currentPage={1} />
        </div>
      )}
    </div>
  );
};

export default NewListingPage;
