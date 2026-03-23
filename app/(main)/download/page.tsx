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
	return <DownloadPageClient macos={macos} windows={windows} />;
}
