import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const response = NextResponse.next();

	response.headers.set(
		"Content-Security-Policy",
		"frame-src 'self' https://ordfs.network; frame-ancestors 'self';",
	);

	return response;
}

export const config = {
	matcher: "/:path*",
};
