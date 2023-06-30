import { KnownSubType } from "../market/featured";

type Trait = {
  values: string[];
  occurancePercentages: string[];
};

interface CollectionSubTypeData {
  description: string;
  traits?: { [trait: string]: Trait };
  quantity?: number;
}

export interface Collection {
  app: string;
  type: string;
  name: string;
  subType: KnownSubType.Collection;
  subTypeData: CollectionSubTypeData;
  [key: string]: string | number | CollectionSubTypeData | undefined;
}

type CollectionProps = {
  collection: Collection;
};

const Collection: React.FC<CollectionProps> = ({ collection }) => {
  return <div></div>;
};

export default Collection;
