"use client";

import { useSignals } from "@preact/signals-react/runtime";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";
import type { IdentityResult } from "@/types/identity";
import { bapIdentities, selectedBapIdentity } from "@/signals/bapIdentity";
import type { Identity } from "@/types/identity";
import { getImageFromGP } from "@/utils/getImageFromGP";
import { hashColor } from "@/utils/hashColor";

type Props = {
	canSetActiveBapIdentity: boolean;
	identities: IdentityResult[] | null;
};

const ProfileAccordion = ({ canSetActiveBapIdentity, identities }: Props) => {
	useSignals();
	const hiddenFields = ["@context", "@type"]; // not shown to user

	const handleClick = (idKey: string) => {
		if (canSetActiveBapIdentity) {
			setActiveBapIdentity(idKey);
		}
		return false;
	};

	const setActiveBapIdentity = (id: string) => {
		const selectedIdentity = bapIdentities?.value?.find(
			(identity: IdentityResult) => identity.idKey === id
		);
		selectedBapIdentity.value = selectedIdentity || null;
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
					<Image
						alt="Profile Image"
						src={url}
						fill={true}
						sizes="(max-width: 768px) 5vw, (max-width: 1200px) 2vw, 1vw"
					/>
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

	const processValue = (value: any) => {
		let processedValue: any = "";

		if (typeof value === "object") {
			for (const k in value) {
				processedValue += `${k}: ${value[k]}, `;
			}
		} else if (typeof value === "string" && (value.startsWith("b://") || value.startsWith("bitfs://"))) {
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

	const buildTable = (identity: Identity) => {
		return (
			<table className="table table-zebra">
				<tbody>
					{Object.entries(identity)
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

	return identities?.length
		? identities.map((identity: IdentityResult) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
					key={identity.idKey}
					className={`${
						canSetActiveBapIdentity &&
						selectedBapIdentity.value?.idKey === identity.idKey
							? "border border-amber-400"
							: ""
					} collapse  bg-base-200 rounded-none mt-5 ${
						canSetActiveBapIdentity
							? "collapse-plus"
							: "collapse-open"
					}`}
					onClick={() => handleClick(identity.idKey)}
				>
					<input type="radio" name="selectedId" />
					<div className="collapse-title text-md font-medium flex align-middle">
						{makeIdentityAvatar(
							identity?.identity?.image || identity?.identity?.logo,
							identity?.idKey
						)}
						<p className="flex align-middle mt-1 ml-5">
							{identity?.identity?.alternateName}
						</p>
					</div>
					<div
						className={`collapse-content  ${
							canSetActiveBapIdentity
								? "max-h-40 overflow-scroll"
								: ""
						}  pb-0`}
					>
						{buildTable(identity?.identity)}
					</div>
				</div>
		  ))
		: null;
};

export default ProfileAccordion;
