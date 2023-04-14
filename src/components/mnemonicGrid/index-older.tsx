import React, { useEffect, useState } from "react";
import { bip39words } from "../../utils/bip39words";

interface MnemonicGridProps {
  mode: "prove" | "import" | "default";
  mnemonic?: string;
  onSubmit?: (words: string[] | boolean) => void;
}

const MnemonicGrid: React.FC<MnemonicGridProps> = ({
  mode = "default",
  mnemonic,
  onSubmit,
}) => {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [clickedWords, setClickedWords] = useState<string[]>([]);

  useEffect(() => {
    if (mnemonic) {
      const words = mnemonic.split(" ");
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
    }
  }, [mnemonic]);

  useEffect(() => {
    if (mode === "import" && inputValue.trim() !== "") {
      setSuggestedWords(
        bip39words.filter((word: string) =>
          word.startsWith(inputValue.trim().toLowerCase())
        )
      );
    } else {
      setSuggestedWords([]);
    }
  }, [inputValue, mode]);

  const handleWordSelect = (word: string) => {
    setClickedWords([...clickedWords, word]);
    setInputValue("");
    if (onSubmit) {
      onSubmit([...clickedWords, word]);
    }
  };

  return (
    <div className="cursor-pointer transition my-4 mx-auto rounded w-full text-yellow-500">
      {mode === "import" && (
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {(mode === "prove"
          ? shuffledWords
          : mnemonic
          ? mnemonic.split(" ")
          : []
        ).map((word, i) => {
          return (
            <div
              key={i}
              className={`inline-flex p-2 rounded ${
                mode === "prove" ? "hover:bg-[#222]" : "bg-[#1a1a1a]"
              } flex justify-between`}
              onClick={
                mode === "prove" ? () => handleWordSelect(word) : undefined
              }
            >
              {mode === "default" && (
                <span className="text-[#444] mr-4">{i + 1}</span>
              )}
              {word}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MnemonicGrid;
