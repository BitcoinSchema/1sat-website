"use client";

import { type IDBPDatabase, openDB } from "idb";
import type {
  UTXO,
  WalletCertificate,
  WalletOutput,
  WalletTransaction,
} from "./types";

interface WalletDB {
  outputs: WalletOutput;
  transactions: WalletTransaction;
  certificates: WalletCertificate;
  settings: {
    key: string;
    value: string | number | boolean | Record<string, unknown>;
  };
}

export class StorageService {
  private db: IDBPDatabase<WalletDB> | null = null;
  private readonly dbName = "1sat-wallet";
  private readonly dbVersion = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<WalletDB>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion) {
        // Create outputs store
        if (!db.objectStoreNames.contains("outputs")) {
          const outputStore = db.createObjectStore("outputs", {
            keyPath: ["txid", "vout"],
          });
          outputStore.createIndex("spendable", "spendable");
          outputStore.createIndex("createdAt", "createdAt");
          outputStore.createIndex("spentTxid", "spentTxid");
          outputStore.createIndex("blockHeight", "blockHeight");
        }

        // Create transactions store
        if (!db.objectStoreNames.contains("transactions")) {
          const txStore = db.createObjectStore("transactions", {
            keyPath: "txid",
          });
          txStore.createIndex("status", "status");
          txStore.createIndex("timestamp", "timestamp");
          txStore.createIndex("blockHeight", "blockHeight");
          txStore.createIndex("blockHash", "blockHash");
        }

        // Create certificates store
        if (!db.objectStoreNames.contains("certificates")) {
          const certStore = db.createObjectStore("certificates", {
            keyPath: "serialNumber",
          });
          certStore.createIndex("type", "type");
          certStore.createIndex("certifier", "certifier");
          certStore.createIndex("subject", "subject");
          certStore.createIndex("createdAt", "createdAt");
        }

        // Create settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", {
            keyPath: "key",
          });
        }
      },
    });
  }

  // --- Outputs/UTXOs ---
  async addOutput(output: WalletOutput): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.put("outputs", output);
  }

  async getOutput(
    txid: string,
    vout: number,
  ): Promise<WalletOutput | undefined> {
    if (!this.db) throw new Error("Storage not initialized");
    return this.db.get("outputs", [txid, vout]);
  }

  async getOutputs(): Promise<WalletOutput[]> {
    if (!this.db) throw new Error("Storage not initialized");
    return this.db.getAll("outputs");
  }

  async getSpendableOutputs(): Promise<WalletOutput[]> {
    if (!this.db) throw new Error("Storage not initialized");
    const allOutputs = await this.db.getAll("outputs");
    return allOutputs.filter((output) => output.spendable);
  }

  async updateOutput(
    txid: string,
    vout: number,
    updates: Partial<WalletOutput>,
  ): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    const output = await this.getOutput(txid, vout);
    if (output) {
      await this.db.put("outputs", { ...output, ...updates });
    }
  }

  async deleteOutput(txid: string, vout: number): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.delete("outputs", [txid, vout]);
  }

  // --- Transactions ---
  async addTransaction(tx: WalletTransaction): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.put("transactions", tx);
  }

  async getTransaction(txid: string): Promise<WalletTransaction | undefined> {
    if (!this.db) throw new Error("Storage not initialized");
    return this.db.get("transactions", txid);
  }

  async getTransactions(): Promise<WalletTransaction[]> {
    if (!this.db) throw new Error("Storage not initialized");
    const txs = await this.db.getAll("transactions");
    // Sort by timestamp descending
    return txs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateTransaction(
    txid: string,
    updates: Partial<WalletTransaction>,
  ): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    const tx = await this.getTransaction(txid);
    if (tx) {
      await this.db.put("transactions", { ...tx, ...updates });
    }
  }

  async deleteTransaction(txid: string): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.delete("transactions", txid);
  }

  // --- Certificates ---
  async addCertificate(cert: WalletCertificate): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.put("certificates", cert);
  }

  async getCertificate(
    serialNumber: string,
  ): Promise<WalletCertificate | undefined> {
    if (!this.db) throw new Error("Storage not initialized");
    return this.db.get("certificates", serialNumber);
  }

  async getCertificates(): Promise<WalletCertificate[]> {
    if (!this.db) throw new Error("Storage not initialized");
    return this.db.getAll("certificates");
  }

  async deleteCertificate(serialNumber: string): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.delete("certificates", serialNumber);
  }

  // --- Settings ---
  async setSetting(
    key: string,
    value: string | number | boolean | Record<string, unknown>,
  ): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.put("settings", { key, value });
  }

  async getSetting<T = string | number | boolean | Record<string, unknown>>(
    key: string,
  ): Promise<T | undefined> {
    if (!this.db) throw new Error("Storage not initialized");
    const setting = await this.db.get("settings", key);
    return setting?.value as T | undefined;
  }

  async deleteSetting(key: string): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.delete("settings", key);
  }

  // Wallet-specific settings
  async setKeys(keys: {
    payPk: string;
    ordPk: string;
    identityPk?: string;
  }): Promise<void> {
    await this.setSetting("keys", keys);
  }

  async getKeys(): Promise<
    { payPk: string; ordPk: string; identityPk?: string } | undefined
  > {
    return this.getSetting("keys");
  }

  async setLastSync(date: Date): Promise<void> {
    await this.setSetting("lastSync", date.toISOString());
  }

  async getLastSync(): Promise<Date | undefined> {
    const dateStr = await this.getSetting<string>("lastSync");
    return typeof dateStr === "string" ? new Date(dateStr) : undefined;
  }

  // --- Utility ---
  async clear(): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");
    await this.db.clear("outputs");
    await this.db.clear("transactions");
    await this.db.clear("certificates");
    await this.db.clear("settings");
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Export wallet data
  async exportData(): Promise<{
    outputs: WalletOutput[];
    transactions: WalletTransaction[];
    certificates: WalletCertificate[];
    settings: Array<{
      key: string;
      value: string | number | boolean | Record<string, unknown>;
    }>;
  }> {
    if (!this.db) throw new Error("Storage not initialized");

    const outputs = await this.db.getAll("outputs");
    const transactions = await this.db.getAll("transactions");
    const certificates = await this.db.getAll("certificates");
    const settings = await this.db.getAll("settings");

    return {
      outputs,
      transactions,
      certificates,
      settings,
    };
  }

  // Import wallet data
  async importData(data: {
    outputs?: WalletOutput[];
    transactions?: WalletTransaction[];
    certificates?: WalletCertificate[];
    settings?: Array<{
      key: string;
      value: string | number | boolean | Record<string, unknown>;
    }>;
  }): Promise<void> {
    if (!this.db) throw new Error("Storage not initialized");

    // Clear existing data
    await this.clear();

    // Import outputs
    if (data.outputs) {
      for (const output of data.outputs) {
        await this.db.put("outputs", output);
      }
    }

    // Import transactions
    if (data.transactions) {
      for (const tx of data.transactions) {
        await this.db.put("transactions", tx);
      }
    }

    // Import certificates
    if (data.certificates) {
      for (const cert of data.certificates) {
        await this.db.put("certificates", cert);
      }
    }

    // Import settings
    if (data.settings) {
      for (const setting of data.settings) {
        await this.db.put("settings", setting);
      }
    }
  }
}
