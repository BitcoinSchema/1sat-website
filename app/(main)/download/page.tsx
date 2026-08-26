import type { Metadata } from "next";
import type { SoftwareApplication, WithContext } from "schema-dts";
import { JsonLd } from "@/components/json-ld";
import { AppleAppPage } from "./download-page-client";

export const metadata: Metadata = {
	title: "1Sat for Apple | TestFlight Beta",
	description:
		"Native 1Sat wallet for iPhone, iPad, and Mac. Open the TestFlight beta. Keys stay in iCloud Keychain.",
	keywords: [
		"1sat wallet",
		"1sat apple app",
		"BSV wallet",
		"Bitcoin SV wallet",
		"ordinals wallet",
		"TestFlight",
		"iPhone bitcoin wallet",
		"iPad bitcoin wallet",
		"macOS BSV wallet",
	],
	openGraph: {
		title: "1Sat for Apple | TestFlight Beta",
		description:
			"Native 1Sat wallet for iPhone, iPad, and Mac. Open the TestFlight beta. Keys stay in iCloud Keychain.",
		url: "https://1satwallet.com/download",
		siteName: "1Sat Wallet",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "1Sat for Apple | TestFlight Beta",
		description:
			"Native 1Sat wallet for iPhone, iPad, and Mac. Open the TestFlight beta.",
	},
};

const jsonLd: WithContext<SoftwareApplication> = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "1Sat Wallet",
	url: "https://1satwallet.com",
	downloadUrl: "https://1satwallet.com/download",
	description:
		"Native 1Sat wallet for iPhone, iPad, and Mac. TestFlight beta. Keys stay in iCloud Keychain.",
	applicationCategory: "FinanceApplication",
	operatingSystem: "iOS, iPadOS, macOS",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	provider: {
		"@type": "Organization",
		name: "1Sat",
		url: "https://1satwallet.com",
	},
};

export default function DownloadPage() {
	return (
		<>
			<JsonLd data={jsonLd} />
			<AppleAppPage />
		</>
	);
}
