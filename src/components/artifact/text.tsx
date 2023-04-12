import { API_HOST } from "@/context/ordinals";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FetchStatus } from "../pages";

type TextArtifactProps = {
  outPoint?: string;
  className?: string;
};

const TextArtifact: React.FC<TextArtifactProps> = ({ outPoint, className }) => {
  const [text, setText] = useState<string>();
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);

        const result = await fetch(
          `${API_HOST}/api/files/inscriptions/${outPoint}`
        );
        const resultText = await result.text();
        setFetchTextStatus(FetchStatus.Success);
        setText(resultText);
      } catch (e) {
        setFetchTextStatus(FetchStatus.Error);
      }
    };
    if (!text) {
      fire();
    }
  }, [text, outPoint, setText, setFetchTextStatus]);

  return fetchTextStatus === FetchStatus.Success ? (
    <div
      className={`flex ${
        text && (hasWords(text) || isJson(text)) ? "text-left" : "items-center"
      }  justify-center w-full h-full transition block whitespace-pre-wrap ${
        className ? className : ""
      }`}
    >
      {text}
    </div>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default TextArtifact;

const isJson = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const hasWords = (str: string) => str.indexOf(" ") !== -1;
