import { CollectionStats, FetchItemsQuery } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import { Noto_Serif } from "next/font/google";
import { CollectionNavigation } from "./CollectionNavigation";
import { CollectionList } from "./CollectionList";
import Image from "next/image";

interface Props {
  stats: CollectionStats;
  items: OrdUtxo[];
  marketItems: OrdUtxo[];
  collection: OrdUtxo;
  query: FetchItemsQuery;
  bannerImage?: string;
}

const notoSerif = Noto_Serif({
	style: "italic",
	weight: ["400", "700"],
	subsets: ["latin"],
});

const CollectionPage = async ({ stats, marketItems, items, collection, query, bannerImage }: Props) => {
  const src = bannerImage ? await import(`@/assets/images/coom/${bannerImage}`) : null;

  return (
    <div className="2xl:max-w-[80vw] max-w-[90vw] w-full mx-auto">
      <h2 className="text-lg mb-8 flex justify-between items-center">
        <span className={`text-2xl ${notoSerif.className}`}>{collection.origin?.data?.map?.name}</span>
        <span>({stats.count})</span>
        {stats.count === stats.max && <div>Minted Out</div>}
      </h2>

      {
        Boolean(src) &&
        <Image
          className="mx-auto w-full max-h-[300px] max-w-[980px] object-cover mb-12 sm:mb-16"
          height={300} width={980}
          alt={`${collection.origin?.data?.map?.name} image`}
          src={src} />
      }

     <CollectionNavigation />
     <CollectionList initialMarketItems={marketItems} initialCollectionItems={items} query={query} />
    </div>
  );
};

export default CollectionPage;
