import type {
	CounterpartyPermissions,
	GroupedPermissions,
	PermissionRequest,
} from "@bsv/wallet-toolbox-client";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isText = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0 && value.length <= 512;

export const isCompressedPublicKey = (value: unknown): value is string =>
	typeof value === "string" && /^(02|03)[0-9a-fA-F]{64}$/.test(value);

const hasPrivilegedFlag = (value: Record<string, unknown>): boolean =>
	value.privileged === true;

const validDescription = (value: unknown): value is string | undefined =>
	value === undefined || isText(value);

const parseProtocolPermissions = (
	value: unknown,
): NonNullable<GroupedPermissions["protocolPermissions"]> | null => {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > 64) return null;
	const result: NonNullable<GroupedPermissions["protocolPermissions"]> = [];
	for (const entry of value) {
		if (!isRecord(entry) || hasPrivilegedFlag(entry)) return null;
		const protocolID = entry.protocolID;
		if (
			!Array.isArray(protocolID) ||
			protocolID.length !== 2 ||
			(protocolID[0] !== 1 && protocolID[0] !== 2) ||
			!isText(protocolID[1]) ||
			!isText(entry.description)
		)
			return null;
		if (protocolID[0] === 2 && !isCompressedPublicKey(entry.counterparty)) {
			return null;
		}
		if (
			protocolID[0] === 1 &&
			entry.counterparty !== undefined &&
			!isText(entry.counterparty)
		)
			return null;
		result.push({
			protocolID: [protocolID[0], protocolID[1]],
			...(typeof entry.counterparty === "string"
				? { counterparty: entry.counterparty }
				: {}),
			description: entry.description,
		});
	}
	return result;
};

const parseBasketAccess = (
	value: unknown,
): NonNullable<GroupedPermissions["basketAccess"]> | null => {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > 64) return null;
	const result: NonNullable<GroupedPermissions["basketAccess"]> = [];
	for (const entry of value) {
		if (
			!isRecord(entry) ||
			hasPrivilegedFlag(entry) ||
			!isText(entry.basket) ||
			!isText(entry.description)
		)
			return null;
		const basket = entry.basket;
		if (
			basket === "default" ||
			basket.startsWith("admin") ||
			basket.startsWith("p ")
		)
			return null;
		result.push({
			basket,
			description: entry.description,
		});
	}
	return result;
};

const parseCertificateAccess = (
	value: unknown,
): NonNullable<GroupedPermissions["certificateAccess"]> | null => {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > 64) return null;
	const result: NonNullable<GroupedPermissions["certificateAccess"]> = [];
	for (const entry of value) {
		if (
			!isRecord(entry) ||
			hasPrivilegedFlag(entry) ||
			!isText(entry.type) ||
			!isCompressedPublicKey(entry.verifierPublicKey) ||
			!Array.isArray(entry.fields) ||
			entry.fields.length > 64 ||
			!entry.fields.every(isText) ||
			new Set(entry.fields).size !== entry.fields.length ||
			!isText(entry.description)
		)
			return null;
		result.push({
			type: entry.type,
			verifierPublicKey: entry.verifierPublicKey,
			fields: [...entry.fields],
			description: entry.description,
		});
	}
	return result;
};

/** Reject malformed or privileged manifest entries before rendering consent. */
export function parseGroupedPermissions(
	value: unknown,
): GroupedPermissions | null {
	if (!isRecord(value) || !validDescription(value.description)) return null;
	const protocols = parseProtocolPermissions(value.protocolPermissions);
	const baskets = parseBasketAccess(value.basketAccess);
	const certificates = parseCertificateAccess(value.certificateAccess);
	if (!protocols || !baskets || !certificates) return null;

	let spendingAuthorization: GroupedPermissions["spendingAuthorization"];
	if (value.spendingAuthorization !== undefined) {
		const spending = value.spendingAuthorization;
		if (
			!isRecord(spending) ||
			hasPrivilegedFlag(spending) ||
			!Number.isSafeInteger(spending.amount) ||
			(spending.amount as number) <= 0 ||
			!isText(spending.description)
		)
			return null;
		spendingAuthorization = {
			amount: spending.amount as number,
			description: spending.description,
		};
	}

	if (
		!spendingAuthorization &&
		protocols.length === 0 &&
		baskets.length === 0 &&
		certificates.length === 0
	)
		return null;

	return {
		...(typeof value.description === "string"
			? { description: value.description }
			: {}),
		...(spendingAuthorization ? { spendingAuthorization } : {}),
		...(protocols.length ? { protocolPermissions: protocols } : {}),
		...(baskets.length ? { basketAccess: baskets } : {}),
		...(certificates.length ? { certificateAccess: certificates } : {}),
	};
}

