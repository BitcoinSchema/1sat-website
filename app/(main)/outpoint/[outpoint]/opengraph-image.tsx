import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Inscription";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

const STACK_URL =
	process.env.NEXT_PUBLIC_ONESAT_STACK_URL || "https://api.1sat.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://1satwallet.com";

const outpointFormat = /^[0-9a-fA-F]{64}(?:[_.]\d{1,6})?$/;

// Cache generated images at the CDN — inscription content is immutable
const cacheHeaders = {
	"Cache-Control":
		"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

interface OrdfsMetadata {
	origin?: string;
	contentType?: string;
	map?: Record<string, unknown>;
}

export default async function Image({
	params,
}: {
	params: { outpoint: string };
}) {
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

	if (!outpointFormat.test(params.outpoint)) {
		return fallback("1Sat");
	}
	const outpoint = params.outpoint.replace("_", ".");

	let metadata: OrdfsMetadata | null = null;
	try {
		const res = await fetch(`${STACK_URL}/1sat/ordfs/metadata/${outpoint}`);
		if (res.ok) {
			metadata = (await res.json()) as OrdfsMetadata;
		}
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
			`${STACK_URL}/content/${metadata.origin || outpoint}`,
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
				{/* biome-ignore lint/performance/noImgElement: satori element */}
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
