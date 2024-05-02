import type { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { Suspense } from "react";
import OrdinalListingSkeleton from "../skeletons/listing/Ordinal";
import View from "./view";

export enum OrdViewMode {
  Grid = "grid",
  List = "list",
}

interface OrdinalListingsProps {
  listings?: OrdUtxo[];
  address?: string;
  mode: OrdViewMode;
  onClick?: (outpoint: string) => Promise<void>;
}

const OrdinalListings: React.FC<OrdinalListingsProps> = ({
  listings,
  address,
  mode,
  onClick,
}: OrdinalListingsProps) => {
  return (
    <div className="w-screen max-w-7xl h-full">
      <table className="table font-mono" cellSpacing={10}>
        {mode === OrdViewMode.List && (
          <thead>
            <tr>
              <th className="px-0 w-[100px]">Ordinal</th>
              <th className="px-0 flex w-full pl-4">Name</th>
              <th className="px-0 md:pr-8 hidden md:table-cell max-w-[100px]">
                Seller
              </th>
              <th className="px-0 hidden md:table-cell md:w-36">
                <Link href="#">Price</Link>
              </th>
              <th className="px-0 w-8">&nbsp;</th>
            </tr>
          </thead>
        )}
        <Suspense fallback={<OrdinalListingSkeleton iterations={30} />}>
          <View
            listings={listings}
            address={address}
            mode={mode}
            onClick={onClick}
          />
        </Suspense>
      </table>
    </div>
  );
};

export default OrdinalListings;
