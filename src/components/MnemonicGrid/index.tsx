"use client";

import { bip39words } from "@/utils/bip39words";
import { head, isEqual, } from "lodash";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { RiRestartLine } from "react-icons/ri";
import Dropdown from "../dropdown/dropdown";
import toast from "react-hot-toast";
import { toastErrorProps } from "@/constants";
import {
  derivePathFromMnemonic,
	findKeysFromMnemonic,
	getKeysFromMnemonicAndPaths,
	type WalletKeys,
} from "@/utils/keys";
import { createWalletIterations, ordAddressPath } from "@/signals/wallet";
import { CgSpinner } from "react-icons/cg";
import { useSignals } from "@preact/signals-react/runtime";
import { Switch } from "@tremor/react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { sweepUtxos } from "@/utils/sweep";
import { PrivateKey } from "@bsv/sdk";
import { toBitcoin } from "satoshi-token";

export type MnemonicResult = {
	importedMnemonic?: string;
	verified?: boolean;
	words?: string[];
	keys?: WalletKeys;
};

interface MnemonicGridProps {
	mnemonic?: string;
	onWordClick?: (word: string) => void;
	onSubmit: (result: MnemonicResult) => void;
	mode: MnemonicGridMode;
}

export enum MnemonicGridMode {
	View = 0,
	Prove = 1,
	Import = 2,
}

