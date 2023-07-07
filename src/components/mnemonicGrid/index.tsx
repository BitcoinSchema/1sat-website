import { bip39words } from "@/utils/bip39words";
import { head, isEqual } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { RiRestartLine } from "react-icons/ri";

export type MnemonicResult = {
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
        // "click" the last work
        const lastWord = head(
          shuffledWords.filter((w) => !newClickedWords.includes(w))
        );
        // Fill in the last work for the user
        if (!isEqual([...newClickedWords, lastWord], mnemonic?.split(" "))) {
          setClickedWords([]);
          const words = mnemonic?.split(" ");
          const shuffled = [...(words || [])].sort(() => Math.random() - 0.5);
          setShuffledWords(shuffled);
          onSubmit({ verified: false });
        } else {
          onSubmit({ verified: true });
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

  console.log({ shuffledWords, mnemonic, mode });
  return (
    <div className="transition my-4 mx-auto rounded w-full text-yellow-500">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {mode === MnemonicGridMode.Import && (
          <>
            <input
              className="block w-full mb-4 p-2 rounded bg-[#1a1a1a] text-yellow-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="mb-4">
              {suggestedWords.map((word, i) => (
                <button
                  key={i}
                  className="inline-block mx-1 my-2 px-2 py-1 rounded bg-[#1a1a1a] text-yellow-500"
                  onClick={() => handleWordSelect(word)}
                >
                  {word}
                </button>
              ))}
            </div>
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
                <span className={`text-[#444] mr-4`}>{i + 1}</span>
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
      {clickedWords?.length > 0 && (
        <div className="w-full flex justify-center my-8">
          <div
            className="flex p-2 bg-[#111] items-center justify-center cursor-pointer hover:bg-[#222] transition"
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
