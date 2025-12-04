"use client";

import { useQuery } from "@tanstack/react-query";
import { MARKET_API_HOST } from "@/constants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type StatusResponse = {
  exchangeRate: number;
  chainInfo: {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    mediantime: number;
    verificationprogress: number;
  };
  indexers: {
    lastBlock: number;
    lastBlockTime: string;
  };
};

async function fetchStatus(): Promise<{ api: boolean; data?: StatusResponse }> {
  try {
    const res = await fetch(`${MARKET_API_HOST}/status`, { 
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return { api: false };
    const data = await res.json() as StatusResponse;
    return { api: true, data };
  } catch {
    return { api: false };
  }
}

export default function StatusIndicator() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["system-status"],
    queryFn: fetchStatus,
    refetchInterval: 60000, // Check every minute
    staleTime: 30000,
  });

  const isOnline = data?.api ?? false;
  const statusData = data?.data;
  const chain = statusData?.chainInfo;
  const indexers = statusData?.indexers;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
          aria-label="System status"
        >
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              isLoading ? "bg-muted-foreground animate-pulse" :
              isOnline ? "bg-primary" : "bg-destructive"
            }`} 
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
            {isLoading ? "..." : isOnline ? "OK" : "ERR"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-64 p-3 font-mono text-xs"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground uppercase tracking-wider">API</span>
            <span className={isOnline ? "text-primary" : "text-destructive"}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          
          {chain && (
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">BLOCK</span>
                <span className="text-foreground">{chain.blocks.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">CHAIN</span>
                <span className="text-foreground uppercase">{chain.chain}</span>
              </div>
                {chain.verificationprogress != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground uppercase tracking-wider">SYNC</span>
                    <span className="text-foreground">
                      {(chain.verificationprogress * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
            </div>
          )}

          {indexers?.lastBlock && (
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">INDEXER</span>
                <span className="text-foreground">{indexers.lastBlock.toLocaleString()}</span>
              </div>
            </div>
          )}

          {statusData?.exchangeRate && (
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">BSV/USD</span>
                <span className="text-foreground">${statusData.exchangeRate.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div className="border-t border-border pt-2 text-[9px] text-muted-foreground">
            Updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

