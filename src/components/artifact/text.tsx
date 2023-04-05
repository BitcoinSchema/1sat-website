import { API_HOST } from "@/pages/_app";
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
    <pre
      className={`flex items-center justify-center w-full h-full transition  ${
        className ? className : ""
      }`}
    >
      {text}
    </pre>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default TextArtifact;
