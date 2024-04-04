import { ProtectKeysStep, protectKeysStep } from "@/signals/wallet";

interface Props {}

export function InfoStep({}: Props) {
	const onNext = () => {
		protectKeysStep.value = ProtectKeysStep.EnterPassphrase;
	};

	return (
		<>
			<div className="mb-2">
				<div className="text-sm text-gray-500">
					We detected that you have unprotected keys. Protecting your
					keys ensures that your funds are safe. You can protect your
					keys by encrypting them with a passphrase.
				</div>
			</div>

			<div className="flex justify-end mt-4">
				<button className="btn btn-outline btn-sm" onClick={onNext}>
					Next
				</button>
			</div>
		</>
	);
}
