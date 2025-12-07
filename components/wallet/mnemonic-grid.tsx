import { Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { bip39words } from "@/lib/bip39words";
import {
	AYM_ORD_PATH,
	AYM_WALLET_PATH,
	findKeysFromMnemonic,
	getKeysFromMnemonicAndPaths,
	RELAYX_ID_PATH,
	RELAYX_ORD_PATH,
	RELAYX_WALLET_PATH,
	TWETCH_WALLET_PATH,
	YOURS_ID_PATH,
	YOURS_ORD_PATH,
	YOURS_WALLET_PATH,
} from "@/lib/keys";
import type { Keys } from "@/lib/types";

interface MnemonicGridProps {
	onSubmit?: (keys: Keys) => void;
	mode?: "edit" | "view";
	mnemonic?: string;
}

export function MnemonicGrid({
	onSubmit,
	mode = "edit",
	mnemonic,
}: MnemonicGridProps) {
	const [inputMnemonic, setInputMnemonic] = useState<string[]>(
		mnemonic ? mnemonic.split(" ") : Array(12).fill(""),
	);

	useEffect(() => {
		if (mnemonic) {
			setInputMnemonic(mnemonic.split(" "));
		}
	}, [mnemonic]);

	const [processing, setProcessing] = useState(false);
	const [useCustomPaths, setUseCustomPaths] = useState(false);
	const [ready, setReady] = useState(false);
	const [pendingPaths, setPendingPaths] = useState<
		| {
				changeAddressPath: string;
				ordAddressPath: string;
				identityAddressPath?: string;
		  }
		| undefined
	>();

	// Handle pasting logic from original
	const handlePaste = (e: React.ClipboardEvent, startIndex: number) => {
		if (mode === "view") return;
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text");
		const words = pastedData
			.trim()
			.split(/\s+/)
			.map((w) => w.toLowerCase());

		if (words.length > 0) {
			setInputMnemonic((prev) => {
				const newMnemonic = [...prev];
				words.forEach((word, i) => {
					if (startIndex + i < 12) {
						newMnemonic[startIndex + i] = word;
					}
				});
				return newMnemonic;
			});
		}
	};

	const handleWordChange = (index: number, value: string) => {
		if (mode === "view") return;
		const newMnemonic = [...inputMnemonic];
		newMnemonic[index] = value.trim().toLowerCase();
		setInputMnemonic(newMnemonic);
	};

	const toggleCustomPaths = () => {
		setUseCustomPaths(!useCustomPaths);
		setReady(!useCustomPaths);
	};

	// Effect to process mnemonic automatically if valid and not using custom paths (only in edit mode)
	useEffect(() => {
		const process = async () => {
			const phrase = inputMnemonic.join(" ");
			if (inputMnemonic.some((w) => !w)) return;

			setProcessing(true);
			try {
				const keys = await findKeysFromMnemonic(phrase);
				if (keys.ordAddressPath !== undefined) {
					setPendingPaths({
						changeAddressPath: (keys.changeAddressPath as string) || "m/0",
						ordAddressPath: keys.ordAddressPath as string,
					});
				}
			} catch (e) {
				console.error(e);
			} finally {
				setProcessing(false);
			}
		};

		if (
			ready &&
			!useCustomPaths &&
			!processing &&
			!pendingPaths &&
			inputMnemonic.every((w) => !!w)
		) {
			process();
		}
	}, [inputMnemonic, ready, useCustomPaths, processing, pendingPaths]);

	const isValid =
		inputMnemonic.every((w) => bip39words.includes(w)) &&
		inputMnemonic.length === 12;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
				{inputMnemonic.map((word, index) => (
					<div key={`word-input-${index}-${word}`} className="relative">
						<span className="absolute left-2 top-2.5 text-xs text-muted-foreground select-none">
							{index + 1}.
						</span>
						<Input
							value={word}
							onChange={(e) => handleWordChange(index, e.target.value)}
							onPaste={(e) => handlePaste(e, index)}
							readOnly={mode === "view"}
							className={`pl-8 font-mono ${
								!bip39words.includes(word) && word && mode === "edit"
									? "border-destructive focus-visible:ring-destructive"
									: ""
							}`}
						/>
					</div>
				))}
			</div>

			{mode === "edit" && (
				<div className="flex items-center justify-between my-4">
					<div className="flex items-start flex-col gap-1">
						{!useCustomPaths && (
							<div className="text-sm text-muted-foreground font-mono">
								Payment Path: m/0
							</div>
						)}
						{!useCustomPaths && (
							<div className="text-sm text-muted-foreground font-mono flex items-center">
								Ordinals Path:{" "}
								{processing ? (
									<Loader2 className="h-3 w-3 animate-spin ml-2" />
								) : (
									pendingPaths?.ordAddressPath
								)}
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Label htmlFor="custom-deriv">Custom Derivation</Label>
						<Switch
							id="custom-deriv"
							checked={useCustomPaths}
							onCheckedChange={toggleCustomPaths}
						/>
					</div>
				</div>
			)}

			{useCustomPaths && mode === "edit" && (
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setPendingPaths(undefined);
								toggleCustomPaths();
							}}
						>
							1Sat
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPendingPaths({
									changeAddressPath: RELAYX_WALLET_PATH,
									ordAddressPath: RELAYX_ORD_PATH,
									identityAddressPath: RELAYX_ID_PATH,
								})
							}
						>
							RelayX
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPendingPaths({
									changeAddressPath: YOURS_WALLET_PATH,
									ordAddressPath: YOURS_ORD_PATH,
									identityAddressPath: YOURS_ID_PATH,
								})
							}
						>
							Yours
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPendingPaths({
									changeAddressPath: TWETCH_WALLET_PATH,
									ordAddressPath: YOURS_ORD_PATH,
								})
							}
						>
							Twetch
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPendingPaths({
									changeAddressPath: AYM_WALLET_PATH,
									ordAddressPath: AYM_ORD_PATH,
									identityAddressPath: AYM_ORD_PATH,
								})
							}
						>
							Aym
						</Button>
					</div>
					<div className="grid gap-2">
						<Input
							placeholder={`Payment Path ${pendingPaths?.changeAddressPath || "m/0"}`}
							value={pendingPaths?.changeAddressPath || ""}
							onChange={(e) =>
								setPendingPaths((prev) => ({
									...prev!,
									changeAddressPath: e.target.value,
									ordAddressPath: prev?.ordAddressPath || "",
								}))
							}
						/>
						<Input
							placeholder={`Ordinals Path ${pendingPaths?.ordAddressPath || "m/0/0"}`}
							value={pendingPaths?.ordAddressPath || ""}
							onChange={(e) =>
								setPendingPaths((prev) => ({
									...prev!,
									ordAddressPath: e.target.value,
									changeAddressPath: prev?.changeAddressPath || "",
								}))
							}
						/>
					</div>
				</div>
			)}

			{onSubmit && (
				<div className="flex justify-end mt-4">
					<Button
						disabled={
							!isValid || processing || (!pendingPaths && !useCustomPaths)
						}
						onClick={() => {
							if (!onSubmit) return;
							if (!pendingPaths) {
								if (!useCustomPaths) setReady(true);
								return;
							}
							const keys = getKeysFromMnemonicAndPaths(
								inputMnemonic.join(" "),
								{
									changeAddressPath: pendingPaths.changeAddressPath,
									ordAddressPath: pendingPaths.ordAddressPath,
									identityAddressPath: pendingPaths.identityAddressPath,
								},
							);
							onSubmit(keys);
						}}
					>
						Next
					</Button>
				</div>
			)}

			{inputMnemonic.some((w) => w) && mode === "edit" && (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => {
							setInputMnemonic(Array(12).fill(""));
							setPendingPaths(undefined);
							setProcessing(false);
						}}
					>
						<RotateCcw className="mr-2 h-4 w-4" /> Start Over
					</Button>
				</div>
			)}
		</div>
	);
}
