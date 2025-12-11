"use client";

import { P2PKH, type PrivateKey, Script, Transaction } from "@bsv/sdk";
import type { ChainService } from "./chain-service";
import type { StorageService } from "./storage-service";
import type { UTXO, WalletConfig, WalletTransaction } from "./types";

export class TransactionService {
	constructor(
		private storage: StorageService,
		private chainService: ChainService,
		private config: WalletConfig,
	) {}

	// Build a transaction
	async buildTransaction(
		utxos: UTXO[],
		outputs: Array<{ script: string; satoshis: number }>,
		changeAddress?: string,
		feePerKb?: number,
	): Promise<{
		tx: Transaction;
		fee: number;
		change?: { vout: number; satoshis: number };
	}> {
		const tx = new Transaction();
		tx.version = 1;
		tx.lockTime = 0;

		let totalInput = 0;
		let totalOutput = 0;

		// Add inputs
		for (const utxo of utxos) {
			tx.addInput({
				sourceTXID: utxo.txid,
				sourceOutputIndex: utxo.vout,
				unlockingScript: new Script(), // Will be signed later
				sequence: 0xffffffff,
			});
			totalInput += utxo.satoshis;
		}

		// Add outputs
		for (const output of outputs) {
			tx.addOutput({
				lockingScript: Script.fromHex(output.script),
				satoshis: output.satoshis,
			});
			totalOutput += output.satoshis;
		}

		// Calculate fee
		const fee = this.estimateFee(tx, feePerKb);

		// Calculate change
		const changeAmount = totalInput - totalOutput - fee;
		let changeOutput: { vout: number; satoshis: number } | undefined;

		if (changeAmount >= this.config.changeThreshold) {
			if (!changeAddress) {
				throw new Error("Change address required for change output");
			}

			const changeScript = new P2PKH().lock(changeAddress);
			changeOutput = {
				vout: tx.outputs.length,
				satoshis: changeAmount,
			};

			tx.addOutput({
				lockingScript: changeScript,
				satoshis: changeAmount,
			});
		} else if (changeAmount < 0) {
			throw new Error("Insufficient funds for transaction");
		}

		return {
			tx,
			fee,
			change: changeOutput,
		};
	}

	// Sign a transaction
	async signTransaction(
		tx: Transaction,
		privateKey: PrivateKey,
		utxos: UTXO[],
	): Promise<Transaction> {
		// Set up unlocking script templates for each input
		for (let i = 0; i < tx.inputs.length; i++) {
			const input = tx.inputs[i];
			const utxo = utxos[i];

			if (!utxo) {
				throw new Error(`UTXO not found for input ${i}`);
			}

			// Set up P2PKH unlocking template with the private key and satoshis
			input.unlockingScriptTemplate = new P2PKH().unlock(
				privateKey,
				"single",
				false,
				utxo.satoshis,
				Script.fromHex(utxo.lockingScript),
			);
		}

		// Sign all inputs at once
		await tx.sign();

		return tx;
	}

	// Broadcast a transaction
	async broadcastTransaction(
		txHex: string,
	): Promise<{ success: boolean; txid?: string; error?: string }> {
		return this.chainService.broadcastTransaction(txHex);
	}

	// Create a simple payment transaction
	async createPaymentTransaction(
		fromPrivKey: PrivateKey,
		toAddress: string,
		amount: number,
		utxos: UTXO[],
		feePerKb?: number,
	): Promise<WalletTransaction> {
		// Build outputs
		const outputs = [
			{
				script: new P2PKH().lock(toAddress).toHex(),
				satoshis: amount,
			},
		];

		// Get change address
		const changeAddress = fromPrivKey.toPublicKey().toAddress();

		// Build transaction
		const { tx, fee } = await this.buildTransaction(
			utxos,
			outputs,
			changeAddress,
			feePerKb,
		);

		// Sign transaction
		const signedTx = await this.signTransaction(tx, fromPrivKey, utxos);

		// Create wallet transaction record
		const walletTx: WalletTransaction = {
			txid: signedTx.id("hex"),
			rawTx: signedTx.toHex(),
			status: "pending",
			satoshis: amount,
			fee,
			timestamp: new Date(),
		};

		// Save to storage
		await this.storage.addTransaction(walletTx);

		return walletTx;
	}

	// Create a sweep transaction (send all funds)
	async createSweepTransaction(
		fromPrivKey: PrivateKey,
		toAddress: string,
		utxos: UTXO[],
		feePerKb?: number,
	): Promise<WalletTransaction> {
		// Calculate total available
		const totalAvailable = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);

