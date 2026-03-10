import { Check, Copy, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	onVerify?: (isValid: boolean) => void;
	mode?: "edit" | "view" | "prove" | "spot-check";
	mnemonic?: string;
}

export function MnemonicGrid({
	onSubmit,
	onVerify,
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

	// Copy to clipboard state (view mode)
	const [copied, setCopied] = useState(false);
	const copyMnemonic = useCallback(async () => {
		if (!mnemonic) return;
		await navigator.clipboard.writeText(mnemonic);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [mnemonic]);

	// Prove mode state
	const [proveInput, setProveInput] = useState<string[]>(Array(12).fill(""));
	const mnemonicSlots = useMemo(
		() => Array.from({ length: 12 }, (_, slot) => slot),
		[],
	);
	const shuffledWords = useMemo(() => {
		if (mode !== "prove" || !mnemonic) return [];
		const words = mnemonic.split(" ");
		const counts = new Map<string, number>();
		const items = words.map((word) => {
			const nextCount = (counts.get(word) ?? 0) + 1;
			counts.set(word, nextCount);
			return { word, id: `${word}-${nextCount}` };
		});
		for (let i = items.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[items[i], items[j]] = [items[j], items[i]];
		}
		return items;
	}, [mode, mnemonic]);

	// Spot-check mode state: pick 3 random positions
	const spotCheckIndices = useMemo(() => {
		if (mode !== "spot-check" || !mnemonic) return [];
		const indices: number[] = [];
		const pool = Array.from({ length: 12 }, (_, i) => i);
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		indices.push(...pool.slice(0, 3));
		indices.sort((a, b) => a - b);
		return indices;
	}, [mode, mnemonic]);

	const [spotCheckInput, setSpotCheckInput] = useState<Record<number, string>>(
		{},
	);

	// Verify spot-check mode input
	useEffect(() => {
		if (mode === "spot-check" && onVerify && mnemonic) {
			const words = mnemonic.split(" ");
			const allCorrect =
				spotCheckIndices.length === 3 &&
				spotCheckIndices.every(
					(idx) =>
						spotCheckInput[idx] !== undefined &&
						spotCheckInput[idx].toLowerCase().trim() === words[idx],
				);
			onVerify(allCorrect);
		}
	}, [mode, spotCheckInput, mnemonic, onVerify, spotCheckIndices]);

	// Verify prove mode input
	useEffect(() => {
		if (mode === "prove" && onVerify && mnemonic) {
			const mnemonicWords = mnemonic.split(" ");
			const isValid = proveInput.every((word, i) => word === mnemonicWords[i]);
			const allFilled = proveInput.every((w) => w !== "");
			onVerify(isValid && allFilled);
		}
	}, [mode, proveInput, mnemonic, onVerify]);

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
			{mode === "spot-check" ? (
				<div className="flex flex-col gap-3">
					{spotCheckIndices.map((idx) => {
						const words = mnemonic?.split(" ") ?? [];
						const isCorrect =
							spotCheckInput[idx]?.toLowerCase().trim() === words[idx];
						const hasInput =
							spotCheckInput[idx] !== undefined && spotCheckInput[idx] !== "";
						return (
							<div key={`spot-${idx}`} className="flex items-center gap-3">
								<span className="text-sm text-muted-foreground w-24 shrink-0 text-right">
									Word #{idx + 1}
								</span>
								<Input
									value={spotCheckInput[idx] ?? ""}
									onChange={(e) =>
										setSpotCheckInput((prev) => ({
											...prev,
											[idx]: e.target.value,
										}))
									}
									placeholder={`Enter word #${idx + 1}`}
									className={`font-mono max-w-48 ${
										hasInput
											? isCorrect
												? "border-green-600 focus-visible:ring-green-600/50"
												: "border-destructive focus-visible:ring-destructive/50"
											: ""
									}`}
									autoComplete="off"
									spellCheck={false}
								/>
								{hasInput && isCorrect && (
									<Check className="h-4 w-4 text-green-600 shrink-0" />
								)}
							</div>
						);
					})}
				</div>
			) : mode === "prove" ? (
				<>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
						{mnemonicSlots.map((slot) => {
							const word = proveInput[slot];
							return (
								<div key={`prove-slot-${slot}`} className="relative">
									<span className="absolute left-2 top-2.5 text-xs text-muted-foreground select-none">
										{slot + 1}.
									</span>
									<div
										className={`pl-8 font-mono h-10 flex items-center rounded-md border ${
											word ? "bg-muted" : "bg-background border-dashed"
										}`}
									>
										{word || (
											<span className="text-muted-foreground">Select word</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
					<div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/50 rounded-lg">
						{shuffledWords.map(({ word, id }) => {
							const isUsed = proveInput.includes(word);
							return (
								<Button
									key={id}
									variant="outline"
									size="sm"
									disabled={isUsed}
									className={isUsed ? "opacity-50" : ""}
									onClick={() => {
										const firstEmpty = proveInput.indexOf("");
										if (firstEmpty !== -1) {
											setProveInput((prev) => {
												const next = [...prev];
												next[firstEmpty] = word;
												return next;
											});
										}
									}}
								>
									{word}
								</Button>
							);
						})}
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setProveInput(Array(12).fill(""))}
					>
						<RotateCcw className="mr-2 h-4 w-4" /> Start Over
					</Button>
				</>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
					{mnemonicSlots.map((slot) => {
						const word = inputMnemonic[slot] ?? "";
						return (
							<div key={`word-input-${slot}`} className="relative">
								<span className="absolute left-2 top-2.5 text-xs text-muted-foreground select-none">
									{slot + 1}.
								</span>
								<Input
									value={word}
									onChange={(e) => handleWordChange(slot, e.target.value)}
									onPaste={(e) => handlePaste(e, slot)}
									readOnly={mode === "view"}
									className={`pl-8 font-mono ${
										!bip39words.includes(word) && word && mode === "edit"
											? "border-destructive focus-visible:ring-destructive"
											: ""
									}`}
								/>
							</div>
						);
					})}
				</div>
			)}

			{mode === "view" && mnemonic && (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground"
						onClick={copyMnemonic}
					>
						{copied ? (
							<Check className="mr-2 h-4 w-4" />
						) : (
							<Copy className="mr-2 h-4 w-4" />
						)}
						{copied ? "Copied" : "Copy to clipboard"}
					</Button>
				</div>
			)}

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
								setPendingPaths((prev) => {
									const base = prev ?? {
										changeAddressPath: "",
										ordAddressPath: "",
									};
									return {
										...base,
										changeAddressPath: e.target.value,
									};
								})
							}
						/>
						<Input
							placeholder={`Ordinals Path ${pendingPaths?.ordAddressPath || "m/0/0"}`}
							value={pendingPaths?.ordAddressPath || ""}
							onChange={(e) =>
								setPendingPaths((prev) => {
									const base = prev ?? {
										changeAddressPath: "",
										ordAddressPath: "",
									};
									return {
										...base,
										ordAddressPath: e.target.value,
									};
								})
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
