import DOMPurify from "isomorphic-dompurify";
import { NextResponse } from "next/server";

export async function GET(
	req: Request
) {
	const url = new URL(req.url).searchParams.get("url");
	if (!url || typeof url !== "string") {
    return new NextResponse(null, {
      status: 400,
      statusText: "Bad Request",
    });
  }

	try {
		const response = await fetch(url);
		const contentType = response.headers.get("content-type");
		if (!contentType || !response.ok) {
			throw new Error("Invalid response from the image source");
		}

		// SVG sanitization
		if (contentType.startsWith("image/svg+xml")) {
			const svgContent = await response.text();
			const sanitizedSVG = DOMPurify.sanitize(svgContent, {
				USE_PROFILES: { svg: true },
			});
			return new NextResponse(sanitizedSVG, {
				headers: {
					"Content-Type": contentType,
				},
			});
		}

		// HTML sanitization
		if (contentType.startsWith("html")) {
			const htmlContent = await response.text();
			const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
				USE_PROFILES: { html: true },
			});
			return new NextResponse(sanitizedHTML, {
				headers: {
					"Content-Type": contentType,
				},
			});
		}

		// passthrough unknown types
		return new NextResponse(response.body, {
			headers: {
				"Content-Type": contentType,
			},
		});
	} catch (error) {
		console.error(error);
		return new NextResponse(null, {
      status: 500,
      statusText: "Internal Server Error",
    });
	}
}
