"use client";

import {
	bapIdentities,
	identitiesLoading,
	selectedBapIdentity,
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,
} from "@/signals/bapIdentity/index";

import { useSignals } from "@preact/signals-react/runtime";
import CancelButton from "../common/CancelButton";

import ProfileAccordion from "@/components/profileAccordion";

interface Props {
	onClose: () => void;
}

export default function ChooseIdentity({ onClose }: Props) {
	useSignals();

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

	return (
		<>
			{identitiesLoading.value && (
				<div className="flex my-10 justify-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			)}
			<ProfileAccordion
				canSetActiveBapIdentity={true}
				identities={bapIdentities.value}
			/>

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
