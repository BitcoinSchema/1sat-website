import type { PropsWithChildren } from "react";

export function Gradient({ children }: PropsWithChildren) {
	return (
		<div
			style={{
				fontSize: 48,
				background: "linear-gradient(to bottom, transparent, black)",
				color: "white",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "Noto Serif",
				position: "absolute",
				top: 0,
				left: 0,
				zIndex: 10,
			}}
		>
			{children}
		</div>
	);
}
