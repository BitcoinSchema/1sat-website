#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import process from "node:process";

const BASE_URL = process.env.CWI_BASE_URL ?? "http://localhost:8255";
const DAPP_ORIGIN = process.env.CWI_DAPP_ORIGIN ?? "http://localhost:3333";
const REDIRECT_URI =
	process.env.CWI_REDIRECT_URI ?? "http://localhost:3333/cwi/callback";
const APPROVE_CALL = process.env.CWI_APPROVE_CALL ?? "getNetwork";
const APPROVE_ARGS = process.env.CWI_APPROVE_ARGS
	? JSON.parse(process.env.CWI_APPROVE_ARGS)
	: {};

const walletOrigin = new URL(BASE_URL).origin;

const toBase64Url = (value) =>
	value
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");

const randomToken = (size = 24) => toBase64Url(randomBytes(size));

const sha256Base64Url = (value) =>
	toBase64Url(createHash("sha256").update(value, "utf8").digest());

const nowIso = () => new Date().toISOString();

const log = (message) => {
	console.log(`[${nowIso()}] ${message}`);
};

const fail = (message, detail) => {
	console.error(`[${nowIso()}] ERROR: ${message}`);
	if (detail !== undefined) {
		console.error(detail);
	}
	process.exit(1);
};

const fetchJson = async (path, options = {}) => {
	const url = new URL(path, BASE_URL);
	const headers = {
		"Content-Type": "application/json",
		...(options.headers ?? {}),
	};
	const response = await fetch(url, {
		...options,
		headers,
	});
	const text = await response.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { raw: text };
	}
	return { response, data, url: url.toString() };
};

const assert = (condition, message, detail) => {
	if (!condition) {
		fail(message, detail);
	}
};

const initRequest = async ({ call, args }) => {
	const state = randomToken(18);
	const nonce = randomToken(18);
	const verifier = randomToken(48);
	const challenge = sha256Base64Url(verifier);

	log(`POST /api/cwi/authorize/init (${call})`);
	const { response, data } = await fetchJson("/api/cwi/authorize/init", {
		method: "POST",
		headers: {
			Origin: DAPP_ORIGIN,
		},
		body: JSON.stringify({
			call,
			args,
			redirect_uri: REDIRECT_URI,
			state,
			nonce,
			code_challenge: challenge,
			code_challenge_method: "S256",
		}),
	});

	assert(response.ok, "authorize/init failed", {
		status: response.status,
		data,
	});
	assert(typeof data?.requestId === "string", "missing requestId", data);
	assert(typeof data?.authorizeUrl === "string", "missing authorizeUrl", data);

	return {
		requestId: data.requestId,
		authorizeUrl: data.authorizeUrl,
		state,
		nonce,
		verifier,
	};
};

const getRequest = async (requestId) => {
	log("GET /api/cwi/authorize/request");
	const { response, data } = await fetchJson(
		`/api/cwi/authorize/request?requestId=${encodeURIComponent(requestId)}`,
		{
			method: "GET",
		},
	);
	assert(response.ok, "authorize/request failed", {
		status: response.status,
		data,
	});
	return data;
};

const completeRequest = async (body) => {
	log("POST /api/cwi/authorize/complete");
	const { response, data } = await fetchJson("/api/cwi/authorize/complete", {
		method: "POST",
		headers: {
			Origin: walletOrigin,
		},
		body: JSON.stringify(body),
	});
	assert(response.ok, "authorize/complete failed", {
		status: response.status,
		data,
	});
	assert(typeof data?.redirectUrl === "string", "missing redirectUrl", data);
	return data;
};

const exchangeCode = async ({ code, verifier }) => {
	log("POST /api/cwi/token");
	return await fetchJson("/api/cwi/token", {
		method: "POST",
		headers: {
			Origin: DAPP_ORIGIN,
		},
		body: JSON.stringify({
			code,
			code_verifier: verifier,
			redirect_uri: REDIRECT_URI,
		}),
	});
};

const runApproveFlow = async () => {
	log("=== Approve flow ===");
	const init = await initRequest({ call: APPROVE_CALL, args: APPROVE_ARGS });
	const request = await getRequest(init.requestId);

	assert(request.status === "pending", "request is not pending", request);
	assert(request.call === APPROVE_CALL, "request call mismatch", request);

	const expectedResult = {
		type: "harness_result",
		call: APPROVE_CALL,
		timestamp: Date.now(),
	};

	const completion = await completeRequest({
		requestId: init.requestId,
		decision: "approved",
		result: expectedResult,
	});

	const callbackUrl = new URL(completion.redirectUrl);
	const code = callbackUrl.searchParams.get("code");
	const state = callbackUrl.searchParams.get("state");

	assert(typeof code === "string" && code.length > 0, "missing code", {
		redirectUrl: completion.redirectUrl,
	});
	assert(state === init.state, "state mismatch on approval callback", {
		expected: init.state,
		actual: state,
	});

	const firstExchange = await exchangeCode({ code, verifier: init.verifier });
	assert(firstExchange.response.ok, "token exchange failed", {
		status: firstExchange.response.status,
		data: firstExchange.data,
	});
	assert(
		JSON.stringify(firstExchange.data?.result) ===
			JSON.stringify(expectedResult),
		"token result mismatch",
		{ expectedResult, actual: firstExchange.data },
	);

	log("POST /api/cwi/token (replay)");
	const replay = await exchangeCode({ code, verifier: init.verifier });
	assert(
		!replay.response.ok,
		"replay exchange unexpectedly succeeded",
		replay.data,
	);
	assert(
		typeof replay.data?.error_description === "string" &&
			replay.data.error_description.includes("consumed"),
		"replay error did not indicate consumed code",
		replay.data,
	);

	log("Approve flow passed");
};

const runDenyFlow = async () => {
	log("=== Deny flow ===");
	const init = await initRequest({ call: "getNetwork", args: {} });
	const request = await getRequest(init.requestId);
	assert(request.status === "pending", "deny request is not pending", request);

	const completion = await completeRequest({
		requestId: init.requestId,
		decision: "denied",
		error: "access_denied",
		error_description: "Harness denied request",
	});

	const callbackUrl = new URL(completion.redirectUrl);
	const error = callbackUrl.searchParams.get("error");
	const description = callbackUrl.searchParams.get("error_description");
	const state = callbackUrl.searchParams.get("state");

	assert(error === "access_denied", "deny callback error mismatch", {
		redirectUrl: completion.redirectUrl,
	});
	assert(
		description === "Harness denied request",
		"deny error_description mismatch",
		{
			redirectUrl: completion.redirectUrl,
		},
	);
	assert(state === init.state, "state mismatch on deny callback", {
		expected: init.state,
		actual: state,
	});

	log("Deny flow passed");
};

const main = async () => {
	log(`Running CWI redirect harness against ${BASE_URL}`);
	log(`Dapp origin: ${DAPP_ORIGIN}`);
	log(`Redirect URI: ${REDIRECT_URI}`);

	await runApproveFlow();
	await runDenyFlow();

	log("All redirect harness checks passed");
};

main().catch((error) => {
	fail("Unhandled harness error", error instanceof Error ? error.stack : error);
});
