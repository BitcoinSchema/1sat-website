import Artifact from "@/components/artifact";
import { API_HOST } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { groupBy, map } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";
import CollectionItem from "../inscription/collectionItem";

// {
//   "txid": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd",
//   "vout": 0,
//   "outpoint": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd_0",
//   "origin": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd_0",
//   "height": 794619,
//   "idx": 10456,
//   "lock": "d093514811af934493ca1caee52c508f42a92ce3fbeee6f3663a0307cc999326",
//   "SIGMA": [],
//   "listing": false,
//   "bsv20": false,
//   "id": 2588656,
//   "num": 2588656,
//   "file": {
//     "hash": "3573ffe31bd51911135caf2fbdbbc853635410d14b2eeb6b2b80bbd5108a95ef",
//     "size": 92331,
//     "type": "image/jpeg"
//   },
//   "MAP": {
//     "app": "takeit-testing",
//     "name": "cat collection test",
//     "type": "ord",
//     "subType": "collection",
//     "royalties": "[{\"type\":\"paymail\",\"destination\":\"foundrium@handcash.io\",\"percentage\":\"0.03\"}]",
//     "previewUrl": "https://www.alltheedge.com/wp-content/uploads/2018/01/pepe.jpg",
//     "subTypeData": {
//       "traits": "{}",
//       "quantity": "3",
//       "description": "meow meow hiss",
//       "rarityLabels": "{}"
//     }
//   }
// },

export enum KnownSubType {
  Collection = "collection",
}

export type Collection = {
  txid: string;
  vout: number;
  outpoint: string;
  origin: string;
  height: number;
  idx: number;
  lock: string;
  SIGMA: any[];
  listing: boolean;
  bsv20: boolean;
  id: number;
  num: number;
  file: {
    hash: string;
    size: number;
    type: string;
  };
  MAP: {
    app: string;
    name: string;
    type: string;
    subType: KnownSubType;
    royalties: string;
    previewUrl: string;
    subTypeData: CollectionItem;
  };
};

interface GroupedCollection {
  name: string;
  collections: Collection[];
}

const FeaturedCollections: React.FC = () => {
  const [fetchFeaturedStatus, setFetchFeaturedStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>(
    []
  );

  const groupedCollections: GroupedCollection[] = useMemo(() => {
    const grouped = groupBy(
      featuredCollections.filter((f) => {
        return (
          f.MAP.subType === KnownSubType.Collection &&
          featured.some((feature) => feature.origin === f.origin)
        );
      }),
      "MAP.name"
    ) as Record<string, Collection[]>;
    return map(grouped, (value, key) => ({ name: key, collections: value }));
  }, [featuredCollections]);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchFeaturedStatus(FetchStatus.Loading);
        const { promise } = await customFetch<Collection[]>(
          `${API_HOST}/api/collections/recent`
        );

        const featuredCollections = await promise;
        setFeaturedCollections(featuredCollections);
        setFetchFeaturedStatus(FetchStatus.Success);
      } catch (error) {
        console.log(error);
        setFetchFeaturedStatus(FetchStatus.Error);
      }
    };
    if (fetchFeaturedStatus === FetchStatus.Idle) {
      fire();
    }
  }, [fetchFeaturedStatus]);

  return (
    <div className="grid grid-cols-4 max-w-7xl">
      {groupedCollections.map((group) => {
        return (
          <div key={group.name}>
            <h2 className="my-4 text-lg font-semibold">{group.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {group.collections.map((item) => (
                <Artifact
                  key={item.origin}
                  origin={item.origin}
                  outPoint={item.outpoint}
                  contentType={item.file.type}
                  num={item.num}
                  to={`/collection/${item.origin}`}
                  src={item.MAP.previewUrl}
                  onClick={() => {}}
                  txid={item.txid}
                  price={0}
                  height={item.height}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedCollections;

type Featured = {
  origin: string;
  name: string;
}[];

const featured: Featured = [
  {
    origin:
      "97ef55d928bf9101343aba2d2abef446d47c6502f032748c4b509cb7a44fbfe7_0",
    name: "Cyebr Skeleton Punks",
  },
  {
    origin:
      "8be99df38f5944d739b55c0533939651cf05603572b7b40562987189d89a8f76_0",
    name: "CSS Colors",
  },
  {
    origin:
      "2f3f22a5631a8634317757bd8a48982d476681307bf3cd71320d1240b3eeb9f5_0",
    name: "Free Pepe",
  },
  {
    origin:
      "0d2b430030ab8480a430a300e0393d107b3754bce4d98bf919c39f0e752b6746_0",
    name: "Testy Pepes",
  },
  {
    origin:
      "52609820f2c020b9a6a9eaca44cae0f3972412710f5b76b52a723683a259100e_0",
    name: "coOM",
  },
  {
    origin:
      "7b18fec9f75ba18a81a2527b119f84360d2defa1f1ed9a141cbd31a791b32f8a_0",
    name: "The Moto Club 2",
  },
  {
    origin:
      "8cd5c67c79fd819d177f367bd5fa5a8ff8ceb801939ae39c82129164f9dc2788_0",
    name: "Bitcoin Dragons",
  },
  {
    origin:
      "5117338ee9885e867fbf51d7a36b09b786bc395c817f49fd91ab6f0cb0771f97_0",
    name: "Masks of Salvation",
  },
  {
    origin:
      "80d224cdf1d6f6b5145a7f5ede14b357ea7c05f7f7f4aaab04d4cc36d707f806_0",
    name: "Bookworms",
  },
  {
    origin:
      "da3ee657f921c33f38d861b4a23358e61a14f0ace56746cc2df6fa16f22cc477_0",
    name: "Ordi Pixels",
  },
  {
    origin:
      "3f5400faf0f209fcf185e9409f6a361b8f64bcc84bab8007654b00101720cf05_0",
    name: "Sadness",
  },
  {
    origin:
      "3ce9034e0763511446b4cfa0e3504a0602c5dbf2f6ab6497a7f7ab6d3ae058db_0",
    name: "1Zoide",
  },
];
