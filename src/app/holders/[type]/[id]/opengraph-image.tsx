import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { Holder } from "@/components/pages/TokenMarket/list";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import { getCapitalizedAssetType } from "@/utils/assetType";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const alt = "1Sat Ordinals Token Holders";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: { type: AssetType; id: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	const { type, id } = params;
	const assetType = getCapitalizedAssetType(type);

	const url =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}`
			: `${API_HOST}/api/bsv20/id/${id}`;

	const details = await getDetails(new NextRequest(url), type, id);

	const tokenName = type === AssetType.BSV20 ? id : details.sym;

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
					<div>{assetType}</div>
					<div>{tokenName}</div>
					<div>holders</div>
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

const getDetails = async (req: NextRequest, type: AssetType, id: string) => {
	const res = await import("./details/route");
	const resp = await res.GET(req, {
		params: {
			type,
			id,
		},
	});
	const details = (await resp.json()) as BSV20;
	return details;
};
