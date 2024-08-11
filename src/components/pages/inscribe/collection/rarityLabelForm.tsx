// collection/rarityLabelForm.tsx

import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";
import type { Rarity, RarityLabels } from "js-1sat-ord";
import { useMemo } from "react";

interface RarityLabelFormProps {
	collectionRarities: RarityLabels;
	setCollectionRarities: (rarities: RarityLabels) => void;
}

const RarityLabelForm: React.FC<RarityLabelFormProps> = ({
	collectionRarities,
	setCollectionRarities,
}) => {
	const addRarity = () => {
		setCollectionRarities([
			...collectionRarities,
			{ label: "", percentage: "" },
		]);
	};

	const removeRarity = (index: number) => {
		setCollectionRarities(collectionRarities.filter((_, i) => i !== index));
	};

	const updateRarity = (index: number, field: keyof Rarity, value: string) => {
    if (value === "") {
      setCollectionRarities(
        collectionRarities.map((rarity, i) =>
          i === index ? { ...rarity, [field]: "" } : rarity,
        ),
      );
      return
    }
    // values are 1-100, but we want to convert to 0.01-1 string format
    let finalValue = value;
    if (field === "percentage") {
      finalValue = (Number(value) / 100).toFixed(2);
    }
    console.log(finalValue);
		setCollectionRarities(
			collectionRarities.map((rarity, i) =>
				i === index ? { ...rarity, [field]: finalValue } : rarity,
			),
		);
	};


  const totalPct = useMemo(() => {
    const pct = collectionRarities.reduce((acc, curr) => {
      return acc + Number.parseFloat(curr.percentage) * 100;
    }, 0);
    return `${Number.isNaN(pct) ? '' : `${pct}%`}`;
  }, [collectionRarities]);

	return (
		<div className="mt-4">
			<label className="block font-medium flex justify-between">
        <span>Collection Rarity Labels</span>
        <span className={`${totalPct === "100%" ? 'text-emerald-400' : 'text-red-400'}`}>{totalPct}</span>
      </label>
			{collectionRarities.map((rarity, index) => (
				<div
					key={`rarities-${
						// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
						index
					}`}
					className="flex items-center mt-2 gap-2"
				>
					<input
						type="text"
						className="input input-bordered w-full"
						value={rarity.label}
						onChange={(e) => updateRarity(index, "label", e.target.value)}
						placeholder="Rarity Label"
					/>
					<input
						type="number"
						className="input input-bordered w-full"
						value={rarity.percentage === "" ? "" : Math.round(Number(rarity.percentage) * 100)}
						onChange={(e) => updateRarity(index, "percentage", e.target.value)}
						placeholder="Percentage"
            max={100}
            step={1}
					/>
					<button
						type="button"
						className={removeBtnClass}
						onClick={() => removeRarity(index)}
					>
						<IoMdClose />
					</button>
				</div>
			))}
			<button disabled={totalPct === '100%'} type="button" className="btn btn-sm mt-2 disabled:bg-[#222] disabled:cursor-default" onClick={addRarity}>
				Add Rarity
			</button>
		</div>
	);
};

export default RarityLabelForm;

export const validateRarities = (collectionRarities: RarityLabels) => {
	if (collectionRarities.length === 0) {
		// none is okay
		return null;
	}
  if (collectionRarities.length === 1) {
    return "You must have at least two rarities.";
  }
  if (collectionRarities.every((rarity) => rarity.percentage === "0" || rarity.percentage === "" || rarity.percentage === "1")) {
    return "Rarities cannot have a percentage of 0, or 100";
  }
  const totalPercentage = collectionRarities.reduce(
    (sum, rarity) => sum + Number.parseFloat(rarity.percentage),
    0,
  );
  if (totalPercentage !== 0 && totalPercentage !== 1) {
    return `The rarity percentages must total up to exactly 100. Currently at ${totalPercentage * 100}.`;
  }
  return null;
};
