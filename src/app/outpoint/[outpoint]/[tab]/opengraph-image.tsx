import { ImageResponse } from "next/og";
import { Container } from "@/components/og/Container";
import { Gradient } from "@/components/og/Gradient";
import { Logo } from "@/components/og/Logo";
import { API_HOST } from "@/constants";
import { ordfsImageUrl } from "@/utils/ordfsImage";
import type { OrdUtxo, SigilMeta } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import { getNotoSerifItalicFont } from "@/utils/font";
import { isValidOutpoint } from "@/utils/validation";

export const runtime = "edge";

export const alt = "1Sat Ordinals Outpoint";
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
				<Gradient />
				<Logo />
			</Container>,
			imageOptions,
		);

	if (!isValidOutpoint(params.outpoint)) {
		return fallback("1Sat Ordinals");
	}

	let details: OrdUtxo;
	try {
		const detailsUrl = `${API_HOST}/api/inscriptions/${params.outpoint}`;
		const res = await fetch(detailsUrl, {
			next: { revalidate: 86400 }, // opengraph source data rarely changes
		});
		if (!res.ok) {
			return fallback("Mystery Outpoint");
		}
		details = (await res.json()) as OrdUtxo;
	} catch (_e) {
		return fallback("Mystery Outpoint");
	}

	const sigilData = details.origin?.data?.map?.sigil;
	let sigilImageTxid: string | undefined;
	if (sigilData) {
		try {
			const sigil = JSON.parse(sigilData) as SigilMeta;
			sigilImageTxid = sigil.image?.split("b://")[1];
		} catch (_e) {
			// ignore malformed sigil metadata
		}
	}

	// f=png forces a format satori can always render (source inscriptions may
	// be webp/unknown); SVG sources pass through unconverted
	const url = ordfsImageUrl(sigilImageTxid || params.outpoint, {
		w: size.width,
		h: size.height,
		fit: "fill",
		f: "png",
	});

	const isImageInscription =
		details?.origin?.data?.insc?.file?.type?.startsWith("image");

	const name = displayName(details, false);
	return new ImageResponse(
		<Container>
			{isImageInscription || sigilImageTxid ? (
				<img src={url} alt={alt} {...size} />
			) : (
				name || "Mystery Outpoint"
			)}
			{name && (
				<div
					style={{
						fontFamily: "Noto Serif",
						fontStyle: "italic",
						fontWeight: 400,
						fontSize: "3rem",
						top: 0,
						left: 0,
						position: "absolute",
						background: "rgba(0, 0, 0, 0.5)",
						width: "100%",
						padding: ".5rem",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{name || ""}
				</div>
			)}
			<Gradient />
			<Logo />
		</Container>,
		imageOptions,
	);
}
