import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Address Activity";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: { address: string; type: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	return new ImageResponse(
		(
			<Container>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<div>{params.type}</div>
					<div>Activity for address</div>
					<div>{params.address}</div>
				</div>

				<Logo />
			</Container>
		),
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
		}
	);
}
