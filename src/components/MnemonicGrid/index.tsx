"use client";

import { bip39words } from "@/utils/bip39words";
import { head, isEqual } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { RiRestartLine } from "react-icons/ri";
import Dropdown from "../dropdown/dropdown";

export type MnemonicResult = {
	importedMnemonic?: string;
	verified?: boolean;
	words?: string[];
};

interface MnemonicGridProps {
	mnemonic?: string;
	onWordClick?: (word: string) => void;
	onSubmit: (result: MnemonicResult) => void;
	mode: MnemonicGridMode;
}

export enum MnemonicGridMode {
	View,
	Prove,
	Import,
}

const MnemonicGrid: React.FC<MnemonicGridProps> = ({
	mode,
	mnemonic,
	onWordClick,
	onSubmit,
}) => {
	const [inputMnemonic, setInputMnemonic] = useState<string[]>(
		Array(12).fill("")
	);
	const [shuffledWords, setShuffledWords] = useState<string[]>([]);
	const [clickedWords, setClickedWords] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [suggestedWords, setSuggestedWords] = useState<string[]>([]);

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
					word.startsWith(inputValue.trim().toLowerCase())
				)
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
		[clickedWords, setClickedWords, setInputValue, onSubmit]
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
			if (newClickedWords.length == 11) {
				// "click" the last word
				const lastWord = head(
					shuffledWords.filter((w) => !newClickedWords.includes(w))
				);
				// Fill in the last word for the user
				if (
					!isEqual(
						[...newClickedWords, lastWord],
						mnemonic?.split(" ")
					)
				) {
					setClickedWords([]);
					const words = mnemonic?.split(" ");
					const shuffled = [...(words || [])].sort(
						() => Math.random() - 0.5
					);
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
		]
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
		const words = pastedData.split(" ");

		if (words.length !== 12) {
			return;
		}

		if (!words.every((word) => bip39words.includes(word.toLowerCase()))) {
			return;
		}

		setInputMnemonic(words);
	};

	return (
		<div className="transition my-4 mx-auto rounded w-full text-yellow-500">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
				{mode === MnemonicGridMode.Import && (
					<>
						{inputMnemonic.map((word, index) => (
							<Dropdown
								key={index}
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
								<span className={`text-[#444] mr-4`}>
									{i + 1}
								</span>
							)}{" "}
							<span
								className={`${
									clickedWords.includes(w)
										? "text-[#555]"
										: ""
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
						className="btn btn-primary"
						onClick={() => onSubmit({ verified: true })}
					>
						Next
					</button>
				</div>
			)}
			{mode === MnemonicGridMode.Import && (
				<div className="w-full flex flex-col items-end my-8">
					<button
						disabled={inputMnemonic.some((word) => !word)}
						className="btn btn-primary"
						onClick={() =>
							onSubmit({
								importedMnemonic: inputMnemonic.join(" "),
							})
						}
					>
						Next
					</button>
				</div>
			)}
			{clickedWords?.length > 0 && (
				<div className="w-full flex justify-center my-8">
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
