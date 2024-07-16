import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals COOM Collections";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	const notoSerif = await getNotoSerifItalicFont();
	const imageData = await fetch(
		new URL("/src/assets/images/coom/coom_logo.png", import.meta.url)
	).then((res) => res.arrayBuffer());

	return new ImageResponse(
		(
			<Container>
				<img src={imageData as any} alt={alt} {...size} />

				<Logo />
			</Container>
		),
		{
			...size,
			fonts: [
				{
					name: "Noto Serif",
					data: notoSerif,
					style: "italic",
					weight: 400,
				},
			],
		}
	);
}
