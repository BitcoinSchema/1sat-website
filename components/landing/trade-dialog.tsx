import { ArrowRightLeft, CheckCircle2, Lock, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SigmaAvatar from "sigma-avatars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import { InventoryItem, InventorySelector } from "./inventory-selector";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerAddress: string;
  peerLabel: string;
}

// Re-use logic from InventoryItem but add UI specific needs if any
type TradeSlot = InventoryItem;

export function TradeDialog({ open, onOpenChange, peerAddress, peerLabel }: TradeDialogProps) {
  const [myLocked, setMyLocked] = useState(false);
  const [peerLocked, setPeerLocked] = useState(false);
  const [myItems, setMyItems] = useState<TradeSlot[]>([]);
  const [peerItems, _setPeerItems] = useState<TradeSlot[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const { isInitialized } = useWalletToolbox();

  // Check if peer has a wallet address (starts with 1)
  const isPeerWallet = peerAddress.startsWith("1");

  const handleAddItem = (item: InventoryItem) => {
    // Add item from inventory selector
    const newItem: TradeSlot = {
      id: item.id,
      name: item.name,
      type: item.type,
      image: item.image,
      amount: item.amount,
      data: item.data,
      utxo: item.utxo,
    };
    setMyItems([...myItems, newItem]);
  };

  const handleLock = () => {
    setMyLocked(!myLocked);
    // Simulate peer locking after a delay
    if (!myLocked) {
      setTimeout(() => setPeerLocked(true), 2000);
    } else {
      setPeerLocked(false);
    }
  };

  const tradeStatus = myLocked && peerLocked ? "Ready to Swap" : "Negotiating";

  return (
    <>
      <InventorySelector
        open={showInventory}
        onOpenChange={setShowInventory}
        onSelect={handleAddItem}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden border shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/40 pr-12">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                P2P Trade Session
              </DialogTitle>
              <Badge
                variant={myLocked && peerLocked ? "default" : "secondary"}
                className="ml-4"
              >
                {tradeStatus}
              </Badge>
            </div>
            <DialogDescription className="flex items-center gap-3">
              <span>Trading with</span>
              {isPeerWallet && (
                <span className="w-6 h-6 rounded-full overflow-hidden border border-primary/20 inline-flex">
                  <SigmaAvatar
                    name={peerAddress}
                    colors={["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]}
                    className="h-full w-full"
                  />
                </span>
              )}
              <span className="font-mono text-primary font-bold">
                {peerLabel}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-2 divide-x bg-background">
            {/* My Side */}
            <div
              className={`p-4 flex flex-col gap-4 transition-colors ${myLocked ? "bg-muted/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  You
                </span>
                {myLocked && <Lock className="w-4 h-4 text-primary" />}
              </div>

              <div className="flex-1 border-2 border-dashed rounded-lg p-4 gap-2 grid grid-cols-2 content-start overflow-y-auto min-h-[300px] bg-muted/20">
                {myItems.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center text-muted-foreground h-full gap-2">
                    <p className="text-sm">Your Inventory</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInventory(true)}
                      disabled={myLocked || !isInitialized}
                      className="border-dashed"
                    >
                      {isInitialized ? "+ Add Item" : "Loading Wallet..."}
                    </Button>
                  </div>
                )}
                {myItems.map((item) => (
                  <Card
                    key={item.id}
                    className="relative overflow-hidden group border-muted-foreground/20"
                  >
                    <CardContent className="p-2">
                      <div className="aspect-square bg-black/5 dark:bg-white/5 rounded-md mb-2 overflow-hidden relative flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-2xl font-bold p-4 text-center">
                            {item.name.split(' ').pop()?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <Badge variant="secondary" className="text-[10px] h-4 mt-1">
                        {item.type}
                      </Badge>
                    </CardContent>
                    {!myLocked && (
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          setMyItems(myItems.filter((i) => i.id !== item.id));
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </Card>
                ))}

                {/* Add Item Button (Small) if items exist */}
                {myItems.length > 0 && !myLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInventory(true)}
                    disabled={!isInitialized}
                    className="col-span-2 border border-dashed h-12 text-muted-foreground hover:text-foreground"
                  >
                    + Add Another Item
                  </Button>
                )}
              </div>
            </div>

            {/* Peer Side */}
            <div
              className={`p-4 flex flex-col gap-4 transition-colors ${peerLocked ? "bg-muted/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPeerWallet && (
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20">
                      <SigmaAvatar
                        name={peerAddress}
                        colors={["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]}
                        className="h-full w-full"
                      />
                    </div>
                  )}
                  <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    {peerLabel}
                  </span>
                </div>
                {peerLocked ? (
                  <Lock className="w-4 h-4 text-primary" />
                ) : (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Thinking...
                  </span>
                )}
              </div>
              <div className="flex-1 border-2 border-dashed rounded-lg p-4 gap-2 grid grid-cols-2 content-start overflow-y-auto min-h-[300px] bg-muted/20">
                {peerItems.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center text-muted-foreground h-full">
                    <p className="text-sm">Waiting for peer...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-muted/40 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {myLocked
                ? "Unlock to modify your offer"
                : "Lock your offer to proceed"}
            </div>
            <div className="flex gap-2">
              <Button
                variant={myLocked ? "outline" : "secondary"}
                onClick={() => handleLock()}
                className={
                  myLocked
                    ? "border-destructive/50 text-destructive hover:text-destructive"
                    : ""
                }
              >
                {myLocked ? "Unlock Offer" : "Lock Offer"}
              </Button>
              <Button
                disabled={!myLocked || !peerLocked}
                variant="default"
                className="shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Swap
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
