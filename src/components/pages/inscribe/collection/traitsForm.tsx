"use client";

import { useCallback } from "react";
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

  const updateTrait = useCallback(
    (traitName: string, field: keyof CollectionTrait, value: string | string[]) => {
      if (!collectionTraits) {
        return
      }
      setCollectionTraits({
        ...collectionTraits,
        [traitName]: {
          ...collectionTraits[traitName],
          [field]: value,
        },
      });
    },
    [collectionTraits, setCollectionTraits]
  );

  const addTrait = useCallback(() => {
    const newTraitName = `Trait ${collectionTraits ? Object.keys(collectionTraits).length + 1 : 0}`;
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
    [collectionTraits, setCollectionTraits]
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
    [collectionTraits, setCollectionTraits]
  );

  return (
    <div className="mt-4">
      <label className="block font-medium">Collection Traits</label>
      {collectionTraits && Object.entries(collectionTraits).map(([traitName, trait]) => (
        <div key={traitName} className="mt-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              value={traitName}
              onChange={(e) => updateTraitName(traitName, e.target.value)}
              placeholder="Trait Name"
            />
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
            className="input input-bordered w-full mt-2"
            value={trait.values.join(", ")}
            onChange={(e) =>
              updateTrait(traitName, "values", e.target.value.split(", "))
            }
            placeholder="Trait Values (comma-separated)"
          />
          <input
            type="text"
            className="input input-bordered w-full mt-2"
            value={trait.occurancePercentages.join(", ")}
            onChange={(e) =>
              updateTrait(traitName, "occurancePercentages", e.target.value.split(", "))
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

export const validateTraits = (collectionTraits: CollectionTraits) => {
  for (const [traitName, trait] of Object.entries(collectionTraits)) {
    if (trait.values.length !== trait.occurancePercentages.length) {
      return `The number of trait values and occurance percentages must match for trait "${traitName}".`;
    }

    const totalPercentage = trait.occurancePercentages.reduce(
      (sum, percentage) => sum + Number.parseFloat(percentage),
      0
    );
    if (totalPercentage !== 1) {
      return `The occurance percentages for trait "${traitName}" must total up to exactly 100%.`;
    }
  }
  return null;
};