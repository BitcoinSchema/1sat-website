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
  collectionItem: CollectionItem;
  stats: CollectionStats;
};

const CollectionItem: React.FC<CollectionItemProps> = ({
  collectionItem,
  stats,
}) => {
  return (
    <div className="w-full">
      <div className="text-center font-semibold">
        {stats?.MAP?.name}
        {collectionItem?.mintNumber ? ` #${collectionItem?.mintNumber}` : ""}
      </div>
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
