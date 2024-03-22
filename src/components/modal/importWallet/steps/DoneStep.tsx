interface Props {
	onDone: () => void;
}

export function DoneStep({ onDone }: Props) {
	return (
		<>
			<div className="mb-2">
				<div className="text-sm text-gray-500">
					Your wallet has been successfully imported.
				</div>
			</div>

			<div className="flex justify-end mt-4">
				<button className="btn btn-outline btn-sm" onClick={onDone}>
					Done
				</button>
			</div>
		</>
	);
}
