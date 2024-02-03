import Artifact from "@/components/artifact";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";

interface Props {
  stats: CollectionStats;
  items: OrdUtxo[];
  collection: OrdUtxo;
}

const CollectionPage = ({ stats, items, collection }: Props) => {
  return (
    <div className="2xl:max-w-[80vw] max-w-[90vw] w-full mx-auto">
      <h2 className="text-lg mb-4 flex justify-between items-center">
        {collection.origin?.data?.map?.name} ({stats.count})
        {stats.count === stats.max && <div>Minted Out</div>}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-4">
        {items.map((item, idx) => {
          return (
            <Artifact
              key={`${item.txid}-${item.vout}-${item.height}`}
              to={`/outpoint/${item.outpoint}`}
              artifact={item}
              size={600}
              sizes={"100vw"}
              priority={idx < 10}
              showListingTag={item.data?.list?.price ? true : false}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CollectionPage;
