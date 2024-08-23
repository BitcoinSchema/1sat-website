"use client";

import { bip39words } from "@/utils/bip39words";
import { head, isEqual, set } from "lodash";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiRestartLine } from "react-icons/ri";
import Dropdown from "../dropdown/dropdown";
import toast from "react-hot-toast";
import { toastErrorProps } from "@/constants";
import {
	findKeysFromMnemonic,
	getKeysFromMnemonicAndPaths,
	type WalletKeys,
} from "@/utils/keys";
import { createWalletIterations, ordAddressPath } from "@/signals/wallet";
import { FaSpinner } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import { useSignals } from "@preact/signals-react/runtime";
import { Switch } from "@tremor/react";
import { Input } from "../ui/input";

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
	const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
	const [useCustomPaths, setUseCustomPaths] = useState<boolean>(false);

	const toggleCustomPaths = useCallback(() => {
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

	const handleWordSelect = useCallback(
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
		const processMnemonic = () => {
			const phrase = inputMnemonic.join(" ");
			if (inputMnemonic.some((word) => !word)) {
				console.log("Invalid mnemonic length");
				return;
			}
			console.log("Processing mnemonic", inputMnemonic);
			setProcessing(true);
			findKeysFromMnemonic(phrase).then((keys) => {
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
			!useCustomPaths &&
			!processing &&
			!pendingPaths &&
			mode === MnemonicGridMode.Import &&
			inputMnemonic.every((word) => !!word)
		) {
			processMnemonic();
		}
	}, [inputMnemonic, mode, pendingPaths, processing, useCustomPaths]);

	return (
		<div className="transition my-4 mx-auto rounded w-full text-yellow-500">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
				{mode === MnemonicGridMode.Import && (
					<>
						{inputMnemonic.map((word, index) => (
							<Dropdown
								key={`mnemonic-word-${index}`}
								items={bip39words}
								selectedItem={word}
								onChange={handleSelectInputMnemonicWord(index)}
								placeholder={`Word ${index + 1}`}
								onPaste={handlePasteMnemonic}
							/>
						))}
					</>
				)}
				{(mode === MnemonicGridMode.Prove
					? shuffledWords
					: mnemonic?.split(" ")
				)?.map((w, i) => {
					return (
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<div
							key={i}
							className={`select-none inline-flex p-2 rounded bg-[#1a1a1a] ${
								mode === MnemonicGridMode.Prove
									? clickedWords.includes(w)
										? ""
										: "cursor-pointer hover:bg-[#222]"
									: ""
							} flex justify-between`}
							onClick={
								mode === MnemonicGridMode.Prove
									? () => handleClick(w)
									: undefined
							}
						>
							{mode !== MnemonicGridMode.Prove && (
								<span className={"text-[#444] mr-4"}>{i + 1}</span>
							)}{" "}
							<span
								className={`${
									clickedWords.includes(w) ? "text-[#555]" : ""
								} mr-4`}
							>
								{w}
							</span>
						</div>
					);
				})}
			</div>
			{mode === MnemonicGridMode.View && (
				<div className="w-full flex flex-col items-end my-8">
					<button
						type="button"
						className="btn btn-primary"
						// Add some validation on pendingKeys
						onClick={() => onSubmit({ verified: true })}
					>
						Next
					</button>
				</div>
			)}
			{mode === MnemonicGridMode.Import && (
				<>
					<div className="text-sm text-[#555] my-2 flex items-start justify-between">
						<div className="flex items-start flex-col">
							{!useCustomPaths && (
								<div className="text-sm text-[#555]">Payment Path: m/0</div>
							)}
							{!useCustomPaths && (
								<div className="text-sm text-[#555]">
									Ordinals Path:{" "}
									{processing ? (
										<>
											<CgSpinner className="animate-spin mx-2" />{" "}
											{createWalletIterations.value}
										</>
									) : pendingPaths ? (
										`m/0/${pendingPaths.ordAddressPath}`
									) : (
										""
									)}
								</div>
							)}
						</div>
						<div className="flex items-start">
							Custom Derivation{" "}
							<Switch
								className="ml-2"
								aria-label="Customize"
								name="Customize"
								onChange={toggleCustomPaths}
							/>
						</div>
					</div>
					{useCustomPaths && (
						<div className="flex items-center mb-2">
							<button
								type="button"
                className="btn btn-sm btn-primary mr-2"
								onClick={() => {
                  setPendingPaths({
                    changeAddressPath: DEFAULT_RELAYX_WALLET_PATH,
                    ordAddressPath: DEFAULT_RELAYX_ORD_PATH,
                    identityAddressPath: DEFAULT_RELAYX_ORD_PATH
                  });
								}}
							>
								RelayX
							</button>
							<button className="btn btn-sm btn-primary mr-2" type="button" onClick={() => {}}>
								Yours
							</button>
              <button className="btn btn-sm btn-primary mr-2" type="button" onClick={() => {
                setPendingPaths(undefined);
                toggleCustomPaths();
              }}>
                1Sat
              </button>
						</div>
					)}
					{useCustomPaths && (
						<div>
							<div className="mb-2">
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
							</div>
							<div>
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
						</div>
					)}
					<div className="w-full flex flex-col items-end my-8">
						<button
							type="button"
							disabled={processing || inputMnemonic.some((word) => !word)}
							className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
							// Add some validation on pendingKeys
							onClick={() => {
								console.log({ mnemonic, pendingPaths, inputMnemonic });
								if (!inputMnemonic) return;
								if (!pendingPaths) return;
								const keys = getKeysFromMnemonicAndPaths(
									inputMnemonic.join(" "),
									pendingPaths,
								);
								onSubmit({ keys });
							}}
						>
							Next
						</button>
					</div>
				</>
			)}
			{clickedWords?.length > 0 && (
				<div className="w-full flex justify-center my-8">
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<div
						className="btn gap-0"
						onClick={() => {
							shuffle();
							setClickedWords([]);
						}}
					>
						<RiRestartLine className="mr-2" /> Start Over
					</div>
				</div>
			)}
		</div>
	);
};

export default MnemonicGrid;

// yours
export const DEFAULT_WALLET_PATH = "m/44'/236'/0'/1/0";
export const DEFAULT_ORD_PATH = "m/44'/236'/1'/0/0";
// relayx
export const DEFAULT_RELAYX_ORD_PATH = "m/44'/236'/0'/2/0";
export const DEFAULT_RELAYX_WALLET_PATH = "m/44'/236'/0'/0/0";