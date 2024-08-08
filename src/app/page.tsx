import HomePage from "@/components/pages/home";
import { headers } from "next/headers";

export default async function Home() {
  try {
    return <HomePage />;
  } catch (e) {
    console.error("failed to get artifact", e);
    return null;
  }
}

export async function generateMetadata() {
	const headersList = headers();
	const hostname = headersList.get("host") || "";

	const isAlpha = hostname === "alpha.1satordinals.com" || hostname === "alpha.1sat.market";
	const isLocal = hostname === "localhost:3000";

	return {
		title: `1Sat Ordinals Market ${isAlpha || isLocal ? 'ALPHA' : 'BETA'}`,
		description: "Native Bitcoin SV decentralized marketplace directly on Layer 1. The best place to find 1Sat NFTs, and Fungible tokens with way more utility than your average blockchain! Mint your own tokens, or buy and sell on the marketplace.",
		openGraph: {
			title: `1Sat Ordinals marketplace ${isAlpha ? 'ALPHA' : 'BETA'}`,
			description: "Fully on-chain 1Sat Ordinals marketplace.",
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `1Sat Ordinals marketplace ${isAlpha ? 'ALPHA' : 'BETA'}`,
			description: "Fully on-chain 1Sat Ordinals marketplace.",
		},
	};
}
