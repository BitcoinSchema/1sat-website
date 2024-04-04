import Artifact from "@/components/artifact";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import { Noto_Serif } from "next/font/google";
import Image from "next/image";

interface Props {
  stats: CollectionStats;
  items: OrdUtxo[];
  collection: OrdUtxo;
  bannerImage: string
}

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const PublisherCollectionPage = async ({ stats, items, collection, bannerImage }: Props) => {
  const src = await import(`@/assets/images/coom/${bannerImage}`)

  return (
    <div className="2xl:max-w-[70vw] max-w-[80vw] w-full mx-auto">
      <h2 className="text-lg mb-6 sm:mb-8 flex justify-between items-center">
        <span className={`text-3xl ${notoSerif.className}`}>{collection.origin?.data?.map?.name}</span> 
        <span>({stats.count})</span>
        {stats.count === stats.max && <div>Minted Out</div>}
      </h2>
      <Image className='mx-auto w-full max-h-[300px] max-w-[980px] object-cover mb-16 sm:mb-20' height={300} width={980} alt={`${collection.origin?.data?.map?.name} image`} src={src} />
      <div className="2xl:max-w-[70vw] max-w-[80vw] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4">
        {items.map((item, idx) => {
          return (
            <Artifact
              key={`${item.txid}-${item.vout}-${item.height}`}
              to={`/outpoint/${item.outpoint}`}
              artifact={item}
              size={600}
              sizes={"100vw"}
              priority={idx < 10}
              showListingTag={!!item.data?.list?.price}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PublisherCollectionPage;
