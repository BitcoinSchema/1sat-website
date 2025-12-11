"use client";

import { P2PKH, PrivateKey, Script, Transaction } from "@bsv/sdk";
import type { Keys } from "@/lib/types";
import { ChainService } from "./chain-service";
import { GorillaPoolService } from "./gorillapool-service";
import { StorageService } from "./storage-service";
import { TransactionService } from "./transaction-service";
import type {
	CreateActionOptions,
	CreateActionResult,
	SignActionOptions,
	SignActionResult,
	UTXO,
	WalletBalance,
	WalletConfig,
	WalletState,
	WalletTransaction,
} from "./types";
import { UTXOService } from "./utxo-service";

export class WalletService {
	private storage: StorageService;
	private utxoService: UTXOService;
	private chainService: ChainService;
	private gorillaPoolService: GorillaPoolService;
	private keys: Keys | null = null;
	private config: WalletConfig;
	private isInitialized = false;

	constructor(config?: Partial<WalletConfig>) {
		this.config = {
			network: config?.network || "mainnet",
			feePerKb: config?.feePerKb || 50, // 50 sats/kb default
			dustLimit: config?.dustLimit || 135,
			changeThreshold: config?.changeThreshold || 546,
			maxUtxosToUse: config?.maxUtxosToUse || 100,
			defaultLabels: config?.defaultLabels || [],
		};

		this.storage = new StorageService();
		this.chainService = new ChainService(this.config.network);
		this.utxoService = new UTXOService(this.storage, this.chainService);
		// TransactionService is initialized but not stored as property if not used elsewhere?
		// It seems unused in current class methods, maybe intended for future?
		// I will remove the private member declaration as requested.
		new TransactionService(this.storage, this.chainService, this.config);
		this.gorillaPoolService = new GorillaPoolService();
	}

	async initialize(keys: Keys): Promise<void> {
		if (this.isInitialized) {
			throw new Error("Wallet already initialized");
		}

		this.keys = keys;
		await this.storage.initialize();

		// Store keys in storage (encrypted in real implementation)
		await this.storage.setKeys({
			payPk: keys.payPk,
			ordPk: keys.ordPk,
			identityPk: keys.identityPk,
		});

		this.isInitialized = true;

		// Initial sync
		await this.sync();
	}

	async sync(): Promise<void> {
		if (!this.isInitialized || !this.keys) {
			throw new Error("Wallet not initialized");
		}

		const payAddress = PrivateKey.fromWif(this.keys.payPk)
			.toPublicKey()
			.toAddress();
		// Ordinals address might be different if using custom path, but usually same or derived.
		// 1sat uses separate address for ordinals?
		// If keys.ordPk is different, we scan that too.
		const ordAddress = PrivateKey.fromWif(this.keys.ordPk)
			.toPublicKey()
			.toAddress();

		// 1. Fetch BSV UTXOs (WOC)
		const bsvUtxos = await this.chainService.getUTXOs(payAddress);

		// 2. Fetch Ordinals (GP) - Check both addresses to be safe?
		// Usually ordinals are on ordAddress.
		const ordinals = await this.gorillaPoolService.getOrdinals(ordAddress);
		if (payAddress !== ordAddress) {
			const payOrdinals = await this.gorillaPoolService.getOrdinals(payAddress);
			ordinals.push(...payOrdinals);
		}

		// 3. Identify Ordinal Outpoints
		const ordinalOutpoints = new Set(
			ordinals.map((o) => `${o.txid}:${o.vout}`),
		);

		// 4. Process and Store
		// We clear existing? Or update? syncUTXOs clears for address usually.
		// Let's use utxoService to add them, but we need to mark them.

		// Add BSV UTXOs (excluding known ordinals)
		for (const utxo of bsvUtxos) {
			const isOrdinal = ordinalOutpoints.has(`${utxo.txid}:${utxo.vout}`);
			if (!isOrdinal) {
				await this.utxoService.addUTXO({
					txid: utxo.txid,
					vout: utxo.vout,
					satoshis: utxo.satoshis,
					lockingScript: utxo.lockingScript,
					spendable: true,
					change: false,
					createdAt: new Date(),
					// labels: ["bsv"]
				});
			}
		}

		// Add Ordinal UTXOs (marked as not spendable for regular BSV ops? or strictly managed)
		for (const ord of ordinals) {
			await this.utxoService.addUTXO({
				txid: ord.txid,
				vout: ord.vout,
				satoshis: ord.satoshis,
				lockingScript: ord.script,
				spendable: false, // Don't spend as BSV
				change: false,
				createdAt: new Date(),
				description: "Ordinal",
				// data: ord.data
			});
		}

		await this.storage.setLastSync(new Date());
	}

