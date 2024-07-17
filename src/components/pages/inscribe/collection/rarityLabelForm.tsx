import { IoMdClose } from "react-icons/io";
import { removeBtnClass, type Rarity } from ".";

interface RarityLabelFormProps {
	collectionRarities: Rarity[];
	setCollectionRarities: (rarities: Rarity[]) => void;
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
		setCollectionRarities(
			collectionRarities.map((rarity, i) =>
				i === index ? { ...rarity, [field]: value } : rarity,
			),
		);
	};

  const totalPct = collectionRarities.reduce((acc, curr) => {
    return acc + Number(curr.percentage);
  }, 0);

	return (
		<div className="mt-4">
			<label className="block font-medium flex justify-between">
        <span>Collection Rarity Labels</span>
        <span className={`${totalPct === 100 ? 'text-emerald-400' : 'text-red-400'}`}>{totalPct}%</span>
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
						value={rarity.percentage}
						onChange={(e) => updateRarity(index, "percentage", e.target.value)}
						placeholder="Percentage"
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
			<button type="button" className="btn btn-sm mt-2" onClick={addRarity}>
				Add Rarity
			</button>
		</div>
	);
};

export default RarityLabelForm;