/** PACT declarations are Level-2 protocols only. */
export function parseCounterpartyPermissions(
	value: unknown,
): CounterpartyPermissions | null {
	if (!isRecord(value) || !validDescription(value.description)) return null;
	if (!Array.isArray(value.protocols) || value.protocols.length === 0)
		return null;
	if (value.protocols.length > 64) return null;
	const protocols: CounterpartyPermissions["protocols"] = [];
	for (const entry of value.protocols) {
		if (!isRecord(entry) || hasPrivilegedFlag(entry)) return null;
		const protocolName = isText(entry.protocolName)
			? entry.protocolName
			: Array.isArray(entry.protocolID) &&
					entry.protocolID.length === 2 &&
					entry.protocolID[0] === 2 &&
					isText(entry.protocolID[1])
				? entry.protocolID[1]
				: null;
		if (!protocolName || !validDescription(entry.description)) return null;
		protocols.push({
			protocolName,
			protocolID: [2, protocolName],
			...(typeof entry.description === "string"
				? { description: entry.description }
				: {}),
		});
	}
	return {
		...(typeof value.description === "string"
			? { description: value.description }
			: {}),
		protocols,
	};
}

export function spendingRequestAmount(details: unknown): number | null {
	if (!isRecord(details) || details.type !== "spending") return null;
	const spending = details.spending;
	if (
		!isRecord(spending) ||
		!Number.isSafeInteger(spending.satoshis) ||
		(spending.satoshis as number) <= 0
	)
		return null;
	return spending.satoshis as number;
}

export function descriptionConflictsWithAmount(
	description: string | undefined,
	amount: number,
): boolean {
	if (!description) return false;
	for (const match of description.matchAll(
		/([\d,]+)\s*(?:sat(?:oshi)?s?)\b/gi,
	)) {
		const claimed = Number(match[1].replaceAll(",", ""));
		if (Number.isSafeInteger(claimed) && claimed !== amount) return true;
	}
	return false;
}

export const isPermissionRequest = (
	value: unknown,
): value is PermissionRequest & { requestID: string } => {
	if (
		!isRecord(value) ||
		typeof value.requestID !== "string" ||
		value.requestID.length === 0 ||
		value.requestID.length > 128 ||
		(value.reason !== undefined && !isText(value.reason)) ||
		(value.privileged !== undefined && typeof value.privileged !== "boolean")
	)
		return false;
	switch (value.type) {
		case "protocol": {
			const protocolID = value.protocolID;
			if (
				!Array.isArray(protocolID) ||
				protocolID.length !== 2 ||
				(protocolID[0] !== 1 && protocolID[0] !== 2) ||
				!isText(protocolID[1])
			)
				return false;
			return (
				protocolID[0] !== 2 ||
				value.counterparty === "self" ||
				value.counterparty === "anyone" ||
				isCompressedPublicKey(value.counterparty)
			);
		}
		case "basket":
			return isText(value.basket);
		case "certificate":
			return (
				isRecord(value.certificate) &&
				isCompressedPublicKey(value.certificate.verifier) &&
				isText(value.certificate.certType) &&
				Array.isArray(value.certificate.fields) &&
				value.certificate.fields.length <= 64 &&
				value.certificate.fields.every(isText) &&
				new Set(value.certificate.fields).size ===
					value.certificate.fields.length
			);
		case "spending": {
			if (spendingRequestAmount(value) === null) return false;
			const spending = value.spending;
			if (!isRecord(spending) || spending.lineItems === undefined) return true;
			return (
				Array.isArray(spending.lineItems) &&
				spending.lineItems.length <= 256 &&
				spending.lineItems.every(
					(item) =>
						isRecord(item) &&
						(item.type === "input" ||
							item.type === "output" ||
							item.type === "fee") &&
						isText(item.description) &&
						Number.isSafeInteger(item.satoshis) &&
						(item.satoshis as number) >= 0,
				)
			);
		}
		default:
			return false;
	}
};

