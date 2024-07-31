type Props = { handleCancel: Function };

const CancelButton = ({ handleCancel }: Props) => {
	return (
		<button
			className="btn"
			type="button"
			onClick={() => {
				handleCancel();
			}}
		>
			Cancel
		</button>
	);
};

export default CancelButton;
