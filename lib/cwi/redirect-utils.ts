import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

export const REDIRECT_AUTH_REQUEST_TTL_MS = 5 * 60 * 1000;
export const REDIRECT_AUTH_CODE_TTL_MS = 5 * 60 * 1000;
export const MAX_CWI_ARGS_BYTES = 64 * 1024;
export const MAX_CWI_RESULT_BYTES = 256 * 1024;

export const CWI_REDIRECT_METHODS = [
	"createAction",
	"signAction",
	"abortAction",
	"listActions",
	"internalizeAction",
	"listOutputs",
	"relinquishOutput",
	"getPublicKey",
	"revealCounterpartyKeyLinkage",
	"revealSpecificKeyLinkage",
	"encrypt",
	"decrypt",
	"createHmac",
	"verifyHmac",
	"createSignature",
	"verifySignature",
	"acquireCertificate",
	"listCertificates",
	"proveCertificate",
	"relinquishCertificate",
	"discoverByIdentityKey",
	"discoverByAttributes",
	"isAuthenticated",
	"waitForAuthentication",
	"getHeight",
	"getHeaderForHeight",
	"getNetwork",
	"getVersion",
	"getBalance",
] as const;

const CWI_REDIRECT_METHOD_SET = new Set<string>(CWI_REDIRECT_METHODS);

export type PKCEChallengeMethod = "S256";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

const bytesToBase64Url = (bytes: Uint8Array): string => {
	const binStr = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
	return btoa(binStr)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string): Uint8Array => {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = (4 - (base64.length % 4)) % 4;
	const binStr = atob(base64 + "=".repeat(padding));
	return Uint8Array.from(binStr, (c) => c.charCodeAt(0));
};

const stableSortValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map((entry) => stableSortValue(entry));
	}
	if (value && typeof value === "object") {
		const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
		const sortedObject: Record<string, unknown> = {};
		for (const key of sortedKeys) {
			sortedObject[key] = stableSortValue(
				(value as Record<string, unknown>)[key],
			);
		}
		return sortedObject;
	}
	return value;
};

export const isValidRedirectMethod = (call: string): boolean =>
	CWI_REDIRECT_METHOD_SET.has(call);

export const isDevelopmentEnvironment = (): boolean =>
	process.env.NODE_ENV !== "production";

export const isLoopbackHost = (hostname: string): boolean =>
	hostname === "localhost" || hostname === "127.0.0.1";

export const isAllowedOriginScheme = (url: URL): boolean => {
	if (url.protocol === "https:") return true;
	if (url.protocol !== "http:") return false;
	return isDevelopmentEnvironment() && isLoopbackHost(url.hostname);
};

export const parseOriginHeader = (headers: Headers): URL | null => {
	const header = headers.get("origin");
	if (!header) return null;
	try {
		return new URL(header);
	} catch {
		return null;
	}
};

export const parseAbsoluteUrl = (value: string): URL | null => {
	try {
		return new URL(value);
	} catch {
		return null;
	}
};

export const hasMatchingOrigin = (
	requestOrigin: URL,
	redirectUri: URL,
): boolean => requestOrigin.origin === redirectUri.origin;

export const normalizeArgsAndHash = (args: unknown) => {
	const stable = stableSortValue(args ?? {});
	const serialized = JSON.stringify(stable);
	const argsHash = createHash("sha256").update(serialized).digest("hex");
	const argsSize = new TextEncoder().encode(serialized).byteLength;
	return {
		stableArgs: stable,
		serializedArgs: serialized,
		argsHash,
		argsSize,
	};
};

export const sha256Base64Url = (value: string): string =>
	bytesToBase64Url(createHash("sha256").update(value, "utf8").digest());

export const computePKCEChallenge = (codeVerifier: string): string => {
	return sha256Base64Url(codeVerifier);
};

export const isValidBase64UrlValue = (
	value: string,
	minLength = 1,
	maxLength = 512,
): boolean =>
	value.length >= minLength &&
	value.length <= maxLength &&
	BASE64URL_PATTERN.test(value);

export const generateOpaqueToken = (byteLength = 24): string =>
	bytesToBase64Url(randomBytes(byteLength));

/** AES-256-GCM key derived from CWI_REDIRECT_SECRET env var. Cached per process. */
let _encryptionKey: Uint8Array | null = null;

const getEncryptionKey = (): Uint8Array => {
	if (_encryptionKey) return _encryptionKey;
	const secret = process.env.CWI_REDIRECT_SECRET;
	if (!secret) {
		throw new Error(
			"CWI_REDIRECT_SECRET environment variable is required for redirect result encryption",
		);
	}
	_encryptionKey = createHash("sha256").update(secret).digest();
	return _encryptionKey;
};

/**
 * Encrypt a redirect result payload using AES-256-GCM.
 * Output format: base64url( iv[12] || ciphertext || authTag[16] )
 */
export const encryptResultPayload = (result: unknown): string => {
	const key = getEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const serialized = JSON.stringify(result);
	const plaintext = new TextEncoder().encode(serialized);
	const encrypted = cipher.update(plaintext);
	const final = cipher.final();
	const authTag = cipher.getAuthTag();
	const combined = new Uint8Array(
		iv.byteLength +
			encrypted.byteLength +
			final.byteLength +
			authTag.byteLength,
	);
	combined.set(iv, 0);
	combined.set(encrypted, iv.byteLength);
	combined.set(final, iv.byteLength + encrypted.byteLength);
	combined.set(
		authTag,
		iv.byteLength + encrypted.byteLength + final.byteLength,
	);
	return bytesToBase64Url(combined);
};

/**
 * Decrypt a redirect result payload encrypted with AES-256-GCM.
 * Input format: base64url( iv[12] || ciphertext || authTag[16] )
 */
export const decryptResultPayload = (ciphertext: string): unknown => {
	const key = getEncryptionKey();
	const combined = base64UrlToBytes(ciphertext);
	if (combined.byteLength < 12 + 16) {
		throw new Error("Invalid ciphertext: too short");
	}
	const iv = combined.slice(0, 12);
	const authTag = combined.slice(combined.byteLength - 16);
	const encrypted = combined.slice(12, combined.byteLength - 16);
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	const decrypted = new Uint8Array([
		...decipher.update(encrypted),
		...decipher.final(),
	]);
	const decoded = new TextDecoder().decode(decrypted);
	return JSON.parse(decoded);
};