		// Build empty transaction to estimate fee
		const tx = new Transaction();
		tx.version = 1;
		tx.lockTime = 0;

		// Add inputs
		for (const utxo of utxos) {
			tx.addInput({
				sourceTXID: utxo.txid,
				sourceOutputIndex: utxo.vout,
				unlockingScript: new Script(),
				sequence: 0xffffffff,
			});
		}

		// Add single output (will adjust amount after fee calculation)
		tx.addOutput({
			lockingScript: new P2PKH().lock(toAddress),
			satoshis: 0,
		});

		// Calculate fee
		const fee = this.estimateFee(tx, feePerKb);
		const sweepAmount = totalAvailable - fee;

		if (sweepAmount < (this.config.dustLimit ?? 135)) {
			throw new Error("Insufficient funds after fees");
		}

		// Update output amount
		tx.outputs[0].satoshis = sweepAmount;

		// Sign transaction
		const signedTx = await this.signTransaction(tx, fromPrivKey, utxos);

		// Create wallet transaction record
		const walletTx: WalletTransaction = {
			txid: signedTx.id("hex"),
			rawTx: signedTx.toHex(),
			status: "pending",
			satoshis: sweepAmount,
			fee,
			timestamp: new Date(),
			description: "Sweep transaction",
		};

		// Save to storage
		await this.storage.addTransaction(walletTx);

		return walletTx;
	}

	// Estimate transaction fee
	private estimateFee(tx: Transaction, feePerKb?: number): number {
		const rate = feePerKb ?? this.config.feePerKb ?? 500; // Default to .5 sat/byte (100 sats/kb)

		// More accurate size estimation
		let size = 10; // Base size (version, locktime, etc)

		// Input size (assuming P2PKH)
		// Each input: 32 (txid) + 4 (vout) + 1 (script length) + ~107 (signature + pubkey) + 4 (sequence)
		size += tx.inputs.length * 148;

		// Output size
		// Each P2PKH output: 8 (amount) + 1 (script length) + 25 (P2PKH script)
		// Each P2SH output: 8 (amount) + 1 (script length) + 23 (P2SH script)
		for (const output of tx.outputs) {
			size += 8; // Amount
			const scriptSize = output.lockingScript.toBinary().length;
			if (scriptSize < 253) {
				size += 1; // Single byte for script length
			} else {
				size += 3; // Multi-byte for script length
			}
			size += scriptSize;
		}

		// Variable length integers for input/output counts
		size += this.getVarIntSize(tx.inputs.length);
		size += this.getVarIntSize(tx.outputs.length);

		// Calculate fee
		const kb = Math.ceil(size / 1000);
		return kb * rate;
	}

	// Get variable integer size
	private getVarIntSize(n: number): number {
		if (n < 253) return 1;
		if (n < 65536) return 3;
		if (n < 4294967296) return 5;
		return 9;
	}

	// Verify transaction
	async verifyTransaction(txHex: string): Promise<{
		valid: boolean;
		error?: string;
	}> {
		try {
			const tx = Transaction.fromHex(txHex);

			// Basic validation
			if (tx.inputs.length === 0) {
				return { valid: false, error: "Transaction has no inputs" };
			}

			if (tx.outputs.length === 0) {
				return { valid: false, error: "Transaction has no outputs" };
			}

			// Check for dust outputs
			for (const output of tx.outputs) {
				if (
					output.satoshis &&
					output.satoshis < (this.config.dustLimit ?? 135)
				) {
					return { valid: false, error: "Transaction contains dust output" };
				}
			}

			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error: error instanceof Error ? error.message : "Invalid transaction",
			};
		}
	}

	// Get transaction status from chain
	async getTransactionStatus(
		txid: string,
	): Promise<"pending" | "confirmed" | "failed"> {
		const txInfo = await this.chainService.getTransaction(txid);
		if (!txInfo) return "pending";
		return txInfo.blockHeight ? "confirmed" : "pending";
	}

	// Update transaction statuses
	async updateTransactionStatuses(): Promise<void> {
		const transactions = await this.storage.getTransactions();

		for (const tx of transactions) {
			if (tx.status === "pending") {
				const status = await this.getTransactionStatus(tx.txid);
				if (status !== "pending") {
					await this.storage.updateTransaction(tx.txid, { status });
				}
			}
		}
	}
}
