import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";
import {
	COOM_BANNERS_BY_OUTPOINT,
	COOM_OUTPOINTS_BY_SLUGS,
	COOM_SLUGS_AND_OUTPOINTS,
} from "../constants";

export const runtime = "edge";

export const alt = "1Sat Ordinals COOM Collection";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: { outpoint: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	let outpoint = params.outpoint;
	const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
	const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint];

	if (isCoomSlug) {
		outpoint = COOM_OUTPOINTS_BY_SLUGS[outpoint];
	}

	const banner = COOM_BANNERS_BY_OUTPOINT[outpoint];

	let imageData = null;

	switch (banner) {
		case "generation_1_cards.png":
			imageData = await fetch(
				new URL(
					"../../../../assets/images/coom/generation_1_cards.png",
					import.meta.url
				)
			).then((res) => res.arrayBuffer());
			break;
		case "generation_2_cards.png":
			// TODO: Fixme: This edge function is too large to deploy on vercel
			// so I switched gen 2 to use the gen1 image for now
			imageData = await fetch(
				new URL(
					"../../../../assets/images/coom/generation_1_cards.png",
					import.meta.url
				)
			).then((res) => res.arrayBuffer());
			break;
		case "generation_3_cards.png":
			imageData = await fetch(
				new URL(
					"../../../../assets/images/coom/generation_3_cards.png",
					import.meta.url
				)
			).then((res) => res.arrayBuffer());
			break;
		case "generation_3_packs.jpeg":
			imageData = await fetch(
				new URL(
					"../../../../assets/images/coom/generation_3_packs.jpeg",
					import.meta.url
				)
			).then((res) => res.arrayBuffer());

			break;
	}

	return new ImageResponse(
		(
			<Container>
				{imageData && (
					<img
						src={imageData as any}
						alt={alt}
						{...size}
						style={{ objectFit: "contain" }}
					/>
				)}

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
