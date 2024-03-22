"use client";

import Artifact from "@/components/artifact";
import { FetchStatus } from "@/constants";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { TxoData } from "@/types/ordinals";
import { getUtxos } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { inscribeFile } from "@/utils/inscribe";
import { useSignals } from "@preact/signals-react/runtime";
import { head } from "lodash";
import * as mime from "mime";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { TbClick } from "react-icons/tb";
import { styled } from "styled-components";

interface InscribeImageProps {
	inscribedCallback: () => void;
}

const InscribeImage: React.FC<InscribeImageProps> = ({ inscribedCallback }) => {
	useSignals();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
	const [isImage, setIsImage] = useState<boolean>(false);
	const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);
	const handleFileChange = useCallback(
		(event: any) => {
			const file = event.target.files[0] as File;

			if (knownImageTypes.includes(file.type)) {
				setIsImage(true);
			} else if (knownVideoTypes.includes(file.type)) {
				setIsImage(false);
			} else if (knownAudioTypes.includes(file.type)) {
				setIsImage(false);
			} else {
				setIsImage(false);
			}

			setSelectedFile(file);
			if (file) {
				const reader = new FileReader();
				reader.onloadend = () => {
					setPreview(reader.result);
				};
				reader.readAsDataURL(file);
			} else {
				setPreview(null);
			}
		},
		[setPreview, setSelectedFile, setIsImage],
	);

	type MetaMap = {
		key: string;
		value: string;
		idx: number;
	};

	const [metadata, setMetadata] = useState<MetaMap[] | undefined>();

	const mapData = useMemo(() => {
		const md = metadata?.reduce(
			(acc, curr) => {
				acc[curr.key] = curr.value;
				return acc;
			},
			{} as { [key: string]: string },
		);
		if (md) {
			md.app = "1satordinals.com";
			md.type = "ord";
			return md;
		}
	}, [metadata]);

	const clickInscribe = useCallback(async () => {
		if (
			!selectedFile ||
			!payPk.value ||
			!ordAddress.value ||
			!fundingAddress.value
		) {
			return;
		}

		const utxos = await getUtxos(fundingAddress.value);
		const sortedUtxos = utxos.sort((a, b) =>
			a.satoshis > b.satoshis ? -1 : 1,
		);
		const u = head(sortedUtxos);
		if (!u) {
			console.log("no utxo");
			return;
		}

		// metadata
		const m =
			metadata && Object.keys(metadata).length > 0 ? mapData : undefined;
		let file: File | undefined;
		if (selectedFile.type === "") {
			const newType = mime.getType(selectedFile.name);
			console.log("new type", newType);
			if (newType !== null) {
				file = new File([selectedFile], selectedFile.name, { type: newType });
			}
		}
		if (!file) {
			file = selectedFile;
		}
		const pendingTx = await inscribeFile(u, file, m);
		if (pendingTx) {
			pendingTxs.value = [pendingTx];
			inscribedCallback();
		}
	}, [mapData, metadata, inscribedCallback, selectedFile]);

	const Input = styled.input`
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin: 0.5rem 0 0.5rem 0;
  `;

	const Label = styled.label`
    display: flex;
    flex-direction: column;
  `;

	const submitDisabled = useMemo(() => {
		return !selectedFile || inscribeStatus === FetchStatus.Loading;
	}, [selectedFile, inscribeStatus]);

	const artifact = useMemo(async () => {
		return (
			selectedFile?.type &&
			preview && (
				<Artifact
					classNames={{ media: "w-full h-full" }}
					artifact={{
						data: {
							insc: {
								file: {
									type: selectedFile.type,
									size: selectedFile.size,
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
	}, [preview, selectedFile]);

	const metaRow = useCallback(
		(meta: MetaMap) => {
			return (
				<div className="flex flex-row w-full" key={`metarow-${meta.idx}`}>
					<input
						type="text"
						disabled={meta.idx === 0}
						placeholder={
							[
								"ex. name",
								"ex. geohash",
								"ex. context",
								"ex. subcontext",
								"ex. url",
								"ex. tx",
								"ex. platform",
							][meta.idx] || "Key"
						}
						className="w-1/2 p-2 mr-1 my-1 rounded"
						value={meta.key}
						onChange={(e) => {
							// update metadata MetaMap
							// where meta.idx === idx
							e.preventDefault();
							setMetadata(
								(metadata || []).map((m) => {
									if (m.idx === meta.idx) {
										return {
											...m,
											// exclude whitespace, special characters, or any invalid key characters
											key: e.target.value.replaceAll(/[^a-zA-Z0-9]/g, ""),
										};
									}
									return m;
								}),
							);
						}}
					/>
					<input
						type="text"
						placeholder="Value"
						className="w-1/2 p-2 ml-1 my-1 rounded"
						value={meta.value}
						onChange={(e) => {
							// update metadata MetaMap
							// where meta.idx === idx
							e.preventDefault();
							setMetadata(
								(metadata || []).map((m) => {
									if (m.idx === meta.idx) {
										return {
											...m,
											value: e.target.value,
										};
									}
									return m;
								}),
							);
						}}
					/>
				</div>
			);
		},
		[metadata],
	);

	const metaHead = useMemo(
		() => (
			<div className="flex items-center justify-between">
				<div>Add Metadata (optional)</div>
				<div>
					<button
						type="button"
						className="bg-yellow-600 hover:bg-yellow-700 transition text-white p-1 rounded ml-2"
						onClick={() => {
							let key = "";
							let value = "";

							const initialKeys = [];
							if (!metadata?.some((m) => m.key === "name")) {
								key = "name";
								value = selectedFile?.name || "";
								initialKeys.push({ key, value, idx: metadata?.length || 0 });
							}

							const data = (metadata || []).concat(initialKeys || []);
							setMetadata(
								data.concat([
									{
										key: "",
										value: "",
										idx: data.length,
									},
								]),
							);
						}}
					>
						<FaPlus />
					</button>
				</div>
			</div>
		),
		[selectedFile, metadata],
	);

	const metaForm = useMemo(() => {
		// Form to add metadata to the image
		// each metadata is a key value pair of strings
		// and we need an add button to add more metadata

		return (
			<div className="my-4">
				{metaHead}
				{metadata?.map((m) => metaRow(m))}
			</div>
		);
	}, [metaHead, metaRow, metadata]);

	return (
		<div className="max-w-lg mx-auto">
			<Label
				className={`${
					selectedFile ? "" : "min-h-[300px] min-w-[360px] md:min-w-[420px]"
				} rounded border border-dashed border-[#222] flex items-center justify-center`}
			>
				{!selectedFile && <TbClick className="text-6xl my-4 text-[#555]" />}
				{selectedFile ? selectedFile.name : "Choose a file to inscribe"}
				<Input type="file" className="hidden" onChange={handleFileChange} />
				{selectedFile && (
					<div className="text-sm text-center w-full">
						{formatBytes(selectedFile.size)} Bytes
					</div>
				)}
			</Label>
			{preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}

			{selectedFile && preview && (
				<div>
					{metaForm}
					{isImage ? (
						artifact
					) : (
						<div className="w-full h-full bg-[#111] rounded flex items-center justify-center">
							FILE
						</div>
					)}
				</div>
			)}

			<button
				disabled={submitDisabled}
				type="submit"
				onClick={clickInscribe}
				className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
			>
				Inscribe {isImage ? "Image" : "File"}
			</button>
		</div>
	);
};

export default InscribeImage;

export const knownImageTypes = [
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/svg+xml",
	"image/bmp",
	"image/tiff",
	"image/x-icon",
	"image/vnd.microsoft.icon",
	"image/vnd.wap.wbmp",
	"image/heic",
	"image/heif",
	"image/avif",
	"image/apng",
	"image/jxl",
	"image/jpg",
	"image/jfif",
	"image/pjpeg",
	"image/pjp",
];
export const knownVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

// TODO: Add more direct support for audio and video
export const knownAudioTypes = ["audio/mpeg", "audio/ogg", "audio/wav"];
