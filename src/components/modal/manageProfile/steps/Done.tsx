import {
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,

} from "@/signals/bapIdentity";

interface Props {
	onClose: () => void;
}

export default function Done({ onClose }: Props) {
	const onDone = () => {
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.SelectFile;
		onClose();
	};
	return (
		<>
			<p className="my-5 ">
				Your Identity has been successfully imported.
			</p>

			<div className="flex justify-end mt-4">
				<button
					type="button"
					className="btn btn-primary"
					onClick={onDone}
				>
					Done
				</button>
			</div>
		</>
	);
}
