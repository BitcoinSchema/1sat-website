type CollectionItem = {
  id: number;
  name: string;
  description: string;
  image: string;
  traits: [
    {
      name: string;
      value: string;
    }
  ];
};

type CollectionItemProps = {
  collectionItem: CollectionItem;
};

const CollectionItem: React.FC<CollectionItemProps> = ({ collectionItem }) => {
  return (
    <div className="w-full">
      <div className="text-left font-semibold">{collectionItem.name}</div>
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
    </div>
  );
};

export default CollectionItem;
