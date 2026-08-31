import type { WalletOutput } from "@1sat/actions";
import type { OrdfsMetadata } from "@1sat/types";
import { getOrdinalPresentation } from "@/lib/wallet/ordinal-presentation";
import { getDisplayOutpoint } from "@/lib/wallet/wallet-output-utils";

export interface OwnedThemeToken {
	origin: string;
	name: string;
	artworkUrl: string;
}

export function getOwnedThemeTokens(
	ordinals: WalletOutput[],
	metadataByRequest?: Record<string, OrdfsMetadata | null>,
): OwnedThemeToken[] {
	const themes = new Map<string, OwnedThemeToken>();
	for (const ordinal of ordinals) {
		const outpoint = getDisplayOutpoint(ordinal);
		const presentation = getOrdinalPresentation(
			ordinal,
			metadataByRequest?.[`${outpoint}:-2`],
		);
		if (presentation.kind !== "theme-token" || !presentation.artworkUrl) {
			continue;
		}
		themes.set(presentation.originOutpoint, {
			origin: presentation.originOutpoint,
			name: presentation.name,
			artworkUrl: presentation.artworkUrl,
		});
	}
	return [...themes.values()];
}
