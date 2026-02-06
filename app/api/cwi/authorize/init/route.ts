import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/cwi/rate-limit";
import {
	CWI_REDIRECT_METHODS,
	generateOpaqueToken,
	hasMatchingOrigin,
	isAllowedOriginScheme,
	isValidBase64UrlValue,
	isValidRedirectMethod,
	MAX_CWI_ARGS_BYTES,
	normalizeArgsAndHash,
	parseAbsoluteUrl,
	parseOriginHeader,
	REDIRECT_AUTH_REQUEST_TTL_MS,
} from "@/lib/cwi/redirect-utils";

export const runtime = "nodejs";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface AuthorizeInitBody {
	call?: unknown;
	args?: unknown;
	redirect_uri?: unknown;
	state?: unknown;
	nonce?: unknown;
	code_challenge?: unknown;
	code_challenge_method?: unknown;
}

interface ConvexMutationRunner {
	mutation: (name: string, args: unknown) => Promise<unknown>;
}

interface CreateAuthRequestResponse {
	ok: boolean;
	errorDescription?: string;
}

const getConvexClient = (): ConvexHttpClient => {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
	}
	return new ConvexHttpClient(convexUrl);
};

const badRequest = (error: string, status = 400) =>
	NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
	const clientIp =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (
		!checkRateLimit(
			`cwi-init:${clientIp}`,
			RATE_LIMIT_MAX,
			RATE_LIMIT_WINDOW_MS,
		)
	) {
		return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
	}

	let body: AuthorizeInitBody;
	try {
		body = (await request.json()) as AuthorizeInitBody;
	} catch {
		return badRequest("invalid_json_body");
	}

	const origin = parseOriginHeader(request.headers);
	if (!origin) {
		return badRequest("missing_origin_header");
	}
	if (!isAllowedOriginScheme(origin)) {
		return badRequest("origin_must_be_https_or_loopback_http");
	}

	if (
		typeof body.redirect_uri !== "string" ||
		body.redirect_uri.length > 2048
	) {
		return badRequest("invalid_redirect_uri");
	}
	const redirectUri = parseAbsoluteUrl(body.redirect_uri);
	if (!redirectUri) {
		return badRequest("invalid_redirect_uri");
	}
	if (!isAllowedOriginScheme(redirectUri)) {
		return badRequest("redirect_uri_must_be_https_or_loopback_http");
	}
	if (!hasMatchingOrigin(origin, redirectUri)) {
		return badRequest("redirect_uri_origin_mismatch");
	}

	if (typeof body.call !== "string" || !isValidRedirectMethod(body.call)) {
		return badRequest("unknown_method");
	}

	if (
		typeof body.state !== "string" ||
		body.state.length < 8 ||
		body.state.length > 512
	) {
		return badRequest("invalid_state");
	}
	if (
		typeof body.nonce !== "string" ||
		body.nonce.length < 8 ||
		body.nonce.length > 512
	) {
		return badRequest("invalid_nonce");
	}

	if (
		body.code_challenge_method !== undefined &&
		body.code_challenge_method !== "S256"
	) {
		return badRequest("only_s256_code_challenge_method_allowed");
	}
	const codeChallengeMethod = "S256" as const;
	if (
		typeof body.code_challenge !== "string" ||
		!isValidBase64UrlValue(body.code_challenge, 43, 128)
	) {
		return badRequest("invalid_code_challenge");
	}

	const { stableArgs, argsHash, argsSize } = normalizeArgsAndHash(
		body.args ?? {},
	);
	if (argsSize > MAX_CWI_ARGS_BYTES) {
		return badRequest("args_too_large", 413);
	}

	const client = getConvexClient();

	const requestId = generateOpaqueToken(18);
	const now = Date.now();
	const expiresAt = now + REDIRECT_AUTH_REQUEST_TTL_MS;
	const convex = client as unknown as ConvexMutationRunner;
	const createResult = (await convex.mutation("cwiAuth:createAuthRequest", {
		requestId,
		origin: origin.origin,
		redirectUri: redirectUri.toString(),
		call: body.call,
		args: stableArgs,
		argsHash,
		state: body.state,
		nonce: body.nonce,
		codeChallenge: body.code_challenge,
		codeChallengeMethod,
		expiresAt,
		createdAt: now,
	})) as CreateAuthRequestResponse;

	if (!createResult?.ok) {
		return badRequest(
			createResult?.errorDescription ?? "request_creation_failed",
		);
	}

	const authorizeUrl = new URL("/wallet/cwi/authorize", request.nextUrl.origin);
	authorizeUrl.searchParams.set("requestId", requestId);

	return NextResponse.json({
		requestId,
		authorizeUrl: authorizeUrl.toString(),
		expiresAt,
		supportedMethods: CWI_REDIRECT_METHODS,
	});
}
