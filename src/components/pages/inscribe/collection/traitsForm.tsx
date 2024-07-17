"use client";

import { useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";

export interface Trait {
	name: string;
	values: string[];
	occurancePercentages: string[];
}

interface TraitsFormProps {
	collectionTraits: Trait[];
	setCollectionTraits: (traits: Trait[]) => void;
}

const TraitsForm: React.FC<TraitsFormProps> = ({
	collectionTraits,
	setCollectionTraits,
}) => {
	const updateTrait = useCallback(
		(index: number, field: keyof Trait, value: string | string[]) => {
			setCollectionTraits(
				collectionTraits.map((trait, i) =>
					i === index ? { ...trait, [field]: value } : trait,
				),
			);
		},
		[collectionTraits, setCollectionTraits],
	);

	const addTrait = useCallback(() => {
		setCollectionTraits([
			...collectionTraits,
			{ name: "", values: [], occurancePercentages: [] },
		]);
	}, [collectionTraits, setCollectionTraits]);

	const removeTrait = useCallback(
		(index: number) => {
			setCollectionTraits(collectionTraits.filter((_, i) => i !== index));
		},
		[collectionTraits, setCollectionTraits],
	);

	return (
		<div className="mt-4">
			<label className="block font-medium">Collection Traits</label>
			{collectionTraits.map((trait, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-rendering
				<div key={index} className="mt-2">
					<div className="flex items-center gap-2">
						<input
							key={`name-${
								// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-rendering
								index
							}`}
							type="text"
							className="input input-bordered w-full"
							value={trait.name}
							onChange={(e) => updateTrait(index, "name", e.target.value)}
							placeholder="Trait Name"
						/>
						<button
							type="button"
							className={removeBtnClass}
							onClick={() => removeTrait(index)}
						>
							<IoMdClose />
						</button>
					</div>
					<input
						key={`values-${
							// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-rendering
							index
						}`}
						type="text"
						className="input input-bordered w-full mt-2"
						value={trait.values.join(", ")}
						onChange={(e) =>
							updateTrait(index, "values", e.target.value.split(", "))
						}
						placeholder="Trait Values (comma-separated)"
					/>
					<input
						key={`percentages-${
							// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-rendering
							index
						}`}
						type="text"
						className="input input-bordered w-full mt-2"
						value={trait.occurancePercentages.join(", ")}
						onChange={(e) =>
							updateTrait(
								index,
								"occurancePercentages",
								e.target.value.split(", "),
							)
						}
						placeholder="Occurance Percentages (comma-separated)"
					/>
				</div>
			))}
			<button type="button" className="btn btn-sm mt-2" onClick={addTrait}>
				Add Trait
			</button>
		</div>
	);
};

export default TraitsForm;
