/**
 * Mirrors WPM's normalizeOriginator and buildRequestKey so the relay
 * can construct cache keys without accessing WPM internals for key building.
 */

const DEFAULT_PORTS: Record<string, string> = {
	"http:": "80",
	"https:": "443",
};

export function normalizeOriginator(originator: string): string {
	if (!originator) return "";
	const trimmed = originator.trim();
	if (!trimmed) return "";

	try {
		const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
		const candidate = hasScheme ? trimmed : `https://${trimmed}`;
		const url = new URL(candidate);
		if (!url.hostname) return trimmed.toLowerCase();

		const hostname = url.hostname.toLowerCase();
		const needsBrackets = hostname.includes(":");
		const baseHost = needsBrackets ? `[${hostname}]` : hostname;
		const port = url.port;
		const defaultPort = DEFAULT_PORTS[url.protocol];

		if (port && defaultPort && port === defaultPort) return baseHost;
		return port ? `${baseHost}:${port}` : baseHost;
	} catch {
		return trimmed.toLowerCase();
	}
}

export interface PermissionRequestLike {
	type: "protocol" | "basket" | "certificate" | "spending";
	originator: string;
	privileged?: boolean;
	protocolID?: [number, string];
	counterparty?: string;
	basket?: string;
	certificate?: {
		verifier: string;
		certType: string;
		fields: string[];
	};
	spending?: {
		satoshis: number;
	};
}

export function buildPermissionCacheKey(
	r: PermissionRequestLike,
): string | undefined {
	const norm = normalizeOriginator(r.originator);
	switch (r.type) {
		case "protocol":
			return `proto:${norm}:${!!r.privileged}:${r.protocolID?.join(",")}:${r.counterparty}`;
		case "basket":
			return `basket:${norm}:${r.basket}`;
		case "certificate":
			return `cert:${norm}:${!!r.privileged}:${r.certificate?.verifier}:${r.certificate?.certType}:${r.certificate?.fields.join("|")}`;
		case "spending":
			return `spend:${norm}:${r.spending?.satoshis}`;
	}
}
