"use client";

/**
 * TokenGrid - Displays BSV20/BSV21 tokens in a list format
 */

import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";
import { ORDFS } from "@/lib/constants";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import { Loader2, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSound } from "@/hooks/use-sound";

interface TokenCardProps {
  outpoint: string;
  txid: string;
  vout: number;
  data?: any;
  type: "bsv20" | "bsv21";
}

function TokenCard({ outpoint, txid, data, type }: TokenCardProps) {
  const { play } = useSound();
  const imageUrl = `${ORDFS}/${outpoint}`;

  // Extract token info from data
  const tokenInfo = data?.bsv20?.data || data?.bsv21?.data || data || {};
  const ticker = tokenInfo.tick || tokenInfo.sym || "Unknown";
  const amount = tokenInfo.amt ? BigInt(tokenInfo.amt).toString() : "0";
  const decimals = tokenInfo.dec || 0;
  const tokenId = tokenInfo.id || outpoint;

  // Format amount with decimals
  const formatAmount = (amt: string, dec: number) => {
    if (dec === 0) return amt;
    const padded = amt.padStart(dec + 1, "0");
    const intPart = padded.slice(0, -dec) || "0";
    const decPart = padded.slice(-dec);
    return `${intPart}.${decPart}`;
  };

  return (
    <Link
      href={`/outpoint/${outpoint}/timeline`}
      className="group flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
      onClick={() => play("click")}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={getOrdinalThumbnail(outpoint, 100)}
          alt={ticker}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{ticker}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {type}
          </span>
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {formatAmount(amount, decimals)} tokens
        </div>
      </div>
      <div className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
        {txid.slice(0, 8)}...
      </div>
    </Link>
  );
}

interface TokenGridProps {
  type: "bsv20" | "bsv21";
  className?: string;
}

export default function TokenGrid({ type, className = "" }: TokenGridProps) {
  const { bsv20Tokens, bsv21Tokens, isInitialized, isInitializing } = useWalletToolbox();

  const tokens = type === "bsv20" ? bsv20Tokens : bsv21Tokens;
  const typeName = type.toUpperCase();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading wallet...</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please unlock or create a wallet to view your {typeName} tokens.
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Coins className="w-12 h-12 mb-4 opacity-50" />
        <p>No {typeName} tokens found in your wallet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {tokens.length} {typeName} Token{tokens.length !== 1 ? "s" : ""}
        </h3>
      </div>
      <div className="space-y-2">
        {tokens.map((token) => (
          <TokenCard
            key={token.outpoint}
            outpoint={token.outpoint}
            txid={token.txid}
            vout={token.vout}
            data={token.data}
            type={type}
          />
        ))}
      </div>
    </div>
  );
}
