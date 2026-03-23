import { redirect } from "next/navigation";

const DOWNLOAD_JSON_URL =
	"https://dbopkrmhgavaffea.public.blob.vercel-storage.com/releases/download.json";

const GITHUB_RELEASES_URL =
	"https://github.com/b-open-io/1sat-sdk/releases/latest";

export async function GET() {
	try {
		const response = await fetch(DOWNLOAD_JSON_URL, {
			next: { revalidate: 60 },
		});

		if (response.ok) {
			const data = await response.json();
			const url = data?.macos?.url ?? data?.url;
			if (url) {
				redirect(url);
			}
		}
	} catch {
		// Fall through to GitHub
	}

	redirect(GITHUB_RELEASES_URL);
}
