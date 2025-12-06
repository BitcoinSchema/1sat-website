"use client";

import type { CollectionSubTypeData, MAP } from "js-1sat-ord";

interface TraitsProps {
	collection: Collection;
}

export type Collection = MAP & {
	type: "ord";
	name: string;
	subType: "collection";
	subTypeData?: string | CollectionSubTypeData;
	royalties?: string;
	previewUrl?: string;
};

type Traits = {
	[trait: string]: Trait;
};

type Trait = {
	values: string[];
	occurancePercentages: string[];
};

const Traits: React.FC<TraitsProps> = ({ collection }) => {
	return null;

	// const [traits, setTraits] = useState<Traits>({});

	// useEffect(() => {
	// 	console.log({ collection });
	// 	if (collection.subTypeData) {
	//     console.log({ data: collection.subTypeData });
	//     try {
	//       const data = collection.subTypeData as CollectionSubTypeData;
	//       console.log({ traits: data?.traits });
	//       setTraits(JSON.parse(data.traits) as Traits);
	//     } catch (e) {
	//       console.error("Error parsing collection data", e);
	//     }
	// 	}
	// }, [collection]);

	// useEffect(() => {
	// 	console.log({ collection, traits });
	// }, [collection, traits]);

	// return (
	// 	<div>
	// 		<h1 className="text-2xl font-bold">Traits</h1>
	// 		{Object.entries(traits).map(([traitName, trait]) => (
	// 			<div key={traitName}>
	//         <h2>{traitName}</h2>
	//         {trait.values.map((trait, index) => <div key={trait}>{trait}</div>)}
	//       </div>
	// 		))}
	// 	</div>
	// );
};

export default Traits;
