import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import {
	encryptResultPayload,
	generateOpaqueToken,
	MAX_CWI_RESULT_BYTES,
	parseOriginHeader,
	REDIRECT_AUTH_CODE_TTL_MS,
} from "@/lib/cwi/redirect-utils";

export const runtime = "nodejs";

interface AuthorizeCompleteBody {
	requestId?: unknown;
	decision?: unknown;
	result?: unknown;
	error?: unknown;
	error_description?: unknown;
}

interface ConvexMutationRunner {
	mutation: (name: string, args: unknown) => Promise<unknown>;
}

interface CompleteAuthRequestResponse {
	ok: boolean;
	redirectUri: string;
	state: string;
	codeId?: string;
	error?: string;
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

const buildRedirectUrl = (params: {
	redirectUri: string;
	state: string;
	codeId?: string;
	error?: string;
	errorDescription?: string;
}): string => {
	const callbackUrl = new URL(params.redirectUri);
	if (params.codeId) {
		callbackUrl.searchParams.set("code", params.codeId);
		callbackUrl.searchParams.set("state", params.state);
		return callbackUrl.toString();
	}
	callbackUrl.searchParams.set("error", params.error ?? "access_denied");
	callbackUrl.searchParams.set(
		"error_description",
		params.errorDescription ?? "Request denied.",
	);
	callbackUrl.searchParams.set("state", params.state);
	return callbackUrl.toString();
};

export async function POST(request: NextRequest) {
	const requestOrigin = parseOriginHeader(request.headers);
	if (!requestOrigin || requestOrigin.origin !== request.nextUrl.origin) {
		return badRequest("invalid_origin", 403);
	}

	let body: AuthorizeCompleteBody;
	try {
		body = (await request.json()) as AuthorizeCompleteBody;
	} catch {
		return badRequest("invalid_json_body");
	}

	if (typeof body.requestId !== "string" || body.requestId.length < 8) {
		return badRequest("invalid_request_id");
	}

	const decision = body.decision;
	if (
		decision !== "approved" &&
		decision !== "denied" &&
		decision !== "error"
	) {
		return badRequest("invalid_decision");
	}

	const client = getConvexClient();

	const now = Date.now();
	let codeId: string | undefined;
	let codeExpiresAt: number | undefined;
	let resultCiphertext: string | undefined;
	let normalizedError: string | undefined;
	let normalizedErrorDescription: string | undefined;

	if (decision === "approved") {
		resultCiphertext = encryptResultPayload(body.result ?? null);
		const resultSize = new TextEncoder().encode(resultCiphertext).byteLength;
		if (resultSize > MAX_CWI_RESULT_BYTES) {
			return badRequest("result_too_large", 413);
		}
		codeId = generateOpaqueToken(24);
		codeExpiresAt = now + REDIRECT_AUTH_CODE_TTL_MS;
	} else if (decision === "denied") {
		normalizedError =
			typeof body.error === "string" && body.error.length > 0
				? body.error
				: "access_denied";
		normalizedErrorDescription =
			typeof body.error_description === "string" &&
			body.error_description.length > 0
				? body.error_description
				: "The user denied the request.";
	} else {
		normalizedError =
			typeof body.error === "string" && body.error.length > 0
				? body.error
				: "server_error";
		normalizedErrorDescription =
			typeof body.error_description === "string" &&
			body.error_description.length > 0
				? body.error_description
				: "The wallet could not complete the request.";
	}

	const convex = client as unknown as ConvexMutationRunner;
	const completeResult = (await convex.mutation("cwiAuth:completeAuthRequest", {
		requestId: body.requestId,
		decision,
		now,
		codeId,
		codeExpiresAt,
		resultCiphertext,
		error: normalizedError,
		errorDescription: normalizedErrorDescription,
	})) as CompleteAuthRequestResponse;

	if (!completeResult?.ok) {
		return badRequest(
			completeResult?.errorDescription ?? "authorization_complete_failed",
		);
	}

	const redirectUrl = buildRedirectUrl({
		redirectUri: completeResult.redirectUri,
		state: completeResult.state,
		codeId: completeResult.codeId ?? undefined,
		error: completeResult.error ?? undefined,
		errorDescription: completeResult.errorDescription ?? undefined,
	});

	return NextResponse.json({
		redirectUrl,
		decision,
	});
}