	// BRC-100 compliant createAction
	async createAction(
		options: CreateActionOptions,
	): Promise<CreateActionResult> {
		if (!this.isInitialized || !this.keys) {
			throw new Error("Wallet not initialized");
		}

		// Build transaction
		const tx = new Transaction();
		tx.version = options.version || 1;
		tx.lockTime = options.lockTime || 0;

		// Get UTXOs for spending
		const availableUTXOs = await this.utxoService.getSpendableUTXOs();
		const selectedUTXOs: UTXO[] = [];
		let totalInput = 0;
		let totalOutput = 0;

		// Add specified outputs
		if (options.outputs) {
			for (const output of options.outputs) {
				tx.addOutput({
					lockingScript: Script.fromHex(output.script),
					satoshis: output.satoshis,
				});
				totalOutput += output.satoshis;
			}
		}

		// Select UTXOs
		if (options.inputs) {
			// Use specified inputs
			for (const input of options.inputs) {
				selectedUTXOs.push({
					txid: input.txid,
					vout: input.vout,
					satoshis: input.satoshis,
					lockingScript: input.lockingScript,
					spendable: true,
				});
				totalInput += input.satoshis;
			}
		} else {
			// Auto-select UTXOs
			const feeEstimate = this.estimateFee(tx, options.feePerKb);
			const targetAmount = totalOutput + feeEstimate;

			for (const utxo of availableUTXOs) {
				if (totalInput >= targetAmount) break;
				if (selectedUTXOs.length >= (this.config.maxUtxosToUse ?? 100)) break;

				selectedUTXOs.push(utxo);
				totalInput += utxo.satoshis;
			}

			if (totalInput < targetAmount) {
				throw new Error("Insufficient funds");
			}
		}

		// Add inputs
		for (const utxo of selectedUTXOs) {
			tx.addInput({
				sourceTXID: utxo.txid,
				sourceOutputIndex: utxo.vout,
				unlockingScript: new Script(), // Will be signed later
				sequence: options.sequenceNumber || 0xffffffff,
			});
		}

		// Calculate change
		const fee = this.estimateFee(tx, options.feePerKb);
		const change = totalInput - totalOutput - fee;

		let changeOutput:
			| { vout: number; satoshis: number; lockingScript: string }
			| undefined;
		if (change >= this.config.changeThreshold) {
			// Add change output
			const changeAddress =
				options.changeAddress ||
				PrivateKey.fromWif(this.keys.payPk).toPublicKey().toAddress();
			const changeScript = new P2PKH().lock(changeAddress);

			changeOutput = {
				vout: tx.outputs.length,
				satoshis: change,
				lockingScript: changeScript.toHex(),
			};

			tx.addOutput({
				lockingScript: changeScript,
				satoshis: change,
			});
		}

		// Store unsigned transaction
		await this.storage.addTransaction({
			txid: tx.id("hex"),
			rawTx: tx.toHex(),
			status: "pending",
			satoshis: totalOutput,
			fee,
			timestamp: new Date(),
			description: options.description,
			labels: options.labels,
		});

		return {
			txid: tx.id("hex"),
			tx,
			rawTx: tx.toHex(),
			noSendChange: changeOutput ? [changeOutput] : undefined,
			sendWithoutChange: !changeOutput,
			log: `Transaction created with ${selectedUTXOs.length} inputs and ${tx.outputs.length} outputs`,
		};
	}

	// BRC-100 compliant signAction
	async signAction(
		action: CreateActionResult,
		options?: SignActionOptions,
	): Promise<SignActionResult> {
		if (!this.isInitialized || !this.keys) {
			throw new Error("Wallet not initialized");
		}

		if (!action.tx && !action.rawTx) {
			throw new Error("No transaction to sign");
		}

		const tx = action.tx || Transaction.fromHex(action.rawTx || "");
		const payPrivKey = PrivateKey.fromWif(this.keys.payPk);
		// Sign all inputs
		for (let i = 0; i < tx.inputs.length; i++) {
			const input = tx.inputs[i];

			// Get the UTXO for this input
			if (!input.sourceTXID || input.sourceOutputIndex === undefined) {
				throw new Error(
					`Invalid input at index ${i}: missing source transaction info`,
				);
			}
			const utxo = await this.utxoService.getUTXO(
				input.sourceTXID,
				input.sourceOutputIndex,
			);

			if (!utxo) {
				throw new Error(`UTXO not found for input ${i}`);
			}

			// Set up P2PKH unlocking template with the private key
			input.unlockingScriptTemplate = new P2PKH().unlock(
				payPrivKey,
				"all",
				false,
				utxo.satoshis,
				Script.fromHex(utxo.lockingScript),
			);
		}

		// Sign the transaction using the templates
		tx.sign();

		// Update transaction status
		await this.storage.updateTransaction(tx.id("hex"), {
			rawTx: tx.toHex(),
		});

		return {
			txid: tx.id("hex"),
			tx,
			rawTx: tx.toHex(),
			log: options?.signDescription || "Transaction signed successfully",
		};
	}

