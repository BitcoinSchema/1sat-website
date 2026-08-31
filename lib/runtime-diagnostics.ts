export type DiagnosticCategory = "route" | "action" | "provider";
export type DiagnosticLevel = "info" | "warning" | "error";

export type DiagnosticCode =
	| "route.unexpected"
	| "action.requested"
	| "action.failed"
	| "provider.state"
	| "provider.failed";

export interface DiagnosticEvent {
	id: number;
	timestamp: number;
	correlationId: string;
	category: DiagnosticCategory;
	code: DiagnosticCode;
	level: DiagnosticLevel;
	operation: string;
	message: string;
	recoverable: boolean;
	context: Record<string, string | number | boolean | null>;
}

interface DiagnosticInput {
	category: DiagnosticCategory;
	code: DiagnosticCode;
	operation: string;
	recoverable: boolean;
	correlationId?: string;
	context?: Record<string, unknown>;
}

const EVENT_LIMIT = 100;
const EMPTY_EVENTS: DiagnosticEvent[] = [];
const SAFE_CONTEXT_KEYS = new Set([
	"status",
	"mode",
	"provider",
	"route",
	"retryable",
	"httpStatus",
]);
const CODE_DETAILS: Record<
	DiagnosticCode,
	{ level: DiagnosticLevel; message: string }
> = {
	"route.unexpected": {
		level: "error",
		message: "Page failed unexpectedly.",
	},
	"action.requested": {
		level: "info",
		message: "Wallet action requested.",
	},
	"action.failed": { level: "error", message: "Wallet action failed." },
	"provider.state": {
		level: "info",
		message: "Wallet provider state changed.",
	},
	"provider.failed": {
		level: "error",
		message: "Wallet provider operation failed.",
	},
};

let events = EMPTY_EVENTS;
let nextId = 0;
const listeners = new Set<() => void>();

const looksSecret = (value: string): boolean =>
	/^(?:[KL][1-9A-HJ-NP-Za-km-z]{50,51}|xprv|[0-9a-fA-F]{64,}|[1-9A-HJ-NP-Za-km-z]{48,})/.test(
		value,
	);

const safeToken = (value: string, fallback: string): string => {
	const trimmed = value.trim();
	return /^[a-zA-Z0-9._:/-]{1,96}$/.test(trimmed) && !looksSecret(trimmed)
		? trimmed
		: fallback;
};

export function createCorrelationId(): string {
	return (
		globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${nextId + 1}`
	);
}

export function sanitizeDiagnosticContext(
	context: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> {
	if (!context) return {};
	const safe: Record<string, string | number | boolean | null> = {};
	for (const [key, value] of Object.entries(context)) {
		if (!SAFE_CONTEXT_KEYS.has(key)) continue;
		if (
			typeof value !== "string" &&
			typeof value !== "number" &&
			typeof value !== "boolean" &&
			value !== null
		) {
			continue;
		}
		safe[key] = typeof value === "string" ? safeToken(value, "unknown") : value;
	}
	return safe;
}

export function reportDiagnostic(input: DiagnosticInput): DiagnosticEvent {
	const details = CODE_DETAILS[input.code];
	const context = Object.freeze(sanitizeDiagnosticContext(input.context));
	const event: DiagnosticEvent = Object.freeze({
		id: ++nextId,
		timestamp: Date.now(),
		correlationId: input.correlationId
			? safeToken(input.correlationId, createCorrelationId())
			: createCorrelationId(),
		category: input.category,
		code: input.code,
		level: details.level,
		operation: safeToken(input.operation, "unknown"),
		message: details.message,
		recoverable: input.recoverable,
		context,
	});

	events = [...events, event].slice(-EVENT_LIMIT);
	for (const listener of listeners) listener();

	if (event.level === "error") console.error("[diagnostic]", event);
	else console.info("[diagnostic]", event);
	return event;
}

export function getDiagnosticEvents(): DiagnosticEvent[] {
	return events;
}

export function getServerDiagnosticEvents(): DiagnosticEvent[] {
	return EMPTY_EVENTS;
}

export function subscribeDiagnostics(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function clearDiagnostics(): void {
	events = EMPTY_EVENTS;
	for (const listener of listeners) listener();
}
