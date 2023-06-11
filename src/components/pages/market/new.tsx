import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { API_HOST, Listing } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { customFetch } from "@/utils/httpClient";
import { WithRouterProps } from "next/dist/client/with-router";
import Router, { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import { FiArrowLeft, FiCompass } from "react-icons/fi";
import { toSatoshi } from "satoshi-bitcoin-ts";
import Ordinals from "../ordinals/list";
import MarketTabs, { MarketTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const NewListingPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;
  const [outpoint, setOutpoint] = useState<string>(outPoint as string);
  const [price, setPrice] = useState<number>(0);
  const { usdRate, ordUtxos } = useWallet();
  const [showSelectItem, setShowSelectItem] = useState<boolean>();
  const [selectedItem, setSelectedItem] = useState<any>();

  const submit = useCallback(() => {
    console.log("create listing");
    // createListing()
  }, []);

  const clickSelectItem = useCallback(() => {
    setShowSelectItem(true);
  }, []);

  const clickOrdinal = useCallback(async (outpoint: string) => {
    console.log("Clicked", outpoint);
    const { promise } = customFetch<Listing>(
      `${API_HOST}/api/inscriptions/origin/${outpoint}`
    );
    const item = await promise;
    console.log({ item });
    setSelectedItem(item);
    setShowSelectItem(false);
    setOutpoint(outpoint);
  }, []);

  const artifact = useMemo(() => {
    return ordUtxos?.find((utxo) => utxo.origin === outpoint);
  }, [ordUtxos, outpoint]);

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

      <div className="w-full text-xl mb-4 flex items-center justify-between">
        <div
          className="flex items-center text-[#555] hover:text-blue-500 transition cursor-pointer"
          onClick={() => {
            Router.push("/market/listings");
          }}
        >
          <FiArrowLeft className="mr-2" />
          Back
        </div>
        <div>Create Listing</div>
      </div>
      <div className="flex w-full">
        <div className="w-2/3 mr-2">
          <div className="my-2 p-2 rounded bg-[#111]">
            {!outpoint && (
              <div
                onClick={clickSelectItem}
                className="text-blue-400 hover:text-blue-500 transition font-semibold cursor-pointer p-2 flex items-center justify-center"
              >
                <FiCompass className="mr-2" /> Select an Item
              </div>
            )}

            <div className="my-2 w-full">
              <label className="flex items-center justify-between">
                Price (BSV)
                <input
                  className="p-2 rounded"
                  type="number"
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setPrice(0);
                    }
                    setPrice(
                      e.target.value.includes(".")
                        ? parseFloat(e.target.value)
                        : parseInt(e.target.value)
                    );
                  }}
                />
              </label>
            </div>

            <div className="my-2 flex justify-end">
              {
                <button
                  disabled={!!outpoint && (!usdRate || !price)}
                  onClick={() => {
                    if (!outpoint) {
                      setShowSelectItem(true);
                      return;
                    }
                    submit();
                  }}
                  className={`${
                    !price ? "" : ``
                  } w-full cursor-pointer bg-teal-500 hover:bg-teal-600 transition text-white p-2 rounded disabled:bg-[#111] disabled:text-[#555]`}
                >
                  {` ${
                    !outpoint && !price
                      ? "Select an Item"
                      : !price
                      ? "Set a Price"
                      : ""
                  }`}
                  {usdRate && price
                    ? `List for $${toSatoshi(price / usdRate)
                        .toFixed(2)
                        .toLocaleString()}`
                    : ""}
                </button>
              }
            </div>
          </div>
        </div>
        <div className="w-1/3 ml-2">
          <div>Listing Preview</div>
          {outpoint && (
            <Artifact
              outPoint={outpoint as string}
              origin={outpoint as string}
              contentType="image/png"
              num={artifact?.num}
              src={`${API_HOST}/api/files/inscriptions/${outpoint}`}
              onClick={() => {}}
              txid={artifact?.txid as string}
              price={price}
              height={1}
            />
          )}
        </div>
      </div>

      {showSelectItem && (
        <div className="fixed top-0 left-0 bg-black bg-opacity-50 w-screen h-screen overflow-auto">
          <div className="mx-auto max-w-7xl p-4 bg-[#111] rounded">
            <Ordinals onClick={clickOrdinal} currentPage={1} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewListingPage;
