import type { ConnectWalletResult } from "@1sat/connect";

export type ProviderSurface =
	| "built-in-direct"
	| "desktop-http"
	| "injected"
	| "native-webview"
	| "hosted-embed"
	| "hosted-redirect";

export type ProductAction =
	| "brc100"
	| "balance-summary"
	| "action-history"
	| "send-bsv"
	| "receive-address"
	| "asset-read"
	| "asset-write"
	| "identity"
	| "permission-admin"
	| "sync"
	| "local-wallet-management";

export type CapabilityState =
	| "supported"
	| "contract-only"
	| "provider-managed"
	| "unsupported"
	| "uncertified"
	| "experimental";

export interface ProviderCapabilityProfile {
	reportedProvider: ConnectWalletResult["provider"];
	discriminator: "exact" | "shared-auto-detect" | "wallet-host";
	actions: Record<ProductAction, CapabilityState>;
}

const externalActions: Record<ProductAction, CapabilityState> = {
	brc100: "contract-only",
	"balance-summary": "provider-managed",
	"action-history": "contract-only",
	"send-bsv": "contract-only",
	"receive-address": "uncertified",
	"asset-read": "contract-only",
	"asset-write": "contract-only",
	identity: "contract-only",
	"permission-admin": "provider-managed",
	sync: "provider-managed",
	"local-wallet-management": "unsupported",
};

const hostedActions: Record<ProductAction, CapabilityState> = {
	brc100: "experimental",
	"balance-summary": "experimental",
	"action-history": "experimental",
	"send-bsv": "experimental",
	"receive-address": "experimental",
	"asset-read": "experimental",
	"asset-write": "experimental",
	identity: "experimental",
	"permission-admin": "provider-managed",
	sync: "provider-managed",
	"local-wallet-management": "unsupported",
};

/** Canonical product capability matrix. Browser certification can only upgrade states. */
export const PROVIDER_CAPABILITIES = {
	"built-in-direct": {
		reportedProvider: "1sat-web",
		discriminator: "exact",
		actions: {
			brc100: "supported",
			"balance-summary": "supported",
			"action-history": "supported",
			"send-bsv": "supported",
			"receive-address": "supported",
			"asset-read": "supported",
			"asset-write": "supported",
			identity: "supported",
			"permission-admin": "supported",
			sync: "supported",
			"local-wallet-management": "supported",
		},
	},
	"desktop-http": {
		reportedProvider: "brc100",
		discriminator: "shared-auto-detect",
		actions: externalActions,
	},
	injected: {
		reportedProvider: "brc100",
		discriminator: "shared-auto-detect",
		actions: externalActions,
	},
	"native-webview": {
		reportedProvider: "brc100",
		discriminator: "shared-auto-detect",
		actions: externalActions,
	},
	"hosted-embed": {
		reportedProvider: "hosted-cwi",
		discriminator: "wallet-host",
		actions: hostedActions,
	},
	"hosted-redirect": {
		reportedProvider: "hosted-cwi",
		discriminator: "wallet-host",
		actions: hostedActions,
	},
} as const satisfies Record<ProviderSurface, ProviderCapabilityProfile>;

export function providerCapability(
	surface: ProviderSurface,
	action: ProductAction,
): CapabilityState {
	return PROVIDER_CAPABILITIES[surface].actions[action];
}
