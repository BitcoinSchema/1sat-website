import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { API_HOST, ORDFS } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import { getNotoSerifItalicFont } from "@/utils/font";
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
}: {
	params: { outpoint: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	const details = await fetch(
		`${API_HOST}/api/inscriptions/${params.outpoint}`
	).then((res) => res.json() as Promise<OrdUtxo>);

	const isImageInscription =
		details.origin?.data?.insc?.file.type?.startsWith("image");
	const url = `${ORDFS}/${params.outpoint}`;

	return new ImageResponse(
		(
			<Container>
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
