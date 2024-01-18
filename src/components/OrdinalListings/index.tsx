import { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { Suspense } from "react";
import OrdinalListingSkeleton from "../skeletons/listing/Ordinal";
import List from "./list";

interface OrdinalListingsProps {
  listings: OrdUtxo[];
}

const OrdinalListings: React.FC<OrdinalListingsProps> = async ({
  listings,
}) => {
  const collectionIds = listings.reduce((i, v) => {
    const cid = v.origin?.data?.map?.subTypeData?.collectionId;
    if (cid) {
      i.push(cid);
    }
    return i;
  }, [] as string[]);

  return (
    <div>
      <div className="w-full">
        <table className="table font-mono" cellSpacing={10}>
          <thead>
            <tr>
              <th className="px-0 w-[100px]">Ordinal</th>
              <th className="px-0 flex w-full pl-4">Name</th>
              <th className="px-0 md:pr-8 hidden md:table-cell max-w-[100px]">Seller</th>
              <th className="px-0 hidden md:table-cell md:w-36"><Link href="#">Price</Link></th>
              <th className="px-0 w-8"></th>
            </tr>
          </thead>
          <Suspense fallback={<OrdinalListingSkeleton />}>
              <List listings={listings} collectionIds={collectionIds} />
          </Suspense>
        </table>
      </div>
    </div>
  );
};

export default OrdinalListings;
