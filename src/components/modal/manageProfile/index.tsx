import { useSignals } from "@preact/signals-react/runtime";
import SelectProfileJson from "./steps/SelectProfileJson";
import ChooseIdentity from "./steps/ChooseIdentity";
import EnterSelectedPassphrase from "./steps/EnterSelectedPassphrase";
import Done from "./steps/Done";

import {
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,
} from "@/signals/bapIdentity/index";


interface ManageProfileModalProps {
	open: boolean;
	onClose: () => void;
}

const ManageProfileModal = ({ open, onClose }: ManageProfileModalProps) => {
	useSignals();

	return (
		<dialog
			id="manage_profile_modal"
			className={`modal backdrop-blu	${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Manage Profile</h3>

				{importProfileFromBackupJsonStep.value ===
					ImportProfileFromBackupJsonStep.SelectFile && (
					<SelectProfileJson onClose={onClose} />
				)}
				{importProfileFromBackupJsonStep.value ===
					ImportProfileFromBackupJsonStep.ChooseIdentity && (
					<ChooseIdentity onClose={onClose} />
				)}
				{importProfileFromBackupJsonStep.value ===
					ImportProfileFromBackupJsonStep.EnterPassphrase && (
					<EnterSelectedPassphrase onClose={onClose} />
				)}
				{importProfileFromBackupJsonStep.value ===
					ImportProfileFromBackupJsonStep.Done && (
					<Done onClose={onClose} />
				)}
	
			</div>
		</dialog>
	);
};

export default ManageProfileModal;
