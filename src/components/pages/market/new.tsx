import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { API_HOST } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Router, { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import Ordinals from "../ordinals/list";
import MarketTabs, { MarketTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const NewListingPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;
  const [price, setPrice] = useState<number>(0);
  const { usdRate, ordUtxos } = useWallet();
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

  const artifact = useMemo(() => {
    return ordUtxos?.find((utxo) => utxo.origin === outPoint);
  }, [ordUtxos, outPoint]);

  // Artifact component params:
  // outPoint,
  // origin,
  // contentType,
  // classNames,
  // num,
  // to,
  // src = `${API_HOST}/api/files/inscriptions/${origin}`,
  // onClick,
  // txid,
  // price,
  // height,

  return (
    <div>
      <Tabs currentTab={Tab.Market} />

      <MarketTabs currentTab={MarketTab.Listings} />

      <h1 className="text-xl mb-4 flex items-center justify-between">
        <div
          className="flex items-center text-[#555] hover:text-blue-500 transition cursor-pointer"
          onClick={() => {
            Router.push("/market/listings");
          }}
        >
          <FiArrowLeft className="mr-2" />
          Back
        </div>
        <div>
          {artifact
            ? `Selling Inscription #${artifact?.num?.toLocaleString()}`
            : "Create Listing"}
        </div>
      </h1>
      {outPoint && (
        <Artifact
          outPoint={outPoint as string}
          origin={outPoint as string}
          contentType="image/png"
          num={artifact?.num}
          src={`${API_HOST}/api/files/inscriptions/${outPoint}`}
          onClick={() => {}}
          txid={artifact?.txid as string}
          price={price}
          height={1}
        />
      )}
      <div>
        <div>
          {outPoint ? (
            <div
              className="text-sm bg-[#111] rounded p-2 text-[#555]"
              onClick={() => {
                window.open(
                  `https://whatsonchain.com/tx/${artifact?.txid}`,
                  "_blank"
                );
              }}
            >
              {outPoint}
            </div>
          ) : (
            <div
              onClick={clickSelectItem}
              className="bg-yellow-400 hover:bg-yellow-500 cursor-pointer p-2 rounded"
            >
              Select and Item
            </div>
          )}
        </div>
        {/* <div className="my-2 w-full">
          <label className="flex items-center justify-between">
            Price (BSV)
            <input
              className="p-2 rounded"
              type="number"
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="my-2">
          {
            <button
              disabled={!usdRate || !price}
              onClick={submit}
              className={` bg-[#111] p-2 rounded bg-teal-500 text-white`}
            >
              {!price ? "$0" : ""}
              {usdRate && price
                ? `List for ${toBitcoin(usdRate * price)} BSV`
                : ""}
            </button>
          }
        </div> */}

        <div className="my-2 rounded bg-[#111] p-4 text-red-400">
          Create listing coming soonTm
        </div>
      </div>
      {showSelectItem && (
        <div>
          <Ordinals onClick={clickOrdinal} currentPage={1} />
        </div>
      )}
    </div>
  );
};

export default NewListingPage;
