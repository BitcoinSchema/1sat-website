import Artifact from "@/components/artifact";
import { API_HOST } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { groupBy, map } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { FetchStatus } from ".";
import CollectionItem from "./inscription/collectionItem";

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
    const grouped = groupBy(featuredCollections, {
      id: "MAP.subTypeData.collectionId",
    }) as Record<string, Collection[]>;
    return map(grouped, (value, key) => ({ name: key, collections: value }));
  }, [featuredCollections]);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchFeaturedStatus(FetchStatus.Loading);
        const { promise } = await customFetch<Collection[]>(
          `${API_HOST}/api/inscriptions/search?q=${Buffer.from(JSON.stringify({map: {type: 'collection'}})).toString('base64')}`
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
    <div className="flex">
      <div>
        {groupedCollections.map((group) => {
          return (
            <React.Fragment key={group.name}>
              <h2>{group.name}</h2>
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
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedCollections;
