// collection/traitsForm.tsx
"use client";

import { useCallback, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";
import type { CollectionTraits, CollectionTrait } from "js-1sat-ord";
import Decimal from "decimal.js";

interface TraitsFormProps {
	collectionTraits?: CollectionTraits;
	setCollectionTraits: (traits: CollectionTraits) => void;
	totalItems?: number;
}

const TraitsForm: React.FC<TraitsFormProps> = ({
	collectionTraits,
	setCollectionTraits,
	totalItems,
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

        let processedValue = value;
        if (field === "occurancePercentages" && Array.isArray(value)) {
            if (totalItems) {
                // Calculate percentages based on totalItems
                const total = value.reduce((sum, v) => sum + (Number.parseInt(v) || 0), 0);
                processedValue = value.map((v) => {
                    const count = Number.parseInt(v) || 0;
                    return new Decimal(count).dividedBy(total).toDecimalPlaces(4).toString();
                });
            } else {
                // Use the original percentage calculation
                processedValue = value.map((v) =>
                    v ? new Decimal(v).dividedBy(100).toDecimalPlaces(4).toString() : "0",
                );
            }

            // Ensure the sum is exactly 1 (100%)
            const sum = processedValue.reduce((acc, val) => acc.plus(new Decimal(val)), new Decimal(0));
            const remainder = new Decimal(1).minus(sum);

            if (!remainder.isZero()) {
                // Find the largest value to adjust
                let largestIndex = 0;
                let largestValue = new Decimal(processedValue[0]);
                for (let i = 1; i < processedValue.length; i++) {
                    const current = new Decimal(processedValue[i]);
                    if (current.greaterThan(largestValue)) {
                        largestValue = current;
                        largestIndex = i;
                    }
                }

                // Adjust the largest value
                processedValue[largestIndex] = largestValue.plus(remainder).toDecimalPlaces(4).toString();
            }
        }

        setCollectionTraits({
            ...collectionTraits,
            [traitName]: {
                ...collectionTraits[traitName],
                [field]: processedValue,
            },
        });
    },
    [collectionTraits, setCollectionTraits, totalItems],
);

	const handlePercentageChange = useCallback(
		(traitName: string, value: string) => {
			const cleanedValue = value.replace(/[^0-9,\.]/g, "");
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
			(sum, percentage) => sum.plus(percentage ? new Decimal(percentage) : 0),
			new Decimal(0),
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
					const isComplete = traitTotal.eq(1);

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
                      {traitTotal.times(100).toFixed(4)}%
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
									updateTrait(traitName, "values", values);
								}}
								placeholder="Trait Values (comma-separated)"
							/>
							<input
								name="traitPercentages"
								type="text"
								className="input input-bordered w-full mt-2"
                value={
                  inputPercentages[traitName]
                  ||
                  (totalItems
                      ? trait.occurancePercentages
                          .map((v) => Math.round(new Decimal(v).times(totalItems).toNumber()).toString())
                          .join(", ")
                      : trait.occurancePercentages
                          .map((v) => new Decimal(v).times(100).toFixed(4))
                          .join(", ")
                  )
                }
								onChange={(e) =>
									handlePercentageChange(traitName, e.target.value)
								}
								placeholder={
									totalItems
										? `Item counts (total: ${totalItems})`
										: "Occurance Percentages (comma-separated numbers)"
								}
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

export const validateTraits = (collectionTraits: CollectionTraits, totalItems?: number) => {
  for (const [traitName, trait] of Object.entries(collectionTraits)) {
      if (trait.values.length !== trait.occurancePercentages.length) {
          return `The number of trait values and occurance percentages must match for trait "${traitName}". The trait has ${trait.values.length} values and ${trait.occurancePercentages.length} percentages. JSON: ${JSON.stringify(trait)}`;
      }

      const totalPercentage = trait.occurancePercentages.reduce(
          (sum, percentage) => sum.plus(new Decimal(percentage)),
          new Decimal(0)
      );

      if (totalItems) {
          const totalCount = trait.occurancePercentages.reduce(
              (sum, percentage) => sum + Math.round(new Decimal(percentage).times(totalItems).toNumber()),
              0
          );
          if (totalCount !== totalItems) {
              return `The total count for trait "${traitName}" must equal ${totalItems}. Current total: ${totalCount}`;
          }
      } else {
          if (!totalPercentage.eq(1)) {
              return `The occurance percentages for trait "${traitName}" must total up to exactly 100%. Current total: ${totalPercentage.times(100)}%`;
          }
      }
  }
  return null;
};