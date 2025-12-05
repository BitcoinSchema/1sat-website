import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter, Ubuntu, Ubuntu_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer/footer";
import Header from "@/components/header";
import ScrollToTop from "@/components/ScrollToTop";
import { Spotlight } from "@/components/ui/spotlights";
import { toastProps } from "@/constants";
import TanstackProvider from "@/providers/TanstackProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import WalletBridgeProvider from "@/providers/WalletBridgeProvider";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

const ubuntu = Ubuntu({
	style: "normal",
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
});

const _ubuntuMono = Ubuntu_Mono({
	style: "normal",
	weight: ["400", "700"],
	subsets: ["latin"],
});

const description =
	"A open token protocol in the spirit of BTC Ordinals with the cost efficiency and performance of Bitcoin SV.";

export const metadata: Metadata = {
	metadataBase: new URL("https://1sat.market"),
	title: "1Sat Ordinals - Bitcoin SV",
	description,
	twitter: {
		card: "summary_large_image",
		title: "1Sat Ordinals",
		description,
	},
};

// get pathname

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
				<link rel="icon" href="/favicon.ico" />
			</head>

			<body
				className={`flex flex-col h-screen overflow-hidden ${inter.className}`}
			>
				<ThemeProvider>
					<Spotlight
						className="-top-40 left-0 md:left-60 md:-top-20"
						fill="white"
					/>
					<TanstackProvider>
						<WalletBridgeProvider>
							{/* Fixed Header */}
							<Header ubuntu={ubuntu} />

							{/* Main content area - grows to fill space between header and footer */}
							<main className="flex-1 w-full relative flex flex-col overflow-hidden">
								{children}
							</main>

							{/* Fixed Footer */}
							<Footer />

							<Analytics />
							<SpeedInsights />
							<Toaster
								position="bottom-left"
								reverseOrder={false}
								toastOptions={toastProps}
							/>
							<ScrollToTop />
						</WalletBridgeProvider>
					</TanstackProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
