"use client";

import Artifact from "@/components/artifact";
import { knownImageTypes, toastErrorProps } from "@/constants";
import { ordPk, payPk } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { FileEvent } from "@/types/file";
import type { TxoData } from "@/types/ordinals";
import { getUtxos } from "@/utils/address";
import { useSignals } from "@preact/signals-react/runtime";
import mime from "mime";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IconWithFallback } from "../../TokenMarket/heading";
import TraitsForm, { validateTraits } from "./traitsForm";
import RarityLabelForm, { validateRarities } from "./rarityLabelForm";
import RoyaltyForm, { validateRoyalties } from "./royaltyForm";
import {
	type CollectionSubTypeData,
	type CreateOrdinalsCollectionMetadata,
	type CreateOrdinalsCollectionConfig,
	type Destination,
	type CollectionTraits,
	type Royalty,
	type RarityLabels,
	createOrdinals,
	validateSubTypeData,
} from "js-1sat-ord";
import { PrivateKey } from "@bsv/sdk";
import type { PendingTransaction } from "@/types/preview";
import { useLocalStorage } from "@/utils/storage";
import { setPendingTxs } from "@/signals/wallet/client";

interface InscribeCollectionProps {
	inscribedCallback: () => void;
}

const InscribeCollection: React.FC<InscribeCollectionProps> = ({
	inscribedCallback,
}) => {
	useSignals();

	const [collectionName, setCollectionName] = useLocalStorage("1sc-cn", "");
	const [collectionDescription, setCollectionDescription] = useLocalStorage("1sc-cd", "");
	const [collectionQuantity, setCollectionQuantity] = useLocalStorage<number | undefined>("1sc-cq", undefined);
	const [collectionRarities, setCollectionRarities] = useLocalStorage<RarityLabels>("1sc-rl",
		[],
	);
	const [collectionTraits, setCollectionTraits] = useLocalStorage<CollectionTraits>("1sc-ct", undefined);
	const [collectionCoverImage, setCollectionCoverImage] = useState<File | null>(
		null,
	);
	const [collectionRoyalties, setCollectionRoyalties] = useLocalStorage<Royalty[]>("1sc-rlt", []);
	const [preview, setPreview] = useLocalStorage<
		string | ArrayBuffer | undefined
	>("1sc-preview", undefined);

	const [isImage, setIsImage] = useLocalStorage<boolean>("1sc-isc", false);
	const [mintError, setMintError] = useState<string>();
  const [iconFileName, setIconFileName] = useLocalStorage<string>("isc-ifn", "icon");
	const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preview && typeof preview === "string") {
      const img = new Image();
      img.onload = () => {
        setIsImage(true);
        const file = dataURLtoFile(preview, iconFileName || "icon");
        setCollectionCoverImage(file);
  
        // Set the filename using the ref
        if (fileInputRef.current) {
          // Create a DataTransfer object and add the file
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          // Set the files property of the input element
          fileInputRef.current.files = dataTransfer.files;
        }
      };
      img.src = preview;
    }
  }, [iconFileName, preview, setIsImage]);

	const validateForm = useCallback(() => {
		if (collectionTraits) {
			const traitError = validateTraits(collectionTraits);
			if (traitError) {
				toast.error(traitError, toastErrorProps);
				throw new Error(traitError);
			}
		}

		const rarityError = validateRarities(collectionRarities || []);
		if (rarityError) {
			toast.error(rarityError, toastErrorProps);
			throw new Error(rarityError);
		}

		const royaltyError = validateRoyalties(collectionRoyalties || []);
		if (royaltyError) {
			toast.error(royaltyError, toastErrorProps);
			throw new Error(royaltyError);
		}

		if (!collectionName) {
			toast.error("Name is required", toastErrorProps);
			throw new Error("Name is required");
		}
	}, [
		collectionName,
		collectionRarities,
		collectionRoyalties,
		collectionTraits,
	]);

	const resetForm = useCallback(() => {
		setCollectionCoverImage(null);
		setCollectionDescription("");
		setCollectionName("");
		setCollectionQuantity(undefined);
		setCollectionRarities([]);
		setCollectionRoyalties([]);
		setCollectionTraits(undefined);
		setMintError(undefined);
		setPreview(undefined);
		setIsImage(false);
	}, [
		setCollectionCoverImage,
		setCollectionDescription,
		setCollectionName,
		setCollectionQuantity,
		setCollectionRarities,
		setCollectionRoyalties,
		setCollectionTraits,
		setMintError,
		setPreview,
		setIsImage,
	]);

	const inscribeCollection = useCallback(async () => {
		if (
			!payPk.value ||
			!ordPk.value ||
			!ordAddress.value ||
			!fundingAddress.value
		) {
			toast.error("Wallet not ready", toastErrorProps);
			return;
		}

		if (!collectionCoverImage) {
			toast.error("Please upload a cover image", toastErrorProps);
			return;
		}

    

		try {
			validateForm();
		} catch (e) {
			console.error(e);
			return;
		}

		const utxos = await getUtxos(fundingAddress.value);

		const metaData = {
			app: "1sat.market",
			type: "ord",
			subType: "collection",
			name: collectionName,
		} as CreateOrdinalsCollectionMetadata;

		if (collectionRoyalties && collectionRoyalties.length > 0) {
			metaData.royalties = collectionRoyalties;
		}

		const subTypeData: Partial<CollectionSubTypeData> = {
			quantity: collectionQuantity,
			description: collectionDescription,
		};

		if (!collectionQuantity) {
			subTypeData.quantity = undefined;
		}

		if (collectionRarities && collectionRarities.length > 0) {
			subTypeData.rarityLabels = collectionRarities;
		}

		if (collectionTraits) {
			subTypeData.traits = collectionTraits;
		}

		metaData.subTypeData = subTypeData as CollectionSubTypeData;

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

		const dataB64 = Buffer.from(await file.arrayBuffer()).toString("base64");

		const destinations: Destination[] = [
			{
				address: ordAddress.value,
				inscription: {
					dataB64,
					contentType: "application/json",
				},
			},
		];

		const error = validateSubTypeData("collection", metaData.subTypeData);
		if (error) {
			console.error(error);
			return;
		}

		// const pendingTx = await inscribeFile(u, file, metadata, ordPk.value);
		const config: CreateOrdinalsCollectionConfig = {
			destinations,
			paymentPk: PrivateKey.fromWif(payPk.value),
			utxos,
			metaData,
		};
		const { tx, spentOutpoints, payChange } = await createOrdinals(config);
		console.log("TX", tx.toHex());
		if (tx) {
			setPendingTxs([
				{
					txid: tx.id("hex"),
					rawTx: tx.toHex(),
					fee: tx.getFee(),
					numInputs: tx.inputs.length,
					numOutputs: tx.outputs.length,
					inputTxid: tx.inputs[0].sourceTXID,
					contentType: file.type,
					metadata: metaData,
					size: tx.toBinary().length,
					returnTo: "/inscribe",
					spentOutpoints,
					payChange,
				} as PendingTransaction,
			])
			// resetForm();
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
		// resetForm,
		validateForm,
	]);

	// (e) => setCollectionCoverImage(e.target.files?.[0] || null)}

	const changeFile = useCallback(
		async (e: FileEvent) => {
			// TODO: This reads the file twice which is pretty inefficient
			// would be nice to get dimensions and ArrayBuffer for preview in one go

			const file = e.target.files[0] as File;

			// make sure the width and height are identical
			const img = new Image();
			img.onload = () => {
				if (img.width !== img.height) {
					toast.error("Image must be square", toastErrorProps);
					setCollectionCoverImage(null);
					setPreview(undefined);
					setIsImage(false);
					setMintError("Image must be square");
					return;
				}
				// max size is 400px
				if (img.width > 2048) {
					toast.error("Width must be 2048px or less", toastErrorProps);
					setCollectionCoverImage(null);
					setPreview(undefined);
					setIsImage(false);
					setMintError("Width must be 2048px or less");
					return;
				}
				if (file.size > 1024 * 1024) {
					toast.error("Image must be less than 1MB", toastErrorProps);
					setCollectionCoverImage(null);
					setPreview(undefined);
					setIsImage(false);
					setMintError("Image must be less than 1MB");
					return;
				}
				setMintError(undefined);
				setCollectionCoverImage(file);
        setIconFileName(file.name);
				if (knownImageTypes.includes(file.type)) {
					setIsImage(true);
				}
				const reader = new FileReader();

				reader.onloadend = () => {
					setPreview(reader.result as string);
				};
				reader.readAsDataURL(file);
			};
			img.src = URL.createObjectURL(file);
		},
		[setIconFileName, setIsImage, setPreview],
	);

	const artifact = useMemo(async () => {
		return (
			collectionCoverImage?.type &&
			preview && (
				<Artifact
					classNames={{ media: "w-20 h-20 rounded", wrapper: "w-fit" }}
					showFooter={false}
					size={100}
					latest={true}
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
						ref={fileInputRef}
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
					onChange={(e) => setCollectionQuantity(Number.parseInt(e.target.value))}
				/>
			</div>

			<div className="divider" />

			<RarityLabelForm
				collectionRarities={collectionRarities || []}
				setCollectionRarities={setCollectionRarities}
			/>

			<div className="divider" />

			<TraitsForm
				collectionTraits={collectionTraits}
				setCollectionTraits={setCollectionTraits}
			/>

			<div className="divider" />

			<RoyaltyForm
				collectionRoyalties={collectionRoyalties || []}
				setCollectionRoyalties={setCollectionRoyalties}
			/>

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

const dataURLtoFile = (dataurl: string, filename: string): File => {
	const arr = dataurl.split(",");
	const mime = arr[0].match(/:(.*?);/)?.[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, { type: mime });
};