export const permissionExpiry = (
	duration: "thirty-days" | "until-revoked",
	nowSeconds = Math.floor(Date.now() / 1000),
): number => (duration === "thirty-days" ? nowSeconds + 30 * 24 * 60 * 60 : 0);

export interface ConsentEntry {
	id: string;
	label: string;
	detail: string;
	description?: string;
}

export function groupedConsentEntries(
	permissions: GroupedPermissions,
): ConsentEntry[] {
	const entries: ConsentEntry[] = [];
	permissions.protocolPermissions?.forEach((permission, index) => {
		entries.push({
			id: `protocol:${index}`,
			label: "Protocol",
			detail: `${permission.protocolID[1]} (Level ${permission.protocolID[0]})${permission.counterparty ? ` — ${permission.counterparty}` : ""}`,
			description: permission.description,
		});
	});
	permissions.basketAccess?.forEach((permission, index) => {
		entries.push({
			id: `basket:${index}`,
			label: "Basket",
			detail: permission.basket,
			description: permission.description,
		});
	});
	permissions.certificateAccess?.forEach((permission, index) => {
		entries.push({
			id: `certificate:${index}`,
			label: "Certificate",
			detail: `${permission.type}; verifier ${permission.verifierPublicKey}; fields ${permission.fields.join(", ") || "none"}`,
			description: permission.description,
		});
	});
	if (permissions.spendingAuthorization) {
		entries.push({
			id: "spending",
			label: "Standing monthly spending",
			detail: `${permissions.spendingAuthorization.amount.toLocaleString()} satoshis per month`,
			description: permissions.spendingAuthorization.description,
		});
	}
	return entries;
}

export function selectGroupedPermissions(
	permissions: GroupedPermissions,
	selected: ReadonlySet<string>,
): Partial<GroupedPermissions> {
	const protocolPermissions = permissions.protocolPermissions?.filter(
		(_, index) => selected.has(`protocol:${index}`),
	);
	const basketAccess = permissions.basketAccess?.filter((_, index) =>
		selected.has(`basket:${index}`),
	);
	const certificateAccess = permissions.certificateAccess?.filter((_, index) =>
		selected.has(`certificate:${index}`),
	);
	return {
		...(permissions.description
			? { description: permissions.description }
			: {}),
		...(selected.has("spending") && permissions.spendingAuthorization
			? { spendingAuthorization: permissions.spendingAuthorization }
			: {}),
		...(protocolPermissions?.length ? { protocolPermissions } : {}),
		...(basketAccess?.length ? { basketAccess } : {}),
		...(certificateAccess?.length ? { certificateAccess } : {}),
	};
}

export function counterpartyConsentEntries(
	permissions: CounterpartyPermissions,
): ConsentEntry[] {
	return permissions.protocols.map((permission, index) => ({
		id: `protocol:${index}`,
		label: "Level 2 protocol",
		detail: permission.protocolName,
		description: permission.description,
	}));
}

export function selectCounterpartyPermissions(
	permissions: CounterpartyPermissions,
	selected: ReadonlySet<string>,
): Partial<CounterpartyPermissions> {
	return {
		...(permissions.description
			? { description: permissions.description }
			: {}),
		protocols: permissions.protocols.filter((_, index) =>
			selected.has(`protocol:${index}`),
		),
	};
}
