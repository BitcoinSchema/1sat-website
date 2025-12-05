import { Button } from "@/components/ui/button";

interface Props {
	onDone: () => void;
}

export function DoneStep({ onDone }: Props) {
	return (
		<>
			<div className="mb-2">
				<div className="text-sm text-gray-500">
					Your wallet has been successfully protected.
				</div>
			</div>

			<div className="flex justify-end mt-4">
				<Button variant="outline" size="sm" onClick={onDone}>
					Done
				</Button>
			</div>
		</>
	);
}