const MnemonicGrid: React.FC<MnemonicGridProps> = ({
	mode,
	mnemonic,
	onWordClick,
	onSubmit,
}) => {
	useSignals();
	const [inputMnemonic, setInputMnemonic] = useState<string[]>(
		Array(12).fill(""),
	);
	const [shuffledWords, setShuffledWords] = useState<string[]>([]);
	const [clickedWords, setClickedWords] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [_suggestedWords, setSuggestedWords] = useState<string[]>([]);
	const [useCustomPaths, setUseCustomPaths] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

	const toggleCustomPaths = useCallback(() => {
    if (!useCustomPaths) {
      setReady(true);
    } else {
      setReady(false);
    }
		setUseCustomPaths(!useCustomPaths);
    
	}, [useCustomPaths]);

	const shuffle = useCallback(() => {
		const words = mnemonic?.split(" ") || [];
		const shuffled = [...words].sort(() => Math.random() - 0.5);
		setShuffledWords(shuffled);
	}, [setShuffledWords, mnemonic]);

	useEffect(() => {
		shuffle();
	}, [shuffle]);

	useEffect(() => {
		if (mode === MnemonicGridMode.Import && inputValue.trim() !== "") {
			setSuggestedWords(
				bip39words.filter((word: string) =>
					word.startsWith(inputValue.trim().toLowerCase()),
				),
			);
		} else {
			setSuggestedWords([]);
		}
	}, [inputValue, mode]);

	const _handleWordSelect = useCallback(
		(word: string) => {
			setClickedWords([...clickedWords, word]);
			setInputValue("");
			if (onSubmit) {
				onSubmit({ words: [...clickedWords, word] });
			}
		},
		[clickedWords, setClickedWords, setInputValue, onSubmit],
	);

	const handleClick = useCallback(
		(word: string) => {
			// set shuffled words item in position same as clicked word length to whatever this word is

			// swap the clicked word with the correct position in shuffledWords
			const newShuffledWords = [...shuffledWords];
			const clickedIndex = shuffledWords.indexOf(word);
			const newClickedWords = [...clickedWords, word];
			const positionWord = shuffledWords[newClickedWords.length - 1];
			newShuffledWords[clickedWords.length] = word;
			newShuffledWords[clickedIndex] = positionWord;
			setShuffledWords(newShuffledWords);

			// check if we're done
			if (newClickedWords.length === 11) {
				// "click" the last word
				const lastWord = head(
					shuffledWords.filter((w) => !newClickedWords.includes(w)),
				);
				// Fill in the last word for the user
				if (!isEqual([...newClickedWords, lastWord], mnemonic?.split(" "))) {
					setClickedWords([]);
					const words = mnemonic?.split(" ");
					const shuffled = [...(words || [])].sort(() => Math.random() - 0.5);
					setShuffledWords(shuffled);
					onSubmit({ verified: false });
				} else {
					onSubmit({ verified: true });
					return;
				}
				// clear word count
				if (onWordClick) {
					onWordClick("reset");
				}
				return;
			}

			// update word lists
			setClickedWords(newClickedWords);
			if (onWordClick) {
				onWordClick(word);
			}
		},
		[
			mnemonic,
			onSubmit,
			setClickedWords,
			clickedWords,
			shuffledWords,
			onWordClick,
			setShuffledWords,
		],
	);

	const handleSelectInputMnemonicWord =
		(index: number) => (word: string | null) => {
			setInputMnemonic((mnemonic) => {
				const newMnemonic = [...mnemonic];
				newMnemonic[index] = word || "";
				return newMnemonic;
			});
		};

	const handlePasteMnemonic = (pastedData: string) => {
		const words = pastedData.split(" ").map((word) => word.trim());

		if (words.length !== 12) {
			return;
		}

		if (!words.every((word) => bip39words.includes(word.toLowerCase()))) {
			toast.error("Invalid mnemonic words", toastErrorProps);
			return;
		}

		setInputMnemonic(words);
	};

	const [pendingPaths, setPendingPaths] = useState<{
		changeAddressPath: string;
		ordAddressPath: string;
		identityAddressPath?: string;
	}>();

	const [processing, setProcessing] = useState<boolean>(false);

	useEffect(() => {
		const processMnemonic = async () => {
			const phrase = inputMnemonic.join(" ");
			if (inputMnemonic.some((word) => !word)) {
				console.log("Invalid mnemonic length");
				return;
			}
			console.log("Processing mnemonic", inputMnemonic);
			setProcessing(true);
			await findKeysFromMnemonic(phrase).then((keys) => {
				const { ordAddressPath } = keys;
				if (!ordAddressPath) {
					console.log("Invalid mnemonic");
					setProcessing(false);
					return;
				}
				console.log("Found ord path", ordAddressPath);
				setProcessing(false);
				setPendingPaths({
          ordAddressPath: keys.ordAddressPath as string,
          changeAddressPath: keys.changeAddressPath as string,
        });
			});
		};

		if (
      ready &&
			!useCustomPaths &&
			!processing &&
			!pendingPaths &&
			mode === MnemonicGridMode.Import &&
			inputMnemonic.every((word) => !!word)
		) {
      console.log("Processing mnemonic");
			processMnemonic();
		}
	}, [inputMnemonic, mode, ready, pendingPaths, processing, useCustomPaths]);

	return (
		<div className="transition mt-4 mx-auto rounded w-full text-foreground">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
				{mode === MnemonicGridMode.Import && (
					inputMnemonic.map((word, index) => (
							<Dropdown
								key={`mnemonic-word-${index}`}
								items={bip39words}
								selectedItem={word}
								onChange={handleSelectInputMnemonicWord(index)}
								placeholder={`Word ${index + 1}`}
								onPaste={handlePasteMnemonic}
							/>
						))
				)}
				{(mode === MnemonicGridMode.Prove
					? shuffledWords
					: mnemonic?.split(" ")
				)?.map((w, i) => {
					return (
						<div
							key={i}
							className={`select-none inline-flex p-2 rounded bg-card border border-border ${
								mode === MnemonicGridMode.Prove
									? clickedWords.includes(w)
										? ""
										: "cursor-pointer hover:bg-muted"
									: ""
							} flex justify-between`}
							onClick={
								mode === MnemonicGridMode.Prove
									? () => handleClick(w)
									: undefined
							}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  mode === MnemonicGridMode.Prove
									? () => handleClick(w)
									: undefined                }
              }}
						>
							{mode !== MnemonicGridMode.Prove && (
								<span className={"text-muted-foreground mr-4"}>{i + 1}</span>
							)}{" "}
							<span
								className={`${
									clickedWords.includes(w) ? "text-muted-foreground" : ""
								} mr-4`}
							>
								{w}
							</span>
						</div>
					);
				})}
			</div>
			{mode === MnemonicGridMode.View && (
				<div className="w-full flex flex-col items-end mt-8 mb-2">
					<Button
						type="button"
						onClick={() => {
              onSubmit({ verified: true })
            }}
					>
						Next
					</Button>
				</div>
			)}
			{mode === MnemonicGridMode.Import && (
				<>
					<div className="text-sm text-muted-foreground my-4 flex items-start justify-between">
						<div className="flex items-start flex-col gap-1">
							{!useCustomPaths && (
								<div className="text-sm text-muted-foreground font-mono">Payment Path: m/0</div>
							)}
							{!useCustomPaths && (
								<div className="text-sm text-muted-foreground font-mono flex items-center">
									Ordinals Path:{" "}
									{processing ? (
										<>
											<CgSpinner className="animate-spin mx-2" />{" "}
											{createWalletIterations.value}
										</>
									) : pendingPaths ? (
										pendingPaths.ordAddressPath
									) : (
										""
									)}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2 text-sm">
							<span className="text-muted-foreground">Custom Derivation</span>
							<Switch
								className="ml-2"
								aria-label="Customize"
								name="Customize"
								onChange={toggleCustomPaths}
							/>
						</div>
					</div>
					{useCustomPaths && (
						<div className="flex flex-wrap items-center gap-2 mb-4">
              <Button variant="outline" size="sm" type="button" onClick={() => {
                setPendingPaths(undefined);
                toggleCustomPaths();
              }}>
                1Sat
              </Button>
							<Button
								type="button"
                variant="outline"
                size="sm"
								onClick={() => {
                  setPendingPaths({
                    changeAddressPath: RELAYX_WALLET_PATH,
                    ordAddressPath: RELAYX_ORD_PATH,
                    identityAddressPath: RELAYX_ID_PATH
                  });
								}}
							>
								RelayX
							</Button>
							<Button variant="outline" size="sm" type="button" onClick={() => {
                setPendingPaths({
                  changeAddressPath:  YOURS_WALLET_PATH,
                  ordAddressPath: YOURS_ORD_PATH,
                  identityAddressPath: YOURS_ID_PATH
                });
              }}>
								Yours
							</Button>
              <Button variant="outline" size="sm" type="button" onClick={() => {
                setPendingPaths({
                  changeAddressPath:  TWETCH_WALLET_PATH,
                  ordAddressPath: TWETCH_ORD_PATH,
                });
              }}>
								Twetch
							</Button>
              <Button variant="outline" size="sm" type="button" onClick={() => {
                setPendingPaths({
                  changeAddressPath: AYM_WALLET_PATH,
                  ordAddressPath: AYM_ORD_PATH,
                });
              }}>
								Aym
							</Button>
						</div>
					)}
					{useCustomPaths && (
						<div className="space-y-2">
							<Input
								placeholder={`Payment Derivation Path ${pendingPaths?.changeAddressPath || "m/0"}`}
								value={pendingPaths?.changeAddressPath}
								onChange={(e) => {
									const changeAddressPath = e.target.value;
									if (!changeAddressPath) return;
									setPendingPaths({
										changeAddressPath: changeAddressPath as string,
										ordAddressPath: pendingPaths?.ordAddressPath as string,
									});
								}}
							/>
							<Input
								placeholder={`Ordinals Derivation Path: ${ordAddressPath.value || "m/0/x"}`}
								value={pendingPaths?.ordAddressPath}
								onChange={(e) => {
									const ordAddressPath = e.target.value;
									if (!ordAddressPath) return;
									setPendingPaths({
										changeAddressPath:
											pendingPaths?.changeAddressPath as string,
										ordAddressPath: ordAddressPath as string,
									});
								}}
							/>
						</div>
					)}
					<div className="w-full flex flex-col items-end mt-6 pt-4 border-t border-border">
						<Button
							type="button"
							disabled={processing || inputMnemonic.some((word) => !word)}
							onClick={async () => {
								console.log({ mnemonic, pendingPaths, inputMnemonic });
								if (!inputMnemonic) return;
                if (!useCustomPaths) {
                  if (!ready) {
                    setReady(true);
                    return
                  }
                  console.log("Step 2");
                }
								if (!pendingPaths) return;
       
								const keys = getKeysFromMnemonicAndPaths(
									inputMnemonic.join(" "),
									pendingPaths,
								);
                if (keys.mnemonic && keys.changeAddressPath === RELAYX_WALLET_PATH) {
                  const sweepKey = derivePathFromMnemonic(keys.mnemonic, RELAYX_SWEEP_PATH);
                  const sweepAddress = sweepKey.toAddress()
                  const payAddress = PrivateKey.fromWif(keys.payPk).toAddress();
                  try {
                    const amount = await sweepUtxos(sweepKey, sweepAddress, payAddress);
                    if (amount) {
                      toast.success(`Swept ${toBitcoin(amount)} BSV to ${payAddress}`);
                    }
                  } catch (e) {
                    console.log("Error sweeping utxos", e);
                  }
                }
								onSubmit({ keys });
							}}
						>
							Next
						</Button>
					</div>
				</>
			)}
			{clickedWords?.length > 0 && (
				<div className="w-full flex justify-center my-8">
					<Button
						variant="outline"
						onClick={() => {
							shuffle();
							setClickedWords([]);
						}}
					>
						<RiRestartLine className="mr-2" /> Start Over
					</Button>
				</div>
			)}
		</div>
	);
};

export default MnemonicGrid;

// yours
export const YOURS_WALLET_PATH = "m/44'/236'/0'/1/0";
// TODO: Is this one correct?
export const YOURS_ID_PATH = "m/0'/236'/0'/0/0";
export const YOURS_ORD_PATH = "m/44'/236'/1'/0/0";
// relayx
export const RELAYX_ORD_PATH = "m/44'/236'/0'/2/0";
export const RELAYX_ID_PATH = YOURS_ID_PATH;
export const RELAYX_WALLET_PATH = YOURS_WALLET_PATH;
export const RELAYX_SWEEP_PATH = "m/44'/236'/0'/0/0";

export const TWETCH_WALLET_PATH = 'm/0/0';
export const TWETCH_ORD_PATH = YOURS_ORD_PATH;

export const AYM_WALLET_PATH = 'm/0/0';
export const AYM_ORD_PATH = 'm';