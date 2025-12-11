/**
 * OneSat Overlay Service
 *
 * Syncs UTXOs from 1sat.app overlay into wallet-toolbox storage.
 *
 * Flow:
 * 1. Register account with owner addresses
 * 2. Fetch TXOs from overlay
 * 3. Ingest into wallet-toolbox with proper baskets
 */

const API_BASE = "https://ordinals.1sat.app";

export interface OneSatTxo {
	outpoint: string; // txid_vout format
	txid?: string;
	vout?: number;
	satoshis?: number;
	script?: string;
	spend?: string;
	height?: number;
	idx?: number;
	data?: { [key: string]: any };
	score?: number;
}

export interface AccountBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

export class OneSatOverlayService {
	private accountName: string;
	private owners: string[];
	private registered: boolean = false;

	constructor(accountName: string, owners: string[]) {
		this.accountName = accountName;
		this.owners = owners;
	}

	/**
	 * Register account with owner addresses
	 */
	async register(): Promise<boolean> {
		try {
			const resp = await fetch(`${API_BASE}/v5/acct/${this.accountName}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(this.owners),
			});

			if (resp.status === 204) {
				this.registered = true;
				console.log(
					`[OneSatOverlay] Account ${this.accountName} registered with owners:`,
					this.owners,
				);
				return true;
			}

			console.error(`[OneSatOverlay] Registration failed: ${resp.status}`);
			return false;
		} catch (error) {
			console.error("[OneSatOverlay] Registration error:", error);
			return false;
		}
	}

	/**
	 * Get account balance
	 * Note: API returns just a number, not an object
	 */
	async getBalance(refresh = false): Promise<AccountBalance | null> {
		if (!this.registered) {
			await this.register();
		}

		try {
			const url = new URL(`${API_BASE}/v5/acct/${this.accountName}/balance`);
			if (refresh) {
				url.searchParams.set("refresh", "true");
			}

			const resp = await fetch(url.toString());
			if (!resp.ok) {
				console.error(`[OneSatOverlay] Balance fetch failed: ${resp.status}`);
				return null;
			}

			const data = await resp.json();

			// API returns just a number for total balance
			const total =
				typeof data === "number"
					? data
					: (data.confirmed || 0) + (data.unconfirmed || 0);

			return {
				confirmed: typeof data === "number" ? data : data.confirmed || 0,
				unconfirmed: typeof data === "number" ? 0 : data.unconfirmed || 0,
				total,
			};
		} catch (error) {
			console.error("[OneSatOverlay] Balance error:", error);
			return null;
		}
	}

	/**
	 * Fetch unspent TXOs from overlay with pagination support
	 * Use 'from' with a score value from previous response for pagination
	 */
	async getUnspentTxos(options?: {
		tags?: string;
		limit?: number;
		from?: number; // Score value for pagination
		includeScript?: boolean;
		includeTxo?: boolean;
		refresh?: boolean;
	}): Promise<OneSatTxo[]> {
		if (!this.registered) {
			await this.register();
		}

		try {
			const url = new URL(`${API_BASE}/v5/acct/${this.accountName}/txos`);
			url.searchParams.set("unspent", "true");

			if (options?.tags) {
				url.searchParams.set("tags", options.tags);
			}
			if (options?.limit) {
				url.searchParams.set("limit", options.limit.toString());
			}
			if (options?.from !== undefined) {
				url.searchParams.set("from", options.from.toString());
			}
			if (options?.includeScript) {
				url.searchParams.set("script", "true");
			}
			if (options?.includeTxo) {
				url.searchParams.set("txo", "true");
			}
			if (options?.refresh) {
				url.searchParams.set("refresh", "true");
			}

			const resp = await fetch(url.toString());
			if (!resp.ok) {
				console.error(`[OneSatOverlay] TXO fetch failed: ${resp.status}`);
				return [];
			}

			const data = await resp.json();
			return Array.isArray(data) ? data : [];
		} catch (error) {
			console.error("[OneSatOverlay] TXO fetch error:", error);
			return [];
		}
	}

	/**
	 * Fetch ALL TXOs by paginating through results
	 * Uses tags=* to get full data including inscription types
	 */
	async getAllTxos(options?: {
		tags?: string;
		pageSize?: number;
	}): Promise<OneSatTxo[]> {
		const allTxos: OneSatTxo[] = [];
		const pageSize = options?.pageSize || 100;
		let from: number | undefined;

		// Always use tags=* to ensure we get the full data.insc.file.type field
		const tags = options?.tags === "origin" ? "*" : options?.tags || "*";

		while (true) {
			const page = await this.getUnspentTxos({
				tags,
				limit: pageSize,
				from,
				includeScript: true,
			});

			if (page.length === 0) break;

			allTxos.push(...page);

			// Get the last score for pagination
			const lastScore = page[page.length - 1].score;
			if (!lastScore || page.length < pageSize) break;

			from = lastScore;
		}

		return allTxos;
	}

	/**
	 * Check if a TXO is a BSV20/BSV21 token based on inscription type
	 */
	private isToken(txo: OneSatTxo): boolean {
		return txo.data?.insc?.file?.type === "application/bsv-20";
	}

	/**
	 * Get ordinals (outputs with origin tag) - single page
	 * Ordinals are ALL 1-sat outputs with origin trace, EXCLUDING tokens
	 */
	async getOrdinals(limit = 100): Promise<OneSatTxo[]> {
		const txos = await this.getUnspentTxos({
			tags: "*", // Use tags=* to get full data
			limit,
			includeScript: true,
		});

		// All outputs are ordinals (they have origin trace), exclude tokens
		const ordinals = txos.filter((txo) => !this.isToken(txo));

		return ordinals.map((txo) => {
			const [txid, voutStr] = txo.outpoint.split("_");
			return {
				...txo,
				txid,
				vout: parseInt(voutStr, 10),
			};
		});
	}

	/**
	 * Get ALL ordinals by paginating through all pages
	 * EXCLUDES BSV20/BSV21 tokens (those with application/bsv-20 inscription type)
	 * Ordinals are ALL 1-sat outputs with origin trace, not just those with current inscriptions
	 */
	async getAllOrdinals(): Promise<OneSatTxo[]> {
		// Fetch all outputs with tags=*
		const allOutputs = await this.getAllTxos({ tags: "*" });

		// Tokens are those with application/bsv-20 inscription type
		const tokens = allOutputs.filter((txo) => this.isToken(txo));
		const tokenOutpoints = new Set(tokens.map((t) => t.outpoint));

		// Pure ordinals = all outputs MINUS tokens
		const pureOrdinals = allOutputs.filter(
			(txo) => !tokenOutpoints.has(txo.outpoint),
		);

		console.log(
			`[OneSatOverlay] Outputs: ${allOutputs.length} total, ${tokens.length} tokens (application/bsv-20), ${pureOrdinals.length} pure ordinals`,
		);

		return pureOrdinals.map((txo) => {
			const [txid, voutStr] = txo.outpoint.split("_");
			return {
				...txo,
				txid,
				vout: parseInt(voutStr, 10),
			};
		});
	}

	/**
	 * Get BSV20 tokens - uses inscription type detection
	 * Note: BSV20 (tick-based) vs BSV21 (id-based) distinction requires fetching inscription content
	 */
	async getBsv20Tokens(limit = 100): Promise<OneSatTxo[]> {
		const txos = await this.getUnspentTxos({
			tags: "*", // Use tags=* to get inscription data
			limit,
			includeScript: true,
		});

		// Filter to tokens only (application/bsv-20)
		const tokens = txos.filter((txo) => this.isToken(txo));

		return tokens.map((txo) => {
			const [txid, voutStr] = txo.outpoint.split("_");
			return {
				...txo,
				txid,
				vout: parseInt(voutStr, 10),
			};
		});
	}

	/**
	 * Get BSV21 tokens
	 * Note: Currently returns same as getBsv20Tokens since we can't easily distinguish
	 * without fetching inscription content
	 */
	async getBsv21Tokens(limit = 100): Promise<OneSatTxo[]> {
		// Same as BSV20 for now - distinction requires parsing inscription JSON
		return this.getBsv20Tokens(limit);
	}

	/**
	 * Get ALL tokens (outputs with application/bsv-20 inscription type)
	 * Note: BSV20/BSV21 distinction is not yet implemented - all tokens returned together
	 */
	async getAllTokens(): Promise<{ bsv20: OneSatTxo[]; bsv21: OneSatTxo[] }> {
		// Fetch all outputs with full inscription data
		const allOutputs = await this.getAllTxos({ tags: "*" });

		// Filter to tokens (inscription type = application/bsv-20)
		const allTokens = allOutputs.filter((txo) => this.isToken(txo));

		const parseTxo = (txo: OneSatTxo) => {
			const [txid, voutStr] = txo.outpoint.split("_");
			return { ...txo, txid, vout: parseInt(voutStr, 10) };
		};

		console.log(
			`[OneSatOverlay] Tokens: ${allTokens.length} total (application/bsv-20 inscription type)`,
		);

		// Return all in bsv21 for now since we can't easily distinguish
		// The inscription JSON contains "tick" for BSV20 or "id" for BSV21
		return {
			bsv20: [],
			bsv21: allTokens.map(parseTxo),
		};
	}

	/**
	 * Get funding UTXOs (>1 sat)
	 */
	async getFundingUtxos(limit = 100): Promise<OneSatTxo[]> {
		const txos = await this.getUnspentTxos({
			tags: "fund",
			limit,
			includeScript: true,
		});

		return txos
			.filter((txo) => (txo.satoshis ?? 0) > 1)
			.map((txo) => {
				const [txid, voutStr] = txo.outpoint.split("_");
				return {
					...txo,
					txid,
					vout: parseInt(voutStr, 10),
				};
			});
	}

	/**
	 * Get all ordinals AND tokens in a single efficient fetch
	 * This avoids fetching the same data twice for ordinals and tokens
	 *
	 * IMPORTANT: An ordinal is any 1-sat output that has an origin (traces back to
	 * an inscription in its history), NOT just outputs with current inscription data.
	 * Tokens are a SUBSET of ordinals that have application/bsv-20 inscription type.
	 */
	async getAllOrdinalsAndTokens(): Promise<{
		ordinals: OneSatTxo[];
		tokens: OneSatTxo[];
	}> {
		// Fetch all outputs with full data using tags=*
		const allOutputs = await this.getAllTxos({ tags: "*" });

		const parseTxo = (txo: OneSatTxo) => {
			const [txid, voutStr] = txo.outpoint.split("_");
			return { ...txo, txid, vout: parseInt(voutStr, 10) };
		};

		// Filter to tokens (inscription type = application/bsv-20)
		const tokens = allOutputs.filter((txo) => this.isToken(txo)).map(parseTxo);

		// Create a Set of token outpoints for fast lookup
		const tokenOutpoints = new Set(tokens.map((t) => t.outpoint));

		// ALL outputs from tags=* are ordinals (they have origin trace)
		// Pure ordinals = all outputs MINUS tokens
		const ordinals = allOutputs
			.filter((txo) => !tokenOutpoints.has(txo.outpoint))
			.map(parseTxo);

		console.log(
			`[OneSatOverlay] Fetched ${allOutputs.length} outputs: ${ordinals.length} ordinals (NFTs), ${tokens.length} tokens (BSV20/BSV21)`,
		);

		return { ordinals, tokens };
	}

	/**
	 * Sync all UTXOs into wallet-toolbox
	 * This fetches from overlay and ingests into local storage
	 */
	async syncToWallet(
		_wallet: any,
	): Promise<{ balance: number; ordinalsCount: number; tokensCount: number }> {
		// Refresh and get balance
		const balance = await this.getBalance(true);

		// Get all ordinals and tokens in a single fetch
		const { ordinals, tokens } = await this.getAllOrdinalsAndTokens();

		console.log(
			`[OneSatOverlay] Synced: ${balance?.total || 0} sats, ${ordinals.length} ordinals, ${tokens.length} tokens`,
		);

		// TODO: Actually ingest into wallet-toolbox via internalizeAction
		// This requires building BEEF envelopes for each UTXO

		return {
			balance: balance?.total || 0,
			ordinalsCount: ordinals.length,
			tokensCount: tokens.length,
		};
	}
}
