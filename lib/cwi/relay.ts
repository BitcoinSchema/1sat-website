import type { WalletPermissionsManager } from "@bsv/wallet-toolbox/out/src/index.client";

const CHANNEL_NAME = "1sat-cwi";

export interface CWIRelayConfig {
	wallet: WalletPermissionsManager;
	getStatus: () => "locked" | "unlocked" | "no-wallet";
}

/**
 * CWI Relay — runs in the wallet tab.
 *
 * Listens on BroadcastChannel for CWI requests forwarded by the iframe bridge.
 * Processes them through WPM (which holds keys). Sends responses back.
 *
 * BroadcastChannel is same-origin only (browser-enforced), so only
 * 1satwallet.com pages can participate.
 */
export class CWIRelay {
	private channel: BroadcastChannel;
	private handler: ((event: MessageEvent) => void) | null = null;
	private wallet: WalletPermissionsManager;
	private getStatus: () => "locked" | "unlocked" | "no-wallet";

	constructor(config: CWIRelayConfig) {
		this.wallet = config.wallet;
		this.getStatus = config.getStatus;
		this.channel = new BroadcastChannel(CHANNEL_NAME);
	}

	start(): void {
		if (this.handler) return;

		this.handler = (event: MessageEvent) => {
			const data = event.data;
			if (!data?.type) return;

			switch (data.type) {
				case "cwi-request":
					void this.handleCWIRequest(data);
					break;
				case "cwi-permission-grant":
					void this.wallet.grantPermission({
						requestID: data.requestID,
						ephemeral: false,
					});
					break;
				case "cwi-permission-deny":
					void this.wallet.denyPermission(data.requestID);
					break;
				case "cwi-status-request":
					this.sendStatus();
					break;
			}
		};

		this.channel.addEventListener("message", this.handler);
	}

	stop(): void {
		if (this.handler) {
			this.channel.removeEventListener("message", this.handler);
			this.handler = null;
		}
		this.channel.close();
	}

	sendStatus(): void {
		this.channel.postMessage({
			type: "cwi-status",
			status: this.getStatus(),
		});
	}

	/**
	 * Send a permission request to the iframe bridge for user approval.
	 */
	sendPermissionRequest(
		requestID: string,
		permissionType: string,
		originator: string,
		details: unknown,
	): void {
		this.channel.postMessage({
			type: "cwi-permission-request",
			requestID,
			permissionType,
			originator,
			details,
		});
	}

	private async handleCWIRequest(data: {
		id: string;
		call: string;
		args: unknown;
		originator: string;
	}): Promise<void> {
		const { id, call, args, originator } = data;

		// Validate originator is present
		if (!originator) {
			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description: "Missing originator",
				code: 2,
			});
			return;
		}

		try {
			const method = call as keyof WalletPermissionsManager;
			const fn = this.wallet[method];
			if (typeof fn !== "function") {
				this.channel.postMessage({
					type: "cwi-response",
					id,
					status: "error",
					description: `Method not callable: ${call}`,
					code: 2,
				});
				return;
			}

			const result = await (fn as (...a: unknown[]) => unknown).call(
				this.wallet,
				args ?? {},
				originator,
			);

			this.channel.postMessage({
				type: "cwi-response",
				id,
				result,
			});
		} catch (err: unknown) {
			const description = err instanceof Error ? err.message : String(err);
			const code =
				typeof (err as { code?: unknown })?.code === "number"
					? (err as { code: number }).code
					: 1;

			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description,
				code,
			});
		}
	}
}
