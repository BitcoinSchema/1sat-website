import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";
import { useCallback } from "react";
import type { Royalty } from "js-1sat-ord";

interface RoyaltyFormProps {
  collectionRoyalties: Royalty[];
  setCollectionRoyalties: (royalties: Royalty[]) => void;
}

const RoyaltyForm: React.FC<RoyaltyFormProps> = ({
  collectionRoyalties,
  setCollectionRoyalties,
}) => {

	const addRoyalty = () => {
		setCollectionRoyalties([
			...collectionRoyalties,
			{ type: "paymail", destination: "", percentage: "" } as Royalty,
		]);
	};

	const removeRoyalty = (index: number) => {
		setCollectionRoyalties(collectionRoyalties.filter((_, i) => i !== index));
	};

	const updateRoyalty = useCallback(
		(index: number, field: keyof Royalty, value: string) => {
			if (field === "percentage") {
				const percentage = Number.parseFloat(value);
				if (Number.isNaN(percentage) || percentage < 0 || percentage > 7) {
					return;
				}
			}
			setCollectionRoyalties(
				collectionRoyalties.map((royalty, i) =>
					i === index ? { ...royalty, [field]: value } : royalty,
				),
			);
		},
		[collectionRoyalties, setCollectionRoyalties],
	);

  return (
    <div className="mt-4">
				<label className="block font-medium">Collection Royalties</label>
				{collectionRoyalties.map((royalty, index) => (
					<div
						key={`royalty-${
							// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
							index
						}`}
						className="mt-2 gap-2 flex-col flex"
					>
						<div className="flex items-center gap-2">
							<select
								className="select select-bordered w-full"
								value={royalty.type}
								onChange={(e) => updateRoyalty(index, "type", e.target.value)}
							>
								<option value="paymail">Paymail</option>
								<option value="address">Address</option>
							</select>
							<button
								type="button"
								className={removeBtnClass}
								onClick={() => removeRoyalty(index)}
							>
								<IoMdClose />
							</button>
						</div>
						<input
							type="text"
							className="input input-bordered w-full"
							value={royalty.destination}
							onChange={(e) =>
								updateRoyalty(index, "destination", e.target.value)
							}
							placeholder={`Destination ${royalty.type === "paymail" ? "Paymail" : "Address"}`}
						/>
						<input
							type="text"
							className="input input-bordered w-full"
							value={royalty.percentage}
							onChange={(e) =>
								updateRoyalty(index, "percentage", e.target.value)
							}
							placeholder="Percentage"
						/>
					</div>
				))}
				<button type="button" className="btn btn-sm mt-2" onClick={addRoyalty}>
					Add Royalty
				</button>
			</div>
  )
}

export default RoyaltyForm;

export const validateRoyalties = (collectionRoyalties: Royalty[]) => {
	const totalPercentage = collectionRoyalties.reduce(
		(sum, royalty) => sum + Number.parseFloat(royalty.percentage),
		0,
	);
	if (totalPercentage > 7) {
		return "The collection royalties must collectively total no more than 7%.";
	}
	return null;
};