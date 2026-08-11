import { ImageResponse } from "next/og";
import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { API_HOST } from "@/constants";
import { ordfsImageUrl } from "@/utils/ordfsImage";
import type { OrdUtxo } from "@/types/ordinals";
import { getNotoSerifItalicFont } from "@/utils/font";
import { isValidOutpoint } from "@/utils/validation";

export const runtime = "edge";

export const alt = "1Sat Ordinals Collection";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

// Cache generated images at the CDN — inscription content is immutable
const cacheHeaders = {
	"Cache-Control":
		"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export default async function Image({
	params,
}: {
	params: { outpoint: string };
}) {
	const notoSerif = await getNotoSerifItalicFont();

	const imageOptions = {
		...size,
		headers: cacheHeaders,
		fonts: [
			{
				name: "Noto Serif",
				data: notoSerif,
				style: "italic" as const,
				weight: 400 as const,
			},
		],
	};

	const fallback = (label: string) =>
		new ImageResponse(
			<Container>
				{label}
				<Logo />
			</Container>,
			imageOptions,
		);

	if (!isValidOutpoint(params.outpoint)) {
		return fallback("1Sat Ordinals");
	}

	let details: OrdUtxo;
	try {
		const res = await fetch(`${API_HOST}/api/inscriptions/${params.outpoint}`, {
			next: { revalidate: 86400 },
		});
		if (!res.ok) {
			return fallback("Mystery Outpoint");
		}
		details = (await res.json()) as OrdUtxo;
	} catch (_e) {
		return fallback("Mystery Outpoint");
	}

	const isImageInscription =
		details.origin?.data?.insc?.file?.type?.startsWith("image");
	// f=png forces a format satori can always render; the endpoint
	// rasterizes even SVG sources when a raster format is requested
	const url = ordfsImageUrl(params.outpoint, {
		w: size.width,
		h: size.height,
		fit: "fill",
		f: "png",
	});
	return new ImageResponse(
		<Container>
			{isImageInscription ? (
				<img src={url} alt={alt} />
			) : (
				details.origin?.data?.map?.name ||
				details.origin?.data?.bsv20?.tick ||
				details.origin?.data?.bsv20?.sym ||
				details.origin?.data?.insc?.json?.tick ||
				details.origin?.data?.insc?.json?.p ||
				details.origin?.data?.insc?.file?.type ||
				"Mystery Outpoint"
			)}

			<Logo />
		</Container>,
		imageOptions,
	);
}
