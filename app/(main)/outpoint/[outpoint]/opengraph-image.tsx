import { ImageResponse } from "next/og";
import { ordfsClient, stackContentUrl, toStackOutpoint } from "@/lib/stack";

export const alt = "1Sat Ordinals Inscription";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://1satwallet.com";

const outpointFormat = /^[0-9a-fA-F]{64}(?:[_.]\d{1,6})?$/;

// Cache generated images at the CDN — inscription content is immutable
const cacheHeaders = {
	"Cache-Control":
		"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export default async function Image({
	params,
}: {
	params: Promise<{ outpoint: string }>;
}) {
	const { outpoint: rawOutpoint } = await params;
	const imageOptions = { ...size, headers: cacheHeaders };

	const fallback = (label: string) =>
		new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#0a0a0a",
					color: "#fafafa",
					fontSize: 64,
					fontWeight: 700,
				}}
			>
				{label}
			</div>,
			imageOptions,
		);

	if (!outpointFormat.test(rawOutpoint)) {
		return fallback("1Sat");
	}
	const outpoint = toStackOutpoint(rawOutpoint);

	let metadata = null;
	try {
		metadata = await ordfsClient.getMetadata(outpoint);
	} catch (_e) {
		// fall through to text fallback
	}

	const name =
		(metadata?.map?.name as string | undefined) ||
		metadata?.contentType ||
		"Inscription";

	if (metadata?.contentType?.startsWith("image")) {
		// route through the sharp proxy so satori always gets a PNG
		const src = `${APP_URL}/api/image?url=${encodeURIComponent(
			stackContentUrl(metadata.origin || outpoint),
		)}&w=${size.width}&h=${size.height}&fit=contain&bg=%230a0a0a&f=png`;
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					background: "#0a0a0a",
					position: "relative",
				}}
			>
				<img src={src} alt={alt} width={size.width} height={size.height} />
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						padding: "16px 24px",
						background: "rgba(0,0,0,0.55)",
						color: "#fafafa",
						fontSize: 44,
						fontWeight: 700,
						overflow: "hidden",
						whiteSpace: "nowrap",
					}}
				>
					{name}
				</div>
			</div>,
			imageOptions,
		);
	}

	return fallback(name);
}
