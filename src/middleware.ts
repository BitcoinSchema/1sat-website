import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// txid (64 hex chars) optionally followed by _vout
const outpointSegment = /^\/outpoint\/([0-9a-fA-F]{64}(?:_\d{1,6})?)\/?$/;

const outpointFormat = /^[0-9a-fA-F]{64}(?:_\d{1,6})?$/;
const base58AddressFormat = /^[1-9A-HJ-NP-Za-km-z]{25,34}$/;

// Reject obviously-invalid dynamic params (e.g. /signer/null,
// /collection/[object Object], /outpoint/undefined) at the edge with a real
// 404 — they otherwise invoke a serverless render, and with streaming the
// response status is already committed as 200 before notFound() runs.
const isInvalidParamPath = (pathname: string): boolean => {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length < 2) {
		return false;
	}
	let param: string;
	try {
		param = decodeURIComponent(segments[1]);
	} catch (_e) {
		return true;
	}
	switch (segments[0]) {
		case "outpoint":
		case "collection":
			return !outpointFormat.test(param);
		case "signer":
			return !base58AddressFormat.test(param);
		case "market": {
			// /market/bsv21/<id> and /market/ordinals/<id> ids are outpoints
			if (segments.length < 3 || (segments[1] !== "bsv21" && segments[1] !== "ordinals")) {
				return false;
			}
			// static subroutes like /market/[tab]/new and /market/[tab]/list
			if (segments[2] === "new" || segments[2] === "list") {
				return false;
			}
			try {
				return !outpointFormat.test(decodeURIComponent(segments[2]));
			} catch (_e) {
				return true;
			}
		}
		default:
			return false;
	}
};

// Hosts search engines are allowed to crawl. Branch/preview deployments
// (alpha.*, *.vercel.app) serve the same content and burn serverless
// invocations on crawler traffic — Vercel only adds noindex to *.vercel.app
// URLs, not custom preview domains, so we handle it here.
const productionHosts = new Set(["1sat.market", "www.1sat.market"]);

export function middleware(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const isProduction = productionHosts.has(host);

	// Serve a disallow-all robots.txt on non-production hosts; production
	// falls through to the static robots.txt route
	if (!isProduction && request.nextUrl.pathname === "/robots.txt") {
		return new NextResponse("User-Agent: *\nDisallow: /\n", {
			headers: {
				"Content-Type": "text/plain",
				"Cache-Control": "public, max-age=3600",
			},
		});
	}

	if (isInvalidParamPath(request.nextUrl.pathname)) {
		return new NextResponse("Not Found", {
			status: 404,
			headers: { "Cache-Control": "public, max-age=3600" },
		});
	}

	// Redirect bare /outpoint/<outpoint> to its timeline tab at the edge so it
	// never invokes a serverless function
	const match = request.nextUrl.pathname.match(outpointSegment);
	if (match) {
		const url = request.nextUrl.clone();
		url.pathname = `/outpoint/${match[1]}/timeline`;
		return NextResponse.redirect(url, 308);
	}

	const response = NextResponse.next();

	response.headers.set(
		"Content-Security-Policy",
		"frame-src 'self' https://api.1sat.app; frame-ancestors 'self';",
	);

	if (!isProduction) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return response;
}

export const config = {
	matcher: "/:path*",
};
