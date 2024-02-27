import { API_HOST, ORDFS } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Inscription";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: { params: { outpoint: string } }) {
	const notoSerif = fetch(
		new URL("./NotoSerif-Italic.ttf", import.meta.url),
	).then((res) => res.arrayBuffer());

	const details = await fetch(
		`${API_HOST}/api/inscriptions/${params.outpoint}`,
	).then((res) => res.json() as Promise<OrdUtxo>);

	const isImageInscription =
		details.origin?.data?.insc?.file.type?.startsWith("image");
	const url = `${ORDFS}/${params.outpoint}`;
	return new ImageResponse(
		<div
			style={{
				fontSize: 48,
				background: "black",
				color: "white",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "Noto Serif",
				position: "relative",
			}}
		>
			{isImageInscription ? (
				<img src={url} alt={alt} />
			) : (
				details.origin?.data?.map?.name ||
				details.origin?.data?.bsv20?.tick ||
				details.origin?.data?.bsv20?.sym ||
				details.origin?.data?.insc?.json?.tick ||
				details.origin?.data?.insc?.json?.p ||
				details.origin?.data?.insc?.file.type ||
				"Mystery Outpoint"
			)}
			<div
				style={{
					display: "flex",
					position: "absolute",
					bottom: "10px",
					right: "10px",
					width: "50px",
					height: "50px",
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
		</div>,
		{
			...size,
			fonts: [
				{
					name: "Noto Serif",
					data: await notoSerif,
					style: "italic",
					weight: 400,
				},
			],
		},
	);
}
