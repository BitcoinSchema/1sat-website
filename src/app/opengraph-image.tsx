import { headers } from "next/headers";
import { ImageResponse } from "next/og";
import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { getNotoSerifItalicFont } from "@/utils/font";

export const runtime = "edge";

export const alt = "1Sat Ordinals Market";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	const notoSerif = await getNotoSerifItalicFont();
	const headersList = await headers();
	const forwardedHost = headersList.get("x-forwarded-host");
	const host = headersList.get("host");
	const hostname = forwardedHost || host || "";

	// Check for alpha domain or Vercel git-alpha deployment
	const isAlpha =
		hostname.includes("alpha.1satordinals.com") ||
		hostname.includes("alpha.1sat.market") ||
		hostname.includes("git-alpha");
	return new ImageResponse(
		<Container>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div>{`1Sat Market ${isAlpha ? "ALPHA" : "BETA"}`}</div>
			</div>
			<Logo />
		</Container>,
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
		},
	);
}
