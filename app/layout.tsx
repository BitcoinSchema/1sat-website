import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { WebApplication, WithContext } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletBridge } from "@/components/wallet-bridge";
import { QueryProvider } from "@/providers/query-provider";
import { WalletProvider } from "@/providers/wallet-provider";
import { WalletToolboxProvider } from "@/providers/wallet-toolbox-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";
import "./animations.css";

const spaceGrotesk = Space_Grotesk({
	variable: "--font-sans",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "1Sat Ordinals | BSV NFT Marketplace & Explorer",
	description:
		"Discover, create, and trade Bitcoin SV ordinals and NFTs. Explore inscriptions, list collectibles, and manage your digital assets on the 1Sat Ordinals marketplace. The premier BSV ordinals platform.",
	metadataBase: new URL("https://1satordinals.com"),
	keywords: [
		"1sat ordinals",
		"BSV NFT",
		"Bitcoin SV ordinals",
		"ordinals marketplace",
		"BSV inscriptions",
		"bitcoin NFT",
		"ordinals explorer",
		"BSV collectibles",
	],
	openGraph: {
		title: "1Sat Ordinals | BSV NFT Marketplace & Explorer",
		description:
			"Discover, create, and trade Bitcoin SV ordinals and NFTs on the premier BSV ordinals platform.",
		url: "https://1satordinals.com",
		siteName: "1Sat Ordinals",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "1Sat Ordinals | BSV NFT Marketplace",
		description: "Discover, create, and trade Bitcoin SV ordinals and NFTs.",
	},
};

const jsonLd: WithContext<WebApplication> = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "1Sat Ordinals",
	url: "https://1satordinals.com",
	description:
		"Discover, create, and trade Bitcoin SV ordinals and NFTs on the premier BSV ordinals marketplace.",
	applicationCategory: "Cryptocurrency",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	provider: {
		"@type": "Organization",
		name: "1Sat Ordinals",
		url: "https://1satordinals.com",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<JsonLd data={jsonLd} />
			</head>
			<body
				className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-sans`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					<ConvexClientProvider>
						<QueryProvider>
							<WalletProvider>
								<WalletToolboxProvider>
									<WalletBridge>{children}</WalletBridge>
								</WalletToolboxProvider>
							</WalletProvider>
						</QueryProvider>
					</ConvexClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
