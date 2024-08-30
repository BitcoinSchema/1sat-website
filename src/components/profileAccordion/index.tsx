"use client";

import { useSignals } from "@preact/signals-react/runtime";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";
import type { IdentityResult, Identity } from "@/types/identity";
import { bapIdentities, bapIdentityRaw, selectedBapIdentity } from "@/signals/bapIdentity";
import { getImageFromGP } from "@/utils/getImageFromGP";
import { hashColor } from "@/utils/hashColor";
import type { ReactNode } from "react";
import { BAP } from "bitcoin-bap";
import { HD } from "@bsv/sdk";
import { identityPk } from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";

type Props = {
	canSetActiveBapIdentity: boolean;
	identities: IdentityResult[] | null;
};

const ProfileAccordion = ({ canSetActiveBapIdentity, identities }: Props) => {
	useSignals();
	const hiddenFields = ["@context", "@type", "image", "logo"]; // not shown to user

	const handleClick = (idKey: string) => {
		if (canSetActiveBapIdentity) {
			setActiveBapIdentity(idKey);
		}
		return false;
	};

	const setActiveBapIdentity = (id: string) => {
		const selectedIdentity = bapIdentities?.value?.find(
			(identity: IdentityResult) => identity.idKey === id,
		);
		selectedBapIdentity.value = selectedIdentity || null;

    const bapIdRaw = bapIdentityRaw.value;
    if (!bapIdRaw) return;
    const bapId = new BAP(bapIdRaw.xprv);
    bapId.importIds(bapIdRaw.ids);
    const theBapId = bapId.getId(selectedBapIdentity.value?.idKey);
    const hdKey = HD.fromString(bapIdRaw.xprv).derive(theBapId?.currentPath);
    const identityWif = hdKey.privKey?.toWif();
    console.log({theBapId, path: theBapId?.currentPath, identityWif});
    setKeys({identityPk: identityWif});
	};

	const makeIdentityAvatar = (imageUrl: string | undefined, idKey: string) => {
		const url = imageUrl && getImageFromGP(imageUrl);

		return (
			<div
				className={`rounded-full border-2 w-10 h-10 ${
					url ? "relative overflow-hidden" : "flex align-middle justify-center"
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

	const processValue = (value: string | Record<string, string>) => {
		let processedValue: string | ReactNode = "";

		if (typeof value === "object") {
			const values = [];
			for (const k in value) {
				values.push(`${k}: ${value[k]}`);
			}
			processedValue = values.join(", ");
		} else if (
			typeof value === "string" &&
			(value.startsWith("https://") || value.startsWith("http://"))
		) {
			processedValue = (
				<a
					href={value}
					rel="noopener noreferrer"
					target="_blank"
					className="hover:underline cursor-pointer text-blue-400 hover:text-blue-500"
				>
					{value}
				</a>
			);
		} else if (
			typeof value === "string" &&
			(value.startsWith("b://") || value.startsWith("bitfs://"))
		) {
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
		console.log({ identity });
		return (
			<table className="table table-zebra mb-4">
				<tbody>
					{Object.entries(identity)
						.filter(
							([key, value]) => !hiddenFields.includes(key) && value !== "",
						)
						.map(([key, value], index) => {
							return (
								<tr
									className={`text-xs ${index % 2 > 0 ? "" : "bg-[#121212]"}`}
									key={key}
								>
									<td className="text-zinc-400 py-0 px-2">{key}</td>
									{processValue(value)}
								</tr>
							);
						})}
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
							? "border border-[#555]"
							: ""
					} collapse  bg-base-200 rounded-lg mt-5 ${
						canSetActiveBapIdentity ? "collapse-plus" : "collapse-open"
					}`}
					onClick={() => handleClick(identity.idKey)}
				>
					{canSetActiveBapIdentity && <input type="radio" name="selectedId" />}
					<div className={`${canSetActiveBapIdentity ? 'collapse-title' : 'col-start-1 row-start-1 p-4'} text-md font-medium flex items-center`}>
						{makeIdentityAvatar(
							identity?.identity?.image || identity?.identity?.logo,
							identity?.idKey,
						)}
						<div className="flex flex-col ml-4">
							<div>{identity?.identity?.alternateName}</div>
              {canSetActiveBapIdentity && <div className="text-xs text-[#555]">
                {selectedBapIdentity.value?.idKey}</div>}
							{!canSetActiveBapIdentity && <div className="text-xs">
								<a
									href="https://sigmaidentity.com"
									className="text-blue-400 hover:text-blue-500 hover:text-underline hover:cursor-pointer"
									target="_blank"
									rel="noreferrer"
								>
									Edit Profile
								</a>
							</div>}
						</div>
					</div>
					<div
						className={`collapse-content  ${
							canSetActiveBapIdentity ? "max-h-40 overflow-scroll" : ""
						}  pb-0`}
					>
						{buildTable(identity?.identity)}
					</div>
				</div>
			))
		: null;
};

export default ProfileAccordion;
