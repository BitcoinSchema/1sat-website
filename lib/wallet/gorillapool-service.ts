"use client";

export interface Ordinal {
  txid: string;
  vout: number;
  outpoint?: string;
  satoshis: number;
  script: string;
  owner: string;
  origin?: {
    outpoint?: string;
    data?: {
      insc?: any;
      bsv20?: any;
      bsv21?: any;
      map?: any;
    };
  };
  data?: any;
}

export interface CategorizedUtxos {
  ordinals: Ordinal[];
  bsv20Tokens: Ordinal[];
  bsv21Tokens: Ordinal[];
  funding: Ordinal[];
}

export class GorillaPoolService {
  private baseUrl = "https://ordinals.gorillapool.io/api";

  /**
   * Get all unspent outputs for an address
   */
  async getUnspentOutputs(address: string, limit = 1000): Promise<Ordinal[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/txos/address/${address}/unspent?limit=${limit}`,
      );
      if (!response.ok) {
        console.error(
          `GorillaPool fetch failed: ${response.status} ${response.statusText}`,
        );
        return [];
      }
      const data = await response.json();
      return Array.isArray(data)
        ? data.map((item: any) => ({
          ...item,
          outpoint: item.outpoint || `${item.txid}_${item.vout}`,
          owner: address,
        }))
        : [];
    } catch (error) {
      console.error("GorillaPool fetch failed:", error);
      return [];
    }
  }

  /**
   * Categorize UTXOs into ordinals, tokens, and funding
   * Uses origin.data to determine if an output is a token
   */
  categorizeUtxos(utxos: Ordinal[]): CategorizedUtxos {
    const ordinals: Ordinal[] = [];
    const bsv20Tokens: Ordinal[] = [];
    const bsv21Tokens: Ordinal[] = [];
    const funding: Ordinal[] = [];

    for (const utxo of utxos) {
      const origin = utxo.origin;
      const originData = origin?.data;

      // Check if it's a BSV21 token (has bsv21 data)
      if (originData?.bsv21) {
        bsv21Tokens.push(utxo);
      }
      // Check if it's a BSV20 token (has bsv20 data but not bsv21)
      else if (originData?.bsv20) {
        bsv20Tokens.push(utxo);
      }
      // Check if it's an ordinal (has inscription data)
      else if (originData?.insc || origin?.outpoint) {
        ordinals.push(utxo);
      }
      // Otherwise it's a funding UTXO
      else {
        funding.push(utxo);
      }
    }

    return { ordinals, bsv20Tokens, bsv21Tokens, funding };
  }

  /**
   * Get categorized UTXOs for an address
   */
  async getCategorizedUtxos(address: string): Promise<CategorizedUtxos> {
    const utxos = await this.getUnspentOutputs(address);
    const categorized = this.categorizeUtxos(utxos);

    console.log(
      `[GorillaPool] Address ${address.slice(0, 8)}...: ` +
      `${categorized.ordinals.length} ordinals, ` +
      `${categorized.bsv20Tokens.length} BSV20, ` +
      `${categorized.bsv21Tokens.length} BSV21, ` +
      `${categorized.funding.length} funding`,
    );

    return categorized;
  }

  /**
   * Legacy method - get all ordinals (excluding tokens)
   */
  async getOrdinals(address: string): Promise<Ordinal[]> {
    const categorized = await this.getCategorizedUtxos(address);
    return categorized.ordinals;
  }

  /**
   * Get BSV20 tokens
   */
  async getBsv20Tokens(address: string): Promise<Ordinal[]> {
    const categorized = await this.getCategorizedUtxos(address);
    return categorized.bsv20Tokens;
  }

  /**
   * Get BSV21 tokens
   */
  async getBsv21Tokens(address: string): Promise<Ordinal[]> {
    const categorized = await this.getCategorizedUtxos(address);
    return categorized.bsv21Tokens;
  }
}
