import type { WalletOutput } from "@1sat/actions";
import type { OrdfsMetadata } from "@1sat/types";
import { stackContentUrl, toUrlOutpoint } from "@/lib/stack";
import {
	getContentType,
	getName,
	getOriginOutpoint,
} from "@/lib/wallet/wallet-output-utils";

const THEME_TOKEN_APP = "themetoken";
const BITPLAN_CONTENT_TYPE = "application/x-bitplan";

export type OrdinalPresentationKind =
	| "image"
	| "theme-token"
	| "bitplan"
	| "other";

export interface OrdinalPresentation {
	kind: OrdinalPresentationKind;
	name: string;
	contentLabel: string;
	contentType: string;
	originOutpoint: string;
	href: string;
	artworkUrl?: string;
}

function metadataText(
	metadata: OrdfsMetadata | null | undefined,
	key: string,
): string | undefined {
	const value = metadata?.map?.[key];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isThemeToken(metadata: OrdfsMetadata | null | undefined): boolean {
	const app = metadataText(metadata, "app");
	return app?.toLowerCase().replace(/[-_\s]/g, "") === THEME_TOKEN_APP;
}

/** Resolve sparse wallet tags against canonical OrdFS metadata for display. */
export function getOrdinalPresentation(
	output: WalletOutput,
	metadata?: OrdfsMetadata | null,
): OrdinalPresentation {
	const originOutpoint = toUrlOutpoint(
		metadata?.origin ?? getOriginOutpoint(output),
	);
	const contentType = getContentType(output) || metadata?.contentType || "";
	const taggedName = getName(output);
	const indexedName = metadataText(metadata, "name");

	if (isThemeToken(metadata)) {
		return {
			kind: "theme-token",
			name: taggedName ?? indexedName ?? "Theme Token",
			contentLabel: "Theme Token",
			contentType,
			originOutpoint,
			href: `https://themetoken.dev/preview/${originOutpoint}`,
			artworkUrl: `https://themetoken.dev/og/${originOutpoint}.png?v=2`,
		};
	}

	if (contentType.toLowerCase() === BITPLAN_CONTENT_TYPE) {
		return {
			kind: "bitplan",
			name: taggedName ?? indexedName ?? "BitPlan Document",
			contentLabel: "BitPlan Document",
			contentType,
			originOutpoint,
			href: `https://bitplan.dev/d/${originOutpoint}`,
		};
	}

	if (contentType.toLowerCase().startsWith("image/")) {
		return {
			kind: "image",
			name: taggedName ?? indexedName ?? "Ordinal",
			contentLabel: contentType,
			contentType,
			originOutpoint,
			href: stackContentUrl(originOutpoint),
			artworkUrl: stackContentUrl(originOutpoint),
		};
	}

	return {
		kind: "other",
		name: taggedName ?? indexedName ?? "Ordinal",
		contentLabel: contentType || "Unknown content type",
		contentType,
		originOutpoint,
		href: stackContentUrl(originOutpoint),
	};
}
