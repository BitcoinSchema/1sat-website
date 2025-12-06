"use client";

import { useSignals } from "@preact/signals-react/runtime";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { TbClick } from "react-icons/tb";
import styled from "styled-components";
import Artifact from "@/components/artifact";
import { FetchStatus } from "@/constants";
import { payPk } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { FileEvent } from "@/types/file";
import type { OrdUtxo, TxoData } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { inscribeFile } from "@/utils/inscribe";
import { useIDBStorage } from "@/utils/storage";

interface InscribeImageProps {
	inscribedCallback: () => void;
}

const InscribeModel: React.FC<InscribeImageProps> = ({ inscribedCallback }) => {
	useSignals();

	const [_pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
		"1sat-pts",
		[],
	);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

	const [inscribeStatus, _setInscribeStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);

	const handleFileChange = useCallback(
		(event: FileEvent) => {
			const file = event.target.files[0] as File;
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
		[setPreview, setSelectedFile],
	);

	const clickInscribe = useCallback(async () => {
		if (!selectedFile || !payPk.value || !ordAddress || !fundingAddress.value) {
			return;
		}

		const utxos = await getUtxos(fundingAddress.value);

		const pendingTx = await inscribeFile(utxos, selectedFile);
		if (pendingTx) {
			setPendingTxs([pendingTx]);
			inscribedCallback();
		}
	}, [
		fundingAddress.value,
		inscribedCallback,
		payPk.value,
		selectedFile,
		setPendingTxs,
	]);

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

	const artifact = useMemo(() => {
		return (
			selectedFile?.type &&
			preview && (
				<Artifact
					classNames={{ media: "w-full h-full" }}
					src={preview as string}
					artifact={
						{
							data: {
								insc: {
									file: {
										type: selectedFile.type,
										size: selectedFile.size,
									},
								},
							} as TxoData,
						} as Partial<OrdUtxo>
					}
					sizes={""}
				/>
			)
		);
	}, [preview, selectedFile]);

	return (
		<div className="max-w-lg mx-auto">
			<form>
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

				{selectedFile && !!preview && artifact}

				<button
					disabled={submitDisabled}
					type="submit"
					onClick={clickInscribe}
					className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
				>
					Inscribe 3D Model
				</button>
			</form>
		</div>
	);
};

export default InscribeModel;