	// BRC-100 compliant internalizeAction
	async internalizeAction(
		action: SignActionResult,
	): Promise<{ txid: string; log: string }> {
		if (!action.tx && !action.rawTx) {
			throw new Error("No transaction to internalize");
		}
		const tx = action.tx || Transaction.fromHex(action.rawTx || "");

		// Mark inputs as spent
		for (const input of tx.inputs) {
			if (!input.sourceTXID || input.sourceOutputIndex === undefined) {
				continue; // Skip invalid inputs
			}
			await this.utxoService.markAsSpent(
				input.sourceTXID,
				input.sourceOutputIndex,
				tx.id("hex"),
			);
		}

		// Add new outputs (change)
		if (!this.keys?.payPk) {
			throw new Error("Wallet keys not loaded");
		}
		const payAddress = PrivateKey.fromWif(this.keys.payPk)
			.toPublicKey()
			.toAddress();

		for (let i = 0; i < tx.outputs.length; i++) {
			const output = tx.outputs[i];
			// Extract address from locking script by checking if it matches our address
			const outputScriptHex = output.lockingScript.toHex();
			const payScriptHex = new P2PKH().lock(payAddress).toHex();

			if (outputScriptHex === payScriptHex) {
				// This is our change output
				await this.utxoService.addUTXO({
					txid: tx.id("hex"),
					vout: i,
					satoshis: output.satoshis || 0,
					lockingScript: output.lockingScript.toHex(),
					spendable: true,
					change: true,
					createdAt: new Date(),
				});
			}
		}

		// Broadcast transaction
		const broadcastResult = await this.chainService.broadcastTransaction(
			tx.toHex(),
		);

		// Update transaction status
		await this.storage.updateTransaction(tx.id("hex"), {
			status: broadcastResult.success ? "confirmed" : "failed",
		});

		return {
			txid: tx.id("hex"),
			log: broadcastResult.success
				? "Transaction broadcast successfully"
				: `Broadcast failed: ${broadcastResult.error}`,
		};
	}

	// Get wallet balance
	async getBalance(): Promise<WalletBalance> {
		const utxos = await this.utxoService.getSpendableUTXOs();
		const total = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);

		// For now, assume all are confirmed
		return {
			confirmed: total,
			unconfirmed: 0,
			total,
		};
	}

	// Get all UTXOs
	async getUTXOs(): Promise<UTXO[]> {
		return this.utxoService.getAllUTXOs();
	}

	// Get transaction history
	async getTransactionHistory(): Promise<WalletTransaction[]> {
		return this.storage.getTransactions();
	}

	// Get wallet state
	async getState(): Promise<WalletState> {
		if (!this.isInitialized) {
			throw new Error("Wallet not initialized");
		}

		const keys = await this.storage.getKeys();
		const balance = await this.getBalance();
		const outputs = await this.storage.getOutputs();
		const transactions = await this.storage.getTransactions();
		const certificates = await this.storage.getCertificates();
		const lastSync = await this.storage.getLastSync();

		if (!keys) {
			throw new Error("Keys not found in storage");
		}

		return {
			keys: keys,
			balance,
			outputs,
			transactions,
			certificates,
			lastSync,
			config: this.config,
		};
	}

	// Estimate transaction fee
	private estimateFee(tx: Transaction, feePerKb?: number): number {
		const rate = feePerKb ?? this.config.feePerKb ?? 50; // Default 50 sats/kb
		// Estimate size (rough calculation)
		const inputSize = 148; // Average P2PKH input size
		const outputSize = 34; // Average P2PKH output size
		const baseSize = 10; // Version, locktime, etc.

		const estimatedSize =
			baseSize + tx.inputs.length * inputSize + tx.outputs.length * outputSize;
		const estimatedKb = Math.ceil(estimatedSize / 1000);

		return estimatedKb * rate;
	}

	// Close wallet
	async close(): Promise<void> {
		await this.storage.close();
		this.keys = null;
		this.isInitialized = false;
	}
}
