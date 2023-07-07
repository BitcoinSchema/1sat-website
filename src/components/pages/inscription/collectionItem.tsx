import { CollectionStats } from ".";

type CollectionItem = {
  collectionId: number;
  name: string;
  description: string;
  image: string;
  mintNumber?: number;
  traits: [
    {
      name: string;
      value: string;
    }
  ];
  [key: string]: any;
};

type CollectionItemProps = {
  map: { [key: string]: any };
  stats: CollectionStats;
};

const CollectionItem: React.FC<CollectionItemProps> = ({ map, stats }) => {
  const collectionItem = map.subTypeData as CollectionItem;
  const name = map.name || collectionItem.name;
  return (
    <div className="w-full">
      <div className="text-center font-semibold">
        {stats?.MAP?.name}
        {collectionItem?.mintNumber ? ` #${collectionItem?.mintNumber}` : ""}
      </div>
      {name && (
        <div className="flex items-center justify-between">
          <div className="text-left text-[#777]">name</div>
          <div className="ml-2">{name}</div>
        </div>
      )}
      {collectionItem.rank && (
        <div className="text-left text-[#777]">Rank: {collectionItem.rank}</div>
      )}
      {collectionItem.traits && (
        <div className="text-left">
          {collectionItem.traits?.map((trait, idx) => {
            return (
              <div
                className="flex items-center justify-between"
                key={`${trait}-${idx}`}
              >
                <div className="mr-2 text-[#777]">{trait.name}</div>
                <div className="ml-2">{trait.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectionItem;
