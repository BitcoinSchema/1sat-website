import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// txid (64 hex) optionally followed by a vout, `_` (legacy) or `.` (stack)
const outpointFormat = /^[0-9a-fA-F]{64}(?:[_.]\d{1,6})?$/;
const base58AddressFormat = /^[1-9A-HJ-NP-Za-km-z]{25,34}$/;

// Reject obviously-invalid dynamic params (e.g. /signer/null,
// /outpoint/undefined) at the edge with a real 404 — with streaming, the
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
		default:
			return false;
	}
};

// Hosts search engines are allowed to crawl. Branch/preview deployments
// serve the same content and burn serverless invocations on crawler
// traffic — Vercel only adds noindex to *.vercel.app URLs, not custom
// preview domains.
const productionHosts = new Set(["1satwallet.com", "www.1satwallet.com"]);

export const cwiFrameAncestors = (nodeEnv = process.env.NODE_ENV) =>
	nodeEnv === "production"
		? "https:"
		: "https: http://localhost:* http://127.0.0.1:*";

const contentSecurityPolicy = (isCwiEmbed: boolean) =>
	[
		"base-uri 'self'",
		"object-src 'none'",
		"frame-src 'self' https://ordfs.network https://api.1sat.app",
		`frame-ancestors ${isCwiEmbed ? cwiFrameAncestors() : "'self'"}`,
	].join("; ");

export function proxy(request: NextRequest) {
	const host = request.headers.get("host") || "";
	const isProduction = productionHosts.has(host);

	// Serve a disallow-all robots.txt on non-production hosts; production
	// falls through to the app robots route
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

	const response = NextResponse.next();

	// /wallet/cwi is the CWI iframe bridge — external dApps must be able to
	// embed it (the bridge enforces its own origin checks), so it is exempt
	// from the frame-ancestors restriction
	const isCwiEmbed = request.nextUrl.pathname === "/wallet/cwi";
	response.headers.set(
		"Content-Security-Policy",
		contentSecurityPolicy(isCwiEmbed),
	);
	if (isCwiEmbed || request.nextUrl.pathname.startsWith("/wallet/cwi/")) {
		// Next's page renderer replaces Cache-Control values from next.config.
		// Setting it in Proxy makes the private wallet response win last.
		response.headers.set(
			"Cache-Control",
			"private, no-store, max-age=0, must-revalidate",
		);
		response.headers.set("Pragma", "no-cache");
	}

	if (!isProduction) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return response;
}

export const config = {
	matcher: "/:path*",
};
