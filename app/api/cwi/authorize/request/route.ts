import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ConvexQueryRunner {
	query: (name: string, args: unknown) => Promise<unknown>;
}

interface AuthRequestResponse {
	requestId: string;
	origin: string;
	redirectUri: string;
	call: string;
	args: unknown;
	status: string;
	expiresAt: number;
	createdAt: number;
}

const getConvexClient = (): ConvexHttpClient => {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
	}
	return new ConvexHttpClient(convexUrl);
};

export async function GET(request: NextRequest) {
	const requestId = request.nextUrl.searchParams.get("requestId");
	if (!requestId) {
		return NextResponse.json({ error: "missing_request_id" }, { status: 400 });
	}

	const client = getConvexClient();

	const convex = client as unknown as ConvexQueryRunner;
	const authRequest = (await convex.query("cwiAuth:getAuthRequest", {
		requestId,
	})) as AuthRequestResponse | null;
	if (!authRequest) {
		return NextResponse.json(
			{ error: "authorization_request_not_found" },
			{ status: 404 },
		);
	}

	const now = Date.now();
	if (authRequest.expiresAt <= now) {
		return NextResponse.json(
			{ error: "authorization_request_expired" },
			{ status: 410 },
		);
	}

	return NextResponse.json({
		requestId: authRequest.requestId,
		origin: authRequest.origin,
		redirectUri: authRequest.redirectUri,
		call: authRequest.call,
		args: authRequest.args,
		status: authRequest.status,
		expiresAt: authRequest.expiresAt,
		createdAt: authRequest.createdAt,
	});
}
