import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import JDenticon from "../JDenticon";
import Artifact from "../artifact";

interface Props {
  listings: OrdUtxo[];
  collectionIds: string[];
}

const List = async ({ listings, collectionIds }: Props) => {
  const urlCollections = `${API_HOST}/api/txos/outpoints`;
  const { promise: promiseCollections } = http.customFetch<OrdUtxo[]>(
    urlCollections,
    {
      method: "POST",
      body: JSON.stringify(collectionIds),
    }
  );
  const collections = await promiseCollections;

  const listingCollection = (listing: OrdUtxo) => {
    if (listing.origin?.data?.map) {
      const collectionId = listing.origin.data.map.subTypeData?.collectionId;
      if (!collectionId) {
        return null;
      }
      const collection = collections.find((c) => c.outpoint === collectionId)
        ?.origin?.data?.map;
      if (collection) {
        return collection;
      }
    }
  };

  const mintNumber = (listing: OrdUtxo, collection: any) => {
    const listingData = listing.origin?.data?.map;
    let mintNumber: string = listingData?.subTypeData?.mintNumber;
    let qty = collection?.subTypeData?.quantity;
    if (!qty || !mintNumber) {
      return null;
    }
    return `${mintNumber}/${qty}`;
  };

  const listingName = (listing: OrdUtxo) => {
    if (listing.origin?.data?.bsv20) {
      return listing.origin.data.bsv20.tick;
    }
    switch (listing.origin?.data?.insc?.file.type.split(";")[0]) {
      case "image/gif":
      case "image/jpg":
      case "image/jpeg":
      case "image/webp":
      case "image/png":
        return (
          listing.origin?.data?.map?.name ||
          listing.origin?.data?.map?.subTypeData?.name ||
          listing.origin?.data?.map?.app ||
          "Unknown Name"
        );
      case "text/html":
        // extract the title from the html
        const html = listing.origin?.data?.insc?.text;
        const title = html?.match(/<title>(.*)<\/title>/)?.[1];
        return title || listing.origin.num;
      case "text/json":
        return listing.origin?.data?.insc.text || listing.origin.num;
      case "text/plain":
        return listing.origin?.data?.insc.text || listing.origin.num;
      default:
        return listing.origin?.num || "Unknown";
    }
  };

  return (
    <tbody className="h-full">
      {listings.map((listing, idx) => {
        const size = 100;

        const collection = listingCollection(listing);
        const price = `${toBitcoin(
          listing.data?.list?.price || "0",
          true
        ).toString()} BSV`;
        return (
          <tr key={`${listing.txid}-${listing.vout}-${listing.height}`}>
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
                to={`/outpoint/${listing.outpoint}`}
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
                      href={`/collection/${listing.origin?.data?.map?.subTypeData?.collectionId}`}
                      className="text-blue-400 hover:text-blue-500"
                    >
                      {collection.name} {mintNumber(listing, collection)}
                    </Link>
                  </div>
                )}
                <div className="flex items-center gap-4 text-neutral-content/25">
                  {listing.origin?.num}
                </div>
                <div className={`block md:hidden`}>{price}</div>
              </div>
            </td>
            <td className={`p-0 hidden md:table-cell w-10`}>
              <Link href={`/signer/${listing.owner}`}>
                <div
                  className="tooltip"
                  data-tip={
                    listing.data?.sigma?.length
                      ? listing.data.sigma[0].address
                      : listing.owner
                  }
                >
                  <JDenticon className="w-8" hashOrValue={listing.owner} />
                </div>
              </Link>
            </td>
            <td className="p-0 text-xs md:text-sm hidden md:table-cell">
              {price}
            </td>
            <td className="p-0 md:table-cell hidden text-center w-8">
              <Link
                className="text-sm"
                href={`/outpoint/${listing.outpoint}?display=${AssetType.Ordinals}`}
              >
                <FaChevronRight className="w-6 h-6" />
              </Link>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default List;
