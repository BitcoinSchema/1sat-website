"use client";

import type { ChainService } from "./chain-service";
import type { StorageService } from "./storage-service";
import type { UTXO, WalletOutput } from "./types";

export class UTXOService {
	constructor(
		private storage: StorageService,
		private chainService: ChainService,
	) {}

	// Add a new UTXO
	async addUTXO(utxo: WalletOutput): Promise<void> {
		await this.storage.addOutput(utxo);
	}

	// Get a specific UTXO
	async getUTXO(txid: string, vout: number): Promise<UTXO | undefined> {
		const output = await this.storage.getOutput(txid, vout);
		if (!output) return undefined;

		return {
			txid: output.txid,
			vout: output.vout,
			satoshis: output.satoshis,
			lockingScript: output.lockingScript,
			spendable: output.spendable,
			change: output.change,
			labels: output.labels,
			description: output.description,
			createdAt: output.createdAt,
			spentTxid: output.spentTxid,
			spentAt: output.spentAt,
		};
	}

	// Get all UTXOs
	async getAllUTXOs(): Promise<UTXO[]> {
		const outputs = await this.storage.getOutputs();
		return outputs.map((output) => ({
			txid: output.txid,
			vout: output.vout,
			satoshis: output.satoshis,
			lockingScript: output.lockingScript,
			spendable: output.spendable,
			change: output.change,
			labels: output.labels,
			description: output.description,
			createdAt: output.createdAt,
			spentTxid: output.spentTxid,
			spentAt: output.spentAt,
		}));
	}

	// Get spendable UTXOs
	async getSpendableUTXOs(): Promise<UTXO[]> {
		const outputs = await this.storage.getSpendableOutputs();
		return outputs.map((output) => ({
			txid: output.txid,
			vout: output.vout,
			satoshis: output.satoshis,
			lockingScript: output.lockingScript,
			spendable: output.spendable,
			change: output.change,
			labels: output.labels,
			description: output.description,
			createdAt: output.createdAt,
		}));
	}

	// Get UTXOs by labels
	async getUTXOsByLabels(labels: string[]): Promise<UTXO[]> {
		const allUTXOs = await this.getSpendableUTXOs();
		return allUTXOs.filter((utxo) =>
			utxo.labels?.some((label) => labels.includes(label)),
		);
	}

	// Mark UTXO as spent
	async markAsSpent(
		txid: string,
		vout: number,
		spentTxid: string,
	): Promise<void> {
		await this.storage.updateOutput(txid, vout, {
			spendable: false,
			spentTxid,
			spentAt: new Date(),
		});
	}

	// Mark UTXO as unspent (for reorg handling)
	async markAsUnspent(txid: string, vout: number): Promise<void> {
		await this.storage.updateOutput(txid, vout, {
			spendable: true,
			spentTxid: undefined,
			spentAt: undefined,
		});
	}

	// Sync UTXOs from chain
	async syncUTXOs(address: string): Promise<void> {
		try {
			// Get UTXOs from chain service
			const chainUTXOs = await this.chainService.getUTXOs(address);

			// Get existing UTXOs from storage
			const existingUTXOs = await this.getAllUTXOs();
			const existingMap = new Map(
				existingUTXOs.map((u) => [`${u.txid}:${u.vout}`, u]),
			);

			// Process chain UTXOs
			for (const chainUTXO of chainUTXOs) {
				const key = `${chainUTXO.txid}:${chainUTXO.vout}`;
				const existing = existingMap.get(key);

				if (!existing) {
					// New UTXO - add it
					await this.addUTXO({
						txid: chainUTXO.txid,
						vout: chainUTXO.vout,
						satoshis: chainUTXO.satoshis,
						lockingScript: chainUTXO.lockingScript,
						spendable: true,
						change: false, // Will be updated if we recognize it as change
						createdAt: new Date(),
						blockHeight: chainUTXO.blockHeight,
					});
				} else {
					// Update existing UTXO if needed
					if (!existing.spendable) {
						// Was marked as spent but is still unspent on chain
						await this.markAsUnspent(chainUTXO.txid, chainUTXO.vout);
					}
					// Update block height if available
					if (
						chainUTXO.blockHeight &&
						chainUTXO.blockHeight !== existing.blockHeight
					) {
						await this.storage.updateOutput(chainUTXO.txid, chainUTXO.vout, {
							blockHeight: chainUTXO.blockHeight,
						});
					}
				}
				// Remove from existing map
				existingMap.delete(key);
			}

			// Mark remaining UTXOs as spent (not in chain response)
			for (const [_key, utxo] of existingMap) {
				if (utxo.spendable) {
					// Was spendable but no longer in chain UTXOs
					await this.markAsSpent(utxo.txid, utxo.vout, "unknown");
				}
			}
		} catch (error) {
			console.error("Failed to sync UTXOs:", error);
			throw error;
		}
	}

