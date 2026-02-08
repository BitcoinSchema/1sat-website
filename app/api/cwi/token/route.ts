import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/cwi/rate-limit";
import {
	computePKCEChallenge,
	decryptResultPayload,
	handleCorsPreflightRequest,
	hasMatchingOrigin,
	isAllowedOriginScheme,
	isValidBase64UrlValue,
	parseAbsoluteUrl,
	parseOriginHeader,
	withCorsHeaders,
} from "@/lib/cwi/redirect-utils";

export const runtime = "nodejs";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface TokenBody {
	code?: unknown;
	code_verifier?: unknown;
	redirect_uri?: unknown;
}

interface ConvexMutationRunner {
	mutation: (name: string, args: unknown) => Promise<unknown>;
}

interface ExchangeAuthCodeResponse {
	ok: boolean;
	error?: string;
	errorDescription?: string;
	resultCiphertext?: string | null;
}

const getConvexClient = (): ConvexHttpClient => {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
	}
	return new ConvexHttpClient(convexUrl);
};

export function OPTIONS(request: NextRequest) {
	return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
	// Scoped helpers that auto-attach CORS headers for this request
	const cors = <T extends NextResponse>(r: T) =>
		withCorsHeaders(r, request.headers);
	const fail = (error: string, status = 400) =>
		cors(NextResponse.json({ error }, { status }));

	const clientIp =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (
		!checkRateLimit(
			`cwi-token:${clientIp}`,
			RATE_LIMIT_MAX,
			RATE_LIMIT_WINDOW_MS,
		)
	) {
		return fail("rate_limit_exceeded", 429);
	}

	let body: TokenBody;
	try {
		body = (await request.json()) as TokenBody;
	} catch {
		return fail("invalid_json_body");
	}

	// Origin validation — errors before origin is confirmed don't need CORS
	const origin = parseOriginHeader(request.headers);
	if (!origin) {
		return NextResponse.json(
			{ error: "missing_origin_header" },
			{ status: 400 },
		);
	}
	if (!isAllowedOriginScheme(origin)) {
		return NextResponse.json(
			{ error: "origin_must_be_https_or_loopback_http" },
			{ status: 400 },
		);
	}

	// redirect_uri validation
	if (
		typeof body.redirect_uri !== "string" ||
		body.redirect_uri.length > 2048
	) {
		return fail("invalid_redirect_uri");
	}
	const redirectUri = parseAbsoluteUrl(body.redirect_uri);
	if (!(redirectUri && isAllowedOriginScheme(redirectUri))) {
		return fail("invalid_redirect_uri");
	}
	if (!hasMatchingOrigin(origin, redirectUri)) {
		return fail("redirect_uri_origin_mismatch");
	}

	// Code & verifier validation
	if (typeof body.code !== "string" || body.code.length < 16) {
		return fail("invalid_code");
	}
	if (
		typeof body.code_verifier !== "string" ||
		body.code_verifier.length < 43 ||
		body.code_verifier.length > 128 ||
		!isValidBase64UrlValue(body.code_verifier, 43, 128)
	) {
		return fail("invalid_code_verifier");
	}

	// Exchange authorization code
	const client = getConvexClient();
	const convex = client as unknown as ConvexMutationRunner;
	const exchangeResult = (await convex.mutation("cwiAuth:exchangeAuthCode", {
		codeId: body.code,
		now: Date.now(),
		origin: origin.origin,
		redirectUri: redirectUri.toString(),
		codeVerifier: body.code_verifier,
		codeVerifierS256: computePKCEChallenge(body.code_verifier),
	})) as ExchangeAuthCodeResponse;

	if (!exchangeResult?.ok) {
		return cors(
			NextResponse.json(
				{
					error: exchangeResult?.error ?? "invalid_grant",
					error_description:
						exchangeResult?.errorDescription ??
						"authorization_code_exchange_failed",
				},
				{ status: 400 },
			),
		);
	}

	if (exchangeResult.error) {
		return cors(
			NextResponse.json(
				{
					error: exchangeResult.error,
					error_description:
						exchangeResult.errorDescription ?? "authorization_request_failed",
				},
				{ status: 400 },
			),
		);
	}

	try {
		const result = decryptResultPayload(exchangeResult.resultCiphertext ?? "");
		return cors(NextResponse.json({ result }));
	} catch {
		return cors(
			NextResponse.json(
				{
					error: "invalid_grant",
					error_description: "invalid_result_payload",
				},
				{ status: 400 },
			),
		);
	}
}
