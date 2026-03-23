import type { Metadata } from "next";
import type { SoftwareApplication, WithContext } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { DownloadPageClient } from "./download-page-client";

const DOWNLOAD_JSON_URL =
	"https://dbopkrmhgavaffea.public.blob.vercel-storage.com/releases/download.json";

export interface DownloadInfo {
	version: string;
	filename: string;
	url: string;
	size: number;
	updatedAt: string;
}

interface DownloadData {
	macos: DownloadInfo | null;
	windows: DownloadInfo | null;
}

export const metadata: Metadata = {
	title: "Download 1Sat Wallet | Native BSV Desktop Wallet",
	description:
		"Download 1Sat Wallet — a native BSV desktop wallet with Touch ID, Secure Enclave key protection, a built-in browser, and a local indexer. BRC-100 compatible. Available now for macOS Apple Silicon.",
	keywords: [
		"1sat wallet download",
		"BSV wallet",
		"BSV desktop wallet",
		"Bitcoin SV wallet",
		"ordinals wallet",
		"BRC-100 wallet",
		"native bitcoin wallet",
		"Touch ID wallet",
		"Secure Enclave wallet",
		"1sat ordinals wallet",
		"macOS BSV wallet",
	],
	openGraph: {
		title: "Download 1Sat Wallet | Native BSV Desktop Wallet",
		description:
			"Native BSV desktop wallet with Touch ID, Secure Enclave key protection, built-in browser, and local indexer. BRC-100 compatible. Download for macOS Apple Silicon.",
		url: "https://1satordinals.com/download",
		siteName: "1Sat Ordinals",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Download 1Sat Wallet | Native BSV Desktop Wallet",
		description:
			"Native BSV desktop wallet with Touch ID, Secure Enclave key protection, built-in browser, and local indexer. BRC-100 compatible.",
	},
};

const jsonLd: WithContext<SoftwareApplication> = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "1Sat Wallet",
	url: "https://1satwallet.com",
	downloadUrl: "https://1satordinals.com/download",
	description:
		"Native BSV desktop wallet with Touch ID, Secure Enclave key protection, a built-in browser, and a local indexer. BRC-100 compatible.",
	applicationCategory: "FinanceApplication",
	operatingSystem: "macOS 12+",
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

async function getDownloadData(): Promise<DownloadData> {
	try {
		const response = await fetch(DOWNLOAD_JSON_URL, {
			next: { revalidate: 60 },
		});

		if (!response.ok) return { macos: null, windows: null };

		const data = await response.json();

		if (data?.macos) {
			return {
				macos: data.macos,
				windows: data.windows ?? null,
			};
		}

		// Flat shape fallback — treat as macOS only
		if (data?.url) {
			return {
				macos: data as DownloadInfo,
				windows: null,
			};
		}

		return { macos: null, windows: null };
	} catch {
		return { macos: null, windows: null };
	}
}

export default async function DownloadPage() {
	const { macos, windows } = await getDownloadData();
	return (
		<>
			<JsonLd data={jsonLd} />
			<DownloadPageClient macos={macos} windows={windows} />
		</>
	);
}
