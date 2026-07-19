import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { API_HOST, AssetType } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
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

// Cache generated images at the CDN
const cacheHeaders = {
	"Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

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

	let details: BSV20 | undefined;
	try {
		details = await getDetails(new NextRequest(url), type, id);
	} catch (e) {
		// fall through to a generic image
	}

	const tokenName = (type === AssetType.BSV20 ? id : details?.sym) || id;

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
			headers: cacheHeaders,
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
