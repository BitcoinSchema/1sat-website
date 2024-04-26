import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { API_HOST, AssetType } from "@/constants";
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
	params: { tab: AssetType; id: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	const detailsUrl = `${API_HOST}/api/bsv20/${
		params.tab === AssetType.BSV20 ? "tick" : "id"
	}/${params.id}`;
	const details = await fetch(detailsUrl).then(
		(res) => res.json() as Promise<OrdUtxo>
	);

	return new ImageResponse(
		(
			<Container>
				{details.origin?.data?.map?.name ||
					details.origin?.data?.bsv20?.tick ||
					details.origin?.data?.bsv20?.sym ||
					details.origin?.data?.insc?.json?.tick ||
					details.origin?.data?.insc?.json?.p ||
					details.origin?.data?.insc?.file.type ||
					"Mystery Outpoint"}

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