	// Select UTXOs for spending
	async selectUTXOs(
		targetAmount: number,
		options?: {
			labels?: string[];
			excludeTxids?: string[];
			preferChange?: boolean;
			maxUtxos?: number;
		},
	): Promise<{ utxos: UTXO[]; total: number }> {
		let availableUTXOs = await this.getSpendableUTXOs();

		// Filter by labels if specified
		if (options?.labels) {
			availableUTXOs = availableUTXOs.filter((utxo) =>
				utxo.labels?.some((label) => options.labels?.includes(label)),
			);
		}

		// Exclude specific transactions
		if (options?.excludeTxids) {
			availableUTXOs = availableUTXOs.filter(
				(utxo) => !options.excludeTxids?.includes(utxo.txid),
			);
		}

		// Sort by preference
		availableUTXOs.sort((a, b) => {
			// Prefer change outputs if requested
			if (options?.preferChange) {
				if (a.change && !b.change) return -1;
				if (!a.change && b.change) return 1;
			}
			// Then sort by amount (largest first for efficiency)
			return b.satoshis - a.satoshis;
		});

		// Select UTXOs
		const selectedUTXOs: UTXO[] = [];
		let totalSelected = 0;
		const maxUtxos = options?.maxUtxos || 100;

		for (const utxo of availableUTXOs) {
			if (totalSelected >= targetAmount) break;
			if (selectedUTXOs.length >= maxUtxos) break;

			selectedUTXOs.push(utxo);
			totalSelected += utxo.satoshis;
		}

		if (totalSelected < targetAmount) {
			throw new Error(
				`Insufficient funds: need ${targetAmount}, have ${totalSelected}`,
			);
		}

		return {
			utxos: selectedUTXOs,
			total: totalSelected,
		};
	}

	// Get balance
	async getBalance(): Promise<{
		confirmed: number;
		unconfirmed: number;
		total: number;
	}> {
		const utxos = await this.getSpendableUTXOs();
		let confirmed = 0;
		let unconfirmed = 0;

		for (const utxo of utxos) {
			// Check if UTXO has block height (confirmed)
			const output = await this.storage.getOutput(utxo.txid, utxo.vout);
			if (output?.blockHeight) {
				confirmed += utxo.satoshis;
			} else {
				unconfirmed += utxo.satoshis;
			}
		}

		return {
			confirmed,
			unconfirmed,
			total: confirmed + unconfirmed,
		};
	}

	// Add labels to UTXO
	async addLabels(txid: string, vout: number, labels: string[]): Promise<void> {
		const output = await this.storage.getOutput(txid, vout);
		if (output) {
			const existingLabels = output.labels || [];
			const newLabels = Array.from(new Set([...existingLabels, ...labels]));
			await this.storage.updateOutput(txid, vout, { labels: newLabels });
		}
	}

	// Remove labels from UTXO
	async removeLabels(
		txid: string,
		vout: number,
		labels: string[],
	): Promise<void> {
		const output = await this.storage.getOutput(txid, vout);
		if (output?.labels) {
			const newLabels = output.labels.filter((l) => !labels.includes(l));
			await this.storage.updateOutput(txid, vout, { labels: newLabels });
		}
	}

	// Set description for UTXO
	async setDescription(
		txid: string,
		vout: number,
		description: string,
	): Promise<void> {
		await this.storage.updateOutput(txid, vout, { description });
	}

	// Clean up spent UTXOs older than a certain date
	async cleanupOldSpentUTXOs(olderThan: Date): Promise<number> {
		const outputs = await this.storage.getOutputs();
		let deleted = 0;

		for (const output of outputs) {
			if (!output.spendable && output.spentAt && output.spentAt < olderThan) {
				await this.storage.deleteOutput(output.txid, output.vout);
				deleted++;
			}
		}

		return deleted;
	}

	// Get UTXO statistics
	async getStatistics(): Promise<{
		total: number;
		spendable: number;
		spent: number;
		change: number;
		labeled: number;
		totalValue: number;
		averageValue: number;
	}> {
		const outputs = await this.storage.getOutputs();

		let spendable = 0;
		let spent = 0;
		let change = 0;
		let labeled = 0;
		let totalValue = 0;

		for (const output of outputs) {
			if (output.spendable) {
				spendable++;
				totalValue += output.satoshis;
			} else {
				spent++;
			}

			if (output.change) change++;
			if (output.labels && output.labels.length > 0) labeled++;
		}

		return {
			total: outputs.length,
			spendable,
			spent,
			change,
			labeled,
			totalValue,
			averageValue: spendable > 0 ? Math.floor(totalValue / spendable) : 0,
		};
	}
}
