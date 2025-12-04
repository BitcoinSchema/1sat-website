import { API_HOST } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignals } from "@preact/signals-react/runtime";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import WalletTabs, { WalletTab } from "./tabs";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WalletHistoryProps {
  address?: string | undefined;
}

const WalletHistory: React.FC<WalletHistoryProps> = ({
  address: addressProp,
}) => {
  useSignals();

  const ordAddressMemo = useMemo(() => ordAddress.value, [ordAddress.value]);
  const {
    data: bsv20History,
    isLoading: isLoadingBsv20History,
    isError: isBsv20HistoryError,
    error: bsv20Error,
  } = useQuery<OrdUtxo[]>({
    queryKey: ["history", addressProp, ordAddressMemo],
    queryFn: async () => {
      if (!addressProp && !ordAddressMemo) {
        return [] as OrdUtxo[];
      }
      const res = await fetch(
        `${API_HOST}/api/txos/address/${addressProp || ordAddressMemo
        }/history?bsv20=true`
      );
      const json = await res.json();
      return json as OrdUtxo[];
    },
  });

  const {
    data: history,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useQuery<OrdUtxo[]>({
    queryKey: ["history", addressProp, ordAddressMemo],
    queryFn: async () => {
      if (!addressProp && !ordAddressMemo) {
        return [] as OrdUtxo[];
      }
      const res = await fetch(
        `${API_HOST}/api/txos/address/${addressProp || ordAddressMemo
        }/history`
      );
      const json = await res.json();
      return json as OrdUtxo[];
    },
  });

  if (isLoadingBsv20History || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBsv20HistoryError || isHistoryError) {
    return (
      <div className="flex items-center justify-center p-12 text-destructive">
        Error {bsv20Error?.message || historyError?.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl pb-12">
      <WalletTabs
        type={WalletTab.History}
        address={addressProp}
      />
      <div className="space-y-8">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono uppercase tracking-widest text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Txid</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Spend</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Origin</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4 text-right">Sats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((tx) => (
                  <TableRow key={tx.txid} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={tx.txid}>
                      {tx.txid}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={tx.spend}>
                      {tx.spend}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={
                          tx.origin?.outpoint
                            ? `/outpoint/${tx.origin.outpoint}`
                            : "#"
                        }
                        className="text-primary hover:underline truncate block max-w-[200px]"
                        title={tx.origin?.outpoint}
                      >
                        {tx.origin?.outpoint || "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      {tx.satoshis}
                    </TableCell>
                  </TableRow>
                ))}
                {(!history || history.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No transaction history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono uppercase tracking-widest text-lg">BSV20 History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Txid</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Spend</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4">Origin</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-1/4 text-right">Sats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bsv20History?.map((tx) => (
                  <TableRow key={tx.txid} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={tx.txid}>
                      {tx.txid}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={tx.spend}>
                      {tx.spend}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={
                          tx.origin?.outpoint
                            ? `/outpoint/${tx.origin.outpoint}`
                            : "#"
                        }
                        className="text-primary hover:underline truncate block max-w-[200px]"
                        title={tx.origin?.outpoint}
                      >
                        {tx.origin?.outpoint || "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      {tx.satoshis}
                    </TableCell>
                  </TableRow>
                ))}
                {(!bsv20History || bsv20History.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No BSV20 history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletHistory;
