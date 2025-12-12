"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
	SoundDialog,
} from "@/components/ui/sound-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import type { TradeItem } from "@/lib/types/trades";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface InventorySelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (item: TradeItem) => void;
}

export function InventorySelector({
	open,
	onOpenChange,
	onSelect,
}: InventorySelectorProps) {
	const { ordinals, bsv21Tokens, isInitialized } = useWalletToolbox();
	const [search, setSearch] = useState("");

	const filteredOrdinals = ordinals.filter((o) => {
		if (!search) return true;
		const itemData = o.origin?.data;
		const name = `Ordinal #${itemData?.insc?.num || o.txid.slice(0, 8)}`;
		return name.toLowerCase().includes(search.toLowerCase());
	});

	const filteredTokens = bsv21Tokens.filter((t) => {
		if (!search) return true;
		const name =
			t.data?.bsv20?.tick || t.data?.bsv20?.sym || t.txid.slice(0, 8);
		return name.toLowerCase().includes(search.toLowerCase());
	});

	return (
		<SoundDialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden">
				<DialogHeader className="p-6 border-b">
					<DialogTitle>Select Item for Trade</DialogTitle>
					<div className="relative mt-4">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search items..."
							className="pl-8"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					<Tabs defaultValue="ordinals" className="h-full flex flex-col">
						<div className="px-6 pt-4">
							<TabsList className="w-full justify-start">
								<TabsTrigger value="ordinals" className="flex-1 max-w-[200px]">
									Ordinals ({filteredOrdinals.length})
								</TabsTrigger>
								<TabsTrigger value="tokens" className="flex-1 max-w-[200px]">
									Tokens ({filteredTokens.length})
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent
							value="ordinals"
							className="flex-1 overflow-y-auto p-6"
						>
							{!isInitialized && (
								<div className="text-center py-10 text-muted-foreground">
									Wallet loading...
								</div>
							)}
							{isInitialized && filteredOrdinals.length === 0 && (
								<div className="text-center py-10 text-muted-foreground">
									No ordinals found
								</div>
							)}
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{filteredOrdinals.map((item) => {
									const outpoint = `${item.txid}_${item.vout}`;
									const itemData = item.origin?.data;
									const num = itemData?.insc?.num;
									const name = num
										? `Inscription #${num}`
										: `Ordinal ${item.txid.slice(0, 4)}...${item.txid.slice(-4)}`;
									const type = itemData?.insc?.file?.type || "Unknown";
									const image = getOrdinalThumbnail(outpoint, 200);

									return (
										<button
											type="button"
											key={outpoint}
											className="border rounded-lg overflow-hidden hover:border-primary cursor-pointer transition-colors bg-card text-left"
											onClick={() => {
												onSelect({
													id: outpoint,
													name,
													type: "ordinal",
													image,
													data: item.origin?.data,
													utxo: {
														txid: item.txid,
														vout: item.vout,
														satoshis: item.satoshis,
													},
												});
												onOpenChange(false);
											}}
										>
											<div className="aspect-square relative bg-muted/20">
												{type.startsWith("image") ? (
													<Image
														src={image}
														alt={name}
														fill
														className="object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center break-all">
														{type}
													</div>
												)}
											</div>
											<div className="p-3">
												<div className="font-medium text-sm truncate">
													{name}
												</div>
												<div className="text-xs text-muted-foreground mt-1 truncate">
													{type}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						</TabsContent>

						<TabsContent value="tokens" className="flex-1 overflow-y-auto p-6">
							{!isInitialized && (
								<div className="text-center py-10 text-muted-foreground">
									Wallet loading...
								</div>
							)}
							{isInitialized && filteredTokens.length === 0 && (
								<div className="text-center py-10 text-muted-foreground">
									No tokens found
								</div>
							)}
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{filteredTokens.map((item) => {
									const outpoint = item.outpoint;
									const tick =
										item.data?.bsv20?.tick || item.data?.bsv20?.sym || "TOKEN";
									const amt = item.data?.bsv20?.amt || "0";

									return (
										<button
											type="button"
											key={outpoint}
											className="border rounded-lg overflow-hidden hover:border-primary cursor-pointer transition-colors bg-card text-left"
											onClick={() => {
												onSelect({
													id: outpoint,
													name: `${amt} ${tick}`,
													type: "bsv20",
													image: "", // Tokens might need specific icons
													amount: amt,
													data: item.data,
													utxo: {
														txid: item.txid,
														vout: item.vout,
														satoshis: 1, // Usually 1 sat for tokens
													},
												});
												onOpenChange(false);
											}}
										>
											<div className="aspect-square relative bg-muted/20 flex flex-col items-center justify-center p-4">
												<div className="text-2xl font-bold">{tick[0]}</div>
												<Badge
													variant="outline"
													className="mt-2 text-[10px] break-all max-w-full"
												>
													{tick}
												</Badge>
											</div>
											<div className="p-3">
												<div className="font-medium text-sm truncate">
													{amt} {tick}
												</div>
												<div className="text-xs text-muted-foreground mt-1 truncate">
													BSV-20
												</div>
											</div>
										</button>
									);
								})}
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</SoundDialog>
	);
}
