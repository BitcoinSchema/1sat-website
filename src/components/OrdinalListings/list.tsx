"use client";

import { AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { MutableRefObject } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { FiLoader } from "react-icons/fi";
import { toBitcoin } from "satoshi-bitcoin-ts";
import JDenticon from "../JDenticon";
import Artifact from "../artifact";
import { listingCollection, listingName, mintNumber } from "./helpers";
interface Props {
  address: string;
  listings?: OrdUtxo[];
  collections: any;
  refProp:MutableRefObject<null>
}

const List = ({ address, listings, collections, refProp }: Props) => { 


  return (
    listings && (
      <tbody className="h-full">
        {listings.map((listing, idx) => {
          const size = 100;
          const collection = listingCollection(listing, collections);
          const price = `${toBitcoin(
            listing?.data?.list?.price || "0",
            true
          ).toString()} BSV`;
          return (
            listing && (
              <tr key={`${listing?.txid}-${listing?.vout}-${listing?.height}`}>
                <td width={100} height={120} className="p-0">
                  <Artifact
                    classNames={{
                      wrapper: "bg-transparent",
                      media: "rounded bg-[#111] text-center p-0 h-[100px] mr-2",
                    }}
                    artifact={listing}
                    size={size}
                    sizes={"100vw"}
                    showFooter={false}
                    priority={false}
                    to={`/outpoint/${listing?.outpoint}`}
                  />
                </td>

                <td className="flex flex-col h-[100px] p-0 pl-4">
                  <div className="my-auto max-w-64">
                    <p className="text-lg truncate overflow-hidden text-ellipses">
                      {listingName(listing)}
                    </p>
                    {collection && (
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/collection/${listing?.origin?.data?.map?.subTypeData?.collectionId}`}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          {collection.name} {mintNumber(listing, collection)}
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-neutral-content/25">
                      {listing?.origin?.num}
                    </div>
                    <div className={"block md:hidden"}>{price}</div>
                  </div>
                </td>
                <td className={"p-0 hidden md:table-cell w-10"}>
                  <Link href={`/signer/${listing?.owner}`}>
                    <div
                      className="tooltip"
                      data-tip={
                        listing?.data?.sigma?.length
                          ? listing?.data.sigma[0].address
                          : listing?.owner
                      }
                    >
                      <JDenticon className="w-8" hashOrValue={listing?.owner} />
                    </div>
                  </Link>
                </td>
                <td className="p-0 text-xs md:text-sm hidden md:table-cell">
                  {listing?.data?.list?.price ? (
                    <button type="button" className="btn">
                      {price}
                    </button>
                  ) : (
                    ""
                  )}
                </td>
                <td className="p-0 md:table-cell hidden text-center w-8">
                  <Link
                    className="text-sm"
                    href={`/outpoint/${listing?.outpoint}?display=${AssetType.Ordinals}`}
                  >
                    <FaChevronRight className="w-6 h-6" />
                  </Link>
                </td>
              </tr>
            )
          );
        })}
        <tr>
          <td className="text-center" colSpan={5}>
            <div ref={refProp} className="flex items-center justify-center">
              <FiLoader className="animate animate-spin" />
            </div>
          </td>
        </tr>
      </tbody>
    )
  );
};

export default List;
