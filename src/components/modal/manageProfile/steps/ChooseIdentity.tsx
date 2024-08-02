"use client";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";

import {
	bapIdentities,
	identitiesLoading,
	selectedBapIdentity,
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,
} from "@/signals/bapIdentity/index";
import { Identity } from "@/types/identity";
import { useSignals } from "@preact/signals-react/runtime";
import CancelButton from "../common/CancelButton";
import { getImageFromGP } from "@/utils/getImageFromGP";
import { hashColor } from "@/utils/hashColor";

interface Props {
	onClose: () => void;
}

export default function ChooseIdentity({ onClose }: Props) {
	useSignals();
	const hiddenFields = ["@context", "@type"]; // not shown to user

	const handleNext = () => {
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.EnterPassphrase;
	};

	const handleCancel = () => {
		selectedBapIdentity.value = null;
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.SelectFile;
		bapIdentities.value = null;

		onClose();
	};

	const setActiveBapIdentity = (id: string) => {
		const selectedIdentity = bapIdentities?.value?.find(
			(identity) => identity.idKey === id
		);
		selectedBapIdentity.value = selectedIdentity || null;
	};

	const processValue = (value: any) => {
		let processedValue: any = "";

		if (typeof value === "object") {
			Object.keys(value).forEach((k) => {
				processedValue += `${k}: ${value[k]}, `;
			});
		} else if (typeof value === "string" && value.indexOf("b://") >= 0) {
			const imageUrl = getImageFromGP(value);

			processedValue = (
				<a
					href={imageUrl}
					rel="noopener noreferrer"
					target="_blank"
					className="hover:underline cursor-pointer"
				>
					Click to view image
				</a>
			);
		} else {
			processedValue = value;
		}
		return <td className="py-2 px-5">{processedValue}</td>;
	};

	const makeIdentityAvatar = (
		imageUrl: string | undefined,
		idKey: string
	) => {
		const url = imageUrl && getImageFromGP(imageUrl);

		return (
			<div
				className={`rounded-full border-2 w-9 h-9 ${
					url
						? "relative overflow-hidden"
						: "flex align-middle justify-center"
				}`}
				style={{
					borderColor: `rgb(${hashColor(idKey)})`,
				}}
			>
				{url ? (
					<Image alt="Profile Image" src={url} fill={true} sizes="(max-width: 768px) 5vw, (max-width: 1200px) 2vw, 1vw"/>
				) : (
					<MdAccountCircle
						size={24}
						color={`rgb(${hashColor(idKey)})`}
						className="mt-1"
					/>
				)}
			</div>
		);
	};

	const buildTable = (identity: Identity) => {
		return (
			<table className="table table-zebra">
				<tbody>
					{Object.entries(identity!)
						.filter(([key, value]) => !hiddenFields.includes(key))
						.map(([key, value], index) => (
							<tr
								className={`text-xs ${
									index % 2 > 0 ? "" : "bg-neutral-800"
								}`}
								key={index}
							>
								<td className="text-zinc-400 py-0 px-2">
									{key}
								</td>
								{processValue(value)}
							</tr>
						))}
				</tbody>
			</table>
		);
	};

	return (
		<>
			{identitiesLoading.value && (
				<div className="flex my-10 justify-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			)}
			{bapIdentities.value?.length && (
				<div>
					<div className="mt-2 mb-4">
						Select the identity you want to use:
					</div>

					{bapIdentities.value.map((identity) => (
						<div
							key={identity.idKey}
							className={`${
								selectedBapIdentity.value?.idKey ===
								identity.idKey
									? "border border-amber-400"
									: ""
							} collapse collapse-plus bg-base-200 rounded-none mt-5`}
							onClick={() => {
								setActiveBapIdentity(identity.idKey);
							}}
						>
							<input type="radio" name="selectedId" />
							<div className="collapse-title text-md font-medium flex align-middle">
								{makeIdentityAvatar(
									identity?.identity?.image,
									identity?.idKey
								)}
								<p className="flex align-middle mt-1 ml-5">
									{identity?.identity?.alternateName}
								</p>
							</div>
							<div className="collapse-content overflow-scroll max-h-40 pb-0">
								{buildTable(identity?.identity)}
							</div>
						</div>
					))}
				</div>
			)}
			<div className="flex w-full mt-5 justify-end">
				<CancelButton handleCancel={handleCancel} />
				<button
					className="btn btn-accent cursor-pointer ml-5"
					disabled={!selectedBapIdentity.value}
					onClick={() => handleNext()}
				>
					Next
				</button>
			</div>
		</>
	);
}
