"use client";

import Artifact from "@/components/artifact";
import { knownImageTypes, toastErrorProps } from "@/constants";
import { ordPk, payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { FileEvent } from "@/types/file";
import type { TxoData } from "@/types/ordinals";
import { getUtxos } from "@/utils/address";
import { inscribeFile } from "@/utils/inscribe";
import { useSignals } from "@preact/signals-react/runtime";
import { head } from "lodash";
import mime from "mime";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";
import { IconWithFallback } from "../../TokenMarket/heading";
import TraitsForm, { type Trait } from "./traitsForm";
import RarityLabelForm from "./rarityLabelForm";

type CollectionInscription = {
	name: string;
	description: string;
	quantity?: string;
	rarityLabels?: string;
	traits?: string;
	previewUrl?: string;
	royalties?: string;
};

interface InscribeCollectionProps {
	inscribedCallback: () => void;
}

export interface Rarity {
	label: string;
	percentage: string;
}

export interface Royalty {
	type: "paymail" | "address";
	destination: string;
	percentage: string;
}

const InscribeCollection: React.FC<InscribeCollectionProps> = ({
	inscribedCallback,
}) => {
	useSignals();

	const [collectionName, setCollectionName] = useState("");
	const [collectionDescription, setCollectionDescription] = useState("");
	const [collectionQuantity, setCollectionQuantity] = useState("");
	const [collectionRarities, setCollectionRarities] = useState<Rarity[]>([]);
	const [collectionTraits, setCollectionTraits] = useState<Trait[]>([]);
	const [collectionCoverImage, setCollectionCoverImage] = useState<File | null>(
		null,
	);
	const [collectionRoyalties, setCollectionRoyalties] = useState<Royalty[]>([]);
	const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
	const [isImage, setIsImage] = useState<boolean>(false);
	const [mintError, setMintError] = useState<string>();

	const validateTraits = useCallback(() => {
		for (const trait of collectionTraits) {
			if (trait.values.length !== trait.occurancePercentages.length) {
				return "The number of trait values and occurance percentages must match.";
			}

			const totalPercentage = trait.occurancePercentages.reduce(
				(sum, percentage) => sum + Number.parseFloat(percentage),
				0,
			);
			if (totalPercentage !== 100) {
				return "The occurance percentages for each trait must total up to exactly 100.";
			}
		}
		return null;
	}, [collectionTraits]);

	const validateRarities = useCallback(() => {
		if (collectionRarities.length === 1) {
			return "You must have at least two rarities.";
		}

		const totalPercentage = collectionRarities.reduce(
			(sum, rarity) => sum + Number.parseFloat(rarity.percentage),
			0,
		);
		if (totalPercentage !== 0 && totalPercentage !== 100) {
			return "The rarity percentages must total up to exactly 100.";
		}
		return null;
	}, [collectionRarities]);

	const validateRoyalties = useCallback(() => {
		const totalPercentage = collectionRoyalties.reduce(
			(sum, royalty) => sum + Number.parseFloat(royalty.percentage),
			0,
		);
		if (totalPercentage > 7) {
			return "The collection royalties must collectively total no more than 7%.";
		}
		return null;
	}, [collectionRoyalties]);

	const inscribeCollection = useCallback(async () => {
		if (
			!payPk.value ||
			!ordPk.value ||
			!ordAddress.value ||
			!fundingAddress.value
		) {
			return;
		}

		if (!collectionCoverImage) {
			toast.error("Please upload a cover image", toastErrorProps);
			return;
		}

		const traitError = validateTraits();
		if (traitError) {
			toast.error(traitError, toastErrorProps);
			return;
		}

		const rarityError = validateRarities();
		if (rarityError) {
			toast.error(rarityError, toastErrorProps);
			return;
		}

		const royaltyError = validateRoyalties();
		if (royaltyError) {
			toast.error(royaltyError, toastErrorProps);
			return;
		}

		const utxos = await getUtxos(fundingAddress.value);
		const sortedUtxos = utxos.sort((a, b) =>
			a.satoshis > b.satoshis ? -1 : 1,
		);
		const u = head(sortedUtxos);
		if (!u) {
			console.error("no utxo");
			return;
		}

		const metadata = {
			app: "1sat.market",
			type: "ord",
			subType: "collection",
			name: collectionName,
			description: collectionDescription,
			quantity: collectionQuantity,
		} as CollectionInscription;

		if (collectionRarities.length > 0) {
			metadata.rarityLabels = JSON.stringify(
				collectionRarities.reduce(
					(acc, rarity) => {
						acc[rarity.label] = rarity.percentage;
						return acc;
					},
					{} as Record<string, string>,
				),
			);
		}

		if (collectionTraits.length > 0) {
			metadata.traits = JSON.stringify(
				collectionTraits.map((trait) => ({
					[trait.name]: {
						values: trait.values,
						occurancePercentages: trait.occurancePercentages,
					},
				})),
			);
		}

		if (collectionRoyalties.length > 0) {
			metadata.royalties = JSON.stringify(collectionRoyalties);
		}

		let file: File | undefined;
		if (collectionCoverImage.type === "") {
			const newType = mime.getType(collectionCoverImage.name);
			if (newType !== null) {
				file = new File([collectionCoverImage], collectionCoverImage.name, {
					type: newType,
				});
			}
		}
		if (!file) {
			file = collectionCoverImage;
		}

		const pendingTx = await inscribeFile(u, file, metadata, ordPk.value);
		if (pendingTx) {
			pendingTxs.value = [pendingTx];
			inscribedCallback();
		}
	}, [
		collectionCoverImage,
		collectionDescription,
		collectionName,
		collectionQuantity,
		collectionRarities,
		collectionRoyalties,
		collectionTraits,
		fundingAddress.value,
		inscribedCallback,
		ordAddress.value,
		ordPk.value,
		payPk.value,
		validateRarities,
		validateRoyalties,
		validateTraits,
	]);

	const addRoyalty = () => {
		setCollectionRoyalties([
			...collectionRoyalties,
			{ type: "paymail", destination: "", percentage: "" },
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
		[collectionRoyalties],
	);

	// (e) => setCollectionCoverImage(e.target.files?.[0] || null)}

	const changeFile = useCallback(async (e: FileEvent) => {
		// TODO: This reads the file twice which is pretty inefficient
		// would be nice to get dimensions and ArrayBuffer for preview in one go

		const file = e.target.files[0] as File;
		// make sure the width and height are identical
		const img = new Image();
		img.onload = () => {
			if (img.width !== img.height) {
				toast.error("Image must be square", toastErrorProps);
				setCollectionCoverImage(null);
				setPreview(null);
				setIsImage(false);
				setMintError("Image must be square");
				return;
			}
			// max size is 400px
			if (img.width > 2048) {
				toast.error("Width must be 2048px or less", toastErrorProps);
				setCollectionCoverImage(null);
				setPreview(null);
				setIsImage(false);
				setMintError("Width must be 2048px or less");
				return;
			}
			if (file.size > 1024 * 1024) {
				toast.error("Image must be less than 1MB", toastErrorProps);
				setCollectionCoverImage(null);
				setPreview(null);
				setIsImage(false);
				setMintError("Image must be less than 1MB");
				return;
			}
			setMintError(undefined);
			setCollectionCoverImage(file);
			if (knownImageTypes.includes(file.type)) {
				setIsImage(true);
			}
			const reader = new FileReader();

			reader.onloadend = () => {
				setPreview(reader.result);
			};
			reader.readAsDataURL(file);
		};
		img.src = URL.createObjectURL(file);
	}, []);

	const artifact = useMemo(async () => {
		return (
			collectionCoverImage?.type &&
			preview && (
				<Artifact
					classNames={{ media: "w-20 h-20 rounded", wrapper: "w-fit" }}
					showFooter={false}
					size={100}
					artifact={{
						data: {
							insc: {
								file: {
									type: collectionCoverImage.type,
									size: collectionCoverImage.size,
								},
							},
						} as TxoData,
						script: "",
						outpoint: "",
						txid: "",
						vout: 0,
					}}
					src={preview as string}
					sizes={""}
				/>
			)
		);
	}, [preview, collectionCoverImage]);

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="text-2xl font-bold">Inscribe Collection</h1>
			<p className="mt-4">
				Creating a new collection inscription enables minting images to this
				collection. Member items are created later.
			</p>

			<div className="divider" />

			<div className="my-2 flex items-center">
				<div className="w-28 mr-4">
					{(!collectionCoverImage || !preview) && (
						<div className="text-[#555] text-lg">
							<IconWithFallback
								icon={null}
								alt={"Choose an Icon"}
								className="opacity-50 w-20 h-20 rounded-full"
							/>
						</div>
					)}
					{collectionCoverImage && preview && isImage && artifact}
					{collectionCoverImage && !isImage && (
						<div className="w-full h-full bg-[#111] rounded flex items-center justify-center">
							X
						</div>
					)}
				</div>
				<label className="block mb-4 w-full">
					<div className="my-2 flex items-center justify-between">
						<label htmlFor="collectionCoverImage" className="block font-medium">
							Upload Cover Image
						</label>
						<div>
							<div
								className={`${
									mintError ? "text-error" : "text-[#555]"
								} text-sm`}
							>
								{mintError || "Max Size 1MB, Square Image"}
							</div>
						</div>
					</div>
					<input
						type="file"
						id="collectionCoverImage"
						className="file-input file-input-bordered w-full mt-2"
						onChange={changeFile}
					/>
				</label>
			</div>

			<div className="mt-4">
				<label htmlFor="collectionName" className="block font-medium">
					Name
				</label>
				<input
					type="text"
					id="collectionName"
					className="input input-bordered w-full"
					value={collectionName}
					onChange={(e) => setCollectionName(e.target.value)}
					required
				/>
			</div>

			<div className="mt-4">
				<label htmlFor="collectionDescription" className="block font-medium">
					Description
				</label>
				<textarea
					id="collectionDescription"
					className="textarea textarea-bordered w-full"
					value={collectionDescription}
					onChange={(e) => setCollectionDescription(e.target.value)}
					required
				/>
			</div>

			<div className="mt-4">
				<label htmlFor="collectionQuantity" className="block font-medium">
					Number of Items
				</label>
				<input
					type="number"
					id="collectionQuantity"
					className="input input-bordered w-full"
					value={collectionQuantity}
					onChange={(e) => setCollectionQuantity(e.target.value)}
				/>
			</div>

			<div className="divider" />

			<RarityLabelForm
				collectionRarities={collectionRarities}
				setCollectionRarities={setCollectionRarities}
			/>

			<div className="divider" />

			<TraitsForm
				collectionTraits={collectionTraits}
				setCollectionTraits={setCollectionTraits}
			/>

			<div className="divider" />

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

			<div className="divider" />

			<button
				type="button"
				className="btn btn-primary mt-4"
				onClick={inscribeCollection}
				disabled={!collectionName || !collectionDescription}
			>
				Inscribe Collection
			</button>
		</div>
	);
};

export default InscribeCollection;

export const removeBtnClass =
	"btn bg-transparent hover:bg-[#010101] border-0 hover:border btn-square text-lg text-error transition";
