import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { CollectionList } from "./CollectionList";
import { CollectionNavigation } from "./CollectionNavigation";
import Traits, { type Collection } from "./Traits";

interface Props {
  stats: CollectionStats;
  collection: OrdUtxo;
  bannerImage?: string;
}

const CollectionPage = async ({ stats, collection, bannerImage }: Props) => {
  // Get the collection items
  // const query = {
  // 	map: {
  // 		subTypeData: {
  // 			collectionId: collection.outpoint,
  // 		},
  // 	},
  // } as FetchItemsQuery;

  const src = bannerImage
    ? await import(`@/assets/images/coom/${bannerImage}`)
    : null;

  return (
    <div className="2xl:max-w-[80vw] max-w-[90vw] w-full mx-auto">
      <h2 className="text-lg mb-8 flex justify-between items-center">
        <Link className="flex items-center text-2xl font-serif italic" href="/collection">
          <FaChevronLeft className="mr-2" />
          {collection.origin?.data?.map?.name}
        </Link>
        <span>({stats.count})</span>
        {stats.count === stats.max && <div>Minted Out</div>}
      </h2>

      {Boolean(src) && (
        <Image
          className="mx-auto w-full max-h-[300px] max-w-[980px] object-cover mb-12 sm:mb-16"
          height={300}
          width={980}
          alt={`${collection.origin?.data?.map?.name} image`}
          src={src}
        />
      )}

      <CollectionNavigation />
      {collection.origin?.data?.map && <Traits collection={collection.origin.data.map as Collection} />}
      <CollectionList collectionId={collection.outpoint} />
    </div>
  );
};

export default CollectionPage;
