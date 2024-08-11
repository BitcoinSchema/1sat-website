"use client";

import { useCallback, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";
import type { CollectionTraits, CollectionTrait } from "js-1sat-ord";

interface TraitsFormProps {
	collectionTraits?: CollectionTraits;
	setCollectionTraits: (traits: CollectionTraits) => void;
}

const TraitsForm: React.FC<TraitsFormProps> = ({
	collectionTraits,
	setCollectionTraits,
}) => {
	const [inputPercentages, setInputPercentages] = useState<
		Record<string, string>
	>({});

	const updateTrait = useCallback(
		(
			traitName: string,
			field: keyof CollectionTrait,
			value: string[],
		) => {
			if (!collectionTraits) {
				return;
			}

      console.log({traitName, field, value});
			let processedValue = value;
			if (field === "occurancePercentages" && Array.isArray(value)) {
				processedValue = value.map((v) =>
					(Number.parseInt(v, 10) / 100).toFixed(2),
				);
			}

			setCollectionTraits({
				...collectionTraits,
				[traitName]: {
					...collectionTraits[traitName],
					[field]: processedValue,
				},
			});
		},
		[collectionTraits, setCollectionTraits],
	);

	const handlePercentageChange = useCallback(
		(traitName: string, value: string) => {
			const cleanedValue = value.replace(/[^0-9,]/g, "");
			setInputPercentages((prev) => ({ ...prev, [traitName]: cleanedValue }));

			const percentages = cleanedValue.split(",").map((v) => v.trim());
			updateTrait(traitName, "occurancePercentages", percentages);
		},
		[updateTrait],
	);

	const addTrait = useCallback(() => {
		const newTraitName = "";
		setCollectionTraits({
			...collectionTraits,
			[newTraitName]: { values: [], occurancePercentages: [] },
		});
	}, [collectionTraits, setCollectionTraits]);
	const removeTrait = useCallback(
		(traitName: string) => {
			const newTraits = { ...collectionTraits };
			delete newTraits[traitName];
			setCollectionTraits(newTraits);
		},
		[collectionTraits, setCollectionTraits],
	);

	const updateTraitName = useCallback(
		(oldName: string, newName: string) => {
			if (oldName !== newName) {
				const newTraits = { ...collectionTraits };
				newTraits[newName] = newTraits[oldName];
				delete newTraits[oldName];
				setCollectionTraits(newTraits);
			}
		},
		[collectionTraits, setCollectionTraits],
	);

	const calculateTraitTotal = useCallback((trait: CollectionTrait) => {
		return trait.occurancePercentages.reduce(
			(sum, percentage) => sum + Number.parseFloat(percentage),
			0,
		);
	}, []);

	return (
		<div className="mt-4">
			<label className="block font-medium flex justify-between">
				Collection Traits
			</label>
			{collectionTraits &&
				Object.entries(collectionTraits).map(([traitName, trait], index) => {
					const traitTotal = calculateTraitTotal(trait);
					const isComplete = traitTotal === 1;

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
						<div key={index} className="mt-2">
							<div className="flex items-center gap-2 relative">
								<input
									type="text"
									className="input input-bordered w-full"
									value={traitName}
									onChange={(e) => updateTraitName(traitName, e.target.value)}
									placeholder="Trait Name"
								/>
								<span
									className={`absolute right-16 ${isComplete ? "text-green-500" : "text-red-500"}`}
								>
									{traitTotal ? (traitTotal * 100).toFixed(0) : 0}%
								</span>
								<button
									type="button"
									className={removeBtnClass}
									onClick={() => removeTrait(traitName)}
								>
									<IoMdClose />
								</button>
							</div>
							<input
								type="text"
                name="traitValues"
								className="input input-bordered w-full mt-2"
								value={trait.values.join(",")}
								onChange={(e) => {
                  const values = e.target.value.split(",").map((v) => v.trim());  
                  updateTrait(traitName, "values", values)
								}}
								placeholder="Trait Values (comma-separated)"
							/>
							<input
                name="traitPercentages"
								type="text"
								className="input input-bordered w-full mt-2"
								value={
									inputPercentages[traitName]
                  //  ||
									// trait.occurancePercentages
									// 	.map((v) => (Number.parseFloat(v) * 100).toFixed(0))
									// 	.join(", ")
								}
								onChange={(e) =>
									handlePercentageChange(traitName, e.target.value)
								}
								placeholder="Occurance Percentages (comma-separated whole numbers)"
							/>
						</div>
					);
				})}
			<button type="button" className="btn btn-sm mt-2" onClick={addTrait}>
				Add Trait
			</button>
		</div>
	);
};

export default TraitsForm;

export const validateTraits = (collectionTraits: CollectionTraits) => {
	for (const [traitName, trait] of Object.entries(collectionTraits)) {
    console.log({traitName, trait});
		if (trait.values.length !== trait.occurancePercentages.length) {
			return `The number of trait values and occurance percentages must match for trait "${traitName}". The trait has ${trait.values.length} values and ${trait.occurancePercentages.length} percentages. JSON: ${JSON.stringify(trait)}`;
		}

		const totalPercentage = trait.occurancePercentages.reduce(
			(sum, percentage) => sum + Number.parseFloat(percentage),
			0,
		);
		if (totalPercentage !== 1) {
			return `The occurance percentages for trait "${traitName}" must total up to exactly 100%.`;
		}
	}
	return null;
};
