"use client";

import { useEffect, useState } from "react";
import type { CollectionSubTypeData, CollectionTraits, CreateOrdinalsCollectionMetadata, MAP, PreMAP } from "js-1sat-ord";

interface TraitsProps {
	collection: PreMAP;
}

const Traits: React.FC<TraitsProps> = ({ collection }) => {  
	const [traits, setTraits] = useState<CollectionTraits>({});

	useEffect(() => {
		console.log({ collection });
		if (collection.subTypeData) {
      console.log({ data: collection.subTypeData });
      try {
        const data = collection.subTypeData as any;
				const parsedTraits = JSON.parse(data?.traits) as CollectionTraits;
        console.log({ traits: data?.traits });
        setTraits(parsedTraits);
      } catch (e) {
        console.error("Error parsing collection data", e);
      }
		}
	}, [collection]);

	useEffect(() => {
		console.log({ collection, traits });
	}, [collection, traits]);

	return (
		<div>
			<h1 className="text-2xl font-bold">Traits</h1>
			{Object.entries(traits).map(([traitName, trait]) => (
				<div key={traitName}>
          <h2>{traitName}</h2>
          {trait.values.map((trait, index) => <div key={trait}>{trait}</div>)}
        </div>
			))}
		</div>
	);
};

export default Traits;
