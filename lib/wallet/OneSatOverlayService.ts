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

import { Transaction } from "@bsv/sdk";
import type { TransactionParser } from "../indexers/TransactionParser";

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
        console.log(`[OneSatOverlay] Account ${this.accountName} registered with owners:`, this.owners);
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
      const total = typeof data === "number" ? data : (data.confirmed || 0) + (data.unconfirmed || 0);

      return {
        confirmed: typeof data === "number" ? data : (data.confirmed || 0),
        unconfirmed: typeof data === "number" ? 0 : (data.unconfirmed || 0),
        total,
      };
    } catch (error) {
      console.error("[OneSatOverlay] Balance error:", error);
      return null;
    }
  }

  /**
   * Fetch unspent TXOs from overlay
   */
  async getUnspentTxos(options?: {
    tags?: string;
    limit?: number;
    includeScript?: boolean;
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
      if (options?.includeScript) {
        url.searchParams.set("script", "true");
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
   * Get ordinals (outputs with origin tag)
   */
  async getOrdinals(limit = 100): Promise<OneSatTxo[]> {
    // Fetch outputs with origin tag (ordinals)
    // Parse outpoint to get txid and vout
    const txos = await this.getUnspentTxos({
      tags: "origin",
      limit,
      includeScript: true,
    });

    // Parse outpoint into txid/vout for each
    return txos.map(txo => {
      const [txid, voutStr] = txo.outpoint.split("_");
      return {
        ...txo,
        txid,
        vout: parseInt(voutStr, 10),
      };
    });
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
      .filter(txo => (txo.satoshis ?? 0) > 1)
      .map(txo => {
        const [txid, voutStr] = txo.outpoint.split("_");
        return {
          ...txo,
          txid,
          vout: parseInt(voutStr, 10),
        };
      });
  }

  /**
   * Sync all UTXOs into wallet-toolbox
   * This fetches from overlay and ingests into local storage
   */
  async syncToWallet(wallet: any): Promise<{ balance: number; ordinalsCount: number }> {
    // Refresh and get balance
    const balance = await this.getBalance(true);

    // Get all ordinals
    const ordinals = await this.getOrdinals();

    console.log(`[OneSatOverlay] Synced: ${balance?.total || 0} sats, ${ordinals.length} ordinals`);

    // TODO: Actually ingest into wallet-toolbox via internalizeAction
    // This requires building BEEF envelopes for each UTXO

    return {
      balance: balance?.total || 0,
      ordinalsCount: ordinals.length,
    };
  }
}
