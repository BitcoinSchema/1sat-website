export function Logo() {
	return (
		<div
			style={{
				display: "flex",
				position: "absolute",
				bottom: "20px",
				right: "20px",
				width: "75px",
				height: "75px",
				zIndex: 1000,
			}}
		>
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 402 402"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g>
					<title>&nbsp;</title>
					<circle cx="201" cy="201" r="201" fill="white" />
					<circle cx="201" cy="201" r="151" fill="black" />
					<circle cx="201" cy="201" r="121" fill="#F0BB00" />
				</g>
			</svg>
		</div>
	);
}
