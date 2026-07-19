import { ErrorCodes } from "@1sat/connect";

// Wallet-popup-side helpers for the @1sat/connect popup protocol.
// @1sat/connect >=0.0.77 only exports the dApp side; the wallet side posts
// `onesat:response` messages back to the opener. Protocol constants match
// the package's messages module (PROTOCOL_VERSION 1.0.0).
const PROTOCOL_VERSION = "1.0.0";
const RESPONSE_TYPE = "onesat:response";

export interface PopupParams {
	requestId: string | null;
	origin: string | null;
	method: string | null;
	appName: string | null;
	params: unknown;
}

export function parsePopupParams(searchParams: URLSearchParams): PopupParams {
	const requestId = searchParams.get("requestId");
	const origin = searchParams.get("origin");
	const method = searchParams.get("method");
	const appName = searchParams.get("appName");
	const paramsStr = searchParams.get("params");
	let params: unknown;
	if (paramsStr) {
		try {
			params = JSON.parse(decodeURIComponent(paramsStr));
		} catch {}
	}
	return { requestId, origin, method, appName, params };
}

function postToOpener(message: Record<string, unknown>, origin: string) {
	if (typeof window === "undefined") return;
	if (!window.opener) {
		console.error("[onesat] No opener window found");
		return;
	}
	window.opener.postMessage(message, origin);
	window.close();
}

export function sendResponse(
	requestId: string,
	result: unknown,
	origin: string,
) {
	postToOpener(
		{
			type: RESPONSE_TYPE,
			version: PROTOCOL_VERSION,
			requestId,
			origin,
			result,
		},
		origin,
	);
}

export function sendErrorResponse(
	requestId: string,
	code: number,
	message: string,
	origin: string,
	data?: unknown,
) {
	postToOpener(
		{
			type: RESPONSE_TYPE,
			version: PROTOCOL_VERSION,
			requestId,
			origin,
			error: { code, message, data },
		},
		origin,
	);
}

export function rejectRequest(
	requestId: string,
	origin: string,
	reason = "User rejected the request",
) {
	sendErrorResponse(requestId, ErrorCodes.USER_REJECTED, reason, origin);
}

export function walletLockedError(requestId: string, origin: string) {
	sendErrorResponse(
		requestId,
		ErrorCodes.WALLET_LOCKED,
		"Wallet is locked. Please unlock your wallet.",
		origin,
	);
}
