// collectionItemDataForm.tsx
import type React from "react";
import { useState, useEffect } from "react";
import type {
	CollectionItemSubTypeData,
	CollectionItemTrait,
	RarityLabels,
	CollectionTraits,
} from "js-1sat-ord";

interface CollectionItemDataFormProps {
	collectionId: string;
	rarityLabels?: RarityLabels;
	traits?: CollectionTraits;
	setSubTypeData: (subTypeData: CollectionItemSubTypeData) => void;
}

const CollectionItemDataForm: React.FC<CollectionItemDataFormProps> = ({
	rarityLabels,
	traits,
	setSubTypeData,
	collectionId,
}) => {
	const [mintNumber, setMintNumber] = useState<number | undefined>();
	const [rank, setRank] = useState<number | undefined>();
	const [selectedRarity, setSelectedRarity] = useState<string>("");
	const [selectedTraits, setSelectedTraits] = useState<CollectionItemTrait[]>(
		[],
	);

	useEffect(() => {
		const subTypeData: CollectionItemSubTypeData = {
			collectionId,
			mintNumber,
			rank,
			rarityLabel: selectedRarity
				? [{ label: selectedRarity, percentage: "" }]
				: undefined,
			traits: selectedTraits.length > 0 ? selectedTraits : undefined,
		};
		setSubTypeData(subTypeData);
	}, [
		collectionId,
		mintNumber,
		rank,
		selectedRarity,
		selectedTraits,
		setSubTypeData,
	]);

	const handleTraitChange = (traitName: string, value: string) => {
		if (traits?.[traitName]) {
			const traitData = traits[traitName];
			const index = traitData.values.indexOf(value);
			const occurancePercentrage = traitData.occurancePercentages[index];

			setSelectedTraits((prev) => {
				const newTraits = prev.filter((t) => t.name !== traitName);
				if (value) {
					newTraits.push({ name: traitName, value, occurancePercentrage });
				}
				return newTraits;
			});
		}
	};

	return (
		<div className="mt-4">
			<h3 className="text-lg font-semibold mb-2">Collection Item Data</h3>

			<div className="mb-2">
				<label className="block">Mint Number</label>
				<input
					type="number"
					className="input input-bordered w-full"
					value={mintNumber || ""}
					onChange={(e) =>
						setMintNumber(e.target.value ? Number(e.target.value) : undefined)
					}
				/>
			</div>

			<div className="mb-2">
				<label className="block">Rank</label>
				<input
					type="number"
					className="input input-bordered w-full"
					value={rank || ""}
					onChange={(e) =>
						setRank(e.target.value ? Number(e.target.value) : undefined)
					}
				/>
			</div>

			{rarityLabels && (
				<div className="mb-2">
					<label className="block">Rarity</label>
					<select
						className="select select-bordered w-full"
						value={selectedRarity}
						onChange={(e) => setSelectedRarity(e.target.value)}
					>
						<option value="">Select Rarity</option>
						{rarityLabels.map((rarity, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
							<option key={index} value={rarity.label}>
								{rarity.label}
							</option>
						))}
					</select>
				</div>
			)}

			{traits &&
				Object.entries(traits).map(([traitName, traitData]) => (
					<div key={traitName} className="mb-2">
						<label className="block">{traitName}</label>
						<select
							className="select select-bordered w-full"
							value={
								selectedTraits.find((t) => t.name === traitName)?.value || ""
							}
							onChange={(e) => handleTraitChange(traitName, e.target.value)}
						>
							<option value="">Select {traitName}</option>
							{traitData.values.map((value, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
								<option key={index} value={value}>
									{value}
								</option>
							))}
						</select>
					</div>
				))}
		</div>
	);
};

export default CollectionItemDataForm;
