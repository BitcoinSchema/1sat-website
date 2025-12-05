import { Button } from "@/components/ui/button";
import { ProtectKeysStep, protectKeysStep } from "@/signals/wallet";

type Props = {};

export function InfoStep({}: Props) {
	const onNext = () => {
		protectKeysStep.value = ProtectKeysStep.EnterPassphrase;
	};

	return (
		<>
			<div className="mb-2">
				<div className="text-sm text-gray-500">
					We detected that you have unprotected keys. Protecting your keys
					ensures that your funds are safe. You can protect your keys by
					encrypting them with a passphrase.
				</div>
			</div>

			<div className="flex justify-end mt-4">
				<Button variant="outline" size="sm" onClick={onNext}>
					Next
				</Button>
			</div>
		</>
	);
}
